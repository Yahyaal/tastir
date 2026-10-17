import { useEffect, useRef } from 'react';

/**
 * Calls to the studio. On this computer they go through the dev server,
 * which adds the studio's secret (pnpm studio sets this up; vite.config.mts
 * holds the proxy). The hosted build (VITE_TASTIR_STUDIO=hosted) calls the
 * hosted server's /api with the owner's sign-in cookie instead.
 */
export const HOSTED = import.meta.env['VITE_TASTIR_STUDIO'] === 'hosted';
const BASE = HOSTED ? '/api' : '/__studio';

/** The address of a studio request, for pictures and downloads. */
export const studioUrl = (path: string) => `${BASE}${path}`;

/** The studio said the owner is not signed in (hosted only). */
export class SignedOut extends Error {}
export interface ProjectLine {
  readonly id: string;
  readonly title: string;
  readonly updated: string;
  readonly revision: number;
}

export interface HistoryLine {
  readonly author: string;
  readonly label: string;
  readonly at: string;
}

export async function studioCall<T>(
  method: 'GET' | 'POST',
  path: string,
  data?: unknown,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(studioUrl(path), {
      method,
      headers: { 'Content-Type': 'application/json' },
      ...(data === undefined ? {} : { body: JSON.stringify(data) }),
    });
  } catch {
    throw new Error(
      HOSTED
        ? 'The studio is not answering. Check the connection and try again.'
        : 'The studio is not answering. Start it with pnpm studio.',
    );
  }
  if (HOSTED && response.status === 401)
    throw new SignedOut('Sign in to use the studio.');
  if (!response.headers.get('content-type')?.includes('application/json'))
    throw new Error(
      'The studio is not running here. Start it with pnpm studio and open the address it prints.',
    );
  const value = (await response.json()) as T & { error?: string };
  if (!response.ok)
    throw new Error(value.error ?? 'The studio could not do that.');
  return value;
}

type StudioEvent = {
  project: string;
  revision: number;
  kind?: 'drawing' | 'notes' | 'marks' | 'reference';
};

/**
 * Calls back on every change any studio client makes. Locally the studio
 * sends each change as it happens. The hosted studio cannot hold a
 * connection open, so the page asks: every second while something changed
 * in the last two minutes, every five seconds otherwise, and not at all
 * while the tab is hidden. With a project it asks about that project's
 * revision, notes and marks; without one, about the list.
 */
export function useStudioEvents(
  onChange: (event: StudioEvent) => void,
  project?: string,
) {
  const latest = useRef(onChange);
  latest.current = onChange;
  useEffect(() => {
    if (!HOSTED) {
      const source = new EventSource(studioUrl('/events'));
      source.onmessage = (e) => {
        try {
          latest.current(JSON.parse(e.data as string) as StudioEvent);
        } catch {
          // A message that does not parse is ignored.
        }
      };
      return () => source.close();
    }
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let changed = Date.now();
    let last: { revision: number; stamp: string; marks: string } | undefined;
    let list: string | undefined;
    const emit = (event: StudioEvent) => {
      changed = Date.now();
      latest.current(event);
    };
    const tick = async () => {
      timer = undefined;
      if (stopped) return;
      if (!document.hidden)
        try {
          if (project) {
            const p = await studioCall<{
              revision: number;
              stamp: string;
              marks: string;
            }>('GET', `/projects/${project}/pulse`);
            // Every kind that changed is told, and the first answer too,
            // since something may have changed while the page was loading;
            // a page ignores a revision it already has.
            if (p.revision !== last?.revision)
              emit({ project, revision: p.revision, kind: 'drawing' });
            if (p.stamp !== last?.stamp) {
              emit({ project, revision: p.revision, kind: 'notes' });
              emit({ project, revision: p.revision, kind: 'reference' });
            }
            if (p.marks !== last?.marks)
              emit({ project, revision: p.revision, kind: 'marks' });
            last = p;
          } else {
            const now = JSON.stringify(await studioCall('GET', '/projects'));
            if (now !== list) emit({ project: '', revision: 0 });
            list = now;
          }
        } catch {
          // A missed check is tried again at the next one.
        }
      if (!stopped && !document.hidden)
        timer = setTimeout(
          () => void tick(),
          Date.now() - changed < 120_000 ? 1000 : 5000,
        );
    };
    const shown = () => {
      if (!document.hidden && !timer) void tick();
    };
    document.addEventListener('visibilitychange', shown);
    void tick();
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', shown);
    };
  }, [project]);
}
