import { dot, add, scale, sub, type Vec } from './vec.js';

/** An infinite line through `point` along the unit vector `dir`. */
export interface Line {
  readonly kind: 'line';
  readonly point: Vec;
  readonly dir: Vec;
}

export interface Circle {
  readonly kind: 'circle';
  readonly centre: Vec;
  readonly radius: number;
}

/** The straight piece from `a` to `b`, used for polygon sides and ink. */
export interface Segment {
  readonly kind: 'segment';
  readonly a: Vec;
  readonly b: Vec;
}

export type Curve = Line | Circle | Segment;

export const line = (point: Vec, dir: Vec): Line => ({
  kind: 'line',
  point,
  dir,
});
export const circle = (centre: Vec, radius: number): Circle => ({
  kind: 'circle',
  centre,
  radius,
});
export const segment = (a: Vec, b: Vec): Segment => ({ kind: 'segment', a, b });

/** The foot of the perpendicular from `p` to the line. */
export function project(p: Vec, l: Line): Vec {
  return add(l.point, scale(l.dir, dot(sub(p, l.point), l.dir)));
}
