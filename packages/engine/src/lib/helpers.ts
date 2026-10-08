import type { Tutorial } from '@tastir/schema';
import type { Scene, SceneElement } from './evaluate.js';
import { inkCarriers, inkStrokes } from './ink.js';
import { cellOf } from './pieces.js';
import type { Curve } from './shapes.js';
import { cross, distance, dot, sub, type Vec } from './vec.js';

/**
 * Helper lines: construction lines the pattern never runs along (the
 * player draws them dashed). They only help find points, so many can be
 * left out of a drawing without losing anything: a helper line is hidden
 * unless a point something shown depends on can be found no other way.
 */

const EPS = 1e-7;

/** The lines of a tutorial that never carry its ink. */
export function helperLines(scene: Scene, tutorial: Tutorial): Set<string> {
  const carriers = inkCarriers(scene, inkStrokes(scene, tutorial));
  const out = new Set<string>();
  for (const el of scene.elements.values())
    if (el.geometry.kind === 'line' && !carriers.has(el.name)) out.add(el.name);
  return out;
}

function curvesOf(el: SceneElement): Curve[] {
  const g = el.geometry;
  if (g.kind === 'line') return [g.line];
  if (g.kind === 'circle') return [g.circle];
  if (g.kind === 'polygon') return [...g.sides];
  return [];
}

function through(c: Curve, p: Vec): boolean {
  if (c.kind === 'line') {
    const d = sub(p, c.point);
    return Math.abs(cross(c.dir, d)) <= EPS;
  }
  if (c.kind === 'circle')
    return Math.abs(distance(p, c.centre) - c.radius) <= EPS;
  const d = sub(c.b, c.a);
  const len2 = dot(d, d);
  const t = dot(sub(p, c.a), d) / len2;
  if (t < -EPS || t > 1 + EPS) return false;
  return Math.abs(cross(d, sub(p, c.a))) / Math.sqrt(len2) <= EPS;
}

/** The direction of a straight curve, or undefined for a circle. */
function dirOf(c: Curve): Vec | undefined {
  if (c.kind === 'line') return c.dir;
  if (c.kind === 'segment') {
    const d = sub(c.b, c.a);
    const l = Math.hypot(d.x, d.y);
    return { x: d.x / l, y: d.y / l };
  }
  return undefined;
}

/** Whether two curves through a point cross (or touch) there, rather than
 * lie along each other. */
function distinct(a: Curve, b: Curve): boolean {
  const da = dirOf(a);
  const db = dirOf(b);
  if (da && db) return Math.abs(cross(da, db)) > EPS;
  if (!da && !db && a.kind === 'circle' && b.kind === 'circle')
    return (
      distance(a.centre, b.centre) > EPS || Math.abs(a.radius - b.radius) > EPS
    );
  return true;
}

/**
 * Which helper lines can be hidden. A helper line stays shown when some
 * point that a shown element depends on (found from curves made before
 * it), or that the ink or the tile's corners need, is a crossing of shown
 * curves only with it. Everything else is hidden.
 */
export function hiddenHelpers(scene: Scene, tutorial: Tutorial): Set<string> {
  const helpers = helperLines(scene, tutorial);
  const order = new Map<string, number>();
  let n = 0;
  for (const el of scene.elements.values()) order.set(el.name, n++);
  const els = [...scene.elements.values()];
  const figures = els.filter((el) => curvesOf(el).length > 0);
  const given = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
  ];

  // The points the ink turns at, and the tile's corners: all needed.
  const final: Vec[] = [];
  for (const s of inkStrokes(scene, tutorial))
    final.push(s.segment.a, s.segment.b);
  final.push(...cellOf(scene, tutorial.pattern.cell).corners);

  const hidden = new Set(helpers);
  /** Whether a point is a crossing of shown curves made before `before`. */
  const findable = (p: Vec, before: number) => {
    if (given.some((q) => distance(p, q) <= EPS)) return true;
    const curves: Curve[] = [];
    for (const el of figures) {
      if ((order.get(el.name) ?? 0) >= before || hidden.has(el.name)) continue;
      for (const c of curvesOf(el))
        if (through(c, p)) {
          if (curves.some((d) => distinct(c, d))) return true;
          curves.push(c);
        }
    }
    return false;
  };
  /** Shows the hidden helpers made before `before` that pass through p. */
  const unhide = (p: Vec, before: number) => {
    let any = false;
    for (const name of hidden) {
      const el = scene.elements.get(name);
      if (!el || (order.get(name) ?? 0) >= before) continue;
      if (curvesOf(el).some((c) => through(c, p))) {
        hidden.delete(name);
        any = true;
      }
    }
    return any;
  };

  for (let changed = true; changed;) {
    changed = false;
    for (const el of figures) {
      if (hidden.has(el.name)) continue;
      const at = order.get(el.name) ?? 0;
      for (const d of el.deps) {
        const g = scene.elements.get(d)?.geometry;
        if (g?.kind !== 'point' || findable(g.at, at)) continue;
        if (unhide(g.at, at)) changed = true;
      }
    }
    for (const p of final)
      if (!findable(p, Infinity) && unhide(p, Infinity)) changed = true;
  }
  return hidden;
}

/**
 * The points left floating when the hidden helper lines are left out:
 * those not on any two shown curves. They are left out too.
 */
export function floatingPoints(
  scene: Scene,
  hidden: ReadonlySet<string>,
): Set<string> {
  const shown = [...scene.elements.values()].filter(
    (el) => !hidden.has(el.name) && curvesOf(el).length > 0,
  );
  const out = new Set<string>();
  for (const el of scene.elements.values()) {
    const g = el.geometry;
    if (g.kind !== 'point' || el.step === 0) continue;
    const curves: Curve[] = [];
    let ok = false;
    for (const f of shown) {
      for (const c of curvesOf(f))
        if (through(c, g.at)) {
          if (curves.some((d) => distinct(c, d))) ok = true;
          curves.push(c);
        }
      if (ok) break;
    }
    if (!ok) out.add(el.name);
  }
  return out;
}
