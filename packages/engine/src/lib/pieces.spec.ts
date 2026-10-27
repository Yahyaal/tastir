import type { Tutorial } from '@tastir/schema';
import { loadTutorial, starAndCross } from '../test/tutorials.js';
import { evaluate, TutorialError, type Scene } from './evaluate.js';
import { inkStrokes } from './ink.js';
import {
  computePattern,
  pieceAt,
  rectangularPeriod,
  wallPieces,
} from './pieces.js';
import { segment } from './shapes.js';
import type { Vec } from './vec.js';

describe('full outline grouping', () => {
  // U and T pentominoes share area 5, perimeter 12, eight corners and
  // sorted sides [1,1,1,1,1,2,2,3], but cannot cover one another.
  const u = [
    [0, 0],
    [2, 0],
    [2, 1],
    [1, 1],
    [1, 2],
    [2, 2],
    [2, 3],
    [0, 3],
  ];
  const t = [
    [0, 0],
    [1, 0],
    [1, 1],
    [3, 1],
    [3, 2],
    [1, 2],
    [1, 3],
    [0, 3],
  ];
  const polygons = [
    u.map(([x = 0, y = 0]) => ({ x: x + 1, y: y + 1 })),
    u.map(([x = 0, y = 0]) => ({ x: y + 6, y: x + 1 })),
    t.map(([x = 0, y = 0]) => ({ x: x + 10, y: y + 1 })),
  ];
  const edges = (polygon: readonly Vec[]) =>
    polygon.map((p, i) => segment(p, polygon[(i + 1) % polygon.length] as Vec));
  const strokes = polygons.flatMap((p) =>
    edges(p).map((s) => ({
      from: 'test-start',
      to: 'test-end',
      segment: s,
    })),
  );
  function fixture(distinguishOutlines?: boolean, ambiguous = false) {
    const tutorial = structuredClone(starAndCross());
    tutorial.pattern = {
      cell: 'tile',
      colors: {},
      ...(distinguishOutlines === undefined ? {} : { distinguishOutlines }),
    };
    tutorial.expect = {
      pieceTypes: 2,
      pieces: [
        { name: 'u', vertices: 8, area: 5, perCell: 2 },
        { name: 't', vertices: 8, area: 5, perCell: ambiguous ? 2 : 1 },
      ],
    };
    const vertices = [
      { x: 0, y: 0 },
      { x: 14, y: 0 },
      { x: 14, y: 8 },
      { x: 0, y: 8 },
    ];
    const scene: Scene = {
      ...evaluate(tutorial),
      elements: new Map([
        [
          'tile',
          {
            name: 'tile',
            step: 0,
            beat: 0,
            deps: [],
            geometry: { kind: 'polygon', vertices, sides: edges(vertices) },
          },
        ],
      ]),
    };
    return computePattern(scene, tutorial, strokes);
  }

  it('preserves legacy grouping when the flag is absent or false', () => {
    for (const flag of [undefined, false]) {
      const p = fixture(flag);
      expect(p.types).toHaveLength(1);
      expect(p.types[0]?.perCell).toBe(3);
      expect(p.types[0]?.outline).toBeUndefined();
    }
  });

  it('separates outlines while grouping translated and reflected copies', () => {
    const p = fixture(true);
    expect(p.types.map(({ name, perCell }) => ({ name, perCell }))).toEqual([
      { name: 'u', perCell: 2 },
      { name: 't', perCell: 1 },
    ]);
    expect(p.types[0]?.sides).toEqual(p.types[1]?.sides);
    expect(p.types.every((type) => type.outline?.length === 8)).toBe(true);
    const wall = wallPieces(
      strokes.map((s) => s.segment),
      p.types,
    );
    expect(wall.map((piece) => p.types[piece.type]?.name).sort()).toEqual([
      't',
      'u',
      'u',
    ]);
  });

  it('leaves same-count, same-measure names ambiguous', () => {
    const result = fixture(true, true);
    expect(result.types.every((type) => type.name === undefined)).toBe(true);
  });
});

function withInk(through: string[]): Tutorial {
  const t = structuredClone(starAndCross());
  t.ink.paths = [{ through }];
  return t;
}

describe('ink', () => {
  it('turns the star outline into 16 strokes along the two squares', () => {
    const t = starAndCross();
    const strokes = inkStrokes(evaluate(t), t);
    expect(strokes).toHaveLength(16);
    expect(strokes[0]).toMatchObject({ from: 'E', to: 'k.1' });
    expect(strokes[15]).toMatchObject({ from: 'k.8', to: 'E' });
  });

  it('rejects a stroke that no line or polygon side carries', () => {
    const t = withInk(['E', 'k.5']);
    expect(() => inkStrokes(evaluate(t), t)).toThrow(
      new TutorialError(
        'ink',
        'path 1',
        'no line or polygon side of the construction runs from "E" to "k.5"',
      ),
    );
  });

  it('rejects a stroke along a circle, since curved ink is not in v0', () => {
    const t = withInk(['E', 'NE']);
    expect(() => inkStrokes(evaluate(t), t)).toThrow(
      'share only a circle, and curved ink is not in format v0',
    );
  });

  it('accepts a stroke along part of a line', () => {
    const t = withInk(['E', 'O']);
    expect(inkStrokes(evaluate(t), t)).toHaveLength(1);
  });
});

describe('pieces of the star and cross', () => {
  const t = starAndCross();
  const pattern = computePattern(evaluate(t), t);

  it('repeats on the square cell of area 4', () => {
    expect(pattern.cell.area).toBeCloseTo(4, 12);
  });

  it('has exactly two piece types, matching the expect block', () => {
    const types = pattern.types.map((p) => ({
      name: p.name,
      vertices: p.vertices,
      area: Number(p.area.toFixed(5)),
      perCell: p.perCell,
    }));
    expect(types).toEqual([
      { name: 'star', vertices: 16, area: 2.34315, perCell: 1 },
      { name: 'cross', vertices: 16, area: 1.65685, perCell: 1 },
    ]);
  });

  it('fills the cell exactly, with no slivers', () => {
    const total = pattern.pieces.reduce(
      (s, p) => s + (pattern.types[p.type]?.area ?? 0),
      0,
    );
    expect(total).toBeCloseTo(pattern.cell.area, 9);
    expect(pattern.types.some((p) => p.sliver)).toBe(false);
  });

  it('makes the cross whole even though it straddles four cells', () => {
    const cross = pattern.pieces.find(
      (p) => pattern.types[p.type]?.name === 'cross',
    );
    expect(cross?.polygon).toHaveLength(16);
    const xs = cross?.polygon.map((p) => p.x) ?? [];
    expect(Math.min(...xs)).toBeLessThan(1);
    expect(Math.max(...xs)).toBeGreaterThan(1);
  });

  it('rejects a cell without four or six corners', () => {
    const bad = structuredClone(t);
    bad.steps.push({
      id: 7,
      text: 'A triangle.',
      create: { tri: { polygon: ['E', 'N', 'W'] } },
    });
    bad.pattern.cell = 'tri';
    expect(() => computePattern(evaluate(bad), bad)).toThrow(
      'The pattern, element "tri": the cell must have four or six corners',
    );
  });

  it('accepts a rectangle at any angle as the cell', () => {
    const turned = structuredClone(t);
    turned.pattern.cell = 'dynamic';
    expect(computePattern(evaluate(turned), turned).cell.area).toBeCloseTo(
      2,
      12,
    );
  });
});

describe('the piece under a point', () => {
  const t = starAndCross();
  const pattern = computePattern(evaluate(t), t);
  const typeAt = (x: number, y: number) => {
    const hit = pieceAt(pattern, { x, y });
    return hit
      ? pattern.types[pattern.pieces[hit.index]?.type ?? -1]?.name
      : undefined;
  };

  it('finds the star at the centre of every tile, however far away', () => {
    expect(typeAt(0, 0)).toBe('star');
    expect(typeAt(20, -14)).toBe('star');
    expect(typeAt(-6.1, 4.05)).toBe('star');
  });

  it('finds the cross where four tiles meet, and its shift', () => {
    expect(typeAt(1, 1)).toBe('cross');
    expect(typeAt(-9, 13)).toBe('cross');
    const hit = pieceAt(pattern, { x: 9, y: 9 });
    expect(hit?.shift.x).toBeCloseTo(8, 9);
  });
});

describe('slivers', () => {
  const t = starAndCross();
  const scene = evaluate(t);

  it('flags a thin strip but not a large star with many points', () => {
    // Inking the tile's diagonal as well as the star cuts thin slivers.
    const strip = computePattern(scene, t, [
      ...computePattern(scene, t).ink,
      {
        from: 'c1',
        to: 'c3',
        segment: { kind: 'segment', a: { x: 1, y: 1 }, b: { x: 0.99, y: -1 } },
      },
    ]);
    expect(strip.types.some((p) => p.sliver)).toBe(true);
    expect(computePattern(scene, t).types.some((p) => p.sliver)).toBe(false);
  });
});

describe('a parallelogram cell', () => {
  it('finds the rectangle that spans the lattice of a 60° rhombus', () => {
    const u = { x: 2, y: 0 };
    const v = { x: 1, y: Math.sqrt(3) };
    const r = rectangularPeriod({ u, v });
    expect(r?.v.x).toBeCloseTo(0, 12);
    expect(r?.v.y).toBeCloseTo(2 * Math.sqrt(3), 12);
  });

  it('keeps a rectangle as it is', () => {
    const cell = { u: { x: 2, y: 0 }, v: { x: 0, y: 3 } };
    expect(rectangularPeriod(cell)?.v).toBe(cell.v);
  });

  it('cuts the same pieces from the hexagon as from the rhombus', () => {
    // The rhombus joining the centre to the next centres along 0° and 60°,
    // each the centre reflected in the middle of a side of the hexagon.
    const t = loadTutorial('six-fold-snowflake.json');
    t.steps.push({
      id: 99,
      text: 'The rhombus.',
      create: {
        l60: { line: { through: ['O', 'B'] } },
        M0: { point: { meet: ['h', 'hex'], pick: { angle: 0 } } },
        M60: { point: { meet: ['l60', 'hex'], pick: { angle: 60 } } },
        cM0: { circle: { centre: 'M0', through: 'O' } },
        cM60: { circle: { centre: 'M60', through: 'O' } },
        N0: { point: { meet: ['cM0', 'h'], pick: { farthest: 'O' } } },
        N60: { point: { meet: ['cM60', 'l60'], pick: { farthest: 'O' } } },
        g1: { line: { through: 'N60', parallelTo: 'h' } },
        g2: { line: { through: 'N0', parallelTo: 'l60' } },
        Z: { point: { meet: ['g1', 'g2'] } },
        rhombus: { polygon: ['O', 'N0', 'Z', 'N60'] },
      },
    });
    const scene = evaluate(t);
    const hex = computePattern(scene, t);
    const rhombus = computePattern(scene, {
      ...t,
      pattern: { ...t.pattern, cell: 'rhombus' },
    });
    expect(hex.cell.area).toBeCloseTo((3 * Math.sqrt(3)) / 2, 12);
    expect(rhombus.cell.area).toBeCloseTo(hex.cell.area, 12);
    const shapes = (p: typeof hex) =>
      p.types.map((x) => [x.vertices, x.area.toFixed(5), x.perCell]);
    expect(shapes(rhombus)).toEqual(shapes(hex));
  });

  it('rejects a hexagon whose opposite sides are not parallel', () => {
    const t = loadTutorial('six-fold-snowflake.json');
    const bad = structuredClone(t);
    bad.steps.push({
      id: 99,
      text: 'A lopsided hexagon.',
      create: {
        lop: { polygon: ['H1', 'H2', 'H3', 'H4', 'H5', 'S6'] },
      },
    });
    bad.pattern.cell = 'lop';
    expect(() => computePattern(evaluate(bad), bad)).toThrow(
      'opposite sides equal and parallel',
    );
  });

  it('finds none for a lattice that never lines up', () => {
    expect(
      rectangularPeriod({ u: { x: 1, y: 0 }, v: { x: 0.3, y: 1 } }),
    ).toBeUndefined();
  });

  it('cuts pieces in a 60° rhombus cell', () => {
    const t: Tutorial = {
      ...starAndCross(),
      fold: 6,
      steps: [
        {
          id: 1,
          text: 'Two circles and a rhombus.',
          create: {
            c: { circle: { centre: 'O', through: 'A' } },
            c2: { circle: { centre: 'A', through: 'O' } },
            X: { point: { meet: ['c', 'c2'], pick: { angle: 60 } } },
            c3: { circle: { centre: 'X', through: 'O' } },
            Y: { point: { meet: ['c2', 'c3'], pick: { farthest: 'O' } } },
            rh: { polygon: ['O', 'A', 'Y', 'X'] },
          },
        },
      ],
      ink: { paths: [{ closed: true, through: ['O', 'A', 'Y', 'X'] }] },
      pattern: { cell: 'rh', colors: {} },
      expect: {
        pieceTypes: 1,
        pieces: [{ name: 'rhombus', vertices: 4, area: 0.86603, perCell: 1 }],
      },
    };
    const pattern = computePattern(evaluate(t), t);
    expect(pattern.cell.area).toBeCloseTo(Math.sqrt(3) / 2, 12);
    expect(pattern.types).toHaveLength(1);
    expect(pattern.types[0]?.name).toBe('rhombus');
  });
});

describe('the pieces of a wall laid by hand', () => {
  it('finds whole stars and crosses where copies join, and nothing at a loose copy', () => {
    const t = starAndCross();
    const scene = evaluate(t);
    const pattern = computePattern(scene, t);
    const { u, v } = pattern.cell;
    const at = (i: number, j: number) => ({
      x: u.x * i + v.x * j,
      y: u.y * i + v.y * j,
    });
    const tile = (d: { x: number; y: number }) =>
      pattern.ink.map(({ segment: s }) =>
        segment(
          { x: s.a.x + d.x, y: s.a.y + d.y },
          { x: s.b.x + d.x, y: s.b.y + d.y },
        ),
      );
    // Two by two copies, edge to edge: four stars and the cross between.
    const joined = [at(0, 0), at(1, 0), at(0, 1), at(1, 1)].flatMap(tile);
    const pieces = wallPieces(joined, pattern.types);
    const star = pattern.types.findIndex((x) => x.name === 'star');
    const cross = pattern.types.findIndex((x) => x.name === 'cross');
    expect(pieces.filter((p) => p.type === star)).toHaveLength(4);
    expect(pieces.filter((p) => p.type === cross)).toHaveLength(1);
    // A copy dropped loose, off the lattice, adds one star and no cross.
    const loose = wallPieces(
      [...joined, ...tile({ x: 7.3, y: 0.4 })],
      pattern.types,
    );
    expect(loose.filter((p) => p.type === star)).toHaveLength(5);
    expect(loose.filter((p) => p.type === cross)).toHaveLength(1);
  });
});
