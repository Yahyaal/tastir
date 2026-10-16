/**
 * The player's editor and model code, which the studio shares so that an
 * edit made here is exactly the edit the editor would make. These files
 * are pure TypeScript (no DOM, no React, no storage). They should move into
 * a package once the assistant branches are merged; until then this is the
 * one place that reaches into the player.
 */
/* eslint-disable @nx/enforce-module-boundaries */
export {
  addStep,
  check,
  copyUpTo,
  deleteSteps,
  dependents,
  emptyDraft,
  freshName,
  specsOf,
  type Checked,
  type Draft,
} from '../../player/src/editor/document';
export { tutorialOf, withTile } from '../../player/src/editor/finish';
export { loadModel, type Model } from '../../player/src/app/model';
export { PALETTES, tutorialColoring } from '../../player/src/app/coloring';
export { placeFills } from '../../player/src/app/placement';
export {
  constructionSpec,
  constructionText,
} from '../../player/src/agent/drawing';
