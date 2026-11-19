import { readFileSync } from 'node:fs';
import { loadModel } from '@tastir/project-core/model';
import { inset, openEdges, standOn, volumeOf } from './mesh.js';
import { mouldBox, mouldOf, plasterFor, siliconeFor, uprightArea } from './mould.js';
import { relief, reliefTop, round, type PatternShape, type ReliefOptions } from './relief.js';
import { signedArea } from './skeleton.js';

const squares: PatternShape = {
  cell: { u: { x: 1, y: 0 }, v: { x: 0, y: 1 } },
  pieces: [
    {
      type: 0,
      polygon: [
        { x: -0.5, y: -0.5 },
        { x: 0.5, y: -0.5 },
        { x: 0.5, y: 0.5 },
        { x: -0.5, y: 0.5 },
      ],
    },
  ],
};

const eight = loadModel(
  JSON.parse(
    readFileSync(
      new URL('../../../../tutorials/eight-fold-star-and-cross.json', import.meta.url),
      'utf8',
    ),
  ),
).pattern;

describe('the mould for a panel', () => {
  const cases: [string, PatternShape, ReliefOptions][] = [
    [
      'squares, no frame',
      squares,
      { width: 47, height: 33, scale: 20, thickness: 10, band: 2, frame: 0, carving: () => ({ kind: 'flat', depth: 5, draft: 6 }) },
    ],
    [
      'eight-fold, framed',
      eight,
      { width: 120, height: 90, scale: 30, thickness: 12, band: 3, frame: 6, carving: (t) => (t ? { kind: 'facets', slope: 35, depth: 8 } : { kind: 'cushion', depth: 7, draft: 6, rise: 3 }) },
    ],
    [
      'eight-fold, round',
      eight,
      { width: 0, height: 0, outline: round(110), scale: 40, thickness: 10, band: 2.5, frame: 5, carving: () => ({ kind: 'facets', slope: 40, depth: 6 }) },
    ],
  ];
  for (const [name, pattern, options] of cases)
    it(`holds exactly the panel: ${name}`, () => {
      const { top, outline } = reliefTop(pattern, options);
      const panel = standOn(top, outline);
      const mould = mouldOf(top, outline, options.thickness, { floor: 3, wall: 6 });
      expect(openEdges(mould)).toBe(0);
      const outer = inset(outline, -6);
      const box = signedArea(outer) * (3 + options.thickness);
      // What the mould does not fill up to its rim is the cast.
      expect(box - volumeOf(mould)).toBeCloseTo(volumeOf(panel), 3);
    });
});

describe('the box for silicone', () => {
  it('is a closed ring round the master, and the silicone fills the rest', () => {
    const options: ReliefOptions = {
      width: 60,
      height: 40,
      scale: 20,
      thickness: 10,
      band: 2,
      frame: 4,
      carving: () => ({ kind: 'flat', depth: 5, draft: 6 }),
    };
    const panel = relief(squares, options);
    const { outline } = reliefTop(squares, options);
    const box = mouldBox(outline, 10, { gap: 10, cover: 8, wall: 2.4 });
    expect(openEdges(box)).toBe(0);
    expect(volumeOf(box)).toBeCloseTo((84.8 * 64.8 - 80 * 60) * 18, 6);
    expect(siliconeFor(outline, 10, volumeOf(panel), { gap: 10, cover: 8 })).toBeCloseTo(
      80 * 60 * 18 - volumeOf(panel),
      6,
    );
  });
});

describe('plaster and draft', () => {
  it('mixes plaster and water that fill the cast', () => {
    const { plaster, water } = plasterFor(1_000_000, 70);
    expect(plaster / 2.63 + water).toBeCloseTo(1000, 9);
    expect(water / plaster).toBeCloseTo(0.7, 12);
  });

  it('finds the upright walls a frame makes, and none in drafted carving', () => {
    const base: ReliefOptions = {
      width: 40,
      height: 40,
      scale: 20,
      thickness: 10,
      band: 2,
      frame: 0,
      carving: () => ({ kind: 'flat', depth: 5, draft: 6 }),
    };
    const { outline } = reliefTop(squares, base);
    expect(uprightArea(relief(squares, base), outline, 3)).toBe(0);
    // A frame cuts the four recesses at 4 mm in: four upright walls each
    // side, 5 mm high wherever the floor meets them.
    expect(uprightArea(relief(squares, { ...base, frame: 4 }), outline, 3)).toBeGreaterThan(0);
  });
});
