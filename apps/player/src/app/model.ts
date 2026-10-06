import {
  computePattern,
  inkCarriers,
  inkBeats,
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
  /** A beat of the construction: a step, or one part of a step. */
  | { readonly kind: 'step'; readonly beat: number }
  | { readonly kind: 'ink' }
  | { readonly kind: 'repeat' }
  | { readonly kind: 'color' };

/** Parses, evaluates and cuts a tutorial; throws with the engine's message. */
export function loadModel(json: unknown): Model {
  const tutorial = parseTutorial(json);
  const scene = evaluate(tutorial);
  return { tutorial, scene, pattern: computePattern(scene, tutorial) };
}

/**
 * One beat of the construction: a whole step, or one part of a step with
 * parts. Beats are numbered 1, 2, 3, … like SceneElement.beat.
 */
export interface Beat {
  readonly beat: number;
  readonly step: number;
  /** Which part (1, 2, …), and how many; both 0 for a step without parts. */
  readonly part: number;
  readonly parts: number;
  /** What the learner reads: the part's text, or the step's. */
  readonly text: string;
  /** For a part, the step's own text, shown as its heading. */
  readonly heading?: string;
  readonly highlight?: readonly string[];
  readonly hidden: boolean;
}

/** Every beat of the tutorial, hidden ones included, in order. */
export function beatsOf(tutorial: Tutorial): Beat[] {
  const beats: Beat[] = [];
  for (const step of tutorial.steps) {
    const hidden = step.hidden ?? false;
    if (!step.parts) {
      beats.push({
        beat: beats.length + 1,
        step: step.id,
        part: 0,
        parts: 0,
        text: step.text,
        ...(step.highlight ? { highlight: step.highlight } : {}),
        hidden,
      });
      continue;
    }
    step.parts.forEach((part, i) =>
      beats.push({
        beat: beats.length + 1,
        step: step.id,
        part: i + 1,
        parts: step.parts?.length ?? 0,
        text: part.text,
        heading: step.text,
        ...(part.highlight ? { highlight: part.highlight } : {}),
        hidden,
      }),
    );
  }
  return beats;
}

/** The ids of the steps the learner sees, in order: all but the hidden. */
export function shownSteps(tutorial: Tutorial): number[] {
  return tutorial.steps.filter((s) => !s.hidden).map((s) => s.id);
}

/** The beats the learner sees, in order. */
export function shownBeats(tutorial: Tutorial): number[] {
  return beatsOf(tutorial)
    .filter((b) => !b.hidden)
    .map((b) => b.beat);
}

/** The beats that are evaluated but never drawn. */
export function hiddenBeats(tutorial: Tutorial): ReadonlySet<number> {
  return new Set(
    beatsOf(tutorial)
      .filter((b) => b.hidden)
      .map((b) => b.beat),
  );
}

export function stagesOf(tutorial: Tutorial): Stage[] {
  return [
    ...shownBeats(tutorial).map((beat): Stage => ({ kind: 'step', beat })),
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

const strokeBeats = new WeakMap<Model, readonly number[]>();

/**
 * For each of the tutorial's ink strokes, the beat that inks it when the
 * learner inks as they go: the earliest beat it can be drawn, moved on to
 * the next beat the learner sees if that one is hidden.
 */
export function inkBeatsOf(model: Model): readonly number[] {
  let found = strokeBeats.get(model);
  if (!found) {
    const shown = shownBeats(model.tutorial);
    const lastShown = shown[shown.length - 1] ?? 0;
    found = inkBeats(model.scene, model.pattern.ink).map(
      (beat) => shown.find((b) => b >= beat) ?? lastShown,
    );
    strokeBeats.set(model, found);
  }
  return found;
}
