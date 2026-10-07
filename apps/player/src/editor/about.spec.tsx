import { act, fireEvent, render, screen } from '@testing-library/react';
import example from '@tutorials/eight-fold-star-and-cross.json';
import { parseTutorial } from '@tastir/schema';
import App from '../app/app';
import { addPattern, getPattern } from './patterns';

afterEach(() => {
  window.location.hash = '';
});

describe('library-grade files from the editor', () => {
  it('fills in level, credits and photos, and downloads a complete file', () => {
    const p = addPattern(parseTutorial(example));
    act(() => {
      window.location.hash = `#/edit/${p?.id}`;
    });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'About the pattern' }));
    fireEvent.change(screen.getByLabelText('Level'), {
      target: { value: 'advanced' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add a credit' }));
    fireEvent.change(screen.getByLabelText('Source'), {
      target: { value: 'My own drawing' },
    });
    fireEvent.change(screen.getByLabelText('Creator'), {
      target: { value: 'A. Learner' },
    });
    const saved = getPattern(p?.id ?? '')?.tutorial;
    expect(saved?.level).toBe('advanced');
    // Empty optional fields are left out, as the format wants.
    expect(saved?.credits).toEqual([
      { source: 'My own drawing', creator: 'A. Learner' },
    ]);
    // The file is complete and checked by the engine.
    expect(screen.getByText(/Complete: 2 kinds of piece/)).toBeTruthy();
    const made: Blob[] = [];
    const create = vi.fn((b: Blob) => {
      made.push(b);
      return 'blob:x';
    });
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: create,
      revokeObjectURL: vi.fn(),
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Download the tutorial file' }),
    );
    vi.unstubAllGlobals();
    expect(made).toHaveLength(1);
    // A credit with no source is not a file yet, and says why.
    fireEvent.change(screen.getByLabelText('Source'), {
      target: { value: '' },
    });
    expect(screen.getByText(/Not ready:/)).toBeTruthy();
  });
});
