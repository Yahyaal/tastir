import type { PenLook } from '@tastir/schema';

export type Pen = PenLook['pen'];
export const PENS: readonly Pen[] = ['single', 'double', 'pencil'];

/** The inks a drawing can be made in, as swatches to click. */
export const INKS: readonly {
  readonly name: string;
  readonly color: string;
}[] = [
  { name: 'Black ink', color: '#23201c' },
  { name: 'Sepia', color: '#6b4226' },
  { name: 'Indigo', color: '#2b3d6e' },
  { name: 'Red ochre', color: '#a8452c' },
];

/** The drawing paper under the lines style: warm, not screen white. */
export const PAPER = '#fbf8f1';

/** A single pen line in black ink, the pieces washed with their colours. */
export const DEFAULT_PEN: PenLook = {
  pen: 'single',
  wash: true,
  ink: '#23201c',
};

export const samePen = (a: PenLook = DEFAULT_PEN, b: PenLook = DEFAULT_PEN) =>
  a.pen === b.pen && a.wash === b.wash && a.ink === b.ink;

/** The double pen's band: its full width with the two lines, and the
 * paper between them, as multiples of the grout width. */
export const DOUBLE = { edge: 3.2, band: 2 } as const;

/**
 * The strokes that draw the ink in the lines style, as multiples of the
 * grout width: each stroke's colour (the ink or the paper), width, opacity
 * and shift.
 *
 * Double: a wide ink stroke with a narrower paper stroke on top leaves two
 * thin lines with paper between; the wall then weaves them over and under
 * like interlace.
 * Pencil: a soft line gone over twice, the second pass a little off the
 * first, as a hand goes over a pencil line.
 */
export function penStrokes(pen: Pen): {
  readonly paper: boolean;
  readonly width: number;
  readonly opacity: number;
  readonly dx: number;
  readonly dy: number;
}[] {
  if (pen === 'double')
    return [
      { paper: false, width: DOUBLE.edge, opacity: 1, dx: 0, dy: 0 },
      { paper: true, width: DOUBLE.band, opacity: 1, dx: 0, dy: 0 },
    ];
  if (pen === 'pencil')
    return [
      { paper: false, width: 0.8, opacity: 0.72, dx: 0, dy: 0 },
      { paper: false, width: 0.5, opacity: 0.4, dx: 0.35, dy: 0.25 },
    ];
  return [{ paper: false, width: 0.8, opacity: 1, dx: 0, dy: 0 }];
}
