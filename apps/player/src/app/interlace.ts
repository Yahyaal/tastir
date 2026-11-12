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

/**
 * The band on top at each crossing in the copy of the tile at slide (i, j),
 * as two filled shapes: `edge`, where the two bands overlap (both `outer`
 * wide, with their dark edges), and `band`, the top band's light middle
 * (`inner` wide) across the whole of the band underneath. Each shape is a
 * parallelogram whose ends lie on the outer edges of the band underneath,
 * so the top band's edges always run right across it and stop exactly
 * where its own band takes over, however close the next crossing is. (A
 * piece of band cut to a length stopped short where crossings crowd, and
 * left a stub of edge in the white.) Only a bend in the top band within
 * the overlap shortens a shape, so it never runs off the band.
 */
export function overlapsAt(
  pattern: Pattern,
  i: number,
  j: number,
  outer: number,
  inner: number,
): Patch[] {
  const w = weaveOf(pattern);
  const [m, n] = w.repeat;
  const { u, v } = pattern.cell;
  const ri = mod(i, m);
  const rj = mod(j, n);
  const dx = u.x * (i - ri) + v.x * (j - rj);
  const dy = u.y * (i - ri) + v.y * (j - rj);
  const out: Patch[] = [];
  // A hair past the band underneath, so no seam shows at the shapes' ends
  // (the top band is drawn the same there already); the light middle a
  // little further, so the dark shape's soft rim does not show across it.
  const past = outer * PAST_EDGE;
  const pastBand = outer * PAST_BAND;
  for (const c of w.crossings) {
    if (c.i !== ri || c.j !== rj) continue;
    const o = c.over;
    const s = c.under;
    const sin = Math.max(Math.abs(o.x * s.y - o.y * s.x), 0.05);
    // Along the top band, the band underneath is outer / sin wide.
    const across = outer / 2 / sin;
    const reach = (path: readonly Vec[]) => {
      const { run, bends } = straightRun(path);
      return (bends ? Math.min(across, run) : across) + past;
    };
    const ahead = reach(c.ahead);
    const behind = reach(c.behind);
    const at = { x: c.at.x + dx, y: c.at.y + dy };
    const shape = (half: number, more: number): Vec[] => {
      const b = half / sin;
      const p = (a: number, k: number) => ({
        x: at.x + o.x * a + s.x * k,
        y: at.y + o.y * a + s.y * k,
      });
      const f = ahead + more;
      const r = behind + more;
      return [p(f, b), p(f, -b), p(-r, -b), p(-r, b)];
    };
    out.push({
      edge: shape(outer / 2, 0),
      band: shape(inner / 2, pastBand - past),
    });
  }
  return out;
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
