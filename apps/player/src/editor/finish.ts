import {
  cellOf,
  pointInPolygon,
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

/** Whether a point is inside the tile or on its edge. */
export function inTile(cell: Cell, p: Vec, eps = 1e-9): boolean {
  if (pointInPolygon(p, cell.corners)) return true;
  return cell.corners.some((a, i) => {
    const b = cell.corners[(i + 1) % cell.corners.length] as Vec;
    const d = { x: b.x - a.x, y: b.y - a.y };
    const t = Math.max(
      0,
      Math.min(
        1,
        ((p.x - a.x) * d.x + (p.y - a.y) * d.y) / (d.x * d.x + d.y * d.y),
      ),
    );
    return distance(p, { x: a.x + d.x * t, y: a.y + d.y * t }) <= eps * 10;
  });
}

/**
 * A warning when much of the drawing lies outside the tile, where it
 * cannot be inked; undefined when the tile holds most of it.
 */
export function tileWarning(scene: Scene, cell: Cell): string | undefined {
  const points = [...scene.elements.values()].flatMap((el) =>
    el.geometry.kind === 'point' ? [el.geometry.at] : [],
  );
  if (!points.length) return undefined;
  const outside = points.filter((p) => !inTile(cell, p, scene.tol.eps)).length;
  return outside / points.length > 0.3
    ? 'Much of the drawing lies outside this tile, and only what is inside it can be inked. For a star or rosette, draw a square (or hexagon) around the circle, touching it, and use its corners.'
    : undefined;
}

/**
 * The fold the steps were drawn with: the most copies any of their repeats
 * turns round the centre, or the tutorial's own fold.
 */
export function foldOf(draft: Pick<Draft, 'steps' | 'fold'>): number {
  let most = 0;
  for (const step of draft.steps)
    for (const el of Object.values(step.create ?? {}))
      if ('repeat' in el && el.repeat.by.startsWith('rot'))
        most = Math.max(most, Number(el.repeat.by.slice(3)));
  return most || draft.fold;
}

/**
 * Whether a polygon is part of the motif rather than a tile that could
 * hold it: its corners all lie on one circle about O that the steps drew
 * (the square through the points of the first circle, say).
 */
export function isMotif(scene: Scene, polygon: string): boolean {
  const g = scene.elements.get(polygon)?.geometry;
  if (g?.kind !== 'polygon') return false;
  const eps = scene.tol.eps * 10;
  const r = Math.hypot(g.vertices[0]?.x ?? 0, g.vertices[0]?.y ?? 0);
  if (!g.vertices.every((v) => Math.abs(Math.hypot(v.x, v.y) - r) <= eps))
    return false;
  return [...scene.elements.values()].some(
    (el) =>
      el.geometry.kind === 'circle' &&
      Math.hypot(el.geometry.circle.centre.x, el.geometry.circle.centre.y) <=
        eps &&
      Math.abs(el.geometry.circle.radius - r) <= eps,
  );
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

/**
 * The run of bits a click inks at once: along the same line or shape side,
 * from the clicked bit on in both directions, until a named point (a
 * place the steps marked), a crossing with another shape, or the end of
 * the line inside the tile. So one click inks a whole side, not one of
 * its tiny dashes.
 */
export function runOf(
  inkable: Inkable,
  id: string,
  named: readonly Vec[],
  scene?: Scene,
): string[] {
  const along = inkable.paths.get(id)?.along;
  if (!along) return [id];
  const same = inkable.pieces.filter(
    (p) => inkable.paths.get(p.id)?.along === along,
  );
  const at = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.y - b.y) < 1e-6;
  // A run also stops where another shape's side crosses it (the two
  // squares of a star cross there), but runs on across construction lines
  // and circles.
  const shapes = scene
    ? [...scene.elements.values()].filter(
        (el) => el.geometry.kind === 'polygon' && el.name !== along,
      )
    : [];
  const stop = (p: Vec) =>
    named.some((q) => at(p, q)) ||
    shapes.some((el) => scene !== undefined && onCurve(scene, el.name, p));
  const run = new Set([id]);
  const start = same.find((p) => p.id === id);
  if (!start) return [id];
  for (const end of [start.segment.a, start.segment.b]) {
    let tip = end;
    for (;;) {
      if (stop(tip)) break;
      const next = same.find(
        (p) => !run.has(p.id) && (at(p.segment.a, tip) || at(p.segment.b, tip)),
      );
      if (!next) break;
      run.add(next.id);
      tip = at(next.segment.a, tip) ? next.segment.b : next.segment.a;
    }
  }
  return [...run];
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

/** The turn at each corner: +1 the way most corners turn, -1 the other. */
function turns(polygon: readonly Vec[]): number[] {
  const raw = polygon.map((a, i) => {
    const b = polygon[(i + 1) % polygon.length] as Vec;
    const c = polygon[(i + 2) % polygon.length] as Vec;
    return Math.sign((b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x));
  });
  const most = raw.filter((t) => t > 0).length >= raw.length / 2 ? 1 : -1;
  return raw.map((t) => t * most);
}

/** Whether a polygon turns into itself by 360°/n about its centre. */
function turnsInto(polygon: readonly Vec[], n: number): boolean {
  const c = {
    x: polygon.reduce((s, p) => s + p.x, 0) / polygon.length,
    y: polygon.reduce((s, p) => s + p.y, 0) / polygon.length,
  };
  const t = (2 * Math.PI) / n;
  const scale = Math.max(...polygon.map((p) => distance(p, c)));
  return polygon.every((p) => {
    const q = {
      x: c.x + (p.x - c.x) * Math.cos(t) - (p.y - c.y) * Math.sin(t),
      y: c.y + (p.x - c.x) * Math.sin(t) + (p.y - c.y) * Math.cos(t),
    };
    return polygon.some((r) => distance(q, r) <= 1e-6 * scale);
  });
}

const near = (a: number, b: number) =>
  Math.abs(a - b) <= 1e-6 * Math.max(1, a, b);

/**
 * A plain name for one piece shape: triangle, square, rectangle, rhombus,
 * kite, pentagon, hexagon, octagon…; a star (its points alternate in and
 * out), a cross (four inner corners, turning into itself by quarters), or
 * a shape.
 */
export function shapeName(polygon: readonly Vec[]): string {
  const n = polygon.length;
  const t = turns(polygon);
  const reflex = t.filter((x) => x < 0).length;
  if (reflex === 0) {
    if (n === 4) {
      const side = polygon.map((p, i) =>
        distance(p, polygon[(i + 1) % 4] as Vec),
      );
      const [a = 0, b = 0, c = 0, d = 0] = side;
      const diag1 = distance(polygon[0] as Vec, polygon[2] as Vec);
      const diag2 = distance(polygon[1] as Vec, polygon[3] as Vec);
      const equal = near(a, b) && near(b, c) && near(c, d);
      if (equal) return near(diag1, diag2) ? 'square' : 'rhombus';
      if (near(a, c) && near(b, d))
        return near(diag1, diag2) ? 'rectangle' : 'parallelogram';
      if ((near(a, b) && near(c, d)) || (near(b, c) && near(d, a)))
        return 'kite';
      return 'quadrilateral';
    }
    return SHAPES[n] ?? `polygon${n}`;
  }
  // A star: its corners turn out and in by turns, all round.
  if (n % 2 === 0 && t.every((x, i) => x === -(t[(i + 1) % n] as number)))
    return 'star';
  if (reflex === 4 && turnsInto(polygon, 4)) return 'cross';
  return 'shape';
}

/**
 * A plain name for each piece type (see shapeName), numbered when two
 * types would share one.
 */
export function pieceNames(
  types: readonly { vertices: number; polygon?: readonly Vec[] }[],
): string[] {
  const seen = new Map<string, number>();
  return types.map(({ vertices: n, polygon }) => {
    const base = polygon ? shapeName(polygon) : (SHAPES[n] ?? `polygon${n}`);
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
    // Pieces that match the draft's earlier expect block keep their names
    // (and with them their colors and placements); new ones get plain
    // names that no other piece uses.
    const before = draft.expect?.pieces ?? [];
    const bare = {
      ...draft,
      ink: draft.ink,
      pattern: draft.pattern,
      expect: { pieceTypes: before.length || 1, pieces: before },
    } as Tutorial;
    const scene = evaluate(bare);
    const pattern = computePattern(scene, bare);
    if (!pattern.types.length)
      return { reason: 'The ink closes no pieces yet.' };
    const fresh = pieceNames(
      pattern.types.map((t, i) => ({
        vertices: t.vertices,
        polygon: pattern.pieces.find((p) => p.type === i)?.polygon,
      })),
    );
    const used = new Set(pattern.types.flatMap((t) => t.name ?? []));
    const names = pattern.types.map((t, i) => {
      if (t.name) return t.name;
      let name = fresh[i] as string;
      for (let k = 2; used.has(name); k++) name = `${fresh[i]}_${k}`;
      used.add(name);
      return name;
    });
    const kept = new Set(names);
    const small = new Set(before.filter((p) => p.small).map((p) => p.name));
    const colors = Object.fromEntries(
      Object.entries(draft.pattern.colors ?? {}).filter(([n]) => kept.has(n)),
    );
    const rules = draft.pattern.placements?.rules.filter((r) =>
      kept.has(r.piece),
    );
    const { placements: _placements, ...look } = draft.pattern;
    // Crossing counts the file checks, for the groups that still exist.
    const crossings = Object.fromEntries(
      Object.entries(draft.expect?.crossings ?? {}).flatMap(([name, want]) => {
        const g = scene.elements.get(name)?.geometry;
        if (g?.kind !== 'group') return [];
        const far = g.members.map((m) => {
          const q = scene.elements.get(m)?.geometry;
          return q?.kind === 'point' ? round(Math.hypot(q.at.x, q.at.y)) : NaN;
        });
        const same = far.every((d) => d === far[0]);
        return [
          [
            name,
            {
              count: g.members.length,
              ...(want.distanceFromO !== undefined && same
                ? { distanceFromO: far[0] as number }
                : {}),
            },
          ],
        ];
      }),
    );
    const tutorial = parseTutorial({
      ...bare,
      pattern: {
        ...look,
        colors,
        ...(rules?.length && draft.pattern.placements
          ? { placements: { ...draft.pattern.placements, rules } }
          : {}),
      },
      expect: {
        ...(draft.expect?.note ? { note: draft.expect.note } : {}),
        ...(Object.keys(crossings).length ? { crossings } : {}),
        pieceTypes: pattern.types.length,
        pieces: pattern.types.map((t, i) => ({
          name: names[i],
          vertices: t.vertices,
          area: round(t.area),
          perCell: t.perCell,
          ...(small.has(names[i] as string) ? { small: true } : {}),
        })),
        ...(draft.expect?.cellArea !== undefined
          ? { cellArea: round(pattern.cell.area) }
          : {}),
      },
    });
    return { tutorial };
  } catch (e) {
    return { reason: e instanceof Error ? e.message : String(e) };
  }
}
