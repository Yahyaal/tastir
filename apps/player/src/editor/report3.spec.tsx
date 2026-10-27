import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import example from '@tutorials/eight-fold-star-and-cross.json';
import { parseTutorial } from '@tastir/schema';
import App from '../app/app';
import { addStep, check, copyUpTo, emptyDraft } from './document';
import { foldOf, isMotif } from './finish';
import { addPattern, getPattern } from './patterns';

const star = parseTutorial(example);

function open(id: string) {
  act(() => {
    window.location.hash = `#/edit/${id}`;
  });
  render(<App />);
}

afterEach(() => {
  window.location.hash = '';
});

/** A pattern drawn with symmetry ×6: a circle, and a circle on A turned. */
const sixFold = () =>
  addStep(
    addStep(emptyDraft('six', 'Six'), {
      text: 'The circle.',
      create: { C1: { circle: { centre: 'O', through: 'A' } } },
    }),
    {
      text: 'The flower.',
      create: {
        C2: { circle: { centre: 'A', through: 'O' } },
        R1: { repeat: { of: ['C2'], by: 'rot6' } },
      },
    },
  );

describe('the fixes from the phase 3 report', () => {
  it.each([1, 2])('keeps a chosen fold %i through inking and About', (fold) => {
    const p = addPattern({ ...sixFold(), fold });
    open(p?.id ?? '');
    fireEvent.click(screen.getByRole('button', { name: 'Ink' }));
    expect(screen.getByLabelText('Fold')).toHaveProperty('value', String(fold));
    expect(getPattern(p?.id ?? '')?.tutorial.fold).toBe(fold);
    fireEvent.click(screen.getByRole('button', { name: 'About the pattern' }));
    const selects = screen.getAllByLabelText('Fold');
    for (const select of selects) {
      expect(select).toHaveProperty('value', String(fold));
      expect(select.querySelector('option[value="1"]')?.textContent).toBe(
        '1 (mirror)',
      );
      expect(select.querySelector('option[value="2"]')).not.toBeNull();
    }
  });

  it('inks with the fold the steps were drawn with', () => {
    expect(foldOf(sixFold())).toBe(6);
    expect(foldOf(star)).toBe(8);
    const p = addPattern(sixFold());
    open(p?.id ?? '');
    fireEvent.click(screen.getByRole('button', { name: 'Ink' }));
    expect(getPattern(p?.id ?? '')?.tutorial.fold).toBe(6);
    expect(screen.getByLabelText('Fold')).toHaveProperty('value', '6');
  });

  it('does not offer the motif itself as the tile', () => {
    const d = copyUpTo(star, 6);
    const { scene } = check(d);
    // The dynamic square has its corners on the first circle: part of the
    // star. The square around the circle is a real tile.
    expect(isMotif(scene, 'dynamic')).toBe(true);
    expect(isMotif(scene, 'cell')).toBe(false);
    const p = addPattern(copyUpTo(star, 4));
    open(p?.id ?? '');
    expect(screen.queryByRole('button', { name: /as the tile/ })).toBeNull();
    expect(
      screen.getByText(/This shape is part of the pattern, not a tile/),
    ).toBeTruthy();
  });

  it('remembers the symmetry choice for each pattern', () => {
    const p = addPattern(emptyDraft('mine', 'Mine'));
    open(p?.id ?? '');
    fireEvent.change(screen.getByLabelText('Symmetry'), {
      target: { value: '6' },
    });
    cleanup();
    open(p?.id ?? '');
    expect(screen.getByLabelText('Symmetry')).toHaveProperty('value', '6');
  });
});
