import {
  compareInk,
  inkDifference,
  mergeInk,
  type InkWall,
  type Point,
} from './inkComparison';
import { cellOf, evaluate, inkStrokes } from '@tastir/engine';
import { parseTutorial } from '@tastir/schema';
import starCross from '@tutorials/eight-fold-star-and-cross.json';
import starHexagons from '@tutorials/six-fold-star-and-hexagons.json';
import hippoOctagons from '@tutorials/hippo-mosaic-octagons.json';
import westDado from '@tutorials/alhambra-comares-west-dado.json';
import bouInania from '@tutorials/bou-inania-rosette.json';

// An asymmetric closed motif strictly inside a square repeat.
const points: Point[] = [
  { x: 0.13, y: 0.17 },
  { x: 0.71, y: 0.22 },
  { x: 0.64, y: 0.83 },
  { x: 0.28, y: 0.61 },
];
const wall: InkWall = {
  origin: { x: 0, y: 0 },
  u: { x: 1, y: 0 },
  v: { x: 0, y: 1 },
  ink: points.map((a, i) => ({ a, b: points[(i + 1) % points.length] ?? a })),
};
function transformed(
  w: InkWall,
  angle: number,
  scale = 1,
  mirror = false,
): InkWall {
  const linear = (p: Point) => {
    const x = mirror ? -p.x : p.x;
    return {
      x: scale * (x * Math.cos(angle) - p.y * Math.sin(angle)),
      y: scale * (x * Math.sin(angle) + p.y * Math.cos(angle)),
    };
  };
  const move = (p: Point) => {
    const q = linear(p);
    return { x: q.x + 3.37, y: q.y - 1.93 };
  };
  return {
    origin: move(w.origin),
    u: linear(w.u),
    v: linear(w.v),
    ink: w.ink.map((s) => ({ a: move(s.a), b: move(s.b) })),
  };
}
describe('periodic ink comparison', () => {
  it('does not expose shared state through the returned boundary points', () => {
    const result = compareInk(wall, wall),
      expected = result.boundary.map((p) => ({ ...p }));
    const corner = result.boundary[0];
    if (!corner) throw new Error('Missing comparison boundary');
    corner.x += 0.173;
    expect(compareInk(wall, wall).boundary).toEqual(expected);
  });
  it.each([westDado, bouInania])(
    'reduces a verified doubled tile before the $id search exceeds its limits',
    (json) => {
      const tutorial = parseTutorial(json),
        scene = evaluate(tutorial);
      const source: InkWall = {
        ...cellOf(scene, tutorial.pattern.cell),
        ink: inkStrokes(scene, tutorial).map((s) => s.segment),
      };
      const doubled: InkWall = {
        ...source,
        u: { x: source.u.x * 2, y: source.u.y * 2 },
        ink: [
          ...source.ink,
          ...source.ink.map((s) => ({
            a: { x: s.a.x + source.u.x, y: s.a.y + source.u.y },
            b: { x: s.b.x + source.u.x, y: s.b.y + source.u.y },
          })),
        ],
      };
      expect(compareInk(source, transformed(doubled, 0.297, 1.37)).status).toBe(
        'same',
      );
    },
  );
  it('finds a phase shift independently of the supplied tile origin', () => {
    const shifted: InkWall = {
      ...wall,
      ink: wall.ink.map((s) => ({
        a: { x: s.a.x + 0.337, y: s.a.y - 0.291 },
        b: { x: s.b.x + 0.337, y: s.b.y - 0.291 },
      })),
    };
    expect(compareInk(wall, shifted).status).toBe('same');
  });
  it.each([starCross, starHexagons, hippoOctagons])(
    'matches $id across repeat boundaries after an arbitrary turn',
    (json) => {
      const tutorial = parseTutorial(json);
      const scene = evaluate(tutorial);
      const real = {
        ...cellOf(scene, tutorial.pattern.cell),
        ink: inkStrokes(scene, tutorial).map((s) => s.segment),
      };
      expect(compareInk(real, transformed(real, 0.297, 3.1)).status).toBe(
        'same',
      );
    },
  );
  it('aligns a continuous triangular grid using crossings instead of stroke ends', () => {
    const grid: InkWall = {
      ...wall,
      ink: [
        { a: { x: 0, y: 0 }, b: { x: 1, y: 0 } },
        { a: { x: 0, y: 0 }, b: { x: 0, y: 1 } },
        { a: { x: 0, y: 0 }, b: { x: 1, y: 1 } },
      ],
    };
    const moved = transformed(grid, 0.297, 1.7);
    const shifted = {
      ...moved,
      ink: moved.ink.map((s) => ({
        a: { x: s.a.x + 0.173, y: s.a.y - 0.291 },
        b: { x: s.b.x + 0.173, y: s.b.y - 0.291 },
      })),
    };
    expect(compareInk(grid, shifted).status).toBe('same');
  });
  it('matches a diagonal two-cell tile with a different lattice basis', () => {
    const diagonal: InkWall = {
      ...wall,
      u: { x: 1, y: 1 },
      v: { x: -1, y: 1 },
      ink: [
        ...wall.ink,
        ...wall.ink.map((s) => ({
          a: { x: s.a.x + 1, y: s.a.y },
          b: { x: s.b.x + 1, y: s.b.y },
        })),
      ],
    };
    const result = compareInk(wall, transformed(diagonal, 0.29));
    expect(result.status).toBe('same');
    expect(result.repeatB?.cells).toBe(2);
  });
  it('matches an arbitrary rotation, scale and translation', () => {
    const result = compareInk(
      wall,
      transformed(wall, (17 * Math.PI) / 180, 2.7),
    );
    expect(result.status).toBe('same');
    expect(result.coverageA).toBe(1);
    expect(result.coverageB).toBe(1);
  });
  it('finds a smaller repeat in a re-tiled copy', () => {
    const wide: InkWall = {
      ...wall,
      u: { x: 2, y: 0 },
      ink: [
        ...wall.ink,
        ...wall.ink.map((s) => ({
          a: { x: s.a.x + 1, y: s.a.y },
          b: { x: s.b.x + 1, y: s.b.y },
        })),
      ],
    };
    const result = compareInk(wall, transformed(wide, 0.37));
    expect(result.status).toBe('same');
    expect(result.repeatB?.cells).toBe(2);
  });
  it('finds the primitive repeat of a four-cell square tile', () => {
    const big: InkWall = {
      ...wall,
      u: { x: 2, y: 0 },
      v: { x: 0, y: 2 },
      ink: [0, 1].flatMap((x) =>
        [0, 1].flatMap((y) =>
          wall.ink.map((s) => ({
            a: { x: s.a.x + x, y: s.a.y + y },
            b: { x: s.b.x + x, y: s.b.y + y },
          })),
        ),
      ),
    };
    const result = compareInk(wall, transformed(big, 0.17));
    expect(result.status).toBe('same');
    expect(result.repeatB?.cells).toBe(4);
  });
  it('labels an asymmetric motif that requires reflection', () => {
    const result = compareInk(wall, transformed(wall, 0.29, 1, true));
    expect(result.status).toBe('same');
    expect(result.placement?.mirrored).toBe(true);
  });
  it('ignores stroke splitting, duplicate strokes and reversed directions', () => {
    const split: InkWall = {
      ...wall,
      ink: wall.ink.flatMap((s) => {
        const m = { x: (s.a.x + s.b.x) / 2, y: (s.a.y + s.b.y) / 2 };
        return [
          { a: s.a, b: m },
          { a: s.b, b: m },
          { a: s.a, b: m },
        ];
      }),
    };
    expect(compareInk(wall, split).status).toBe('same');
  });
  it('shows a removed line and reports directional coverage', () => {
    const result = compareInk(wall, { ...wall, ink: wall.ink.slice(1) });
    expect(result.status).toBe('different');
    expect(result.coverageA).toBeLessThan(1);
    expect(result.coverageB).toBe(1);
    expect(result.onlyA.length).toBeGreaterThan(0);
    expect(result.onlyB).toHaveLength(0);
  });
  it('does not certify a small missing subsegment even when a percentage rounds to 100', () => {
    const first = wall.ink[0];
    if (!first) throw new Error('Missing fixture stroke');
    const t = 0.00001;
    const shorter = {
      a: {
        x: first.a.x + (first.b.x - first.a.x) * t,
        y: first.a.y + (first.b.y - first.a.y) * t,
      },
      b: first.b,
    };
    const result = compareInk(wall, {
      ...wall,
      ink: [shorter, ...wall.ink.slice(1)],
    });
    expect(result.status).toBe('different');
    expect(result.onlyA.length).toBeGreaterThan(0);
  });
  it('does not stretch or shear a lattice to force a match', () => {
    const shear = (p: Point) => ({ x: p.x + 0.3 * p.y, y: p.y });
    const result = compareInk(wall, {
      ...wall,
      u: shear(wall.u),
      v: shear(wall.v),
      ink: wall.ink.map((s) => ({ a: shear(s.a), b: shear(s.b) })),
    });
    expect(result.status).toBe('inconclusive');
  });
  it('returns an explicit inconclusive result for empty ink', () => {
    expect(compareInk(wall, { ...wall, ink: [] }).status).toBe('inconclusive');
  });
  it('does not use artificially clipped stroke lengths to reject a match', () => {
    const long: InkWall = {
      ...wall,
      ink: [{ a: { x: 0.13, y: 0.17 }, b: { x: 10.71, y: 1.22 } }],
    };
    const result = compareInk(long, long);
    expect(result.status).toBe('inconclusive');
    expect(result.reason).toContain('bounded neighbourhood');
  });
});
describe('ink length difference', () => {
  it('merges overlaps without counting them twice', () => {
    const s = (a: number, b: number) => ({
      a: { x: a, y: 0 },
      b: { x: b, y: 0 },
    });
    expect(mergeInk([s(0, 1), s(0.5, 2), s(2, 3)])).toHaveLength(1);
    const result = inkDifference([s(0, 3)], mergeInk([s(0, 1), s(0.5, 2)]));
    expect(result.coverage).toBeCloseTo(2 / 3);
    expect(result.only).toHaveLength(1);
  });
  it('does not count crossing or parallel nearby lines outside tolerance', () => {
    const a = { a: { x: 0, y: 0 }, b: { x: 1, y: 0 } };
    expect(
      inkDifference([a], [{ a: { x: 0.5, y: -1 }, b: { x: 0.5, y: 1 } }])
        .coverage,
    ).toBe(0);
    expect(
      inkDifference([a], [{ a: { x: 0, y: 0.0001 }, b: { x: 1, y: 0.0001 } }])
        .coverage,
    ).toBe(0);
  });
});
