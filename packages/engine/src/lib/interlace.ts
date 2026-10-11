import type { Cell } from './pieces.js';
import type { Segment } from './shapes.js';
import type { Vec } from './vec.js';

/**
 * Interlace: the pattern's bands woven over and under, as in lacería.
 *
 * The rule is the classic one for woven knots: follow any band and it
 * goes over, under, over, ... at the crossings it passes. It is the same
 * as colouring the pieces like a chessboard, two colours with neighbours
 * across a band always different, and letting the band with the dark
 * piece on its right go over. That colouring exists for any net of whole
 * bands, so the rule holds everywhere at once; nothing is decided by
 * looking at one place.
 *
 * The ink is first read as bands. At each point where ink meets, a band
 * runs straight on through the opposite direction, or turns when only two
 * directions meet (a star's point). A point where exactly two bands run
 * straight through is a crossing, and each crossing is one unknown: which
 * band is on top. Between two crossings next along a band the top swaps,
 * which is an equation between two unknowns, solved once for every
 * crossing of the repeat. Where the band passes a point where k other
 * bands cross it together, it swaps k times there (once per band), and
 * where another band only ends against it (a T), it does not swap.
 *
 * Some nets alternate only over two tiles, not one (a band can pass an
 * odd number of crossings before it comes back to the same place in the
 * next tile). Then the answer repeats after two tiles along that slide,
 * and `repeat` says so.
 *
 * Points where three or more bands cross, where a band ends against
 * another, or where bands only touch, are drawn as they are: `flat`.
 *
 * For drawing, each crossing carries the path of its top band either way
 * (`ahead`, `behind`), following the band through its bends and straight
 * on through points where ink was only cut, to halfway to the next point
 * that needs the band as it is. The player redraws the top band along
 * that path, as long as the band's width needs, so the band underneath
 * seems to pass below it.
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
  /** The top band from the crossing along `over`, then along minus
   * `over`: each path starts at `at` and follows the band, through its
   * bends, as far as this crossing may redraw it. */
  readonly ahead: readonly Vec[];
  readonly behind: readonly Vec[];
}

export interface Weave {
  /** After how many tiles along u and along v the weave repeats. */
  readonly repeat: readonly [number, number];
  /** Every crossing of the repeat, each once. */
  readonly crossings: readonly WeaveCrossing[];
  /** Points where bands meet but none goes over another (one per tile). */
  readonly flat: readonly Vec[];
  /** How many steps along a band fail to swap over and under. Zero for a
   * net of whole bands; a band that ends inside the pattern can make it
   * more, and those steps are left as they fall. */
  readonly broken: number;
}

const EPS = 1e-7;
const SNAP = 1e-6;
/** Directions this close are the same. */
const SAME = 1e-6;

interface Out {
  readonly dir: Vec;
  /** The vertex reached and the slide of the tile it is in. */
  readonly to: number;
  readonly di: number;
  readonly dj: number;
  readonly len: number;
}

interface Vertex {
  /** Its place, in the central tile. */
  readonly at: Vec;
  /** The bands leaving it. */
  readonly out: Out[];
}

const same = (a: Vec, b: Vec) =>
  Math.abs(a.x - b.x) < SAME && Math.abs(a.y - b.y) < SAME;

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
    return { i: wrap(s), j: wrap(t) };
  };
  const vertices: Vertex[] = [];
  const vertexGrid = new Map<string, number[]>();
  /** The vertex at a central point, if there is one already. */
  const vertexNear = (q: Vec) => {
    const bx = Math.floor(q.x / (4 * SNAP));
    const by = Math.floor(q.y / (4 * SNAP));
    for (let ox = -1; ox <= 1; ox++)
      for (let oy = -1; oy <= 1; oy++)
        for (const k of vertexGrid.get(`${bx + ox},${by + oy}`) ?? []) {
          const at = (vertices[k] as Vertex).at;
          if (Math.abs(at.x - q.x) <= SNAP && Math.abs(at.y - q.y) <= SNAP)
            return k;
        }
    return undefined;
  };
  /** The central tile's copy of a point: its vertex and its slide. */
  const homeOf = new Map<number, { k: number; di: number; dj: number }>();
  const home = (id: number) => {
    const found = homeOf.get(id);
    if (found) return found;
    const p = points[id] as Vec;
    const { i, j } = place(p);
    const q = { x: p.x - u.x * i - v.x * j, y: p.y - u.y * i - v.y * j };
    // A point on the tile's edge may land on either side of it: the copy
    // one slide over is the same vertex.
    let out: { k: number; di: number; dj: number } | undefined;
    for (const [a, b] of [
      [0, 0],
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ] as const) {
      const k = vertexNear({
        x: q.x + u.x * a + v.x * b,
        y: q.y + u.y * a + v.y * b,
      });
      if (k !== undefined) {
        out = { k, di: i - a, dj: j - b };
        break;
      }
    }
    if (!out) {
      const k = vertices.length;
      vertices.push({ at: q, out: [] });
      const key = bucket(q.x, q.y);
      const list = vertexGrid.get(key);
      if (list) list.push(k);
      else vertexGrid.set(key, [k]);
      out = { k, di: i, dj: j };
    }
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
      if (vx.out.some((o) => same(o.dir, dir))) continue;
      vx.out.push({ dir, to: t.k, di: t.di, dj: t.dj, len });
    }

  // How the bands go through each vertex. A band runs straight on where
  // the opposite direction leaves too; `opposite[k][o]` is that band,
  // else -1. Two directions that are not opposite make a bend.
  const opposite = vertices.map((vx) =>
    vx.out.map((o) =>
      vx.out.findIndex((p) => same(p.dir, { x: -o.dir.x, y: -o.dir.y })),
    ),
  );
  /** How many bands run straight through each vertex. */
  const through = opposite.map((a) => a.filter((x) => x >= 0).length / 2);
  /** A crossing: exactly two bands straight through, and nothing else. */
  const isCross = vertices.map(
    (vx, k) => vx.out.length === 4 && through[k] === 2,
  );
  // Flat: where bands meet and nothing weaves (a T, three or more bands
  // at one point, bands that only touch, or a band's end).
  const flat = vertices
    .filter(
      (vx, k) =>
        !isCross[k] && !(vx.out.length === 2 && (through[k] as number) <= 1),
    )
    .map((vx) => vx.at);

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
    if (!isCross[k]) return [];
    const first = [0, (opposite[k] as number[])[0] as number];
    const smallest = (is: number[]) =>
      Math.min(...is.map((i) => ang((vx.out[i] as Out).dir)));
    const other = [0, 1, 2, 3].filter((i) => !first.includes(i));
    const firstLine = smallest(first) < smallest(other) ? 0 : 1;
    return [0, 1, 2, 3].map((i) =>
      first.includes(i) ? firstLine : 1 - firstLine,
    );
  });
  /** The line through crossing k that runs along a direction. */
  const lineAt = (k: number, dir: Vec) => {
    const vx = vertices[k] as Vertex;
    const i = vx.out.findIndex(
      (o) => Math.abs(o.dir.x * dir.y - o.dir.y * dir.x) < SAME,
    );
    return (labels[k] as number[])[i] as number;
  };

  /**
   * From a crossing along one of its bands: the next crossing (its vertex,
   * slide and the line the band arrives on), how many times the band
   * swaps on the way at points where several bands cross at once, and the
   * path of the band, as far as this crossing may redraw it: halfway to
   * the next crossing or to a point where several bands cross, or all the
   * way to where the band ends. A band that ends (`open`) has no next
   * crossing.
   */
  const walk = (start: number, first: Out) => {
    const path: Vec[] = [(vertices[start] as Vertex).at];
    /** The path's length, and where its drawing must stop. */
    let length = 0;
    let stop: number | undefined;
    let at = start;
    let di = 0;
    let dj = 0;
    let step = first;
    let swaps = 0;
    const result = (
      next: { k: number; di: number; dj: number; line: number } | undefined,
      reach: number,
    ) => ({ next, swaps, path: cut(path, reach), open: !next });
    for (let n = 0; n < 4 * vertices.length + 8; n++) {
      const dir = step.dir;
      at = step.to;
      di += step.di;
      dj += step.dj;
      const vx = vertices[at] as Vertex;
      if (stop === undefined) {
        length += step.len;
        path.push({
          x: vx.at.x + u.x * di + v.x * dj,
          y: vx.at.y + u.y * di + v.y * dj,
        });
      }
      if (isCross[at])
        return result(
          { k: at, di, dj, line: lineAt(at, dir) },
          (stop ?? length) / 2,
        );
      // On along the band: straight through, or round a bend.
      const straight = vx.out.find((p) => same(p.dir, dir));
      if (straight) {
        // Several bands crossing here at once: the band swaps once for
        // each other band, and the point is drawn flat, so the path stops.
        const others = (through[at] as number) - 1;
        if (others >= 1) {
          swaps += others;
          stop ??= length;
        }
        step = straight;
        continue;
      }
      // Round a bend: the two directions here that no band runs straight
      // through, when there are just two (another band may run straight
      // through the same point, touching the bend).
      const loose = vx.out.filter(
        (_, x) => (opposite[at] as number[])[x] === -1,
      );
      if (loose.length === 2) {
        const back = { x: -dir.x, y: -dir.y };
        const turn = loose.find((p) => !same(p.dir, back));
        if (turn && loose.some((p) => same(p.dir, back))) {
          step = turn;
          continue;
        }
      }
      // The band ends here, alone or against another band.
      return result(undefined, stop === undefined ? length : stop / 2);
    }
    return result(undefined, (stop ?? length) / 2);
  };

  const crossings = vertices.map((_, k) => k).filter((k) => isCross[k]);

  // The links: crossing a (line la) and crossing b at slide (di, dj)
  // (line lb) are next along a band, with `swaps` more swaps between.
  interface Link {
    a: number;
    la: number;
    b: number;
    lb: number;
    di: number;
    dj: number;
    swaps: number;
  }
  const links: Link[] = [];
  /** The path of each band out of each crossing, by its out index. */
  const paths = new Map<number, Vec[][]>();
  /** Bands that end somewhere: their crossings, as k * 2 + line. */
  const ends = new Set<number>();
  for (const a of crossings) {
    const vx = vertices[a] as Vertex;
    const mine: Vec[][] = [];
    for (const o of vx.out) {
      const w = walk(a, o);
      mine.push(w.path);
      const la = lineAt(a, o.dir);
      if (w.next)
        links.push({
          a,
          la,
          b: w.next.k,
          lb: w.next.line,
          di: w.next.di,
          dj: w.next.dj,
          swaps: w.swaps,
        });
      else ends.add(a * 2 + la);
    }
    paths.set(a, mine);
  }

  // Whole bands first: a band that never ends is a loop or runs on for
  // ever, and those always weave (the chessboard colouring). A band that
  // ends can ask for a swap the others have already settled; its links
  // go last, and one that disagrees is left as it falls and counted.
  const strand = new UnionFind(vertices.length * 2);
  for (const l of links) strand.union(l.a * 2 + l.la, l.b * 2 + l.lb, 0);
  const endsAt = new Set([...ends].map((x) => strand.find(x)[0]));
  const isOpen = (l: Link) => endsAt.has(strand.find(l.a * 2 + l.la)[0]);
  const ordered = [
    ...links.filter((l) => !isOpen(l)),
    ...links.filter((l) => isOpen(l)),
  ];

  // Solve over the smallest repeat that works: each crossing of the
  // repeat is one unknown (which line is on top), and each link says two
  // unknowns differ or agree.
  let best:
    | {
        m: number;
        n: number;
        broken: number;
        top: (k: number, i: number, j: number) => number;
      }
    | undefined;
  for (const [m, n] of [
    [1, 1],
    [2, 1],
    [1, 2],
    [2, 2],
  ] as const) {
    const id = (k: number, i: number, j: number) =>
      (k * m + (((i % m) + m) % m)) * n + (((j % n) + n) % n);
    const uf = new UnionFind(vertices.length * m * n);
    let broken = 0;
    for (let i = 0; i < m; i++)
      for (let j = 0; j < n; j++)
        for (const l of ordered) {
          // top(a) is la xor (unknown a): the band is on top at a when
          // unknown a equals la. It swaps 1 + swaps times on the way to b:
          // (xa == la) xor (xb == lb) = 1 xor swaps, so
          // xa ^ xb = 1 ^ swaps ^ la ^ lb (mod 2).
          const want = (1 ^ l.swaps ^ l.la ^ l.lb) & 1;
          if (!uf.union(id(l.a, i, j), id(l.b, i + l.di, j + l.dj), want))
            broken++;
        }
    if (!best || broken < best.broken)
      best = {
        m,
        n,
        broken,
        top: (k, i, j) => uf.find(id(k, i, j))[1],
      };
    if (broken === 0) break;
  }

  const out: WeaveCrossing[] = [];
  const { m, n, broken, top } = best as NonNullable<typeof best>;
  for (let i = 0; i < m; i++)
    for (let j = 0; j < n; j++)
      for (const k of crossings) {
        const vx = vertices[k] as Vertex;
        const line = top(k, i, j);
        const ups = vx.out
          .map((o, x) => ({ o, x }))
          .filter(({ o }) => lineAt(k, o.dir) === line);
        const downs = vx.out.filter((o) => lineAt(k, o.dir) !== line);
        const shift = (q: Vec) => ({
          x: q.x + u.x * i + v.x * j,
          y: q.y + u.y * i + v.y * j,
        });
        const [fore, back] = ups;
        const mine = paths.get(k) as Vec[][];
        out.push({
          at: shift(vx.at),
          i,
          j,
          over: (fore as { o: Out }).o.dir,
          under: (downs[0] as Out).dir,
          ahead: (mine[(fore as { x: number }).x] as Vec[]).map(shift),
          behind: (mine[(back as { x: number }).x] as Vec[]).map(shift),
        });
      }
  return { repeat: [m, n], crossings: out, flat, broken };
}

/** A path's first `length`, cut part way along a piece if need be. */
function cut(path: readonly Vec[], length: number): Vec[] {
  const out: Vec[] = [path[0] as Vec];
  let left = length;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1] as Vec;
    const b = path[i] as Vec;
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    if (d >= left) {
      if (left > 0)
        out.push({
          x: a.x + ((b.x - a.x) * left) / d,
          y: a.y + ((b.y - a.y) * left) / d,
        });
      return out;
    }
    out.push(b);
    left -= d;
  }
  return out;
}

/** Union-find where each member carries a parity against its root. */
class UnionFind {
  private readonly parent: number[];
  private readonly parity: number[];
  constructor(size: number) {
    this.parent = Array.from({ length: size }, (_, x) => x);
    this.parity = new Array<number>(size).fill(0);
  }
  /** The root of x and x's parity against it. */
  find(x: number): [number, number] {
    let p = 0;
    let r = x;
    while (this.parent[r] !== r) {
      p ^= this.parity[r] as number;
      r = this.parent[r] as number;
    }
    // Path compression, keeping each parity against the root.
    let y = x;
    let py = p;
    while (this.parent[y] !== y) {
      const next = this.parent[y] as number;
      const pn = py ^ (this.parity[y] as number);
      this.parent[y] = r;
      this.parity[y] = py;
      y = next;
      py = pn;
    }
    return [r, p];
  }
  /** Ask that x and y differ by `want`; false if they already disagree. */
  union(x: number, y: number, want: number): boolean {
    const [rx, px] = this.find(x);
    const [ry, py] = this.find(y);
    if (rx === ry) return (px ^ py) === want;
    this.parent[rx] = ry;
    this.parity[rx] = px ^ py ^ want;
    return true;
  }
}
