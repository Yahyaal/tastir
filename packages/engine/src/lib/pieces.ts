import type { Tutorial } from '@tastir/schema';
import { arrangement, signedArea } from './arrangement.js';
import { pointInPolygon, TutorialError, type Scene } from './evaluate.js';
import { inkStrokes, type InkStroke } from './ink.js';
import { segment, type Segment } from './shapes.js';
import { add, cross, distance, dot, scale, sub, vec, type Vec } from './vec.js';

/** The repeating cell: a parallelogram at `origin` spanned by `u` and `v`. */
export interface Cell {
  readonly origin: Vec;
  readonly u: Vec;
  readonly v: Vec;
  readonly corners: readonly Vec[];
  readonly area: number;
}

export interface PieceType {
  /** The name from the tutorial's expect block, when one matches. */
  readonly name?: string;
  readonly vertices: number;
  readonly area: number;
  readonly perimeter: number;
  /** Side lengths, shortest first. */
  readonly sides: readonly number[];
  /** How many pieces of this type each cell holds. */
  readonly perCell: number;
  /** Too thin to cut from tile (area / perimeter² below 0.02). */
  readonly sliver: boolean;
}

export interface Piece {
  /** Corners, counter-clockwise, without straight-through vertices. */
  readonly polygon: readonly Vec[];
  /** Index into `Pattern.types`. */
  readonly type: number;
}

export interface Pattern {
  readonly cell: Cell;
  readonly ink: readonly InkStroke[];
  /** The pieces belonging to the central cell; translate by u and v to tile. */
  readonly pieces: readonly Piece[];
  /** Largest first. */
  readonly types: readonly PieceType[];
}

const SLIVER = 0.02;

/**
 * Inks the tutorial, finds the closed pieces over a 3×3 neighbourhood of
 * the cell so pieces crossing its edges come out whole, keeps the ones
 * whose centroid lies in the cell, and groups them into types by shape.
 */
export function computePattern(
  scene: Scene,
  tutorial: Tutorial,
  /** Ink to use instead of the tutorial's own, for free inking. */
  ink: readonly InkStroke[] = inkStrokes(scene, tutorial),
): Pattern {
  const { eps } = scene.tol;
  const cell = cellOf(scene, tutorial.pattern.cell);

  const segments: Segment[] = [];
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      const shift = add(scale(cell.u, i), scale(cell.v, j));
      for (const { segment: s } of ink)
        segments.push(segment(add(s.a, shift), add(s.b, shift)));
    }
  }

  const inCell = (p: Vec) => {
    // Coordinates of p in the cell's (u, v) basis; [0, 1) on each.
    const d = sub(p, cell.origin);
    const det = cross(cell.u, cell.v);
    const snap = (t: number) =>
      Math.abs(t - Math.round(t)) <= eps ? Math.round(t) : t;
    const s = snap(cross(d, cell.v) / det);
    const t = snap(cross(cell.u, d) / det);
    return s >= 0 && s < 1 && t >= 0 && t < 1;
  };

  const polygons = arrangement(segments, scene.tol)
    .map((f) => simplify(f, eps))
    .filter((f) => inCell(centroid(f)));

  const types: (Omit<PieceType, 'perCell' | 'name'> & { perCell: number })[] =
    [];
  const pieces: Piece[] = polygons.map((polygon) => {
    const shape = measure(polygon);
    let index = types.findIndex((t) => congruent(t, shape, eps));
    if (index < 0) {
      index = types.length;
      types.push({
        ...shape,
        perCell: 0,
        sliver: shape.area / shape.perimeter ** 2 < SLIVER,
      });
    }
    (types[index] as { perCell: number }).perCell++;
    return { polygon, type: index };
  });

  // Largest type first, so the order does not depend on the face walk.
  const order = types
    .map((_, i) => i)
    .sort(
      (a, b) => (types[b] as PieceType).area - (types[a] as PieceType).area,
    );
  const rank = new Map(order.map((old, i) => [old, i]));
  const named = order.map((i) => {
    const t = types[i] as PieceType;
    const match = tutorial.expect.pieces.filter(
      (p) =>
        p.vertices === t.vertices &&
        Math.abs(p.area - t.area) <= 5e-6 * Math.max(1, p.area),
    );
    return match.length === 1
      ? { ...t, name: (match[0] as { name: string }).name }
      : t;
  });
  return {
    cell,
    ink,
    pieces: pieces.map((p) => ({ ...p, type: rank.get(p.type) as number })),
    types: named,
  };
}

/** The pattern cell; in format v0 it must be a rectangle. */
export function cellOf(scene: Scene, name: string): Cell {
  const fail = (reason: string): never => {
    throw new TutorialError('pattern', name, reason);
  };
  const g = scene.elements.get(name)?.geometry;
  if (g?.kind !== 'polygon') return fail('the cell must be a polygon');
  const [o, b, c, d] = g.vertices as Vec[];
  if (g.vertices.length !== 4 || !o || !b || !c || !d)
    return fail('the cell must have four corners');
  const u = sub(b, o);
  const v = sub(d, o);
  const square = (x: Vec, y: Vec) =>
    Math.abs(dot(x, y)) <=
    scene.tol.eps * Math.hypot(x.x, x.y) * Math.hypot(y.x, y.y);
  if (!square(u, v) || distance(add(o, add(u, v)), c) > scene.tol.eps) {
    fail('the cell must be a rectangle in format v0');
  }
  return { origin: o, u, v, corners: g.vertices, area: Math.abs(cross(u, v)) };
}

/** Drops corners where the outline runs straight on. */
function simplify(polygon: Vec[], eps: number): Vec[] {
  return polygon.filter((p, i) => {
    const prev = polygon[(i - 1 + polygon.length) % polygon.length] as Vec;
    const next = polygon[(i + 1) % polygon.length] as Vec;
    const a = sub(p, prev);
    const b = sub(next, p);
    const straight =
      Math.abs(cross(a, b)) <=
        eps * Math.hypot(a.x, a.y) * Math.hypot(b.x, b.y) && dot(a, b) > 0;
    return !straight;
  });
}

function centroid(polygon: readonly Vec[]): Vec {
  let cx = 0;
  let cy = 0;
  polygon.forEach((p, i) => {
    const q = polygon[(i + 1) % polygon.length] as Vec;
    const w = cross(p, q);
    cx += (p.x + q.x) * w;
    cy += (p.y + q.y) * w;
  });
  const a = 6 * signedArea(polygon);
  return vec(cx / a, cy / a);
}

interface Shape {
  readonly vertices: number;
  readonly area: number;
  readonly perimeter: number;
  readonly sides: readonly number[];
}

function measure(polygon: readonly Vec[]): Shape {
  const sides = polygon
    .map((p, i) => distance(p, polygon[(i + 1) % polygon.length] as Vec))
    .sort((a, b) => a - b);
  const perimeter = sides.reduce((s, x) => s + x, 0);
  return {
    vertices: polygon.length,
    area: signedArea(polygon),
    perimeter,
    sides,
  };
}

/** Same shape, by vertex count, area, perimeter and side lengths. */
function congruent(a: Shape, b: Shape, eps: number): boolean {
  // Corners are only known to within eps, so lengths may differ by a few
  // eps and areas by about eps times the perimeter.
  const len = 4 * eps;
  return (
    a.vertices === b.vertices &&
    Math.abs(a.area - b.area) <= len * Math.max(a.perimeter, b.perimeter) &&
    Math.abs(a.perimeter - b.perimeter) <= len * a.vertices &&
    a.sides.every((s, i) => Math.abs(s - (b.sides[i] as number)) <= len)
  );
}

/**
 * The piece of the tiled pattern under point p, anywhere in the plane: its
 * index in `pattern.pieces` and the shift that carries that piece to p.
 * Undefined on a line between pieces or where nothing is inked.
 */
export function pieceAt(
  pattern: Pattern,
  p: Vec,
): { index: number; shift: Vec } | undefined {
  const { cell } = pattern;
  const det = cross(cell.u, cell.v);
  const d = sub(p, cell.origin);
  // Which copy of the cell p is in, then p moved back into the cell.
  const i = Math.floor(cross(d, cell.v) / det);
  const j = Math.floor(cross(cell.u, d) / det);
  const home = sub(p, add(scale(cell.u, i), scale(cell.v, j)));
  for (let a = -1; a <= 1; a++) {
    for (let b = -1; b <= 1; b++) {
      const shift = add(scale(cell.u, a), scale(cell.v, b));
      const local = sub(home, shift);
      const index = pattern.pieces.findIndex((piece) =>
        pointInPolygon(local, piece.polygon),
      );
      if (index >= 0) {
        return {
          index,
          shift: add(shift, add(scale(cell.u, i), scale(cell.v, j))),
        };
      }
    }
  }
  return undefined;
}
