import {
  cross,
  distance,
  hasSymmetry,
  inkStrokes,
  project,
  strokesOffConstruction,
  strokesOffCrossings,
  sub,
  type Scene,
  type Vec,
} from '@tastir/engine';
import { partsOf, type InkPath, type Tutorial } from '@tastir/schema';
import { ConstructionShape, type Construction } from '@tastir/agent-protocol';
import {
  addStep,
  check,
  deleteSteps,
  dependents,
  freshName,
  type Draft,
} from './document.js';
import { loadModel, type Model } from './model.js';
import { PALETTES } from './coloring.js';
import { tutorialOf, withTile } from './finish.js';
import { constructionSpec, constructionText } from './drawing.js';

/**
 * The edits a studio project accepts, from a person or an agent. Each one
 * takes the whole draft and returns a new one, or throws a StudioError in
 * plain words and changes nothing. The draft is the editor's own format,
 * so the editor can open whatever the studio makes.
 */
export class StudioError extends Error {}
const fail = (message: string): never => {
  throw new StudioError(message);
};

/** What a brief asks for that the studio can measure. */
export interface Goals {
  readonly fold?: number;
  readonly maxSteps?: number;
  readonly tile?: 'parallelogram' | 'hexagon';
  readonly pieceTypes?: number;
}

/** The scene of a draft in which every step works; else why not. */
export function sceneOf(draft: Draft): Scene {
  const { scene, status } = check(draft);
  for (const [id, s] of status)
    if (!s.ok) fail(`Step ${id} cannot be drawn: ${s.reason}`);
  for (const { name, geometry: g } of scene.elements.values()) {
    const values =
      g.kind === 'point'
        ? [g.at.x, g.at.y]
        : g.kind === 'circle'
          ? [g.circle.centre.x, g.circle.centre.y, g.circle.radius]
          : g.kind === 'line'
            ? [g.line.point.x, g.line.point.y, g.line.dir.x, g.line.dir.y]
            : [];
    if (values.some((v) => !Number.isFinite(v)))
      fail(`“${name}” has no finite position.`);
  }
  return scene;
}

const madeBy = (step: Draft['steps'][number]) =>
  partsOf(step).flatMap((part) => Object.keys(part.create));

function stepMaking(draft: Draft, name: string) {
  return draft.steps.find((s) => madeBy(s).includes(name));
}

function pointAt(scene: Scene, name: string): Vec {
  const g = scene.elements.get(name)?.geometry;
  if (g?.kind !== 'point') fail(`“${name}” is not a named point.`);
  return (g as { at: Vec }).at;
}

/** Adds any editor construction in order, or removes some, atomically. */
export function construct(
  draft: Draft,
  add: readonly unknown[],
  remove: readonly string[] = [],
): Draft {
  if (!add.length && !remove.length) fail('The edit contains no changes.');
  if (add.length > 32) fail('Add at most 32 elements in one edit.');
  let next = draft;
  for (const name of remove) {
    const step = stepMaking(next, name);
    if (!step) fail(`No step makes “${name}”.`);
    const made = madeBy(step!);
    if (made.some((n) => !remove.includes(n)))
      fail(
        `Step ${step!.id} also makes ${made.filter((n) => n !== name).join(', ')}. Remove those too.`,
      );
    const later = dependents(check(next), step!.id);
    if (later.length)
      fail(
        `Steps ${later.join(', ')} are built on “${name}”. Remove them first.`,
      );
    next = deleteSteps(next, [step!.id]);
  }
  const taken = new Set([
    ...sceneOf(next).elements.keys(),
    ...next.steps.flatMap(madeBy),
  ]);
  for (const raw of add) {
    const parsed = ConstructionShape.safeParse(raw);
    if (!parsed.success)
      fail(
        `Invalid construction: ${parsed.error!.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')}`,
      );
    const op = parsed.data as Construction;
    if (taken.has(op.name))
      fail(`The name “${op.name}” is already used. Choose a new name.`);
    taken.add(op.name);
    next = addStep(next, {
      text: constructionText(op),
      create: { [op.name]: constructionSpec(op) },
    });
  }
  const scene = sceneOf(next);
  if (scene.elements.size > 5000)
    fail('The construction has too many elements.');
  inkOf(next, scene);
  return refinish(next);
}

/** The ink strokes of the draft, checked against its construction. */
function inkOf(draft: Draft, scene: Scene) {
  if (!draft.ink?.paths.length) return [];
  try {
    return inkStrokes(scene, draft as Tutorial);
  } catch (e) {
    return fail(
      `The ink no longer follows the construction: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
}

/**
 * After a change to the construction or the ink, the pieces are found
 * again. While the tile still repeats, they keep their names and colors
 * (tutorialOf matches them to the earlier ones); otherwise they are left
 * out until the tile works again, and check says why.
 */
function refinish(draft: Draft): Draft {
  if (draft.pattern?.cell) {
    const result = tutorialOf(draft);
    if ('tutorial' in result) return result.tutorial;
  }
  return forgetPieces(draft);
}

const forgetPieces = (draft: Draft): Draft => {
  const { expect: _expect, ...rest } = draft;
  return rest;
};

function onSegment(p: Vec, a: Vec, b: Vec, eps: number) {
  const d = sub(b, a);
  const len2 = d.x * d.x + d.y * d.y;
  const t = ((p.x - a.x) * d.x + (p.y - a.y) * d.y) / len2;
  return (
    t >= -eps &&
    t <= 1 + eps &&
    distance(p, { x: a.x + d.x * t, y: a.y + d.y * t }) <= eps
  );
}

/** Whether a line or polygon side of the construction runs through a and b. */
function carried(scene: Scene, a: Vec, b: Vec) {
  const { eps } = scene.tol;
  return [...scene.elements.values()].some(({ geometry: g }) =>
    g.kind === 'line'
      ? [a, b].every((p) => distance(p, project(p, g.line)) <= eps)
      : g.kind === 'polygon' &&
        g.sides.some(
          (s) => onSegment(a, s.a, s.b, eps) && onSegment(b, s.a, s.b, eps),
        ),
  );
}

export const describePath = (path: InkPath): string =>
  'through' in path
    ? `through ${path.through.join('–')}`
    : `along ${path.along} from ${JSON.stringify(path.from)} to ${JSON.stringify(path.to)}`;

/**
 * Inks straight sides between named points, or removes ink by its id
 * (ink1, ink2, … in order). A side with no line under it gets a ruler
 * line first, so the ink always follows the construction.
 */
export function ink(
  draft: Draft,
  add: readonly { from: string; to: string }[],
  remove: readonly string[] = [],
): Draft {
  if (!add.length && !remove.length) fail('The edit contains no changes.');
  if (add.length > 64) fail('Ink at most 64 sides in one edit.');
  const paths = draft.ink?.paths ?? [];
  for (const id of remove)
    if (!/^ink\d+$/.test(id) || Number(id.slice(3)) > paths.length)
      fail(`There is no ink “${id}”. Call inspect for the current ids.`);
  const kept = paths.filter((_, i) => !remove.includes(`ink${i + 1}`));
  let next = draft;
  let scene = sceneOf(next);
  const ends = (path: InkPath) =>
    'through' in path && path.through.length === 2 ? path.through : undefined;
  for (const { from, to } of add) {
    const a = pointAt(scene, from);
    const b = pointAt(scene, to);
    if (distance(a, b) <= scene.tol.eps)
      fail(`${from} and ${to} are the same point.`);
    const same = kept.some((path) => {
      const e = ends(path);
      if (!e) return false;
      const [c, d] = [pointAt(scene, e[0]!), pointAt(scene, e[1]!)];
      return (
        (distance(a, c) <= scene.tol.eps && distance(b, d) <= scene.tol.eps) ||
        (distance(a, d) <= scene.tol.eps && distance(b, c) <= scene.tol.eps)
      );
    });
    if (same) fail(`${from}–${to} is already inked.`);
    if (!carried(scene, a, b)) {
      next = addStep(next, {
        text: `Join ${from} to ${to} with the ruler.`,
        create: { [freshName(next, 'L')]: { line: { through: [from, to] } } },
      });
      scene = sceneOf(next);
    }
    kept.push({ through: [from, to] });
  }
  next = kept.length
    ? {
        ...next,
        ink: {
          text: draft.ink?.text ?? 'Go over the lines of the pattern.',
          paths: kept,
        },
      }
    : (({ ink: _ink, ...rest }) => rest)(next);
  inkOf(next, scene);
  return refinish(next);
}

const TILE_TEXT = 'Repeat using the tile';

/**
 * Makes the polygon through four or six named points the repeating tile.
 * The ink must already close pieces that cover it exactly. The draft that
 * comes back is a whole playable tutorial, with its pieces named.
 */
export function setTile(draft: Draft, vertices: readonly string[]): Draft {
  if (
    ![4, 6].includes(vertices.length) ||
    new Set(vertices).size !== vertices.length
  )
    fail('Choose four or six different named points in boundary order.');
  let next = draft;
  // A tile the studio made before is replaced, not kept beside the new one.
  const old = draft.pattern?.cell
    ? stepMaking(draft, draft.pattern.cell)
    : undefined;
  if (
    old?.text.startsWith(TILE_TEXT) &&
    !dependents(check(draft), old.id).length
  )
    next = deleteSteps(next, [old.id]);
  const scene = sceneOf(next);
  const corners = vertices.map((v) => pointAt(scene, v));
  const turns = corners.map((a, i) =>
    cross(
      sub(corners[(i + 1) % corners.length]!, a),
      sub(corners[(i + 2) % corners.length]!, a),
    ),
  );
  const sign = Math.sign(turns[0]!);
  if (!sign || turns.some((t) => t * sign <= scene.tol.eps ** 2))
    fail(
      'Choose distinct tile corners in boundary order around a convex tile.',
    );
  const name = freshName(next, 'S');
  next = addStep(next, {
    text: `${TILE_TEXT} ${vertices.join(', ')}.`,
    create: { [name]: { polygon: [...vertices] } },
  });
  next = withTile(forgetPieces(next), name);
  return finished(next);
}

/** The draft as a playable tutorial, after checking that its tile repeats. */
function finished(draft: Draft): Draft {
  const result = tutorialOf(draft);
  if ('reason' in result) fail(result.reason);
  const { tutorial } = result as { tutorial: Tutorial };
  let model: Model | undefined;
  try {
    model = loadModel(tutorial);
  } catch (e) {
    fail(e instanceof Error ? e.message : String(e));
  }
  const problem = tileProblem(model!);
  if (problem) fail(problem);
  return tutorial;
}

/**
 * Why a tile would not repeat cleanly, or undefined: the same tests as the
 * in-app assistant's tile tool (apps/player/src/agent/repeat.ts), kept in
 * step with it until both use one shared module.
 */
export function tileProblem(model: Model): string | undefined {
  const { pattern, scene } = model;
  const { cell, ink: strokes, types } = pattern;
  const eps = scene.tol.eps * 10;
  if (!Number.isFinite(cell.area) || cell.area <= eps * eps)
    return 'The tile needs a positive area.';
  if (!types.length || types.length > 128 || pattern.pieces.length > 128)
    return 'The tile must close between 1 and 128 pieces.';
  if (types.some((t) => t.sliver))
    return 'The repeat contains a very thin sliver. Mend its ink first.';
  const area = types.reduce((sum, t) => sum + t.area * t.perCell, 0);
  if (Math.abs(area - cell.area) > cell.area * 1e-5)
    return 'The closed pieces do not cover the tile exactly. Close the gaps first.';
  const sign = Math.sign(
    cross(
      sub(cell.corners[1]!, cell.corners[0]!),
      sub(cell.corners[2]!, cell.corners[0]!),
    ),
  );
  const inside = (p: Vec) =>
    cell.corners.every(
      (a, i, c) =>
        cross(sub(c[(i + 1) % c.length]!, a), sub(p, a)) * sign >= -eps,
    );
  if (strokes.some(({ segment: { a, b } }) => !inside(a) || !inside(b)))
    return 'Keep all ink inside the tile, including its boundary.';
  const copies = [];
  for (let i = -1; i <= 1; i++)
    for (let j = -1; j <= 1; j++) {
      const dx = cell.u.x * i + cell.v.x * j;
      const dy = cell.u.y * i + cell.v.y * j;
      for (const { segment: s } of strokes)
        copies.push({
          a: { x: s.a.x + dx, y: s.a.y + dy },
          b: { x: s.b.x + dx, y: s.b.y + dy },
        });
    }
  for (const { segment } of strokes)
    for (const p of [segment.a, segment.b]) {
      const directions: Vec[] = [];
      for (const s of copies) {
        if (
          Math.abs(distance(s.a, p) + distance(p, s.b) - distance(s.a, s.b)) >
          eps
        )
          continue;
        for (const q of [s.a, s.b]) {
          const length = distance(p, q);
          if (length <= eps) continue;
          const d = { x: (q.x - p.x) / length, y: (q.y - p.y) / length };
          if (!directions.some((e) => distance(d, e) < 1e-6))
            directions.push(d);
        }
      }
      if (directions.length < 2)
        return 'An inked side has a loose end, including across the tile seams. Close or remove it first.';
    }
  return undefined;
}

/**
 * One color for a piece type, or for only some of its pieces: those in one
 * cell of the color repeat, the nth of its shape in the tile, or those
 * turned to one direction (the tutorial's placement rules).
 */
export interface PaintColor {
  readonly piece: string;
  readonly color: string;
  readonly cell?: readonly number[];
  readonly nth?: number;
  readonly turn?: number;
}

/**
 * Colors the pieces: a preset palette, and #rrggbb colors for named piece
 * types (the ids inspect lists). A palette starts the colors afresh. A
 * repeat of more than one tile lets the colors of one shape take turns, cell
 * by cell; colors given for a piece replace its earlier ones, and of its
 * colors the later win.
 */
export function paint(
  draft: Draft,
  palette: string | null,
  colors: readonly PaintColor[],
  repeat?: readonly number[],
): Draft {
  if (!draft.pattern?.cell || !draft.expect)
    fail('Choose a tile that repeats before coloring.');
  if (palette === null && !colors.length && !repeat)
    fail('Choose a palette or at least one piece color.');
  if (palette !== null && !Object.hasOwn(PALETTES, palette))
    fail(`Choose a palette from: ${Object.keys(PALETTES).join(', ')}.`);
  if (
    repeat &&
    (repeat.length !== 2 ||
      !repeat.every((n) => Number.isInteger(n) && n >= 1 && n <= 12))
  )
    fail('A repeat is two whole numbers of tiles, each from 1 to 12.');
  const pattern = draft.pattern!;
  const was = pattern.placements?.repeat ?? [1, 1];
  const [m, n] = repeat ?? (palette === null ? was : [1, 1]);
  const pieces = new Map(draft.expect!.pieces.map((p) => [p.name, p]));
  const seen = new Set<string>();
  for (const { piece, color, cell, nth, turn } of colors) {
    const known = pieces.get(piece);
    if (!known)
      fail(
        `There is no piece “${piece}”. Pieces: ${[...pieces.keys()].join(', ')}.`,
      );
    if (!/^#[0-9a-f]{6}$/i.test(color))
      fail(`“${color}” is not a #rrggbb color.`);
    if (
      cell &&
      (cell.length !== 2 ||
        !Number.isInteger(cell[0]) ||
        !Number.isInteger(cell[1]) ||
        cell[0]! < 0 ||
        cell[1]! < 0 ||
        cell[0]! >= m! ||
        cell[1]! >= n!)
    )
      fail(
        `The cell [${cell.join(', ')}] for “${piece}” is outside the ${m}×${n} repeat; cells run from [0, 0] to [${m! - 1}, ${n! - 1}].`,
      );
    if (
      nth !== undefined &&
      (!Number.isInteger(nth) || nth < 0 || nth >= known!.perCell)
    )
      fail(
        `“${piece}” has ${known!.perCell} in each tile, so nth runs from 0 to ${known!.perCell - 1}.`,
      );
    if (turn !== undefined && !(turn >= 0 && turn <= 180))
      fail(`The turn for “${piece}” is a direction from 0 to 180 degrees.`);
    const key = JSON.stringify([piece, cell, nth, turn]);
    if (seen.has(key))
      fail(`“${piece}” is given two colors for the same pieces.`);
    seen.add(key);
  }
  // A new repeat moves the cells, so colors kept for old cells go.
  const moved = was[0] !== m || was[1] !== n;
  const before = (
    palette === null ? (pattern.placements?.rules ?? []) : []
  ).filter((r) => !(moved && r.cell));
  const rules = [
    ...before.filter((r) => !colors.some((c) => c.piece === r.piece)),
    ...colors.map(({ piece, color, cell, nth, turn }) => ({
      piece,
      ...(turn !== undefined ? { turn } : {}),
      ...(nth !== undefined ? { nth } : {}),
      ...(cell ? { cell: [cell[0]!, cell[1]!] as [number, number] } : {}),
      color: color.toLowerCase(),
    })),
  ];
  const { placements: _placements, ...look } = pattern;
  return finished({
    ...draft,
    pattern: {
      ...look,
      ...(palette !== null ? { palette } : {}),
      ...(rules.length
        ? { placements: { repeat: [m!, n!] as [number, number], rules } }
        : {}),
    },
  });
}

const round = (n: number) => Math.round(n * 1e4) / 1e4;

/** Everything an agent needs to refer to: names, ink ids, tile and pieces. */
export function inspect(draft: Draft) {
  const { scene, status } = check(draft);
  const points: { name: string; x: number; y: number }[] = [];
  const lines: { name: string; through?: string[] }[] = [];
  const circles: { name: string; centre: Vec; radius: number }[] = [];
  const polygons: { name: string; corners: number }[] = [];
  for (const { name, geometry: g } of scene.elements.values()) {
    if (g.kind === 'point')
      points.push({ name, x: round(g.at.x), y: round(g.at.y) });
    if (g.kind === 'line') lines.push({ name });
    if (g.kind === 'circle')
      circles.push({
        name,
        centre: { x: round(g.circle.centre.x), y: round(g.circle.centre.y) },
        radius: round(g.circle.radius),
      });
    if (g.kind === 'polygon')
      polygons.push({ name, corners: g.vertices.length });
  }
  const LIMIT = 400;
  return {
    title: draft.title,
    fold: draft.fold,
    frame:
      'O is the centre and OA the unit, with A at 0°; angles grow counter-clockwise and y points up.',
    steps: draft.steps.map((s) => {
      const st = status.get(s.id);
      return {
        id: s.id,
        text: s.text,
        makes: madeBy(s),
        ...(st && !st.ok ? { broken: st.reason } : {}),
      };
    }),
    points: points.slice(0, LIMIT),
    lines: lines.slice(0, LIMIT),
    circles: circles.slice(0, LIMIT),
    polygons: polygons.slice(0, LIMIT),
    ...(points.length > LIMIT || lines.length > LIMIT || circles.length > LIMIT
      ? { truncated: `Only the first ${LIMIT} of each kind are listed.` }
      : {}),
    ink: (draft.ink?.paths ?? []).map((path, i) => ({
      id: `ink${i + 1}`,
      path: describePath(path),
    })),
    tile: draft.pattern?.cell
      ? {
          polygon: draft.pattern.cell,
          palette: draft.pattern.palette ?? null,
          repeat: draft.pattern.placements?.repeat ?? [1, 1],
          pieces: (draft.expect?.pieces ?? []).map((p) => {
            const rules =
              draft.pattern?.placements?.rules.filter(
                (r) => r.piece === p.name,
              ) ?? [];
            const placed = rules.filter(
              (r) => r.cell || r.nth !== undefined || r.turn !== undefined,
            );
            return {
              id: p.name,
              corners: p.vertices,
              perTile: p.perCell,
              color: rules.find((r) => !placed.includes(r))?.color ?? null,
              ...(placed.length
                ? {
                    placed: placed.map(({ piece: _, ...rule }) => rule),
                  }
                : {}),
            };
          }),
        }
      : null,
    palettes: Object.keys(PALETTES),
  };
}

/** Every problem with the draft, and with the goals when it has them. */
export function problems(draft: Draft, goals: Goals = {}): string[] {
  const out: string[] = [];
  const { scene, status } = check(draft);
  for (const [id, s] of status)
    if (!s.ok) out.push(`Step ${id} is broken: ${s.reason}`);
  if (out.length) return out;
  if (goals.maxSteps !== undefined && draft.steps.length > goals.maxSteps)
    out.push(
      `The draft has ${draft.steps.length} steps; the goal is at most ${goals.maxSteps}.`,
    );
  if (!draft.ink?.paths.length) out.push('Nothing is inked yet.');
  else {
    try {
      const strokes = inkStrokes(scene, draft as Tutorial);
      const off = strokesOffConstruction(scene, strokes);
      if (off.length) out.push(`Ink off the construction: ${off.join(', ')}.`);
    } catch (e) {
      out.push(
        `The ink does not follow the construction: ${e instanceof Error ? e.message : String(e)}`,
      );
      return out;
    }
  }
  if (!draft.pattern?.cell) {
    out.push('There is no repeating tile yet.');
    return out;
  }
  const result = tutorialOf(draft);
  if ('reason' in result) {
    out.push(result.reason);
    return out;
  }
  let model: Model;
  try {
    model = loadModel(result.tutorial);
  } catch (e) {
    out.push(e instanceof Error ? e.message : String(e));
    return out;
  }
  const tile = tileProblem(model);
  if (tile) out.push(tile);
  const off = strokesOffCrossings(model.scene, model.pattern);
  if (off.length)
    out.push(
      `Ink that does not end on crossings of the construction: ${off.join(', ')}.`,
    );
  if (goals.fold && !hasSymmetry(model.pattern, goals.fold))
    out.push(
      goals.fold === 1
        ? 'The pieces around O do not have mirror symmetry across OA.'
        : `The pieces around O do not repeat with ${goals.fold}-fold symmetry.`,
    );
  if (
    goals.pieceTypes !== undefined &&
    model.pattern.types.length !== goals.pieceTypes
  )
    out.push(
      `The tile has ${model.pattern.types.length} kinds of piece; the goal is ${goals.pieceTypes}.`,
    );
  const corners = model.pattern.cell.corners.length;
  if (goals.tile === 'hexagon' && corners !== 6)
    out.push('The goal is a hexagonal tile.');
  if (goals.tile === 'parallelogram' && corners !== 4)
    out.push('The goal is a four-cornered tile.');
  return out;
}
