import {
  cellOf,
  classicSelection,
  computePattern,
  inkPieces,
  strokesOf,
  type Cell,
  type InkPiece,
  type Pattern,
  type PieceType,
  type Scene,
} from '@tastir/engine';
import type { Tutorial } from '@tastir/schema';
import { asPanel, type Model } from '../app/model';
import { check, type Draft } from '../editor/document';
import { imagesOf, type Inkable } from '../editor/finish';
import { readyToInk, samePieces } from './inking';
import { buffersOf, penParts, PenGraph, type PenParts } from './pen';
import { lap, startTiming } from './timing';

/** The pattern the tutorial's ink makes on a board, and its symmetry. */
export interface Finished {
  /** The pattern the classic bits make, with its pieces. */
  readonly pattern: Pattern;
  /** Whether the pattern is its own mirror image. */
  readonly mirror: boolean;
}

/** A board prepared for inking, kept in the worker that prepared it. */
export interface Prepared {
  readonly draft: Draft;
  readonly scene: Scene;
  readonly cell: Cell;
  readonly pieces: readonly InkPiece[];
  /** The bits the tutorial's ink keeps. */
  readonly classic: ReadonlySet<string>;
  /** The dots and lines the pen goes along, as flat arrays. */
  readonly parts: PenParts;
  /** Whether the tutorial's pattern is chiral (it has no mirror image). */
  readonly chiral: boolean;
  /** Its pattern, once found: shared by the copies the cache hands out. */
  readonly finished: { value?: Finished };
}

/**
 * What the page gets of a prepared board: what it draws and what the pen
 * needs. The bits and the pen graph come as typed arrays, transferred; the
 * learner's ink is checked in the worker against the board it keeps, named
 * by `board`.
 */
export interface Sent {
  readonly board: number;
  readonly scene: Scene;
  readonly cell: Cell;
  readonly classic: readonly string[];
  readonly parts: PenParts;
}

/** What the page gets of a board's pattern, sent after the board. */
export interface SentPattern {
  readonly board: number;
  readonly pattern: Pick<Pattern, 'cell' | 'pieces' | 'types'>;
  readonly mirror: boolean;
}

/** A prepared board on the page. */
export interface Ready {
  /** Which board the worker keeps, for checking ink against it. */
  readonly board: number;
  readonly scene: Scene;
  readonly cell: Cell;
  readonly pieces: readonly InkPiece[];
  /** For the copies of a bit round the centre. */
  readonly inkable: Inkable;
  /** The bits the tutorial's ink keeps. */
  readonly classic: ReadonlySet<string>;
  /** The dots and lines the pen goes along. */
  readonly graph: PenGraph;
  /** The pattern the classic bits make, with its pieces: it follows the
   * board, so the pen works before it comes. */
  readonly pattern?: Pick<Pattern, 'cell' | 'pieces' | 'types'>;
  /** Whether the pattern is its own mirror image, when it has come. */
  readonly mirror?: boolean;
}

/** A prepared board as the page holds it, from what the worker sent. */
export function readyOf(sent: Sent): Ready {
  const graph = new PenGraph(sent.parts);
  const { pieces } = graph;
  return {
    board: sent.board,
    scene: sent.scene,
    cell: sent.cell,
    pieces,
    // Copies round the centre are found by the bits' ends alone.
    inkable: { cell: sent.cell, pieces, paths: new Map() },
    classic: new Set(sent.classic),
    graph,
  };
}

/** The typed arrays of what is sent, to transfer rather than copy. */
export function transfers(sent: Sent): ArrayBuffer[] {
  return buffersOf(sent.parts);
}

/**
 * Whether the classic bits are their own mirror image. Symmetric inking
 * follows the pattern's own symmetry: its turns, and its mirror images
 * only when it has them (a pinwheel has not).
 */
export function mirrorOf(
  inkable: Inkable,
  classic: ReadonlySet<string>,
  chiral: boolean | undefined,
): boolean {
  return (
    !chiral &&
    [...classic].every((id) =>
      imagesOf(inkable, id, 1, true).every((i) => classic.has(i)),
    )
  );
}

/** How the learner's inking stands against the pattern. */
export interface InkCheck {
  /** The kinds of piece the ink closes. */
  readonly types: readonly PieceType[];
  /** Whether they are the pattern's. */
  readonly matches: boolean;
}

// A board often adds only names for crossings, or lines already supplied
// by the ink stage. Cache by exact curve geometry, not names or step ids.
const prepared = new Map<string, Prepared>();

/** A board's bits, the tutorial's ink on them and the pen's graph. */
export function prepareInk(
  model: Model,
  draft: Draft,
): Prepared | { reason: string } {
  const { tutorial } = model;
  startTiming();
  try {
    const d = readyToInk(tutorial, model.scene, draft);
    lap('board');
    const scene = check(d).scene;
    lap('scene');
    const cell = cellOf(scene, d.pattern?.cell ?? '');
    const curves = new Set<string>();
    for (const { geometry: g } of scene.elements.values()) {
      if (g.kind === 'line') curves.add(JSON.stringify(g.line));
      else if (g.kind === 'circle') curves.add(JSON.stringify(g.circle));
      else if (g.kind === 'polygon')
        for (const side of g.sides) curves.add(JSON.stringify(side));
    }
    const key = JSON.stringify([
      cell,
      scene.tol,
      [...curves].sort(),
      model.pattern.ink,
      tutorial.expect,
      tutorial.chiral,
    ]);
    lap('key');
    const cached = prepared.get(key);
    if (cached) return { ...cached, draft: d, scene, cell };
    const pieces = inkPieces(scene, cell, { allEdges: true });
    lap('bits');
    // The bits the tutorial's own ink keeps.
    const classic = classicSelection(
      pieces,
      asPanel(model).pattern.ink,
      1e-7,
      cell,
    );
    lap('classic');
    const parts = penParts(pieces);
    lap('graph');
    const ready: Prepared = {
      draft: d,
      scene,
      cell,
      pieces,
      classic,
      parts,
      chiral: Boolean(tutorial.chiral),
      finished: {},
    };
    // Bound retained geometry: a worker lives for one draw-along visit.
    if (prepared.size >= 2)
      prepared.delete(prepared.keys().next().value as string);
    prepared.set(key, ready);
    return ready;
  } catch (e) {
    return { reason: e instanceof Error ? e.message : String(e) };
  }
}

/** The pieces the classic bits close, and whether they are their own
 * mirror image (found once per board). */
export function finishInk(ready: Prepared): Finished {
  if (ready.finished.value) return ready.finished.value;
  startTiming();
  const pattern = computePattern(
    ready.scene,
    ready.draft as Tutorial,
    strokesOf(ready.pieces, ready.classic),
  );
  lap('pattern');
  const { cell, pieces } = ready;
  const mirror = mirrorOf(
    { cell, pieces, paths: new Map() },
    ready.classic,
    ready.chiral,
  );
  lap('mirror');
  ready.finished.value = { pattern, mirror };
  return ready.finished.value;
}

/**
 * The ink of one draw-along visit, kept where it was prepared: each board
 * under a number, which the page names to check the learner's ink against
 * it, so the bits never travel back.
 */
export class InkSession {
  private readonly boards = new Map<number, Prepared>();
  private next = 0;

  /** Prepares a board, keeping it; what the page needs of it. */
  prepare(model: Model, draft: Draft): Sent | { reason: string } {
    const ready = prepareInk(model, draft);
    if ('reason' in ready) return ready;
    const board = this.next++;
    // The page checks only its newest board; one before it may still be
    // asked for while the newest comes.
    if (this.boards.size >= 2)
      this.boards.delete(this.boards.keys().next().value as number);
    this.boards.set(board, ready);
    return {
      board,
      scene: ready.scene,
      cell: ready.cell,
      classic: [...ready.classic],
      parts: ready.parts,
    };
  }

  /** The pattern on a board prepared here, which follows the board. */
  finish(board: number): SentPattern | { reason: string } {
    try {
      const { pattern, mirror } = finishInk(this.get(board));
      const { cell, pieces, types } = pattern;
      return { board, pattern: { cell, pieces, types }, mirror };
    } catch (e) {
      return { reason: e instanceof Error ? e.message : String(e) };
    }
  }

  /** How the learner's ink stands against a board prepared here. */
  check(
    board: number,
    chosen: ReadonlySet<string>,
    tutorial: Tutorial,
  ): InkCheck | undefined {
    return checkInk(this.get(board), chosen, tutorial);
  }

  private get(board: number): Prepared {
    const ready = this.boards.get(board);
    if (!ready) throw new Error('The board to check is no longer prepared.');
    return ready;
  }
}

export function checkInk(
  ready: Prepared,
  chosen: ReadonlySet<string>,
  tutorial: Tutorial,
): InkCheck | undefined {
  if (!chosen.size) return undefined;
  try {
    const pattern =
      chosen.size === ready.classic.size &&
      [...chosen].every((id) => ready.classic.has(id))
        ? finishInk(ready).pattern
        : computePattern(
            ready.scene,
            ready.draft as Tutorial,
            strokesOf(ready.pieces, chosen),
          );
    const made = {
      expect: {
        pieceTypes: pattern.types.length,
        pieces: pattern.types.map((t) => ({
          name: t.name ?? '',
          vertices: t.vertices,
          area: Number(t.area.toFixed(5)),
          perCell: t.perCell,
        })),
      },
    } as Pick<Tutorial, 'expect'>;
    return { types: pattern.types, matches: samePieces(made, tutorial) };
  } catch {
    return { types: [], matches: false };
  }
}
