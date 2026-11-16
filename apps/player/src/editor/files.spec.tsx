import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import example from '@tutorials/eight-fold-star-and-cross.json';
import { parseTutorial } from '@tastir/schema';
import App from '../app/app';
import { changeStep, copyUpTo } from './document';
import { patternFile, readPattern, viewPatternFile } from './files';
import { addPattern, listPatterns } from './patterns';
import { listDesigns } from '../app/designs';
import { NewPattern } from './PatternShelf';
import { DEFAULT_JALI } from '../app/jali';
import { DEFAULT_PEN } from '../app/pen';

const star = parseTutorial(example);

afterEach(() => {
  window.location.hash = '';
  vi.restoreAllMocks();
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

  it('leaves the library’s places out of a copy', () => {
    // The star and cross is also found in the Comares; the copy is the
    // learner's own pattern, so it names no building.
    expect(star.places?.length).toBeGreaterThan(0);
    expect(copyUpTo(star, 3)).not.toHaveProperty('places');
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

const appearance = {
  name: 'My blue design',
  coloring: { palette: 'Chefchaouen', chosen: { custom: '#123456' } },
  look: 'lines' as const,
  grout: 2,
  inked: ['segment-1', 'segment-2'],
  pen: { ...DEFAULT_PEN, pen: 'double' as const, ink: '#6b4226', wash: false },
  jali: DEFAULT_JALI,
};

describe('portable viewer pattern files', () => {
  it.each(['tiles', 'strapwork', 'interlace', 'lines', 'jali'] as const)(
    'round-trips the full construction and %s appearance',
    (look) => {
      const design = { ...appearance, look };
      const basedOn = { tutorial: star.id, title: star.title, step: 6 };
      const file = viewPatternFile(star, design, basedOn);
      expect(file.version).toBe(2);
      expect(readPattern(JSON.stringify(file))).toEqual({
        tutorial: star,
        design,
        basedOn,
        pattern: true,
      });
      expect(listPatterns()).toHaveLength(0);
      expect(listDesigns()).toHaveLength(0);
    },
  );
  it('rejects missing or damaged design metadata and unknown versions', () => {
    const file = viewPatternFile(star, appearance);
    for (const bad of [
      { ...file, design: undefined },
      {
        ...file,
        design: { ...appearance, pen: { ...DEFAULT_PEN, ink: 'not-a-colour' } },
      },
      { ...file, tutorial: copyUpTo(star, 2) },
      { ...file, version: 99 },
    ])
      expect(readPattern(JSON.stringify(bad))).toHaveProperty('reason');
  });
  it('opens a portable file as an editable local pattern with its saved design', async () => {
    const { inked: _inked, ...design } = appearance;
    render(<NewPattern />);
    const input = document.querySelector('input[type=file]');
    if (!input) throw new Error('File input missing');
    fireEvent.change(input, {
      target: {
        files: [
          new File(
            [JSON.stringify(viewPatternFile(star, design))],
            'mine.tastir.json',
          ),
        ],
      },
    });
    await waitFor(() => expect(listDesigns()).toHaveLength(1));
    const pattern = listPatterns()[0];
    const saved = listDesigns()[0];
    expect(saved).toMatchObject({ ...design, tutorial: `mine/${pattern?.id}` });
    expect(window.location.hash).toBe(
      `#/mine/${pattern?.id}/design/${saved?.id}`,
    );
    expect(pattern?.tutorial.steps).toEqual(star.steps);
  });
  it('rolls back only the new pattern when storage refuses its appearance', async () => {
    const original = addPattern(copyUpTo(star, 2));
    const persist = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
      this: Storage,
      key,
      value,
    ) {
      if (key === 'tastir.designs')
        throw new DOMException('Full', 'QuotaExceededError');
      persist.call(this, key, value);
    });
    render(<NewPattern />);
    const input = document.querySelector('input[type=file]');
    if (!input) throw new Error('File input missing');
    fireEvent.change(input, {
      target: {
        files: [
          new File(
            [
              JSON.stringify(
                viewPatternFile(star, { ...appearance, inked: undefined }),
              ),
            ],
            'mine.tastir.json',
          ),
        ],
      },
    });
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toContain('could not keep'),
    );
    expect(listPatterns()).toEqual([original]);
    expect(listDesigns()).toHaveLength(0);
  });
});
