import type { Piece, Vec } from '@tastir/engine';
import {
  DEFAULT_PALETTE,
  glazeOf,
  PALETTES,
  slotOf,
  typeKey,
  type Coloring,
  type Palette,
} from './coloring';
import type { Model } from './model';
import { ringsOf, type RingRole, type Rings } from './rings';

/**
 * Coloring by where a piece sits (the tutorial's pattern.placements): the
 * same shape can take different colors by its turn, its place in the cell
 * and the cell of a larger repeat it falls in. Without placements every
 * piece of a shape shares one color, as before.
 */

/**
 * The tutorial's rings (pattern.rings, see rings.ts), or undefined when it
 * does not colour by rings or the pattern has no rosette to colour round.
 */
export function ringsFor(model: Model): Rings | undefined {
  return model.tutorial.pattern.rings ? ringsOf(model.pattern) : undefined;
}

/** Whether pieces of one shape can differ in colour: by placement or ring. */
export function byPlace(model: Model): boolean {
  return !!model.tutorial.pattern.placements || !!ringsFor(model);
}

/** How many cells along each slide the coloring repeats after. */
export function colorRepeat(model: Model): readonly [number, number] {
  return (
    ringsFor(model)?.repeat ??
    model.tutorial.pattern.placements?.repeat ?? [1, 1]
  );
}

const mod = (a: number, n: number) => ((a % n) + n) % n;

/**
 * A piece's turn: the direction of its long axis, in degrees from the
 * horizontal in [0, 180), or undefined for a piece with no long axis (a
 * square, a regular star).
 */
export function turnOf(polygon: readonly Vec[]): number | undefined {
  // Second moments of the outline's corners about their centre.
  const n = polygon.length;
  const c = polygon.reduce((a, p) => ({ x: a.x + p.x / n, y: a.y + p.y / n }), {
    x: 0,
    y: 0,
  });
  let xx = 0;
  let yy = 0;
  let xy = 0;
  for (const p of polygon) {
    const dx = p.x - c.x;
    const dy = p.y - c.y;
    xx += dx * dx;
    yy += dy * dy;
    xy += dx * dy;
  }
  const spread = Math.hypot(xx - yy, 2 * xy);
  if (spread < 0.02 * (xx + yy)) return undefined;
  const deg = (Math.atan2(2 * xy, xx - yy) * 90) / Math.PI;
  return mod(deg, 180);
}

/**
 * Each piece's place among the cell's pieces of its shape: counted along
 * the cell's second slide, then its first, by the piece's centre.
 */
export function nthOf(model: Model): number[] {
  const { cell, pieces } = model.pattern;
  const det = cell.u.x * cell.v.y - cell.u.y * cell.v.x;
  const along = (p: Piece) => {
    const n = p.polygon.length;
    const c = p.polygon.reduce(
      (a, q) => ({ x: a.x + q.x / n, y: a.y + q.y / n }),
      { x: 0, y: 0 },
    );
    const d = { x: c.x - cell.origin.x, y: c.y - cell.origin.y };
    return {
      a: (d.x * cell.v.y - d.y * cell.v.x) / det,
      b: (cell.u.x * d.y - cell.u.y * d.x) / det,
    };
  };
  const at = pieces.map(along);
  return pieces.map((p, i) => {
    const me = at[i] as { a: number; b: number };
    return pieces.filter((q, k) => {
      if (q.type !== p.type || k === i) return false;
      const o = at[k] as { a: number; b: number };
      return o.b < me.b - 1e-6 || (Math.abs(o.b - me.b) <= 1e-6 && o.a < me.a);
    }).length;
  });
}

/**
 * The key a placement's color is kept under: the shape's key alone when
 * the tutorial colors by shape, else the shape with the piece and its cell
 * in the repeat.
 */
export function placeKey(
  model: Model,
  piece: number,
  i: number,
  j: number,
): string {
  const p = model.pattern.pieces[piece];
  const t = p ? model.pattern.types[p.type] : undefined;
  if (!t) return '';
  const rings = ringsFor(model);
  if (rings) return `${typeKey(t)}#${rings.place(piece, i, j).ring}`;
  if (!model.tutorial.pattern.placements) return typeKey(t);
  const [m, n] = colorRepeat(model);
  return `${typeKey(t)}#${piece}@${mod(i, m)},${mod(j, n)}`;
}

/** A palette slot's color, or the color itself when it is not a slot. */
function resolve(palette: Palette, color: string): string {
  return (palette as Record<string, string>)[color] ?? color;
}

/**
 * The fill for every placement under a coloring: a color chosen for that
 * placement, else one chosen for its whole shape, else the tutorial's
 * placement rules, else the shape's palette slot.
 */
export function placeFills(
  model: Model,
  coloring: Coloring,
): (piece: number, i: number, j: number) => string {
  const palette =
    PALETTES[coloring.palette] ?? (PALETTES[DEFAULT_PALETTE] as Palette);
  const placements = model.tutorial.pattern.placements;
  const rings = ringsFor(model);
  if (rings) return ringFills(model, coloring, rings);
  const nth = nthOf(model);
  const turns = model.pattern.pieces.map((p) => turnOf(p.polygon));
  const [m, n] = colorRepeat(model);
  const cache = new Map<string, string>();
  return (piece, i, j) => {
    const key = placeKey(model, piece, i, j);
    const hit = cache.get(key);
    if (hit) return hit;
    const p = model.pattern.pieces[piece] as Piece;
    const t = model.pattern.types[p.type];
    let fill = '#999999';
    if (t) {
      fill = coloring.chosen[key] ?? coloring.chosen[typeKey(t)] ?? '';
      if (!fill) {
        fill = palette[slotOf(model, t, p.type)];
        for (const rule of placements?.rules ?? []) {
          if (rule.piece !== t.name) continue;
          if (rule.nth !== undefined && rule.nth !== nth[piece]) continue;
          if (
            rule.cell &&
            (rule.cell[0] !== mod(i, m) || rule.cell[1] !== mod(j, n))
          )
            continue;
          if (rule.turn !== undefined) {
            const turn = turns[piece];
            if (turn === undefined) continue;
            const off = mod(turn - rule.turn + 90, 180) - 90;
            if (Math.abs(off) > 3) continue;
          }
          fill = resolve(palette, rule.color);
        }
      }
    }
    cache.set(key, fill);
    return fill;
  };
}

/**
 * The fill for every placement when the tutorial colours by rings: a
 * colour chosen for that ring, else for its whole shape, else the role the
 * tutorial gives its ring or shape, else the ring's own role, in the
 * palette's glazes.
 */
function ringFills(
  model: Model,
  coloring: Coloring,
  rings: Rings,
): (piece: number, i: number, j: number) => string {
  const glaze = glazeOf(coloring.palette);
  const fixes = model.tutorial.pattern.rings;
  const fixed = fixes === true || !fixes ? {} : fixes.colors;
  const families = Math.max(1, Math.min(rings.families, glaze.families.length));
  const colour = (role: RingRole, family: number): string => {
    const f = family < 0 ? 0 : family % families;
    if (role === 'white') return glaze.white;
    if (role === 'black') return glaze.black;
    if (role === 'spark')
      return glaze.families[(f + 1) % families]?.[0] ?? glaze.black;
    return glaze.families[f]?.[role === 'main' ? 0 : 1] ?? glaze.black;
  };
  const cache = new Map<string, string>();
  return (piece, i, j) => {
    const key = placeKey(model, piece, i, j);
    const hit = cache.get(key);
    if (hit) return hit;
    const p = model.pattern.pieces[piece] as Piece;
    const t = model.pattern.types[p.type];
    let fill = '#999999';
    if (t) {
      const at = rings.place(piece, i, j);
      const name = t.name ?? '';
      const role =
        (at.n ? fixed[`${name}@${at.n}`] : undefined) ?? fixed[name] ?? at.role;
      fill =
        coloring.chosen[key] ??
        coloring.chosen[typeKey(t)] ??
        colour(role, at.family);
    }
    cache.set(key, fill);
    return fill;
  };
}
