import type { Snapshot } from '@tastir/agent-protocol';

/** Local companion identity, separate from the owner and MCP client names. */
export const COMPANION_ACTOR = 'tastir-assistant';
interface Entry {
  readonly author: string;
  readonly label: string;
}

/** The server decides ownership; the UI must not guess from local Undo steps. */
export function projectHistory(history: {
  readonly undo: readonly Entry[];
  readonly redo: readonly Entry[];
}): NonNullable<Snapshot['history']> {
  const actions = (entries: readonly Entry[]) =>
    entries.slice(0, 50).map((entry) => ({
      source:
        entry.author === COMPANION_ACTOR
          ? ('assistant' as const)
          : ('manual' as const),
      requestId: null,
      label: `${entry.author}: ${entry.label}`.slice(0, 160),
    }));
  const undo = actions(history.undo);
  const redo = actions(history.redo);
  return { undoSteps: undo.length, redoSteps: redo.length, undo, redo };
}
