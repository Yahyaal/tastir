import { signedArea, skeletonHeight, sweep, type P2, type P3 } from './skeleton.js';

const flat = (f: readonly P3[]) => signedArea(f);

/** The strips and the floor left cover the polygon exactly once. */
function covered(poly: readonly P2[], stops: number[], end: number) {
  const s = sweep(poly, stops, end);
  const area =
    s.faces.reduce((a, f) => a + flat(f), 0) +
    s.floor.reduce((a, f) => a + signedArea(f), 0);
  // No strip is turned over, so the areas cannot cancel out.
  for (const f of s.faces) expect(flat(f)).toBeGreaterThan(-1e-9);
  return { s, area };
}

const regular = (n: number, r: number, turn = 0): P2[] =>
  Array.from({ length: n }, (_, i) => {
    const a = turn + (2 * Math.PI * i) / n;
    return { x: r * Math.cos(a), y: r * Math.sin(a) };
  });

/** A star with n points, outer radius 1 and inner radius r. */
const star = (n: number, r: number): P2[] =>
  Array.from({ length: 2 * n }, (_, i) => {
    const a = (Math.PI * i) / n;
    const k = i % 2 ? r : 1;
    return { x: k * Math.cos(a), y: k * Math.sin(a) };
  });

const L: P2[] = [
  { x: 0, y: 0 },
  { x: 4, y: 0 },
  { x: 4, y: 1 },
  { x: 1, y: 1 },
  { x: 1, y: 3 },
  { x: 0, y: 3 },
];

describe('sweep', () => {
  it('offsets a square to a smaller square', () => {
    const sq = regular(4, Math.SQRT2, Math.PI / 4); // side 2
    const { s, area } = covered(sq, [0.25], 0.5);
    expect(area).toBeCloseTo(4, 10);
    expect(s.floor).toHaveLength(1);
    expect(signedArea(s.floor[0]!)).toBeCloseTo(1, 10);
    // Two cuts (0.25 and 0.5) give two strips for each side.
    expect(s.faces).toHaveLength(8);
  });

  it('closes a square at its centre, at half its side', () => {
    expect(skeletonHeight(regular(4, Math.SQRT2, Math.PI / 4))).toBeCloseTo(1, 10);
  });

  it('closes a 2 × 1 rectangle along a ridge at 0.5', () => {
    const rect = [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 2, y: 1 },
      { x: 0, y: 1 },
    ];
    const { s, area } = covered(rect, [], Infinity);
    expect(area).toBeCloseTo(2, 10);
    expect(s.reached).toBeCloseTo(0.5, 10);
  });

  it('follows an L through the split at its inner corner', () => {
    const { s, area } = covered(L, [], Infinity);
    expect(area).toBeCloseTo(signedArea(L), 9);
    expect(s.reached).toBeCloseTo(0.5, 9);
    const { area: part } = covered(L, [0.1, 0.3], 0.4);
    expect(part).toBeCloseTo(signedArea(L), 9);
  });

  it('carves a regular star to one apex at its centre', () => {
    const st = star(8, 0.55);
    const { s, area } = covered(st, [], Infinity);
    expect(area).toBeCloseTo(signedArea(st), 9);
    const deepest = Math.max(...s.faces.flat().map((p) => p.z));
    const apex = s.faces.flat().filter((p) => p.z > deepest - 1e-9);
    for (const p of apex) expect(Math.hypot(p.x, p.y)).toBeLessThan(1e-7);
    // The inradius of the star: distance from centre to an edge line.
    const a = st[0]!;
    const b = st[1]!;
    const inr = Math.abs(a.x * b.y - a.y * b.x) / Math.hypot(b.x - a.x, b.y - a.y);
    expect(deepest).toBeCloseTo(inr, 9);
  });

  it('covers a thin twelve-pointed star and a long hexagon', () => {
    for (const poly of [
      star(12, 0.7),
      star(16, 0.85),
      [
        { x: 0, y: 0 },
        { x: 3, y: 0 },
        { x: 3.4, y: 0.4 },
        { x: 3, y: 0.8 },
        { x: 0, y: 0.8 },
        { x: -0.4, y: 0.4 },
      ],
    ]) {
      const { area } = covered(poly, [], Infinity);
      expect(area).toBeCloseTo(signedArea(poly), 8);
    }
  });

  it('refuses a clockwise piece', () => {
    expect(() => sweep(regular(4, 1).reverse(), [], 1)).toThrow(/counter-clockwise/);
  });
});
