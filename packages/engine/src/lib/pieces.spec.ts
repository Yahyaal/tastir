import type { Tutorial } from '@tastir/schema';
import { starAndCross } from '../test/tutorials.js';
import { evaluate, TutorialError } from './evaluate.js';
import { inkStrokes } from './ink.js';
import { computePattern, pieceAt } from './pieces.js';

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

  it('rejects a cell that is not a rectangle', () => {
    const bad = structuredClone(t);
    bad.steps.push({
      id: 7,
      text: 'A triangle.',
      create: { tri: { polygon: ['E', 'N', 'W'] } },
    });
    bad.pattern.cell = 'tri';
    expect(() => computePattern(evaluate(bad), bad)).toThrow(
      'The pattern, element "tri": the cell must have four corners',
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
