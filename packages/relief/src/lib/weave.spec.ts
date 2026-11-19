import { readFileSync } from 'node:fs';
import { weave } from '@tastir/engine';
import { loadModel } from '@tastir/project-core/model';
import { openEdges, volumeOf, type Mesh } from './mesh.js';
import { cutsFor, pinsFor } from './parts.js';
import { panelParts, relief, reliefSurface, type PatternShape, type ReliefOptions } from './relief.js';
import type { BandShape, Carving } from './profile.js';

const tutorial = (id: string) => {
  const { pattern } = loadModel(
    JSON.parse(readFileSync(new URL(`../../../../tutorials/${id}.json`, import.meta.url), 'utf8')),
  );
  const w = weave(
    pattern.ink.map((s) => s.segment),
    pattern.cell,
  );
  return { ...pattern, weave: w } as PatternShape & { weave: NonNullable<PatternShape['weave']> };
};

/** The height of the mesh's top over (x, y). */
function heightAt(mesh: Mesh, x: number, y: number): number {
  const { positions: p, triangles: t } = mesh;
  let best = -Infinity;
  for (let i = 0; i < t.length; i += 3) {
    const [a, b, c] = [t[i]! * 3, t[i + 1]! * 3, t[i + 2]! * 3];
    const area = (p[b]! - p[a]!) * (p[c + 1]! - p[a + 1]!) - (p[b + 1]! - p[a + 1]!) * (p[c]! - p[a]!);
    if (area <= 1e-12) continue;
    const w0 = ((p[b]! - x) * (p[c + 1]! - y) - (p[b + 1]! - y) * (p[c]! - x)) / area;
    const w1 = ((p[c]! - x) * (p[a + 1]! - y) - (p[c + 1]! - y) * (p[a]! - x)) / area;
    const w2 = 1 - w0 - w1;
    if (w0 < -1e-9 || w1 < -1e-9 || w2 < -1e-9) continue;
    best = Math.max(best, w0 * p[a + 2]! + w1 * p[b + 2]! + w2 * p[c + 2]!);
  }
  return best;
}

function topArea(mesh: Mesh): number {
  const { positions: p, triangles: t } = mesh;
  let area = 0;
  for (let i = 0; i < t.length; i += 3) {
    const [a, b, c] = [t[i]! * 3, t[i + 1]! * 3, t[i + 2]! * 3];
    const z =
      ((p[b]! - p[a]!) * (p[c + 1]! - p[a + 1]!) - (p[b + 1]! - p[a + 1]!) * (p[c]! - p[a]!)) / 2;
    if (z > 1e-9) area += z;
  }
  return area;
}

const facets: Carving = { kind: 'facets', slope: 35, depth: 8 };
const options = (pattern: PatternShape, extra: Partial<ReliefOptions> = {}): ReliefOptions => ({
  width: 200,
  height: 200,
  scale: 100 / Math.hypot(pattern.cell.u.x, pattern.cell.u.y),
  thickness: 12,
  band: 3,
  frame: 8,
  carving: () => facets,
  ...extra,
});

describe('woven bands', () => {
  for (const id of ['eight-fold-star-and-cross', 'twelve-fold-rosette-mian-hex'])
    it(`puts one band ${1.5} mm over the other at each crossing of ${id}`, () => {
      const pattern = tutorial(id);
      const o = options(pattern, { gap: 1.5 });
      const mesh = relief(pattern, o);
      expect(openEdges(mesh)).toBe(0);
      expect(topArea(mesh)).toBeCloseTo(200 * 200, 3);
      const { dips } = reliefSurface(pattern, o);
      expect(dips).toBeGreaterThan(0);
      let checked = 0;
      let lowered = 0;
      const [m, n] = pattern.weave.repeat;
      const { u, v } = pattern.cell;
      for (let i = -3; i <= 3; i++)
        for (let j = -3; j <= 3; j++)
          for (const c of pattern.weave.crossings) {
            const x = (c.at.x + i * m * u.x + j * n * v.x) * o.scale;
            const y = (c.at.y + i * m * u.y + j * n * v.y) * o.scale;
            // Well inside the frame, and each crossing once.
            if (Math.abs(x) > 80 || Math.abs(y) > 80) continue;
            checked++;
            // The band on top keeps its height.
            expect(heightAt(mesh, x, y)).toBeCloseTo(12, 6);
            const sin = Math.abs(c.over.x * c.under.y - c.over.y * c.under.x);
            const clear = 1.5 / sin;
            for (const s of [1, -1]) {
              // Just past the top band's edge, along the band underneath.
              const t = clear + 0.01;
              const z = heightAt(mesh, x + s * c.under.x * t, y + s * c.under.y * t);
              if (z < 12 - 1e-6) {
                lowered++;
                expect(z).toBeGreaterThan(12 - 1.5 - 1e-6);
                expect(z).toBeLessThan(12 - 1.5 + 0.02);
              }
            }
          }
      expect(checked).toBeGreaterThanOrEqual(4);
      // Nearly every side of every crossing is lowered.
      expect(lowered).toBeGreaterThan(checked * 2 * 0.9);
    });

  it('stays closed with every band shape and carving, and in parts', () => {
    const pattern = tutorial('eight-fold-star-and-cross');
    const carvings: Carving[] = [
      facets,
      { kind: 'flat', depth: 6, draft: 6 },
      { kind: 'cushion', depth: 6, draft: 6, rise: 2.7 },
    ];
    for (const bands of ['flat', 'rounded', 'double'] as BandShape[])
      carvings.forEach((carving, k) => {
        const o = options(pattern, {
          gap: 1.2,
          bands,
          width: 130,
          height: 110,
          carving: (type) => (type === k % 2 && k === 2 ? { kind: 'raised' } : carving),
        });
        const mesh = relief(pattern, o);
        expect(openEdges(mesh), `${bands} ${carving.kind}`).toBe(0);
        expect(topArea(mesh)).toBeCloseTo(130 * 110, 3);
      });
    const outline = [
      { x: -150, y: -100 },
      { x: 150, y: -100 },
      { x: 150, y: 100 },
      { x: -150, y: 100 },
    ];
    const o = options(pattern, { gap: 1.5, bands: 'rounded', outline });
    const { surface } = reliefSurface(pattern, o);
    const cuts = cutsFor(outline, 250, { x: { step: 100, at: 0 } });
    for (const part of panelParts(surface, outline, o, cuts, pinsFor(outline, cuts, 2)))
      expect(openEdges(part.mesh), part.name).toBe(0);
  });

  it('changes nothing with no gap', () => {
    const pattern = tutorial('eight-fold-star-and-cross');
    const plain = relief(pattern, options(pattern));
    const none = relief(pattern, options(pattern, { gap: 0 }));
    expect(volumeOf(none)).toBe(volumeOf(plain));
    const { weave: _, ...unwoven } = pattern;
    expect(volumeOf(relief(unwoven, options(pattern, { gap: 1.5 })))).toBe(volumeOf(plain));
  });

  it('shapes the bands: rounded edges a quarter of the band lower, a groove along double ones', () => {
    const pattern = tutorial('eight-fold-star-and-cross');
    const flat = volumeOf(relief(pattern, options(pattern)));
    const rounded = volumeOf(relief(pattern, options(pattern, { bands: 'rounded' })));
    const double = volumeOf(relief(pattern, options(pattern, { bands: 'double' })));
    expect(rounded).toBeLessThan(flat);
    expect(double).toBeLessThan(flat);
  });
});
