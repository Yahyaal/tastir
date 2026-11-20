import { isOnOutline, standOn, topOf, type Mesh, type Pin } from './mesh.js';
import { partsOf, type Cuts } from './parts.js';
import { bandEdge, depthOf, profileOf, type BandShape, type Carving } from './profile.js';
import { walls, weaveTop, type Crossing, type Tag, type TaggedFace } from './weave.js';
import { signedArea, skeletonHeight, sweep, type P2, type P3 } from './skeleton.js';

/** What the relief needs from a Tastir pattern (the engine's Pattern
 * fits): the repeat and the pieces of one tile, in pattern units. */
export interface PatternShape {
  readonly cell: { readonly u: P2; readonly v: P2 };
  readonly pieces: readonly {
    readonly polygon: readonly P2[];
    readonly type: number;
  }[];
  /** Which band is on top at each crossing (the engine's weave): the
   * crossings of the tiles of one repeat, `repeat` tiles along u and v. */
  readonly weave?: {
    readonly repeat: readonly [number, number];
    readonly crossings: readonly {
      readonly at: P2;
      readonly i: number;
      readonly j: number;
      readonly over: P2;
      readonly under: P2;
    }[];
  };
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
  /** The bands' cross-section (flat when left out). */
  readonly bands?: BandShape;
  /** Woven bands: the band underneath passes this far below the top
   * band's edge at each crossing (needs the pattern's weave). */
  readonly gap?: number;
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
 * counter-clockwise, with their types: the k-th piece of the tile copied
 * i times along u and j times along v. */
export function piecesOver(
  pattern: PatternShape,
  scale: number,
  half: P2,
): { polygon: P2[]; type: number; k: number; i: number; j: number }[] {
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
  const out: { polygon: P2[]; type: number; k: number; i: number; j: number }[] = [];
  for (let i = i0; i <= i1; i++)
    for (let j = j0; j <= j1; j++)
      pattern.pieces.forEach((piece, k) => {
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
          return;
        if (signedArea(polygon) < 0) polygon.reverse();
        out.push({ polygon, type: piece.type, k, i, j });
      });
  return out;
}

/** The carved top of one piece: flat faces facing up. */
export function carvePiece(
  polygon: readonly P2[],
  carving: Carving,
  top: number,
  band: number,
  bands: BandShape = 'flat',
): P3[][] {
  return carveTagged(polygon, carving, top, band, bands, false).map((f) => f.face);
}

/** The carved top of one piece, each face marked as band, carving, or
 * the level inside of a raised piece. `apart` keeps a raised piece's band
 * strip apart from its inside, for weaving. */
function carveTagged(
  polygon: readonly P2[],
  carving: Carving,
  top: number,
  band: number,
  bands: BandShape,
  apart: boolean,
): TaggedFace[] {
  if (carving.kind === 'raised' && !apart)
    return [{ face: polygon.map((p) => ({ ...p, z: top })), tag: 'level' }];
  const height = carving.kind === 'cushion' ? skeletonHeight(polygon) : 0;
  const profile = profileOf(carving, top, band, height, bands);
  const s = sweep(polygon, profile.stops, profile.end);
  const h = band / 2 + 1e-9;
  const faces: TaggedFace[] = s.faces.map((f) => ({
    face: f.map((p) => ({ x: p.x, y: p.y, z: profile.z(p.z) })),
    tag: (f.every((p) => p.z <= h) ? 'band' : 'field') as Tag,
  }));
  // A pierced piece's inside is carved at the table, for the walls to
  // close down to; the object leaves it out, a mould stands it up as a post.
  const floorZ = carving.kind === 'pierced' ? 0 : profile.z(profile.end);
  const floorTag: Tag =
    carving.kind === 'raised' ? 'level' : carving.kind === 'pierced' ? 'hole' : 'field';
  for (const f of s.floor) faces.push({ face: f.map((p) => ({ ...p, z: floorZ })), tag: floorTag });
  return faces;
}

/** The weave's crossings copied over a rectangle, in millimetres. */
function crossingsOver(pattern: PatternShape, scale: number, half: P2): Crossing[] {
  const w = pattern.weave;
  if (!w) return [];
  const { u, v } = pattern.cell;
  const [m, n] = w.repeat;
  const U = { x: u.x * m, y: u.y * m };
  const V = { x: v.x * n, y: v.y * n };
  const det = U.x * V.y - U.y * V.x;
  const ex = half.x / scale + Math.hypot(U.x, U.y) + Math.hypot(V.x, V.y);
  const ey = half.y / scale + Math.hypot(U.x, U.y) + Math.hypot(V.x, V.y);
  const span = [
    [-ex, -ey],
    [ex, -ey],
    [ex, ey],
    [-ex, ey],
  ].map(([x, y]) => ({ i: (x! * V.y - y! * V.x) / det, j: (U.x * y! - U.y * x!) / det }));
  const i0 = Math.floor(Math.min(...span.map((s) => s.i)));
  const i1 = Math.ceil(Math.max(...span.map((s) => s.i)));
  const j0 = Math.floor(Math.min(...span.map((s) => s.j)));
  const j1 = Math.ceil(Math.max(...span.map((s) => s.j)));
  const out: Crossing[] = [];
  const reach = 1 + 4 / scale;
  for (let i = i0; i <= i1; i++)
    for (let j = j0; j <= j1; j++)
      for (const c of w.crossings) {
        const x = (c.at.x + i * U.x + j * V.x) * scale;
        const y = (c.at.y + i * U.y + j * V.y) * scale;
        if (Math.abs(x) > half.x + reach * scale || Math.abs(y) > half.y + reach * scale) continue;
        out.push({ at: { x, y }, over: c.over, under: c.under });
      }
  return out;
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
  const { surface, outline } = reliefSurface(pattern, options);
  return {
    top: topOf({ surface, outline, frame: options.frame, top: options.thickness }),
    outline,
  };
}

/** The carved pieces over the whole outline, before the frame and the
 * outline cut them: what each part of a large panel is cut from. */
export function reliefSurface(
  pattern: PatternShape,
  options: ReliefOptions,
): { surface: P3[][]; outline: P2[]; dips: number; tagged: TaggedFace[] } {
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
  const bands = options.bands ?? 'flat';
  const woven = options.gap !== undefined && options.gap > 0 && pattern.weave !== undefined;
  const pieces = piecesOver(pattern, scale, half);
  const tagged: TaggedFace[] = [];
  for (const piece of pieces)
    tagged.push(...carveTagged(piece.polygon, options.carving(piece.type), thickness, band, bands, woven));
  const pierced = tagged.some((f) => f.tag === 'hole');
  let faces = tagged;
  let dips = 0;
  if (woven) {
    const corners = pieces.flatMap((p) => p.polygon);
    ({ faces, dips } = weaveTop(tagged, crossingsOver(pattern, scale, half), corners, {
      gap: options.gap!,
      band,
      edge: bandEdge(bands, band),
      top: thickness,
    }));
  }
  const surface = faces.map((f) => f.face);
  if (woven || pierced) surface.push(...walls(surface));
  return { surface, outline: outline.slice(), dips, tagged: faces };
}

/** One part of a large object, closed and ready to print. */
export interface MeshPart {
  readonly name: string;
  /** From the left and from the top, from 0. */
  readonly column: number;
  readonly row: number;
  readonly mesh: Mesh;
  /** Its outline, in the whole object's place. */
  readonly outline: P2[];
  /** How many pin holes it has. */
  readonly pins: number;
}

/**
 * A panel too large for the bed, as parts cut at `cuts`, each with the
 * whole panel's frame on its outer sides only and pin holes at `pins`
 * along its seams.
 */
export function panelParts(
  surface: readonly (readonly P3[])[],
  outline: readonly P2[],
  options: Pick<ReliefOptions, 'frame' | 'thickness'>,
  cuts: Cuts,
  pins: readonly Pin[],
): MeshPart[] {
  const solid = { surface, outline, frame: options.frame, top: options.thickness };
  return partsOf(outline, cuts).map((part) => {
    const mine = pins.filter((p) => isOnOutline(p.centre, part.outline) && !isOnOutline(p.centre, outline));
    return {
      name: part.name,
      column: part.column,
      row: part.row,
      mesh: standOn(topOf(solid, part.cell), part.outline, 0, mine),
      outline: part.outline,
      pins: mine.length,
    };
  });
}
