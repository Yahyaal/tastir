import { cross, distance, sub, type Vec } from '@tastir/engine';
import {
  PaintPatternShape,
  SetTileShape,
  type PaintPattern,
  type SetTile,
  type RepeatSettings,
} from '@tastir/agent-protocol';
import { addStep, check, type Draft } from '../editor/document';
import { tutorialOf } from '../editor/finish';
import { loadModel, type Model } from '../app/model';
import { PALETTES, pieceColors, tutorialColoring } from '../app/coloring';
import { placeFills } from '../app/placement';
import {
  changeRepeat,
  constructionScene,
  drawingDraft,
  type DrawingHistory,
} from './drawing';

/** Keep tile, palette and per-shape colors in the normal editable tutorial format. */
export function savedDrawing(tutorial: Draft, history: DrawingHistory): Draft {
  let draft = drawingDraft(tutorial, history.segments, history.constructions);
  const repeat = history.repeat;
  if (!repeat) return draft;
  let name = 'agentTile';
  const names = check(draft).scene.elements;
  while (names.has(name)) name += '_';
  draft = addStep(draft, {
    text: `Repeat using the tile ${repeat.vertices.join(', ')}.`,
    create: { [name]: { polygon: repeat.vertices } },
  });
  draft = {
    ...draft,
    pattern: {
      cell: name,
      palette: repeat.palette,
      colors: {},
      placements: {
        repeat: [1, 1],
        rules: Object.entries(repeat.colors).map(([piece, color]) => ({
          piece,
          color,
        })),
      },
    },
  };
  const result = tutorialOf(draft);
  if ('reason' in result) throw new Error(result.reason);
  return result.tutorial;
}

export function repeatModel(
  tutorial: Draft,
  history: DrawingHistory,
): Model | undefined {
  if (!history.repeat) return undefined;
  return loadModel(savedDrawing(tutorial, history));
}

/** Reject missing coverage and dangling ink, which the face finder intentionally prunes. */
function validatePattern(model: Model) {
  const { pattern, scene } = model;
  const { cell, ink, types } = pattern;
  const eps = scene.tol.eps * 10;
  if (!Number.isFinite(cell.area) || cell.area <= eps * eps)
    throw new Error('The tile needs a positive area.');
  if (!types.length || types.length > 128 || pattern.pieces.length > 128)
    throw new Error('The tile must close between 1 and 128 pieces.');
  if (types.some((t) => t.sliver))
    throw new Error(
      'The repeat contains a very thin sliver. Mend its ink first.',
    );
  const area = types.reduce((sum, t) => sum + t.area * t.perCell, 0);
  if (Math.abs(area - cell.area) > cell.area * 1e-5)
    throw new Error(
      'The closed pieces do not cover the tile exactly. Close the gaps and connect nested outlines first.',
    );
  const turns = cell.corners.map((a, i, corners) =>
    cross(
      sub(corners[(i + 1) % corners.length]!, a),
      sub(corners[(i + 2) % corners.length]!, a),
    ),
  );
  const sign = Math.sign(turns[0]!);
  if (!sign || turns.some((t) => t * sign <= eps * eps))
    throw new Error(
      'Choose distinct tile corners in boundary order around a convex tile.',
    );
  const inside = (p: Vec) =>
    cell.corners.every(
      (a, i, corners) =>
        cross(sub(corners[(i + 1) % corners.length]!, a), sub(p, a)) * sign >=
        -eps,
    );
  if (ink.some(({ segment: { a, b } }) => !inside(a) || !inside(b)))
    throw new Error(
      'Keep all finite ink inside the chosen tile, including its boundary.',
    );
  const segments = [];
  for (let i = -1; i <= 1; i++)
    for (let j = -1; j <= 1; j++) {
      const shift = {
        x: cell.u.x * i + cell.v.x * j,
        y: cell.u.y * i + cell.v.y * j,
      };
      for (const {
        segment: { a, b },
      } of ink)
        segments.push({
          a: { x: a.x + shift.x, y: a.y + shift.y },
          b: { x: b.x + shift.x, y: b.y + shift.y },
        });
    }
  for (const {
    segment: { a, b },
  } of ink)
    for (const p of [a, b]) {
      const directions: Vec[] = [];
      for (const s of segments) {
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
        throw new Error(
          'A finite side has a loose end, including across the tile seams. Close or remove it first.',
        );
    }
}

export function setTile(
  history: DrawingHistory,
  request: Pick<SetTile, 'vertices'>,
  tutorial: Draft,
): DrawingHistory {
  const { vertices } = SetTileShape.pick({ vertices: true }).parse(request);
  if (
    ![4, 6].includes(vertices.length) ||
    new Set(vertices).size !== vertices.length
  )
    throw new Error(
      'Choose four or six different named points in boundary order.',
    );
  // Validate the boundary before asking the face finder to process a repeat.
  const scene = constructionScene(tutorial, history.constructions);
  const corners = vertices.map((id) => {
    const g = scene.elements.get(id)?.geometry;
    if (g?.kind !== 'point')
      throw new Error(`“${id}” is not a named tile point.`);
    return g.at;
  });
  const turns = corners.map((a, i) =>
    cross(
      sub(corners[(i + 1) % corners.length]!, a),
      sub(corners[(i + 2) % corners.length]!, a),
    ),
  );
  if (
    !Math.sign(turns[0]!) ||
    turns.some((t) => t * Math.sign(turns[0]!) <= scene.tol.eps ** 2)
  )
    throw new Error(
      'Choose distinct tile corners in boundary order around a convex tile.',
    );
  const repeat: RepeatSettings = { vertices, palette: 'Fès tile', colors: {} };
  const candidate = { ...history, repeat };
  const model = repeatModel(tutorial, candidate)!;
  validatePattern(model);
  return changeRepeat(history, repeat);
}

export function paintPattern(
  history: DrawingHistory,
  request: Pick<PaintPattern, 'palette' | 'colors'>,
  tutorial: Draft,
): DrawingHistory {
  const { palette, colors } = PaintPatternShape.pick({
    palette: true,
    colors: true,
  }).parse(request);
  if (!history.repeat)
    throw new Error('Choose a valid repeat tile before coloring.');
  if (palette === null && !colors.length)
    throw new Error('Choose a palette or at least one shape color.');
  if (palette !== null && !Object.hasOwn(PALETTES, palette))
    throw new Error('Choose a palette from the current observation.');
  const model = repeatModel(tutorial, history)!;
  const names = new Set(model.pattern.types.map((t) => t.name));
  if (
    new Set(colors.map((c) => c.typeId)).size !== colors.length ||
    colors.some((c) => !names.has(c.typeId))
  )
    throw new Error(
      'Use each current piece type ID at most once. No colors were changed.',
    );
  return changeRepeat(history, {
    ...history.repeat,
    palette: palette ?? history.repeat.palette,
    colors: {
      ...(palette === null ? history.repeat.colors : {}),
      ...Object.fromEntries(
        colors.map((c) => [c.typeId, c.color.toLowerCase()]),
      ),
    },
  });
}

export function repeatObservation(model: Model, settings: RepeatSettings) {
  const fill = placeFills(model, tutorialColoring(model));
  return {
    vertices: settings.vertices,
    palette: settings.palette,
    types: model.pattern.types.map((t, i) => ({
      id: t.name!,
      perCell: t.perCell,
      color: fill(
        model.pattern.pieces.findIndex((p) => p.type === i),
        0,
        0,
      ),
    })),
  };
}

export function repeatColors(model: Model) {
  const coloring = tutorialColoring(model);
  return {
    colors: pieceColors(model, coloring),
    fill: placeFills(model, coloring),
  };
}

export { repeatTargetId, repeatTargets } from './repeatTargets';
