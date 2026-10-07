import type { Tutorial } from '@tastir/schema';
import { loadTutorial } from '../test/tutorials.js';
import { evaluate, TutorialError } from './evaluate.js';
import type { Panel } from './panel.js';
import { computePattern } from './pieces.js';

describe('the panel', () => {
  const tutorial = loadTutorial('bou-inania-rosette.json');
  const pattern = computePattern(evaluate(tutorial), tutorial);
  const panel = pattern.panel as Panel;

  it('is the frame’s square: the tile and one more band on its right and top', () => {
    const xs = panel.corners.map((p) => p.x);
    const ys = panel.corners.map((p) => p.y);
    const side = Math.max(...xs) - Math.min(...xs);
    expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo(side, 9);
    const tile = Math.abs(pattern.cell.u.x);
    expect(side).toBeGreaterThan(tile);
    expect(side - tile).toBeLessThan(0.2 * tile); // one band
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

  it('carries every stroke of the tile', () => {
    const on = (p: { x: number; y: number }) =>
      panel.ink.some(({ segment: { a, b } }) => {
        const ab = Math.hypot(b.x - a.x, b.y - a.y);
        const ap = Math.hypot(p.x - a.x, p.y - a.y);
        const pb = Math.hypot(b.x - p.x, b.y - p.y);
        return ap + pb - ab < 1e-9;
      });
    const lost = pattern.ink.filter(({ segment: { a, b } }) => {
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      return !on(mid);
    });
    expect(lost).toEqual([]);
  });

  it('must hold the whole tile', () => {
    const broken = {
      ...tutorial,
      pattern: { ...tutorial.pattern, panel: 'tile' },
    } as Tutorial;
    // The tile holds itself; a smaller square does not hold the tile.
    expect(() => computePattern(evaluate(broken), broken)).not.toThrow();
    const small = structuredClone(tutorial) as Tutorial;
    const step = small.steps.find(
      (s) => s.id === 14,
    ) as (typeof small.steps)[number];
    (step.create as Record<string, unknown>)['panel'] = {
      polygon: ['K21', 'K16', 'M1460', 'PN3'],
    };
    expect(() => computePattern(evaluate(small), small)).toThrow(TutorialError);
  });
});
