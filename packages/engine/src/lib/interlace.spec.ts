import { evaluate } from './evaluate.js';
import { weave, type Weave } from './interlace.js';
import { computePattern, type Cell } from './pieces.js';
import { segment } from './shapes.js';
import { loadTutorial, tutorialFiles } from '../test/tutorials.js';

const square: Cell = {
  origin: { x: 0, y: 0 },
  u: { x: 1, y: 0 },
  v: { x: 0, y: 1 },
  corners: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
  ],
  area: 1,
};

const parallel = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.abs(a.x * b.y - a.y * b.x) < 1e-6;

type Vec2 = { x: number; y: number };
const sub = (a: Vec2, b: Vec2) => ({ x: a.x - b.x, y: a.y - b.y });
const dotp = (a: Vec2, b: Vec2) => a.x * b.x + a.y * b.y;
const crossp = (a: Vec2, b: Vec2) => a.x * b.y - a.y * b.x;
const unit = (a: Vec2) => {
  const l = Math.hypot(a.x, a.y);
  return { x: a.x / l, y: a.y / l };
};

const pathLength = (path: readonly Vec2[]) =>
  path
    .slice(1)
    .reduce(
      (sum, q, k) =>
        sum + Math.hypot(...Object.values(sub(q, path[k] as Vec2))),
      0,
    );

/**
 * Checks the weave from the ink alone, by following each band: from every
 * crossing, along its top band and along its bottom band, past bends, to
 * the next crossing. The band must swap there: on top at one end, under
 * at the other. Returns how many such pairs it checked.
 */
function checkAlternation(
  w: Weave,
  ink: readonly { a: Vec2; b: Vec2 }[],
  cell: Cell,
): number {
  const [m, n] = w.repeat;
  const { u, v } = cell;
  const shift = (p: Vec2, i: number, j: number) => ({
    x: p.x + u.x * i + v.x * j,
    y: p.y + u.y * i + v.y * j,
  });
  const R = 1;
  const segs: { a: Vec2; b: Vec2 }[] = [];
  const crossings: { at: Vec2; over: Vec2 }[] = [];
  const flats: Vec2[] = [];
  for (let i = -R; i <= R + m; i++)
    for (let j = -R; j <= R + n; j++) {
      for (const s of ink)
        segs.push({ a: shift(s.a, i, j), b: shift(s.b, i, j) });
      for (const c of w.crossings)
        if (c.i === ((i % m) + m) % m && c.j === ((j % n) + n) % n)
          crossings.push({ at: shift(c.at, i - c.i, j - c.j), over: c.over });
      for (const f of w.flat) flats.push(shift(f, i, j));
    }
  const onRay = (p: Vec2, from: Vec2, dir: Vec2) => {
    const d = sub(p, from);
    const t = dotp(d, dir);
    return t > 1e-6 && Math.abs(crossp(dir, d)) < 1e-6 ? t : Infinity;
  };
  /** The next crossing along a band from a point, and the direction the
   * band arrives in; undefined at a flat point or a dead end. */
  const follow = (start: Vec2, first: Vec2) => {
    let at = start;
    let dir = first;
    for (let step = 0; step < 100; step++) {
      // How far the band runs straight on from here.
      let run = 0;
      for (let grew = true; grew;) {
        grew = false;
        for (const s of segs) {
          if (Math.abs(crossp(dir, sub(s.b, s.a))) > 1e-6) continue;
          const ta = dotp(sub(s.a, at), dir);
          const tb = dotp(sub(s.b, at), dir);
          if (Math.abs(crossp(dir, sub(s.a, at))) > 1e-6) continue;
          const lo = Math.min(ta, tb);
          const hi = Math.max(ta, tb);
          if (lo <= run + 1e-6 && hi > run + 1e-6) {
            run = hi;
            grew = true;
          }
        }
      }
      const tc = Math.min(...crossings.map((c) => onRay(c.at, at, dir)));
      const tf = Math.min(...flats.map((f) => onRay(f, at, dir)));
      if (tc <= run + 1e-6 && tc <= tf) {
        const hit = crossings.find((c) => onRay(c.at, at, dir) === tc);
        return hit ? { hit, dir } : undefined;
      }
      if (tf <= run + 1e-6) return undefined;
      // A bend at the end of the run: the one band leaving it.
      const end = { x: at.x + dir.x * run, y: at.y + dir.y * run };
      const away: Vec2[] = [];
      for (const s of segs)
        for (const [p, q] of [
          [s.a, s.b],
          [s.b, s.a],
        ] as const)
          if (Math.hypot(p.x - end.x, p.y - end.y) < 1e-6) {
            const d = unit(sub(q, p));
            if (
              dotp(d, dir) > -1 + 1e-6 &&
              !away.some((x) => Math.hypot(x.x - d.x, x.y - d.y) < 1e-6)
            )
              away.push(d);
          }
      if (away.length !== 1) return undefined;
      at = end;
      dir = away[0] as Vec2;
    }
    return undefined;
  };
  let checked = 0;
  for (const c of crossings.filter((x) =>
    w.crossings.some(
      (y) => Math.hypot(y.at.x - x.at.x, y.at.y - x.at.y) < 1e-9,
    ),
  ))
    for (const top of [true, false])
      for (const sign of [1, -1]) {
        const base = top
          ? c.over
          : (w.crossings.find(
              (y) => Math.hypot(y.at.x - c.at.x, y.at.y - c.at.y) < 1e-9,
            )?.under as Vec2);
        const dir = { x: base.x * sign, y: base.y * sign };
        const next = follow(c.at, dir);
        if (!next) continue;
        const onTopThere = parallel(next.hit.over, next.dir);
        expect(onTopThere).toBe(!top);
        checked++;
      }
  return checked;
}

describe('weave', () => {
  it('weaves a square grid as a checkerboard over two tiles each way', () => {
    const w = weave(
      [
        segment({ x: 0, y: 0.5 }, { x: 1, y: 0.5 }),
        segment({ x: 0.5, y: 0 }, { x: 0.5, y: 1 }),
      ],
      square,
    );
    expect(w.repeat).toEqual([2, 2]);
    expect(w.crossings).toHaveLength(4);
    expect(w.flat).toEqual([]);
    const horizontalOnTop = (i: number, j: number) => {
      const c = w.crossings.find((x) => x.i === i && x.j === j);
      return Math.abs(c?.over.y ?? 1) < 1e-9;
    };
    expect(horizontalOnTop(0, 0)).toBe(horizontalOnTop(1, 1));
    expect(horizontalOnTop(0, 1)).toBe(horizontalOnTop(1, 0));
    expect(horizontalOnTop(0, 0)).not.toBe(horizontalOnTop(0, 1));
  });

  it('follows a band through points where its ink was only cut', () => {
    // The same grid as above, each line cut into many short pieces.
    const pieces = (a: Vec2, b: Vec2, n: number) =>
      Array.from({ length: n }, (_, k) =>
        segment(
          { x: a.x + ((b.x - a.x) * k) / n, y: a.y + ((b.y - a.y) * k) / n },
          {
            x: a.x + ((b.x - a.x) * (k + 1)) / n,
            y: a.y + ((b.y - a.y) * (k + 1)) / n,
          },
        ),
      );
    const w = weave(
      [
        ...pieces({ x: 0, y: 0.5 }, { x: 1, y: 0.5 }, 7),
        ...pieces({ x: 0.5, y: 0 }, { x: 0.5, y: 1 }, 9),
      ],
      square,
    );
    expect(w.repeat).toEqual([2, 2]);
    expect(w.crossings).toHaveLength(4);
    expect(w.flat).toEqual([]);
    // The next crossing along every band is one tile away: each crossing
    // may redraw its top band halfway there, either way.
    for (const c of w.crossings) {
      expect(pathLength(c.ahead)).toBeCloseTo(0.5, 9);
      expect(pathLength(c.behind)).toBeCloseTo(0.5, 9);
    }
  });

  it('follows the top band round its bends', () => {
    // A square grid of zigzags: two bands cross at (0.5, 0.5), each with a
    // bend a short way off; the paths turn there.
    const w = weave(
      [
        segment({ x: 0, y: 0.5 }, { x: 0.45, y: 0.5 }),
        segment({ x: 0.45, y: 0.5 }, { x: 0.6, y: 0.5 }),
        segment({ x: 0.6, y: 0.5 }, { x: 0.7, y: 0.6 }),
        segment({ x: 0.7, y: 0.6 }, { x: 0.8, y: 0.5 }),
        segment({ x: 0.8, y: 0.5 }, { x: 1, y: 0.5 }),
        segment({ x: 0.5, y: 0 }, { x: 0.5, y: 1 }),
      ],
      square,
    );
    // Where the horizontal band is on top, its path to the right goes
    // up and down the bend, halfway along the band to the next crossing
    // (one tile on, the band being 0.8 + 0.2√2 long in each tile).
    const along = w.crossings.find((c) => Math.abs(c.over.y) < 1e-9);
    const right = along && (along.over.x > 0 ? along.ahead : along.behind);
    const start = right?.[0] as Vec2;
    expect(right?.map((q) => sub(q, start))).toContainEqual(
      expect.objectContaining({
        x: expect.closeTo(0.2, 9),
        y: expect.closeTo(0.1, 9),
      }),
    );
    expect(pathLength(right ?? [])).toBeCloseTo(
      (0.8 + 0.2 * Math.SQRT2) / 2,
      9,
    );
  });

  it('leaves a point where three bands cross flat', () => {
    const w = weave(
      [
        segment({ x: 0, y: 0.5 }, { x: 1, y: 0.5 }),
        segment({ x: 0.5, y: 0 }, { x: 0.5, y: 1 }),
        segment({ x: 0, y: 0 }, { x: 1, y: 1 }),
      ],
      square,
    );
    expect(w.flat).toContainEqual({ x: 0.5, y: 0.5 });
  });

  it('does not cross at a bend', () => {
    // A zigzag: every vertex is a bend, so nothing weaves.
    const w = weave(
      [
        segment({ x: 0, y: 0.25 }, { x: 0.5, y: 0.75 }),
        segment({ x: 0.5, y: 0.75 }, { x: 1, y: 0.25 }),
      ],
      square,
    );
    expect(w.crossings).toEqual([]);
    expect(w.flat).toEqual([]);
  });

  it('swaps at a flat crossing where one band bends', () => {
    // The column bends while crossing the lower row. Ignoring that
    // crossing makes the two rows ask for incompatible alternation.
    const w = weave(
      [
        segment({ x: 0, y: 0.25 }, { x: 1, y: 0.25 }),
        segment({ x: 0, y: 0.75 }, { x: 1, y: 0.75 }),
        segment({ x: 0.75, y: 0 }, { x: 0.75, y: 1 }),
        segment({ x: 0.25, y: 0 }, { x: 0.25, y: 0.2 }),
        segment({ x: 0.25, y: 0.2 }, { x: 0.3, y: 0.25 }),
        segment({ x: 0.3, y: 0.25 }, { x: 0.25, y: 0.3 }),
        segment({ x: 0.25, y: 0.3 }, { x: 0.25, y: 1 }),
      ],
      square,
    );
    expect(w.broken).toBe(0);
    expect(w.repeat).toEqual([1, 1]);
    expect(w.crossings).toHaveLength(3);
    expect(w.flat).toHaveLength(1);
    expect(w.flat[0]?.x).toBeCloseTo(0.3, 9);
    expect(w.flat[0]?.y).toBeCloseTo(0.25, 9);
  });

  it('does not swap where a bending band only touches a straight one', () => {
    // The diamond touches both rows. Their single crossings with the
    // column still need a two-cell repeat along the rows.
    const w = weave(
      [
        segment({ x: 0, y: 0.25 }, { x: 1, y: 0.25 }),
        segment({ x: 0, y: 0.75 }, { x: 1, y: 0.75 }),
        segment({ x: 0.75, y: 0 }, { x: 0.75, y: 1 }),
        segment({ x: 0.25, y: 0.25 }, { x: 0.4, y: 0.5 }),
        segment({ x: 0.4, y: 0.5 }, { x: 0.25, y: 0.75 }),
        segment({ x: 0.25, y: 0.75 }, { x: 0.1, y: 0.5 }),
        segment({ x: 0.1, y: 0.5 }, { x: 0.25, y: 0.25 }),
      ],
      square,
    );
    expect(w.broken).toBe(0);
    expect(w.repeat).toEqual([2, 1]);
    expect(w.flat).toHaveLength(2);
  });

  let followed = 0;
  describe.each(tutorialFiles())('%s', (file) => {
    it('alternates whole bands and reports interrupted strands', () => {
      const t = loadTutorial(file);
      const p = computePattern(evaluate(t), t);
      const w = weave(
        p.ink.map((s) => s.segment),
        p.cell,
      );
      // TAI1's divided kites have fourteen degree-three junctions. Its
      // interrupted strands cannot all alternate once bending crossings
      // are counted; the source also states that it fails two-colouring.
      // Closed runs are still checked by following them below. Every
      // other library net must continue to have no broken constraints.
      if (file === 'museum-divided-stars.json')
        expect(w.broken).toBeGreaterThan(0);
      else expect(w.broken).toBe(0);
      // Each top band can be redrawn some way either side of its crossing:
      // its paths follow it past bends and cuts in the ink (Bou Inania's
      // ink is cut every few hundredths), so they are never tiny. The bar
      // stops at 0.2 because a big cell still has short runs: the Comares
      // west dado's cell is 30 wide and its shortest run is 1 − √2/2.
      const xs = p.cell.corners.map((q) => q.x);
      const size = Math.min(Math.max(...xs) - Math.min(...xs), 20);
      for (const c of w.crossings) {
        expect(Math.hypot(c.over.x, c.over.y)).toBeCloseTo(1, 9);
        expect(parallel(c.over, c.under)).toBe(false);
        for (const path of [c.ahead, c.behind]) {
          expect(path[0]).toEqual(c.at);
          expect(pathLength(path)).toBeGreaterThan(size * 0.01);
        }
        expect(parallel(sub(c.ahead[1] as Vec2, c.at), c.over)).toBe(true);
      }
      // Followed from the ink alone, each band swaps from crossing to
      // crossing; every tutorial with crossings has bands to follow.
      const checked = checkAlternation(
        w,
        p.ink.map((s) => s.segment),
        p.cell,
      );
      followed += checked;
    }, 60_000);
  });

  // The library has a few hundred crossings, each with four bands to
  // follow, so the check above is not empty.
  afterAll(() => expect(followed).toBeGreaterThan(1000));
});
