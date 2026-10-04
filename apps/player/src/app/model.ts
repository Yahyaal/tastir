import {
  computePattern,
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

export function stagesOf(tutorial: Tutorial): Stage[] {
  return [
    ...tutorial.steps.map((s): Stage => ({ kind: 'step', step: s.id })),
    { kind: 'ink' },
    { kind: 'repeat' },
    { kind: 'color' },
  ];
}
