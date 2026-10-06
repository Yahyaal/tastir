import { starAndCross } from '../test/tutorials.js';
import { evaluate } from './evaluate.js';
import { inkCarriers } from './ink.js';
import { computePattern } from './pieces.js';

describe('inkCarriers', () => {
  it('finds the two squares of the star and cross, and nothing else', () => {
    const t = starAndCross();
    const scene = evaluate(t);
    const { ink } = computePattern(scene, t);
    expect([...inkCarriers(scene, ink)].sort()).toEqual(['dynamic', 'static']);
  });
});
