// Distance from O of each ink path of a tutorial: how far its stroke reaches.
//   tsx --conditions=@tastir/source tools/review/kurt8/medallion.ts <id>
import { readFileSync } from 'node:fs';
import { evaluate, inkStrokes } from '../../../packages/engine/src/index.ts';
import type { Tutorial } from '../../../packages/schema/src/index.ts';

const id = process.argv[2] ?? 'kurt-eight-fold-zellige';
const t = JSON.parse(
  readFileSync(
    new URL(`../../../tutorials/${id}.json`, import.meta.url),
    'utf8',
  ),
) as Tutorial;
const scene = evaluate(t);
const strokes = inkStrokes(scene, t);
const out = strokes.map((s, i) => ({
  path: i,
  far: Math.max(
    Math.hypot(s.segment.a.x, s.segment.a.y),
    Math.hypot(s.segment.b.x, s.segment.b.y),
  ),
  a: s.segment.a,
  b: s.segment.b,
}));
console.log(JSON.stringify(out));
