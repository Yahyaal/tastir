import type { InkAlong, InkEnd, Tutorial } from '@tastir/schema';
import {
  crossingOf,
  distanceToSegment,
  TutorialError,
  type Scene,
} from './evaluate.js';
import { project, segment, type Segment } from './shapes.js';
import { distance, sub, type Vec } from './vec.js';

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
    if ('along' in path) {
      strokes.push(alongStroke(scene, path, fail));
      return;
    }
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
 * An ink path along one line or polygon side, from where it meets one
 * element to where it meets another. It must run along the element it
 * names: on the line, or within one side of the polygon.
 */
function alongStroke(
  scene: Scene,
  path: InkAlong,
  fail: (reason: string) => never,
): InkStroke {
  const { eps } = scene.tol;
  const along = scene.elements.get(path.along)?.geometry;
  if (!along) return fail(`"${path.along}" does not exist`);
  if (along.kind !== 'line' && along.kind !== 'polygon')
    return fail(`ink runs along a line or a polygon, not "${path.along}"`);
  const end = (e: InkEnd): { name: string; at: Vec } => {
    if (typeof e === 'string') {
      const g = scene.elements.get(e)?.geometry;
      if (g?.kind === 'point') return { name: e, at: g.at };
    }
    const cross = typeof e === 'string' ? e : e.cross;
    const pick = typeof e === 'string' ? undefined : e.pick;
    return {
      name: `${path.along}×${cross}`,
      at: crossingOf(scene, [path.along, cross], pick, fail),
    };
  };
  const from = end(path.from);
  const to = end(path.to);
  const { at: a } = from;
  const { at: b } = to;
  if (distance(a, b) <= eps)
    fail(`its two ends are the same point (${from.name} and ${to.name})`);
  if (along.kind === 'line') {
    for (const { name, at } of [from, to]) {
      if (distance(at, project(at, along.line)) > eps)
        fail(`"${name}" is not on "${path.along}"`);
    }
  } else if (
    !along.sides.some(
      (s) => distanceToSegment(a, s) <= eps && distanceToSegment(b, s) <= eps,
    )
  ) {
    fail(
      `"${from.name}" and "${to.name}" are not on one side of "${path.along}"`,
    );
  }
  return { from: from.name, to: to.name, segment: segment(a, b) };
}

/** Directions are compared in buckets of this many radians. */
const DIRECTION_BUCKET = 1e-3;
const BUCKETS = Math.round(Math.PI / DIRECTION_BUCKET);
const bucketOf = (d: Vec) => {
  const angle = Math.atan2(d.y, d.x);
  return (
    ((Math.round((angle < 0 ? angle + Math.PI : angle) / DIRECTION_BUCKET) %
      BUCKETS) +
      BUCKETS) %
    BUCKETS
  );
};

/**
 * For each line and polygon that carries ink, the strokes along it. A
 * stroke can only lie along a line that runs the same way, so strokes are
 * sorted by direction first and each line is checked against its own.
 */
function strokesAlong(
  scene: Scene,
  strokes: readonly InkStroke[],
): Map<string, number[]> {
  const { eps } = scene.tol;
  const byDirection = new Map<number, number[]>();
  strokes.forEach((s, i) => {
    const k = bucketOf(sub(s.segment.b, s.segment.a));
    byDirection.set(k, [...(byDirection.get(k) ?? []), i]);
  });
  const near = (d: Vec) => {
    const k = bucketOf(d);
    return [k - 1, k, k + 1].flatMap(
      (j) => byDirection.get((j + BUCKETS) % BUCKETS) ?? [],
    );
  };
  const onLine = (p: Vec, line: { point: Vec; dir: Vec }) =>
    distance(p, project(p, { kind: 'line', ...line })) <= eps;
  const along = new Map<string, number[]>();
  for (const el of scene.elements.values()) {
    const g = el.geometry;
    const found = new Set<number>();
    if (g.kind === 'line') {
      for (const i of near(g.line.dir)) {
        const { a, b } = (strokes[i] as InkStroke).segment;
        if (onLine(a, g.line) && onLine(b, g.line)) found.add(i);
      }
    } else if (g.kind === 'polygon') {
      for (const side of g.sides) {
        for (const i of near(sub(side.b, side.a))) {
          const { a, b } = (strokes[i] as InkStroke).segment;
          if (
            distanceToSegment(a, side) <= eps &&
            distanceToSegment(b, side) <= eps
          )
            found.add(i);
        }
      }
    }
    if (found.size) along.set(el.name, [...found]);
  }
  return along;
}

/**
 * The names of the lines and polygons that carry some of the ink. The
 * others only help to find points, so the player draws them as helpers.
 */
export function inkCarriers(
  scene: Scene,
  strokes: readonly InkStroke[],
): Set<string> {
  return new Set(strokesAlong(scene, strokes).keys());
}

/**
 * For each stroke, the earliest beat (a step, or a part of one; see
 * SceneElement.beat) at which a learner can ink it. The
 * strokes along one line between two turns form a run, and a run can be
 * inked once its line exists and so do the lines it turns onto at both
 * ends; inking it any sooner would leave loose dashes whose ends mean
 * nothing yet.
 */
export function inkBeats(
  scene: Scene,
  strokes: readonly InkStroke[],
): number[] {
  // The line (or polygon) each stroke lies along: the earliest made.
  const support: { name: string; beat: number }[] = strokes.map((s) => ({
    name: `stroke ${s.from}–${s.to}`,
    beat: 0,
  }));
  const found = strokes.map(() => false);
  for (const [name, list] of strokesAlong(scene, strokes)) {
    const beat = scene.elements.get(name)?.beat ?? 0;
    for (const i of list) {
      if (!found[i] || beat < (support[i] as { beat: number }).beat) {
        support[i] = { name, beat };
        found[i] = true;
      }
    }
  }
  // Which supports have ink touching each end point.
  const key = (p: Vec) => `${p.x.toFixed(6)},${p.y.toFixed(6)}`;
  const touching = new Map<string, Map<string, number>>();
  strokes.forEach((s, i) => {
    for (const p of [s.segment.a, s.segment.b]) {
      const k = key(p);
      const here = touching.get(k) ?? new Map<string, number>();
      here.set(support[i]?.name ?? '', support[i]?.beat ?? 0);
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
    const own = support[i] as { name: string; beat: number };
    let step = Math.max(runStep.get(root) ?? 0, own.beat);
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
