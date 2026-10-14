import { now, store } from '../app/storage';
import type { Draft } from '../editor/document';

/**
 * Where a learner is in drawing a tutorial along, kept in this browser so
 * leaving and coming back finds the board and the step as they were.
 */
export interface Progress {
  /** The tutorial's address. */
  readonly tutorial: string;
  readonly board: Draft;
  /** The step shown (its place among the shown steps; one past the last
   * is the ink). */
  readonly index: number;
  /** The bits of line inked, at the ink. */
  readonly inked: readonly string[];
  /** The copies of the tile placed at the repeat, and the colours. */
  readonly copies?: readonly { readonly x: number; readonly y: number }[];
  /** The pattern (and design) the drawing was kept as. */
  readonly kept?: { readonly pattern?: string; readonly design?: string };
  readonly coloring?: {
    readonly palette: string;
    readonly chosen: Readonly<Record<string, string>>;
  };
  /** Where the learner is, as the steps name it (“Step 3 of 6”, “Ink”),
   * for the library's Continue. */
  readonly label?: string;
  readonly updated: string;
}

function isProgress(x: unknown): x is Progress {
  if (typeof x !== 'object' || x === null) return false;
  const p = x as Record<string, unknown>;
  const board = p['board'] as Record<string, unknown> | null | undefined;
  return (
    typeof p['tutorial'] === 'string' &&
    typeof board === 'object' &&
    board !== null &&
    Array.isArray(board['steps']) &&
    typeof p['index'] === 'number' &&
    Array.isArray(p['inked'])
  );
}

const progress = store('tastir.along', isProgress);

/** The progress kept for a tutorial, if any; never throws. */
export const getProgress = (tutorial: string): Progress | undefined =>
  progress.list().find((p) => p.tutorial === tutorial);

/** The drawing left most recently, if any (the list is newest first). */
export const latestProgress = (): Progress | undefined => progress.list()[0];

/** Every drawing kept in this browser, the most recent first. */
export const allProgress = (): Progress[] => progress.list();

/** Keeps a tutorial's progress; false when the browser refuses. */
export function keepProgress(p: Omit<Progress, 'updated'>): boolean {
  const others = progress.list().filter((q) => q.tutorial !== p.tutorial);
  return progress.write([{ ...p, updated: now() }, ...others]);
}

/** Forgets a tutorial's progress (Start again). */
export const forgetProgress = (tutorial: string): boolean =>
  progress.write(progress.list().filter((q) => q.tutorial !== tutorial));
