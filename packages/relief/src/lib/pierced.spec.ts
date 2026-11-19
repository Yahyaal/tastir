import { readFileSync } from 'node:fs';
import { weave } from '@tastir/engine';
import { loadModel } from '@tastir/project-core/model';
import { openEdges, standOn, volumeOf } from './mesh.js';
import { mouldOf, mouldParts, mouldOutline } from './mould.js';
import { cutsFor } from './parts.js';
import { dxf, flatLines, svg } from './flat.js';
import { signedArea } from './skeleton.js';
import { panelParts, relief, reliefSurface, reliefTop, type PatternShape, type ReliefOptions } from './relief.js';

/** Unit squares, edge to edge. */
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

const lattice: ReliefOptions = {
  width: 60,
  height: 60,
  scale: 20,
  thickness: 5,
  band: 2,
  frame: 0,
  carving: () => ({ kind: 'pierced' }),
};

describe('pierced screens', () => {
  it('cuts every square through, leaving a lattice of exactly the bands', () => {
    const mesh = relief(squares, lattice);
    expect(openEdges(mesh)).toBe(0);
    expect(volumeOf(mesh)).toBeCloseTo((60 * 60 - 9 * 18 * 18) * 5, 6);
  });

  it('keeps the frame whole where it meets a hole', () => {
    const mesh = relief(squares, { ...lattice, width: 72, height: 72, frame: 4 });
    expect(openEdges(mesh)).toBe(0);
    // Inside the frame (±32) the holes are 1, 18, 18, 18 and 1 mm across.
    expect(volumeOf(mesh)).toBeCloseTo((72 * 72 - 56 * 56) * 5, 6);
    // A frame ending exactly on the holes' edges, and holes on the outline.
    for (const [width, frame] of [
      [70, 4],
      [62, 0],
    ] as const) {
      const exact = relief(squares, { ...lattice, width, height: width, frame });
      expect(openEdges(exact), `${width} ${frame}`).toBe(0);
    }
  });

  it('casts exactly the screen from its mould, posts and all', () => {
    const { top, outline } = reliefTop(squares, lattice);
    const object = standOn(top, outline);
    const mould = mouldOf(top, outline, 5, { floor: 3, wall: 6 });
    expect(openEdges(mould)).toBe(0);
    const box = (60 + 12) * (60 + 12) * (3 + 5);
    expect(box - volumeOf(mould)).toBeCloseTo(volumeOf(object), 6);
  });

  it('pierces a real pattern, woven and framed, whole and in parts', () => {
    const { pattern } = loadModel(
      JSON.parse(
        readFileSync(new URL('../../../../tutorials/eight-fold-star-and-cross.json', import.meta.url), 'utf8'),
      ),
    );
    const woven = { ...pattern, weave: weave(pattern.ink.map((s) => s.segment), pattern.cell) };
    const outline = [
      { x: -150, y: -100 },
      { x: 150, y: -100 },
      { x: 150, y: 100 },
      { x: -150, y: 100 },
    ];
    const o: ReliefOptions = {
      width: 0,
      height: 0,
      outline,
      scale: 100 / Math.hypot(pattern.cell.u.x, pattern.cell.u.y),
      thickness: 6,
      band: 3,
      frame: 8,
      gap: 1,
      bands: 'rounded',
      carving: (type) => (type === 0 ? { kind: 'pierced' } : { kind: 'facets', slope: 35, depth: 3 }),
    };
    const mesh = relief(woven, o);
    expect(openEdges(mesh)).toBe(0);
    const { surface } = reliefSurface(woven, o);
    const cuts = cutsFor(outline, 250, { x: { step: 100, at: 0 } });
    const parts = panelParts(surface, outline, o, cuts, []);
    let volume = 0;
    for (const part of parts) {
      expect(openEdges(part.mesh), part.name).toBe(0);
      volume += volumeOf(part.mesh);
    }
    expect(volume).toBeCloseTo(volumeOf(mesh), 4);
    const { top } = reliefTop(woven, o);
    const outer = mouldOutline(outline, 6);
    for (const part of mouldParts(top, outline, 6, { floor: 4, wall: 6 }, cutsFor(outer, 250), []))
      expect(openEdges(part.mesh), part.name).toBe(0);
  });

  it('draws the cut and the engraving flat, as SVG and DXF', () => {
    const half: ReliefOptions = {
      ...lattice,
      carving: (type) => (type === 0 ? { kind: 'pierced' } : { kind: 'flat', depth: 2, draft: 6 }),
    };
    const pierced = reliefSurface(squares, lattice);
    const lines = flatLines(pierced.surface, pierced.tagged, pierced.outline, 0, 5);
    const areas = lines.cut.map(signedArea).sort((a, b) => a - b);
    expect(areas).toHaveLength(10);
    for (const a of areas.slice(0, 9)) expect(a).toBeCloseTo(-18 * 18, 6);
    expect(areas[9]).toBeCloseTo(60 * 60, 6);
    expect(lines.cut.every((l) => l.length === 4)).toBe(true);
    expect(lines.engrave).toHaveLength(0);
    // Carved, not pierced: the outline to cut, each recess to engrave.
    const carved = reliefSurface(squares, { ...half, carving: () => ({ kind: 'flat', depth: 2, draft: 6 }) });
    const engraved = flatLines(carved.surface, carved.tagged, carved.outline, 0, 5);
    expect(engraved.cut).toHaveLength(1);
    expect(engraved.engrave.map(signedArea).every((a) => Math.abs(a - 18 * 18) < 1e-6)).toBe(true);
    expect(engraved.engrave).toHaveLength(9);

    const drawing = svg(lines, 'Lattice');
    expect(drawing).toContain('width="60mm" height="60mm"');
    const cutLayer = drawing.slice(drawing.indexOf('id="cut"'), drawing.indexOf('id="engrave"'));
    expect(cutLayer.match(/<path /g)).toHaveLength(10);
    const text = dxf(lines);
    expect(text.match(/^POLYLINE$/gm)).toHaveLength(10);
    expect(text).toMatch(/^AC1009$/m);
    expect(text.trim().endsWith('EOF')).toBe(true);
  });
});
