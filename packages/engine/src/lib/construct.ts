import { circle, line, project, type Circle, type Line } from './shapes.js';
import type { Tolerance } from './tolerance.js';
import {
  add,
  distance,
  length,
  normalize,
  perp,
  sub,
  type Vec,
} from './vec.js';

/**
 * A construction that cannot be carried out: the points coincide, or no
 * single circle does what was asked. The evaluator adds the step and the
 * element to the message.
 */
export class GeometryError extends Error {
  override name = 'GeometryError';
}

const fmt = (n: number) => n.toFixed(5);

export function lineThrough(p: Vec, q: Vec, tol: Tolerance): Line {
  if (distance(p, q) <= tol.eps) {
    throw new GeometryError('the two points are the same point');
  }
  return line(p, normalize(sub(q, p)));
}

export const perpendicularThrough = (p: Vec, l: Line): Line =>
  line(p, perp(l.dir));

export const parallelThrough = (p: Vec, l: Line): Line => line(p, l.dir);

/** The line through q halving the angle p q r. */
export function bisector(p: Vec, q: Vec, r: Vec, tol: Tolerance): Line {
  if (distance(p, q) <= tol.eps || distance(r, q) <= tol.eps) {
    throw new GeometryError('the angle has an arm of zero length');
  }
  const u = normalize(sub(p, q));
  const w = normalize(sub(r, q));
  const sum = add(u, w);
  // A straight angle is halved by the perpendicular at its vertex.
  return line(q, length(sum) <= tol.eps ? perp(u) : normalize(sum));
}

export function circleThrough(centre: Vec, p: Vec, tol: Tolerance): Circle {
  return circleWithRadius(centre, distance(centre, p), tol);
}

/** The compass keeps its opening: centre `centre`, radius of `c`. */
export const circleWithRadiusOf = (centre: Vec, c: Circle): Circle =>
  circle(centre, c.radius);

/** Centre `centre`, radius equal to the distance from q to r. */
export function circleRadiusFrom(
  centre: Vec,
  q: Vec,
  r: Vec,
  tol: Tolerance,
): Circle {
  return circleWithRadius(centre, distance(q, r), tol);
}

function circleWithRadius(centre: Vec, radius: number, tol: Tolerance) {
  if (radius <= tol.eps) throw new GeometryError('the radius is zero');
  return circle(centre, radius);
}

/** Every radius at which a circle about `centre` just touches `target`. */
function touchingRadii(centre: Vec, target: Line | Circle, tol: Tolerance) {
  if (target.kind === 'line') {
    const r = distance(centre, project(centre, target));
    if (r <= tol.eps) throw new GeometryError('the centre lies on the line');
    return [r];
  }
  const d = distance(centre, target.centre);
  if (d <= tol.eps) return [target.radius];
  // Touching from outside (or from inside when the centre is within the
  // target), and enclosing it.
  return [Math.abs(d - target.radius), d + target.radius].filter(
    (r) => r > tol.eps,
  );
}

/**
 * The circle about `centre` that just touches every target. It is an error
 * when no single radius touches all of them, or when more than one does.
 */
export function circleTangentTo(
  centre: Vec,
  targets: readonly (Line | Circle)[],
  tol: Tolerance,
): Circle {
  if (targets.length === 0) throw new GeometryError('nothing to touch');
  let radii = touchingRadii(centre, targets[0] as Line | Circle, tol);
  const seen = [...radii];
  for (const target of targets.slice(1)) {
    const next = touchingRadii(centre, target, tol);
    seen.push(...next);
    radii = radii.filter((r) => next.some((s) => Math.abs(r - s) <= tol.eps));
  }
  if (radii.length === 0) {
    const list = [...new Set(seen.map(fmt))].join(', ');
    throw new GeometryError(
      `no single radius touches all ${targets.length} targets (each is touched at radius ${list})`,
    );
  }
  if (radii.length > 1) {
    throw new GeometryError(
      `${radii.length} radii touch every target (${radii.map(fmt).join(' and ')}), so the circle is ambiguous`,
    );
  }
  return circle(centre, radii[0] as number);
}
