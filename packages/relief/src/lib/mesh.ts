import { signedArea, type P2, type P3 } from './skeleton.js';

/**
 * A closed triangle mesh: `positions` holds x, y, z for each corner and
 * `triangles` three corner numbers for each triangle, counter-clockwise
 * seen from outside. Millimetres.
 */
export interface Mesh {
  readonly positions: Float64Array;
  readonly triangles: Uint32Array;
}

/** Corners closer than this are one corner (millimetres). */
export const WELD = 1e-5;

/**
 * Corners shared by faces, each kept once: a corner within WELD of one
 * already seen is that one.
 */
export class Corners {
  readonly points: P3[] = [];
  private readonly grid = new Map<string, number[]>();
  private key(i: number, j: number, k: number) {
    return `${i},${j},${k}`;
  }
  id(p: P3): number {
    const i = Math.floor(p.x / WELD);
    const j = Math.floor(p.y / WELD);
    const k = Math.floor(p.z / WELD);
    for (let a = -1; a <= 1; a++)
      for (let b = -1; b <= 1; b++)
        for (let c = -1; c <= 1; c++) {
          const near = this.grid.get(this.key(i + a, j + b, k + c));
          if (!near) continue;
          for (const n of near) {
            const q = this.points[n]!;
            if (
              Math.abs(q.x - p.x) <= WELD &&
              Math.abs(q.y - p.y) <= WELD &&
              Math.abs(q.z - p.z) <= WELD
            )
              return n;
          }
        }
    const n = this.points.length;
    this.points.push(p);
    const at = this.key(i, j, k);
    const list = this.grid.get(at);
    if (list) list.push(n);
    else this.grid.set(at, [n]);
    return n;
  }
}

/** A face as corner numbers, without corners repeated next to each other. */
function indexed(corners: Corners, face: readonly P3[]): number[] {
  const out: number[] = [];
  for (const p of face) {
    const n = corners.id(p);
    if (out[out.length - 1] !== n) out.push(n);
  }
  while (out.length > 1 && out[0] === out[out.length - 1]) out.pop();
  return out;
}

/**
 * Where one face has a corner partway along another face's edge (a T),
 * the edge is given that corner too, so the two faces share their edges
 * exactly and the mesh closes.
 */
function joinTs(points: readonly P3[], faces: number[][]): number[][] {
  const CELL = 2;
  const grid = new Map<string, number[]>();
  const used = new Set<number>();
  for (const f of faces) for (const n of f) used.add(n);
  for (const n of used) {
    const p = points[n]!;
    const key = `${Math.floor(p.x / CELL)},${Math.floor(p.y / CELL)}`;
    const list = grid.get(key);
    if (list) list.push(n);
    else grid.set(key, [n]);
  }
  return faces.map((face) => {
    const out: number[] = [];
    for (let i = 0; i < face.length; i++) {
      const an = face[i]!;
      const bn = face[(i + 1) % face.length]!;
      out.push(an);
      const a = points[an]!;
      const b = points[bn]!;
      const ab = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
      const len2 = ab.x * ab.x + ab.y * ab.y + ab.z * ab.z;
      if (len2 === 0) continue;
      const on: { n: number; u: number }[] = [];
      const x0 = Math.floor((Math.min(a.x, b.x) - WELD) / CELL);
      const x1 = Math.floor((Math.max(a.x, b.x) + WELD) / CELL);
      const y0 = Math.floor((Math.min(a.y, b.y) - WELD) / CELL);
      const y1 = Math.floor((Math.max(a.y, b.y) + WELD) / CELL);
      for (let gx = x0; gx <= x1; gx++)
        for (let gy = y0; gy <= y1; gy++) {
          const list = grid.get(`${gx},${gy}`);
          if (!list) continue;
          for (const n of list) {
            if (n === an || n === bn) continue;
            const p = points[n]!;
            const ap = { x: p.x - a.x, y: p.y - a.y, z: p.z - a.z };
            const u = (ap.x * ab.x + ap.y * ab.y + ap.z * ab.z) / len2;
            if (u <= 0 || u >= 1) continue;
            const dx = ap.x - ab.x * u;
            const dy = ap.y - ab.y * u;
            const dz = ap.z - ab.z * u;
            if (dx * dx + dy * dy + dz * dz <= WELD * WELD) on.push({ n, u });
          }
        }
      on.sort((p, q) => p.u - q.u);
      for (const { n } of on) out.push(n);
    }
    return out;
  });
}

/** Corners whose sides turn by less than this sine are on a straight side. */
const STRAIGHT = 1e-6;

/** Newell's normal of a face (not of unit length). */
function normalOf(points: readonly P3[], face: readonly number[]): P3 {
  let x = 0;
  let y = 0;
  let z = 0;
  for (let i = 0; i < face.length; i++) {
    const p = points[face[i]!]!;
    const q = points[face[(i + 1) % face.length]!]!;
    x += (p.y - q.y) * (p.z + q.z);
    y += (p.z - q.z) * (p.x + q.x);
    z += (p.x - q.x) * (p.y + q.y);
  }
  return { x, y, z };
}

/**
 * Cuts a flat face into triangles. A convex face with corners along its
 * sides is fanned from a new corner at its middle, so no triangle is
 * flat; other faces are cut ear by ear.
 */
function triangulate(points: P3[], face: readonly number[], out: number[]) {
  const nrm = normalOf(points, face);
  const ax = Math.abs(nrm.x);
  const ay = Math.abs(nrm.y);
  const az = Math.abs(nrm.z);
  const size = Math.hypot(nrm.x, nrm.y, nrm.z);
  if (size < 1e-12) return;
  // Look along the largest part of the normal, keeping counter-clockwise.
  const flat: P2[] = face.map((n) => {
    const p = points[n]!;
    if (az >= ax && az >= ay) return { x: p.x, y: nrm.z > 0 ? p.y : -p.y };
    if (ax >= ay) return { x: p.y, y: nrm.x > 0 ? p.z : -p.z };
    return { x: p.z, y: nrm.y > 0 ? p.x : -p.x };
  });
  const m = face.length;
  if (m === 3) {
    out.push(face[0]!, face[1]!, face[2]!);
    return;
  }
  const turn = (i: number, j: number, k: number) => {
    const a = flat[i]!;
    const b = flat[j]!;
    const c = flat[k]!;
    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  };
  const scale = Math.abs(signedArea(flat));
  const tiny = scale * 1e-9;
  const bend = (i: number, j: number, k: number) => {
    const a = flat[i]!;
    const b = flat[j]!;
    const c = flat[k]!;
    const l = Math.hypot(b.x - a.x, b.y - a.y) * Math.hypot(c.x - b.x, c.y - b.y);
    return l === 0 ? 0 : turn(i, j, k) / l;
  };
  let convex = true;
  let straight = false;
  for (let i = 0; i < m; i++) {
    // The sine of the turn, so a corner nudged off its side by welding
    // counts as straight whatever the face's size.
    const t = bend((i - 1 + m) % m, i, (i + 1) % m);
    if (t < -STRAIGHT) convex = false;
    if (Math.abs(t) <= STRAIGHT) straight = true;
  }
  if (convex && !straight) {
    for (let i = 1; i < m - 1; i++) out.push(face[0]!, face[i]!, face[i + 1]!);
    return;
  }
  if (convex) {
    let cx = 0;
    let cy = 0;
    let cz = 0;
    for (const n of face) {
      cx += points[n]!.x;
      cy += points[n]!.y;
      cz += points[n]!.z;
    }
    const mid = points.length;
    points.push({ x: cx / m, y: cy / m, z: cz / m });
    for (let i = 0; i < m; i++) out.push(mid, face[i]!, face[(i + 1) % m]!);
    return;
  }
  // Ear clipping.
  const left = Array.from({ length: m }, (_, i) => i);
  const inside = (p: P2, a: P2, b: P2, c: P2) => {
    const s1 = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
    const s2 = (c.x - b.x) * (p.y - b.y) - (c.y - b.y) * (p.x - b.x);
    const s3 = (a.x - c.x) * (p.y - c.y) - (a.y - c.y) * (p.x - c.x);
    return s1 >= -tiny && s2 >= -tiny && s3 >= -tiny;
  };
  let guard = 0;
  while (left.length > 3) {
    if (++guard > m * m + 10)
      throw new Error('A carved face could not be cut into triangles.');
    let cut = false;
    for (let e = 0; e < left.length; e++) {
      const i = left[(e - 1 + left.length) % left.length]!;
      const j = left[e]!;
      const k = left[(e + 1) % left.length]!;
      if (bend(i, j, k) <= STRAIGHT) continue;
      const a = flat[i]!;
      const b = flat[j]!;
      const c = flat[k]!;
      let blocked = false;
      for (const o of left) {
        if (o === i || o === j || o === k) continue;
        const p = flat[o]!;
        if ((p.x === a.x && p.y === a.y) || (p.x === c.x && p.y === c.y)) continue;
        if (inside(p, a, b, c)) {
          blocked = true;
          break;
        }
      }
      if (blocked) continue;
      out.push(face[i]!, face[j]!, face[k]!);
      left.splice(e, 1);
      cut = true;
      break;
    }
    if (!cut) throw new Error('A carved face could not be cut into triangles.');
  }
  if (turn(left[0]!, left[1]!, left[2]!) > tiny)
    out.push(face[left[0]!]!, face[left[1]!]!, face[left[2]!]!);
}

/** Every edge used once each way: the mesh is closed and faces outwards. */
export function openEdges(mesh: Mesh): number {
  const { triangles } = mesh;
  const count = new Map<string, number>();
  for (let t = 0; t < triangles.length; t += 3)
    for (let e = 0; e < 3; e++) {
      const a = triangles[t + e]!;
      const b = triangles[t + ((e + 1) % 3)]!;
      const key = `${a},${b}`;
      count.set(key, (count.get(key) ?? 0) + 1);
    }
  let bad = 0;
  for (const [key, n] of count) {
    const [a, b] = key.split(',');
    if (n !== 1 || count.get(`${b},${a}`) !== 1) bad++;
  }
  return bad;
}

export function volumeOf(mesh: Mesh): number {
  const { positions: p, triangles } = mesh;
  let v = 0;
  for (let t = 0; t < triangles.length; t += 3) {
    const a = triangles[t]! * 3;
    const b = triangles[t + 1]! * 3;
    const c = triangles[t + 2]! * 3;
    v +=
      p[a]! * (p[b + 1]! * p[c + 2]! - p[b + 2]! * p[c + 1]!) -
      p[a + 1]! * (p[b]! * p[c + 2]! - p[b + 2]! * p[c]!) +
      p[a + 2]! * (p[b]! * p[c + 1]! - p[b + 1]! * p[c]!);
  }
  return v / 6;
}

/** Clips a face that is not upright to the inside of a convex outline
 * (counter-clockwise); its height is carried along its own plane. */
export function clip(face: readonly P3[], outline: readonly P2[]): P3[] {
  let poly = face.slice();
  for (let i = 0; i < outline.length && poly.length; i++) {
    const a = outline[i]!;
    const b = outline[(i + 1) % outline.length]!;
    const side = (p: P2) => (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
    const next: P3[] = [];
    for (let k = 0; k < poly.length; k++) {
      const p = poly[k]!;
      const q = poly[(k + 1) % poly.length]!;
      const sp = side(p);
      const sq = side(q);
      if (sp >= 0) next.push(p);
      if ((sp >= 0) !== (sq >= 0)) {
        // Always measure from the same end, so two faces sharing this
        // edge find the same crossing.
        const [u, v, su, sv] =
          p.x < q.x || (p.x === q.x && p.y < q.y) ? [p, q, sp, sq] : [q, p, sq, sp];
        const t = su / (su - sv);
        next.push({
          x: u.x + (v.x - u.x) * t,
          y: u.y + (v.y - u.y) * t,
          z: u.z + (v.z - u.z) * t,
        });
      }
    }
    poly = next;
  }
  return poly;
}

/**
 * A face that is not upright, as convex parts: itself when it is convex
 * (seen from above), else its triangles, cut ear by ear.
 */
export function convexParts(face: readonly P3[]): (readonly P3[])[] {
  const m = face.length;
  const turn = (a: P3, b: P3, c: P3) =>
    (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  let size = 0;
  for (const p of face) size = Math.max(size, Math.abs(p.x), Math.abs(p.y), 1);
  const tiny = size * size * 1e-12;
  const area = signedArea(face);
  // Upright faces, and faces too small to matter, stay as they are.
  if (Math.abs(area) <= tiny) return [face];
  const sign = Math.sign(area);
  let convex = true;
  for (let i = 0; i < m && convex; i++)
    if (sign * turn(face[(i - 1 + m) % m]!, face[i]!, face[(i + 1) % m]!) < -tiny) convex = false;
  if (convex) return [face];
  const left = face.slice();
  const out: P3[][] = [];
  const inside = (p: P3, a: P3, b: P3, c: P3) =>
    sign * turn(a, b, p) >= -tiny && sign * turn(b, c, p) >= -tiny && sign * turn(c, a, p) >= -tiny;
  let guard = 0;
  while (left.length > 3) {
    if (++guard > m * m + 10) throw new Error('A carved face could not be cut into parts.');
    let cut = false;
    for (let e = 0; e < left.length; e++) {
      const a = left[(e - 1 + left.length) % left.length]!;
      const b = left[e]!;
      const c = left[(e + 1) % left.length]!;
      if (sign * turn(a, b, c) <= tiny) continue;
      if (left.some((p) => p !== a && p !== b && p !== c && inside(p, a, b, c))) continue;
      out.push([a, b, c]);
      left.splice(e, 1);
      cut = true;
      break;
    }
    if (!cut) throw new Error('A carved face could not be cut into parts.');
  }
  out.push(left);
  return out;
}

/** An outline moved inward by d along each side (convex, counter-clockwise). */
export function inset(outline: readonly P2[], d: number): P2[] {
  const m = outline.length;
  const lines = outline.map((p, i) => {
    const q = outline[(i + 1) % m]!;
    const len = Math.hypot(q.x - p.x, q.y - p.y);
    const n = { x: -(q.y - p.y) / len, y: (q.x - p.x) / len };
    return { n, c: n.x * p.x + n.y * p.y + d };
  });
  return outline.map((_, i) => {
    const a = lines[(i - 1 + m) % m]!;
    const b = lines[i]!;
    const det = a.n.x * b.n.y - a.n.y * b.n.x;
    return {
      x: (a.c * b.n.y - b.c * a.n.y) / det,
      y: (a.n.x * b.c - b.n.x * a.c) / det,
    };
  });
}

/** Is p on the boundary of a convex outline? */
function onOutline(p: P2, outline: readonly P2[], tol: number): boolean {
  for (let i = 0; i < outline.length; i++) {
    const a = outline[i]!;
    const b = outline[(i + 1) % outline.length]!;
    const ab = { x: b.x - a.x, y: b.y - a.y };
    const len = Math.hypot(ab.x, ab.y);
    const s = Math.abs(ab.x * (p.y - a.y) - ab.y * (p.x - a.x)) / len;
    const u = (ab.x * (p.x - a.x) + ab.y * (p.y - a.y)) / (len * len);
    if (s <= tol && u >= -1e-9 && u <= 1 + 1e-9) return true;
  }
  return false;
}

export interface Solid {
  /** The carved top, as flat faces facing up, not upright anywhere. */
  readonly surface: readonly (readonly P3[])[];
  /** The panel's outline, convex and counter-clockwise. */
  readonly outline: readonly P2[];
  /** A plain border this wide around the carving, at `top`. */
  readonly frame: number;
  readonly top: number;
}

/** Faces welded and joined at their Ts, with the directed edges they use. */
function joined(faces: readonly (readonly P3[])[]) {
  const corners = new Corners();
  const indexedFaces = faces
    .map((f) => indexed(corners, f))
    .filter((f) => f.length >= 3);
  const list = joinTs(corners.points, indexedFaces);
  const seen = new Set<string>();
  for (const f of list)
    for (let i = 0; i < f.length; i++) seen.add(`${f[i]},${f[(i + 1) % f.length]}`);
  return { points: corners.points, faces: list, seen };
}

/** A convex outline cut to a convex cell (both counter-clockwise). */
export function clipOutline(outline: readonly P2[], cell: readonly P2[]): P2[] {
  return clip(
    outline.map((p) => ({ x: p.x, y: p.y, z: 0 })),
    cell,
  ).map((p) => ({ x: p.x, y: p.y }));
}

/** Is p on the boundary of the convex outline? */
export function isOnOutline(p: P2, outline: readonly P2[], tol = 1e-4): boolean {
  return onOutline(p, outline, tol);
}

/**
 * The top of a solid over its outline: the carved surface clipped inside
 * the frame, and when there is a frame, upright walls from the carving up
 * to it and the frame itself at `top`. Its edge lies on the outline.
 *
 * Given a `cell` (convex), only the part of it over the cell: the frame
 * is the whole outline's frame, and along the cell's sides (the seams
 * with the next parts) the top stops with no wall, for `standOn` to close.
 */
export function topOf(solid: Solid, cell?: readonly P2[]): P3[][] {
  const { outline, frame, top } = solid;
  const whole = frame > 0 ? inset(outline, frame) : outline.slice();
  const inner = cell ? clipOutline(whole, cell) : whole;
  const surface: P3[][] = [];
  if (inner.length < 3) return frameOver(outline, whole, top, cell);
  // A concave face cut by the outline can fold back along it; its convex
  // parts cut cleanly.
  for (const whole of solid.surface)
    for (const face of convexParts(whole)) {
      const cut = clip(face, inner);
      if (cut.length >= 3) surface.push(cut);
    }
  if (frame <= 0) return surface;
  const at = (p: P2, z: number): P3 => ({ x: p.x, y: p.y, z });
  const { points, faces, seen } = joined(surface);
  const out: P3[][] = faces.map((f) => f.map((n) => points[n]!));
  for (const f of faces)
    for (let i = 0; i < f.length; i++) {
      const an = f[i]!;
      const bn = f[(i + 1) % f.length]!;
      if (an === bn || seen.has(`${bn},${an}`)) continue;
      const p = points[an]!;
      const q = points[bn]!;
      const mid = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
      if (p.x === q.x && p.y === q.y) continue;
      if (cell && onOutline(mid, cell, 1e-4) && !onOutline(mid, whole, 1e-4)) continue;
      checkOnOutline(p, q, whole);
      out.push([at(q, top), q, p, at(p, top)]);
    }
  out.push(...frameOver(outline, whole, top, cell));
  return out;
}

/** The frame between an outline and its inset, at `top`, over a cell. */
function frameOver(
  outline: readonly P2[],
  inner: readonly P2[],
  top: number,
  cell: readonly P2[] | undefined,
): P3[][] {
  const at = (p: P2): P3 => ({ x: p.x, y: p.y, z: top });
  const out: P3[][] = [];
  const m = outline.length;
  for (let i = 0; i < m; i++) {
    const k = (i + 1) % m;
    const quad = [at(outline[i]!), at(outline[k]!), at(inner[k]!), at(inner[i]!)];
    const cut = cell ? clip(quad, cell) : quad;
    if (cut.length >= 3 && Math.abs(signedArea(cut)) > 1e-12) out.push(cut);
  }
  return out;
}

function checkOnOutline(p: P2, q: P2, outline: readonly P2[]) {
  const mid = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
  if (!onOutline(mid, outline, 1e-4))
    throw new Error(
      `The carved surface has a gap at (${mid.x.toFixed(3)}, ${mid.y.toFixed(3)}) mm.`,
    );
}

/** A round hole for an alignment pin, across a seam: its centre on the
 * outline and its height. It runs square into the solid. */
export interface Pin {
  readonly centre: P2;
  readonly z: number;
}

/** Pin holes take 1.75 mm filament: 2 mm across, 6 mm deep, 16 sides. */
export const PIN_HOLE = { across: 2, depth: 6, sides: 16 } as const;

/** The hole's corner radius, so the circle 2 mm across fits inside it. */
const PIN_R = PIN_HOLE.across / 2 / Math.cos(Math.PI / PIN_HOLE.sides);

/** The volume of one pin hole, mm³. */
export function pinHoleVolume(): number {
  const n = PIN_HOLE.sides;
  return (n / 2) * PIN_R * PIN_R * Math.sin((2 * Math.PI) / n) * PIN_HOLE.depth;
}

/**
 * A top standing on the table: upright walls from its edge (which must
 * lie on the outline) down to `base`, and a flat bottom there. Throws
 * when the top has a gap, rather than close it with a guess. Each pin
 * cuts its hole into the wall it lies on.
 */
export function standOn(
  top: readonly (readonly P3[])[],
  outline: readonly P2[],
  base = 0,
  pins: readonly Pin[] = [],
): Mesh {
  const { points, faces, seen } = joined(top);
  const out: P3[][] = faces.map((f) => f.map((n) => points[n]!));
  const m = outline.length;
  // The pins on each side of the outline, as distances along it.
  const holes = new Map<number, { s: number; z: number }[]>();
  for (const pin of pins) {
    const side = sideOf(pin.centre, outline);
    if (side < 0) throw new Error(`A pin at (${pin.centre.x.toFixed(2)}, ${pin.centre.y.toFixed(2)}) mm is off the outline.`);
    const a = outline[side]!;
    const s = Math.hypot(pin.centre.x - a.x, pin.centre.y - a.y);
    const list = holes.get(side) ?? [];
    list.push({ s, z: pin.z });
    holes.set(side, list);
  }
  const along = new Map<number, { s0: number; z0: number; s1: number; z1: number }[]>();
  for (const f of faces)
    for (let i = 0; i < f.length; i++) {
      const an = f[i]!;
      const bn = f[(i + 1) % f.length]!;
      if (an === bn || seen.has(`${bn},${an}`)) continue;
      const p = points[an]!;
      const q = points[bn]!;
      // An upright edge on the outline closes against the walls beside it.
      if (p.x === q.x && p.y === q.y) continue;
      checkOnOutline(p, q, outline);
      const side = holes.size ? sideOf({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }, outline) : -1;
      if (side >= 0 && holes.has(side)) {
        const a = outline[side]!;
        const s = (r: P2) => Math.hypot(r.x - a.x, r.y - a.y);
        const list = along.get(side) ?? [];
        list.push({ s0: s(p), z0: p.z, s1: s(q), z1: q.z });
        along.set(side, list);
        continue;
      }
      out.push([p, { ...p, z: base }, { ...q, z: base }, q]);
    }
  for (const [side, edges] of along) {
    const a = outline[side]!;
    const b = outline[(side + 1) % m]!;
    out.push(...wallWithHoles(a, b, edges, holes.get(side)!, base));
  }
  out.push(outline.map((p) => ({ ...p, z: base })).reverse());
  return meshOf(out);
}

/** Which side of a convex outline p lies on (-1 for none). */
function sideOf(p: P2, outline: readonly P2[]): number {
  for (let i = 0; i < outline.length; i++)
    if (onOutline(p, [outline[i]!, outline[(i + 1) % outline.length]!], 1e-4)) return i;
  return -1;
}

/**
 * The wall under one side of the outline, from a to b, with round holes
 * running into the solid. Away from the holes it is cut as usual, one
 * upright quad under each edge of the top. Over each hole's width it is
 * a face below the hole and a face above it up to the top.
 */
function wallWithHoles(
  a: P2,
  b: P2,
  edges: readonly { s0: number; z0: number; s1: number; z1: number }[],
  holes: readonly { s: number; z: number }[],
  base: number,
): P3[][] {
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const d = { x: (b.x - a.x) / len, y: (b.y - a.y) / len };
  const inward = { x: -d.y, y: d.x };
  const at = (s: number, z: number, deep = 0): P3 => ({
    x: a.x + d.x * s + inward.x * deep,
    y: a.y + d.y * s + inward.y * deep,
    z,
  });
  const n = PIN_HOLE.sides;
  const cols = holes
    .map((h) => ({ ...h, s0: h.s - PIN_R, s1: h.s + PIN_R, profile: [] as { s: number; z: number }[] }))
    .sort((p, q) => p.s - q.s);
  for (let i = 0; i < cols.length; i++) {
    const c = cols[i]!;
    if (c.s0 <= 1e-6 || c.s1 >= len - 1e-6 || (i > 0 && cols[i - 1]!.s1 >= c.s0))
      throw new Error('A pin hole runs off its seam or into another.');
  }
  const out: P3[][] = [];
  const sorted = edges.slice().sort((p, q) => p.s0 - q.s0);
  for (const e of sorted) {
    const cuts = [e.s0, e.s1];
    for (const c of cols) for (const s of [c.s0, c.s1]) if (s > e.s0 && s < e.s1) cuts.push(s);
    cuts.sort((p, q) => p - q);
    const zAt = (s: number) => e.z0 + ((e.z1 - e.z0) * (s - e.s0)) / (e.s1 - e.s0);
    for (let k = 0; k + 1 < cuts.length; k++) {
      const s0 = cuts[k]!;
      const s1 = cuts[k + 1]!;
      if (s1 - s0 <= 0) continue;
      const mid = (s0 + s1) / 2;
      const col = cols.find((c) => mid > c.s0 && mid < c.s1);
      if (col) {
        const last = col.profile[col.profile.length - 1];
        if (!last || last.s !== s0 || last.z !== zAt(s0)) col.profile.push({ s: s0, z: zAt(s0) });
        col.profile.push({ s: s1, z: zAt(s1) });
      } else out.push([at(s0, zAt(s0)), at(s0, base), at(s1, base), at(s1, zAt(s1))]);
    }
  }
  for (const c of cols) {
    const ring = Array.from({ length: n }, (_, k) => {
      const t = (2 * Math.PI * k) / n;
      return { s: c.s + PIN_R * Math.cos(t), z: c.z + PIN_R * Math.sin(t) };
    });
    const top = c.profile;
    if (!top.length || top[0]!.s - c.s0 > 1e-6 || c.s1 - top[top.length - 1]!.s > 1e-6)
      throw new Error('A pin hole is not under the top of its seam.');
    if (Math.min(...top.map((p) => p.z)) <= c.z + PIN_R || c.z - PIN_R <= base)
      throw new Error('A pin hole does not fit in its seam.');
    // Below the hole: across the bottom, then back along the hole's lower half.
    const below: P3[] = [at(c.s0, c.z), at(c.s0, base), at(c.s1, base)];
    for (let k = 0; k > -n / 2; k--) {
      const r = ring[(k + n) % n]!;
      below.push(at(r.s, r.z));
    }
    out.push(below);
    // Above it: along the hole's upper half, then back along the top.
    const above: P3[] = [];
    for (let k = n / 2; k >= 0; k--) above.push(at(ring[k]!.s, ring[k]!.z));
    for (let k = top.length - 1; k >= 0; k--) above.push(at(top[k]!.s, top[k]!.z));
    out.push(above);
    // The hole itself and its end.
    const depth = PIN_HOLE.depth;
    for (let k = 0; k < n; k++) {
      const p = ring[k]!;
      const q = ring[(k + 1) % n]!;
      out.push([at(p.s, p.z), at(q.s, q.z), at(q.s, q.z, depth), at(p.s, p.z, depth)]);
    }
    out.push(ring.map((r) => at(r.s, r.z, depth)));
  }
  return out;
}

/**
 * The closed solid under a carved top: the top clipped to the outline
 * (inside the frame), upright walls down to the table or up to the frame,
 * the frame, the outer walls and the flat bottom.
 */
export function closeSolid(solid: Solid): Mesh {
  return standOn(topOf(solid), solid.outline);
}

/** Welds, joins the Ts and cuts the faces into triangles. */
export function meshOf(faces: readonly (readonly P3[])[]): Mesh {
  const corners = new Corners();
  const indexedFaces = faces
    .map((f) => indexed(corners, f))
    .filter((f) => f.length >= 3);
  const joined = joinTs(corners.points, indexedFaces);
  const points = corners.points;
  const tris: number[] = [];
  for (const f of joined) triangulate(points, f, tris);
  const positions = new Float64Array(points.length * 3);
  points.forEach((p, i) => {
    positions[i * 3] = p.x;
    positions[i * 3 + 1] = p.y;
    positions[i * 3 + 2] = p.z;
  });
  return { positions, triangles: Uint32Array.from(tris) };
}
