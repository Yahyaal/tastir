import type { PieceType } from '@tastir/engine';
import type { Model } from './model';

/** The slots every palette fills; a tutorial maps its pieces to these. */
export const SLOTS = ['a', 'b', 'c', 'd', 'ground'] as const;
export type Slot = (typeof SLOTS)[number];
export type Palette = Readonly<Record<Slot, string>>;

/** Preset palettes, named after the places whose tilework they recall. */
export const PALETTES: Readonly<Record<string, Palette>> = {
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
function slotOf(model: Model, t: PieceType, i: number): Slot {
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
    case 'paint':
      return change({
        ...h.now,
        chosen: { ...h.now.chosen, [action.type]: action.color },
      });
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
