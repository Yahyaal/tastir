import { BoxIndex, type Box } from './boxIndex.js';
import {
  appendCrossingCuts,
  overlapPrepared,
  prepareCurve,
  type PreparedCurve,
} from './prepared.js';
import type { Segment } from './shapes.js';
import type { Tolerance } from './tolerance.js';
import { cross, dot, sub, type Vec } from './vec.js';

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
  const prepared = segments.map(prepareCurve);
  const cuts = segments.map(() => [0, 1]);
  const param = (s: Segment, p: Vec) => {
    const d = sub(s.b, s.a);
    return dot(sub(p, s.a), d) / dot(d, d);
  };

  const boxes = segments.map((s) => ({
    minX: Math.min(s.a.x, s.b.x),
    maxX: Math.max(s.a.x, s.b.x),
    minY: Math.min(s.a.y, s.b.y),
    maxY: Math.max(s.a.y, s.b.y),
  }));
  const index = new BoxIndex(boxes);
  for (let i = 0; i < segments.length; i++) {
    const a = segments[i] as Segment;
    const pa = prepared[i] as PreparedCurve;
    const aCuts = cuts[i] as number[];
    for (const j of index.query(boxes[i] as Box, tol.eps * 4, i)) {
      const b = segments[j] as Segment;
      const pb = prepared[j] as PreparedCurve;
      const bCuts = cuts[j] as number[];
      if (overlapPrepared(pa, pb, tol)) {
        // Collinear edges are split at each other's ends.
        aCuts.push(param(a, b.a), param(a, b.b));
        bCuts.push(param(b, a.a), param(b, a.b));
      } else appendCrossingCuts(pa, pb, tol, aCuts, bCuts);
    }
  }

  const vertices = new VertexIndex(tol, segments.length);
  const adjacency = new Map<number, number[]>();
  const link = (u: number, v: number) => {
    if (u === v) return;
    const a = adjacency.get(u);
    if (!a) adjacency.set(u, [v]);
    else if (!a.includes(v)) a.push(v);
    const b = adjacency.get(v);
    if (!b) adjacency.set(v, [u]);
    else if (!b.includes(u)) b.push(u);
  };
  for (let i = 0; i < segments.length; i++) {
    const s = segments[i] as Segment;
    const ts = cuts[i] as number[];
    for (let k = 0; k < ts.length; k++)
      ts[k] = Math.min(1, Math.max(0, ts[k] as number));
    ts.sort(numberOrder);
    const d = sub(s.b, s.a);
    let previous = -1;
    let previousT = NaN;
    for (const t of ts) {
      if (t === previousT) continue;
      const id = vertices.id(s.a.x + d.x * t, s.a.y + d.y * t);
      if (previous !== -1) link(previous, id);
      previous = id;
      previousT = t;
    }
  }

  pruneDanglingEnds(adjacency);
  return walkFaces(adjacency, vertices.points, tol);
}

const numberOrder = (a: number, b: number) => a - b;

/** Gives points closer than the tolerance one shared id. */
class VertexIndex {
  readonly points: Vec[] = [];
  private heads: Int32Array;
  private readonly next: number[] = [];
  constructor(
    private readonly tol: Tolerance,
    expected: number,
  ) {
    let size = 16;
    while (size < expected * 2) size *= 2;
    this.heads = new Int32Array(size);
  }

  private hash(x: number, y: number): number {
    return (
      (Math.imul(x, 73856093) ^ Math.imul(y, 19349663)) &
      (this.heads.length - 1)
    );
  }

  private lastX = NaN;
  private lastY = NaN;
  private lastId = -1;

  id(x: number, y: number): number {
    if (x === this.lastX && y === this.lastY) return this.lastId;
    this.lastX = x;
    this.lastY = y;
    const eps = this.tol.eps;
    const bx = Math.floor(x / eps);
    const by = Math.floor(y / eps);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        let first = Infinity;
        for (
          let entry = this.heads[this.hash(bx + dx, by + dy)] as number;
          entry;
          entry = this.next[entry - 1] as number
        ) {
          const id = entry - 1;
          const q = this.points[id] as Vec;
          // Hash collisions do not change the original cell and insertion order.
          if (
            id < first &&
            Math.floor(q.x / eps) === bx + dx &&
            Math.floor(q.y / eps) === by + dy &&
            Math.hypot(x - q.x, y - q.y) <= eps
          )
            first = id;
        }
        if (first !== Infinity) return (this.lastId = first);
      }
    }
    const id = this.points.length;
    this.points.push({ x, y });
    this.lastId = id;
    if (id >= this.heads.length) {
      this.heads = new Int32Array(this.heads.length * 2);
      for (let i = 0; i < id; i++) {
        const p = this.points[i] as Vec;
        const key = this.hash(Math.floor(p.x / eps), Math.floor(p.y / eps));
        this.next[i] = this.heads[key] as number;
        this.heads[key] = i + 1;
      }
    }
    const key = this.hash(bx, by);
    this.next[id] = this.heads[key] as number;
    this.heads[key] = id + 1;
    return id;
  }
}

/** Removes every vertex with one neighbour, repeatedly, so no stubs remain. */
function pruneDanglingEnds(adjacency: Map<number, number[]>) {
  const queue = [...adjacency.keys()].filter(
    (u) => (adjacency.get(u)?.length ?? 0) <= 1,
  );
  while (queue.length) {
    const u = queue.pop() as number;
    const nbrs = adjacency.get(u);
    if (!nbrs || nbrs.length > 1) continue;
    adjacency.delete(u);
    for (const v of nbrs) {
      const rest = adjacency.get(v);
      if (rest) {
        const index = rest.indexOf(u);
        if (index !== -1) rest.splice(index, 1);
        if (rest.length <= 1) queue.push(v);
      }
    }
  }
}

/** Traces every face with the face on the left; keeps the bounded ones. */
function walkFaces(
  adjacency: Map<number, number[]>,
  points: readonly Vec[],
  tol: Tolerance,
): Vec[][] {
  const at = (i: number) => points[i] as Vec;
  const sorted = adjacency;
  let origin: Vec;
  const angleOrder = (p: number, q: number) =>
    Math.atan2(at(p).y - origin.y, at(p).x - origin.x) -
    Math.atan2(at(q).y - origin.y, at(q).x - origin.x);
  for (const [u, nbrs] of sorted) {
    origin = at(u);
    // Most vertices just split a straight edge: avoid a sort allocation there.
    if (nbrs.length === 2) {
      const a = nbrs[0] as number,
        b = nbrs[1] as number;
      if (angleOrder(a, b) > 0) {
        nbrs[0] = b;
        nbrs[1] = a;
      }
    } else nbrs.sort(angleOrder);
  }
  const starts = new Uint32Array(points.length);
  let edgeCount = 0;
  for (const [u, around] of sorted) {
    starts[u] = edgeCount;
    edgeCount += around.length;
  }
  const used = new Uint8Array(edgeCount);
  const faces: Vec[][] = [];
  for (const [u0, nbrs] of sorted) {
    for (let first = 0; first < nbrs.length; first++) {
      const v0 = nbrs[first] as number;
      let edge = (starts[u0] as number) + first;
      if (used[edge]) continue;
      const cycle: number[] = [];
      let u = u0;
      let v = v0;
      while (!used[edge]) {
        used[edge] = 1;
        cycle.push(u);
        // Leave v by the edge just clockwise of the one we arrived on.
        const around = sorted.get(v) as number[];
        const next = (around.indexOf(u) - 1 + around.length) % around.length;
        u = v;
        v = around[next] as number;
        edge = (starts[u] as number) + next;
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
