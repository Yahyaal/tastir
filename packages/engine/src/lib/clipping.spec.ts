import { clipToCell, clipToPreparedCell, prepareCell } from './freeInk.js';
import { clipToCell as referenceClip } from '../test/reference/freeInk.js';
import { line, segment } from './shapes.js';

it('reuses cell edges without changing clipping at corners or near parallel boundaries', () => {
  const p = (x: number, y: number) => ({ x, y });
  for (const corners of [
    [p(-1, -1), p(1, -1), p(1, 1), p(-1, 1)],
    [p(-1, -1), p(-1, 1), p(1, 1), p(1, -1)],
    [p(-2, 0), p(-1, -1), p(1, -1), p(2, 0), p(1, 1), p(-1, 1)],
  ]) {
    for (const eps of [0, 1e-9, 1e-6]) {
      const cell = { corners };
      const prepared = prepareCell(cell, eps);
      for (const offset of [-2, -0.5, 0, 0.5, 2]) {
        for (const curve of [
          line(p(0, 1 + eps * offset), p(1, 0)),
          line(p(0, 0), p(0.6, 0.8)),
          segment(p(-3, -3), p(3, 3)),
          segment(p(1 + eps * offset, -3), p(1 + eps * offset, 3)),
          segment(p(-0.5, 0), p(0.5, 0)),
          segment(p(3, 3), p(4, 4)),
        ]) {
          const expected = referenceClip(curve, cell, eps);
          expect(clipToCell(curve, cell, eps)).toEqual(expected);
          expect(clipToPreparedCell(curve, prepared)).toEqual(expected);
        }
      }
    }
  }
});
