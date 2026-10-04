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

/** A stage of the player: one construction step, then the ink, then the wall. */
export type Stage =
  | { readonly kind: 'step'; readonly step: number }
  | { readonly kind: 'ink' }
  | { readonly kind: 'wall' };

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
    { kind: 'wall' },
  ];
}

/** Palettes by name; tutorials pick one and map piece names to its keys. */
export const PALETTES: Record<string, Record<string, string>> = {
  'Fès tile': {
    a: '#1d5c7c',
    b: '#2f7d4f',
    c: '#c9a227',
    d: '#8c2f39',
    ground: '#f2ead8',
  },
};

const FALLBACK = ['#1d5c7c', '#f2ead8', '#2f7d4f', '#c9a227', '#8c2f39'];

/** The fill for each piece type, from the tutorial's palette and colors. */
export function pieceColors(model: Model): string[] {
  const { pattern, tutorial } = model;
  const palette = PALETTES[tutorial.pattern.palette ?? ''] ?? {};
  return pattern.types.map((t, i) => {
    const key = t.name ? tutorial.pattern.colors[t.name] : undefined;
    return (key && palette[key]) ?? FALLBACK[i % FALLBACK.length] ?? '#999';
  });
}
