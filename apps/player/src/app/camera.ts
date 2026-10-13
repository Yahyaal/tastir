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

/**
 * The calm view for a beat: everything drawn so far (points, circles, the
 * tile; lines are infinite and are framed by their points), with a margin,
 * never smaller than MIN_GROWING of the whole drawing. Because the drawing
 * only grows, so does this view: it stays still while a step works inside
 * it, and widens once when a step reaches beyond it. It never zooms in.
 */
export function growingFrame(
  model: Model,
  beat: number,
  hidden: ReadonlySet<number> = new Set(),
): Rect {
  const points = [...model.scene.elements.values()]
    .filter((el) => el.beat <= beat && !hidden.has(el.beat))
    .flatMap((el) => outline(el.geometry));
  const whole = drawingBox(model);
  const box = boxOf(points) ?? whole;
  return fit(
    atLeast(box, MIN_GROWING * width(whole), MIN_GROWING * height(whole)),
  );
}

/** The growing view starts at least this share of the whole drawing. */
export const MIN_GROWING = 0.45;

/** The whole drawing with a margin: what Fit shows. */
export const fullView = (model: Model): Rect => fit(drawingBox(model));

/** The tile alone, with a small margin: the unit the ink makes. */
export const tileView = (model: Model): Rect =>
  fit(boxOf(model.pattern.cell.corners) ?? drawingBox(model), 0.06);

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
