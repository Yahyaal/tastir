import { useEffect, useState } from 'react';

/**
 * Light or dark. The app starts in the device's setting and follows it
 * until the learner picks one with the switch; that choice is remembered in
 * this browser. index.html sets the same attribute before the first paint,
 * so a dark page never flashes light.
 */
export type Theme = 'light' | 'dark';

const KEY = 'tastir.theme';

const isTheme = (x: unknown): x is Theme => x === 'light' || x === 'dark';

/** The theme picked with the switch, or null when the device decides. */
export function savedTheme(): Theme | null {
  try {
    const saved: unknown = JSON.parse(
      window.localStorage.getItem(KEY) ?? 'null',
    );
    return isTheme(saved) ? saved : null;
  } catch {
    return null;
  }
}

const darkQuery = () =>
  typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;

/** The device's setting; light when the browser cannot say. */
export function deviceTheme(): Theme {
  return darkQuery()?.matches ? 'dark' : 'light';
}

/** Puts the theme on the page: the colours follow `data-theme` on <html>. */
export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'dark' ? '#0f1820' : '#f4ede1');
}

/** The theme in use, and a way to pick one (remembered in this browser). */
export function useTheme(): [Theme, (theme: Theme) => void] {
  const [picked, setPicked] = useState<Theme | null>(savedTheme);
  const [device, setDevice] = useState<Theme>(deviceTheme);
  const theme = picked ?? device;

  // Until the learner picks, follow the device when its setting changes.
  useEffect(() => {
    const query = darkQuery();
    if (!query) return;
    const follow = () => setDevice(query.matches ? 'dark' : 'light');
    query.addEventListener?.('change', follow);
    return () => query.removeEventListener?.('change', follow);
  }, []);

  useEffect(() => applyTheme(theme), [theme]);

  const pick = (next: Theme) => {
    setPicked(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // Not remembered, but used for this visit.
    }
  };
  return [theme, pick];
}

/** The sun and moon button in every header. */
export function ThemeSwitch() {
  const [theme, pick] = useTheme();
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      className="theme-switch"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
      onClick={() => pick(dark ? 'light' : 'dark')}
    >
      {dark ? (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
        </svg>
      )}
    </button>
  );
}
