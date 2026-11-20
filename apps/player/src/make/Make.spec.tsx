import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import example from '@tutorials/eight-fold-star-and-cross.json';
import { loadModel } from '@tastir/project-core/model';
import { tutorialColoring } from '../app/coloring';
import { colorRepeat, colouredModel, placeFills } from '../app/placement';
import type { Design } from '../app/designs';
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

  it('weaves the bands, and shapes them', async () => {
    render(<Make json={example} address="eight-fold-star-and-cross" />);
    await waitFor(() => expect(screen.getByText('PLA if printed solid')).toBeTruthy(), {
      timeout: 20_000,
    });
    const woven = screen.getByRole('checkbox', { name: /Woven/ }) as HTMLInputElement;
    expect(woven.checked).toBe(true);
    expect((screen.getByLabelText('Gap') as HTMLInputElement).value).toBe('1.5');
    const volume = () => screen.getByText(/cm³/).textContent;
    const before = volume();
    act(() => woven.click());
    expect(screen.queryByLabelText('Gap')).toBeNull();
    await waitFor(() => expect(volume()).not.toBe(before), { timeout: 20_000 });
    const group = screen.getByRole('group', { name: 'Band shape' });
    act(() => within(group).getByRole('button', { name: 'Double' }).click());
    expect(within(group).getByRole('button', { name: 'Double' }).getAttribute('aria-pressed')).toBe('true');
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull(), { timeout: 20_000 });
    const kept = JSON.parse(localStorage.getItem('tastir.make.eight-fold-star-and-cross') ?? '{}');
    expect(kept).toMatchObject({ woven: false, bands: 'double' });
  }, 40_000);

  it('pierces a screen, checks its bridges, and offers flat lines', async () => {
    render(<Make json={example} address="eight-fold-star-and-cross" />);
    const groups = () => screen.getAllByRole('group', { name: /^Carving of / });
    await waitFor(() => expect(groups().length).toBeGreaterThan(1), { timeout: 20_000 });
    act(() => within(groups()[1]!).getByRole('button', { name: 'Pierced' }).click());
    expect(screen.getByText(/Narrowest bridge of the screen: 3 mm/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Bands'), { target: { value: '1.2' } });
    expect(screen.getByText(/Narrowest bridge of the screen: 1.2 mm, under 1.5 mm/)).toBeTruthy();
    await waitFor(
      () => expect(screen.getByRole('button', { name: 'Download SVG' })).toHaveProperty('disabled', false),
      { timeout: 20_000 },
    );
    expect(screen.getByRole('button', { name: 'Download DXF' })).toHaveProperty('disabled', false);
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull(), { timeout: 20_000 });
  }, 40_000);

  it('carves a saved design under its own name, with its settings apart', async () => {
    const design = {
      id: 'd1',
      name: 'Blue floor',
      tutorial: 'eight-fold-star-and-cross',
      coloring: { palette: 'fes', method: 'kinds', rosettes: false, chosen: [], squareBands: false },
      look: 'tiles',
      grout: 1,
      created: '2026-11-19',
      updated: '2026-11-19',
    } as unknown as Design;
    render(<Make json={example} address="eight-fold-star-and-cross" design={design} />);
    expect(screen.getByRole('heading', { name: 'Make it in 3D: Blue floor' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Back to the pattern' }).getAttribute('href')).toBe(
      '#/eight-fold-star-and-cross/design/d1',
    );
    await waitFor(() => expect(screen.getByText('PLA if printed solid')).toBeTruthy(), { timeout: 20_000 });
    act(() => screen.getByRole('button', { name: 'Round' }).click());
    expect(localStorage.getItem('tastir.make.eight-fold-star-and-cross/design/d1')).toContain('"round"');
    expect(localStorage.getItem('tastir.make.eight-fold-star-and-cross')).toBeNull();
  }, 30_000);

  it('carves one kind deeper than the rest, and back', async () => {
    render(<Make json={example} address="eight-fold-star-and-cross" />);
    await waitFor(() => expect(screen.getByText('PLA if printed solid')).toBeTruthy(), { timeout: 20_000 });
    const volume = () => screen.getByText(/cm³/).textContent;
    const before = volume();
    const star = screen.getByLabelText('Depth of star') as HTMLInputElement;
    expect(star.value).toBe('8');
    fireEvent.change(star, { target: { value: '4' } });
    expect((screen.getByLabelText('Depth of cross') as HTMLInputElement).value).toBe('8');
    await waitFor(() => expect(volume()).not.toBe(before), { timeout: 20_000 });
    act(() => screen.getByRole('button', { name: 'Use the common depth' }).click());
    expect((screen.getByLabelText('Depth of star') as HTMLInputElement).value).toBe('8');
    await waitFor(() => expect(volume()).toBe(before), { timeout: 20_000 });
  }, 40_000);

  it('lays the pattern out as tile pieces in the colours of the wall, with magnets and a tray', async () => {
    render(<Make json={example} address="eight-fold-star-and-cross" />);
    act(() => screen.getByRole('button', { name: 'Tile pieces' }).click());
    await waitFor(() => expect(screen.getByText(/\d+ pieces on \d+ plates of the 256 mm bed/)).toBeTruthy(), {
      timeout: 20_000,
    });
    // Pieces are not carved.
    expect(screen.queryByRole('heading', { name: 'Carving' })).toBeNull();
    expect((screen.getByLabelText('Thickness') as HTMLInputElement).value).toBe('5');
    // Every colour is one the wall shows, and the frame's.
    const model = loadModel(example);
    const coloring = tutorialColoring(model);
    const coloured = colouredModel(model, coloring);
    const fill = placeFills(coloured, coloring);
    const [m, n] = colorRepeat(coloured);
    const wall = new Set<string>();
    model.pattern.pieces.forEach((_, k) => {
      for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) wall.add(fill(k, i, j).toLowerCase());
    });
    const swatches = [...document.querySelectorAll<HTMLElement>('.piece-swatch')].map((el) => el.style.background);
    expect(swatches.length).toBeGreaterThanOrEqual(2);
    const hex = (rgb: string) =>
      '#' + (rgb.match(/\d+/g) ?? []).slice(0, 3).map((n) => Number(n).toString(16).padStart(2, '0')).join('');
    const shown = swatches.map(hex);
    expect(shown.slice(0, -1).every((c) => wall.has(c))).toBe(true);
    expect(new Set(shown.slice(0, -1))).toEqual(wall);
    expect(screen.getByText(/frame strip × 4/)).toBeTruthy();
    expect(screen.getByText(/Magnets to buy:/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Download for Bambu Studio' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Plates as separate files (zip)' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Download layout' })).toBeTruthy();

    act(() => screen.getByRole('button', { name: 'None' }).click());
    await waitFor(() => expect(screen.getByText('No magnets.')).toBeTruthy(), { timeout: 20_000 });
    act(() => screen.getByLabelText(/A tray to lay the pieces in/).click());
    await waitFor(() => expect(screen.getByText(/and a tray in one part/)).toBeTruthy(), { timeout: 20_000 });
    expect(screen.getByRole('button', { name: 'Download tray' })).toBeTruthy();
    expect(JSON.parse(localStorage.getItem('tastir.make.eight-fold-star-and-cross') ?? '{}')).toMatchObject({
      print: 'pieces',
      magnet: 'none',
      tray: true,
    });
  }, 40_000);

  it('prints whole pieces, one set to a repeat, with no frame and no tray', async () => {
    render(<Make json={example} address="eight-fold-star-and-cross" />);
    act(() => screen.getByRole('button', { name: 'Tile' }).click());
    act(() => screen.getByRole('button', { name: 'Tile pieces' }).click());
    act(() => screen.getByRole('button', { name: 'Whole pieces' }).click());
    await waitFor(() => expect(screen.getByText(/1 × 1 repeat of .*: \d+ pieces on/)).toBeTruthy(), { timeout: 20_000 });
    const perRepeat = loadModel(example).pattern.pieces.length;
    expect(screen.getByText(`${perRepeat} pieces to a repeat.`, { exact: false })).toBeTruthy();
    expect(screen.queryByLabelText(/A tray to lay the pieces in/)).toBeNull();
    expect(screen.queryByText(/frame strip/)).toBeNull();
    fireEvent.change(screen.getByLabelText('Repeats across'), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText('Repeats down'), { target: { value: '2' } });
    await waitFor(() => expect(screen.getByRole('heading', { name: `${6 * perRepeat} pieces` })).toBeTruthy(), {
      timeout: 20_000,
    });
    expect(JSON.parse(localStorage.getItem('tastir.make.eight-fold-star-and-cross') ?? '{}')).toMatchObject({
      edges: 'whole',
      across: 3,
      down: 2,
    });
  }, 40_000);
});
