import { intersect, overlap } from './intersect.js';
import {
  appendCrossingCuts,
  intersectPrepared,
  overlapPrepared,
  prepareCurve,
} from './prepared.js';
import { circle, line, segment } from './shapes.js';
import { tolerance } from './tolerance.js';
import { dot, sub } from './vec.js';

it('preserves intersection order, tangencies, endpoint tolerance and overlap for every curve pair', () => {
  const tol = tolerance();
  const p = (x: number, y: number) => ({ x, y });
  const curves = [
    line(p(0, 0), p(1, 0)),
    line(p(0, 0), p(0, 1)),
    line(p(0, 0), p(-1, 0)),
    line(p(0, 1), p(1, 0)),
    circle(p(0, 0), 1),
    circle(p(2, 0), 1),
    circle(p(1, 0), 2),
    segment(p(-1, 0), p(1, 0)),
    segment(p(0, 1), p(0, -1)),
    segment(p(1, 0), p(-1, 0)),
    segment(p(0, 0), p(2, 0)),
    ...[-2, -0.5, 0, 0.5, 2].flatMap((n) => [
      line(p(0, 1 + n * tol.eps), p(1, 0)),
      segment(p(1 + n * tol.eps, -1), p(1 + n * tol.eps, 1)),
      segment(p(-1, n * tol.eps), p(1, n * tol.eps)),
      circle(p(2 + n * tol.eps, 0), 1),
    ]),
  ];
  for (const a of curves)
    for (const b of curves) {
      const pa = prepareCurve(a);
      const pb = prepareCurve(b);
      expect(intersectPrepared(pa, pb, tol)).toEqual(intersect(a, b, tol));
      expect(overlapPrepared(pa, pb, tol)).toBe(overlap(a, b, tol));
      if (a.kind === 'segment') {
        const aCuts: number[] = [];
        const bCuts: number[] = [];
        appendCrossingCuts(
          pa,
          pb,
          tol,
          aCuts,
          b.kind === 'segment' ? bCuts : undefined,
        );
        const points = intersect(a, b, tol);
        const d = sub(a.b, a.a);
        expect(aCuts).toEqual(
          points.map((p) => dot(sub(p, a.a), d) / dot(d, d)),
        );
        if (b.kind === 'segment') {
          const d = sub(b.b, b.a);
          expect(bCuts).toEqual(
            points.map((p) => dot(sub(p, b.a), d) / dot(d, d)),
          );
        }
      }
    }
});
