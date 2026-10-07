/**
 * A list kept in localStorage under one key (the learner's designs, their
 * patterns). Storage can be missing or blocked (a private window) and a
 * store can be corrupt, so reads never throw and read anything broken as
 * nothing, and writes report whether the browser kept the list.
 */
export interface Store<T> {
  /** Every readable entry, in stored order. */
  readonly list: () => T[];
  /** Writes the entries; false when the browser refused to keep them. */
  readonly write: (items: readonly T[]) => boolean;
  /** Where a store that could not be read is kept before it is replaced. */
  readonly backup: string;
  /** Whether a store that could not be read has been kept aside. */
  readonly unreadableKept: () => boolean;
}

export function store<T>(
  key: string,
  isItem: (x: unknown) => x is T,
): Store<T> {
  const backup = `${key}.unreadable`;

  /**
   * Whether the stored value holds anything this version cannot read: not
   * JSON, not a list, or a list with entries this version does not know.
   */
  const unreadable = (raw: string): boolean => {
    try {
      const saved: unknown = JSON.parse(raw);
      return !Array.isArray(saved) || !saved.every(isItem);
    } catch {
      return true;
    }
  };

  return {
    backup,
    list: () => {
      try {
        const saved: unknown = JSON.parse(
          window.localStorage.getItem(key) ?? '[]',
        );
        return Array.isArray(saved) ? saved.filter(isItem) : [];
      } catch {
        return [];
      }
    },
    // A store that could not be read (corrupt, or from a later version) is
    // never simply overwritten: it is first copied under its own backup
    // key, and if even that is refused nothing is written.
    write: (items) => {
      try {
        const storage = window.localStorage;
        const raw = storage.getItem(key);
        if (raw !== null && unreadable(raw)) {
          let to = backup;
          for (let n = 2; storage.getItem(to) !== null; n++)
            to = `${backup}.${n}`;
          storage.setItem(to, raw);
        }
        storage.setItem(key, JSON.stringify(items));
        return true;
      } catch {
        return false;
      }
    },
    unreadableKept: () => {
      try {
        return window.localStorage.getItem(backup) !== null;
      } catch {
        return false;
      }
    },
  };
}

export const now = () => new Date().toISOString();

/** A short id, unique enough for one browser's own list. */
export const newId = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
