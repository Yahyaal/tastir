import {
  checkStep,
  extrasOn,
  wallPieces,
  type Segment,
  type PieceType,
  type Scene,
} from '@tastir/engine';

// The ink stage's work has a worker of its own (useInkWork), which keeps
// the prepared board.
export const jobs = {
  steps: ({
    scene,
    board,
    shown,
    shapes,
    optional,
  }: {
    scene: Scene;
    board: Scene;
    shown: readonly number[];
    shapes: ReadonlySet<string>;
    optional: ReadonlySet<string>;
  }) => ({
    checks: shown.map((b) =>
      checkStep(scene, board, b, undefined, shapes, optional),
    ),
    extras: extrasOn(scene, board),
  }),
  wall: ({
    segments,
    types,
  }: {
    segments: readonly Segment[];
    types: readonly PieceType[];
  }) => wallPieces(segments, types),
};
export type Job = keyof typeof jobs;
export type Input<K extends Job> = Parameters<(typeof jobs)[K]>[0];
export type Output<K extends Job> = ReturnType<(typeof jobs)[K]>;
export function calculate<K extends Job>(job: K, input: Input<K>): Output<K> {
  return (jobs[job] as (input: Input<K>) => Output<K>)(input);
}
