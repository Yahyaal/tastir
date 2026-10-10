import { distance, type InkPiece, type Scene, type Vec } from '@tastir/engine';
import { shapeName } from './finish';
/**
 * A shape of a step in plain words, told apart from the step's other
 * shapes by kind and size: “the larger square”, “the hexagon”.
 */
export function shapeWords(
  scene: Scene,
  create: Readonly<Record<string, unknown>>,
  name: string,
): string {
  const shapes = Object.keys(create).flatMap((n) => {
    const g = scene.elements.get(n)?.geometry;
    return g?.kind === 'polygon'
      ? [{ n, kind: shapeName(g.vertices), size: areaOf(g.vertices) }]
      : [];
  });
  const me = shapes.find((x) => x.n === name);
  if (!me) return 'this shape';
  const alike = shapes.filter((x) => x.kind === me.kind);
  if (alike.length === 1) return `the ${me.kind}`;
  const rank = alike.sort((a, b) => b.size - a.size).indexOf(me);
  const word =
    alike.length === 2
      ? ['larger', 'smaller'][rank]
      : `${['first', 'second', 'third', 'fourth'][rank] ?? 'next'} largest`;
  return `the ${word} ${me.kind}`;
}

const areaOf = (vs: readonly Vec[]) =>
  Math.abs(
    vs.reduce((s, a, i) => {
      const b = vs[(i + 1) % vs.length] as Vec;
      return s + a.x * b.y - a.y * b.x;
    }, 0) / 2,
  );

/** The bit of line nearest a click, within reach. */
export function nearestPiece(
  pieces: readonly InkPiece[],
  at: Vec,
  reach: number,
): string | undefined {
  let best: { id: string; d: number } | undefined;
  for (const p of pieces) {
    const { a, b } = p.segment;
    const d = { x: b.x - a.x, y: b.y - a.y };
    const t = Math.max(
      0,
      Math.min(
        1,
        ((at.x - a.x) * d.x + (at.y - a.y) * d.y) / (d.x * d.x + d.y * d.y),
      ),
    );
    const gap = distance(at, { x: a.x + d.x * t, y: a.y + d.y * t });
    if (gap <= reach && (!best || gap < best.d)) best = { id: p.id, d: gap };
  }
  return best?.id;
}
