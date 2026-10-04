import type { Expect, Tutorial } from '@tastir/schema';
import { evaluate, type Scene } from './evaluate.js';
import { computePattern, type Pattern } from './pieces.js';
import { length } from './vec.js';

/** The fields of an expect block that the engine can check. */
export type Golden = Omit<Expect, 'note'>;

/** Golden values are written to five decimal places. */
const round = (n: number) => Number(n.toFixed(5));

/**
 * What the engine actually produces for a tutorial, in the shape of its
 * expect block and rounded the same way, so the two compare with a plain
 * deep equality and any difference shows as a readable diff.
 */
export function goldenOf(
  tutorial: Tutorial,
  scene: Scene = evaluate(tutorial),
  pattern: Pattern = computePattern(scene, tutorial),
): Golden {
  const golden: Golden = {
    pieceTypes: pattern.types.length,
    pieces: pattern.types.map((t) => ({
      name: t.name ?? '(no piece in expect matches)',
      vertices: t.vertices,
      area: round(t.area),
      perCell: t.perCell,
    })),
  };
  if (tutorial.expect.crossings) {
    golden.crossings = Object.fromEntries(
      Object.entries(tutorial.expect.crossings).map(([name, want]) => {
        const g = scene.elements.get(name)?.geometry;
        const members = g?.kind === 'group' ? g.members : [];
        const distances = members.map((m) => {
          const p = scene.elements.get(m)?.geometry;
          return p?.kind === 'point' ? round(length(p.at)) : NaN;
        });
        const got: { count: number; distanceFromO?: number } = {
          count: members.length,
        };
        if (want.distanceFromO !== undefined) {
          // One distance when they agree; otherwise the first that differs.
          got.distanceFromO =
            distances.find((d) => d !== want.distanceFromO) ??
            want.distanceFromO;
        }
        return [name, got];
      }),
    );
  }
  if (tutorial.expect.cellArea !== undefined)
    golden.cellArea = round(pattern.cell.area);
  return golden;
}

/** The expect block, rounded and ordered as goldenOf reports it. */
export function expectedGolden(tutorial: Tutorial): Golden {
  const rest: Expect = { ...tutorial.expect };
  delete rest.note;
  return {
    ...rest,
    pieces: rest.pieces
      .map(({ small: _small, ...p }) => ({ ...p, area: round(p.area) }))
      .sort((a, b) => b.area - a.area),
  };
}
