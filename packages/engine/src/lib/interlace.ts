import type { Cell } from './pieces.js';
import type { Segment } from './shapes.js';
import type { Vec } from './vec.js';

/**
 * Interlace: the pattern's bands woven over and under, as in lacería.
 *
 * The ink is a net of straight bands. Where two bands cross and both run
 * straight on, one goes over the other; where a band bends (a star's
 * point) nothing crosses. Walking along any band, it goes over, under,
 * over, ... at the crossings it passes. That alternation is a set of
 * equations between neighbouring crossings ("this one's top band is the
 * other's bottom one"), solved once for every crossing of the repeat.
 *
 * Some nets alternate only over two tiles, not one (a band can pass an
 * odd number of crossings before it comes back to the same place in the
 * next tile). Then the answer repeats after two tiles along that slide,
 * and `repeat` says so.
 *
 * Points where three or more bands cross, or where bands meet without
 * running straight on, cannot alternate cleanly: they stay flat, and the
 * bands through them are not tied to their neighbours there.
 */

/** A crossing of two bands, with the band on top. */
export interface WeaveCrossing {
  /** Where they cross, in the tile at slide (i, j) of the repeat. */
  readonly at: Vec;
  /** Which tile of the repeat: 0 ≤ i < repeat[0], 0 ≤ j < repeat[1]. */
  readonly i: number;
  readonly j: number;
  /** The direction of the band on top (a unit vector). */
  readonly over: Vec;
  /** The direction of the band underneath (a unit vector). */
  readonly under: Vec;
  /** How far the top band runs straight either way before its next
   * meeting with another band (or bend), the shorter side. */
  readonly room: number;
}

export interface Weave {
  /** After how many tiles along u and along v the weave repeats. */
  readonly repeat: readonly [number, number];
  /** Every crossing of the repeat, each once. */
  readonly crossings: readonly WeaveCrossing[];
  /** Points where three or more bands meet, left flat (one per tile). */
  readonly flat: readonly Vec[];
}

const EPS = 1e-7;
const SNAP = 1e-6;

interface Vertex {
  /** Its place, in the central tile (lattice coordinates in [0, 1)). */
  readonly at: Vec;
  /** The bands leaving it: direction, the vertex reached, the slide of
   * the tile that vertex is in, and the distance to it. */
  readonly out: {
    dir: Vec;
    to: number;
    di: number;
    dj: number;
    len: number;
  }[];
}

/** The weave of a pattern's ink in its tile. */
export function weave(ink: readonly Segment[], cell: Cell): Weave {
  const { u, v, origin } = cell;
  const det = u.x * v.y - u.y * v.x;
  /** Lattice coordinates of a point. */
  const lattice = (p: Vec) => {
    const dx = p.x - origin.x;
    const dy = p.y - origin.y;
    return { s: (dx * v.y - dy * v.x) / det, t: (u.x * dy - u.y * dx) / det };
  };
  const wrap = (s: number) => {
    let k = Math.floor(s);
    if (s - k > 1 - 1e-7) k += 1;
    return k;
  };

  // The ink of the tile and its neighbours, so every band through the
  // central tile is whole: the next ring of tiles, or two rings when some
  // ink reaches out of its own tile.
  const inside = ink.every((g) =>
    [g.a, g.b].every((p) => {
      const { s, t } = lattice(p);
      return s > -1e-6 && s < 1 + 1e-6 && t > -1e-6 && t < 1 + 1e-6;
    }),
  );
  const R = inside ? 1 : 2;
  const segs: { a: Vec; b: Vec }[] = [];
  for (let i = -R; i <= R; i++)
    for (let j = -R; j <= R; j++) {
      const dx = u.x * i + v.x * j;
      const dy = u.y * i + v.y * j;
      for (const s of ink)
        segs.push({
          a: { x: s.a.x + dx, y: s.a.y + dy },
          b: { x: s.b.x + dx, y: s.b.y + dy },
        });
    }

  // Points, merged within SNAP through a grid of buckets.
  const points: Vec[] = [];
  const buckets = new Map<string, number[]>();
  const bucket = (x: number, y: number) =>
    `${Math.floor(x / (4 * SNAP))},${Math.floor(y / (4 * SNAP))}`;
  const pointId = (p: Vec): number => {
    const bx = Math.floor(p.x / (4 * SNAP));
    const by = Math.floor(p.y / (4 * SNAP));
    for (let ox = -1; ox <= 1; ox++)
      for (let oy = -1; oy <= 1; oy++)
        for (const k of buckets.get(`${bx + ox},${by + oy}`) ?? []) {
          const q = points[k] as Vec;
          if (Math.abs(q.x - p.x) <= SNAP && Math.abs(q.y - p.y) <= SNAP)
            return k;
        }
    const k = points.length;
    points.push(p);
    const key = bucket(p.x, p.y);
    const list = buckets.get(key);
    if (list) list.push(k);
    else buckets.set(key, [k]);
    return k;
  };

  // Split every band where another crosses or touches it, through a grid
  // of the segments' boxes.
  const size = Math.max(Math.hypot(u.x, u.y), Math.hypot(v.x, v.y)) / 8;
  const grid = new Map<string, number[]>();
  const boxOf = (s: { a: Vec; b: Vec }) => ({
    x0: Math.floor((Math.min(s.a.x, s.b.x) - SNAP) / size),
    x1: Math.floor((Math.max(s.a.x, s.b.x) + SNAP) / size),
    y0: Math.floor((Math.min(s.a.y, s.b.y) - SNAP) / size),
    y1: Math.floor((Math.max(s.a.y, s.b.y) + SNAP) / size),
  });
  segs.forEach((s, k) => {
    const b = boxOf(s);
    for (let x = b.x0; x <= b.x1; x++)
      for (let y = b.y0; y <= b.y1; y++) {
        const key = `${x},${y}`;
        const list = grid.get(key);
        if (list) list.push(k);
        else grid.set(key, [k]);
      }
  });
  const cuts: number[][] = segs.map(() => [0, 1]);
  segs.forEach((s, k) => {
    const b = boxOf(s);
    const seen = new Set<number>();
    const d = { x: s.b.x - s.a.x, y: s.b.y - s.a.y };
    const len2 = d.x * d.x + d.y * d.y;
    if (len2 < SNAP * SNAP) return;
    /** Where a point lies along s, when it lies on it. */
    const on = (p: Vec) => {
      const t = ((p.x - s.a.x) * d.x + (p.y - s.a.y) * d.y) / len2;
      if (t <= 0 || t >= 1) return;
      const gap =
        Math.abs((p.x - s.a.x) * d.y - (p.y - s.a.y) * d.x) / Math.sqrt(len2);
      if (gap <= SNAP) cuts[k]?.push(t);
    };
    for (let x = b.x0; x <= b.x1; x++)
      for (let y = b.y0; y <= b.y1; y++)
        for (const o of grid.get(`${x},${y}`) ?? []) {
          if (o === k || seen.has(o)) continue;
          seen.add(o);
          const r = segs[o] as { a: Vec; b: Vec };
          on(r.a);
          on(r.b);
          const e = { x: r.b.x - r.a.x, y: r.b.y - r.a.y };
          const den = d.x * e.y - d.y * e.x;
          if (Math.abs(den) < EPS) continue;
          const w = { x: r.a.x - s.a.x, y: r.a.y - s.a.y };
          const t = (w.x * e.y - w.y * e.x) / den;
          const q = (w.x * d.y - w.y * d.x) / den;
          if (t > EPS && t < 1 - EPS && q > -EPS && q < 1 + EPS)
            cuts[k]?.push(t);
        }
  });

  // The edges between neighbouring points, each once.
  const edges = new Map<string, [number, number]>();
  segs.forEach((s, k) => {
    const ts = [...new Set(cuts[k])].sort((x, y) => x - y);
    const ids = ts.map((t) =>
      pointId({
        x: s.a.x + (s.b.x - s.a.x) * t,
        y: s.a.y + (s.b.y - s.a.y) * t,
      }),
    );
    for (let i = 0; i + 1 < ids.length; i++) {
      const a = ids[i] as number;
      const b = ids[i + 1] as number;
      if (a === b) continue;
      edges.set(a < b ? `${a},${b}` : `${b},${a}`, [a, b]);
    }
  });

  // The vertices of the central tile, each with the bands leaving it.
  const place = (p: Vec) => {
    const { s, t } = lattice(p);
    const i = wrap(s);
    const j = wrap(t);
    return { i, j };
  };
  const vertices: Vertex[] = [];
  /** The central tile's copy of a point: its vertex and its slide. */
  const homeOf = new Map<number, { k: number; di: number; dj: number }>();
  const homes = new Map<string, number>();
  const home = (id: number) => {
    const found = homeOf.get(id);
    if (found) return found;
    const p = points[id] as Vec;
    const { i, j } = place(p);
    const q = {
      x: p.x - u.x * i - v.x * j,
      y: p.y - u.y * i - v.y * j,
    };
    // The same central point from another copy: merged within SNAP.
    const near = pointId(q);
    let k = homes.get(String(near));
    if (k === undefined) {
      k = vertices.length;
      homes.set(String(near), k);
      vertices.push({ at: q, out: [] });
    }
    const out = { k, di: i, dj: j };
    homeOf.set(id, out);
    return out;
  };
  for (const [a, b] of edges.values())
    for (const [from, to] of [
      [a, b],
      [b, a],
    ] as const) {
      const h = home(from);
      if (h.di !== 0 || h.dj !== 0) continue;
      const pa = points[from] as Vec;
      const pb = points[to] as Vec;
      const len = Math.hypot(pb.x - pa.x, pb.y - pa.y);
      const t = home(to);
      const vx = vertices[h.k] as Vertex;
      // Each band once: copies of the tile give the same edge again.
      const dir = { x: (pb.x - pa.x) / len, y: (pb.y - pa.y) / len };
      if (
        vx.out.some(
          (o) =>
            Math.abs(o.dir.x - dir.x) < 1e-6 &&
            Math.abs(o.dir.y - dir.y) < 1e-6,
        )
      )
        continue;
      vx.out.push({ dir, to: t.k, di: t.di, dj: t.dj, len });
    }

  // Which bands at a vertex run straight on: the pairs of opposite ones.
  // A crossing has exactly two pairs; a bend has two bands, not opposite.
  const straight = vertices.map((vx) => {
    const pair = vx.out.map((o) =>
      vx.out.findIndex(
        (p) =>
          Math.abs(p.dir.x + o.dir.x) < 1e-6 &&
          Math.abs(p.dir.y + o.dir.y) < 1e-6,
      ),
    );
    return pair;
  });
  const kind = vertices.map((vx, k) => {
    const pair = straight[k] as number[];
    const n = vx.out.length;
    if (n === 4 && pair.every((p) => p >= 0)) return 'cross';
    if (n === 2) return 'bend';
    return n > 2 ? 'flat' : 'end';
  });
  /** The two lines through each crossing, 0 and 1: a band and the one
   * opposite it make a line, and line 0 is the one at the smaller angle
   * in [0°, 180°). */
  const ang = (d: Vec) => {
    let a = Math.atan2(d.y, d.x);
    if (a < 0) a += Math.PI;
    if (a > Math.PI - 1e-9) a -= Math.PI;
    return a;
  };
  const labels = vertices.map((vx, k) => {
    if (kind[k] !== 'cross') return [];
    const pair = straight[k] as number[];
    const first = [0, pair[0] as number];
    const firstAngle = Math.min(
      ...first.map((i) => ang((vx.out[i] as Vertex['out'][number]).dir)),
    );
    const other = [0, 1, 2, 3].filter((i) => !first.includes(i));
    const otherAngle = Math.min(
      ...other.map((i) => ang((vx.out[i] as Vertex['out'][number]).dir)),
    );
    const firstLine = firstAngle < otherAngle ? 0 : 1;
    return [0, 1, 2, 3].map((i) =>
      first.includes(i) ? firstLine : 1 - firstLine,
    );
  });
  /** The line through crossing k that runs along a direction. */
  const lineAt = (k: number, dir: Vec) => {
    const vx = vertices[k] as Vertex;
    const i = vx.out.findIndex(
      (o) => Math.abs(o.dir.x * dir.y - o.dir.y * dir.x) < 1e-6,
    );
    return (labels[k] as number[])[i] as number;
  };

  /**
   * From a crossing along one of its bands to the next crossing: the
   * crossing reached, its slide, the line the band arrives on there, and
   * the length of the straight run from the start (the first edge).
   */
  const walk = (o: Vertex['out'][number]) => {
    let at = o.to;
    let di = o.di;
    let dj = o.dj;
    let dir = o.dir;
    for (let steps = 0; steps < 10_000; steps++) {
      const kd = kind[at];
      if (kd === 'cross') return { k: at, di, dj, line: lineAt(at, dir) };
      if (kd !== 'bend') return undefined;
      const vx = vertices[at] as Vertex;
      // Leave by the other band: not the one back the way we came.
      const back = { x: -dir.x, y: -dir.y };
      const next = vx.out.find(
        (n) =>
          Math.abs(n.dir.x - back.x) > 1e-6 ||
          Math.abs(n.dir.y - back.y) > 1e-6,
      );
      if (!next) return undefined;
      at = next.to;
      di += next.di;
      dj += next.dj;
      dir = next.dir;
    }
    return undefined;
  };

  const crossings = vertices
    .map((_, k) => k)
    .filter((k) => kind[k] === 'cross');
  const flat = vertices.filter((_, k) => kind[k] === 'flat').map((x) => x.at);

  // The links: crossing a (line la) and crossing b at slide (di, dj)
  // (line lb) are next along a band, so exactly one of the two has that
  // band on top.
  const links: {
    a: number;
    la: number;
    b: number;
    lb: number;
    di: number;
    dj: number;
  }[] = [];
  for (const a of crossings) {
    const vx = vertices[a] as Vertex;
    for (const o of vx.out) {
      const to = walk(o);
      if (!to) continue;
      links.push({
        a,
        la: lineAt(a, o.dir),
        b: to.k,
        lb: to.line,
        di: to.di,
        dj: to.dj,
      });
    }
  }

  // Solve over the smallest repeat that works: each crossing of the repeat
  // is one unknown (which line is on top), and the links say two unknowns
  // differ or agree. Union-find with parity.
  for (const [m, n] of [
    [1, 1],
    [2, 1],
    [1, 2],
    [2, 2],
  ] as const) {
    const id = (k: number, i: number, j: number) =>
      (k * m + (((i % m) + m) % m)) * n + (((j % n) + n) % n);
    const size = crossings.length ? Math.max(...crossings) + 1 : 0;
    const parent = Array.from({ length: size * m * n }, (_, x) => x);
    const parity = new Array<number>(size * m * n).fill(0);
    const find = (x: number): [number, number] => {
      let p = 0;
      let r = x;
      while (parent[r] !== r) {
        p ^= parity[r] as number;
        r = parent[r] as number;
      }
      // Path compression with parity.
      let y = x;
      let py = p;
      while (parent[y] !== y) {
        const next = parent[y] as number;
        const pn = py ^ (parity[y] as number);
        parent[y] = r;
        parity[y] = py;
        y = next;
        py = pn;
      }
      return [r, p];
    };
    let ok = true;
    for (let i = 0; i < m && ok; i++)
      for (let j = 0; j < n && ok; j++)
        for (const l of links) {
          // top(a) is la xor (unknown a): the band is on top at a when
          // unknown a equals la. It must be on top at exactly one end:
          // (xa == la) != (xb == lb), so xa ^ xb = 1 ^ la ^ lb.
          const want = 1 ^ l.la ^ l.lb;
          const [ra, pa] = find(id(l.a, i, j));
          const [rb, pb] = find(id(l.b, i + l.di, j + l.dj));
          if (ra === rb) {
            if ((pa ^ pb) !== want) {
              ok = false;
              break;
            }
          } else {
            parent[ra] = rb;
            parity[ra] = pa ^ pb ^ want;
          }
        }
    if (!ok) continue;
    const out: WeaveCrossing[] = [];
    for (let i = 0; i < m; i++)
      for (let j = 0; j < n; j++)
        for (const k of crossings) {
          const vx = vertices[k] as Vertex;
          const [, p] = find(id(k, i, j));
          const lines = [0, 1].map((line) =>
            vx.out.filter((o) => lineAt(k, o.dir) === line),
          );
          const top = lines[p] ?? [];
          const bottom = lines[1 - p] ?? [];
          const over = top[0]?.dir as Vec;
          const under = bottom[0]?.dir as Vec;
          out.push({
            at: {
              x: vx.at.x + u.x * i + v.x * j,
              y: vx.at.y + u.y * i + v.y * j,
            },
            i,
            j,
            over,
            under,
            room: Math.min(...top.map((o) => o.len)),
          });
        }
    return { repeat: [m, n], crossings: out, flat };
  }
  // No repeat up to two tiles each way alternates: leave it all flat.
  return {
    repeat: [1, 1],
    crossings: [],
    flat: [...flat, ...crossings.map((k) => (vertices[k] as Vertex).at)],
  };
}
