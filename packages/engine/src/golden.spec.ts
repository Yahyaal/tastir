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
    // A tutorial that claims to be chiral must really lack the mirror. The
    // turning pieces can lie a little further out than the rotation check
    // looks (the Leones frets are centred about 1 from O), so look to 2.
    // In a p4g pattern (Dar el Bacha) the mirrors miss O and the pieces
    // near O can be mirror images of each other; the mirror then fails
    // only further out, so look over the whole tile too.
    if (tutorial.chiral) {
      const { u, v } = pattern.cell;
      const tile = (Math.hypot(u.x, u.y) + Math.hypot(v.x, v.y)) / 2;
      expect(
        hasSymmetry(pattern, tutorial.fold, undefined, 2) &&
          hasSymmetry(pattern, tutorial.fold, undefined, tile),
      ).toBe(false);
    }
  });

  it('has no slivers, and its pieces fill the tile', () => {
    // A tutorial may declare a piece small on purpose (fine zellige);
    // any other sliver means the construction or the ink is wrong.
    const small = new Set(
      tutorial.expect.pieces.filter((p) => p.small).map((p) => p.name),
    );
    expect(
      pattern.types.filter((t) => t.sliver && !small.has(t.name ?? '')),
    ).toEqual([]);
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
