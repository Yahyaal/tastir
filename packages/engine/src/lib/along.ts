import type { Geometry, Scene } from './evaluate.js';
import { project, type Line, type Segment } from './shapes.js';
import { cross, distance, dot, sub, type Vec } from './vec.js';

/**
 * Drawing along: the learner builds a tutorial's construction on their
 * own board, and each step is checked by where things are, not by their
 * names or by how they were made. A diagonal drawn with Halve angle and
 * one ruled through two opposite points are the same line, so both count.
 */

/**
 * Two constructions of the same figure by different routes agree to far
 * better than this, in units of OA; a figure off by more is another one.
 */
export const ALONG_EPS = 1e-6;

/** Something a step draws that must be on the board: points never are. */
export interface Needed {
  /** The tutorial's name for it (a copy is `x@2`). */
  readonly name: string;
  readonly geometry: Extract<
    Geometry,
    { kind: 'line' } | { kind: 'circle' } | { kind: 'polygon' }
  >;
}

/** How one step (beat) of a tutorial stands on the learner's board. */
export interface StepCheck {
  /** The lines, circles and polygons the step draws, copies included. */
  readonly needed: readonly Needed[];
  /** Those not on the board yet, in the step's order. */
  readonly missing: readonly Needed[];
  /** Whether everything the step draws is on the board. A step that only
   * marks points is always done, as crossings appear by themselves. */
  readonly done: boolean;
}

const isFigure = (g: Geometry): g is Needed['geometry'] =>
  g.kind === 'line' || g.kind === 'circle' || g.kind === 'polygon';

/** What a beat of the tutorial draws, in the order it was made. */
export function neededAt(tutorial: Scene, beat: number): Needed[] {
  const out: Needed[] = [];
  for (const el of tutorial.elements.values())
    if (el.beat === beat && isFigure(el.geometry))
      out.push({ name: el.name, geometry: el.geometry });
  return out;
}

const onLine = (p: Vec, l: Line, eps: number) =>
  distance(p, project(p, l)) <= eps;

/** Whether two infinite lines are the same line. */
export function sameLine(a: Line, b: Line, eps = ALONG_EPS): boolean {
  return Math.abs(cross(a.dir, b.dir)) <= eps && onLine(b.point, a, eps);
}

/** Whether a segment lies within another (on its line, between its ends). */
function within(s: Segment, host: Segment, eps: number): boolean {
  const d = sub(host.b, host.a);
  const len2 = dot(d, d);
  const inside = (p: Vec) => {
    const t = dot(sub(p, host.a), d) / len2;
    const foot = { x: host.a.x + d.x * t, y: host.a.y + d.y * t };
    const slack = eps / Math.sqrt(len2);
    return distance(p, foot) <= eps && t >= -slack && t <= 1 + slack;
  };
  return inside(s.a) && inside(s.b);
}

/**
 * The figures of a scene, sorted by kind, so a check does not walk every
 * point (big tutorials have hundreds).
 */
export interface Figures {
  readonly lines: readonly { readonly name: string; readonly line: Line }[];
  readonly circles: readonly {
    readonly name: string;
    readonly centre: Vec;
    readonly radius: number;
  }[];
  readonly polygons: readonly {
    readonly name: string;
    readonly vertices: readonly Vec[];
    readonly sides: readonly Segment[];
  }[];
}

const figuresCache = new WeakMap<Scene, Figures>();

/** The lines, circles and polygons of a scene (computed once). */
export function figuresOf(scene: Scene): Figures {
  let found = figuresCache.get(scene);
  if (found) return found;
  const lines: { name: string; line: Line }[] = [];
  const circles: { name: string; centre: Vec; radius: number }[] = [];
  const polygons: {
    name: string;
    vertices: readonly Vec[];
    sides: readonly Segment[];
  }[] = [];
  for (const el of scene.elements.values()) {
    const g = el.geometry;
    if (g.kind === 'line') lines.push({ name: el.name, line: g.line });
    else if (g.kind === 'circle') circles.push({ name: el.name, ...g.circle });
    else if (g.kind === 'polygon')
      polygons.push({ name: el.name, vertices: g.vertices, sides: g.sides });
  }
  found = { lines, circles, polygons };
  figuresCache.set(scene, found);
  return found;
}

/** Whether a straight piece lies on a drawn line or along a drawn side. */
function segmentDrawn(s: Segment, on: Figures, eps: number): boolean {
  const len = distance(s.a, s.b);
  if (len <= eps) return true;
  const dir = { x: (s.b.x - s.a.x) / len, y: (s.b.y - s.a.y) / len };
  const carrier: Line = { kind: 'line', point: s.a, dir };
  return (
    on.lines.some((l) => sameLine(l.line, carrier, eps)) ||
    on.polygons.some((p) => p.sides.some((side) => within(s, side, eps)))
  );
}

/**
 * The name of a figure on the board that is the given one: the same
 * infinite line, a circle with the same centre and radius, or a polygon
 * with the same corners in the same order round. Undefined when there is
 * none (a polygon drawn as lines has no one name).
 */
export function figureOn(
  board: Scene,
  g: Geometry,
  eps = ALONG_EPS,
): string | undefined {
  const on = figuresOf(board);
  if (g.kind === 'line')
    return on.lines.find((l) => sameLine(l.line, g.line, eps))?.name;
  if (g.kind === 'circle')
    return on.circles.find(
      (c) =>
        distance(c.centre, g.circle.centre) <= eps &&
        Math.abs(c.radius - g.circle.radius) <= eps,
    )?.name;
  if (g.kind === 'polygon')
    return on.polygons.find((p) => samePolygon(p.vertices, g.vertices, eps))
      ?.name;
  return undefined;
}

/** The same corners in the same order round, from any start, either way. */
function samePolygon(
  a: readonly Vec[],
  b: readonly Vec[],
  eps: number,
): boolean {
  const n = a.length;
  if (b.length !== n) return false;
  const start = b.findIndex((v) => distance(v, a[0] as Vec) <= eps);
  if (start < 0) return false;
  const at = (i: number) => b[(((start + i) % n) + n) % n] as Vec;
  const forward = a.every((v, i) => distance(v, at(i)) <= eps);
  const backward = a.every((v, i) => distance(v, at(-i)) <= eps);
  return forward || backward;
}

/**
 * Whether a figure is on the board: a line or circle as the same figure,
 * however it was made; a polygon drawn with Polygon, or with every side
 * lying on a drawn line or along a drawn polygon's side.
 */
export function drawnOn(board: Scene, g: Geometry, eps = ALONG_EPS): boolean {
  if (g.kind === 'polygon')
    return g.sides.every((s) => segmentDrawn(s, figuresOf(board), eps));
  return figureOn(board, g, eps) !== undefined;
}

/** How one beat of the tutorial stands on the learner's board. */
export function checkStep(
  tutorial: Scene,
  board: Scene,
  beat: number,
  eps = ALONG_EPS,
): StepCheck {
  const needed = neededAt(tutorial, beat);
  const missing = needed.filter((n) => !drawnOn(board, n.geometry, eps));
  return { needed, missing, done: missing.length === 0 };
}

/**
 * The board's figures that the tutorial never draws: the learner's own
 * extras, kept and shown faint, never counted against them. A line that
 * carries a side of one of the tutorial's polygons is not extra.
 */
export function extrasOn(
  tutorial: Scene,
  board: Scene,
  eps = ALONG_EPS,
): Set<string> {
  const t = figuresOf(tutorial);
  const out = new Set<string>();
  for (const el of board.elements.values()) {
    const g = el.geometry;
    let used: boolean;
    if (g.kind === 'line')
      used =
        t.lines.some((l) => sameLine(l.line, g.line, eps)) ||
        t.polygons.some((p) =>
          p.sides.some(
            (s) => onLine(s.a, g.line, eps) && onLine(s.b, g.line, eps),
          ),
        );
    else if (g.kind === 'circle' || g.kind === 'polygon')
      used =
        g.kind === 'circle'
          ? figureOn(tutorial, g, eps) !== undefined
          : g.sides.every((s) => segmentDrawn(s, t, eps));
    else continue;
    if (!used) out.add(el.name);
  }
  return out;
}
