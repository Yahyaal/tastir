// Performance targets from the PRD: evaluate a 40-step tutorial in under
// 50 ms, and find the pieces of about 3,000 segments in under 300 ms.
import type { Tutorial } from '@tastir/schema';
import { arrangement } from './lib/arrangement.js';
import { constructionCrossings } from './lib/checks.js';
import { evaluate } from './lib/evaluate.js';
import { classicSelection, inkPieces, strokesOf } from './lib/freeInk.js';
import { computePattern } from './lib/pieces.js';
import { segment, type Segment } from './lib/shapes.js';
import { loadTutorial, starAndCross } from './test/tutorials.js';

for (const id of ['bou-inania-rosette', 'bou-inania-twelve-fold-wall']) {
  it(`${id}: prepares ink and finds its pieces in under 300 ms each`, () => {
    const t = loadTutorial(`${id}.json`);
    const scene = evaluate(t);
    const own = computePattern(scene, t);
    const bits = inkPieces(scene, own.cell, { allEdges: true });
    const chosen = classicSelection(
      bits,
      own.panel?.ink ?? own.ink,
      1e-7,
      own.cell,
    );
    const strokes = strokesOf(bits, chosen);
    const inkMs = fastest(() => {
      inkPieces(scene, own.cell, { allEdges: true });
    });
    const patternMs = fastest(() => {
      computePattern(scene, t, strokes);
    });
    console.log(
      `${id}: ink ${inkMs.toFixed(1)} ms; pieces ${patternMs.toFixed(1)} ms`,
    );
    expect(inkMs).toBeLessThan(300);
    expect(patternMs).toBeLessThan(300);
  });
  it(`${id}: finds construction crossings in under one second`, () => {
    const scene = evaluate(loadTutorial(`${id}.json`));
    const ms = fastest(() => {
      constructionCrossings(scene);
    }, 3);
    console.log(`${id}: crossings ${ms.toFixed(1)} ms`);
    expect(ms).toBeLessThan(1000);
  });
}

/** The fastest of a few runs, in milliseconds, after a warm-up. */
function fastest(run: () => void, times = 5): number {
  run();
  let best = Infinity;
  for (let i = 0; i < times; i++) {
    const start = performance.now();
    run();
    best = Math.min(best, performance.now() - start);
  }
  return best;
}

it('evaluates a 40-step tutorial in under 50 ms', () => {
  const t: Tutorial = structuredClone(starAndCross());
  // 34 more steps: a circle on each crossing, then lines joining them.
  for (let i = 0; i < 34; i++) {
    const id = t.steps.length + 1;
    const k = (i % 8) + 1;
    const create =
      i < 8
        ? { [`r${i}`]: { circle: { centre: `k.${k}`, through: 'O' } } }
        : {
            [`j${i}`]: {
              line: {
                through: [`k.${k}`, `k.${((k + (i % 7)) % 8) + 1}`] as [
                  string,
                  string,
                ],
              },
            },
          };
    t.steps.push({ id, text: 'More.', create } as Tutorial['steps'][number]);
  }
  expect(t.steps).toHaveLength(40);
  const ms = fastest(() => evaluate(t));
  console.log(`40-step evaluation: ${ms.toFixed(1)} ms`);
  expect(ms).toBeLessThan(50);
});

it('finds the pieces of about 3,000 segments in under 300 ms', () => {
  const t = loadTutorial('eight-fold-zellige.json');
  const scene = evaluate(t);
  const { cell, ink } = computePattern(scene, t);
  const segments: Segment[] = [];
  for (let i = -4; i <= 4; i++) {
    for (let j = -4; j <= 4; j++) {
      const dx = cell.u.x * i + cell.v.x * j;
      const dy = cell.u.y * i + cell.v.y * j;
      for (const { segment: s } of ink) {
        segments.push(
          segment(
            { x: s.a.x + dx, y: s.a.y + dy },
            { x: s.b.x + dx, y: s.b.y + dy },
          ),
        );
      }
    }
  }
  expect(segments.length).toBeGreaterThan(2900);
  let faces = 0;
  const ms = fastest(() => {
    faces = arrangement(segments, scene.tol).length;
  }, 3);
  console.log(
    `${segments.length} segments, ${faces} faces: ${ms.toFixed(1)} ms`,
  );
  expect(ms).toBeLessThan(300);
});
