import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { listPatterns } from '../editor/patterns';
import { NewPattern } from '../editor/PatternShelf';
import { HOSTED } from '../studio/client';
import {
  cardAt,
  facetCounts,
  filtered,
  foldLabel,
  keepFilters,
  keptFilters,
  keptPlace,
  type LibraryFilters,
  type SortOrder,
} from './browsing';
import { listDesigns, unreadableKept, unreadableNow } from './designs';
import { Thumbnail } from './drawing';
import { PROGRESS_TEXT, useModel } from './workerClient';
import { isHidden, grouped, type Entry, type Preview } from './library';
import { BOOKS, PLACES, placeHref } from './places';
import { Route } from './Route';
import { StartHere } from './StartHere';
import { ThemeSwitch } from './theme';
import { FoldStar, LevelDots, Window, WindowDefs } from './Window';
import { workInProgress } from './YourWork';
import './libraryPage.css';

/*
 * The library (REDESIGN.3, docs/REDESIGN-PLAN-2026-11-22.md): a one-line
 * top bar with search, the route from Córdoba to Agra that chooses a place,
 * one row of filters, Start here, then every pattern as a window shaped like
 * its tradition's arch. The place lives in the address (#/places/<place>),
 * so it can be shared and Back returns to all patterns; the other filters
 * are remembered for the tab, as before.
 */

const capital = (s: string) => (s ? s[0]?.toUpperCase() + s.slice(1) : s);

const SORT_OPTIONS: readonly { value: SortOrder; label: string }[] = [
  { value: 'default', label: 'Featured' },
  { value: 'easiest', label: 'Easiest first' },
  { value: 'shortest', label: 'Shortest first' },
  { value: 'title', label: 'A to Z' },
];
const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;

/** What a card shows of a tutorial: its prepared preview, or (for a
 * tutorial given as data, in tests and user files) the same read from it. */
function previewOf(entry: Entry): Preview {
  if (entry.preview) return entry.preview;
  const t = (entry.json ?? {}) as Partial<{
    title: string;
    short: string;
    style: string;
    region: string;
    level: string;
    fold: number;
    star: number;
    steps: unknown[];
    verification: Preview['verification'];
  }>;
  return {
    title: t.title ?? entry.id,
    ...(t.short ? { short: t.short } : {}),
    style: t.style ?? '',
    ...(t.region ? { region: t.region } : {}),
    level: t.level ?? 'beginner',
    fold: t.star ?? t.fold ?? 0,
    steps: Array.isArray(t.steps) ? t.steps.length : 0,
    photos: false,
    ...(t.verification ? { verification: t.verification } : {}),
    thumbnail: '',
  };
}

/** A tutorial given as data: drawn by the engine in its window, or the
 * reason it cannot be played. */
function LiveWindow({
  entry,
  ...props
}: Parameters<typeof Window>[0] & { entry: Entry }) {
  const { model, error, progress } = useModel(entry.json);
  return (
    <Window
      {...props}
      picture={
        model ? (
          <Thumbnail model={model} />
        ) : (
          <p className={error ? 'window-error' : 'window-waiting'}>
            {error
              ? `Cannot be played: ${error}`
              : PROGRESS_TEXT[progress ?? 'checking']}
          </p>
        )
      }
    />
  );
}

/** An n-pointed star: the sign for a fold. */

/** Every tutorial, with a picture of the finished pattern: one card for
 * each family of variations. */
export function Library({
  entries,
  startAtCollection = false,
  place,
}: {
  entries: readonly Entry[];
  startAtCollection?: boolean;
  /** The place the address names (#/places/<place>); none shows all. */
  place?: string;
}) {
  const families = useMemo(() => grouped(entries), [entries]);
  const region = place;
  const [style, setStyle] = useState(() => keptFilters().style);
  const [level, setLevel] = useState(() => keptFilters().level);
  const [fold, setFold] = useState(() => keptFilters().fold);
  const [withPhoto, setWithPhoto] = useState(
    () => keptFilters().withPhoto ?? false,
  );
  const [sort, setSort] = useState<SortOrder>(
    () => keptFilters().sort ?? 'default',
  );
  const [query, setQuery] = useState(() => keptFilters().query ?? '');
  // The place is kept too, so next and previous in a pattern follow it.
  useEffect(
    () =>
      keepFilters({
        query,
        region,
        style,
        level,
        fold,
        withPhoto: withPhoto || undefined,
        sort: sort === 'default' ? undefined : sort,
      }),
    [query, region, style, level, fold, withPhoto, sort],
  );
  useReturnToScroll(startAtCollection);
  const [designs] = useState(listDesigns);
  const [patterns] = useState(listPatterns);
  const [inProgress] = useState(() => workInProgress(entries));
  const designNote = unreadableKept() || unreadableNow();
  const workCount = inProgress.length + designs.length + patterns.length;
  const filters: LibraryFilters = useMemo(
    () => ({
      query,
      region,
      style,
      level,
      fold,
      withPhoto: withPhoto || undefined,
      sort: sort === 'default' ? undefined : sort,
    }),
    [query, region, style, level, fold, withPhoto, sort],
  );
  const shown = useMemo(() => filtered(families, filters), [families, filters]);
  // The counts each choice would show under the other filters.
  const regionCounts = useMemo(
    () =>
      facetCounts(families, { ...filters, region: undefined }, 'region') as Map<
        string,
        number
      >,
    [families, filters],
  );
  const foldCounts = useMemo(
    () => facetCounts(families, { ...filters, fold: undefined }, 'fold'),
    [families, filters],
  );
  const levelCounts = useMemo(
    () => facetCounts(families, { ...filters, level: undefined }, 'level'),
    [families, filters],
  );
  const styleCounts = useMemo(
    () =>
      facetCounts(families, { ...filters, style: undefined }, 'style') as Map<
        string,
        number
      >,
    [families, filters],
  );
  // Every fold of the library, in order, whatever the filters.
  const folds = useMemo(
    () => [...facetCounts(families, {}, 'fold').keys()].sort((a, b) => a - b),
    [families],
  );
  const chosen = PLACES.find((p) => p.key === region);
  const any = Boolean(
    query.trim() || region || style || level || fold || withPhoto,
  );
  const clear = () => {
    setQuery('');
    setStyle(undefined);
    setLevel(undefined);
    setFold(undefined);
    setWithPhoto(false);
    if (region) window.location.hash = placeHref();
  };
  // The filters chosen, in words: “8-fold, for beginners and Nasrid”.
  const chosenWords = andList(
    [
      query.trim() ? `called “${query.trim()}”` : '',
      fold ? foldLabel(fold) : '',
      level
        ? `for ${level === 'beginner' ? 'beginners' : `the ${level} level`}`
        : '',
      style ? `from the ${style} tradition` : '',
      chosen ? `from ${chosen.short}` : '',
      withPhoto ? 'with a real-wall photo' : '',
    ].filter(Boolean),
  );
  // Under a chosen place, its traditions; else only a chosen one, to undo.
  const traditions = chosen
    ? [...styleCounts.entries()]
        .filter(([, n]) => n > 0)
        .sort((a, b) => b[1] - a[1])
    : style
      ? [[style, styleCounts.get(style) ?? 0] as [string, number]]
      : [];
  const books = region === BOOKS.key;
  const foldChip = (f: number) => {
    const n = foldCounts.get(f) ?? 0;
    const on = fold === f;
    return (
      <button
        key={f}
        type="button"
        className={f > 2 ? 'lib-chip lib-star' : 'lib-chip'}
        aria-pressed={on}
        aria-label={`${foldLabel(f)}, ${n} ${n === 1 ? 'pattern' : 'patterns'}`}
        title={foldLabel(f)}
        disabled={!on && n === 0}
        onClick={() => setFold(on ? undefined : f)}
      >
        {f > 2 ? <FoldStar n={f} size={18} /> : null}
        {f === 1 ? 'Mirror, no star' : f === 2 ? 'Two-fold' : f}
      </button>
    );
  };
  return (
    <div className="library lib-page">
      <WindowDefs />
      <header className="lib-top">
        <a className="lib-logo" href="#/" aria-label="Tastir, all patterns">
          <h1>
            Tastir{' '}
            <span lang="ar" dir="rtl" aria-hidden="true">
              تسطير
            </span>
          </h1>
        </a>
        <nav className="lib-nav" aria-label="Sections">
          <a href="#/" aria-current="page">
            Library
          </a>
          <a href="#/learn">Learn</a>
          {HOSTED ? <a href="#/studio">Studio</a> : null}
          {workCount || designNote || HOSTED ? (
            <a
              href="#/work"
              aria-label={
                HOSTED || workCount === 0
                  ? 'Your work'
                  : `Your work (${workCount})`
              }
            >
              Your work
              {HOSTED || workCount === 0 ? null : <small> ({workCount})</small>}
            </a>
          ) : null}
        </nav>
        <label className="lib-search">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <line x1="16.5" y1="16.5" x2="21" y2="21" />
          </svg>
          <span className="visually-hidden">Search patterns</span>
          <input
            type="search"
            dir="auto"
            placeholder="Search: a place, a source, “16 point”…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="lib-actions">
          <NewPattern />
          <ThemeSwitch />
        </div>
      </header>
      <Route place={chosen?.key} counts={regionCounts} />
      <main className="lib-main">
        <div className="lib-filters" role="toolbar" aria-label="Filters">
          <span className="lib-flabel" aria-hidden="true">
            Star
          </span>
          {folds.filter((f) => f > 2).map((f) => foldChip(f))}
          {folds.some((f) => f <= 2) ? (
            <details
              className="lib-other"
              open={fold !== undefined && fold <= 2 ? true : undefined}
            >
              <summary className="lib-chip">Other</summary>
              <div className="lib-other-menu">
                {folds.filter((f) => f <= 2).map((f) => foldChip(f))}
              </div>
            </details>
          ) : null}
          <span className="lib-sep" aria-hidden="true" />
          <span className="lib-flabel" aria-hidden="true">
            Level
          </span>
          {LEVELS.map((l) => {
            const n = levelCounts.get(l) ?? 0;
            const on = level === l;
            return (
              <button
                key={l}
                type="button"
                className={`lib-chip lib-level level-${l}`}
                aria-pressed={on}
                aria-label={`${capital(l)}, ${n} ${n === 1 ? 'pattern' : 'patterns'}`}
                disabled={!on && n === 0}
                onClick={() => setLevel(on ? undefined : l)}
              >
                <LevelDots level={l} />
                {capital(l)}
              </button>
            );
          })}
          <span className="lib-sep" aria-hidden="true" />
          <button
            type="button"
            className="lib-chip lib-photo"
            aria-pressed={withPhoto}
            onClick={() => setWithPhoto((was) => !was)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 8h3l2-3h6l2 3h3v11H4zM12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
            </svg>
            With photo
          </button>
        </div>
        {any ? null : <StartHere entries={entries} inProgress={inProgress} />}
        <section className="lib-patterns" aria-labelledby="collection">
          <div className="lib-head">
            <h2 id="collection" tabIndex={-1}>
              {chosen ? chosen.short : 'All patterns'}
              {chosen ? (
                <span className="lib-arabic" lang="ar" dir="rtl">
                  {chosen.arabic}
                </span>
              ) : null}
            </h2>
            <p className="lib-count">
              {chosen ? `${chosen.about} ` : ''}
              <b>
                {shown.length === families.length
                  ? `${families.length} patterns`
                  : `${shown.length} of ${families.length} patterns`}
              </b>
              {any ? (
                <button type="button" className="lib-clear" onClick={clear}>
                  Clear filters
                </button>
              ) : null}
            </p>
            <a
              className="lib-books"
              href={placeHref(books ? undefined : BOOKS.key)}
              aria-current={books ? 'page' : undefined}
            >
              {books ? 'Back to all places' : 'Pattern books'}{' '}
              <small>{regionCounts.get(BOOKS.key) ?? 0}</small>
            </a>
            <label className="lib-sort">
              <span className="visually-hidden">Sort patterns</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOrder)}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {traditions.length ? (
            <div
              className="lib-traditions"
              role="group"
              aria-label="Traditions"
            >
              {traditions.map(([s, n]) => (
                <button
                  key={s}
                  type="button"
                  className="lib-chip"
                  aria-pressed={style === s}
                  aria-label={`${s}, ${n} ${n === 1 ? 'pattern' : 'patterns'}`}
                  onClick={() => setStyle(style === s ? undefined : s)}
                >
                  {s} <small>{n}</small>
                </button>
              ))}
            </div>
          ) : null}
          {shown.length ? (
            <ul className="library-grid">
              {shown.map((entry) => {
                const preview = previewOf(entry);
                const props = {
                  id: entry.id,
                  preview,
                  designs:
                    1 +
                    (entry.variations?.length ?? 0) +
                    (entry.places?.length ?? 0),
                  place: chosen
                    ? undefined
                    : PLACES.find((p) => p.key === preview.region)?.short,
                  hidden: isHidden(entry.id),
                };
                return entry.preview ? (
                  <Window key={entry.id} {...props} />
                ) : (
                  <LiveWindow key={entry.id} entry={entry} {...props} />
                );
              })}
            </ul>
          ) : (
            <p className="lib-empty">
              No pattern is {chosenWords}.{' '}
              <button type="button" className="lib-clear" onClick={clear}>
                Clear filters
              </button>
            </p>
          )}
        </section>
        <footer className="site-footer">
          <p>
            Tastir draws every point from crossings of earlier circles and
            lines, as with a real compass and ruler. Sources and photographers
            are named with each pattern.
          </p>
          <p>
            <a className="upcoming-link" href="#/upcoming">
              Patterns we are working on →
            </a>
          </p>
          {import.meta.env.DEV ? (
            <div className="dev-links" aria-label="Developer quick links">
              <span className="dev-tag">Dev</span>
              <a
                href="#/review"
                className="dev-link"
                title="Progress, decisions and questions"
              >
                <strong>Review page</strong>
              </a>
              <span className="dev-sep">/</span>
              <a
                href="#/notes"
                className="dev-link"
                title="Goal, queue, status and lessons"
              >
                <strong>Project notes</strong>
              </a>
            </div>
          ) : null}
        </footer>
      </main>
    </div>
  );
}

/**
 * Coming back to the library puts the page where the learner left it (the
 * router keeps the place on the way out): the same card at the same height
 * on the screen. Parts of the page may still be filling in, so it corrects
 * each frame for a moment, and stops as soon as the learner scrolls or
 * types themselves.
 */
function useReturnToScroll(startAtCollection: boolean) {
  useLayoutEffect(() => {
    const place = keptPlace();
    if (!place && startAtCollection) {
      const target = document.getElementById('collection');
      target?.scrollIntoView?.({ block: 'start' });
      target?.focus({ preventScroll: true });
      return;
    }
    if (!place || typeof window.scrollTo !== 'function') return;
    const until = performance.now() + 1500;
    let frame = 0;
    const events = ['wheel', 'touchstart', 'keydown', 'pointerdown'];
    const stop = () => {
      if (typeof cancelAnimationFrame === 'function')
        cancelAnimationFrame(frame);
      for (const kind of events) window.removeEventListener(kind, stop);
    };
    for (const kind of events)
      window.addEventListener(kind, stop, { passive: true });
    window.scrollTo(0, place.scroll);
    const settle = () => {
      const card = place.anchor ? cardAt(place.anchor) : undefined;
      if (card && place.offset !== undefined) {
        const off = card.getBoundingClientRect().top - place.offset;
        if (Math.abs(off) > 1) window.scrollTo(0, window.scrollY + off);
      } else if (Math.abs(window.scrollY - place.scroll) > 1)
        window.scrollTo(0, place.scroll);
      if (
        performance.now() < until &&
        typeof requestAnimationFrame === 'function'
      )
        frame = requestAnimationFrame(settle);
      else stop();
    };
    settle();
    return stop;
  }, [startAtCollection]);
}

/** Words joined as English lists them: “a”, “a and b”, “a, b and c”. */
function andList(words: readonly string[]): string {
  if (words.length < 2) return words[0] ?? '';
  return `${words.slice(0, -1).join(', ')} and ${words.at(-1)}`;
}
