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

/**
 * The names of the lines and polygons that carry some of the ink. The
 * others only help to find points, so the player draws them as helpers.
 */
export function inkCarriers(
  scene: Scene,
  strokes: readonly InkStroke[],
): Set<string> {
  const { eps } = scene.tol;
  const carriers = new Set<string>();
  const onLine = (p: Vec, line: { point: Vec; dir: Vec }) =>
    distance(p, project(p, { kind: 'line', ...line })) <= eps;
  for (const el of scene.elements.values()) {
    const g = el.geometry;
    const carries = (s: Segment) =>
      g.kind === 'line'
        ? onLine(s.a, g.line) && onLine(s.b, g.line)
        : g.kind === 'polygon' &&
          g.sides.some(
            (side) =>
              distanceToSegment(s.a, side) <= eps &&
              distanceToSegment(s.b, side) <= eps,
          );
    if (strokes.some((s) => carries(s.segment))) carriers.add(el.name);
  }
  return carriers;
}

/**
 * For each stroke, the earliest step at which a learner can ink it. The
 * strokes along one line between two turns form a run, and a run can be
 * inked once its line exists and so do the lines it turns onto at both
 * ends; inking it any sooner would leave loose dashes whose ends mean
 * nothing yet.
 */
export function inkSteps(
  scene: Scene,
  strokes: readonly InkStroke[],
): number[] {
  const { eps } = scene.tol;
  const carriers = inkCarriers(scene, strokes);
  const onLine = (p: Vec, line: { point: Vec; dir: Vec }) =>
    distance(p, project(p, { kind: 'line', ...line })) <= eps;
  // The line (or polygon) each stroke lies along: the earliest made.
  const support = strokes.map((s) => {
    let best: { name: string; step: number } | undefined;
    for (const name of carriers) {
      const el = scene.elements.get(name);
      const g = el?.geometry;
      if (!el || !g) continue;
      const on =
        g.kind === 'line'
          ? onLine(s.segment.a, g.line) && onLine(s.segment.b, g.line)
          : g.kind === 'polygon' &&
            g.sides.some(
              (side) =>
                distanceToSegment(s.segment.a, side) <= eps &&
                distanceToSegment(s.segment.b, side) <= eps,
            );
      if (on && (!best || el.step < best.step)) best = { name, step: el.step };
    }
    return best ?? { name: `stroke ${s.from}–${s.to}`, step: 0 };
  });
  // Which supports have ink touching each end point.
  const key = (p: Vec) => `${p.x.toFixed(6)},${p.y.toFixed(6)}`;
  const touching = new Map<string, Map<string, number>>();
  strokes.forEach((s, i) => {
    for (const p of [s.segment.a, s.segment.b]) {
      const k = key(p);
      const here = touching.get(k) ?? new Map<string, number>();
      here.set(support[i]?.name ?? '', support[i]?.step ?? 0);
      touching.set(k, here);
    }
  });
  // Join strokes that carry on straight along the same line.
  const parent = strokes.map((_, i) => i);
  const find = (i: number): number => {
    while (parent[i] !== i)
      i = parent[i] = parent[parent[i] as number] as number;
    return i;
  };
  const byEnd = new Map<string, number[]>();
  strokes.forEach((s, i) => {
    for (const p of [s.segment.a, s.segment.b]) {
      const k = `${support[i]?.name}|${key(p)}`;
      byEnd.set(k, [...(byEnd.get(k) ?? []), i]);
    }
  });
  for (const [k, list] of byEnd) {
    const point = k.slice(k.indexOf('|') + 1);
    if ((touching.get(point)?.size ?? 0) !== 1) continue;
    for (const j of list.slice(1)) parent[find(j)] = find(list[0] as number);
  }
  // A run's step: its line's, or later if a line it turns onto is later.
  const runStep = new Map<number, number>();
  strokes.forEach((s, i) => {
    const root = find(i);
    const own = support[i] as { name: string; step: number };
    let step = Math.max(runStep.get(root) ?? 0, own.step);
    for (const p of [s.segment.a, s.segment.b]) {
      const others = [...(touching.get(key(p)) ?? new Map<string, number>())]
        .filter(([name]) => name !== own.name)
        .map(([, st]) => st);
      if (others.length) step = Math.max(step, Math.min(...others));
    }
    runStep.set(root, step);
  });
  return strokes.map((_, i) => runStep.get(find(i)) ?? 0);
}
