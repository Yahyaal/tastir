import example from '@tutorials/eight-fold-star-and-cross.json';
import { parseTutorial } from '@tastir/schema';
import { computePattern, evaluate } from '@tastir/engine';
import { check, copyUpTo, plainReason, sayStep, specsOf } from './document';
import { pieceNames, shapeName } from './finish';

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

  it('says which touching circle was chosen, inside or outside', () => {
    // The whole star and cross: O is inside the circle c, the tile's
    // corner c1 outside it.
    const full = copyUpTo(parseTutorial(example), 6);
    const at = { scene: check(full).scene };
    const touch = (centre: string, side: 'near' | 'far') =>
      sayStep(
        { C1: { circle: { centre, tangentTo: ['c'], touch: side } } },
        full,
        at,
      );
    expect(touch('O', 'near')).toMatch(
      /the smaller circle, inside it and touching it from within\.$/,
    );
    expect(touch('c1', 'near')).toMatch(
      /the smaller circle, touching it from outside\.$/,
    );
    expect(touch('O', 'far')).toMatch(
      /the larger circle, which goes round it\.$/,
    );
    expect(touch('c1', 'far')).toMatch(
      /the larger circle, which goes round it\.$/,
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

describe('piece names', () => {
  const sq = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
  ];
  it('names convex shapes by kind', () => {
    expect(shapeName(sq)).toBe('square');
    expect(
      shapeName([
        { x: 0, y: 0 },
        { x: 2, y: 1 },
        { x: 0, y: 2 },
        { x: -2, y: 1 },
      ]),
    ).toBe('rhombus');
    expect(
      shapeName([
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 3 },
        { x: -1, y: 1 },
      ]),
    ).toBe('kite');
  });

  it('names the star and the cross of the star and cross', () => {
    const t = parseTutorial(example);
    const p = computePattern(evaluate(t), t);
    const names = pieceNames(
      p.types.map((ty, i) => ({
        vertices: ty.vertices,
        polygon: p.pieces.find((x) => x.type === i)?.polygon,
      })),
    );
    expect(names).toEqual(['star', 'cross']);
  });
});
