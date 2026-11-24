import { timingSafeEqual } from 'node:crypto';

/**
 * Small checks shared by the hosted studio's sign-in and form handlers.
 */

/**
 * Only a path on this site may be returned to after signing in. Browsers
 * read a backslash as a slash, so `/\evil.com` would leave the site, and a
 * control character can split a header; both are refused.
 */
export const safeNext = (value: unknown): string =>
  typeof value === 'string' &&
  value.startsWith('/') &&
  !value.startsWith('//') &&
  // eslint-disable-next-line no-control-regex
  !/[\\\u0000-\u001f\u007f]/.test(value)
    ? value
    : '/connections';

/** Compares two secrets in constant time. */
export const sameSecret = (a: unknown, b: string): boolean => {
  if (typeof a !== 'string') return false;
  const first = Buffer.from(a);
  const second = Buffer.from(b);
  return first.length === second.length && timingSafeEqual(first, second);
};
