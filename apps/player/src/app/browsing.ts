import { holds, type Entry } from './library';
import { readQuery, scoreOf } from './search';

/** How the library orders the cards. */
export type SortOrder = 'default' | 'easiest' | 'shortest' | 'title';

/** The library's filters: words to look for, a region, a tradition, a
 * level and a fold, each optional. */
export interface LibraryFilters {
  readonly query?: string;
  readonly region?: string;
  readonly style?: string;
  readonly level?: string;
  readonly fold?: number;
  readonly withPhoto?: boolean;
  readonly sort?: SortOrder;
}

/**
 * What the library remembers for this tab: its filters and how far down
 * the page the learner was, so coming back (Back, or "All patterns")
 * returns to the same cards. Session storage can be missing or blocked,
 * so every read and write may fail quietly; the library then starts at
 * the top with no filters.
 */
const KEY = 'tastir.library';

interface Kept extends LibraryFilters {
  readonly scroll?: number;
  /** The first card in sight (its address) and its height on the screen. */
  readonly anchor?: string;
  readonly offset?: number;
}

function read(): Kept {
  try {
    const parsed: unknown = JSON.parse(
      window.sessionStorage.getItem(KEY) ?? '{}',
    );
    return parsed && typeof parsed === 'object' ? (parsed as Kept) : {};
  } catch {
    return {};
  }
}

function write(change: Kept) {
  try {
    window.sessionStorage.setItem(
      KEY,
      JSON.stringify({ ...read(), ...change }),
    );
  } catch {
    // Not remembered; the library still works.
  }
}

export function keptFilters(): LibraryFilters {
  const { query, region, style, level, fold, withPhoto, sort } = read();
  return {
    ...(typeof query === 'string' && query ? { query } : {}),
    ...(typeof region === 'string' ? { region } : {}),
    ...(typeof style === 'string' ? { style } : {}),
    ...(typeof level === 'string' ? { level } : {}),
    ...(typeof fold === 'number' ? { fold } : {}),
    ...(withPhoto === true ? { withPhoto: true } : {}),
    ...(sort === 'easiest' || sort === 'shortest' || sort === 'title'
      ? { sort }
      : {}),
  };
}

/** Keeps the filters; an undefined filter is dropped (JSON leaves it out). */
export function keepFilters({
  query,
  region,
  style,
  level,
  fold,
  withPhoto,
  sort,
}: LibraryFilters) {
  write({
    query: query || undefined,
    region,
    style,
    level,
    fold,
    withPhoto: withPhoto ? true : undefined,
    sort: sort && sort !== 'default' ? sort : undefined,
  });
}

/** Where the learner was in the library, if anywhere. */
export interface Place {
  readonly scroll: number;
  readonly anchor?: string;
  readonly offset?: number;
}

export function keptPlace(): Place | undefined {
  const { scroll, anchor, offset } = read();
  if (typeof scroll !== 'number' || scroll <= 0) return undefined;
  return {
    scroll,
    ...(typeof anchor === 'string' && typeof offset === 'number'
      ? { anchor, offset }
      : {}),
  };
}

/**
 * Keeps the library's place as the learner leaves it: the scroll, and the
 * first card in sight with its height on the screen. Parts of the page above
 * the cards can finish loading after the way back, so the card, not the
 * pixel count, says where the learner was.
 */
export function keepPlace() {
  const card = cards().find((c) => c.getBoundingClientRect().bottom > 0);
  write({
    scroll: window.scrollY,
    anchor: card?.getAttribute('href') ?? undefined,
    offset: card?.getBoundingClientRect().top,
  });
}

/** The library card with this address, if it is on the page. */
export function cardAt(anchor: string): HTMLElement | undefined {
  return cards().find((c) => c.getAttribute('href') === anchor);
}

function cards() {
  return [...document.querySelectorAll<HTMLElement>('.cards .card')];
}

/** What the library needs to know about a tutorial before it is loaded. */
export function aboutOf(json: unknown): {
  region?: string;
  style?: string;
  level?: string;
  fold?: number;
} {
  const t = (json ?? {}) as {
    region?: unknown;
    style?: unknown;
    level?: unknown;
    fold?: unknown;
    star?: unknown;
  };
  return {
    ...(typeof t.region === 'string' ? { region: t.region } : {}),
    ...(typeof t.style === 'string' ? { style: t.style } : {}),
    ...(typeof t.level === 'string' ? { level: t.level } : {}),
    // Shown and filtered by the main star, when it has more points than
    // the tile turns.
    ...(typeof t.star === 'number'
      ? { fold: t.star }
      : typeof t.fold === 'number'
        ? { fold: t.fold }
        : {}),
  };
}

const LEVEL_RANK: Record<string, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

function hasPhoto(e: Entry): boolean {
  if (e.preview) return e.preview.photos;
  const photos = (e.json as { photos?: unknown } | undefined)?.photos;
  return Array.isArray(photos) && photos.length > 0;
}

function stepsOf(e: Entry): number {
  if (e.preview) return e.preview.steps;
  const steps = (e.json as { steps?: unknown } | undefined)?.steps;
  return Array.isArray(steps) ? steps.length : Number.MAX_SAFE_INTEGER;
}

/** The entries the library shows under these filters, in its order. A
 * family's card is shown when any of its variations matches. */
export function filtered(
  entries: readonly Entry[],
  { query, region, style, level, fold, withPhoto, sort }: LibraryFilters,
): readonly Entry[] {
  // "16 point" in the search box asks for stars of sixteen points.
  const asked = readQuery(query ?? '');
  const score = (e: Entry) => {
    const about = aboutOf(e.preview ?? e.json);
    if (
      (region && about.region !== region) ||
      (style && about.style !== style) ||
      (level && about.level !== level) ||
      (fold && about.fold !== fold) ||
      (withPhoto && !hasPhoto(e)) ||
      // "16 point" in the search also finds a sixteen-pointed star on a
      // square tile, which the menu files as 4- or 8-fold.
      (asked.fold &&
        about.fold !== asked.fold &&
        !e.preview?.stars?.includes(asked.fold))
    )
      return undefined;
    return scoreOf(e, asked.words);
  };
  // A family shows the face of its best-matching member: under Morocco,
  // the Arrayanes squares family shows its Moroccan tile.
  // A design's places count as members too: under Spain, the star
  // rosettes show their Seville tile.
  const shown = entries.flatMap((e) => {
    const designs = [e, ...(e.variations ?? [])];
    const members = designs.flatMap((d) => [d, ...(d.places ?? [])]);
    let face: Entry | undefined;
    let best = -1;
    for (const m of members) {
      const s = score(m);
      if (s !== undefined && s > best) {
        best = s;
        face = m;
      }
    }
    if (!face) return [];
    if (face === e) return [{ entry: e, best }];
    const design =
      designs.find((d) => d === face || d.places?.includes(face)) ?? e;
    const places = [design, ...(design.places ?? [])].filter((m) => m !== face);
    const variations = designs.filter((d) => d !== design);
    const { variations: _own, places: _places, ...rest } = face;
    return [
      {
        entry: {
          ...rest,
          ...(variations.length ? { variations } : {}),
          ...(face.of || design.places?.length ? { places } : {}),
        },
        best,
      },
    ];
  });
  // With words to look for, the best matches come first unless an explicit
  // sort order was chosen.
  if (sort === 'easiest') {
    shown.sort((a, b) => {
      const la =
        LEVEL_RANK[aboutOf(a.entry.preview ?? a.entry.json).level ?? ''] ?? 9;
      const lb =
        LEVEL_RANK[aboutOf(b.entry.preview ?? b.entry.json).level ?? ''] ?? 9;
      return la - lb || stepsOf(a.entry) - stepsOf(b.entry);
    });
  } else if (sort === 'shortest') {
    shown.sort((a, b) => stepsOf(a.entry) - stepsOf(b.entry));
  } else if (sort === 'title') {
    shown.sort((a, b) => titleOf(a.entry).localeCompare(titleOf(b.entry)));
  } else if (asked.words.length) {
    shown.sort((a, b) => b.best - a.best);
  }
  return shown.map((s) => s.entry);
}

/** The filters the side menu sets, one value each. */
export type Facet =
  | { readonly region: string }
  | { readonly style: string }
  | { readonly level: string }
  | { readonly fold: number };

/**
 * How many cards each value of one filter would show, with the other
 * filters as they are: the counts the side menu prints beside each value.
 */
export function facetCounts<K extends 'region' | 'style' | 'level' | 'fold'>(
  entries: readonly Entry[],
  filters: LibraryFilters,
  key: K,
): Map<NonNullable<LibraryFilters[K]>, number> {
  const { query, region, style, level, fold, withPhoto } = filters;
  const asked = readQuery(query ?? '');
  const counts = new Map<NonNullable<LibraryFilters[K]>, number>();
  // Single pass over every family: each matching member contributes its
  // value for `key`, and a family is counted at most once per value.
  for (const entry of entries) {
    const seen = new Set<NonNullable<LibraryFilters[K]>>();
    const designs = [entry, ...(entry.variations ?? [])];
    for (const design of designs) {
      const members = [design, ...(design.places ?? [])];
      for (const m of members) {
        const about = aboutOf(m.preview ?? m.json);
        const value = about[key];
        if (
          value === undefined ||
          seen.has(value as NonNullable<LibraryFilters[K]>)
        )
          continue;
        if (
          (key !== 'region' && region && about.region !== region) ||
          (key !== 'style' && style && about.style !== style) ||
          (key !== 'level' && level && about.level !== level) ||
          (key !== 'fold' && fold && about.fold !== fold) ||
          (withPhoto && !hasPhoto(m)) ||
          (asked.fold &&
            about.fold !== asked.fold &&
            !m.preview?.stars?.includes(asked.fold))
        )
          continue;
        if (scoreOf(m, asked.words) === undefined) continue;
        seen.add(value as NonNullable<LibraryFilters[K]>);
      }
    }
    for (const value of seen) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

/** A tutorial's title before it is loaded. */
export function titleOf(entry: Entry): string {
  const json = entry.json as { title?: unknown; short?: unknown } | undefined;
  return (
    entry.preview?.short ??
    (typeof json?.short === 'string' ? json.short : undefined) ??
    entry.preview?.title ??
    (typeof json?.title === 'string' ? json.title : entry.id)
  );
}

/**
 * The patterns before and after this one, in the order the library shows
 * them under the learner's filters. A pattern the filters hide (opened from
 * a link) walks the whole library instead. A family is one place in it,
 * whichever variation is open. There is nothing before the first or after
 * the last.
 */
export function neighbours(
  entries: readonly Entry[],
  id: string,
  filters: LibraryFilters,
): { previous?: Entry; next?: Entry } {
  const shown = filtered(entries, filters);
  const list = shown.some((e) => holds(e, id)) ? shown : entries;
  const k = list.findIndex((e) => holds(e, id));
  if (k < 0) return {};
  return {
    ...(list[k - 1] ? { previous: list[k - 1] } : {}),
    ...(list[k + 1] ? { next: list[k + 1] } : {}),
  };
}

/** The library's symmetry label, also used on printed sheets. */
export const foldLabel = (fold: number): string =>
  fold === 1 ? 'Mirror' : `${fold}-fold`;
