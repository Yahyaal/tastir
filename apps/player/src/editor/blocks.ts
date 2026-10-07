import type { Geometry, Scene, Vec } from '@tastir/engine';
import { partsOf, type ElementSpec, type Pick } from '@tastir/schema';
import { newId, now, store } from '../app/storage';
import {
  addStep,
  check,
  describe,
  freshName,
  PREFIX,
  specsOf,
  type Draft,
} from './document';
import type { Target, Tool, Want } from './tools';

/**
 * A building block: a few ordinary steps with named inputs. Inserting one
 * fills the inputs from the learner's clicks and adds its steps to the
 * pattern, every new element under a fresh name, so the result plays,
 * edits and undoes like steps drawn by hand. Blocks are not part of the
 * tutorial format: a file only ever holds the steps.
 */
export interface Block {
  readonly id: string;
  readonly name: string;
  /** What it makes, in one plain sentence. */
  readonly text: string;
  /** What the learner clicks, in order; the steps use these names. */
  readonly inputs: readonly BlockInput[];
  readonly steps: readonly BlockStep[];
  /** The polygon that becomes the tile, when the block makes one. */
  readonly tile?: string;
  /** Ink paths through the block's named points, for a block that makes
   * a figure (the rosette), so it looks like itself at once. */
  readonly ink?: readonly (readonly string[])[];
}

export interface BlockInput {
  readonly name: string;
  readonly want: Want;
  /** What to click, in plain words. */
  readonly ask: string;
}

export interface BlockStep {
  readonly text: string;
  readonly create: Readonly<Record<string, ElementSpec>>;
}

// Small helpers to write blocks as compass and ruler steps.
const pt = (a: string, b: string, pick?: Pick): ElementSpec =>
  ({ point: { meet: [a, b], ...(pick ? { pick } : {}) } }) as ElementSpec;
const pts = (a: string, b: string): ElementSpec =>
  ({ points: { meet: [a, b], pick: { all: 'byAngle' } } }) as ElementSpec;
const ln = (p: string, q: string): ElementSpec =>
  ({ line: { through: [p, q] } }) as ElementSpec;
const perp = (p: string, l: string): ElementSpec =>
  ({ line: { through: p, perpendicularTo: l } }) as ElementSpec;
const halve = (p: string, q: string, r: string): ElementSpec =>
  ({ line: { through: q, bisects: [p, q, r] } }) as ElementSpec;
const circ = (c: string, t: string): ElementSpec =>
  ({ circle: { centre: c, through: t } }) as ElementSpec;
const same = (c: string, r: string): ElementSpec =>
  ({ circle: { centre: c, radiusOf: r } }) as ElementSpec;
const poly = (...ps: string[]): ElementSpec => ({ polygon: ps }) as ElementSpec;

/** The circle, its centre and a point on it: what dividing works from. */
const ON_A_CIRCLE: readonly BlockInput[] = [
  { name: 'c', want: 'circle', ask: 'Click the circle.' },
  { name: 'P', want: 'point', ask: 'Click its centre.' },
  {
    name: 'Q',
    want: 'point',
    ask: 'Click a point on the circle to start from.',
  },
];

/** Through the centre and the start: the point opposite. */
const OPPOSITE: BlockStep = {
  text: 'Draw a line through the centre and the starting point; it crosses the circle again opposite.',
  create: { a: ln('P', 'Q'), Qx: pt('c', 'a', { farthest: 'Q' }) },
};
/** Square to that line through the centre: two more points. */
const QUARTERS: BlockStep = {
  text: 'Draw the line through the centre square to it: the circle is cut into four.',
  create: { b: perp('P', 'a'), B: pts('c', 'b') },
};
/** Halve the right angles: four more points, named round the circle. */
const EIGHTHS: BlockStep = {
  text: 'Halve each right angle at the centre: the circle is cut into eight.',
  create: {
    d1: halve('Q', 'P', 'B.1'),
    E1: pt('c', 'd1', { nearest: 'Q' }),
    E2: pt('c', 'd1', { farthest: 'Q' }),
    d2: halve('Q', 'P', 'B.2'),
    E3: pt('c', 'd2', { nearest: 'Q' }),
    E4: pt('c', 'd2', { farthest: 'Q' }),
  },
};
/** The eight points in order round the circle. */
const EIGHT = ['Q', 'E1', 'B.1', 'E4', 'Qx', 'E2', 'B.2', 'E3'];
/** The line through the centre each of the eight lies on. */
const SPOKE: Record<string, string> = {
  Q: 'a',
  Qx: 'a',
  'B.1': 'b',
  'B.2': 'b',
  E1: 'd1',
  E2: 'd1',
  E3: 'd2',
  E4: 'd2',
};

/** Circles of the same opening about the start and the opposite point. */
const SIXTHS: BlockStep = {
  text: 'Keep the opening and draw circles about the starting point and the point opposite: the circle is cut into six.',
  create: {
    h1: same('Q', 'c'),
    H: pts('c', 'h1'),
    h2: same('Qx', 'c'),
    K1: pt('c', 'h2', { nearest: 'H.1' }),
    K2: pt('c', 'h2', { farthest: 'H.1' }),
  },
};
const sixteenths: BlockStep = {
  text: 'Halve each eighth of the circle: it is cut into sixteen.',
  create: Object.fromEntries(
    [0, 1, 2, 3].flatMap((k) => {
      const v = EIGHT[k] as string;
      const w = EIGHT[k + 1] as string;
      return [
        [`f${k}`, halve(v, 'P', w)],
        [`F${k}a`, pt('c', `f${k}`, { nearest: v })],
        [`F${k}b`, pt('c', `f${k}`, { farthest: v })],
      ];
    }),
  ),
};

const twelfths: BlockStep = {
  text: 'Draw the line square to the first through the centre, and circles of the same opening about where it crosses: the circle is cut into twelve.',
  create: {
    b: perp('P', 'a'),
    B: pts('c', 'b'),
    g1: same('B.1', 'c'),
    G1: pts('c', 'g1'),
    g2: same('B.2', 'c'),
    G2: pts('c', 'g2'),
  },
};

/** Lee's rosette, eight-fold, on the octagon of the eight points. */
function leeRosette(): BlockStep[] {
  const n = EIGHT.length;
  const v = (k: number) => EIGHT[((k % n) + n) % n] as string;
  const m = (k: number) => `M${((k % n) + n) % n}`;
  const st = (k: number) => `st${((k % n) + n) % n}`;
  const mids: Record<string, ElementSpec> = {};
  const stars: Record<string, ElementSpec> = {};
  const circles: Record<string, ElementSpec> = {};
  const petals: Record<string, ElementSpec> = {};
  for (let k = 0; k < n; k++) {
    // The middle of each side of the octagon: where the line from the
    // centre square to that side meets it.
    mids[`ch${k}`] = ln(v(k), v(k + 1));
    mids[`mp${k}`] = perp('P', `ch${k}`);
    mids[m(k)] = pt(`ch${k}`, `mp${k}`);
  }
  for (let k = 0; k < n; k++) stars[st(k)] = ln(m(k), m(k + 2));
  for (let k = 0; k < n; k++) {
    // About each corner, through the middle of the side: it meets the
    // spoke to that corner nearer the centre.
    const corner = v(k + 1);
    circles[`cc${k}`] = circ(corner, m(k));
    circles[`C${k}`] = pt(`cc${k}`, SPOKE[corner] as string, { nearest: 'P' });
  }
  for (let k = 0; k < n; k++) {
    const corner = v(k + 1);
    // At each corner, halve the angle between the spoke point and each
    // side's middle; the halving line meets the star line from that
    // middle, and the petal line runs from there to the spoke point.
    petals[`u${k}`] = halve(`C${k}`, corner, m(k));
    petals[`G${k}`] = pt(`u${k}`, st(k));
    petals[`pl${k}`] = ln(`G${k}`, `C${k}`);
    petals[`w${k}`] = halve(`C${k}`, corner, m(k + 1));
    petals[`H${k}`] = pt(`w${k}`, st(k - 1));
    petals[`ql${k}`] = ln(`H${k}`, `C${k}`);
  }
  return [
    {
      text: 'Join the eight points into an octagon, and mark the middle of each side, where the line from the centre square to it meets it.',
      create: mids,
    },
    {
      text: 'Join each middle to the middle two sides on: the eight star lines.',
      create: stars,
    },
    {
      text: 'About each corner, draw a circle through the middle of the side next to it; mark where it meets the line from the centre to that corner, on the inside.',
      create: circles,
    },
    {
      text: 'At each corner, halve the angle between that inner point and each side’s middle; where the halving line meets the star line, draw the petal line back to the inner point.',
      create: petals,
    },
  ];
}

/** The blocks every learner starts with. */
export const STARTER_BLOCKS: readonly Block[] = [
  {
    id: 'divide-4',
    name: 'Divide a circle into four',
    text: 'Four points equally spaced round a circle.',
    inputs: ON_A_CIRCLE,
    steps: [OPPOSITE, QUARTERS],
  },
  {
    id: 'divide-6',
    name: 'Divide a circle into six',
    text: 'Six points equally spaced round a circle, with the compass kept open.',
    inputs: ON_A_CIRCLE,
    steps: [OPPOSITE, SIXTHS],
  },
  {
    id: 'divide-8',
    name: 'Divide a circle into eight',
    text: 'Eight points equally spaced round a circle.',
    inputs: ON_A_CIRCLE,
    steps: [OPPOSITE, QUARTERS, EIGHTHS],
  },
  {
    id: 'divide-12',
    name: 'Divide a circle into twelve',
    text: 'Twelve points equally spaced round a circle.',
    inputs: ON_A_CIRCLE,
    steps: [OPPOSITE, SIXTHS, twelfths],
  },
  {
    id: 'divide-16',
    name: 'Divide a circle into sixteen',
    text: 'Sixteen points equally spaced round a circle.',
    inputs: ON_A_CIRCLE,
    steps: [OPPOSITE, QUARTERS, EIGHTHS, sixteenths],
  },
  {
    id: 'two-squares',
    name: 'The static and dynamic squares',
    text: 'The two squares of the eight-pointed star, in a circle.',
    inputs: ON_A_CIRCLE,
    steps: [
      OPPOSITE,
      QUARTERS,
      EIGHTHS,
      {
        text: 'Join every second point into a square, twice: the dynamic square through the starting point, and the static square turned by an eighth.',
        create: {
          dynamic: poly('Q', 'B.1', 'Qx', 'B.2'),
          static: poly('E1', 'E4', 'E2', 'E3'),
        },
      },
    ],
  },
  {
    id: 'ring-8',
    name: 'A ring of eight touching circles',
    text: 'Eight equal circles round a circle, each touching the next.',
    inputs: ON_A_CIRCLE,
    steps: [
      OPPOSITE,
      QUARTERS,
      EIGHTHS,
      {
        text: 'Join the starting point to the next point round, and halve the angle between them at the centre: the halving line meets the join halfway.',
        create: {
          chord: ln('Q', 'E1'),
          half: halve('Q', 'P', 'E1'),
          Mid: pt('chord', 'half'),
        },
      },
      {
        text: 'Draw a circle about the starting point through that halfway point, then one of the same opening about each of the other seven points.',
        create: {
          R0: circ('Q', 'Mid'),
          ...Object.fromEntries(
            EIGHT.slice(1).map((p, k) => [`R${k + 1}`, same(p, 'R0')]),
          ),
        },
      },
    ],
  },
  {
    id: 'square-tile',
    name: 'The square tile round a circle',
    text: 'The square that holds the circle, touching it on four sides: the tile that repeats.',
    inputs: ON_A_CIRCLE,
    tile: 'Tile',
    steps: [
      OPPOSITE,
      QUARTERS,
      {
        text: 'At each of the four points, draw the line square to the line through the centre: four lines touching the circle.',
        create: {
          t1: perp('Q', 'a'),
          t2: perp('Qx', 'a'),
          t3: perp('B.1', 'b'),
          t4: perp('B.2', 'b'),
        },
      },
      {
        text: 'Join where they cross into the square tile, which repeats edge to edge.',
        create: {
          k1: pt('t1', 't3'),
          k2: pt('t3', 't2'),
          k3: pt('t2', 't4'),
          k4: pt('t4', 't1'),
          Tile: poly('k1', 'k2', 'k3', 'k4'),
        },
      },
    ],
  },
  {
    id: 'hexagon-tile',
    name: 'The hexagon tile round a circle',
    text: 'The hexagon that holds the circle, touching it on six sides: the tile that repeats.',
    inputs: ON_A_CIRCLE,
    tile: 'Tile',
    steps: [
      OPPOSITE,
      SIXTHS,
      {
        text: 'Draw the lines from the centre through the six points, and at each point the line square to it: six lines touching the circle.',
        create: {
          sp1: ln('P', 'H.1'),
          sp2: ln('P', 'H.2'),
          tQ: perp('Q', 'a'),
          tQx: perp('Qx', 'a'),
          tH1: perp('H.1', 'sp1'),
          tK2: perp('K2', 'sp1'),
          tH2: perp('H.2', 'sp2'),
          tK1: perp('K1', 'sp2'),
        },
      },
      {
        text: 'Join where they cross into the hexagon tile, which repeats edge to edge.',
        create: (() => {
          const t = ['tQ', 'tH1', 'tK1', 'tQx', 'tK2', 'tH2'];
          const corners = t.map((x, i) => [
            `corner${i}`,
            pt(x, t[(i + 1) % 6] as string),
          ]);
          return {
            ...Object.fromEntries(corners),
            Tile: poly(...corners.map(([n]) => n as string)),
          };
        })(),
      },
    ],
  },
  {
    id: 'lee-rosette-8',
    name: 'A. J. Lee’s rosette (eight-fold)',
    text: 'The petals and star of an eight-fold rosette, drawn round an octagon by Anthony Lee’s method.',
    inputs: ON_A_CIRCLE,
    steps: [OPPOSITE, QUARTERS, EIGHTHS, ...leeRosette()],
    // Each petal: from a side's middle along the star line to the halving
    // line, then back along the petal line to the spoke point.
    ink: Array.from({ length: 8 }, (_, k) => [
      [`M${k}`, `G${k}`, `C${k}`],
      [`M${(k + 1) % 8}`, `H${k}`, `C${k}`],
    ]).flat(),
  },
];

/** The base name of a reference: `k` for `k.1`, `x` for `x@2`. */
const baseOf = (ref: string) => ref.replace(/[.@].*$/, '');

/** A reference under new names, keeping its crossing or copy number. */
const renamed = (ref: string, names: ReadonlyMap<string, string>) => {
  // A whole reference first (a crossing mapped to a point already drawn),
  // then its base name.
  const whole = names.get(ref);
  if (whole !== undefined) return whole;
  const base = baseOf(ref);
  const to = names.get(base);
  return to === undefined ? ref : to + ref.slice(base.length);
};

/** An element with every name it refers to replaced. */
export function renameSpec(
  el: ElementSpec,
  r: (ref: string) => string,
): ElementSpec {
  const pick = (p?: Pick) =>
    p
      ? Object.fromEntries(
          Object.entries(p).map(([k, v]) => [
            k,
            typeof v === 'string' ? r(v) : v,
          ]),
        )
      : undefined;
  if ('point' in el) {
    const p = pick(el.point.pick);
    return {
      point: {
        meet: [r(el.point.meet[0]), r(el.point.meet[1])],
        ...(p ? { pick: p } : {}),
      },
    } as ElementSpec;
  }
  if ('points' in el)
    return {
      points: {
        ...el.points,
        meet: [r(el.points.meet[0]), r(el.points.meet[1])],
      },
    } as ElementSpec;
  if ('line' in el) {
    const l = el.line;
    const through = Array.isArray(l.through)
      ? l.through.map(r)
      : r(l.through as string);
    if ('perpendicularTo' in l)
      return {
        line: { through, perpendicularTo: r(l.perpendicularTo) },
      } as ElementSpec;
    if ('parallelTo' in l)
      return { line: { through, parallelTo: r(l.parallelTo) } } as ElementSpec;
    if ('bisects' in l)
      return { line: { through, bisects: l.bisects.map(r) } } as ElementSpec;
    return { line: { through } } as ElementSpec;
  }
  if ('circle' in el) {
    const c = el.circle;
    const centre = r(c.centre);
    if ('through' in c)
      return { circle: { centre, through: r(c.through) } } as ElementSpec;
    if ('radiusOf' in c)
      return { circle: { centre, radiusOf: r(c.radiusOf) } } as ElementSpec;
    if ('radiusFrom' in c)
      return {
        circle: { centre, radiusFrom: c.radiusFrom.map(r) },
      } as ElementSpec;
    return {
      circle: { ...c, centre, tangentTo: c.tangentTo.map(r) },
    } as ElementSpec;
  }
  if ('polygon' in el) return { polygon: el.polygon.map(r) } as ElementSpec;
  const by = el.repeat.by.startsWith('mirror:')
    ? `mirror:${r(el.repeat.by.slice('mirror:'.length))}`
    : el.repeat.by;
  return {
    repeat: { ...el.repeat, of: el.repeat.of.map(r), by },
  } as ElementSpec;
}

/** The prefix a new element of this kind is named with. */
const prefixOf = (el: ElementSpec, name: string, block: Block) =>
  name === block.tile
    ? 'Tile'
    : 'point' in el || 'points' in el
      ? PREFIX.point
      : 'line' in el
        ? PREFIX.line
        : 'circle' in el
          ? PREFIX.circle
          : 'polygon' in el
            ? PREFIX.polygon
            : PREFIX.repeat;

/**
 * The draft with a block's steps added after `at` steps, its inputs filled
 * by what was clicked (a new crossing is named in the first step) and
 * every element it makes under a fresh name. One edit, so one undo.
 * Returns the new draft and the name its tile polygon got, if any.
 */
export function insertBlock(
  draft: Draft,
  block: Block,
  clicked: readonly Target[],
  at: number,
): { draft: Draft; steps: number; tile?: string } {
  const names = new Map<string, string>();
  const taken: string[] = [];
  const fresh = (prefix: string) => {
    const name = freshName(draft, prefix, taken);
    taken.push(name);
    return name;
  };
  const marks: Record<string, ElementSpec> = {};
  block.inputs.forEach((input, i) => {
    const t = clicked[i];
    if (!t) return;
    if (t.kind === 'element') names.set(input.name, t.name);
    else if (t.name) names.set(input.name, t.name);
    else {
      const name = fresh(PREFIX.point);
      marks[name] = pt(t.meet?.[0] ?? '', t.meet?.[1] ?? '', t.pick);
      names.set(input.name, name);
    }
  });
  for (const step of block.steps)
    for (const [name, el] of Object.entries(step.create))
      if (!names.has(name)) names.set(name, fresh(prefixOf(el, name, block)));
  // Each step is added, then every element it makes that the drawing
  // already has (the line through the centre drawn by an earlier block,
  // say) is dropped and the existing one used instead; a step left with
  // nothing is left out.
  let next = draft;
  let place = at;
  block.steps.forEach((step, i) => {
    const create: Record<string, ElementSpec> = Object.fromEntries([
      ...(i === 0 ? Object.entries(marks) : []),
      ...Object.entries(step.create).map(([name, el]) => [
        names.get(name) as string,
        renameSpec(el, (ref) => renamed(ref, names)),
      ]),
    ]);
    const before = check({ steps: next.steps.slice(0, place) } as Draft).scene;
    const trial = check({
      steps: [
        ...next.steps.slice(0, place),
        { id: place + 1, text: '', create },
      ],
    } as Draft).scene;
    const reuse = new Map<string, string>();
    for (const [name, el] of Object.entries(create)) {
      if (name === names.get(block.tile ?? '')) continue;
      const g = trial.elements.get(name)?.geometry;
      if (!g) continue;
      if (g.kind === 'group') {
        // A crossings element: each crossing that is already a point.
        if (!('points' in el)) continue;
        const found = g.members.map((m) => {
          const at = trial.elements.get(m)?.geometry;
          return at?.kind === 'point' ? existing(before, at) : undefined;
        });
        if (found.every((f) => f !== undefined))
          g.members.forEach((m, k) => reuse.set(m, found[k] as string));
        continue;
      }
      const same = existing(before, g);
      if (same) reuse.set(name, same);
    }
    for (const [from, to] of reuse) {
      // Later steps refer to the existing element by the block's name (a
      // crossing k.1 by its group's block name and its number).
      const base = baseOf(from);
      const suffix = from.slice(base.length);
      for (const [blockName, given] of [...names])
        if (given === base) names.set(blockName + suffix, to);
    }
    const kept = Object.fromEntries(
      Object.entries(create)
        .filter(([name]) => {
          if (reuse.has(name)) return false;
          const g = trial.elements.get(name)?.geometry;
          return !(
            g?.kind === 'group' &&
            g.members.length > 0 &&
            g.members.every((m) => reuse.has(m))
          );
        })
        .map(([name, el]) => [
          name,
          renameSpec(el, (ref) => reuse.get(ref) ?? ref),
        ]),
    );
    if (!Object.keys(kept).length) return;
    next = addStep(next, { text: step.text, create: kept }, place);
    place += 1;
  });
  // A block that brings its own ink inks its figure too.
  if (block.ink?.length) {
    const paths = block.ink.map((through) => ({
      through: through.map((ref) => renamed(ref, names)),
    }));
    next = {
      ...next,
      ink: {
        text: next.ink?.text ?? 'Go over the lines of the pattern.',
        paths: [...(next.ink?.paths ?? []), ...paths],
      },
    };
  }
  return {
    draft: next,
    steps: place - at,
    ...(block.tile ? { tile: names.get(block.tile) as string } : {}),
  };
}

/** The name of an element of the drawing that is the same figure. */
function existing(scene: Scene, g: Geometry): string | undefined {
  const eps = scene.tol.eps;
  const close = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.y - b.y) <= eps;
  for (const el of scene.elements.values()) {
    const h = el.geometry;
    if (g.kind === 'point' && h.kind === 'point' && close(g.at, h.at))
      return el.name;
    if (g.kind === 'circle' && h.kind === 'circle')
      if (
        close(g.circle.centre, h.circle.centre) &&
        Math.abs(g.circle.radius - h.circle.radius) <= eps
      )
        return el.name;
    if (g.kind === 'line' && h.kind === 'line') {
      const d = {
        x: g.line.point.x - h.line.point.x,
        y: g.line.point.y - h.line.point.y,
      };
      const across = Math.abs(d.x * h.line.dir.y - d.y * h.line.dir.x);
      const turn = Math.abs(
        g.line.dir.x * h.line.dir.y - g.line.dir.y * h.line.dir.x,
      );
      if (across <= eps && turn <= eps) return el.name;
    }
    if (
      g.kind === 'polygon' &&
      h.kind === 'polygon' &&
      g.vertices.length === h.vertices.length &&
      g.vertices.every((v) => h.vertices.some((w) => close(v, w)))
    )
      return el.name;
  }
  return undefined;
}

/** The tool a block works as while its inputs are clicked. */
export const blockTool = (block: Block): Tool => ({
  id: 'block',
  label: block.name,
  icon: '▦',
  wants: block.inputs.map((i) => i.want),
  asks: block.inputs.map((i) => i.ask),
});

/** Every name an element refers to (base names: k for k.1). */
export function refsOf(el: ElementSpec): string[] {
  const seen = new Set<string>();
  renameSpec(el, (ref) => {
    seen.add(ref);
    return ref;
  });
  return [...seen];
}

const WANT: Record<string, Want> = {
  point: 'point',
  line: 'line',
  circle: 'circle',
  polygon: 'shape',
};

/**
 * A run of the learner's steps as a block: its inputs are the earlier
 * elements the steps use (not the given O and A, which every pattern
 * has), in the order they are first used, each asked for in plain words.
 */
export function blockFromSteps(
  draft: Draft,
  scene: Scene,
  from: number,
  to: number,
  name: string,
): Block | { reason: string } {
  const steps = draft.steps.filter((s) => s.id >= from && s.id <= to);
  if (!steps.length) return { reason: 'Choose at least one step.' };
  const made = new Set(
    steps.flatMap((s) => partsOf(s).flatMap((p) => Object.keys(p.create))),
  );
  const specs = specsOf(draft);
  const inputs: BlockInput[] = [];
  for (const step of steps)
    for (const part of partsOf(step))
      for (const el of Object.values(part.create))
        for (const ref of refsOf(el)) {
          const base = ref.replace(/[.@].*$/, '');
          if (made.has(base) || ref === 'O' || ref === 'A') continue;
          if (inputs.some((i) => i.name === ref)) continue;
          const kind = scene.elements.get(ref)?.geometry.kind;
          const want = kind ? WANT[kind] : undefined;
          if (!want)
            return {
              reason: `The steps use ${describe(ref, specs, { scene })}, which a block cannot ask for.`,
            };
          inputs.push({
            name: ref,
            want,
            ask: `Click ${describe(ref, specs, { scene })} (the one the steps used).`,
          });
        }
  return {
    id: `mine-${newId()}`,
    name: name.trim() || 'My block',
    text: `${steps.length === 1 ? 'One step' : `${steps.length} steps`} of my own.`,
    inputs,
    steps: steps.map((s) => ({
      text: s.text,
      create: Object.fromEntries(
        partsOf(s).flatMap((p) => Object.entries(p.create)),
      ),
    })),
  };
}

/** A block the learner saved, kept in this browser. */
export type UserBlock = Block & { readonly created: string };

function isBlock(x: unknown): x is UserBlock {
  if (typeof x !== 'object' || x === null) return false;
  const b = x as Record<string, unknown>;
  return (
    typeof b['id'] === 'string' &&
    typeof b['name'] === 'string' &&
    Array.isArray(b['inputs']) &&
    Array.isArray(b['steps']) &&
    typeof b['created'] === 'string'
  );
}

const blocks = store('tastir.blocks', isBlock);

/** The learner's own blocks, newest first; never throws. */
export const listBlocks = (): UserBlock[] =>
  blocks.list().sort((a, b) => b.created.localeCompare(a.created));

/** Keeps a block; false when the browser would not keep it. */
export const addBlock = (block: Block): boolean =>
  blocks.write([{ ...block, created: now() }, ...listBlocks()]);

export const deleteBlock = (id: string): boolean =>
  blocks.write(listBlocks().filter((b) => b.id !== id));
