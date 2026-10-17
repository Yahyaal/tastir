import type { HistoryAction } from '@tastir/agent-protocol';
import type { Draft } from './document';

export interface DraftHistory {
  past: readonly Draft[];
  now: Draft;
  future: readonly Draft[];
  pastActions?: readonly HistoryAction[];
  futureActions?: readonly HistoryAction[];
}
const manual = (): HistoryAction => ({
  source: 'manual',
  requestId: null,
  label: 'Manual drawing edit',
});
export const draftHistoryObservation = (h: DraftHistory) => ({
  undoSteps: Math.min(50, h.past.length),
  redoSteps: Math.min(50, h.future.length),
  undo: h.past
    .map((_, i) => h.pastActions?.[i] ?? manual())
    .reverse()
    .slice(0, 50),
  redo: h.future.map((_, i) => h.futureActions?.[i] ?? manual()).slice(0, 50),
});
export function editDraft(
  h: DraftHistory,
  next: Draft,
  author = manual(),
  merge = false,
): DraftHistory {
  if (JSON.stringify(next) === JSON.stringify(h.now)) return h;
  return merge
    ? { ...h, now: next }
    : {
        past: [...h.past.slice(-99), h.now],
        now: next,
        future: [],
        pastActions: [
          ...h.past.map((_, i) => h.pastActions?.[i] ?? manual()).slice(-99),
          author,
        ],
        futureActions: [],
      };
}
export function travelDraft(
  h: DraftHistory,
  direction: 'undo' | 'redo',
  steps = 1,
  assistantOnly = false,
): DraftHistory {
  const available = direction === 'undo' ? h.past : h.future;
  if (steps > available.length)
    throw new Error('Not enough drawing history steps.');
  if (
    assistantOnly &&
    draftHistoryObservation(h)
      [direction].slice(0, steps)
      .some((a) => a.source !== 'assistant')
  )
    throw new Error('Assistant Undo cannot cross a manual drawing edit.');
  let next = h;
  for (let i = 0; i < steps; i++) {
    const actions = draftHistoryObservation(next);
    next =
      direction === 'undo'
        ? {
            past: next.past.slice(0, -1),
            now: next.past.at(-1)!,
            future: [next.now, ...next.future],
            pastActions: next.pastActions?.slice(0, -1),
            futureActions: [
              actions.undo[0]!,
              ...(next.futureActions ?? next.future.map(manual)),
            ],
          }
        : {
            past: [...next.past, next.now],
            now: next.future[0]!,
            future: next.future.slice(1),
            pastActions: [
              ...(next.pastActions ?? next.past.map(manual)),
              actions.redo[0]!,
            ],
            futureActions: next.futureActions?.slice(1),
          };
  }
  return next;
}
