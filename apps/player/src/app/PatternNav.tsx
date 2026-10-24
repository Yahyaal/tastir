import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { aboutOf, keptFilters, neighbours, titleOf } from './browsing';
import { LIBRARY, listed, type Entry } from './library';
import { useModalFocus } from './useModalFocus';
import { viewAddress, type View } from './ViewSwitch';

/**
 * Links to the patterns before and after this one in the library's order,
 * named by their titles so they are not mistaken for the step buttons.
 */
export function useNeighbours(id: string) {
  return useMemo(() => neighbours(listed(LIBRARY), id, keptFilters()), [id]);
}

export function NeighbourLink({
  id,
  title,
  direction,
  view,
}: {
  id: string;
  title: string;
  direction: 'previous' | 'next';
  view: View;
}) {
  return (
    <a
      className={`neighbour ${direction}`}
      href={viewAddress(id, view)}
      aria-label={`${direction === 'previous' ? 'Previous' : 'Next'} pattern: ${title}`}
      title={title}
    >
      {direction === 'previous' ? <span aria-hidden="true">‹</span> : null}
      <span className="neighbour-title">{title}</span>
      <span className="neighbour-short">
        {direction === 'previous' ? 'Previous' : 'Next'}
      </span>
      {direction === 'next' ? <span aria-hidden="true">›</span> : null}
    </a>
  );
}

/** The views keep: from a result, the next pattern opens at its result. */
export function PreviousPattern({ id, view }: { id: string; view: View }) {
  const { previous } = useNeighbours(id);
  return previous ? (
    <NeighbourLink
      id={previous.id}
      title={titleOf(previous)}
      direction="previous"
      view={view}
    />
  ) : null;
}

export function NextPattern({ id, view }: { id: string; view: View }) {
  const { next } = useNeighbours(id);
  return next ? (
    <NeighbourLink
      id={next.id}
      title={titleOf(next)}
      direction="next"
      view={view}
    />
  ) : null;
}

/** The library's patterns grouped by fold, smallest first, in its order. */
function byFold(entries: readonly Entry[]) {
  const groups = new Map<number | undefined, Entry[]>();
  for (const e of entries) {
    const fold = aboutOf(e.preview ?? e.json).fold;
    groups.set(fold, [...(groups.get(fold) ?? []), e]);
  }
  return [...groups].sort(([a], [b]) => (a ?? Infinity) - (b ?? Infinity));
}

/**
 * A "Patterns" button that opens every pattern in a panel from the left,
 * so the learner can change pattern without going back to the library.
 * Escape, a click outside or choosing a pattern closes it.
 */
export function PatternMenu({ id, view }: { id: string; view: View }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="menu-button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <path d="M2 4h12M2 8h12M2 12h12" />
        </svg>
        Patterns
      </button>
      {open ? (
        <MenuPanel id={id} view={view} onClose={() => setOpen(false)} />
      ) : null}
    </>
  );
}

function MenuPanel({
  id,
  view,
  onClose,
}: {
  id: string;
  view: View;
  onClose: () => void;
}) {
  const panel = useRef<HTMLElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  useModalFocus(panel, close, onClose, '.topbar', '.menu-button');
  const groups = useMemo(() => byFold(listed(LIBRARY)), []);
  // Open with the current pattern in sight.
  useLayoutEffect(() => {
    panel.current
      ?.querySelector('[aria-current="page"]')
      ?.scrollIntoView?.({ block: 'center' });
  }, []);
  return (
    <div className="pattern-menu-backdrop" onClick={onClose}>
      <aside
        ref={panel}
        className="pattern-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Patterns"
        onClick={(e) => e.stopPropagation()}
      >
        <header>
          <h2>Patterns</h2>
          <button
            ref={close}
            type="button"
            className="quiet"
            aria-label="Close the list of patterns"
            onClick={onClose}
          >
            ✕
          </button>
        </header>
        {groups.map(([fold, entries]) => (
          <section key={fold ?? 'other'}>
            <h3>{fold ? `${fold}-fold` : 'Other'}</h3>
            <ul>
              {entries.map((e) => (
                <li key={e.id}>
                  <a
                    href={viewAddress(e.id, view)}
                    aria-current={e.id === id ? 'page' : undefined}
                    onClick={onClose}
                  >
                    {e.preview ? (
                      <img
                        src={import.meta.env.BASE_URL + e.preview.thumbnail}
                        alt=""
                        loading="lazy"
                        width="44"
                        height="44"
                      />
                    ) : (
                      <span className="no-thumbnail" />
                    )}
                    <span>{titleOf(e)}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </aside>
    </div>
  );
}
