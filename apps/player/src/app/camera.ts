import type { Geometry, Vec } from '@tastir/engine';
import type { Model } from './model';

/** A box in the tutorial frame (y up), in units of OA. */
export interface Rect {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
}

export const width = (r: Rect) => r.maxX - r.minX;
export const height = (r: Rect) => r.maxY - r.minY;
export const centreOf = (r: Rect): Vec => ({
  x: (r.minX + r.maxX) / 2,
  y: (r.minY + r.maxY) / 2,
});

/** The margin a frame leaves around what it fits, as a share of its size. */
export const MARGIN = 0.12;
/** A step's frame is never smaller than this share of the whole drawing. */
export const MIN_FRAME = 0.6;
/** A close-up of one move is never smaller than this share. */
export const MIN_FOCUS = 0.3;

/** The smallest box around the points; undefined for none. */
export function boxOf(points: readonly Vec[]): Rect | undefined {
  if (points.length === 0) return undefined;
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  };
}

/** The box with a margin of `margin` times its larger side on every side. */
export function fit(box: Rect, margin = MARGIN): Rect {
  const pad = margin * Math.max(width(box), height(box));
  return {
    minX: box.minX - pad,
    minY: box.minY - pad,
    maxX: box.maxX + pad,
    maxY: box.maxY + pad,
  };
}

/** The box grown about its centre to at least `w` by `h`. */
function atLeast(box: Rect, w: number, h: number): Rect {
  const c = centreOf(box);
  const hw = Math.max(width(box), w) / 2;
  const hh = Math.max(height(box), h) / 2;
  return { minX: c.x - hw, minY: c.y - hh, maxX: c.x + hw, maxY: c.y + hh };
}

/**
 * The points that outline a piece of geometry. Lines are infinite, so they
 * add nothing; the points they are built from frame them.
 */
function outline(g: Geometry): Vec[] {
  switch (g.kind) {
    case 'point':
      return [g.at];
    case 'circle': {
      const { centre: c, radius: r } = g.circle;
      return [
        { x: c.x - r, y: c.y - r },
        { x: c.x + r, y: c.y + r },
      ];
    }
    case 'polygon':
      return [...g.vertices];
    default:
      return [];
  }
}

/** Everything the construction draws, without margin. */
export function drawingBox(model: Model): Rect {
  const points = [...model.scene.elements.values()].flatMap((el) =>
    outline(el.geometry),
  );
  return boxOf(points) ?? { minX: -1, minY: -1, maxX: 1, maxY: 1 };
}

/** The whole drawing with a margin: what Fit shows. */
export const fullView = (model: Model): Rect => fit(drawingBox(model));

/**
 * The view for a step: its new elements and the elements they are built
 * from, never smaller than MIN_FRAME of the whole drawing, with a margin.
 */
export function stepFrame(model: Model, step: number): Rect {
  const { elements } = model.scene;
  const names = new Set<string>();
  for (const el of elements.values()) {
    if (el.beat !== step) continue;
    names.add(el.name);
    el.deps.forEach((d) => names.add(d));
  }
  const points = [...names].flatMap((n) => {
    const g = elements.get(n)?.geometry;
    return g ? outline(g) : [];
  });
  const whole = drawingBox(model);
  const box = boxOf(points) ?? whole;
  return fit(atLeast(box, MIN_FRAME * width(whole), MIN_FRAME * height(whole)));
}

/**
 * Where a beat does its work, and whether it has copies elsewhere: its new
 * points (and the points they are built from) within one turn of the
 * pattern's symmetry around its first new point, never smaller than
 * MIN_FOCUS of the whole drawing. Lines add no points, so a line and its turned copies are
 * framed by the crossing it runs through. `widens` says the beat also
 * draws copies outside the close-up, so the view should then widen.
 */
export function focusFrame(
  model: Model,
  beat: number,
): { frame: Rect; widens: boolean } {
  const { elements } = model.scene;
  const made = [...elements.values()].filter((el) => el.beat === beat);
  const names = new Set<string>();
  for (const el of made) {
    names.add(el.name);
    el.deps.forEach((d) => names.add(d));
  }
  const whole = drawingBox(model);
  const copies = made.some(
    (el) => el.name.includes('@') || el.geometry.kind === 'group',
  );
  // Each element counts where it sits: a point, a circle's centre, a
  // polygon's first corner. Elements at O belong to every turn.
  const anchor = (g: Geometry): Vec | undefined =>
    g.kind === 'point'
      ? g.at
      : g.kind === 'circle'
        ? g.circle.centre
        : g.kind === 'polygon'
          ? g.vertices[0]
          : undefined;
  const sector = (2 * Math.PI) / Math.max(1, model.tutorial.fold);
  const angle = (p: Vec) => {
    const a = Math.atan2(p.y, p.x);
    return a < 0 ? a + 2 * Math.PI : a;
  };
  const far = (p: Vec) => Math.hypot(p.x, p.y) > 1e-6;
  // The first of the new elements that is away from O.
  const first = made
    .map((el) => anchor(el.geometry))
    .find((p): p is Vec => !!p && far(p));
  // Within half a turn of the symmetry either side of that element.
  const inFirstTurn = (p: Vec) => {
    if (!first || !far(p)) return true;
    const d = Math.abs(angle(p) - angle(first)) % (2 * Math.PI);
    return Math.min(d, 2 * Math.PI - d) < sector / 2 - 1e-9;
  };
  let dropped = false;
  const kept = [...names].flatMap((n) => {
    const g = elements.get(n)?.geometry;
    if (!g) return [];
    const at = anchor(g);
    if (at && !inFirstTurn(at)) {
      dropped = true;
      return [];
    }
    return outline(g);
  });
  const box = boxOf(kept) ?? whole;
  const frame = fit(
    atLeast(box, MIN_FOCUS * width(whole), MIN_FOCUS * height(whole)),
  );
  const widens = copies || dropped;
  return { frame, widens };
}

/** The view zoomed by `factor` (above 1 zooms in) keeping `at` still. */
export function zoomAt(view: Rect, at: Vec, factor: number): Rect {
  return {
    minX: at.x + (view.minX - at.x) / factor,
    minY: at.y + (view.minY - at.y) / factor,
    maxX: at.x + (view.maxX - at.x) / factor,
    maxY: at.y + (view.maxY - at.y) / factor,
  };
}

/** The view moved by (dx, dy) in the tutorial frame. */
export function panBy(view: Rect, dx: number, dy: number): Rect {
  return {
    minX: view.minX + dx,
    minY: view.minY + dy,
    maxX: view.maxX + dx,
    maxY: view.maxY + dy,
  };
}

/** The view a share `t` of the way from `a` to `b`. */
export function between(a: Rect, b: Rect, t: number): Rect {
  const mix = (p: number, q: number) => p + (q - p) * t;
  return {
    minX: mix(a.minX, b.minX),
    minY: mix(a.minY, b.minY),
    maxX: mix(a.maxX, b.maxX),
    maxY: mix(a.maxY, b.maxY),
  };
}

/** The SVG viewBox for a view; SVG has y pointing down. */
export const viewBox = (r: Rect) =>
  `${r.minX} ${-r.maxY} ${width(r)} ${height(r)}`;
