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
  /** How many families there are: the rosettes', and one more for the
   * filler stars between them when there are any. */
  readonly families: number;
  /** How many families the rosettes take turns between. */
  readonly rosettes: number;
  /** Rings that touch, by their keys, the one farther from its centre
   * second. */
  readonly touching: readonly (readonly [string, string])[];
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
 * A piece's fold: the most times it turns into itself about its centre in
 * a full turn (a regular star or polygon, but also a cross or a pinwheel
 * star), or 1.
 */
export function foldOf(piece: Piece): number {
  const ps = piece.polygon;
  const n = ps.length;
  if (n < 3) return 1;
  const c = centreOf(ps);
  const size = Math.max(...ps.map((p) => Math.hypot(p.x - c.x, p.y - c.y)));
  const tol = 0.02 * size;
  for (let k = n; k >= 2; k--) {
    if (n % k !== 0) continue;
    const a = (2 * Math.PI) / k;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    const turned = ps.map((p) => ({
      x: c.x + (p.x - c.x) * cos - (p.y - c.y) * sin,
      y: c.y + (p.x - c.x) * sin + (p.y - c.y) * cos,
    }));
    if (
      turned.every((q) =>
        ps.some((p) => Math.hypot(p.x - q.x, p.y - q.y) <= tol),
      )
    )
      return k;
  }
  return 1;
}

/**
 * The type whose pieces are the rosettes' centres: the regular one with
 * the most fold, a star before a plain polygon of the same fold (the
 * octagon round an eight-pointed star is a ring, not the centre), the
 * larger first. A cross, a four-pointed star or even a shape that turns
 * into itself only twice counts when nothing turns more, as on the Nasrid
 * walls built of them, so their stars still take turns.
 */
export function centreType(pattern: Pattern): number | undefined {
  let best: { t: number; score: number; area: number } | undefined;
  for (const piece of pattern.pieces) {
    const fold = foldOf(piece);
    if (fold < 2) continue;
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

/**
 * The middles of the filler stars: the points of the rosettes' lattice
 * (halfway and a third of the way between rosettes, along and across) that are away from every rosette centre and round
 * which the nearby pieces turn into themselves three or more times.
 */
function fillerCentres(pattern: Pattern, centres: readonly Vec[]): Vec[] {
  const { cell, pieces } = pattern;
  const scale = Math.sqrt(Math.abs(cell.area)) || 1;
  const tol = 0.02 * scale;
  // Measured from a rosette centre, which the lattice repeats; the cell's
  // own corner need not be one of its points.
  const base = centres[0] ?? cell.origin;
  const at = (a: number, b: number): Vec => ({
    x: base.x + a * cell.u.x + b * cell.v.x,
    y: base.y + a * cell.u.y + b * cell.v.y,
  });
  const shifted: { type: number; at: Vec }[] = [];
  const rosettes: Vec[] = [];
  for (let i = -2; i <= 2; i++)
    for (let j = -2; j <= 2; j++) {
      const d = {
        x: i * cell.u.x + j * cell.v.x,
        y: i * cell.u.y + j * cell.v.y,
      };
      for (const p of pieces) {
        const c = centreOf(p.polygon);
        shifted.push({ type: p.type, at: { x: c.x + d.x, y: c.y + d.y } });
      }
      for (const c of centres) rosettes.push({ x: c.x + d.x, y: c.y + d.y });
    }
  let spacing = Infinity;
  for (const a of rosettes)
    for (const b of rosettes) {
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d > tol) spacing = Math.min(spacing, d);
    }
  if (!Number.isFinite(spacing)) spacing = scale;
  // The pieces by grid square, so looking one up near a point is quick.
  const grid = new Map<string, { type: number; at: Vec }[]>();
  const square = (x: number, y: number) =>
    `${Math.floor(x / (4 * tol))},${Math.floor(y / (4 * tol))}`;
  for (const s of shifted) {
    const key = square(s.at.x, s.at.y);
    const list = grid.get(key) ?? [];
    list.push(s);
    grid.set(key, list);
  }
  const pieceNear = (type: number, x: number, y: number) => {
    const gx = Math.floor(x / (4 * tol));
    const gy = Math.floor(y / (4 * tol));
    for (let i = gx - 1; i <= gx + 1; i++)
      for (let j = gy - 1; j <= gy + 1; j++)
        for (const o of grid.get(`${i},${j}`) ?? [])
          if (o.type === type && Math.hypot(o.at.x - x, o.at.y - y) < tol)
            return true;
    return false;
  };
  const fractions = [0, 1 / 3, 1 / 2, 2 / 3];
  const found: Vec[] = [];
  for (const a of fractions)
    for (const b of fractions) {
      const c = at(a, b);
      if (
        rosettes.some((r) => Math.hypot(r.x - c.x, r.y - c.y) < 0.2 * spacing)
      )
        continue;
      const near = shifted.filter(
        (s) => Math.hypot(s.at.x - c.x, s.at.y - c.y) < 0.45 * spacing,
      );
      if (near.length < 3) continue;
      const turns = [6, 4, 3].find((k) => {
        const cos = Math.cos((2 * Math.PI) / k);
        const sin = Math.sin((2 * Math.PI) / k);
        return near.every((s) => {
          const x = c.x + (s.at.x - c.x) * cos - (s.at.y - c.y) * sin;
          const y = c.y + (s.at.x - c.x) * sin + (s.at.y - c.y) * cos;
          return pieceNear(s.type, x, y);
        });
      });
      if (turns === undefined) continue;
      // The same point again one cell along is the same filler.
      const det = cell.u.x * cell.v.y - cell.u.y * cell.v.x;
      const same = found.some((f) => {
        const dx = c.x - f.x;
        const dy = c.y - f.y;
        const i = (dx * cell.v.y - dy * cell.v.x) / det;
        const j = (cell.u.x * dy - cell.u.y * dx) / det;
        return (
          Math.abs(i - Math.round(i)) < 1e-6 &&
          Math.abs(j - Math.round(j)) < 1e-6
        );
      });
      if (!same) found.push(c);
    }
  return found;
}

const cache = new WeakMap<Pattern, Rings | null>();

/**
 * The rings of a pattern, or undefined when it has no rosette to colour
 * round (no piece turns into itself).
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

  // The middles of the stars that fill the space between rosettes (the
  // four-pointed star between the Bou Inania rosettes): points of the
  // lattice, away from every rosette, round which the pieces turn into
  // themselves. Their pieces take rings of their own, in a family of
  // their own, instead of each taking the nearest rosette's colour.
  const fillers = fillerCentres(pattern, centres);
  const familyCount = fam.count + (fillers.length ? 1 : 0);

  // Every centre round the repeat, with its family.
  const around: { at: Vec; family: number }[] = [];
  centres.forEach((c, k) => {
    for (let i = -2; i < m + 2; i++)
      for (let j = -2; j < n + 2; j++)
        around.push({
          at: at(c, i, j),
          family: fam.of[k]?.[mod(i, m)]?.[mod(j, n)] ?? 0,
        });
  });
  for (const c of fillers)
    for (let i = -2; i < m + 2; i++)
      for (let j = -2; j < n + 2; j++)
        around.push({ at: at(c, i, j), family: fam.count });

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
  // The centres by grid square, a square about one rosette apart, so the
  // nearest centre and the nearest of another family are found by looking
  // round a piece's square, wider until both are found.
  const side =
    Math.sqrt(
      Math.abs(cell.area) / Math.max(1, centres.length + fillers.length),
    ) || 1;
  const gridOf = (list: readonly { at: Vec; family: number }[]) => {
    const grid = new Map<string, { at: Vec; family: number }[]>();
    for (const x of list) {
      const key = `${Math.floor(x.at.x / side)},${Math.floor(x.at.y / side)}`;
      const near = grid.get(key) ?? [];
      near.push(x);
      grid.set(key, near);
    }
    return grid;
  };
  const allSquares = gridOf(around);
  const rosetteSquares = gridOf(around.filter((x) => x.family < fam.count));
  const nearest = (c: Vec, squares = allSquares) => {
    const gx = Math.floor(c.x / side);
    const gy = Math.floor(c.y / side);
    let first = { d: Infinity, f: 0 };
    let other = Infinity;
    for (let r = 1; r <= 6; r++) {
      first = { d: Infinity, f: 0 };
      other = Infinity;
      const seen: { d: number; f: number }[] = [];
      for (let i = gx - r; i <= gx + r; i++)
        for (let j = gy - r; j <= gy + r; j++)
          for (const x of squares.get(`${i},${j}`) ?? [])
            seen.push({
              d: Math.hypot(x.at.x - c.x, x.at.y - c.y),
              f: x.family,
            });
      for (const x of seen) if (x.d < first.d) first = x;
      for (const x of seen) if (x.f !== first.f) other = Math.min(other, x.d);
      // Every centre within r squares is seen, so both are sure once the
      // farther of them is no more than r - 1 squares away.
      if (Math.max(first.d, other) <= (r - 1) * side) break;
    }
    return { first, other };
  };
  const places: Place[] = [];
  const placeId = (k: number, i: number, j: number) =>
    (k * m + mod(i, m)) * n + mod(j, n);
  for (let k = 0; k < pieces.length; k++)
    for (let i = 0; i < m; i++)
      for (let j = 0; j < n; j++) {
        const p = pieces[k] as Piece;
        const c = at(centreOf(p.polygon), i, j);
        const { first, other } = nearest(c);
        const family = other - first.d < 5 * eps ? -1 : first.f;
        const ring = Math.round(first.d / (20 * eps));
        places[placeId(k, i, j)] = {
          type: p.type,
          d: first.d,
          family,
          orbit: `${p.type}:${ring}:${
            family < 0 ? 'between' : family === fam.count ? 'filler' : 'in'
          }`,
        };
      }

  // A rosette's ring stays whole: when a filler star's middle is nearer
  // some pieces of a ring round a rosette than the rosette's own centre
  // (the outer shields of the Bou Inania rosette), those pieces still go
  // with their rosette, so the ring takes one colour all round.
  if (fillers.length) {
    const own = new Map<number, { d: number; family: number; ring: string }>();
    const kept = new Set<string>();
    for (let k = 0; k < pieces.length; k++)
      for (let i = 0; i < m; i++)
        for (let j = 0; j < n; j++) {
          const id = placeId(k, i, j);
          const c = at(centreOf((pieces[k] as Piece).polygon), i, j);
          const { first, other } = nearest(c, rosetteSquares);
          if (other - first.d < 5 * eps) continue;
          const ring = `${(pieces[k] as Piece).type}:${Math.round(first.d / (20 * eps))}`;
          own.set(id, { d: first.d, family: first.f, ring });
          if ((places[id] as Place).orbit.endsWith(':in')) kept.add(ring);
        }
    for (const [id, o] of own) {
      const p = places[id] as Place;
      if (p.family !== fam.count || !kept.has(o.ring)) continue;
      places[id] = { ...p, d: o.d, family: o.family, orbit: `${o.ring}:in` };
    }
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
  const filler = (key: string) => key.endsWith(':filler');
  const inRings = [...orbits]
    .filter(([key, o]) => !o.between && !tiny(o.type) && !filler(key))
    .sort((a, b) => a[1].d - b[1].d)
    .map(([key]) => key);
  const fillerRings = [...orbits]
    .filter(([key, o]) => !o.between && !tiny(o.type) && filler(key))
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
    else if (filler(key)) {
      // Outward from the filler's middle: its own colour, the second, white.
      const step = mod(fillerRings.indexOf(key), 3);
      role.set(key, step === 0 ? 'main' : step === 1 ? 'second' : 'white');
    } else if (o.type === centre) role.set(key, 'spark');
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

  // Rings that touch, as their keys, the farther from its centre second:
  // the colours a palette gives them are checked again when filling, as
  // two families' colours can be the same in some palettes.
  const ringKey = (p: Place) => `${p.orbit}/${p.family}`;
  const touchingPairs = new Map<string, [string, string]>();
  for (const list of sides.values()) {
    if (list.length < 2) continue;
    const [p, q] = list.map((id) => places[id] as Place);
    if (!p || !q || ringKey(p) === ringKey(q)) continue;
    const [near, far] = p.d <= q.d ? [p, q] : [q, p];
    const pair: [string, string] = [ringKey(near), ringKey(far)];
    touchingPairs.set(pair.join('|'), pair);
  }

  return {
    repeat: [m, n],
    families: familyCount,
    rosettes: fam.count,
    touching: [...touchingPairs.values()],
    place(piece, i, j) {
      const p = places[placeId(piece, i, j)] as Place;
      const number = numbers.get(p.orbit) ?? 0;
      return {
        ring: ringKey(p),
        n: number,
        family: p.family,
        role: role.get(p.orbit) ?? 'white',
      };
    },
  };
}

const fewer = new WeakMap<Rings, Map<number, Rings>>();

/**
 * The rings when only `count` rosettes take turns before the wall repeats
 * (1: every rosette alike), fewer than the lattice gives: the rosettes'
 * families fold onto the first `count`, and the filler stars' family comes
 * next. More than the lattice gives is the rings as they are.
 */
export function withRosettes(rings: Rings, count: number): Rings {
  const k = Math.max(1, Math.floor(count));
  if (k >= rings.rosettes) return rings;
  const kept = fewer.get(rings) ?? new Map<number, Rings>();
  fewer.set(rings, kept);
  const hit = kept.get(k);
  if (hit) return hit;
  const family = (f: number) =>
    f < 0 ? f : f < rings.rosettes ? f % k : k + (f - rings.rosettes);
  // A ring's key ends in its family (`orbit/family`).
  const key = (ring: string) => {
    const cut = ring.lastIndexOf('/');
    return `${ring.slice(0, cut)}/${family(Number(ring.slice(cut + 1)))}`;
  };
  const pairs = new Map<string, [string, string]>();
  for (const [near, far] of rings.touching) {
    const pair: [string, string] = [key(near), key(far)];
    if (pair[0] !== pair[1]) pairs.set(pair.join('|'), pair);
  }
  const folded: Rings = {
    repeat: rings.repeat,
    families: rings.families - rings.rosettes + k,
    rosettes: k,
    touching: [...pairs.values()],
    place(piece, i, j) {
      const at = rings.place(piece, i, j);
      return { ...at, ring: key(at.ring), family: family(at.family) };
    },
  };
  kept.set(k, folded);
  return folded;
}
