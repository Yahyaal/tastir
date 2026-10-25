import { act, fireEvent, render, screen, within } from '@testing-library/react';
import example from '@tutorials/eight-fold-star-and-cross.json';
import khatam from '@tutorials/eight-fold-khatam.json';
import octagons from '@tutorials/eight-fold-star-and-octagon.json';
import rectangular from '@tutorials/ten-pointed-star-decagon-rect.json';
import { parseTutorial } from '@tastir/schema';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import App from './app';
import { entriesOf, grouped, LIBRARY } from './library';

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
      // The card shows the short name where the tutorial has one.
      expect(
        screen.getByRole('heading', {
          name: (json as { short?: string }).short ?? json.title,
        }),
      ).toBeTruthy();
      expect(document.querySelector('.card-item .level')?.textContent).toBe(
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
      // The whole card opens the finished pattern; two quiet links under it
      // watch it drawn from the first step or draw it along.
      expect(links).toEqual([
        '#/another-star/result',
        '#/another-star/watch',
        '#/another-star/draw',
        '#/eight-fold-star-and-cross/result',
        '#/eight-fold-star-and-cross/watch',
        '#/eight-fold-star-and-cross/draw',
      ]);
      expect(
        screen.getAllByRole('link', { name: 'Watch it drawn' }),
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
    // The empty library names what was chosen, and Clear all undoes it.
    expect(
      screen.getByText(
        /No pattern is for beginners and from the Nasrid tradition/,
      ),
    ).toBeTruthy();
    choose('Tradition', '');
    expect(cards()).toBe(1);
    act(() => screen.getAllByRole('button', { name: 'Clear all' })[0]?.click());
    expect(cards()).toBe(2);
    expect(screen.queryByRole('button', { name: 'Clear all' })).toBeNull();
  });

  it('finds patterns by the words of their name', () => {
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
    const cards = () => document.querySelectorAll('.cards > li').length;
    const search = screen.getByRole('searchbox', { name: 'Search patterns' });
    fireEvent.change(search, { target: { value: 'another' } });
    expect(cards()).toBe(1);
    fireEvent.change(search, { target: { value: 'nothing like it' } });
    expect(
      screen.getByText(/No pattern is called “nothing like it”/),
    ).toBeTruthy();
    act(() => screen.getAllByRole('button', { name: 'Clear all' })[0]?.click());
    expect(cards()).toBe(2);
    expect((search as HTMLInputElement).value).toBe('');
  });

  it('filters by a card’s level, symmetry or tradition when it is clicked', () => {
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
    act(() => screen.getByRole('button', { name: 'Advanced' }).click());
    expect(cards()).toBe(1);
    expect(
      (screen.getByRole('combobox', { name: 'Level' }) as HTMLSelectElement)
        .value,
    ).toBe('advanced');
    act(() => screen.getByRole('button', { name: 'Clear all' }).click());
    act(() => screen.getAllByRole('button', { name: 'Nasrid' })[0]?.click());
    expect(cards()).toBe(1);
  });

  it('shows a short name and the line under it, with the full title on hover', () => {
    const named = {
      ...(structuredClone(example) as object),
      id: 'long-star',
      title: 'Squares and stars of the Patio de los Arrayanes (Alhambra)',
      short: 'Squares and stars',
      subtitle: 'Patio de los Arrayanes, Alhambra',
    };
    render(
      <App
        entries={entriesOf({
          '../../../../tutorials/long-star.json': named,
        })}
      />,
    );
    expect(
      screen.getByRole('heading', { name: 'Squares and stars' }),
    ).toBeTruthy();
    expect(screen.getByText('Patio de los Arrayanes, Alhambra')).toBeTruthy();
    expect(document.querySelector('.card')?.getAttribute('title')).toBe(
      'Squares and stars of the Patio de los Arrayanes (Alhambra)',
    );
    // No Arabic on the cards.
    expect(document.querySelector('.cards [lang="ar"]')).toBeNull();
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

  it('lists the lessons left partway under Your work, the latest first', () => {
    const { unmount } = render(<App entries={entries()} />);
    expect(screen.queryByRole('region', { name: 'Your work' })).toBeNull();
    unmount();
    window.localStorage.setItem(
      'tastir.lessonAt.eight-fold-star-and-cross',
      JSON.stringify({
        index: 3,
        label: 'Step 3 of 6',
        at: '2026-10-13T10:00:00.000Z',
      }),
    );
    window.localStorage.setItem(
      'tastir.along',
      JSON.stringify([
        {
          tutorial: 'eight-fold-star-and-cross',
          board: { steps: [{}] },
          index: 1,
          inked: [],
          label: 'Step 2 of 6',
          updated: '2026-10-14T10:00:00.000Z',
        },
      ]),
    );
    render(<App entries={entries()} />);
    // One row on the home page: the lessons in progress come first.
    const yours = screen.getByRole('region', { name: 'Your work' });
    const links = [...yours.querySelectorAll<HTMLElement>('.cards a.card')];
    // The drawing was left last: it comes first, and opens its board.
    expect(links.map((l) => l.getAttribute('href'))).toEqual([
      '#/eight-fold-star-and-cross/draw',
      '#/eight-fold-star-and-cross/watch',
    ]);
    expect(
      within(links[0] as HTMLElement).getByText('Step 2 of 6'),
    ).toBeTruthy();
    expect(links[0]?.textContent).toContain('Continue drawing');
    expect(links[1]?.textContent).toContain('Continue watching');
    expect(
      within(links[1] as HTMLElement).getByText('Step 3 of 6'),
    ).toBeTruthy();
    // Something in progress: Your work comes before the welcome.
    const hero = document.querySelector('.hero') as HTMLElement;
    expect(
      yours.compareDocumentPosition(hero) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      within(yours).getByRole('link', { name: /See all \(2\)/ }),
    ).toHaveProperty('hash', '#/work');
    expect(
      screen.getByRole('link', { name: 'Your work (2)' }).getAttribute('href'),
    ).toBe('#/work');
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
    // A family of variations is listed once.
    expect(within(menu).getAllByRole('link').length).toBe(
      grouped(LIBRARY).length,
    );
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

  it('switches between the variations of a pattern at the same stage', () => {
    render(<App />);
    go('#/twelve-fold-rosette-mian-hex/result');
    const switcher = screen.getByRole('navigation', {
      name: 'Variations of this pattern',
    });
    const links = within(switcher).getAllByRole('link');
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '#/twelve-fold-rosette-mian/result',
      '#/twelve-fold-rosette-mian-hex/result',
    ]);
    expect(links[1]?.getAttribute('aria-current')).toBe('page');
    go(links[0]?.getAttribute('href') ?? '');
    expect(
      within(
        screen.getByRole('navigation', { name: 'Variations of this pattern' }),
      )
        .getAllByRole('link')[0]
        ?.getAttribute('aria-current'),
    ).toBe('page');
    // A pattern with no variations has no switch.
    go('#/six-fold-snowflake');
    expect(
      screen.queryByRole('navigation', { name: 'Variations of this pattern' }),
    ).toBeNull();
  }, 30000);

  it('shows a family as one card that counts its variations', () => {
    render(<App />);
    expect(document.querySelectorAll('.cards > li').length).toBe(
      grouped(LIBRARY).length,
    );
    const card = document
      .querySelector('.card[href="#/alhambra-star-and-arrows/result"]')
      ?.closest('li');
    expect(card?.querySelector('.variations-label')?.textContent).toBe(
      '2 variations',
    );
    expect(
      document.querySelector(
        '.card[href="#/alhambra-star-and-arrows-shifted/result"]',
      ),
    ).toBeNull();
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

  it('hides and shows the original from the button on the drawing', () => {
    window.location.hash = '#/minbar-doors-cairo/result';
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Hide the original' }));
    expect(screen.queryByRole('figure', { name: 'The original' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Show the original' }));
    expect(screen.getByRole('figure', { name: 'The original' })).toBeTruthy();
  }, 15000);

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
