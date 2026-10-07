import { act, fireEvent, render, screen, within } from '@testing-library/react';
import example from '@tutorials/eight-fold-star-and-cross.json';
import bouInania from '@tutorials/bou-inania-rosette.json';
import { parseTutorial } from '@tastir/schema';
import App from '../app/app';
import { check, copyUpTo } from './document';
import { addPattern, listPatterns } from './patterns';
import { snap } from './tools';

const star = parseTutorial(example);

function open(id: string) {
  act(() => {
    window.location.hash = `#/edit/${id}`;
  });
  return render(<App />);
}

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

const tool = (name: string) =>
  fireEvent.click(
    within(screen.getByRole('toolbar', { name: 'Tools' })).getByRole('button', {
      name: new RegExp(name),
    }),
  );

afterEach(() => {
  window.location.hash = '';
});

describe('the fixes from the editor report', () => {
  it('lists my patterns on the home page, with edit, play, rename and delete', () => {
    const a = addPattern(copyUpTo(star, 3));
    render(<App />);
    const shelf = screen.getByRole('region', { name: 'My patterns' });
    expect(
      within(shelf).getByRole('link', { name: 'Edit' }).getAttribute('href'),
    ).toBe(`#/edit/${a?.id}`);
    // Not tiled or inked yet: no Play.
    expect(within(shelf).queryByRole('link', { name: 'Play' })).toBeNull();
    expect(
      screen.getByRole('button', { name: 'My patterns (1)' }),
    ).toBeTruthy();
    fireEvent.click(within(shelf).getByRole('button', { name: 'Rename' }));
    fireEvent.change(within(shelf).getByLabelText(/New name/), {
      target: { value: 'Octagons' },
    });
    fireEvent.click(within(shelf).getByRole('button', { name: 'Rename' }));
    expect(listPatterns()[0]?.tutorial.title).toBe('Octagons');
    fireEvent.click(within(shelf).getByRole('button', { name: 'Delete' }));
    expect(within(shelf).getByText(/Delete “Octagons”\?/)).toBeTruthy();
    fireEvent.click(within(shelf).getByRole('button', { name: 'Delete' }));
    expect(listPatterns()).toEqual([]);
    expect(screen.queryByRole('region', { name: 'My patterns' })).toBeNull();
  });

  it('shows Play for a pattern that is tiled and inked', () => {
    addPattern(star);
    render(<App />);
    const shelf = screen.getByRole('region', { name: 'My patterns' });
    expect(within(shelf).getByRole('link', { name: 'Play' })).toBeTruthy();
  });

  it('uses E, not the given A, where both name one point', () => {
    const { scene } = check(copyUpTo(star, 3));
    expect(snap(scene, { x: 1, y: 0 }, 0.05, 'point')).toMatchObject({
      name: 'E',
    });
    expect(snap(scene, { x: 0, y: 0 }, 0.05, 'point')).toMatchObject({
      name: 'O',
    });
  });

  it('writes about circles and lines in plain words, not their names', () => {
    const p = addPattern(copyUpTo(star, 3));
    open(p?.id ?? '');
    tool('Same opening');
    clickAt(0.6, 0.8); // on the first circle
    clickAt(Math.SQRT1_2, Math.SQRT1_2); // NE
    expect(screen.getByLabelText('Text the learner reads')).toHaveProperty(
      'value',
      'Keep the opening of the circle about O through A and draw a circle about NE.',
    );
    // The saved form is folded away.
    expect(
      (document.querySelector('.saved-form') as HTMLDetailsElement).open,
    ).toBe(false);
  });

  it('closes the delete question after a delete, and Escape cancels a tool', () => {
    const p = addPattern(copyUpTo(star, 3));
    open(p?.id ?? '');
    fireEvent.click(
      screen.getAllByRole('button', { name: /^2/ })[0] as Element,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(screen.getByRole('button', { name: 'Only step 2' }));
    expect(screen.queryByRole('group', { name: 'Delete' })).toBeNull();
    tool('Polygon');
    clickAt(0, 0);
    const row = document.querySelector(
      '.editor-caption .ink-tools',
    ) as HTMLElement;
    expect(row.style.visibility).toBe('visible');
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(row.style.visibility).toBe('hidden');
  });

  it('draws no point names on a big copy until the pointer comes near', () => {
    const p = addPattern(copyUpTo(parseTutorial(bouInania), 14));
    open(p?.id ?? '');
    // Only the selected step's own points are named, not all 1535.
    expect(
      document.querySelectorAll('.editor-drawing .point-name').length,
    ).toBeLessThanOrEqual(10);
  });
});
