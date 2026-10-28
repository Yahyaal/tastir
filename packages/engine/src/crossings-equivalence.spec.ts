import { evaluate } from './lib/evaluate.js';
import { constructionCrossings } from './lib/checks.js';
import { constructionCrossings as referenceCrossings } from './test/reference/checks.js';
import { loadTutorial, tutorialFiles } from './test/tutorials.js';

for (const file of tutorialFiles()) {
  it(`${file}: preserves every construction crossing and its order`, () => {
    const scene = evaluate(loadTutorial(file));
    const expected = referenceCrossings(scene);
    const actual = constructionCrossings(scene);
    expect(actual.length).toBe(expected.length);
    // Exact coordinates and first-representative ordering, not rounded sets.
    for (let i = 0; i < expected.length; i++) {
      expect(actual[i]?.x).toBe(expected[i]?.x);
      expect(actual[i]?.y).toBe(expected[i]?.y);
    }
    // The reference finder is slow on purpose: the Isfahan divided stars
    // (41 steps) take nearly two minutes each, so allow five.
  }, 300_000);
}
