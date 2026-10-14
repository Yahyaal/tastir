import { useState } from 'react';
import { allProgress } from '../along/progress';
import { PatternShelf } from '../editor/PatternShelf';
import type { UserPattern } from '../editor/patterns';
import { ActionIcon } from './actionIcons';
import type { Design } from './designs';
import { lessonsInProgress } from './lessons';
import type { Entry } from './library';
import { Shelf } from './Shelf';

/** A lesson left partway: watched, or drawn along. */
export interface InProgress {
  readonly address: string;
  readonly mode: 'watch' | 'draw';
  /** The step as the lesson names it (“Step 3 of 6”, “Ink”). */
  readonly label: string;
  /** When it was left, as an ISO date. */
  readonly at: string;
}

/**
 * Every library lesson left partway, the most recent first: the lessons
 * watched (not yet to the end) and the drawings along not yet kept as one
 * of the learner's patterns.
 */
export function workInProgress(entries: readonly Entry[]): InProgress[] {
  const known = new Set(entries.map((e) => e.id));
  const watched: InProgress[] = lessonsInProgress().map((l) => ({
    address: l.address,
    mode: 'watch',
    label: l.label,
    at: l.at ?? '',
  }));
  const drawn: InProgress[] = allProgress()
    .filter((p) => p.board.steps.length > 0 && !p.kept?.pattern)
    .map((p) => ({
      address: p.tutorial,
      mode: 'draw',
      label: p.label ?? '',
      at: p.updated,
    }));
  return [...watched, ...drawn]
    .filter((w) => known.has(w.address))
    .sort((a, b) => b.at.localeCompare(a.at));
}

type Tab = 'all' | 'progress' | 'designs' | 'patterns';

/**
 * The learner's own work, in one place: the lessons in progress, the
 * designs they saved (their colourings of patterns), and the patterns
 * they made. Tabs pick one kind when there is more than one.
 */
export function YourWork({
  entries,
  inProgress,
  designs,
  designNote,
  patterns,
  onDesigns,
  onPatterns,
}: {
  entries: readonly Entry[];
  inProgress: readonly InProgress[];
  designs: readonly Design[];
  /** Designs that could not be read: shown even without designs. */
  designNote: boolean;
  patterns: readonly UserPattern[];
  onDesigns: () => void;
  onPatterns: () => void;
}) {
  const [tab, setTab] = useState<Tab>('all');
  const counts: Record<Exclude<Tab, 'all'>, number> = {
    progress: inProgress.length,
    designs: designs.length,
    patterns: patterns.length,
  };
  const kinds = (Object.keys(counts) as (keyof typeof counts)[]).filter(
    (k) => counts[k] > 0,
  );
  const shows = (t: Exclude<Tab, 'all'>) => tab === 'all' || tab === t;
  const NAMES = {
    progress: 'In progress',
    designs: 'My designs',
    patterns: 'My patterns',
  } as const;
  return (
    <section aria-labelledby="your-work" className="your-work">
      <div className="collection-head">
        <h2 id="your-work">Your work</h2>
        {kinds.length > 1 ? (
          <div className="work-tabs" role="group" aria-label="Show">
            {(['all', ...kinds] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                className="chip"
                aria-pressed={tab === t}
                onClick={() => setTab(t)}
              >
                {t === 'all' ? 'All' : `${NAMES[t]} (${counts[t]})`}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {inProgress.length && shows('progress') ? (
        <section aria-labelledby="in-progress" className="shelf">
          <div className="collection-head">
            <h3 id="in-progress">In progress</h3>
            <p>Lessons you left partway, ready to go on where you were.</p>
          </div>
          <ul className="cards">
            {inProgress.map((w) => (
              <ProgressCard
                key={`${w.mode}:${w.address}`}
                work={w}
                entry={entries.find((e) => e.id === w.address)}
              />
            ))}
          </ul>
        </section>
      ) : null}
      {(designs.length || designNote) && shows('designs') ? (
        <Shelf designs={designs} entries={entries} onChange={onDesigns} />
      ) : null}
      {patterns.length && shows('patterns') ? (
        <PatternShelf patterns={patterns} onChange={onPatterns} />
      ) : null}
    </section>
  );
}

/** A lesson in progress: its picture, its name, and how far it got. */
function ProgressCard({ work, entry }: { work: InProgress; entry?: Entry }) {
  if (!entry) return null;
  const preview = entry.preview;
  const json = entry.json as { title?: string; short?: string } | undefined;
  const title =
    preview?.short ?? preview?.title ?? json?.short ?? json?.title ?? entry.id;
  const draw = work.mode === 'draw';
  return (
    <li className="card-item work-card">
      <a className="card" href={`#/${work.address}/${draw ? 'draw' : 'watch'}`}>
        {preview ? (
          <img
            className="thumbnail"
            src={import.meta.env.BASE_URL + preview.thumbnail}
            alt=""
            loading="lazy"
            width="360"
            height="360"
          />
        ) : (
          <div className="thumbnail waiting" />
        )}
        <h4>{title}</h4>
        <p className={`work-kind act-${work.mode}`}>
          <ActionIcon action={work.mode} />
          {draw ? 'Drawing along' : 'Watching'}
          {work.label ? ` · ${work.label}` : ''}
        </p>
        <span className={`continue-go act-${work.mode}`}>
          <ActionIcon action={work.mode} />
          Continue
        </span>
      </a>
    </li>
  );
}
