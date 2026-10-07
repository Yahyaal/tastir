import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import example from '@tutorials/eight-fold-star-and-cross.json';
import App, { Play } from './app';
import { addDesign, listDesigns } from './designs';

const label = () => document.querySelector('.label')?.textContent;
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

    // Recolor at the wall and save again: the same design is updated.
    click('Next');
    click('Next');
    expect(label()).toBe('Color');
    fireEvent.change(screen.getByLabelText(/Palette/), {
      target: { value: 'Chefchaouen' },
    });
    fireEvent.click(
      screen.getAllByRole('button', { name: /^Recolor every/ })[0] as Element,
    );
    click(/third color/);
    const colored = fills();
    fireEvent.change(screen.getByLabelText('Style'), {
      target: { value: 'strapwork' },
    });
    expect(screen.getByText('Test', { selector: 'b' })).toBeTruthy();
    click('Save');
    expect(listDesigns()).toHaveLength(1);
    expect(listDesigns()[0]).toMatchObject({
      id: saved?.id,
      inked: saved?.inked,
      look: 'strapwork',
      coloring: { palette: 'Chefchaouen' },
    });

    // A fresh page at the design's address opens at the wall with them.
    cleanup();
    render(<App />);
    expect(label()).toBe('Color');
    expect(fills()).toEqual(colored);
    expect(screen.getByLabelText<HTMLSelectElement>('Style').value).toBe(
      'strapwork',
    );
    expect(screen.getByText('Test', { selector: 'b' })).toBeTruthy();
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
    render(<App />);
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
    render(<App />);
    go(`#/eight-fold-star-and-cross/design/${old?.id}`);
    expect(label()).toBe('Color');
    expect(screen.getByText(/The tutorial has changed/)).toBeTruthy();
    // The star and cross, in the design's own palette.
    expect(
      screen.getByRole('button', { name: 'Recolor every star' }),
    ).toBeTruthy();
    expect(fills()).toContain('#b5452f');
  });

  it('says so when a design is not in this browser', () => {
    render(<App />);
    go('#/eight-fold-star-and-cross/design/nothing');
    expect(screen.getByText(/not saved in this browser/)).toBeTruthy();
  });

  it('typing a name does not step the player', () => {
    render(<Play json={example} start="result" />);
    click('Save as my design');
    const input = screen.getByLabelText('Name');
    fireEvent.keyDown(input, { key: ' ' });
    fireEvent.keyDown(input, { key: 'ArrowLeft' });
    expect(label()).toBe('Color');
    click('Cancel');
    expect(screen.queryByLabelText('Name')).toBeNull();
  });
});
