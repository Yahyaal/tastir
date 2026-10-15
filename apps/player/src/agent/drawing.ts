import {
  distance,
  inkStrokes,
  type InkPiece,
  type Scene,
} from '@tastir/engine';
import type { Tutorial } from '@tastir/schema';
import type { DrawingSegment, EditSegments } from '@tastir/agent-protocol';
import { addStep, check, copyUpTo, type Draft } from '../editor/document';

export interface DrawingHistory {
  revision: number;
  nextId: number;
  segments: DrawingSegment[];
  past: DrawingSegment[][];
  future: DrawingSegment[][];
}
export const emptyDrawing = (): DrawingHistory => ({
  revision: 0,
  nextId: 1,
  segments: [],
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
    revision: history.revision + 1,
    nextId,
    segments,
    past: [...history.past.slice(-49), history.segments],
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
    segments: before,
    past:
      direction === 'undo'
        ? history.past.slice(0, -1)
        : [...history.past, history.segments],
    future:
      direction === 'undo'
        ? [history.segments, ...history.future]
        : history.future.slice(1),
  };
}

/** Export through the existing editor document and engine ink format, without coordinates. */
export function drawingDraft(
  tutorial: Tutorial,
  segments: readonly DrawingSegment[],
): Draft {
  let draft = copyUpTo(tutorial, tutorial.steps.at(-1)?.id ?? 0);
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
  return {
    ...draft,
    ink: { paths: segments.map((s) => ({ through: [s.from, s.to] })) },
  };
}

/** The same engine strokes used by saved patterns are drawn inside the captured SVG. */
export function drawingPieces(
  tutorial: Tutorial,
  segments: readonly DrawingSegment[],
): InkPiece[] {
  if (!segments.length) return [];
  const draft = drawingDraft(tutorial, segments);
  const checked = check(draft);
  if ([...checked.status.values()].some((s) => !s.ok))
    throw new Error('The drawing could not be evaluated.');
  return inkStrokes(checked.scene, draft as Tutorial).map((s, i) => ({
    id: segments[i]!.id,
    segment: s.segment,
  }));
}
