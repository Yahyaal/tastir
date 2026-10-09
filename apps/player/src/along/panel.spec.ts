import example from '@tutorials/eight-fold-star-and-cross.json';
import { evaluate, expectedGolden } from '@tastir/engine';
import { parseTutorial, partsOf } from '@tastir/schema';
import { emptyDraft } from '../editor/document';
import { renameSpec } from '../editor/blocks';
import { tutorialOf } from '../editor/finish';
import { readyToInk } from './inking';
import { withTutorialInk } from './drawForMe';

it('keeps a panel when the learner gave its construction different names', () => {
  const base = parseTutorial(example);
  const tutorial = parseTutorial({
    ...base,
    pattern: { ...base.pattern, panel: 'cell' },
  });
  const rename = (name: string) =>
    ['O', 'A'].includes(name) ? name : `user_${name}`;
  const board = {
    ...emptyDraft('mine', 'My drawing'),
    steps: tutorial.steps.map((s) => ({
      id: s.id,
      text: s.text,
      create: Object.fromEntries(
        partsOf(s).flatMap((p) =>
          Object.entries(p.create).map(([name, spec]) => [
            rename(name),
            renameSpec(spec, rename),
          ]),
        ),
      ),
    })),
  };
  const scene = evaluate(tutorial);
  const ready = readyToInk(tutorial, scene, board);
  expect(ready.pattern?.panel).toBe('user_cell');
  const kept = tutorialOf(withTutorialInk(tutorial, scene, ready));
  if (!('tutorial' in kept)) throw new Error(kept.reason);
  expect(expectedGolden(kept.tutorial).pieces).toEqual(
    expectedGolden(tutorial).pieces,
  );
});
