import type { Tutorial } from '@tastir/schema';

type Credit = Tutorial['credits'][number];

/** Sources that teach the drawing, explicitly distinguished from finished pictures. */
export function drawingGuides(tutorial: Tutorial): Credit[] {
  return tutorial.credits.filter(
    (c) => c.url && (c.kind === 'tutorial' || c.kind === 'challenge'),
  );
}

/** Prefer the actual instructions even when a photo comes first in the credits. */
export function referenceOf(tutorial: Tutorial): Credit | undefined {
  return drawingGuides(tutorial)[0] ?? tutorial.credits.find((c) => c.url);
}

const labels = {
  tutorial: 'Tutorial',
  challenge: 'Drawing challenge',
  drawing: 'Drawing reference',
  photo: 'Photo reference',
  background: 'Further reading',
} as const;

/** The credits with a link that cover this step (by its id). */
export function stepSources(tutorial: Tutorial, step: number): Credit[] {
  return tutorial.credits.filter((c) => c.url && c.steps?.includes(step));
}

/** Who a credit is by, short: the creator before any “(site)” or “, after”. */
export const byOf = (c: Credit) =>
  (c.creator ?? c.source).split(/ \(|, after/)[0] ?? c.source;

/**
 * A lesson's name in its header: the short name, the full title as its
 * tooltip, and under it the subtitle and the reference it was drawn from.
 */
export function LessonTitle({
  tutorial,
  prefix = '',
}: {
  tutorial: Tutorial;
  prefix?: string;
}) {
  const name = tutorial.short ?? tutorial.title;
  const reference = referenceOf(tutorial);
  return (
    <div className="lesson-title">
      <h1 title={name === tutorial.title ? undefined : tutorial.title}>
        {prefix}
        {name}
      </h1>
      {tutorial.subtitle || reference ? (
        <p className="lesson-sub">
          {tutorial.subtitle ? <span>{tutorial.subtitle}</span> : null}
          {reference ? (
            <a
              href={reference.url}
              target="_blank"
              rel="noreferrer"
              title={`${reference.source}${reference.creator ? `, ${reference.creator}` : ''}`}
            >
              {reference.kind ? labels[reference.kind] : 'Reference'}:{' '}
              {byOf(reference)} <span aria-hidden="true">↗</span>
            </a>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
