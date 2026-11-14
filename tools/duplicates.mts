/**
 * Finds tutorials that draw the same design. Run from the repo root:
 * node --conditions=@tastir/source --import tsx tools/duplicates.mts
 * It writes apps/player/src/review/duplicates.json for the #/plan/duplicates page.
 *
 * Each tutorial is cut into its pieces by the engine, then compared at three
 * levels, each stricter than the last:
 *  1. shapes: the same piece shapes (corner angles and side proportions);
 *  2. proportions: also the same share of the wall for each shape;
 *  3. neighbours: also the same pieces round every piece and every corner.
 * Two tutorials that agree at level 3 tile the plane the same way.
 */
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { parseTutorial } from '../packages/schema/src/index.js';
import {
  computePattern,
  evaluate,
  type Vec,
} from '../packages/engine/src/index.js';

const DIR = 'tutorials/';
const OUT = 'apps/player/src/review/duplicates.json';

const r = (n: number, d = 0) => Number(n.toFixed(d)) + 0;

/** The smallest of every turn and mirror of a cyclic list. */
function canonical<T>(items: readonly T[], key: (x: T) => string): string {
  const n = items.length;
  const keys = items.map(key);
  let best = '';
  for (const seq of [keys, [...keys].reverse()])
    for (let s = 0; s < n; s++) {
      const k = seq.slice(s).concat(seq.slice(0, s)).join(' ');
      if (best === '' || k < best) best = k;
    }
  return best;
}

function area(p: readonly Vec[]): number {
  let a = 0;
  for (let i = 0; i < p.length; i++) {
    const q = p[i],
      w = p[(i + 1) % p.length];
    a += q.x * w.y - w.x * q.y;
  }
  return a / 2;
}

/** Corner angles (degrees, inside) and sides over the shortest side. */
function corners(p: readonly Vec[]) {
  const n = p.length;
  const sides = p.map((q, i) =>
    Math.hypot(p[(i + 1) % n].x - q.x, p[(i + 1) % n].y - q.y),
  );
  // Sides against the shortest one: a ratio like 1/16 of the perimeter
  // rounds two ways, but these ratios (1, √2, …) sit far from a boundary.
  const per = Math.min(...sides);
  return p.map((b, i) => {
    const a = p[(i + n - 1) % n],
      c = p[(i + 1) % n];
    const ux = a.x - b.x,
      uy = a.y - b.y,
      vx = c.x - b.x,
      vy = c.y - b.y;
    // counter-clockwise polygon: inside angle from b→c round to b→a
    let d = (Math.atan2(vx * uy - vy * ux, vx * ux + vy * uy) * 180) / Math.PI;
    if (d < 0) d += 360;
    return { angle: r(d, 1), side: r(sides[i] / per, 2) };
  });
}

const shapeKey = (p: readonly Vec[]) =>
  `${p.length}|` + canonical(corners(p), (c) => `${c.angle}/${c.side}`);

function inside(pt: Vec, poly: readonly Vec[]): boolean {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i],
      b = poly[j];
    if (
      a.y > pt.y !== b.y > pt.y &&
      pt.x < ((b.x - a.x) * (pt.y - a.y)) / (b.y - a.y) + a.x
    )
      hit = !hit;
  }
  return hit;
}

interface Out {
  id: string;
  title: string;
  region?: string;
  fold: number;
  star?: number;
  family?: string;
  mainFamily?: string;
  shapes: {
    key: string;
    cover: number;
    size: number;
    perCell: number;
    outline: [number, number][];
  }[];
  neighbours: string;
  corners: string;
  patch: { s: number; p: [number, number][] }[];
}

type Family = { id: string; title: string; members: string[] };
const familyMap = (fs: Family[]) =>
  new Map(fs.flatMap((f) => f.members.map((m) => [m, f.id] as const)));
// The families here, and on main (what production shows), to compare.
const families: Family[] = JSON.parse(
  readFileSync('apps/player/src/app/variations.json', 'utf8'),
);
const mainFamilies: Family[] = JSON.parse(
  execSync('git show main:apps/player/src/app/variations.json', {
    encoding: 'utf8',
  }),
);
const familyOf = familyMap(families);
const mainFamilyOf = familyMap(mainFamilies);
const familyTitles = Object.fromEntries(
  [...mainFamilies, ...families].map((f) => [f.id, f.title]),
);

const all: Out[] = [];
for (const file of readdirSync(DIR)
  .filter((f) => f.endsWith('.json'))
  .sort()) {
  const raw = JSON.parse(readFileSync(DIR + file, 'utf8'));
  const t = parseTutorial(raw);
  const pat = computePattern(evaluate(t), t);
  const { u, v } = pat.cell;
  const cellArea = Math.abs(u.x * v.y - u.y * v.x);
  const keyOf = pat.types.map((_, i) =>
    shapeKey(pat.pieces.find((q) => q.type === i)!.polygon),
  );
  // Pieces of the same shape may count as several types (told apart by
  // outline); merge them by shape.
  const byKey = new Map<
    string,
    { cover: number; area: number; perCell: number; poly: readonly Vec[] }
  >();
  pat.types.forEach((ty, i) => {
    const k = keyOf[i];
    const e = byKey.get(k);
    const poly = pat.pieces.find((q) => q.type === i)!.polygon;
    if (e) {
      e.cover += (ty.area * ty.perCell) / cellArea;
      e.perCell += ty.perCell;
    } else
      byKey.set(k, {
        cover: (ty.area * ty.perCell) / cellArea,
        area: ty.area,
        perCell: ty.perCell,
        poly,
      });
  });
  const largest = Math.max(...[...byKey.values()].map((e) => e.area));
  const unit = Math.sqrt(largest);
  const order = [...byKey.entries()].sort((a, b) => b[1].area - a[1].area);
  const index = new Map(order.map(([k], i) => [k, i]));
  // The neighbourhood: copies of the cell's pieces over 5 × 5 cells.
  const near: { key: string; poly: Vec[] }[] = [];
  for (let i = -2; i <= 2; i++)
    for (let j = -2; j <= 2; j++)
      for (const pc of pat.pieces) {
        const dx = i * u.x + j * v.x,
          dy = i * u.y + j * v.y;
        near.push({
          key: keyOf[pc.type],
          poly: pc.polygon.map((q) => ({ x: q.x + dx, y: q.y + dy })),
        });
      }
  const central = pat.pieces.map((pc) => ({
    key: keyOf[pc.type],
    poly: pc.polygon,
  }));
  const eps = unit * 1e-3;
  // A grid over the neighbourhood, so each lookup tests only nearby pieces.
  const g = unit / 2;
  const grid = new Map<string, number[]>();
  near.forEach((n, k) => {
    const xs = n.poly.map((q) => q.x),
      ys = n.poly.map((q) => q.y);
    for (
      let gx = Math.floor(Math.min(...xs) / g);
      gx <= Math.floor(Math.max(...xs) / g);
      gx++
    )
      for (
        let gy = Math.floor(Math.min(...ys) / g);
        gy <= Math.floor(Math.max(...ys) / g);
        gy++
      ) {
        const key = `${gx},${gy}`;
        const list = grid.get(key);
        if (list) list.push(k);
        else grid.set(key, [k]);
      }
  });
  const at = (pt: Vec) => {
    for (const k of grid.get(
      `${Math.floor(pt.x / g)},${Math.floor(pt.y / g)}`,
    ) ?? [])
      if (inside(pt, near[k].poly)) return near[k].key;
    return '-';
  };
  // Round each piece: the shapes across each side, in order.
  const nb = central.map((c) => {
    const n = c.poly.length;
    const across = c.poly.map((a, i) => {
      const b = c.poly[(i + 1) % n];
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      const ox = ((b.y - a.y) / len) * eps,
        oy = (-(b.x - a.x) / len) * eps;
      return [0.25, 0.5, 0.75]
        .map(
          (f) =>
            index.get(
              at({
                x: a.x + (b.x - a.x) * f + ox,
                y: a.y + (b.y - a.y) * f + oy,
              }),
            ) ?? '-',
        )
        .join('');
    });
    return `${index.get(c.key)}:` + canonical(across, (x) => x);
  });
  // Round each corner: the shapes meeting there, in order round it.
  const cn = central.flatMap((c) =>
    c.poly.map((q) => {
      const ring: string[] = [];
      for (let k = 0; k < 24; k++) {
        const th = (k * Math.PI) / 12 + 0.01;
        ring.push(
          String(
            index.get(
              at({
                x: q.x + Math.cos(th) * eps * 5,
                y: q.y + Math.sin(th) * eps * 5,
              }),
            ) ?? '-',
          ),
        );
      }
      const runs = ring.filter((s, i) => s !== ring[(i + 23) % 24]);
      return canonical(runs.length ? runs : [ring[0]], (x) => x);
    }),
  );
  const multiset = (xs: string[]) => [...new Set(xs)].sort().join(' ; ');
  // A square patch round O for the page, a few largest-piece widths across.
  const half = unit * 2.6;
  const patch = near
    .filter((n) =>
      n.poly.some((q) => Math.abs(q.x) < half && Math.abs(q.y) < half),
    )
    .map((n) => ({
      s: index.get(n.key)!,
      p: n.poly.map(
        (q) => [r(q.x / unit, 3), r(-q.y / unit, 3)] as [number, number],
      ),
    }));
  all.push({
    id: t.id,
    title: t.title,
    region: raw.region,
    fold: t.fold,
    star: raw.star,
    family: familyOf.get(t.id),
    mainFamily: mainFamilyOf.get(t.id),
    shapes: order.map(([key, e]) => {
      const cx = e.poly.reduce((a, q) => a + q.x, 0) / e.poly.length;
      const cy = e.poly.reduce((a, q) => a + q.y, 0) / e.poly.length;
      return {
        key,
        cover: r(e.cover, 3),
        size: r(Math.sqrt(e.area) / unit, 3),
        perCell: e.perCell,
        outline: e.poly.map(
          (q) =>
            [r((q.x - cx) / unit, 3), r(-(q.y - cy) / unit, 3)] as [
              number,
              number,
            ],
        ),
      };
    }),
    neighbours: multiset(nb),
    corners: multiset(cn),
    patch,
  });
  void area;
}

// Group: same shapes first, then split by proportions and neighbours.
const shapesOf = (o: Out) =>
  o.shapes
    .map((s) => s.key)
    .sort()
    .join(' ; ');
const propOf = (o: Out) =>
  o.shapes
    .map((s) => `${s.key}=${r(s.cover, 2)}`)
    .sort()
    .join(' ; ');
const fullOf = (o: Out) => `${propOf(o)} # ${o.neighbours} # ${o.corners}`;
const groups = new Map<string, Out[]>();
for (const o of all)
  groups.set(shapesOf(o), [...(groups.get(shapesOf(o)) ?? []), o]);
const result = [...groups.values()]
  .filter((g) => g.length > 1)
  .map((g) => {
    const level =
      new Set(g.map(fullOf)).size === 1
        ? 'same'
        : new Set(g.map(propOf)).size === 1
          ? 'arranged'
          : 'proportions';
    // Split into subsets that agree fully.
    const sub = new Map<string, string[]>();
    for (const o of g)
      sub.set(fullOf(o), [...(sub.get(fullOf(o)) ?? []), o.id]);
    // Each pair: which of the three checks it passes.
    const pairs = g.flatMap((a, i) =>
      g.slice(i + 1).map((b) => ({
        a: a.id,
        b: b.id,
        proportions: propOf(a) === propOf(b),
        neighbours: a.neighbours === b.neighbours && a.corners === b.corners,
      })),
    );
    return { level, pairs, members: g };
  })
  .sort(
    (a, b) =>
      ['same', 'arranged', 'proportions'].indexOf(a.level) -
        ['same', 'arranged', 'proportions'].indexOf(b.level) ||
      b.members.length - a.members.length,
  );
writeFileSync(
  OUT,
  JSON.stringify({
    familyTitles,
    made: new Date().toISOString().slice(0, 10),
    count: all.length,
    groups: result,
  }),
);
for (const g of result)
  console.log(
    g.level.padEnd(12),
    g.members.map((m) => m.id).join(' | '),
    g.level === 'same'
      ? ''
      : g.pairs
          .map(
            (p) =>
              `\n    ${p.a} / ${p.b}: proportions ${p.proportions}, neighbours ${p.neighbours}`,
          )
          .join(''),
  );
