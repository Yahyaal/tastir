import { rectangle, round, type Carving, type P2, type PatternShape } from '@tastir/relief';

/** What the learner makes: a rectangular panel, a round one, or one tile
 * of the repeat, which fits its copies edge to edge. */
export type Shape = 'panel' | 'round' | 'tile';
/** How a kind of piece is carved. */
export type Style = 'facets' | 'flat' | 'cushion' | 'raised';

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
  /** The carving of each kind of piece (the engine's type), when not facets. */
  readonly kinds: Readonly<Record<number, Style>>;
}

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
  kinds: {},
};

/** Choosing a shape sets the frame that suits it: a panel or a medallion
 * is framed like plasterwork; a tile has none, so its copies join. */
export const FRAME_OF: Readonly<Record<Shape, number>> = {
  panel: 8,
  round: 8,
  tile: 0,
};

export const STYLES: readonly { style: Style; name: string }[] = [
  { style: 'facets', name: 'Facets' },
  { style: 'flat', name: 'Flat' },
  { style: 'cushion', name: 'Cushion' },
  { style: 'raised', name: 'Raised' },
];

export const SHAPES: readonly { shape: Shape; name: string }[] = [
  { shape: 'panel', name: 'Panel' },
  { shape: 'round', name: 'Round' },
  { shape: 'tile', name: 'Tile' },
];

export const styleOf = (s: MakeSettings, type: number): Style => s.kinds[type] ?? 'facets';

export function carvingOf(s: MakeSettings, style: Style): Carving {
  const depth = Math.min(s.depth, s.thickness - FLOOR);
  switch (style) {
    case 'raised':
      return { kind: 'raised' };
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
  return rectangle(s.width, s.height);
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
    kinds,
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
