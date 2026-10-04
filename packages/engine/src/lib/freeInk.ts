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

const round = (n: number) => (Math.abs(n) < 5e-7 ? 0 : n).toFixed(6);
const pointKey = (p: Vec) => `${round(p.x)},${round(p.y)}`;
const pieceId = (a: Vec, b: Vec) => [pointKey(a), pointKey(b)].sort().join('|');

/** The part of an infinite line or segment inside the convex cell. */
function clipToCell(
  c: Line | Segment,
  cell: Cell,
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
 * Every straight piece of the construction inside the cell, split at every
 * crossing with another line, circle or polygon side: what a learner can
 * choose to ink.
 */
export function inkPieces(scene: Scene, cell: Cell): InkPiece[] {
  const curves: Curve[] = [];
  for (const { geometry: g } of scene.elements.values()) {
    if (g.kind === 'line') curves.push(g.line);
    if (g.kind === 'circle') curves.push(g.circle);
    if (g.kind === 'polygon') curves.push(...g.sides);
  }
  const pieces = new Map<string, InkPiece>();
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
      if (!pieces.has(id)) pieces.set(id, { id, segment: segment(a, b) });
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

/** The ids of the pieces the tutorial's own ink covers. */
export function classicSelection(
  pieces: readonly InkPiece[],
  ink: readonly InkStroke[],
  eps: number,
): Set<string> {
  return new Set(
    pieces
      .filter(({ segment: p }) =>
        ink.some(
          ({ segment: s }) => onSegment(p.a, s, eps) && onSegment(p.b, s, eps),
        ),
      )
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
