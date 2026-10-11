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
