import {
  ALONG_EPS,
  checkStep,
  distance,
  evaluate,
  figureOn,
  pickFor,
  TutorialError,
  type Scene,
} from '@tastir/engine';
import type { ElementSpec, Step, Tutorial } from '@tastir/schema';
import { renameSpec } from '../editor/blocks';
import { pointPlaces, specsOf, type Draft } from '../editor/document';
import { crossingsNear } from '../editor/tools';

/** Names a step may give. */
const PLAIN = /^[A-Za-z][A-Za-z0-9_]*$/;

/**
 * “Draw it for me”: the board with one more step that draws what a beat
 * of the tutorial still needs. Every reference is taken from the board by
 * geometry, so it works whatever way the learner drew the earlier steps:
 * a line or circle the board has is used as it is, a point is a named
 * point or a crossing there, and anything the board lacks is drawn too,
 * from the tutorial's own construction. Undefined when nothing is
 * missing; throws when the board cannot carry the step, which a test
 * over every beginner tutorial rules out.
 */
export function drawForMe(
  tutorial: Tutorial,
  tScene: Scene,
  draft: Draft,
  beat: number,
  text: string,
): Draft | undefined {
  const base = check(draft.steps);
  const missing = checkStep(tScene, base, beat).missing;
  if (!missing.length) return undefined;
  const specs = specsOf(tutorial);
  const create: Record<string, ElementSpec> = {};
  const taken = new Set([...specsOf(draft).keys(), 'O', 'A']);
  const id = draft.steps.length + 1;
  const stepOf = (): Step => ({ id, text, create: { ...create } });
  let scene = base;
  const map = new Map<string, string>();

  const fresh = (wanted: string) => {
    let name = PLAIN.test(wanted) ? wanted : 'P';
    for (let n = 2; taken.has(name); n++) name = `${wanted}_${n}`;
    taken.add(name);
    return name;
  };
  const add = (wanted: string, spec: ElementSpec): string => {
    const name = fresh(wanted);
    create[name] = spec;
    scene = check([...draft.steps, stepOf()]);
    return name;
  };

  /** The board's name for a point at the place of a tutorial point. */
  const pointThere = (
    at: { x: number; y: number },
    wanted = 'P',
  ): string | undefined => {
    const place = pointPlaces(scene).find(
      (p) => distance(p.at, at) <= ALONG_EPS,
    );
    if (place) return place.name;
    for (const c of crossingsNear(scene, at, ALONG_EPS)) {
      const choice = pickFor(scene, c.meet, c.p);
      if (choice.found)
        return add(wanted, {
          point: {
            meet: [...c.meet],
            ...(choice.pick ? { pick: choice.pick } : {}),
          },
        } as ElementSpec);
    }
    return undefined;
  };

  const resolve = (ref: string): string => {
    const known = map.get(ref);
    if (known) return known;
    const el = tScene.elements.get(ref);
    if (!el) throw new Error(`The tutorial has no "${ref}"`);
    const g = el.geometry;
    let name: string | undefined;
    if (g.kind === 'point') {
      const wanted = PLAIN.test(ref) ? ref : 'P';
      name = pointThere(g.at, wanted);
      if (!name && /@\d+$/.test(ref)) {
        // A turned copy of a point: the repeat brings it.
        name = draw(ref);
      } else if (!name) {
        // The board lacks what crosses there: draw that first.
        for (const d of el.deps)
          if (tScene.elements.get(d)?.geometry.kind !== 'point') resolve(d);
        name = pointThere(g.at, wanted);
      }
      if (!name) throw new Error(`No crossing on the board at "${ref}"`);
    } else if (g.kind === 'group') {
      name = draw(ref);
    } else {
      name = figureOn(scene, g) ?? draw(ref);
    }
    map.set(ref, name);
    return name;
  };

  /** Draws a tutorial element on the board, from its own spec. */
  const draw = (ref: string): string => {
    const copy = /^(.+)@(\d+)$/.exec(ref);
    if (copy) {
      // A copy: the original, then the repeat that turns it, which draws
      // the other copies too.
      const [, orig = ''] = copy;
      const group = [...tScene.elements.values()].find(
        (e) => e.geometry.kind === 'group' && e.geometry.members.includes(ref),
      );
      const spec = group && specs.get(group.name);
      if (!spec || !('repeat' in spec))
        throw new Error(`"${ref}" is not a copy`);
      const of = resolve(orig);
      const by = spec.repeat.by.startsWith('mirror:')
        ? `mirror:${resolve(spec.repeat.by.slice('mirror:'.length))}`
        : spec.repeat.by;
      add(group.name, {
        repeat: { of: [of], by, distinct: true },
      } as ElementSpec);
      const g = tScene.elements.get(ref)?.geometry;
      const made =
        g?.kind === 'point' ? pointThere(g.at) : g && figureOn(scene, g);
      if (!made) throw new Error(`The copy "${ref}" did not land`);
      return made;
    }
    const spec = specs.get(ref);
    if (!spec) throw new Error(`The tutorial has no spec for "${ref}"`);
    const mapped = renameSpec(spec, (r) => resolve(r));
    return add(ref, mapped);
  };

  for (const m of missing) {
    // Something drawn on the way may already have brought it.
    if (!checkStep(tScene, scene, beat).missing.some((x) => x.name === m.name))
      continue;
    resolve(m.name);
  }
  return { ...draft, steps: [...draft.steps, stepOf()] };
}

/** The board's scene; any step that cannot be evaluated is an error. */
function check(steps: readonly Step[]): Scene {
  try {
    return evaluate({ steps } as Tutorial);
  } catch (e) {
    if (e instanceof TutorialError) throw new Error(e.message);
    throw e;
  }
}
