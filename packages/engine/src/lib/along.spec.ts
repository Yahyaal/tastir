import { partsOf, type Step, type Tutorial } from '@tastir/schema';
import {
  loadTutorial,
  starAndCross,
  tutorialFiles,
  readTutorialJson,
} from '../test/tutorials.js';
import { checkStep, extrasOn, neededAt } from './along.js';
import { evaluate } from './evaluate.js';

/** A board: only the steps, as the learner's draft is evaluated. */
const board = (steps: unknown[]) =>
  evaluate({ steps: steps as Step[] } as Tutorial);

const beginners = tutorialFiles().filter(
  (f) => (readTutorialJson(f) as { level?: string }).level === 'beginner',
);

describe('checking a step by geometry', () => {
  it('finds the 33 beginner tutorials', () => {
    expect(beginners).toHaveLength(33);
  });

  it.each(beginners)(
    '%s: each step is done on a board drawn up to it',
    (file) => {
      const t = loadTutorial(file);
      const whole = evaluate(t);
      let beat = 0;
      for (const step of t.steps) {
        // A step with parts is a beat for each part.
        const parts = partsOf(step);
        for (let k = 1; k <= parts.length; k++) {
          beat += 1;
          const label = parts.length > 1 ? `${step.id}.${k}` : `${step.id}`;
          // The board after the learner has drawn this beat and the ones
          // before it, with the tutorial's own constructions.
          const upTo = board([
            ...t.steps.filter((s) => s.id < step.id),
            {
              id: step.id,
              text: step.text,
              create: Object.assign(
                {},
                ...parts.slice(0, k).map((p) => p.create),
              ),
            },
          ]);
          expect(checkStep(whole, upTo, beat).done, `step ${label}`).toBe(true);
          // Nothing the tutorial draws is extra.
          expect([...extrasOn(whole, upTo)]).toEqual([]);
          // A later beat that draws a new line or circle is not done yet; a
          // polygon may be, when its sides lie on lines already drawn.
          const next = neededAt(whole, beat + 1);
          if (next.some((n) => n.geometry.kind !== 'polygon')) {
            const before = checkStep(whole, upTo, beat + 1);
            expect(before.done, `the beat after step ${label} early`).toBe(
              false,
            );
          }
        }
      }
    },
  );

  const t = starAndCross();
  const whole = evaluate(t);

  it('passes a different construction that lands in the same place', () => {
    const steps = [
      {
        id: 1,
        text: '',
        create: { C1: { circle: { centre: 'O', through: 'A' } } },
      },
      {
        id: 2,
        text: 'The horizontal, then the vertical as the line joining two crossings of equal circles about A and W.',
        create: {
          L1: { line: { through: ['A', 'O'] } },
          P1: { point: { meet: ['C1', 'L1'], pick: { angle: 180 } } },
          C2: { circle: { centre: 'A', radiusFrom: ['A', 'P1'] } },
          C3: { circle: { centre: 'P1', radiusFrom: ['P1', 'A'] } },
          P2: { point: { meet: ['C2', 'C3'], pick: { angle: 90 } } },
          P3: { point: { meet: ['C2', 'C3'], pick: { angle: 270 } } },
          L2: { line: { through: ['P3', 'P2'] } },
        },
      },
      {
        id: 3,
        text: 'Each diagonal through O and the far crossing of two circles.',
        create: {
          N: { point: { meet: ['C1', 'L2'], pick: { angle: 90 } } },
          S: { point: { meet: ['C1', 'L2'], pick: { angle: 270 } } },
          C4: { circle: { centre: 'A', through: 'O' } },
          C5: { circle: { centre: 'N', through: 'O' } },
          C6: { circle: { centre: 'P1', through: 'O' } },
          Q1: { point: { meet: ['C4', 'C5'], pick: { farthest: 'O' } } },
          Q2: { point: { meet: ['C5', 'C6'], pick: { farthest: 'O' } } },
          L3: { line: { through: ['O', 'Q1'] } },
          L4: { line: { through: ['Q2', 'O'] } },
        },
      },
      {
        id: 4,
        text: 'The dynamic square as four ruled lines.',
        create: {
          L5: { line: { through: ['A', 'N'] } },
          L6: { line: { through: ['N', 'P1'] } },
          L7: { line: { through: ['P1', 'S'] } },
          L8: { line: { through: ['S', 'A'] } },
        },
      },
      {
        id: 5,
        text: 'The static square, started at another corner and drawn the other way round.',
        create: {
          a: { point: { meet: ['C1', 'L3'], pick: { angle: 45 } } },
          b: { point: { meet: ['C1', 'L4'], pick: { angle: 135 } } },
          c: { point: { meet: ['C1', 'L3'], pick: { angle: 225 } } },
          d: { point: { meet: ['C1', 'L4'], pick: { angle: 315 } } },
          S1: { polygon: ['c', 'b', 'a', 'd'] },
        },
      },
    ];
    const drawn = board(steps);
    for (const beat of [1, 2, 3, 4, 5])
      expect(checkStep(whole, drawn, beat).done, `beat ${beat}`).toBe(true);
    expect(checkStep(whole, drawn, 6).done).toBe(false);
    // The helper circles are the learner's own: extra, never wrong.
    expect([...extrasOn(whole, drawn)].sort()).toEqual([
      'C2',
      'C3',
      'C4',
      'C5',
      'C6',
    ]);
  });

  it('lists what is still missing', () => {
    const drawn = board([
      t.steps[0],
      {
        id: 2,
        text: '',
        create: { h: { line: { through: ['O', 'A'] } } },
      },
    ]);
    const check = checkStep(whole, drawn, 2);
    expect(check.done).toBe(false);
    expect(check.missing.map((m) => m.name)).toEqual(['v']);
    // A circle about another centre is not the step's circle.
    const off = board([
      {
        id: 1,
        text: '',
        create: { c: { circle: { centre: 'A', through: 'O' } } },
      },
    ]);
    expect(checkStep(whole, off, 1).missing.map((m) => m.name)).toEqual(['c']);
  });

  it('counts copies only when all are there', () => {
    const tutorial = loadTutorial('alhambra-comares-dado.json');
    const scene = evaluate(tutorial);
    const step = tutorial.steps.find((s) =>
      Object.values(s.create ?? {}).some((el) => 'repeat' in el),
    ) as Step;
    // Its beat: one for each part of the steps before it, then its own.
    const beat =
      tutorial.steps
        .filter((s) => s.id < step.id)
        .reduce((n, s) => n + partsOf(s).length, 0) + 1;
    const copies = neededAt(scene, beat).filter((n) => n.name.includes('@'));
    expect(copies.length).toBeGreaterThan(0);
    // The board with the step, minus its repeat: some copies are missing,
    // and only copies.
    const create = Object.fromEntries(
      Object.entries(step.create ?? {}).filter(([, el]) => !('repeat' in el)),
    );
    const before = tutorial.steps.filter((s) => s.id < step.id);
    const check = checkStep(
      scene,
      board([...before, { ...step, create }]),
      beat,
    );
    expect(check.done).toBe(false);
    expect(check.missing.length).toBeGreaterThan(0);
    expect(check.missing.every((m) => m.name.includes('@'))).toBe(true);
    expect(checkStep(scene, board([...before, step]), beat).done).toBe(true);
  });

  it('counts the tile only when it is marked as a shape', () => {
    const dado = loadTutorial('alhambra-comares-dado.json');
    const scene = evaluate(dado);
    const cell = dado.pattern.cell;
    const beat = dado.steps.findIndex((s) => cell in (s.create ?? {})) + 1;
    const lines = board(dado.steps.filter((s) => s.id < beat));
    expect(checkStep(scene, lines, beat).done).toBe(true);
    expect(checkStep(scene, lines, beat, undefined, new Set([cell])).done).toBe(
      false,
    );
    const marked = board(dado.steps.filter((s) => s.id <= beat));
    expect(
      checkStep(scene, marked, beat, undefined, new Set([cell])).done,
    ).toBe(true);
  });
});
