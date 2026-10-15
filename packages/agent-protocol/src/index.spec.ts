import {
  checkHighlight,
  SnapshotShape,
  CallShape,
  HighlightCallShape,
} from './index.js';

const snapshot = SnapshotShape.parse({
  id: 'snapshot',
  documentId: 'pattern',
  documentRevision: '1',
  viewRevision: 'view-1',
  title: 'Example',
  selected: 'O',
  targets: [{ id: 'O', kind: 'point', geometry: { x: 0, y: 0 } }],
  image: 'data:image/png;base64,AAAA',
});
const call = HighlightCallShape.parse({
  id: 'call',
  name: 'highlight_target',
  arguments: { snapshotId: 'snapshot', targetId: 'O', label: 'Center' },
});

describe('pointing contracts', () => {
  it('accepts only bounded drawing edits made from named references', () => {
    const edit = {
      id: 'edit',
      name: 'edit_segments',
      arguments: {
        snapshotId: 'snapshot',
        documentRevision: '1',
        label: 'Square',
        add: [{ from: 'jW', to: 'jN' }],
        remove: [],
      },
    };
    expect(CallShape.safeParse(edit).success).toBe(true);
    expect(
      CallShape.safeParse({
        ...edit,
        arguments: { ...edit.arguments, add: [{ from: 'jW', to: 'jN', x: 1 }] },
      }).success,
    ).toBe(false);
    expect(
      CallShape.safeParse({
        ...edit,
        arguments: {
          ...edit.arguments,
          add: Array(33).fill({ from: 'jW', to: 'jN' }),
        },
      }).success,
    ).toBe(false);
  });
  it('accepts a known target only on its original view', () => {
    expect(checkHighlight(call, snapshot, 'view-1').ok).toBe(true);
    expect(checkHighlight(call, snapshot, 'view-2').ok).toBe(false);
    expect(
      checkHighlight(
        { ...call, arguments: { ...call.arguments, snapshotId: 'old' } },
        snapshot,
        'view-1',
      ).ok,
    ).toBe(false);
    expect(
      checkHighlight(
        { ...call, arguments: { ...call.arguments, targetId: 'missing' } },
        snapshot,
        'view-1',
      ).ok,
    ).toBe(false);
  });
  it('rejects remote image URLs and extra command fields', () => {
    expect(
      SnapshotShape.safeParse({
        ...snapshot,
        image: 'https://example.com/image.png',
      }).success,
    ).toBe(false);
    expect(CallShape.safeParse({ ...call, script: 'alert(1)' }).success).toBe(
      false,
    );
    expect(CallShape.safeParse({ ...call, name: 'run_shell' }).success).toBe(
      false,
    );
  });
});
