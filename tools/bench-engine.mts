/**
 * Run from the repo root:
 * node --conditions=@tastir/source --import tsx tools/bench-engine.mts
 * Optional: --runs=3 --warmup=1 --crossings bou-inania-rosette
 * Use --reference to time the frozen pre-optimization implementations.
 * Each reported time is the median of fresh synchronous calls; no results are cached.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { parseTutorial } from '../packages/schema/src/index.js';
import {
  cellOf,
  classicSelection,
  computePattern as currentPattern,
  constructionCrossings as currentCrossings,
  evaluate,
  inkPieces as currentInkPieces,
  strokesOf,
} from '../packages/engine/src/index.js';
import { computePattern as referencePattern } from '../packages/engine/src/test/reference/pieces.js';
import { inkPieces as referenceInkPieces } from '../packages/engine/src/test/reference/freeInk.js';
import { constructionCrossings as referenceCrossings } from '../packages/engine/src/test/reference/checks.js';

const args = process.argv.slice(2);
const reference = args.includes('--reference');
const computePattern = reference ? referencePattern : currentPattern;
const inkPieces = reference ? referenceInkPieces : currentInkPieces;
const constructionCrossings = reference ? referenceCrossings : currentCrossings;
const count = (name: string, fallback: number) => {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  const n = arg ? Number(arg.split('=')[1]) : fallback;
  if (!Number.isInteger(n) || n < (name === 'runs' ? 1 : 0))
    throw new Error(`Invalid --${name}`);
  return n;
};
const runs = count('runs', 3);
const warmup = count('warmup', 1);
const crossings = args.includes('--crossings');
const ids = args.filter((a) => !a.startsWith('--'));
function timed<T>(f: () => T): { value: T; ms: number } {
  for (let i = 0; i < warmup; i++) f();
  const times: number[] = [];
  let value!: T;
  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    value = f();
    times.push(performance.now() - start);
  }
  times.sort((a, b) => a - b);
  return { value, ms: times[Math.floor(times.length / 2)] as number };
}
const files = readdirSync(resolve('tutorials'))
  .filter(
    (f) => f.endsWith('.json') && (!ids.length || ids.includes(f.slice(0, -5))),
  )
  .sort();
if (!files.length) throw new Error('No matching tutorials');
console.log(
  `Node ${process.version}; ${reference ? 'reference' : 'current'}; ${runs} measured run(s), ${warmup} warmup(s); milliseconds`,
);
console.log(
  '| Tutorial | Elements | Ink bits | inkPieces | Selection | Pattern from bits | Tutorial pattern | Crossings |',
);
console.log('| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |');
for (const file of files) {
  const t = parseTutorial(
    JSON.parse(readFileSync(resolve('tutorials', file), 'utf8')),
  );
  const scene = evaluate(t);
  const cell = cellOf(scene, t.pattern.cell);
  const own = timed(() => computePattern(scene, t));
  const bits = timed(() => inkPieces(scene, cell, { allEdges: true }));
  const classic = timed(() =>
    classicSelection(
      bits.value,
      own.value.panel?.ink ?? own.value.ink,
      1e-7,
      cell,
    ),
  );
  const strokes = strokesOf(bits.value, classic.value);
  const pattern = timed(() => computePattern(scene, t, strokes));
  const points = crossings
    ? timed(() => constructionCrossings(scene))
    : undefined;
  console.log(
    `| ${file.slice(0, -5)} | ${scene.elements.size} | ${bits.value.length} | ${bits.ms.toFixed(1)} | ${classic.ms.toFixed(1)} | ${pattern.ms.toFixed(1)} | ${own.ms.toFixed(1)} | ${points?.ms.toFixed(1) ?? '—'} |`,
  );
}
