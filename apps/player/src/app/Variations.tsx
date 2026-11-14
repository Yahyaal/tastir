import { useMemo } from 'react';
import { titleOf } from './browsing';
import { baseOf, placesOf, variationsOf, type Entry } from './library';
import type { Start } from './Player';

/** The address that opens a pattern where the learner is in this one. */
export function startAddress(id: string, at: Start): string {
  return `#/${id}/${at === 'result' ? 'result' : at === 'repeat' ? 'repeat' : 'watch'}`;
}

/**
 * The other variations of this pattern (its family in variations.json), as
 * a row of small pictures with the open one marked. Each opens at the same
 * stage: from the colours at the colours, from the repeat at the repeat,
 * and from the steps at the lesson's start (the steps differ). `guard`
 * may stop the link, to ask first about unsaved changes.
 */
export function Variations({
  id,
  at,
  guard,
}: {
  id: string;
  at: Start;
  guard?: (to: string) => boolean;
}) {
  const members = useMemo(() => variationsOf(id), [id]);
  return (
    <Switcher
      name="Variations"
      label="Variations of this pattern"
      members={members}
      current={baseOf(id)}
      at={at}
      guard={guard}
    />
  );
}

/**
 * The places the same design is found (a tutorial's `places`), as a row
 * of small pictures in each place's colours. The steps are the same, so
 * each opens at the same stage.
 */
export function Places({
  id,
  at,
  guard,
}: {
  id: string;
  at: Start;
  guard?: (to: string) => boolean;
}) {
  const members = useMemo(() => placesOf(id), [id]);
  return (
    <Switcher
      name="Seen at"
      label="Places this pattern is found"
      members={members}
      current={id}
      at={at}
      guard={guard}
      place
    />
  );
}

function Switcher({
  name,
  label,
  members,
  current,
  at,
  guard,
  place = false,
}: {
  name: string;
  label: string;
  members: readonly Entry[];
  current: string;
  at: Start;
  guard?: (to: string) => boolean;
  place?: boolean;
}) {
  const id = current;
  if (!members.length) return null;
  return (
    <nav className="variations" aria-label={label}>
      <span className="variations-name" aria-hidden="true">
        {name}
      </span>
      {members.map((e) => {
        const to = startAddress(e.id, at);
        const title =
          (place ? e.preview?.subtitle : undefined) ??
          e.preview?.title ??
          titleOf(e);
        return (
          <a
            key={e.id}
            href={to}
            title={title}
            aria-label={title}
            aria-current={e.id === id ? 'page' : undefined}
            onClick={(event) => {
              if (e.id === id) event.preventDefault();
              else if (guard?.(to)) event.preventDefault();
            }}
          >
            {e.preview ? (
              <img
                src={import.meta.env.BASE_URL + e.preview.thumbnail}
                alt=""
                loading="lazy"
                width="30"
                height="30"
              />
            ) : (
              <span className="variations-text">{titleOf(e)}</span>
            )}
          </a>
        );
      })}
    </nav>
  );
}
