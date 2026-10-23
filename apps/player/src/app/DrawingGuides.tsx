import type { Tutorial } from '@tastir/schema';
import { drawingGuides } from './LessonTitle';

/** An app step number is not automatically the source's step number. */
export function stepRanges(steps: readonly number[]): string {
  const sorted = [...new Set(steps)].sort((a, b) => a - b);
  const ranges: { start: number; end: number }[] = [];
  for (const step of sorted) {
    const last = ranges.at(-1);
    if (last && step === last.end + 1) last.end = step;
    else ranges.push({ start: step, end: step });
  }
  return ranges
    .map(({ start, end }) =>
      start === end ? String(start) : `${start}–${end}`,
    )
    .join(', ');
}

function format(credit: Tutorial['credits'][number]): string {
  if (credit.kind === 'challenge') return 'Challenge with hints';
  if (!credit.url) return 'Tutorial';
  const url = new URL(credit.url);
  if (url.pathname.toLowerCase().endsWith('.pdf')) return 'PDF tutorial';
  if (['www.youtube.com', 'youtube.com', 'youtu.be'].includes(url.hostname))
    return 'Video tutorial';
  return 'Written tutorial';
}

export function DrawingGuides({ tutorial }: { tutorial: Tutorial }) {
  const guides = drawingGuides(tutorial);
  if (!guides.length) return null;
  const onlyHints = guides.every((credit) => credit.kind === 'challenge');
  return (
    <section className="drawing-guides" aria-label="Drawing tutorials">
      <h3>
        {onlyHints
          ? 'Drawing challenge and hints'
          : 'Compare with the source tutorial'}
      </h3>
      <p>
        {onlyHints
          ? 'The author provides hints and pictures for an independent construction, rather than a complete numbered tutorial.'
          : 'Open the author’s instructions in a new tab to compare them with the app. The two may group or number the steps differently.'}
      </p>
      <ul>
        {guides.map((credit, i) => (
          <li key={`${credit.url}-${i}`}>
            <p className="drawing-guide-kind">{format(credit)}</p>
            <a href={credit.url} target="_blank" rel="noreferrer">
              {credit.source}
              {credit.creator ? ` — ${credit.creator}` : ''}{' '}
              <span aria-hidden="true">↗</span>
            </a>
            {credit.steps?.length ? (
              <p>Used for app steps {stepRanges(credit.steps)}.</p>
            ) : null}
            {credit.note ? <p>{credit.note}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
