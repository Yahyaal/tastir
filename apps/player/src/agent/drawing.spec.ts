import { distance, dot, evaluate, inkStrokes, sub } from '@tastir/engine';
import { DraftShape, parseTutorial, type Tutorial } from '@tastir/schema';
import source from '@tutorials/eight-fold-star-and-octagon.json';
import { check } from '../editor/document';
import {
  drawingDraft,
  drawingPieces,
  editSegments,
  emptyDrawing,
  travelDrawing,
} from './drawing';

const tutorial = parseTutorial(source);
const originalSteps = structuredClone(tutorial.steps);
const scene = evaluate(tutorial);
const names = ['jW', 'jN', 'jE', 'jS'];
const square = {
  add: names.map((from, i) => ({ from, to: names[(i + 1) % 4]! })),
  remove: [],
};

describe('editable assistant drawing', () => {
  it('makes exactly four finite equal sides with right angles, then undoes the whole square', () => {
    const before = emptyDrawing();
    const after = editSegments(before, square, scene);
    const pieces = drawingPieces(tutorial, after.segments);
    expect(pieces).toHaveLength(4);
    const length = distance(pieces[0]!.segment.a, pieces[0]!.segment.b);
    for (const [i, { segment: s }] of pieces.entries()) {
      const next = pieces[(i + 1) % 4]!.segment;
      expect(distance(s.a, s.b)).toBeCloseTo(length, 10);
      expect(distance(s.b, next.a)).toBeLessThan(1e-10);
      expect(dot(sub(s.b, s.a), sub(next.b, next.a))).toBeCloseTo(0, 10);
    }
    expect(before.segments).toEqual([]);
    const undone = travelDrawing(after, 'undo');
    expect(undone.segments).toEqual([]);
    expect(undone.revision).toBeGreaterThan(after.revision);
    expect(travelDrawing(undone, 'redo').segments).toEqual(after.segments);
  });
  it('rejects an entire edit for unknown points, coincident ends, or reversed duplicates', () => {
    const state = editSegments(emptyDrawing(), square, scene);
    for (const add of [
      [{ from: 'jW', to: 'missing' }],
      [{ from: 'jW', to: 'c' }],
      [{ from: 'jW', to: 'jW' }],
      [{ from: 'jN', to: 'jW' }],
      [
        { from: 'O', to: 'A' },
        { from: 'O', to: 'missing' },
      ],
    ])
      expect(() => editSegments(state, { add, remove: [] }, scene)).toThrow();
    expect(state.segments).toHaveLength(4);
    expect(() =>
      editSegments(state, { add: [], remove: ['missing'] }, scene),
    ).toThrow();
  });
  it('replaces one side as one edit and clears redo after a different edit', () => {
    const state = editSegments(emptyDrawing(), square, scene);
    const replaced = editSegments(
      state,
      { remove: [state.segments[0]!.id], add: [{ from: 'jW', to: 'O' }] },
      scene,
    );
    expect(replaced.segments).toHaveLength(4);
    const undone = travelDrawing(replaced, 'undo');
    expect(undone.segments).toEqual(state.segments);
    const next = editSegments(
      undone,
      { remove: [state.segments[1]!.id], add: [] },
      scene,
    );
    expect(next.future).toEqual([]);
    expect(next.revision).toBeGreaterThan(undone.revision);
  });
  it('keeps a valid editor draft with named references and the same four ink strokes', () => {
    const state = editSegments(emptyDrawing(), square, scene);
    const draft = drawingDraft(tutorial, state.segments);
    expect(DraftShape.safeParse(draft).success).toBe(true);
    expect([...check(draft).status.values()].every((s) => s.ok)).toBe(true);
    expect(inkStrokes(check(draft).scene, draft as Tutorial)).toHaveLength(4);
    expect(draft.steps.slice(tutorial.steps.length)).toHaveLength(4);
    expect(draft.ink!.paths).toEqual(
      square.add.map((s) => ({ through: [s.from, s.to] })),
    );
    expect(draft.credits.some((c) => c.source.startsWith('Tastir:'))).toBe(
      true,
    );
    expect(tutorial.steps).toEqual(originalSteps);
  });
});
