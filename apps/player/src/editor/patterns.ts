import { newId, now, store } from '../app/storage';
import type { Draft } from './document';
import { tutorialOf } from './finish';

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
  /** A wall the learner laid by hand when drawing along: where each copy
   * of the tile sits (offsets from the first), and its colours. */
  readonly wall?: {
    readonly copies: readonly { readonly x: number; readonly y: number }[];
    readonly coloring?: {
      readonly palette: string;
      readonly chosen: Readonly<Record<string, string>>;
    };
  };
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

/**
 * Keeps a copy of a drawing under a fixed id, adding it the first time:
 * the studio's drawings are played from here, like the learner's own.
 */
export function keepPattern(
  id: string,
  tutorial: Draft,
): UserPattern | undefined {
  return getPattern(id) ? savePattern(id, tutorial) : addAs(id, tutorial);
}

function addAs(id: string, tutorial: Draft): UserPattern | undefined {
  const at = now();
  const pattern: UserPattern = { id, tutorial, created: at, updated: at };
  return patterns.write([pattern, ...listPatterns()]) ? pattern : undefined;
}

export const deletePattern = (id: string): boolean =>
  patterns.write(listPatterns().filter((p) => p.id !== id));

/**
 * A pattern as the player plays it, at the address `mine/<id>`: the whole
 * tutorial file, or why it cannot be played yet. Undefined when there is
 * no such pattern in this browser.
 */
export function playable(
  id: string,
):
  | { readonly entry: { readonly id: string; readonly json: unknown } }
  | { readonly reason: string }
  | undefined {
  const pattern = getPattern(id);
  if (!pattern) return undefined;
  const made = tutorialOf(pattern.tutorial);
  return 'tutorial' in made
    ? { entry: { id: `mine/${id}`, json: made.tutorial } }
    : { reason: made.reason };
}

/**
 * A title no other pattern here has: the one asked for, or numbered
 * (“My pattern 2”), so two patterns on the shelf can be told apart.
 */
export function freeTitle(wanted: string): string {
  const taken = new Set(listPatterns().map((p) => p.tutorial.title));
  if (!taken.has(wanted)) return wanted;
  for (let n = 2; ; n++)
    if (!taken.has(`${wanted} ${n}`)) return `${wanted} ${n}`;
}

/** Keeps a hand-laid wall with a pattern; false when refused. */
export function setPatternWall(
  id: string,
  wall: NonNullable<UserPattern['wall']>,
): boolean {
  const all = listPatterns();
  if (!all.some((p) => p.id === id)) return false;
  return patterns.write(all.map((p) => (p.id === id ? { ...p, wall } : p)));
}
