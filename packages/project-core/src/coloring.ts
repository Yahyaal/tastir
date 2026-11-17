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
  }, // For watercolour on paper (STYLE.1, 16 November 2026): bright,
  // related colours, never brown and grey, which look dirty on paper.
  Rose: {
    a: '#b8185a',
    b: '#d0333f',
    c: '#e3739f',
    d: '#7f1a4f',
    ground: '#f2b9cf',
  },
  'Violet and sky': {
    a: '#5a2a70',
    b: '#79b6d8',
    c: '#de5a7c',
    d: '#3b1d50',
    ground: '#f1d6e1',
  },
  'Indigo and ochre': {
    a: '#2b4a7d',
    b: '#c98a2b',
    c: '#6f9a63',
    d: '#a8452c',
    ground: '#eedfbf',
  },
  'Teal and gold': {
    a: '#14706f',
    b: '#d7a52b',
    c: '#2f5f9e',
    d: '#c4532f',
    ground: '#e8eedf',
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
/** A palette of the design's own, by name (PAL.1). */
export const designPalette = (model: Model | undefined, name: string) =>
  model?.tutorial.pattern.palettes?.find((p) => p.name === name);

/** The names of the design's own palettes, offered first. */
export const designPaletteNames = (model: Model | undefined): string[] =>
  model?.tutorial.pattern.palettes?.map((p) => p.name) ?? [];

export function paletteOf(model: Model | undefined, name: string): Palette {
  const own = designPalette(model, name);
  if (own) {
    const { a, b, c, d, ground } = own.palette;
    return { a, b, c, d, ground };
  }
  const original = model?.tutorial.pattern.original;
  if (name === ORIGINAL && original) {
    const { a, b, c, d, ground } = original.palette;
    return { a, b, c, d, ground };
  }
  return PALETTES[name] ?? (PALETTES[DEFAULT_PALETTE] as Palette);
}

/** The extra slots placement rules may name, past the five. */
export type Extra = 'e' | 'f' | 'g';

/** The average of two colours. */
function blend(x: string, y: string): string {
  const at = (h: string, i: number) =>
    parseInt(h.slice(1 + 2 * i, 3 + 2 * i), 16);
  return `#${[0, 1, 2]
    .map((i) =>
      Math.round((at(x, i) + at(y, i)) / 2)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

/**
 * The colours of the extra slots `e`, `f` and `g`, for a wall coloured by
 * placements with more colours than the five slots: the original's own,
 * else glaze colours the five slots leave out, else a blend of two slots.
 */
export function extraColors(
  model: Model | undefined,
  name: string,
): Record<Extra, string> {
  const p = paletteOf(model, name);
  const own =
    designPalette(model, name)?.palette ??
    (name === ORIGINAL ? model?.tutorial.pattern.original?.palette : undefined);
  const used = new Set(Object.values(p));
  const spare = [...new Set(glazeOf(name, model).families.flat())].filter(
    (c) => !used.has(c),
  );
  return {
    e: own?.e ?? spare[0] ?? blend(p.b, p.c),
    f: own?.f ?? spare[1] ?? blend(p.c, p.d),
    g: own?.g ?? spare[2] ?? blend(p.b, p.d),
  };
}

/** The palettes a tutorial offers: its original first, then the presets. */
/** The palettes made for paper, offered with watercolour only (STYLE.5). */
export const PAPER_PALETTES: readonly string[] = [
  'Rose',
  'Violet and sky',
  'Indigo and ochre',
  'Teal and gold',
];

/** Whether a palette is one of the paper palettes. */
export const isPaper = (name: string) => PAPER_PALETTES.includes(name);

/**
 * The palettes offered: for watercolour the paper palettes, else the
 * glaze palettes and the photo's original, since tile colours look dull on
 * paper and paper colours look thin as tile (STYLE.5).
 */
export function paletteNames(model: Model, paper = false): string[] {
  if (paper) return [...PAPER_PALETTES];
  return [
    ...designPaletteNames(model),
    ...(model.tutorial.pattern.original ? [ORIGINAL] : []),
    ...Object.keys(PALETTES).filter((name) => !isPaper(name)),
  ];
}

/** How the wall's lines and bands look: their colours, and whether they
 * are carved (drawn in relief, with a light and a shadow edge). */
export interface Finish {
  readonly lines: string;
  readonly band: string;
  readonly carved: boolean;
  /** The tiles' grout, when it differs from the lines: a preset's dark
   * grout gives way round pieces of its own colour (groutFor). Band edges
   * keep `lines`. */
  readonly grout?: string;
}

/** Dark lines and light bands, as glazed tile. */
export const DEFAULT_FINISH: Finish = {
  lines: '#23201c',
  band: '#f7f2e6',
  carved: false,
};

/** How far apart two colours are, 0 (the same) to about 441. */
export function colourDistance(a: string, b: string): number {
  const rgb = (c: string) => {
    const n = parseInt(c.replace('#', '').slice(0, 6), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const [x, y] = [rgb(a), rgb(b)];
  return Math.hypot(...x.map((v, i) => v - (y[i] ?? 0)));
}

/** Colours this close read as one where they touch. */
const NEAR = 48;

/** The grout colours tried, in order, when the default matches a piece. */
const GROUTS = ['#23201c', '#f7f2e6', '#6b4a33', '#8a8580'];

/**
 * A grout that differs from every piece (STYLE.8): black grout round black
 * pieces lost their outlines, so the default grout gives way to the first
 * of the others that no piece is close to, or else to the one farthest from
 * them all.
 */
export function groutFor(colours: readonly string[], grout: string): string {
  const gap = (g: string) =>
    Math.min(...colours.map((c) => colourDistance(c, g)));
  if (!colours.length || gap(grout) >= NEAR) return grout;
  return (
    GROUTS.find((g) => gap(g) >= NEAR) ??
    [...GROUTS].sort((x, y) => gap(y) - gap(x))[0] ??
    grout
  );
}

/**
 * A piece's colour under bands (STYLE.4): a piece the colour of the band
 * (white pieces under white interlace) makes the band vanish, so it takes a
 * light tint of the palette's strongest colour instead.
 */
export function underBand(
  colour: string,
  band: string,
  colours: readonly string[],
): string {
  if (colourDistance(colour, band) >= NEAR) return colour;
  const accent = [...colours].sort(
    (x, y) => colourDistance(y, band) - colourDistance(x, band),
  )[0];
  if (!accent || colourDistance(accent, band) < NEAR) return colour;
  const mix = (a: string, b: string, t: number) => {
    const n = (c: string) => parseInt(c.replace('#', '').slice(0, 6), 16);
    const [x, y] = [n(a), n(b)];
    return (
      '#' +
      [16, 8, 0]
        .map((k) =>
          Math.round(((x >> k) & 255) * (1 - t) + ((y >> k) & 255) * t)
            .toString(16)
            .padStart(2, '0'),
        )
        .join('')
    );
  };
  return mix(band, accent, 0.38);
}

/** The finish under a coloring: the original's with its own palette, and
 * over it the grout and band colours the learner chose. A preset palette's
 * default grout gives way when a piece is its colour (groutFor). */
export function finishOf(model: Model, coloring: Coloring): Finish {
  const original = model.tutorial.pattern.original;
  const design = designPalette(model, coloring.palette);
  if (design && (design.lines || design.band)) {
    const base: Finish = {
      lines: design.lines ?? DEFAULT_FINISH.lines,
      band: design.band ?? DEFAULT_FINISH.band,
      carved: false,
    };
    const chosen = coloring.finish;
    return chosen?.lines || chosen?.band ? { ...base, ...chosen } : base;
  }
  const preset = coloring.palette !== ORIGINAL || !original;
  const grout = preset
    ? groutFor(pieceColors(model, coloring), DEFAULT_FINISH.lines)
    : undefined;
  const base: Finish = preset
    ? grout === DEFAULT_FINISH.lines
      ? DEFAULT_FINISH
      : { ...DEFAULT_FINISH, grout }
    : {
        lines: original.lines ?? DEFAULT_FINISH.lines,
        band: original.band ?? DEFAULT_FINISH.band,
        carved: original.carved ?? false,
      };
  const own = coloring.finish;
  if (!own?.lines && !own?.band) return base;
  // A grout the learner chose is the grout.
  const { grout: _auto, ...rest } = base;
  return { ...(own.lines ? rest : base), ...own };
}

/** The grout tiles are drawn with. */
export const groutOf = (finish: Finish) => finish.grout ?? finish.lines;

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
    : model.tutorial.pattern.palettes?.[0]
      ? model.tutorial.pattern.palettes[0].name
      : model.tutorial.pattern.palette &&
          PALETTES[model.tutorial.pattern.palette]
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

/**
 * Which piece types touch: a pair of type indexes, the smaller first, for
 * every side two pieces share, over the cell and its neighbours.
 */
const touchingCache = new WeakMap<object, ReadonlySet<string>>();
export function touchingTypes(model: Model): ReadonlySet<string> {
  const cached = touchingCache.get(model.pattern);
  if (cached) return cached;
  const { u, v } = model.pattern.cell;
  const key = (x: number, y: number) => `${x.toFixed(4)},${y.toFixed(4)}`;
  const sides = new Map<string, number[]>();
  for (let i = -1; i <= 1; i++)
    for (let j = -1; j <= 1; j++)
      for (const p of model.pattern.pieces) {
        const dx = u.x * i + v.x * j;
        const dy = u.y * i + v.y * j;
        const ps = p.polygon.map((q) => key(q.x + dx, q.y + dy));
        ps.forEach((a, n) => {
          const b = ps[(n + 1) % ps.length] ?? a;
          const side = a < b ? `${a}|${b}` : `${b}|${a}`;
          const list = sides.get(side) ?? [];
          list.push(p.type);
          sides.set(side, list);
        });
      }
  const pairs = new Set<string>();
  for (const list of sides.values()) {
    const [a, b] = list;
    if (list.length === 2 && a !== undefined && b !== undefined && a !== b)
      pairs.add(a < b ? `${a},${b}` : `${b},${a}`);
  }
  touchingCache.set(model.pattern, pairs);
  return pairs;
}

/**
 * The fill for each piece type under a coloring.
 *
 * With a preset palette, two different shapes that touch never share a
 * colour where the palette allows it (STYLE.2): a tutorial maps several
 * shapes to one slot, and where those shapes meet they merged into one
 * blot (44% of the shared sides on the Arrayanes ceiling). Going from the
 * largest shape down, a shape keeps its slot unless a touching shape
 * already has that colour, and then takes the first slot that no touching
 * shape has. Every copy of a shape keeps one colour, so the symmetry is
 * the tutorial's. Colours the learner chose, and a photo's original
 * colours, are kept as they are.
 */
export function pieceColors(
  model: Model,
  coloring: Coloring = tutorialColoring(model),
): string[] {
  const palette = paletteOf(model, coloring.palette);
  const { types } = model.pattern;
  const wanted = types.map(
    (t, i) => coloring.chosen[typeKey(t)] ?? palette[slotOf(model, t, i)],
  );
  if (coloring.palette === ORIGINAL) return wanted;
  const touching = touchingTypes(model);
  const near = (a: number, b: number) =>
    touching.has(a < b ? `${a},${b}` : `${b},${a}`);
  const out: string[] = [];
  types.forEach((t, i) => {
    const want = wanted[i] ?? palette.a;
    const taken = out.flatMap((c, k) => (near(i, k) ? [c] : []));
    const free = (c: string) =>
      !taken.some((x) => x.toLowerCase() === c.toLowerCase());
    if (coloring.chosen[typeKey(t)] || free(want)) {
      out.push(want);
      return;
    }
    out.push(SLOTS.map((s) => palette[s]).find(free) ?? want);
  });
  return out;
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
