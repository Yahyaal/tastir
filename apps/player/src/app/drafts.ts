import { isDesign, type Design, type DesignFields } from './designs';

/** What a draft keeps: a design's fields, without a name yet. */
export type Draft = Omit<DesignFields, 'name'>;

/**
 * A design not yet saved under a name: the learner's ink, colours and wall
 * for one pattern, kept in this browser from their first change, so leaving
 * or reloading loses nothing. Saving it as a design, or going back to the
 * pattern's own colours, forgets it. Storage can be missing or blocked (a
 * private window); then keeping it reports false and nothing is thrown.
 */

const key = (address: string) => `tastir.draft.${address}`;

/** The draft kept for a pattern, if any and readable. */
export function draftOf(address: string): Draft | undefined {
  try {
    const saved: unknown = JSON.parse(
      window.localStorage.getItem(key(address)) ?? 'null',
    );
    if (!isDesign(saved) || saved.tutorial !== address) return undefined;
    const { id: _id, name: _n, created: _c, updated: _u, ...fields } = saved;
    return fields;
  } catch {
    return undefined;
  }
}

/** Keeps the draft; false when the browser would not keep it. */
export function keepDraft(fields: Draft): boolean {
  const at = new Date().toISOString();
  const draft: Design = {
    ...fields,
    id: 'draft',
    name: 'Draft',
    created: at,
    updated: at,
  };
  try {
    window.localStorage.setItem(key(fields.tutorial), JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

/** Forgets the draft (saved as a design, or back to the pattern's own). */
export function forgetDraft(address: string): void {
  try {
    window.localStorage.removeItem(key(address));
  } catch {
    // Nothing kept, nothing to forget.
  }
}
