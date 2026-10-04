// Evaluates a tutorial one step at a time and writes everything the review
// renderer needs as JSON: the elements after each step, the ink, the pieces
// of one cell and the cell itself. A step that fails is reported with the
// engine's own message, so a half-written tutorial still renders up to it.
//
//   tsx --conditions=@tastir/source tools/review/dump.ts <id> <out.json>
import { readFileSync, writeFileSync } from 'node:fs';
import {
  computePattern,
  evaluate,
  strokesOffCrossings,
  type Scene,
} from '../../packages/engine/src/index.ts';
import {
  parseTutorial,
  type Tutorial,
} from '../../packages/schema/src/index.ts';

const [id, out] = process.argv.slice(2);
if (!id || !out) {
  console.error('usage: dump.ts <tutorial-id> <out.json>');
  process.exit(2);
}
const raw = JSON.parse(
  readFileSync(new URL(`../../tutorials/${id}.json`, import.meta.url), 'utf8'),
) as Tutorial;

const message = (e: unknown) => (e instanceof Error ? e.message : String(e));

function elementsOf(scene: Scene) {
  const els: unknown[] = [];
  for (const el of scene.elements.values()) {
    const g = el.geometry;
    const base = { name: el.name, step: el.step };
    if (g.kind === 'point')
      els.push({ ...base, kind: 'point', x: g.at.x, y: g.at.y });
    if (g.kind === 'line')
      els.push({
        ...base,
        kind: 'line',
        x: g.line.point.x,
        y: g.line.point.y,
        dx: g.line.dir.x,
        dy: g.line.dir.y,
      });
    if (g.kind === 'circle')
      els.push({
        ...base,
        kind: 'circle',
        x: g.circle.centre.x,
        y: g.circle.centre.y,
        r: g.circle.radius,
      });
    if (g.kind === 'polygon')
      els.push({
        ...base,
        kind: 'polygon',
        vertices: g.vertices.map((v) => [v.x, v.y]),
      });
  }
  return els;
}

const result: Record<string, unknown> = {
  id,
  title: raw.title,
  fold: raw.fold,
  steps: [],
};
const steps = result['steps'] as unknown[];
let last: Scene | undefined;
for (let n = 1; n <= raw.steps.length; n++) {
  const partial = { ...raw, steps: raw.steps.slice(0, n) };
  const step = raw.steps[n - 1] as Tutorial['steps'][number];
  try {
    last = evaluate(partial);
    steps.push({ id: step.id, text: step.text, elements: elementsOf(last) });
  } catch (e) {
    steps.push({ id: step.id, text: step.text, error: message(e) });
    break;
  }
}

try {
  const tutorial = parseTutorial(raw);
  const scene = evaluate(tutorial);
  const pattern = computePattern(scene, tutorial);
  result['cell'] = {
    corners: pattern.cell.corners.map((c) => [c.x, c.y]),
    u: [pattern.cell.u.x, pattern.cell.u.y],
    v: [pattern.cell.v.x, pattern.cell.v.y],
  };
  result['ink'] = pattern.ink.map((s) => [
    [s.segment.a.x, s.segment.a.y],
    [s.segment.b.x, s.segment.b.y],
  ]);
  result['pieces'] = pattern.pieces.map((p) => ({
    type: p.type,
    polygon: p.polygon.map((q) => [q.x, q.y]),
  }));
  result['types'] = pattern.types.map((t) => ({
    name: t.name ?? null,
    vertices: t.vertices,
    area: Number(t.area.toFixed(5)),
    perCell: t.perCell,
    sliver: t.sliver,
  }));
  result['offCrossings'] = strokesOffCrossings(scene, pattern);
  result['colors'] = tutorial.pattern.colors;
} catch (e) {
  result['patternError'] = message(e);
}

writeFileSync(out, JSON.stringify(result));
