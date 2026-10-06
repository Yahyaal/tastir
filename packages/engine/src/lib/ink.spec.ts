import {
  loadTutorial,
  starAndCross,
  tutorialFiles,
} from '../test/tutorials.js';
import { evaluate } from './evaluate.js';
import { inkCarriers, inkSteps } from './ink.js';
import { computePattern } from './pieces.js';

describe('inkCarriers', () => {
  it('finds the two squares of the star and cross, and nothing else', () => {
    const t = starAndCross();
    const scene = evaluate(t);
    const { ink } = computePattern(scene, t);
    expect([...inkCarriers(scene, ink)].sort()).toEqual(['dynamic', 'static']);
  });
});

describe('inkSteps', () => {
  it('inks the star and cross once both squares exist', () => {
    const t = starAndCross();
    const scene = evaluate(t);
    const { ink } = computePattern(scene, t);
    expect(new Set(inkSteps(scene, ink))).toEqual(new Set([5]));
  });

  it('inks the Bou Inania star at step 6 and a third of the ink at step 8', () => {
    const t = loadTutorial('bou-inania-rosette.json');
    const scene = evaluate(t);
    const { ink } = computePattern(scene, t);
    const steps = inkSteps(scene, ink);
    const count = (n: number) => steps.filter((s) => s === n).length;
    expect(Math.min(...steps)).toBe(6);
    expect(count(6)).toBe(96);
    expect(count(8) / steps.length).toBeCloseTo(1 / 3, 1);
    expect(Math.max(...steps)).toBeLessThanOrEqual(12);
  });
});

describe('inkSteps in every tutorial', () => {
  it.each(tutorialFiles())('gives %s a step for every stroke', (file) => {
    const t = loadTutorial(file);
    const scene = evaluate(t);
    const { ink } = computePattern(scene, t);
    const started = performance.now();
    const steps = inkSteps(scene, ink);
    const ms = performance.now() - started;
    expect(steps).toHaveLength(ink.length);
    for (const s of steps) {
      expect(s).toBeGreaterThanOrEqual(1);
      expect(s).toBeLessThanOrEqual(t.steps.length);
    }
    expect(ms).toBeLessThan(1000);
  });
});
