import type { InkPiece, Vec } from '@tastir/engine';

/**
 * Inking with a pen, as on paper: the pen goes down on a dot (a crossing
 * on the board) and draws a straight stroke along a construction line to
 * another dot. These are the dots, the lines through them, and the bits
 * of line a stroke between two dots covers.
 *
 * The graph is made in the worker that prepares the ink and is sent to the
 * page as flat typed arrays (transferred, not copied), so a board of two
 * hundred thousand bits crosses between threads in a few milliseconds.
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
}

/**
 * The bits and the pen graph as flat arrays, which a worker can transfer.
 * Dots, lines and bits are numbered in the order the bits come, so every
 * search below meets them in the same order as one over the bits would.
 */
export interface PenParts {
  /** The bits' ids, joined by new lines. */
  readonly bitIds: string;
  /** Each bit's ends: ax, ay, bx, by. */
  readonly bitEnds: Float64Array;
  /** Each bit's line. */
  readonly bitLine: Uint32Array;
  /** Each bit's two dots, a then b. */
  readonly bitDots: Uint32Array;
  /** The dots' keys, joined by new lines. */
  readonly dotKeys: string;
  /** Each dot's place: x, y. */
  readonly dotAt: Float64Array;
  /** The lines through each dot: those of dot i run from start[i] to
   * start[i + 1]. */
  readonly dotLineStart: Uint32Array;
  readonly dotLines: Uint32Array;
  /** Each line's direction: x, y. */
  readonly lineDir: Float64Array;
  /** The bits on each line, with their ends' positions along it. */
  readonly lineBitStart: Uint32Array;
  readonly lineBits: Uint32Array;
  readonly lineT: Float64Array;
}

/** The arrays of the parts, to transfer rather than copy. */
export function buffersOf(parts: PenParts): ArrayBuffer[] {
  return [
    parts.bitEnds,
    parts.bitLine,
    parts.bitDots,
    parts.dotAt,
    parts.dotLineStart,
    parts.dotLines,
    parts.lineDir,
    parts.lineBitStart,
    parts.lineBits,
    parts.lineT,
  ].map((a) => a.buffer as ArrayBuffer);
}

const along = (p: Vec, dir: Vec) => p.x * dir.x + p.y * dir.y;

/** A bit's end's key: one half of its id, which is made of the two. */
function endKeys(p: InkPiece): [string, string] {
  const ka = keyOf(p.segment.a);
  const bar = p.id.indexOf('|');
  const first = p.id.slice(0, bar);
  const second = p.id.slice(bar + 1);
  if (ka === first) return [ka, second];
  if (ka === second) return [ka, first];
  return [ka, keyOf(p.segment.b)];
}

/** The dots and lines of a board's bits of line, as flat arrays. */
export function penParts(pieces: readonly InkPiece[]): PenParts {
  const n = pieces.length;
  const bitEnds = new Float64Array(4 * n);
  const bitLine = new Uint32Array(n);
  const bitDots = new Uint32Array(2 * n);
  // Each bit's ends along its line.
  const bitT = new Float64Array(2 * n);
  const dotIndex = new Map<string, number>();
  const dotKeys: string[] = [];
  const dotAt: number[] = [];
  const dotLines: number[][] = [];
  const lineIndex = new Map<string, number>();
  const lineDir: number[] = [];
  const lineCount: number[] = [];
  const ids: string[] = new Array<string>(n);
  for (let i = 0; i < n; i++) {
    const p = pieces[i] as InkPiece;
    const { a, b } = p.segment;
    ids[i] = p.id;
    bitEnds[4 * i] = a.x;
    bitEnds[4 * i + 1] = a.y;
    bitEnds[4 * i + 2] = b.x;
    bitEnds[4 * i + 3] = b.y;
    // Each bit along its own direction, which may differ from the line's
    // in the last place.
    const dir = directionOf(p);
    const lk = lineKey(p);
    let li = lineIndex.get(lk);
    if (li === undefined) {
      li = lineCount.length;
      lineIndex.set(lk, li);
      lineDir.push(dir.x, dir.y);
      lineCount.push(0);
    }
    bitLine[i] = li;
    lineCount[li] = (lineCount[li] as number) + 1;
    const ta = along(a, dir);
    const tb = along(b, dir);
    bitT[2 * i] = Math.min(ta, tb);
    bitT[2 * i + 1] = Math.max(ta, tb);
    const keys = endKeys(p);
    for (let e = 0; e < 2; e++) {
      const k = keys[e] as string;
      let di = dotIndex.get(k);
      if (di === undefined) {
        di = dotKeys.length;
        dotIndex.set(k, di);
        dotKeys.push(k);
        const end = e ? b : a;
        dotAt.push(end.x, end.y);
        dotLines.push([li]);
      } else {
        const lines = dotLines[di] as number[];
        if (!lines.includes(li)) lines.push(li);
      }
      bitDots[2 * i + e] = di;
    }
  }
  // The lines through each dot, in the order they came.
  const dotLineStart = new Uint32Array(dotLines.length + 1);
  let total = 0;
  for (let d = 0; d < dotLines.length; d++) {
    dotLineStart[d] = total;
    total += (dotLines[d] as number[]).length;
  }
  dotLineStart[dotLines.length] = total;
  const dotLinesFlat = new Uint32Array(total);
  for (let d = 0, at = 0; d < dotLines.length; d++)
    for (const l of dotLines[d] as number[]) dotLinesFlat[at++] = l;
  // The bits on each line, in the order the bits come.
  const lines = lineCount.length;
  const lineBitStart = new Uint32Array(lines + 1);
  for (let l = 0, sum = 0; l <= lines; l++) {
    lineBitStart[l] = sum;
    sum += lineCount[l] ?? 0;
  }
  const fill = lineBitStart.slice(0, lines);
  const lineBits = new Uint32Array(n);
  const lineT = new Float64Array(2 * n);
  for (let i = 0; i < n; i++) {
    const l = bitLine[i] as number;
    const j = fill[l] as number;
    fill[l] = j + 1;
    lineBits[j] = i;
    lineT[2 * j] = bitT[2 * i] as number;
    lineT[2 * j + 1] = bitT[2 * i + 1] as number;
  }
  return {
    bitIds: ids.join('\n'),
    bitEnds,
    bitLine,
    bitDots,
    dotKeys: dotKeys.join('\n'),
    dotAt: new Float64Array(dotAt),
    dotLineStart,
    dotLines: dotLinesFlat,
    lineDir: new Float64Array(lineDir),
    lineBitStart,
    lineBits,
    lineT,
  };
}

/** The pen's graph on the page: the bits, and the dots and lines. */
export class PenGraph {
  /** The bits, in the order the engine found them. */
  readonly pieces: readonly InkPiece[];
  private readonly keys: readonly string[];
  private dotByKey?: Map<string, number>;
  private bitById?: Map<string, number>;
  private dotList?: Vec[];

  constructor(readonly parts: PenParts) {
    const ids = parts.bitIds ? parts.bitIds.split('\n') : [];
    const e = parts.bitEnds;
    this.pieces = ids.map((id, i) => ({
      id,
      segment: {
        kind: 'segment',
        a: { x: e[4 * i] as number, y: e[4 * i + 1] as number },
        b: { x: e[4 * i + 2] as number, y: e[4 * i + 3] as number },
      },
    }));
    this.keys = parts.dotKeys ? parts.dotKeys.split('\n') : [];
  }

  private dotIndex(key: string): number | undefined {
    if (!this.dotByKey)
      this.dotByKey = new Map(this.keys.map((k, i) => [k, i]));
    return this.dotByKey.get(key);
  }

  private bitIndex(id: string): number | undefined {
    if (!this.bitById)
      this.bitById = new Map(this.pieces.map((p, i) => [p.id, i]));
    return this.bitById.get(id);
  }

  dotAt(i: number): Vec {
    return {
      x: this.parts.dotAt[2 * i] as number,
      y: this.parts.dotAt[2 * i + 1] as number,
    };
  }

  dotOf(i: number): Dot {
    return { key: this.keys[i] as string, at: this.dotAt(i) };
  }

  /** The dot with this key. */
  dot(key: string): Dot | undefined {
    const i = this.dotIndex(key);
    return i === undefined ? undefined : this.dotOf(i);
  }

  /** The dot's number, by key. */
  dotNumber(key: string): number | undefined {
    return this.dotIndex(key);
  }

  /** The bit with this id. */
  bit(id: string): InkPiece | undefined {
    const i = this.bitIndex(id);
    return i === undefined ? undefined : this.pieces[i];
  }

  /** The bit's number, by id. */
  bitNumber(id: string): number | undefined {
    return this.bitIndex(id);
  }

  /** Every dot's place (computed once). */
  dots(): readonly Vec[] {
    if (!this.dotList) this.dotList = this.keys.map((_, i) => this.dotAt(i));
    return this.dotList;
  }

  get dotCount(): number {
    return this.keys.length;
  }

  /** The lines through a dot. */
  linesOf(dot: number): Uint32Array {
    const s = this.parts.dotLineStart;
    return this.parts.dotLines.subarray(s[dot], s[dot + 1]);
  }

  /** The direction of a line. */
  dirOf(line: number): Vec {
    return {
      x: this.parts.lineDir[2 * line] as number,
      y: this.parts.lineDir[2 * line + 1] as number,
    };
  }

  /** The bits on a line, with the positions of their ends along it. */
  bitsOn(line: number): { bit: number; t0: number; t1: number }[] {
    const { lineBitStart: s, lineBits, lineT } = this.parts;
    const out: { bit: number; t0: number; t1: number }[] = [];
    for (let j = s[line] as number; j < (s[line + 1] as number); j++)
      out.push({
        bit: lineBits[j] as number,
        t0: lineT[2 * j] as number,
        t1: lineT[2 * j + 1] as number,
      });
    return out;
  }

  /** The line a bit runs along. */
  lineOfBit(bit: number): number {
    return this.parts.bitLine[bit] as number;
  }

  /** A bit's two dots, a then b. */
  dotsOfBit(bit: number): [number, number] {
    return [
      this.parts.bitDots[2 * bit] as number,
      this.parts.bitDots[2 * bit + 1] as number,
    ];
  }
}

/** The dots and lines of a board's bits of line (computed once). */
export function penGraph(pieces: readonly InkPiece[]): PenGraph {
  return new PenGraph(penParts(pieces));
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
  const a = g.dot(from);
  const b = g.dot(to);
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
  const ai = g.dotNumber(from);
  const bi = g.dotNumber(to);
  if (ai === undefined || bi === undefined || from === to) return [];
  const a = g.dotAt(ai);
  const b = g.dotAt(bi);
  const bLines = g.linesOf(bi);
  for (const lk of g.linesOf(ai)) {
    if (!bLines.includes(lk)) continue;
    const dir = g.dirOf(lk);
    const ta = along(a, dir);
    const tb = along(b, dir);
    const lo = Math.min(ta, tb) - EPS;
    const hi = Math.max(ta, tb) + EPS;
    const ids = g
      .bitsOn(lk)
      .filter((x) => x.t0 >= lo && x.t1 <= hi)
      .map((x) => g.pieces[x.bit]?.id as string);
    if (ids.length) return ids;
  }
  return [];
}

/** The dots one straight stroke from a dot can reach. */
export function reachable(g: PenGraph, from: string): Dot[] {
  const ai = g.dotNumber(from);
  if (ai === undefined) return [];
  const out = new Map<number, Dot>();
  for (const lk of g.linesOf(ai))
    for (const { bit } of g.bitsOn(lk))
      for (const d of g.dotsOfBit(bit))
        if (d !== ai && !out.has(d)) out.set(d, g.dotOf(d));
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
    const dot = g.dot(k);
    if (!dot) continue;
    const d = Math.hypot(dot.at.x - at.x, dot.at.y - at.y);
    if (d <= reach * 2.5 && (!best || d < best.d)) best = { d, dot };
  }
  if (best) return best.dot;
  let near: { d: number; i: number } | undefined;
  const xy = g.parts.dotAt;
  for (let i = 0; i < g.dotCount; i++) {
    const d = Math.hypot(
      (xy[2 * i] as number) - at.x,
      (xy[2 * i + 1] as number) - at.y,
    );
    if (d <= reach && (!near || d < near.d)) near = { d, i };
  }
  return near ? g.dotOf(near.i) : undefined;
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
  const bi = g.bitNumber(id);
  if (bi === undefined) return undefined;
  const line = g.lineOfBit(bi);
  const dir = g.dirOf(line);
  const idOf = (bit: number) => g.pieces[bit]?.id as string;
  const bits = g
    .bitsOn(line)
    .filter((x) => set.has(idOf(x.bit)))
    .sort((x, y) => x.t0 - y.t0);
  const i = bits.findIndex((x) => idOf(x.bit) === id);
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
      const q = g.pieces[x.bit];
      if (!q) continue;
      for (const [k, e] of [q.segment.a, q.segment.b].entries())
        if (Math.abs(along(e, dir) - t) < EPS)
          return g.dotOf(g.dotsOfBit(x.bit)[k] as number).key;
    }
    return '';
  };
  return { ids: run.map((x) => idOf(x.bit)), from: endAt(t0), to: endAt(t1) };
}
