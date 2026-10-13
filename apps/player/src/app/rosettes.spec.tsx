import { fireEvent, render, screen, within } from '@testing-library/react';
import starAndCross from '@tutorials/eight-fold-star-and-cross.json';
import zellige from '@tutorials/eight-fold-zellige.json';
import { Play } from './app';
import { tutorialColoring } from './coloring';
import { loadModel } from './model';
import { colouredModel, placeFills } from './placement';
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

/** A card's ring colours, from the centre out. */
const ringColours = (card: string) =>
  [
    ...within(screen.getByRole('region', { name: card })).getAllByRole(
      'button',
      { name: /^Recolor ring/ },
    ),
  ].map((b) => b.querySelector('polygon')?.getAttribute('fill'));

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

  it('makes one rosette, then adds a second with its colours swapped', () => {
    atColor(zellige);
    const a = ringColours('Rosette A');
    expect(a.length).toBeGreaterThan(1);
    fireEvent.click(
      screen.getByRole('button', { name: 'Colour every rosette alike' }),
    );
    expect(screen.queryByRole('region', { name: 'Rosette B' })).toBeNull();
    const one = ringColours('Every rosette');
    fireEvent.click(screen.getByRole('button', { name: 'Add a rosette' }));
    const b = ringColours('Rosette B');
    // The centre and the first ring colour round it change places.
    expect(b[0]).not.toBe(one[0]);
    expect(one).toContain(b[0]);
    expect(b).toContain(one[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Same as A' }));
    expect(ringColours('Rosette B')).toEqual(ringColours('Rosette A'));
  });

  it('paints one ring of one rosette from its row', () => {
    atColor();
    fireEvent.click(
      within(screen.getByRole('region', { name: 'Rosette B' })).getAllByRole(
        'button',
        { name: /^Recolor ring/ },
      )[0] as Element,
    );
    fireEvent.change(screen.getByLabelText(/Any color/), {
      target: { value: '#123456' },
    });
    expect(ringColours('Rosette B')[0]).toBe('#123456');
    expect(ringColours('Rosette A')[0]).not.toBe('#123456');
  });

  it('switches to colouring by shape, and back', () => {
    atColor();
    fireEvent.click(screen.getByRole('button', { name: 'By shape' }));
    expect(screen.getByRole('button', { name: 'Recolor every star' }));
    expect(screen.queryByRole('region', { name: 'Rosette A' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Ring by ring' }));
    expect(screen.getByRole('region', { name: 'Rosette A' })).toBeTruthy();
  });
});

describe('the unit that repeats', () => {
  it('draws one whole rosette of each family, and switches back to the wall', () => {
    atColor(zellige);
    fireEvent.click(screen.getByRole('button', { name: /^Unit$/ }));
    const unit = screen.getByRole('img', { name: 'The unit that repeats' });
    const loaded = loadModel(zellige);
    const star = loaded.pattern.types.findIndex((t) => t.name === 'star');
    // Two rosettes take turns: one centre star each.
    expect(
      unit.querySelectorAll(`.unit-piece[data-type="${star}"]`),
    ).toHaveLength(2);
    fireEvent.click(
      screen.getByRole('button', { name: 'Colour every rosette alike' }),
    );
    expect(
      screen
        .getByRole('img', { name: 'The unit that repeats' })
        .querySelectorAll(`.unit-piece[data-type="${star}"]`),
    ).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: /^Wall$/ }));
    expect(
      screen.queryByRole('img', { name: 'The unit that repeats' }),
    ).toBeNull();
  });

  it('opens a piece’s ring when it is clicked in the unit', () => {
    atColor(zellige);
    fireEvent.click(screen.getByRole('button', { name: /^Unit$/ }));
    const piece = document.querySelector('.unit-piece') as Element;
    fireEvent.click(piece);
    expect(document.querySelector('.ring-rows li.active')).toBeTruthy();
  });
});
