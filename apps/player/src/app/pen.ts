import type { PenLook } from '@tastir/schema';

/**
 * The lines style is watercolour (STYLE.1, 16 November 2026): the pieces
 * painted, the paper left between them. Designs and share links still
 * carry a `PenLook`, so older ones open; the player no longer offers a pen.
 * Only the print sheet draws a pen line: bare ink, without the wash.
 */
export type Pen = PenLook['pen'];

/** The drawing paper under the lines style: warm, not screen white. */
export const PAPER = '#fbf8f1';

/** Watercolour: the pieces painted, no ink. */
export const DEFAULT_PEN: PenLook = {
  pen: 'single',
  wash: true,
  ink: '#23201c',
};

export const samePen = (a: PenLook = DEFAULT_PEN, b: PenLook = DEFAULT_PEN) =>
  a.pen === b.pen && a.wash === b.wash && a.ink === b.ink;

/**
 * The stroke of the print sheet's ink line, as a multiple of the grout
 * width: its colour (the ink), width, opacity and shift.
 */
export function penStrokes(): {
  readonly paper: boolean;
  readonly width: number;
  readonly opacity: number;
  readonly dx: number;
  readonly dy: number;
}[] {
  return [{ paper: false, width: 0.8, opacity: 1, dx: 0, dy: 0 }];
}
