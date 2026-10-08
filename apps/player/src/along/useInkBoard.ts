import {
  cellOf,
  classicSelection,
  computePattern,
  inkPieces,
  type Cell,
  type InkPiece,
  type PieceType,
  type Scene,
} from '@tastir/engine';
import type { Tutorial } from '@tastir/schema';
import { useMemo, useState } from 'react';
import { asPanel, type Model } from '../app/model';
import { check, pointPlaces, type Draft } from '../editor/document';
import { imagesOf, runOf, tutorialOf, type Inkable } from '../editor/finish';
import { addPattern, freeTitle, type UserPattern } from '../editor/patterns';
import { strokesOf } from '@tastir/engine';
import type { InkAlong } from '@tastir/schema';
import { withTutorialInk } from './drawForMe';
import { readyToInk, samePieces } from './inking';

/** The board ready to ink: its tile, scene and every bit of line. */
interface Ready {
  readonly draft: Draft;
  readonly scene: Scene;
  readonly cell: Cell;
  readonly pieces: readonly InkPiece[];
  /** For runs along one line: each bit's line, as a key. */
  readonly inkable: Inkable;
}

const r6 = (n: number) => (Math.abs(n) < 5e-7 ? 0 : n).toFixed(6);

/** The line a bit runs along, as a key shared by every bit on it. */
function lineKey(p: InkPiece): string {
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
  return `${r6(dx)},${r6(dy)},${r6(a.x * dy - a.y * dx)}`;
}

/** How the learner's inking stands against the pattern. */
export interface InkCheck {
  /** The kinds of piece the ink closes. */
  readonly types: readonly PieceType[];
  /** Whether they are the pattern's. */
  readonly matches: boolean;
}

/**
 * The ink stage of drawing along: the learner inks their own board, bit
 * by bit (with its turned and mirrored copies, a whole run at a time, as
 * in the editor), and the pieces their ink closes are checked against the
 * pattern's. When they match, the drawing is kept as one of their own
 * patterns and played from the repeat.
 */
export function useInkBoard(
  model: Model,
  draft: Draft,
  active: boolean,
  chosen: ReadonlySet<string>,
  setChosen: (s: ReadonlySet<string>) => void,
) {
  const { tutorial } = model;
  const ready = useMemo((): Ready | { reason: string } | undefined => {
    if (!active) return undefined;
    try {
      const d = readyToInk(tutorial, model.scene, draft);
      const scene = check(d).scene;
      const cell = cellOf(scene, d.pattern?.cell ?? '');
      const pieces = inkPieces(scene, cell);
      const paths = new Map(
        pieces.map((p) => [p.id, { along: lineKey(p) } as InkAlong]),
      );
      return {
        draft: d,
        scene,
        cell,
        pieces,
        inkable: { cell, pieces, paths },
      };
    } catch (e) {
      return { reason: e instanceof Error ? e.message : String(e) };
    }
  }, [active, tutorial, model.scene, draft]);
  const [symmetric, setSymmetric] = useState(true);
  const [wholeRuns, setWholeRuns] = useState(true);

  const result = useMemo((): InkCheck | undefined => {
    if (!ready || 'reason' in ready || !chosen.size) return undefined;
    try {
      const pattern = computePattern(
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
  }, [ready, chosen, tutorial]);

  const toggle = (id: string) => {
    if (!ready || 'reason' in ready) return;
    const { inkable } = ready;
    const run = wholeRuns
      ? runOf(
          inkable,
          id,
          pointPlaces(ready.scene).map((p) => p.at),
          ready.scene,
        )
      : [id];
    const ids = symmetric
      ? run.flatMap((r) =>
          imagesOf(inkable, r, tutorial.fold, !tutorial.chiral),
        )
      : run;
    const next = new Set(chosen);
    const on = !chosen.has(id);
    for (const i of ids) {
      if (on) next.add(i);
      else next.delete(i);
    }
    setChosen(next);
  };

  /** “Ink it for me”: the bits the tutorial's own ink runs along. */
  const inkForMe = () => {
    if (!ready || 'reason' in ready) return;
    setChosen(
      classicSelection(
        ready.pieces,
        asPanel(model).pattern.ink,
        1e-7,
        ready.cell,
      ),
    );
  };

  /**
   * Keeps the drawing as one of the learner's patterns, based on the
   * tutorial and crediting it, with the tutorial's own ink taken onto
   * the board (the learner's ink closes the same pieces). Its address,
   * or why it could not be kept.
   */
  const keep = (): { pattern: UserPattern } | { reason: string } => {
    if (!ready || 'reason' in ready) return { reason: 'There is no tile.' };
    try {
      const inked = withTutorialInk(tutorial, model.scene, ready.draft);
      const made = tutorialOf(inked);
      if (!('tutorial' in made)) return { reason: made.reason };
      if (!samePieces(made.tutorial, tutorial))
        return { reason: 'The drawing does not close the pattern’s pieces.' };
      const pattern = addPattern(
        {
          ...made.tutorial,
          id: `${tutorial.id}-mine`,
          title: freeTitle(`My ${tutorial.title}`),
          credits: [
            ...tutorial.credits,
            {
              source: `Tastir: ${tutorial.title}`,
              note: `Drawn along with the library tutorial “${tutorial.title}” (${tutorial.id}).`,
            },
          ],
        },
        {
          tutorial: tutorial.id,
          title: tutorial.title,
          step: tutorial.steps.filter((s) => !s.hidden).length,
        },
      );
      return pattern
        ? { pattern }
        : {
            reason:
              'This browser would not keep it: its storage is blocked or full.',
          };
    } catch (e) {
      return { reason: e instanceof Error ? e.message : String(e) };
    }
  };

  return {
    ready,
    result,
    toggle,
    inkForMe,
    keep,
    symmetric,
    setSymmetric,
    wholeRuns,
    setWholeRuns,
  };
}
