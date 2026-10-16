import type { Dispatch } from 'react';
import type { Snapshot, ToolCall, HistoryAction } from '@tastir/agent-protocol';
import type { ColorAction, History } from '../app/coloring';
import type { Model } from '../app/model';
import { colouredModel, colorRepeat } from '../app/placement';
import {
  checkedSquareBands,
  squareGridTypes,
  commonPeriod,
} from '../app/squareBands';

interface PageColoring {
  model: Model;
  history: History;
  dispatch: Dispatch<ColorAction>;
  route: string;
}
let current: PageColoring | undefined;
export function registerPageColoring(value: PageColoring) {
  current = value;
  return () => {
    if (current === value) current = undefined;
  };
}
export const pageColorRevision = () =>
  current
    ? JSON.stringify([
        current.route,
        current.history.now,
        current.history.past.length,
        current.history.future.length,
      ])
    : '';
const unknown = (): HistoryAction => ({
  source: 'unknown',
  requestId: null,
  label: 'Earlier color edit',
});
export function pageColorObservation() {
  if (!current) return { coloring: null, history: null };
  const { model, history } = current;
  return {
    coloring: {
      squareTypes: squareGridTypes(model),
      squareBands: history.now.squareBands ?? null,
    },
    history: {
      undoSteps: Math.min(50, history.past.length),
      redoSteps: Math.min(50, history.future.length),
      undo: history.past
        .map((_, i) => history.pastActions?.[i] ?? unknown())
        .reverse()
        .slice(0, 50),
      redo: history.future
        .map((_, i) => history.futureActions?.[i] ?? unknown())
        .slice(0, 50),
    },
  };
}

/** Only explicit color commands reach the active player's actual reducer. */
export function applyPageColor(
  call: ToolCall,
  snapshot: Snapshot,
  requestId: string,
) {
  if (
    !current ||
    current.route !== snapshot.screen?.route ||
    !snapshot.coloring
  )
    throw new Error(
      'Open the normal pattern’s Color/result page before coloring.',
    );
  const { model, history, dispatch } = current;
  if (call.name === 'color_square_bands') {
    const { targetId, colors } = call.arguments;
    const target = snapshot.targets.find((t) => t.id === targetId);
    const match = /^geometry:piece(\d+)@(-?\d+),(-?\d+)$/.exec(targetId);
    if (!target || target.kind !== 'polygon' || !match)
      throw new Error(
        'Choose a visible square placement from this observation.',
      );
    const piece = model.pattern.pieces[Number(match[1])];
    const typeId = piece && model.pattern.types[piece.type]?.name;
    if (
      !typeId ||
      target.geometry['typeId'] !== typeId ||
      !snapshot.coloring.squareTypes.includes(typeId)
    )
      throw new Error(
        'The chosen piece is not a supported square-grid placement.',
      );
    const squareBands = checkedSquareBands(model, {
      typeId,
      centre: [Number(match[2]), Number(match[3])],
      colors,
    });
    const base = colouredModel(model, {
      ...history.now,
      squareBands: undefined,
    });
    const period = colorRepeat(base).map((n) =>
      commonPeriod(n, colors.length * 2 - 1),
    );
    if (
      period.some((n) => n > 48) ||
      period[0]! * period[1]! * model.pattern.pieces.length > 12000
    )
      throw new Error(
        'This color repeat is too large. Use fewer square bands.',
      );
    const next = {
      ...history.now,
      squareBands,
      chosen: Object.fromEntries(
        Object.entries(history.now.chosen).filter(
          ([key]) => !key.startsWith(`${typeId}#`),
        ),
      ),
    };
    colouredModel(model, next); // Bound the actual combined color repeat before dispatch.
    if (JSON.stringify(next) === JSON.stringify(history.now))
      throw new Error('Those square bands are already applied.');
    dispatch({
      kind: 'reset',
      to: next,
      author: { source: 'assistant', requestId, label: call.arguments.label },
    });
    return 'Applied concentric square bands as one color edit. Other shapes keep their colors. The motif repeats after its outer border; a fresh image follows.';
  }
  if (call.name === 'travel_history') {
    const { direction, scope, steps } = call.arguments;
    const available = direction === 'undo' ? history.past : history.future;
    const actions =
      direction === 'undo'
        ? pageColorObservation().history!.undo
        : pageColorObservation().history!.redo;
    if (
      steps > available.length ||
      (scope === 'assistant' &&
        actions.slice(0, steps).some((a) => a.source !== 'assistant'))
    )
      throw new Error(
        'Not enough eligible color edits. Assistant Undo cannot cross manual or unidentified work.',
      );
    for (let i = 0; i < steps; i++) dispatch({ kind: direction });
    return `Completed ${direction} for ${steps} color edit(s) using this page’s Undo history. A fresh image follows.`;
  }
  throw new Error(
    'This page supports square-band coloring and color Undo/Redo.',
  );
}
