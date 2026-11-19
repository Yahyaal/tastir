import {
  boxOutline,
  cutsFor,
  type BandShape,
  type Cuts,
  type Repeat,
  mouldOutline,
  rectangle,
  round,
  type Carving,
  type P2,
  type PatternShape,
} from '@tastir/relief';
import { BOX_WALL, SPLIT_FLOOR, type Print } from './carve';

/** What the learner makes: a rectangular panel, a round one, one tile
 * of the repeat, which fits its copies edge to edge, or a long border. */
export type Shape = 'panel' | 'round' | 'tile' | 'border';
/** A border's ends: square, or cut at 45° so four borders make a frame. */
export type Ends = 'square' | 'mitred';
/** How a kind of piece is carved. */
export type Style = 'facets' | 'flat' | 'cushion' | 'raised' | 'pierced';

export interface MakeSettings {
  readonly shape: Shape;
  /** The panel's width and height, or the round panel's diameter (width). */
  readonly width: number;
  readonly height: number;
  /** The width of one repeat of the pattern. */
  readonly repeat: number;
  readonly thickness: number;
  readonly depth: number;
  readonly band: number;
  readonly frame: number;
  readonly ends: Ends;
  /** The bands' cross-section. */
  readonly bands: BandShape;
  /** Whether the bands weave over and under, and by how much. */
  readonly woven: boolean;
  readonly gap: number;
  /** The carving of each kind of piece (the engine's type), when not facets. */
  readonly kinds: Readonly<Record<number, Style>>;
  /** What is printed: the object, a mould for plaster, or a silicone box. */
  readonly print: Print;
  /** The plaster mould's floor under the face, and its rim. */
  readonly mouldFloor: number;
  readonly mouldWall: number;
  /** Silicone round the master and over it. */
  readonly boxGap: number;
  readonly boxCover: number;
  /** Grams of water to 100 g of plaster. */
  readonly water: number;
}

export const PRINTS: readonly { print: Print; name: string; hint: string }[] = [
  {
    print: 'object',
    name: 'The object',
    hint: 'Print it to keep, or as the master for a silicone mould.',
  },
  {
    print: 'mould',
    name: 'Mould for plaster',
    hint: 'A rigid mould: brush it with release agent, pour plaster level with the rim, and turn the cast out face up.',
  },
  {
    print: 'box',
    name: 'Box for silicone',
    hint: 'Glue the printed object face up on a flat board, stand this box round it, and pour silicone to the top. The silicone mould casts plaster many times.',
  },
];

/** Silicone, grams per millilitre (most are 1.08 to 1.2; the tin says). */
export const SILICONE = 1.1;

/** The Bambu Lab A1's bed, in millimetres. */
export const BED = 256;
/** A band narrower than two lines of a 0.4 mm nozzle prints poorly. */
export const NARROWEST_BAND = 0.8;
/** PLA, grams per cubic centimetre. */
export const PLA = 1.24;
/** Sloped and drafted walls: steep enough to read, easy for a mould. */
export const SLOPE = 35;
export const DRAFT = 6;
/** Thinnest floor kept under the deepest carving. */
export const FLOOR = 1;

export const DEFAULT_SETTINGS: MakeSettings = {
  shape: 'panel',
  width: 200,
  height: 200,
  repeat: 100,
  thickness: 12,
  depth: 8,
  band: 3,
  frame: 8,
  ends: 'square',
  bands: 'flat',
  woven: true,
  gap: 1.5,
  kinds: {},
  print: 'object',
  mouldFloor: 3,
  mouldWall: 6,
  boxGap: 10,
  boxCover: 8,
  water: 70,
};

/** Choosing a shape sets the frame that suits it: a panel or a medallion
 * is framed like plasterwork; a tile has none, so its copies join. */
export const FRAME_OF: Readonly<Record<Shape, number>> = {
  panel: 8,
  round: 8,
  tile: 0,
  border: 8,
};

/** A border, when first chosen: 600 mm long, one repeat between its frames. */
export const borderOf = (s: MakeSettings): Partial<MakeSettings> => ({
  width: Math.max(s.width, 600),
  height: s.repeat + 2 * FRAME_OF.border,
});

export const STYLES: readonly { style: Style; name: string }[] = [
  { style: 'facets', name: 'Facets' },
  { style: 'flat', name: 'Flat' },
  { style: 'cushion', name: 'Cushion' },
  { style: 'raised', name: 'Raised' },
  { style: 'pierced', name: 'Pierced' },
];

export const SHAPES: readonly { shape: Shape; name: string }[] = [
  { shape: 'panel', name: 'Panel' },
  { shape: 'round', name: 'Round' },
  { shape: 'tile', name: 'Tile' },
  { shape: 'border', name: 'Border' },
];

export const BANDS: readonly { bands: BandShape; name: string }[] = [
  { bands: 'flat', name: 'Flat' },
  { bands: 'rounded', name: 'Rounded' },
  { bands: 'double', name: 'Double' },
];

/** A screen's bridges thinner than this (about four printed lines) may
 * break. */
export const NARROWEST_BRIDGE = 1.5;

/** The narrowest bridge of a pierced screen: the band between two holes,
 * or the frame where a hole meets it. Undefined with nothing pierced. */
export function bridgeOf(s: MakeSettings, kinds: number): number | undefined {
  const pierced = Array.from({ length: kinds }, (_, i) => styleOf(s, i)).includes('pierced');
  if (!pierced) return undefined;
  const frame = s.shape === 'tile' ? 0 : s.frame;
  return frame > 0 ? Math.min(s.band, frame) : s.band;
}

/** The thinnest gap that prints: three layers of 0.2 mm. */
export const MIN_GAP = 0.6;

/** The gap the weave uses: at least three layers, at most a third of the
 * carving's depth. */
export function gapOf(s: MakeSettings): number {
  const depth = Math.min(s.depth, s.thickness - FLOOR);
  return Math.max(MIN_GAP, Math.min(s.gap, depth / 3));
}

/** The bed less room for a brim: no part is longer. */
export const PART = 250;

export const styleOf = (s: MakeSettings, type: number): Style => s.kinds[type] ?? 'facets';

export function carvingOf(s: MakeSettings, style: Style): Carving {
  const depth = Math.min(s.depth, s.thickness - FLOOR);
  switch (style) {
    case 'raised':
      return { kind: 'raised' };
    case 'pierced':
      return { kind: 'pierced' };
    case 'flat':
      return { kind: 'flat', depth, draft: DRAFT };
    case 'cushion':
      return { kind: 'cushion', depth, draft: DRAFT, rise: depth * 0.45 };
    case 'facets':
      return { kind: 'facets', slope: SLOPE, depth };
  }
}

/** Millimetres for one pattern unit. */
export function scaleOf(pattern: PatternShape, s: MakeSettings): number {
  const { u } = pattern.cell;
  return s.repeat / Math.hypot(u.x, u.y);
}

/** The outline of what is made, in millimetres, around the pattern's origin. */
export function outlineOf(
  pattern: PatternShape & { cell: { corners?: readonly P2[] } },
  s: MakeSettings,
): P2[] {
  if (s.shape === 'round') return round(s.width);
  if (s.shape === 'tile') {
    const scale = scaleOf(pattern, s);
    const corners = (pattern.cell.corners ?? []).map((p) => ({
      x: p.x * scale,
      y: p.y * scale,
    }));
    let area = 0;
    for (let i = 0; i < corners.length; i++) {
      const p = corners[i]!;
      const q = corners[(i + 1) % corners.length]!;
      area += p.x * q.y - q.x * p.y;
    }
    return area < 0 ? corners.reverse() : corners;
  }
  if (s.shape === 'border' && s.ends === 'mitred') {
    // The inner side is shorter by the height at each end.
    const w = s.width / 2;
    const h = s.height / 2;
    const inner = Math.max(w - s.height, 1);
    return [
      { x: -w, y: -h },
      { x: w, y: -h },
      { x: inner, y: h },
      { x: -inner, y: h },
    ];
  }
  return rectangle(s.width, s.height);
}

/** The lines the pattern repeats along, upright and level, in
 * millimetres: the shortest repeats straight across and straight up. */
export function repeatsOf(pattern: PatternShape, s: MakeSettings): { x?: Repeat; y?: Repeat } {
  const { u, v } = pattern.cell;
  const scale = scaleOf(pattern, s);
  const tiny = 1e-6 * Math.hypot(u.x, u.y);
  let x: number | undefined;
  let y: number | undefined;
  for (let i = -4; i <= 4; i++)
    for (let j = -4; j <= 4; j++) {
      const w = { x: i * u.x + j * v.x, y: i * u.y + j * v.y };
      if (Math.abs(w.y) < tiny && w.x > tiny && (x === undefined || w.x < x)) x = w.x;
      if (Math.abs(w.x) < tiny && w.y > tiny && (y === undefined || w.y < y)) y = w.y;
    }
  return {
    ...(x ? { x: { step: x * scale, at: 0 } } : {}),
    ...(y ? { y: { step: y * scale, at: 0 } } : {}),
  };
}

/** Where what is printed is cut into parts that fit the bed: on the
 * pattern's repeat where it can be (mirrored for a mould). A silicone box
 * is never cut. */
export function cutsOf(pattern: PatternShape, outline: readonly P2[], s: MakeSettings): Cuts {
  if (s.print === 'box' || !outline.length) return { xs: [], ys: [] };
  const r = repeatsOf(pattern, s);
  return cutsFor(printedOutline(outline, s), PART, {
    ...(r.x ? { x: s.print === 'mould' ? { step: r.x.step, at: -r.x.at } : r.x } : {}),
    ...(r.y ? { y: r.y } : {}),
  });
}

/** The outline of what is printed: the object, its mould or its box. */
export function printedOutline(outline: readonly P2[], s: MakeSettings): P2[] {
  if (s.print === 'mould') return mouldOutline(outline, s.mouldWall);
  if (s.print === 'box') return boxOutline(outline, { gap: s.boxGap, wall: BOX_WALL });
  return outline.slice();
}

/** How tall what is printed stands. */
export function printedHeight(s: MakeSettings, split = false): number {
  if (s.print === 'mould') return Math.max(s.mouldFloor, split ? SPLIT_FLOOR : 0) + s.thickness;
  if (s.print === 'box') return s.thickness + s.boxCover;
  return s.thickness;
}

/** The outline's width and height. */
export function extent(outline: readonly P2[]): { width: number; height: number } {
  const xs = outline.map((p) => p.x);
  const ys = outline.map((p) => p.y);
  return {
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
  };
}

/** Clamps what was read or typed to sizes that make sense. */
export function sane(s: Partial<MakeSettings>): MakeSettings {
  const num = (v: unknown, min: number, max: number, fallback: number) =>
    typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;
  const d = DEFAULT_SETTINGS;
  const thickness = num(s.thickness, 2, 60, d.thickness);
  const kinds: Record<number, Style> = {};
  if (s.kinds && typeof s.kinds === 'object')
    for (const [k, v] of Object.entries(s.kinds))
      if (STYLES.some((x) => x.style === v) && /^\d+$/.test(k)) kinds[Number(k)] = v;
  const width = num(s.width, 20, 1000, d.width);
  const height = num(s.height, 20, 1000, d.height);
  return {
    shape: SHAPES.some((x) => x.shape === s.shape) ? s.shape! : d.shape,
    width,
    height,
    repeat: num(s.repeat, 10, 1000, d.repeat),
    thickness,
    depth: num(s.depth, 0.4, thickness - FLOOR, Math.min(d.depth, thickness - FLOOR)),
    band: num(s.band, 0.4, 20, d.band),
    frame: num(s.frame, 0, Math.min(width, height) / 2 - 5, d.frame),
    ends: s.ends === 'mitred' ? 'mitred' : 'square',
    bands: BANDS.some((b) => b.bands === s.bands) ? s.bands! : d.bands,
    woven: typeof s.woven === 'boolean' ? s.woven : d.woven,
    gap: num(s.gap, MIN_GAP, 20, d.gap),
    kinds,
    print: PRINTS.some((x) => x.print === s.print) ? s.print! : d.print,
    mouldFloor: num(s.mouldFloor, 1, 20, d.mouldFloor),
    mouldWall: num(s.mouldWall, 2, 30, d.mouldWall),
    boxGap: num(s.boxGap, 3, 40, d.boxGap),
    boxCover: num(s.boxCover, 3, 40, d.boxCover),
    water: num(s.water, 20, 120, d.water),
  };
}

const KEY = (id: string) => `tastir.make.${id}`;

export function rememberedSettings(id: string): MakeSettings {
  try {
    const raw = localStorage.getItem(KEY(id));
    return raw ? sane(JSON.parse(raw) as Partial<MakeSettings>) : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function rememberSettings(id: string, s: MakeSettings): void {
  try {
    localStorage.setItem(KEY(id), JSON.stringify(s));
  } catch {
    // A browser that keeps nothing still makes the object.
  }
}
