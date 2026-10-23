import { act, fireEvent, render, screen, within } from '@testing-library/react';
import example from '@tutorials/eight-fold-star-and-cross.json';
import { parseTutorial } from '@tastir/schema';
import App from '../app/app';
import { check, copyUpTo } from './document';
import { addPattern, getPattern } from './patterns';

const star = parseTutorial(example);

function open(id: string) {
  act(() => {
    window.location.hash = `#/edit/${id}`;
  });
  render(<App />);
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
      name: new RegExp(`${name}$`),
    }),
  );

afterEach(() => {
  window.location.hash = '';
});

describe('the editor’s worst gaps', () => {
  it('lets the learner choose which side a touching circle takes', () => {
    const p = addPattern(copyUpTo(star, 3));
    open(p?.id ?? '');
    // A circle about E through O, then a circle about N touching it:
    // one just touching it, one going round it.
    tool('Circle');
    clickAt(1, 0);
    clickAt(0, 0);
    tool('Touching circle');
    clickAt(0, 1);
    clickAt(
      1 + Math.cos((250 * Math.PI) / 180),
      Math.sin((250 * Math.PI) / 180),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.getByText(/Two circles fit/)).toBeTruthy();
    expect(
      document.querySelectorAll('.editor-drawing .candidate'),
    ).toHaveLength(2);
    // Click the small one, just above N.
    clickAt(0, 1 + Math.SQRT2 - 1);
    const steps = getPattern(p?.id ?? '')?.tutorial.steps ?? [];
    expect(steps).toHaveLength(5);
    expect(Object.values(steps[4]?.create ?? {})).toContainEqual({
      circle: { centre: 'N', tangentTo: ['C1'], touch: 'near' },
    });
  });

  it('adds a step after the selected one, with only what exists by then', () => {
    const p = addPattern(copyUpTo(star, 3));
    open(p?.id ?? '');
    fireEvent.click(
      screen.getAllByRole('button', { name: /^1/ })[0] as Element,
    );
    fireEvent.click(screen.getByLabelText('Add after step 1'));
    // N is made in step 2, so after step 1 there is no point there.
    tool('Circle');
    clickAt(0, 1);
    expect(screen.getByText(/There is no point there/)).toBeTruthy();
    clickAt(1, 0);
    clickAt(0, 0);
    const saved = getPattern(p?.id ?? '')?.tutorial;
    expect(saved?.steps.map((s) => s.id)).toEqual([1, 2, 3, 4]);
    expect(Object.values(saved?.steps[1]?.create ?? {})).toEqual([
      { circle: { centre: 'A', through: 'O' } },
    ]);
    expect([...check(saved as never).status.values()].every((s) => s.ok)).toBe(
      true,
    );
  });
});
