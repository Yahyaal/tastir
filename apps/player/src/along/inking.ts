import { classicSelection, type Scene } from '@tastir/engine';
import type { Tutorial } from '@tastir/schema';
import type { Model } from '../app/model';
import type { Draft } from '../editor/document';
import type { Inkable } from '../editor/finish';
import { withTutorialTile } from './drawForMe';

/**
 * The board made ready to ink: the tutorial's tile on it, its fold, and
 * its pattern and expected pieces, so pieces that match keep the
 * tutorial's names and colors when the learner's drawing is played.
 */
export function readyToInk(
  tutorial: Tutorial,
  tScene: Scene,
  draft: Draft,
): Draft {
  const {
    draft: tiled,
    cell,
    panel,
  } = withTutorialTile(tutorial, tScene, draft);
  return {
    ...tiled,
    fold: tutorial.fold,
    ...(tutorial.chiral !== undefined ? { chiral: tutorial.chiral } : {}),
    pattern: { ...tutorial.pattern, cell, ...(panel ? { panel } : {}) },
    expect: tutorial.expect,
  };
}

/**
 * “Ink it for me”: the bits of line of the board that the tutorial's own
 * ink runs along, its copies in the neighbouring tiles included.
 */
export function tutorialInkOn(model: Model, inkable: Inkable): Set<string> {
  return classicSelection(
    inkable.pieces,
    model.pattern.ink,
    1e-7,
    inkable.cell,
  );
}

/** The kinds of piece, as an expect block lists them, in a fixed order. */
const kinds = (t: Pick<Tutorial, 'expect'>) =>
  t.expect.pieces
    .map((p) => ({ v: p.vertices, a: p.area, n: p.perCell }))
    .sort((x, y) => x.a - y.a || x.v - y.v);

/** Whether the learner's pieces are the pattern's: the same kinds, each
 * with the same corners, area and count in a tile. */
export function samePieces(
  made: Pick<Tutorial, 'expect'>,
  tutorial: Pick<Tutorial, 'expect'>,
): boolean {
  const a = kinds(made);
  const b = kinds(tutorial);
  return (
    a.length === b.length &&
    a.every(
      (k, i) =>
        k.v === b[i]?.v && k.n === b[i]?.n && Math.abs(k.a - b[i].a) < 1e-4,
    )
  );
}
