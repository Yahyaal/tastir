import { emptyDraft, type Draft } from '../editor/document';
import { withoutDuplicates } from './dedupe';

describe('keeping each figure once', () => {
  it('leaves out a figure drawn twice and points its uses at the first', () => {
    const draft: Draft = {
      ...emptyDraft('d', 'D'),
      steps: [
        {
          id: 1,
          text: 'A circle.',
          create: { C1: { circle: { centre: 'O', through: 'A' } } },
        },
        {
          id: 2,
          text: 'The same circle.',
          create: { C2: { circle: { centre: 'O', through: 'A' } } },
        },
        {
          id: 3,
          text: 'A line, and a point on the second circle.',
          create: {
            L1: { line: { through: ['O', 'A'] } },
            P1: { point: { meet: ['C2', 'L1'], pick: { angle: 180 } } },
          },
        },
      ],
    };
    const once = withoutDuplicates(draft);
    expect(once.steps.map((s) => s.id)).toEqual([1, 2]);
    expect(Object.keys(once.steps[0]?.create ?? {})).toEqual(['C1']);
    expect(once.steps[1]?.create?.['P1']).toEqual({
      point: { meet: ['C1', 'L1'], pick: { angle: 180 } },
    });
  });
});
