import {
  intersectCircleCircle,
  intersectLineCircle,
  intersectLineLine,
  overlap,
} from './intersect.js';
import { line, type Curve, type Line } from './shapes.js';
import type { Tolerance } from './tolerance.js';
import { distance, type Vec } from './vec.js';

/** A curve's carrier and segment length, reused throughout an intersection pass. */
export interface PreparedCurve {
  readonly curve: Curve;
  readonly point?: Vec;
  readonly ux?: number;
  readonly uy?: number;
  readonly dx?: number;
  readonly dy?: number;
  readonly length?: number;
  readonly length2?: number;
}

export function prepareCurve(curve: Curve): PreparedCurve {
  if (curve.kind === 'circle') return { curve };
  if (curve.kind === 'line')
    return { curve, point: curve.point, ux: curve.dir.x, uy: curve.dir.y };
  const dx = curve.b.x - curve.a.x;
  const dy = curve.b.y - curve.a.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) throw new Error('Cannot normalize a zero vector');
  return {
    curve,
    dx,
    dy,
    length: len,
    length2: dx * dx + dy * dy,
    point: curve.a,
    ux: dx * (1 / len),
    uy: dy * (1 / len),
  };
}

function carrierOf(prepared: PreparedCurve): Line {
  return prepared.curve.kind === 'line'
    ? prepared.curve
    : line(prepared.point as Vec, {
        x: prepared.ux as number,
        y: prepared.uy as number,
      });
}

function within(p: Vec, prepared: PreparedCurve, tol: Tolerance): boolean {
  const { curve } = prepared;
  if (curve.kind !== 'segment') return true;
  const t =
    ((p.x - curve.a.x) * (prepared.dx as number) +
      (p.y - curve.a.y) * (prepared.dy as number)) /
    (prepared.length as number);
  return t >= -tol.eps && t <= (prepared.length as number) + tol.eps;
}

/** The same operations and point order as intersect, without rebuilding carriers. */
export function intersectPrepared(
  a: PreparedCurve,
  b: PreparedCurve,
  tol: Tolerance,
): Vec[] {
  const ac = a.curve;
  const bc = b.curve;
  const points =
    ac.kind === 'circle'
      ? bc.kind === 'circle'
        ? intersectCircleCircle(ac, bc, tol)
        : intersectLineCircle(carrierOf(b), ac, tol)
      : bc.kind === 'circle'
        ? intersectLineCircle(carrierOf(a), bc, tol)
        : intersectLineLine(carrierOf(a), carrierOf(b), tol);
  const kept: Vec[] = [];
  for (const p of points) {
    if (!within(p, a, tol) || !within(p, b, tol)) continue;
    // There are at most two intersections, so merging needs only this comparison.
    if (!kept.length || distance(p, kept[0] as Vec) > tol.eps) kept.push(p);
  }
  return kept;
}

/** The same collinearity and range tests as overlap, using prepared carriers. */
export function overlapPrepared(
  a: PreparedCurve,
  b: PreparedCurve,
  tol: Tolerance,
): boolean {
  const ac = a.curve;
  const bc = b.curve;
  if (ac.kind === 'circle' || bc.kind === 'circle') return overlap(ac, bc, tol);
  const ap = a.point as Vec;
  const bp = b.point as Vec;
  const ux = a.ux as number,
    uy = a.uy as number;
  if (Math.abs(ux * (b.uy as number) - uy * (b.ux as number)) > tol.eps)
    return false;
  const along = (bp.x - ap.x) * ux + (bp.y - ap.y) * uy;
  if (Math.hypot(ap.x + ux * along - bp.x, ap.y + uy * along - bp.y) > tol.eps)
    return false;
  const a0 =
    ac.kind === 'line'
      ? -Infinity
      : (ac.a.x - ap.x) * ux + (ac.a.y - ap.y) * uy;
  const a1 =
    ac.kind === 'line' ? Infinity : (ac.b.x - ap.x) * ux + (ac.b.y - ap.y) * uy;
  const b0 =
    bc.kind === 'line'
      ? -Infinity
      : (bc.a.x - ap.x) * ux + (bc.a.y - ap.y) * uy;
  const b1 =
    bc.kind === 'line' ? Infinity : (bc.b.x - ap.x) * ux + (bc.b.y - ap.y) * uy;
  return (
    Math.min(Math.max(a0, a1), Math.max(b0, b1)) -
      Math.max(Math.min(a0, a1), Math.min(b0, b1)) >
    tol.eps
  );
}

/**
 * Append cut parameters directly. This is intersectPrepared followed by projection,
 * with the same arithmetic order, but no temporary points/arrays for line crossings.
 * The first curve is a segment; a second cuts array is used for segment arrangements.
 */
export function appendCrossingCuts(
  a: PreparedCurve,
  b: PreparedCurve,
  tol: Tolerance,
  aCuts: number[],
  bCuts?: number[],
): void {
  const ac = a.curve;
  if (ac.kind !== 'segment')
    throw new Error('Cut parameters require a segment');
  if (b.curve.kind === 'circle') {
    for (const p of intersectPrepared(a, b, tol))
      aCuts.push(
        ((p.x - ac.a.x) * (a.dx as number) +
          (p.y - ac.a.y) * (a.dy as number)) /
          (a.length2 as number),
      );
    return;
  }
  const ap = a.point as Vec;
  const bp = b.point as Vec;
  const ux = a.ux as number,
    uy = a.uy as number;
  const vx = b.ux as number,
    vy = b.uy as number;
  const den = ux * vy - uy * vx;
  if (Math.abs(den) <= tol.eps) return;
  const t = ((bp.x - ap.x) * vy - (bp.y - ap.y) * vx) / den;
  const x = ap.x + ux * t;
  const y = ap.y + uy * t;
  const an = (x - ac.a.x) * (a.dx as number) + (y - ac.a.y) * (a.dy as number);
  const alongA = an / (a.length as number);
  if (!(alongA >= -tol.eps && alongA <= (a.length as number) + tol.eps)) return;
  if (b.curve.kind === 'segment') {
    const bn =
      (x - b.curve.a.x) * (b.dx as number) +
      (y - b.curve.a.y) * (b.dy as number);
    const alongB = bn / (b.length as number);
    if (!(alongB >= -tol.eps && alongB <= (b.length as number) + tol.eps))
      return;
    bCuts?.push(bn / (b.length2 as number));
  }
  aCuts.push(an / (a.length2 as number));
}
