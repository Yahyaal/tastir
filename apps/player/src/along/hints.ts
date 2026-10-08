import {
  figureOn,
  rotate,
  project,
  sub,
  scale,
  type Geometry,
  type Scene,
  type StepCheck,
  type Vec,
} from '@tastir/engine';
import type { ElementSpec, Tutorial } from '@tastir/schema';
import { refsOf } from '../editor/blocks';
import { specsOf } from '../editor/document';
import { toolOf, type ToolId } from '../editor/tools';

/** What a hint shows on the board, at its level (1, 2 or 3). */
export interface Hint {
  /** The board's lines, circles and shapes the step works from. */
  readonly glow: ReadonlySet<string>;
  /** Points ringed: what it works from (level 1), where to click (2). */
  readonly rings: readonly Vec[];
  /** The tool to use (level 2 and up). */
  readonly tool?: ToolId;
  /** The answer, dashed (level 3). */
  readonly dashed: readonly Geometry[];
  /** The hint in words. */
  readonly words: string;
}

/** The tool that draws an element made this way. */
export function toolFor(spec: ElementSpec, isTile: boolean): ToolId {
  if ('line' in spec) {
    const l = spec.line;
    if ('perpendicularTo' in l) return 'square';
    if ('parallelTo' in l) return 'parallel';
    if ('bisects' in l) return 'halve';
    return 'ruler';
  }
  if ('circle' in spec) {
    const c = spec.circle;
    if ('radiusOf' in c) return 'same';
    if ('radiusFrom' in c) return 'span';
    if ('tangentTo' in c) return 'touch';
    return 'compass';
  }
  if ('polygon' in spec) return isTile ? 'tile' : 'polygon';
  return 'point';
}

/** The turn or mirror that makes a copy (`x@k`) from its original. */
function copyMove(
  tutorial: Tutorial,
  scene: Scene,
  name: string,
): ((p: Vec) => Vec) | undefined {
  const m = /@(\d+)$/.exec(name);
  if (!m) return undefined;
  const group = [...scene.elements.values()].find(
    (e) => e.geometry.kind === 'group' && e.geometry.members.includes(name),
  );
  const spec = group && specsOf(tutorial).get(group.name);
  if (!spec || !('repeat' in spec)) return undefined;
  const by = spec.repeat.by;
  if (by.startsWith('mirror:')) {
    const g = scene.elements.get(by.slice('mirror:'.length))?.geometry;
    if (g?.kind !== 'line') return undefined;
    return (p) => sub(scale(project(p, g.line), 2), p);
  }
  const n = Number(by.slice(3));
  const k = Number(m[1]);
  return (p) => rotate(p, (2 * Math.PI * k) / n);
}

const pointAt = (scene: Scene, ref: string): Vec | undefined => {
  const g = scene.elements.get(ref)?.geometry;
  return g?.kind === 'point' ? g.at : undefined;
};

/**
 * The hint for a beat at a level: 1, what the step works from glows on
 * the board; 2, also the points to click are ringed and the right tool;
 * 3, also the answer is dashed. The hint is about the first thing the
 * step still needs.
 */
export function hintFor(
  tutorial: Tutorial,
  scene: Scene,
  board: Scene,
  beat: number,
  highlight: readonly string[] | undefined,
  check: StepCheck,
  level: number,
): Hint {
  const glow = new Set<string>();
  const rings: Vec[] = [];
  // What the step works from: the tutorial's highlight, or what its new
  // figures are built from.
  const made = new Set(
    [...scene.elements.values()]
      .filter((e) => e.beat === beat)
      .map((e) => e.name),
  );
  const from =
    highlight ??
    [
      ...new Set(
        [...scene.elements.values()]
          .filter((e) => e.beat === beat)
          .flatMap((e) => e.deps),
      ),
    ].filter((d) => !made.has(d));
  for (const ref of from) {
    const g = scene.elements.get(ref)?.geometry;
    if (!g) continue;
    if (g.kind === 'point') rings.push(g.at);
    else {
      const on = figureOn(board, g);
      if (on) glow.add(on);
    }
  }
  const first = check.missing[0];
  if (level < 2 || !first)
    return {
      glow,
      rings,
      dashed: [],
      words: 'What this step works from glows on your board.',
    };

  // Where to click, and with what.
  const base = first.name.replace(/@\d+$/, '');
  const spec = specsOf(tutorial).get(base);
  const tool = spec ? toolFor(spec, base === tutorial.pattern.cell) : 'ruler';
  const move = copyMove(tutorial, scene, first.name) ?? ((p: Vec) => p);
  const clicks: Vec[] = [];
  for (const ref of spec ? refsOf(spec) : []) {
    const at = pointAt(scene, ref);
    if (at) clicks.push(move(at));
    else {
      const g = scene.elements.get(ref)?.geometry;
      const on = g && figureOn(board, g);
      if (on) glow.add(on);
    }
  }
  const copies = check.missing.filter((m) => m.name.includes('@')).length;
  const label = toolOf(tool).label;
  const more =
    check.missing.length > 1
      ? copies
        ? ` Then the turned copies: Symmetry draws them all at once.`
        : ` Then ${check.missing.length - 1} more.`
      : '';
  const words =
    level < 3
      ? `Use ${label}: the points to click are ringed.${more}`
      : `The answer is dashed: draw over it with ${label}.${more}`;
  return {
    glow,
    rings: clicks,
    tool,
    dashed: level >= 3 ? check.missing.map((m) => m.geometry) : [],
    words,
  };
}
