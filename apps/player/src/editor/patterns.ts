import { newId, now, store } from '../app/storage';
import type { Draft } from './document';

/**
 * A learner's own pattern, kept in this browser: a whole tutorial (a draft
 * until it is inked and tiled) and, for a copy, where it came from. It is
 * a full copy, so it keeps working when we later change the original.
 */
export interface UserPattern {
  readonly id: string;
  readonly tutorial: Draft;
  /** The library tutorial it was copied from, and the step it was cut at. */
  readonly basedOn?: {
    readonly tutorial: string;
    readonly title: string;
    readonly step: number;
  };
  readonly created: string;
  readonly updated: string;
}

/** Whether a stored entry is a whole pattern; anything else is dropped. */
function isPattern(x: unknown): x is UserPattern {
  if (typeof x !== 'object' || x === null) return false;
  const p = x as Record<string, unknown>;
  const t = p['tutorial'] as Record<string, unknown> | null | undefined;
  return (
    typeof p['id'] === 'string' &&
    typeof t === 'object' &&
    t !== null &&
    typeof t['title'] === 'string' &&
    Array.isArray(t['steps']) &&
    typeof p['created'] === 'string' &&
    typeof p['updated'] === 'string'
  );
}

const patterns = store('tastir.patterns', isPattern);

/** Every pattern, the latest changed first; never throws. */
export const listPatterns = (): UserPattern[] =>
  patterns.list().sort((a, b) => b.updated.localeCompare(a.updated));

export const getPattern = (id: string): UserPattern | undefined =>
  listPatterns().find((p) => p.id === id);

/** Keeps a new pattern; undefined when the browser would not keep it. */
export function addPattern(
  tutorial: Draft,
  basedOn?: UserPattern['basedOn'],
): UserPattern | undefined {
  const at = now();
  const pattern: UserPattern = {
    id: newId(),
    tutorial,
    ...(basedOn ? { basedOn } : {}),
    created: at,
    updated: at,
  };
  return patterns.write([pattern, ...listPatterns()]) ? pattern : undefined;
}

/** Keeps a pattern's new tutorial; undefined when it is gone or refused. */
export function savePattern(
  id: string,
  tutorial: Draft,
): UserPattern | undefined {
  const all = listPatterns();
  const before = all.find((p) => p.id === id);
  if (!before) return undefined;
  const after: UserPattern = { ...before, tutorial, updated: now() };
  return patterns.write(all.map((p) => (p.id === id ? after : p)))
    ? after
    : undefined;
}

export const deletePattern = (id: string): boolean =>
  patterns.write(listPatterns().filter((p) => p.id !== id));
