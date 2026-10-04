import {
  classicSelection,
  computePattern,
  inkPieces,
  strokesOf,
} from '@tastir/engine';
import { useCallback, useMemo, useState } from 'react';
import type { FreeInk } from './drawing';
import type { Model } from './model';

/**
 * Free inking: which pieces of construction are inked, and the model with
 * the pattern they make. Until the learner changes something, the
 * tutorial's own (classic) inking is used.
 */
export function useInking(model: Model) {
  const [editing, setEditing] = useState(false);
  // undefined while the inking is the tutorial's own.
  const [chosen, setChosen] = useState<ReadonlySet<string>>();

  const pieces = useMemo(
    () => (editing || chosen ? inkPieces(model.scene, model.pattern.cell) : []),
    [editing, chosen, model],
  );
  const classic = useMemo(
    () => classicSelection(pieces, model.pattern.ink, model.scene.tol.eps),
    [pieces, model],
  );

  const shown = useMemo((): Model => {
    if (!chosen) return model;
    const pattern = computePattern(
      model.scene,
      model.tutorial,
      strokesOf(pieces, chosen),
    );
    return { ...model, pattern };
  }, [chosen, pieces, model]);

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
    /** Back to the tutorial's own inking. */
    restoreClassic: () => setChosen(undefined),
  };
}
