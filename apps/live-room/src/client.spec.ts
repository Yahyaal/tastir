import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  watchProject,
  type WatchProjectOptions,
  type RoomStatus,
} from './client.js';
class FakeSocket {
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  sent: string[] = [];
  closed = false;
  send(value: string): void {
    this.sent.push(value);
  }
  close(): void {
    this.closed = true;
  }
  message(value: unknown): void {
    this.onmessage?.({
      data: typeof value === 'string' ? value : JSON.stringify(value),
    });
  }
}
let sockets: FakeSocket[];
let cleanups: (() => void)[];
let statuses: RoomStatus[];
const ticket = () => ({
  url: 'wss://room.example/projects/p1/connect',
  ticket: 'payload.signature',
  expiresAt: Math.floor(Date.now() / 1000) + 120,
});
function start(overrides: Partial<WatchProjectOptions> = {}) {
  const refresh = vi.fn().mockResolvedValue(0);
  const getTicket = vi.fn(async () => ticket());
  const factory = vi.fn(() => {
    const socket = new FakeSocket();
    sockets.push(socket);
    return socket as unknown as WebSocket;
  });
  const stop = watchProject({
    project: 'p1',
    getTicket,
    refresh,
    createSocket: factory,
    onStatus: (status) => statuses.push(status),
    ...overrides,
  });
  cleanups.push(stop);
  return { refresh, getTicket, factory, stop };
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-17T12:00:00Z'));
  sockets = [];
  cleanups = [];
  statuses = [];
});
afterEach(() => {
  for (const stop of cleanups) stop();
  vi.useRealTimers();
});
describe('page live room client', () => {
  it('polls when unavailable, reconnects and passes tickets as subprotocols', async () => {
    const app = start();
    await vi.advanceTimersByTimeAsync(0);
    expect(app.factory).toHaveBeenCalledWith(ticket().url, [
      'tastir.live.v1',
      'ticket.payload.signature',
    ]);
    sockets[0]!.onerror?.();
    await vi.advanceTimersByTimeAsync(3000);
    expect(app.refresh.mock.calls.length).toBeGreaterThanOrEqual(3);
    expect(sockets.length).toBeGreaterThan(1);
    sockets.at(-1)!.onopen?.();
    await vi.advanceTimersByTimeAsync(0);
    expect(statuses.at(-1)).toBe('live');
    const count = app.refresh.mock.calls.length;
    await vi.advanceTimersByTimeAsync(3000);
    expect(app.refresh).toHaveBeenCalledTimes(count);
    app.stop();
    const stoppedCount = app.refresh.mock.calls.length;
    await vi.advanceTimersByTimeAsync(120_000);
    expect(app.refresh).toHaveBeenCalledTimes(stoppedCount);
    expect(statuses.at(-1)).toBe('stopped');
    expect(vi.getTimerCount()).toBe(0);
  });
  it('refetches for newer revisions, ignores duplicates and reconciles even if a publish was lost', async () => {
    const app = start({ initialRevision: 2 });
    app.refresh.mockResolvedValue(2);
    await vi.advanceTimersByTimeAsync(0);
    sockets[0]!.onopen?.();
    await vi.advanceTimersByTimeAsync(0);
    const count = app.refresh.mock.calls.length;
    sockets[0]!.message({ type: 'revision', project: 'p1', revision: 2 });
    expect(app.refresh).toHaveBeenCalledTimes(count);
    app.refresh.mockResolvedValue(3);
    sockets[0]!.message({ type: 'revision', project: 'p1', revision: 3 });
    await vi.advanceTimersByTimeAsync(0);
    expect(app.refresh).toHaveBeenCalledTimes(count + 1);
    // Answer automatic heartbeat probes so this remains a healthy connection.
    await vi.advanceTimersByTimeAsync(25_000);
    sockets[0]!.message('pong');
    await vi.advanceTimersByTimeAsync(25_000);
    sockets[0]!.message('pong');
    await vi.advanceTimersByTimeAsync(10_000);
    expect(app.refresh).toHaveBeenCalledTimes(count + 2);
  });
  it('coalesces reads and polls until the authoritative source catches a hint', async () => {
    let finish!: (revision: number) => void;
    const refresh = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<number>((resolve) => {
            finish = resolve;
          }),
      )
      .mockResolvedValue(1);
    start({ refresh });
    await vi.advanceTimersByTimeAsync(0);
    sockets[0]!.onopen?.();
    sockets[0]!.message({ type: 'revision', project: 'p1', revision: 5 });
    sockets[0]!.message({ type: 'revision', project: 'p1', revision: 6 });
    expect(refresh).toHaveBeenCalledTimes(1);
    finish(1);
    await vi.advanceTimersByTimeAsync(0);
    expect(refresh).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(3000);
    expect(refresh).toHaveBeenCalledTimes(3);
    refresh.mockResolvedValue(6);
    await vi.advanceTimersByTimeAsync(3000);
    const count = refresh.mock.calls.length;
    await vi.advanceTimersByTimeAsync(3000);
    expect(refresh).toHaveBeenCalledTimes(count);
  });
  it('detects half-open sockets, renews expiring tickets and aborts pending work on cleanup', async () => {
    const app = start();
    await vi.advanceTimersByTimeAsync(0);
    sockets[0]!.onopen?.();
    await vi.advanceTimersByTimeAsync(25_000);
    expect(sockets[0]!.sent).toEqual(['ping']);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(sockets[0]!.closed).toBe(true);
    await vi.advanceTimersByTimeAsync(1300);
    expect(app.getTicket.mock.calls.length).toBeGreaterThan(1);
    app.stop();
    let signal: AbortSignal | undefined;
    const pending = start({
      getTicket: (value) => {
        signal = value;
        return new Promise(() => undefined);
      },
    });
    await vi.advanceTimersByTimeAsync(0);
    pending.stop();
    expect(signal?.aborted).toBe(true);
    await vi.advanceTimersByTimeAsync(0);
    expect(vi.getTimerCount()).toBe(0);
  });
  it('renews a short lease before expiry and rejects a cross-project or malformed event', async () => {
    const app = start({
      getTicket: async () => ({
        ...ticket(),
        expiresAt: Math.floor(Date.now() / 1000) + 10,
      }),
    });
    await vi.advanceTimersByTimeAsync(0);
    sockets[0]!.onopen?.();
    await vi.advanceTimersByTimeAsync(8000);
    expect(sockets[0]!.closed).toBe(true);
    expect(sockets.length).toBe(2);
    sockets[1]!.onopen?.();
    sockets[1]!.message({ type: 'revision', project: 'other', revision: 999 });
    expect(sockets[1]!.closed).toBe(true);
    expect(statuses.at(-1)).toBe('polling');
    app.stop();
  });
  it('retries failed authoritative reads even when the socket is healthy', async () => {
    const refresh = vi.fn().mockRejectedValue(new Error('Studio unavailable'));
    start({ refresh });
    await vi.advanceTimersByTimeAsync(0);
    sockets[0]!.onopen?.();
    await vi.advanceTimersByTimeAsync(0);
    const count = refresh.mock.calls.length;
    await vi.advanceTimersByTimeAsync(3000);
    expect(refresh).toHaveBeenCalledTimes(count + 1);
    refresh.mockResolvedValue(1);
    await vi.advanceTimersByTimeAsync(3000);
    const recovered = refresh.mock.calls.length;
    await vi.advanceTimersByTimeAsync(3000);
    expect(refresh).toHaveBeenCalledTimes(recovered);
  });
  it('aborts a hung read and lets a later refresh recover', async () => {
    let signal: AbortSignal | undefined;
    const refresh = vi
      .fn()
      .mockImplementationOnce((value: AbortSignal) => {
        signal = value;
        return new Promise(() => undefined);
      })
      .mockResolvedValue(1);
    start({ refresh });
    await vi.advanceTimersByTimeAsync(0);
    sockets[0]!.onopen?.();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(signal?.aborted).toBe(true);
    expect(refresh).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(3000);
    expect(refresh).toHaveBeenCalledTimes(2);
  });
  it('keeps polling when ticket retrieval is disabled or hangs', async () => {
    const getTicket = vi
      .fn()
      .mockResolvedValueOnce(null)
      .mockImplementation(() => new Promise(() => undefined));
    const app = start({ getTicket });
    await vi.advanceTimersByTimeAsync(12_000);
    expect(app.refresh.mock.calls.length).toBeGreaterThanOrEqual(5);
    expect(getTicket.mock.calls.length).toBeGreaterThan(1);
    expect(sockets).toHaveLength(0);
  });
});
