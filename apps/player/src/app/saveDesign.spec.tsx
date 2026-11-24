import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import example from '@tutorials/eight-fold-star-and-cross.json';
import snowflake from '@tutorials/six-fold-snowflake.json';
import App, { Play } from './app';
import { PALETTES } from './coloring';
import { addDesign, listDesigns } from './designs';
import { entriesOf } from './library';

/** The Style group, in its tab of Make it yours when there is one. */
const styleGroup = () => {
  const tab = screen.queryByRole('tab', { name: 'Look' });
  if (tab && tab.getAttribute('aria-selected') !== 'true') fireEvent.click(tab);
  return screen.getByRole('group', { name: 'Style' });
};

// Saving needs these two addresses, not a render of the entire catalogue.
// The library's own specs exercise all tutorial cards.
const entries = entriesOf({
  'eight-fold-star-and-cross.json': example,
  'six-fold-snowflake.json': snowflake,
});

/** Where the learner is: the stage's label, or the finished wall (the
 * wall page, where Make it yours floats over the wall). */
const label = () =>
  document.querySelector('.label')?.textContent ??
  (document.querySelector('.make-panel') ? 'Wall' : undefined);
const click = (name: string | RegExp) =>
  fireEvent.click(screen.getByRole('button', { name }));
const inked = () => document.querySelectorAll('.free-ink .piece-line.inked');
/** Every piece's fill on the wall, in order. */
const fills = () =>
  [...document.querySelectorAll('.wall .wall-piece')].map((p) =>
    p.getAttribute('fill'),
  );

/** Moves the address to `hash`, as clicking a link would. */
function go(hash: string) {
  act(() => {
    window.location.hash = hash;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
}

/** Names the design in the page and saves it. */
function name(text: string) {
  fireEvent.change(screen.getByLabelText('Name'), {
    target: { value: text },
  });
  click('Save');
}

afterEach(() => {
  window.location.hash = '';
});

describe('saving a design', () => {
  it('keeps a re-inked, recolored pattern, and opens it again the same', () => {
    render(<Play json={example} />);
    fireEvent.click(screen.getByLabelText('Reduce motion'));
    for (let i = 0; i < 6; i++) click('Next');
    expect(label()).toBe('Ink');
    click('Make your own');
    fireEvent.click(
      document.querySelector('.free-ink .piece-line:not(.inked)') as Element,
    );
    expect(inked()).toHaveLength(17);
    click('Done');

    // The name is asked in the page, and the design gets its own address.
    click('Save as my design');
    name('Test');
    expect(screen.getByRole('status').textContent).toMatch(/Saved as “Test”/);
    const [saved] = listDesigns();
    expect(saved?.name).toBe('Test');
    expect(saved?.inked).toHaveLength(17);
    expect(window.location.hash).toBe(
      `#/eight-fold-star-and-cross/design/${saved?.id}`,
    );

    // Recolor the unit, then repeat it, and save again: the same design
    // is updated.
    click('Color it');
    expect(label()).toBe('Color');
    fireEvent.click(screen.getByRole('button', { name: 'Chefchaouen' }));
    fireEvent.click(
      screen
        .getByRole('group', { name: 'Paint with' })
        .querySelectorAll('.swatch-button')[2] as Element,
    );
    fireEvent.click(
      screen.getAllByRole('button', { name: /^Paint ring/ })[0] as Element,
    );
    click('Next');
    expect(label()).toBe('Wall');
    fireEvent.click(
      within(styleGroup()).getByRole('button', {
        name: 'Interlace',
      }),
    );
    // Under white bands the palette engine moves pale colours off the
    // bands, so the wall is read once it is interlaced.
    const colored = fills();
    expect(screen.getByTitle('Your design “Test”')).toBeTruthy();
    click('Save');
    expect(listDesigns()).toHaveLength(1);
    expect(listDesigns()[0]).toMatchObject({
      id: saved?.id,
      inked: saved?.inked,
      look: 'interlace',
      coloring: { palette: 'Chefchaouen' },
    });

    // A fresh page at the design's address opens at the wall with them.
    cleanup();
    render(<App entries={entries} />);
    expect(label()).toBe('Wall');
    expect(fills()).toEqual(colored);
    expect(
      within(styleGroup())
        .getByRole('button', { name: 'Interlace' })
        .getAttribute('aria-pressed'),
    ).toBe('true');
    expect(screen.getByTitle('Your design “Test”')).toBeTruthy();
    click('Go to ink');
    click('Make your own');
    expect(inked()).toHaveLength(17);
  });

  it('saves as new, keeping both', () => {
    const first = addDesign({
      name: 'First',
      tutorial: 'eight-fold-star-and-cross',
      coloring: { palette: 'Isfahan', chosen: {} },
      look: 'tiles',
      grout: 1,
    });
    render(<App entries={entries} />);
    go(`#/eight-fold-star-and-cross/design/${first?.id}`);
    click('Save as new');
    name('Second');
    expect(listDesigns().map((d) => d.name)).toEqual(['Second', 'First']);
    expect(listDesigns()[0]?.coloring.palette).toBe('Isfahan');
  });

  it('opens with the tutorial’s own inking when its pieces are gone', () => {
    const old = addDesign({
      name: 'Old',
      tutorial: 'eight-fold-star-and-cross',
      inked: ['0.000000,9.000000|1.000000,9.000000'],
      coloring: { palette: 'Marrakech', chosen: {} },
      look: 'tiles',
      grout: 1,
    });
    render(<App entries={entries} />);
    go(`#/eight-fold-star-and-cross/design/${old?.id}`);
    expect(label()).toBe('Wall');
    expect(screen.getByText(/The tutorial has changed/)).toBeTruthy();
    // The star and cross, in the design's own palette, ring by ring.
    fireEvent.click(screen.getByRole('tab', { name: 'Pieces' }));
    expect(screen.getByRole('group', { name: 'Paint with' })).toBeTruthy();
    const marrakech = Object.values(PALETTES['Marrakech'] ?? {});
    expect(fills().length).toBeGreaterThan(0);
    for (const fill of fills()) expect(marrakech).toContain(fill);
  });

  it('says plainly when a design is not here, with the ways on', () => {
    render(<App entries={entries} />);
    go('#/eight-fold-star-and-cross/design/nothing');
    expect(
      screen.getByRole('heading', { name: 'This design is not here' }),
    ).toBeTruthy();
    expect(screen.getByText(/no such design in this browser/)).toBeTruthy();
    expect(
      screen
        .getByRole('link', { name: 'Open the pattern' })
        .getAttribute('href'),
    ).toBe('#/eight-fold-star-and-cross');
    expect(screen.getAllByRole('link', { name: /All patterns/ })).toHaveLength(
      2,
    );
  });

  it('opens nothing for a design put under another pattern, and says so', () => {
    const mine = addDesign({
      name: 'Mine',
      tutorial: 'eight-fold-star-and-cross',
      coloring: { palette: 'Isfahan', chosen: {} },
      look: 'tiles',
      grout: 1,
    });
    render(<App entries={entries} />);
    go(`#/six-fold-snowflake/design/${mine?.id}`);
    expect(screen.getByText(/is a design of another pattern/)).toBeTruthy();
    expect(screen.queryByText(/in this browser/)).toBeNull();
    expect(
      screen.getByRole('link', { name: 'Open “Mine”' }).getAttribute('href'),
    ).toBe(`#/eight-fold-star-and-cross/design/${mine?.id}`);
  });

  it('says so when the browser will not keep the design, and keeps the form', () => {
    render(<Play json={example} start="result" />);
    const set = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
    click('Save');
    name('Kept?');
    set.mockRestore();
    expect(screen.getByRole('alert').textContent).toMatch(
      /Not saved: .*blocked \(a private window\) or full/,
    );
    expect(screen.getByLabelText('Name')).toBeTruthy();
    expect(listDesigns()).toEqual([]);
    // Once storage works again, the same form saves.
    click('Save');
    expect(listDesigns().map((d) => d.name)).toEqual(['Kept?']);
  });

  it('shows unsaved changes, and asks before leaving with them', () => {
    const d = addDesign({
      name: 'Plain',
      tutorial: 'eight-fold-star-and-cross',
      coloring: { palette: 'Isfahan', chosen: {} },
      look: 'tiles',
      grout: 1,
    });
    render(<App entries={entries} />);
    go(`#/eight-fold-star-and-cross/design/${d?.id}`);
    expect(screen.getByRole('button', { name: 'Saved' })).toHaveProperty(
      'disabled',
      true,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Marrakech' }));
    // A dot on Save marks the changes.
    expect(
      screen
        .getByRole('button', { name: 'Save' })
        .classList.contains('pending'),
    ).toBe(true);
    const home = screen.getByRole('link', { name: /All patterns/ });
    home.focus();
    const overflow = document.body.style.overflow;
    fireEvent.click(home);
    expect(
      screen.getByRole('alertdialog', { name: 'Unsaved changes' }).textContent,
    ).toMatch(/Your changes to “Plain” are not saved/);
    const stay = screen.getByRole('button', { name: 'Stay' });
    const leave = screen.getByRole('button', { name: 'Leave without saving' });
    expect(document.activeElement).toBe(stay);
    expect(document.body.style.overflow).toBe('hidden');
    fireEvent.keyDown(stay, { key: 'Tab' });
    expect(document.activeElement).toBe(leave);
    fireEvent.keyDown(leave, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(stay);
    fireEvent.keyDown(stay, { key: 'ArrowLeft' });
    expect(document.querySelector('.make-panel')).not.toBeNull();
    fireEvent.keyDown(stay, { key: 'Escape' });
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(document.activeElement).toBe(home);
    expect(document.body.style.overflow).toBe(overflow);
    expect(
      screen
        .getByRole('button', { name: 'Marrakech' })
        .getAttribute('aria-pressed'),
    ).toBe('true');
    // The browser's Back asks too, and puts the design's address back.
    go('#/');
    expect(
      screen.getByRole('alertdialog', { name: 'Unsaved changes' }),
    ).toBeTruthy();
    expect(window.location.hash).toBe(
      `#/eight-fold-star-and-cross/design/${d?.id}`,
    );
    expect(document.querySelector('.make-panel')).not.toBeNull();
    click('Stay');
    click('Save');
    expect(screen.queryByText(/Unsaved changes/)).toBeNull();
    expect(listDesigns()[0]?.coloring.palette).toBe('Marrakech');
  });

  it('typing a name does not step the player', () => {
    render(<Play json={example} start="result" />);
    click('Save');
    const input = screen.getByLabelText('Name');
    fireEvent.keyDown(input, { key: ' ' });
    fireEvent.keyDown(input, { key: 'ArrowLeft' });
    expect(label()).toBe('Wall');
    click('Cancel');
    expect(screen.queryByLabelText('Name')).toBeNull();
    // Escape closes the name box too.
    click('Save');
    fireEvent.keyDown(screen.getByLabelText('Name'), { key: 'Escape' });
    expect(screen.queryByLabelText('Name')).toBeNull();
  });
});
