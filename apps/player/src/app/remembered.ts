import { useEffect, useState } from 'react';

/**
 * A setting this browser remembers between visits. Storage can be missing
 * or blocked (a private window), so every read and write may fail quietly
 * and the setting then lasts only for the visit.
 */
export function useRemembered<T extends string | boolean>(
  key: string,
  initial: T,
  { override, persist = true }: { override?: T; persist?: boolean } = {},
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    if (override !== undefined) return override;
    try {
      const saved = window.localStorage.getItem(`tastir.${key}`);
      if (saved !== null) {
        const parsed: unknown = JSON.parse(saved);
        if (typeof parsed === typeof initial) return parsed as T;
      }
    } catch {
      // Fall back to the default.
    }
    return initial;
  });
  useEffect(() => {
    if (!persist) return;
    try {
      window.localStorage.setItem(`tastir.${key}`, JSON.stringify(value));
    } catch {
      // Not remembered, but still used for this visit.
    }
  }, [key, value, persist]);
  return [value, setValue];
}
