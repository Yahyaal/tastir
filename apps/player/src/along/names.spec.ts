import { evaluate } from '@tastir/engine';
import { parseTutorial } from '@tastir/schema';
import { LIBRARY } from '../app/library';
import { namesIn } from './names';

describe('the points a step names', () => {
  const json = LIBRARY.find((e) => e.id === 'alhambra-arrayanes-squares')?.json;
  const scene = evaluate(parseTutorial(json));

  it('counts the points of a line named by them', () => {
    expect([
      ...namesIn('Draw a line through S2 parallel to line OF.', scene),
    ]).toEqual(['S2', 'O', 'F']);
  });

  it('keeps a point family whole', () => {
    expect([
      ...namesIn('Join S2, S4 and S6 with straight lines.', scene),
    ]).toEqual(['S2', 'S4', 'S6']);
  });

  it('names a whole family given by its ends', () => {
    expect([...namesIn('S1 to S8 are its points.', scene)]).toEqual([
      'S1',
      'S2',
      'S3',
      'S4',
      'S5',
      'S6',
      'S7',
      'S8',
    ]);
  });
});
