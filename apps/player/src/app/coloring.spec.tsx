import { fireEvent, render, screen } from '@testing-library/react';
import example from '@tutorials/eight-fold-star-and-cross.json';
import { Play } from './app';
import { colorReducer, PALETTES, type History } from './coloring';

const start: History = {
  past: [],
  now: { palette: 'Fès tile', chosen: {} },
  future: [],
};

describe('the coloring history', () => {
  it('paints, undoes and redoes', () => {
    const painted = colorReducer(start, {
      kind: 'paint',
      type: '16:2.3431',
      color: '#ff0000',
    });
    expect(painted.now.chosen).toEqual({ '16:2.3431': '#ff0000' });
    const undone = colorReducer(painted, { kind: 'undo' });
    expect(undone.now).toEqual(start.now);
    expect(colorReducer(undone, { kind: 'redo' }).now).toEqual(painted.now);
  });

  it('drops single choices when the palette changes, and forgets redo after a change', () => {
    let h = colorReducer(start, { kind: 'paint', type: 't', color: '#ff0000' });
    h = colorReducer(h, { kind: 'palette', palette: 'Isfahan' });
    expect(h.now).toEqual({ palette: 'Isfahan', chosen: {} });
    h = colorReducer(h, { kind: 'undo' });
    h = colorReducer(h, { kind: 'paint', type: 't', color: '#00ff00' });
    expect(h.future).toEqual([]);
  });

  it('adds no history for a change that changes nothing', () => {
    expect(colorReducer(start, { kind: 'palette', palette: 'Fès tile' })).toBe(
      start,
    );
    expect(colorReducer(start, { kind: 'undo' })).toBe(start);
  });

  it('has the eight preset palettes, each filling every slot', () => {
    expect(Object.keys(PALETTES)).toEqual([
      'Fès tile',
      'Marrakech',
      'Chefchaouen',
      'Tétouan',
      'Isfahan',
      'Kashan',
      'Alhambra',
      'Bou Inania',
    ]);
    for (const p of Object.values(PALETTES))
      expect(Object.keys(p)).toEqual(['a', 'b', 'c', 'd', 'ground']);
  });
});

/** Opens the star and cross at its color stage. */
function atColor() {
  render(<Play json={example} />);
  fireEvent.click(screen.getByLabelText('Reduce motion'));
  for (let i = 0; i < 8; i++)
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  expect(document.querySelector('.label')?.textContent).toBe('Color');
}
/** The fills of every star on the wall (type 0, the largest). */
const starFills = () =>
  new Set(
    [...document.querySelectorAll('.wall .wall-piece[data-type="0"]')].map(
      (p) => p.getAttribute('fill'),
    ),
  );
const click = (name: string | RegExp) =>
  fireEvent.click(screen.getByRole('button', { name }));

describe('coloring in the player', () => {
  it('recolors every star at once, then undoes, redoes and resets', () => {
    atColor();
    expect(starFills()).toEqual(new Set(['#2f4a8f']));
    click('Recolor every star');
    click(/third color/);
    expect(starFills()).toEqual(new Set(['#b07a3c']));
    click('Undo');
    expect(starFills()).toEqual(new Set(['#2f4a8f']));
    click('Redo');
    expect(starFills()).toEqual(new Set(['#b07a3c']));
    click('Reset');
    expect(starFills()).toEqual(new Set(['#2f4a8f']));
  });

  it('opens the colors for the piece clicked on the wall, with any color allowed', () => {
    atColor();
    // Without layout, a click lands at the middle of the view: a star.
    fireEvent.click(document.querySelector('svg.wall') as Element);
    expect(
      screen.getByRole('group', { name: 'Colors for every star' }),
    ).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/Any color/), {
      target: { value: '#123456' },
    });
    expect(starFills()).toEqual(new Set(['#123456']));
  });

  it('switches palette', () => {
    atColor();
    fireEvent.change(screen.getByLabelText(/Palette/), {
      target: { value: 'Chefchaouen' },
    });
    expect(starFills()).toEqual(new Set([PALETTES.Chefchaouen?.a]));
  });

  it('highlights every copy of the piece under the pointer', () => {
    atColor();
    fireEvent.pointerMove(document.querySelector('svg.wall') as Element);
    const lit = [...document.querySelectorAll('.wall .wall-piece.hl')];
    expect(lit.length).toBe(
      document.querySelectorAll('.wall .wall-piece[data-type="0"]').length,
    );
    expect(lit.every((p) => p.getAttribute('data-type') === '0')).toBe(true);
    expect(document.querySelectorAll('.wall .wall-piece.dim').length).toBe(
      document.querySelectorAll('.wall .wall-piece[data-type="1"]').length,
    );
    fireEvent.pointerEnter(
      screen.getByRole('button', { name: 'Recolor every cross' }),
    );
    expect(
      [...document.querySelectorAll('.wall .wall-piece.hl')].every(
        (p) => p.getAttribute('data-type') === '1',
      ),
    ).toBe(true);
  });
});

describe('the color text', () => {
  it('counts the pieces in plain words', () => {
    render(<Play json={example} />);
    fireEvent.click(screen.getByLabelText('Reduce motion'));
    for (let i = 0; i < 8; i++)
      fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(
      screen.getByText(/Each tile holds one star and one cross\./),
    ).toBeTruthy();
  });
});
