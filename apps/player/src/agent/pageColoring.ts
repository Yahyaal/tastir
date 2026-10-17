import type { Dispatch } from 'react';
import type { Snapshot, ToolCall, HistoryAction } from '@tastir/agent-protocol';
import {
  PALETTES,
  typeKey,
  pieceColors,
  type Coloring,
  type ColorAction,
  type History,
} from '../app/coloring';
import { rosetteOptions } from '../app/rings';
import type { Design } from '../app/designs';
import type { Model } from '../app/model';
import {
  colouredModel,
  colorRepeat,
  methodsOf,
  methodOf,
  ringsFor,
  placementKey,
  placeKey,
  paintChosen,
} from '../app/placement';
import {
  checkedSquareBands,
  squareGridTypes,
  commonPeriod,
  squareBandPeriod,
} from '../app/squareBands';

interface PageColoring {
  model: Model;
  history: History;
  dispatch: Dispatch<ColorAction>;
  route: string;
  style?: string;
  selected?: { piece: number; i: number; j: number };
  saveNew?: (name: string) => Design | undefined;
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
export const pageColorSelected = () =>
  current?.selected
    ? `geometry:piece${current.selected.piece}@${current.selected.i},${current.selected.j}`
    : null;
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
      squareTypes:
        !current.style || current.style === 'tiles'
          ? squareGridTypes(model)
          : [],
      methods: methodsOf(model),
      types: model.pattern.types.map((t, i) => ({
        id: t.name ?? typeKey(t),
        color: pieceColors(model, history.now)[i]!,
      })),
      rosetteOptions: rosetteOptions(model.pattern),
      method: methodOf(model, history.now),
      palette: history.now.palette,
      rosettes:
        history.now.rosettes ??
        ringsFor(colouredModel(model, history.now))?.rosettes ??
        1,
      squareBands: history.now.squareBands ?? null,
    },
    canSave: !!current.saveNew,
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
    const { targetId, colors, sharedBorder } = call.arguments;
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
      ...(sharedBorder ? { sharedBorder } : {}),
    });
    const base = colouredModel(model, {
      ...history.now,
      squareBands: undefined,
    });
    const period = colorRepeat(base).map((n) =>
      commonPeriod(n, squareBandPeriod(squareBands)),
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
          ([key]) =>
            !key.startsWith(`${typeKey(model.pattern.types[piece!.type]!)}#`),
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
  const commit = (next: Coloring) => {
    if (JSON.stringify(next) === JSON.stringify(history.now))
      throw new Error('Those colors are already applied.');
    dispatch({
      kind: 'reset',
      to: next,
      author: { source: 'assistant', requestId, label: call.arguments.label },
    });
    return 'Applied one normal color-history edit. A fresh wall image follows.';
  };
  if (call.name === 'save_work') {
    const saved = current.saveNew?.(call.arguments.name);
    if (!saved) throw new Error('The browser could not save this design.');
    return `Saved a new design “${saved.name}” in Your work. Destination: design:${saved.id}.`;
  }
  if (call.name === 'set_coloring') {
    const { method, rosettes } = call.arguments;
    if (
      !methodsOf(model).includes(method) ||
      (rosettes !== null &&
        (method !== 'rings' ||
          !rosetteOptions(model.pattern).includes(rosettes)))
    )
      throw new Error('Use a supported coloring method and rosette count.');
    return commit({
      ...history.now,
      chosen: {},
      squareBands: undefined,
      method,
      ...(rosettes === null ? {} : { rosettes }),
    });
  }
  if (call.name === 'paint_pattern') {
    const { palette, colors } = call.arguments;
    if (palette !== null && !PALETTES[palette])
      throw new Error('Use an available palette name.');
    const chosen = { ...(palette === null ? history.now.chosen : {}) };
    for (const { typeId, color } of colors) {
      const type = model.pattern.types.find(
        (t) => (t.name ?? typeKey(t)) === typeId,
      );
      if (!type) throw new Error('Choose a current piece type ID.');
      const key = typeKey(type);
      for (const own of Object.keys(chosen))
        if (own === key || own.startsWith(`${key}#`)) delete chosen[own];
      chosen[key] = color;
    }
    return commit({
      ...history.now,
      palette: palette ?? history.now.palette,
      squareBands:
        palette !== null ||
        colors.some((c) => c.typeId === history.now.squareBands?.typeId)
          ? undefined
          : history.now.squareBands,
      chosen,
    });
  }
  if (call.name === 'paint_targets') {
    const rendered = colouredModel(model, history.now);
    let chosen = { ...history.now.chosen };
    for (const { targetId, color } of call.arguments.targets) {
      const target = snapshot.targets.find(
        (t) => t.id === targetId && t.kind === 'polygon',
      );
      const match = /^geometry:piece(\d+)@(-?\d+),(-?\d+)$/.exec(targetId);
      if (!target || !match)
        throw new Error('Choose visible wall polygon targets.');
      const [piece, i, j] = match.slice(1).map(Number) as [
        number,
        number,
        number,
      ];
      const type = model.pattern.types[model.pattern.pieces[piece]?.type ?? -1];
      if (!type) throw new Error('That placement no longer exists.');
      let key = typeKey(type);
      if (call.arguments.scope === 'placement')
        key = placementKey(rendered, piece, i, j);
      else if (call.arguments.scope === 'ring') {
        if (!ringsFor(rendered))
          throw new Error('This coloring has no rosette rings.');
        key = placeKey(rendered, piece, i, j);
      } else {
        for (const own of Object.keys(chosen))
          if (own === key || own.startsWith(`${key}#`)) delete chosen[own];
      }
      chosen =
        call.arguments.scope === 'placement'
          ? { ...chosen, [key]: color }
          : paintChosen(rendered, { ...history.now, chosen }, key, color);
    }
    // Shape repainting intentionally replaces a spatial square motif for that shape.
    const repaintSquare =
      call.arguments.scope === 'shape' &&
      call.arguments.targets.some(
        ({ targetId }) =>
          snapshot.targets.find((t) => t.id === targetId)?.geometry[
            'typeId'
          ] === history.now.squareBands?.typeId,
      );
    return commit({
      ...history.now,
      chosen,
      ...(repaintSquare ? { squareBands: undefined } : {}),
    });
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
