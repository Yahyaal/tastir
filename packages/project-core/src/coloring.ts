import type { SquareBands } from '@tastir/schema';
import type { HistoryAction } from '@tastir/agent-protocol';
import type { PieceType } from '@tastir/engine';
import type { Model } from './model.js';

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
  // Marinid Fès, 14th century (Bou Inania, Attarine): tin white,
  // manganese black, copper green, cobalt blue, iron honey and turquoise,
  // and no red, which came into zellij only in the 19th century
  // (Marçais; Cambazard-Amahan). Fès is blue and green, so the rosettes
  // take turns between green and blue, and honey is their second colour.
  'Marinid zellige': {
    white: '#f3efe6',
    black: '#1e1a17',
    families: [
      ['#13794a', '#e0a42a'],
      ['#1f3c8f', '#1d8fa3'],
      ['#1d8fa3', '#13794a'],
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
  // Almohad, 12th century: the minarets of the Kutubiyya and the Kasbah
  // mosque in Marrakesh have bands of green and white tile (Marçais).
  Almohad: {
    white: '#f1ede2',
    black: '#0f3d27',
    families: [
      ['#1d6b43', '#f1ede2'],
      ['#2e8a58', '#f1ede2'],
    ],
  },
  // Moroccan workshops of the 19th and 20th centuries, which added red,
  // a bright yellow and a dark blue to the old colours (Cambazard-Amahan).
  'Modern Moroccan': {
    white: '#f4f1ea',
    black: '#1a1716',
    families: [
      ['#b3261e', '#f2c230'],
      ['#1b2a6b', '#1f7a3a'],
      ['#1f7a3a', '#b3261e'],
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

/** A palette's glazes, for one with no glazes of its own: its ground as
 * the white, its darkest colour as the black and the other three paired
 * into families. */
function glazeFrom(p: Palette): Glaze {
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

/** A palette's glazes: a tradition's own, or made from its colours. */
export function glazeOf(name: string, model?: Model): Glaze {
  return GLAZES[name] ?? glazeFrom(paletteOf(model, name));
}

/** The palette of a tutorial's photo, offered first when it has one. */
export const ORIGINAL = 'The original';

/** A palette by name: a preset, or the original of the tutorial. */
export function paletteOf(model: Model | undefined, name: string): Palette {
  const original = model?.tutorial.pattern.original;
  if (name === ORIGINAL && original) return original.palette;
  return PALETTES[name] ?? (PALETTES[DEFAULT_PALETTE] as Palette);
}

/** The palettes a tutorial offers: its original first, then the presets. */
export function paletteNames(model: Model): string[] {
  return [
    ...(model.tutorial.pattern.original ? [ORIGINAL] : []),
    ...Object.keys(PALETTES),
  ];
}

/** How the wall's lines and bands look: their colours, and whether they
 * are carved (drawn in relief, with a light and a shadow edge). */
export interface Finish {
  readonly lines: string;
  readonly band: string;
  readonly carved: boolean;
}

/** Dark lines and light bands, as glazed tile. */
export const DEFAULT_FINISH: Finish = {
  lines: '#23201c',
  band: '#f7f2e6',
  carved: false,
};

/** The finish under a coloring: the original's with its own palette, and
 * over it the grout and band colours the learner chose. */
export function finishOf(model: Model, coloring: Coloring): Finish {
  const original = model.tutorial.pattern.original;
  const base =
    coloring.palette !== ORIGINAL || !original
      ? DEFAULT_FINISH
      : {
          lines: original.lines ?? DEFAULT_FINISH.lines,
          band: original.band ?? DEFAULT_FINISH.band,
          carved: original.carved ?? false,
        };
  const own = coloring.finish;
  return own?.lines || own?.band ? { ...base, ...own } : base;
}

/**
 * A piece type's key: its shape, so a color stays with the shape when the
 * same pieces come back (after free inking, for instance).
 */
const outlineKeys = new WeakMap<PieceType, string>();
export function typeKey(t: PieceType): string {
  const base = `${t.vertices}:${t.area.toFixed(4)}`;
  if (!t.outline) return base;
  const cached = outlineKeys.get(t);
  if (cached) return cached;
  const polygon = t.outline;
  const n = polygon.length;
  const at = (i: number) => polygon[(i + n * n) % n]!;
  const candidates: string[] = [];
  // The ordered edge lengths and turns determine the whole outline. Canonical
  // traversal and reflection keep the key when free ink finds another copy.
  for (const direction of [-1, 1]) {
    for (const mirror of [-1, 1]) {
      const entries = polygon.map((p, i) => {
        const before = at(i - direction);
        const after = at(i + direction);
        const ax = p.x - before.x,
          ay = p.y - before.y;
        const bx = after.x - p.x,
          by = after.y - p.y;
        const turn = Math.atan2(ax * by - ay * bx, ax * bx + ay * by);
        return `${Math.round(Math.hypot(bx, by) * 1e4)},${Math.round(mirror * turn * 1e4)}`;
      });
      // Reversed traversal visits the original indices in descending order.
      if (direction === -1) entries.reverse();
      for (let start = 0; start < n; start++)
        candidates.push(
          [...entries.slice(start), ...entries.slice(0, start)].join(';'),
        );
    }
  }
  const key = `${base}:${candidates.sort()[0]}`;
  outlineKeys.set(t, key);
  return key;
}

/** How a wall is coloured: ring by ring round each rosette, one colour
 * per shape, or by where each piece sits (a tutorial's placements). */
export type Method = 'rings' | 'shape' | 'place';

/** A coloring: a palette plus colors chosen for single piece types or
 * rings, and, when the learner changed them, how the wall is coloured and
 * how many rosettes take turns before it repeats. */
export interface Coloring {
  readonly squareBands?: SquareBands;
  readonly palette: string;
  readonly chosen: Readonly<Record<string, string>>;
  readonly method?: Method;
  readonly rosettes?: number;
  /** The grout or band-edge colour (`lines`) and band colour the learner
   * chose; else the palette's own. */
  readonly finish?: { readonly lines?: string; readonly band?: string };
}

/** A tutorial's own coloring: its original when it has a photo's, else
 * its palette. */
export const tutorialColoring = (model: Model): Coloring => ({
  palette: model.tutorial.pattern.original
    ? ORIGINAL
    : model.tutorial.pattern.palette && PALETTES[model.tutorial.pattern.palette]
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
  const palette = paletteOf(model, coloring.palette);
  return model.pattern.types.map(
    (t, i) => coloring.chosen[typeKey(t)] ?? palette[slotOf(model, t, i)],
  );
}

/** A coloring with its undo and redo history. */
export interface History {
  readonly pastActions?: readonly HistoryAction[];
  readonly futureActions?: readonly HistoryAction[];
  readonly past: readonly Coloring[];
  readonly now: Coloring;
  readonly future: readonly Coloring[];
}

export type ColorAction =
  | { readonly kind: 'paint'; readonly type: string; readonly color: string }
  | { readonly kind: 'palette'; readonly palette: string }
  | {
      readonly kind: 'finish';
      readonly lines?: string;
      readonly band?: string;
    }
  | {
      readonly kind: 'reset';
      readonly to: Coloring;
      readonly author?: HistoryAction;
    }
  | { readonly kind: 'undo' }
  | { readonly kind: 'redo' };

/** Every change is one undo step; undo and redo move along the history. */
export function colorReducer(h: History, action: ColorAction): History {
  const change = (now: Coloring): History =>
    JSON.stringify(now) === JSON.stringify(h.now)
      ? h
      : {
          past: [...h.past, h.now],
          now,
          future: [],
          pastActions: [
            ...(h.pastActions ??
              h.past.map(() => ({
                source: 'unknown' as const,
                requestId: null,
                label: 'Earlier color edit',
              }))),
            action.kind === 'reset' && action.author
              ? action.author
              : {
                  source: 'manual',
                  requestId: null,
                  label: 'Manual color edit',
                },
          ],
          futureActions: [],
        };
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
        ...(h.now.squareBands?.typeId === action.type
          ? { squareBands: undefined }
          : {}),
      });
    }
    case 'palette':
      // A new palette recolors everything; single choices are dropped.
      return change({
        ...h.now,
        squareBands: undefined,
        palette: action.palette,
        chosen: {},
      });
    case 'finish': {
      // The grout and band colours; a colour equal to none drops it.
      const finish: { lines?: string; band?: string } = { ...h.now.finish };
      if (action.lines !== undefined) finish.lines = action.lines;
      if (action.band !== undefined) finish.band = action.band;
      const { finish: _old, ...rest } = h.now;
      return change(finish.lines || finish.band ? { ...rest, finish } : rest);
    }
    case 'reset':
      return change(action.to);
    case 'undo': {
      const before = h.past.at(-1);
      return before
        ? {
            past: h.past.slice(0, -1),
            now: before,
            future: [h.now, ...h.future],
            pastActions: h.pastActions?.slice(0, -1),
            futureActions: [
              h.pastActions?.at(-1) ?? {
                source: 'unknown',
                requestId: null,
                label: 'Earlier color edit',
              },
              ...(h.futureActions ?? []),
            ],
          }
        : h;
    }
    case 'redo': {
      const after = h.future[0];
      return after
        ? {
            past: [...h.past, h.now],
            now: after,
            future: h.future.slice(1),
            pastActions: [
              ...(h.pastActions ?? []),
              h.futureActions?.[0] ?? {
                source: 'unknown',
                requestId: null,
                label: 'Earlier color edit',
              },
            ],
            futureActions: h.futureActions?.slice(1),
          }
        : h;
    }
  }
}
