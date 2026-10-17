import {
  squareGridTypes,
  squareBandColor,
  commonPeriod,
  squareBandPeriod,
} from './squareBands.js';
import type { Piece, Vec } from '@tastir/engine';
import {
  glazeOf,
  paletteOf,
  slotOf,
  typeKey,
  type Coloring,
  type Method,
  type Palette,
} from './coloring.js';
import type { Model } from './model.js';
import { ringsOf, withRosettes, type RingRole, type Rings } from './rings.js';

/**
 * Coloring by where a piece sits (the tutorial's pattern.placements): the
 * same shape can take different colors by its turn, its place in the cell
 * and the cell of a larger repeat it falls in. Without placements every
 * piece of a shape shares one color, as before.
 */

/**
 * The tutorial's rings (pattern.rings, see rings.ts), or undefined when it
 * does not colour by rings or the pattern has no rosette to colour round.
 */
export function ringsFor(model: Model): Rings | undefined {
  const asked = model.tutorial.pattern.rings;
  const rings = asked ? ringsOf(model.pattern) : undefined;
  if (!rings || asked === true || asked?.rosettes === undefined) return rings;
  // More rosettes than take turns: each rosette of the repeat its own.
  if (asked.rosettes > rings.rosettes) {
    const own = ringsOf(model.pattern, true);
    if (own && own.rosettes === asked.rosettes) return own;
  }
  return withRosettes(rings, asked.rosettes);
}

/** The ways a pattern can be coloured, the tutorial's own first. */
export function methodsOf(model: Model): Method[] {
  const own = ownMethod(model);
  const all: Method[] = [own];
  if (own !== 'rings' && ringsOf(model.pattern)) all.push('rings');
  if (own !== 'shape') all.push('shape');
  return all;
}

const ownMethod = (model: Model): Method =>
  model.tutorial.pattern.rings
    ? 'rings'
    : model.tutorial.pattern.placements
      ? 'place'
      : 'shape';

/** The way a coloring colours a pattern: its own, else the tutorial's. */
export const methodOf = (model: Model, coloring: Coloring): Method =>
  coloring.method ?? ownMethod(model);

/**
 * The model as a coloring colours it: the way the learner chose (ring by
 * ring, by shape, or by the tutorial's placements) and how many rosettes
 * take turns. A coloring that changed neither is the tutorial's own.
 */
const bandBases = new WeakMap<Model, Model>();
export function colouredModel(model: Model, coloring: Coloring): Model {
  if (coloring.squareBands) {
    const bands = coloring.squareBands;
    const { squareBands: _, ...base } = coloring;
    if (!squareGridTypes(model).includes(bands.typeId))
      return colouredModel(model, base);
    const plain = colouredModel(model, base);
    const repeat = colorRepeat(plain);
    const size = squareBandPeriod(bands);
    const period = repeat.map((n) => commonPeriod(n, size));
    if (
      period.some((n) => n > 48) ||
      period[0]! * period[1]! * model.pattern.pieces.length > 12000
    )
      return plain;
    const { rings: _rings, ...pattern } = plain.tutorial.pattern;
    const derived = {
      ...plain,
      tutorial: {
        ...plain.tutorial,
        pattern: {
          ...pattern,
          placements: {
            ...plain.tutorial.pattern.placements,
            repeat: period as [number, number],
            rules: plain.tutorial.pattern.placements?.rules ?? [],
          },
        },
      },
    };
    bandBases.set(derived, plain);
    return derived;
  }
  if (
    methodOf(model, coloring) === 'shape' &&
    Object.keys(coloring.chosen).some((key) => key.includes('#placement'))
  ) {
    const { rings: _rings, ...rest } = model.tutorial.pattern;
    return {
      ...model,
      tutorial: {
        ...model.tutorial,
        pattern: { ...rest, placements: { repeat: [1, 1], rules: [] } },
      },
    };
  }
  if (coloring.method === undefined && coloring.rosettes === undefined)
    return model;
  const { rings, placements, ...rest } = model.tutorial.pattern;
  const method = methodOf(model, coloring);
  const fixes = rings && rings !== true ? rings : { colors: {} };
  const pattern =
    method === 'rings'
      ? {
          ...rest,
          rings: {
            ...fixes,
            ...(coloring.rosettes === undefined
              ? {}
              : { rosettes: coloring.rosettes }),
          },
        }
      : method === 'place' && placements
        ? { ...rest, placements }
        : rest;
  return { ...model, tutorial: { ...model.tutorial, pattern } };
}

/** Whether pieces of one shape can differ in colour: by placement or ring. */
export function byPlace(model: Model): boolean {
  return !!model.tutorial.pattern.placements || !!ringsFor(model);
}

/** How many cells along each slide the coloring repeats after. */
export function colorRepeat(model: Model): readonly [number, number] {
  return (
    ringsFor(model)?.repeat ??
    model.tutorial.pattern.placements?.repeat ?? [1, 1]
  );
}

const mod = (a: number, n: number) => ((a % n) + n) % n;

/**
 * A piece's turn: the direction of its long axis, in degrees from the
 * horizontal in [0, 180), or undefined for a piece with no long axis (a
 * square, a regular star).
 */
export function turnOf(polygon: readonly Vec[]): number | undefined {
  // Second moments of the outline's corners about their centre.
  const n = polygon.length;
  const c = polygon.reduce((a, p) => ({ x: a.x + p.x / n, y: a.y + p.y / n }), {
    x: 0,
    y: 0,
  });
  let xx = 0;
  let yy = 0;
  let xy = 0;
  for (const p of polygon) {
    const dx = p.x - c.x;
    const dy = p.y - c.y;
    xx += dx * dx;
    yy += dy * dy;
    xy += dx * dy;
  }
  const spread = Math.hypot(xx - yy, 2 * xy);
  if (spread < 0.02 * (xx + yy)) return undefined;
  const deg = (Math.atan2(2 * xy, xx - yy) * 90) / Math.PI;
  return mod(deg, 180);
}

/**
 * Each piece's place among the cell's pieces of its shape: counted along
 * the cell's second slide, then its first, by the piece's centre.
 */
export function nthOf(model: Model): number[] {
  const { cell, pieces } = model.pattern;
  const det = cell.u.x * cell.v.y - cell.u.y * cell.v.x;
  const along = (p: Piece) => {
    const n = p.polygon.length;
    const c = p.polygon.reduce(
      (a, q) => ({ x: a.x + q.x / n, y: a.y + q.y / n }),
      { x: 0, y: 0 },
    );
    const d = { x: c.x - cell.origin.x, y: c.y - cell.origin.y };
    return {
      a: (d.x * cell.v.y - d.y * cell.v.x) / det,
      b: (cell.u.x * d.y - cell.u.y * d.x) / det,
    };
  };
  const at = pieces.map(along);
  return pieces.map((p, i) => {
    const me = at[i] as { a: number; b: number };
    return pieces.filter((q, k) => {
      if (q.type !== p.type || k === i) return false;
      const o = at[k] as { a: number; b: number };
      return o.b < me.b - 1e-6 || (Math.abs(o.b - me.b) <= 1e-6 && o.a < me.a);
    }).length;
  });
}

/**
 * The key a placement's color is kept under: the shape's key alone when
 * the tutorial colors by shape, else the shape with the piece and its cell
 * in the repeat.
 */
export function placeKey(
  model: Model,
  piece: number,
  i: number,
  j: number,
): string {
  const p = model.pattern.pieces[piece];
  const t = p ? model.pattern.types[p.type] : undefined;
  if (!t) return '';
  const rings = ringsFor(model);
  if (rings) return `${typeKey(t)}#${rings.place(piece, i, j).ring}`;
  if (!model.tutorial.pattern.placements) return typeKey(t);
  const [m, n] = colorRepeat(model);
  return `${typeKey(t)}#${piece}@${mod(i, m)},${mod(j, n)}`;
}

/** A palette slot's color, or the color itself when it is not a slot. */
function resolve(palette: Palette, color: string): string {
  return (palette as Record<string, string>)[color] ?? color;
}

/**
 * The fill for every placement under a coloring: a color chosen for that
 * placement, else one chosen for its whole shape, else the tutorial's
 * placement rules, else the shape's palette slot.
 */
function basePlaceFills(
  model: Model,
  coloring: Coloring,
): (piece: number, i: number, j: number) => string {
  if (coloring.squareBands) {
    const bands = coloring.squareBands;
    const { squareBands: _, ...base } = coloring;
    if (!squareGridTypes(model).includes(bands.typeId))
      return basePlaceFills(model, base);
    // Preserve the original placement period for the stars and connecting bands.
    const plain = bandBases.get(model) ?? colouredModel(model, base);
    const fallback = basePlaceFills(plain, base);
    const period = colorRepeat(plain).map((n) =>
      commonPeriod(n, squareBandPeriod(bands)),
    );
    if (
      period.some((n) => n > 48) ||
      period[0]! * period[1]! * model.pattern.pieces.length > 12000
    )
      return fallback;
    return (piece, i, j) =>
      model.pattern.types[model.pattern.pieces[piece]!.type]?.name ===
      bands.typeId
        ? (coloring.chosen[placeKey(model, piece, i, j)] ??
          squareBandColor(bands, i, j))
        : fallback(piece, i, j);
  }
  const palette = paletteOf(model, coloring.palette);
  const placements = model.tutorial.pattern.placements;
  const rings = ringsFor(model);
  if (rings) return ringFills(model, coloring, rings);
  const nth = nthOf(model);
  const turns = model.pattern.pieces.map((p) => turnOf(p.polygon));
  const [m, n] = colorRepeat(model);
  const cache = new Map<string, string>();
  return (piece, i, j) => {
    const key = placeKey(model, piece, i, j);
    const hit = cache.get(key);
    if (hit) return hit;
    const p = model.pattern.pieces[piece] as Piece;
    const t = model.pattern.types[p.type];
    let fill = '#999999';
    if (t) {
      fill = coloring.chosen[key] ?? coloring.chosen[typeKey(t)] ?? '';
      if (!fill) {
        fill = palette[slotOf(model, t, p.type)];
        for (const rule of placements?.rules ?? []) {
          if (rule.piece !== t.name) continue;
          if (rule.nth !== undefined && rule.nth !== nth[piece]) continue;
          if (
            rule.cell &&
            (rule.cell[0] !== mod(i, m) || rule.cell[1] !== mod(j, n))
          )
            continue;
          if (rule.turn !== undefined) {
            const turn = turns[piece];
            if (turn === undefined) continue;
            const off = mod(turn - rule.turn + 90, 180) - 90;
            if (Math.abs(off) > 3) continue;
          }
          fill = resolve(palette, rule.color);
        }
      }
    }
    cache.set(key, fill);
    return fill;
  };
}

/**
 * The fill for every placement when the tutorial colours by rings: a
 * colour chosen for that ring, else for its whole shape, else the role the
 * tutorial gives its ring or shape, else the ring's own role, in the
 * palette's glazes.
 */
function ringFills(
  model: Model,
  coloring: Coloring,
  rings: Rings,
): (piece: number, i: number, j: number) => string {
  const glaze = glazeOf(coloring.palette, model);
  const fixes = model.tutorial.pattern.rings;
  const fixed = fixes === true || !fixes ? {} : fixes.colors;
  const families = Math.max(1, Math.min(rings.families, glaze.families.length));
  const colour = (role: RingRole, family: number): string => {
    const f = family < 0 ? 0 : family % families;
    if (role === 'white') return glaze.white;
    if (role === 'black') return glaze.black;
    if (role === 'spark')
      return (
        // The next rosette's main colour; with every rosette alike, the
        // colour a second rosette would take.
        glaze.families[(f + 1) % Math.max(2, rings.rosettes)]?.[0] ??
        glaze.black
      );
    return glaze.families[f]?.[role === 'main' ? 0 : 1] ?? glaze.black;
  };
  // Each ring's colour from its role (or the tutorial's correction), the
  // same for every piece of it.
  const ringColour = new Map<string, string>();
  const { pieces, types } = model.pattern;
  const [m, n] = rings.repeat;
  for (let k = 0; k < pieces.length; k++)
    for (let i = 0; i < m; i++)
      for (let j = 0; j < n; j++) {
        const at = rings.place(k, i, j);
        if (ringColour.has(at.ring)) continue;
        const name = types[(pieces[k] as Piece).type]?.name ?? '';
        const role =
          (at.n ? fixed[`${name}@${at.n}`] : undefined) ??
          fixed[name] ??
          at.role;
        ringColour.set(at.ring, colour(role, at.family));
      }
  // Two touching rings never share a colour (other than white or black):
  // the farther one turns white.
  const plain = new Set([glaze.white, glaze.black]);
  for (const [near, far] of rings.touching) {
    const c = ringColour.get(far);
    if (c && !plain.has(c) && c === ringColour.get(near))
      ringColour.set(far, glaze.white);
  }
  const cache = new Map<string, string>();
  return (piece, i, j) => {
    const key = placeKey(model, piece, i, j);
    const hit = cache.get(key);
    if (hit) return hit;
    const p = pieces[piece] as Piece;
    const t = types[p.type];
    let fill = '#999999';
    if (t)
      fill =
        coloring.chosen[key] ??
        coloring.chosen[typeKey(t)] ??
        ringColour.get(rings.place(piece, i, j).ring) ??
        glaze.white;
    cache.set(key, fill);
    return fill;
  };
}

/** Exact position within the current finite color repeat, independent of its ring. */
export function placementKey(
  model: Model,
  piece: number,
  i: number,
  j: number,
): string {
  const type = model.pattern.types[model.pattern.pieces[piece]!.type]!;
  const [m, n] = colorRepeat(model);
  return `${typeKey(type)}#placement${piece}@${mod(i, m)},${mod(j, n)}/${m},${n}`;
}
export function placeFills(model: Model, coloring: Coloring) {
  const fill = basePlaceFills(model, coloring);
  const overrides = new Map<
    number,
    { i: number; j: number; m: number; n: number; color: string }[]
  >();
  for (const [key, color] of Object.entries(coloring.chosen)) {
    const match = /^(.*)#placement(\d+)@(\d+),(\d+)\/(\d+),(\d+)$/.exec(key);
    if (!match) continue;
    const [piece, i, j, m, n] = match.slice(2).map(Number) as [
      number,
      number,
      number,
      number,
      number,
    ];
    const type = model.pattern.types[model.pattern.pieces[piece]?.type ?? -1];
    if (
      !type ||
      match[1] !== typeKey(type) ||
      m < 1 ||
      n < 1 ||
      m > 48 ||
      n > 48
    )
      continue;
    overrides.set(piece, [
      { i, j, m, n, color },
      ...(overrides.get(piece) ?? []),
    ]);
  }
  return (piece: number, i: number, j: number) => {
    const override = overrides
      .get(piece)
      ?.find((p) => mod(i, p.m) === p.i && mod(j, p.n) === p.j);
    return override?.color ?? fill(piece, i, j);
  };
}

/** Manual and assistant ring/shape repainting take precedence over prior single positions. */
export function paintChosen(
  model: Model,
  coloring: Coloring,
  key: string,
  color: string,
) {
  const chosen = { ...coloring.chosen };
  const position = /#(\d+)@(\d+),(\d+)$/.exec(key);
  for (const own of Object.keys(chosen)) {
    if (!key.includes('#') && own.startsWith(`${key}#`)) {
      delete chosen[own];
      continue;
    }
    const match = /^(.*)#placement(\d+)@(\d+),(\d+)\/(\d+),(\d+)$/.exec(own);
    if (!match) continue;
    const [piece, i, j] = match.slice(2).map(Number) as [
      number,
      number,
      number,
    ];
    if (!model.pattern.pieces[piece]) continue;
    if (!position && (match[1] === key || placeKey(model, piece, i, j) === key))
      delete chosen[own];
  }
  if (position) {
    const [piece, i, j] = position.slice(1).map(Number) as [
      number,
      number,
      number,
    ];
    if (model.pattern.pieces[piece])
      chosen[placementKey(model, piece, i, j)] = color;
  }
  chosen[key] = color;
  return chosen;
}
