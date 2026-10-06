import { useEffect, useState } from 'react';

/**
 * A setting this browser remembers between visits. Storage can be missing
 * or blocked (a private window), so every read and write may fail quietly
 * and the setting then lasts only for the visit.
 */
export function useRemembered<T extends string | boolean>(
  key: string,
  initial: T,
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = window.localStorage.getItem(`tastir.${key}`);
      if (saved !== null) return JSON.parse(saved) as T;
    } catch {
      // Fall back to the default.
    }
    return initial;
  });
  useEffect(() => {
    try {
      window.localStorage.setItem(`tastir.${key}`, JSON.stringify(value));
    } catch {
      // Not remembered, but still used for this visit.
    }
  }, [key, value]);
  return [value, setValue];
}
