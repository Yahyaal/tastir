import { useEffect, useMemo, useRef, useState } from 'react';
import { allProgress } from '../along/progress';
import { ActionIcon } from './actionIcons';
import { fullView } from './camera';
import { Construction } from './drawing';
import { availableLearningPath } from './learningPath';
import { lastLesson } from './lessons';
import type { Entry } from './library';
import { shownSteps } from './model';
import { clipId, WindowFrame } from './Window';
import { useModel } from './workerClient';
import type { InProgress } from './YourWork';

/*
 * Start here on the library page (REDESIGN.3): the twelve lessons of the
 * learning path as round windows, each drawing its construction while it is
 * pointed at (only these play: on all 195 cards it would be noise and cost
 * the engine work), with Begin or Go on, and a Continue card at the front
 * when a lesson or a drawing was left partway.
 */

/**
 * The welcome for a first visit. The owner has not chosen one yet (three
 * are shown at #/notes/ui-concepts); this is option 1: one line in the
 * heading, and lesson 1 drawing itself until it is pointed away. Another
 * option replaces WELCOME and `welcomed` here, nothing else.
 */
export const WELCOME =
  'Learn to draw these patterns with a compass and a ruler, one step at a time.';

/** Whether the learner has begun a lesson or a drawing along: the welcome
 * is then no longer shown. */
export function welcomed(): boolean {
  return Boolean(lastLesson()) || allProgress().length > 0;
}

const OPEN_KEY = 'tastir.startHere.open';
function keptOpen(): boolean | undefined {
  try {
    const v = window.localStorage.getItem(OPEN_KEY);
    return v === null ? undefined : v === '1';
  } catch {
    return undefined;
  }
}
function keepOpen(open: boolean) {
  try {
    window.localStorage.setItem(OPEN_KEY, open ? '1' : '0');
  } catch {
    // Not kept: it folds again next time.
  }
}
/** An eight-pointed star, a stepping stone of the path. */
const STONE = Array.from({ length: 16 }, (_, i) => {
  const r = i % 2 ? 7.4 : 11;
  const a = (Math.PI * i) / 8 - Math.PI / 2;
  return `${(12 + r * Math.cos(a)).toFixed(2)},${(12 + r * Math.sin(a)).toFixed(2)}`;
}).join(' ');

export function StartHere({
  entries,
  inProgress,
}: {
  entries: readonly Entry[];
  inProgress: readonly InProgress[];
}) {
  const path = useMemo(() => availableLearningPath(entries), [entries]);
  const [newcomer] = useState(() => !welcomed());
  // A first visit sees the lessons as windows; after that they fold to a
  // row of numbered stars, so the patterns show without scrolling. The
  // learner's choice is kept.
  const [open, setOpen] = useState(() => keptOpen() ?? newcomer);
  const toggle = () => {
    setOpen(!open);
    keepOpen(!open);
  };
  const row = useRef<HTMLOListElement>(null);
  const [ends, setEnds] = useState({ start: true, end: false });
  const update = () => {
    const el = row.current;
    if (!el) return;
    setEnds({
      start: el.scrollLeft < 8,
      end: el.scrollLeft + el.clientWidth > el.scrollWidth - 8,
    });
  };
  useEffect(update, [path.length]);
  const nudge = (dir: number) =>
    row.current?.scrollBy?.({
      left: dir * row.current.clientWidth * 0.8,
      behavior: 'smooth',
    });
  if (!path.length) return null;
  // Go on with the latest lesson of the path left partway; else begin.
  const started = new Set(inProgress.map((w) => w.address));
  const going = path.find((p) => started.has(p.lesson.id));
  const next = going ?? path[0];
  const work = inProgress[0];
  const workEntry = work && entries.find((e) => e.id === work.address);
  return (
    <section className="start-here" aria-labelledby="start-here-title">
      <div className="start-here-head">
        <h2 id="start-here-title">Start here</h2>
        <p>
          {newcomer ? (
            <>
              <b>New here?</b> {WELCOME}
            </>
          ) : (
            `${path.length} lessons, from one circle to a rosette. Point at one to watch it drawn.`
          )}
        </p>
        {next ? (
          <a
            className="start-here-go"
            href={`#/${next.lesson.id}/watch${going ? '' : '/1'}`}
          >
            <ActionIcon action="watch" />
            {going ? 'Go on' : 'Begin'}: lesson {next.number}
          </a>
        ) : null}
        <a className="start-here-path" href="#/learn">
          See the learning path
        </a>
        <button
          type="button"
          className="start-here-fold"
          aria-expanded={open}
          aria-controls="start-here-lessons"
          onClick={toggle}
        >
          {open ? 'Fold the lessons' : 'Show the lessons'}
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>
      {open ? null : (
        <div className="start-here-folded">
          {work && workEntry ? (
            <ContinueCard work={work} entry={workEntry} compact />
          ) : null}
          <ol className="start-here-stones" id="start-here-lessons">
            {path.map((p) => (
              <li key={p.lesson.id}>
                <a
                  href={`#/${p.lesson.id}/watch/1`}
                  className={`start-here-stone level-${p.entry.preview?.level ?? 'beginner'}${p === next ? ' is-next' : ''}${started.has(p.lesson.id) ? ' is-started' : ''}`}
                  title={`Lesson ${p.number}: ${p.lesson.focus}`}
                  aria-label={`Lesson ${p.number}: ${p.lesson.focus}`}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <polygon points={STONE} />
                  </svg>
                  <span aria-hidden="true">{p.number}</span>
                </a>
              </li>
            ))}
          </ol>
        </div>
      )}
      {open ? (
        <div className="start-here-shelf" id="start-here-lessons">
          {ends.start ? null : (
            <button
              type="button"
              className="start-here-arrow left"
              aria-label="Earlier lessons"
              onClick={() => nudge(-1)}
            >
              <span aria-hidden="true">‹</span>
            </button>
          )}
          <ol className="start-here-row" ref={row} onScroll={update}>
            {work && workEntry ? (
              <li className="start-here-continue">
                <ContinueCard work={work} entry={workEntry} />
              </li>
            ) : null}
            {path.map((p) => (
              <li key={p.lesson.id}>
                <LessonWindow
                  entry={p.entry}
                  number={p.number}
                  focus={p.lesson.focus}
                  next={p === next}
                  autoplay={newcomer && p.number === 1}
                />
              </li>
            ))}
          </ol>
          {ends.end ? null : (
            <button
              type="button"
              className="start-here-arrow right"
              aria-label="Later lessons"
              onClick={() => nudge(1)}
            >
              <span aria-hidden="true">›</span>
            </button>
          )}
        </div>
      ) : null}
    </section>
  );
}

const titleOf = (entry: Entry) => {
  const json = entry.json as { title?: string; short?: string } | undefined;
  return (
    entry.preview?.short ??
    entry.preview?.title ??
    json?.short ??
    json?.title ??
    entry.id
  );
};

/** The work left partway, first in the row. */
function ContinueCard({
  work,
  entry,
  compact = false,
}: {
  work: InProgress;
  entry: Entry;
  /** One line, beside the folded path. */
  compact?: boolean;
}) {
  const draw = work.mode === 'draw';
  const title = titleOf(entry);
  return (
    <a
      className={`continue-card act-${work.mode}${compact ? ' compact' : ''}`}
      href={`#/${work.address}/${draw ? 'draw' : 'watch'}`}
    >
      <span className="continue-pic">
        {entry.preview ? (
          <img
            src={
              import.meta.env.BASE_URL +
              (entry.preview.thumbnailSmall ?? entry.preview.thumbnail)
            }
            alt=""
            loading="lazy"
          />
        ) : null}
      </span>
      <span className="continue-what">
        <ActionIcon action={work.mode} />
        {draw ? 'Continue drawing' : 'Continue watching'}
      </span>
      <b>{title}</b>
      {work.label ? <small>{work.label}</small> : null}
    </a>
  );
}

/** A lesson as a round window: pointing at it plays its construction. */
function LessonWindow({
  entry,
  number,
  focus,
  next,
  autoplay,
}: {
  entry: Entry;
  number: number;
  focus: string;
  next: boolean;
  autoplay: boolean;
}) {
  const [playing, setPlaying] = useState(autoplay);
  const title = titleOf(entry);
  const thumb = entry.preview?.thumbnailSmall ?? entry.preview?.thumbnail;
  return (
    <div
      className={`lesson-window${next ? ' is-next' : ''}`}
      onPointerEnter={() => setPlaying(true)}
      onPointerLeave={() => setPlaying(false)}
      onFocus={() => setPlaying(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setPlaying(false);
      }}
    >
      <div
        className="window-pic"
        style={{ clipPath: `url(#${clipId('round')})` }}
      >
        <a
          className="window-link"
          href={`#/${entry.id}/watch/1`}
          aria-label={`Lesson ${number}: ${title}`}
        >
          {thumb ? (
            <img
              src={import.meta.env.BASE_URL + thumb}
              alt=""
              loading="lazy"
              width="320"
              height="400"
            />
          ) : null}
          {playing ? <Playing entry={entry} /> : null}
        </a>
        <WindowFrame kind="round" />
        <span className="lesson-number" aria-hidden="true">
          {number}
        </span>
      </div>
      <h3 title={title}>{title}</h3>
      <p className="lesson-focus">{focus}</p>
    </div>
  );
}

/** The lesson's construction, a step at a time, then its ink, over and
 * over. Reduced motion shows the finished construction instead. */
function Playing({ entry }: { entry: Entry }) {
  const { model } = useModel(entry.json);
  const steps = useMemo(
    () => (model ? shownSteps(model.tutorial) : []),
    [model],
  );
  const still =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!steps.length || still) return;
    const t = window.setInterval(
      () => setI((x) => (x + 1) % (steps.length + 2)),
      650,
    );
    return () => window.clearInterval(t);
  }, [steps.length, still]);
  if (!model || !steps.length) return null;
  const at = still ? steps.length : i;
  if (at === steps.length + 1) return null;
  const ink = at >= steps.length;
  return (
    <span className="lesson-playing" aria-hidden="true">
      <Construction
        model={model}
        upTo={steps[Math.min(at, steps.length - 1)] ?? 1}
        view={fullView(model)}
        ink={ink}
      />
      <span className="lesson-step">
        {ink ? 'Ink' : `Step ${at + 1} of ${steps.length}`}
      </span>
    </span>
  );
}
