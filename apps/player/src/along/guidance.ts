import type { Scene, StepCheck } from '@tastir/engine';
import type { Tutorial } from '@tastir/schema';
import { toolOf } from '../editor/tools';
import { hintFor } from './hints';
import { placeKey } from './names';

/** A useful first action, without choosing a tool or drawing on the learner's behalf. */
export function guidanceFor(
  tutorial: Tutorial,
  scene: Scene,
  board: Scene,
  beat: number,
  check: StepCheck,
  names: ReadonlyMap<string, string>,
) {
  if (check.done) return undefined;
  const hint = hintFor(tutorial, scene, board, beat, undefined, check, 2);
  if (!hint.tool) return undefined;
  const tool = toolOf(hint.tool);
  const labels = hint.rings.map((p) => names.get(placeKey(p)));
  const named =
    labels.length === 2 &&
    labels.every(Boolean) &&
    ['compass', 'ruler'].includes(tool.id);
  return {
    tool: tool.id,
    words: named
      ? `Choose ${tool.label}, click ${labels[0]}, then ${labels[1]}.`
      : `Choose ${tool.label}. ${tool.does}`,
  };
}
