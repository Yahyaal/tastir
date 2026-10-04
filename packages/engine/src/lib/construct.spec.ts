import {
  bisector,
  circleRadiusFrom,
  circleTangentTo,
  circleThrough,
  circleWithRadiusOf,
  lineThrough,
  parallelThrough,
  perpendicularThrough,
} from './construct.js';
import { intersect } from './intersect.js';
import { circle, segment } from './shapes.js';
import { tolerance } from './tolerance.js';
import { angleDeg, length, vec, type Vec } from './vec.js';

const tol = tolerance(1);
const O = vec(0, 0);
const E = vec(1, 0);
const N = vec(0, 1);
const W = vec(-1, 0);
const r2 = Math.SQRT1_2;
const NE = vec(r2, r2);
const NW = vec(-r2, r2);
const SE = vec(r2, -r2);

const h = lineThrough(O, E, tol);
const v = perpendicularThrough(O, h);
const d1 = bisector(E, O, N, tol);

/** The one crossing of two segments. */
function crossing(a: [Vec, Vec], b: [Vec, Vec]): Vec {
  const pts = intersect(segment(...a), segment(...b), tol);
  expect(pts).toHaveLength(1);
  return pts[0] as Vec;
}

describe('lines', () => {
  it('rejects a line through one point twice', () => {
    expect(() => lineThrough(E, vec(1, 0), tol)).toThrow('same point');
  });

  it('draws the perpendicular through a point', () => {
    const l = perpendicularThrough(vec(1, 2), h);
    expect(l.point).toEqual(vec(1, 2));
    expect(Math.abs(l.dir.x)).toBeCloseTo(0, 15);
    expect(Math.abs(l.dir.y)).toBeCloseTo(1, 15);
  });

  it('draws the parallel through a point', () => {
    const l = parallelThrough(vec(0, 3), d1);
    expect(l.point).toEqual(vec(0, 3));
    expect(angleDeg(l.dir)).toBeCloseTo(45, 12);
  });

  it('halves an angle given by three points', () => {
    expect(angleDeg(d1.dir)).toBeCloseTo(45, 12);
    expect(angleDeg(bisector(N, O, W, tol).dir)).toBeCloseTo(135, 12);
    // At E, between O (180°) and (1.5, √3/2) (60°): the bisector is at 120°.
    const b = bisector(O, E, vec(1.5, Math.sqrt(3) / 2), tol);
    expect(angleDeg(b.dir)).toBeCloseTo(120, 12);
  });

  it('halves a straight angle with the perpendicular', () => {
    expect(angleDeg(bisector(E, O, W, tol).dir)).toBeCloseTo(90, 12);
  });
});

describe('circles', () => {
  it('draws a circle through a point', () => {
    expect(circleThrough(O, vec(3, 4), tol).radius).toBeCloseTo(5, 15);
  });

  it('keeps the compass opening of another circle', () => {
    const c = circleWithRadiusOf(E, circle(O, 0.4));
    expect(c.centre).toEqual(E);
    expect(c.radius).toBe(0.4);
  });

  it('takes the radius from the distance between two points', () => {
    expect(circleRadiusFrom(O, E, N, tol).radius).toBeCloseTo(Math.SQRT2, 15);
  });

  it('rejects a radius of zero', () => {
    expect(() => circleThrough(E, E, tol)).toThrow('radius is zero');
  });
});

describe('tangent circles (docs/geometry-notes.md)', () => {
  // Dynamic square E N W S and static square NE NW SW SE cross at 8 points.
  const k67 = crossing([E, N], [NE, NW]);
  const k22 = crossing([E, N], [NE, SE]);
  const k112 = crossing([N, W], [NE, NW]);

  it('places the crossings on the 22.5° rays at distance √(2−√2)', () => {
    expect(angleDeg(k67)).toBeCloseTo(67.5, 12);
    expect(angleDeg(k22)).toBeCloseTo(22.5, 12);
    expect(length(k67)).toBeCloseTo(Math.sqrt(2 - Math.SQRT2), 12);
  });

  it('touches the vertical and the diagonal at radius 0.29289', () => {
    const c = circleTangentTo(k67, [v, d1], tol);
    expect(c.radius).toBeCloseTo(1 - r2, 12);
    expect(c.radius.toFixed(5)).toBe('0.29289');
  });

  it('touches them at radius 0.12132 from the crossing of two centre lines', () => {
    const across = parallelThrough(k22, h);
    const diagonal = parallelThrough(k112, bisector(N, O, W, tol));
    const centre = intersect(across, diagonal, tol)[0] as Vec;
    expect(angleDeg(centre)).toBeCloseTo(67.5, 12);
    const c = circleTangentTo(centre, [v, d1], tol);
    expect(c.radius).toBeCloseTo((1 - r2) * Math.tan(Math.PI / 8), 12);
    expect(c.radius.toFixed(5)).toBe('0.12132');
  });

  it('is an error when no single radius touches every target', () => {
    expect(() => circleTangentTo(k22, [v, d1], tol)).toThrow(
      'no single radius touches all 2 targets (each is touched at radius 0.70711, 0.29289)',
    );
  });

  it('is an error when the centre lies on a target line', () => {
    expect(() => circleTangentTo(O, [v], tol)).toThrow(
      'centre lies on the line',
    );
  });

  it('is ambiguous for a single circle, which can be touched or enclosed', () => {
    const small = circleTangentTo(
      intersect(
        parallelThrough(k22, h),
        parallelThrough(k112, bisector(N, O, W, tol)),
        tol,
      )[0] as Vec,
      [v, d1],
      tol,
    );
    expect(() => circleTangentTo(O, [small], tol)).toThrow(
      '2 radii touch every target (0.19570 and 0.43835), so the circle is ambiguous',
    );
  });

  it('touches a circle and a line when only one radius fits both', () => {
    // About (0, 3): the unit circle is touched at 2 or 4, the line y = 1 at 2.
    const c = circleTangentTo(
      vec(0, 3),
      [circle(O, 1), lineThrough(vec(0, 1), vec(1, 1), tol)],
      tol,
    );
    expect(c.radius).toBeCloseTo(2, 12);
  });
});
