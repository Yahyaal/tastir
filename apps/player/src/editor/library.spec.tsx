import { act, fireEvent, render, screen } from '@testing-library/react';
import example from '@tutorials/eight-fold-star-and-cross.json';
import { expectedGolden, goldenOf } from '@tastir/engine';
import { parseTutorial } from '@tastir/schema';
import App from '../app/app';
import { LIBRARY_SENDING, libraryFile } from './AboutPanel';
import { copyUpTo } from './document';
import { tutorialOf } from './finish';
import { addPattern } from './patterns';

const star = parseTutorial(example);

afterEach(() => {
  window.location.hash = '';
});

describe('send to the library', () => {
  it('makes a library-ready file with the maker in its credits', () => {
    const made = tutorialOf({ ...star, title: 'My Octagon Star' });
    if (!('tutorial' in made)) throw new Error(made.reason);
    const file = libraryFile(made.tutorial, '  A. Learner ', 'From a book.');
    expect(file.id).toBe('my-octagon-star');
    expect(file.credits.at(-1)).toEqual({
      source: 'Made with the Tastir editor',
      creator: 'A. Learner',
      note: 'From a book.',
    });
    // It reads as a tutorial and passes the golden checks as it stands.
    const again = parseTutorial(JSON.parse(JSON.stringify(file)));
    expect(goldenOf(again)).toEqual(expectedGolden(again));
    // Made twice, the maker is named once.
    expect(
      libraryFile(file, 'B').credits.filter(
        (c) => c.source === 'Made with the Tastir editor',
      ),
    ).toHaveLength(1);
  });

  it('is not offered until there is somewhere to send it', () => {
    const p = addPattern({
      ...copyUpTo(star, 6),
      ink: star.ink,
      pattern: star.pattern,
    });
    act(() => {
      window.location.hash = `#/edit/${p?.id}`;
    });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'About the pattern' }));
    expect(LIBRARY_SENDING).toBe(false);
    expect(
      screen.queryByRole('button', { name: 'Make the library file' }),
    ).toBeNull();
  });
});
