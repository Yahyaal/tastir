import { loadModel } from '../app/model';
import example from '@tutorials/eight-fold-star-and-cross.json';
import hex from '@tutorials/twelve-fold-rosette-mian-hex.json';
import {
  carvingOf,
  DEFAULT_SETTINGS,
  extent,
  FLOOR,
  outlineOf,
  sane,
  scaleOf,
} from './settings';

const area = (poly: readonly { x: number; y: number }[]) =>
  poly.reduce((a, p, i) => {
    const q = poly[(i + 1) % poly.length]!;
    return a + (p.x * q.y - q.x * p.y) / 2;
  }, 0);

describe('make settings', () => {
  it('keeps every carving above a floor of the panel', () => {
    const s = { ...DEFAULT_SETTINGS, thickness: 5, depth: 8 };
    expect(carvingOf(s, 'flat')).toMatchObject({ depth: 5 - FLOOR });
    expect(carvingOf(s, 'raised')).toEqual({ kind: 'raised' });
  });

  it('cuts a tile on the repeat, counter-clockwise, at the repeat size', () => {
    for (const json of [example, hex]) {
      const { pattern } = loadModel(json);
      const s = { ...DEFAULT_SETTINGS, shape: 'tile' as const, repeat: 120 };
      const tile = outlineOf(pattern, s);
      expect(area(tile)).toBeGreaterThan(0);
      const scale = scaleOf(pattern, s);
      expect(area(tile)).toBeCloseTo(pattern.cell.area * scale * scale, 6);
    }
  });

  it('measures round and rectangular outlines', () => {
    const { pattern } = loadModel(example);
    expect(extent(outlineOf(pattern, { ...DEFAULT_SETTINGS, shape: 'round', width: 150 }))).toEqual({
      width: 150,
      height: expect.closeTo(150, 1) as number,
    });
    expect(extent(outlineOf(pattern, { ...DEFAULT_SETTINGS, width: 120, height: 80 }))).toEqual({
      width: 120,
      height: 80,
    });
  });

  it('clamps remembered settings to sizes that make sense', () => {
    const s = sane({
      shape: 'spaceship' as never,
      width: -4,
      thickness: 6,
      depth: 99,
      kinds: { 0: 'cushion', 1: 'lava' as never, x: 'flat' } as never,
    });
    expect(s.shape).toBe('panel');
    expect(s.width).toBe(20);
    expect(s.depth).toBe(6 - FLOOR);
    expect(s.kinds).toEqual({ 0: 'cushion' });
  });
});
