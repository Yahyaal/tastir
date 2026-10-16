import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { blind, judge, readBrief, runContest } from './contest.js';
import { startServer } from './server.js';
import { Studio } from './studio.js';
import { writeAtomic } from './store.js';

const tutorials = join(import.meta.dirname, '../../../tutorials');
const briefs = join(import.meta.dirname, '../briefs');

/** A stand-in client that draws the square through the studio's service. */
const GOOD = `
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const project = /project is “([^”]+)”/.exec(process.argv[2])[1];
const { url, secret } = JSON.parse(readFileSync(join(process.env.TASTIR_STUDIO_DIR, '.service.json'), 'utf8'));
const post = async (path, body) => {
  const r = await fetch(url + path, { method: 'POST', headers: { 'X-Tastir-Studio': secret, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const v = await r.json();
  if (!r.ok) throw new Error(v.error);
  return v;
};
const edit = (revision, e) => post('/projects/' + project + '/edit', { author: 'script', revision, edit: e });
(async () => {
  let v = await edit(1, { op: 'construct', add: [
    { kind: 'circle', name: 'C0', centre: 'O', through: 'A' },
    { kind: 'line', name: 'L0', from: 'O', to: 'A' },
    { kind: 'intersection', name: 'W', first: 'L0', second: 'C0', angle: 180 },
    { kind: 'circle', name: 'C1', centre: 'A', through: 'W' },
    { kind: 'circle', name: 'C2', centre: 'W', through: 'A' },
    { kind: 'intersection', name: 'T', first: 'C1', second: 'C2', angle: 90 },
    { kind: 'intersection', name: 'B', first: 'C1', second: 'C2', angle: 270 },
    { kind: 'line', name: 'Axis', from: 'T', to: 'B' },
    { kind: 'intersection', name: 'N', first: 'Axis', second: 'C0', angle: 90 },
    { kind: 'intersection', name: 'S', first: 'Axis', second: 'C0', angle: 270 },
  ] });
  v = await edit(v.revision, { op: 'ink', add: [{ from: 'A', to: 'N' }, { from: 'N', to: 'W' }, { from: 'W', to: 'S' }, { from: 'S', to: 'A' }] });
  v = await edit(v.revision, { op: 'tile', vertices: ['A', 'N', 'W', 'S'] });
  await edit(v.revision, { op: 'paint', palette: null, colors: [{ piece: v.drawing.tile.pieces[0].id, color: '#2453a6' }] });
})().catch((e) => { console.error(e.message); process.exit(1); });
`;
const LIMITED = `console.error("ERROR: You've hit your usage limit."); process.exit(1);`;

describe('contests', () => {
  let root: string;
  let close: () => Promise<void>;
  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'contest-'));
    process.env['TASTIR_STUDIO_DIR'] = root;
    const secret = randomBytes(32).toString('base64url');
    const service = await startServer({
      studio: new Studio(root, tutorials),
      secret,
    });
    await writeAtomic(
      join(root, '.service.json'),
      JSON.stringify({ url: service.url, secret, pid: process.pid }),
    );
    await writeFile(join(root, 'good.cjs'), GOOD);
    await writeFile(join(root, 'limited.cjs'), LIMITED);
    close = async () => {
      await service.close();
      await rm(root, { recursive: true, force: true });
    };
  });
  afterEach(() => close());

  it('runs each client in its own project and judges them blind', async () => {
    const brief = await readBrief(briefs, 'square');
    const contest = await runContest({
      root,
      brief,
      models: [
        `script:${join(root, 'good.cjs')}`,
        `script:${join(root, 'limited.cjs')}`,
      ],
      runs: 1,
      mcp: 'unused',
      seconds: 60,
    });
    expect(
      contest.runs.map((r) => [r.outcome, r.problems.length, r.edits]),
    ).toEqual([
      ['finished', 0, 4],
      ['stopped', 2, 0],
    ]);
    expect(contest.runs[1]!.reason).toBe('Usage limit');
    const shown = blind(contest);
    expect(shown.designs.map((d) => d.letter)).toEqual(['A', 'B']);
    expect(JSON.stringify(shown)).not.toContain('script:');
    const judged = blind(
      await judge(root, contest.id, { pick: contest.runs[0]!.project }),
    );
    expect(
      judged.designs.find((d) => d.project === contest.runs[0]!.project),
    ).toMatchObject({
      model: expect.stringContaining('good.cjs'),
      edits: 4,
    });
    await expect(
      judge(root, contest.id, { pick: 'elsewhere' }),
    ).rejects.toThrow(/not part/);
  }, 60_000);
});
