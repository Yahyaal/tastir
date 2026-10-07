import { act, fireEvent, render, screen, within } from '@testing-library/react';
import example from '@tutorials/eight-fold-star-and-cross.json';
import { parseTutorial } from '@tastir/schema';
import App from '../app/app';
import { addBlock, blockFromSteps, insertBlock, listBlocks } from './blocks';
import { check, copyUpTo, emptyDraft } from './document';
import { addPattern, getPattern } from './patterns';

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

const steps = () => document.querySelectorAll('.editor-step');

afterEach(() => {
  window.location.hash = '';
});

describe('building blocks in the editor', () => {
  it('inserts “Divide a circle into eight” on a drawn circle; its steps appear, each undoable', () => {
    const p = addPattern(emptyDraft('mine', 'Mine'));
    open(p?.id ?? '');
    fireEvent.click(
      within(screen.getByRole('toolbar', { name: 'Tools' })).getByRole(
        'button',
        { name: /Compass/ },
      ),
    );
    clickAt(0, 0);
    clickAt(1, 0);
    expect(steps()).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Building blocks' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Divide a circle into eight' }),
    );
    expect(screen.getByText(/Click the circle\./)).toBeTruthy();
    clickAt(0.6, 0.8); // the circle
    clickAt(0, 0); // its centre
    clickAt(1, 0); // a point on it
    expect(steps()).toHaveLength(4);
    expect(document.querySelectorAll('.editor-step.broken')).toHaveLength(0);
    expect(
      screen.getByText(/Added “Divide a circle into eight”: 3 steps/),
    ).toBeTruthy();
    // One Undo takes the block out; Redo puts it back.
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(steps()).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Redo' }));
    expect(steps()).toHaveLength(4);
    // Each step is ordinary: the last can be deleted on its own.
    fireEvent.click(screen.getByRole('button', { name: 'This step' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(steps()).toHaveLength(3);
    expect(getPattern(p?.id ?? '')?.tutorial.steps).toHaveLength(3);
  });

  it('saves my own steps as a block, asking for what they use, and inserts it', () => {
    const star = parseTutorial(example);
    const d = copyUpTo(star, 4);
    const { scene } = check(d);
    // Steps 3 and 4 (the diagonals and the dynamic square) use the circle,
    // the two lines and the four points of step 2.
    const block = blockFromSteps(d, scene, 3, 4, 'Diagonals and square');
    if ('reason' in block) throw new Error(block.reason);
    expect(block.inputs.map((i) => [i.name, i.want])).toEqual([
      ['E', 'point'],
      ['N', 'point'],
      ['W', 'point'],
      ['c', 'circle'],
      ['S', 'point'],
    ]);
    expect(block.inputs[3]?.ask).toBe(
      'Click the circle about O through E (the one the steps used).',
    );
    expect(addBlock(block)).toBe(true);
    expect(listBlocks().map((b) => b.name)).toEqual(['Diagonals and square']);
    // Inserted again on the same things, it adds two working steps.
    const by = (n: string) => ({
      kind: 'point' as const,
      at: { x: 0, y: 0 },
      name: n,
    });
    // On a copy that stops before them, they come back as two steps.
    const before = copyUpTo(star, 2);
    const again = insertBlock(
      before,
      block,
      [by('E'), by('N'), by('W'), { kind: 'element', name: 'c' }, by('S')],
      before.steps.length,
    ).draft;
    expect(again.steps).toHaveLength(4);
    expect([...check(again).status.values()].every((s) => s.ok)).toBe(true);
  });

  it('saves a block from the step panel', () => {
    const p = addPattern(copyUpTo(parseTutorial(example), 4));
    open(p?.id ?? '');
    fireEvent.click(
      screen.getAllByRole('button', { name: /^3/ })[0] as Element,
    );
    fireEvent.change(screen.getByLabelText(/Steps 3 to/), {
      target: { value: '4' },
    });
    fireEvent.change(screen.getByLabelText('Block name'), {
      target: { value: 'Mine' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save the block' }));
    expect(screen.getByText(/Saved “Mine”/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Building blocks' }));
    expect(screen.getByRole('button', { name: 'Mine' })).toBeTruthy();
  });
});
