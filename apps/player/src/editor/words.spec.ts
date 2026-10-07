import example from '@tutorials/eight-fold-star-and-cross.json';
import { parseTutorial } from '@tastir/schema';
import { check, copyUpTo, plainReason, sayStep, specsOf } from './document';

const draft = copyUpTo(parseTutorial(example), 3);
const drawn = { scene: check(draft).scene };
const say = (create: Parameters<typeof sayStep>[0]) =>
  sayStep(create, draft, drawn);

describe('generated step texts', () => {
  it('names lines by where they run, never one description inside another', () => {
    expect(say({ L1: { line: { through: 'N', perpendicularTo: 'v' } } })).toBe(
      'Draw a line through N, square to the vertical line.',
    );
    expect(say({ L1: { line: { through: 'N', parallelTo: 'd1' } } })).toBe(
      'Draw a line through N, parallel to the line through O at 45°.',
    );
  });

  it('uses the name the drawing shows: E, not the given A in the same place', () => {
    expect(say({ L1: { line: { through: ['O', 'A'] } } })).toBe(
      'Draw a line through O and E.',
    );
    expect(say({ C1: { circle: { centre: 'A', through: 'O' } } })).toBe(
      'Put the compass point on E and draw a circle through O.',
    );
  });

  it('keeps a tile step to two short sentences', () => {
    expect(
      say({
        P1: { point: { meet: ['h', 'd1'] } },
        P2: { point: { meet: ['v', 'd2'] } },
        P3: { point: { meet: ['h', 'd2'] } },
        Tile1: { polygon: ['N', 'E', 'P1', 'P2'] },
      }),
    ).toBe(
      'Join N, E, P1 and P2 into the tile, which repeats edge to edge. P1, P2 and P3 are crossings of lines already drawn.',
    );
  });

  it('says which touching circle was chosen', () => {
    expect(
      say({ C1: { circle: { centre: 'N', tangentTo: ['c'], touch: 'far' } } }),
    ).toBe(
      'Put the compass point on N and open it until the circle touches the circle about O through E, the larger circle that goes round it.',
    );
  });

  it('never prints raw numbers in a reason', () => {
    const reason = plainReason(
      'no single radius touches all 2 targets (each is touched at radius 0.70711, 2.00000)',
      specsOf(draft),
    );
    expect(reason).not.toMatch(/\d\.\d/);
  });
});
