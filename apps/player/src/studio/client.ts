import { useEffect, useRef, useSyncExternalStore } from 'react';
import { watchProject, type ConnectionTicket } from '@tastir/live-room/client';

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

/** Whether the hosted server has a live room (it says so in /api/me). */
let live = false;
export const setLive = (on: boolean) => {
  live = on;
};
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

// Shared for Studio, Your work and all protected requests. Keep this in memory:
// a new document after the login redirect must verify its own cookie.
let signedIn: boolean | undefined = HOSTED ? undefined : true;
let sessionVersion = 0;
const sessionListeners = new Set<() => void>();
const subscribeSession = (listener: () => void) => {
  sessionListeners.add(listener);
  return () => {
    sessionListeners.delete(listener);
  };
};
const sessionSnapshot = () => signedIn;
function setSignedIn(value: boolean) {
  if (signedIn === value) return;
  signedIn = value;
  sessionVersion++;
  if (!value) live = false;
  for (const listener of sessionListeners) listener();
}
export function useStudioSignedIn() {
  return useSyncExternalStore(
    subscribeSession,
    sessionSnapshot,
    sessionSnapshot,
  );
}
const signedOut = () => new SignedOut('Sign in to use the studio.');
let checking: { version: number; promise: Promise<void> } | undefined;

/** Explicitly verify a login or retry a failed connection. Only /me may bypass
 * the signed-out gate; ordinary callers use ensureStudioSession below. */
export function verifyStudioSession(): Promise<void> {
  if (!HOSTED) return Promise.resolve();
  if (checking?.version === sessionVersion) return checking.promise;
  const version = sessionVersion;
  const promise = studioRequest<{ live?: boolean }>('GET', '/me')
    .then((me) => {
      if (version !== sessionVersion) throw signedOut();
      setLive(!!me.live);
      setSignedIn(true);
    })
    .finally(() => {
      if (checking?.promise === promise) checking = undefined;
    });
  checking = { version, promise };
  return promise;
}
export function ensureStudioSession(): Promise<void> {
  return signedIn === false
    ? Promise.reject(signedOut())
    : signedIn === true
      ? Promise.resolve()
      : verifyStudioSession();
}
export async function studioCall<T>(
  method: 'GET' | 'POST',
  path: string,
  data?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  if (HOSTED) await ensureStudioSession();
  return studioRequest<T>(method, path, data, signal);
}
async function studioRequest<T>(
  method: 'GET' | 'POST',
  path: string,
  data?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const version = sessionVersion;
  let response: Response;
  try {
    response = await fetch(studioUrl(path), {
      method,
      signal,
      headers: { 'Content-Type': 'application/json' },
      ...(data === undefined ? {} : { body: JSON.stringify(data) }),
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error(
      HOSTED
        ? 'The studio is not answering. Check the connection and try again.'
        : 'The studio is not answering. Start it with pnpm studio.',
    );
  }
  if (HOSTED && response.status === 401) {
    if (version === sessionVersion) setSignedIn(false);
    throw signedOut();
  }
  if (!response.headers.get('content-type')?.includes('application/json'))
    throw new Error(
      'The studio is not running here. Start it with pnpm studio and open the address it prints.',
    );
  const value = (await response.json()) as T & { error?: string };
  if (HOSTED && version !== sessionVersion) throw signedOut();
  if (!response.ok)
    throw new Error(value.error ?? 'The studio could not do that.');
  return value;
}

type Pulse = {
  revision: number;
  stamp: string;
  marks: string;
  /** The newer drawing, when the page said which revision it has. */
  latest?: unknown;
};

type StudioEvent = {
  project: string;
  revision: number;
  kind?: 'drawing' | 'notes' | 'marks' | 'reference';
  /** For a drawing that changed, the project's /draft answer, when sent. */
  latest?: unknown;
};

/** A project's pulse path, asking for the drawing if it is newer than the last. */
const pulsePath = (project: string, last?: Pulse) =>
  `/projects/${project}/pulse${last ? `?since=${last.revision}` : ''}`;

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
  const session = useStudioSignedIn();
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
    if (session !== true) {
      if (session === undefined)
        void ensureStudioSession().catch(() => undefined);
      return;
    }
    const lifetime = new AbortController();
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let changed = Date.now();
    let last: Pulse | undefined;
    let list: string | undefined;
    const emit = (event: StudioEvent) => {
      changed = Date.now();
      latest.current(event);
    };
    // Every kind that changed is told, and the first answer too, since
    // something may have changed while the page was loading; a page
    // ignores a revision it already has.
    // A new revision's drawing carries the photo too, so the photo alone is
    // fetched only when something changed without one.
    const compare = (p: Pulse) => {
      if (!project) return;
      if (p.revision !== last?.revision)
        emit({
          project,
          revision: p.revision,
          kind: 'drawing',
          ...(p.latest ? { latest: p.latest } : {}),
        });
      if (p.stamp !== last?.stamp) {
        emit({ project, revision: p.revision, kind: 'notes' });
        if (p.revision === last?.revision)
          emit({ project, revision: p.revision, kind: 'reference' });
      }
      if (p.marks !== last?.marks)
        emit({ project, revision: p.revision, kind: 'marks' });
      last = p;
    };
    // With a live room, the room says when the project changed and the
    // page then asks; Codex's client keeps checking slowly as a fallback.
    if (project && live)
      return watchProject({
        project,
        getTicket: (signal) =>
          studioCall<ConnectionTicket>(
            'GET',
            `/projects/${project}/live`,
            undefined,
            signal,
          ),
        refresh: async (signal) => {
          const p = await studioCall<Pulse>(
            'GET',
            pulsePath(project, last),
            undefined,
            signal,
          );
          if (signal.aborted) throw new Error('Cancelled.');
          if (!stopped) compare(p);
          return Number(p.stamp);
        },
      });
    let pending = false;
    let failures = 0;
    const tick = async () => {
      timer = undefined;
      if (stopped || pending || document.hidden || signedIn !== true) return;
      pending = true;
      try {
        if (project) {
          const p = await studioCall<Pulse>(
            'GET',
            pulsePath(project, last),
            undefined,
            lifetime.signal,
          );
          if (!stopped) compare(p);
        } else {
          const now = JSON.stringify(
            await studioCall('GET', '/projects', undefined, lifetime.signal),
          );
          if (!stopped && now !== list) emit({ project: '', revision: 0 });
          list = now;
        }
        failures = 0;
      } catch (error) {
        if (error instanceof SignedOut || lifetime.signal.aborted) return;
        failures++;
      } finally {
        pending = false;
      }
      if (!stopped && !document.hidden && signedIn === true)
        timer = setTimeout(
          () => void tick(),
          failures
            ? Math.min(30000, 1000 * 2 ** Math.min(failures, 5))
            : Date.now() - changed < 120000
              ? 1000
              : 5000,
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
      lifetime.abort();
      document.removeEventListener('visibilitychange', shown);
    };
  }, [project, session]);
}
