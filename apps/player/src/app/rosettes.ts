import { glazeOf, type Coloring } from './coloring';
import type { Model } from './model';
import { placeKey, ringsFor } from './placement';
import { ringsOf, rosetteOptions } from './rings';

/**
 * The colour stage's rosettes: each rosette of the repeat with its rings
 * from the centre out, so a learner colours one rosette, then makes the
 * next from it, swapped or as it is.
 */

/** One ring of one rosette, with a piece of it to show and paint. */
export interface RingRow {
  /** The ring's colour key (placeKey). */
  readonly key: string;
  readonly type: number;
  readonly piece: number;
  readonly i: number;
  readonly j: number;
  /** The rosette it goes round, the filler stars' family, or -1 between
   * rosettes. */
  readonly family: number;
}

/** A rosette's card: its rings, nearest the centre first. */
export interface RosetteCard {
  readonly family: number;
  readonly kind: 'rosette' | 'filler' | 'between';
  readonly rows: readonly RingRow[];
}

/** A ring key's family: its last part (`shape#orbit/family`). */
const familyOfKey = (key: string): number | undefined => {
  const hash = key.indexOf('#');
  const cut = key.lastIndexOf('/');
  if (hash < 0 || cut < hash) return undefined;
  const f = Number(key.slice(cut + 1));
  return Number.isInteger(f) ? f : undefined;
};

const withFamily = (key: string, f: number) =>
  `${key.slice(0, key.lastIndexOf('/'))}/${f}`;

/** The rings of a model coloured by rings, as cards: the rosettes, then
 * the filler star, then the pieces between rosettes. */
export function rosetteCards(model: Model): RosetteCard[] {
  const rings = ringsFor(model);
  if (!rings) return [];
  const { pieces } = model.pattern;
  const [m, n] = rings.repeat;
  const seen = new Map<string, RingRow & { d: number }>();
  for (let k = 0; k < pieces.length; k++)
    for (let i = 0; i < m; i++)
      for (let j = 0; j < n; j++) {
        const at = rings.place(k, i, j);
        if (seen.has(at.ring)) continue;
        seen.set(at.ring, {
          key: placeKey(model, k, i, j),
          type: pieces[k]?.type ?? 0,
          piece: k,
          i,
          j,
          family: at.family,
          // The ring's distance step (`type:step:kind/family`).
          d: Number(at.ring.split(':')[1] ?? 0),
        });
      }
  const rows = [...seen.values()].sort((a, b) => a.d - b.d);
  const card = (family: number): RosetteCard => ({
    family,
    kind:
      family < 0 ? 'between' : family < rings.rosettes ? 'rosette' : 'filler',
    rows: rows
      .filter((r) => r.family === family)
      .map(({ d: _d, ...row }) => row),
  });
  const families = [...new Set(rows.map((r) => r.family))].sort((a, b) =>
    a < 0 ? 1 : b < 0 ? -1 : a - b,
  );
  return families.map(card).filter((c) => c.rows.length);
}

/** A palette's colours to paint with: its white, black and glazes. */
export function swatchesOf(model: Model, palette: string): string[] {
  const g = glazeOf(palette, model);
  return [...new Set([g.white, g.black, ...g.families.flat()])];
}

/** The colour a click paints with: the one picked, else the palette's
 * first glaze. */
export function brushOf(
  model: Model,
  palette: string,
  picked: string | undefined,
): string {
  const all = swatchesOf(model, palette);
  return picked ?? all[2] ?? all[0] ?? '#ffffff';
}

/** How many rosettes the unit holds now, how many take turns by default
 * (the lattice's own number), and the numbers it can hold. */
export function rosetteCounts(model: Model): {
  now: number;
  turns: number;
  options: number[];
} {
  return {
    now: ringsFor(model)?.rosettes ?? 1,
    turns: ringsOf(model.pattern)?.rosettes ?? 1,
    options: rosetteOptions(model.pattern),
  };
}

/**
 * The colours chosen for a unit of `to` rosettes from one of `from`: the
 * filler star's rings move after the rosettes, rosettes that are gone are
 * dropped, every ring keeps the colour it shows, and each new rosette
 * starts as one already there. Going from
 * one rosette, every other one is the first swapped and the last (the
 * same as the first on the wall) is the first; going from two that take
 * turns to each its own, each new one copies the rosette it was, so the
 * wall looks the same until the learner changes it.
 */
export function regrow(
  model: Model,
  coloring: Coloring,
  fill: (piece: number, i: number, j: number) => string,
  from: number,
  to: number,
): Record<string, string> {
  // Every ring keeps the colour it shows now: with more rosettes the
  // default colours of the rosettes and the filler star change.
  const now = Object.fromEntries(
    rosetteCards(model).flatMap((c) =>
      c.rows.map((r) => [r.key, fill(r.piece, r.i, r.j)]),
    ),
  );
  let chosen = refamily({ ...now, ...coloring.chosen }, from, to);
  for (let f = from; f < to; f++) {
    // From one rosette: B, and C beside A in a unit of four, are A
    // swapped; D, across from A, is A; a third rosette of three that all
    // touch keeps its own colours. From two taking turns over 2×2 cells
    // (A B / B A): C was B and D was A.
    const from1 =
      f === 1 || (to === OWN_FOUR && f === 2) ? [0, true] : undefined;
    const [source, reverse] =
      from === 1
        ? (from1 ?? (to === OWN_FOUR ? [0, false] : [undefined, false]))
        : [(f + 1) % 2, false];
    if (source === undefined) continue;
    chosen = {
      ...chosen,
      ...copyRosette(model, coloring, fill, source as number, f, !!reverse),
    };
  }
  return chosen;
}

const OWN_FOUR = 4;

/**
 * The colours chosen, kept for a new number of rosettes: rings of
 * rosettes that are gone are dropped, and the filler stars' rings, which
 * come after the rosettes, move with them.
 */
export function refamily(
  chosen: Readonly<Record<string, string>>,
  from: number,
  to: number,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, colour] of Object.entries(chosen)) {
    const f = familyOfKey(key);
    if (f === undefined || f < 0) out[key] = colour;
    else if (f >= from) out[withFamily(key, to + f - from)] = colour;
    else if (f < to) out[key] = colour;
  }
  return out;
}

/**
 * Colours for rosette `to` from rosette `from`: the same ring by ring, or
 * reversed, the centre's colour and the first ring colour round it
 * changing places, as neighbouring rosettes do on real zellige.
 */
export function copyRosette(
  model: Model,
  coloring: Coloring,
  fill: (piece: number, i: number, j: number) => string,
  from: number,
  to: number,
  reverse: boolean,
): Record<string, string> {
  const cards = rosetteCards(model);
  const source = cards.find((c) => c.family === from)?.rows ?? [];
  const colourOf = (r: RingRow) => fill(r.piece, r.i, r.j);
  const glaze = glazeOf(coloring.palette, model);
  const centre = source[0] ? colourOf(source[0]) : undefined;
  const plain = new Set([glaze.white, glaze.black, centre]);
  const round = source.map(colourOf).find((c) => !plain.has(c));
  const swap = (c: string) =>
    !reverse || !centre || !round
      ? c
      : c === centre
        ? round
        : c === round
          ? centre
          : c;
  return Object.fromEntries(
    source.map((r) => [withFamily(r.key, to), swap(colourOf(r))]),
  );
}
