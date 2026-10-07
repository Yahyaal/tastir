import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { evaluate, angleDeg } from '@tastir/engine';
import type { Tutorial } from '@tastir/schema';
import App from '../app/app';
import { emptyDraft } from './document';
import { addPattern, getPattern } from './patterns';

/** Opens the editor on a new, empty pattern, as an address would. */
function openEmpty() {
  const p = addPattern(emptyDraft('mine', 'My pattern'));
  act(() => {
    window.location.hash = `#/edit/${p?.id}`;
  });
  render(<App />);
  // The drawing is 400 px square on the screen.
  const svg = screen.getByRole('img', { name: 'The construction so far' });
  svg.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 400, height: 400 }) as DOMRect;
  return p?.id ?? '';
}

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
      name: new RegExp(name),
    }),
  );
const steps = () =>
  [...document.querySelectorAll('.editor-step .t')].map((t) => t.textContent);

afterEach(() => {
  window.location.hash = '';
});

describe('the editor', () => {
  it('draws the first steps of the star and cross by clicking', () => {
    const id = openEmpty();
    // The circle: centre O, through A.
    tool('Compass');
    clickAt(0, 0);
    clickAt(1, 0);
    // The horizontal through O and A, and the vertical square to it.
    tool('Ruler');
    clickAt(0, 0);
    clickAt(1, 0);
    tool('Square to');
    clickAt(-0.5, 0);
    clickAt(0, 0);
    // Halve the right angle: A, the corner O, and the crossing at the top,
    // which the step names with the rule that picks it.
    tool('Halve angle');
    clickAt(1, 0);
    clickAt(0, 0);
    clickAt(0, 1);
    expect(steps()).toEqual([
      'Put the compass point on O and draw a circle through A.',
      'Draw a line through O and A.',
      'Draw a line through O, square to the line through O and A.',
      'Halve the angle A–O–P1 with a line through O.',
    ]);
    const saved = getPattern(id)?.tutorial;
    expect(saved?.steps[3]?.create).toEqual({
      P1: { point: { meet: ['C1', 'L2'], pick: { angle: 90 } } },
      L3: { line: { through: 'O', bisects: ['A', 'O', 'P1'] } },
    });
    // The engine draws it: the diagonal at 45°.
    const scene = evaluate(saved as Tutorial);
    const l3 = scene.elements.get('L3')?.geometry;
    expect(l3?.kind).toBe('line');
    if (l3?.kind === 'line')
      expect(((angleDeg(l3.line.dir) % 180) + 180) % 180).toBeCloseTo(45, 9);
  });

  it('only takes points that exist', () => {
    openEmpty();
    tool('Compass');
    clickAt(0.5, 0.5);
    expect(screen.getByText(/There is no point there/)).toBeTruthy();
    expect(steps()).toEqual([]);
  });

  it('undoes and redoes, and the step text is editable', () => {
    const id = openEmpty();
    tool('Compass');
    clickAt(0, 0);
    clickAt(1, 0);
    tool('Ruler');
    clickAt(0, 0);
    clickAt(1, 0);
    expect(steps()).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(steps()).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Redo' }));
    expect(steps()).toHaveLength(2);
    fireEvent.change(screen.getByLabelText('Text the learner reads'), {
      target: { value: 'Rule the horizontal.' },
    });
    expect(getPattern(id)?.tutorial.steps[1]?.text).toBe(
      'Rule the horizontal.',
    );
    // A run of typing is one undo.
    fireEvent.change(screen.getByLabelText('Text the learner reads'), {
      target: { value: 'Rule the horizontal line.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(getPattern(id)?.tutorial.steps[1]?.text).toBe(
      'Draw a line through O and A.',
    );
  });

  it('marks broken steps in red, and deletes a step with those built on it', () => {
    openEmpty();
    tool('Compass');
    clickAt(0, 0);
    clickAt(1, 0);
    tool('Ruler');
    clickAt(0, 0);
    clickAt(1, 0);
    tool('Square to');
    clickAt(-0.5, 0);
    clickAt(0, 0);
    // Deleting the horizontal alone breaks the vertical square to it.
    fireEvent.click(
      screen.getAllByRole('button', { name: /^2/ })[0] as Element,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByText(/Step 2 is used by step 3/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Only step 2' }));
    expect(document.querySelectorAll('.editor-step.broken')).toHaveLength(1);
    expect(screen.getByText('One step is broken.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /^2/ }));
    expect(screen.getByRole('alert').textContent).toMatch(
      /This step is broken. It uses L1, which no earlier step makes/,
    );
    // Undo, then delete both.
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    fireEvent.click(
      screen.getAllByRole('button', { name: /^2/ })[0] as Element,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete both' }));
    expect(steps()).toHaveLength(1);
  });

  it('says so when the pattern is not in this browser', () => {
    act(() => {
      window.location.hash = '#/edit/nothing';
    });
    render(<App />);
    expect(
      screen.getByRole('heading', { name: 'This pattern is not here' }),
    ).toBeTruthy();
  });
});
