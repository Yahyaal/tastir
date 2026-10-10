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
import type { InkAlong, Tutorial } from '@tastir/schema';
import { asPanel, type Model } from '../app/model';
import { check, type Draft } from '../editor/document';
import { imagesOf, type Inkable } from '../editor/finish';
import { readyToInk, samePieces } from './inking';
import { lineKey, penGraph, type PenGraph } from './pen';
import { lap, startTiming } from './timing';

export interface Ready {
  readonly draft: Draft;
  readonly scene: Scene;
  readonly cell: Cell;
  readonly pieces: readonly InkPiece[];
  /** For runs along one line: each bit's line, as a key. */
  readonly inkable: Inkable;
  /** The bits the tutorial's ink keeps. */
  readonly classic: ReadonlySet<string>;
  /** The pattern they make, with its pieces. */
  readonly pattern: Pattern;
  /** Whether the pattern is its own mirror image. */
  readonly mirror: boolean;
  /** The dots and lines the pen goes along. */
  readonly graph: PenGraph;
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
const prepared = new Map<string, Ready>();

export function prepareInk(
  model: Model,
  draft: Draft,
): Ready | { reason: string } {
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
    const paths = new Map(
      pieces.map((p) => [p.id, { along: lineKey(p) } as InkAlong]),
    );
    const inkable = { cell, pieces, paths };
    lap('paths');
    // The bits the tutorial's own ink keeps, and the pieces they close.
    const classic = classicSelection(
      pieces,
      asPanel(model).pattern.ink,
      1e-7,
      cell,
    );
    lap('classic');
    const pattern = computePattern(
      scene,
      d as Tutorial,
      strokesOf(pieces, classic),
    );
    lap('pattern');
    // Symmetric inking follows the pattern's own symmetry: its turns,
    // and its mirror images only when it has them (a pinwheel has not).
    const mirror =
      !tutorial.chiral &&
      [...classic].every((id) =>
        imagesOf(inkable, id, 1, true).every((i) => classic.has(i)),
      );
    lap('mirror');
    const graph = penGraph(pieces);
    lap('graph');
    const ready: Ready = {
      draft: d,
      scene,
      cell,
      pieces,
      inkable,
      classic,
      pattern,
      mirror,
      graph,
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

export function checkInk(
  ready: Ready,
  chosen: ReadonlySet<string>,
  tutorial: Tutorial,
): InkCheck | undefined {
  if (!chosen.size) return undefined;
  try {
    const pattern =
      chosen.size === ready.classic.size &&
      [...chosen].every((id) => ready.classic.has(id))
        ? ready.pattern
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
