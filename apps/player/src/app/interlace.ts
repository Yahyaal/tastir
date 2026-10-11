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

/** A short piece of the band on top at a crossing: its dark edges from
 * a to b, and its light middle a little longer (inA to inB), so no seam
 * shows where the piece meets its own band. */
export interface Patch {
  readonly a: Vec;
  readonly b: Vec;
  readonly inA: Vec;
  readonly inB: Vec;
}

const mod = (k: number, n: number) => ((k % n) + n) % n;

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
  const out: Patch[] = [];
  for (const c of w.crossings) {
    if (c.i !== ri || c.j !== rj) continue;
    const at = {
      x: c.at.x + u.x * (i - ri) + v.x * (j - rj),
      y: c.at.y + u.y * (i - ri) + v.y * (j - rj),
    };
    // Long enough to cover the band underneath where it crosses, at
    // whatever angle, but not past the top band's next meeting.
    const sin = Math.abs(c.over.x * c.under.y - c.over.y * c.under.x);
    const half = Math.min(
      width / (2 * Math.max(sin, 0.2)) + width * 0.15,
      c.room * 0.5,
    );
    const longer = half + width * 0.1;
    const along = (t: number) => ({
      x: at.x + c.over.x * t,
      y: at.y + c.over.y * t,
    });
    out.push({
      a: along(-half),
      b: along(half),
      inA: along(-longer),
      inB: along(longer),
    });
  }
  return out;
}

/** After how many tiles along each slide the weave repeats. */
export function weaveRepeat(pattern: Pattern): readonly [number, number] {
  return weaveOf(pattern).repeat;
}
