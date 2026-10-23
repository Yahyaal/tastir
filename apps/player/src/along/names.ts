import type { Scene, Vec } from '@tastir/engine';
import type { Tutorial } from '@tastir/schema';
import { clearestName } from '../editor/document';

/** The words of a text that could be names: E, NE, K2, c1. Crossings
 * numbered by the engine (k.3) and copies (x@2) are never named. */
const words = (text: string) => text.match(/[A-Za-z][A-Za-z0-9_]*/g) ?? [];

/** The points a text names, among the scene's points. A line or shape
 * named by its points (line OE, the square JKLN) names each of them, so
 * the board shows O and E too. */
export function namesIn(text: string, scene: Scene): Set<string> {
  const out = new Set<string>();
  const isPoint = (n: string) =>
    scene.elements.get(n)?.geometry.kind === 'point';
  // A family named by its ends, "S1 to S8", names all of it.
  for (const [, letter, a, b] of text.matchAll(/\b([A-Z])(\d+) to \1(\d+)\b/g))
    for (let i = Number(a); i <= Number(b); i++)
      if (isPoint(`${letter}${i}`)) out.add(`${letter}${i}`);
  for (const w of words(text)) {
    if (isPoint(w)) out.add(w);
    else if (/^[A-Z]{2,}$/.test(w) && [...w].every(isPoint))
      for (const letter of w) out.add(letter);
  }
  return out;
}

/** A name a person would write on a drawing: E, NE, K2. Highlighted
 * names like g5_330 or P120 are the engine's, shown only if a text uses
 * them. */
const LABEL = /^[A-Z]{1,2}\d?$/;

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
      if (LABEL.test(h) && scene.elements.get(h)?.geometry.kind === 'point')
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
