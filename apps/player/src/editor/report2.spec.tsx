import { act, fireEvent, render, screen, within } from '@testing-library/react';
import example from '@tutorials/eight-fold-star-and-cross.json';
import { parseTutorial } from '@tastir/schema';
import App from '../app/app';
import { addDesign, listDesigns } from '../app/designs';
import { copyUpTo } from './document';
import { addPattern, freeTitle, listPatterns } from './patterns';

const star = parseTutorial(example);

afterEach(() => {
  window.location.hash = '';
});

function clickAt(x: number, y: number) {
  const svg = screen.getByRole('img', { name: 'The construction so far' });
  svg.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 400, height: 400 }) as DOMRect;
  const [vx = 0, vy = 0, vw = 1, vh = 1] = (svg.getAttribute('viewBox') ?? '')
    .split(' ')
    .map(Number);
  const s = Math.min(400 / vw, 400 / vh);
  fireEvent.click(svg, {
    clientX: (x - vx) * s + (400 - vw * s) / 2,
    clientY: (-y - vy) * s + (400 - vh * s) / 2,
  });
}

describe('the fixes from the phase 2 report', () => {
  it('deleting a pattern says it has designs, and can delete them too', () => {
    const p = addPattern(star);
    addDesign({
      name: 'Blue',
      tutorial: `mine/${p?.id}`,
      coloring: { palette: 'Isfahan', chosen: {} },
      look: 'tiles',
      grout: 1,
    });
    window.location.hash = '#/work';
    render(<App />);
    const shelf = screen.getByRole('region', { name: 'My patterns' });
    fireEvent.click(within(shelf).getByRole('button', { name: 'Delete' }));
    expect(within(shelf).getByText(/It has one saved design/)).toBeTruthy();
    fireEvent.click(
      within(shelf).getByRole('button', { name: 'Only the pattern' }),
    );
    expect(listPatterns()).toEqual([]);
    expect(listDesigns()).toHaveLength(1);
    // The design's card says its pattern was deleted, rather than opening
    // a broken page.
    const designs = screen.getByRole('region', { name: 'My designs' });
    expect(within(designs).getByText(/Its pattern was deleted/)).toBeTruthy();
    expect(within(designs).queryByRole('link')).toBeNull();
  });

  it('says so when the learner inks outside the tile', () => {
    // The star and cross with its static square as the tile: the dynamic
    // square's tips lie outside it.
    const p = addPattern({
      ...copyUpTo(star, 6),
      pattern: { cell: 'static', colors: {} },
    });
    act(() => {
      window.location.hash = `#/edit/${p?.id}`;
    });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Ink' }));
    expect(document.querySelector('.tile-outline')).toBeTruthy();
    clickAt(0.9, 0.1); // near the tip at E, outside the tile
    expect(screen.getByText(/That line is outside the tile/)).toBeTruthy();
  });

  it('keeps the credit to the original, and names copies apart', () => {
    const first = addPattern({
      ...copyUpTo(star, 3),
      title: freeTitle(copyUpTo(star, 3).title),
    });
    expect(first?.tutorial.title).toBe('My Eight-fold star and cross');
    expect(freeTitle('My Eight-fold star and cross')).toBe(
      'My Eight-fold star and cross 2',
    );
    act(() => {
      window.location.hash = `#/edit/${first?.id}`;
    });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'About the pattern' }));
    expect(
      screen.getByText(/The credit to the original always stays/),
    ).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Remove credit/ })).toBeNull();
    expect(screen.queryByText(/apps\/player/)).toBeNull();
  });
});
