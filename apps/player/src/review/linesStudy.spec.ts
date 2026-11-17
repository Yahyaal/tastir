import { describe, expect, it } from 'vitest';
import { hash, inset, outlineOf, shade, type SheetPiece } from './linesStudy';

describe('the lines study', () => {
  it('moves every side of a counter-clockwise square inward', () => {
    const square = [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 2, y: 2 },
      { x: 0, y: 2 },
    ];
    const inner = inset(square, 0.25);
    expect(inner.map((p) => [p.x, p.y])).toEqual([
      [0.25, 0.25],
      [1.75, 0.25],
      [1.75, 1.75],
      [0.25, 1.75],
    ]);
  });

  it('gives each piece the same variation on every render', () => {
    expect(hash(3, -1, 2)).toBe(hash(3, -1, 2));
    expect(hash(3, -1, 2)).not.toBe(hash(3, 2, -1));
    expect(hash(0, 0, 0)).toBeGreaterThanOrEqual(0);
    expect(hash(0, 0, 0)).toBeLessThan(1);
  });

  it('lightens toward the paper and deepens toward black', () => {
    expect(shade('#808080', 0)).toBe('#808080');
    expect(shade('#808080', -0.5)).toBe('#404040');
    expect(shade('#000000', 1)).toBe('#fbf8f1');
  });

  it('draws a side shared by two pieces once', () => {
    const piece = (polygon: { x: number; y: number }[]): SheetPiece => ({
      key: String(polygon[0]!.x),
      polygon,
      centre: { x: 0, y: 0 },
      color: '#000000',
      seed: 0,
    });
    const a = piece([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ]);
    const b = piece([
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 2, y: 1 },
      { x: 1, y: 1 },
    ]);
    expect(outlineOf([a, b])).toHaveLength(7);
  });
});
