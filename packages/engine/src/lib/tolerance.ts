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
  for (const p of points) {
    if (!out.some((q) => samePoint(p, q, tol))) out.push(p);
  }
  return out;
}
