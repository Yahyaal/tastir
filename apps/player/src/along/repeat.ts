import type { Cell, Segment, Vec } from '@tastir/engine';

/**
 * Repeating the tile by hand: copies of the learner's inked tile, each at
 * an offset from the original. A copy at a slide of the tile (i·u + j·v)
 * joins its neighbours edge to edge; one dropped elsewhere stays loose.
 */

export interface Copy {
  /** Where the copy sits, as an offset from the original tile. */
  readonly at: Vec;
}

const EPS = 1e-6;
const same = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.y - b.y) < EPS;
const plus = (a: Vec, b: Vec): Vec => ({ x: a.x + b.x, y: a.y + b.y });

/** The tile's lattice coordinates of an offset (i, j with at = i·u + j·v). */
function coords(cell: Cell, at: Vec): { i: number; j: number } {
  const { u, v } = cell;
  const det = u.x * v.y - u.y * v.x;
  return {
    i: (at.x * v.y - at.y * v.x) / det,
    j: (u.x * at.y - u.y * at.x) / det,
  };
}

/** The lattice position nearest an offset. */
export function nearestSlot(cell: Cell, at: Vec): Vec {
  const { i, j } = coords(cell, at);
  const ri = Math.round(i);
  const rj = Math.round(j);
  return {
    x: cell.u.x * ri + cell.v.x * rj,
    y: cell.u.y * ri + cell.v.y * rj,
  };
}

/** Whether a copy sits on the lattice, joined to its neighbours. */
export const snapped = (cell: Cell, at: Vec) => same(nearestSlot(cell, at), at);

/** The tile's size, for the snap distance. */
export const tileSize = (cell: Cell) =>
  Math.sqrt(Math.abs(cell.u.x * cell.v.y - cell.u.y * cell.v.x));

/**
 * The slides that put a copy edge to edge with the tile: four for a
 * square, six for a hexagon (a slide counts when the moved tile shares a
 * whole side with the tile).
 */
export function neighbourSlides(cell: Cell): Vec[] {
  const { u, v, corners } = cell;
  const tries = [u, v, plus(u, v), { x: u.x - v.x, y: u.y - v.y }].flatMap(
    (d) => [d, { x: -d.x, y: -d.y }],
  );
  return tries.filter((d) => {
    const moved = corners.map((c) => plus(c, d));
    return moved.filter((m) => corners.some((c) => same(c, m))).length >= 2;
  });
}

/**
 * Where a copy can go next: every free edge-to-edge neighbour of the tile
 * and of the copies that sit on the lattice.
 */
export function ghostsOf(
  cell: Cell,
  copies: readonly Copy[],
): { at: Vec; from: Vec }[] {
  const placed = [{ x: 0, y: 0 }, ...copies.map((c) => c.at)];
  const slides = neighbourSlides(cell);
  const out: { at: Vec; from: Vec }[] = [];
  for (const p of placed) {
    if (!snapped(cell, p)) continue;
    for (const d of slides) {
      const g = plus(p, d);
      if (placed.some((q) => same(q, g)) || out.some((q) => same(q.at, g)))
        continue;
      out.push({ at: g, from: p });
    }
  }
  return out;
}

/** Copies on every lattice position whose tile overlaps a view. */
export function fillCopies(
  cell: Cell,
  view: { minX: number; minY: number; maxX: number; maxY: number },
  copies: readonly Copy[],
): Copy[] {
  const out = [...copies];
  const taken = (at: Vec) =>
    same(at, { x: 0, y: 0 }) || out.some((c) => same(c.at, at));
  const xs = cell.corners.map((c) => c.x);
  const ys = cell.corners.map((c) => c.y);
  const [x0, x1, y0, y1] = [
    Math.min(...xs),
    Math.max(...xs),
    Math.min(...ys),
    Math.max(...ys),
  ];
  for (let i = -12; i <= 12; i++)
    for (let j = -12; j <= 12; j++) {
      const at = {
        x: cell.u.x * i + cell.v.x * j,
        y: cell.u.y * i + cell.v.y * j,
      };
      const overlaps =
        x1 + at.x > view.minX &&
        x0 + at.x < view.maxX &&
        y1 + at.y > view.minY &&
        y0 + at.y < view.maxY;
      if (overlaps && !taken(at)) out.push({ at });
    }
  return out;
}

/** The ink of the whole wall: the tile's ink at the original and at every
 * copy. */
export function wallSegments(
  tile: readonly Segment[],
  copies: readonly Copy[],
): Segment[] {
  return [{ x: 0, y: 0 }, ...copies.map((c) => c.at)].flatMap((d) =>
    tile.map((s) => ({
      kind: 'segment' as const,
      a: plus(s.a, d),
      b: plus(s.b, d),
    })),
  );
}

/**
 * The copies round the tile and the copies placed, not placed themselves:
 * with them, a piece across the edge of a placed tile closes, and the
 * board shows the part of it inside.
 */
export function surrounding(cell: Cell, copies: readonly Copy[]): Copy[] {
  const { u, v } = cell;
  const slides = [u, v, plus(u, v), { x: u.x - v.x, y: u.y - v.y }].flatMap(
    (d) => [d, { x: -d.x, y: -d.y }],
  );
  const placed = [{ x: 0, y: 0 }, ...copies.map((c) => c.at)];
  const out: Copy[] = [];
  for (const p of placed)
    for (const d of slides) {
      const at = plus(p, d);
      if (![...placed, ...out.map((c) => c.at)].some((q) => same(q, at)))
        out.push({ at });
    }
  return out;
}

/** Whether a piece shows on the placed tiles: a corner or its middle
 * inside one of them. */
export function onTiles(
  cell: Cell,
  copies: readonly Copy[],
  polygon: readonly Vec[],
): boolean {
  const n = polygon.length;
  const mid = {
    x: polygon.reduce((t, q) => t + q.x, 0) / n,
    y: polygon.reduce((t, q) => t + q.y, 0) / n,
  };
  return [{ x: 0, y: 0 }, ...copies.map((c) => c.at)].some((d) =>
    [mid, ...polygon].some((q) =>
      inside({ x: q.x - d.x, y: q.y - d.y }, cell.corners),
    ),
  );
}

/** Whether a point lies strictly inside a convex outline. */
function inside(q: Vec, outline: readonly Vec[]): boolean {
  let sign = 0;
  for (let k = 0; k < outline.length; k++) {
    const a = outline[k] as Vec;
    const b = outline[(k + 1) % outline.length] as Vec;
    const c = (b.x - a.x) * (q.y - a.y) - (b.y - a.y) * (q.x - a.x);
    if (Math.abs(c) < EPS) return false;
    if (sign === 0) sign = Math.sign(c);
    else if (Math.sign(c) !== sign) return false;
  }
  return true;
}

/**
 * Where a dragged copy lands: the nearest free place on the tile's lattice
 * when it is within a sixth of the tile, so it joins its neighbours;
 * otherwise exactly where it was dropped, loose.
 */
export function dropAt(
  cell: Cell,
  copies: readonly Copy[],
  index: number,
  at: Vec,
): Vec {
  const slot = nearestSlot(cell, at);
  const near = Math.hypot(slot.x - at.x, slot.y - at.y) <= tileSize(cell) / 6;
  const taken =
    Math.hypot(slot.x, slot.y) < EPS ||
    copies.some((c, i) => i !== index && same(c.at, slot));
  return near && !taken ? slot : at;
}
