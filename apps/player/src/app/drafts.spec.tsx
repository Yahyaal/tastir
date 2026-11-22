import { fireEvent, render, screen, within } from '@testing-library/react';
import example from '@tutorials/eight-fold-star-and-cross.json';
import { Play } from './app';
import { draftOf } from './drafts';
import { listDesigns } from './designs';

const palette = () => screen.getByRole('group', { name: 'Palette' });
const pressed = () =>
  within(palette())
    .getAllByRole('button')
    .find((b) => b.getAttribute('aria-pressed') === 'true')?.textContent;

describe('changes before a design has a name', () => {
  it('are kept in this browser and come back, until the colours are reset', () => {
    const first = render(<Play json={example} start="result" />);
    // Nothing changed yet: nothing kept, nothing said.
    expect(draftOf('eight-fold-star-and-cross')).toBeUndefined();
    fireEvent.click(
      within(palette()).getByRole('button', { name: /Alhambra/ }),
    );
    expect(pressed()).toMatch(/Alhambra/);
    expect(draftOf('eight-fold-star-and-cross')?.coloring.palette).toBe(
      'Alhambra',
    );
    // Save says so on hover, with a dot.
    const save = screen.getByRole('button', { name: 'Save' });
    expect(save.title).toMatch(/kept in this browser only/);
    expect(save.classList.contains('pending')).toBe(true);
    first.unmount();

    // Coming back: the colours are as they were left, and it says so.
    render(<Play json={example} start="result" />);
    expect(pressed()).toMatch(/Alhambra/);
    expect(
      screen
        .getByRole('button', { name: 'Save' })
        .classList.contains('pending'),
    ).toBe(true);
    expect(listDesigns()).toHaveLength(0);

    // Back to the pattern's own colours: nothing left to keep.
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(draftOf('eight-fold-star-and-cross')).toBeUndefined();
  });
});
