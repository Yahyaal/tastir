import { classicSelection } from '@tastir/engine';
import { useCallback, useMemo, useState } from 'react';
import type { FreeInk } from './drawing';
import { inkFits, inkPiecesOf, patternInked, type Model } from './model';

/**
 * Free inking: which pieces of construction are inked, and the model with
 * the pattern they make. Until the learner changes something, the
 * tutorial's own (classic) inking is used, or a saved design's inking.
 */
export function useInking(model: Model, saved?: readonly string[]) {
  const [editing, setEditing] = useState(false);
  // A saved inking whose pieces are gone (the tutorial has changed since)
  // gives way to the tutorial's own, and says so.
  const [start] = useState(() =>
    saved && !inkFits(model, saved)
      ? { lost: true }
      : { lost: false, chosen: saved && new Set(saved) },
  );
  // undefined while the inking is the tutorial's own.
  const [chosen, setChosen] = useState<ReadonlySet<string> | undefined>(
    start.chosen,
  );

  const pieces = useMemo(
    () => (editing || chosen ? inkPiecesOf(model) : []),
    [editing, chosen, model],
  );
  const classic = useMemo(
    () =>
      classicSelection(
        pieces,
        model.pattern.ink,
        model.scene.tol.eps,
        model.pattern.cell,
      ),
    [pieces, model],
  );

  const shown = useMemo(
    (): Model =>
      chosen ? { ...model, pattern: patternInked(model, chosen) } : model,
    [chosen, model],
  );

  const onToggle = useCallback(
    (id: string) =>
      setChosen((before) => {
        const next = new Set(before ?? classic);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
    [classic],
  );

  const inked = useMemo(
    () => (chosen ? [...chosen].sort() : undefined),
    [chosen],
  );

  const freeInk: FreeInk | undefined = editing
    ? { pieces, chosen: chosen ?? classic, onToggle }
    : undefined;

  return {
    /** The model with the pattern the current inking makes. */
    shown,
    editing,
    setEditing,
    freeInk,
    isClassic: chosen === undefined,
    /** The inked pieces, as a design keeps them; none while classic. */
    inked,
    /** Whether a saved inking no longer fitted and was dropped. */
    lost: start.lost,
    /** Back to the tutorial's own inking. */
    restoreClassic: () => setChosen(undefined),
  };
}
