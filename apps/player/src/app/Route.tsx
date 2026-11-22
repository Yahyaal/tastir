import { useEffect, useRef, useState } from 'react';
import {
  isHigh,
  placeHref,
  ROUTE_PLACES,
  STOPS,
  stretches,
  wavePath,
} from './places';
import './route.css';

/*
 * The route from Córdoba to Agra (REDESIGN.2): a wave through a stop for
 * each place, over a pencil band of each place's own pattern, drawn at
 * build time (pnpm route-band). It chooses the place the library shows.
 *
 * Each place owns its stretch of the route, half way to each neighbour, and
 * a click anywhere on it chooses the place; the stop is the same link for
 * the keyboard. Choosing the chosen place again shows all places. Names sit
 * above the high stops and below the low ones, never on the line. Once the
 * page scrolls down, the route shrinks to a slim line; on a phone it
 * scrolls sideways.
 */

const W = 1000;
const H = 100;

export function Route({
  place,
  counts,
  hrefOf = placeHref,
  caption,
}: {
  /** The chosen place's key, if one is chosen. */
  place?: string;
  /** How many patterns each place has. */
  counts: ReadonlyMap<string, number>;
  /** The address of a place, or of all places (no key). */
  hrefOf?: (key?: string) => string;
  /** A line above the route, for a first visit. */
  caption?: string;
}) {
  const max = Math.max(...counts.values(), 1);
  const [lit, setLit] = useState<string>();
  // Once the page scrolls down to the cards, the route shrinks to a slim
  // line; it grows back near the top (a gap between the two, so it never
  // flickers at one point).
  const [slim, setSlim] = useState(false);
  useEffect(() => {
    const on = () =>
      setSlim((was) => (was ? window.scrollY > 40 : window.scrollY > 180));
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  // On a phone the chosen place scrolls into the middle of the row.
  const nav = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = nav.current;
    const on = el?.querySelector<HTMLElement>(
      '.route-stop[aria-current="page"]',
    );
    if (el && on && el.scrollWidth > el.clientWidth)
      el.scrollLeft = on.offsetLeft - el.clientWidth / 2;
  }, [place]);
  const zones = stretches();
  const focus = lit ?? place;
  const go = (key: string) => {
    window.location.hash = hrefOf(place === key ? undefined : key);
  };
  const base = import.meta.env.BASE_URL;
  return (
    <nav
      className={`route${slim ? ' is-slim' : ''}${focus ? ' has-focus' : ''}`}
      aria-label="Places, west to east"
      ref={nav}
    >
      {caption ? <p className="route-caption">{caption}</p> : null}
      <div className="route-in">
        <div className="route-band" aria-hidden="true">
          <img
            className="route-band-light"
            src={`${base}route/band-light.svg`}
            alt=""
            loading="lazy"
            draggable={false}
          />
          <img
            className="route-band-dark"
            src={`${base}route/band-dark.svg`}
            alt=""
            loading="lazy"
            draggable={false}
          />
        </div>
        <svg
          className="route-line"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d={wavePath(W, H)} />
        </svg>
        <span className="route-end west">
          <span>West</span>
          <span>Córdoba</span>
        </span>
        <span className="route-end east">
          <span>East</span>
          <span>Agra</span>
        </span>
        {ROUTE_PLACES.map((r, i) => {
          const z = zones[i] ?? { from: 0, to: 1 };
          return (
            <span
              key={`zone-${r.key}`}
              className={`route-zone${lit === r.key ? ' is-lit' : ''}`}
              data-place={r.key}
              aria-hidden="true"
              style={{
                left: `${z.from * 100}%`,
                width: `${(z.to - z.from) * 100}%`,
              }}
              onClick={() => go(r.key)}
              onPointerEnter={() => setLit(r.key)}
              onPointerLeave={() => setLit(undefined)}
            />
          );
        })}
        {ROUTE_PLACES.map((r, i) => {
          const [x, y] = STOPS[i] ?? [0.5, 0.5];
          const n = counts.get(r.key) ?? 0;
          const size = 12 + Math.round(12 * Math.sqrt(n / max));
          const on = place === r.key;
          return (
            <a
              key={r.key}
              className={`route-stop${isHigh(i) ? ' up' : ''}${lit === r.key ? ' is-lit' : ''}`}
              href={hrefOf(on ? undefined : r.key)}
              aria-current={on ? 'page' : undefined}
              title={on ? 'Show all places again' : r.about}
              style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
              onPointerEnter={() => setLit(r.key)}
              onPointerLeave={() => setLit(undefined)}
              onFocus={() => setLit(r.key)}
              onBlur={() => setLit(undefined)}
            >
              <span
                className="route-dot"
                style={{ width: size, height: size }}
              />
              <span className="route-name">
                <b>{r.short}</b>
                <small>
                  {n} {n === 1 ? 'pattern' : 'patterns'}
                </small>
              </span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
