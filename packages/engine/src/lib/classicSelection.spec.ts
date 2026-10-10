import { classicSelection, type InkPiece } from './freeInk.js';
import type { InkStroke } from './ink.js';
import { segment, type Segment } from './shapes.js';
import type { Vec } from './vec.js';

// An independent exhaustive reference: the index may exclude distant
// strokes, but must keep exactly the old endpoint/tolerance semantics.
const on = (p: Vec, s: Segment, eps: number) => {
  const dx = s.b.x - s.a.x;
  const dy = s.b.y - s.a.y;
  const t = ((p.x - s.a.x) * dx + (p.y - s.a.y) * dy) / (dx * dx + dy * dy);
  return (
    t >= -eps &&
    t <= 1 + eps &&
    Math.hypot(p.x - s.a.x - t * dx, p.y - s.a.y - t * dy) <= 10 * eps
  );
};

it('indexed selection agrees with exhaustive containment at crossings, ends and tolerance boundaries', () => {
  let seed = 42;
  const random = () =>
    (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32;
  const ink: InkStroke[] = Array.from({ length: 160 }, (_, i) => ({
    from: '',
    to: '',
    segment: segment(
      { x: random() * 8 - 4, y: random() * 8 - 4 },
      { x: i % 3 ? random() * 8 - 4 : 0, y: i % 3 ? random() * 8 - 4 : 0 },
    ),
  }));
  const eps = 1e-7;
  const pieces: InkPiece[] = ink.flatMap(({ segment: s }, i) =>
    [-11, -9, 0, 9, 11].map((offset, j) => ({
      id: `${i}:${j}`,
      segment: segment(
        { x: s.a.x + offset * eps, y: s.a.y },
        { x: (s.a.x + s.b.x) / 2 + offset * eps, y: (s.a.y + s.b.y) / 2 },
      ),
    })),
  );
  for (const scale of [0.001, 1, 1000]) {
    const move = (s: Segment) =>
      segment(
        { x: s.a.x * scale, y: s.a.y * scale },
        { x: s.b.x * scale, y: s.b.y * scale },
      );
    const strokes = ink.map((s) => ({ ...s, segment: move(s.segment) }));
    const bits = pieces.map((p) => ({ ...p, segment: move(p.segment) }));
    const expected = new Set(
      bits
        .filter(({ segment: p }) =>
          strokes.some(({ segment: s }) => on(p.a, s, eps) && on(p.b, s, eps)),
        )
        .map((p) => p.id),
    );
    expect(classicSelection(bits, strokes, eps)).toEqual(expected);
  }
});

it('empty ink and zero-length strokes select nothing', () => {
  const s = segment({ x: 0, y: 0 }, { x: 0, y: 0 });
  expect(
    classicSelection(
      [{ id: 'zero', segment: s }],
      [{ from: '', to: '', segment: s }],
      1e-7,
    ),
  ).toEqual(new Set());
  expect(classicSelection([], [], 1e-7)).toEqual(new Set());
});
