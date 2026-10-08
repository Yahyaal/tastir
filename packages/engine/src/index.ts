export * from './lib/vec.js';
export * from './lib/tolerance.js';
export * from './lib/shapes.js';
export {
  intersect,
  intersectCircleCircle,
  intersectLineCircle,
  intersectLineLine,
  overlap,
} from './lib/intersect.js';
export * from './lib/construct.js';
export {
  crossingOf,
  crossingsOf,
  evaluate,
  pointInPolygon,
  pointOf,
  TutorialError,
  type Geometry,
  type Scene,
  type SceneElement,
} from './lib/evaluate.js';
export { arrangement, signedArea } from './lib/arrangement.js';
export {
  inkCarriers,
  inkBeats,
  inkStrokes,
  type InkStroke,
} from './lib/ink.js';
export {
  cellOf,
  computePattern,
  pieceAt,
  rectangularPeriod,
  type Cell,
  type Pattern,
  type Piece,
  type PieceType,
} from './lib/pieces.js';
export { panelOf, type Panel } from './lib/panel.js';
export { pickFor, stepsBuiltOn, type PickChoice } from './lib/picking.js';
export { expectedGolden, goldenOf, type Golden } from './lib/golden.js';
export {
  constructionCrossings,
  firstFailingStep,
  hasSymmetry,
  strokesOffConstruction,
  strokesOffCrossings,
} from './lib/checks.js';
export {
  classicSelection,
  inkPieces,
  strokesOf,
  type InkPiece,
} from './lib/freeInk.js';
export {
  ALONG_EPS,
  checkStep,
  drawnOn,
  extrasOn,
  figureOn,
  figuresOf,
  neededAt,
  sameLine,
  type Figures,
  type Needed,
  type StepCheck,
} from './lib/along.js';
