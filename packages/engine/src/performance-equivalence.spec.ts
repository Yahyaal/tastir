/** Frozen implementations keep optimizations honest across the whole library. */
import { arrangement } from './lib/arrangement.js';
import { arrangement as referenceArrangement } from './test/reference/arrangement.js';
import { segment } from './lib/shapes.js';
import { evaluate } from './lib/evaluate.js';
import { inkPieces, classicSelection, strokesOf } from './lib/freeInk.js';
import { computePattern, cellOf } from './lib/pieces.js';
import { goldenOf } from './lib/golden.js';
import { inkPieces as referenceInkPieces } from './test/reference/freeInk.js';
import { computePattern as referencePattern } from './test/reference/pieces.js';
import { loadTutorial, tutorialFiles } from './test/tutorials.js';

function identical(actual: unknown, expected: unknown, path = 'result'): void {
  if (typeof actual === 'number' && typeof expected === 'number') {
    if (Math.abs(actual - expected) > 1e-9 || !Number.isFinite(actual))
      throw new Error(`${path}: ${actual} differs from ${expected}`);
  } else if (Array.isArray(actual) && Array.isArray(expected)) {
    expect(actual.length, path).toBe(expected.length);
    for (let i = 0; i < actual.length; i++)
      identical(actual[i], expected[i], `${path}[${i}]`);
  } else if (
    actual &&
    expected &&
    typeof actual === 'object' &&
    typeof expected === 'object'
  ) {
    expect(Object.keys(actual), path).toEqual(Object.keys(expected));
    for (const key of Object.keys(expected))
      identical(
        (actual as Record<string, unknown>)[key],
        (expected as Record<string, unknown>)[key],
        `${path}.${key}`,
      );
  } else if (actual !== expected) throw new Error(`${path}: values differ`);
}

for (const file of tutorialFiles()) {
  it(`${file}: keeps every ink id, endpoint, piece and golden value`, () => {
    const t = loadTutorial(file);
    // The frozen implementation predates full-outline grouping. Compare its
    // legacy mode for every tutorial; pieces.spec and goldens cover the opt-in.
    if (t.pattern.distinguishOutlines) t.pattern.distinguishOutlines = false;
    const scene = evaluate(t);
    const cell = cellOf(scene, t.pattern.cell);
    const own = referencePattern(scene, t);
    for (const allEdges of [true, false]) {
      const before = referenceInkPieces(scene, cell, { allEdges });
      const after = inkPieces(scene, cell, { allEdges });
      identical(after, before, `bits (allEdges=${allEdges})`);
      if (!allEdges) continue;
      const selection = classicSelection(
        before,
        own.panel?.ink ?? own.ink,
        1e-7,
        cell,
      );
      const ink = strokesOf(before, selection);
      const ref = referencePattern(scene, t, ink);
      const optimized = computePattern(scene, t, strokesOf(after, selection));
      identical(optimized, ref, 'pattern from bits');
      expect(goldenOf(t, scene, optimized)).toEqual(goldenOf(t, scene, ref));
    }
    const optimized = computePattern(scene, t);
    identical(optimized, own, 'tutorial pattern');
    expect(goldenOf(t, scene, optimized)).toEqual(goldenOf(t, scene, own));
  }, 120_000);
}

it('keeps face traversal and tolerant junctions on irregular segment networks', () => {
  const tol = { eps: 1e-9 };
  const point = (n: number) => ({
    x: ((n * 31) % 101) / 13,
    y: ((n * 71) % 97) / 17,
  });
  const irregular = Array.from({ length: 140 }, (_, i) =>
    segment(point(i), point(i + 27)),
  );
  const square = [
    segment({ x: 0, y: 0 }, { x: 1, y: 0 }),
    segment({ x: 1, y: 0 }, { x: 1, y: 1 }),
    segment({ x: 1, y: 1 }, { x: 0, y: 1 }),
    segment({ x: 0, y: 1 }, { x: 0, y: 0 }),
  ];
  for (const gap of [-2, -0.5, 0, 0.5, 2]) {
    const network = [
      ...square,
      segment({ x: 0.5, y: gap * tol.eps }, { x: 0.5, y: 1 - gap * tol.eps }),
      segment({ x: 0.25, y: 0 }, { x: 0.75, y: 0 }),
    ];
    identical(arrangement(network, tol), referenceArrangement(network, tol));
  }
  identical(arrangement(irregular, tol), referenceArrangement(irregular, tol));
  // Coordinates one 32-bit hash period apart must remain distinct vertices.
  const collisions = [0, 2 ** 32 * tol.eps, -(2 ** 32) * tol.eps].flatMap(
    (dx) =>
      square.map((s) =>
        segment({ x: s.a.x + dx, y: s.a.y }, { x: s.b.x + dx, y: s.b.y }),
      ),
  );
  identical(
    arrangement(collisions, tol),
    referenceArrangement(collisions, tol),
  );
});
