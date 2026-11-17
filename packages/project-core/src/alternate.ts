import type { Pattern } from '@tastir/engine';

/**
 * Copies of one shape that touch take turns between two colours (STYLE.2,
 * owner's choice of 17 November 2026). Where a pattern is coloured by
 * shape, every copy of a shape shared one colour, so copies that touch
 * merged into one field (Museum divided stars, Shafai rosettes).
 *
 * The copies of a shape that touch form a graph over the cells. Over the
 * smallest repeat (one or two cells along each slide) in which that graph
 * splits into two sides, one side keeps the shape's colour and the other
 * takes a second one. A shape whose copies cannot split that way (three
 * that touch in a ring) keeps one colour.
 */
export interface Alternation {
  /** How many cells along each slide the turns repeat after. */
  readonly repeat: readonly [number, number];
  /** Whether a placement takes the second colour. */
  readonly second: (piece: number, i: number, j: number) => boolean;
  /** The piece types whose copies take turns. */
  readonly types: ReadonlySet<number>;
}

const mod = (a: number, n: number) => ((a % n) + n) % n;
const cache = new WeakMap<Pattern, Alternation | null>();

/** The copies of one shape that share a side: piece k in the cell and
 * piece l in the cell moved by (di, dj). */
function touchingCopies(pattern: Pattern) {
  const { u, v } = pattern.cell;
  const key = (x: number, y: number) => `${x.toFixed(4)},${y.toFixed(4)}`;
  const sides = new Map<string, { k: number; i: number; j: number }[]>();
  for (let i = -1; i <= 1; i++)
    for (let j = -1; j <= 1; j++)
      pattern.pieces.forEach((p, k) => {
        const dx = u.x * i + v.x * j;
        const dy = u.y * i + v.y * j;
        const ps = p.polygon.map((q) => key(q.x + dx, q.y + dy));
        ps.forEach((a, n) => {
          const b = ps[(n + 1) % ps.length] ?? a;
          const side = a < b ? `${a}|${b}` : `${b}|${a}`;
          const list = sides.get(side) ?? [];
          list.push({ k, i, j });
          sides.set(side, list);
        });
      });
  const out: { k: number; l: number; di: number; dj: number }[] = [];
  const seen = new Set<string>();
  for (const list of sides.values()) {
    const [a, b] = list;
    if (list.length !== 2 || !a || !b) continue;
    const ta = pattern.pieces[a.k]?.type;
    if (ta === undefined || ta !== pattern.pieces[b.k]?.type) continue;
    // Seen from the copy of a in the central cell.
    const edge = { k: a.k, l: b.k, di: b.i - a.i, dj: b.j - a.j };
    const id = `${edge.k},${edge.l},${edge.di},${edge.dj}`;
    if (!seen.has(id)) {
      seen.add(id);
      out.push(edge);
    }
  }
  return out;
}

/** The turns over one repeat, or undefined where some copies cannot split. */
function split(
  pattern: Pattern,
  edges: readonly { k: number; l: number; di: number; dj: number }[],
  [m, n]: readonly [number, number],
): Map<string, number> | undefined {
  const node = (k: number, a: number, b: number) =>
    `${k}@${mod(a, m)},${mod(b, n)}`;
  const next = new Map<string, string[]>();
  const link = (x: string, y: string) => {
    next.set(x, [...(next.get(x) ?? []), y]);
  };
  for (const { k, l, di, dj } of edges)
    for (let a = 0; a < m; a++)
      for (let b = 0; b < n; b++) {
        const x = node(k, a, b);
        const y = node(l, a + di, b + dj);
        if (x === y) return undefined;
        link(x, y);
        link(y, x);
      }
  const side = new Map<string, number>();
  for (const start of next.keys()) {
    if (side.has(start)) continue;
    side.set(start, 0);
    const queue = [start];
    while (queue.length) {
      const x = queue.shift() as string;
      const s = side.get(x) ?? 0;
      for (const y of next.get(x) ?? []) {
        const t = side.get(y);
        if (t === undefined) {
          side.set(y, 1 - s);
          queue.push(y);
        } else if (t === s) return undefined;
      }
    }
  }
  return side;
}

/** The pattern's alternation, or undefined when no copies of a shape touch
 * or they cannot take turns. */
export function alternationOf(pattern: Pattern): Alternation | undefined {
  const hit = cache.get(pattern);
  if (hit !== undefined) return hit ?? undefined;
  const edges = touchingCopies(pattern);
  // Each shape on its own: one whose copies cannot split keeps one colour
  // without stopping the others.
  const byType = new Map<number, typeof edges>();
  for (const e of edges) {
    const t = pattern.pieces[e.k]?.type;
    if (t !== undefined) byType.set(t, [...(byType.get(t) ?? []), e]);
  }
  const sides = new Map<
    number,
    { side: Map<string, number>; m: number; n: number }
  >();
  for (const [t, list] of byType)
    for (const [m, n] of [
      [1, 1],
      [2, 1],
      [1, 2],
      [2, 2],
    ] as const) {
      const side = split(pattern, list, [m, n]);
      if (side) {
        sides.set(t, { side, m, n });
        break;
      }
    }
  let found: Alternation | undefined;
  if (sides.size) {
    const repeat: [number, number] = [1, 1];
    for (const { m, n } of sides.values()) {
      repeat[0] = Math.max(repeat[0], m);
      repeat[1] = Math.max(repeat[1], n);
    }
    found = {
      repeat,
      types: new Set(sides.keys()),
      second: (piece, i, j) => {
        const t = pattern.pieces[piece]?.type;
        const own = t === undefined ? undefined : sides.get(t);
        return own
          ? own.side.get(`${piece}@${mod(i, own.m)},${mod(j, own.n)}`) === 1
          : false;
      },
    };
  }
  cache.set(pattern, found ?? null);
  return found;
}
