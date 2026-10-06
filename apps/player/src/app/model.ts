import {
  computePattern,
  inkCarriers,
  evaluate,
  type Pattern,
  type Scene,
} from '@tastir/engine';
import { parseTutorial, type Tutorial } from '@tastir/schema';

export interface Model {
  readonly tutorial: Tutorial;
  readonly scene: Scene;
  readonly pattern: Pattern;
}

/**
 * A stage of the player: each construction step, then the ink, then the
 * inked tile repeated edge to edge, then the pieces colored.
 */
export type Stage =
  | { readonly kind: 'step'; readonly step: number }
  | { readonly kind: 'ink' }
  | { readonly kind: 'repeat' }
  | { readonly kind: 'color' };

/** Parses, evaluates and cuts a tutorial; throws with the engine's message. */
export function loadModel(json: unknown): Model {
  const tutorial = parseTutorial(json);
  const scene = evaluate(tutorial);
  return { tutorial, scene, pattern: computePattern(scene, tutorial) };
}

/** The ids of the steps the learner sees, in order: all but the hidden. */
export function shownSteps(tutorial: Tutorial): number[] {
  return tutorial.steps.filter((s) => !s.hidden).map((s) => s.id);
}

/** The ids of the steps that are evaluated but never drawn. */
export function hiddenSteps(tutorial: Tutorial): ReadonlySet<number> {
  return new Set(tutorial.steps.filter((s) => s.hidden).map((s) => s.id));
}

export function stagesOf(tutorial: Tutorial): Stage[] {
  return [
    ...shownSteps(tutorial).map((step): Stage => ({ kind: 'step', step })),
    { kind: 'ink' },
    { kind: 'repeat' },
    { kind: 'color' },
  ];
}

const carriers = new WeakMap<Model, ReadonlySet<string>>();

/** The lines and polygons that carry some of the ink (computed once). */
export function carriersOf(model: Model): ReadonlySet<string> {
  let found = carriers.get(model);
  if (!found) {
    found = inkCarriers(model.scene, model.pattern.ink);
    carriers.set(model, found);
  }
  return found;
}
