import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ThemeSwitch, applyTheme, deviceTheme, savedTheme } from './theme';

/** A device that prefers dark (or not), and lets the test change its mind. */
function device(dark: boolean) {
  const listeners = new Set<() => void>();
  const query = {
    matches: dark,
    addEventListener: (_: string, f: () => void) => listeners.add(f),
    removeEventListener: (_: string, f: () => void) => listeners.delete(f),
  };
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => query),
  );
  return (next: boolean) => {
    query.matches = next;
    listeners.forEach((f) => f());
  };
}

afterEach(() => {
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
  vi.unstubAllGlobals();
});

describe('the light and dark themes', () => {
  it('starts in the device’s setting and follows it until one is picked', () => {
    const change = device(true);
    expect(savedTheme()).toBeNull();
    expect(deviceTheme()).toBe('dark');
    render(<ThemeSwitch />);
    expect(document.documentElement.dataset.theme).toBe('dark');
    act(() => change(false));
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('switches with the button and remembers the choice', () => {
    const change = device(false);
    render(<ThemeSwitch />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Switch to dark mode' }),
    );
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(savedTheme()).toBe('dark');
    // A picked theme no longer follows the device.
    act(() => change(false));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(
      screen.getByRole('button', { name: 'Switch to light mode' }),
    ).toBeTruthy();
  });

  it('reads a broken saved value as no choice', () => {
    device(false);
    window.localStorage.setItem('tastir.theme', '"purple"');
    expect(savedTheme()).toBeNull();
    window.localStorage.setItem('tastir.theme', '{not json');
    expect(savedTheme()).toBeNull();
  });

  it('puts the theme on <html>', () => {
    applyTheme('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    applyTheme('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});
