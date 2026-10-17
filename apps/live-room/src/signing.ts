import {
  MAX_TICKET_SECONDS,
  MAX_TOKEN_LENGTH,
  validProject,
  validRevision,
} from './protocol.js';

interface BaseClaims {
  v: 1;
  project: string;
  issuedAt: number;
  expiresAt: number;
}
export interface SubscribeClaims extends BaseClaims {
  purpose: 'subscribe';
  origin: string;
}
export interface RevisionClaims extends BaseClaims {
  purpose: 'revision';
  revision: number;
}
export type Claims = SubscribeClaims | RevisionClaims;
const encoder = new TextEncoder();
const domain = 'tastir-live-room:v1.';
export function validSecret(secret: unknown): secret is string {
  return typeof secret === 'string' && /^[a-f\d]{64}$/i.test(secret);
}
async function key(secret: string): Promise<CryptoKey> {
  if (!validSecret(secret))
    throw new Error('LIVE_ROOM_SECRET must contain 64 hexadecimal characters');
  const bytes = Uint8Array.from(secret.match(/../g)!, (part) =>
    Number.parseInt(part, 16),
  );
  return crypto.subtle.importKey(
    'raw',
    bytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}
function encode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}
function decode(value: string): Uint8Array<ArrayBuffer> {
  if (!/^[A-Za-z0-9_-]+$/.test(value))
    throw new Error('Invalid token encoding');
  return Uint8Array.from(
    atob(value.replace(/-/g, '+').replace(/_/g, '/')),
    (c) => c.charCodeAt(0),
  );
}
export function exactOrigin(value: string): string {
  const url = new URL(value);
  if (
    !['https:', 'http:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.origin !== value ||
    (url.protocol === 'http:' &&
      !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))
  ) {
    throw new Error(
      'Expected an HTTPS origin (HTTP is allowed only on loopback)',
    );
  }
  return url.origin;
}
export function lease(
  ttlSeconds = 60,
  nowSeconds = Math.floor(Date.now() / 1000),
): Pick<BaseClaims, 'issuedAt' | 'expiresAt'> {
  if (
    !Number.isInteger(ttlSeconds) ||
    ttlSeconds < 1 ||
    ttlSeconds > MAX_TICKET_SECONDS ||
    !Number.isSafeInteger(nowSeconds)
  ) {
    throw new Error('Invalid ticket lifetime');
  }
  return { issuedAt: nowSeconds, expiresAt: nowSeconds + ttlSeconds };
}
function validClaims(value: unknown, now: number): value is Claims {
  if (!value || typeof value !== 'object') return false;
  const c = value as Record<string, unknown>;
  if (
    c.v !== 1 ||
    !validProject(c.project) ||
    !Number.isSafeInteger(c.issuedAt) ||
    !Number.isSafeInteger(c.expiresAt) ||
    (c.issuedAt as number) > now + 5 ||
    (c.expiresAt as number) <= now ||
    (c.expiresAt as number) <= (c.issuedAt as number) ||
    (c.expiresAt as number) - (c.issuedAt as number) > MAX_TICKET_SECONDS
  )
    return false;
  if (
    Object.keys(c).sort().join(',') !==
    (c.purpose === 'subscribe'
      ? 'expiresAt,issuedAt,origin,project,purpose,v'
      : 'expiresAt,issuedAt,project,purpose,revision,v')
  )
    return false;
  if (c.purpose === 'revision')
    return validRevision(c.revision) && c.revision > 0;
  if (c.purpose !== 'subscribe' || typeof c.origin !== 'string') return false;
  try {
    return exactOrigin(c.origin) === c.origin;
  } catch {
    return false;
  }
}
export async function signClaims(
  secret: string,
  claims: Claims,
): Promise<string> {
  const payload = encode(encoder.encode(JSON.stringify(claims)));
  const signature = await crypto.subtle.sign(
    'HMAC',
    await key(secret),
    encoder.encode(domain + payload),
  );
  return `${payload}.${encode(new Uint8Array(signature))}`;
}
export async function verifyClaims(
  secret: string,
  token: string,
  now = Math.floor(Date.now() / 1000),
): Promise<Claims | null> {
  if (token.length > MAX_TOKEN_LENGTH) return null;
  const parts = token.split('.');
  const [payload, signature] = parts;
  if (parts.length !== 2 || !payload || !signature || signature.length !== 43)
    return null;
  try {
    if (
      !(await crypto.subtle.verify(
        'HMAC',
        await key(secret),
        decode(signature),
        encoder.encode(domain + payload),
      ))
    )
      return null;
    const claims: unknown = JSON.parse(
      new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(
        decode(payload),
      ),
    );
    return validClaims(claims, now) ? claims : null;
  } catch {
    return null;
  }
}
