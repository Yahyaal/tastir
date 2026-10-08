import type { Scene, Vec } from '@tastir/engine';
import { addStep, check, plainReason, specsOf, type Draft } from './document';
import { tileOf, tileWarning, withTile } from './finish';
import {
  buildStep,
  tidySymmetry,
  type Symmetry,
  type Target,
  type Tool,
} from './tools';

/** A circle the learner can choose, drawn dashed. */
export interface Choice {
  readonly centre: Vec;
  readonly radius: number;
}

/** What a tool's clicks come to. */
export type Made =
  /** The new draft, with the step at place `at`; perhaps a warning. */
  | { readonly kind: 'made'; readonly next: Draft; readonly warn?: string }
  /** Two circles touch what was clicked: the learner clicks one. */
  | {
      readonly kind: 'choose';
      readonly drafts: readonly Draft[];
      readonly circles: readonly Choice[];
    }
  /** Nothing is drawn, and why. */
  | { readonly kind: 'refused'; readonly said: string };

/**
 * The step a tool's clicks make, added at place `at` (0-based) of the
 * draft, unless the engine cannot do it. A Touching step that fits on
 * both sides asks the learner to choose; a tile must repeat edge to edge.
 * The editor and the draw-along board both draw with this.
 */
export function makeStep(
  draft: Draft,
  tool: Tool,
  clicks: readonly Target[],
  at: number,
  symmetry: Symmetry,
  scene: Scene,
): Made {
  const sides = tool.id === 'touch' ? [undefined, 'near', 'far'] : [undefined];
  let reason = '';
  const works: { next: Draft; circle?: Choice }[] = [];
  for (const side of sides) {
    const built = buildStep(
      draft,
      tool,
      clicks,
      side as 'near' | 'far',
      symmetry,
      { scene },
    );
    const made = symmetry ? tidySymmetry(draft, built, at, { scene }) : built;
    if (!Object.keys(made.create).length)
      return { kind: 'refused', said: 'That point is already marked.' };
    let next = addStep(draft, made, at);
    const after = check(next);
    const st = after.status.get(at + 1);
    let warn: string | undefined;
    if (st?.ok && tool.id === 'tile') {
      // The tile must repeat edge to edge, or there is no wall.
      next = withTile(next, Object.keys(made.create).at(-1) as string);
      const tile = tileOf(next, after.scene);
      if ('reason' in tile)
        return {
          kind: 'refused',
          said: `That cannot be the tile: ${plainReason(tile.reason, specsOf(next))}`,
        };
      warn = tileWarning(after.scene, tile.cell);
    }
    if (st?.ok) {
      // One circle fits without choosing a side: that is the step.
      if (side === undefined)
        return { kind: 'made', next, ...(warn ? { warn } : {}) };
      const g = after.scene.elements.get(
        Object.keys(made.create).at(-1) as string,
      )?.geometry;
      works.push({
        next,
        ...(g?.kind === 'circle' ? { circle: g.circle } : {}),
      });
    } else reason ||= st && !st.ok ? st.reason : '';
  }
  if (works.length === 1)
    return { kind: 'made', next: works[0]?.next as Draft };
  if (works.length > 1)
    return {
      kind: 'choose',
      drafts: works.map((w) => w.next),
      circles: works.flatMap((w) => (w.circle ? [w.circle] : [])),
    };
  return { kind: 'refused', said: `That does not make a figure: ${reason}` };
}
