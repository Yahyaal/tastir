// Frozen from main fecca93 for performance-equivalence.spec.ts. Do not update to match optimized output.
import {
  line as makeLine,
  project,
  type Circle,
  type Curve,
  type Line,
  type Segment,
} from '../../lib/shapes.js';
import { mergePoints, type Tolerance } from './tolerance.js';
import {
  add,
  cross,
  distance,
  dot,
  length,
  perp,
  scale,
  sub,
  type Vec,
} from '../../lib/vec.js';

// Each intersection returns its points in a stable order: along the first
// line's direction, or counter-clockwise from the line of centres for two
// circles. A tangent contact is always exactly one point, decided by
// comparing distances with the tolerance, never by the sign of a
// discriminant that rounding can flip. Coincident shapes return no points;
// use `overlap` to tell "never meet" apart from "lie on top of each other".

export function intersectLineLine(a: Line, b: Line, tol: Tolerance): Vec[] {
  const den = cross(a.dir, b.dir);
  if (Math.abs(den) <= tol.eps) return [];
  const t = cross(sub(b.point, a.point), b.dir) / den;
  return [add(a.point, scale(a.dir, t))];
}

export function intersectLineCircle(l: Line, c: Circle, tol: Tolerance): Vec[] {
  const foot = project(c.centre, l);
  const h = distance(foot, c.centre);
  if (h > c.radius + tol.eps) return [];
  if (h >= c.radius - tol.eps) return [foot];
  const half = Math.sqrt(c.radius * c.radius - h * h);
  return [add(foot, scale(l.dir, -half)), add(foot, scale(l.dir, half))];
}

export function intersectCircleCircle(
  a: Circle,
  b: Circle,
  tol: Tolerance,
): Vec[] {
  const d = distance(a.centre, b.centre);
  if (d <= tol.eps) return [];
  const sum = a.radius + b.radius;
  const diff = Math.abs(a.radius - b.radius);
  if (d > sum + tol.eps || d < diff - tol.eps) return [];
  const u = scale(sub(b.centre, a.centre), 1 / d);
  // Distance from a's centre, along u, to the chord through the crossings.
  const along = (d * d + a.radius * a.radius - b.radius * b.radius) / (2 * d);
  const base = add(a.centre, scale(u, along));
  if (Math.abs(d - sum) <= tol.eps || Math.abs(d - diff) <= tol.eps) {
    return [base];
  }
  const half = Math.sqrt(Math.max(0, a.radius * a.radius - along * along));
  return [add(base, scale(perp(u), half)), add(base, scale(perp(u), -half))];
}

const carrier = (s: Segment): Line =>
  makeLine(s.a, scale(sub(s.b, s.a), 1 / length(sub(s.b, s.a))));

/** Whether `p`, already known to be on the segment's line, is within it. */
function withinSegment(p: Vec, s: Segment, tol: Tolerance): boolean {
  const d = sub(s.b, s.a);
  const len = length(d);
  const t = dot(sub(p, s.a), d) / len;
  return t >= -tol.eps && t <= len + tol.eps;
}

const asLine = (c: Line | Segment): Line =>
  c.kind === 'line' ? c : carrier(c);

/** Every point where the two curves cross or touch, with duplicates merged. */
export function intersect(a: Curve, b: Curve, tol: Tolerance): Vec[] {
  let points: Vec[];
  if (a.kind === 'circle' && b.kind === 'circle') {
    points = intersectCircleCircle(a, b, tol);
  } else if (a.kind === 'circle') {
    points = intersectLineCircle(asLine(b as Line | Segment), a, tol);
  } else if (b.kind === 'circle') {
    points = intersectLineCircle(asLine(a), b, tol);
  } else {
    points = intersectLineLine(asLine(a), asLine(b), tol);
  }
  const keep = (p: Vec) =>
    (a.kind !== 'segment' || withinSegment(p, a, tol)) &&
    (b.kind !== 'segment' || withinSegment(p, b, tol));
  return mergePoints(points.filter(keep), tol);
}

/**
 * Whether the curves share more than isolated points: the same line or
 * circle, or two segments (or a segment and a line) lying along each other.
 */
export function overlap(a: Curve, b: Curve, tol: Tolerance): boolean {
  if (a.kind === 'circle' || b.kind === 'circle') {
    if (a.kind !== 'circle' || b.kind !== 'circle') return false;
    return (
      distance(a.centre, b.centre) <= tol.eps &&
      Math.abs(a.radius - b.radius) <= tol.eps
    );
  }
  const la = asLine(a);
  const lb = asLine(b);
  if (Math.abs(cross(la.dir, lb.dir)) > tol.eps) return false;
  if (distance(project(lb.point, la), lb.point) > tol.eps) return false;
  if (a.kind === 'line' && b.kind === 'line') return true;
  // Collinear: compare the parameter ranges each covers along la.
  const range = (c: Line | Segment): [number, number] => {
    if (c.kind === 'line') return [-Infinity, Infinity];
    const t0 = dot(sub(c.a, la.point), la.dir);
    const t1 = dot(sub(c.b, la.point), la.dir);
    return [Math.min(t0, t1), Math.max(t0, t1)];
  };
  const [a0, a1] = range(a);
  const [b0, b1] = range(b);
  return Math.min(a1, b1) - Math.max(a0, b0) > tol.eps;
}
