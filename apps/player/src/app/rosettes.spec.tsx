import { fireEvent, render, screen } from '@testing-library/react';
import starAndCross from '@tutorials/eight-fold-star-and-cross.json';
import zellige from '@tutorials/eight-fold-zellige.json';
import { Play } from './app';
import { tutorialColoring } from './coloring';
import { loadModel } from './model';
import { colouredModel, placeFills } from './placement';
import { rosetteOptions } from './rings';
import { refamily } from './rosettes';

const model = loadModel(starAndCross);
const starOf = model.pattern.pieces.findIndex(
  (p) => model.pattern.types[p.type]?.name === 'star',
);

function atColor(json: unknown = starAndCross) {
  render(<Play json={json} />);
  fireEvent.click(screen.getByLabelText('Reduce motion'));
  fireEvent.click(screen.getByRole('button', { name: 'Go to color' }));
  expect(document.querySelector('.label')?.textContent).toBe('Color');
}

const star = loadModel(zellige).pattern.types.findIndex(
  (t) => t.name === 'star',
);
const button = (name: string | RegExp) => screen.getByRole('button', { name });
const unit = () => screen.getByRole('img', { name: 'The unit that repeats' });
/** The unit's centre stars' fills, rosette by rosette. */
const centres = () =>
  [...unit().querySelectorAll(`.unit-piece[data-type="${star}"]`)].map((p) =>
    p.getAttribute('fill'),
  );
const wall = () => screen.getByRole('img', { name: 'Your wall of units' });
const copies = () => wall().querySelectorAll('.unit-copy').length;

/** The zellige at its colour stage, with the unit and its wall shown. */
function atUnit() {
  atColor(zellige);
  fireEvent.click(button(/^Unit$/));
}

describe('colouring rosette by rosette', () => {
  it('colours every rosette alike with one rosette in the repeat', () => {
    const coloring = { ...tutorialColoring(model), rosettes: 1 };
    const fill = placeFills(colouredModel(model, coloring), coloring);
    expect(fill(starOf, 0, 0)).toBe(fill(starOf, 1, 0));
    const turns = placeFills(model, tutorialColoring(model));
    expect(turns(starOf, 0, 0)).not.toBe(turns(starOf, 1, 0));
  });

  it('moves the filler star’s colours with the rosettes, and drops a rosette gone', () => {
    const chosen = { 'a#1:0:in/0': '#111111', 'a#1:0:in/1': '#222222' };
    const filler = { 'b#2:3:filler/2': '#333333', '4:1.0000': '#444444' };
    expect(refamily({ ...chosen, ...filler }, 2, 1)).toEqual({
      'a#1:0:in/0': '#111111',
      'b#2:3:filler/1': '#333333',
      '4:1.0000': '#444444',
    });
  });

  it('switches to colouring by shape, and back', () => {
    atColor();
    fireEvent.click(button('By shape'));
    expect(button('Recolor every star')).toBeTruthy();
    expect(screen.queryByRole('group', { name: 'Paint with' })).toBeNull();
    fireEvent.click(button('Ring by ring'));
    expect(screen.getByRole('group', { name: 'Paint with' })).toBeTruthy();
  });
});

describe('the unit and its wall', () => {
  it('paints a whole ring of one rosette with a click on the unit', () => {
    atUnit();
    expect(centres()).toHaveLength(2);
    fireEvent.change(screen.getByLabelText(/Any color/), {
      target: { value: '#123456' },
    });
    fireEvent.click(
      unit().querySelector(`.unit-piece[data-type="${star}"]`) as Element,
    );
    const [a, b] = centres();
    expect(a).toBe('#123456');
    expect(b).not.toBe('#123456');
    // The wall's copies of that rosette follow.
    expect(
      wall().querySelectorAll(`.unit-piece[fill="#123456"]`).length,
    ).toBeGreaterThan(0);
  });

  it('halves the unit to one rosette, and doubles it to two, then four', () => {
    atUnit();
    fireEvent.click(button('Halve the unit'));
    expect(centres()).toHaveLength(1);
    fireEvent.click(button('Double the unit'));
    expect(centres()).toHaveLength(2);
    // From one, the second rosette is the first with its colours swapped.
    const [a, b] = centres();
    expect(a).not.toBe(b);
    fireEvent.click(button('Double the unit'));
    expect(centres()).toHaveLength(4);
    expect(button(/^Grow the unit$/).hasAttribute('disabled')).toBe(true);
  });

  it('keeps the wall as it was when two that take turns become four, then lets each change', () => {
    atUnit();
    const fills = () =>
      [...wall().querySelectorAll('.unit-copy.first .unit-piece')].map((p) =>
        p.getAttribute('fill'),
      );
    const before = fills();
    fireEvent.click(button('Double the unit'));
    expect(fills()).toEqual(before);
    fireEvent.change(screen.getByLabelText(/Any color/), {
      target: { value: '#123456' },
    });
    const stars = unit().querySelectorAll(`.unit-piece[data-type="${star}"]`);
    fireEvent.click(stars[3] as Element);
    expect(centres().filter((c) => c === '#123456')).toHaveLength(1);
  });

  it('builds the wall from copies: a ghost places one, and the wall fills and clears', () => {
    atUnit();
    expect(copies()).toBe(1);
    fireEvent.click(wall().querySelector('.unit-ghost') as Element);
    expect(copies()).toBe(2);
    fireEvent.click(button('Fill the wall for me'));
    // The first and every place round it, on a square lattice.
    expect(copies()).toBe(9);
    fireEvent.click(button('Clear the copies'));
    expect(copies()).toBe(1);
  });

  it('offers one, two or four rosettes on a square lattice', () => {
    expect(rosetteOptions(loadModel(zellige).pattern)).toEqual([1, 2, 4]);
  });
});
