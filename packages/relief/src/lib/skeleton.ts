/**
 * The wavefront of a polygon: every edge moves inward at unit speed, as
 * when a roof of equal slopes is built over the shape. The ridges the
 * corners trace are the polygon's straight skeleton, and at any moment
 * the wavefront is the polygon offset inward by that distance.
 *
 * A carving is a height given by the distance from the piece's edge. Over
 * the region one edge sweeps between two moments with no event, that
 * distance is a plane, so the swept strip is an exact flat face. `sweep`
 * returns those strips with z set to the distance, cut at every moment
 * the caller asks for (the breaks in its profile) and at every event
 * (an edge shrinking to nothing, or a corner reaching another edge and
 * cutting the wavefront in two). Mapping z through a profile that is
 * straight between those moments keeps every face flat.
 *
 * Pieces are small (a 16-point star has 32 corners), so events are found
 * by testing every corner against every edge after each one.
 */

export interface P2 {
  readonly x: number;
  readonly y: number;
}
export interface P3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/** An edge's line at time t: n·p = c + t, with n the unit inward normal. */
interface Line {
  readonly n: P2;
  readonly c: number;
}

/** A closed wavefront at the current time: corner i joins lines[i - 1]
 * (coming in) and lines[i] (going out); edge i runs from corner i to
 * corner i + 1. Counter-clockwise. */
interface Loop {
  pts: P2[];
  lines: Line[];
}

export interface Sweep {
  /** The strips, each a flat polygon with z the distance from the edge,
   * counter-clockwise seen from above. */
  readonly faces: readonly (readonly P3[])[];
  /** The wavefront left at `end`, counter-clockwise; empty when the
   * polygon closed up before it. */
  readonly floor: readonly (readonly P2[])[];
  /** When the last of the wavefront closed up (the skeleton's height), or
   * `end` if some of it was left. */
  readonly reached: number;
}

const sub = (a: P2, b: P2): P2 => ({ x: a.x - b.x, y: a.y - b.y });
const dot = (a: P2, b: P2) => a.x * b.x + a.y * b.y;
const cross = (a: P2, b: P2) => a.x * b.y - a.y * b.x;
const along = (p: P2, v: P2, t: number): P2 => ({
  x: p.x + v.x * t,
  y: p.y + v.y * t,
});

export function signedArea(poly: readonly P2[]): number {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]!;
    const q = poly[(i + 1) % poly.length]!;
    a += p.x * q.y - q.x * p.y;
  }
  return a / 2;
}

/** The direction of a line's edge, for a counter-clockwise loop. */
const direction = (l: Line): P2 => ({ x: l.n.y, y: -l.n.x });

/** How a corner between two lines moves: n·v = 1 for both. Null when
 * the lines face each other (the wavefront there has no width). */
function velocity(a: Line, b: Line): P2 | null {
  const det = a.n.x * b.n.y - a.n.y * b.n.x;
  if (Math.abs(det) < 1e-12) return dot(a.n, b.n) > 0 ? a.n : null;
  return { x: (b.n.y - a.n.y) / det, y: (a.n.x - b.n.x) / det };
}

/** Where two lines cross at time t, or null when they are parallel. */
function meet(a: Line, b: Line, t: number): P2 | null {
  const det = a.n.x * b.n.y - a.n.y * b.n.x;
  if (Math.abs(det) < 1e-9) return null;
  const ca = a.c + t;
  const cb = b.c + t;
  return { x: (ca * b.n.y - cb * a.n.y) / det, y: (a.n.x * cb - b.n.x * ca) / det };
}

function distanceToSegment(p: P2, a: P2, b: P2): number {
  const ab = sub(b, a);
  const len2 = dot(ab, ab);
  const u = len2 > 0 ? Math.max(0, Math.min(1, dot(sub(p, a), ab) / len2)) : 0;
  const q = along(a, ab, u);
  return Math.hypot(p.x - q.x, p.y - q.y);
}

/**
 * Tidies a wavefront after an event: corners that met become one, a
 * corner between two pieces of one line goes, and a corner touching
 * another edge cuts the loop in two there. Loops with no area left are
 * dropped.
 */
function tidy(loop: Loop, t: number, eps: number): Loop[] {
  const pts = loop.pts.slice();
  const lines = loop.lines.slice();
  let changed = true;
  while (changed && pts.length >= 3) {
    changed = false;
    for (let i = 0; i < pts.length && pts.length >= 3; i++) {
      const k = (i + 1) % pts.length;
      const a = pts[i]!;
      const b = pts[k]!;
      if (Math.hypot(a.x - b.x, a.y - b.y) < eps) {
        // Edge i has shrunk away: corner k goes with it.
        pts[i] = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        pts.splice(k, 1);
        lines.splice(i, 1);
        // When corner 0 went, the corners moved down by one: realign the
        // lines so lines[j] still leaves corner j.
        if (k < i) lines.push(lines.shift()!);
        changed = true;
        break;
      }
      const lin = lines[(i - 1 + lines.length) % lines.length]!;
      const lout = lines[i]!;
      if (
        dot(lin.n, lout.n) > 1 - 1e-12 &&
        Math.abs(lin.c - lout.c) < eps
      ) {
        // Two pieces of one line: the corner between them goes.
        pts.splice(i, 1);
        lines.splice(i, 1);
        changed = true;
        break;
      }
    }
  }
  if (pts.length < 3) return [];
  const n = pts.length;
  for (let r = 0; r < n; r++) {
    for (let j = 0; j < n; j++) {
      if (j === r || (j + 1) % n === r) continue;
      if (distanceToSegment(pts[r]!, pts[j]!, pts[(j + 1) % n]!) >= eps)
        continue;
      // Corner r touches edge j: cut the loop there.
      const one: Loop = { pts: [], lines: [] };
      for (let i = r; ; i = (i + 1) % n) {
        one.pts.push(pts[i]!);
        if (i === j) {
          one.lines.push(lines[j]!);
          break;
        }
        one.lines.push(lines[i]!);
      }
      const two: Loop = { pts: [pts[r]!], lines: [lines[j]!] };
      for (let i = (j + 1) % n; i !== r; i = (i + 1) % n) {
        two.pts.push(pts[i]!);
        two.lines.push(lines[i]!);
      }
      return [...tidy(one, t, eps), ...tidy(two, t, eps)];
    }
  }
  if (signedArea(pts) < eps * eps) return [];
  // Put every corner exactly where its two lines now cross.
  const exact = pts.map((p, i) => {
    const at = meet(lines[(i - 1 + n) % n]!, lines[i]!, t);
    return at && Math.hypot(at.x - p.x, at.y - p.y) < eps * 10 ? at : p;
  });
  return [{ pts: exact, lines }];
}

/** The time of the next event of a loop after t, or Infinity. */
function nextEvent(loop: Loop, t: number, eps: number): number {
  const { pts, lines } = loop;
  const n = pts.length;
  const vs = pts.map((_, i) => velocity(lines[(i - 1 + n) % n]!, lines[i]!));
  // A corner whose lines face each other: the loop has no width there,
  // which tidy treats as touching; nothing more can move.
  if (vs.some((v) => !v)) return t;
  const v = vs as P2[];
  let best = Infinity;
  const tiny = eps * 1e-3;
  for (let i = 0; i < n; i++) {
    const d = direction(lines[i]!);
    const k = (i + 1) % n;
    const length = dot(d, sub(pts[k]!, pts[i]!));
    const rate = dot(d, sub(v[k]!, v[i]!));
    if (rate < -1e-12) {
      const dt = Math.max(0, length) / -rate;
      if (dt > tiny) best = Math.min(best, t + dt);
    }
  }
  for (let r = 0; r < n; r++) {
    const din = direction(lines[(r - 1 + n) % n]!);
    const dout = direction(lines[r]!);
    if (cross(din, dout) >= -1e-12) continue; // only reflex corners split
    const p = pts[r]!;
    const vr = v[r]!;
    for (let j = 0; j < n; j++) {
      if (j === r || (j + 1) % n === r) continue;
      const l = lines[j]!;
      const s0 = dot(l.n, p) - l.c - t;
      const rate = dot(l.n, vr) - 1;
      if (rate > -1e-12 || s0 < -eps) continue;
      const dt = Math.max(0, s0) / -rate;
      if (dt <= tiny || t + dt >= best) continue;
      const hit = along(p, vr, dt);
      const a = along(pts[j]!, v[j]!, dt);
      const b = along(pts[(j + 1) % n]!, v[(j + 1) % n]!, dt);
      const ab = sub(b, a);
      const len2 = dot(ab, ab);
      if (len2 < eps * eps) continue;
      const u = dot(sub(hit, a), ab) / len2;
      const slack = eps / Math.sqrt(len2);
      if (u >= -slack && u <= 1 + slack) best = t + dt;
    }
  }
  return best;
}

/**
 * Sweeps a simple counter-clockwise polygon inward up to distance `end`,
 * cutting the strips at each of `stops`. Throws if the wavefront cannot
 * be followed, rather than return a wrong surface.
 */
export function sweep(
  polygon: readonly P2[],
  stops: readonly number[],
  end: number,
): Sweep {
  if (polygon.length < 3) throw new Error('A piece needs three corners.');
  if (signedArea(polygon) <= 0)
    throw new Error('A piece must go counter-clockwise.');
  let size = 0;
  for (const p of polygon) size = Math.max(size, Math.abs(p.x), Math.abs(p.y));
  for (let i = 0; i < polygon.length; i++) {
    const p = polygon[i]!;
    const q = polygon[(i + 1) % polygon.length]!;
    size = Math.max(size, Math.hypot(q.x - p.x, q.y - p.y));
  }
  const eps = Math.max(size, 1) * 1e-9;
  const lines: Line[] = polygon.map((p, i) => {
    const q = polygon[(i + 1) % polygon.length]!;
    const len = Math.hypot(q.x - p.x, q.y - p.y);
    const n = { x: -(q.y - p.y) / len, y: (q.x - p.x) / len };
    return { n, c: dot(n, p) };
  });
  const cuts = [...new Set(stops)].filter((s) => s > 0 && s < end).sort((a, b) => a - b);
  const faces: P3[][] = [];
  const floor: P2[][] = [];
  let reached = 0;
  let loops = tidy({ pts: polygon.slice(), lines }, 0, eps);
  let t = 0;
  let guard = 0;
  while (loops.length) {
    if (++guard > 20000)
      throw new Error('The wavefront of a piece did not settle.');
    const next: Loop[] = [];
    // All loops move together, so their strips share the same cuts.
    let step = end;
    for (const c of cuts) if (c > t + eps * 1e-3) { step = Math.min(step, c); break; }
    for (const loop of loops) step = Math.min(step, nextEvent(loop, t, eps));
    if (step <= t) {
      // A loop with no width left anywhere: it has closed up.
      loops = loops.flatMap((l) => {
        const n = l.pts.length;
        const stuck = l.pts.some(
          (_, i) => !velocity(l.lines[(i - 1 + n) % n]!, l.lines[i]!),
        );
        if (!stuck) return [l];
        reached = Math.max(reached, t);
        return [];
      });
      continue;
    }
    const dt = step - t;
    for (const loop of loops) {
      const n = loop.pts.length;
      const moved = loop.pts.map((p, i) =>
        along(p, velocity(loop.lines[(i - 1 + n) % n]!, loop.lines[i]!)!, dt),
      );
      for (let i = 0; i < n; i++) {
        const k = (i + 1) % n;
        faces.push([
          { ...loop.pts[i]!, z: t },
          { ...loop.pts[k]!, z: t },
          { ...moved[k]!, z: step },
          { ...moved[i]!, z: step },
        ]);
      }
      if (step >= end) {
        floor.push(moved);
        continue;
      }
      const tidied = tidy({ pts: moved, lines: loop.lines }, step, eps * 100);
      if (!tidied.length) reached = Math.max(reached, step);
      next.push(...tidied);
    }
    t = step;
    if (t >= end) {
      reached = floor.length ? end : Math.max(reached, t);
      break;
    }
    loops = next;
  }
  return { faces, floor, reached };
}

/** How far in a polygon's wavefront goes before it closes up. */
export function skeletonHeight(polygon: readonly P2[]): number {
  return sweep(polygon, [], Infinity).reached;
}
