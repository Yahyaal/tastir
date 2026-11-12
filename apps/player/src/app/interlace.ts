import { weave, type Pattern, type Vec, type Weave } from '@tastir/engine';

/**
 * Drawing the interlace look: the strapwork bands as usual, then at every
 * crossing a short piece of the band on top drawn again, edges and all,
 * so the band underneath seems to pass below it.
 */

const weaves = new WeakMap<Pattern, Weave>();

/** The pattern's weave (found once per pattern). */
export function weaveOf(pattern: Pattern): Weave {
  let found = weaves.get(pattern);
  if (!found) {
    found = weave(
      pattern.ink.map((s) => s.segment),
      pattern.cell,
    );
    weaves.set(pattern, found);
  }
  return found;
}

/** A short piece of the band on top at a crossing, along the band and
 * round its bends: its dark edges (`edge`), and its light middle a little
 * longer (`band`), so no seam shows where the piece meets its own band. */
export interface Patch {
  readonly edge: readonly Vec[];
  readonly band: readonly Vec[];
}

const mod = (k: number, n: number) => ((k % n) + n) % n;

/** A path's first `length`, cut part way along a piece if need be. */
function cut(path: readonly Vec[], length: number): Vec[] {
  const out: Vec[] = path.length ? [path[0] as Vec] : [];
  let left = length;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1] as Vec;
    const b = path[i] as Vec;
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    if (d >= left) {
      if (left > 0)
        out.push({
          x: a.x + ((b.x - a.x) * left) / d,
          y: a.y + ((b.y - a.y) * left) / d,
        });
      return out;
    }
    out.push(b);
    left -= d;
  }
  return out;
}

const lengthOf = (path: readonly Vec[]) =>
  path
    .slice(1)
    .reduce(
      (sum, q, k) =>
        sum + Math.hypot(q.x - (path[k] as Vec).x, q.y - (path[k] as Vec).y),
      0,
    );

/** The two halves joined into one path through the crossing. */
const through = (behind: readonly Vec[], ahead: readonly Vec[]) => [
  ...[...behind].reverse(),
  ...ahead.slice(1),
];

/**
 * The pieces of top band to draw again in the copy of the tile at slide
 * (i, j), for bands `width` wide (the band with its dark edges).
 */
export function patchesAt(
  pattern: Pattern,
  i: number,
  j: number,
  width: number,
): Patch[] {
  const w = weaveOf(pattern);
  const [m, n] = w.repeat;
  const { u, v } = pattern.cell;
  const ri = mod(i, m);
  const rj = mod(j, n);
  const dx = u.x * (i - ri) + v.x * (j - rj);
  const dy = u.y * (i - ri) + v.y * (j - rj);
  const move = (p: Vec) => ({ x: p.x + dx, y: p.y + dy });
  const out: Patch[] = [];
  for (const c of w.crossings) {
    if (c.i !== ri || c.j !== rj) continue;
    // Far enough along the top band to clear the band underneath: its
    // edges cross the top band's edges (width / 2)(1 + cos) / sin from
    // the crossing, at an angle whose sine and cosine those are. The
    // weave's paths already stop halfway to the next crossing.
    const sin = Math.abs(c.over.x * c.under.y - c.over.y * c.under.x);
    const cos = Math.abs(c.over.x * c.under.x + c.over.y * c.under.y);
    const half = ((width / 2) * (1 + cos)) / Math.max(sin, 0.05) + width * 0.1;
    // The light middle runs on past the dark edges, so the patch's square
    // end does not show across its own band.
    const side = (path: readonly Vec[]) => {
      const reach = lengthOf(path);
      return {
        edge: cut(path, Math.min(half, reach - width * 0.1)),
        band: cut(path, Math.min(half + width * 0.1, reach)),
      };
    };
    const back = side(c.behind);
    const fore = side(c.ahead);
    out.push({
      edge: through(back.edge, fore.edge).map(move),
      band: through(back.band, fore.band).map(move),
    });
  }
  return out;
}

/** How far a path runs straight from its start, and whether it then bends. */
function straightRun(path: readonly Vec[]): { run: number; bends: boolean } {
  const [a, b] = path;
  if (!a || !b) return { run: 0, bends: false };
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = Math.hypot(dx, dy);
  let run = 0;
  for (let k = 1; k < path.length; k++) {
    const p = path[k - 1] as Vec;
    const q = path[k] as Vec;
    const ex = q.x - p.x;
    const ey = q.y - p.y;
    const e = Math.hypot(ex, ey);
    if (e === 0) continue;
    if (Math.abs(ex * dy - ey * dx) > 1e-6 * e * d || ex * dx + ey * dy < 0)
      return { run, bends: true };
    run += e;
  }
  return { run, bends: false };
}

/** How far the overlap shapes reach past the band underneath, as a share
 * of the band's width: the dark edges, and the light middle. */
export const PAST_EDGE = 0.03;
export const PAST_BAND = 0.08;
/** Where two crossings share ground, how far each reaches over the line
 * halfway between them (a share of the band's width), so no seam shows. */
const SHARE = 0.01;

/** The band on top at one crossing: its dark edges and its light middle,
 * each as one or more convex shapes, counter-clockwise, to be filled. */
export interface Overlap {
  readonly edge: readonly Vec[][];
  readonly band: readonly Vec[][];
}

type Poly = Vec[];

const area2 = (ps: Poly) =>
  ps.reduce((t, p, k) => {
    const q = ps[(k + 1) % ps.length] as Vec;
    return t + p.x * q.y - q.x * p.y;
  }, 0);

/** The part of a convex shape where n·x ≤ c. */
function keep(ps: Poly, n: Vec, c: number): Poly {
  const out: Poly = [];
  const side = (p: Vec) => n.x * p.x + n.y * p.y - c;
  ps.forEach((p, k) => {
    const q = ps[(k + 1) % ps.length] as Vec;
    const sp = side(p);
    const sq = side(q);
    if (sp <= 0) out.push(p);
    if ((sp < 0 && sq > 0) || (sp > 0 && sq < 0)) {
      const t = sp / (sp - sq);
      out.push({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t });
    }
  });
  return out.length >= 3 && Math.abs(area2(out)) > 1e-12 ? out : [];
}

/** A counter-clockwise convex shape's sides, as outward n·x ≤ c. */
const sides = (ps: Poly) =>
  ps.map((p, k) => {
    const q = ps[(k + 1) % ps.length] as Vec;
    const n = { x: q.y - p.y, y: p.x - q.x };
    return { n, c: n.x * p.x + n.y * p.y };
  });

/**
 * `pieces` less the part of the convex shape `other` on the far side of
 * the line n·x = c (n·x > c), as disjoint convex pieces.
 */
function cede(pieces: Poly[], other: Poly, n: Vec, c: number): Poly[] {
  const out: Poly[] = [];
  const flip = { x: -n.x, y: -n.y };
  for (const piece of pieces) {
    const near = keep(piece, n, c);
    if (near.length) out.push(near);
    // On the far side: what lies outside `other`, one side at a time.
    let far = keep(piece, flip, -c);
    for (const side of sides(other)) {
      if (!far.length) break;
      const outside = keep(far, { x: -side.n.x, y: -side.n.y }, -side.c);
      if (outside.length) out.push(outside);
      far = keep(far, side.n, side.c);
    }
  }
  return out;
}

const ccw = (ps: Poly) => (area2(ps) < 0 ? [...ps].reverse() : ps);

const overlaps = new WeakMap<Pattern, Map<string, Overlap[]>>();

/**
 * The band on top at every crossing of the weave's repeat (in the order
 * of its crossings), as filled shapes: `edge`, where the two bands
 * overlap (both `outer` wide, with their dark edges), and `band`, the top
 * band's light middle (`inner` wide) across the whole of the band
 * underneath. Each starts as a parallelogram whose ends lie on the outer
 * edges of the band underneath, so the top band's edges run right across
 * it, however close the next crossing is. (A piece of band cut to a
 * length stopped short where crossings crowd, and left a stub of edge in
 * the white.) A bend in the top band within the overlap shortens it, so
 * it never runs off the band. Where crossings sit closer than a band's
 * width, their shapes overlap: each then gives the other the shared
 * ground beyond the line halfway between them, so both keep their edges
 * whatever order they are drawn in.
 */
function overlapsOf(pattern: Pattern, outer: number, inner: number) {
  let byWidth = overlaps.get(pattern);
  if (!byWidth) overlaps.set(pattern, (byWidth = new Map()));
  const key = `${outer} ${inner}`;
  const found = byWidth.get(key);
  if (found) return found;
  const w = weaveOf(pattern);
  const [m, n] = w.repeat;
  const { u, v } = pattern.cell;
  // A hair past the band underneath, so no seam shows at the shapes' ends
  // (the top band is drawn the same there already); the light middle a
  // little further, so the dark shape's soft rim does not show across it.
  // Not past a bend, where the band does not go on.
  const past = outer * PAST_EDGE;
  const pastBand = outer * PAST_BAND;
  const shapes = w.crossings.map((c) => {
    const o = c.over;
    const s = c.under;
    const sin = Math.max(Math.abs(o.x * s.y - o.y * s.x), 0.05);
    // Along the top band, the band underneath is outer / sin wide.
    const across = outer / 2 / sin;
    const reach = (path: readonly Vec[]) => {
      const { run, bends } = straightRun(path);
      return bends && run < across + pastBand
        ? { to: Math.min(across, run), bend: true }
        : { to: across, bend: false };
    };
    const ahead = reach(c.ahead);
    const behind = reach(c.behind);
    const shape = (half: number, more: number): Poly => {
      const b = half / sin;
      const p = (a: number, k: number) => ({
        x: c.at.x + o.x * a + s.x * k,
        y: c.at.y + o.y * a + s.y * k,
      });
      const f = ahead.to + (ahead.bend ? 0 : more);
      const r = behind.to + (behind.bend ? 0 : more);
      return ccw([p(f, b), p(f, -b), p(-r, -b), p(-r, b)]);
    };
    const edge = shape(outer / 2, past);
    const radius = Math.max(
      ...edge.map((q) => Math.hypot(q.x - c.at.x, q.y - c.at.y)),
    );
    return { at: c.at, edge, band: shape(inner / 2, pastBand), radius };
  });
  const share = outer * SHARE;
  const out = shapes.map((a, k): Overlap => {
    let edge: Poly[] = [a.edge];
    let band: Poly[] = [a.band];
    for (let di = -1; di <= 1; di++)
      for (let dj = -1; dj <= 1; dj++) {
        const sx = u.x * m * di + v.x * n * dj;
        const sy = u.y * m * di + v.y * n * dj;
        shapes.forEach((b, l) => {
          if (l === k && !di && !dj) return;
          const bx = b.at.x + sx;
          const by = b.at.y + sy;
          const d = Math.hypot(bx - a.at.x, by - a.at.y);
          if (d === 0 || d >= a.radius + b.radius) return;
          // The line halfway between them: this one keeps its own side
          // and a hair over it.
          const nx = (bx - a.at.x) / d;
          const ny = (by - a.at.y) / d;
          const c = (nx * (a.at.x + bx)) / 2 + (ny * (a.at.y + by)) / 2 + share;
          const other = b.edge.map((q) => ({ x: q.x + sx, y: q.y + sy }));
          edge = cede(edge, other, { x: nx, y: ny }, c);
          band = cede(band, other, { x: nx, y: ny }, c);
        });
      }
    return { edge, band };
  });
  byWidth.set(key, out);
  return out;
}

/** The band on top at each crossing in the copy of the tile at slide
 * (i, j) (see overlapsOf). */
export function overlapsAt(
  pattern: Pattern,
  i: number,
  j: number,
  outer: number,
  inner: number,
): Overlap[] {
  const w = weaveOf(pattern);
  const [m, n] = w.repeat;
  const { u, v } = pattern.cell;
  const ri = mod(i, m);
  const rj = mod(j, n);
  const dx = u.x * (i - ri) + v.x * (j - rj);
  const dy = u.y * (i - ri) + v.y * (j - rj);
  const move = (ps: Poly) => ps.map((p) => ({ x: p.x + dx, y: p.y + dy }));
  const all = overlapsOf(pattern, outer, inner);
  return w.crossings.flatMap((c, k) =>
    c.i === ri && c.j === rj
      ? [
          {
            edge: (all[k] as Overlap).edge.map(move),
            band: (all[k] as Overlap).band.map(move),
          },
        ]
      : [],
  );
}

/** A closed shape for SVG, to be filled. */
export const shapePath = (
  points: readonly Vec[],
  place: (p: Vec) => string = (p) => `${p.x} ${p.y}`,
): string => (points.length < 3 ? '' : `M${points.map(place).join('L')}Z`);

/** A path for SVG, with a function placing each point. */
export function patchPath(
  points: readonly Vec[],
  place: (p: Vec) => string = (p) => `${p.x} ${p.y}`,
): string {
  return points.length < 2 ? '' : `M${points.map(place).join('L')}`;
}

/** After how many tiles along each slide the weave repeats. */
export function weaveRepeat(pattern: Pattern): readonly [number, number] {
  return weaveOf(pattern).repeat;
}
