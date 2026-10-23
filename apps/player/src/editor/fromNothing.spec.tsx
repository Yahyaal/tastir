import { act, fireEvent, render, screen, within } from '@testing-library/react';
import example from '@tutorials/eight-fold-star-and-cross.json';
import {
  computePattern,
  evaluate,
  expectedGolden,
  goldenOf,
  hasSymmetry,
  strokesOffConstruction,
  strokesOffCrossings,
} from '@tastir/engine';
import { parseTutorial } from '@tastir/schema';
import App from '../app/app';
import { tutorialOf } from './finish';
import { getPattern, listPatterns } from './patterns';

/** Clicks the drawing at a point of the frame (x right, y up). */
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
      name: new RegExp(`${name}$`),
    }),
  );
const symmetry = (value: string) =>
  fireEvent.change(screen.getByLabelText('Symmetry'), { target: { value } });

afterEach(() => {
  window.location.hash = '';
});

/** Starts a new pattern from the home page. */
function startNew(): string {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'New pattern' }));
  const id = listPatterns()[0]?.id ?? '';
  expect(window.location.hash).toBe(`#/edit/${id}`);
  // The address changed under the test: show the editor it names.
  act(() => {
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
  return id;
}

describe('a pattern from nothing', () => {
  it('rebuilds the eight-fold star and cross by clicks, with symmetry, and its file passes the golden checks', () => {
    const id = startNew();
    // The circle about O through A.
    tool('Circle');
    clickAt(0, 0);
    clickAt(1, 0);
    // The horizontal, turned four times: the horizontal and the vertical.
    symmetry('4');
    tool('Line');
    clickAt(0, 0);
    clickAt(1, 0);
    // The square through the four points on the circle, turned eight
    // times: the second square at 45° comes with it.
    symmetry('8');
    tool('Polygon');
    for (const [x, y] of [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
      [1, 0],
    ] as const)
      clickAt(x, y);
    // A line touching the circle at A, square to the horizontal, turned
    // four times: the sides of the tile.
    symmetry('4');
    tool('Perpendicular');
    clickAt(-0.5, 0);
    clickAt(1, 0);
    // The tile: its corners, and the first again.
    tool('Tile');
    for (const [x, y] of [
      [1, 1],
      [-1, 1],
      [-1, -1],
      [1, -1],
      [1, 1],
    ] as const)
      clickAt(x, y);
    expect(document.querySelectorAll('.editor-step')).toHaveLength(5);
    // No duplicate copies: the horizontal turned ×4 gives one more line
    // (the vertical), the square turned ×8 one more square (at 45°).
    const saved = getPattern(id)?.tutorial;
    const groups = evaluate(saved as never);
    const members = (step: number) =>
      Object.keys(saved?.steps[step - 1]?.create ?? {}).flatMap((n) => {
        const g = groups.elements.get(n)?.geometry;
        return g?.kind === 'group' ? g.members : [];
      });
    expect(members(2)).toHaveLength(1);
    expect(members(3)).toHaveLength(1);
    expect(members(4)).toHaveLength(3);
    expect(saved?.steps[1]?.text).toMatch(/in steps of 90°/);
    expect(document.querySelectorAll('.editor-step.broken')).toHaveLength(0);
    // Ink one tip of the star: its turned and mirrored copies make all 16
    // (copies and whole lines are switched on by hand; both start off).
    fireEvent.click(screen.getByRole('button', { name: 'Ink' }));
    // A click inks only what it shows unless asked: both start off.
    for (const option of ['Keep it symmetric', 'Whole lines between points'])
      expect((screen.getByLabelText(option) as HTMLInputElement).checked).toBe(
        false,
      );
    fireEvent.click(screen.getByLabelText('Keep it symmetric'));
    fireEvent.click(screen.getByLabelText('Whole lines between points'));
    clickAt(0.854, 0.146);
    expect(document.querySelectorAll('.ink-piece.inked')).toHaveLength(16);

    const made = tutorialOf(getPattern(id)?.tutorial ?? ({} as never));
    if (!('tutorial' in made)) throw new Error(made.reason);
    const t = made.tutorial;
    const scene = evaluate(t);
    const pattern = computePattern(scene, t);
    // The same golden checks as the library's tutorials.
    expect(goldenOf(t, scene, pattern)).toEqual(expectedGolden(t));
    expect(strokesOffConstruction(scene, pattern.ink)).toEqual([]);
    expect(strokesOffCrossings(scene, pattern)).toEqual([]);
    expect(hasSymmetry(pattern, 8, undefined, undefined, true)).toBe(true);
    // And the same pieces as our star and cross.
    const ours = parseTutorial(example);
    const shapes = (g: ReturnType<typeof expectedGolden>) =>
      g.pieces.map((p) => [p.vertices, p.area, p.perCell]);
    expect(shapes(expectedGolden(t))).toEqual(shapes(expectedGolden(ours)));
  });
});
