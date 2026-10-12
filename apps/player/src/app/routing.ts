import { useEffect, useState } from 'react';
import { keepPlace } from './browsing';
/**
 * Set by a player whose design has unsaved changes: called when the
 * address changes, it may put the address back and ask first (true).
 */
let stayGuard: ((to: string) => boolean) | undefined;

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
      if (last === '') keepPlace();
      last = read();
      setRoute(last);
      window.scrollTo?.(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export function setStayGuard(guard: typeof stayGuard) {
  stayGuard = guard;
}
