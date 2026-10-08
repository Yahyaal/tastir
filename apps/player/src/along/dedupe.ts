import { ALONG_EPS, distance, sameLine, type Geometry } from '@tastir/engine';
import type { ElementSpec, Step } from '@tastir/schema';
import { renameSpec } from '../editor/blocks';
import { check, type Draft } from '../editor/document';

/** Whether two figures (or points) are the same, however they were made. */
function same(a: Geometry, b: Geometry): boolean {
  const eps = ALONG_EPS;
  if (a.kind === 'point' && b.kind === 'point')
    return distance(a.at, b.at) <= eps;
  if (a.kind === 'line' && b.kind === 'line')
    return sameLine(a.line, b.line, eps);
  if (a.kind === 'circle' && b.kind === 'circle')
    return (
      distance(a.circle.centre, b.circle.centre) <= eps &&
      Math.abs(a.circle.radius - b.circle.radius) <= eps
    );
  if (a.kind === 'polygon' && b.kind === 'polygon') {
    const n = a.vertices.length;
    if (b.vertices.length !== n) return false;
    const start = b.vertices.findIndex(
      (v) => distance(v, a.vertices[0] as never) <= eps,
    );
    if (start < 0) return false;
    const at = (i: number) => b.vertices[(((start + i) % n) + n) % n];
    return (
      a.vertices.every((v, i) => distance(v, at(i) as never) <= eps) ||
      a.vertices.every((v, i) => distance(v, at(-i) as never) <= eps)
    );
  }
  return false;
}

/**
 * The board without what the learner drew twice: a line, circle, shape
 * or point that lands on one drawn before is left out and every use of
 * it points to the earlier one; a turned copy that lands on something
 * drawn is left out with its repeat when all its copies do. Steps left
 * empty go. So a kept pattern lists each figure once.
 */
export function withoutDuplicates(draft: Draft): Draft {
  const { scene } = check(draft);
  const kept: { name: string; g: Geometry }[] = [];
  const map = new Map<string, string>();
  const earlier = (g: Geometry) => kept.find((k) => same(k.g, g))?.name;
  const steps: Step[] = [];
  for (const step of draft.steps) {
    if (!step.create) {
      steps.push(step);
      continue;
    }
    const create: Record<string, ElementSpec> = {};
    for (const [name, spec] of Object.entries(step.create)) {
      const g = scene.elements.get(name)?.geometry;
      if (!g) {
        create[name] = spec;
        continue;
      }
      if (g.kind === 'group') {
        // A repeat (or a set of crossings) stays unless every member
        // lands on something drawn before.
        const members = g.members.map((m) => ({
          m,
          g: scene.elements.get(m)?.geometry,
        }));
        const dupes = members.map((x) => (x.g ? earlier(x.g) : undefined));
        if ('repeat' in spec && dupes.every((d) => d !== undefined)) {
          members.forEach((x, i) => map.set(x.m, dupes[i] as string));
          continue;
        }
        create[name] = renameSpec(spec, (r) => map.get(r) ?? r);
        members.forEach((x) => x.g && kept.push({ name: x.m, g: x.g }));
        continue;
      }
      const before = earlier(g);
      if (before) {
        map.set(name, before);
        continue;
      }
      create[name] = renameSpec(spec, (r) => map.get(r) ?? r);
      kept.push({ name, g });
    }
    if (Object.keys(create).length) steps.push({ ...step, create });
  }
  const cell = draft.pattern?.cell;
  return {
    ...draft,
    steps: steps.map((s, i) => ({ ...s, id: i + 1 })),
    ...(draft.pattern && cell
      ? { pattern: { ...draft.pattern, cell: map.get(cell) ?? cell } }
      : {}),
  };
}
