import type { InkPiece, Vec } from '@tastir/engine';

/**
 * Inking with a pen, as on paper: the pen goes down on a dot (a crossing
 * on the board) and draws a straight stroke along a construction line to
 * another dot. These are the dots, the lines through them, and the bits
 * of line a stroke between two dots covers.
 */

const r6 = (n: number) => (Math.abs(n) < 5e-7 ? 0 : n).toFixed(6);
const keyOf = (p: Vec) => `${r6(p.x)},${r6(p.y)}`;

/** A line's direction, the same whichever way a bit on it points. */
function directionOf(p: InkPiece): Vec {
  const { a, b } = p.segment;
  let dx = b.x - a.x;
  let dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  dx /= len;
  dy /= len;
  if (dx < -1e-9 || (Math.abs(dx) <= 1e-9 && dy < 0)) {
    dx = -dx;
    dy = -dy;
  }
  return { x: dx, y: dy };
}

/** The line a bit runs along, as a key shared by every bit on it. */
export function lineKey(p: InkPiece): string {
  const d = directionOf(p);
  const { a } = p.segment;
  return `${r6(d.x)},${r6(d.y)},${r6(a.x * d.y - a.y * d.x)}`;
}

/** A place the pen can go down: the end of a bit of line. */
export interface Dot {
  readonly key: string;
  readonly at: Vec;
  /** The lines through it that carry bits. */
  readonly lines: readonly string[];
}

interface Line {
  readonly dir: Vec;
  /** Its bits, each with the positions of its ends along the line. */
  readonly bits: readonly { id: string; t0: number; t1: number }[];
}

export interface PenGraph {
  readonly dots: ReadonlyMap<string, Dot>;
  readonly lines: ReadonlyMap<string, Line>;
  /** The bits by id. */
  readonly bits: ReadonlyMap<string, InkPiece>;
}

const along = (p: Vec, dir: Vec) => p.x * dir.x + p.y * dir.y;

/** The dots and lines of a board's bits of line (computed once). */
export function penGraph(pieces: readonly InkPiece[]): PenGraph {
  const dots = new Map<string, { key: string; at: Vec; lines: Set<string> }>();
  const lines = new Map<
    string,
    { dir: Vec; bits: { id: string; t0: number; t1: number }[] }
  >();
  for (const p of pieces) {
    const lk = lineKey(p);
    const dir = directionOf(p);
    const line = lines.get(lk) ?? { dir, bits: [] };
    const ta = along(p.segment.a, dir);
    const tb = along(p.segment.b, dir);
    line.bits.push({ id: p.id, t0: Math.min(ta, tb), t1: Math.max(ta, tb) });
    lines.set(lk, line);
    for (const end of [p.segment.a, p.segment.b]) {
      const k = keyOf(end);
      const dot = dots.get(k) ?? { key: k, at: end, lines: new Set<string>() };
      dot.lines.add(lk);
      dots.set(k, dot);
    }
  }
  return {
    dots: new Map(
      [...dots].map(([k, d]) => [k, { key: k, at: d.at, lines: [...d.lines] }]),
    ),
    lines,
    bits: new Map(pieces.map((p) => [p.id, p])),
  };
}

const EPS = 1e-6;

/**
 * The bits a straight stroke from one dot to another covers: every bit of
 * a line through both, between them. Empty when no line joins them.
 */
export function strokeBetween(
  g: PenGraph,
  from: string,
  to: string,
  shifts: readonly Vec[] = [],
): string[] {
  const direct = strokeOn(g, from, to);
  if (direct.length || from === to) return direct;
  // Along the tile's edge the wall keeps each bit once, on one edge: look
  // for the stroke where the tile's copy runs.
  const a = g.dots.get(from);
  const b = g.dots.get(to);
  if (!a || !b) return [];
  for (const d of shifts) {
    const ids = strokeOn(
      g,
      keyOf({ x: a.at.x + d.x, y: a.at.y + d.y }),
      keyOf({ x: b.at.x + d.x, y: b.at.y + d.y }),
    );
    if (ids.length) return ids;
  }
  return [];
}

function strokeOn(g: PenGraph, from: string, to: string): string[] {
  const a = g.dots.get(from);
  const b = g.dots.get(to);
  if (!a || !b || from === to) return [];
  for (const lk of a.lines) {
    if (!b.lines.includes(lk)) continue;
    const line = g.lines.get(lk);
    if (!line) continue;
    const ta = along(a.at, line.dir);
    const tb = along(b.at, line.dir);
    const lo = Math.min(ta, tb) - EPS;
    const hi = Math.max(ta, tb) + EPS;
    const ids = line.bits
      .filter((x) => x.t0 >= lo && x.t1 <= hi)
      .map((x) => x.id);
    if (ids.length) return ids;
  }
  return [];
}

/** The dots one straight stroke from a dot can reach. */
export function reachable(g: PenGraph, from: string): Dot[] {
  const a = g.dots.get(from);
  if (!a) return [];
  const out = new Map<string, Dot>();
  for (const lk of a.lines)
    for (const bit of g.lines.get(lk)?.bits ?? []) {
      const p = g.bits.get(bit.id);
      if (!p) continue;
      for (const end of [p.segment.a, p.segment.b]) {
        const k = keyOf(end);
        const d = g.dots.get(k);
        if (d && k !== from) out.set(k, d);
      }
    }
  return [...out.values()];
}

/** The dot nearest a point, within reach; the preferred ones (ringed by a
 * hint) are taken from further away. */
export function dotNear(
  g: PenGraph,
  at: Vec,
  reach: number,
  preferred: readonly string[] = [],
): Dot | undefined {
  let best: { d: number; dot: Dot } | undefined;
  for (const k of preferred) {
    const dot = g.dots.get(k);
    if (!dot) continue;
    const d = Math.hypot(dot.at.x - at.x, dot.at.y - at.y);
    if (d <= reach * 2.5 && (!best || d < best.d)) best = { d, dot };
  }
  if (best) return best.dot;
  for (const dot of g.dots.values()) {
    const d = Math.hypot(dot.at.x - at.x, dot.at.y - at.y);
    if (d <= reach && (!best || d < best.d)) best = { d, dot };
  }
  return best?.dot;
}

/** A straight stroke: the bits it covers and its two end dots. */
export interface Stroke {
  readonly ids: readonly string[];
  readonly from: string;
  readonly to: string;
}

/**
 * The stroke through a bit made of the bits in `set` joined end to end
 * with it along its line, from one end to the other.
 */
export function strokeThrough(
  g: PenGraph,
  id: string,
  set: ReadonlySet<string>,
): Stroke | undefined {
  const p = g.bits.get(id);
  if (!p) return undefined;
  const lk = lineKey(p);
  const line = g.lines.get(lk);
  if (!line) return undefined;
  const bits = line.bits
    .filter((x) => set.has(x.id))
    .sort((x, y) => x.t0 - y.t0);
  const i = bits.findIndex((x) => x.id === id);
  if (i < 0) return undefined;
  let lo = i;
  let hi = i;
  while (
    lo > 0 &&
    Math.abs((bits[lo - 1]?.t1 ?? 0) - (bits[lo]?.t0 ?? 0)) < EPS
  )
    lo--;
  while (
    hi < bits.length - 1 &&
    Math.abs((bits[hi + 1]?.t0 ?? 0) - (bits[hi]?.t1 ?? 0)) < EPS
  )
    hi++;
  const run = bits.slice(lo, hi + 1);
  const t0 = run[0]?.t0 ?? 0;
  const t1 = run.at(-1)?.t1 ?? 0;
  const endAt = (t: number) => {
    for (const x of run) {
      const q = g.bits.get(x.id);
      if (!q) continue;
      for (const e of [q.segment.a, q.segment.b])
        if (Math.abs(along(e, line.dir) - t) < EPS) return keyOf(e);
    }
    return '';
  };
  return { ids: run.map((x) => x.id), from: endAt(t0), to: endAt(t1) };
}
