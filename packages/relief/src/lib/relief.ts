import { standOn, topOf, type Mesh } from './mesh.js';
import { depthOf, profileOf, type Carving } from './profile.js';
import { signedArea, skeletonHeight, sweep, type P2, type P3 } from './skeleton.js';

/** What the relief needs from a Tastir pattern (the engine's Pattern
 * fits): the repeat and the pieces of one tile, in pattern units. */
export interface PatternShape {
  readonly cell: { readonly u: P2; readonly v: P2 };
  readonly pieces: readonly {
    readonly polygon: readonly P2[];
    readonly type: number;
  }[];
}

export interface ReliefOptions {
  /** The panel's size in millimetres, centred on the pattern's origin. */
  readonly width: number;
  readonly height: number;
  /** Another outline in place of the rectangle: convex, counter-clockwise,
   * in millimetres around the pattern's origin (a round panel, a tile). */
  readonly outline?: readonly P2[];
  /** Millimetres for one pattern unit (OA). */
  readonly scale: number;
  /** The height of the top of the bands above the table. */
  readonly thickness: number;
  /** How wide the raised bands are, along the ink. */
  readonly band: number;
  /** A plain border around the panel, at the top (0 for none). */
  readonly frame: number;
  /** How each kind of piece (the engine's piece type) is carved. */
  readonly carving: (type: number) => Carving;
}

/** A rectangle centred on the origin, counter-clockwise. */
export function rectangle(width: number, height: number): P2[] {
  return [
    { x: -width / 2, y: -height / 2 },
    { x: width / 2, y: -height / 2 },
    { x: width / 2, y: height / 2 },
    { x: -width / 2, y: height / 2 },
  ];
}

/** A round outline: a regular polygon fine enough to print smooth. */
export function round(diameter: number, sides = 180): P2[] {
  return Array.from({ length: sides }, (_, i) => {
    const a = (2 * Math.PI * i) / sides;
    return { x: (diameter / 2) * Math.cos(a), y: (diameter / 2) * Math.sin(a) };
  });
}

/** The thinnest the panel may be under any carving. */
export const MIN_BASE = 1;

/** A pattern's pieces copied over a rectangle, in millimetres,
 * counter-clockwise, with their types. */
export function piecesOver(
  pattern: PatternShape,
  scale: number,
  half: P2,
): { polygon: P2[]; type: number }[] {
  const { u, v } = pattern.cell;
  const det = u.x * v.y - u.y * v.x;
  if (Math.abs(det) < 1e-12) throw new Error('The pattern has no repeat.');
  // Which copies of the tile can reach the rectangle.
  let reach = 0;
  for (const p of pattern.pieces)
    for (const q of p.polygon) reach = Math.max(reach, Math.hypot(q.x, q.y));
  const ex = half.x / scale + reach;
  const ey = half.y / scale + reach;
  const span = [
    [-ex, -ey],
    [ex, -ey],
    [ex, ey],
    [-ex, ey],
  ].map(([x, y]) => ({
    i: (x! * v.y - y! * v.x) / det,
    j: (u.x * y! - u.y * x!) / det,
  }));
  const i0 = Math.floor(Math.min(...span.map((s) => s.i)));
  const i1 = Math.ceil(Math.max(...span.map((s) => s.i)));
  const j0 = Math.floor(Math.min(...span.map((s) => s.j)));
  const j1 = Math.ceil(Math.max(...span.map((s) => s.j)));
  const out: { polygon: P2[]; type: number }[] = [];
  for (let i = i0; i <= i1; i++)
    for (let j = j0; j <= j1; j++)
      for (const piece of pattern.pieces) {
        const polygon = piece.polygon.map((p) => ({
          x: (p.x + i * u.x + j * v.x) * scale,
          y: (p.y + i * u.y + j * v.y) * scale,
        }));
        const xs = polygon.map((p) => p.x);
        const ys = polygon.map((p) => p.y);
        if (
          Math.max(...xs) < -half.x ||
          Math.min(...xs) > half.x ||
          Math.max(...ys) < -half.y ||
          Math.min(...ys) > half.y
        )
          continue;
        if (signedArea(polygon) < 0) polygon.reverse();
        out.push({ polygon, type: piece.type });
      }
  return out;
}

/** The carved top of one piece: flat faces facing up. */
export function carvePiece(
  polygon: readonly P2[],
  carving: Carving,
  top: number,
  band: number,
): P3[][] {
  if (carving.kind === 'raised') return [polygon.map((p) => ({ ...p, z: top }))];
  const height = carving.kind === 'cushion' ? skeletonHeight(polygon) : 0;
  const profile = profileOf(carving, top, band, height);
  const s = sweep(polygon, profile.stops, profile.end);
  const faces = s.faces.map((f) => f.map((p) => ({ x: p.x, y: p.y, z: profile.z(p.z) })));
  const floorZ = profile.z(profile.end);
  for (const f of s.floor) faces.push(f.map((p) => ({ ...p, z: floorZ })));
  return faces;
}

/**
 * A carved panel as a closed mesh in millimetres, standing on z = 0 with
 * its carved face up. Throws, naming the kind of piece, when a carving
 * would go through the panel.
 */
export function relief(pattern: PatternShape, options: ReliefOptions): Mesh {
  const { top, outline } = reliefTop(pattern, options);
  return standOn(top, outline);
}

/** The carved face of a panel, as flat faces over its outline (with the
 * frame), and the outline: what a panel and its mould are both made from. */
export function reliefTop(
  pattern: PatternShape,
  options: ReliefOptions,
): { top: P3[][]; outline: P2[] } {
  const { scale, thickness, band, frame } = options;
  const outline = options.outline ?? rectangle(options.width, options.height);
  if (outline.length < 3 || !(signedArea(outline) > 0) || !(scale > 0))
    throw new Error('The panel needs a size and a scale.');
  for (let i = 0; i < outline.length; i++) {
    const a = outline[i]!;
    const b = outline[(i + 1) % outline.length]!;
    const c = outline[(i + 2) % outline.length]!;
    if ((b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x) < -1e-9)
      throw new Error('The panel outline must be convex.');
  }
  if (!(band > 0)) throw new Error('The bands need a width.');
  if (!(thickness > MIN_BASE)) throw new Error(`The panel must be thicker than ${MIN_BASE} mm.`);
  const xs = outline.map((p) => p.x);
  const ys = outline.map((p) => p.y);
  const half = {
    x: Math.max(...xs.map(Math.abs)),
    y: Math.max(...ys.map(Math.abs)),
  };
  if (frame < 0 || 2 * frame >= Math.min(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)))
    throw new Error('The frame leaves no room for the pattern.');
  const types = new Set(pattern.pieces.map((p) => p.type));
  for (const type of types) {
    const depth = depthOf(options.carving(type));
    if (depth > thickness - MIN_BASE)
      throw new Error(
        `Piece kind ${type + 1} is carved ${depth} mm deep, which leaves less than ${MIN_BASE} mm of a ${thickness} mm panel.`,
      );
  }
  const surface: P3[][] = [];
  for (const piece of piecesOver(pattern, scale, half))
    surface.push(...carvePiece(piece.polygon, options.carving(piece.type), thickness, band));
  return {
    top: topOf({ surface, outline, frame, top: thickness }),
    outline: outline.slice(),
  };
}
