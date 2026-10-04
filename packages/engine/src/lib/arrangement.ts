import { intersect, overlap } from './intersect.js';
import type { Segment } from './shapes.js';
import type { Tolerance } from './tolerance.js';
import { add, cross, dot, length, scale, sub, type Vec } from './vec.js';

// Ported from the prototype's arrangement(): split every segment at every
// crossing, merge the end points, drop dangling ends and walk the faces.

/**
 * The closed faces of a set of segments, each as its corners in
 * counter-clockwise order. The unbounded outer face is left out. A face
 * that encloses a separate component is returned without its hole.
 */
export function arrangement(
  segments: readonly Segment[],
  tol: Tolerance,
): Vec[][] {
  const cuts = segments.map(() => [0, 1]);
  const param = (s: Segment, p: Vec) => {
    const d = sub(s.b, s.a);
    return dot(sub(p, s.a), d) / dot(d, d);
  };

  for (const [i, j] of candidatePairs(segments)) {
    const a = segments[i] as Segment;
    const b = segments[j] as Segment;
    if (overlap(a, b, tol)) {
      // Edges lying along each other (tiles touching along an edge) never
      // cross, so cut each one where the other ends.
      for (const p of [b.a, b.b]) (cuts[i] as number[]).push(param(a, p));
      for (const p of [a.a, a.b]) (cuts[j] as number[]).push(param(b, p));
      continue;
    }
    for (const p of intersect(a, b, tol)) {
      (cuts[i] as number[]).push(param(a, p));
      (cuts[j] as number[]).push(param(b, p));
    }
  }

  const vertices = new VertexIndex(tol);
  const adjacency = new Map<number, Set<number>>();
  const link = (u: number, v: number) => {
    if (u === v) return;
    (adjacency.get(u) ?? adjacency.set(u, new Set()).get(u))?.add(v);
    (adjacency.get(v) ?? adjacency.set(v, new Set()).get(v))?.add(u);
  };
  segments.forEach((s, i) => {
    const ts = [
      ...new Set((cuts[i] as number[]).map((t) => Math.min(1, Math.max(0, t)))),
    ].sort((x, y) => x - y);
    const d = sub(s.b, s.a);
    const ids = ts.map((t) => vertices.id(add(s.a, scale(d, t))));
    for (let k = 0; k + 1 < ids.length; k++)
      link(ids[k] as number, ids[k + 1] as number);
  });

  pruneDanglingEnds(adjacency);
  return walkFaces(adjacency, vertices.points, tol);
}

/** Index pairs of segments whose bounding boxes share a grid cell. */
function candidatePairs(segments: readonly Segment[]): [number, number][] {
  if (segments.length === 0) return [];
  const mean =
    segments.reduce((sum, s) => sum + length(sub(s.b, s.a)), 0) /
    segments.length;
  const size = mean > 0 ? mean : 1;
  const grid = new Map<string, number[]>();
  segments.forEach((s, i) => {
    const [x0, x1] = [Math.min(s.a.x, s.b.x), Math.max(s.a.x, s.b.x)].map((x) =>
      Math.floor(x / size),
    );
    const [y0, y1] = [Math.min(s.a.y, s.b.y), Math.max(s.a.y, s.b.y)].map((y) =>
      Math.floor(y / size),
    );
    for (let gx = (x0 as number) - 1; gx <= (x1 as number) + 1; gx++) {
      for (let gy = (y0 as number) - 1; gy <= (y1 as number) + 1; gy++) {
        const key = `${gx},${gy}`;
        (grid.get(key) ?? grid.set(key, []).get(key))?.push(i);
      }
    }
  });
  const seen = new Set<number>();
  const pairs: [number, number][] = [];
  const n = segments.length;
  for (const list of grid.values()) {
    for (let x = 0; x < list.length; x++) {
      for (let y = x + 1; y < list.length; y++) {
        const i = list[x] as number;
        const j = list[y] as number;
        const key = i * n + j;
        if (seen.has(key)) continue;
        seen.add(key);
        pairs.push([i, j]);
      }
    }
  }
  return pairs;
}

/** Gives points closer than the tolerance one shared id. */
class VertexIndex {
  readonly points: Vec[] = [];
  private readonly buckets = new Map<string, number[]>();

  constructor(private readonly tol: Tolerance) {}

  id(p: Vec): number {
    const bx = Math.floor(p.x / this.tol.eps);
    const by = Math.floor(p.y / this.tol.eps);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (const id of this.buckets.get(`${bx + dx},${by + dy}`) ?? []) {
          const q = this.points[id] as Vec;
          if (Math.hypot(p.x - q.x, p.y - q.y) <= this.tol.eps) return id;
        }
      }
    }
    const id = this.points.length;
    this.points.push(p);
    const key = `${bx},${by}`;
    (this.buckets.get(key) ?? this.buckets.set(key, []).get(key))?.push(id);
    return id;
  }
}

/** Removes every vertex with one neighbour, repeatedly, so no stubs remain. */
function pruneDanglingEnds(adjacency: Map<number, Set<number>>) {
  const queue = [...adjacency.keys()].filter(
    (u) => (adjacency.get(u)?.size ?? 0) <= 1,
  );
  while (queue.length) {
    const u = queue.pop() as number;
    const nbrs = adjacency.get(u);
    if (!nbrs || nbrs.size > 1) continue;
    adjacency.delete(u);
    for (const v of nbrs) {
      const rest = adjacency.get(v);
      rest?.delete(u);
      if (rest && rest.size <= 1) queue.push(v);
    }
  }
}

/** Traces every face with the face on the left; keeps the bounded ones. */
function walkFaces(
  adjacency: Map<number, Set<number>>,
  points: readonly Vec[],
  tol: Tolerance,
): Vec[][] {
  const at = (i: number) => points[i] as Vec;
  const sorted = new Map<number, number[]>();
  for (const [u, nbrs] of adjacency) {
    const o = at(u);
    sorted.set(
      u,
      [...nbrs].sort(
        (p, q) =>
          Math.atan2(at(p).y - o.y, at(p).x - o.x) -
          Math.atan2(at(q).y - o.y, at(q).x - o.x),
      ),
    );
  }
  const used = new Set<string>();
  const faces: Vec[][] = [];
  for (const [u0, nbrs] of sorted) {
    for (const v0 of nbrs) {
      if (used.has(`${u0}>${v0}`)) continue;
      const cycle: number[] = [];
      let u = u0;
      let v = v0;
      while (!used.has(`${u}>${v}`)) {
        used.add(`${u}>${v}`);
        cycle.push(u);
        // Leave v by the edge just clockwise of the one we arrived on.
        const around = sorted.get(v) as number[];
        const w = around[
          (around.indexOf(u) - 1 + around.length) % around.length
        ] as number;
        u = v;
        v = w;
      }
      const polygon = cycle.map(at);
      if (polygon.length >= 3 && signedArea(polygon) > tol.eps)
        faces.push(polygon);
    }
  }
  return faces;
}

/** Positive for counter-clockwise corners. */
export function signedArea(polygon: readonly Vec[]): number {
  let sum = 0;
  polygon.forEach((p, i) => {
    sum += cross(p, polygon[(i + 1) % polygon.length] as Vec);
  });
  return sum / 2;
}
