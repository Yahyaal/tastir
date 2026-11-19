import { readFileSync } from 'node:fs';
import { loadModel } from '@tastir/project-core/model';
import { openEdges, pinHoleVolume, volumeOf, type Mesh } from './mesh.js';
import { mouldOf, mouldOutline, mouldParts } from './mould.js';
import { cutsFor, partsOf, pinsFor } from './parts.js';
import { panelParts, rectangle, reliefSurface, reliefTop, round, type ReliefOptions } from './relief.js';
import { standOn } from './mesh.js';
import type { P2 } from './skeleton.js';

const tutorial = (id: string) =>
  loadModel(
    JSON.parse(readFileSync(new URL(`../../../../tutorials/${id}.json`, import.meta.url), 'utf8')),
  );

function extent(mesh: Mesh) {
  const p = mesh.positions;
  const xs = [...p].filter((_, i) => i % 3 === 0);
  const ys = [...p].filter((_, i) => i % 3 === 1);
  return {
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
  };
}

/** The area seen from above of the up-facing triangles. */
function topArea(mesh: Mesh): number {
  const { positions: p, triangles: t } = mesh;
  let area = 0;
  for (let i = 0; i < t.length; i += 3) {
    const [a, b, c] = [t[i]! * 3, t[i + 1]! * 3, t[i + 2]! * 3];
    const z =
      ((p[b]! - p[a]!) * (p[c + 1]! - p[a + 1]!) - (p[b + 1]! - p[a + 1]!) * (p[c]! - p[a]!)) / 2;
    if (z > 0) area += z;
  }
  return area;
}

const { pattern } = tutorial('eight-fold-star-and-cross');
const scale = 100 / Math.hypot(pattern.cell.u.x, pattern.cell.u.y);
const options = (outline: P2[]): ReliefOptions => ({
  width: 0,
  height: 0,
  outline,
  scale,
  thickness: 12,
  band: 3,
  frame: 8,
  carving: (type) =>
    type % 2 ? { kind: 'facets', slope: 35, depth: 8 } : { kind: 'cushion', depth: 8, draft: 6, rise: 3.6 },
});

describe('cuts', () => {
  it('cuts on the repeat when the parts still fit, else evenly', () => {
    const square = rectangle(400, 400);
    expect(cutsFor(square, 250, { x: { step: 100, at: 0 } })).toEqual({ xs: [0], ys: [0] });
    // A 150 mm repeat would leave a part 350 mm wide: cut evenly instead.
    expect(cutsFor(rectangle(700, 100), 250, { x: { step: 150, at: 0 } }).xs).toEqual([
      -350 + 700 / 3,
      -350 + 1400 / 3,
    ]);
    expect(cutsFor(rectangle(200, 200), 250)).toEqual({ xs: [], ys: [] });
  });

  it('names parts from the top left', () => {
    const parts = partsOf(rectangle(400, 300), { xs: [0], ys: [0] });
    expect(parts.map((p) => p.name)).toEqual(['A1', 'B1', 'A2', 'B2']);
    expect(parts[0]!.outline.every((p) => p.x <= 0 && p.y >= 0)).toBe(true);
  });
});

describe('a panel in parts', () => {
  for (const [name, outline] of [
    ['square', rectangle(400, 400)],
    ['round', round(400)],
    ['mitred border', [
      { x: -300, y: -60 },
      { x: 300, y: -60 },
      { x: 240, y: 60 },
      { x: -240, y: 60 },
    ]],
  ] as const)
    it(`adds up to the whole ${name} panel, less its pin holes`, () => {
      const o = options(outline.slice());
      const whole = standOn(reliefTop(pattern, o).top, outline.slice());
      const { surface } = reliefSurface(pattern, o);
      const cuts = cutsFor(outline, 250, { x: { step: 100, at: 0 }, y: { step: 100, at: 0 } });
      // The floor under the deepest carving is 4 mm: pins at half of it.
      const pins = pinsFor(outline, cuts, 2);
      expect(pins.length).toBeGreaterThan(0);
      const parts = panelParts(surface, outline, o, cuts, pins);
      let volume = 0;
      let holes = 0;
      for (const part of parts) {
        expect(openEdges(part.mesh), part.name).toBe(0);
        const size = extent(part.mesh);
        expect(Math.max(size.width, size.height)).toBeLessThanOrEqual(250);
        volume += volumeOf(part.mesh);
        holes += part.pins;
      }
      // Each pin has a hole on both sides of its seam.
      expect(holes).toBe(2 * pins.length);
      expect(volume + holes * pinHoleVolume()).toBeCloseTo(volumeOf(whole), 4);
      // Without pins, the parts' tops cover the panel exactly once.
      const plain = panelParts(surface, outline, o, cuts, []);
      const area = plain.reduce((sum, p) => sum + topArea(p.mesh), 0);
      expect(area).toBeCloseTo(topArea(whole), 4);
    });

  it('puts the holes on both sides of a seam face to face', () => {
    const outline = rectangle(400, 200);
    const o = options(outline);
    const { surface } = reliefSurface(pattern, o);
    const cuts = cutsFor(outline, 250, { x: { step: 100, at: 0 } });
    const [left, right] = panelParts(surface, outline, o, cuts, pinsFor(outline, cuts, 2));
    // The hole's end: corners 6 mm in from the seam at x = 0.
    const ends = (m: Mesh, x: number) => {
      const out: string[] = [];
      for (let i = 0; i < m.positions.length; i += 3)
        if (Math.abs(m.positions[i]! - x) < 1e-9)
          out.push(`${m.positions[i + 1]!.toFixed(4)},${m.positions[i + 2]!.toFixed(4)}`);
      return out.sort();
    };
    expect(ends(left!.mesh, -6)).toEqual(ends(right!.mesh, 6));
    expect(ends(left!.mesh, -6)).toHaveLength(3 * 16);
  });
});

describe('a mould in parts', () => {
  it('adds up to the whole mould, less its pin holes', () => {
    const outline = rectangle(400, 300);
    const o = options(outline);
    const { top } = reliefTop(pattern, o);
    const mould = { floor: 4, wall: 6 };
    const whole = mouldOf(top, outline, 12, mould);
    const outer = mouldOutline(outline, 6);
    const cuts = cutsFor(outer, 250, { x: { step: 100, at: 0 }, y: { step: 100, at: 0 } });
    const pins = pinsFor(outer, cuts, 2);
    const parts = mouldParts(top, outline, 12, mould, cuts, pins);
    expect(parts).toHaveLength(4);
    let volume = 0;
    let holes = 0;
    for (const part of parts) {
      expect(openEdges(part.mesh), part.name).toBe(0);
      volume += volumeOf(part.mesh);
      holes += part.pins;
    }
    expect(volume + holes * pinHoleVolume()).toBeCloseTo(volumeOf(whole), 4);
  });
});
