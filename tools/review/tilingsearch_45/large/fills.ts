// Prints every piece of a tutorial's cell with the colour the player's own
// placement function gives it (palette slot), for checking `nth` rules
// against the source drawing with cmpslots.py.
//
//   tsx --conditions=@tastir/source tools/review/tilingsearch_45/large/fills.ts <id>
import { readFileSync } from 'node:fs';
import { loadModel } from '../../../../packages/project-core/src/model.ts';
import { placeFills } from '../../../../packages/project-core/src/placement.ts';
import { PALETTES } from '../../../../packages/project-core/src/coloring.ts';

const id = process.argv[2];
const json = JSON.parse(
  readFileSync(new URL(`../../../../tutorials/${id}.json`, import.meta.url), 'utf8'),
);
const model = loadModel(json);
const palette = json.pattern.palette as string;
const fill = placeFills(model, { palette, chosen: {} });
const slots = Object.fromEntries(
  Object.entries(PALETTES[palette] ?? {}).map(([k, v]) => [v, k]),
);
model.pattern.pieces.forEach((p, i) => {
  const n = p.polygon.length;
  const c = p.polygon.reduce((a, q) => ({ x: a.x + q.x / n, y: a.y + q.y / n }), { x: 0, y: 0 });
  const t = model.pattern.types[p.type]!;
  const f = fill(i, 0, 0);
  console.log(`${t.name} ${c.x},${c.y} ${slots[f] ?? f}`);
});
