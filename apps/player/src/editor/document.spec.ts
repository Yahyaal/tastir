import example from '@tutorials/eight-fold-star-and-cross.json';
import { parseTutorial } from '@tastir/schema';
import {
  addStep,
  changeStep,
  check,
  deleteSteps,
  deleteWithDependents,
  dependents,
  emptyDraft,
  freshName,
  moveStep,
  sayStep,
  type Draft,
} from './document';
import { addPattern, getPattern, listPatterns, savePattern } from './patterns';

/** The star and cross as a draft: its six steps, no ink or tile yet. */
function starDraft(): Draft {
  const {
    ink: _ink,
    pattern: _pattern,
    expect: _expect,
    ...rest
  } = parseTutorial(example);
  return rest;
}

const okSteps = (d: Draft) =>
  [...check(d).status].filter(([, s]) => s.ok).map(([id]) => id);

describe('the editor document', () => {
  it('starts with only O and A', () => {
    const d = emptyDraft('mine', 'Mine');
    const { scene } = check(d);
    expect([...scene.elements.keys()]).toEqual(['O', 'A']);
  });

  it('adds steps, which evaluate and are numbered in order', () => {
    let d = emptyDraft('mine', 'Mine');
    d = addStep(d, {
      text: 'A circle.',
      create: { C1: { circle: { centre: 'O', through: 'A' } } },
    });
    d = addStep(d, {
      text: 'A line.',
      create: { L1: { line: { through: ['O', 'A'] } } },
    });
    expect(d.steps.map((s) => s.id)).toEqual([1, 2]);
    const { scene, status } = check(d);
    expect(scene.elements.has('L1')).toBe(true);
    expect([...status.values()].every((s) => s.ok)).toBe(true);
    // Inserted before the first: numbered again.
    d = addStep(
      d,
      { text: 'First.', create: { L0: { line: { through: ['A', 'O'] } } } },
      0,
    );
    expect(d.steps.map((s) => [s.id, s.text])).toEqual([
      [1, 'First.'],
      [2, 'A circle.'],
      [3, 'A line.'],
    ]);
  });

  it('changes a step’s text without touching what it makes', () => {
    const d = changeStep(starDraft(), 2, { text: 'My own words.' });
    expect(d.steps[1]?.text).toBe('My own words.');
    expect(d.steps[1]?.create).toEqual(starDraft().steps[1]?.create);
  });

  it('marks a step broken, with the engine’s reason, after an edit upstream', () => {
    // Step 2's line v becomes parallel to h through O: it is h again, so
    // N and S (on v) are now the same crossings as E and W, and step 3's
    // bisector of E-O-N cannot be drawn.
    const d = changeStep(starDraft(), 2, {
      create: {
        ...starDraft().steps[1]?.create,
        v: { line: { through: 'O', parallelTo: 'h' } },
      },
    });
    const { status } = check(d);
    expect(status.get(1)).toEqual({ ok: true });
    const two = status.get(2);
    expect(two?.ok).toBe(false);
    // Everything built on step 2 is broken because of it, and says so.
    for (const later of [3, 4, 5, 6]) {
      const s = status.get(later);
      expect(s?.ok).toBe(false);
    }
    expect(status.get(3)).toMatchObject({ builtOn: 2 });
    expect(okSteps(d)).toEqual([1]);
  });

  it('knows which steps are built on a step, and deletes them with it', () => {
    const d = starDraft();
    const checked = check(d);
    expect(dependents(checked, 4)).toEqual([5]);
    expect(dependents(checked, 2)).toEqual([3, 4, 5, 6]);
    const cut = deleteWithDependents(d, checked, 4);
    expect(cut.steps.map((s) => s.id)).toEqual([1, 2, 3, 4]);
    expect(okSteps(cut)).toEqual([1, 2, 3, 4]);
  });

  it('deletes a step the others need, which marks them broken', () => {
    const d = deleteSteps(starDraft(), [1]);
    expect(d.steps.map((s) => s.id)).toEqual([1, 2, 3, 4, 5]);
    const { status } = check(d);
    expect(status.get(1)).toMatchObject({ ok: false });
    expect(String((status.get(1) as { reason: string }).reason)).toMatch(
      /It uses c, which no earlier step makes/,
    );
  });

  it('moves a step, and a step moved before what it uses breaks', () => {
    const d = moveStep(starDraft(), 6, 0);
    expect(d.steps.map((s) => s.text.slice(0, 20))[0]).toBe(
      starDraft().steps[5]?.text.slice(0, 20),
    );
    expect(d.steps.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(check(d).status.get(1)?.ok).toBe(false);
  });

  it('names new elements with the first free name', () => {
    let d = emptyDraft('mine', 'Mine');
    expect(freshName(d, 'C')).toBe('C1');
    d = addStep(d, {
      text: 'x',
      create: { C1: { circle: { centre: 'O', through: 'A' } } },
    });
    expect(freshName(d, 'C')).toBe('C2');
    expect(freshName(d, 'C', ['C2'])).toBe('C3');
  });

  it('writes each step in plain words', () => {
    expect(
      sayStep({
        P1: { point: { meet: ['C1', 'L1'], pick: { angle: 0 } } },
        C2: { circle: { centre: 'P1', tangentTo: ['L1', 'L2'] } },
      }),
    ).toBe(
      'Put the compass point on P1 and open it until the circle touches L1 and L2. P1 is where C1 and L1 cross.',
    );
    expect(
      sayStep({ P1: { point: { meet: ['C1', 'L1'], pick: { angle: 0 } } } }),
    ).toBe('Mark P1 where C1 and L1 cross.');
    expect(
      sayStep({ L3: { line: { through: 'P1', perpendicularTo: 'L1' } } }),
    ).toBe('Draw a line through P1, square to L1.');
    expect(sayStep({ R1: { repeat: { of: ['L3'], by: 'rot8' } } })).toBe(
      'Turn it round the centre, 8 times in all.',
    );
  });
});

describe('the pattern store', () => {
  it('keeps a pattern and its source, and saves changes', () => {
    const p = addPattern(starDraft(), {
      tutorial: 'eight-fold-star-and-cross',
      title: 'Eight-fold star and cross',
      step: 3,
    });
    expect(getPattern(p?.id ?? '')).toEqual(p);
    const changed = savePattern(
      p?.id ?? '',
      changeStep(starDraft(), 1, { text: 'Mine.' }),
    );
    expect(changed?.tutorial.steps[0]?.text).toBe('Mine.');
    expect(listPatterns()).toHaveLength(1);
    expect(listPatterns()[0]?.basedOn?.step).toBe(3);
  });

  it('reads a corrupt store as empty', () => {
    window.localStorage.setItem('tastir.patterns', 'nonsense');
    expect(listPatterns()).toEqual([]);
  });
});
