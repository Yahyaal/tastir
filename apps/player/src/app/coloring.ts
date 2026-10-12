import type { PieceType } from '@tastir/engine';
import type { Model } from './model';

/** The slots every palette fills; a tutorial maps its pieces to these. */
export const SLOTS = ['a', 'b', 'c', 'd', 'ground'] as const;
export type Slot = (typeof SLOTS)[number];
export type Palette = Readonly<Record<Slot, string>>;

/**
 * A tradition's glazes: a white, a black and colour families, each a main
 * and a second colour. Colouring by rings gives each rosette one family,
 * so neighbouring rosettes take turns between them; the first family is
 * cool and the second warm.
 */
export interface Glaze {
  readonly white: string;
  readonly black: string;
  readonly families: readonly (readonly [string, string])[];
}

/**
 * The tradition palettes, from real glazes (owner's pictures, October 2026;
 * glaze oxides from studies of Marinid zellige).
 */
export const GLAZES: Readonly<Record<string, Glaze>> = {
  // Fès zellige: tin white, manganese black, cobalt, copper green, iron
  // honey, oxblood, turquoise and orange.
  'Marinid zellige': {
    white: '#f3efe6',
    black: '#1b1714',
    families: [
      ['#1f3c8f', '#13794a'],
      ['#e0a42a', '#9a2a2c'],
      ['#1d8fa3', '#c8622a'],
    ],
  },
  // The glazed tile of the Alhambra's dados: white, black, teal, honey
  // brown, deep blue and green.
  Alhambra: {
    white: '#f2eee4',
    black: '#1d1a18',
    families: [
      ['#1f7f86', '#2b4f8f'],
      ['#b8702c', '#2f7a3c'],
      ['#2b4f8f', '#d8a640'],
    ],
  },
  // Timurid and Persian tile: white, deep cobalt, turquoise, ochre, blue,
  // brick.
  'Timurid tile': {
    white: '#f5f2ea',
    black: '#14305c',
    families: [
      ['#1aa3b5', '#2a59b0'],
      ['#dba73a', '#a33d2b'],
      ['#2a59b0', '#dba73a'],
    ],
  },
  // Mamluk woodwork: the panels are wood, so a mid wood plays the part
  // white plays in tile, with ebony, ivory and a light wood inlaid.
  'Mamluk wood': {
    white: '#7a4a26',
    black: '#24170f',
    families: [
      ['#efe3c6', '#b5813f'],
      ['#b5813f', '#efe3c6'],
      ['#d9c08e', '#9a6a38'],
    ],
  },
};

/** A glaze's colours as slots, for colouring by shape. */
const slotsOf = (g: Glaze): Palette => ({
  a: g.black,
  b: g.families[0]?.[0] ?? g.black,
  c: g.families[1]?.[0] ?? g.black,
  d: g.families[0]?.[1] ?? g.black,
  ground: g.white,
});

/**
 * Preset palettes: the tradition palettes first, each slot with one role
 * (`a` the black, `b` the cool colour, `c` the warm one, `d` a second cool
 * one, `ground` the white), then the older palettes named after places,
 * kept so saved designs keep their colours.
 */
export const PALETTES: Readonly<Record<string, Palette>> = {
  ...Object.fromEntries(
    Object.entries(GLAZES).map(([name, g]) => [name, slotsOf(g)]),
  ),
  'Fès tile': {
    a: '#1d5c7c',
    b: '#2f7d4f',
    c: '#c9a227',
    d: '#8c2f39',
    ground: '#f2ead8',
  },
  Marrakech: {
    a: '#b5452f',
    b: '#2e6b5e',
    c: '#e0b04a',
    d: '#3b3a6b',
    ground: '#f4e6cf',
  },
  Chefchaouen: {
    a: '#2d5fa8',
    b: '#7fb2e5',
    c: '#1b3566',
    d: '#c9d9ee',
    ground: '#f5f7fa',
  },
  Tétouan: {
    a: '#1f6b4f',
    b: '#d6a53a',
    c: '#20304f',
    d: '#a23b2a',
    ground: '#f3efe4',
  },
  Isfahan: {
    a: '#1e6f9f',
    b: '#2aa198',
    c: '#e8c547',
    d: '#7a3b1d',
    ground: '#f6f0e1',
  },
  Kashan: {
    a: '#24476b',
    b: '#3f8f9b',
    c: '#c46b3a',
    d: '#e9d8a6',
    ground: '#fbf7ee',
  },
};

export const DEFAULT_PALETTE = 'Fès tile';

/** CIE lightness of a colour, 0 (black) to 100 (white). */
export function lightness(hex: string): number {
  const channel = (k: number) => {
    const c = parseInt(hex.slice(1 + 2 * k, 3 + 2 * k), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const y = 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
  return y > 0.008856 ? 116 * Math.cbrt(y) - 16 : 903.3 * y;
}

/**
 * A palette's glazes: a tradition's own, or for an older palette its
 * ground as the white, its darkest colour as the black and the other
 * three paired into families.
 */
export function glazeOf(name: string): Glaze {
  const own = GLAZES[name];
  if (own) return own;
  const p = PALETTES[name] ?? (PALETTES[DEFAULT_PALETTE] as Palette);
  const [black, x, y, z] = [p.a, p.b, p.c, p.d].sort(
    (u, v) => lightness(u) - lightness(v),
  ) as [string, string, string, string];
  return {
    white: p.ground,
    black,
    families: [
      [x, y],
      [z, x],
      [y, z],
    ],
  };
}

/**
 * A piece type's key: its shape, so a color stays with the shape when the
 * same pieces come back (after free inking, for instance).
 */
export const typeKey = (t: PieceType) => `${t.vertices}:${t.area.toFixed(4)}`;

/** A coloring: a palette plus colors chosen for single piece types. */
export interface Coloring {
  readonly palette: string;
  readonly chosen: Readonly<Record<string, string>>;
}

export const tutorialColoring = (model: Model): Coloring => ({
  palette:
    model.tutorial.pattern.palette && PALETTES[model.tutorial.pattern.palette]
      ? model.tutorial.pattern.palette
      : DEFAULT_PALETTE,
  chosen: {},
});

/** The palette slot each piece type takes: the tutorial's, else in turn. */
export function slotOf(model: Model, t: PieceType, i: number): Slot {
  const named = t.name ? model.tutorial.pattern.colors[t.name] : undefined;
  if (named && (SLOTS as readonly string[]).includes(named))
    return named as Slot;
  return SLOTS[i % SLOTS.length] as Slot;
}

/** The fill for each piece type under a coloring. */
export function pieceColors(
  model: Model,
  coloring: Coloring = tutorialColoring(model),
): string[] {
  const palette =
    PALETTES[coloring.palette] ?? (PALETTES[DEFAULT_PALETTE] as Palette);
  return model.pattern.types.map(
    (t, i) => coloring.chosen[typeKey(t)] ?? palette[slotOf(model, t, i)],
  );
}

/** A coloring with its undo and redo history. */
export interface History {
  readonly past: readonly Coloring[];
  readonly now: Coloring;
  readonly future: readonly Coloring[];
}

export type ColorAction =
  | { readonly kind: 'paint'; readonly type: string; readonly color: string }
  | { readonly kind: 'palette'; readonly palette: string }
  | { readonly kind: 'reset'; readonly to: Coloring }
  | { readonly kind: 'undo' }
  | { readonly kind: 'redo' };

/** Every change is one undo step; undo and redo move along the history. */
export function colorReducer(h: History, action: ColorAction): History {
  const change = (now: Coloring): History =>
    JSON.stringify(now) === JSON.stringify(h.now)
      ? h
      : { past: [...h.past, h.now], now, future: [] };
  switch (action.kind) {
    case 'paint': {
      // A whole shape painted drops the colors chosen for its placements
      // (keys `shape#piece@i,j`, see placement.ts).
      const chosen = action.type.includes('#')
        ? { ...h.now.chosen }
        : Object.fromEntries(
            Object.entries(h.now.chosen).filter(
              ([k]) => !k.startsWith(`${action.type}#`),
            ),
          );
      return change({
        ...h.now,
        chosen: { ...chosen, [action.type]: action.color },
      });
    }
    case 'palette':
      // A new palette recolors everything; single choices are dropped.
      return change({ palette: action.palette, chosen: {} });
    case 'reset':
      return change(action.to);
    case 'undo': {
      const before = h.past.at(-1);
      return before
        ? {
            past: h.past.slice(0, -1),
            now: before,
            future: [h.now, ...h.future],
          }
        : h;
    }
    case 'redo': {
      const after = h.future[0];
      return after
        ? { past: [...h.past, h.now], now: after, future: h.future.slice(1) }
        : h;
    }
  }
}
