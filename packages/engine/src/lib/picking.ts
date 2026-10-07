import type { Pick } from '@tastir/schema';
import {
  crossingOf,
  crossingsOf,
  TutorialError,
  type Scene,
} from './evaluate.js';
import { angleDeg, distance, length, type Vec } from './vec.js';

/** The pick rule an editor writes for a clicked crossing, or why none. */
export type PickChoice =
  | { readonly found: true; readonly pick?: Pick }
  | { readonly found: false; readonly reason: string };

/** Angles a learner reads easily, tried before finer ones. */
const ROUND_STEPS = [90, 45, 30, 15];
const FINE_STEPS = [5, 1, 0.5, 0.1, 0.01, 0.001];

const angleBetween = (a: number, b: number) =>
  Math.abs(((((a - b) % 360) + 540) % 360) - 180);

/**
 * The simplest pick rule that names the crossing of `meet` at `at` and no
 * other: none when the two elements cross once, else an angle from O, the
 * nearest or farthest crossing from O or from a named point, inside or
 * outside a circle, or a circle with one of those. Every rule is checked
 * by evaluating it as a point step would. `usable` says which elements a
 * rule may name (those made before the step being edited); by default,
 * every element of the scene.
 */
export function pickFor(
  scene: Scene,
  meet: readonly [string, string],
  at: Vec,
  usable: (name: string) => boolean = () => true,
): PickChoice {
  const { eps } = scene.tol;
  const fail = (reason: string): never => {
    throw new TutorialError('pattern', `${meet[0]} × ${meet[1]}`, reason);
  };
  let candidates: Vec[];
  try {
    candidates = crossingsOf(scene, meet, fail);
  } catch (e) {
    if (e instanceof TutorialError) return { found: false, reason: e.reason };
    throw e;
  }
  if (!candidates.some((p) => distance(p, at) <= eps)) {
    return {
      found: false,
      reason: `"${meet[0]}" and "${meet[1]}" do not cross there`,
    };
  }
  /** Whether the engine, evaluating the rule, chooses `at`. */
  const picks = (pick: Pick | undefined): boolean => {
    try {
      return distance(crossingOf(scene, meet, pick, fail), at) <= eps;
    } catch (e) {
      if (e instanceof TutorialError) return false;
      throw e;
    }
  };
  if (candidates.length === 1) return { found: true };

  /** Whether `score` puts `at` first among `pool`, clear of the next. */
  const first = (pool: Vec[], score: (p: Vec) => number, margin: number) => {
    const own = score(at);
    return pool.every((p) => distance(p, at) <= eps || score(p) - own > margin);
  };
  const tries: (() => Pick | undefined)[] = [];
  // The crossing's own direction when it is a round angle ("the crossing
  // at 45°"); else the roundest angle that still chooses it alone.
  const angleRule = (pool: Vec[], steps: number[]) => (): Pick | undefined => {
    if (length(at) <= eps) return undefined;
    const own = angleDeg(at);
    const targets = steps.map((step) =>
      Number(
        ((((Math.round(own / step) * step) % 360) + 360) % 360).toFixed(3),
      ),
    );
    const exact = targets.filter((a) => angleBetween(a, own) < 1e-6);
    for (const angle of [...exact, ...targets]) {
      const near = (p: Vec) =>
        length(p) <= eps ? Infinity : angleBetween(angleDeg(p), angle);
      if (first(pool, near, (eps * 180) / Math.PI)) return { angle };
    }
    return undefined;
  };
  const fromPoint =
    (pool: Vec[], name: string, q: Vec) => (): Pick | undefined =>
      first(pool, (p) => distance(p, q), eps)
        ? { nearest: name }
        : first(pool, (p) => -distance(p, q), eps)
          ? { farthest: name }
          : undefined;

  const points: [string, Vec][] = [];
  const circles: [string, { centre: Vec; radius: number }][] = [];
  for (const el of scene.elements.values()) {
    if (!usable(el.name)) continue;
    const g = el.geometry;
    if (g.kind === 'point') points.push([el.name, g.at]);
    if (g.kind === 'circle') circles.push([el.name, g.circle]);
  }
  const origin = points.find(([n]) => n === 'O');

  tries.push(angleRule(candidates, ROUND_STEPS));
  if (origin) tries.push(fromPoint(candidates, 'O', origin[1]));
  tries.push(angleRule(candidates, FINE_STEPS));
  for (const [name, q] of points)
    if (name !== 'O') tries.push(fromPoint(candidates, name, q));
  // A circle keeps the crossings on one side of it; then, if more than
  // one is left, an angle or O chooses among them.
  for (const [name, c] of circles) {
    const side = (p: Vec) => distance(p, c.centre) - c.radius;
    const own = side(at);
    if (Math.abs(own) <= eps) continue;
    const key = own < 0 ? 'inside' : 'outside';
    const pool = candidates.filter((p) =>
      own < 0 ? side(p) < -eps : side(p) > eps,
    );
    if (pool.length === 1) {
      tries.push(() => ({ [key]: name }));
      continue;
    }
    for (const rule of [
      angleRule(pool, [...ROUND_STEPS, ...FINE_STEPS]),
      ...(origin ? [fromPoint(pool, 'O', origin[1])] : []),
    ]) {
      tries.push(() => {
        const r = rule();
        return r && { [key]: name, ...r };
      });
    }
  }
  for (const attempt of tries) {
    const pick = attempt();
    if (pick && picks(pick)) return { found: true, pick };
  }
  return {
    found: false,
    reason: `no simple rule picks this crossing of "${meet[0]}" and "${meet[1]}" alone; mark a point near it first`,
  };
}

/**
 * The steps built on a step: every later step that uses one of its
 * elements, or an element built on them, in order. Removing the step
 * breaks all of these.
 */
export function stepsBuiltOn(scene: Scene, step: number): number[] {
  const tainted = new Set<string>();
  const steps = new Set<number>();
  for (const el of scene.elements.values()) {
    if (el.step === step) tainted.add(el.name);
    else if (el.step > step && el.deps.some((d) => tainted.has(d))) {
      tainted.add(el.name);
      steps.add(el.step);
    }
  }
  return [...steps].sort((a, b) => a - b);
}
