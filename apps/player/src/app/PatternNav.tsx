import { useLayoutEffect, useMemo, useRef, type RefObject } from 'react';
import {
  foldLabel,
  aboutOf,
  keptFilters,
  neighbours,
  titleOf,
} from './browsing';
import { grouped, holds, LIBRARY, listed, type Entry } from './library';
import { useModalFocus } from './useModalFocus';
import { viewAddress, type View } from './ViewSwitch';

/**
 * Links to the patterns before and after this one in the library's order,
 * named by their titles so they are not mistaken for the step buttons.
 */
export function useNeighbours(id: string) {
  return useMemo(
    () => neighbours(grouped(listed(LIBRARY)), id, keptFilters()),
    [id],
  );
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
      {direction === 'previous' ? (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m14 6-6 6 6 6" />
        </svg>
      ) : null}
      <span className="neighbour-title">{title}</span>
      <span className="neighbour-short">
        {direction === 'previous' ? 'Previous' : 'Next'}
      </span>
      {direction === 'next' ? (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m10 6 6 6-6 6" />
        </svg>
      ) : null}
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

/** The desktop browser docks beside the player; narrow screens use a modal drawer. */
export function PatternMenu({
  id,
  view,
  open,
  docked,
  onToggle,
  onClose,
}: {
  id: string;
  view: View;
  open: boolean;
  docked: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <button
        type="button"
        className="menu-button"
        aria-label="Patterns"
        title={open ? 'Hide patterns' : 'Show patterns'}
        aria-haspopup={docked ? undefined : 'dialog'}
        aria-controls={open ? 'pattern-browser' : undefined}
        aria-expanded={open}
        onClick={onToggle}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          width="21"
          height="21"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M9 4v16" />
        </svg>
      </button>
      {open ? (
        docked ? (
          <MenuPanel id={id} view={view} docked onClose={onClose} />
        ) : (
          <PatternDrawer id={id} view={view} onClose={onClose} />
        )
      ) : null}
    </>
  );
}

function PatternDrawer(props: { id: string; view: View; onClose: () => void }) {
  const panel = useRef<HTMLElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  useModalFocus(panel, close, props.onClose, '.topbar', '.menu-button');
  return (
    <div className="pattern-menu-backdrop" onClick={props.onClose}>
      <MenuPanel {...props} docked={false} panelRef={panel} closeRef={close} />
    </div>
  );
}

function MenuPanel({
  id,
  view,
  onClose,
  docked,
  panelRef,
  closeRef,
}: {
  id: string;
  view: View;
  onClose: () => void;
  docked: boolean;
  panelRef?: RefObject<HTMLElement | null>;
  closeRef?: RefObject<HTMLButtonElement | null>;
}) {
  const ownPanel = useRef<HTMLElement>(null);
  const panel = panelRef ?? ownPanel;
  const groups = useMemo(() => byFold(grouped(listed(LIBRARY))), []);
  // Open with the current pattern in sight.
  useLayoutEffect(() => {
    panel.current
      ?.querySelector('[aria-current="page"]')
      ?.scrollIntoView?.({ block: 'center' });
  }, [id, panel]);
  return (
    <aside
      ref={panel}
      id="pattern-browser"
      className={`pattern-menu${docked ? ' pattern-menu-docked' : ''}`}
      role={docked ? 'complementary' : 'dialog'}
      aria-modal={docked ? undefined : true}
      aria-label="Patterns"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={
        docked
          ? (event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                onClose();
              }
            }
          : undefined
      }
    >
      <header>
        <h2>Patterns</h2>
        <button
          ref={closeRef}
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
          <h3>{fold ? foldLabel(fold) : 'Other'}</h3>
          <ul>
            {entries.map((e) => (
              <li key={e.id}>
                <a
                  href={viewAddress(e.id, view)}
                  aria-current={holds(e, id) ? 'page' : undefined}
                  onClick={docked ? undefined : onClose}
                >
                  {e.preview ? (
                    <img
                      src={
                        import.meta.env.BASE_URL +
                        (e.preview.thumbnailSmall ?? e.preview.thumbnail)
                      }
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
  );
}
