import { convexParts, joined, WELD } from './mesh.js';
import type { P2, P3 } from './skeleton.js';

/**
 * Woven bands. At each crossing the band underneath is lowered where the
 * band on top covers it, by `gap` below the top band's edge, and climbs
 * back to full height along a straight slope on each side. The carving
 * beside the lowered band is trimmed to its height, so the band does not
 * sit in a slot; a piece left level keeps its height, and stands over the
 * band by a short wall. The top stays made of flat faces, and every place
 * where neighbouring faces end at different heights gets an upright wall,
 * so the solid stays closed.
 */

/** What a face of the carved top is: part of a band, part of the carving
 * beside it, or the inside of a piece left level. */
export type Tag = 'band' | 'field' | 'level';

export interface TaggedFace {
  readonly face: P3[];
  readonly tag: Tag;
}

/** A crossing in millimetres: where, and the directions (unit vectors) of
 * the band on top and of the band underneath. */
export interface Crossing {
  readonly at: P2;
  readonly over: P2;
  readonly under: P2;
}

export interface WeaveOptions {
  /** How far the band underneath passes below the top band's edge. */
  readonly gap: number;
  /** The bands' width, and how far their edges lie below the top. */
  readonly band: number;
  readonly edge: number;
  /** The height of the top of the bands. */
  readonly top: number;
}

/** The slope back up runs at most this many band widths. */
export const RAMP = 3;

/** A face being woven: its corners, their heights before the weave
 * (`z0`), and what it is. Always convex seen from above. */
interface WFace {
  p: P3[];
  z0: number[];
  tag: Tag;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

function wface(p: P3[], z0: number[], tag: Tag): WFace {
  const xs = p.map((q) => q.x);
  const ys = p.map((q) => q.y);
  return {
    p,
    z0,
    tag,
    x0: Math.min(...xs),
    x1: Math.max(...xs),
    y0: Math.min(...ys),
    y1: Math.max(...ys),
  };
}

/** A convex face cut by a value that is linear over it: the part where it
 * is at least 0, and the part where it is below. Cut points are worked
 * from the same end of an edge in every face, so neighbours agree. */
function cutFace(f: WFace, value: (p: P3, k: number) => number): [WFace | undefined, WFace | undefined] {
  const v = f.p.map(value);
  if (v.every((x) => x >= -1e-12)) return [f, undefined];
  if (v.every((x) => x <= 1e-12)) return [undefined, f];
  const inP: P3[] = [];
  const inZ: number[] = [];
  const outP: P3[] = [];
  const outZ: number[] = [];
  const m = f.p.length;
  for (let k = 0; k < m; k++) {
    const j = (k + 1) % m;
    const a = f.p[k]!;
    const b = f.p[j]!;
    const va = v[k]!;
    const vb = v[j]!;
    if (va >= 0) {
      inP.push(a);
      inZ.push(f.z0[k]!);
    }
    if (va <= 0) {
      outP.push(a);
      outZ.push(f.z0[k]!);
    }
    if ((va > 0 && vb < 0) || (va < 0 && vb > 0)) {
      const swap = a.x > b.x || (a.x === b.x && a.y > b.y);
      const [u, w, vu, vw, zu, zw] = swap
        ? [b, a, vb, va, f.z0[j]!, f.z0[k]!]
        : [a, b, va, vb, f.z0[k]!, f.z0[j]!];
      const t = vu / (vu - vw);
      const q = { x: u.x + (w.x - u.x) * t, y: u.y + (w.y - u.y) * t, z: u.z + (w.z - u.z) * t };
      const z0 = zu + (zw - zu) * t;
      inP.push(q);
      inZ.push(z0);
      outP.push(q);
      outZ.push(z0);
    }
  }
  return [
    inP.length >= 3 ? wface(inP, inZ, f.tag) : undefined,
    outP.length >= 3 ? wface(outP, outZ, f.tag) : undefined,
  ];
}

/** One side of a crossing, where the band underneath is lowered. */
interface Dip {
  readonly c: P2;
  /** Along the band underneath, away from the crossing; across it; and
   * across the top band, toward this side. */
  readonly du: P2;
  readonly nu: P2;
  readonly no: P2;
  /** How far the slope runs, across the top band's edge. */
  readonly length: number;
  /** How far beside the lowered band the carving is trimmed. */
  readonly reach: number;
}

const dot = (a: P2, b: P2) => a.x * b.x + a.y * b.y;

/**
 * The carved top with its bands woven at the crossings. `corners` are the
 * pieces' corners: where a band bends or meets another, so the slopes
 * stop short of them. Returns the faces, walls included, and how many
 * sides of crossings were lowered.
 */
export function weaveTop(
  faces: readonly TaggedFace[],
  crossings: readonly Crossing[],
  corners: readonly P2[],
  o: WeaveOptions,
): { faces: P3[][]; dips: number } {
  const half = o.band / 2;
  const drop = o.gap + o.edge;
  const dips = dipsFor(crossings, corners, o.band);
  let list: WFace[] = [];
  for (const { face, tag } of faces)
    for (const part of convexParts(face))
      list.push(wface(part.slice(), part.map((p) => p.z), tag));
  for (const d of dips) {
    const side = half + d.reach;
    // The dip's corners, for a quick test of which faces it may touch.
    const box = [0, d.length].flatMap((e) =>
      [-side, side].map((n) => {
        // Solve (p - c)·no = half + e and (p - c)·nu = n.
        const a = d.no;
        const b = d.nu;
        const det = a.x * b.y - a.y * b.x;
        const r1 = half + e;
        return { x: d.c.x + (r1 * b.y - n * a.y) / det, y: d.c.y + (a.x * n - b.x * r1) / det };
      }),
    );
    const bx0 = Math.min(...box.map((p) => p.x));
    const bx1 = Math.max(...box.map((p) => p.x));
    const by0 = Math.min(...box.map((p) => p.y));
    const by1 = Math.max(...box.map((p) => p.y));
    const e = (p: P3) => (p.x - d.c.x) * d.no.x + (p.y - d.c.y) * d.no.y - half;
    const n = (p: P3) => (p.x - d.c.x) * d.nu.x + (p.y - d.c.y) * d.nu.y;
    const lowered = (p: P3) => drop * (1 - e(p) / d.length);
    const bounds = [
      (p: P3) => e(p),
      (p: P3) => d.length - e(p),
      (p: P3) => side - n(p),
      (p: P3) => side + n(p),
    ];
    const next: WFace[] = [];
    for (const f of list) {
      if (f.tag === 'level' || f.x1 < bx0 || f.x0 > bx1 || f.y1 < by0 || f.y0 > by1) {
        next.push(f);
        continue;
      }
      // Cut away what lies outside the dip, keeping it as it is.
      let inside: WFace | undefined = f;
      for (const bound of bounds) {
        if (!inside) break;
        const [keep, away] = cutFace(inside, bound);
        if (away) next.push(away);
        inside = keep;
      }
      if (!inside) continue;
      const k = inside.p.length;
      const mid: P3 = {
        x: inside.p.reduce((sum, p) => sum + p.x, 0) / k,
        y: inside.p.reduce((sum, p) => sum + p.y, 0) / k,
        z: 0,
      };
      if (inside.tag === 'band' && Math.abs(n(mid)) > half + 1e-6) {
        next.push(inside);
        continue;
      }
      // A band is lowered as a whole; the carving beside it is trimmed.
      const target =
        inside.tag === 'band'
          ? (p: P3, k: number) => inside!.z0[k]! - lowered(p)
          : (p: P3) => o.top - o.edge - lowered(p);
      const [above, below] = cutFace(inside, (p, k) => p.z - target(p, k));
      if (below) next.push(below);
      if (above)
        next.push(
          wface(
            above.p.map((p, k) => ({ ...p, z: Math.min(p.z, target(p, k)) })),
            above.z0,
            above.tag,
          ),
        );
    }
    list = next;
  }
  const out = list.map((f) => f.p);
  return { faces: [...out, ...walls(out)], dips: dips.length };
}

/** The sides of each crossing to lower, with slopes that stop halfway to
 * the next corner along the band underneath. */
function dipsFor(crossings: readonly Crossing[], corners: readonly P2[], band: number): Dip[] {
  const half = band / 2;
  const CELL = Math.max(band * 4, 1);
  const grid = new Map<string, P2[]>();
  for (const p of corners) {
    const key = `${Math.floor(p.x / CELL)},${Math.floor(p.y / CELL)}`;
    const list = grid.get(key);
    if (list) list.push(p);
    else grid.set(key, [p]);
  }
  const out: Dip[] = [];
  for (const c of crossings) {
    const sin = Math.abs(c.over.x * c.under.y - c.over.y * c.under.x);
    if (sin < 0.05) continue;
    // Along the band underneath, the top band's edge is this far away.
    const clear = half / sin;
    const search = RAMP * band + clear + band;
    const reach = Math.ceil(search / CELL);
    const gx = Math.floor(c.at.x / CELL);
    const gy = Math.floor(c.at.y / CELL);
    for (const sign of [1, -1]) {
      const du = { x: c.under.x * sign, y: c.under.y * sign };
      const nu = { x: -du.y, y: du.x };
      let no = { x: -c.over.y, y: c.over.x };
      if (dot(no, du) < 0) no = { x: -no.x, y: -no.y };
      let run = search * 2;
      for (let i = -reach; i <= reach; i++)
        for (let j = -reach; j <= reach; j++)
          for (const p of grid.get(`${gx + i},${gy + j}`) ?? []) {
            const rel = { x: p.x - c.at.x, y: p.y - c.at.y };
            const t = dot(rel, du);
            if (t > 1e-4 && Math.abs(dot(rel, nu)) < 1e-4) run = Math.min(run, t);
          }
      const along = Math.min(RAMP * band, run / 2 - clear);
      if (along < band / 4) continue;
      out.push({ c: c.at, du, nu, no, length: along * dot(no, du), reach: band });
    }
  }
  return out;
}

/**
 * Upright walls wherever two faces meet along an edge at different
 * heights: each wall fills the gap between the two edges, from one face's
 * edge down (or up) to the other's.
 */
export function walls(faces: readonly (readonly P3[])[]): P3[][] {
  const { points, faces: list, seen } = joined(faces);
  const open: [P3, P3][] = [];
  for (const f of list)
    for (let i = 0; i < f.length; i++) {
      const a = f[i]!;
      const b = f[(i + 1) % f.length]!;
      if (a === b || seen.has(`${b},${a}`)) continue;
      const p = points[a]!;
      const q = points[b]!;
      if (Math.hypot(q.x - p.x, q.y - p.y) < WELD) continue;
      open.push([p, q]);
    }
  const CELL = 2;
  const grid = new Map<string, number[]>();
  open.forEach(([p, q], k) => {
    for (let gx = Math.floor(Math.min(p.x, q.x) / CELL); gx <= Math.floor(Math.max(p.x, q.x) / CELL); gx++)
      for (let gy = Math.floor(Math.min(p.y, q.y) / CELL); gy <= Math.floor(Math.max(p.y, q.y) / CELL); gy++) {
        const key = `${gx},${gy}`;
        const at = grid.get(key);
        if (at) at.push(k);
        else grid.set(key, [k]);
      }
  });
  const out: P3[][] = [];
  open.forEach(([p, q], k) => {
    const len = Math.hypot(q.x - p.x, q.y - p.y);
    const d = { x: (q.x - p.x) / len, y: (q.y - p.y) / len };
    const across = (r: P3) => Math.abs((r.x - p.x) * d.y - (r.y - p.y) * d.x);
    const along = (r: P3) => (r.x - p.x) * d.x + (r.y - p.y) * d.y;
    const near = new Set<number>();
    for (let gx = Math.floor(Math.min(p.x, q.x) / CELL); gx <= Math.floor(Math.max(p.x, q.x) / CELL); gx++)
      for (let gy = Math.floor(Math.min(p.y, q.y) / CELL); gy <= Math.floor(Math.max(p.y, q.y) / CELL); gy++)
        for (const j of grid.get(`${gx},${gy}`) ?? []) if (j > k) near.add(j);
    for (const j of near) {
      const [r, s] = open[j]!;
      if (across(r) > 1e-6 || across(s) > 1e-6) continue;
      const tr = along(r);
      const ts = along(s);
      // The other edge must run the other way.
      if (ts >= tr) continue;
      const t0 = Math.max(0, ts);
      const t1 = Math.min(len, tr);
      if (t1 - t0 < 1e-7) continue;
      const zA = (t: number) => p.z + ((q.z - p.z) * t) / len;
      const zB = (t: number) => s.z + ((r.z - s.z) * (t - ts)) / (tr - ts);
      const at = (t: number, z: number): P3 => ({ x: p.x + d.x * t, y: p.y + d.y * t, z });
      const g0 = zA(t0) - zB(t0);
      const g1 = zA(t1) - zB(t1);
      if (Math.abs(g0) < WELD && Math.abs(g1) < WELD) continue;
      const cuts = [t0];
      if (g0 * g1 < 0) cuts.push(t0 + ((t1 - t0) * g0) / (g0 - g1));
      cuts.push(t1);
      for (let i = 0; i + 1 < cuts.length; i++) {
        const s0 = cuts[i]!;
        const s1 = cuts[i + 1]!;
        out.push([at(s1, zA(s1)), at(s0, zA(s0)), at(s0, zB(s0)), at(s1, zB(s1))]);
      }
    }
  });
  return out;
}
