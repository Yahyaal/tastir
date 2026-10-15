import { checkHighlight, SnapshotShape, CallShape } from './index.js';

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
const call = CallShape.parse({
  id: 'call',
  name: 'highlight_target',
  arguments: { snapshotId: 'snapshot', targetId: 'O', label: 'Center' },
});

describe('pointing contracts', () => {
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
