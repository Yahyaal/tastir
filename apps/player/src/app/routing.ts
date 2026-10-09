import { useEffect, useState } from 'react';
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
    const onChange = () => {
      if (stayGuard?.(`#/${read()}`)) return;
      setRoute(read());
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
