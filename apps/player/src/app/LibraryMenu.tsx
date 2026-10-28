import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { REGIONS, TRADITIONS } from '@tastir/schema';
import {
  aboutOf,
  facetCounts,
  foldLabel,
  type LibraryFilters,
} from './browsing';
import type { Entry } from './library';
import { useModalFocus } from './useModalFocus';

const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
const capital = (s: string) => (s ? s[0]?.toUpperCase() + s.slice(1) : s);

/** One filter the menu sets, or clears with undefined. */
export type MenuChange =
  | { key: 'region' | 'style' | 'level'; value: string | undefined }
  | { key: 'fold'; value: number | undefined };

interface Group {
  key: MenuChange['key'];
  title: string;
  values: readonly (string | number)[];
  label: (value: string | number) => string;
}

/**
 * The library's side menu: region, symmetry, level and tradition, each
 * value with the number of cards it would show under the other filters.
 * Choosing a value filters the cards; choosing it again clears it. A value
 * no card has under the other filters stays in place but cannot be chosen,
 * so the menu does not jump about.
 */
export function LibraryMenu({
  entries,
  filters,
  onChange,
}: {
  /** Every card of the library, one per family. */
  entries: readonly Entry[];
  filters: LibraryFilters;
  onChange: (change: MenuChange) => void;
}) {
  const present = (key: 'region' | 'style' | 'level' | 'fold') =>
    new Set(
      entries.flatMap((e) =>
        [e, ...(e.variations ?? [])].flatMap(
          (v) => aboutOf(v.preview ?? v.json)[key] ?? [],
        ),
      ),
    );
  const folds = [...(present('fold') as Set<number>)].sort((a, b) => a - b);
  const styles = present('style') as Set<string>;
  const regions = present('region') as Set<string>;
  const groups: readonly Group[] = [
    {
      key: 'region',
      title: 'Region',
      values: REGIONS.filter((r) => regions.has(r)),
      label: String,
    },
    {
      key: 'fold',
      title: 'Symmetry',
      values: folds,
      label: (f) => foldLabel(f as number),
    },
    {
      key: 'level',
      title: 'Level',
      values: LEVELS,
      label: (l) => capital(l as string),
    },
    {
      key: 'style',
      title: 'Tradition',
      values: TRADITIONS.filter((t) => styles.has(t)),
      label: String,
    },
  ];
  return (
    <nav className="library-menu" aria-label="Browse the patterns">
      {groups.map((group) => {
        const counts = facetCounts(entries, filters, group.key) as Map<
          string | number,
          number
        >;
        const chosen = filters[group.key];
        return (
          <section key={group.key} aria-labelledby={`menu-${group.key}`}>
            <h3 id={`menu-${group.key}`}>{group.title}</h3>
            <ul>
              {group.values.map((value) => {
                const count = counts.get(value) ?? 0;
                const on = chosen === value;
                return (
                  <li key={value}>
                    <button
                      type="button"
                      aria-pressed={on}
                      aria-label={`${group.label(value)}, ${count} ${count === 1 ? 'pattern' : 'patterns'}`}
                      disabled={!on && count === 0}
                      onClick={() =>
                        onChange({
                          key: group.key,
                          value: on ? undefined : value,
                        } as MenuChange)
                      }
                    >
                      <span>{group.label(value)}</span>
                      <span className="menu-count">{count}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </nav>
  );
}

/** The same menu over the cards on a narrow screen, opened by "Browse". */
export function LibraryDrawer({
  onClose,
  shown,
  children,
}: {
  onClose: () => void;
  /** How many cards the filters leave, for the button that closes it. */
  shown: number;
  children: React.ReactNode;
}) {
  const panel = useRef<HTMLElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  useModalFocus(panel, close, onClose, '.collection-tools', '.browse-button');
  // Drawn at the top of the page, so no transformed parent can hold it in.
  return createPortal(
    <div className="library-drawer-backdrop" onClick={onClose}>
      <aside
        ref={panel}
        className="library-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Browse the patterns"
        onClick={(e) => e.stopPropagation()}
      >
        <header>
          <h2>Browse</h2>
          <button
            ref={close}
            type="button"
            className="quiet"
            aria-label="Close the menu"
            onClick={onClose}
          >
            ✕
          </button>
        </header>
        {children}
        <footer>
          <button type="button" className="button primary" onClick={onClose}>
            Show {shown} {shown === 1 ? 'pattern' : 'patterns'}
          </button>
        </footer>
      </aside>
    </div>,
    document.body,
  );
}
