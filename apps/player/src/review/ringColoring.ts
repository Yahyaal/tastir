import type { Pattern, Piece, Vec } from '@tastir/engine';
import type { Coloring } from '../app/coloring';
import type { Model } from '../app/model';
import { placeKey } from '../app/placement';

/**
 * A rough first version of colouring by ring (#/plan/colors), from what
 * real zellige walls do: each rosette's pieces are coloured by their ring
 * (how far they sit from its centre), not by their shape; neighbouring
 * rosettes take turns between a cool and a warm colour; tiny pieces are
 * black; the rings between coloured ones are white; and each centre takes
 * the other family's colour as a spark. Review only: nothing in the app
 * uses it yet.
 */

/** A palette of real glaze colours: a white, a black, and two families. */
export interface Glaze {
  readonly name: string;
  readonly white: string;
  readonly black: string;
  /** Each family's main and second colour; rosettes take turns by family. */
  readonly families: readonly (readonly [string, string])[];
}

/** Fès zellige: tin white, manganese black, cobalt, copper green, iron honey, oxblood. */
export const FES_GLAZE: Glaze = {
  name: 'Fès zellige glazes',
  white: '#f3efe6',
  black: '#1b1714',
  families: [
    ['#1f3c8f', '#13794a'],
    ['#e0a42a', '#9a2a2c'],
    ['#1d8fa3', '#c8622a'],
  ],
};

/** Nasrid tile: white, black, teal, honey brown, green, deep blue. */
export const NASRID_GLAZE: Glaze = {
  name: 'Nasrid glazes',
  white: '#f2eee4',
  black: '#1d1a18',
  families: [
    ['#1f7f86', '#2b4f8f'],
    ['#b8702c', '#2f7a3c'],
    ['#2b4f8f', '#d8a640'],
  ],
};

/** Timurid tile: white, deep cobalt, turquoise, ochre, blue, brick. */
export const TIMURID_GLAZE: Glaze = {
  name: 'Timurid glazes',
  white: '#f5f2ea',
  black: '#14305c',
  families: [
    ['#1aa3b5', '#2a59b0'],
    ['#dba73a', '#a33d2b'],
    ['#2a59b0', '#dba73a'],
  ],
};

/**
 * Mamluk woodwork: the panels are wood, so a mid wood plays the part
 * white plays in tile, with ebony, ivory and a light wood inlaid.
 */
export const WOOD_GLAZE: Glaze = {
  name: 'Mamluk woods',
  white: '#7a4a26',
  black: '#24170f',
  families: [
    ['#efe3c6', '#b5813f'],
    ['#b5813f', '#efe3c6'],
    ['#d2a86a', '#4a2c18'],
  ],
};

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
function foldOf(piece: Piece): number {
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
 * the most fold, a star before a plain polygon of the same fold (the
 * octagon round an eight-pointed star is a ring, not the centre).
 */
function centreType(pattern: Pattern): number | undefined {
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
 * How rosettes take turns: by the cell they sit in, two families on a
 * square or rectangular lattice, three on a hexagonal one (where two
 * cannot alternate).
 */
function familyRule(pattern: Pattern): {
  repeat: [number, number];
  of: (i: number, j: number) => number;
} {
  const { u, v } = pattern.cell;
  const cos =
    (u.x * v.x + u.y * v.y) / (Math.hypot(u.x, u.y) * Math.hypot(v.x, v.y));
  const mod = (a: number, n: number) => ((a % n) + n) % n;
  if (Math.abs(cos - 0.5) < 0.02)
    return { repeat: [3, 3], of: (i, j) => mod(i - j, 3) };
  if (Math.abs(cos + 0.5) < 0.02)
    return { repeat: [3, 3], of: (i, j) => mod(i + j, 3) };
  return { repeat: [2, 2], of: (i, j) => mod(i + j, 2) };
}

/**
 * The model to draw with ring colouring (it colours each placement, so
 * the model carries a placement repeat) and its colouring.
 */
export function ringColoring(
  model: Model,
  glaze: Glaze,
): { model: Model; coloring: Coloring } {
  const { pattern } = model;
  const { cell, pieces, types } = pattern;
  const centre = centreType(pattern);
  const rule = familyRule(pattern);
  const [m, n] = rule.repeat;
  const families = rule.repeat[0] === 3 ? 3 : 2;
  const ringModel: Model = {
    ...model,
    tutorial: {
      ...model.tutorial,
      pattern: {
        ...model.tutorial.pattern,
        placements: { repeat: [m, n], rules: [] },
      },
    },
  };
  const at = (p: Vec, i: number, j: number): Vec => ({
    x: p.x + i * cell.u.x + j * cell.v.x,
    y: p.y + i * cell.u.y + j * cell.v.y,
  });
  // The rosette centres round the repeat, each with its family.
  const centres: { at: Vec; family: number }[] = [];
  pieces.forEach((p) => {
    if (p.type !== centre) return;
    const c = centreOf(p.polygon);
    for (let i = -1; i <= m; i++)
      for (let j = -1; j <= n; j++)
        centres.push({ at: at(c, i, j), family: rule.of(i, j) % families });
  });
  const cover = (t: number) => (types[t]?.area ?? 0) * (types[t]?.perCell ?? 0);
  const total = types.reduce((s, _, t) => s + cover(t), 0);
  const centreArea = centre === undefined ? 0 : (types[centre]?.area ?? 0);
  // Tiny pieces: small beside the centre and a small share of the wall.
  const tiny = (t: number) =>
    t !== centre &&
    (types[t]?.area ?? 0) < 0.2 * centreArea &&
    cover(t) < 0.06 * total;

  // Each placement: its type, its distance to the nearest centre, that
  // centre's family, or -1 when it lies as near a centre of another one.
  interface Place {
    key: string;
    type: number;
    d: number;
    family: number;
  }
  const places: Place[] = [];
  for (let i = 0; i < m; i++)
    for (let j = 0; j < n; j++)
      pieces.forEach((p, k) => {
        const c = at(centreOf(p.polygon), i, j);
        const ds = centres
          .map((x) => ({
            d: Math.hypot(x.at.x - c.x, x.at.y - c.y),
            f: x.family,
          }))
          .sort((a, b) => a.d - b.d);
        const first = ds[0];
        const second = ds.find((x) => x.f !== first?.f);
        const d = first?.d ?? 0;
        const between =
          !first || (second !== undefined && second.d - d < 1e-3 * (1 + d));
        places.push({
          key: placeKey(ringModel, k, i, j),
          type: p.type,
          d,
          family: between ? -1 : (first?.f ?? 0),
        });
      });

  // Rings: the distinct (type, distance) orbits, nearest first.
  const ringOf = (p: Place) => `${p.type}:${p.d.toFixed(3)}`;
  const rings = [
    ...new Map(
      places
        .filter((p) => p.family >= 0 && !tiny(p.type))
        .sort((a, b) => a.d - b.d)
        .map((p) => [ringOf(p), p.d]),
    ).keys(),
  ];
  const betweenRings = [
    ...new Map(
      places
        .filter((p) => p.family < 0 && !tiny(p.type))
        .sort((a, b) => cover(b.type) - cover(a.type))
        .map((p) => [ringOf(p), 0]),
    ).keys(),
  ];

  const chosen: Record<string, string> = {};
  if (centre === undefined) {
    // No rosette: by shape, the largest white, then the families' main
    // colours with black between.
    const order = types.map((_, t) => t).sort((a, b) => cover(b) - cover(a));
    const byRank = [
      glaze.white,
      glaze.families[0]?.[0],
      glaze.families[1]?.[0],
      glaze.black,
      glaze.families[0]?.[1],
      glaze.families[1]?.[1],
    ];
    for (const p of places)
      chosen[p.key] =
        byRank[order.indexOf(p.type) % byRank.length] ?? glaze.white;
    return { model: ringModel, coloring: { palette: 'Fès tile', chosen } };
  }
  for (const p of places) {
    let fill: string;
    const fam = glaze.families[p.family] ?? glaze.families[0];
    const other = glaze.families[(p.family + 1) % families];
    if (tiny(p.type)) fill = glaze.black;
    else if (p.family < 0)
      fill =
        betweenRings.indexOf(ringOf(p)) % 2 === 0 ? glaze.white : glaze.black;
    else if (p.type === centre) fill = other?.[0] ?? glaze.black;
    else {
      // Outward from the centre: main colour, second colour, white, and
      // again.
      const r = rings.indexOf(ringOf(p)) - 1;
      fill =
        r % 3 === 2
          ? glaze.white
          : r % 3 === 0
            ? (fam?.[0] ?? glaze.black)
            : (fam?.[1] ?? glaze.black);
    }
    chosen[p.key] = fill;
  }
  return { model: ringModel, coloring: { palette: 'Fès tile', chosen } };
}
