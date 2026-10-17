import { projectHistory, COMPANION_ACTOR } from './projectHistory';

describe('shared project history', () => {
  it('preserves server order and treats every other actor as a boundary for assistant Undo', () => {
    const history = projectHistory({
      undo: [
        { author: 'owner', label: 'Rename' },
        { author: COMPANION_ACTOR, label: 'Add axis' },
        { author: 'mcp-one', label: 'Add circle' },
        { author: 'mcp-two', label: 'Color' },
      ],
      redo: [{ author: COMPANION_ACTOR, label: 'Add tile' }],
    });
    expect(history.undo.map((entry) => entry.source)).toEqual([
      'manual',
      'assistant',
      'manual',
      'manual',
    ]);
    expect(history.undo.map((entry) => entry.label)).toEqual([
      'owner: Rename',
      'tastir-assistant: Add axis',
      'mcp-one: Add circle',
      'mcp-two: Color',
    ]);
    expect(history.undoSteps).toBe(4);
    expect(history.redoSteps).toBe(1);
    expect(history.redo[0]?.source).toBe('assistant');
  });
});
