import { readFileSync } from 'node:fs';
import { loadModel } from '@tastir/project-core/model';
import { openEdges, volumeOf } from './mesh.js';
import { cutsFor } from './parts.js';
import {
  frameStrips,
  layoutSvg,
  MAGNET_ROOM,
  MAGNET_WALL,
  MAGNETS,
  placedOutline,
  plates,
  pocketReach,
  SMALL_MAGNET,
  tilePieces,
  tray,
  trayOutline,
  type PieceOptions,
} from './pieces.js';
import { rectangle, round, type PatternShape } from './relief.js';
import { signedArea, type P2 } from './skeleton.js';

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

const tutorial = (id: string) =>
  loadModel(JSON.parse(readFileSync(new URL(`../../../../tutorials/${id}.json`, import.meta.url), 'utf8'))).pattern;

const base = (extra: Partial<PieceOptions> = {}): PieceOptions => ({
  outline: rectangle(60, 60),
  scale: 20,
  frame: 0,
  thickness: 5,
  joint: 0.6,
  bevel: 0,
  colour: () => '#ffffff',
  frameColour: '#000000',
  ...extra,
});

/** The distance from p to the nearest side of a polygon. */
function toSides(p: P2, polygon: readonly P2[]): number {
  let best = Infinity;
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i]!;
    const b = polygon[(i + 1) % polygon.length]!;
    const ab = { x: b.x - a.x, y: b.y - a.y };
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * ab.x + (p.y - a.y) * ab.y) / (ab.x ** 2 + ab.y ** 2)));
    best = Math.min(best, Math.hypot(p.x - a.x - ab.x * t, p.y - a.y - ab.y * t));
  }
  return best;
}

/** The area of a regular pocket round a magnet. */
const pocketArea = (across: number) => {
  const n = 24;
  const r = (across + MAGNET_ROOM) / 2 / Math.cos(Math.PI / n);
  return (n / 2) * r * r * Math.sin((2 * Math.PI) / n);
};

describe('tile pieces', () => {
  it('prints each square shrunk by half the joint, with its magnet pocket', () => {
    const set = tilePieces(squares, base({ magnet: MAGNETS['6x2'] }));
    expect(set.pieces).toHaveLength(9);
    expect(set.dropped).toBe(0);
    expect(set.smallest).toBeCloseTo(19.4, 9);
    for (const p of set.pieces) {
      expect(openEdges(p.mesh)).toBe(0);
      expect(signedArea(p.outline)).toBeCloseTo(19.4 * 19.4, 9);
      expect(p.magnet).toBe(MAGNETS['6x2']);
      expect(volumeOf(p.mesh)).toBeCloseTo(19.4 * 19.4 * 5 - pocketArea(6) * (2 + MAGNET_ROOM), 6);
    }
  });

  it('puts the pocket in the middle of a long piece', () => {
    const long = tilePieces(squares, base({ outline: rectangle(40, 20), magnet: MAGNETS['6x2'], joint: 0 }));
    // Two squares side by side, each 20 mm: each pocket at its own middle.
    for (const p of long.pieces) {
      const xs = p.outline.map((q) => q.x);
      expect(p.at!.x).toBeCloseTo((Math.min(...xs) + Math.max(...xs)) / 2, 9);
    }
    const bar: PatternShape = {
      cell: { u: { x: 3, y: 0 }, v: { x: 0, y: 1 } },
      pieces: [{ type: 0, polygon: [{ x: -1.5, y: -0.5 }, { x: 1.5, y: -0.5 }, { x: 1.5, y: 0.5 }, { x: -1.5, y: 0.5 }] }],
    };
    const [one] = tilePieces(bar, base({ outline: rectangle(60, 20), magnet: MAGNETS['6x2'], joint: 0 })).pieces;
    expect(one!.at!.x).toBeCloseTo(0, 9);
    expect(one!.at!.y).toBeCloseTo(0, 9);
  });

  it('bevels the top edge at 45°', () => {
    const [plain] = tilePieces(squares, base()).pieces;
    const [bevelled] = tilePieces(squares, base({ bevel: 0.6 })).pieces;
    expect(openEdges(bevelled!.mesh)).toBe(0);
    // The bevel takes a triangle 0.6 × 0.6 off every side, less the corners' overlap.
    const s = 19.4;
    const cut = 4 * (s * 0.18 - (2 * 0.6 ** 3) / 3) + 4 * (0.6 ** 3 / 3);
    expect(volumeOf(plain!.mesh) - volumeOf(bevelled!.mesh)).toBeCloseTo(cut, 6);
  });

  it('cuts pieces at the outline and leaves out slivers', () => {
    // 50 mm: the outer squares are cut to 15 mm, the middle ones whole.
    const set = tilePieces(squares, base({ outline: rectangle(50, 50) }));
    expect(set.pieces.filter((p) => p.cut)).toHaveLength(8);
    // 40.5 mm: the outer ring is a 0.25 mm sliver, less than a joint.
    const thin = tilePieces(squares, base({ outline: rectangle(40.5, 40.5) }));
    expect(thin.pieces.filter((p) => !p.cut)).toHaveLength(1);
    expect(thin.dropped + thin.pieces.filter((p) => p.cut).length).toBe(8);
  });

  for (const [id, outline] of [
    ['eight-fold-star-and-cross', rectangle(130, 110)],
    ['attarine-star-rosettes', round(160)],
  ] as const)
    it(`covers the ${id} panel exactly once before shrinking, and every piece closes`, () => {
      const pattern = tutorial(id);
      const scale = 50 / Math.hypot(pattern.cell.u.x, pattern.cell.u.y);
      const o = base({ outline: outline.slice(), scale, frame: 8, colour: (k) => `#0000${k % 10}0` });
      const whole = tilePieces(pattern, { ...o, joint: 0 });
      const area = whole.pieces.reduce((a, p) => a + signedArea(p.outline), 0);
      expect(area + whole.droppedArea).toBeCloseTo(signedArea(outline), 4);
      // Shrunk by half a joint, with a bevel and magnets.
      const set = tilePieces(pattern, { ...o, bevel: 0.6, magnet: MAGNETS['6x2'] });
      expect(set.pieces.length).toBeGreaterThan(20);
      for (const p of set.pieces) {
        expect(openEdges(p.mesh)).toBe(0);
        expect(volumeOf(p.mesh)).toBeGreaterThan(0);
        if (p.magnet && p.at) {
          // The pocket keeps its wall.
          expect(toSides(p.at, p.outline)).toBeGreaterThanOrEqual(pocketReach(p.magnet) - 1e-9);
          expect(pocketReach(p.magnet)).toBeGreaterThan((p.magnet.across + MAGNET_ROOM) / 2 + MAGNET_WALL);
        }
      }
      // Each whole piece is its polygon moved in by exactly 0.3 mm.
      for (const p of set.pieces.filter((q) => !q.cut && q.type >= 0)) {
        const near = whole.pieces.find(
          (q) => !q.cut && q.type === p.type && p.outline.every((r) => toSides(r, q.outline) < 0.5 && inside(r, q.outline)),
        );
        expect(near).toBeDefined();
        for (const r of p.outline) expect(toSides(r, near!.outline)).toBeGreaterThanOrEqual(0.3 - 1e-6);
        expect(Math.min(...p.outline.map((r) => toSides(r, near!.outline)))).toBeCloseTo(0.3, 6);
      }
      expect(set.pieces.some((p) => p.magnet === SMALL_MAGNET) || set.pieces.every((p) => p.magnet)).toBe(true);
    });

  it('prints whole pieces: one set to a copy of the tile, and those whose middle is inside an outline', () => {
    const pattern = tutorial('attarine-star-rosettes');
    const scale = 100 / Math.hypot(pattern.cell.u.x, pattern.cell.u.y);
    const { u, v } = pattern.cell;
    const cell = Math.abs(u.x * v.y - u.y * v.x) * scale * scale;
    const one = tilePieces(pattern, base({ scale, joint: 0, whole: true, cells: [{ i: 0, j: 0 }] }));
    // The tile's pieces are each there once: they cover one repeat exactly.
    expect(one.pieces).toHaveLength(pattern.pieces.length);
    expect(one.pieces.reduce((a, p) => a + signedArea(p.outline), 0)).toBeCloseTo(cell, 4);
    const cells = [
      { i: 0, j: 0 },
      { i: 1, j: 0 },
      { i: 0, j: 1 },
      { i: 1, j: 1 },
    ];
    const four = tilePieces(pattern, {
      ...base({ scale, bevel: 0.6, magnet: MAGNETS['6x2'], whole: true, cells }),
      colour: (k, i, j) => `#00${i}${j}${k % 10}0`,
    });
    expect(four.pieces).toHaveLength(4 * pattern.pieces.length);
    expect(four.pieces.every((p) => !p.cut && p.type >= 0)).toBe(true);
    // Each copy is the first moved by the repeat, with its own colour.
    const n = pattern.pieces.length;
    for (let k = 0; k < n; k++) {
      const a = four.pieces[k]!;
      const b = four.pieces[3 * n + k]!;
      const d = { x: (u.x + v.x) * scale, y: (u.y + v.y) * scale };
      a.outline.forEach((p, m) => {
        expect(b.outline[m]!.x).toBeCloseTo(p.x + d.x, 9);
        expect(b.outline[m]!.y).toBeCloseTo(p.y + d.y, 9);
      });
      expect(volumeOf(b.mesh)).toBeCloseTo(volumeOf(a.mesh), 6);
      expect(openEdges(b.mesh)).toBe(0);
      expect(b.colour).toBe(`#0011${k % 10}0`);
    }
    // Over a panel: no cut piece and no frame, every middle inside.
    const panel = tilePieces(pattern, base({ outline: rectangle(150, 120), scale, frame: 8, whole: true }));
    expect(panel.pieces.length).toBeGreaterThan(50);
    expect(panel.pieces.every((p) => !p.cut && p.type >= 0)).toBe(true);
    const area = panel.pieces.reduce((a, p) => a + signedArea(p.outline), 0);
    expect(area).toBeGreaterThan(150 * 120 * 0.8);
    expect(layoutSvg(panel.pieces, [], 'Whole')).not.toContain('stroke-dasharray');
  });

  it('frames a panel in mitred strips, a round one in arcs, none longer than the bed allows', () => {
    const square = frameStrips(rectangle(200, 200), 8, 240);
    expect(square).toHaveLength(4);
    expect(square.reduce((a, s) => a + signedArea(s), 0)).toBeCloseTo(200 * 200 - 184 * 184, 9);
    expect(frameStrips(rectangle(400, 200), 8, 240)).toHaveLength(6);
    const ring = frameStrips(round(200), 8, 240);
    expect(ring.length).toBeGreaterThanOrEqual(4);
    expect(ring.length).toBeLessThanOrEqual(5);
  });

  it('packs one colour to a plate, with nothing overlapping or off the bed', () => {
    const pattern = tutorial('eight-fold-star-and-cross');
    const scale = 100 / Math.hypot(pattern.cell.u.x, pattern.cell.u.y);
    const set = tilePieces(pattern, {
      ...base({ outline: rectangle(300, 300), scale, frame: 8 }),
      colour: (k) => (pattern.pieces[k]!.type === 0 ? '#ffffff' : '#123456'),
    });
    const packed = plates(set.pieces);
    expect(packed.reduce((n, p) => n + p.items.length, 0)).toBe(set.pieces.length);
    for (const plate of packed) {
      const boxes = plate.items.map((item) => {
        expect(set.pieces[item.piece]!.colour).toBe(plate.colour);
        const ps = placedOutline(set.pieces[item.piece]!.outline, item);
        const xs = ps.map((p) => p.x);
        const ys = ps.map((p) => p.y);
        return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
      });
      for (const b of boxes) {
        expect(b.x0).toBeGreaterThanOrEqual(3 - 1e-9);
        expect(b.y0).toBeGreaterThanOrEqual(3 - 1e-9);
        expect(b.x1).toBeLessThanOrEqual(253 + 1e-9);
        expect(b.y1).toBeLessThanOrEqual(253 + 1e-9);
      }
      for (let a = 0; a < boxes.length; a++)
        for (let b = a + 1; b < boxes.length; b++) {
          const p = boxes[a]!;
          const q = boxes[b]!;
          const apart = p.x1 + 4 - 1e-9 <= q.x0 || q.x1 + 4 - 1e-9 <= p.x0 || p.y1 + 4 - 1e-9 <= q.y0 || q.y1 + 4 - 1e-9 <= p.y0;
          expect(apart).toBe(true);
        }
    }
    // The two kinds' colours and the frame's.
    expect(new Set(packed.map((p) => p.colour)).size).toBe(3);
    const svg = layoutSvg(set.pieces, rectangle(300, 300), 'Star');
    expect(svg.match(/<path /g)).toHaveLength(set.pieces.length + 1);
    expect(svg).toContain(`>${set.pieces.length}</text>`);
  });

  it('makes a tray the pieces fit in, in parts when it is larger than the bed', () => {
    const [small] = tray(rectangle(200, 200), 0.6, { xs: [], ys: [] });
    expect(openEdges(small!.mesh)).toBe(0);
    const outer = 200 + 0.6 + 8;
    const inner = 200.6;
    expect(volumeOf(small!.mesh)).toBeCloseTo(outer * outer * 1.2 + (outer * outer - inner * inner) * 3, 6);
    const big = rectangle(400, 300);
    const parts = tray(big, 0.6, cutsFor(trayOutline(big, 0.6), 250));
    expect(parts.length).toBe(4);
    for (const p of parts) expect(openEdges(p.mesh)).toBe(0);
  });
});

function inside(p: P2, polygon: readonly P2[]): boolean {
  let c = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i]!;
    const b = polygon[j]!;
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) c = !c;
  }
  return c;
}
