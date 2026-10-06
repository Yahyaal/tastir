import {
  loadTutorial,
  starAndCross,
  tutorialFiles,
} from '../test/tutorials.js';
import { evaluate, stepParts } from './evaluate.js';
import { inkCarriers, inkBeats } from './ink.js';
import { computePattern } from './pieces.js';

describe('inkCarriers', () => {
  it('finds the two squares of the star and cross, and nothing else', () => {
    const t = starAndCross();
    const scene = evaluate(t);
    const { ink } = computePattern(scene, t);
    expect([...inkCarriers(scene, ink)].sort()).toEqual(['dynamic', 'static']);
  });
});

describe('inkBeats', () => {
  it('inks the star and cross once both squares exist', () => {
    const t = starAndCross();
    const scene = evaluate(t);
    const { ink } = computePattern(scene, t);
    expect(new Set(inkBeats(scene, ink))).toEqual(new Set([5]));
  });

  it('inks the Bou Inania star at step 6 and a third of the ink in step 8', () => {
    const t = loadTutorial('bou-inania-rosette.json');
    const scene = evaluate(t);
    const { ink } = computePattern(scene, t);
    const steps = inkBeats(scene, ink);
    const count = (n: number) => steps.filter((s) => s === n).length;
    expect(Math.min(...steps)).toBe(6);
    expect(count(6)).toBe(96);
    // Step 8 has three parts, beats 8 to 10; step 12's last part is beat 22.
    expect((count(8) + count(9) + count(10)) / steps.length).toBeCloseTo(
      1 / 3,
      1,
    );
    expect(Math.max(...steps)).toBeLessThanOrEqual(22);
  });
});

describe('inkBeats in every tutorial', () => {
  it.each(tutorialFiles())('gives %s a step for every stroke', (file) => {
    const t = loadTutorial(file);
    const scene = evaluate(t);
    const { ink } = computePattern(scene, t);
    const started = performance.now();
    const steps = inkBeats(scene, ink);
    const ms = performance.now() - started;
    const beats = t.steps.reduce((n, st) => n + stepParts(st).length, 0);
    expect(steps).toHaveLength(ink.length);
    for (const s of steps) {
      expect(s).toBeGreaterThanOrEqual(1);
      expect(s).toBeLessThanOrEqual(beats);
    }
    expect(ms).toBeLessThan(1000);
  });
});
