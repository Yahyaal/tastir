import example from '@tutorials/eight-fold-star-and-cross.json';
import { checkStep } from '@tastir/engine';
import { loadModel } from '../app/model';
import { check, emptyDraft } from '../editor/document';
import { guidanceFor } from './guidance';
import { readableAt, readableNames } from './names';

it('uses visible point names to explain the first compass action', () => {
  const { tutorial, scene } = loadModel(example);
  const board = check(emptyDraft('test-pattern', 'Test')).scene;
  const guidance = guidanceFor(
    tutorial,
    scene,
    board,
    1,
    checkStep(scene, board, 1),
    readableAt(scene, readableNames(tutorial, scene)),
  );
  expect(guidance).toEqual({
    tool: 'compass',
    words: 'Choose Compass, click O, then E.',
  });
});
it('does not suggest more drawing when the step is complete', () => {
  const { tutorial, scene } = loadModel(example);
  expect(
    guidanceFor(
      tutorial,
      scene,
      scene,
      1,
      checkStep(scene, scene, 1),
      new Map(),
    ),
  ).toBeUndefined();
});
