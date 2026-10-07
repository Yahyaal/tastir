import type { Tutorial } from '@tastir/schema';
import {
  loadTutorial,
  starAndCross,
  tutorialFiles,
} from '../test/tutorials.js';
import { evaluate, stepParts } from './evaluate.js';
import { inkCarriers, inkBeats, inkStrokes } from './ink.js';
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

describe('ink along a line', () => {
  /** The star and cross with its ink written as paths along the squares. */
  function alongStar(): Tutorial {
    const t = structuredClone(starAndCross());
    const corners: [string, number, string, string][] = [
      ['E', 0, 'dynamic', 'static'],
      ['NE', 45, 'static', 'dynamic'],
      ['N', 90, 'dynamic', 'static'],
      ['NW', 135, 'static', 'dynamic'],
      ['W', 180, 'dynamic', 'static'],
      ['SW', 225, 'static', 'dynamic'],
      ['S', 270, 'dynamic', 'static'],
      ['SE', 315, 'static', 'dynamic'],
    ];
    // From each corner of a square to where it crosses the other square,
    // on either side: sixteen strokes and no marked turning points.
    t.ink.paths = corners.flatMap(([corner, angle, along, other]) =>
      [-20, 20].map((turn) => ({
        along,
        from: corner,
        to: { cross: other, pick: { angle: angle + turn } },
      })),
    );
    return t;
  }

  it('makes the same star and cross as the path through named points', () => {
    const t = alongStar();
    const scene = evaluate(t);
    const strokes = inkStrokes(scene, t);
    expect(strokes).toHaveLength(16);
    expect(strokes[0]).toMatchObject({ from: 'E', to: 'dynamic×static' });
    const ours = computePattern(scene, t);
    const theirs = computePattern(evaluate(starAndCross()), starAndCross());
    const shapes = (p: typeof ours) =>
      p.types.map((x) => [x.vertices, x.area.toFixed(6), x.perCell]);
    expect(shapes(ours)).toEqual(shapes(theirs));
  });

  it('runs along a line between two other lines', () => {
    const t = structuredClone(starAndCross());
    t.ink.paths = [{ along: 'tE', from: 'tN', to: 'tS' }];
    const [stroke] = inkStrokes(evaluate(t), t);
    expect(stroke?.segment.a.x).toBeCloseTo(1, 12);
    expect(stroke?.segment.a.y).toBeCloseTo(1, 12);
    expect(stroke?.segment.b.y).toBeCloseTo(-1, 12);
  });

  it('asks for a pick when an end crosses more than once', () => {
    const t = structuredClone(starAndCross());
    t.ink.paths = [{ along: 'h', from: 'O', to: 'c' }];
    expect(() => inkStrokes(evaluate(t), t)).toThrow(
      /The ink, element "path 1": 2 crossings of "h" and "c" match .*add a pick rule/,
    );
    t.ink.paths = [
      { along: 'h', from: 'O', to: { cross: 'c', pick: { angle: 0 } } },
    ];
    expect(inkStrokes(evaluate(t), t)).toHaveLength(1);
  });

  it('rejects an end off its line, and ink along a circle', () => {
    const t = structuredClone(starAndCross());
    t.ink.paths = [{ along: 'h', from: 'O', to: 'N' }];
    expect(() => inkStrokes(evaluate(t), t)).toThrow('"N" is not on "h"');
    t.ink.paths = [{ along: 'c', from: 'E', to: 'N' }];
    expect(() => inkStrokes(evaluate(t), t)).toThrow(
      'ink runs along a line or a polygon, not "c"',
    );
  });
});
