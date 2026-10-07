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
import { LIBRARY } from '../app/library';
import { changeStep, type Draft } from './document';
import { tutorialOf } from './finish';

// Every library tutorial, opened in the editor, edited and saved again,
// must still pass every check of the golden test, with the same pieces.
describe.each(LIBRARY.map((e) => e.id))('%s through the editor', (id) => {
  const original = parseTutorial(LIBRARY.find((e) => e.id === id)?.json);
  let draft: Draft = original;
  draft = changeStep(draft, 1, { text: 'Edited in the editor.' });
  const made = tutorialOf(draft);

  it('saves as a whole tutorial file', () => {
    if (!('tutorial' in made)) throw new Error(made.reason);
    // The file is plain JSON and reads back the same.
    expect(parseTutorial(JSON.parse(JSON.stringify(made.tutorial)))).toEqual(
      made.tutorial,
    );
    expect(made.tutorial.steps[0]?.text).toBe('Edited in the editor.');
  });

  it('passes the golden test with the original’s pieces and names', () => {
    if (!('tutorial' in made)) throw new Error(made.reason);
    const t = made.tutorial;
    const scene = evaluate(t);
    const pattern = computePattern(scene, t);
    expect(goldenOf(t, scene, pattern)).toEqual(expectedGolden(t));
    expect(expectedGolden(t).pieces).toEqual(expectedGolden(original).pieces);
    expect(strokesOffConstruction(scene, pattern.ink)).toEqual([]);
    expect(strokesOffCrossings(scene, pattern)).toEqual([]);
    expect(hasSymmetry(pattern, t.fold, undefined, undefined, !t.chiral)).toBe(
      true,
    );
    // Its colors and placements still name its pieces.
    expect(t.pattern.colors).toEqual(original.pattern.colors);
    expect(t.pattern.placements).toEqual(original.pattern.placements);
    expect(t.credits).toEqual(original.credits);
    expect(t.photos).toEqual(original.photos);
  });
});
