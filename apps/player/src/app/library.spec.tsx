import { act, fireEvent, render, screen, within } from '@testing-library/react';
import starAndCross from '@tutorials/eight-fold-star-and-cross.json';
import khatam from '@tutorials/eight-fold-khatam.json';
import octagons from '@tutorials/eight-fold-star-and-octagon.json';
import rectangular from '@tutorials/ten-pointed-star-decagon-rect.json';
import { parseTutorial } from '@tastir/schema';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import App from './app';
import {
  entriesOf,
  FAMILIES,
  familyOf,
  grouped,
  LIBRARY,
  placesOf,
} from './library';

// A plain tutorial for these tests, without the places it is found in.
const { places: _places, ...example } = starAndCross as {
  places?: unknown;
  [key: string]: unknown;
};

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

/** A chip of the filter row (a star or a level), or of a place's
 * traditions, by its name. */
const chip = (group: 'Filters' | 'Traditions', value: string) =>
  within(
    screen.getByRole(group === 'Filters' ? 'toolbar' : 'group', {
      name: group,
    }),
  ).getByRole('button', {
    name: new RegExp(`^${value},`),
  }) as HTMLButtonElement;
/** The library's cards. */
const cards = () => document.querySelectorAll('.library-grid > li').length;
/** The place every test tutorial here is from. */
const BOOKS = '#/places/Books%20and%20other';

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
        within(
          document.querySelector('.library-grid') as HTMLElement,
        ).getByRole('heading', {
          name: (json as { short?: string }).short ?? json.title,
        }),
      ).toBeTruthy();
      expect(
        document
          .querySelector('.library-grid .window-dots')
          ?.getAttribute('aria-label'),
      ).toBe(json.level === 'intermediate' ? 'Intermediate' : 'Advanced');
    },
  );
  it('gives notes only to the members of their family', () => {
    for (const f of FAMILIES)
      for (const [id, note] of Object.entries(f.notes ?? {})) {
        expect(f.members, `${f.id}: ${id}`).toContain(id);
        expect(typeof note, `${f.id}: ${id}`).toBe('string');
      }
    expect(
      Object.keys(familyOf('agra-fort-band-rows')?.notes ?? {}),
    ).toHaveLength(4);
    // Every family of designs that share their pieces has a note for each.
    for (const id of [
      'charbagh-stars',
      'fatehpur-sikri-stars',
      'khojent-tile-stars',
      'bourgoin-52-octagon-rows',
      'camlica-mosque-stars',
    ])
      expect(familyOf(id)?.members.length, id).toBe(
        Object.keys(familyOf(id)?.notes ?? {}).length,
      );
  });

  it('lists every file in tutorials/, and each of its places', () => {
    const files = readdirSync(TUTORIALS)
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace(/\.json$/, ''));
    expect(LIBRARY.filter((e) => !e.of).map((e) => e.id)).toEqual(
      [...files].sort(),
    );
    const places = LIBRARY.filter((e) => e.of);
    expect(places.map((e) => `${e.of} > ${e.id}`).sort()).toEqual(
      [
        'attarine-star-rosettes > ben-youssef-star-rosettes',
        'attarine-star-rosettes > leon-mosaic-star-rosettes',
        'attarine-star-rosettes > seville-vanda-star-rosettes',
        'four-fold-ring-of-circles > hani-zeynebiye-stars',
        'four-fold-ring-of-circles > itimad-daula-stars',
        'chehel-sotoun-divided-stars > ismail-shrine-divided-stars',
        'chellah-minaret-loops > alhambra-museum-loops',
        'eight-fold-star-and-cross > alhambra-comares-stars',
        'eight-fold-star-and-octagon > mashhad-gowhar-interlace',
        'sultaniyeh-twelve-star-bands > mexuar-twelve-star-bands',
      ].sort(),
    );
    // A place keeps its own address and opens in its own colours.
    expect(placesOf('itimad-daula-stars').map((e) => e.id)).toEqual([
      'four-fold-ring-of-circles',
      'hani-zeynebiye-stars',
      'itimad-daula-stars',
    ]);
    expect(
      grouped(LIBRARY).find((e) => e.id === 'attarine-star-rosettes')?.places
        ?.length,
    ).toBe(3);
    expect(grouped(LIBRARY).some((e) => e.of)).toBe(false);
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
      const grid = document.querySelector('.library-grid') as HTMLElement;
      const links = [...grid.querySelectorAll('.window-actions a')].map((c) =>
        c.getAttribute('href'),
      );
      // The window opens the finished wall; its buttons View, Watch it
      // drawn and Draw along.
      expect(links).toEqual([
        '#/another-star',
        '#/another-star/watch',
        '#/another-star/draw',
        '#/eight-fold-star-and-cross',
        '#/eight-fold-star-and-cross/watch',
        '#/eight-fold-star-and-cross/draw',
      ]);
      expect(
        within(grid).getAllByRole('link', { name: 'Watch it drawn' }),
      ).toHaveLength(2);
      expect(
        within(grid).getAllByRole('link', { name: 'Draw along' }),
      ).toHaveLength(2);
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
        within(grid).getAllByRole('img', { name: 'Beginner' }),
      ).toHaveLength(level === 'beginner' ? 2 : 1);
      expect(within(grid).getAllByText('6 steps')).toHaveLength(2);
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
    // A place shows its traditions as chips.
    window.location.hash = BOOKS;
    render(<App entries={entries} />);
    expect(cards()).toBe(2);
    act(() => chip('Traditions', 'Nasrid').click());
    expect(cards()).toBe(1);
    // No Nasrid pattern is for beginners, so the row does not offer it.
    expect(chip('Filters', 'Beginner').disabled).toBe(true);
    // The empty library names what was chosen, and Clear filters undoes it.
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'nothing' },
    });
    expect(
      screen.getByText(
        /No pattern is called “nothing”, from the Nasrid tradition and from Pattern books/,
      ),
    ).toBeTruthy();
    act(() =>
      screen.getAllByRole('button', { name: 'Clear filters' })[0]?.click(),
    );
    go('#/');
    expect(cards()).toBe(2);
    expect(screen.queryByRole('button', { name: 'Clear filters' })).toBeNull();
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
    const search = screen.getByRole('searchbox', { name: 'Search patterns' });
    fireEvent.change(search, { target: { value: 'another' } });
    expect(cards()).toBe(1);
    fireEvent.change(search, { target: { value: 'nothing like it' } });
    expect(
      screen.getByText(/No pattern is called “nothing like it”/),
    ).toBeTruthy();
    act(() =>
      screen.getAllByRole('button', { name: 'Clear filters' })[0]?.click(),
    );
    expect(cards()).toBe(2);
    expect((search as HTMLInputElement).value).toBe('');
  });

  it('filters by a star or a level from the row of filters', () => {
    const extra = {
      ...(structuredClone(example) as object),
      id: 'another-star',
      title: 'Another star',
      level: 'advanced',
    };
    const entries = entriesOf({
      '../../../../tutorials/eight-fold-star-and-cross.json': example,
      '../../../../tutorials/another-star.json': extra,
    });
    render(<App entries={entries} />);
    expect(cards()).toBe(2);
    act(() => chip('Filters', 'Advanced').click());
    expect(cards()).toBe(1);
    expect(chip('Filters', 'Advanced').getAttribute('aria-pressed')).toBe(
      'true',
    );
    // Start here steps aside while a filter is on.
    expect(screen.queryByRole('heading', { name: 'Start here' })).toBeNull();
    act(() => chip('Filters', 'Advanced').click());
    expect(cards()).toBe(2);
    act(() => chip('Filters', '8-fold').click());
    expect(cards()).toBe(2);
    expect(chip('Filters', '8-fold').getAttribute('aria-pressed')).toBe('true');
  });

  it('shows a short name, with the full title on hover', () => {
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
    expect(
      document.querySelector('.library-grid h3')?.getAttribute('title'),
    ).toBe('Squares and stars of the Patio de los Arrayanes (Alhambra)');
    // No Arabic on the cards.
    expect(document.querySelector('.library-grid [lang="ar"]')).toBeNull();
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
        .getByRole('link', { name: 'Begin: lesson 1' })
        .getAttribute('href'),
    ).toBe('#/eight-fold-star-and-cross/watch/1');
    // A first visit is welcomed in Start here.
    expect(screen.getByText('New here?')).toBeTruthy();
  });

  it('offers the work left partway at the front of Start here', () => {
    const { unmount } = render(<App entries={entries()} />);
    expect(document.querySelector('.continue-card')).toBeNull();
    expect(screen.queryByRole('link', { name: /^Your work/ })).toBeNull();
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
    // The drawing was left last: it is the Continue card, and opens its
    // board.
    const card = document.querySelector('.continue-card') as HTMLElement;
    expect(card.getAttribute('href')).toBe('#/eight-fold-star-and-cross/draw');
    expect(card.textContent).toContain('Continue drawing');
    expect(within(card).getByText('Step 2 of 6')).toBeTruthy();
    // The lesson begun goes on where it was left.
    expect(
      screen
        .getByRole('link', { name: 'Go on: lesson 1' })
        .getAttribute('href'),
    ).toBe('#/eight-fold-star-and-cross/watch');
    // No welcome once something was begun.
    expect(screen.queryByText('New here?')).toBeNull();
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
      document.querySelector('.lib-top')?.querySelector('.dev-links'),
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
    window.location.hash = BOOKS;
    const { unmount } = render(<App entries={entries} />);
    act(() => chip('Traditions', 'Nasrid').click());
    unmount();
    render(<App entries={entries} />);
    expect(chip('Traditions', 'Nasrid').getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(cards()).toBe(1);
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
    expect(document.querySelector('.make-panel')).not.toBeNull();
    go('#/');
    expect(screen.getByRole('heading', { name: 'Tastir' })).toBeTruthy();
  }, 90000); // The library computes every tutorial in tutorials/, so this grows
  // with the library; a busy machine took 34 to 59 s on 14 November.

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
    fireEvent.click(screen.getByRole('tab', { name: 'More' }));
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
    fireEvent.click(screen.getByRole('tab', { name: 'More' }));
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
    expect(cards()).toBe(grouped(LIBRARY).length);
    const card = document
      .querySelector('.window-link[href="#/alhambra-star-and-arrows"]')
      ?.closest('li');
    expect(card?.querySelector('.window-badge')?.textContent).toBe('2 designs');
    expect(
      document.querySelector(
        '.window-link[href="#/alhambra-star-and-arrows-shifted"]',
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
    expect(document.querySelector('.make-panel')).not.toBeNull();
  });

  it.each(['', '/result'])(
    'opens at the finished wall with %s, the real wall a click away',
    (suffix) => {
      window.location.hash = `#/minbar-doors-cairo${suffix}`;
      render(<App />);
      expect(document.querySelector('.make-panel')).not.toBeNull();
      // The photo is for reference: The real wall opens it beside the wall.
      expect(screen.queryByRole('figure', { name: 'The original' })).toBeNull();
      fireEvent.click(screen.getByRole('tab', { name: 'More' }));
      expect(
        screen.getByRole('button', { name: 'Show the original' }),
      ).toBeTruthy();
    },
    15000,
  );

  it('shows and hides the original from The real wall', () => {
    window.location.hash = '#/minbar-doors-cairo/result';
    render(<App />);
    fireEvent.click(screen.getByRole('tab', { name: 'More' }));
    fireEvent.click(screen.getByRole('button', { name: 'Show the original' }));
    expect(screen.getByRole('figure', { name: 'The original' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Hide the original' }));
    expect(screen.queryByRole('figure', { name: 'The original' })).toBeNull();
  }, 15000);

  it('opens at the finished wall alone when there is no photo', () => {
    window.location.hash = '#/eight-fold-star-and-cross/result';
    render(<App />);
    expect(document.querySelector('.make-panel')).not.toBeNull();
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
