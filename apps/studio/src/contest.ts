import { spawn } from 'node:child_process';
import { mkdir, readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { StudioClient } from './client.js';
import { GoalsShape } from './studio.js';
import { writeAtomic } from './store.js';

/**
 * A contest: the same brief given to several AI clients, each in its own
 * studio project, then judged by the owner without seeing who drew what.
 * Briefs live in apps/studio/briefs/; results in studio/contests/.
 */
export const BriefShape = z.strictObject({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(120),
  text: z.string().min(1).max(4000),
  fold: z.number().int().min(2).max(24).optional(),
  goals: GoalsShape.default({}),
});
export type Brief = z.infer<typeof BriefShape>;

export interface Run {
  readonly model: string;
  readonly project: string;
  readonly seconds: number;
  /** finished: the client ended; stopped: a usage limit or the time limit
   * cut it short, which does not count against the model. */
  readonly outcome: 'finished' | 'stopped' | 'failed';
  readonly reason?: string;
  readonly edits: number;
  readonly problems: readonly string[];
}

export interface Contest {
  readonly id: string;
  readonly brief: Brief;
  readonly started: string;
  readonly runs: readonly Run[];
  /** The project the owner picked, once they have. */
  readonly pick?: string;
  /** Projects the owner marked as not good. */
  readonly rejected?: readonly string[];
}

/** How each client is started without a person at the keyboard. */
export function commandFor(
  model: string,
  prompt: string,
  mcp: string,
  scratch: string,
): { command: string; args: string[]; env?: Record<string, string> } {
  switch (model) {
    case 'claude':
      return {
        command: 'claude',
        args: [
          '-p',
          prompt,
          '--mcp-config',
          JSON.stringify({
            mcpServers: {
              'tastir-studio': {
                command: mcp,
                args: [],
                env: { TASTIR_AUTHOR: 'claude' },
              },
            },
          }),
          '--strict-mcp-config',
          '--allowedTools',
          'mcp__tastir-studio',
          '--max-turns',
          '80',
        ],
      };
    case 'codex':
      return {
        command: 'codex',
        args: [
          'exec',
          '--skip-git-repo-check',
          '-s',
          'read-only',
          '-C',
          scratch,
          '-c',
          `mcp_servers.tastir-studio.command=${JSON.stringify(mcp)}`,
          '-c',
          'mcp_servers.tastir-studio.env={TASTIR_AUTHOR="codex"}',
          '-c',
          'mcp_servers.tastir-studio.tool_timeout_sec=120',
          prompt,
        ],
      };
    case 'gemini':
      // Expects `gemini mcp add -e TASTIR_AUTHOR=gemini tastir-studio …`
      // (docs/STUDIO-SETUP.md). Not yet tried live.
      return {
        command: 'gemini',
        args: [
          '-p',
          prompt,
          '--allowed-mcp-server-names',
          'tastir-studio',
          '--yolo',
        ],
      };
    default:
      // A script standing in for a client, for tests: node <script> <prompt>.
      if (model.startsWith('script:'))
        return { command: process.execPath, args: [model.slice(7), prompt] };
      throw new Error(`Unknown model “${model}”. Use claude, codex or gemini.`);
  }
}

export function promptFor(brief: Brief, project: string): string {
  return `${brief.text}

Use only the tastir-studio tools. Your studio project is “${project}”; it already exists, so do not make a new one. Work on it until check reports no problems, then leave a one-line note saying what you made. Nobody will answer questions during this run, so do not ask any.`;
}

const LIMIT = /usage limit|rate limit|quota|hit your limit/i;

/** Runs one client to the end, or until it is stopped. */
function runClient(
  model: string,
  prompt: string,
  mcp: string,
  scratch: string,
  seconds: number,
): Promise<{ code: number | null; output: string; timedOut: boolean }> {
  const { command, args, env } = commandFor(model, prompt, mcp, scratch);
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: scratch,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, ...env },
    });
    let output = '';
    const keep = (chunk: Buffer) => {
      output = (output + chunk.toString()).slice(-20_000);
    };
    child.stdout.on('data', keep);
    child.stderr.on('data', keep);
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, seconds * 1000);
    child.on('error', (e) => {
      clearTimeout(timer);
      resolve({ code: -1, output: `${output}\n${e.message}`, timedOut });
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code, output, timedOut });
    });
  });
}

export async function readBrief(dir: string, id: string): Promise<Brief> {
  return BriefShape.parse(
    JSON.parse(await readFile(join(dir, `${id}.json`), 'utf8')),
  );
}

/**
 * Runs a contest: for each model, `runs` times, a fresh project and one
 * client run, one after another so the machine is never asked for two at
 * once. Results are saved after every run, so a stop loses nothing.
 */
export async function runContest(options: {
  root: string;
  brief: Brief;
  models: readonly string[];
  runs: number;
  mcp: string;
  seconds?: number;
  log?: (line: string) => void;
}): Promise<Contest> {
  const client = new StudioClient(options.root);
  const id = `${options.brief.id}-${new Date().toISOString().slice(0, 10)}-${randomBytes(2).toString('hex')}`;
  const folder = join(options.root, 'contests');
  const scratch = join(folder, `${id}-scratch`);
  await mkdir(scratch, { recursive: true, mode: 0o700 });
  let contest: Contest = {
    id,
    brief: options.brief,
    started: new Date().toISOString(),
    runs: [],
  };
  const save = () =>
    writeAtomic(join(folder, `${id}.json`), JSON.stringify(contest, null, 2));
  await save();
  const log = options.log ?? (() => undefined);
  for (let n = 1; n <= options.runs; n++)
    for (const model of options.models) {
      const made = (await client.call('POST', '/projects', {
        author: 'contest',
        title: `${options.brief.title} ${randomBytes(2).toString('hex')}`,
        ...(options.brief.fold ? { fold: options.brief.fold } : {}),
        goals: options.brief.goals,
      })) as { project: string };
      log(`${model}, run ${n}: project ${made.project}`);
      const start = Date.now();
      const result = await runClient(
        model,
        promptFor(options.brief, made.project),
        options.mcp,
        scratch,
        options.seconds ?? 900,
      );
      const seconds = Math.round((Date.now() - start) / 1000);
      const view = (await client.call('GET', `/projects/${made.project}`)) as {
        history: { undo: { author: string }[] };
      };
      const checked = (await client.call(
        'GET',
        `/projects/${made.project}/check`,
      )) as {
        problems: string[];
      };
      const limited = LIMIT.test(result.output);
      const run: Run = {
        model,
        project: made.project,
        seconds,
        outcome:
          limited || result.timedOut
            ? 'stopped'
            : result.code === 0
              ? 'finished'
              : 'failed',
        ...(limited
          ? { reason: 'Usage limit' }
          : result.timedOut
            ? { reason: 'Time limit' }
            : result.code !== 0
              ? {
                  reason: result.output
                    .trim()
                    .split('\n')
                    .slice(-12)
                    .join(' ')
                    .slice(0, 1200),
                }
              : {}),
        edits: view.history.undo.filter((e) => e.author !== 'contest').length,
        problems: checked.problems,
      };
      log(
        `${model}, run ${n}: ${run.outcome}${run.reason ? ` (${run.reason})` : ''}, ${run.problems.length} problems, ${seconds} s`,
      );
      contest = { ...contest, runs: [...contest.runs, run] };
      await save();
    }
  return contest;
}

export async function listContests(root: string): Promise<Contest[]> {
  const folder = join(root, 'contests');
  const files = await readdir(folder).catch(() => [] as string[]);
  const out: Contest[] = [];
  for (const file of files)
    if (file.endsWith('.json'))
      out.push(
        JSON.parse(await readFile(join(folder, file), 'utf8')) as Contest,
      );
  return out.sort((a, b) => b.started.localeCompare(a.started));
}

/** The owner's pick, and any marked not good, saved with the contest. */
export async function judge(
  root: string,
  id: string,
  verdict: { pick?: string; rejected?: readonly string[] },
): Promise<Contest> {
  const contest = (await listContests(root)).find((c) => c.id === id);
  if (!contest) throw new Error(`There is no contest “${id}”.`);
  const projects = new Set(contest.runs.map((r) => r.project));
  for (const p of [
    ...(verdict.pick ? [verdict.pick] : []),
    ...(verdict.rejected ?? []),
  ])
    if (!projects.has(p))
      throw new Error(`“${p}” is not part of this contest.`);
  const next = { ...contest, ...verdict };
  await writeAtomic(
    join(root, 'contests', `${id}.json`),
    JSON.stringify(next, null, 2),
  );
  return next;
}

/**
 * What the judging page shows before the pick: designs lettered A, B, …
 * in a shuffled order fixed by the contest id, with no model names.
 */
export function blind(contest: Contest) {
  const seed = [...contest.id].reduce(
    (h, c) => (h * 31 + c.charCodeAt(0)) >>> 0,
    7,
  );
  const order = contest.runs
    .map((run, i) => ({ run, key: (seed * (i + 3) * 2654435761) >>> 0 }))
    .sort((a, b) => a.key - b.key)
    .map((x) => x.run);
  const judged = contest.pick !== undefined;
  return {
    id: contest.id,
    brief: { title: contest.brief.title, text: contest.brief.text },
    judged,
    pick: contest.pick ?? null,
    rejected: contest.rejected ?? [],
    designs: order.map((run, i) => ({
      letter: String.fromCharCode(65 + i),
      project: run.project,
      outcome: run.outcome,
      problems: run.problems,
      ...(judged
        ? {
            model: run.model,
            seconds: run.seconds,
            edits: run.edits,
            reason: run.reason ?? null,
          }
        : {}),
    })),
  };
}
