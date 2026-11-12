import example from '@tutorials/eight-fold-star-and-cross.json';
import type { Vec } from '@tastir/engine';
import { overlapsAt, PAST_BAND, PAST_EDGE, weaveOf } from './interlace';
import { loadModel } from './model';

describe('the top band at a crossing', () => {
  const model = loadModel(example);
  const crossings = weaveOf(model.pattern).crossings;
  const outer = 0.1;
  const inner = 0.06;
  const shapes = overlapsAt(model.pattern, 0, 0, outer, inner);
  /** How far q lies from the line through `at` along `dir`. */
  const off = (q: Vec, at: Vec, dir: Vec) =>
    Math.abs((q.x - at.x) * dir.y - (q.y - at.y) * dir.x);

  it('is one pair of shapes for each crossing', () => {
    expect(shapes.length).toBe(crossings.length);
    expect(shapes.length).toBeGreaterThan(0);
  });

  it('spans the whole band underneath, edge to edge, and no further', () => {
    shapes.forEach((shape, k) => {
      const c = crossings[k]!;
      const sin = Math.abs(c.over.x * c.under.y - c.over.y * c.under.x);
      const spare = (k: number) => outer * k * sin;
      for (const q of shape.edge) {
        // Its sides are the top band's outer edges…
        expect(off(q, c.at, c.over)).toBeCloseTo(outer / 2, 9);
        // …and its ends the outer edges of the band underneath, with a
        // hair to spare, however near the next crossing is.
        expect(off(q, c.at, c.under)).toBeCloseTo(
          outer / 2 + spare(PAST_EDGE),
          9,
        );
      }
      for (const q of shape.band) {
        expect(off(q, c.at, c.over)).toBeCloseTo(inner / 2, 9);
        expect(off(q, c.at, c.under)).toBeCloseTo(
          outer / 2 + spare(PAST_BAND),
          9,
        );
      }
    });
  });
});
