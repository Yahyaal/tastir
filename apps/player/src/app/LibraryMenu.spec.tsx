import { fireEvent, render, screen } from '@testing-library/react';
import type { Entry } from './library';
import { LibraryDrawer, LibraryMenu } from './LibraryMenu';

const at = (id: string, region: string, fold: number): Entry => ({
  id,
  json: { title: id, region, fold, level: 'beginner', style: 'Moroccan' },
});
const cards = [
  at('fes', 'Morocco', 8),
  at('meknes', 'Morocco', 12),
  at('isfahan', 'Iran', 10),
];

describe('the library side menu', () => {
  it('lists each value with its count and chooses it', () => {
    const onChange = vi.fn();
    render(<LibraryMenu entries={cards} filters={{}} onChange={onChange} />);
    const morocco = screen.getByRole('button', { name: /Morocco/ });
    expect(morocco.textContent).toBe('Morocco2');
    fireEvent.click(morocco);
    expect(onChange).toHaveBeenCalledWith({ key: 'region', value: 'Morocco' });
  });

  it('clears a chosen value and greys out values with no card', () => {
    const onChange = vi.fn();
    render(
      <LibraryMenu
        entries={cards}
        filters={{ region: 'Morocco' }}
        onChange={onChange}
      />,
    );
    const morocco = screen.getByRole('button', { name: /Morocco/ });
    expect(morocco.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(morocco);
    expect(onChange).toHaveBeenCalledWith({ key: 'region', value: undefined });
    // No Moroccan card is ten-fold.
    const ten = screen.getByRole('button', {
      name: /10-fold/,
    }) as HTMLButtonElement;
    expect(ten.disabled).toBe(true);
  });

  it('opens as a drawer that Escape and its button close', () => {
    const onClose = vi.fn();
    render(
      <LibraryDrawer onClose={onClose} shown={2}>
        <LibraryMenu entries={cards} filters={{}} onChange={() => undefined} />
      </LibraryDrawer>,
    );
    expect(
      screen.getByRole('dialog', { name: 'Browse the patterns' }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Show 2 patterns' }));
    fireEvent.keyDown(document.activeElement ?? document.body, {
      key: 'Escape',
    });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
