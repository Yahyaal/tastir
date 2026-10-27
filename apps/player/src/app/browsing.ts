import { holds, type Entry } from './library';

/** The library's filters: words to look for, a tradition, a level and a
 * fold, each optional. */
export interface LibraryFilters {
  readonly query?: string;
  readonly style?: string;
  readonly level?: string;
  readonly fold?: number;
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
  const { query, style, level, fold } = read();
  return {
    ...(typeof query === 'string' && query ? { query } : {}),
    ...(typeof style === 'string' ? { style } : {}),
    ...(typeof level === 'string' ? { level } : {}),
    ...(typeof fold === 'number' ? { fold } : {}),
  };
}

/** Keeps the filters; an undefined filter is dropped (JSON leaves it out). */
export function keepFilters({ query, style, level, fold }: LibraryFilters) {
  write({ query: query || undefined, style, level, fold });
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
  style?: string;
  level?: string;
  fold?: number;
} {
  const t = (json ?? {}) as {
    style?: unknown;
    level?: unknown;
    fold?: unknown;
    star?: unknown;
  };
  return {
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

/** The entries the library shows under these filters, in its order. A
 * family's card is shown when any of its variations matches. */
export function filtered(
  entries: readonly Entry[],
  { query, style, level, fold }: LibraryFilters,
): readonly Entry[] {
  const words = plain(query ?? '')
    .split(/\s+/)
    .filter(Boolean);
  const matches = (e: Entry) => {
    const about = aboutOf(e.preview ?? e.json);
    const text = words.length ? searchText(e) : '';
    return (
      words.every((w) => text.includes(w)) &&
      (!style || about.style === style) &&
      (!level || about.level === level) &&
      (!fold || about.fold === fold)
    );
  };
  return entries.filter((e) => [e, ...(e.variations ?? [])].some(matches));
}

/** Lower case without accents, so “fes” finds “Fès” and “salon” “Salón”. */
const plain = (text: string) =>
  text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

/** What a search looks through: the names, the line under them and the
 * tradition. */
function searchText(entry: Entry): string {
  const json = (entry.json ?? {}) as Record<string, unknown>;
  const p = entry.preview;
  const words = [
    p?.title ?? json['title'],
    p?.short ?? json['short'],
    p?.subtitle ?? json['subtitle'],
    p?.style ?? json['style'],
    entry.id.replace(/-/g, ' '),
  ].filter((w): w is string => typeof w === 'string');
  return plain(words.join(' '));
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
