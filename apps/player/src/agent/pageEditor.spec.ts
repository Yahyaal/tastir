import { CallShape, type ToolCall } from '@tastir/agent-protocol';
import { check, emptyDraft } from '../editor/document';
import { checkedDraftEdit } from './pageEditor';
import {
  draftHistoryObservation,
  editDraft,
  travelDraft,
} from '../editor/history';

const call = (
  steps: Record<string, unknown>[],
  remove: number[] = [],
): ToolCall =>
  CallShape.parse({
    id: 'edit',
    name: 'apply_steps',
    arguments: {
      snapshotId: 's',
      documentRevision: 'r',
      label: 'Compass construction',
      steps: steps.map((create) => ({
        text: 'Construct with the ruler and compass.',
        createJson: JSON.stringify(create),
      })),
      remove,
    },
  });
const base = () => emptyDraft('test', 'My pattern');
const compass = () =>
  checkedDraftEdit(
    base(),
    call([
      { C0: { circle: { centre: 'O', through: 'A' } } },
      { C1: { circle: { centre: 'A', through: 'O' } } },
      { Top: { point: { meet: ['C0', 'C1'], pick: { angle: 90 } } } },
      { Axis: { line: { through: ['O', 'A'] } } },
      { Perp: { line: { through: 'Top', perpendicularTo: 'Axis' } } },
    ]),
  );
describe('normal editor assistant commands', () => {
  it('uses the real engine for ordered construction batches, perpendiculars and symmetry without coordinates', () => {
    const made = compass();
    const more = checkedDraftEdit(
      made,
      call([{ Copies: { repeat: { of: ['Perp'], by: 'rot8' } } }]),
    );
    expect([...check(more).status.values()].every((s) => s.ok)).toBe(true);
    expect(check(more).scene.elements.has('Perp')).toBe(true);
    expect(base().steps).toHaveLength(0);
  });
  it('rejects coordinates, missing references, duplicate names and broken dependent removals atomically', () => {
    const made = compass();
    const before = JSON.stringify(made);
    for (const edit of [
      call([{ P: { point: { x: 2, y: 4 } } }]),
      call([{ Bad: { line: { through: ['O', 'Missing'] } } }]),
      call([{ C0: { circle: { centre: 'O', through: 'A' } } }]),
      call([], [1]),
    ])
      expect(() => checkedDraftEdit(made, edit)).toThrow();
    expect(JSON.stringify(made)).toBe(before);
  });
  it('keeps finite ink and restores whole construction batches through the normal history', () => {
    const made = compass();
    const ink = checkedDraftEdit(
      made,
      CallShape.parse({
        id: 'ink',
        name: 'edit_segments',
        arguments: {
          snapshotId: 's',
          documentRevision: 'r',
          label: 'Ink a side',
          add: [{ from: 'O', to: 'Top' }],
          remove: [],
        },
      }),
    );
    expect(ink.ink?.paths).toEqual([{ through: ['O', 'Top'] }]);
    const removed = checkedDraftEdit(
      ink,
      CallShape.parse({
        id: 'remove',
        name: 'edit_segments',
        arguments: {
          snapshotId: 's',
          documentRevision: 'r',
          label: 'Remove the finite side',
          add: [],
          remove: ['ink0'],
        },
      }),
    );
    expect(removed.ink).toBeUndefined();
    expect(() => checkedDraftEdit(ink, call([], [3]))).toThrow();
    const history = editDraft({ past: [], now: made, future: [] }, ink, {
      source: 'assistant',
      requestId: 'request',
      label: 'Ink a side',
    });
    expect(draftHistoryObservation(history).undo[0]?.source).toBe('assistant');
    const undone = travelDraft(history, 'undo', 1, true);
    expect(undone.now).toEqual(made);
    expect(travelDraft(undone, 'redo', 1, true).now).toEqual(ink);
    const manual = editDraft(history, { ...ink, title: 'My manual change' });
    expect(() => travelDraft(manual, 'undo', 2, true)).toThrow(/manual/);
    expect(manual.now.title).toBe('My manual change');
  });
  it('merges consecutive manual text edits without losing assistant ownership of earlier batches', () => {
    const start = { past: [], now: base(), future: [] };
    const first = editDraft(start, compass(), {
      source: 'assistant',
      requestId: 'r',
      label: 'Construction',
    });
    const typed = editDraft(first, { ...first.now, title: 'A' });
    const merged = editDraft(
      typed,
      { ...typed.now, title: 'AB' },
      undefined,
      true,
    );
    expect(merged.past).toHaveLength(2);
    expect(draftHistoryObservation(merged).undo.map((a) => a.source)).toEqual([
      'manual',
      'assistant',
    ]);
    expect(travelDraft(merged, 'undo', 2).now).toEqual(start.now);
  });
});
