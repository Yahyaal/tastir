import type { Pattern, Piece, Vec } from '@tastir/engine';

/**
 * Colouring by ring, as on real zellige: round each rosette the pieces
 * take colours ring by ring outward from its centre, not by their shape;
 * neighbouring rosettes take turns between colour families; tiny pieces
 * are black; the pieces as far from two rosettes of different families
 * are white or black; and each centre is a spark of the next family's
 * colour. This file finds the rings and gives each piece a role; the
 * palette's glazes (coloring.ts) turn a role and a family into a colour.
 */

export type RingRole = 'white' | 'black' | 'main' | 'second' | 'spark';

/** Where one piece of the repeat sits among the rings. */
export interface RingPlace {
  /** The ring it is in, the same for every piece of that ring: what the
   * learner repaints, and what a placement colour is kept under. */
  readonly ring: string;
  /** Its ring number among the rings of its shape, nearest the centre
   * first (from 1), or 0 for a piece between rosettes. */
  readonly n: number;
  /** Its rosette's family, or -1 between rosettes of different ones. */
  readonly family: number;
  readonly role: RingRole;
}

export interface Rings {
  /** How many cells along each slide the families repeat after. */
  readonly repeat: readonly [number, number];
  /** How many families take turns. */
  readonly families: number;
  /** A piece of the cell, in cell (i, j) of the repeat (any integers). */
  place(piece: number, i: number, j: number): RingPlace;
}

const mod = (a: number, n: number) => ((a % n) + n) % n;

const centreOf = (ps: readonly Vec[]): Vec => {
  const n = ps.length;
  return ps.reduce((a, p) => ({ x: a.x + p.x / n, y: a.y + p.y / n }), {
    x: 0,
    y: 0,
  });
};

/**
 * A piece's fold when it is a regular polygon or star (its corners evenly
 * spaced round its centre, at one radius or two alternating), else 0.
 */
export function foldOf(piece: Piece): number {
  const ps = piece.polygon;
  const n = ps.length;
  if (n < 3) return 0;
  const c = centreOf(ps);
  const r = ps.map((p) => Math.hypot(p.x - c.x, p.y - c.y));
  const a = ps
    .map((p) => Math.atan2(p.y - c.y, p.x - c.x))
    .sort((x, y) => x - y);
  const step = (2 * Math.PI) / n;
  for (let k = 0; k < n; k++) {
    const next =
      k + 1 < n ? (a[k + 1] as number) : (a[0] as number) + 2 * Math.PI;
    if (Math.abs(next - (a[k] as number) - step) > 0.03) return 0;
  }
  const near = (x: number, y: number) =>
    Math.abs(x - y) <= 0.02 * Math.max(x, y);
  if (r.every((x) => near(x, r[0] as number))) return n;
  if (n % 2 === 0 && r.every((x, k) => near(x, r[(k + 2) % n] as number)))
    return n / 2;
  return 0;
}

/**
 * The type whose pieces are the rosettes' centres: the regular one with
 * the most fold (five at least), a star before a plain polygon of the same
 * fold (the octagon round an eight-pointed star is a ring, not the
 * centre), the larger first.
 */
export function centreType(pattern: Pattern): number | undefined {
  let best: { t: number; score: number; area: number } | undefined;
  for (const piece of pattern.pieces) {
    const fold = foldOf(piece);
    if (fold < 5) continue;
    const score = fold + (piece.polygon.length === 2 * fold ? 0.5 : 0);
    const area = pattern.types[piece.type]?.area ?? 0;
    if (
      !best ||
      score > best.score ||
      (score === best.score && area > best.area)
    )
      best = { t: piece.type, score, area };
  }
  return best?.t;
}

/**
 * The family of each centre of the cell in each cell of the repeat, so
 * that no two neighbouring rosettes share one: two families over 2×2
 * cells where the rosettes can alternate (a square lattice), else three
 * over 3×3 (a hexagonal one, where three rosettes all touch).
 */
function familiesOf(
  pattern: Pattern,
  centres: readonly Vec[],
): { repeat: [number, number]; count: number; of: number[][][] } {
  const { u, v } = pattern.cell;
  const at = (k: number, i: number, j: number): Vec => {
    const c = centres[k] as Vec;
    return { x: c.x + i * u.x + j * v.x, y: c.y + i * u.y + j * v.y };
  };
  // Neighbouring rosettes: those nearest each other.
  let nearest = Infinity;
  const offsets: [number, number][] = [];
  for (let i = -2; i <= 2; i++)
    for (let j = -2; j <= 2; j++) offsets.push([i, j]);
  centres.forEach((_, k) =>
    centres.forEach((_, l) =>
      offsets.forEach(([i, j]) => {
        if (k === l && i === 0 && j === 0) return;
        const a = at(k, 0, 0);
        const b = at(l, i, j);
        nearest = Math.min(nearest, Math.hypot(a.x - b.x, a.y - b.y));
      }),
    ),
  );
  const tries: [number, number][] = [
    [2, 2],
    [3, 3],
  ];
  for (const [size, count] of tries) {
    // The rosettes of the repeat, each with its neighbours.
    const id = (k: number, i: number, j: number) =>
      (k * size + mod(i, size)) * size + mod(j, size);
    const nodes = centres.length * size * size;
    const next: Set<number>[] = Array.from({ length: nodes }, () => new Set());
    let loop = false;
    centres.forEach((_, k) => {
      for (let i = 0; i < size; i++)
        for (let j = 0; j < size; j++)
          centres.forEach((_, l) =>
            offsets.forEach(([di, dj]) => {
              if (k === l && di === 0 && dj === 0) return;
              const a = at(k, i, j);
              const b = at(l, i + di, j + dj);
              if (Math.hypot(a.x - b.x, a.y - b.y) > 1.05 * nearest) return;
              const p = id(k, i, j);
              const q = id(l, i + di, j + dj);
              if (p === q) loop = true;
              next[p]?.add(q);
            }),
          );
    });
    if (loop) continue;
    // Colour the rosettes, trying each family in turn.
    const family = new Array<number>(nodes).fill(-1);
    const colour = (p: number): boolean => {
      if (p === nodes) return true;
      for (let f = 0; f < count; f++) {
        if ([...(next[p] ?? [])].some((q) => family[q] === f)) continue;
        family[p] = f;
        if (colour(p + 1)) return true;
      }
      family[p] = -1;
      return false;
    };
    if (nodes > 64 || !colour(0)) continue;
    return {
      repeat: [size, size],
      count,
      of: centres.map((_, k) =>
        Array.from({ length: size }, (_, i) =>
          Array.from({ length: size }, (_, j) => family[id(k, i, j)] as number),
        ),
      ),
    };
  }
  // No turn-taking found: one family.
  return { repeat: [1, 1], count: 1, of: centres.map(() => [[0]]) };
}

const cache = new WeakMap<Pattern, Rings | null>();

/**
 * The rings of a pattern, or undefined when it has no rosette to colour
 * round (no regular star or polygon of five or more points).
 */
export function ringsOf(pattern: Pattern): Rings | undefined {
  const hit = cache.get(pattern);
  if (hit !== undefined) return hit ?? undefined;
  const found = findRings(pattern);
  cache.set(pattern, found ?? null);
  return found;
}

function findRings(pattern: Pattern): Rings | undefined {
  const { cell, pieces, types } = pattern;
  const centre = centreType(pattern);
  if (centre === undefined) return undefined;
  const centres = pieces
    .filter((p) => p.type === centre)
    .map((p) => centreOf(p.polygon));
  const fam = familiesOf(pattern, centres);
  const [m, n] = fam.repeat;
  const scale = Math.sqrt(Math.abs(cell.area)) || 1;
  const eps = 1e-3 * scale;
  const at = (p: Vec, i: number, j: number): Vec => ({
    x: p.x + i * cell.u.x + j * cell.v.x,
    y: p.y + i * cell.u.y + j * cell.v.y,
  });

  // Every rosette centre round the repeat, with its family.
  const around: { at: Vec; family: number }[] = [];
  centres.forEach((c, k) => {
    for (let i = -2; i < m + 2; i++)
      for (let j = -2; j < n + 2; j++)
        around.push({
          at: at(c, i, j),
          family: fam.of[k]?.[mod(i, m)]?.[mod(j, n)] ?? 0,
        });
  });

  const cover = (t: number) => (types[t]?.area ?? 0) * (types[t]?.perCell ?? 0);
  const total = types.reduce((s, _, t) => s + cover(t), 0);
  const centreArea = types[centre]?.area ?? 0;
  // Tiny pieces: small beside the centre and a small share of the wall.
  const tiny = (t: number) =>
    t !== centre &&
    (types[t]?.area ?? 0) < 0.2 * centreArea &&
    cover(t) < 0.06 * total;

  // Each placement (piece k in cell i, j of the repeat): its distance to
  // the nearest centre, and that centre's family, or -1 when a centre of
  // another family is as near.
  interface Place {
    type: number;
    d: number;
    family: number;
    orbit: string;
  }
  const places: Place[] = [];
  const placeId = (k: number, i: number, j: number) =>
    (k * m + mod(i, m)) * n + mod(j, n);
  for (let k = 0; k < pieces.length; k++)
    for (let i = 0; i < m; i++)
      for (let j = 0; j < n; j++) {
        const p = pieces[k] as Piece;
        const c = at(centreOf(p.polygon), i, j);
        let first = { d: Infinity, f: 0 };
        for (const x of around) {
          const d = Math.hypot(x.at.x - c.x, x.at.y - c.y);
          if (d < first.d) first = { d, f: x.family };
        }
        let other = Infinity;
        for (const x of around)
          if (x.family !== first.f)
            other = Math.min(other, Math.hypot(x.at.x - c.x, x.at.y - c.y));
        const family = other - first.d < 5 * eps ? -1 : first.f;
        const ring = Math.round(first.d / (20 * eps));
        places[placeId(k, i, j)] = {
          type: p.type,
          d: first.d,
          family,
          orbit: `${p.type}:${ring}:${family < 0 ? 'between' : 'in'}`,
        };
      }

  // The rings, nearest the centre first, and their roles: the centre a
  // spark, then outward main colour, second colour, white, and again.
  const orbits = new Map<
    string,
    { type: number; d: number; between: boolean }
  >();
  for (const p of places)
    if (!orbits.has(p.orbit))
      orbits.set(p.orbit, { type: p.type, d: p.d, between: p.family < 0 });
  const inRings = [...orbits]
    .filter(([, o]) => !o.between && !tiny(o.type))
    .sort((a, b) => a[1].d - b[1].d)
    .map(([key]) => key);
  const betweenRings = [...orbits]
    .filter(([, o]) => o.between && !tiny(o.type))
    .sort((a, b) => cover(b[1].type) - cover(a[1].type))
    .map(([key]) => key);
  const role = new Map<string, RingRole>();
  for (const [key, o] of orbits) {
    if (tiny(o.type)) role.set(key, 'black');
    else if (o.between)
      role.set(key, betweenRings.indexOf(key) % 2 === 0 ? 'white' : 'black');
    else if (o.type === centre) role.set(key, 'spark');
    else {
      const r = inRings.indexOf(key) - 1;
      const step = mod(r, 3);
      role.set(key, step === 0 ? 'main' : step === 1 ? 'second' : 'white');
    }
  }

  // Two rings of one colour do not touch: the farther one turns white.
  const colourOf = (p: Place): string | undefined => {
    const r = role.get(p.orbit);
    if (r === 'main') return `${p.family}:0`;
    if (r === 'second') return `${p.family}:1`;
    if (r === 'spark') return `${mod(p.family + 1, fam.count)}:0`;
    return undefined;
  };
  const vertex = (q: Vec) =>
    `${Math.round(q.x / eps)},${Math.round(q.y / eps)}`;
  const sides = new Map<string, number[]>();
  for (let k = 0; k < pieces.length; k++)
    for (let i = -1; i <= m; i++)
      for (let j = -1; j <= n; j++) {
        const ps = (pieces[k] as Piece).polygon.map((q) => at(q, i, j));
        ps.forEach((q, e) => {
          const a = vertex(q);
          const b = vertex(ps[(e + 1) % ps.length] as Vec);
          const side = a < b ? `${a}|${b}` : `${b}|${a}`;
          const list = sides.get(side) ?? [];
          list.push(placeId(k, i, j));
          sides.set(side, list);
        });
      }
  const order = new Map(inRings.map((key, r) => [key, r]));
  for (const list of sides.values()) {
    if (list.length < 2) continue;
    const [p, q] = list.map((id) => places[id] as Place);
    if (!p || !q || p.orbit === q.orbit) continue;
    const cp = colourOf(p);
    if (cp === undefined || cp !== colourOf(q)) continue;
    const far = (order.get(p.orbit) ?? -1) > (order.get(q.orbit) ?? -1) ? p : q;
    if (role.get(far.orbit) !== 'spark') role.set(far.orbit, 'white');
  }

  // Ring numbers by shape, nearest first, for the tutorial's corrections.
  const numbers = new Map<string, number>();
  for (const t of types.keys()) {
    const own = [...orbits]
      .filter(([, o]) => o.type === t && !o.between)
      .sort((a, b) => a[1].d - b[1].d);
    own.forEach(([key], r) => numbers.set(key, r + 1));
  }

  return {
    repeat: [m, n],
    families: fam.count,
    place(piece, i, j) {
      const p = places[placeId(piece, i, j)] as Place;
      const number = numbers.get(p.orbit) ?? 0;
      return {
        ring: `${p.orbit}/${p.family}`,
        n: number,
        family: p.family,
        role: role.get(p.orbit) ?? 'white',
      };
    },
  };
}
