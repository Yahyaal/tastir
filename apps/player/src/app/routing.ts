import { useEffect, useState } from 'react';
import { keepPlace } from './browsing';
/**
 * Set by a player whose design has unsaved changes: called when the
 * address changes, it may put the address back and ask first (true).
 */
export type LessonPosition = number | 'beginning' | 'repeat' | 'result';

/** A numbered watch position is one-based in the URL, zero-based in the player. */
export function lessonRoute(route: string): {
  id: string;
  position: LessonPosition;
  colourFirst?: true;
} {
  const numbered = /^(.*)\/watch\/([1-9]\d*)(\?order=color)?$/.exec(route);
  if (numbered && Number.isSafeInteger(Number(numbered[2])))
    return {
      id: numbered[1]!,
      position: Number(numbered[2]) - 1,
      ...(numbered[3] ? { colourFirst: true as const } : {}),
    };
  for (const [suffix, position] of [
    ['watch', 'beginning'],
    ['repeat', 'repeat'],
    ['result', 'result'],
  ] as const)
    if (route.endsWith(`/${suffix}`))
      return { id: route.slice(0, -suffix.length - 1), position };
  return { id: route, position: 'result' };
}

export function lessonIndex(position: LessonPosition, length: number): number {
  return typeof position === 'number'
    ? Math.min(position, length - 1)
    : position === 'result'
      ? length - 1
      : position === 'repeat'
        ? length - 2
        : 0;
}

/** Announce history writes without remounting the lesson or resetting scroll. */
export function writeLessonRoute(hash: string, mode: 'push' | 'replace') {
  if (window.location.hash === hash) return;
  window.history[mode === 'push' ? 'pushState' : 'replaceState'](
    window.history.state,
    '',
    hash,
  );
  window.dispatchEvent(new Event('tastir:lesson-route'));
}

let stayGuard: ((to: string) => boolean) | undefined;

/** Addresses that show the library, including its public collection anchor. */
export const isLibraryRoute = (route: string) =>
  route === '' || route === 'collection';

/** The tutorial id in the address (#/id), or '' for the library. */
export function useRoute(): string {
  const read = () => {
    const hash = window.location.hash.replace(/^#\/?/, '');
    try {
      return decodeURIComponent(hash);
    } catch {
      return hash;
    }
  };
  const [route, setRoute] = useState(read);
  useEffect(() => {
    let last = read();
    const onChange = () => {
      if (stayGuard?.(`#/${read()}`)) return;
      // Leaving the library: keep its place for the way back. The page
      // still shows it here, before the new route renders.
      if (isLibraryRoute(last)) keepPlace();
      const next = read();
      const sameLesson = lessonRoute(last).id === lessonRoute(next).id;
      last = next;
      setRoute(last);
      if (!sameLesson) window.scrollTo?.(0, 0);
    };
    const onLesson = () => {
      last = read();
      setRoute(last);
    };
    window.addEventListener('hashchange', onChange);
    window.addEventListener('tastir:lesson-route', onLesson);
    return () => {
      window.removeEventListener('hashchange', onChange);
      window.removeEventListener('tastir:lesson-route', onLesson);
    };
  }, []);
  return route;
}

export function setStayGuard(guard: typeof stayGuard) {
  stayGuard = guard;
}
