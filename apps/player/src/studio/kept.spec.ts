import example from '@tutorials/eight-fold-star-and-cross.json';
import { parseTutorial } from '@tastir/schema';
import type { Draft } from '../editor/document';
import { onTop, readKept, writeKept } from './kept';

/** The star and cross's first steps as a draft, no ink or tile yet. */
function star(steps: number): Draft {
  const {
    ink: _ink,
    pattern: _pattern,
    expect: _expect,
    ...rest
  } = parseTutorial(example);
  return { ...rest, steps: rest.steps.slice(0, steps) };
}

const circle = (id: number, name: string, centre: string) => ({
  id,
  text: `Circle ${name}.`,
  create: { [name]: { circle: { centre, through: 'O' } } },
});

describe('the owner’s change kept after a clash', () => {
  it('adds the owner’s new step after the agent’s, renumbered', () => {
    const base = star(2);
    const mine = { ...base, steps: [...base.steps, circle(3, 'r', 'E')] };
    const latest = star(3);
    const result = onTop({ base, mine }, latest);
    expect(result && 'draft' in result).toBe(true);
    if (!result || !('draft' in result)) return;
    expect(result.draft.steps.map((s) => s.id)).toEqual([1, 2, 3, 4]);
    expect(Object.keys(result.draft.steps[3]?.create ?? {})).toEqual(['r']);
    expect(result.draft.steps.slice(0, 3)).toEqual(latest.steps);
  });

  it('refuses a step whose name the agent has already used', () => {
    const base = star(2);
    const mine = { ...base, steps: [...base.steps, circle(3, 'd1', 'E')] };
    const result = onTop({ base, mine }, star(3));
    expect(result && 'reason' in result && result.reason).toMatch(
      /already has a d1/,
    );
  });

  it('refuses a step that no longer draws on the newer drawing', () => {
    const base = star(3);
    const mine = { ...base, steps: [...base.steps, circle(4, 'r', 'NE')] };
    // The agent replaced step 3, so NE no longer exists.
    const latest = star(2);
    const result = onTop({ base: star(3), mine }, latest);
    expect(result && 'reason' in result && result.reason).toMatch(
      /does not draw/,
    );
  });

  it('cannot add a rename or a deletion on top', () => {
    const base = star(3);
    expect(onTop({ base, mine: { ...base, title: 'New' } }, star(3))).toBe(
      undefined,
    );
    expect(onTop({ base, mine: star(2) }, star(3))).toBe(undefined);
    expect(onTop({ base, mine: base }, star(3))).toBe(undefined);
  });

  it('is kept in this browser until it is cleared', () => {
    const kept = { base: star(2), mine: star(3) };
    writeKept('p1', kept);
    expect(readKept('p1')).toEqual(kept);
    writeKept('p1', undefined);
    expect(readKept('p1')).toBe(undefined);
  });
});
