import type { PieceType } from '@tastir/engine';
import type { Model } from './model';

/** The slots every palette fills; a tutorial maps its pieces to these. */
export const SLOTS = ['a', 'b', 'c', 'd', 'ground'] as const;
export type Slot = (typeof SLOTS)[number];
export type Palette = Readonly<Record<Slot, string>>;

/**
 * Preset palettes, each sampled from photographs of that place's tilework
 * (docs/research/palettes, glazes clustered and lifted to the lightness of
 * fired glaze, since photos in shade darken them). Slot a is the place's
 * leading colour and d its darkest, so black never becomes a design's main
 * colour by default.
 */
export const PALETTES: Readonly<Record<string, Palette>> = {
  // Fès: the Attarine and Bou Inania madrasas and a Fès fountain.
  'Fès tile': {
    a: '#2f4a8f',
    b: '#2f7f7a',
    c: '#b07a3c',
    d: '#1c1a1a',
    ground: '#ebe7e1',
  },
  // Marrakech: the Saadian tombs and the Ben Youssef madrasa.
  Marrakech: {
    a: '#2a3d5c',
    b: '#a66a35',
    c: '#5a7ea6',
    d: '#1d1a19',
    ground: '#e2d8cc',
  },
  Chefchaouen: {
    a: '#2d5fa8',
    b: '#7fb2e5',
    c: '#1b3566',
    d: '#c9d9ee',
    ground: '#f5f7fa',
  },
  // Tétouan: zellige walls and a fountain niche in the medina.
  Tétouan: {
    a: '#2c2b63',
    b: '#8a5638',
    c: '#c3a580',
    d: '#1d141c',
    ground: '#f5f2ec',
  },
  // Isfahan: the Shah Mosque's haft-rang tiles.
  Isfahan: {
    a: '#4b54a3',
    b: '#6670ad',
    c: '#d3c67e',
    d: '#37364f',
    ground: '#e4e2d6',
  },
  // Kashan: lustre star tiles, brown lustre and cobalt on white.
  Kashan: {
    a: '#6e5a33',
    b: '#2f3f99',
    c: '#a08c50',
    d: '#3b2b1c',
    ground: '#f4f0e6',
  },
  // The Alhambra: the Comares dado (white, teal, honey, gold, black).
  Alhambra: {
    a: '#2f7a7c',
    b: '#9a6430',
    c: '#c7b97a',
    d: '#1a1614',
    ground: '#e8e6e1',
  },
  // The Bou Inania wall in our photo, colour for colour: honey, teal,
  // blue, black and the light grey of its bands, brightened evenly.
  'Bou Inania': {
    a: '#925825',
    b: '#2e747d',
    c: '#557b96',
    d: '#0d0d0d',
    ground: '#c9ced0',
  },
};

export const DEFAULT_PALETTE = 'Fès tile';

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
