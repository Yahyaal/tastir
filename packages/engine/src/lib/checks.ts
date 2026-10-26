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
  // Checked from the ink's ends: an end is on a crossing when two curves
  // through it cross there. Listing every crossing first (as
  // constructionCrossings does) is too slow for large constructions.
  const curves = constructionCurves(scene);
  const near = scene.tol.eps * 10;
  const known = new Map<string, boolean>();
  const onCrossing = (p: Vec) => {
    const key = `${p.x.toFixed(7)},${p.y.toFixed(7)}`;
    const hit = known.get(key);
    if (hit !== undefined) return hit;
    const through = curves.filter((c) => distanceToCurve(p, c) <= near);
    let found = false;
    for (let i = 0; i < through.length && !found; i++) {
      for (let j = i + 1; j < through.length && !found; j++) {
        found = intersect(
          through[i] as Curve,
          through[j] as Curve,
          scene.tol,
        ).some((q) => distance(p, q) <= near);
      }
    }
    known.set(key, found);
    return found;
  };
  return pattern.ink
    .filter((s) => !onCrossing(s.segment.a) || !onCrossing(s.segment.b))
    .map((s) => `${s.from}–${s.to}`);
}

/** How far a point is from a line, circle or segment. */
function distanceToCurve(p: Vec, c: Curve): number {
  if (c.kind === 'line') return distance(p, project(p, c));
  if (c.kind === 'circle') return Math.abs(distance(p, c.centre) - c.radius);
  return distanceToSegment(p, c);
}

/**
 * Whether the pieces around `centre` repeat under a turn of 360°/fold and
 * (unless `mirror` is false) under the mirror in the horizontal through
 * it: every piece within
 * `radius` must land on a piece of the same type. Fold 1 always requires
 * the mirror: its full-turn rotation alone would prove nothing.
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
  // A mirror-only pattern must still prove its mirror, even if a caller
  // disables mirrors for rotational patterns. An empty sample proves nothing.
  if (fold <= 2 && near.length === 0) return false;
  return near.every(
    (p) =>
      isPiece(
        moved(p.polygon, (v) => rotate(v, (2 * Math.PI) / fold)),
        p.type,
      ) &&
      (!(mirror || fold === 1) ||
        isPiece(
          moved(p.polygon, (v) => ({ x: v.x, y: -v.y })),
          p.type,
        )),
  );
}
