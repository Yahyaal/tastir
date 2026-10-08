import {
  computePattern,
  floatingPoints,
  hiddenHelpers,
  inkCarriers,
  inkBeats,
  inkPieces,
  evaluate,
  strokesOf,
  type InkPiece,
  type Pattern,
  type Scene,
} from '@tastir/engine';
import { parseTutorial, type Tutorial } from '@tastir/schema';

export interface Model {
  readonly tutorial: Tutorial;
  readonly scene: Scene;
  readonly pattern: Pattern;
  /** Elements left out of the drawing: helper lines the learner chose
   * not to see, and points they alone would find. */
  readonly hide?: ReadonlySet<string>;
}

const helperless = new WeakMap<Model, Model>();

/**
 * The model as drawn with helper lines shown or not. Without them, the
 * helper lines nothing needs are left out (hiddenHelpers), with the
 * points only they find, and a step that would draw nothing new is
 * skipped like a hidden step. The construction, the ink and the pieces
 * are the same.
 */
export function withHelpers(model: Model, show: boolean): Model {
  if (show) return model;
  let found = helperless.get(model);
  if (found) return found;
  const hidden = hiddenHelpers(model.scene, model.tutorial);
  const hide = new Set([...hidden, ...floatingPoints(model.scene, hidden)]);
  const figures = (step: number) =>
    [...model.scene.elements.values()].filter(
      (el) =>
        el.step === step &&
        (el.geometry.kind === 'line' ||
          el.geometry.kind === 'circle' ||
          el.geometry.kind === 'polygon'),
    );
  const steps = model.tutorial.steps.map((s) => {
    const made = figures(s.id);
    return !s.hidden && made.length && made.every((el) => hide.has(el.name))
      ? { ...s, hidden: true }
      : s;
  });
  found = { ...model, tutorial: { ...model.tutorial, steps }, hide };
  helperless.set(model, found);
  return found;
}

/**
 * The model as the ink stage shows it: when the tutorial names a panel, its
 * whole outline and ink in place of the tile's, so the learner traces the
 * complete panel and its neighbours slide out overlapping it. The repeat
 * and the coloring keep the tile.
 */
export function asPanel(model: Model): Model {
  const { panel } = model.pattern;
  if (!panel) return model;
  return {
    ...model,
    pattern: {
      ...model.pattern,
      ink: panel.ink,
      cell: { ...model.pattern.cell, corners: panel.corners },
    },
  };
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

const allPieces = new WeakMap<Model, readonly InkPiece[]>();

/** Every piece of construction a learner can ink (computed once). */
export function inkPiecesOf(model: Model): readonly InkPiece[] {
  let found = allPieces.get(model);
  if (!found) {
    found = inkPieces(model.scene, model.pattern.cell);
    allPieces.set(model, found);
  }
  return found;
}

/** Whether every saved piece of ink is still a piece of the construction. */
export function inkFits(model: Model, inked: readonly string[]): boolean {
  const ids = new Set(inkPiecesOf(model).map((p) => p.id));
  return inked.every((id) => ids.has(id));
}

/** The pattern a free inking makes: the chosen pieces as ink strokes. */
export function patternInked(
  model: Model,
  chosen: ReadonlySet<string>,
): Pattern {
  return computePattern(
    model.scene,
    model.tutorial,
    strokesOf(inkPiecesOf(model), chosen),
  );
}

/**
 * The model with a saved inking, as a design keeps it; when its pieces no
 * longer fit (the tutorial has changed), the tutorial's own, and lost.
 */
export function withInking(
  model: Model,
  inked: readonly string[] | undefined,
): { model: Model; lost: boolean } {
  if (!inked) return { model, lost: false };
  if (!inkFits(model, inked)) return { model, lost: true };
  return {
    model: { ...model, pattern: patternInked(model, new Set(inked)) },
    lost: false,
  };
}
