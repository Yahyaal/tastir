import { useMemo } from 'react';
import { keptFilters, neighbours, titleOf } from './browsing';
import { LIBRARY } from './library';

/**
 * Links to the patterns before and after this one in the library's order,
 * named by their titles so they are not mistaken for the step buttons.
 */
export function useNeighbours(id: string) {
  return useMemo(() => neighbours(LIBRARY, id, keptFilters()), [id]);
}

export function NeighbourLink({
  id,
  title,
  direction,
}: {
  id: string;
  title: string;
  direction: 'previous' | 'next';
}) {
  return (
    <a
      className={`neighbour ${direction}`}
      href={`#/${id}`}
      aria-label={`${direction === 'previous' ? 'Previous' : 'Next'} pattern: ${title}`}
      title={title}
    >
      {direction === 'previous' ? <span aria-hidden="true">‹ </span> : null}
      <span className="neighbour-title">{title}</span>
      <span className="neighbour-short">
        {direction === 'previous' ? 'Previous' : 'Next'}
      </span>
      {direction === 'next' ? <span aria-hidden="true"> ›</span> : null}
    </a>
  );
}

export function PreviousPattern({ id }: { id: string }) {
  const { previous } = useNeighbours(id);
  return previous ? (
    <NeighbourLink
      id={previous.id}
      title={titleOf(previous)}
      direction="previous"
    />
  ) : null;
}

export function NextPattern({ id }: { id: string }) {
  const { next } = useNeighbours(id);
  return next ? (
    <NeighbourLink id={next.id} title={titleOf(next)} direction="next" />
  ) : null;
}
