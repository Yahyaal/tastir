import { starAndCross } from '../test/tutorials.js';
import {
  firstFailingStep,
  hasSymmetry,
  strokesOffConstruction,
  strokesOffCrossings,
} from './checks.js';
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

describe('step by step', () => {
  it('builds every step of the star and cross', () => {
    expect(firstFailingStep(t)).toBeUndefined();
  });

  it('names the first step whose pick is ambiguous', () => {
    const broken = structuredClone(t);
    const step2 = broken.steps[1] as (typeof broken.steps)[number];
    step2.create['E'] = { point: { meet: ['c', 'h'] } };
    expect(firstFailingStep(broken)).toMatch(/^Step 2, element "E"/);
  });
});

describe('ink on the construction', () => {
  it('passes for the star and cross', () => {
    expect(strokesOffConstruction(scene, pattern.ink)).toEqual([]);
  });

  it('reports a stroke that no line or polygon side carries', () => {
    const stray = {
      from: 'O',
      to: 'k.1',
      segment: segment(vec(0, 0), vec(0.7, 0.3)),
    };
    expect(strokesOffConstruction(scene, [...pattern.ink, stray])).toEqual([
      'O–k.1',
    ]);
  });
});
