import { readFileSync } from 'node:fs';
import { loadModel } from '@tastir/project-core/model';
import { inset, openEdges, volumeOf, type Mesh } from './mesh.js';
import { relief, type PatternShape } from './relief.js';
import type { Carving } from './profile.js';

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

const frustum = (a: number, b: number, h: number) =>
  (h / 3) * (a * a + a * b + b * b);
const tan = (deg: number) => Math.tan((deg * Math.PI) / 180);

describe('relief', () => {
  const base = { scale: 20, thickness: 10, band: 2, frame: 0 };

  it('cuts flat recesses with drafted walls, to the exact volume', () => {
    const carving: Carving = { kind: 'flat', depth: 5, draft: 6 };
    const mesh = relief(squares, {
      ...base,
      width: 60,
      height: 60,
      carving: () => carving,
    });
    expect(openEdges(mesh)).toBe(0);
    const a = 18;
    const b = a - 2 * 5 * tan(6);
    expect(volumeOf(mesh)).toBeCloseTo(60 * 60 * 10 - 9 * frustum(a, b, 5), 6);
  });

  it('carves facets to an apex, as a pyramid', () => {
    const carving: Carving = { kind: 'facets', slope: 45, depth: 9.5 };
    const mesh = relief(squares, {
      ...base,
      thickness: 12,
      width: 20,
      height: 20,
      carving: () => carving,
    });
    expect(openEdges(mesh)).toBe(0);
    // The slopes meet at 9 mm, before the 9.5 mm floor.
    expect(volumeOf(mesh)).toBeCloseTo(20 * 20 * 12 - (18 * 18 * 9) / 3, 6);
    const zs = [...mesh.positions].filter((_, i) => i % 3 === 2);
    expect(Math.min(...zs.filter((z) => z > 0))).toBeCloseTo(3, 9);
  });

  it('closes when the outline cuts through recesses, with and without a frame', () => {
    const carving: Carving = { kind: 'cushion', depth: 4, draft: 8, rise: 2 };
    for (const frame of [0, 3]) {
      const mesh = relief(squares, {
        ...base,
        frame,
        width: 47,
        height: 33,
        carving: () => carving,
      });
      expect(openEdges(mesh)).toBe(0);
      expect(volumeOf(mesh)).toBeGreaterThan(47 * 33 * 6);
      expect(volumeOf(mesh)).toBeLessThan(47 * 33 * 10);
    }
  });

  it('refuses a carving deeper than the panel allows', () => {
    expect(() =>
      relief(squares, {
        ...base,
        width: 20,
        height: 20,
        carving: () => ({ kind: 'flat', depth: 9.5, draft: 5 }),
      }),
    ).toThrow(/Piece kind 1 is carved 9.5 mm deep/);
  });
});

/** The area the mesh's up-facing triangles cover, seen from above. A
 * top with a fold or an overlap covers more than the panel. */
function topArea(mesh: Mesh): number {
  const { positions: p, triangles: t } = mesh;
  let area = 0;
  for (let i = 0; i < t.length; i += 3) {
    const [a, b, c] = [t[i]! * 3, t[i + 1]! * 3, t[i + 2]! * 3];
    const z =
      ((p[b]! - p[a]!) * (p[c + 1]! - p[a + 1]!) -
        (p[b + 1]! - p[a + 1]!) * (p[c]! - p[a]!)) /
      2;
    if (z > 0) area += z;
  }
  return area;
}

const tutorial = (id: string) =>
  loadModel(
    JSON.parse(
      readFileSync(
        new URL(`../../../../tutorials/${id}.json`, import.meta.url),
        'utf8',
      ),
    ),
  );

describe('relief of real patterns', () => {
  const carvings: readonly Carving[] = [
    { kind: 'facets', slope: 40, depth: 6 },
    { kind: 'flat', depth: 6, draft: 6 },
    { kind: 'cushion', depth: 6, draft: 6, rise: 3 },
  ];
  for (const id of [
    'eight-fold-star-and-cross',
    'twelve-fold-rosette-mian-hex',
    'alhambra-comares-dado',
  ])
    it(`gives ${id} a closed panel in every carving`, () => {
      const { pattern } = tutorial(id);
      const { u } = pattern.cell;
      // About two repeats across a 120 mm panel.
      const scale = 60 / Math.hypot(u.x, u.y);
      carvings.forEach((carving, k) => {
        const mesh = relief(pattern, {
          width: 120,
          height: 90,
          scale,
          thickness: 10,
          band: 2.4,
          frame: k === 1 ? 4 : 0,
          carving: (type) =>
            type % 3 === k % 3 ? { kind: 'raised' } : carving,
        });
        expect(openEdges(mesh), carving.kind).toBe(0);
        expect(topArea(mesh)).toBeCloseTo(120 * 90, 6);
        const v = volumeOf(mesh);
        expect(v).toBeGreaterThan(120 * 90 * 4);
        expect(v).toBeLessThan(120 * 90 * 10);
      });
    });

  it('rejects double-band grooves or rounded band edges that cut into MIN_BASE', () => {
    const { pattern } = tutorial('eight-fold-star-and-cross');
    expect(() =>
      relief(pattern, {
        width: 80,
        height: 80,
        scale: 40,
        thickness: 3,
        band: 10,
        bands: 'rounded',
        frame: 0,
        carving: () => ({ kind: 'raised' }),
      }),
    ).toThrow(/MIN_BASE|less than/i);
  });

  it('insets convex outlines with collinear vertices without producing NaN', () => {
    const out = inset(
      [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ],
      5,
    );
    expect(out.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y))).toBe(
      true,
    );
    expect(out[1]).toEqual({ x: 50, y: 5 });
  });
});
