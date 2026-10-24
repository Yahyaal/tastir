import {
  SquareBandsShape,
  ColoringShape,
  JaliAppearanceShape,
  PenLookShape,
  type JaliAppearance,
  type PenLook,
} from '@tastir/schema';
import type { Coloring } from './coloring';
import { newId, now, store } from './storage';
import type { WallStyle } from './Wall';
import { WALL_STYLES } from './Wall';

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
  readonly jali?: JaliAppearance;
  /** How the lines style draws: pen, wash and ink. */
  readonly pen?: PenLook;
  /** When it was first saved and last changed, as ISO dates. */
  readonly created: string;
  readonly updated: string;
}

/** What the player knows of a design before it is saved. */
export type DesignFields = Omit<Design, 'id' | 'created' | 'updated'>;

const KEY = 'tastir.designs';
const LOOKS: readonly string[] = WALL_STYLES;

const isStrings = (x: unknown): x is string[] =>
  Array.isArray(x) && x.every((s) => typeof s === 'string');

/** Whether a stored entry is a whole design; anything else is dropped. */
export function isDesign(x: unknown): x is Design {
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
    (c['squareBands'] === undefined ||
      SquareBandsShape.safeParse(c['squareBands']).success) &&
    typeof c['palette'] === 'string' &&
    typeof c['chosen'] === 'object' &&
    c['chosen'] !== null &&
    Object.values(c['chosen']).every((v) => typeof v === 'string') &&
    (c['method'] === undefined ||
      ['rings', 'shape', 'place'].includes(c['method'] as string)) &&
    (c['rosettes'] === undefined ||
      (Number.isInteger(c['rosettes']) && (c['rosettes'] as number) >= 1)) &&
    (c['finish'] === undefined ||
      ColoringShape.shape.finish.safeParse(c['finish']).success) &&
    LOOKS.includes(d['look'] as string) &&
    typeof d['grout'] === 'number' &&
    (d['jali'] === undefined ||
      JaliAppearanceShape.safeParse(d['jali']).success) &&
    (d['pen'] === undefined || PenLookShape.safeParse(d['pen']).success) &&
    typeof d['created'] === 'string' &&
    typeof d['updated'] === 'string'
  );
}

const designs = store(KEY, isDesign);

/**
 * Every saved design, the latest changed first. Storage can be missing or
 * blocked (a private window) and a store can be corrupt; both read as none.
 */
export const listDesigns = (): Design[] =>
  designs
    .list()
    .map((design) =>
      design.jali
        ? { ...design, jali: JaliAppearanceShape.parse(design.jali) }
        : design,
    )
    .sort((a, b) => b.updated.localeCompare(a.updated));

export const getDesign = (id: string): Design | undefined =>
  listDesigns().find((d) => d.id === id);

const write = designs.write;

/** Where a store that could not be read is kept before it is replaced. */
export const BACKUP = designs.backup;

/** Whether a store that could not be read has been kept aside. */
export const unreadableKept = designs.unreadableKept;

/** Whether some saved designs cannot be read (they are kept aside on the
 * next save). */
export const unreadableNow = designs.unreadableNow;

/** The longest name a design can have, so it fits on its card. */
export const NAME_LIMIT = 60;
const named = <T extends { name?: string }>(fields: T): T =>
  fields.name === undefined
    ? fields
    : { ...fields, name: fields.name.trim().slice(0, NAME_LIMIT) };

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
