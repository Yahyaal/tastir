import { useEffect, useLayoutEffect, useState } from 'react';
import { listPatterns } from '../editor/patterns';
import { NewPattern, PatternShelf } from '../editor/PatternShelf';
import {
  aboutOf,
  filtered,
  keepFilters,
  keptFilters,
  cardAt,
  keptPlace,
} from './browsing';
import { listDesigns, unreadableKept, unreadableNow } from './designs';
import { Thumbnail } from './drawing';
import { type Entry } from './library';
import { latestProgress } from '../along/progress';
import { lastLesson } from './lessons';
import { shownSteps } from './model';
import { Shelf } from './Shelf';
import { ThemeSwitch } from './theme';
import { PROGRESS_TEXT, useModel } from './workerClient';

import { HeroDrawing } from './Hero';
const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
const capital = (s: string) => (s ? s[0]?.toUpperCase() + s.slice(1) : s);

/** The pattern that draws itself at the top of the library. */
const HERO = 'twelve-fold-rosette-mian';
/** Where a newcomer starts. */
const FIRST = 'eight-fold-star-and-cross';

const TRADITIONS: Record<
  string,
  {
    arabic: string;
    era: string;
    region: string;
    medium: string;
    summary: string;
  }
> = {
  Moroccan: {
    arabic: 'الزليج المغربي',
    era: '12th Century – Present',
    region: 'Fez, Marrakech & Rabat',
    medium: 'Glazed terracotta tesserae (zellij)',
    summary:
      'Masterful geometric mosaics hand-chiselled from enamelled terracotta, renowned for rich saffron, cobalt, and emerald glazes radiating through celestial star rosettes.',
  },
  'Marinid zellige (Fès)': {
    arabic: 'الزليج المريني بفاس',
    era: '1244 – 1465 CE',
    region: 'Bou Inania & Attarine Medersas, Fez',
    medium: 'Classical Marinid zellij & carved cedarwood',
    summary:
      'The zenith of western Islamic geometry, epitomized by the monumental 16-fold and 12-fold star rosettes of Fez madrasas, harmonizing cut tilework with intricate stucco and cedar joinery.',
  },
  Nasrid: {
    arabic: 'العمارة النصرية بغرناطة',
    era: '1238 – 1492 CE',
    region: 'The Alhambra, Granada',
    medium: 'Interlacing tilework (alicatado) & carved stucco',
    summary:
      'Sophisticated lacería strapwork with infinite ribbons weaving over and under through celestial 12, 16, and 24-pointed stars, celebrating proportion and harmony in the Palaces of the Alhambra.',
  },
  Mamluk: {
    arabic: 'العمارة المملوكية بالقاهرة',
    era: '1250 – 1517 CE',
    region: 'Cairo, Egypt',
    medium: 'Pierced marble, minbar inlays & brass doorplates',
    summary:
      'Monumental Cairo geometry characterized by crisp polygonal strapwork, decagram star rosettes, and ivory-inlaid geometric minbars of Sultan Hassan and Qaytbay.',
  },
  Timurid: {
    arabic: 'العمارة التيمورية',
    era: '1370 – 1507 CE',
    region: 'Samarkand, Bukhara & Herat',
    medium: 'Banna’i glazed brickwork & girih tiles',
    summary:
      'Monumental turquoise and lapis lazuli geometric faience adorning colossal iwans, domes, and portals, pioneering complex quasi-crystalline girih decagrams.',
  },
  Seljuk: {
    arabic: 'الهندسة السلجوقية',
    era: '1037 – 1194 CE',
    region: 'Isfahan, Konya & Divriği',
    medium: 'Carved stone portals & brick strapwork',
    summary:
      'Bold three-dimensional geometric relief carved deeply into monumental stone portals, madrasa gates, and intricate brickwork throughout Anatolia and Persia.',
  },
  Tulunid: {
    arabic: 'الطراز الطولوني',
    era: '868 – 905 CE',
    region: 'Ibn Tulun Mosque, Cairo',
    medium: 'Carved stucco arcades & geometric window grilles',
    summary:
      'Pioneering openwork stucco lattices with stylized geometric strapwork filtering sacred desert daylight into early Islamic hypostyle prayer halls.',
  },
  Mughal: {
    arabic: 'العمارة المغولية',
    era: '1526 – 1857 CE',
    region: 'Agra, Delhi & Lahore',
    medium: 'Carved red sandstone & pierced marble jali lattices',
    summary:
      'Intricate marble jali screens and pietra dura stonework uniting imperial Islamic geometric symmetry with refined architectural grace.',
  },
};

/** Every tutorial, with a picture of the finished pattern. */
export function Library({ entries }: { entries: readonly Entry[] }) {
  const [style, setStyle] = useState(() => keptFilters().style);
  const [level, setLevel] = useState(() => keptFilters().level);
  const [fold, setFold] = useState(() => keptFilters().fold);
  useEffect(() => keepFilters({ style, level, fold }), [style, level, fold]);
  useReturnToScroll();
  const [designs, setDesigns] = useState(listDesigns);
  const [patterns, setPatterns] = useState(listPatterns);
  const styles = [
    ...new Set(
      entries.flatMap((e) => aboutOf(e.preview ?? e.json).style ?? []),
    ),
  ].sort();
  const folds = [
    ...new Set(entries.flatMap((e) => aboutOf(e.preview ?? e.json).fold ?? [])),
  ].sort((a, b) => a - b);
  const shown = filtered(entries, { style, level, fold });
  const clear = () => {
    setStyle(undefined);
    setLevel(undefined);
    setFold(undefined);
  };
  // The filters chosen, in words: “8-fold, for beginners and Nasrid”.
  const chosenWords = andList(
    [
      fold ? `${fold}-fold` : '',
      level
        ? `for ${level === 'beginner' ? 'beginners' : `the ${level} level`}`
        : '',
      style ? `from the ${style} tradition` : '',
    ].filter(Boolean),
  );
  const hero = entries.find((e) => e.id === HERO) ?? entries[0];
  const first = entries.find((e) => e.id === FIRST) ?? entries[0];
  return (
    <div className="library">
      <header className="masthead">
        <div className="masthead-brand">
          <h1 aria-label="Tastir">
            Tastir{' '}
            <span
              className="brand-arabic"
              aria-hidden="true"
              lang="ar"
              dir="rtl"
            >
              تسطير
            </span>
          </h1>
          <span className="brand-badge">ATELIER</span>
        </div>

        <nav className="masthead-nav" aria-label="Main Navigation">
          <a
            href="#collection"
            className="nav-item"
            onClick={(e) => {
              e.preventDefault();
              document
                .getElementById('collection')
                ?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <span>Library</span>
            <span className="nav-badge">{entries.length}</span>
          </a>
          <a className="nav-item jump-link upcoming-nav-link" href="#/upcoming">
            <span>Upcoming patterns</span>
            <span className="nav-badge highlight">24</span>
          </a>
          {designs.length ? (
            <button
              type="button"
              className="nav-item jump-link"
              aria-label={`My designs (${designs.length})`}
              onClick={() =>
                document
                  .getElementById('my-designs')
                  ?.scrollIntoView?.({ behavior: 'smooth' })
              }
            >
              <span>My designs</span>{' '}
              <span className="nav-badge">({designs.length})</span>
            </button>
          ) : null}
          {patterns.length ? (
            <button
              type="button"
              className="nav-item jump-link"
              aria-label={`My patterns (${patterns.length})`}
              onClick={() =>
                document
                  .getElementById('my-patterns')
                  ?.scrollIntoView?.({ behavior: 'smooth' })
              }
            >
              <span>My patterns</span>{' '}
              <span className="nav-badge">({patterns.length})</span>
            </button>
          ) : null}
        </nav>

        <div className="masthead-actions">
          {patterns.length ? null : <NewPattern />}
          <ThemeSwitch />
        </div>
      </header>
      <ContinueLesson entries={entries} />
      <section className="hero">
        {hero ? <HeroDrawing key={hero.id} entry={hero} /> : null}
        <div className="hero-copy">
          <div className="eyebrow">
            <span>Islamic Geometric Drafting Atelier</span>
            <span className="eyebrow-sep">·</span>
            <span className="eyebrow-arabic" lang="ar" dir="rtl">
              علم التسطير والهندسة
            </span>
          </div>
          <h2>Draw Islamic geometric patterns with a compass and a ruler.</h2>
          <p>
            Every pattern here starts from one circle. Each step adds a circle
            or a line, and the pattern appears out of the lines you drew.
          </p>
          <ol className="hero-steps">
            <li>Follow the construction, one step at a time.</li>
            <li>Ink the lines that make the pattern.</li>
            <li>Repeat the tile into a wall and color it.</li>
          </ol>
          {first ? (
            <p className="hero-start">
              <a className="button primary" href={`#/${first.id}/watch`}>
                Start with the star and cross
              </a>
              {first.preview ? (
                <span className="hero-start-meta">
                  {capital(first.preview.level)} · {first.preview.steps} steps
                </span>
              ) : null}
            </p>
          ) : null}
        </div>
      </section>
      {designs.length || unreadableKept() || unreadableNow() ? (
        <Shelf
          designs={designs}
          entries={entries}
          onChange={() => setDesigns(listDesigns())}
        />
      ) : null}
      {patterns.length ? (
        <PatternShelf
          patterns={patterns}
          onChange={() => {
            setPatterns(listPatterns());
            setDesigns(listDesigns());
          }}
        />
      ) : null}
      <section aria-labelledby="collection">
        <div className="collection-head">
          <h2 id="collection">The patterns</h2>
          <div className="collection-meta">
            <p>
              {shown.length === entries.length
                ? `${entries.length} patterns, many checked against photos of the real walls.`
                : `${shown.length} of ${entries.length} patterns.`}
            </p>
            <a className="upcoming-teaser-link" href="#/upcoming">
              Upcoming masterworks roadmap (24) →
            </a>
          </div>
        </div>
        <div className="filters">
          <div className="filter-group" role="group" aria-label="Symmetry">
            <Chip on={!fold} onClick={() => setFold(undefined)}>
              Any fold
            </Chip>
            {folds.map((f) => (
              <Chip key={f} on={fold === f} onClick={() => setFold(f)}>
                {f}-fold
              </Chip>
            ))}
          </div>
          <label className="filter-select">
            Level
            <select
              value={level ?? ''}
              onChange={(e) => setLevel(e.target.value || undefined)}
            >
              <option value="">Any</option>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {capital(l)}
                </option>
              ))}
            </select>
          </label>
          <label className="filter-select">
            Tradition
            <select
              value={style ?? ''}
              onChange={(e) => setStyle(e.target.value || undefined)}
            >
              <option value="">All</option>
              {styles.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </label>
          {style || level || fold ? (
            <button type="button" className="clear-filters" onClick={clear}>
              Clear all
            </button>
          ) : null}
        </div>
        {style && TRADITIONS[style] ? (
          <aside
            className="tradition-dossier"
            aria-label={`Context for ${style}`}
          >
            <div className="dossier-header">
              <div className="dossier-badge">
                <span className="dossier-tag">TRADITION CONTEXT</span>
                <span className="dossier-sep">·</span>
                <span className="dossier-ar" lang="ar" dir="rtl">
                  {TRADITIONS[style].arabic}
                </span>
              </div>
              <button
                type="button"
                className="dossier-clear"
                onClick={() => setStyle(undefined)}
              >
                Clear tradition filter ✕
              </button>
            </div>
            <div className="dossier-body">
              <div className="dossier-heading">
                <h3 className="dossier-title">{style}</h3>
                <p className="dossier-meta">
                  <span>{TRADITIONS[style].era}</span>
                  <span className="meta-dot">·</span>
                  <span>{TRADITIONS[style].region}</span>
                  <span className="meta-dot">·</span>
                  <span>{TRADITIONS[style].medium}</span>
                </p>
              </div>
              <p className="dossier-summary">{TRADITIONS[style].summary}</p>
            </div>
          </aside>
        ) : null}
        {shown.length ? (
          <ul className="cards">
            {shown.map((entry) => (
              <Card key={entry.id} entry={entry} />
            ))}
          </ul>
        ) : (
          <p className="empty">
            No pattern is {chosenWords}.{' '}
            <button type="button" className="clear-filters" onClick={clear}>
              Clear all
            </button>
          </p>
        )}
      </section>
      <footer className="site-footer">
        Tastir draws every point from crossings of earlier circles and lines, as
        with a real compass and ruler. Sources and photographers are named with
        each pattern.
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
function useReturnToScroll() {
  useLayoutEffect(() => {
    const place = keptPlace();
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
  }, []);
}

/**
 * The lesson the learner left partway, offered at the top of the library:
 * its picture, its name, whether they were watching it or drawing it along,
 * and how far they got. Of the two, the one left most recently. Only
 * library lessons are offered; the learner's own patterns have their shelf,
 * and a drawing already kept as one of them is done.
 */
function ContinueLesson({ entries }: { entries: readonly Entry[] }) {
  const watch = lastLesson();
  const drawn = latestProgress();
  const drawing =
    drawn && drawn.board.steps.length > 0 && !drawn.kept?.pattern
      ? drawn
      : undefined;
  const pick =
    drawing && (!watch || (watch.at ?? '') < drawing.updated)
      ? {
          address: drawing.tutorial,
          mode: 'Drawing along',
          label: drawing.label ?? '',
          href: `#/${drawing.tutorial}/draw`,
        }
      : watch
        ? {
            address: watch.address,
            mode: 'Watching',
            label: watch.label,
            href: `#/${watch.address}/watch`,
          }
        : undefined;
  const entry = pick && entries.find((e) => e.id === pick.address);
  if (!pick || !entry) return null;
  const title = entry.preview?.title ?? aboutTitle(entry.json) ?? entry.id;
  return (
    <a className="continue-lesson" href={pick.href}>
      {entry.preview ? (
        <img
          src={import.meta.env.BASE_URL + entry.preview.thumbnail}
          alt=""
          width="56"
          height="56"
        />
      ) : null}
      <span className="continue-text">
        <span className="continue-eyebrow">Continue where you left off</span>
        <span className="continue-title">{title}</span>
        <span className="continue-step">
          {pick.mode}
          {pick.label ? ` · ${pick.label}` : ''}
        </span>
      </span>
      <span className="continue-go">Continue</span>
    </a>
  );
}

const aboutTitle = (json: unknown): string | undefined => {
  const title = (json as { title?: unknown } | undefined)?.title;
  return typeof title === 'string' ? title : undefined;
};

/** Words joined as English lists them: “a”, “a and b”, “a, b and c”. */
function andList(words: readonly string[]): string {
  if (words.length < 2) return words[0] ?? '';
  return `${words.slice(0, -1).join(', ')} and ${words.at(-1)}`;
}

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button type="button" className="chip" aria-pressed={on} onClick={onClick}>
      {children}
    </button>
  );
}

const ARABIC_TITLES: Record<string, string> = {
  'eight-fold-star-and-cross': 'خاتم سليمان وثماني',
  'eight-fold-zellige': 'زليج ثماني مغربي',
  'bou-inania-rosette': 'خاتم الاثني عشر البوعنانية بفاس',
  'bou-inania-twelve-fold-wall': 'حائط اثنا عشري بالبوعنانية',
  'sixteen-fold-rosette': 'طاسة الستة عشر المرينية',
  'twelve-fold-rosette-mian': 'روزيتا اثنا عشرية',
  'twelve-fold-rosette-mian-hex': 'روزيتا اثنا عشرية بتكرار سداسي',
  'twelve-fold-dodecagrams': 'اثنا عشري نجمي',
  'alhambra-comares-stars': 'نجوم قاعة قمارش بقصر الحمراء',
  'alhambra-reyes-dodecagrams': 'اثنا عشري قاعة الملوك بالحمراء',
  'alhambra-reyes-stars': 'نجوم قاعة الملوك بالحمراء',
  'alhambra-mexuar-stars': 'نجوم المشور بقصر الحمراء',
  'alhambra-barca-stars': 'نجوم قاعة البركة بالحمراء',
  'alhambra-bath-stars': 'نجوم حمامات قصر الحمراء',
  'alhambra-arrayanes-squares': 'مربعات صحن الريحان بالحمراء',
  'ibn-tulun-window': 'شمسية جامع ابن طولون بالقاهرة',
  'minbar-doors-cairo': 'مصاريع منبر قاهري مملوكي',
  'four-fold-ring-of-circles': 'حلقة الدوائر الرباعية',
  'six-fold-star-and-hexagons': 'نجمة مسدسة ومسدسات',
  'six-fold-snowflake': 'ندفة الثلج المسدسة',
  'six-fold-hammerhead': 'مطرقة مسدسة تيمورية',
};

/** One tutorial in the library, loaded in the worker. */
function Card({ entry }: { entry: Entry }) {
  return entry.preview ? (
    <CardView id={entry.id} preview={entry.preview} />
  ) : (
    <LiveCard entry={entry} />
  );
}
function LiveCard({ entry: { id, json } }: { entry: Entry }) {
  const { model, error, progress } = useModel(json);
  return <CardView id={id} model={model} error={error} progress={progress} />;
}
function CardView({
  id,
  preview,
  model,
  error,
  progress,
}: {
  id: string;
  preview?: import('./library').Preview;
  model?: import('./model').Model;
  error?: string;
  progress?: import('./workerClient').Progress;
}) {
  const title = preview?.title ?? model?.tutorial.title ?? id;
  const level = preview?.level ?? model?.tutorial.level;
  const verification = preview?.verification ?? model?.tutorial.verification;
  return (
    <li className="card-item">
      {/* The card opens the finished pattern (beside its photo, when there
          is one), so the learner sees it whole before choosing to watch it
          drawn or draw it along. */}
      <a className="card" href={`#/${id}/result`}>
        {preview ? (
          <img
            className="thumbnail"
            src={import.meta.env.BASE_URL + preview.thumbnail}
            alt=""
            loading="lazy"
            width="360"
            height="360"
          />
        ) : model ? (
          <Thumbnail model={model} />
        ) : (
          <div className={error ? 'thumbnail broken' : 'thumbnail waiting'} />
        )}
        <h3>{title}</h3>
        {verification?.status === 'unverified' ? (
          <span className="verification-label" title={verification.note}>
            Historical match unverified
          </span>
        ) : null}
        {ARABIC_TITLES[id] ? (
          <span className="card-arabic" lang="ar" dir="rtl">
            {ARABIC_TITLES[id]}
          </span>
        ) : null}
        {preview || model ? (
          <p className="meta">
            <span className="level">{capital(level ?? '')}</span>
            <span>
              {preview?.steps ??
                (model ? shownSteps(model.tutorial).length : 0)}{' '}
              steps
            </span>
            <span>{preview?.fold ?? model?.tutorial.fold}-fold</span>
            <span>{preview?.style ?? model?.tutorial.style}</span>
          </p>
        ) : error ? (
          <p className="error">Cannot be played: {error}</p>
        ) : (
          <p>{PROGRESS_TEXT[progress ?? 'checking']}</p>
        )}
      </a>
      {preview || model ? (
        <div className="card-actions">
          <a className="card-link" href={`#/${id}/watch`}>
            Watch it drawn
          </a>
          <a
            className="card-link"
            href={`#/${id}/draw`}
            title="Draw it yourself, step by step"
          >
            Draw along
          </a>
        </div>
      ) : null}
    </li>
  );
}
