/** Public wire contract. The room carries revision hints, never project contents. */
export const ROOM_PROTOCOL = 'tastir.live.v1';
export const MAX_TICKET_SECONDS = 120;
export const MAX_TOKEN_LENGTH = 2048;
export interface ConnectionTicket {
  url: string;
  ticket: string;
  /** Unix timestamp in seconds. */
  expiresAt: number;
}
export interface RoomMessage {
  type: 'ready' | 'revision';
  project: string;
  revision: number;
}
export function validProject(value: unknown): value is string {
  return (
    typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(value)
  );
}
export function validRevision(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}
export function parseRoomMessage(value: string): RoomMessage | null {
  if (value.length > 512) return null;
  try {
    const message = JSON.parse(value);
    return message &&
      (message.type === 'ready' || message.type === 'revision') &&
      validProject(message.project) &&
      validRevision(message.revision)
      ? message
      : null;
  } catch {
    return null;
  }
}
