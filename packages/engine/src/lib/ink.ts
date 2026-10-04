import type { Tutorial } from '@tastir/schema';
import { distanceToSegment, TutorialError, type Scene } from './evaluate.js';
import { project, segment, type Segment } from './shapes.js';
import { distance, type Vec } from './vec.js';

export interface InkStroke {
  /** The named points at its two ends. */
  readonly from: string;
  readonly to: string;
  readonly segment: Segment;
}

/**
 * The tutorial's ink as straight strokes between named points. Each stroke
 * must lie along a line or a polygon side the construction drew, so the
 * ink can never add a line the construction did not make.
 */
export function inkStrokes(scene: Scene, tutorial: Tutorial): InkStroke[] {
  const { eps } = scene.tol;
  const strokes: InkStroke[] = [];
  tutorial.ink.paths.forEach((path, pi) => {
    const element = `path ${pi + 1}`;
    const fail = (reason: string): never => {
      throw new TutorialError('ink', element, reason);
    };
    const point = (name: string): Vec => {
      const g = scene.elements.get(name)?.geometry;
      if (!g) return fail(`"${name}" does not exist`);
      return g.kind === 'point' ? g.at : fail(`"${name}" is not a point`);
    };
    const names = path.closed
      ? [...path.through, path.through[0] as string]
      : path.through;
    for (let i = 0; i + 1 < names.length; i++) {
      const from = names[i] as string;
      const to = names[i + 1] as string;
      const a = point(from);
      const b = point(to);
      if (distance(a, b) <= eps)
        fail(`"${from}" and "${to}" are the same point`);
      const onLine = (p: Vec, g: { point: Vec; dir: Vec }) =>
        distance(p, project(p, { kind: 'line', ...g })) <= eps;
      let carried = false;
      let sharedCircle = false;
      for (const el of scene.elements.values()) {
        const g = el.geometry;
        if (g.kind === 'line' && onLine(a, g.line) && onLine(b, g.line))
          carried = true;
        if (
          g.kind === 'polygon' &&
          g.sides.some(
            (s) =>
              distanceToSegment(a, s) <= eps && distanceToSegment(b, s) <= eps,
          )
        ) {
          carried = true;
        }
        if (g.kind === 'circle') {
          const on = (p: Vec) =>
            Math.abs(distance(p, g.circle.centre) - g.circle.radius) <= eps;
          if (on(a) && on(b)) sharedCircle = true;
        }
        if (carried) break;
      }
      if (!carried) {
        fail(
          sharedCircle
            ? `"${from}" and "${to}" share only a circle, and curved ink is not in format v0`
            : `no line or polygon side of the construction runs from "${from}" to "${to}"`,
        );
      }
      strokes.push({ from, to, segment: segment(a, b) });
    }
  });
  return strokes;
}
