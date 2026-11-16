import type { WatchProjectOptions } from '@tastir/live-room/client';
import { act, cleanup, renderHook } from '@testing-library/react';

const room = vi.hoisted(() => ({ stop: vi.fn(), watch: vi.fn() }));
vi.mock('@tastir/live-room/client', () => ({ watchProject: room.watch }));

beforeEach(() => {
  vi.stubEnv('VITE_TASTIR_STUDIO', 'hosted');
  vi.resetModules();
  vi.useFakeTimers();
  room.stop.mockClear();
  room.watch.mockReset().mockImplementation(() => room.stop);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it('stops signed-out background requests across timers, visibility changes and remounts', async () => {
  const fetch = vi.fn(
    async () =>
      new Response('{}', {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
  );
  vi.stubGlobal('fetch', fetch);
  const client = await import('./client');
  const first = renderHook(() => client.useStudioEvents(vi.fn()));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(12000);
  });
  expect(fetch).toHaveBeenCalledTimes(1);
  first.unmount();
  renderHook(() => client.useStudioEvents(vi.fn()));
  await act(async () => {
    document.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(12000);
  });
  await expect(client.studioCall('GET', '/projects')).rejects.toBeInstanceOf(
    client.SignedOut,
  );
  expect(fetch).toHaveBeenCalledTimes(1);
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
const settle = async () => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
};

it('shares the initial session check between simultaneous protected callers', async () => {
  const fetch = vi.fn(async (url: string) =>
    url === '/api/me' ? json({ live: false }) : json([]),
  );
  vi.stubGlobal('fetch', fetch);
  const client = await import('./client');
  await Promise.all([
    client.studioCall('GET', '/projects'),
    client.studioCall('GET', '/contests'),
  ]);
  expect(fetch.mock.calls.filter(([u]) => u === '/api/me')).toHaveLength(1);
});

it('stops on session expiry and resumes only after explicit successful verification', async () => {
  let expired = false;
  const fetch = vi.fn(async (url: string) =>
    expired
      ? json({}, 401)
      : url === '/api/me'
        ? json({ live: false })
        : json([]),
  );
  vi.stubGlobal('fetch', fetch);
  const client = await import('./client');
  renderHook(() => client.useStudioEvents(vi.fn()));
  await settle();
  expired = true;
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000);
  });
  const count = fetch.mock.calls.length;
  await act(async () => {
    document.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(60000);
  });
  await expect(
    client.studioCall('POST', '/projects', {}),
  ).rejects.toBeInstanceOf(client.SignedOut);
  expect(fetch).toHaveBeenCalledTimes(count);
  expired = false;
  await act(async () => {
    await client.verifyStudioSession();
  });
  expect(fetch.mock.calls.filter(([u]) => u === '/api/me')).toHaveLength(2);
  await settle();
  expect(fetch.mock.calls.length).toBeGreaterThan(count + 1);
});

it('does not mount protected polling after a connection failure and can retry', async () => {
  let unavailable = true;
  const fetch = vi.fn(async (url: string) =>
    unavailable
      ? json({ error: 'Unavailable' }, 503)
      : url === '/api/me'
        ? json({ live: false })
        : json([]),
  );
  vi.stubGlobal('fetch', fetch);
  const client = await import('./client');
  const state = renderHook(() => {
    client.useStudioEvents(vi.fn());
    return client.useStudioSignedIn();
  });
  await settle();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(60000);
  });
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(state.result.current).toBeUndefined();
  unavailable = false;
  await act(async () => {
    await client.verifyStudioSession();
  });
  expect(state.result.current).toBe(true);
  expect(fetch.mock.calls.some(([u]) => u === '/api/projects')).toBe(true);
});

it('backs off transient polling errors without treating them as sign-out', async () => {
  const fetch = vi.fn(async (url: string) =>
    url === '/api/me' ? json({ live: false }) : json({ error: 'Busy' }, 503),
  );
  vi.stubGlobal('fetch', fetch);
  const client = await import('./client');
  const state = renderHook(() => {
    client.useStudioEvents(vi.fn());
    return client.useStudioSignedIn();
  });
  await settle();
  expect(fetch).toHaveBeenCalledTimes(2);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1999);
  });
  expect(fetch).toHaveBeenCalledTimes(2);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1);
  });
  expect(fetch).toHaveBeenCalledTimes(3);
  expect(state.result.current).toBe(true);
});

it('a late successful session check cannot undo a newer 401', async () => {
  let resolve: (response: Response) => void = () => undefined;
  const fetch = vi.fn(async () => json({ live: false }));
  vi.stubGlobal('fetch', fetch);
  const client = await import('./client');
  await client.verifyStudioSession();
  fetch.mockImplementationOnce(
    () =>
      new Promise<Response>((r) => {
        resolve = r;
      }),
  );
  const stale = client.verifyStudioSession();
  const assertion = expect(stale).rejects.toBeInstanceOf(client.SignedOut);
  fetch.mockImplementationOnce(async () => json({}, 401));
  await expect(client.studioCall('GET', '/projects')).rejects.toBeInstanceOf(
    client.SignedOut,
  );
  resolve(json({ live: true }));
  await assertion;
  const count = fetch.mock.calls.length;
  await expect(client.studioCall('GET', '/projects')).rejects.toBeInstanceOf(
    client.SignedOut,
  );
  expect(fetch).toHaveBeenCalledTimes(count);
  await client.verifyStudioSession();
  await expect(client.studioCall('GET', '/projects')).resolves.toEqual({
    live: false,
  });
});

it('visibility changes do not overlap an in-flight poll and returning to the tab resumes it', async () => {
  let resolve: (response: Response) => void = () => undefined;
  let waiting = true;
  const fetch = vi.fn(async (url: string) =>
    url === '/api/me'
      ? json({ live: false })
      : waiting
        ? new Promise<Response>((r) => {
            resolve = r;
          })
        : json([]),
  );
  vi.stubGlobal('fetch', fetch);
  const client = await import('./client');
  renderHook(() => client.useStudioEvents(vi.fn()));
  await settle();
  await act(async () => {
    document.dispatchEvent(new Event('visibilitychange'));
  });
  expect(fetch).toHaveBeenCalledTimes(2);
  waiting = false;
  await act(async () => {
    resolve(json([]));
  });
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000);
  });
  expect(fetch).toHaveBeenCalledTimes(2);
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  await act(async () => {
    document.dispatchEvent(new Event('visibilitychange'));
  });
  expect(fetch).toHaveBeenCalledTimes(3);
  vi.restoreAllMocks();
});

it.each(['ticket', 'pulse'] as const)(
  'stops live-room %s requests after sign-out',
  async (kind) => {
    const fetch = vi.fn(async () => json({ live: true }));
    vi.stubGlobal('fetch', fetch);
    const client = await import('./client');
    await client.verifyStudioSession();
    renderHook(() => client.useStudioEvents(vi.fn(), 'project-1'));
    const options = room.watch.mock.calls[0]?.[0] as
      WatchProjectOptions | undefined;
    if (!options) throw new Error('Live watcher was not started.');
    const request = kind === 'ticket' ? options.getTicket : options.refresh;
    fetch.mockImplementationOnce(async () => json({}, 401));
    await act(async () => {
      await expect(
        request(new AbortController().signal),
      ).rejects.toBeInstanceOf(client.SignedOut);
    });
    expect(room.stop).toHaveBeenCalledTimes(1);
    const count = fetch.mock.calls.length;
    await expect(request(new AbortController().signal)).rejects.toBeInstanceOf(
      client.SignedOut,
    );
    expect(fetch).toHaveBeenCalledTimes(count);
  },
);

it('aborts a polling request on unmount and ignores its late response', async () => {
  let resolve: (response: Response) => void = () => undefined;
  const fetch = vi.fn(async (url: string, _init?: RequestInit) =>
    url === '/api/me'
      ? json({ live: false })
      : new Promise<Response>((r) => {
          resolve = r;
        }),
  );
  vi.stubGlobal('fetch', fetch);
  const client = await import('./client');
  const changed = vi.fn();
  const hook = renderHook(() => client.useStudioEvents(changed));
  await settle();
  const signal = fetch.mock.calls[1]?.[1]?.signal;
  hook.unmount();
  expect(signal?.aborted).toBe(true);
  await act(async () => {
    resolve(json([]));
    await vi.advanceTimersByTimeAsync(10000);
  });
  expect(changed).not.toHaveBeenCalled();
  expect(fetch).toHaveBeenCalledTimes(2);
});
