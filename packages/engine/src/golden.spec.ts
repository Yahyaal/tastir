// The golden test: every tutorial in tutorials/ is evaluated, inked and cut
// into pieces, and the result must match the tutorial's expect block. An
// engine change that alters any tutorial's pieces fails here. Each tutorial
// is also checked to build step by step, to ink only along lines the
// construction drew and between its crossings, to keep its symmetry, and
// to have no pieces too thin to cut.
import {
  firstFailingStep,
  hasSymmetry,
  strokesOffConstruction,
  strokesOffCrossings,
} from './lib/checks.js';
import { evaluate } from './lib/evaluate.js';
import { expectedGolden, goldenOf } from './lib/golden.js';
import { computePattern } from './lib/pieces.js';
import { loadTutorial, tutorialFiles } from './test/tutorials.js';

const files = tutorialFiles();

it('finds the tutorials', () => {
  expect(files).toContain('eight-fold-star-and-cross.json');
});

describe.each(files)('%s', (file) => {
  const tutorial = loadTutorial(file);

  it('builds every step, with no ambiguous or impossible reference', () => {
    expect(firstFailingStep(tutorial)).toBeUndefined();
  });

  const scene = evaluate(tutorial);
  const pattern = computePattern(scene, tutorial);

  it('inks only along lines and polygon sides of the construction', () => {
    expect(strokesOffConstruction(scene, pattern.ink)).toEqual([]);
  });

  it('matches its expect block', () => {
    expect(goldenOf(tutorial, scene, pattern)).toEqual(
      expectedGolden(tutorial),
    );
  });

  it('inks only between crossings of the construction', () => {
    expect(strokesOffCrossings(scene, pattern)).toEqual([]);
  });

  it(`has the symmetry of its fold about O`, () => {
    const mirror = !tutorial.chiral;
    expect(
      hasSymmetry(pattern, tutorial.fold, undefined, undefined, mirror),
    ).toBe(true);
    // A tutorial that claims to be chiral must really lack the mirror.
    if (tutorial.chiral)
      expect(hasSymmetry(pattern, tutorial.fold)).toBe(false);
  });

  it('has no slivers, and its pieces fill the tile', () => {
    expect(pattern.types.filter((t) => t.sliver)).toEqual([]);
    const total = pattern.types.reduce((sum, t) => sum + t.area * t.perCell, 0);
    expect(total).toBeCloseTo(pattern.cell.area, 9);
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
