/** Audit actual construction prefixes and validate a review-only Paccard reordering.
 * node --conditions=@tastir/source --import tsx tools/audit-shared-constructions.mts
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { cellOf, evaluate, inkStrokes } from '../packages/engine/src/index.js';
import { parseTutorial } from '../packages/schema/src/index.js';
const read = (id: string) =>
  parseTutorial(JSON.parse(readFileSync(`tutorials/${id}.json`, 'utf8')));
const prefix = (a: ReturnType<typeof read>, b: ReturnType<typeof read>) => {
  let n = 0;
  while (
    a.steps[n] &&
    b.steps[n] &&
    JSON.stringify(a.steps[n]) === JSON.stringify(b.steps[n])
  )
    n++;
  return n;
};
const a = read('paccard-222-rosette'),
  b = read('paccard-222-rosette-ring');
const proposed = structuredClone(a);
const fifth = proposed.steps[4],
  eighth = proposed.steps[7];
if (!fifth || !eighth) throw new Error('Missing steps');
const { cu6, U6, ...shared } = fifth.create ?? {};
if (!cu6 || !U6) throw new Error('Expected the independent U6 measurement');
fifth.create = shared;
fifth.text = b.steps[4]?.text ?? '';
eighth.create = { cu6, U6, ...eighth.create };
eighth.text =
  'Draw a circle with centre U5 and radius OE. It crosses the horizontal line at U6, to the right. ' +
  eighth.text;
const originalScene = evaluate(a),
  proposedScene = evaluate(parseTutorial(proposed));
const geometry = (scene: typeof originalScene) =>
  JSON.stringify(
    [...scene.elements]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, el]) => [name, el.geometry]),
  );
const inkEqual =
  JSON.stringify(inkStrokes(originalScene, a).map((s) => s.segment)) ===
  JSON.stringify(inkStrokes(proposedScene, proposed).map((s) => s.segment));
const cellEqual =
  JSON.stringify(cellOf(originalScene, a.pattern.cell)) ===
  JSON.stringify(cellOf(proposedScene, proposed.pattern.cell));
const geometryEqual = geometry(originalScene) === geometry(proposedScene);
const report = {
  paccard: {
    currentSharedSteps: prefix(a, b),
    proposedSharedSteps: prefix(proposed, b),
    geometryEqual,
    inkEqual,
    cellEqual,
  },
  najjarin: {
    currentSharedSteps: prefix(
      read('fes-najjarin-rosette'),
      read('meknes-bou-inania-rosette'),
    ),
  },
};
if (
  !inkEqual ||
  !cellEqual ||
  !geometryEqual ||
  report.paccard.proposedSharedSteps !== 7
)
  throw new Error('Proposed reorder did not preserve the drawing');
mkdirSync('docs/review/teaching-update', { recursive: true });
writeFileSync(
  'docs/review/teaching-update/shared-prefixes.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report));
