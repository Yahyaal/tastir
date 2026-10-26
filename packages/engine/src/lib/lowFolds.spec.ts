import { parseTutorial } from '@tastir/schema';
import { lowFold } from '../test/lowFolds.js';
import {
  firstFailingStep,
  hasSymmetry,
  strokesOffConstruction,
  strokesOffCrossings,
} from './checks.js';
import { evaluate } from './evaluate.js';
import { expectedGolden, goldenOf } from './golden.js';
import { computePattern, rectangularPeriod, wallPieces } from './pieces.js';
import { segment } from './shapes.js';

describe.each(['pm', 'pmm', 'cmm'] as const)('%s repeat', (group) => {
  const tutorial = parseTutorial(lowFold(group));
  const scene = evaluate(tutorial);
  const pattern = computePattern(scene, tutorial);

  it('builds and inks on exact construction crossings', () => {
    expect(firstFailingStep(tutorial)).toBeUndefined();
    expect(strokesOffConstruction(scene, pattern.ink)).toEqual([]);
    expect(strokesOffCrossings(scene, pattern)).toEqual([]);
    const half = scene.elements.get('E@1')?.geometry;
    expect(half).toEqual({
      kind: 'point',
      at: { x: -2, y: expect.closeTo(0, 12) },
    });
  });

  it('matches the independent area and counts and fills its cell', () => {
    expect(goldenOf(tutorial, scene, pattern)).toEqual(
      expectedGolden(tutorial),
    );
    expect(
      pattern.types.reduce((a, t) => a + t.area * t.perCell, 0),
    ).toBeCloseTo(pattern.cell.area, 12);
    expect(pattern.types.every((t) => !t.sliver)).toBe(true);
  });

  it('has its declared symmetry and rejects misplaced O', () => {
    expect(hasSymmetry(pattern, tutorial.fold)).toBe(true);
    expect(hasSymmetry(pattern, tutorial.fold, { x: 0.25, y: 0.25 })).toBe(
      false,
    );
    expect(hasSymmetry(pattern, tutorial.fold, { x: 100, y: 100 })).toBe(false);
    if (group === 'pm') {
      expect(hasSymmetry(pattern, 2)).toBe(false);
      expect(hasSymmetry(pattern, 1, { x: 0, y: 0.25 }, undefined, false)).toBe(
        false,
      );
    } else expect(hasSymmetry(pattern, 4)).toBe(false);
  });

  it('joins translated cells into whole pieces with a rectangular period', () => {
    expect(rectangularPeriod(pattern.cell)).toBeDefined();
    const { u, v } = pattern.cell;
    const ink = [-1, 0, 1].flatMap((i) =>
      [-1, 0, 1].flatMap((j) =>
        pattern.ink.map(({ segment: s }) => {
          const move = (p: typeof u) => ({
            x: p.x + i * u.x + j * v.x,
            y: p.y + i * u.y + j * v.y,
          });
          return segment(move(s.a), move(s.b));
        }),
      ),
    );
    const pieces = wallPieces(ink, pattern.types);
    for (let t = 0; t < pattern.types.length; t++)
      expect(pieces.filter((p) => p.type === t)).toHaveLength(
        9 * (pattern.types[t]?.perCell ?? 0),
      );
  });
});
