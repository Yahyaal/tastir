import type { Scene } from './evaluate.js';
import type { InkStroke } from './ink.js';
import { intersect } from './intersect.js';
import type { Cell } from './pieces.js';
import { segment, type Curve, type Line, type Segment } from './shapes.js';
import {
  add,
  cross,
  distance,
  dot,
  length,
  scale,
  sub,
  type Vec,
} from './vec.js';

/** A straight piece of construction between two neighbouring crossings. */
export interface InkPiece {
  /** Stable across evaluations: the rounded end points. */
  readonly id: string;
  readonly segment: Segment;
}

/** Options for finding a construction's inkable pieces. */
export interface InkPiecesOptions {
  /** Keep pieces on all edges of the cell, rather than merging opposite edges. */
  readonly allEdges?: boolean;
}

const round = (n: number) => (Math.abs(n) < 5e-7 ? 0 : n).toFixed(6);
const pointKey = (p: Vec) => `${round(p.x)},${round(p.y)}`;
const pieceId = (a: Vec, b: Vec) => [pointKey(a), pointKey(b)].sort().join('|');

/** The part of an infinite line or segment inside the convex cell. */
export function clipToCell(
  c: Line | Segment,
  cell: Pick<Cell, 'corners'>,
  eps: number,
): Segment | undefined {
  const p = c.kind === 'line' ? c.point : c.a;
  const d = c.kind === 'line' ? c.dir : sub(c.b, c.a);
  let t0 = c.kind === 'line' ? -Infinity : 0;
  let t1 = c.kind === 'line' ? Infinity : 1;
  const corners = cell.corners;
  // Corners turn the same way round, so each edge's inside is on one side.
  const turn = Math.sign(
    cross(
      sub(corners[1] as Vec, corners[0] as Vec),
      sub(corners[2] as Vec, corners[1] as Vec),
    ),
  );
  for (let i = 0; i < corners.length; i++) {
    const a = corners[i] as Vec;
    const b = corners[(i + 1) % corners.length] as Vec;
    const e = sub(b, a);
    // side(t) = turn · cross(e, p + t d − a) ≥ −eps
    const base = turn * cross(e, sub(p, a));
    const rate = turn * cross(e, d);
    const slack = eps * length(e);
    if (Math.abs(rate) <= 1e-15) {
      if (base < -slack) return undefined;
      continue;
    }
    const t = (-slack - base) / rate;
    if (rate > 0) t0 = Math.max(t0, t);
    else t1 = Math.min(t1, t);
  }
  if (!(t1 - t0 > 0)) return undefined;
  const s = segment(add(p, scale(d, t0)), add(p, scale(d, t1)));
  return distance(s.a, s.b) > eps ? s : undefined;
}

/**
 * Every straight piece of the construction inside the cell, its own and
 * its neighbours' copies, split at every crossing with another line,
 * circle or polygon side: what a learner can choose to ink.
 */
export function inkPieces(
  scene: Scene,
  cell: Cell,
  options?: InkPiecesOptions,
): InkPiece[] {
  // The construction repeats with the tile, so the neighbouring tiles'
  // construction reaches into this one too: a slanted or hexagonal tile
  // can hold the tip of a rosette drawn around a neighbouring centre.
  const curves: Curve[] = [];
  const seen = new Set<string>();
  const key = (c: Curve) =>
    c.kind === 'line'
      ? `l${round(Math.abs(c.dir.x * c.point.y - c.dir.y * c.point.x))},${round(Math.abs(c.dir.x))},${round(Math.sign(c.dir.x || 1) * c.dir.y)},${round(Math.sign(c.dir.x || 1) * (c.dir.x * c.point.y - c.dir.y * c.point.x))}`
      : c.kind === 'circle'
        ? `c${pointKey(c.centre)},${round(c.radius)}`
        : `s${pieceId(c.a, c.b)}`;
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      const d = add(scale(cell.u, i), scale(cell.v, j));
      const move = (c: Curve): Curve =>
        c.kind === 'line'
          ? { ...c, point: add(c.point, d) }
          : c.kind === 'circle'
            ? { ...c, centre: add(c.centre, d) }
            : segment(add(c.a, d), add(c.b, d));
      for (const { geometry: g } of scene.elements.values()) {
        const own: Curve[] =
          g.kind === 'line'
            ? [g.line]
            : g.kind === 'circle'
              ? [g.circle]
              : g.kind === 'polygon'
                ? [...g.sides]
                : [];
        for (const c of own.map(move)) {
          const k = key(c);
          if (!seen.has(k)) {
            seen.add(k);
            curves.push(c);
          }
        }
      }
    }
  }
  const pieces = new Map<string, InkPiece>();
  const shifts = [-1, 0, 1].flatMap((i) =>
    [-1, 0, 1].map((j) => add(scale(cell.u, i), scale(cell.v, j))),
  );
  for (const c of curves) {
    if (c.kind === 'circle') continue;
    const s = clipToCell(c, cell, scene.tol.eps);
    if (!s) continue;
    const d = sub(s.b, s.a);
    const len2 = dot(d, d);
    const ts = [0, 1];
    for (const other of curves) {
      if (other === c) continue;
      for (const p of intersect(s, other, scene.tol))
        ts.push(dot(sub(p, s.a), d) / len2);
    }
    ts.sort((x, y) => x - y);
    for (let k = 0; k + 1 < ts.length; k++) {
      const a = add(s.a, scale(d, ts[k] as number));
      const b = add(s.a, scale(d, ts[k + 1] as number));
      if (distance(a, b) <= scene.tol.eps * 10) continue;
      const id = pieceId(a, b);
      // One copy per piece of the wall: a piece on one edge of the tile
      // and its copy on the opposite edge are the same piece.
      const copy =
        !options?.allEdges &&
        shifts.some(
          (d) => (d.x || d.y) && pieces.has(pieceId(add(a, d), add(b, d))),
        );
      if (!copy && !pieces.has(id))
        pieces.set(id, { id, segment: segment(a, b) });
    }
  }
  return [...pieces.values()];
}

/** Whether point p lies on segment s, within eps. */
function onSegment(p: Vec, s: Segment, eps: number): boolean {
  const d = sub(s.b, s.a);
  const t = dot(sub(p, s.a), d) / dot(d, d);
  if (t < -eps || t > 1 + eps) return false;
  return distance(p, add(s.a, scale(d, t))) <= eps * 10;
}

/**
 * The ids of the pieces the tutorial's own ink covers, counting its copies
 * in the neighbouring tiles when the cell is given.
 */
export function classicSelection(
  pieces: readonly InkPiece[],
  ink: readonly InkStroke[],
  eps: number,
  cell?: Cell,
): Set<string> {
  const shifts = cell
    ? [-1, 0, 1].flatMap((i) =>
        [-1, 0, 1].map((j) => add(scale(cell.u, i), scale(cell.v, j))),
      )
    : [{ x: 0, y: 0 }];
  const strokes = shifts.flatMap((d) =>
    ink.map(({ segment: s }) => segment(add(s.a, d), add(s.b, d))),
  );
  if (!strokes.length || !pieces.length) return new Set();
  // Broad phase only: a stroke covering both endpoints must cover their
  // midpoint's box too. Keep the exact endpoint test below, including its
  // tolerance, so the index changes cost, never which bits get inked.
  let totalLength = 0;
  let extent = 0;
  for (const s of strokes) {
    totalLength += distance(s.a, s.b);
    extent = Math.max(
      extent,
      Math.abs(s.a.x),
      Math.abs(s.a.y),
      Math.abs(s.b.x),
      Math.abs(s.b.y),
    );
  }
  const size = Math.max(
    totalLength / strokes.length,
    extent / 128,
    eps * 20,
    1e-12,
  );
  const bins = new Map<string, Segment[]>();
  const bin = (x: number, y: number) => `${x},${y}`;
  for (const s of strokes) {
    // onSegment permits eps beyond each end and 10*eps sideways.
    const pad = eps * (distance(s.a, s.b) + 10);
    const x0 = Math.floor((Math.min(s.a.x, s.b.x) - pad) / size);
    const x1 = Math.floor((Math.max(s.a.x, s.b.x) + pad) / size);
    const y0 = Math.floor((Math.min(s.a.y, s.b.y) - pad) / size);
    const y1 = Math.floor((Math.max(s.a.y, s.b.y) + pad) / size);
    for (let x = x0; x <= x1; x++)
      for (let y = y0; y <= y1; y++) {
        const key = bin(x, y);
        const found = bins.get(key);
        if (found) found.push(s);
        else bins.set(key, [s]);
      }
  }
  return new Set(
    pieces
      .filter(({ segment: p }) => {
        const key = bin(
          Math.floor((p.a.x + p.b.x) / (2 * size)),
          Math.floor((p.a.y + p.b.y) / (2 * size)),
        );
        return bins
          .get(key)
          ?.some((s) => onSegment(p.a, s, eps) && onSegment(p.b, s, eps));
      })
      .map((p) => p.id),
  );
}

/** Ink strokes for the chosen pieces, to compute a pattern from. */
export function strokesOf(
  pieces: readonly InkPiece[],
  chosen: ReadonlySet<string>,
): InkStroke[] {
  return pieces
    .filter((p) => chosen.has(p.id))
    .map((p) => ({ from: '', to: '', segment: p.segment }));
}
