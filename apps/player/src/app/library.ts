import { atPlace, parseTutorial } from '@tastir/schema';
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
  /** Where the pattern is from (tutorial.region). */
  readonly region?: string;
  readonly level: string;
  /** Words a search finds it by beyond its names: sources and pieces. */
  readonly words?: string;
  /** The points of the stars among its pieces, for a search by points. */
  readonly stars?: readonly number[];
  readonly fold: number;
  readonly steps: number;
  readonly photos: boolean;
  readonly verification?: import('@tastir/schema').Tutorial['verification'];
  readonly thumbnail: string;
  /** The tutorial this is another place of. */
  readonly of?: string;
}
export interface Entry {
  readonly id: string;
  /** Raw data for user patterns/tests, or an async loader for library tutorials. */
  readonly json: unknown;
  readonly preview?: Preview;
  /** The tutorial this entry is another place of: the same design, found
   * in another building, with its own name and colours. */
  readonly of?: string;
  /** The places of this design the library card stands for, when it is
   * the tutorial they are places of (`grouped`). */
  readonly places?: readonly Entry[];
  /** The other variations of this pattern the library lists, when the
   * entry stands for its family (`grouped`). */
  readonly variations?: readonly Entry[];
}
const loaders = import.meta.glob<unknown>('../../../../tutorials/*.json', {
  import: 'default',
});
export function entriesOf(files: Record<string, unknown>): Entry[] {
  return Object.entries(files)
    .flatMap(([path, json]): Entry[] => {
      const id = path.replace(/^.*\//, '').replace(/\.json$/, '');
      const places = (json as { places?: { id: string }[] }).places ?? [];
      if (!places.length) return [{ id, json }];
      const tutorial = parseTutorial(json);
      return [
        { id, json },
        ...places.map((p) => ({
          id: p.id,
          of: id,
          json: atPlace(tutorial, p.id),
        })),
      ];
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

/** The tutorial a place belongs to, or the id itself. */
export const baseOf = (
  id: string,
  entries: readonly Entry[] = LIBRARY,
): string => entries.find((e) => e.id === id)?.of ?? id;

/**
 * The places of the design `id` is one of, the tutorial first, as the
 * player offers them. Empty when the design is found in one place only.
 */
export function placesOf(
  id: string,
  entries: readonly Entry[] = LIBRARY,
): readonly Entry[] {
  const base = baseOf(id, entries);
  const members = entries.filter((e) => e.id === base || e.of === base);
  return members.length > 1 ? members : [];
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
  /** What each member does with the design, in a sentence, for designs
   * that share their pieces but arrange them differently. */
  readonly notes?: Readonly<Record<string, string>>;
}
// TypeScript merges the JSON's notes into one object type whose other
// families' keys are optional `undefined`, so the shape is asserted here
// and checked by variations.spec.ts instead.
export const FAMILIES = variations as readonly Family[];

export const familyOf = (id: string): Family | undefined =>
  FAMILIES.find((f) => f.members.includes(baseOf(id)));

/** Whether this entry is the tutorial `id` or stands for its family. */
export const holds = (entry: Entry, id: string): boolean =>
  entry.id === id ||
  !!entry.places?.some((p) => p.id === id) ||
  !!entry.variations?.some((v) => holds(v, id));

/**
 * The entries with each family folded into one: its first member not
 * hidden (the first, when all are), in that member's place, carrying the
 * family's other listed members as `variations`.
 */
export function grouped(all: readonly Entry[]): readonly Entry[] {
  // A design's places fold into its tutorial's entry first.
  const entries = all.flatMap((e) => {
    if (e.of) return [];
    const places = all.filter((p) => p.of === e.id);
    return [places.length ? { ...e, places } : e];
  });
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
  const base = baseOf(id, entries);
  const shown = listed(entries);
  const members = family.members.flatMap(
    (m) => (m === base ? entries : shown).find((e) => e.id === m) ?? [],
  );
  return members.length > 1 ? members : [];
}

export const LIBRARY: readonly Entry[] =
  import.meta.env.MODE === 'test'
    ? entriesOf(fixtures)
    : catalog.map(({ id, ...preview }): Entry => {
        const of = 'of' in preview ? preview.of : undefined;
        const load = loaders[`../../../../tutorials/${of ?? id}.json`];
        return {
          id,
          preview,
          ...(of ? { of } : {}),
          json:
            of && load
              ? async () => atPlace(parseTutorial(await load()), id)
              : load,
        };
      });
