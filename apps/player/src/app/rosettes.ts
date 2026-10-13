import { glazeOf, type Coloring } from './coloring';
import type { Model } from './model';
import { placeKey, ringsFor } from './placement';
import { ringsOf } from './rings';

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

/** How many rosettes take turns now, and how many the lattice gives. */
export function rosetteCounts(model: Model): { now: number; most: number } {
  return {
    now: ringsFor(model)?.rosettes ?? 1,
    most: ringsOf(model.pattern)?.rosettes ?? 1,
  };
}

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
