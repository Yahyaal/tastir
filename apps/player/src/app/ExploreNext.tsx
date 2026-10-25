import { useState } from 'react';
import type { Tutorial } from '@tastir/schema';
import { addPattern, freeTitle } from '../editor/patterns';
import { grouped, holds, LIBRARY, listed } from './library';
import { aboutOf } from './browsing';

/** A finished lesson leads into experimenting and exploring the same symmetry. */
export function ExploreNext({ tutorial }: { tutorial: Tutorial }) {
  const [refused, setRefused] = useState(false);
  const fold = tutorial.star ?? tutorial.fold;
  const related = grouped(listed(LIBRARY))
    .filter(
      (entry) =>
        !holds(entry, tutorial.id) &&
        (entry.preview?.fold ?? aboutOf(entry.json).fold) === fold,
    )
    .slice(0, 3);
  const create = () => {
    const { photos: _photos, ...construction } = tutorial;
    const made = addPattern(
      {
        ...construction,
        id: `${tutorial.id}-variation`,
        title: freeTitle(`My ${tutorial.title}`),
        credits: [
          ...tutorial.credits,
          {
            source: `Tastir: ${tutorial.title}`,
            note: `A personal variation of ${tutorial.id}.`,
          },
        ],
      },
      {
        tutorial: tutorial.id,
        title: tutorial.title,
        step: tutorial.steps.length,
      },
    );
    if (!made) {
      setRefused(true);
      return;
    }
    window.location.hash = `#/edit/${made.id}`;
  };
  return (
    <section className="explore-next" aria-labelledby="explore-next-title">
      <h2 id="explore-next-title">Make a variation</h2>
      <p className="hint">
        Keep this construction and tile, then try different ink lines in your
        own copy.
      </p>
      <button type="button" className="secondary" onClick={create}>
        Make a variation
      </button>
      {refused ? (
        <p role="alert">
          This browser could not save your copy. Free some storage and try
          again.
        </p>
      ) : null}
      {related.length ? (
        <>
          <h3>Explore {fold}-fold patterns</h3>
          <ul>
            {related.map((entry) => (
              <li key={entry.id}>
                <a href={`#/${entry.id}`}>
                  {entry.preview?.title ??
                    (entry.json as { title?: string })?.title ??
                    entry.id}
                </a>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
