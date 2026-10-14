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

/** What is kept for a lesson in progress: its stage, the step's name and
 * when it was left. (An older save is the stage alone, a number.) */
interface Kept {
  readonly index: number;
  readonly label: string;
  readonly at: string;
}

function keptAt(address: string): Kept | undefined {
  try {
    const saved: unknown = JSON.parse(
      window.localStorage.getItem(atKey(address)) ?? 'null',
    );
    if (typeof saved === 'number') return { index: saved, label: '', at: '' };
    if (
      saved &&
      typeof saved === 'object' &&
      typeof (saved as Kept).index === 'number'
    ) {
      const k = saved as Partial<Kept>;
      return {
        index: k.index ?? 0,
        label: typeof k.label === 'string' ? k.label : '',
        at: typeof k.at === 'string' ? k.at : '',
      };
    }
  } catch {
    // Unreadable: as if nothing were kept.
  }
  return undefined;
}

/** Where the learner left a lesson: a step or the ink, never the end. */
export function lessonAt(
  address: string,
  stages: readonly Stage[],
): number | undefined {
  const saved = keptAt(address)?.index;
  const kind = saved === undefined ? undefined : stages[saved]?.kind;
  return saved !== undefined && saved > 0 && (kind === 'step' || kind === 'ink')
    ? saved
    : undefined;
}

/** Every lesson left partway, the most recent first. */
export function lessonsInProgress(): LastLesson[] {
  const out: LastLesson[] = [];
  try {
    const storage = window.localStorage;
    for (let n = 0; n < storage.length; n++) {
      const key = storage.key(n);
      if (!key?.startsWith('tastir.lessonAt.')) continue;
      const address = key.slice('tastir.lessonAt.'.length);
      const kept = keptAt(address);
      if (kept && kept.index > 0)
        out.push({ address, label: kept.label, at: kept.at });
    }
  } catch {
    // Nothing to offer.
  }
  return out.sort((a, b) => (b.at ?? '').localeCompare(a.at ?? ''));
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
    const when = new Date().toISOString();
    storage.setItem(
      atKey(address),
      JSON.stringify({ index: at, label, at: when }),
    );
    storage.setItem(LAST, JSON.stringify({ address, label, at: when }));
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
