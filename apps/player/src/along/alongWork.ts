import {
  checkStep,
  extrasOn,
  wallPieces,
  type Segment,
  type PieceType,
  type Scene,
} from '@tastir/engine';
import type { Tutorial } from '@tastir/schema';
import { checkInk, prepareInk, type Ready } from './inkWork';
import type { Model } from '../app/model';
import type { Draft } from '../editor/document';

export const jobs = {
  prepare: ({ model, draft }: { model: Model; draft: Draft }) =>
    prepareInk(model, draft),
  ink: ({
    ready,
    chosen,
    tutorial,
  }: {
    ready: Ready;
    chosen: ReadonlySet<string>;
    tutorial: Tutorial;
  }) => checkInk(ready, chosen, tutorial),
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
