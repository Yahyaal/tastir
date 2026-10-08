import { ALONG_EPS, distance, type Scene } from '@tastir/engine';
import type { ElementSpec } from '@tastir/schema';
import { check, specsOf, type Draft } from '../editor/document';

/** Names a step may give: a letter, then letters, digits and _. */
const PLAIN = /^[A-Za-z][A-Za-z0-9_]*$/;

/** The tutorial's names for its points, by place (plain names only). */
function tutorialPoints(tutorial: Scene) {
  const out: { name: string; at: { x: number; y: number } }[] = [];
  for (const el of tutorial.elements.values())
    if (
      el.geometry.kind === 'point' &&
      PLAIN.test(el.name) &&
      el.name !== 'O' &&
      el.name !== 'A'
    )
      out.push({ name: el.name, at: el.geometry.at });
  return out;
}

/** Every reference in a spec renamed. */
function renamed(value: unknown, from: string, to: string): unknown {
  if (typeof value === 'string')
    return value === from
      ? to
      : value.startsWith(`${from}.`) || value.startsWith(`${from}@`)
        ? to + value.slice(from.length)
        : value;
  if (Array.isArray(value)) return value.map((v) => renamed(v, from, to));
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, renamed(v, from, to)]),
    );
  return value;
}

/**
 * The step at place `at` with each point the editor named P1, P2, …
 * renamed after the tutorial's point in the same place (E, N, …), when
 * that name is free, so the learner's board and the step text use the
 * tutorial's names.
 */
export function withTutorialNames(
  draft: Draft,
  at: number,
  tutorial: Scene,
  eps = ALONG_EPS,
): Draft {
  const step = draft.steps[at];
  if (!step?.create) return draft;
  const taken = new Set([...specsOf(draft).keys(), 'O', 'A']);
  const points = tutorialPoints(tutorial);
  const fresh = Object.entries(step.create).filter(
    ([name, el]) => 'point' in el && /^P\d+$/.test(name),
  );
  if (!fresh.length) return draft;
  const scene = check({ steps: draft.steps.slice(0, at + 1) } as Draft).scene;
  let create: Record<string, ElementSpec> = { ...step.create };
  let text = step.text;
  for (const [name] of fresh) {
    const g = scene.elements.get(name)?.geometry;
    if (g?.kind !== 'point') continue;
    const match = points.find(
      (p) => !taken.has(p.name) && distance(p.at, g.at) <= eps,
    );
    if (!match) continue;
    taken.add(match.name);
    create = Object.fromEntries(
      Object.entries(create).map(([k, v]) => [
        k === name ? match.name : k,
        renamed(v, name, match.name) as ElementSpec,
      ]),
    );
    text = text.replace(new RegExp(`\\b${name}\\b`, 'g'), match.name);
  }
  const steps = [...draft.steps];
  steps[at] = { ...step, text, create };
  return { ...draft, steps };
}
