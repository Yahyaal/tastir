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

    // Larger than the bed: cut into parts, with pins.
    fireEvent.change(screen.getByLabelText('Diameter'), { target: { value: '300' } });
    expect(screen.getByText(/in 4 parts, none longer than 250 mm/)).toBeTruthy();
    const pins = (_: string, el: Element | null) =>
      el?.tagName === 'P' && /\d+ pins of 1.75 mm filament, 11 mm long/.test(el.textContent ?? '');
    await waitFor(() => expect(screen.getByText(pins)).toBeTruthy(), {
      timeout: 20_000,
    });
    expect(screen.getByRole('button', { name: 'Download STLs (zip)' })).toBeTruthy();

    // Every kind of piece at once, then one kind on its own.
    const every = screen.getByRole('group', { name: 'Carving of Every piece' });
    act(() => within(every).getByRole('button', { name: 'Cushion' }).click());
    const groups = screen.getAllByRole('group', { name: /^Carving of / });
    for (const g of groups)
      expect(within(g).getByRole('button', { name: 'Cushion' }).getAttribute('aria-pressed')).toBe('true');
    act(() => within(groups[1]!).getByRole('button', { name: 'Raised' }).click());
    expect(within(every).queryByRole('button', { pressed: true })).toBeNull();

    // A mould for plaster: the plaster to mix, and the walls that stand upright.
    act(() => screen.getByRole('button', { name: 'Mould for plaster' }).click());
    await waitFor(() => expect(screen.getByText(/g of plaster/)).toBeTruthy(), { timeout: 20_000 });
    expect(screen.getByText(/The mould: /)).toBeTruthy();
    act(() => screen.getByRole('button', { name: 'Box for silicone' }).click());
    await waitFor(() => expect(screen.getByText(/ml/, { selector: 'p' })).toBeTruthy(), { timeout: 20_000 });
    expect(screen.getByText(/of silicone fills the box/)).toBeTruthy();
    // A box too large to print is built from boards.
    expect(screen.getByText(/build the box from boards instead: 320 mm × 320 mm inside/)).toBeTruthy();

    // Remembered for next time.
    const kept = JSON.parse(localStorage.getItem('tastir.make.eight-fold-star-and-cross') ?? '{}');
    expect(kept).toMatchObject({ shape: 'round', width: 300, print: 'box' });
  }, 30_000);

  it('makes a mitred border in parts', async () => {
    render(<Make json={example} address="eight-fold-star-and-cross" />);
    act(() => screen.getByRole('button', { name: 'Border' }).click());
    expect(screen.getByLabelText('Length')).toHaveProperty('value', '600');
    expect(screen.getByLabelText('Height')).toHaveProperty('value', '116');
    act(() => screen.getByRole('button', { name: 'Mitred ends' }).click());
    expect(screen.getByText(/four of them frame a panel/)).toBeTruthy();
    expect(screen.getByText(/in 3 parts/)).toBeTruthy();
    await waitFor(() => expect(screen.getByText('3 parts')).toBeTruthy(), { timeout: 20_000 });
    expect(screen.getByText('A1')).toBeTruthy();
    expect(screen.getByText('C1')).toBeTruthy();
  }, 30_000);
});
