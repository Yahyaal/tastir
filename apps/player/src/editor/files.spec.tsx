import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import example from '@tutorials/eight-fold-star-and-cross.json';
import { parseTutorial } from '@tastir/schema';
import App from '../app/app';
import { changeStep, copyUpTo } from './document';
import { patternFile, readPattern } from './files';
import { addPattern, listPatterns } from './patterns';

const star = parseTutorial(example);

afterEach(() => {
  window.location.hash = '';
});

describe('pattern files', () => {
  it('reads back a pattern file the editor wrote, unfinished or not', () => {
    const draft = changeStep(copyUpTo(star, 3), 1, { text: 'Mine.' });
    const p = addPattern(draft, {
      tutorial: star.id,
      title: star.title,
      step: 3,
    });
    if (!p) throw new Error();
    const text = JSON.stringify(patternFile(p));
    const read = readPattern(text);
    expect(read).toEqual({
      pattern: true,
      tutorial: draft,
      basedOn: p.basedOn,
    });
  });

  it('reads a library tutorial file too', () => {
    const read = readPattern(JSON.stringify(example));
    if ('reason' in read) throw new Error(read.reason);
    expect(read.tutorial.steps).toHaveLength(6);
  });

  it('says plainly what is wrong with any other file', () => {
    expect(readPattern('not json')).toEqual({
      reason: 'This is not a pattern file: it is not JSON.',
    });
    expect(readPattern('{"hello": 1}')).toEqual({
      reason: 'This is not a pattern file: it has no title and steps.',
    });
  });

  it('opens a file from the home page into the editor', async () => {
    // Without the library cards, so the home page draws quickly.
    render(<App entries={[]} />);
    const input = document.querySelector(
      '.new-pattern input[type=file]',
    ) as HTMLInputElement;
    const file = new File([JSON.stringify(example)], 'star.json', {
      type: 'application/json',
    });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(listPatterns()).toHaveLength(1), {
      timeout: 5000,
    });
    expect(window.location.hash).toBe(`#/edit/${listPatterns()[0]?.id}`);
    // A library tutorial becomes one's own, so it is not mistaken for it.
    expect(listPatterns()[0]?.tutorial.title).toBe(
      'My Eight-fold star and cross',
    );
  });

  it('shows why a file cannot be opened', async () => {
    // Without the library cards, so the home page draws quickly.
    render(<App entries={[]} />);
    const input = document.querySelector(
      '.new-pattern input[type=file]',
    ) as HTMLInputElement;
    fireEvent.change(input, {
      target: { files: [new File(['nonsense'], 'x.json')] },
    });
    await waitFor(
      () => expect(screen.getByRole('alert').textContent).toMatch(/not JSON/),
      { timeout: 5000 },
    );
  });
});
