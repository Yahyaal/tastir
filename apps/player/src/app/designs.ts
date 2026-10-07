import type { Coloring } from './coloring';
import type { WallStyle } from './Wall';

/**
 * A learner's design: a tutorial with their own inking and colors. It keeps
 * only what they changed, never a copy of the pattern, so it stays small
 * and the tutorial draws it again when it opens.
 */
export interface Design {
  readonly id: string;
  readonly name: string;
  /** The tutorial's id, its address in the library. */
  readonly tutorial: string;
  /** The inked pieces of construction (engine inkPieces ids); none for the
   * tutorial's own inking. */
  readonly inked?: readonly string[];
  readonly coloring: Coloring;
  readonly look: WallStyle;
  readonly grout: number;
  /** When it was first saved and last changed, as ISO dates. */
  readonly created: string;
  readonly updated: string;
}

/** What the player knows of a design before it is saved. */
export type DesignFields = Omit<Design, 'id' | 'created' | 'updated'>;

const KEY = 'tastir.designs';
const LOOKS: readonly string[] = ['tiles', 'strapwork', 'lines'];

const isStrings = (x: unknown): x is string[] =>
  Array.isArray(x) && x.every((s) => typeof s === 'string');

/** Whether a stored entry is a whole design; anything else is dropped. */
function isDesign(x: unknown): x is Design {
  if (typeof x !== 'object' || x === null) return false;
  const d = x as Record<string, unknown>;
  const c = d['coloring'] as Record<string, unknown> | null | undefined;
  return (
    typeof d['id'] === 'string' &&
    typeof d['name'] === 'string' &&
    typeof d['tutorial'] === 'string' &&
    (d['inked'] === undefined || isStrings(d['inked'])) &&
    typeof c === 'object' &&
    c !== null &&
    typeof c['palette'] === 'string' &&
    typeof c['chosen'] === 'object' &&
    c['chosen'] !== null &&
    Object.values(c['chosen']).every((v) => typeof v === 'string') &&
    LOOKS.includes(d['look'] as string) &&
    typeof d['grout'] === 'number' &&
    typeof d['created'] === 'string' &&
    typeof d['updated'] === 'string'
  );
}

/**
 * Every saved design, the latest changed first. Storage can be missing or
 * blocked (a private window) and a store can be corrupt; both read as none.
 */
export function listDesigns(): Design[] {
  try {
    const saved: unknown = JSON.parse(window.localStorage.getItem(KEY) ?? '[]');
    if (!Array.isArray(saved)) return [];
    return saved
      .filter(isDesign)
      .sort((a, b) => b.updated.localeCompare(a.updated));
  } catch {
    return [];
  }
}

export const getDesign = (id: string): Design | undefined =>
  listDesigns().find((d) => d.id === id);

/** Where a store that could not be read is kept before it is replaced. */
export const BACKUP = `${KEY}.unreadable`;

/**
 * Whether the stored value holds anything this version cannot read: not
 * JSON, not a list, or a list with entries that are not designs.
 */
function unreadable(raw: string): boolean {
  try {
    const saved: unknown = JSON.parse(raw);
    return !Array.isArray(saved) || !saved.every(isDesign);
  } catch {
    return true;
  }
}

/**
 * Writes the designs; false when the browser refused to keep them. A store
 * that could not be read (corrupt, or from a later version) is never
 * simply overwritten: it is first copied under its own backup key, and if
 * even that is refused nothing is written.
 */
function write(designs: readonly Design[]): boolean {
  try {
    const storage = window.localStorage;
    const raw = storage.getItem(KEY);
    if (raw !== null && unreadable(raw)) {
      let key = BACKUP;
      for (let n = 2; storage.getItem(key) !== null; n++)
        key = `${BACKUP}.${n}`;
      storage.setItem(key, raw);
    }
    storage.setItem(KEY, JSON.stringify(designs));
    return true;
  } catch {
    return false;
  }
}

/** Whether a store that could not be read has been kept aside. */
export function unreadableKept(): boolean {
  try {
    return window.localStorage.getItem(BACKUP) !== null;
  } catch {
    return false;
  }
}

/** The longest name a design can have, so it fits on its card. */
export const NAME_LIMIT = 60;
const named = <T extends { name?: string }>(fields: T): T =>
  fields.name === undefined
    ? fields
    : { ...fields, name: fields.name.trim().slice(0, NAME_LIMIT) };

const now = () => new Date().toISOString();
const newId = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

/**
 * Keeps a new design and returns it, or undefined when the browser would
 * not keep it.
 */
export function addDesign(fields: DesignFields): Design | undefined {
  const at = now();
  const design: Design = {
    ...named(fields),
    id: newId(),
    created: at,
    updated: at,
  };
  return write([design, ...listDesigns()]) ? design : undefined;
}

/**
 * Changes a saved design (its inking, colors, look or name) and returns
 * it, or undefined when it is gone or the browser would not keep it.
 */
export function updateDesign(
  id: string,
  changes: Partial<DesignFields>,
): Design | undefined {
  const all = listDesigns();
  const before = all.find((d) => d.id === id);
  if (!before) return undefined;
  // inked: undefined (back to the tutorial's own inking) is not written,
  // as JSON leaves undefined out.
  const after: Design = { ...before, ...named(changes), id, updated: now() };
  return write(all.map((d) => (d.id === id ? after : d))) ? after : undefined;
}

export const renameDesign = (id: string, name: string) =>
  updateDesign(id, { name });

/** Forgets a design; false when the browser would not let go of it. */
export function deleteDesign(id: string): boolean {
  return write(listDesigns().filter((d) => d.id !== id));
}
