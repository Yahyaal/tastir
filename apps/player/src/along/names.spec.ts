import { evaluate } from '@tastir/engine';
import { parseTutorial } from '@tastir/schema';
import { LIBRARY } from '../app/library';
import { namesIn } from './names';

describe('the points a step names', () => {
  const json = LIBRARY.find((e) => e.id === 'alhambra-arrayanes-squares')?.json;
  const scene = evaluate(parseTutorial(json));

  it('counts the points of a line named by them', () => {
    expect([
      ...namesIn('Draw a line through Q1 parallel to line OF.', scene),
    ]).toEqual(['Q1', 'O', 'F']);
  });

  it('keeps a point family whole', () => {
    expect([
      ...namesIn('Join S2, S4 and S6 with straight lines.', scene),
    ]).toEqual(['S2', 'S4', 'S6']);
  });
});
