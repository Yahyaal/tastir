import { partsOf } from '@tastir/schema';
import {
  loadTutorial,
  starAndCross,
  tutorialFiles,
} from '../test/tutorials.js';
import { crossingOf, evaluate, pointOf } from './evaluate.js';
import { pickFor, stepsBuiltOn } from './picking.js';
import { distance } from './vec.js';

describe('pickFor', () => {
  const scene = evaluate(starAndCross());

  it('needs no rule when two elements cross once', () => {
    expect(pickFor(scene, ['h', 'v'], pointOf(scene, 'O'))).toEqual({
      found: true,
    });
  });

  it('names a crossing by a round angle first', () => {
    expect(pickFor(scene, ['c', 'h'], pointOf(scene, 'W'))).toEqual({
      found: true,
      pick: { angle: 180 },
    });
    expect(pickFor(scene, ['c', 'd1'], pointOf(scene, 'NE'))).toEqual({
      found: true,
      pick: { angle: 45 },
    });
  });

  it('uses only the elements it is allowed to name', () => {
    // A crossing at O has no angle: a named point must choose. Here the
    // line h meets the dynamic square at E and W.
    const choice = pickFor(
      scene,
      ['h', 'dynamic'],
      pointOf(scene, 'E'),
      (n) => n !== 'O',
    );
    expect(choice).toEqual({ found: true, pick: { angle: 0 } });
  });

  it('says why when the elements do not cross at the point', () => {
    expect(pickFor(scene, ['c', 'h'], pointOf(scene, 'N'))).toEqual({
      found: false,
      reason: '"c" and "h" do not cross there',
    });
    expect(pickFor(scene, ['E', 'h'], pointOf(scene, 'E')).found).toBe(false);
  });
});

describe('pickFor in every tutorial', () => {
  it.each(tutorialFiles())('picks back every point of %s', (file) => {
    const t = loadTutorial(file);
    const scene = evaluate(t);
    const names = [...scene.elements.keys()];
    const order = new Map(names.map((n, i) => [n, i]));
    for (const step of t.steps) {
      for (const part of partsOf(step)) {
        for (const [name, spec] of Object.entries(part.create)) {
          if (!('point' in spec)) continue;
          const at = pointOf(scene, name);
          const before = order.get(name) ?? 0;
          // Only what existed before the point, as in the editor.
          const choice = pickFor(
            scene,
            spec.point.meet,
            at,
            (n) => (order.get(n) ?? Infinity) < before,
          );
          if (!choice.found) throw new Error(`${name}: ${choice.reason}`);
          const back = crossingOf(scene, spec.point.meet, choice.pick, () => {
            throw new Error(`${name}: the rule does not evaluate`);
          });
          expect(distance(back, at)).toBeLessThanOrEqual(scene.tol.eps);
          if (!spec.point.pick) expect(choice.pick).toBeUndefined();
        }
      }
    }
  });
});

describe('stepsBuiltOn', () => {
  const scene = evaluate(starAndCross());

  it('lists every later step that uses a step, directly or not', () => {
    // Step 3's diagonals make NE…SE, the static square (5) and the tile
    // has nothing from them.
    expect(stepsBuiltOn(scene, 3)).toEqual([5]);
    // The dynamic square (4) is used by the crossings k in step 5.
    expect(stepsBuiltOn(scene, 4)).toEqual([5]);
    expect(stepsBuiltOn(scene, 1)).toEqual([2, 3, 4, 5, 6]);
    expect(stepsBuiltOn(scene, 6)).toEqual([]);
  });
});
