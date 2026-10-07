import {
  cellOf,
  classicSelection,
  computePattern,
  distance,
  evaluate,
  inkPieces,
  inkStrokes,
  pickFor,
  project,
  type Cell,
  type InkPiece,
  type Scene,
  type Vec,
} from '@tastir/engine';
import {
  parseTutorial,
  type ExpectedPiece,
  type InkAlong,
  type InkEnd,
  type Tutorial,
} from '@tastir/schema';
import { check, type Draft } from './document';

/**
 * Finishing a learner's pattern: the tile, the ink written back as paths
 * along the lines, and the whole tutorial file the player plays. Pure
 * TypeScript, like the document.
 */

/** The tile, when the draft names one that can repeat; else why not. */
export function tileOf(
  draft: Draft,
  scene: Scene,
): { cell: Cell } | { reason: string } {
  const name = draft.pattern?.cell;
  if (!name) return { reason: 'There is no tile yet.' };
  try {
    return { cell: cellOf(scene, name) };
  } catch (e) {
    return { reason: e instanceof Error ? e.message : String(e) };
  }
}

/** The draft with a polygon as its tile, keeping the rest of its pattern. */
export const withTile = (draft: Draft, polygon: string): Draft => ({
  ...draft,
  pattern: { colors: {}, ...draft.pattern, cell: polygon },
});

const onCurve = (scene: Scene, name: string, p: Vec): boolean => {
  const g = scene.elements.get(name)?.geometry;
  const eps = scene.tol.eps;
  if (!g) return false;
  if (g.kind === 'line') return distance(p, project(p, g.line)) <= eps;
  if (g.kind === 'circle')
    return Math.abs(distance(p, g.circle.centre) - g.circle.radius) <= eps;
  if (g.kind === 'polygon')
    return g.sides.some((s) => {
      const d = { x: s.b.x - s.a.x, y: s.b.y - s.a.y };
      const len2 = d.x * d.x + d.y * d.y;
      const t = Math.max(
        0,
        Math.min(1, ((p.x - s.a.x) * d.x + (p.y - s.a.y) * d.y) / len2),
      );
      return distance(p, { x: s.a.x + d.x * t, y: s.a.y + d.y * t }) <= eps;
    });
  return false;
};

/** The element a straight piece runs along: a line, or a polygon side. */
function carrierOf(scene: Scene, a: Vec, b: Vec): string | undefined {
  for (const el of scene.elements.values()) {
    const g = el.geometry;
    if (
      g.kind === 'line' &&
      onCurve(scene, el.name, a) &&
      onCurve(scene, el.name, b)
    )
      return el.name;
  }
  for (const el of scene.elements.values()) {
    const g = el.geometry;
    if (g.kind !== 'polygon') continue;
    const eps = scene.tol.eps;
    const along = g.sides.some((s) => {
      const on = (p: Vec) => {
        const d = { x: s.b.x - s.a.x, y: s.b.y - s.a.y };
        const len2 = d.x * d.x + d.y * d.y;
        const t = ((p.x - s.a.x) * d.x + (p.y - s.a.y) * d.y) / len2;
        return (
          t >= -eps &&
          t <= 1 + eps &&
          distance(p, { x: s.a.x + d.x * t, y: s.a.y + d.y * t }) <= eps
        );
      };
      return on(a) && on(b);
    });
    if (along) return el.name;
  }
  return undefined;
}

/** How an ink path names one end of a piece: a point, or a crossing. */
function endOf(scene: Scene, carrier: string, p: Vec): InkEnd | undefined {
  const eps = scene.tol.eps;
  for (const el of scene.elements.values()) {
    const g = el.geometry;
    if (
      g.kind === 'point' &&
      distance(g.at, p) <= eps &&
      !el.name.includes('.')
    )
      return el.name;
  }
  for (const el of scene.elements.values()) {
    const kind = el.geometry.kind;
    if (el.name === carrier) continue;
    if (kind !== 'line' && kind !== 'circle' && kind !== 'polygon') continue;
    if (!onCurve(scene, el.name, p)) continue;
    const choice = pickFor(scene, [carrier, el.name], p);
    if (!choice.found) continue;
    return choice.pick ? { cross: el.name, pick: choice.pick } : el.name;
  }
  return undefined;
}

/** What the learner can ink, and the ink path that writes each piece. */
export interface Inkable {
  readonly cell: Cell;
  readonly pieces: readonly InkPiece[];
  readonly paths: ReadonlyMap<string, InkAlong>;
}

/**
 * The pieces of construction inside the tile that an ink path can name:
 * each runs along a line or polygon side of the construction and ends
 * where an element of the construction crosses it (or at a named point).
 * Pieces drawn only by a neighbouring tile's copy are left out, since the
 * file could not name them.
 */
export function inkableOf(draft: Draft, scene: Scene): Inkable | undefined {
  const tile = tileOf(draft, scene);
  if (!('cell' in tile)) return undefined;
  const pieces: InkPiece[] = [];
  const paths = new Map<string, InkAlong>();
  for (const piece of inkPieces(scene, tile.cell)) {
    const { a, b } = piece.segment;
    const along = carrierOf(scene, a, b);
    if (!along) continue;
    const from = endOf(scene, along, a);
    const to = endOf(scene, along, b);
    if (from === undefined || to === undefined) continue;
    pieces.push(piece);
    paths.set(piece.id, { along, from, to });
  }
  return { cell: tile.cell, pieces, paths };
}

/** The pieces the draft's ink covers now. */
export function inkedNow(
  draft: Draft,
  scene: Scene,
  inkable: Inkable,
): Set<string> {
  if (!draft.ink?.paths.length) return new Set();
  try {
    const strokes = inkStrokes(scene, draft as Tutorial);
    return classicSelection(
      inkable.pieces,
      strokes,
      scene.tol.eps,
      inkable.cell,
    );
  } catch {
    return new Set();
  }
}

/** The draft with the chosen pieces as its ink, one path along each. */
export function withInk(
  draft: Draft,
  inkable: Inkable,
  chosen: ReadonlySet<string>,
): Draft {
  const paths = inkable.pieces
    .filter((p) => chosen.has(p.id))
    .map((p) => inkable.paths.get(p.id) as InkAlong);
  if (!paths.length) {
    const { ink: _ink, ...rest } = draft;
    return rest;
  }
  return {
    ...draft,
    ink: {
      text: draft.ink?.text ?? 'Go over the lines of the pattern.',
      paths,
    },
  };
}

const key = (p: Vec) =>
  `${p.x.toFixed(5)},${p.y.toFixed(5)}`.replace(/-0\.00000/g, '0.00000');
const pairKey = (a: Vec, b: Vec) => [key(a), key(b)].sort().join('|');

/**
 * The pieces a piece turns into under the pattern's symmetry about O:
 * every turn by 360°/fold, and their mirror images in the line OA when
 * `mirror`. A turned piece that falls in a neighbouring tile is found by
 * its copy in this one.
 */
export function imagesOf(
  inkable: Inkable,
  id: string,
  fold: number,
  mirror: boolean,
): string[] {
  const piece = inkable.pieces.find((p) => p.id === id);
  if (!piece) return [];
  const { u, v } = inkable.cell;
  const byKey = new Map<string, string>();
  for (const p of inkable.pieces)
    for (let i = -2; i <= 2; i++)
      for (let j = -2; j <= 2; j++) {
        const d = { x: u.x * i + v.x * j, y: u.y * i + v.y * j };
        const move = (q: Vec) => ({ x: q.x + d.x, y: q.y + d.y });
        byKey.set(pairKey(move(p.segment.a), move(p.segment.b)), p.id);
      }
  const out = new Set<string>([id]);
  for (let k = 0; k < fold; k++) {
    const t = (2 * Math.PI * k) / fold;
    const turn = (q: Vec) => ({
      x: q.x * Math.cos(t) - q.y * Math.sin(t),
      y: q.x * Math.sin(t) + q.y * Math.cos(t),
    });
    const flips = mirror
      ? [(q: Vec) => q, (q: Vec) => ({ x: q.x, y: -q.y })]
      : [(q: Vec) => q];
    for (const flip of flips) {
      const a = turn(flip(piece.segment.a));
      const b = turn(flip(piece.segment.b));
      const found = byKey.get(pairKey(a, b));
      if (found) out.add(found);
    }
  }
  return [...out];
}

/** A plain name for each piece type, by its corners, numbered on repeats. */
const SHAPES: Record<number, string> = {
  3: 'triangle',
  4: 'quadrilateral',
  5: 'pentagon',
  6: 'hexagon',
  7: 'heptagon',
  8: 'octagon',
  10: 'decagon',
  12: 'dodecagon',
};

/** Whether a polygon turns the same way at every corner. */
function convex(polygon: readonly Vec[]): boolean {
  let sign = 0;
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i] as Vec;
    const b = polygon[(i + 1) % polygon.length] as Vec;
    const c = polygon[(i + 2) % polygon.length] as Vec;
    const turn = Math.sign(
      (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x),
    );
    if (!turn) continue;
    if (sign && turn !== sign) return false;
    sign = turn;
  }
  return true;
}

/**
 * A plain name for each piece type: a convex one by its corners (hexagon),
 * one with eight or more corners that turns in and out a star, anything
 * else a shape; numbered when two types would share a name.
 */
export function pieceNames(
  types: readonly { vertices: number; polygon?: readonly Vec[] }[],
): string[] {
  const seen = new Map<string, number>();
  return types.map(({ vertices: n, polygon }) => {
    const base =
      !polygon || convex(polygon)
        ? (SHAPES[n] ?? `polygon${n}`)
        : n >= 8 && n % 2 === 0
          ? 'star'
          : 'shape';
    const k = (seen.get(base) ?? 0) + 1;
    seen.set(base, k);
    return k === 1 ? base : `${base}${k}`;
  });
}

const round = (n: number) => Number(n.toFixed(5));

/**
 * The whole tutorial file for a finished draft, as the player plays it and
 * the golden test checks it: its expected pieces are computed by the
 * engine. Undefined, with the reason in plain words, while something is
 * missing or broken.
 */
export function tutorialOf(
  draft: Draft,
): { tutorial: Tutorial } | { reason: string } {
  const checked = check(draft);
  const broken = [...checked.status].filter(([, s]) => !s.ok);
  if (broken.length)
    return {
      reason: `Step ${broken[0]?.[0]} is broken; mend or delete it first.`,
    };
  if (!draft.pattern?.cell)
    return { reason: 'Choose the tile first, with the Tile tool.' };
  if (!draft.ink?.paths.length)
    return { reason: 'Ink the pattern first: click the lines to keep.' };
  try {
    const bare = {
      ...draft,
      ink: draft.ink,
      pattern: draft.pattern,
      expect: { pieceTypes: 1, pieces: [] as ExpectedPiece[] },
    } as Tutorial;
    const scene = evaluate(bare);
    const pattern = computePattern(scene, bare);
    if (!pattern.types.length)
      return { reason: 'The ink closes no pieces yet.' };
    const names = pieceNames(
      pattern.types.map((t, i) => ({
        vertices: t.vertices,
        polygon: pattern.pieces.find((p) => p.type === i)?.polygon,
      })),
    );
    const tutorial = parseTutorial({
      ...bare,
      expect: {
        pieceTypes: pattern.types.length,
        pieces: pattern.types.map((t, i) => ({
          name: names[i],
          vertices: t.vertices,
          area: round(t.area),
          perCell: t.perCell,
        })),
      },
    });
    return { tutorial };
  } catch (e) {
    return { reason: e instanceof Error ? e.message : String(e) };
  }
}
