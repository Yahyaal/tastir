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
  evaluate,
  pointInPolygon,
  pointOf,
  TutorialError,
  type Geometry,
  type Scene,
  type SceneElement,
} from './lib/evaluate.js';
export { arrangement, signedArea } from './lib/arrangement.js';
export { inkStrokes, type InkStroke } from './lib/ink.js';
export {
  computePattern,
  type Cell,
  type Pattern,
  type Piece,
  type PieceType,
} from './lib/pieces.js';
