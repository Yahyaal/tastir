import { useMemo } from 'react';
import { libraryFamilies, type Entry } from '../app/library';
import { PLACES, ROUTE_PLACES } from '../app/places';
import { Route } from '../app/Route';
import './review.css';
import './routeReview.css';

/*
 * The route of REDESIGN.2 for the owner (#/review/route). Choosing a place
 * here writes #/review/route/<place>, as the library will write
 * #/places/<place>, so Back returns to all places. Below it, the same route
 * in light and dark, and enough page to scroll it slim.
 */

const href = (key?: string) =>
  key ? `#/review/route/${encodeURIComponent(key)}` : '#/review/route';

/** How many patterns (library cards) each place has. */
export function countsOf(entries: readonly Entry[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const e of entries) {
    const r = e.preview?.region;
    if (r) counts.set(r, (counts.get(r) ?? 0) + 1);
  }
  return counts;
}

export function RouteReview({
  place,
  entries = libraryFamilies(),
}: {
  place?: string;
  entries?: readonly Entry[];
}) {
  const counts = useMemo(() => countsOf(entries), [entries]);
  const chosen = PLACES.find((p) => p.key === place);
  return (
    <div className="route-review">
      <nav className="review-top">
        <a href="#/review">← Review</a>
        <a href="#/review/windows">Window cards →</a>
      </nav>
      <Route place={chosen?.key} counts={counts} hrefOf={href} />
      <main className="route-review-body">
        <h1>The route</h1>
        <p className="lede">
          The route goes from Córdoba to Agra. Click a place, its dot or
          anywhere on its stretch, to choose it. Click it again, or press Back,
          to see all places. Scroll down and the route shrinks to a slim line.
          On a phone it scrolls sideways.
        </p>
        <p className="route-review-chosen" role="status">
          {chosen ? (
            <>
              Showing <b>{chosen.short}</b>: {counts.get(chosen.key) ?? 0}{' '}
              patterns. {chosen.about}
            </>
          ) : (
            <>
              Showing <b>all places</b>:{' '}
              {[...counts.values()].reduce((a, b) => a + b, 0)} patterns.
            </>
          )}
        </p>
        <p>
          In the library the address is <code>#/places/&lt;place&gt;</code>, for
          example <a href="#/places/Morocco">#/places/Morocco</a>.
        </p>
        {(['light', 'dark'] as const).map((theme) => (
          <section
            key={theme}
            className="route-review-panel"
            data-theme={theme}
            aria-label={theme === 'light' ? 'Light mode' : 'Dark mode'}
          >
            <h2>{theme === 'light' ? 'Light' : 'Dark'}</h2>
            <Route place={chosen?.key} counts={counts} hrefOf={href} />
          </section>
        ))}
        <h2>Places and their patterns</h2>
        <ol className="route-review-places">
          {ROUTE_PLACES.map((p) => (
            <li key={p.key}>
              <b>{p.short}</b> <bdi lang="ar">{p.arabic}</bdi>:{' '}
              {counts.get(p.key) ?? 0} patterns. {p.about}
            </li>
          ))}
        </ol>
      </main>
    </div>
  );
}
