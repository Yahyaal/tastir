import { distance, type Vec } from './vec.js';

/**
 * Lengths that differ by less than this fraction of the drawing size are
 * equal. Every comparison in the engine goes through one `Tolerance` built
 * from this, so there is a single notion of "the same point".
 */
export const RELATIVE_TOLERANCE = 1e-9;

export interface Tolerance {
  /** Absolute distance below which two points are one point. */
  readonly eps: number;
}

/** The shared tolerance for a drawing whose size is `drawingSize` units. */
export function tolerance(drawingSize = 1): Tolerance {
  if (!(drawingSize > 0)) throw new Error('Drawing size must be positive');
  return { eps: RELATIVE_TOLERANCE * drawingSize };
}

export const samePoint = (a: Vec, b: Vec, tol: Tolerance): boolean =>
  distance(a, b) <= tol.eps;

/** The points with near-duplicates removed, keeping the first of each. */
export function mergePoints(points: readonly Vec[], tol: Tolerance): Vec[] {
  const out: Vec[] = [];
  const size = tol.eps * 2;
  // Intersections usually contain at most two points. Keep that path cheap,
  // and preserve legacy behavior for non-finite or unindexable coordinates.
  // Twice-eps bins and this range leave room for division rounding: points
  // within eps cannot be more than one bin apart on either axis.
  if (
    points.length < 32 ||
    !(size > 0 && Number.isFinite(size)) ||
    points.some(
      (p) =>
        !(Math.abs(p.x / size) < 2 ** 48 && Math.abs(p.y / size) < 2 ** 48),
    )
  ) {
    for (const p of points) {
      if (!out.some((q) => samePoint(p, q, tol))) out.push(p);
    }
    return out;
  }
  const columns = new Map<number, Map<number, Vec[]>>();
  point: for (const p of points) {
    const x = Math.floor(p.x / size),
      y = Math.floor(p.y / size);
    for (let dx = -1; dx <= 1; dx++) {
      const column = columns.get(x + dx);
      if (!column) continue;
      for (let dy = -1; dy <= 1; dy++) {
        const bucket = column.get(y + dy);
        if (bucket)
          for (const q of bucket) if (samePoint(p, q, tol)) continue point;
      }
    }
    out.push(p);
    let column = columns.get(x);
    if (!column) columns.set(x, (column = new Map()));
    const bucket = column.get(y);
    if (bucket) bucket.push(p);
    else column.set(y, [p]);
  }
  return out;
}
