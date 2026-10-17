import { inkStrokes } from '@tastir/engine';
import type { Tutorial } from '@tastir/schema';
import { check, type Draft } from '../editor/document';

/**
 * The owner's change that the studio refused because an agent saved first:
 * the drawing it was made from and the drawing it made. The page keeps it
 * until the owner adds it on top, keeps it as a copy or discards it.
 */
export interface Kept {
  readonly base: Draft;
  readonly mine: Draft;
}

const key = (project: string) => `tastir-studio-kept-${project}`;

/** The kept change saved in this browser, so a reload does not lose it. */
export function readKept(project: string): Kept | undefined {
  try {
    const raw = localStorage.getItem(key(project));
    return raw ? (JSON.parse(raw) as Kept) : undefined;
  } catch {
    return undefined;
  }
}

export function writeKept(project: string, kept: Kept | undefined) {
  try {
    if (kept) localStorage.setItem(key(project), JSON.stringify(kept));
    else localStorage.removeItem(key(project));
  } catch {
    // A browser that will not store it still shows it until the page closes.
  }
}

const same = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);

/**
 * The owner's change added on top of the newer drawing, when the change
 * only added steps or changed the ink, the usual case. Undefined when it
 * changed anything else (a rename, a deletion, the tile or colors), which
 * cannot be added on top without undoing the agent's work. A reason when
 * it can be added but no longer draws on the newer drawing.
 */
export function onTop(
  kept: Kept,
  latest: Draft,
): { readonly draft: Draft } | { readonly reason: string } | undefined {
  const { base, mine } = kept;
  const rest = (d: Draft) => {
    const { steps: _s, ink: _i, ...others } = d;
    return others;
  };
  if (!same(rest(base), rest(mine))) return undefined;
  if (
    mine.steps.length < base.steps.length ||
    !base.steps.every((s, i) => same(s, mine.steps[i]))
  )
    return undefined;
  const added = mine.steps.slice(base.steps.length);
  const had = base.ink?.paths ?? [];
  const has = mine.ink?.paths ?? [];
  const inked = has.filter((p) => !had.some((q) => same(p, q)));
  const uninked = had.filter((p) => !has.some((q) => same(p, q)));
  if (!added.length && !inked.length && !uninked.length) return undefined;

  const names = new Set(
    latest.steps.flatMap((s) => [
      ...Object.keys(s.create ?? {}),
      ...(s.parts ?? []).flatMap((p) => Object.keys(p.create)),
    ]),
  );
  for (const s of added)
    for (const name of [
      ...Object.keys(s.create ?? {}),
      ...(s.parts ?? []).flatMap((p) => Object.keys(p.create)),
    ])
      if (names.has(name))
        return {
          reason: `Your change makes ${name}, and the newer drawing already has a ${name}, so it cannot be added on top. Keep yours as a copy instead.`,
        };
  let id = Math.max(0, ...latest.steps.map((s) => s.id));
  const steps = [...latest.steps, ...added.map((s) => ({ ...s, id: ++id }))];
  const paths = [
    ...(latest.ink?.paths ?? []).filter(
      (p) => !uninked.some((q) => same(p, q)),
    ),
    ...inked.filter((p) => !(latest.ink?.paths ?? []).some((q) => same(p, q))),
  ];
  const { ink: _ink, ...without } = { ...latest, steps };
  const draft: Draft = paths.length
    ? {
        ...without,
        ink: {
          text:
            latest.ink?.text ??
            mine.ink?.text ??
            'Go over the lines of the pattern.',
          paths,
        },
      }
    : without;

  // Checked by the editor's own code: every added step must draw, and the
  // ink must follow the newer drawing's lines.
  const checked = check(draft);
  const broken = steps
    .slice(latest.steps.length)
    .map((s) => ({ s, st: checked.status.get(s.id) }))
    .find(({ st }) => st && !st.ok);
  if (broken && broken.st && !broken.st.ok)
    return {
      reason: `On the newer drawing your step “${broken.s.text}” does not draw: ${broken.st.reason} Keep yours as a copy instead.`,
    };
  if (inked.length || uninked.length)
    try {
      if (paths.length) inkStrokes(checked.scene, draft as Tutorial);
    } catch {
      return {
        reason:
          'Your ink does not follow the newer drawing’s lines, so it cannot be added on top. Keep yours as a copy instead.',
      };
    }
  return { draft };
}
