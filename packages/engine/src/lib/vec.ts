/** A point or a direction in the plane, in units of OA. */
export interface Vec {
  readonly x: number;
  readonly y: number;
}

export const vec = (x: number, y: number): Vec => ({ x, y });
export const add = (a: Vec, b: Vec): Vec => vec(a.x + b.x, a.y + b.y);
export const sub = (a: Vec, b: Vec): Vec => vec(a.x - b.x, a.y - b.y);
export const scale = (a: Vec, s: number): Vec => vec(a.x * s, a.y * s);
export const dot = (a: Vec, b: Vec): number => a.x * b.x + a.y * b.y;
/** The z component of a × b: positive when b is counter-clockwise from a. */
export const cross = (a: Vec, b: Vec): number => a.x * b.y - a.y * b.x;
export const length = (a: Vec): number => Math.hypot(a.x, a.y);
export const distance = (a: Vec, b: Vec): number =>
  Math.hypot(a.x - b.x, a.y - b.y);
/** a turned 90° counter-clockwise. */
export const perp = (a: Vec): Vec => vec(-a.y, a.x);
export const midpoint = (a: Vec, b: Vec): Vec =>
  vec((a.x + b.x) / 2, (a.y + b.y) / 2);

export function normalize(a: Vec): Vec {
  const l = length(a);
  if (l === 0) throw new Error('Cannot normalize a zero vector');
  return scale(a, 1 / l);
}

/** a rotated counter-clockwise about the origin by `radians`. */
export function rotate(a: Vec, radians: number): Vec {
  const c = Math.cos(radians);
  const s = Math.sin(radians);
  return vec(a.x * c - a.y * s, a.x * s + a.y * c);
}

/** Direction of a from the origin in degrees, in [0, 360). */
export function angleDeg(a: Vec): number {
  const deg = (Math.atan2(a.y, a.x) * 180) / Math.PI;
  return deg < 0 ? deg + 360 : deg;
}
