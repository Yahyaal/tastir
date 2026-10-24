import type { Pen } from './pen';

/**
 * Hand-made colour for the lines style, as SVG filters: the flat colour of
 * each piece is broken up the way paint or pencil sits on paper. Sizes are
 * in multiples of the grout width `g`, so every pattern gets the same grain.
 *
 * Paint (single and double pens): watercolour. Large soft blotches where
 * the pigment pooled or thinned, and a fine paper grain through it.
 *
 * Lay a texture over the whole wall, never inside its repeating tile: the
 * tile clips the filter, and its noise does not repeat with the tile, so
 * each seam shows as a pale streak (tried, 24 October).
 * Pencil: coloured pencil. Streaks along one slant, as a hand shades, and
 * the paper's tooth showing white where the pencil skipped.
 */
export interface Texture {
  /** The filter's id, and the turn its streaks are drawn at. */
  readonly id: string;
  readonly turn: number;
  /** The filter element, as SVG markup. */
  readonly markup: string;
}

const f = (n: number) => String(Math.round(n * 1e5) / 1e5);

/** A colour matrix that keeps the colour and makes alpha a·R + b. */
const alpha = (a: number, b: number) =>
  `0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${f(a)} 0 0 0 ${f(b)}`;

export function texture(pen: Pen, g: number, id: string): Texture {
  if (pen === 'pencil')
    return {
      id,
      turn: 55,
      markup: [
        `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">`,
        // Long along one direction, short across it: strokes of shading.
        `<feTurbulence type="fractalNoise" baseFrequency="${f(1 / (10 * g))} ${f(1 / (0.45 * g))}" numOctaves="2" seed="4" result="streak"/>`,
        `<feColorMatrix in="streak" type="matrix" values="${alpha(2.6, -0.35)}" result="streakA"/>`,
        // The paper's tooth: small white specks.
        `<feTurbulence type="fractalNoise" baseFrequency="${f(1 / (0.6 * g))}" numOctaves="2" seed="9" result="tooth"/>`,
        `<feColorMatrix in="tooth" type="matrix" values="${alpha(2.6, -0.2)}" result="toothA"/>`,
        `<feComposite in="streakA" in2="toothA" operator="arithmetic" k1="1" result="mask"/>`,
        `<feComposite in="SourceGraphic" in2="mask" operator="in"/>`,
        `</filter>`,
      ].join(''),
    };
  return {
    id,
    turn: 0,
    markup: [
      `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">`,
      // Pigment pooled here and thinned there.
      `<feTurbulence type="fractalNoise" baseFrequency="${f(1 / (22 * g))}" numOctaves="2" seed="3" result="blot"/>`,
      `<feColorMatrix in="blot" type="matrix" values="${alpha(1.4, 0.1)}" result="blotA"/>`,
      // The grain of the paper through the wash.
      `<feTurbulence type="fractalNoise" baseFrequency="${f(1 / (0.7 * g))}" numOctaves="1" seed="7" result="grain"/>`,
      `<feColorMatrix in="grain" type="matrix" values="${alpha(0.9, 0.55)}" result="grainA"/>`,
      `<feComposite in="blotA" in2="grainA" operator="arithmetic" k1="1" result="mask"/>`,
      `<feComposite in="SourceGraphic" in2="mask" operator="in"/>`,
      `</filter>`,
    ].join(''),
  };
}

/** How the pieces are filled under a texture: paint pools darker at the
 * edge of each piece; pencil is laid on fully and the texture lightens it. */
export const washFill = (pen: Pen) =>
  pen === 'pencil' ? { opacity: 0.95, edge: 0 } : { opacity: 0.82, edge: 0.45 };

/**
 * The grain of a pencil line: graphite catches on the paper's tooth.
 */
export function graphite(g: number, id: string): string {
  return [
    `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">`,
    `<feTurbulence type="fractalNoise" baseFrequency="${f(1 / (0.5 * g))}" numOctaves="2" seed="11" result="tooth"/>`,
    `<feColorMatrix in="tooth" type="matrix" values="${alpha(3, -0.4)}" result="toothA"/>`,
    `<feComposite in="SourceGraphic" in2="toothA" operator="in"/>`,
    `</filter>`,
  ].join('');
}
