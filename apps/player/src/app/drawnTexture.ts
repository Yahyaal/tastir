import type { Vec } from '@tastir/engine';
import { PAPER } from './pen';

/**
 * Watercolour for the lines style (STYLE.1, owner's choice of 16 November
 * 2026, from the lines study at #/notes/lines-study).
 *
 * Every piece is drawn a little smaller than it is, so the paper shows
 * between pieces: the pattern is the unpainted paper, with no ink. One
 * paint filter then goes over the whole wall at once. The paper gaps keep
 * the pieces apart, so each piece still gets its own wavering edge and the
 * darker rim where its paint pooled, and the wall has no seam where its
 * repeating tiles meet (a texture inside the tile showed one, 24 October).
 * The old wall-wide wash had blotches larger than a piece, which ran across
 * the pieces and read as camouflage.
 *
 * Sizes are in multiples of the grout width `g`, so every pattern gets the
 * same paper line and grain.
 */

/** How far each piece is drawn inside its outline: half the paper line. */
export const PAPER_GAP = 1.3;

/** How opaque the paint is: the paper glows a little through it. */
export const PAINT_OPACITY = 0.93;

const f = (n: number) => String(Math.round(n * 1e5) / 1e5);

/** A colour matrix that keeps the colour and makes alpha a·R + b. */
const alpha = (a: number, b: number) =>
  `0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${f(a)} 0 0 0 ${f(b)}`;

/** The watercolour filter, as SVG markup. */
export function watercolour(g: number, id: string): string {
  return [
    `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">`,
    // The brush does not follow the outline exactly.
    `<feTurbulence type="fractalNoise" baseFrequency="${f(1 / (2.2 * g))}" numOctaves="2" seed="2" result="wob"/>`,
    `<feDisplacementMap in="SourceGraphic" in2="wob" scale="${f(0.6 * g)}" xChannelSelector="R" yChannelSelector="G" result="shape"/>`,
    // Paint pools darker in a thin rim at each piece's edge.
    `<feMorphology in="shape" operator="erode" radius="${f(0.45 * g)}" result="inner"/>`,
    `<feGaussianBlur in="inner" stdDeviation="${f(0.55 * g)}" result="soft"/>`,
    `<feComposite in="shape" in2="soft" operator="out" result="rim"/>`,
    `<feColorMatrix in="rim" type="matrix" values="0.72 0 0 0 0  0 0.72 0 0 0  0 0 0.72 0 0  0 0 0 0.6 0" result="pooled"/>`,
    // A gentle unevenness in the body, smaller than a piece.
    `<feTurbulence type="fractalNoise" baseFrequency="${f(1 / (14 * g))}" numOctaves="2" seed="5" result="bloom"/>`,
    `<feColorMatrix in="bloom" type="matrix" values="${alpha(0.45, 0.68)}" result="bloomA"/>`,
    `<feComposite in="shape" in2="bloomA" operator="in" result="body"/>`,
    // The paper's grain through the paint.
    `<feTurbulence type="fractalNoise" baseFrequency="${f(1 / (0.55 * g))}" numOctaves="1" seed="8" result="grain"/>`,
    `<feColorMatrix in="grain" type="matrix" values="${alpha(0.22, 0.86)}" result="grainA"/>`,
    `<feMerge result="paint"><feMergeNode in="body"/><feMergeNode in="pooled"/></feMerge>`,
    `<feComposite in="paint" in2="grainA" operator="in"/>`,
    `</filter>`,
  ].join('');
}

/**
 * A polygon moved inward by `d` on every side, corners where the moved
 * sides meet. Pieces are counter-clockwise, so inward is to the left.
 */
export function inset(polygon: readonly Vec[], d: number): Vec[] {
  const n = polygon.length;
  const sides = polygon.map((a, i) => {
    const b = polygon[(i + 1) % n] ?? a;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    return {
      p: { x: a.x - (dy / len) * d, y: a.y + (dx / len) * d },
      dir: { x: dx / len, y: dy / len },
    };
  });
  return sides.map((s, i) => {
    const prev = sides[(i + n - 1) % n] ?? s;
    const cross = prev.dir.x * s.dir.y - prev.dir.y * s.dir.x;
    if (Math.abs(cross) < 1e-9) return s.p;
    const t =
      ((s.p.x - prev.p.x) * s.dir.y - (s.p.y - prev.p.y) * s.dir.x) / cross;
    return { x: prev.p.x + prev.dir.x * t, y: prev.p.y + prev.dir.y * t };
  });
}

/** A small deterministic hash in [0, 1). */
export function hash(...ns: readonly number[]): number {
  let h = 2166136261;
  for (const n of ns) {
    h ^= Math.round(n * 1000) + 0x9e3779b9;
    h = Math.imul(h, 16777619);
    h ^= h >>> 13;
  }
  return ((h >>> 0) % 100000) / 100000;
}

const rgb = (c: string) => {
  const n = parseInt(c.replace('#', '').slice(0, 6).padEnd(6, '0'), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
};

/** A colour lightened (t > 0, toward the paper) or deepened (t < 0). */
export function shade(color: string, t: number): string {
  if (!/^#[0-9a-f]{6}$/i.test(color)) return color;
  const c = rgb(color);
  const p = rgb(PAPER);
  return (
    '#' +
    c
      .map((v, i) => (t >= 0 ? v + ((p[i] ?? v) - v) * t : v * (1 + t)))
      .map((v) =>
        Math.max(0, Math.min(255, Math.round(v)))
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  );
}

/** Each placed piece painted a little lighter or deeper than the next, the
 * same on every render. */
export const paintShade = (
  color: string,
  piece: number,
  i: number,
  j: number,
) => shade(color, (hash(piece, i, j) - 0.5) * 0.18);
