/** Checks the comparator against known-equal variants of every current tutorial.
 * node --conditions=@tastir/source --import tsx tools/audit-ink-invariance.mts
 * Add --retile to also double each transformed tutorial's supplied tile.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { cellOf, evaluate, inkStrokes } from '../packages/engine/src/index.js';
import { parseTutorial } from '../packages/schema/src/index.js';
import {
  compareInk,
  type InkWall,
  type Point,
} from '../apps/player/src/review/inkComparison.js';

const comparisonSha256 = createHash('sha256')
  .update(readFileSync('apps/player/src/review/inkComparison.ts'))
  .digest('hex');
const retile = process.argv.includes('--retile');
const rows = [];
const angle = (17 * Math.PI) / 180,
  scale = 1.37;
const linear = (p: Point): Point => ({
  x: scale * (p.x * Math.cos(angle) - p.y * Math.sin(angle)),
  y: scale * (p.x * Math.sin(angle) + p.y * Math.cos(angle)),
});
const move = (p: Point): Point => {
  const q = linear(p);
  return { x: q.x - 0.371, y: q.y + 0.223 };
};
const inkMove = (p: Point): Point => {
  const q = move(p);
  return { x: q.x + 0.173, y: q.y - 0.291 };
};
const files = readdirSync('tutorials')
  .filter((f) => f.endsWith('.json'))
  .sort();
for (const file of files) {
  const tutorial = parseTutorial(
      JSON.parse(readFileSync(`tutorials/${file}`, 'utf8')),
    ),
    scene = evaluate(tutorial);
  const source: InkWall = {
    ...cellOf(scene, tutorial.pattern.cell),
    ink: inkStrokes(scene, tutorial).map((s) => s.segment),
  };
  const tiled = retile
    ? {
        ...source,
        u: { x: source.u.x * 2, y: source.u.y * 2 },
        ink: [
          ...source.ink,
          ...source.ink.map((s) => ({
            a: { x: s.a.x + source.u.x, y: s.a.y + source.u.y },
            b: { x: s.b.x + source.u.x, y: s.b.y + source.u.y },
          })),
        ],
      }
    : source;
  const target: InkWall = {
    origin: move(tiled.origin),
    u: linear(tiled.u),
    v: linear(tiled.v),
    ink: tiled.ink.map((s) => ({ a: inkMove(s.a), b: inkMove(s.b) })),
  };
  const started = performance.now(),
    result = compareInk(source, target);
  const row = {
    id: tutorial.id,
    status: result.status,
    reason: result.reason,
    coverageA: result.coverageA,
    coverageB: result.coverageB,
    ms: Math.round(performance.now() - started),
  };
  rows.push(row);
  if (result.status !== 'same' || rows.length % 20 === 0)
    console.log(
      JSON.stringify({ done: rows.length, total: files.length, ...row }),
    );
}
const counts = rows.reduce<Record<string, number>>(
  (sum, row) => ((sum[row.status] = (sum[row.status] ?? 0) + 1), sum),
  {},
);
mkdirSync('docs/review/ink-overlay', { recursive: true });
writeFileSync(
  `docs/review/ink-overlay/invariance${retile ? '-retiled' : ''}.json`,
  JSON.stringify(
    { retile, angle, scale, comparisonSha256, counts, rows },
    null,
    2,
  ) + '\n',
);
console.log(JSON.stringify({ counts }));
if (counts['different']) process.exitCode = 1;
