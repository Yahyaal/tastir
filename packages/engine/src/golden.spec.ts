// The golden test: every tutorial in tutorials/ is evaluated, inked and cut
// into pieces, and the result must match the tutorial's expect block. An
// engine change that alters any tutorial's pieces fails here.
import { expectedGolden, goldenOf } from './lib/golden.js';
import { loadTutorial, tutorialFiles } from './test/tutorials.js';

const files = tutorialFiles();

it('finds the tutorials', () => {
  expect(files).toContain('eight-fold-star-and-cross.json');
});

describe.each(files)('%s', (file) => {
  it('matches its expect block', () => {
    const tutorial = loadTutorial(file);
    expect(goldenOf(tutorial)).toEqual(expectedGolden(tutorial));
  });
});

describe('the harness', () => {
  it('fails when one golden number changes', () => {
    const tutorial = loadTutorial('eight-fold-star-and-cross.json');
    const actual = goldenOf(tutorial);
    const changed = structuredClone(tutorial);
    (changed.expect.pieces[0] as { area: number }).area = 2.34316;
    expect(actual).not.toEqual(expectedGolden(changed));
  });
});
