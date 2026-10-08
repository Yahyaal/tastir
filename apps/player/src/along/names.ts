import type { Scene, Vec } from '@tastir/engine';
import type { Tutorial } from '@tastir/schema';
import { clearestName } from '../editor/document';

/** The words of a text that could be names: E, NE, K2, c1. Crossings
 * numbered by the engine (k.3) and copies (x@2) are never named. */
const words = (text: string) => text.match(/[A-Za-z][A-Za-z0-9_]*/g) ?? [];

/** The points a text names, among the scene's points. */
export function namesIn(text: string, scene: Scene): Set<string> {
  const out = new Set<string>();
  for (const w of words(text))
    if (scene.elements.get(w)?.geometry.kind === 'point') out.add(w);
  return out;
}

/**
 * The tutorial's point names a learner reads: those its texts use and its
 * steps highlight (E, N, the corner K). The others (g6_90, J120) are names for the engine only
 * and are never shown.
 */
export function readableNames(tutorial: Tutorial, scene: Scene): Set<string> {
  const texts = [
    ...tutorial.steps.flatMap((s) => [
      s.text,
      ...(s.parts ?? []).map((p) => p.text),
    ]),
    tutorial.ink.text ?? '',
    tutorial.pattern.text ?? '',
  ];
  const out = new Set<string>(['O']);
  for (const t of texts) for (const n of namesIn(t, scene)) out.add(n);
  // The points a step highlights are shown by name in the player too.
  for (const s of tutorial.steps)
    for (const h of [
      ...(s.highlight ?? []),
      ...(s.parts ?? []).flatMap((p) => p.highlight ?? []),
    ])
      if (!/[.@]/.test(h) && scene.elements.get(h)?.geometry.kind === 'point')
        out.add(h);
  return out;
}

const key = (p: Vec) =>
  `${p.x.toFixed(6)},${p.y.toFixed(6)}`.replace(/-(0\.0+)(?=,|$)/g, '$1');

/** The readable name for each place of the tutorial that has one. */
export function readableAt(
  scene: Scene,
  readable: ReadonlySet<string>,
): Map<string, string> {
  const by = new Map<string, string[]>();
  for (const el of scene.elements.values())
    if (el.geometry.kind === 'point' && readable.has(el.name)) {
      const k = key(el.geometry.at);
      by.set(k, [...(by.get(k) ?? []), el.name]);
    }
  return new Map([...by].map(([k, names]) => [k, clearestName(names)]));
}

export const placeKey = key;
