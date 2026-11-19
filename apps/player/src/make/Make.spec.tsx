import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import example from '@tutorials/eight-fold-star-and-cross.json';
import { Make } from './Make';

describe('Make', () => {
  beforeEach(() => localStorage.clear());

  it('carves the pattern, changes what is made, and offers the files', async () => {
    render(<Make json={example} address="eight-fold-star-and-cross" />);
    await waitFor(() => expect(screen.getByText('PLA if printed solid')).toBeTruthy(), {
      timeout: 20_000,
    });
    expect(screen.getByRole('button', { name: 'Download 3MF' })).toHaveProperty('disabled', false);
    expect(screen.getByText(/fits the 256 mm bed/)).toBeTruthy();

    act(() => screen.getByRole('button', { name: 'Round' }).click());
    expect(screen.getByRole('button', { name: 'Round' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByLabelText('Diameter')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Diameter'), { target: { value: '300' } });
    expect(screen.getByText(/larger than the 256 mm bed/)).toBeTruthy();

    // Every kind of piece at once, then one kind on its own.
    const every = screen.getByRole('group', { name: 'Carving of Every piece' });
    act(() => within(every).getByRole('button', { name: 'Cushion' }).click());
    const groups = screen.getAllByRole('group', { name: /^Carving of / });
    for (const g of groups)
      expect(within(g).getByRole('button', { name: 'Cushion' }).getAttribute('aria-pressed')).toBe('true');
    act(() => within(groups[1]!).getByRole('button', { name: 'Raised' }).click());
    expect(within(every).queryByRole('button', { pressed: true })).toBeNull();

    // Remembered for next time.
    const kept = JSON.parse(localStorage.getItem('tastir.make.eight-fold-star-and-cross') ?? '{}');
    expect(kept).toMatchObject({ shape: 'round', width: 300 });
  }, 30_000);
});
