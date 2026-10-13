import { fireEvent, render, screen } from '@testing-library/react';
import example from '@tutorials/eight-fold-star-and-cross.json';
import { Play } from './app';

const label = () => document.querySelector('.label')?.textContent;
const click = (name: string) =>
  fireEvent.click(screen.getByRole('button', { name }));
const inked = () => document.querySelectorAll('.free-ink .piece-line.inked');
/** The pieces the color stage names: its buttons, and the unit's pieces
 * when it is coloured ring by ring. */
const legend = () => {
  const unit = screen.queryByRole('button', { name: /^Unit$/ });
  if (unit) fireEvent.click(unit);
  const out = [...document.querySelectorAll('.piece-button, .unit-piece')].map(
    (b) => b.getAttribute('aria-label'),
  );
  const wall = screen.queryByRole('button', { name: /^Wall$/ });
  if (wall) fireEvent.click(wall);
  return out;
};

/** Opens the star and cross at its ink stage, with reduced motion. */
function atInk() {
  render(<Play json={example} />);
  fireEvent.click(screen.getByLabelText('Reduce motion'));
  for (let i = 0; i < 6; i++) click('Next');
  expect(label()).toBe('Ink');
}

describe('free inking', () => {
  it('shows every piece of construction, with the classic inked', () => {
    atInk();
    click('Make your own');
    const all = document.querySelectorAll('.free-ink .piece-line');
    expect(all.length).toBeGreaterThan(16);
    expect(inked()).toHaveLength(16);
  });

  it('erases a piece, and the repeat and colors follow; Back to the classic restores it', () => {
    atInk();
    click('Make your own');
    fireEvent.click(inked()[0] as Element);
    expect(inked()).toHaveLength(15);
    expect(screen.getByText(/Your own pattern/)).toBeTruthy();
    click('Next'); // repeat
    expect(
      document.querySelector('.ink.original use')?.getAttribute('href'),
    ).toBe(`#${document.querySelector('defs path.tile-ink')?.id}`);
    expect(
      document
        .querySelector('defs path.tile-ink')
        ?.getAttribute('d')
        ?.split('M').length,
    ).toBe(16);
    click('Next'); // color: with one stroke gone, the star and cross merge
    expect(legend()).not.toContain('Paint ring 1, the stars');
    click('Back');
    click('Back');
    click('Back to the classic');
    expect(inked()).toHaveLength(16);
    click('Next');
    click('Next');
    expect(legend()).toContain('Paint ring 1, the stars');
  });

  it('inks a new piece with a click', () => {
    atInk();
    click('Make your own');
    const blank = document.querySelector(
      '.free-ink .piece-line:not(.inked)',
    ) as Element;
    fireEvent.click(blank);
    expect(inked()).toHaveLength(17);
    expect(
      screen.getByRole('button', { name: 'Back to the classic' }),
    ).toBeTruthy();
  });
});
