// Gives the same brief to several AI clients, one run at a time, each in
// its own studio project. Start the studio first (pnpm studio).
// Usage: pnpm contest <brief> --models claude,codex --runs 2 [--minutes 15]
//        [--into <contest id>] to add runs to an earlier contest
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readBrief, runContest } from '../apps/studio/src/contest.js';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
const root = process.env['TASTIR_STUDIO_DIR'] ?? join(repo, 'studio');
const args = process.argv.slice(2);
const flag = (name: string, fallback: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? (args[i + 1] ?? fallback) : fallback;
};
const briefId = args.find(
  (a) => !a.startsWith('--') && !args[args.indexOf(a) - 1]?.startsWith('--'),
);
if (!briefId)
  throw new Error(
    'Name a brief from apps/studio/briefs, for example: pnpm contest square',
  );
const brief = await readBrief(join(repo, 'apps', 'studio', 'briefs'), briefId);
const contest = await runContest({
  root,
  brief,
  models: flag('models', 'claude')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean),
  runs: Math.max(1, Math.min(10, Number(flag('runs', '1')) || 1)),
  seconds: Math.max(60, Number(flag('minutes', '15')) * 60 || 900),
  mcp: join(repo, 'tools', 'studio-mcp.sh'),
  ...(flag('into', '') ? { into: flag('into', '') } : {}),
  log: (line) => process.stdout.write(`${line}\n`),
});
process.stdout.write(
  `\nContest ${contest.id} saved. Judge it at http://127.0.0.1:4293/#/studio/contest/${contest.id}\n`,
);
