import type { Vec } from '@tastir/engine';
import type { Model } from './model';
import { ringsFor } from './placement';

/**
 * The wall built from the unit by hand: copies of the coloured unit, each
 * at a slide of the repeat, laid edge to edge from the first.
 */

/** A piece of the repeat block: which piece of which cell, and its outline. */
export interface BlockPiece {
  readonly piece: number;
  readonly i: number;
  readonly j: number;
  readonly type: number;
  readonly polygon: readonly Vec[];
}

/** The repeat as a block of cells: its two slides and its pieces. */
export interface Block {
  readonly u: Vec;
  readonly v: Vec;
  readonly pieces: readonly BlockPiece[];
}

const EPS = 1e-6;
const len = (a: Vec) => Math.hypot(a.x, a.y);
const same = (a: Vec, b: Vec) => len({ x: a.x - b.x, y: a.y - b.y }) < EPS;
const plus = (a: Vec, b: Vec): Vec => ({ x: a.x + b.x, y: a.y + b.y });
const times = (a: Vec, k: number): Vec => ({ x: a.x * k, y: a.y * k });

/** The block the colouring repeats after: every piece of its m × n cells.
 * Copies of it at its slides cover the wall with no gap and no overlap. */
export function blockOf(model: Model): Block | undefined {
  const rings = ringsFor(model);
  if (!rings) return undefined;
  const { cell, pieces } = model.pattern;
  const [m, n] = rings.repeat;
  const out: BlockPiece[] = [];
  for (let i = 0; i < m; i++)
    for (let j = 0; j < n; j++) {
      const d = plus(times(cell.u, i), times(cell.v, j));
      pieces.forEach((p, k) =>
        out.push({
          piece: k,
          i,
          j,
          type: p.type,
          polygon: p.polygon.map((q) => plus(q, d)),
        }),
      );
    }
  return { u: times(cell.u, m), v: times(cell.v, n), pieces: out };
}

/** The slides that put a copy beside the block: four on a square
 * lattice, six on a hexagonal one (the short diagonal joins in). */
export function blockSlides({ u, v }: Pick<Block, 'u' | 'v'>): Vec[] {
  const most = Math.max(len(u), len(v)) * 1.01;
  const diagonals = [plus(u, v), plus(u, times(v, -1))].filter(
    (d) => len(d) <= most,
  );
  return [u, v, ...diagonals].flatMap((d) => [d, times(d, -1)]);
}

/** Where a copy can go next: every free place beside a copy. */
export function blockGhosts(
  block: Pick<Block, 'u' | 'v'>,
  copies: readonly Vec[],
): { at: Vec; from: Vec }[] {
  const placed = [{ x: 0, y: 0 }, ...copies];
  const out: { at: Vec; from: Vec }[] = [];
  for (const p of placed)
    for (const d of blockSlides(block)) {
      const at = plus(p, d);
      if (placed.some((q) => same(q, at)) || out.some((q) => same(q.at, at)))
        continue;
      out.push({ at, from: p });
    }
  return out;
}

/** The copies of a small wall round the first: every place within one
 * and a half blocks of it, kept with the copies already there. */
export function fillBlocks(
  block: Pick<Block, 'u' | 'v'>,
  copies: readonly Vec[],
): Vec[] {
  const reach = 1.5 * Math.max(len(block.u), len(block.v));
  const out = [...copies];
  for (let a = -2; a <= 2; a++)
    for (let b = -2; b <= 2; b++) {
      const at = plus(times(block.u, a), times(block.v, b));
      if (len(at) < EPS || len(at) > reach) continue;
      if (!out.some((c) => same(c, at))) out.push(at);
    }
  return out;
}
