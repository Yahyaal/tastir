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
const unit = () => screen.getByRole('img', { name: /^The unit/ });
/** The unit's centre stars' fills, rosette by rosette. */
const centres = () =>
  [...unit().querySelectorAll(`.tile-piece[data-type="${star}"]`)].map((p) =>
    p.getAttribute('fill'),
  );

/** The zellige coloured first, before it is repeated: the unit alone. */
function atUnit() {
  render(<Play json={zellige} />);
  fireEvent.click(screen.getByLabelText('Reduce motion'));
  fireEvent.click(button('Go to ink'));
  fireEvent.click(button('Color it'));
  expect(document.querySelector('.label')?.textContent).toBe('Color');
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

describe('colouring the unit before repeating it', () => {
  it('paints a whole ring of one rosette with a click', () => {
    atUnit();
    // Two rosettes take turns: the unit holds the tiles they repeat after.
    expect(centres()).toHaveLength(4);
    fireEvent.change(screen.getByLabelText(/Any color/), {
      target: { value: '#123456' },
    });
    fireEvent.click(
      unit().querySelector(`.tile-piece[data-type="${star}"]`) as Element,
    );
    const painted = centres().filter((c) => c === '#123456');
    // Rosette A, twice in the unit; B keeps its colour.
    expect(painted).toHaveLength(2);
  });

  it('halves the unit to one tile, and doubles it again', () => {
    atUnit();
    fireEvent.click(button('Halve the unit'));
    expect(centres()).toHaveLength(1);
    fireEvent.click(button('Double the unit'));
    // From one, the second rosette is the first with its colours swapped.
    const [a, b] = centres();
    expect(a).not.toBe(b);
  });

  it('then repeats the coloured unit as many times as asked', () => {
    atUnit();
    fireEvent.click(button('Next'));
    expect(document.querySelector('.label')?.textContent).toBe('Repeat');
    fireEvent.click(button('3 × 3'));
    expect(
      screen
        .getByRole('img', { name: 'The unit repeated 3 by 3' })
        .querySelectorAll(`.tile-piece[data-type="${star}"]`),
    ).toHaveLength(9);
    fireEvent.click(button('The whole wall'));
    expect(document.querySelector('.wall')).toBeTruthy();
  });

  it('offers one, two or four rosettes on a square lattice', () => {
    expect(rosetteOptions(loadModel(zellige).pattern)).toEqual([1, 2, 4]);
  });
});
