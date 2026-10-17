/**
 * The editor and model code the studio shares with the player and the
 * assistant, from packages/project-core, so an edit made here is exactly
 * the edit the editor would make.
 */
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
} from '@tastir/project-core/document';
export { tutorialOf, withTile } from '@tastir/project-core/finish';
export { loadModel, type Model } from '@tastir/project-core/model';
export { PALETTES, tutorialColoring } from '@tastir/project-core/coloring';
export { placeFills } from '@tastir/project-core/placement';
export {
  constructionSpec,
  constructionText,
} from '@tastir/project-core/drawing';
