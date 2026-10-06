import { readFileSync } from 'node:fs';
import { parseTutorial, safeParseTutorial } from './parse.js';
import type { Tutorial } from './tutorial.js';

const example: Tutorial = JSON.parse(
  readFileSync(
    new URL(
      '../../../../tutorials/eight-fold-star-and-cross.json',
      import.meta.url,
    ),
    'utf8',
  ),
);

/** A deep copy of the example, changed by `edit`. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- tests build malformed tutorials on purpose
type Loose = any;
function variant(edit: (t: Loose) => void): unknown {
  const t: Loose = structuredClone(example);
  edit(t);
  return t;
}

/** The problems found in `input`, as "path: message" lines. */
function problems(input: unknown): string[] {
  const result = safeParseTutorial(input);
  return result.success
    ? []
    : result.issues.map((i) => `${i.path}: ${i.message}`);
}

describe('the example tutorial', () => {
  it('parses', () => {
    const t = parseTutorial(example);
    expect(t.steps).toHaveLength(6);
    expect(Object.keys(t.steps[1]?.create ?? {})).toEqual([
      'h',
      'v',
      'E',
      'N',
      'W',
      'S',
    ]);
  });
});

describe('rejected tutorials', () => {
  it('rejects a coordinate in place of a construction', () => {
    const input = variant((t) => {
      t.steps[1].create.E = { point: { x: 1, y: 0 } };
    });
    expect(problems(input)).toEqual([
      'steps[1].create.E: tutorials never contain coordinates; build the point from crossings of earlier elements (found one at point.x)',
    ]);
  });

  it('rejects a number where a point is expected', () => {
    const input = variant((t) => {
      t.steps[0].create.c.circle.through = 0.5;
    });
    expect(problems(input).join('\n')).toContain(
      'tutorials never contain coordinates',
    );
  });

  it('rejects a reference to an element made in a later step', () => {
    const input = variant((t) => {
      t.steps[1].create.v = { line: { through: 'O', perpendicularTo: 'd1' } };
    });
    expect(problems(input)).toEqual([
      'steps[1].create.v.line.perpendicularTo: "d1" is used before it exists: it is made in step 3, and a step may only use elements made earlier',
    ]);
  });

  it('rejects a reference to an element later in the same step', () => {
    const input = variant((t) => {
      const { h, ...rest } = t.steps[1].create;
      t.steps[1].create = { ...rest, h };
    });
    expect(problems(input).join('\n')).toContain(
      '"h" is used before it exists: it is made in step 2',
    );
  });

  it('rejects a pick by index', () => {
    const input = variant((t) => {
      t.steps[1].create.E.point.pick = { index: 1 };
    });
    expect(problems(input)).toEqual([
      'steps[1].create.E.point.pick: pick by position is not allowed (found "index"): its meaning depends on how the engine orders crossings. Choose the point by rule with angle, nearest, farthest, inside or outside',
    ]);
  });

  it('accepts a hidden step', () => {
    const input = variant((t) => {
      t.steps[4].hidden = true;
    });
    expect(problems(input)).toEqual([]);
  });

  it('rejects a name that is never defined', () => {
    const input = variant((t) => {
      t.ink.paths[0].through[2] = 'Q';
    });
    expect(problems(input)).toEqual([
      'ink.paths[0].through[2]: "Q" is not defined by any earlier step',
    ]);
  });

  it('rejects a reference of the wrong kind', () => {
    const input = variant((t) => {
      t.steps[1].create.v.line.perpendicularTo = 'O';
    });
    expect(problems(input).join('\n')).toContain(
      'steps[1].create.v.line.perpendicularTo: "O" is a point, but this needs a line',
    );
  });

  it('rejects a name used twice', () => {
    const input = variant((t) => {
      t.steps[2].create.h = { line: { through: ['O', 'N'] } };
    });
    expect(problems(input).join('\n')).toContain('"h" is already defined');
  });

  it('rejects colors for a piece that expect does not list', () => {
    const input = variant((t) => {
      t.pattern.colors.kite = 'b';
    });
    expect(problems(input)).toEqual([
      'pattern.colors.kite: "kite" is not a piece named in expect.pieces',
    ]);
  });

  it('rejects a placement rule for an unknown piece or outside its repeat', () => {
    const input = variant((t) => {
      t.pattern.placements = {
        repeat: [2, 2],
        rules: [
          { piece: 'kite', color: 'a' },
          { piece: 'star', cell: [2, 0], color: 'b' },
        ],
      };
    });
    expect(problems(input)).toEqual([
      'pattern.placements.rules.0.piece: "kite" is not a piece named in expect.pieces',
      'pattern.placements.rules.1.cell: cell 2,0 is outside the 2×2 repeat',
    ]);
  });

  it('throws one error listing every problem', () => {
    const input = variant((t) => {
      t.steps[1].create.E.point.pick = { nth: 2 };
      t.ink.paths[0].through[2] = 'Q';
    });
    expect(() => parseTutorial(input)).toThrow(
      /Invalid tutorial:\n {2}- steps\[1\]\.create\.E\.point\.pick: pick by position/,
    );
  });
});

describe('repeat', () => {
  it('names the copies name@1 … name@n', () => {
    const input = variant((t) => {
      t.steps.push({
        id: 7,
        text: 'Copy the diagonal.',
        create: {
          spokes: { repeat: { of: ['d1'], by: 'rot8' } },
          p: { point: { meet: ['d1@7', 'c'], pick: { angle: 0 } } },
        },
      });
    });
    expect(problems(input)).toEqual([]);
    const tooFar = variant((t) => {
      t.steps.push({
        id: 7,
        text: 'Copy the diagonal.',
        create: {
          spokes: { repeat: { of: ['d1'], by: 'rot8' } },
          p: { point: { meet: ['d1@8', 'c'], pick: { angle: 0 } } },
        },
      });
    });
    expect(problems(tooFar)).toEqual([
      'steps[6].create.p.point.meet[0]: "d1@8" is not defined by any earlier step',
    ]);
  });

  it.each([
    ['rot3', 2],
    ['rot5', 4],
    ['rot6', 5],
    ['rot10', 9],
    ['rot12', 11],
  ])('knows that %s makes %i copies', (by, n) => {
    const using = (copy: number) =>
      variant((t) => {
        t.steps.push({
          id: 7,
          text: 'Copy the diagonal.',
          create: {
            spokes: { repeat: { of: ['d1'], by } },
            p: { point: { meet: [`d1@${copy}`, 'c'], pick: { angle: 0 } } },
          },
        });
      });
    expect(problems(using(n))).toEqual([]);
    expect(problems(using(n + 1))).toHaveLength(1);
  });
});

describe('circles', () => {
  it('accepts touch near or far on a tangent circle, and nothing else', () => {
    const ok = variant((t) => {
      t.steps[5].create.r = {
        circle: { centre: 'O', tangentTo: ['c'], touch: 'far' },
      };
    });
    expect(problems(ok)).toEqual([]);
    const bad = variant((t) => {
      t.steps[5].create.r = {
        circle: { centre: 'O', tangentTo: ['c'], touch: 'outside' },
      };
    });
    expect(problems(bad).join('\n')).toContain('touch?');
  });
});

describe('pick', () => {
  it('rejects an empty pick', () => {
    const input = variant((t) => {
      t.steps[1].create.E.point.pick = {};
    });
    expect(problems(input)).toEqual([
      'steps[1].create.E.point.pick: a pick needs at least one rule: angle, nearest, farthest, inside or outside',
    ]);
  });
});
