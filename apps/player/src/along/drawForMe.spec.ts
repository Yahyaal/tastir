import { checkStep, evaluate } from '@tastir/engine';
import { parseTutorial, type Tutorial } from '@tastir/schema';
import { emptyDraft, type Draft } from '../editor/document';
import { LIBRARY } from '../app/library';
import { shownBeats } from '../app/model';
import { drawForMe } from './drawForMe';

const beginners = LIBRARY.map((e) => e.json)
  .filter((j) => (j as { level?: string }).level === 'beginner')
  .map((j) => parseTutorial(j));

/** Every shown step drawn for the learner, from an empty board. */
export function drawnForMe(t: Tutorial): Draft {
  const scene = evaluate(t);
  let draft = emptyDraft(`${t.id}-along`, t.title);
  for (const beat of shownBeats(t)) {
    draft = drawForMe(t, scene, draft, beat, 'Drawn for me.') ?? draft;
    const board = evaluate({ steps: draft.steps } as Tutorial);
    expect(checkStep(scene, board, beat).done, `${t.id} beat ${beat}`).toBe(
      true,
    );
  }
  return draft;
}

describe('Draw it for me', () => {
  it.each(beginners.map((t) => [t.id, t] as const))('%s', (_, t) => {
    drawnForMe(t);
  });

  it('draws a step on a board drawn another way', () => {
    const t = beginners.find(
      (x) => x.id === 'eight-fold-star-and-cross',
    ) as Tutorial;
    const scene = evaluate(t);
    let draft = emptyDraft('along', t.title);
    for (const beat of [1, 2, 3])
      draft = drawForMe(t, scene, draft, beat, '') ?? draft;
    // The dynamic square as four ruled lines, not a polygon.
    draft = {
      ...draft,
      steps: [
        ...draft.steps,
        {
          id: draft.steps.length + 1,
          text: 'Four lines.',
          create: {
            S: { point: { meet: ['c', 'v'], pick: { angle: 270 } } },
            L1: { line: { through: ['A', 'N'] } },
            L2: { line: { through: ['N', 'W'] } },
            L3: { line: { through: ['W', 'S'] } },
            L4: { line: { through: ['S', 'A'] } },
          },
        },
      ],
    };
    const before = evaluate({ steps: draft.steps } as Tutorial);
    expect(checkStep(scene, before, 4).done).toBe(true);
    // Step 5 marks the crossings of the two squares, so the dynamic
    // square is drawn as a shape on the way.
    draft = drawForMe(t, scene, draft, 5, '') ?? draft;
    const after = evaluate({ steps: draft.steps } as Tutorial);
    expect(checkStep(scene, after, 5).done).toBe(true);
    expect(drawForMe(t, scene, draft, 5, '')).toBeUndefined();
  });
});
