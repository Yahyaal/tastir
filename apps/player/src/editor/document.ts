import {
  evaluate,
  stepsBuiltOn,
  TutorialError,
  type Scene,
} from '@tastir/engine';
import {
  partsOf,
  type ElementSpec,
  type Step,
  type Tutorial,
} from '@tastir/schema';

/**
 * A learner's tutorial while it is being made: a whole tutorial, except
 * that the ink, the tile and the expected pieces come later, once the
 * construction is drawn. It is pure data, so it saves as it is.
 */
export type Draft = Omit<Tutorial, 'ink' | 'pattern' | 'expect'> &
  Partial<Pick<Tutorial, 'ink' | 'pattern' | 'expect'>>;

/** A step as an edit makes it, before it has its number. */
export interface NewStep {
  readonly text: string;
  readonly create: Readonly<Record<string, ElementSpec>>;
}

/** How a step stands after the last edit. */
export type StepStatus =
  | { readonly ok: true }
  | {
      readonly ok: false;
      /** Why, in the engine's words. */
      readonly reason: string;
      /** The broken step it is built on, when that is why it fails. */
      readonly builtOn?: number;
    };

/** The draft evaluated: the drawing of every step that works, and how each
 * step stands. */
export interface Checked {
  readonly scene: Scene;
  readonly status: ReadonlyMap<number, StepStatus>;
}

/** An empty draft: only the given points O and A. */
export function emptyDraft(id: string, title: string): Draft {
  return {
    format: 0,
    id,
    title,
    fold: 8,
    style: 'My own',
    level: 'beginner',
    credits: [],
    given: {
      O: 'The centre of the drawing.',
      A: 'Any point to the right of O. The distance OA is the unit.',
    },
    steps: [],
  };
}

/**
 * A learner's copy of a tutorial, cut after one step: the steps so far
 * and the original's credits, with the original named as its source. The
 * ink, tile and expected pieces are left out, since later steps make them.
 */
export function copyUpTo(
  tutorial: Tutorial,
  step: number,
  shownNumber = step,
): Draft {
  const {
    ink: _ink,
    pattern: _pattern,
    expect: _expect,
    photos: _photos,
    ...rest
  } = tutorial;
  return {
    ...rest,
    id: `${tutorial.id}-mine`,
    title: `${tutorial.title} (my copy)`,
    steps: tutorial.steps.filter((s) => s.id <= step),
    credits: [
      ...tutorial.credits,
      {
        source: `Tastir: ${tutorial.title}`,
        note: `Copied from the library tutorial “${tutorial.title}” (${tutorial.id}) after step ${shownNumber}.`,
      },
    ],
  };
}

/** Steps are numbered 1, 2, 3, … in order; every edit keeps them so. */
const numbered = (steps: readonly Step[]): Step[] =>
  steps.map((s, i) => (s.id === i + 1 ? s : { ...s, id: i + 1 }));

const withSteps = (draft: Draft, steps: readonly Step[]): Draft => ({
  ...draft,
  steps: numbered(steps),
});

/** Adds a step at the end, or before the step at `at` (0-based). */
export function addStep(draft: Draft, step: NewStep, at?: number): Draft {
  const made: Step = { id: 0, text: step.text, create: { ...step.create } };
  const steps = [...draft.steps];
  steps.splice(at ?? steps.length, 0, made);
  return withSteps(draft, steps);
}

/** Changes a step's text, or what it makes. */
export function changeStep(
  draft: Draft,
  id: number,
  change: Partial<NewStep>,
): Draft {
  return withSteps(
    draft,
    draft.steps.map((s) =>
      s.id !== id
        ? s
        : {
            ...s,
            ...(change.text !== undefined ? { text: change.text } : {}),
            ...(change.create !== undefined
              ? { create: { ...change.create }, parts: undefined }
              : {}),
          },
    ),
  );
}

/** Deletes steps; the rest are numbered again. */
export function deleteSteps(draft: Draft, ids: readonly number[]): Draft {
  return withSteps(
    draft,
    draft.steps.filter((s) => !ids.includes(s.id)),
  );
}

/** Moves a step to another place (0-based); the steps are numbered again. */
export function moveStep(draft: Draft, id: number, to: number): Draft {
  const steps = draft.steps.filter((s) => s.id !== id);
  const step = draft.steps.find((s) => s.id === id);
  if (!step) return draft;
  steps.splice(Math.max(0, Math.min(to, steps.length)), 0, step);
  return withSteps(draft, steps);
}

/** The step that makes each name (a crossing `k.1` or copy `x@2` counts as
 * its base name). */
function makers(draft: Draft): Map<string, number> {
  const made = new Map<string, number>();
  for (const step of draft.steps)
    for (const part of partsOf(step))
      for (const name of Object.keys(part.create))
        if (!made.has(name)) made.set(name, step.id);
  return made;
}

const baseName = (ref: string) => ref.replace(/[.@].*$/, '');

/**
 * Evaluates the draft. The engine stops at the first step it cannot do, so
 * that step is set aside with its reason and the rest evaluated again,
 * until every step either works or is marked broken. A step that fails
 * because it uses something a broken step was to make says so.
 */
export function check(draft: Draft): Checked {
  const status = new Map<number, StepStatus>();
  const made = makers(draft);
  const skipped = new Set<number>();
  for (;;) {
    const steps = draft.steps.filter((s) => !skipped.has(s.id));
    try {
      // The engine only reads the steps.
      const scene = evaluate({ ...draft, steps } as Tutorial);
      for (const s of steps) status.set(s.id, { ok: true });
      return { scene, status };
    } catch (e) {
      if (!(e instanceof TutorialError) || typeof e.step !== 'number') throw e;
      const missing = /^"([^"]+)" does not exist$/.exec(e.reason)?.[1];
      const from = missing ? made.get(baseName(missing)) : undefined;
      status.set(
        e.step,
        from !== undefined && skipped.has(from)
          ? {
              ok: false,
              reason: `It uses ${missing}, which step ${from} was to make, and step ${from} is broken.`,
              builtOn: from,
            }
          : { ok: false, reason: `${e.element}: ${e.reason}` },
      );
      skipped.add(e.step);
    }
  }
}

/**
 * The steps that removing (or changing) a step would break: every later
 * step built on it, and every broken step built on one of those.
 */
export function dependents(checked: Checked, id: number): number[] {
  const out = new Set(stepsBuiltOn(checked.scene, id));
  // A step that is broken has no elements in the scene; its dependents
  // are known from their own status.
  let grew = true;
  while (grew) {
    grew = false;
    for (const [step, st] of checked.status) {
      if (
        !st.ok &&
        st.builtOn !== undefined &&
        (st.builtOn === id || out.has(st.builtOn)) &&
        !out.has(step)
      ) {
        out.add(step);
        grew = true;
      }
    }
    for (const step of [...out])
      for (const later of stepsBuiltOn(checked.scene, step))
        if (!out.has(later)) {
          out.add(later);
          grew = true;
        }
  }
  return [...out].sort((a, b) => a - b);
}

/** Deletes a step and every step built on it. */
export function deleteWithDependents(
  draft: Draft,
  checked: Checked,
  id: number,
): Draft {
  return deleteSteps(draft, [id, ...dependents(checked, id)]);
}

/** The prefix each kind of element is named with. */
export const PREFIX = {
  point: 'P',
  line: 'L',
  circle: 'C',
  polygon: 'S',
  repeat: 'R',
} as const;

/** The first name with this prefix that no step has used yet. */
export function freshName(
  draft: Draft,
  prefix: string,
  taken: Iterable<string> = [],
): string {
  const used = new Set([...makers(draft).keys(), 'O', 'A', ...taken]);
  for (let n = 1; ; n++) if (!used.has(`${prefix}${n}`)) return `${prefix}${n}`;
}

const list = (names: readonly string[]) =>
  names.length > 1
    ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`
    : (names[0] ?? '');

/** One element in plain words, as the learner reads it. */
export function sayElement(name: string, el: ElementSpec): string {
  if ('point' in el) {
    const [a, b] = el.point.meet;
    return `Mark ${name} where ${a} and ${b} cross.`;
  }
  if ('points' in el) {
    const [a, b] = el.points.meet;
    return `Mark every crossing of ${a} and ${b}.`;
  }
  if ('line' in el) {
    const l = el.line;
    if ('perpendicularTo' in l)
      return `Draw ${name} through ${l.through}, square to ${l.perpendicularTo}.`;
    if ('parallelTo' in l)
      return `Draw ${name} through ${l.through}, parallel to ${l.parallelTo}.`;
    if ('bisects' in l) {
      const [p, q, r] = l.bisects;
      return `Halve the angle ${p}–${q}–${r} with ${name}, a line through ${q}.`;
    }
    return `Draw the line ${name} through ${l.through[0]} and ${l.through[1]}.`;
  }
  if ('circle' in el) {
    const c = el.circle;
    if ('through' in c)
      return `Put the compass point on ${c.centre} and draw the circle ${name} through ${c.through}.`;
    if ('radiusOf' in c)
      return `Keep the opening of ${c.radiusOf} and draw the circle ${name} around ${c.centre}.`;
    if ('radiusFrom' in c)
      return `Open the compass from ${c.radiusFrom[0]} to ${c.radiusFrom[1]} and draw the circle ${name} around ${c.centre}.`;
    return `Put the compass point on ${c.centre} and open it until the circle ${name} touches ${list(c.tangentTo)}.`;
  }
  if ('polygon' in el)
    return `Join ${list(el.polygon)} into the shape ${name}.`;
  const { of, by } = el.repeat;
  return by.startsWith('mirror:')
    ? `Mirror ${list(of)} in ${by.slice('mirror:'.length)}.`
    : `Turn ${list(of)} round the centre into ${by.slice(3)} copies.`;
}

/** A step's text in plain words, written for the learner to edit. */
export function sayStep(create: NewStep['create']): string {
  const all = Object.entries(create);
  const main = all.filter(([, el]) => !('point' in el));
  if (!main.length) return all.map(([n, el]) => sayElement(n, el)).join(' ');
  // What the step draws comes first; the crossings it names, after.
  const marks = all
    .filter(([, el]) => 'point' in el)
    .map(([n, el]) => {
      const [a, b] = 'point' in el ? el.point.meet : ['', ''];
      return `${n} is where ${a} and ${b} cross.`;
    });
  return [...main.map(([n, el]) => sayElement(n, el)), ...marks].join(' ');
}
