import { act, render, screen, within } from '@testing-library/react';
import example from '@tutorials/eight-fold-star-and-cross.json';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import App from './app';
import { entriesOf, LIBRARY } from './library';

// Tests run from apps/player or from the repo root.
const TUTORIALS = join(
  process.cwd().replace(/\/apps\/player$/, ''),
  'tutorials',
);

/** Moves the address to `hash`, as clicking a link would. */
function go(hash: string) {
  act(() => {
    window.location.hash = hash;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
}

afterEach(() => {
  window.location.hash = '';
});

describe('the library', () => {
  it('lists every file in tutorials/', () => {
    const files = readdirSync(TUTORIALS)
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace(/\.json$/, ''))
      .sort();
    expect(LIBRARY.map((e) => e.id)).toEqual(files);
  });

  it('shows a new tutorial with no code change', () => {
    const extra = {
      ...(structuredClone(example) as object),
      id: 'another-star',
      title: 'Another star',
    };
    const entries = entriesOf({
      '../../../../tutorials/eight-fold-star-and-cross.json': example,
      '../../../../tutorials/another-star.json': extra,
    });
    render(<App entries={entries} />);
    const cards = within(screen.getByRole('list')).getAllByRole('link');
    expect(cards.map((c) => c.getAttribute('href'))).toEqual([
      '#/another-star',
      '#/eight-fold-star-and-cross',
    ]);
    expect(screen.getByRole('heading', { name: 'Another star' })).toBeTruthy();
    // On the dev server the library also links to the overnight review.
    expect(
      screen
        .getByRole('link', { name: /Overnight review/ })
        .getAttribute('href'),
    ).toBe('#/review');
    expect(
      screen.getAllByText('8-fold · Moroccan · beginner · 6 steps'),
    ).toHaveLength(2);
    // Each card has a picture of the colored pattern.
    expect(
      document.querySelectorAll('svg.thumbnail polygon.piece').length,
    ).toBeGreaterThan(0);
  });

  it('keeps a card for a tutorial that cannot be played, with the reason', () => {
    const broken = structuredClone(example) as {
      steps: { create: Record<string, unknown> }[];
    };
    (broken.steps[1] as { create: Record<string, unknown> }).create.E = {
      point: { meet: ['c', 'h'] },
    };
    render(<App entries={entriesOf({ 'x/broken.json': broken })} />);
    expect(
      screen.getByText(/Cannot be played: Step 2, element "E"/),
    ).toBeTruthy();
  });
});

describe('the address', () => {
  it('plays the tutorial it names, and returns to the library', () => {
    render(<App />);
    go('#/eight-fold-star-and-cross');
    expect(
      screen.getByRole('heading', { name: 'Eight-fold star and cross' }),
    ).toBeTruthy();
    expect(document.querySelector('.label')?.textContent).toBe('Step 1 of 6');
    go('#/');
    expect(screen.getByRole('heading', { name: 'Tastir' })).toBeTruthy();
  }, 15000); // with the library; a busy machine can push it past the default 5 s. // The library computes every tutorial in tutorials/, so this grows

  it('opens the tutorial in the address on load', () => {
    window.location.hash = '#/eight-fold-star-and-cross';
    render(<App />);
    expect(document.querySelector('.label')?.textContent).toBe('Step 1 of 6');
  });

  it('says so when no tutorial has that name', () => {
    render(<App />);
    go('#/no-such-pattern');
    expect(
      screen.getByText('There is no tutorial called "no-such-pattern".'),
    ).toBeTruthy();
  });
});
