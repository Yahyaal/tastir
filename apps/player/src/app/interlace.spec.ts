import example from '@tutorials/eight-fold-star-and-cross.json';
import dado from '@tutorials/alhambra-comares-west-dado.json';
import type { Vec } from '@tastir/engine';
import {
  bandFit,
  CROSSING_ROOM,
  overlapsAt,
  PAST_BAND,
  PAST_EDGE,
  weaveOf,
} from './interlace';
import { loadModel } from './model';

describe('the top band at a crossing', () => {
  const model = loadModel(example);
  const crossings = weaveOf(model.pattern).crossings;
  const outer = 0.1;
  const inner = 0.06;
  const shapes = overlapsAt(model.pattern, 0, 0, outer, inner);
  /** How far q lies from the line through `at` along `dir`. */
  const off = (q: Vec, at: Vec, dir: Vec) =>
    Math.abs((q.x - at.x) * dir.y - (q.y - at.y) * dir.x);

  it('is one pair of shapes for each crossing', () => {
    expect(shapes.length).toBe(crossings.length);
    expect(shapes.length).toBeGreaterThan(0);
  });

  it('spans the whole band underneath, edge to edge, and no further', () => {
    shapes.forEach((whole, k) => {
      const c = crossings[k]!;
      // Far apart, each crossing is one shape of each kind.
      expect(whole.edge.length).toBe(1);
      expect(whole.band.length).toBe(1);
      const shape = { edge: whole.edge[0]!, band: whole.band[0]! };
      const sin = Math.abs(c.over.x * c.under.y - c.over.y * c.under.x);
      const spare = (k: number) => outer * k * sin;
      for (const q of shape.edge) {
        // Its sides are the top band's outer edges…
        expect(off(q, c.at, c.over)).toBeCloseTo(outer / 2, 9);
        // …and its ends the outer edges of the band underneath, with a
        // hair to spare, however near the next crossing is.
        expect(off(q, c.at, c.under)).toBeCloseTo(
          outer / 2 + spare(PAST_EDGE),
          9,
        );
      }
      for (const q of shape.band) {
        expect(off(q, c.at, c.over)).toBeCloseTo(inner / 2, 9);
        expect(off(q, c.at, c.under)).toBeCloseTo(
          outer / 2 + spare(PAST_BAND),
          9,
        );
      }
    });
  });
});

describe('crossings closer than a band width', () => {
  // Comares west dado at band width 1: most crossings crowd.
  const model = loadModel(dado);
  const xs = model.pattern.cell.corners.map((p) => p.x);
  const outer = 0.012 * ((Math.max(...xs) - Math.min(...xs)) / 2) * 4;
  const shapes = overlapsAt(model.pattern, 0, 0, outer, outer * 0.6);
  const crossings = weaveOf(model.pattern).crossings;
  const inside = (q: Vec, ps: readonly Vec[]) =>
    ps.every((p, k) => {
      const r = ps[(k + 1) % ps.length]!;
      return (r.x - p.x) * (q.y - p.y) - (r.y - p.y) * (q.x - p.x) > 1e-9;
    });

  it("each keep their own crossing, edges and middle, and no one else's", () => {
    let split = 0;
    shapes.forEach((shape, k) => {
      if (shape.edge.length > 1) split++;
      const at = crossings[k]!.at;
      expect(shape.edge.some((ps) => inside(at, ps))).toBe(true);
      expect(shape.band.some((ps) => inside(at, ps))).toBe(true);
      shapes.forEach((other, l) => {
        if (l !== k)
          expect(other.edge.some((ps) => inside(at, ps))).toBe(false);
      });
    });
    expect(split).toBeGreaterThan(0);
  });
});

describe('the band width that fits the crossings', () => {
  const edgeOf = (model: ReturnType<typeof loadModel>) => {
    const xs = model.pattern.cell.corners.map((p) => p.x);
    return 0.012 * ((Math.max(...xs) - Math.min(...xs)) / 2) * 4;
  };

  it('leaves a pattern with room as it is', () => {
    const model = loadModel(example);
    expect(bandFit(model.pattern, edgeOf(model))).toBe(1);
  });

  it('thins the bands where crossings crowd, so they sit apart', () => {
    const model = loadModel(dado);
    const edge = edgeOf(model);
    const fit = bandFit(model.pattern, edge);
    expect(fit).toBeLessThan(0.7);
    expect(fit).toBeGreaterThan(0.4);
    // Nineteen crossings in twenty have CROSSING_ROOM band widths to the
    // nearest other.
    const w = weaveOf(model.pattern);
    const near = w.crossings.map((a) =>
      Math.min(
        ...w.crossings
          .filter((b) => b !== a)
          .map((b) => Math.hypot(b.at.x - a.at.x, b.at.y - a.at.y)),
      ),
    );
    const roomy = near.filter((d) => d >= CROSSING_ROOM * edge * fit - 1e-9);
    expect(roomy.length / near.length).toBeGreaterThanOrEqual(0.95);
  });
});
