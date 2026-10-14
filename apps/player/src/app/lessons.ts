import type { Stage } from './model';

/**
 * Where the learner left each lesson, and the lesson they were in last, so
 * a lesson reopens at its step and the library can offer to continue it.
 * Storage can be missing or blocked (a private window), so every read and
 * write may fail quietly; the lesson then starts at step 1.
 */

const atKey = (address: string) => `tastir.lessonAt.${address}`;
const LAST = 'tastir.lastLesson';

/** The lesson the learner was in last, and how far they got. */
export interface LastLesson {
  readonly address: string;
  /** The step as the lesson names it, such as “Step 9 of 22”. */
  readonly label: string;
  /** When it was left, as an ISO date. */
  readonly at?: string;
}

/** Where the learner left a lesson: a step or the ink, never the end. */
export function lessonAt(
  address: string,
  stages: readonly Stage[],
): number | undefined {
  try {
    const saved: unknown = JSON.parse(
      window.localStorage.getItem(atKey(address)) ?? 'null',
    );
    const kind = typeof saved === 'number' ? stages[saved]?.kind : undefined;
    return typeof saved === 'number' &&
      saved > 0 &&
      (kind === 'step' || kind === 'ink')
      ? saved
      : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Remembers where the learner is, with the step's name for the library;
 * undefined forgets the lesson (and stops offering it to continue).
 */
export function keepLessonAt(
  address: string,
  at: number | undefined,
  label = '',
): void {
  try {
    const storage = window.localStorage;
    if (at === undefined) {
      storage.removeItem(atKey(address));
      if (lastLesson()?.address === address) storage.removeItem(LAST);
      return;
    }
    storage.setItem(atKey(address), JSON.stringify(at));
    storage.setItem(
      LAST,
      JSON.stringify({ address, label, at: new Date().toISOString() }),
    );
  } catch {
    // Not remembered; the lesson opens at step 1 next time.
  }
}

/** The lesson to offer to continue, if the learner left one partway. */
export function lastLesson(): LastLesson | undefined {
  try {
    const saved: unknown = JSON.parse(
      window.localStorage.getItem(LAST) ?? 'null',
    );
    if (
      saved &&
      typeof saved === 'object' &&
      typeof (saved as LastLesson).address === 'string' &&
      typeof (saved as LastLesson).label === 'string'
    )
      return saved as LastLesson;
  } catch {
    // Nothing to continue.
  }
  return undefined;
}
