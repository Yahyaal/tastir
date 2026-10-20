import {
  distance,
  inkStrokes,
  type InkPiece,
  type Scene,
} from '@tastir/engine';
import { DraftShape, type ElementSpec, type Tutorial } from '@tastir/schema';
import {
  ConstructShape,
  TravelHistoryShape,
  type Construction,
  type Construct,
  type DrawingSegment,
  type RepeatSettings,
  type EditSegments,
  type HistoryAction,
} from '@tastir/agent-protocol';
import { addStep, check, copyUpTo, type Draft } from './document.js';

interface DrawingContent {
  action?: HistoryAction;
  segments: DrawingSegment[];
  constructions: Construction[];
  repeat: RepeatSettings | null;
}
export interface DrawingHistory extends DrawingContent {
  revision: number;
  nextId: number;
  past: DrawingContent[];
  future: DrawingContent[];
}
export const emptyDrawing = (): DrawingHistory => ({
  revision: 0,
  nextId: 1,
  segments: [],
  constructions: [],
  repeat: null,
  past: [],
  future: [],
});

/** One validated batch is one history entry, shared by model and manual edits. */
export function editSegments(
  history: DrawingHistory,
  edit: Pick<EditSegments, 'add' | 'remove'>,
  scene: Scene,
): DrawingHistory {
  if (!edit.add.length && !edit.remove.length)
    throw new Error('The edit contains no changes.');
  if (edit.add.length > 32 || edit.remove.length > 128)
    throw new Error('Use at most 32 new segments in one edit.');
  const remove = new Set(edit.remove);
  if (
    remove.size !== edit.remove.length ||
    edit.remove.some((id) => !history.segments.some((s) => s.id === id))
  )
    throw new Error(
      'A segment to remove no longer exists. Send the current view.',
    );
  const kept = history.segments.filter((s) => !remove.has(s.id));
  if (kept.length + edit.add.length > 128)
    throw new Error('This workspace holds at most 128 segments.');
  const point = (id: string) => {
    const g = scene.elements.get(id)?.geometry;
    if (
      g?.kind !== 'point' ||
      !Number.isFinite(g.at.x) ||
      !Number.isFinite(g.at.y)
    )
      throw new Error(`“${id}” is not a named point in this construction.`);
    return g.at;
  };
  let nextId = history.nextId;
  const segments = [...kept];
  for (const { from, to } of edit.add) {
    const a = point(from),
      b = point(to);
    if (distance(a, b) <= scene.tol.eps)
      throw new Error('A segment needs two different points.');
    if (
      segments.some((s) => {
        const c = point(s.from),
          d = point(s.to);
        return (
          (distance(a, c) <= scene.tol.eps &&
            distance(b, d) <= scene.tol.eps) ||
          (distance(a, d) <= scene.tol.eps && distance(b, c) <= scene.tol.eps)
        );
      })
    )
      throw new Error(
        'That segment is already drawn. No changes were applied.',
      );
    segments.push({ id: `agentSegment${nextId++}`, from, to });
  }
  if (edit.remove.length === 1 && edit.add.length === 1) {
    const replacement = segments.pop()!;
    segments.splice(
      history.segments.findIndex((s) => s.id === edit.remove[0]),
      0,
      replacement,
    );
  }
  return {
    ...history,
    revision: history.revision + 1,
    nextId,
    segments,
    repeat: null,
    past: [...history.past.slice(-49), contentOf(history)],
    future: [],
  };
}

export function travelDrawing(
  history: DrawingHistory,
  direction: 'undo' | 'redo',
): DrawingHistory {
  const before = direction === 'undo' ? history.past.at(-1) : history.future[0];
  if (!before) return history;
  return {
    ...history,
    revision: history.revision + 1,
    ...before,
    past:
      direction === 'undo'
        ? history.past.slice(0, -1)
        : [...history.past, contentOf(history)],
    future:
      direction === 'undo'
        ? [contentOf(history), ...history.future]
        : history.future.slice(1),
  };
}

/** Validate model requests atomically before sharing the manual Undo/Redo path. */
export function travelHistory(
  history: DrawingHistory,
  input: unknown,
): DrawingHistory {
  const request = TravelHistoryShape.parse(input);
  const available =
    request.direction === 'undo' ? history.past.length : history.future.length;
  if (request.steps > available)
    throw new Error(
      `Only ${available} ${request.direction} steps are available. No changes were applied.`,
    );
  if (
    request.scope === 'assistant' &&
    historyObservation(history)
      [request.direction].slice(0, request.steps)
      .some((action) => action.source !== 'assistant')
  )
    throw new Error(
      'Undo/Redo your changes stops before manual or unidentified edits. No changes were applied.',
    );
  let next = history;
  for (let i = 0; i < request.steps; i++)
    next = travelDrawing(next, request.direction);
  return next;
}

/** Next action first; retained across requests and real Undo/Redo. */
export function historyObservation(history: DrawingHistory) {
  const unknown: HistoryAction = {
    source: 'unknown',
    requestId: null,
    label: 'Unidentified edit',
  };
  return {
    undoSteps: history.past.length,
    redoSteps: history.future.length,
    undo: [history, ...history.past.slice(1).reverse()]
      .slice(0, history.past.length)
      .map((state) => state.action ?? unknown),
    redo: history.future.map((state) => state.action ?? unknown),
  };
}

/** Export through the existing editor document and engine ink format, without coordinates. */
export function drawingDraft(
  tutorial: Draft,
  segments: readonly DrawingSegment[],
  constructions: readonly Construction[] = [],
): Draft {
  let draft = constructionDraft(tutorial, constructions);
  const names = new Set(check(draft).scene.elements.keys());
  for (const s of segments) {
    let name = s.id;
    while (names.has(name)) name += '_';
    names.add(name);
    draft = addStep(draft, {
      text: `Join ${s.from} to ${s.to}.`,
      create: { [name]: { line: { through: [s.from, s.to] } } },
    });
  }
  if (!segments.length) return draft;
  return {
    ...draft,
    ink: { paths: segments.map((s) => ({ through: [s.from, s.to] })) },
  };
}

/** The same engine strokes used by saved patterns are drawn inside the captured SVG. */
export function drawingPieces(
  tutorial: Draft,
  segments: readonly DrawingSegment[],
  constructions: readonly Construction[] = [],
): InkPiece[] {
  if (!segments.length) return [];
  const draft = drawingDraft(tutorial, segments, constructions);
  const checked = check(draft);
  if ([...checked.status.values()].some((s) => !s.ok))
    throw new Error('The drawing could not be evaluated.');
  return inkStrokes(checked.scene, draft as Tutorial).map((s, i) => ({
    id: segments[i]!.id,
    segment: s.segment,
  }));
}

const contentOf = (history: DrawingHistory): DrawingContent => ({
  action: history.action,
  segments: history.segments,
  constructions: history.constructions,
  repeat: history.repeat,
});

/** Every named input, including the points/circles used to select a crossing. */
export function constructionReferences(operation: Construction): string[] {
  switch (operation.kind) {
    case 'line':
      return [operation.from, operation.to];
    case 'circle':
      return [operation.centre, operation.through];
    case 'intersection':
      return [operation.first, operation.second];
    case 'perpendicular':
      return [operation.through, operation.perpendicularTo];
    case 'parallel':
      return [operation.through, operation.parallelTo];
    case 'bisector':
      return [...operation.bisects];
    case 'same-opening':
      return [operation.centre, operation.radiusOf];
    case 'opening-from-points':
      return [operation.centre, ...operation.radiusFrom];
    case 'touching':
      return [operation.centre, ...operation.tangentTo];
    case 'polygon':
      return [...operation.vertices];
    case 'point':
      return [
        ...operation.meet,
        ...Object.values(operation.pick ?? {}).filter(
          (value): value is string => typeof value === 'string',
        ),
      ];
  }
}

export function constructionSpec(operation: Construction): ElementSpec {
  switch (operation.kind) {
    case 'line':
      return { line: { through: [operation.from, operation.to] } };
    case 'circle':
      return {
        circle: { centre: operation.centre, through: operation.through },
      };
    case 'perpendicular':
      return {
        line: {
          through: operation.through,
          perpendicularTo: operation.perpendicularTo,
        },
      };
    case 'parallel':
      return {
        line: { through: operation.through, parallelTo: operation.parallelTo },
      };
    case 'bisector':
      return {
        line: { through: operation.bisects[1], bisects: operation.bisects },
      };
    case 'same-opening':
      return {
        circle: { centre: operation.centre, radiusOf: operation.radiusOf },
      };
    case 'opening-from-points':
      return {
        circle: { centre: operation.centre, radiusFrom: operation.radiusFrom },
      };
    case 'touching':
      return {
        circle: {
          centre: operation.centre,
          tangentTo: operation.tangentTo,
          ...(operation.touch ? { touch: operation.touch } : {}),
        },
      };
    case 'polygon':
      return { polygon: operation.vertices };
    case 'point':
      return {
        point: {
          meet: operation.meet,
          ...(operation.pick ? { pick: operation.pick } : {}),
        },
      };
    case 'intersection':
      return {
        point: {
          meet: [operation.first, operation.second],
          ...(operation.angle === null
            ? {}
            : { pick: { angle: operation.angle } }),
        },
      };
  }
}

export function constructionText(operation: Construction): string {
  switch (operation.kind) {
    case 'line':
      return `Line ${operation.name} through ${operation.from} and ${operation.to}.`;
    case 'circle':
      return `Circle ${operation.name} about ${operation.centre} through ${operation.through}.`;
    case 'perpendicular':
      return `Draw ${operation.name} through ${operation.through}, square to ${operation.perpendicularTo}.`;
    case 'parallel':
      return `Draw ${operation.name} through ${operation.through}, parallel to ${operation.parallelTo}.`;
    case 'bisector':
      return `Draw ${operation.name} halving the angle ${operation.bisects.join('–')}.`;
    case 'same-opening':
      return `Circle ${operation.name} about ${operation.centre}, with the opening of ${operation.radiusOf}.`;
    case 'opening-from-points':
      return `Circle ${operation.name} about ${operation.centre}, with the opening ${operation.radiusFrom.join('–')}.`;
    case 'touching':
      return `Circle ${operation.name} about ${operation.centre}, touching ${operation.tangentTo.join(', ')}${operation.touch ? ` on the ${operation.touch} side` : ''}.`;
    case 'polygon':
      return `Join ${operation.vertices.join('–')} as polygon ${operation.name}.`;
    case 'point':
      return `Point ${operation.name} where ${operation.meet.join(' and ')} meet${operation.pick ? `, chosen by ${JSON.stringify(operation.pick)}` : ''}.`;
    case 'intersection':
      return `Point ${operation.name} where ${operation.first} and ${operation.second} meet${operation.angle === null ? '' : `, chosen toward ${operation.angle}° about O`}.`;
  }
}

export function constructionDraft(
  tutorial: Draft,
  operations: readonly Construction[],
): Draft {
  // copyUpTo only reads construction metadata and steps; an unfinished draft is sufficient.
  let draft: Draft =
    tutorial.id === 'agent-blank'
      ? {
          ...tutorial,
          id: 'my-compass-construction',
          steps: [...tutorial.steps],
        }
      : copyUpTo(tutorial as Tutorial, tutorial.steps.at(-1)?.id ?? 0);
  for (const operation of operations)
    draft = addStep(draft, {
      text: constructionText(operation),
      create: { [operation.name]: constructionSpec(operation) },
    });
  return draft;
}

export function constructionScene(
  tutorial: Draft,
  operations: readonly Construction[],
): Scene {
  const result = check(constructionDraft(tutorial, operations));
  const failed = [...result.status.values()].find((s) => !s.ok);
  if (failed && !failed.ok) throw new Error(failed.reason);
  for (const element of result.scene.elements.values()) {
    const geometry = element.geometry;
    const values =
      geometry.kind === 'point'
        ? [geometry.at.x, geometry.at.y]
        : geometry.kind === 'circle'
          ? [
              geometry.circle.centre.x,
              geometry.circle.centre.y,
              geometry.circle.radius,
            ]
          : geometry.kind === 'line'
            ? [
                geometry.line.point.x,
                geometry.line.point.y,
                geometry.line.dir.x,
                geometry.line.dir.y,
              ]
            : [];
    if (values.some((value) => !Number.isFinite(value)))
      throw new Error('The construction produced invalid geometry.');
  }
  return result.scene;
}

/** Validate references, names and the entire dependent drawing before committing anything. */
export function construct(
  history: DrawingHistory,
  request: Pick<Construct, 'add' | 'remove'>,
  tutorial: Draft,
): DrawingHistory {
  const edit = ConstructShape.pick({ add: true, remove: true }).parse({
    add: request.add,
    remove: request.remove,
  });
  if (!edit.add.length && !edit.remove.length)
    throw new Error('The edit contains no changes.');
  const remove = new Set(edit.remove);
  if (
    remove.size !== edit.remove.length ||
    edit.remove.some(
      (name) => !history.constructions.some((op) => op.name === name),
    )
  )
    throw new Error(
      'Remove only construction elements added in this workspace.',
    );
  const operations = history.constructions.filter((op) => !remove.has(op.name));
  if (operations.length + edit.add.length > 128)
    throw new Error('This workspace holds at most 128 construction elements.');
  // Include every original name, even if off screen, to prevent overwrites.
  const names = new Set(
    constructionScene(tutorial, operations).elements.keys(),
  );
  for (const operation of edit.add) {
    if (names.has(operation.name))
      throw new Error(
        `The name “${operation.name}” already exists. Choose a new name.`,
      );
    // An existing side may have the same generated carrier name on export.
    if (history.segments.some((side) => side.id === operation.name))
      throw new Error(
        'That name belongs to an existing side. Choose another name.',
      );
    names.add(operation.name);
    operations.push(operation);
  }
  const draft = drawingDraft(tutorial, history.segments, operations);
  const parsed = DraftShape.safeParse(draft);
  if (!parsed.success)
    throw new Error(
      'Use valid named references to earlier construction elements.',
    );
  const scene = constructionScene(tutorial, operations);
  for (const name of history.repeat?.vertices ?? [])
    if (scene.elements.get(name)?.geometry.kind !== 'point')
      throw new Error(
        `The repeat tile still needs “${name}”. Change its tile first.`,
      );
  // This also rejects removing a point still used by a finite side.
  if (draft.ink) inkStrokes(sceneForDrawing(draft), draft as Tutorial);
  if (scene.elements.size > 5000)
    throw new Error(
      'The construction has too many elements for this workspace.',
    );
  return {
    ...history,
    revision: history.revision + 1,
    constructions: operations,
    past: [...history.past.slice(-49), contentOf(history)],
    future: [],
  };
}

function sceneForDrawing(draft: Draft): Scene {
  const result = check(draft);
  const failed = [...result.status.values()].find((s) => !s.ok);
  if (failed && !failed.ok) throw new Error(failed.reason);
  return result.scene;
}

/** Shared history for repeat and color changes, using the same revision guards. */
export function changeRepeat(
  history: DrawingHistory,
  repeat: RepeatSettings,
): DrawingHistory {
  return {
    ...history,
    repeat,
    revision: history.revision + 1,
    past: [...history.past.slice(-49), contentOf(history)],
    future: [],
  };
}
