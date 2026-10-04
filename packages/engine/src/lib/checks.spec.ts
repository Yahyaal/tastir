import { starAndCross } from '../test/tutorials.js';
import { hasSymmetry, strokesOffCrossings } from './checks.js';
import { evaluate } from './evaluate.js';
import { computePattern } from './pieces.js';
import { segment } from './shapes.js';
import { vec } from './vec.js';

const t = starAndCross();
const scene = evaluate(t);
const pattern = computePattern(scene, t);

describe('the two-crossings rule', () => {
  it('passes for the star and cross', () => {
    expect(strokesOffCrossings(scene, pattern)).toEqual([]);
  });

  it('reports a stroke that ends away from any crossing', () => {
    const stray = {
      from: 'x',
      to: 'y',
      segment: segment(vec(0.3, 0.1), vec(0.5, 0.1)),
    };
    expect(
      strokesOffCrossings(scene, { ...pattern, ink: [...pattern.ink, stray] }),
    ).toEqual(['x–y']);
  });
});

describe('symmetry', () => {
  it('finds the eight-fold symmetry of the star and cross', () => {
    expect(hasSymmetry(pattern, 8)).toBe(true);
    expect(hasSymmetry(pattern, 4)).toBe(true);
  });

  it('finds no sixteen-fold or five-fold symmetry', () => {
    expect(hasSymmetry(pattern, 16)).toBe(false);
    expect(hasSymmetry(pattern, 5)).toBe(false);
  });

  it('finds no symmetry about a point that is not a centre', () => {
    expect(hasSymmetry(pattern, 8, vec(0.5, 0))).toBe(false);
  });
});
