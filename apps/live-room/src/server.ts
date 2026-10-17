/** Server-only helpers. Keep this module and LIVE_ROOM_SECRET out of the page bundle. */
import {
  type ConnectionTicket,
  validProject,
  validRevision,
} from './protocol.js';
import { exactOrigin, lease, signClaims } from './signing.js';
interface SigningOptions {
  secret: string;
  project: string;
  ttlSeconds?: number;
  nowSeconds?: number;
}
export async function issueRoomTicket(
  options: SigningOptions & { origin: string },
): Promise<{ ticket: string; expiresAt: number }> {
  if (!validProject(options.project)) throw new Error('Invalid project ID');
  const times = lease(options.ttlSeconds, options.nowSeconds);
  const ticket = await signClaims(options.secret, {
    v: 1,
    purpose: 'subscribe',
    project: options.project,
    origin: exactOrigin(options.origin),
    ...times,
  });
  return { ticket, expiresAt: times.expiresAt };
}
export async function signRevisionNotification(
  options: SigningOptions & { revision: number },
): Promise<string> {
  if (
    !validProject(options.project) ||
    !validRevision(options.revision) ||
    options.revision < 1
  )
    throw new Error('Invalid revision');
  return signClaims(options.secret, {
    v: 1,
    purpose: 'revision',
    project: options.project,
    revision: options.revision,
    ...lease(options.ttlSeconds, options.nowSeconds),
  });
}
export async function createConnectionTicket(
  options: SigningOptions & { origin: string; roomOrigin: string },
): Promise<ConnectionTicket> {
  const origin = exactOrigin(options.roomOrigin);
  const ticket = await issueRoomTicket(options);
  return {
    ...ticket,
    url: `${origin.replace(/^http/, 'ws')}/projects/${options.project}/connect`,
  };
}
/** Call AFTER committing the edit, with a platform background-task hook where available.
 * Failure must never turn a committed save into a reported failure. Polling repairs missed hints.
 */
export async function notifyRevision(
  options: SigningOptions & {
    roomOrigin: string;
    revision: number;
    signal?: AbortSignal;
  },
): Promise<boolean> {
  try {
    const origin = exactOrigin(options.roomOrigin);
    const token = await signRevisionNotification(options);
    const signal = options.signal
      ? AbortSignal.any([options.signal, AbortSignal.timeout(2000)])
      : AbortSignal.timeout(2000);
    const response = await fetch(
      `${origin}/projects/${options.project}/revisions`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        signal,
        redirect: 'error',
      },
    );
    await response.body?.cancel();
    return response.ok;
  } catch {
    return false;
  }
}
