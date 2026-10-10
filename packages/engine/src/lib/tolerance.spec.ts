import { mergePoints } from './tolerance.js';
import { mergePoints as referenceMerge } from '../test/reference/tolerance.js';

it('keeps the original representatives and order across bin boundaries', () => {
  for (const eps of [1e-9, 0.125, 2]) {
    const points = Array.from({ length: 300 }, (_, i) => ({
      x: (((i * 71) % 59) - 30) * eps * 0.49,
      y: (((i * 37) % 53) - 28) * eps * 0.51,
    }));
    points.push(...points.slice().reverse());
    for (const offset of [0, eps / 2, -(2 ** 45) * eps, 2 ** 45 * eps]) {
      const translated = points.map((p) => ({
        x: p.x + offset,
        y: p.y + offset,
      }));
      const expected = referenceMerge(translated, { eps });
      const actual = mergePoints(translated, { eps });
      expect(actual).toEqual(expected);
      for (let i = 0; i < expected.length; i++)
        expect(actual[i]).toBe(expected[i]);
    }
  }
});

it('retains legacy behavior outside the safely indexed coordinate range', () => {
  const points = Array.from({ length: 40 }, (_, i) => ({
    x: i / 10,
    y: -i / 10,
  }));
  points.push({ x: Infinity, y: 0 }, { x: NaN, y: 0 });
  for (const eps of [0, -1, NaN, Infinity, Number.MIN_VALUE, 1e308]) {
    expect(mergePoints(points, { eps })).toEqual(
      referenceMerge(points, { eps }),
    );
  }
});
