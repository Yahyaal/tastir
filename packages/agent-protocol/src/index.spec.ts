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
  it('accepts only explicit bounded Undo/Redo requests', () => {
    const request = {
      id: 'history',
      name: 'travel_history',
      arguments: {
        snapshotId: 'snapshot',
        documentRevision: '1',
        direction: 'undo',
        steps: 1,
        label: 'Undo',
      },
    };
    expect(CallShape.safeParse(request).success).toBe(true);
    expect(
      CallShape.safeParse({
        ...request,
        arguments: { ...request.arguments, direction: 'redo', steps: 50 },
      }).success,
    ).toBe(true);
    for (const changes of [
      { steps: 0 },
      { steps: 51 },
      { steps: 1.5 },
      { direction: 'clear' },
      { steps: undefined },
      { all: true },
    ])
      expect(
        CallShape.safeParse({
          ...request,
          arguments: { ...request.arguments, ...changes },
        }).success,
      ).toBe(false);
  });
  it('allows relational construction operations and rejects raw coordinates or an unspecified intersection rule', () => {
    const command = {
      id: 'build',
      name: 'construct',
      arguments: {
        snapshotId: 'snapshot',
        documentRevision: '1',
        label: 'Circle',
        remove: [],
        add: [{ kind: 'circle', name: 'C', centre: 'O', through: 'A' }],
      },
    };
    expect(CallShape.safeParse(command).success).toBe(true);
    for (const operation of [
      { kind: 'point', name: 'P', x: 1, y: 2 },
      { kind: 'circle', name: 'C', centre: 'O', radius: 1 },
      { kind: 'intersection', name: 'P', first: 'C', second: 'L' },
      { kind: 'line', name: 'bad.name', from: 'O', to: 'A' },
    ])
      expect(
        CallShape.safeParse({
          ...command,
          arguments: { ...command.arguments, add: [operation] },
        }).success,
      ).toBe(false);
  });
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
  it('accepts named tiles and bounded hex colors without arbitrary styling or coordinates', () => {
    const args = {
      snapshotId: 'snapshot',
      documentRevision: '1',
      label: 'Repeat',
    };
    expect(
      CallShape.safeParse({
        id: 'tile',
        name: 'set_tile',
        arguments: { ...args, vertices: ['N', 'E', 'S', 'W'] },
      }).success,
    ).toBe(true);
    const paint = {
      id: 'paint',
      name: 'paint_pattern',
      arguments: {
        ...args,
        palette: null,
        colors: [{ typeId: 'square', color: '#2453a6' }],
      },
    };
    expect(CallShape.safeParse(paint).success).toBe(true);
    for (const color of [
      'red',
      '#abc',
      'url(https://example.com)',
      '#12345678',
    ])
      expect(
        CallShape.safeParse({
          ...paint,
          arguments: {
            ...paint.arguments,
            colors: [{ typeId: 'square', color }],
          },
        }).success,
      ).toBe(false);
  });
  it('accepts navigation by destination ID and an imageless screen observation', () => {
    const call = {
      id: 'go',
      name: 'navigate',
      arguments: {
        snapshotId: 'snapshot',
        documentRevision: '1',
        destinationId: 'work',
        label: 'Your work',
      },
    };
    expect(CallShape.safeParse(call).success).toBe(true);
    expect(
      CallShape.safeParse({
        ...call,
        arguments: { ...call.arguments, url: 'https://example.com' },
      }).success,
    ).toBe(false);
    expect(
      SnapshotShape.safeParse({
        ...snapshot,
        image: null,
        targets: [],
        mode: 'screen',
        screen: {
          route: 'work',
          title: 'Your work',
          description: 'Saved work',
          destinations: [],
        },
      }).success,
    ).toBe(true);
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
