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
    readableAt(scene, readableNames(tutorial, scene), 1),
  );
  expect(guidance).toEqual({
    tool: 'compass',
    words: 'Choose Circle, click O, then A.',
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

it('does not introduce a later alias before its step', () => {
  const { tutorial, scene } = loadModel(example);
  const names = readableNames(tutorial, scene);
  expect(readableAt(scene, names, 1).get('1.000000,0.000000')).toBe('A');
  expect(readableAt(scene, names, 2).get('1.000000,0.000000')).toBe('E');
});

it('recommends Perpendicular after the horizontal line is on the board', () => {
  const { tutorial, scene } = loadModel(example);
  const board = check({
    ...emptyDraft('test-pattern', 'Test'),
    steps: [
      {
        id: 1,
        text: 'Draw the circle and horizontal line.',
        create: {
          c: { circle: { centre: 'O', through: 'A' } },
          h: { line: { through: ['O', 'A'] } },
        },
      },
    ],
  }).scene;
  const guidance = guidanceFor(
    tutorial,
    scene,
    board,
    2,
    checkStep(scene, board, 2),
    readableAt(scene, readableNames(tutorial, scene), 2),
  );
  expect(guidance?.tool).toBe('square');
  expect(guidance?.words).toContain('Choose Perpendicular.');
});
