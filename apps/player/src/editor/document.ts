import {
  evaluate,
  stepsBuiltOn,
  TutorialError,
  type Scene,
  type Vec,
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
    // Titles often start with a name (Bou Inania), so its case is kept.
    title: `My ${tutorial.title}`,
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
      const specs = specsOf(draft);
      const missing = /^"([^"]+)" does not exist$/.exec(e.reason)?.[1];
      const from = missing ? made.get(baseName(missing)) : undefined;
      status.set(
        e.step,
        from !== undefined && skipped.has(from)
          ? {
              ok: false,
              reason: `It uses ${describe(missing as string, specs)}, which step ${from} was to make, and step ${from} is broken.`,
              builtOn: from,
            }
          : { ok: false, reason: plainReason(e.reason, specs) },
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

/** What each name was made as, by its step's spec. */
export type Specs = ReadonlyMap<string, ElementSpec>;

export function specsOf(draft: Pick<Draft, 'steps'>): Map<string, ElementSpec> {
  const specs = new Map<string, ElementSpec>();
  for (const step of draft.steps)
    for (const part of partsOf(step))
      for (const [name, el] of Object.entries(part.create)) specs.set(name, el);
  return specs;
}

/**
 * What the words need from the drawing, when it is at hand: each point's
 * displayed name (E where E and the given A share a place) and where the
 * lines run, so a line through O can be called the horizontal line.
 */
export interface Drawn {
  readonly scene: Scene;
}

/**
 * The clearest of several names for one point: O for the centre; else a
 * name a step gave (E rather than the given A, which shares its place),
 * not a crossing number (k.1) or a copy (x@2) when another name exists;
 * the first made of those.
 */
export function clearestName(names: readonly string[]): string {
  if (names.includes('O')) return 'O';
  const own = names.filter((n) => n !== 'A');
  const plain = own.filter((n) => !/[.@]/.test(n));
  return plain[0] ?? own[0] ?? names[0] ?? '';
}

/** A place where one or more named points sit, under its clearest name. */
export interface PointPlace {
  readonly at: Vec;
  /** The name to show and to use: see clearestName. */
  readonly name: string;
  readonly names: readonly string[];
}

const places = new WeakMap<Scene, PointPlace[]>();

/** Every named point, grouped by place (computed once per drawing). */
export function pointPlaces(scene: Scene): readonly PointPlace[] {
  let found = places.get(scene);
  if (found) return found;
  const byKey = new Map<string, { at: Vec; names: string[] }>();
  for (const el of scene.elements.values()) {
    const g = el.geometry;
    if (g.kind !== 'point') continue;
    const k = `${g.at.x.toFixed(6)},${g.at.y.toFixed(6)}`.replace(
      /-(0\.0+)(?=,|$)/g,
      '$1',
    );
    const place = byKey.get(k) ?? { at: g.at, names: [] };
    place.names.push(el.name);
    byKey.set(k, place);
  }
  found = [...byKey.values()].map((p) => ({
    at: p.at,
    names: p.names,
    name: clearestName(p.names),
  }));
  places.set(scene, found);
  return found;
}

const shown = new WeakMap<Scene, Map<string, string>>();

/** The name the drawing shows for a point. */
export function shownName(name: string, drawn?: Drawn): string {
  if (!drawn) return name;
  let map = shown.get(drawn.scene);
  if (!map) {
    map = new Map();
    for (const p of pointPlaces(drawn.scene))
      for (const n of p.names) map.set(n, p.name);
    shown.set(drawn.scene, map);
  }
  return map.get(name) ?? name;
}

const degrees = (n: number) => Number(n.toFixed(1));

/**
 * An element as the learner knows it from the drawing: a point by its
 * shown name, a line or circle by a short plain description ("the
 * vertical line", "the circle about O"), never by an internal name like
 * d1, and never one description inside another.
 */
export function describe(ref: string, specs: Specs, drawn?: Drawn): string {
  const name = (n: string) => shownName(n, drawn);
  const base = ref.replace(/[.@].*$/, '');
  const el = specs.get(base);
  if (!el || 'point' in el || ref.includes('.')) return name(ref);
  const g = drawn?.scene.elements.get(ref)?.geometry;
  if (ref.includes('@')) {
    const of = describe(base, specs, drawn);
    return `a turned copy of ${of.replace(/^the /, 'the ')}`;
  }
  if ('points' in el) return 'those crossings';
  if ('line' in el) {
    if (g?.kind === 'line') {
      const { point: p, dir: d } = g.line;
      const throughO = Math.abs(d.x * p.y - d.y * p.x) < 1e-9;
      const angle = ((Math.atan2(d.y, d.x) * 180) / Math.PI + 180) % 180;
      const flat = Math.min(angle, 180 - angle) < 1e-6;
      const upright = Math.abs(angle - 90) < 1e-6;
      if (throughO && flat) return 'the horizontal line';
      if (throughO && upright) return 'the vertical line';
      if (throughO) return `the line through O at ${degrees(angle)}°`;
      const via =
        'through' in el.line && typeof el.line.through === 'string'
          ? ` through ${name(el.line.through)}`
          : '';
      if (flat) return `the horizontal line${via}`;
      if (upright) return `the vertical line${via}`;
    }
    const l = el.line;
    if ('bisects' in l)
      return `the line halving the angle ${l.bisects.map(name).join('–')}`;
    if (Array.isArray(l.through))
      return `the line through ${name(l.through[0])} and ${name(l.through[1])}`;
    return `the line through ${name(l.through as string)}`;
  }
  if ('circle' in el) {
    const c = el.circle;
    return 'through' in c
      ? `the circle about ${name(c.centre)} through ${name(c.through)}`
      : `the circle about ${name(c.centre)}`;
  }
  if ('polygon' in el)
    return base.startsWith('Tile')
      ? 'the tile'
      : el.polygon.length <= 4
        ? `the shape ${el.polygon.map(name).join('–')}`
        : `the ${el.polygon.length}-sided shape`;
  return 'the turned copies';
}

/** An engine message in plain words: names become descriptions. */
export function plainReason(reason: string, specs: Specs): string {
  const missing = /^"([^"]+)" does not exist$/.exec(reason)?.[1];
  if (missing)
    return `It uses ${describe(missing, specs)}, which no earlier step makes.`;
  if (/no single radius touches/i.test(reason))
    return 'No one circle about that centre touches all of them. Try fewer lines or circles to touch.';
  const text = reason
    // Raw numbers mean nothing to a learner.
    .replace(/\s*\([^)]*\d\.\d{3,}[^)]*\)/g, '')
    .replace(/"([^"]+)"/g, (_, n: string) => describe(n, specs));
  return (
    text[0]?.toUpperCase() + text.slice(1) + (/[.!?]$/.test(text) ? '' : '.')
  );
}

/** One element in plain words, as the learner reads it. */
export function sayElement(
  name: string,
  el: ElementSpec,
  specs: Specs = new Map(),
  drawn?: Drawn,
): string {
  const d = (ref: string) => describe(ref, specs, drawn);
  const n = (ref: string) => shownName(ref, drawn);
  if ('point' in el) {
    const [a, b] = el.point.meet;
    return `Mark ${name} where ${d(a)} and ${d(b)} cross.`;
  }
  if ('points' in el) {
    const [a, b] = el.points.meet;
    return `Mark every crossing of ${d(a)} and ${d(b)}.`;
  }
  if ('line' in el) {
    const l = el.line;
    if ('perpendicularTo' in l)
      return `Draw a line through ${n(l.through)}, square to ${d(l.perpendicularTo)}.`;
    if ('parallelTo' in l)
      return `Draw a line through ${n(l.through)}, parallel to ${d(l.parallelTo)}.`;
    if ('bisects' in l) {
      const [p, q, r] = l.bisects.map(n);
      return `Halve the angle ${p}–${q}–${r} with a line through ${q}.`;
    }
    return `Draw a line through ${n(l.through[0])} and ${n(l.through[1])}.`;
  }
  if ('circle' in el) {
    const c = el.circle;
    if ('through' in c)
      return `Put the compass point on ${n(c.centre)} and draw a circle through ${n(c.through)}.`;
    if ('radiusOf' in c)
      return `Keep the opening of ${d(c.radiusOf)} and draw a circle about ${n(c.centre)}.`;
    if ('radiusFrom' in c)
      return `Open the compass from ${n(c.radiusFrom[0])} to ${n(c.radiusFrom[1])} and draw a circle about ${n(c.centre)}.`;
    const side =
      c.touch === 'near'
        ? ', the smaller circle that just touches it from outside'
        : c.touch === 'far'
          ? ', the larger circle that goes round it'
          : '';
    return `Put the compass point on ${n(c.centre)} and open it until the circle touches ${list(c.tangentTo.map(d))}${side}.`;
  }
  if ('polygon' in el)
    return name.startsWith('Tile')
      ? `Join ${list(el.polygon.map(n))} into the tile, which repeats edge to edge.`
      : `Join ${list(el.polygon.map(n))} into a shape.`;
  const { of, by } = el.repeat;
  const what = of.length === 1 ? 'it' : list(of.map(d));
  if (by.startsWith('mirror:'))
    return `Mirror ${what} in ${d(by.slice('mirror:'.length))}.`;
  return `Turn ${what} round the centre in steps of ${degrees(360 / Number(by.slice(3)))}°.`;
}

/**
 * A step's text in plain words, written for the learner to edit: short
 * sentences, what the step draws first. `draft` tells what earlier names
 * stand for; `drawn`, when at hand, gives the names the drawing shows
 * and where lines run.
 */
export function sayStep(
  create: NewStep['create'],
  draft?: Pick<Draft, 'steps'>,
  drawn?: Drawn,
): string {
  const specs = draft ? specsOf(draft) : new Map<string, ElementSpec>();
  for (const [n, el] of Object.entries(create)) specs.set(n, el);
  const d = (ref: string) => describe(ref, specs, drawn);
  const all = Object.entries(create);
  const main = all.filter(([, el]) => !('point' in el));
  if (!main.length)
    return all.map(([n, el]) => sayElement(n, el, specs, drawn)).join(' ');
  // What the step draws comes first; the crossings it names, after, in
  // one short sentence when there are several.
  const points = all.filter(([, el]) => 'point' in el);
  const marks =
    points.length === 1
      ? points.map(([n, el]) => {
          const [a, b] = 'point' in el ? el.point.meet : ['', ''];
          return `${n} is where ${d(a)} and ${d(b)} cross.`;
        })
      : points.length
        ? [
            `${list(points.map(([n]) => n))} are crossings of lines already drawn.`,
          ]
        : [];
  return [
    ...main.map(([n, el]) => sayElement(n, el, specs, drawn)),
    ...marks,
  ].join(' ');
}
