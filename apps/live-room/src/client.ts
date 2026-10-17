import {
  ROOM_PROTOCOL,
  parseRoomMessage,
  validProject,
  validRevision,
  type ConnectionTicket,
} from './protocol.js';
export type { ConnectionTicket } from './protocol.js';
export type RoomStatus = 'connecting' | 'live' | 'polling' | 'stopped';
export interface WatchProjectOptions {
  project: string;
  /** Fetch from an authenticated Studio endpoint which checks access to this project. */
  getTicket(signal: AbortSignal): Promise<ConnectionTicket | null>;
  /** Refetch/apply authoritative Studio state. Respect signal before updating the page. */
  refresh(signal: AbortSignal): Promise<number>;
  initialRevision?: number;
  onStatus?(status: RoomStatus): void;
  pollEveryMs?: number;
  reconcileEveryMs?: number;
  /** Optional transport seam for tests; normally the native browser WebSocket. */
  createSocket?(url: string, protocols: string[]): WebSocket;
}
function aborted(signal: AbortSignal): Promise<never> {
  return new Promise((_, reject) => {
    if (signal.aborted) {
      reject(new Error('Request cancelled'));
      return;
    }
    signal.addEventListener(
      'abort',
      () => reject(new Error('Request cancelled')),
      { once: true },
    );
  });
}
/** Starts immediately. Call the returned cleanup function on navigation/unmount. */
export function watchProject(options: WatchProjectOptions): () => void {
  if (!validProject(options.project)) throw new Error('Invalid project ID');
  const pollMs = options.pollEveryMs ?? 3000;
  const reconcileMs = options.reconcileEveryMs ?? 60_000;
  if (
    pollMs < 1000 ||
    reconcileMs < pollMs ||
    !Number.isFinite(pollMs) ||
    !Number.isFinite(reconcileMs)
  ) {
    throw new Error('Invalid polling interval');
  }
  let stopped = false;
  let live = false;
  let socket: WebSocket | undefined;
  let attempt = 0;
  let applied = options.initialRevision ?? 0;
  if (!validRevision(applied)) throw new Error('Invalid initial revision');
  let wanted = applied;
  let refreshing = false;
  let needsRefresh = true;
  let refreshAgain = false;
  let status: RoomStatus | undefined;
  const lifetime = new AbortController();
  const timeouts = new Set<ReturnType<typeof setTimeout>>();
  const socketTimers = new Set<ReturnType<typeof setTimeout>>();
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let waitingForPong: ReturnType<typeof setTimeout> | undefined;
  function report(next: RoomStatus): void {
    if (next !== status) {
      status = next;
      options.onStatus?.(next);
    }
  }
  function later(
    fn: () => void,
    ms: number,
    connection = false,
  ): ReturnType<typeof setTimeout> {
    const timer = setTimeout(() => {
      timeouts.delete(timer);
      socketTimers.delete(timer);
      if (!stopped) fn();
    }, ms);
    timeouts.add(timer);
    if (connection) socketTimers.add(timer);
    return timer;
  }
  function cancel(timer: ReturnType<typeof setTimeout> | undefined): void {
    if (timer !== undefined) {
      clearTimeout(timer);
      timeouts.delete(timer);
      socketTimers.delete(timer);
    }
  }
  async function refresh(): Promise<void> {
    if (stopped) return;
    if (refreshing) {
      refreshAgain = true;
      return;
    }
    refreshing = true;
    const read = new AbortController();
    const abort = () => read.abort();
    lifetime.signal.addEventListener('abort', abort, { once: true });
    const deadline = later(abort, 10_000);
    try {
      const revision = await Promise.race([
        options.refresh(read.signal),
        aborted(read.signal),
      ]);
      if (!stopped && validRevision(revision)) {
        applied = Math.max(applied, revision);
        needsRefresh = false;
      } else if (!stopped) needsRefresh = true;
    } catch {
      needsRefresh = true; /* Polling retries; live notifications are only hints. */
    } finally {
      cancel(deadline);
      lifetime.signal.removeEventListener('abort', abort);
      refreshing = false;
      if (refreshAgain && !stopped) {
        refreshAgain = false;
        void refresh();
      }
    }
  }
  function detach(): void {
    live = false;
    for (const timer of socketTimers) {
      clearTimeout(timer);
      timeouts.delete(timer);
    }
    socketTimers.clear();
    clearInterval(heartbeat);
    heartbeat = undefined;
    waitingForPong = undefined;
    const old = socket;
    socket = undefined;
    if (old) {
      old.onopen = old.onmessage = old.onerror = old.onclose = null;
      try {
        old.close(1000, 'Reconnect');
      } catch {
        /* Transport already closed. */
      }
    }
  }
  function retry(): void {
    if (stopped) return;
    detach();
    report('polling');
    void refresh();
    const delay = Math.min(30_000, 1000 * 2 ** Math.min(attempt++, 5));
    later(
      () => {
        void connect();
      },
      delay * (0.8 + Math.random() * 0.4),
    );
  }
  async function connect(): Promise<void> {
    if (stopped) return;
    report('connecting');
    const auth = new AbortController();
    const abort = () => auth.abort();
    lifetime.signal.addEventListener('abort', abort, { once: true });
    const deadline = later(() => auth.abort(), 5000);
    try {
      // The deadline also handles a provider that fails to honour AbortSignal.
      const ticket = await Promise.race([
        options.getTicket(auth.signal),
        aborted(auth.signal),
      ]);
      if (stopped) return;
      if (
        !ticket ||
        !Number.isFinite(ticket.expiresAt) ||
        ticket.expiresAt * 1000 <= Date.now() + 1000 ||
        !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(ticket.ticket) ||
        ticket.ticket.length > 2048
      )
        throw new Error('Invalid ticket');
      const url = new URL(ticket.url);
      if (
        (url.protocol !== 'wss:' &&
          !(
            url.protocol === 'ws:' &&
            ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
          )) ||
        url.pathname !== `/projects/${options.project}/connect` ||
        url.search ||
        url.hash ||
        url.username ||
        url.password
      )
        throw new Error('Invalid room URL');
      const current = (
        options.createSocket ??
        ((address, protocols) => new WebSocket(address, protocols))
      )(ticket.url, [ROOM_PROTOCOL, `ticket.${ticket.ticket}`]);
      socket = current;
      const opening = later(retry, 5000, true);
      current.onopen = () => {
        if (stopped || socket !== current) return;
        cancel(opening);
        attempt = 0;
        live = true;
        report('live');
        void refresh(); // Repair edits made between the last read and subscribing.
        const remaining = ticket.expiresAt * 1000 - Date.now();
        later(
          () => {
            detach();
            void connect();
          },
          Math.max(100, remaining - Math.min(5000, remaining / 5)),
          true,
        );
        heartbeat = setInterval(() => {
          if (waitingForPong !== undefined) return;
          try {
            current.send('ping');
            waitingForPong = later(retry, 10_000, true);
          } catch {
            retry();
          }
        }, 25_000);
      };
      current.onmessage = (event) => {
        if (stopped || socket !== current) return;
        if (event.data === 'pong') {
          cancel(waitingForPong);
          waitingForPong = undefined;
          return;
        }
        const message =
          typeof event.data === 'string' ? parseRoomMessage(event.data) : null;
        if (!message || message.project !== options.project) {
          retry();
          return;
        }
        if (message.revision > applied) {
          wanted = Math.max(wanted, message.revision);
          void refresh();
        }
      };
      current.onclose = current.onerror = () => {
        if (socket === current) retry();
      };
    } catch {
      if (!stopped) retry();
    } finally {
      cancel(deadline);
      lifetime.signal.removeEventListener('abort', abort);
    }
  }
  // Periodic reconciliation also repairs a lost server notification on a healthy socket.
  const polling = setInterval(() => {
    if (!live || needsRefresh || wanted > applied) void refresh();
  }, pollMs);
  const reconcile = setInterval(() => {
    if (live) void refresh();
  }, reconcileMs);
  void refresh();
  void connect();
  return () => {
    if (stopped) return;
    stopped = true;
    lifetime.abort();
    detach();
    clearInterval(polling);
    clearInterval(reconcile);
    for (const timer of timeouts) clearTimeout(timer);
    timeouts.clear();
    report('stopped');
  };
}
