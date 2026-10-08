import {
  loadTutorial,
  starAndCross,
  tutorialFiles,
} from '../test/tutorials.js';
import { evaluate } from './evaluate.js';
import { floatingPoints, helperLines, hiddenHelpers } from './helpers.js';
import { inkStrokes } from './ink.js';
import { cellOf } from './pieces.js';
import { distance } from './vec.js';

/** Whether a point lies on two shown curves that cross there. */
function onTwoShown(
  scene: ReturnType<typeof evaluate>,
  hidden: ReadonlySet<string>,
  p: { x: number; y: number },
): boolean {
  if (distance(p, { x: 0, y: 0 }) < 1e-7 || distance(p, { x: 1, y: 0 }) < 1e-7)
    return true;
  const floating = floatingPoints(scene, hidden);
  // A named point there that is not floating is on two shown curves.
  for (const el of scene.elements.values())
    if (
      el.geometry.kind === 'point' &&
      distance(el.geometry.at, p) < 1e-7 &&
      !floating.has(el.name)
    )
      return true;
  return false;
}

describe('helper lines', () => {
  it('keeps every helper the star and cross needs: its points lie on them', () => {
    const t = starAndCross();
    const scene = evaluate(t);
    expect(helperLines(scene, t).size).toBeGreaterThan(0);
    // E, N, W and S are found on the horizontal and vertical, the
    // corners of the tile on the lines that touch the circle.
    expect([...hiddenHelpers(scene, t)]).toEqual([]);
  });

  it.each(tutorialFiles())(
    '%s: hides only helper lines, and never one the ink or the tile needs',
    (file) => {
      const t = loadTutorial(file);
      const scene = evaluate(t);
      const helpers = helperLines(scene, t);
      const hidden = hiddenHelpers(scene, t);
      for (const h of hidden) expect(helpers.has(h)).toBe(true);
      // Every point the ink turns at, and every corner of the tile, is
      // still a crossing of shown curves.
      const needed = [
        ...inkStrokes(scene, t).flatMap((s) => [s.segment.a, s.segment.b]),
        ...cellOf(scene, t.pattern.cell).corners,
      ];
      const lost = needed.filter((p) => {
        // A point only the hidden lines find: on no two shown curves.
        const hiddenOnly = [...hidden].some((name) => {
          const g = scene.elements.get(name)?.geometry;
          return (
            g?.kind === 'line' &&
            Math.abs(
              g.line.dir.x * (p.y - g.line.point.y) -
                g.line.dir.y * (p.x - g.line.point.x),
            ) < 1e-7
          );
        });
        return (
          hiddenOnly &&
          !onTwoShown(scene, hidden, p) &&
          !curvesCross(scene, hidden, p)
        );
      });
      expect(lost).toEqual([]);
    },
  );
});

/** Whether two shown curves cross at a point (an unnamed crossing). */
function curvesCross(
  scene: ReturnType<typeof evaluate>,
  hidden: ReadonlySet<string>,
  p: { x: number; y: number },
): boolean {
  const on: string[] = [];
  for (const el of scene.elements.values()) {
    if (hidden.has(el.name)) continue;
    const g = el.geometry;
    const hit =
      g.kind === 'line'
        ? Math.abs(
            g.line.dir.x * (p.y - g.line.point.y) -
              g.line.dir.y * (p.x - g.line.point.x),
          ) < 1e-7
        : g.kind === 'circle'
          ? Math.abs(distance(p, g.circle.centre) - g.circle.radius) < 1e-7
          : g.kind === 'polygon'
            ? g.sides.some((s) => {
                const dx = s.b.x - s.a.x;
                const dy = s.b.y - s.a.y;
                const l = Math.hypot(dx, dy);
                const t = ((p.x - s.a.x) * dx + (p.y - s.a.y) * dy) / (l * l);
                return (
                  t > -1e-7 &&
                  t < 1 + 1e-7 &&
                  Math.abs(dx * (p.y - s.a.y) - dy * (p.x - s.a.x)) / l < 1e-7
                );
              })
            : false;
    if (hit) on.push(el.name);
  }
  return on.length >= 2;
}
