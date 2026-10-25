import fixtures from 'virtual:tastir-fixtures';
import catalog from '../generated/catalog';
import hidden from './hidden.json';
import variations from './variations.json';

/** Library metadata and previews are prepared at build time; geometry loads on demand. */
export interface Preview {
  readonly title: string;
  /** A shorter name for the card, and the line under it (tutorial.short,
   * tutorial.subtitle). */
  readonly short?: string;
  readonly subtitle?: string;
  readonly style: string;
  readonly level: string;
  readonly fold: number;
  readonly steps: number;
  readonly photos: boolean;
  readonly verification?: import('@tastir/schema').Tutorial['verification'];
  readonly thumbnail: string;
}
export interface Entry {
  readonly id: string;
  /** Raw data for user patterns/tests, or an async loader for library tutorials. */
  readonly json: unknown;
  readonly preview?: Preview;
  /** The other variations of this pattern the library lists, when the
   * entry stands for its family (`grouped`). */
  readonly variations?: readonly Entry[];
}
const loaders = import.meta.glob<unknown>('../../../../tutorials/*.json', {
  import: 'default',
});
export function entriesOf(files: Record<string, unknown>): Entry[] {
  return Object.entries(files)
    .map(([path, json]) => ({
      id: path.replace(/^.*\//, '').replace(/\.json$/, ''),
      json,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
}
/**
 * Patterns the owner keeps out of the library while deciding whether they
 * need more work or should go (`hidden.json`, written by the Hide button
 * on the dev server). They still open from a direct link, so saved designs
 * and share links keep working.
 */
export const isHidden = (id: string): boolean =>
  (hidden as readonly string[]).includes(id);

/**
 * The patterns the library, its menus and next/previous show: all of them
 * on the dev server (hidden ones carry a badge), else the ones not hidden.
 */
export const listed = (
  entries: readonly Entry[],
  showHidden: boolean = import.meta.env.DEV,
): readonly Entry[] =>
  showHidden ? entries : entries.filter((e) => !isHidden(e.id));

/**
 * Tutorials that are variations of one design (the same pattern on another
 * tile, shifted or filled) form a family in `variations.json`, its main
 * tutorial first. The library shows a family as one card, and the player
 * switches between its members. A tutorial in no family stands alone.
 */
export interface Family {
  readonly id: string;
  readonly title: string;
  readonly members: readonly string[];
}
export const FAMILIES: readonly Family[] = variations;

export const familyOf = (id: string): Family | undefined =>
  FAMILIES.find((f) => f.members.includes(id));

/** Whether this entry is the tutorial `id` or stands for its family. */
export const holds = (entry: Entry, id: string): boolean =>
  entry.id === id || !!entry.variations?.some((v) => v.id === id);

/**
 * The entries with each family folded into one: its first member not
 * hidden (the first, when all are), in that member's place, carrying the
 * family's other listed members as `variations`.
 */
export function grouped(entries: readonly Entry[]): readonly Entry[] {
  const byId = new Map(entries.map((e) => [e.id, e]));
  return entries.flatMap((e) => {
    const family = familyOf(e.id);
    if (!family) return [e];
    const members = family.members.flatMap((id) => byId.get(id) ?? []);
    const main = members.find((m) => !isHidden(m.id)) ?? members[0];
    if (main !== e) return [];
    const others = members.filter((m) => m !== e);
    return [others.length ? { ...e, variations: others } : e];
  });
}

/**
 * The family of the tutorial `id` as the player offers it: its members
 * the library lists, and `id` itself even when it is hidden (opened from
 * a link). Empty when it has no other variation.
 */
export function variationsOf(
  id: string,
  entries: readonly Entry[] = LIBRARY,
): readonly Entry[] {
  const family = familyOf(id);
  if (!family) return [];
  const shown = listed(entries);
  const members = family.members.flatMap(
    (m) => (m === id ? entries : shown).find((e) => e.id === m) ?? [],
  );
  return members.length > 1 ? members : [];
}

export const LIBRARY: readonly Entry[] =
  import.meta.env.MODE === 'test'
    ? entriesOf(fixtures)
    : catalog.map(({ id, ...preview }) => ({
        id,
        preview,
        json: loaders[`../../../../tutorials/${id}.json`],
      }));
