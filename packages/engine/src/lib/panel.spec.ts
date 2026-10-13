import type { Tutorial } from '@tastir/schema';
import { loadTutorial } from '../test/tutorials.js';
import { evaluate, TutorialError } from './evaluate.js';
import type { Panel } from './panel.js';
import { computePattern } from './pieces.js';

describe('the panel', () => {
  const tutorial = loadTutorial('bou-inania-rosette.json');
  const pattern = computePattern(evaluate(tutorial), tutorial);
  const panel = pattern.panel as Panel;

  it('is the tile itself, centred on the rosette', () => {
    expect(panel.corners).toEqual(pattern.cell.corners);
    const xs = panel.corners.map((p) => p.x);
    const ys = panel.corners.map((p) => p.y);
    const o = evaluate(tutorial).elements.get('O')?.geometry;
    expect(o?.kind).toBe('point');
    if (o?.kind !== 'point') return;
    expect((Math.min(...xs) + Math.max(...xs)) / 2).toBeCloseTo(o.at.x, 9);
    expect((Math.min(...ys) + Math.max(...ys)) / 2).toBeCloseTo(o.at.y, 9);
  });

  it('holds its ink inside, as single strokes along each line', () => {
    const xs = panel.corners.map((p) => p.x);
    const ys = panel.corners.map((p) => p.y);
    const eps = 1e-6;
    for (const { segment: s } of panel.ink)
      for (const p of [s.a, s.b]) {
        expect(p.x).toBeGreaterThanOrEqual(Math.min(...xs) - eps);
        expect(p.x).toBeLessThanOrEqual(Math.max(...xs) + eps);
        expect(p.y).toBeGreaterThanOrEqual(Math.min(...ys) - eps);
        expect(p.y).toBeLessThanOrEqual(Math.max(...ys) + eps);
      }
    // Pieces running straight on are joined: fewer, longer strokes.
    expect(panel.ink.length).toBeLessThan(pattern.ink.length);
  });

  it('looks the same turned a quarter: half a band on every side', () => {
    const xs = panel.corners.map((p) => p.x);
    const ys = panel.corners.map((p) => p.y);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    // Within half a percent of the tile: where a strap crosses the band,
    // the tutorial's line and its continuation from the next copy are
    // two construction lines 0.006 apart, too close to see.
    const near = 0.005 * (Math.max(...xs) - Math.min(...xs));
    const on = (p: { x: number; y: number }) =>
      panel.ink.some(({ segment: { a, b } }) => {
        const d = { x: b.x - a.x, y: b.y - a.y };
        const t = Math.max(
          0,
          Math.min(
            1,
            ((p.x - a.x) * d.x + (p.y - a.y) * d.y) / (d.x ** 2 + d.y ** 2),
          ),
        );
        return Math.hypot(a.x + t * d.x - p.x, a.y + t * d.y - p.y) < near;
      });
    const lost = panel.ink.filter(({ segment: { a, b } }) => {
      const mid = { x: (a.x + b.x) / 2 - cx, y: (a.y + b.y) / 2 - cy };
      return !on({ x: cx - mid.y, y: cy + mid.x });
    });
    expect(lost).toEqual([]);
  });

  it('must hold the whole tile', () => {
    // The tile holds itself; a smaller figure does not hold the tile.
    const small = structuredClone(tutorial) as Tutorial;
    const step = small.steps.find(
      (s) => s.id === 14,
    ) as (typeof small.steps)[number];
    (step.create as Record<string, unknown>)['panel'] = {
      polygon: ['Sa', 'Sb', 'Sc'],
    };
    small.pattern = { ...small.pattern, panel: 'panel' };
    expect(() => computePattern(evaluate(small), small)).toThrow(TutorialError);
  });
});
