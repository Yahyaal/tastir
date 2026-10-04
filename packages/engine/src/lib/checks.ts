import type { Tutorial } from '@tastir/schema';
import { distanceToSegment, evaluate, type Scene } from './evaluate.js';
import type { InkStroke } from './ink.js';
import { intersect } from './intersect.js';
import type { Pattern } from './pieces.js';
import { project, type Curve } from './shapes.js';
import { mergePoints } from './tolerance.js';
import { distance, rotate, type Vec } from './vec.js';

/**
 * The first step that cannot be built, evaluating the tutorial one step at
 * a time so the message names the step where an ambiguous, missing or
 * impossible reference first appears. Undefined when every step builds.
 */
export function firstFailingStep(tutorial: Tutorial): string | undefined {
  for (let n = 1; n <= tutorial.steps.length; n++) {
    try {
      evaluate({ ...tutorial, steps: tutorial.steps.slice(0, n) });
    } catch (e) {
      return e instanceof Error ? e.message : String(e);
    }
  }
  return undefined;
}

/**
 * The ink strokes that lie on no line or polygon side of the construction.
 * Ink is a choice among lines already drawn, so a stroke off them inks a
 * line the learner never made.
 */
export function strokesOffConstruction(
  scene: Scene,
  ink: readonly InkStroke[],
): string[] {
  const { eps } = scene.tol;
  const elements = [...scene.elements.values()];
  const carried = ({ segment: { a, b } }: InkStroke) =>
    elements.some(({ geometry: g }) => {
      if (g.kind === 'line')
        return [a, b].every((p) => distance(p, project(p, g.line)) <= eps);
      if (g.kind === 'polygon')
        return g.sides.some(
          (s) =>
            distanceToSegment(a, s) <= eps && distanceToSegment(b, s) <= eps,
        );
      return false;
    });
  return ink.filter((s) => !carried(s)).map((s) => `${s.from}–${s.to}`);
}

/** Every line, circle and polygon side the construction draws. */
function constructionCurves(scene: Scene): Curve[] {
  const curves: Curve[] = [];
  for (const { geometry: g } of scene.elements.values()) {
    if (g.kind === 'line') curves.push(g.line);
    if (g.kind === 'circle') curves.push(g.circle);
    if (g.kind === 'polygon') curves.push(...g.sides);
  }
  return curves;
}

/** Every point where two curves of the construction cross or touch. */
export function constructionCrossings(scene: Scene): Vec[] {
  const curves = constructionCurves(scene);
  const points: Vec[] = [];
  for (let i = 0; i < curves.length; i++) {
    for (let j = i + 1; j < curves.length; j++) {
      points.push(
        ...intersect(curves[i] as Curve, curves[j] as Curve, scene.tol),
      );
    }
  }
  return mergePoints(points, scene.tol);
}

/**
 * The ink strokes that do not run between crossings of the construction.
 * A pattern line drawn by hand passes through at least two crossings;
 * when one does not, a circle or line is missing from the construction.
 */
export function strokesOffCrossings(scene: Scene, pattern: Pattern): string[] {
  const crossings = constructionCrossings(scene);
  const onCrossing = (p: Vec) =>
    crossings.some((q) => distance(p, q) <= scene.tol.eps * 10);
  return pattern.ink
    .filter((s) => !onCrossing(s.segment.a) || !onCrossing(s.segment.b))
    .map((s) => `${s.from}–${s.to}`);
}

/**
 * Whether the pieces around `centre` repeat under a turn of 360°/fold and
 * (unless `mirror` is false) under the mirror in the horizontal through
 * it: every piece within
 * `radius` must land on a piece of the same type.
 */
export function hasSymmetry(
  pattern: Pattern,
  fold: number,
  centre: Vec = { x: 0, y: 0 },
  radius = 1,
  /** Also require the mirror in the horizontal through the centre. */
  mirror = true,
): boolean {
  const { cell } = pattern;
  // The pieces of the central cell and its eight neighbours.
  const pieces: { at: Vec; type: number; polygon: readonly Vec[] }[] = [];
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      const dx = cell.u.x * i + cell.v.x * j;
      const dy = cell.u.y * i + cell.v.y * j;
      for (const p of pattern.pieces) {
        const polygon = p.polygon.map((q) => ({ x: q.x + dx, y: q.y + dy }));
        const n = polygon.length;
        const at = polygon.reduce(
          (s, q) => ({ x: s.x + q.x / n, y: s.y + q.y / n }),
          { x: 0, y: 0 },
        );
        pieces.push({ at, type: p.type, polygon });
      }
    }
  }
  // Strictly inside: pieces centred on the circle itself (radius 1 is the
  // main circle) are the joins between repeats, which follow the tile.
  const near = pieces.filter((p) => distance(p.at, centre) < radius - 1e-9);
  const tol = 1e-6;
  /** Whether some piece of the type has exactly these corners. */
  const isPiece = (corners: readonly Vec[], type: number) =>
    pieces.some(
      (p) =>
        p.type === type &&
        p.polygon.length === corners.length &&
        p.polygon.every((q) => corners.some((c) => distance(q, c) <= tol)),
    );
  const moved = (polygon: readonly Vec[], f: (v: Vec) => Vec) =>
    polygon.map((p) => {
      const r = f({ x: p.x - centre.x, y: p.y - centre.y });
      return { x: r.x + centre.x, y: r.y + centre.y };
    });
  return near.every(
    (p) =>
      isPiece(
        moved(p.polygon, (v) => rotate(v, (2 * Math.PI) / fold)),
        p.type,
      ) &&
      (!mirror ||
        isPiece(
          moved(p.polygon, (v) => ({ x: v.x, y: -v.y })),
          p.type,
        )),
  );
}
