import { clipOutline, PIN_HOLE, type Pin } from './mesh.js';
import { signedArea, type P2 } from './skeleton.js';

/** Where a large outline is cut: the x of each upright cut and the y of
 * each level one, in millimetres, in order. */
export interface Cuts {
  readonly xs: readonly number[];
  readonly ys: readonly number[];
}

/** A family of parallel lines the pattern repeats along: x = at + k·step. */
export interface Repeat {
  readonly step: number;
  readonly at: number;
}

/** One part of a cut outline. Columns are lettered from the left, rows
 * numbered from the top, so the top-left part is A1. */
export interface Part {
  readonly name: string;
  readonly column: number;
  readonly row: number;
  /** The part's own outline, convex and counter-clockwise. */
  readonly outline: P2[];
  /** The cell it was cut with, for `topOf`. */
  readonly cell: P2[];
}

/** Lengths `from`..`to` cut in as few pieces as fit `most`, on the
 * repeat's lines where that still fits, else evenly. */
function cutsAlong(from: number, to: number, most: number, repeat?: Repeat): number[] {
  const n = Math.ceil((to - from) / most - 1e-9);
  if (n <= 1) return [];
  const even = Array.from({ length: n - 1 }, (_, k) => from + ((k + 1) * (to - from)) / n);
  if (!repeat || !(repeat.step > 0)) return even;
  const snapped = even.map((c) => repeat.at + Math.round((c - repeat.at) / repeat.step) * repeat.step);
  const edges = [from, ...snapped, to];
  for (let k = 0; k + 1 < edges.length; k++) {
    const w = edges[k + 1]! - edges[k]!;
    if (!(w > 1) || w > most + 1e-9) return even;
  }
  return snapped;
}

/** Where to cut an outline so no part is wider or taller than `most`. */
export function cutsFor(
  outline: readonly P2[],
  most: number,
  repeat: { x?: Repeat; y?: Repeat } = {},
): Cuts {
  const xs = outline.map((p) => p.x);
  const ys = outline.map((p) => p.y);
  return {
    xs: cutsAlong(Math.min(...xs), Math.max(...xs), most, repeat.x),
    ys: cutsAlong(Math.min(...ys), Math.max(...ys), most, repeat.y),
  };
}

const letter = (k: number): string =>
  k < 26 ? String.fromCharCode(65 + k) : letter(Math.floor(k / 26) - 1) + letter(k % 26);

/** The parts of an outline cut at `cuts`, left to right, top to bottom. */
export function partsOf(outline: readonly P2[], cuts: Cuts): Part[] {
  const xs = outline.map((p) => p.x);
  const ys = outline.map((p) => p.y);
  const far = 1 + Math.max(...xs.map(Math.abs), ...ys.map(Math.abs));
  const xe = [-far, ...cuts.xs, far];
  const ye = [far, ...cuts.ys.slice().reverse(), -far];
  const parts: Part[] = [];
  for (let r = 0; r + 1 < ye.length; r++)
    for (let c = 0; c + 1 < xe.length; c++) {
      const cell = [
        { x: xe[c]!, y: ye[r + 1]! },
        { x: xe[c + 1]!, y: ye[r + 1]! },
        { x: xe[c + 1]!, y: ye[r]! },
        { x: xe[c]!, y: ye[r]! },
      ];
      const own = clipOutline(outline, cell);
      if (own.length < 3 || signedArea(own) < 1) continue;
      parts.push({ name: `${letter(c)}${r + 1}`, column: c, row: r, outline: own, cell });
    }
  return parts;
}

/** Pins keep this far from the ends of a seam, in millimetres. */
const PIN_MARGIN = 15;
/** One pin to about this length of seam, and never fewer than two. */
const PIN_SPACING = 80;

/** The length of the line through p along d that lies inside the outline,
 * as distances from p (convex outline). */
function inside(outline: readonly P2[], p: P2, d: P2): [number, number] {
  let lo = -Infinity;
  let hi = Infinity;
  for (let i = 0; i < outline.length; i++) {
    const a = outline[i]!;
    const b = outline[(i + 1) % outline.length]!;
    // Inside is to the left of a→b: n·(x - a) >= 0 with n = (-(b-a).y, (b-a).x).
    const n = { x: -(b.y - a.y), y: b.x - a.x };
    const at = n.x * (p.x - a.x) + n.y * (p.y - a.y);
    const rate = n.x * d.x + n.y * d.y;
    if (Math.abs(rate) < 1e-12) {
      if (at < 0) return [0, 0];
      continue;
    }
    const t = -at / rate;
    if (rate > 0) lo = Math.max(lo, t);
    else hi = Math.min(hi, t);
  }
  return hi > lo ? [lo, hi] : [0, 0];
}

/**
 * The pin holes across every seam of a cut outline, at height z: on each
 * stretch of seam between two parts, evenly spaced and clear of its ends.
 * The same holes serve the parts on both sides.
 */
export function pinsFor(outline: readonly P2[], cuts: Cuts, z: number): Pin[] {
  const pins: Pin[] = [];
  const along = (p: P2, d: P2, from: number, to: number) => {
    const [lo, hi] = inside(outline, p, d);
    const s0 = Math.max(lo, from);
    const s1 = Math.min(hi, to);
    const len = s1 - s0;
    if (len < 2 * PIN_HOLE.across + 4) return;
    let n = Math.max(2, Math.round(len / PIN_SPACING));
    let margin = PIN_MARGIN;
    if (len < 2 * PIN_MARGIN + 10) {
      n = 1;
      margin = len / 2;
    }
    for (let k = 0; k < n; k++) {
      const s = n === 1 ? s0 + len / 2 : s0 + margin + (k * (len - 2 * margin)) / (n - 1);
      pins.push({ centre: { x: p.x + d.x * s, y: p.y + d.y * s }, z });
    }
  };
  const ys = [-Infinity, ...cuts.ys, Infinity];
  const xs = [-Infinity, ...cuts.xs, Infinity];
  for (const x of cuts.xs)
    for (let r = 0; r + 1 < ys.length; r++) along({ x, y: 0 }, { x: 0, y: 1 }, ys[r]!, ys[r + 1]!);
  for (const y of cuts.ys)
    for (let c = 0; c + 1 < xs.length; c++) along({ x: 0, y }, { x: 1, y: 0 }, xs[c]!, xs[c + 1]!);
  return pins;
}

/** Pins fit a solid this thick under its seams: the hole and two printed
 * lines of a 0.4 mm nozzle above and below it. */
export const PIN_ROOM = PIN_HOLE.across + 2 * 0.8;
