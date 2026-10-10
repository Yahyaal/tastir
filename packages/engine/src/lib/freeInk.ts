import { BoxIndex, type Box } from './boxIndex.js';
import type { Scene } from './evaluate.js';
import type { InkStroke } from './ink.js';
import { appendCrossingCuts, prepareCurve } from './prepared.js';
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
const joinedId = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
const pieceId = (a: Vec, b: Vec) => joinedId(pointKey(a), pointKey(b));

interface PreparedCell {
  readonly eps: number;
  readonly turn: number;
  readonly edges: readonly { a: Vec; e: Vec; slack: number }[];
}

/** Cell half-planes reused while clipping many curves against one boundary. */
export function prepareCell(
  cell: Pick<Cell, 'corners'>,
  eps: number,
): PreparedCell {
  const { corners } = cell;
  const turn = Math.sign(
    cross(
      sub(corners[1] as Vec, corners[0] as Vec),
      sub(corners[2] as Vec, corners[1] as Vec),
    ),
  );
  const edges = corners.map((a, i) => {
    const e = sub(corners[(i + 1) % corners.length] as Vec, a);
    return { a, e, slack: eps * length(e) };
  });
  return { eps, turn, edges };
}

/** The part of an infinite line or segment inside the convex cell. */
export function clipToCell(
  c: Line | Segment,
  cell: Pick<Cell, 'corners'>,
  eps: number,
): Segment | undefined {
  return clipToPreparedCell(c, prepareCell(cell, eps));
}

/** Same clipping arithmetic as clipToCell, using the precomputed half-planes. */
export function clipToPreparedCell(
  c: Line | Segment,
  cell: PreparedCell,
): Segment | undefined {
  const p = c.kind === 'line' ? c.point : c.a;
  const d = c.kind === 'line' ? c.dir : sub(c.b, c.a);
  let t0 = c.kind === 'line' ? -Infinity : 0;
  let t1 = c.kind === 'line' ? Infinity : 1;
  const { eps, turn } = cell;
  for (const { a, e, slack } of cell.edges) {
    const base = turn * (e.x * (p.y - a.y) - e.y * (p.x - a.x));
    const rate = turn * cross(e, d);
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
  const prepared = curves.map(prepareCurve);
  const boundary = prepareCell(cell, scene.tol.eps);
  const expandedBoundary = prepareCell(cell, scene.tol.eps * 4);
  // A returned crossing lies in the clipped source segment (within eps).
  // Bound infinite carriers with a more generously expanded cell so this
  // broad phase never shortens an actual segment or changes an intersection.
  const boxOf = (s: Segment): Box => ({
    minX: Math.min(s.a.x, s.b.x),
    maxX: Math.max(s.a.x, s.b.x),
    minY: Math.min(s.a.y, s.b.y),
    maxY: Math.max(s.a.y, s.b.y),
  });
  const boxes = curves.map((c): Box => {
    if (c.kind === 'circle')
      return {
        minX: c.centre.x - c.radius,
        maxX: c.centre.x + c.radius,
        minY: c.centre.y - c.radius,
        maxY: c.centre.y + c.radius,
      };
    const s =
      c.kind === 'segment' ? c : clipToPreparedCell(c, expandedBoundary);
    return s
      ? boxOf(s)
      : { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
  });
  const index = new BoxIndex(boxes);
  const pieces = new Map<string, InkPiece>();
  // Flat strings avoid retaining trees of short concatenated strings for
  // hundreds of thousands of ids. Reuse the join buffers within this call.
  const coordinateParts = ['', ''];
  const endpointKey = (p: Vec) => {
    coordinateParts[0] = round(p.x);
    coordinateParts[1] = round(p.y);
    return coordinateParts.join(',');
  };
  const idParts = ['', ''];
  const flatId = (a: string, b: string) => {
    idParts[0] = a < b ? a : b;
    idParts[1] = a < b ? b : a;
    return idParts.join('|');
  };
  const shifts = [-1, 0, 1].flatMap((i) =>
    [-1, 0, 1].map((j) => add(scale(cell.u, i), scale(cell.v, j))),
  );
  for (const c of curves) {
    if (c.kind === 'circle') continue;
    const s = clipToPreparedCell(c, boundary);
    if (!s) continue;
    const d = sub(s.b, s.a);
    const ts = [0, 1];
    const source = prepareCurve(s);
    for (const otherId of index.query(boxOf(s), scene.tol.eps * 4)) {
      const other = prepared[otherId] as ReturnType<typeof prepareCurve>;
      if (other.curve === c) continue;
      appendCrossingCuts(source, other, scene.tol, ts);
    }
    const ordered =
      ts.length > 32 ? new Float64Array(ts).sort() : ts.sort((x, y) => x - y);
    const first = ordered[0] as number;
    let a = { x: s.a.x + d.x * first, y: s.a.y + d.y * first };
    let aKey: string | undefined;
    for (let k = 1; k < ordered.length; k++) {
      if (ordered[k] === ordered[k - 1]) continue;
      const t = ordered[k] as number;
      const b = { x: s.a.x + d.x * t, y: s.a.y + d.y * t };
      let bKey: string | undefined;
      const minimum = scene.tol.eps * 10;
      // A component alone can prove the length exceeds the threshold.
      if (
        Math.abs(a.x - b.x) > minimum ||
        Math.abs(a.y - b.y) > minimum ||
        distance(a, b) > minimum
      ) {
        bKey = endpointKey(b);
        const id = flatId(aKey ?? endpointKey(a), bKey);
        // Opposite edges are the same piece unless the caller keeps all edges.
        const copy =
          !options?.allEdges &&
          shifts.some(
            (shift) =>
              (shift.x || shift.y) &&
              pieces.has(pieceId(add(a, shift), add(b, shift))),
          );
        if (!copy && !pieces.has(id))
          pieces.set(id, { id, segment: { kind: 'segment', a, b } });
      }
      a = b;
      aKey = bKey;
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
