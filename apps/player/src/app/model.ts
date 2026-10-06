import {
  computePattern,
  inkCarriers,
  inkSteps,
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

/** When the ink is drawn: as each step makes it, or all at the end. */
export type InkMode = 'end' | 'asYouGo';

const strokeSteps = new WeakMap<Model, readonly number[]>();

/**
 * For each of the tutorial's ink strokes, the step that inks it when the
 * learner inks as they go: the earliest step it can be drawn, moved on to
 * the next step the learner sees if that one is hidden.
 */
export function inkStepsOf(model: Model): readonly number[] {
  let found = strokeSteps.get(model);
  if (!found) {
    const shown = shownSteps(model.tutorial);
    const lastShown = shown[shown.length - 1] ?? 0;
    found = inkSteps(model.scene, model.pattern.ink).map(
      (step) => shown.find((s) => s >= step) ?? lastShown,
    );
    strokeSteps.set(model, found);
  }
  return found;
}
