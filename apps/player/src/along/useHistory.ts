import { useCallback, useState } from 'react';

/** Independent undo stacks for construction, ink, and placed tiles. */
export function useHistory<T>(initial: () => T) {
  const [history, setHistory] = useState<{
    past: readonly T[];
    now: T;
    future: readonly T[];
  }>(() => ({ past: [], now: initial(), future: [] }));
  const change = useCallback(
    (next: T) =>
      setHistory((h) => ({ past: [...h.past, h.now], now: next, future: [] })),
    [],
  );
  const undo = useCallback(
    () =>
      setHistory((h) =>
        h.past.length
          ? {
              past: h.past.slice(0, -1),
              now: h.past.at(-1) as T,
              future: [h.now, ...h.future],
            }
          : h,
      ),
    [],
  );
  const redo = useCallback(
    () =>
      setHistory((h) =>
        h.future.length
          ? {
              past: [...h.past, h.now],
              now: h.future[0] as T,
              future: h.future.slice(1),
            }
          : h,
      ),
    [],
  );
  return { history, setHistory, change, undo, redo };
}
