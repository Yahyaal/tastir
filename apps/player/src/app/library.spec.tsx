import { act, fireEvent, render, screen, within } from '@testing-library/react';
import example from '@tutorials/eight-fold-star-and-cross.json';
import khatam from '@tutorials/eight-fold-khatam.json';
import octagons from '@tutorials/eight-fold-star-and-octagon.json';
import rectangular from '@tutorials/ten-pointed-star-decagon-rect.json';
import { parseTutorial } from '@tastir/schema';
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
  window.sessionStorage.clear();
});

/** Picks an option in one of the library's menus (Level, Tradition). */
const choose = (menu: string, value: string) =>
  act(() => {
    fireEvent.change(screen.getByRole('combobox', { name: menu }), {
      target: { value },
    });
  });

describe('the library', () => {
  it.each([khatam, octagons, rectangular].map(parseTutorial))(
    'labels the approved study $id without asserting a historical match',
    async (json) => {
      const entries = entriesOf({
        [`../../../../tutorials/${json.id}.json`]: json,
      });
      render(<App entries={entries} />);
      expect(
        await screen.findByText('Historical match unverified'),
      ).toBeTruthy();
      expect(screen.getByRole('heading', { name: json.title })).toBeTruthy();
      expect(document.querySelector('.card .level')?.textContent).toBe(
        json.level === 'intermediate' ? 'Intermediate' : 'Advanced',
      );
    },
  );
  it('lists every file in tutorials/', () => {
    const files = readdirSync(TUTORIALS)
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace(/\.json$/, ''))
      .sort();
    expect(LIBRARY.map((e) => e.id)).toEqual(files);
  });

  it.each(['beginner', 'intermediate', 'advanced'])(
    'shows a new %s tutorial with no code change',
    (level) => {
      const extra = {
        ...(structuredClone(example) as object),
        id: 'another-star',
        title: 'Another star',
        level,
      };
      const entries = entriesOf({
        '../../../../tutorials/eight-fold-star-and-cross.json': example,
        '../../../../tutorials/another-star.json': extra,
      });
      render(<App entries={entries} />);
      const links = within(document.querySelector('.cards') as HTMLElement)
        .getAllByRole('link')
        .map((c) => c.getAttribute('href'));
      // The whole card opens the lesson at its first step; two quiet links
      // under it show the finished result or draw it along.
      expect(links).toEqual([
        '#/another-star/watch',
        '#/another-star/result',
        '#/another-star/draw',
        '#/eight-fold-star-and-cross/watch',
        '#/eight-fold-star-and-cross/result',
        '#/eight-fold-star-and-cross/draw',
      ]);
      expect(
        screen.getAllByRole('link', { name: 'See the result' }),
      ).toHaveLength(2);
      expect(screen.getAllByRole('link', { name: 'Draw along' })).toHaveLength(
        2,
      );
      expect(
        screen.getByRole('heading', { name: 'Another star' }),
      ).toBeTruthy();
      // On the dev server the library also links to the review page and the
      // project notes.
      expect(
        screen.getByRole('link', { name: /Review page/ }).getAttribute('href'),
      ).toBe('#/review');
      expect(
        screen
          .getByRole('link', { name: /Project notes/ })
          .getAttribute('href'),
      ).toBe('#/notes');
      // Each card says its level and length.
      expect(
        screen.getAllByText('Beginner', { selector: '.meta *' }),
      ).toHaveLength(level === 'beginner' ? 2 : 1);
      expect(screen.getAllByText('6 steps')).toHaveLength(2);
      // Each card has a picture of the colored pattern.
      expect(
        document.querySelectorAll('svg.thumbnail .piece').length,
      ).toBeGreaterThan(0);
    },
  );

  it('filters the patterns by tradition and level', () => {
    const extra = {
      ...(structuredClone(example) as object),
      id: 'another-star',
      title: 'Another star',
      style: 'Nasrid',
      level: 'advanced',
    };
    const entries = entriesOf({
      '../../../../tutorials/eight-fold-star-and-cross.json': example,
      '../../../../tutorials/another-star.json': extra,
    });
    render(<App entries={entries} />);
    const cards = () => document.querySelectorAll('.cards > li').length;
    expect(cards()).toBe(2);
    choose('Tradition', 'Nasrid');
    expect(cards()).toBe(1);
    choose('Level', 'beginner');
    expect(screen.getByText(/No pattern matches both choices/)).toBeTruthy();
    choose('Tradition', '');
    expect(cards()).toBe(1);
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

describe('the way in', () => {
  const entries = () =>
    entriesOf({
      '../../../../tutorials/eight-fold-star-and-cross.json': example,
    });

  it('starts the first lesson at step 1', () => {
    render(<App entries={entries()} />);
    expect(
      screen
        .getByRole('link', { name: 'Start with the star and cross' })
        .getAttribute('href'),
    ).toBe('#/eight-fold-star-and-cross/watch');
  });

  it('offers to continue the lesson left partway, and not one finished', () => {
    const { unmount } = render(<App entries={entries()} />);
    expect(screen.queryByText('Continue where you left off')).toBeNull();
    unmount();
    window.localStorage.setItem(
      'tastir.lastLesson',
      JSON.stringify({
        address: 'eight-fold-star-and-cross',
        label: 'Step 3 of 6',
      }),
    );
    render(<App entries={entries()} />);
    const strip = screen.getByRole('link', {
      name: /Continue where you left off/,
    });
    expect(strip.getAttribute('href')).toBe(
      '#/eight-fold-star-and-cross/watch',
    );
    expect(within(strip).getByText(/Watching · Step 3 of 6/)).toBeTruthy();
    expect(within(strip).getByText('Eight-fold star and cross')).toBeTruthy();
  });

  it('offers a drawing left partway when it is the latest, and opens its board', () => {
    window.localStorage.setItem(
      'tastir.lastLesson',
      JSON.stringify({
        address: 'eight-fold-star-and-cross',
        label: 'Step 5 of 6',
        at: '2026-10-13T10:00:00.000Z',
      }),
    );
    window.localStorage.setItem(
      'tastir.along',
      JSON.stringify([
        {
          tutorial: 'eight-fold-star-and-cross',
          board: { steps: [{}] },
          index: 2,
          inked: [],
          label: 'Step 3 of 6',
          updated: '2026-10-14T10:00:00.000Z',
        },
      ]),
    );
    render(<App entries={entries()} />);
    const strip = screen.getByRole('link', {
      name: /Continue where you left off/,
    });
    expect(strip.getAttribute('href')).toBe('#/eight-fold-star-and-cross/draw');
    expect(within(strip).getByText(/Drawing along · Step 3 of 6/)).toBeTruthy();
  });

  it('keeps the review page and project notes in the footer', () => {
    render(<App entries={entries()} />);
    const footer = document.querySelector('.site-footer') as HTMLElement;
    expect(
      within(footer).getByRole('link', { name: /Review page/ }),
    ).toBeTruthy();
    expect(
      document.querySelector('.masthead')?.querySelector('.dev-links'),
    ).toBeNull();
  });
});

describe('coming back to the library', () => {
  const twoStars = () =>
    entriesOf({
      '../../../../tutorials/eight-fold-star-and-cross.json': example,
      '../../../../tutorials/another-star.json': {
        ...(structuredClone(example) as object),
        id: 'another-star',
        title: 'Another star',
        style: 'Nasrid',
      },
    });

  it('keeps the filters the learner chose', () => {
    const entries = twoStars();
    const { unmount } = render(<App entries={entries} />);
    choose('Tradition', 'Nasrid');
    unmount();
    render(<App entries={entries} />);
    expect(
      (screen.getByRole('combobox', { name: 'Tradition' }) as HTMLSelectElement)
        .value,
    ).toBe('Nasrid');
    expect(document.querySelectorAll('.cards > li').length).toBe(1);
  });

  it('returns to the place on the page it left from', () => {
    const scrollTo = vi
      .spyOn(window, 'scrollTo')
      .mockImplementation(() => undefined);
    let y = 1234;
    const scrollY = vi
      .spyOn(window, 'scrollY', 'get')
      .mockImplementation(() => y);
    try {
      render(<App entries={twoStars()} />);
      go('#/eight-fold-star-and-cross');
      expect(scrollTo).toHaveBeenLastCalledWith(0, 0);
      y = 0;
      go('#/');
      expect(scrollTo).toHaveBeenLastCalledWith(0, 1234);
    } finally {
      scrollTo.mockRestore();
      scrollY.mockRestore();
    }
  });
});

describe('the address', () => {
  it('plays the tutorial it names, and returns to the library', () => {
    render(<App />);
    go('#/eight-fold-star-and-cross');
    expect(
      screen.getByRole('heading', { name: 'Eight-fold star and cross' }),
    ).toBeTruthy();
    expect(document.querySelector('.label')?.textContent).toBe('Color');
    go('#/');
    expect(screen.getByRole('heading', { name: 'Tastir' })).toBeTruthy();
  }, 30000); // with the library; a busy machine can push it past the default 5 s. // The library computes every tutorial in tutorials/, so this grows

  it('links the patterns before and after it, by title', () => {
    render(<App />);
    go('#/eight-fold-star-and-cross');
    const previous = screen.getByRole('link', { name: /^Previous pattern: / });
    const next = screen.getByRole('link', { name: /^Next pattern: / });
    expect(previous.getAttribute('href')).toBe('#/eight-fold-khatam/result');
    expect(next.getAttribute('href')).toBe(
      '#/eight-fold-star-and-octagon/result',
    );
    expect(next.textContent).toContain('star and octagon');
  }, 30000);

  it('lists every pattern in a side menu, with this one marked', () => {
    render(<App />);
    go('#/eight-fold-star-and-cross');
    act(() => screen.getByRole('button', { name: 'Patterns' }).click());
    const menu = screen.getByRole('dialog', { name: 'Patterns' });
    expect(within(menu).getAllByRole('link').length).toBe(LIBRARY.length);
    expect(
      within(menu)
        .getByRole('link', { name: 'Eight-fold star and cross' })
        .getAttribute('aria-current'),
    ).toBe('page');
    expect(within(menu).getByRole('heading', { name: '8-fold' })).toBeTruthy();
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(screen.queryByRole('dialog', { name: 'Patterns' })).toBeNull();
  }, 30000);

  it('switches to the result in place, and keeps it for the next pattern', () => {
    render(<App />);
    go('#/eight-fold-star-and-cross/watch');
    const views = screen.getByRole('navigation', {
      name: 'How to see this pattern',
    });
    expect(
      within(views)
        .getByRole('link', { name: 'Watch it drawn' })
        .getAttribute('aria-current'),
    ).toBe('page');
    act(() => within(views).getByRole('link', { name: 'Result' }).click());
    expect(window.location.hash).toBe('#/eight-fold-star-and-cross/result');
    expect(
      within(views)
        .getByRole('link', { name: 'Result' })
        .getAttribute('aria-current'),
    ).toBe('page');
    expect(
      screen
        .getByRole('link', { name: /^Next pattern: / })
        .getAttribute('href'),
    ).toBe('#/eight-fold-star-and-octagon/result');
    expect(
      within(views)
        .getByRole('link', { name: 'Draw along' })
        .getAttribute('href'),
    ).toBe('#/eight-fold-star-and-cross/draw');
  }, 30000);

  it('opens the tutorial in the address on load', () => {
    window.location.hash = '#/eight-fold-star-and-cross';
    render(<App />);
    expect(document.querySelector('.label')?.textContent).toBe('Color');
  });

  it.each(['', '/result'])(
    'opens at the finished wall with %s, beside the original',
    (suffix) => {
      window.location.hash = `#/minbar-doors-cairo${suffix}`;
      render(<App />);
      expect(document.querySelector('.label')?.textContent).toBe('Color');
      expect(screen.getByRole('figure', { name: 'The original' })).toBeTruthy();
      expect(
        screen.getByRole('button', { name: 'Hide the original' }),
      ).toBeTruthy();
    },
    15000,
  );

  it('opens at the finished wall alone when there is no photo', () => {
    window.location.hash = '#/eight-fold-star-and-cross/result';
    render(<App />);
    expect(document.querySelector('.label')?.textContent).toBe('Color');
    expect(screen.queryByRole('figure', { name: 'The original' })).toBeNull();
  });

  it('says so when no tutorial has that name', () => {
    render(<App />);
    go('#/no-such-pattern');
    expect(
      screen.getByText('There is no tutorial called "no-such-pattern".'),
    ).toBeTruthy();
  });
});
