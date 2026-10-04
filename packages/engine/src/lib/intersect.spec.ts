import {
  intersect,
  intersectCircleCircle,
  intersectLineCircle,
  intersectLineLine,
  overlap,
} from './intersect.js';
import { circle, line, segment } from './shapes.js';
import { mergePoints, tolerance } from './tolerance.js';
import { normalize, vec, type Vec } from './vec.js';

const tol = tolerance(1);
const close = (p: Vec | undefined, x: number, y: number) => {
  expect(p).toBeDefined();
  expect(p?.x).toBeCloseTo(x, 12);
  expect(p?.y).toBeCloseTo(y, 12);
};
const horizontal = line(vec(0, 0), vec(1, 0));
const unit = circle(vec(0, 0), 1);

describe('line–line', () => {
  it('crosses in one point', () => {
    const diag = line(vec(0, -1), normalize(vec(1, 1)));
    const pts = intersectLineLine(horizontal, diag, tol);
    expect(pts).toHaveLength(1);
    close(pts[0], 1, 0);
  });

  it('gives nothing for parallel lines', () => {
    expect(
      intersectLineLine(horizontal, line(vec(0, 1), vec(1, 0)), tol),
    ).toEqual([]);
  });

  it('gives nothing for the same line, which overlap reports', () => {
    const same = line(vec(5, 0), vec(-1, 0));
    expect(intersectLineLine(horizontal, same, tol)).toEqual([]);
    expect(overlap(horizontal, same, tol)).toBe(true);
  });
});

describe('line–circle', () => {
  it('crosses in two points, ordered along the line', () => {
    const pts = intersectLineCircle(horizontal, unit, tol);
    expect(pts).toHaveLength(2);
    close(pts[0], -1, 0);
    close(pts[1], 1, 0);
  });

  it('touches a tangent line in exactly one point', () => {
    const pts = intersectLineCircle(line(vec(0, 1), vec(1, 0)), unit, tol);
    expect(pts).toHaveLength(1);
    close(pts[0], 0, 1);
  });

  it('reports a tangent within rounding error as one point', () => {
    // 45° tangent: its distance from the centre is 1 only up to rounding.
    const d = normalize(vec(1, 1));
    const touch = vec(Math.SQRT1_2, -Math.SQRT1_2);
    const pts = intersectLineCircle(line(touch, d), unit, tol);
    expect(pts).toHaveLength(1);
    close(pts[0], Math.SQRT1_2, -Math.SQRT1_2);
  });

  it('gives nothing when the line misses', () => {
    expect(intersectLineCircle(line(vec(0, 2), vec(1, 0)), unit, tol)).toEqual(
      [],
    );
  });
});

describe('circle–circle', () => {
  it('crosses in two points, counter-clockwise from the line of centres first', () => {
    const pts = intersectCircleCircle(unit, circle(vec(1, 0), 1), tol);
    expect(pts).toHaveLength(2);
    close(pts[0], 0.5, Math.sqrt(3) / 2);
    close(pts[1], 0.5, -Math.sqrt(3) / 2);
  });

  it('touches from outside in one point', () => {
    const pts = intersectCircleCircle(unit, circle(vec(3, 0), 2), tol);
    expect(pts).toHaveLength(1);
    close(pts[0], 1, 0);
  });

  it('touches from inside in one point', () => {
    const pts = intersectCircleCircle(unit, circle(vec(0.5, 0), 0.5), tol);
    expect(pts).toHaveLength(1);
    close(pts[0], 1, 0);
  });

  it('gives nothing for disjoint, nested or concentric circles', () => {
    expect(intersectCircleCircle(unit, circle(vec(3, 0), 1), tol)).toEqual([]);
    expect(intersectCircleCircle(unit, circle(vec(0.1, 0), 0.2), tol)).toEqual(
      [],
    );
    expect(intersectCircleCircle(unit, circle(vec(0, 0), 2), tol)).toEqual([]);
  });

  it('gives nothing for the same circle, which overlap reports', () => {
    expect(intersectCircleCircle(unit, circle(vec(0, 0), 1), tol)).toEqual([]);
    expect(overlap(unit, circle(vec(0, 0), 1), tol)).toBe(true);
  });
});

describe('segments', () => {
  it('keeps only crossings inside both segments', () => {
    const s = segment(vec(-2, 1), vec(2, -1));
    expect(intersect(s, segment(vec(0, -1), vec(0, 1)), tol)).toHaveLength(1);
    expect(intersect(s, segment(vec(5, -1), vec(5, 1)), tol)).toEqual([]);
    expect(intersect(s, unit, tol)).toHaveLength(2);
    expect(intersect(segment(vec(0, 0), vec(0.5, 0)), unit, tol)).toEqual([]);
  });

  it('counts a crossing at a shared end point once', () => {
    const a = segment(vec(0, 0), vec(1, 0));
    const b = segment(vec(1, 0), vec(1, 1));
    expect(intersect(a, b, tol)).toHaveLength(1);
  });

  it('reports collinear segments that share a stretch as overlapping', () => {
    const a = segment(vec(0, 0), vec(2, 0));
    expect(overlap(a, segment(vec(1, 0), vec(3, 0)), tol)).toBe(true);
    expect(overlap(a, segment(vec(2, 0), vec(3, 0)), tol)).toBe(false);
    expect(overlap(a, segment(vec(0, 1), vec(2, 1)), tol)).toBe(false);
  });
});

describe('tolerance', () => {
  it('treats two points closer than the tolerance as one', () => {
    const p = vec(0.3, 0.7);
    const q = vec(0.3 + tol.eps / 2, 0.7);
    const r = vec(0.3 + tol.eps * 10, 0.7);
    expect(mergePoints([p, q], tol)).toEqual([p]);
    expect(mergePoints([p, r], tol)).toHaveLength(2);
  });

  it('makes circles that miss by less than the tolerance touch in one point', () => {
    const pts = intersectCircleCircle(
      unit,
      circle(vec(2 + tol.eps / 2, 0), 1),
      tol,
    );
    expect(pts).toHaveLength(1);
  });

  it('scales with the drawing size', () => {
    expect(tolerance(100).eps).toBeCloseTo(100 * tolerance(1).eps, 20);
  });
});
