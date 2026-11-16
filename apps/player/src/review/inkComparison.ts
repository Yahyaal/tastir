/** Geometry-only review tooling. No tutorial, engine or saved design is changed. */
export interface Point {
  x: number;
  y: number;
}
export interface Stroke {
  a: Point;
  b: Point;
}
export interface InkWall {
  origin: Point;
  u: Point;
  v: Point;
  ink: readonly Stroke[];
}
export interface Placement {
  scale: number;
  angle: number;
  mirrored: boolean;
  shift: Point;
}
export interface InkComparison {
  status: 'same' | 'different' | 'inconclusive';
  reason: string;
  coverageA: number;
  coverageB: number;
  tolerance: number;
  placement?: Placement;
  repeatA?: { u: Point; v: Point; cells: number };
  repeatB?: { u: Point; v: Point; cells: number };
  shared: Stroke[];
  onlyA: Stroke[];
  onlyB: Stroke[];
  boundary: Point[];
}

// Lengths are measured after normalizing A's supplied cell to area 1.
export const INK_TOLERANCE = 1e-6;
const ANGLE = 1e-7;
const MAX_SEGMENTS = 40_000;
const MAX_CANDIDATES = 2_000;
const add = (a: Point, b: Point): Point => ({ x: a.x + b.x, y: a.y + b.y });
const sub = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y });
const mul = (a: Point, k: number): Point => ({ x: a.x * k, y: a.y * k });
const dot = (a: Point, b: Point) => a.x * b.x + a.y * b.y;
const cross = (a: Point, b: Point) => a.x * b.y - a.y * b.x;
const length = (p: Point) => Math.hypot(p.x, p.y);
const distance = (a: Point, b: Point) => length(sub(a, b));
const size = (s: Stroke) => distance(s.a, s.b);
const ZERO: Point = { x: 0, y: 0 };
function required<T>(value: T | undefined): T {
  if (value === undefined)
    throw new Error(
      'The comparison could not establish the required geometry.',
    );
  return value;
}
const key = (p: Point, eps = INK_TOLERANCE) =>
  `${Math.round(p.x / eps)},${Math.round(p.y / eps)}`;
const corners = (w: Pick<InkWall, 'origin' | 'u' | 'v'>) => [
  { ...w.origin },
  add(w.origin, w.u),
  add(add(w.origin, w.u), w.v),
  add(w.origin, w.v),
];
function coordinates(p: Point, u: Point, v: Point): Point {
  const det = cross(u, v);
  return { x: cross(p, v) / det, y: cross(u, p) / det };
}
function normalize(w: InkWall): InkWall {
  const area = Math.abs(cross(w.u, w.v));
  if (!Number.isFinite(area) || area < 1e-15 || !w.ink.length)
    throw new Error(
      'The wall needs nonempty ink and two independent repeat vectors.',
    );
  const k = 1 / Math.sqrt(area);
  const move = (p: Point) => mul(sub(p, w.origin), k);
  const out = {
    origin: ZERO,
    u: mul(w.u, k),
    v: mul(w.v, k),
    ink: w.ink.map((s) => ({ a: move(s.a), b: move(s.b) })),
  };
  if (out.ink.some((s) => ![s.a.x, s.a.y, s.b.x, s.b.y].every(Number.isFinite)))
    throw new Error('Ink contains a non-finite coordinate.');
  // Limits should depend on the ink union, rather than arbitrary path splits.
  return { ...out, ink: mergeInk(out.ink) };
}

/** Clip to a parallelogram, including ink on its boundary. */
function clip(s: Stroke, domain: InkWall): Stroke | undefined {
  const a = coordinates(sub(s.a, domain.origin), domain.u, domain.v);
  const b = coordinates(sub(s.b, domain.origin), domain.u, domain.v);
  let lo = 0,
    hi = 1;
  for (const axis of ['x', 'y'] as const) {
    const d = b[axis] - a[axis];
    if (Math.abs(d) < 1e-14) {
      if (a[axis] < -1e-10 || a[axis] > 1 + 1e-10) return undefined;
    } else {
      const t0 = -a[axis] / d,
        t1 = (1 - a[axis]) / d;
      lo = Math.max(lo, Math.min(t0, t1));
      hi = Math.min(hi, Math.max(t0, t1));
    }
  }
  if (hi <= lo) return undefined;
  const d = sub(s.b, s.a);
  return { a: add(s.a, mul(d, lo)), b: add(s.a, mul(d, hi)) };
}

interface Line {
  d: Point;
  offset: number;
  strokes: Stroke[];
}
function line(s: Stroke): { d: Point; offset: number } {
  let d = mul(sub(s.b, s.a), 1 / size(s));
  if (d.x < -1e-10 || (Math.abs(d.x) <= 1e-10 && d.y < 0)) d = mul(d, -1);
  return { d, offset: cross(d, s.a) };
}
/** Merge touching/overlapping collinear strokes; do not fill real small gaps. */
export function mergeInk(
  ink: readonly Stroke[],
  eps = INK_TOLERANCE,
): Stroke[] {
  const groups: Line[] = [];
  for (const s of ink) {
    if (size(s) < 1e-12) continue;
    const l = line(s);
    const group = groups.find(
      (g) =>
        Math.abs(cross(g.d, l.d)) < ANGLE &&
        Math.abs(cross(g.d, s.a) - g.offset) <= eps &&
        Math.abs(cross(g.d, s.b) - g.offset) <= eps,
    );
    if (group) group.strokes.push(s);
    else groups.push({ ...l, strokes: [s] });
  }
  return groups.flatMap((g) => {
    const origin = required(g.strokes[0]).a;
    const runs = g.strokes
      .map((s) => {
        const a = dot(sub(s.a, origin), g.d),
          b = dot(sub(s.b, origin), g.d);
        return [Math.min(a, b), Math.max(a, b)] as [number, number];
      })
      .sort((a, b) => a[0] - b[0]);
    const merged: [number, number][] = [];
    for (const run of runs) {
      const last = merged.at(-1);
      if (last && run[0] <= last[1] + 1e-10)
        last[1] = Math.max(last[1], run[1]);
      else merged.push([...run]);
    }
    return merged.map(([a, b]) => ({
      a: add(origin, mul(g.d, a)),
      b: add(origin, mul(g.d, b)),
    }));
  });
}

/** Tile enough copies to cover the domain, derived from actual bounds, not a fixed 3×3. */
function patch(w: InkWall, domain: InkWall): Stroke[] {
  const ds = corners(domain).map((p) =>
    coordinates(sub(p, w.origin), w.u, w.v),
  );
  const ps = w.ink
    .flatMap((s) => [s.a, s.b])
    .map((p) => coordinates(sub(p, w.origin), w.u, w.v));
  const min = (points: Point[], axis: 'x' | 'y') =>
    Math.min(...points.map((p) => p[axis]));
  const max = (points: Point[], axis: 'x' | 'y') =>
    Math.max(...points.map((p) => p[axis]));
  const i0 = Math.ceil(min(ds, 'x') - max(ps, 'x') - 1e-9);
  const i1 = Math.floor(max(ds, 'x') - min(ps, 'x') + 1e-9);
  const j0 = Math.ceil(min(ds, 'y') - max(ps, 'y') - 1e-9);
  const j1 = Math.floor(max(ds, 'y') - min(ps, 'y') + 1e-9);
  if ((i1 - i0 + 1) * (j1 - j0 + 1) * w.ink.length > MAX_SEGMENTS)
    throw new Error(
      'This comparison exceeds the bounded patch size; alignment is inconclusive.',
    );
  const out: Stroke[] = [];
  for (let i = i0; i <= i1; i++)
    for (let j = j0; j <= j1; j++) {
      const shift = add(mul(w.u, i), mul(w.v, j));
      for (const s of w.ink) {
        const c = clip({ a: add(s.a, shift), b: add(s.b, shift) }, domain);
        if (c && size(c) > 1e-12) {
          const ca = coordinates(sub(c.a, domain.origin), domain.u, domain.v);
          const cb = coordinates(sub(c.b, domain.origin), domain.u, domain.v);
          // Opposite boundary lines represent the same ink in a periodic cell.
          if (Math.abs(ca.x - 1) < 1e-10 && Math.abs(cb.x - 1) < 1e-10)
            continue;
          if (Math.abs(ca.y - 1) < 1e-10 && Math.abs(cb.y - 1) < 1e-10)
            continue;
          out.push(c);
        }
      }
    }
  return mergeInk(out);
}

/** Covered and uncovered subintervals of every source stroke, without double counting. */
export function inkDifference(
  source: readonly Stroke[],
  target: readonly Stroke[],
  eps = INK_TOLERANCE,
) {
  const shared: Stroke[] = [],
    only: Stroke[] = [];
  const index = new Map<string, Stroke[]>();
  for (const s of target) {
    const { d, offset } = line(s);
    for (const sign of [1, -1]) {
      const k = `${Math.round(Math.atan2(d.y * sign, d.x * sign) / ANGLE)},${Math.round((offset * sign) / eps)}`;
      const list = index.get(k) ?? [];
      list.push(s);
      index.set(k, list);
    }
  }
  for (const s of source) {
    const n = size(s),
      { d, offset } = line(s);
    const a = Math.round(Math.atan2(d.y, d.x) / ANGLE),
      o = Math.round(offset / eps);
    const runs: [number, number][] = [];
    for (let da = -1; da <= 1; da++)
      for (let db = -2; db <= 2; db++) {
        for (const t of index.get(`${a + da},${o + db}`) ?? []) {
          if (
            Math.abs(cross(d, sub(t.a, s.a))) > eps ||
            Math.abs(cross(d, sub(t.b, s.a))) > eps
          )
            continue;
          // Use s's forward direction for interval projection.
          const forward = mul(sub(s.b, s.a), 1 / n);
          const x = dot(sub(t.a, s.a), forward),
            y = dot(sub(t.b, s.a), forward);
          const lo = Math.max(0, Math.min(x, y)),
            hi = Math.min(n, Math.max(x, y));
          if (hi > lo) runs.push([lo, hi]);
        }
      }
    runs.sort((a, b) => a[0] - b[0]);
    const merged: [number, number][] = [];
    for (const run of runs) {
      const last = merged.at(-1);
      if (last && run[0] <= last[1] + 1e-10)
        last[1] = Math.max(last[1], run[1]);
      else merged.push([...run]);
    }
    const d0 = mul(sub(s.b, s.a), 1 / n);
    const slice = (a: number, b: number) => ({
      a: add(s.a, mul(d0, a)),
      b: add(s.a, mul(d0, b)),
    });
    let at = 0;
    for (const [a, b] of merged) {
      if (a - at > 1e-10) only.push(slice(at, a));
      shared.push(slice(a, b));
      at = b;
    }
    if (n - at > 1e-10) only.push(slice(at, n));
  }
  const total = source.reduce((sum, s) => sum + size(s), 0);
  const missing = only.reduce((sum, s) => sum + size(s), 0);
  return {
    shared,
    only,
    coverage: total ? Math.max(0, 1 - missing / total) : 0,
    full: total > 0 && only.length === 0,
  };
}

function wrapped(p: Point, w: InkWall): Point {
  const c = coordinates(p, w.u, w.v);
  const f = (n: number) =>
    Math.abs(n - Math.round(n)) < 1e-8 ? 0 : n - Math.floor(n);
  return add(mul(w.u, f(c.x)), mul(w.v, f(c.y)));
}
function unique(points: Point[]): Point[] {
  const out = new Map<string, Point>();
  for (const p of points) out.set(key(p), p);
  return [...out.values()];
}
/** Genuine maximal-stroke ends, or crossings when every carrier continues. */
function anchors(w: InkWall): Point[] {
  const domain = {
    ...w,
    origin: sub(w.origin, add(w.u, w.v)),
    u: mul(w.u, 3),
    v: mul(w.v, 3),
  };
  const strokes = patch(w, domain);
  const ends = unique(
    strokes
      .flatMap((s) => [s.a, s.b])
      .filter((p) => {
        const c = coordinates(sub(p, w.origin), w.u, w.v);
        return c.x >= -1e-8 && c.x < 1 - 1e-8 && c.y >= -1e-8 && c.y < 1 - 1e-8;
      })
      .map((p) => wrapped(sub(p, w.origin), w)),
  );
  if (ends.length) return ends;
  // A continuous triangular/square line network has crossings but no ends.
  // Those vertices are just as invariant under any exact placement.
  if (strokes.length > MAX_CANDIDATES)
    throw new Error(
      'Too many carriers to establish crossing anchors within the search limit.',
    );
  const crossings: Point[] = [];
  for (let i = 0; i < strokes.length; i++)
    for (let j = i + 1; j < strokes.length; j++) {
      const a = required(strokes[i]),
        b = required(strokes[j]);
      const r = sub(a.b, a.a),
        s = sub(b.b, b.a),
        d = sub(b.a, a.a),
        det = cross(r, s);
      if (Math.abs(det) < 1e-10 * length(r) * length(s)) continue;
      const t = cross(d, s) / det,
        q = cross(d, r) / det;
      if (t < 0 || t > 1 || q < 0 || q > 1) continue;
      const p = add(a.a, mul(r, t)),
        c = coordinates(sub(p, w.origin), w.u, w.v);
      if (c.x >= -1e-8 && c.x < 1 - 1e-8 && c.y >= -1e-8 && c.y < 1 - 1e-8)
        crossings.push(wrapped(sub(p, w.origin), w));
      if (crossings.length > MAX_CANDIDATES)
        throw new Error(
          'Too many crossings to establish repeat anchors within the search limit.',
        );
    }
  return unique(crossings);
}
interface Repeat {
  wall: InkWall;
  anchors: Point[];
  cells: number;
}
function trueRepeat(w: InkWall, reductions = 0): Repeat {
  try {
    return discoverRepeat(w);
  } catch (error) {
    // A large supplied supercell can hit the limits before corner discovery.
    // Verify an obvious half-period against the whole supplied cell before
    // reducing its representation; never infer it from the tile dimensions.
    if (reductions >= 4) throw error;
    const original = patch(w, w);
    for (const axis of ['u', 'v'] as const) {
      const shift = mul(w[axis], 0.5);
      const moved = patch(
        {
          ...w,
          origin: add(w.origin, shift),
          ink: w.ink.map((s) => ({ a: add(s.a, shift), b: add(s.b, shift) })),
        },
        w,
      );
      if (
        !inkDifference(original, moved).full ||
        !inkDifference(moved, original).full
      )
        continue;
      const smaller = { ...w, [axis]: shift };
      const found = trueRepeat(
        { ...smaller, ink: patch(w, smaller) },
        reductions + 1,
      );
      return { ...found, cells: found.cells * 2 };
    }
    throw error;
  }
}

function discoverRepeat(w: InkWall): Repeat {
  const points = anchors(w);
  if (!points.length)
    throw new Error(
      'No finite ink corners were found to establish the minimal repeat.',
    );
  if (points.length > MAX_CANDIDATES)
    throw new Error(
      'Too many ink corners to establish the minimal repeat within the search limit.',
    );
  const vectors = endpointVectors(w, points);
  const sameVectors = (a: Point[], b: Point[]) =>
    a.length === b.length &&
    a.every((v) => b.some((q) => distance(v, q) < INK_TOLERANCE * 4));
  let anchorIndex = 0,
    fewest = Infinity;
  vectors.forEach((v, i) => {
    const count = vectors.filter((q) => sameVectors(v, q)).length;
    if (count < fewest) {
      anchorIndex = i;
      fewest = count;
    }
  });
  const anchor = required(points[anchorIndex]);
  const original = patch(w, w);
  const periods: Point[] = [w.u, w.v];
  for (let i = 0; i < points.length; i++) {
    if (
      i === anchorIndex ||
      !sameVectors(required(vectors[anchorIndex]), required(vectors[i]))
    )
      continue;
    const shift = wrapped(sub(required(points[i]), anchor), w);
    if (length(shift) < INK_TOLERANCE) continue;
    const moved = patch(
      {
        ...w,
        origin: add(w.origin, shift),
        ink: w.ink.map((s) => ({ a: add(s.a, shift), b: add(s.b, shift) })),
      },
      w,
    );
    if (
      inkDifference(original, moved).full &&
      inkDifference(moved, original).full
    )
      periods.push(shift);
  }
  // Integer combinations provide short independent vectors even for skewed supplied cells.
  const candidates = unique(
    periods.flatMap((p) => {
      const out: Point[] = [];
      for (let i = -2; i <= 2; i++)
        for (let j = -2; j <= 2; j++)
          out.push(add(p, add(mul(w.u, i), mul(w.v, j))));
      return out;
    }),
  )
    .filter((p) => length(p) > INK_TOLERANCE)
    .sort((a, b) => length(a) - length(b));
  if (candidates.length > MAX_CANDIDATES)
    throw new Error(
      'Too many repeat-basis candidates within the bounded search.',
    );
  let best: { u: Point; v: Point; area: number } = {
    u: w.u,
    v: w.v,
    area: Math.abs(cross(w.u, w.v)),
  };
  for (const u of candidates)
    for (const v of candidates) {
      const area = Math.abs(cross(u, v));
      if (area < 1e-8 || area > best.area + 1e-8) continue;
      const count = Math.abs(cross(w.u, w.v)) / area;
      if (Math.abs(count - Math.round(count)) > 1e-6) continue;
      const integral = [coordinates(w.u, u, v), coordinates(w.v, u, v)].every(
        (p) =>
          Math.abs(p.x - Math.round(p.x)) < 1e-6 &&
          Math.abs(p.y - Math.round(p.y)) < 1e-6,
      );
      if (!integral) continue;
      if (
        area < best.area - 1e-8 ||
        length(u) + length(v) < length(best.u) + length(best.v) - 1e-8
      )
        best = { u, v, area };
    }
  const cells = Math.round(Math.abs(cross(w.u, w.v)) / best.area);
  if (cells !== periods.length - 1)
    throw new Error(
      'The detected periods did not establish a complete minimal lattice.',
    );
  // Reduce the basis by integer operations, preserving the lattice. The two
  // shortest independent vectors must never be replaced by an affine stretch.
  let { u, v } = best;
  for (let i = 0; i < 64; i++) {
    if (length(v) < length(u)) [u, v] = [v, u];
    const n = Math.round(dot(u, v) / dot(u, u));
    if (!n) break;
    v = sub(v, mul(u, n));
  }
  const wall = {
    ...w,
    u,
    v: cross(u, v) > 0 ? v : mul(v, -1),
  };
  const ink = patch(w, wall);
  const minimal = { ...wall, ink };
  return {
    wall: minimal,
    anchors: anchors(minimal),
    cells,
  };
}
function rotate(
  p: Point,
  scale: number,
  angle: number,
  mirrored: boolean,
): Point {
  const x = mirrored ? -p.x : p.x;
  return {
    x: scale * (x * Math.cos(angle) - p.y * Math.sin(angle)),
    y: scale * (x * Math.sin(angle) + p.y * Math.cos(angle)),
  };
}
function place(w: InkWall, p: Placement): InkWall {
  const linear = (v: Point) => rotate(v, p.scale, p.angle, p.mirrored);
  const move = (v: Point) => add(linear(v), p.shift);
  return {
    origin: move(w.origin),
    u: linear(w.u),
    v: linear(w.v),
    ink: w.ink.map((s) => ({ a: move(s.a), b: move(s.b) })),
  };
}
function shortVectors(w: InkWall): Point[] {
  const out: Point[] = [];
  for (let i = -2; i <= 2; i++)
    for (let j = -2; j <= 2; j++)
      if (i || j) out.push(add(mul(w.u, i), mul(w.v, j)));
  return out.sort((a, b) => length(a) - length(b));
}
function sameLattice(a: InkWall, b: InkWall): boolean {
  const ratio = Math.abs(cross(a.u, a.v) / cross(b.u, b.v));
  return (
    Math.abs(ratio - 1) < 1e-6 &&
    [a.u, a.v].every((v) => {
      const c = coordinates(v, b.u, b.v);
      return (
        Math.abs(c.x - Math.round(c.x)) < 1e-6 &&
        Math.abs(c.y - Math.round(c.y)) < 1e-6
      );
    })
  );
}

/** Local maximal-stroke vectors prune impossible endpoint matches before tiling. */
function endpointVectors(w: InkWall, points: Point[]): Point[][] {
  for (const span of [3, 5, 7]) {
    const padding = (span - 1) / 2;
    const domain = {
      ...w,
      origin: sub(w.origin, mul(add(w.u, w.v), padding)),
      u: mul(w.u, span),
      v: mul(w.v, span),
    };
    const strokes = patch(w, domain);
    const step = INK_TOLERANCE * 2;
    const endpoints = new Map<string, number[]>();
    strokes.forEach((s, i) => {
      for (const p of [s.a, s.b]) {
        const k = `${Math.floor(p.x / step)},${Math.floor(p.y / step)}`;
        const list = endpoints.get(k) ?? [];
        list.push(i);
        endpoints.set(k, list);
      }
    });
    let clipped = false;
    const vectors = points.map((p) => {
      const gx = Math.floor(p.x / step),
        gy = Math.floor(p.y / step);
      const near = new Set<number>();
      for (let x = -1; x <= 1; x++)
        for (let y = -1; y <= 1; y++)
          for (const i of endpoints.get(`${gx + x},${gy + y}`) ?? [])
            near.add(i);
      return [...near].flatMap((i) => {
        const s = required(strokes[i]);
        const other =
          distance(s.a, p) < INK_TOLERANCE * 2
            ? s.b
            : distance(s.b, p) < INK_TOLERANCE * 2
              ? s.a
              : undefined;
        if (!other) return [];
        const c = coordinates(sub(other, domain.origin), domain.u, domain.v);
        if (c.x < 1e-8 || c.x > 1 - 1e-8 || c.y < 1e-8 || c.y > 1 - 1e-8)
          clipped = true;
        return [sub(other, p)];
      });
    });
    if (!clipped) return vectors;
  }
  throw new Error(
    'A maximal stroke reaches the bounded neighbourhood edge; endpoint alignment is inconclusive.',
  );
}

/** Align B to A by similarities only. A failed bounded search is never called a difference. */
export function compareInk(aInput: InkWall, bInput: InkWall): InkComparison {
  const empty: InkComparison = {
    status: 'inconclusive',
    reason: '',
    coverageA: 0,
    coverageB: 0,
    tolerance: INK_TOLERANCE,
    shared: [],
    onlyA: [],
    onlyB: [],
    boundary: [],
  };
  try {
    const a = normalize(aInput),
      b = normalize(bInput);
    const ra = trueRepeat(a),
      rb = trueRepeat(b);
    const domain = ra.wall,
      source = patch(a, domain);
    const scale = Math.sqrt(
      Math.abs(cross(domain.u, domain.v) / cross(rb.wall.u, rb.wall.v)),
    );
    const ref = required(shortVectors(rb.wall)[0]);
    const av = endpointVectors(ra.wall, ra.anchors);
    const bv = endpointVectors(rb.wall, rb.anchors);
    const lengthsMatch = (xs: Point[], ys: Point[]) => {
      const sortedY = ys.map(length).sort((a, b) => a - b);
      return (
        xs.length === ys.length &&
        xs
          .map(length)
          .sort((a, b) => a - b)
          .every((n, i) => {
            const other = sortedY[i];
            return (
              other !== undefined &&
              Math.abs(n - other * scale) < INK_TOLERANCE * 4
            );
          })
      );
    };
    // Pick a rare endpoint signature; this remains exhaustive for an exact match.
    let anchorIndex = 0,
      fewest = Infinity;
    bv.forEach((vectors, i) => {
      const count = av.filter((v) => lengthsMatch(v, vectors)).length;
      if (count > 0 && count < fewest) {
        fewest = count;
        anchorIndex = i;
      }
    });
    const placements: {
      placement: Placement;
      localScore: number;
      exact: boolean;
    }[] = [];
    for (const mirrored of [false, true])
      for (const v of shortVectors(domain)) {
        if (Math.abs(length(v) - length(ref) * scale) > INK_TOLERANCE * 4)
          continue;
        const r = rotate(ref, 1, 0, mirrored);
        const angle = Math.atan2(v.y, v.x) - Math.atan2(r.y, r.x);
        const transform = { scale, angle, mirrored, shift: ZERO };
        if (!sameLattice(domain, place(rb.wall, transform))) continue;
        // Every exact match maps this ink vertex onto another ink vertex.
        const bp = rotate(
          required(rb.anchors[anchorIndex]),
          scale,
          angle,
          mirrored,
        );
        const vectors = required(bv[anchorIndex]).map((p) =>
          rotate(p, scale, angle, mirrored),
        );
        ra.anchors.forEach((ap, i) => {
          const matches = vectors.filter((v) =>
            required(av[i]).some((q) => distance(q, v) < INK_TOLERANCE * 4),
          ).length;
          placements.push({
            placement: { ...transform, shift: sub(ap, bp) },
            localScore:
              matches / (Math.max(vectors.length, required(av[i]).length) || 1),
            exact:
              matches === vectors.length &&
              vectors.length === required(av[i]).length,
          });
        });
      }
    if (!placements.length)
      return {
        ...empty,
        boundary: corners(domain),
        reason:
          'No common repeat could be aligned by rotation, uniform scale and reflection.',
      };
    const exact = placements.filter((p) => p.exact);
    if (exact.length > MAX_CANDIDATES)
      throw new Error(
        'Too many alignment candidates; the bounded search is inconclusive.',
      );
    let best: InkComparison | undefined,
      score = -1;
    // Exact candidates must all be checked before a negative verdict; also show
    // the best of a small set of approximate alignments when local geometry differs.
    const approximate = placements
      .filter((p) => !p.exact)
      .sort((a, b) => b.localScore - a.localScore)
      .slice(0, 24);
    for (const { placement } of [...exact, ...approximate]) {
      const target = patch(place(b, placement), domain);
      const ab = inkDifference(source, target),
        ba = inkDifference(target, source);
      const value = (ab.coverage + ba.coverage) / 2;
      if (value > score + 1e-12) {
        score = value;
        best = {
          status: ab.full && ba.full ? 'same' : 'different',
          reason:
            ab.full && ba.full
              ? 'Both walls cover each other over a common repeat within the stated tolerance.'
              : 'Unmatched ink remains at the best tested endpoint alignment over a common repeat.',
          coverageA: ab.coverage,
          coverageB: ba.coverage,
          tolerance: INK_TOLERANCE,
          placement,
          repeatA: { u: ra.wall.u, v: ra.wall.v, cells: ra.cells },
          repeatB: { u: rb.wall.u, v: rb.wall.v, cells: rb.cells },
          shared: ab.shared,
          onlyA: ab.only,
          onlyB: ba.only,
          boundary: corners(domain),
        };
      }
      if (best?.status === 'same') break;
    }
    return required(best);
  } catch (e) {
    return { ...empty, reason: e instanceof Error ? e.message : String(e) };
  }
}
