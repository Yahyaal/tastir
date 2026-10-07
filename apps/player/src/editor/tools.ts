import {
  distance,
  dot,
  evaluate,
  intersect,
  overlap,
  pickFor,
  project,
  sub,
  type Curve,
  type Scene,
  type Vec,
} from '@tastir/engine';
import type { ElementSpec, Pick } from '@tastir/schema';
import {
  freshName,
  pointPlaces,
  PREFIX,
  sayStep,
  type Draft,
  type Drawn,
  type NewStep,
  type PointPlace,
} from './document';

/**
 * Symmetry mode: off, or how many times every new element is turned
 * round the centre. The format can also turn by 3, 5 and 10.
 */
export const SYMMETRIES = [0, 4, 6, 8, 12, 16] as const;
export type Symmetry = (typeof SYMMETRIES)[number];

/** What a click can take: a point, or an element of some kinds. */
export type Want = 'point' | 'line' | 'circle' | 'curve';

/**
 * What a click took. A point is an existing named point, or a crossing of
 * two elements that the step will name; an element is a line, circle or
 * polygon by name.
 */
export type Target =
  | {
      readonly kind: 'point';
      readonly at: Vec;
      /** Its name, when the point already exists. */
      readonly name?: string;
      /** For a new point: the two elements that cross there, and the rule
       * that picks it among their crossings. */
      readonly meet?: readonly [string, string];
      readonly pick?: Pick;
    }
  | { readonly kind: 'element'; readonly name: string };

export type ToolId =
  | 'point'
  | 'compass'
  | 'same'
  | 'span'
  | 'touch'
  | 'ruler'
  | 'square'
  | 'parallel'
  | 'halve'
  | 'polygon'
  | 'tile';

export interface Tool {
  readonly id: ToolId;
  readonly label: string;
  readonly icon: string;
  /** What each click takes, in turn; the last repeats for a tool with
   * `more` (the circles to touch, the corners of a polygon). */
  readonly wants: readonly Want[];
  /** What to click next, in plain words, for each click. */
  readonly asks: readonly string[];
  /** Whether the last kind of click can repeat, ended with Done. */
  readonly more?: { readonly least: number };
}

export const TOOLS: readonly Tool[] = [
  {
    id: 'point',
    label: 'Point',
    icon: '•',
    wants: ['point'],
    asks: ['Click a crossing to mark it.'],
  },
  {
    id: 'compass',
    label: 'Compass',
    icon: '◯',
    wants: ['point', 'point'],
    asks: ['Click the centre.', 'Click a point the circle passes through.'],
  },
  {
    id: 'same',
    label: 'Same opening',
    icon: '◎',
    wants: ['circle', 'point'],
    asks: ['Click a circle to keep its opening.', 'Click the new centre.'],
  },
  {
    id: 'span',
    label: 'Opening from two points',
    icon: '⟷',
    wants: ['point', 'point', 'point'],
    asks: [
      'Click the first point of the opening.',
      'Click the second point of the opening.',
      'Click the centre.',
    ],
  },
  {
    id: 'touch',
    label: 'Touching',
    icon: '⦾',
    wants: ['point', 'curve'],
    asks: [
      'Click the centre.',
      'Click a line or circle the circle must touch, then Done.',
    ],
    more: { least: 2 },
  },
  {
    id: 'ruler',
    label: 'Ruler',
    icon: '╱',
    wants: ['point', 'point'],
    asks: ['Click a point on the line.', 'Click a second point.'],
  },
  {
    id: 'square',
    label: 'Square to',
    icon: '⊥',
    wants: ['line', 'point'],
    asks: ['Click a line.', 'Click the point the new line goes through.'],
  },
  {
    id: 'parallel',
    label: 'Parallel',
    icon: '∥',
    wants: ['line', 'point'],
    asks: ['Click a line.', 'Click the point the new line goes through.'],
  },
  {
    id: 'halve',
    label: 'Halve angle',
    icon: '∠',
    wants: ['point', 'point', 'point'],
    asks: [
      'Click a point on one arm of the angle.',
      'Click the corner.',
      'Click a point on the other arm.',
    ],
  },
  {
    id: 'polygon',
    label: 'Polygon',
    icon: '⬠',
    wants: ['point'],
    asks: ['Click the corners in turn; click the first again, or Done.'],
    more: { least: 3 },
  },
  {
    id: 'tile',
    label: 'Tile',
    icon: '▢',
    wants: ['point'],
    asks: [
      'The tile is the square (or hexagon) that repeats. For a star or rosette, draw a square around the circle, touching it, and click its corners; then the first again.',
    ],
    more: { least: 4 },
  },
];

export const toolOf = (id: ToolId): Tool =>
  TOOLS.find((t) => t.id === id) as Tool;

/** What the tool's next click takes, given the clicks so far. */
export const wantAt = (tool: Tool, n: number): Want | undefined =>
  n < tool.wants.length
    ? tool.wants[n]
    : tool.more
      ? tool.wants[tool.wants.length - 1]
      : undefined;

/** Whether the clicks so far make the whole element. */
export const complete = (tool: Tool, n: number): boolean =>
  tool.more ? n >= tool.more.least : n >= tool.wants.length;

/** The curves an element can be crossed along. */
function curvesOf(scene: Scene, name: string): Curve[] {
  const g = scene.elements.get(name)?.geometry;
  if (!g) return [];
  if (g.kind === 'line') return [g.line];
  if (g.kind === 'circle') return [g.circle];
  if (g.kind === 'polygon') return [...g.sides];
  return [];
}

function distanceToCurve(p: Vec, c: Curve): number {
  if (c.kind === 'line') return distance(p, project(p, c));
  if (c.kind === 'circle') return Math.abs(distance(p, c.centre) - c.radius);
  const d = sub(c.b, c.a);
  const t = Math.max(0, Math.min(1, dot(sub(p, c.a), d) / dot(d, d)));
  return distance(p, { x: c.a.x + d.x * t, y: c.a.y + d.y * t });
}

const fits = (scene: Scene, name: string, want: Want): boolean => {
  const kind = scene.elements.get(name)?.geometry.kind;
  if (want === 'line') return kind === 'line';
  if (want === 'circle') return kind === 'circle';
  if (want === 'curve') return kind === 'line' || kind === 'circle';
  return false;
};

/**
 * What a click at `at` takes, within `reach` (in the drawing's units).
 * Points snap only to points that exist: a named point, or a crossing (or
 * touching point) of two elements, which gets the simplest pick rule that
 * names it. There is no free point anywhere.
 */
export { clearestName, pointPlaces, type PointPlace } from './document';

/** The elements whose curves pass within `reach` of a point, nearest first. */
function curvesNear(scene: Scene, at: Vec, reach: number) {
  const near: { name: string; d: number }[] = [];
  for (const el of scene.elements.values()) {
    const curves = curvesOf(scene, el.name);
    if (!curves.length) continue;
    const d = Math.min(...curves.map((c) => distanceToCurve(at, c)));
    if (d <= reach) near.push({ name: el.name, d });
  }
  return near.sort((a, b) => a.d - b.d);
}

/** Whether any line, circle or shape passes within `reach` of a point. */
export const elementNear = (scene: Scene, at: Vec, reach: number): boolean =>
  curvesNear(scene, at, reach).length > 0;

/** The crossings of elements within `reach` of a point, nearest first. */
export function crossingsNear(
  scene: Scene,
  at: Vec,
  reach: number,
  limit = 40,
): { d: number; p: Vec; meet: [string, string] }[] {
  const near = curvesNear(scene, at, reach).slice(0, limit);
  const crossings: { d: number; p: Vec; meet: [string, string] }[] = [];
  for (let i = 0; i < near.length; i++) {
    for (let j = i + 1; j < near.length; j++) {
      const a = near[i]?.name as string;
      const b = near[j]?.name as string;
      for (const ca of curvesOf(scene, a))
        for (const cb of curvesOf(scene, b)) {
          if (overlap(ca, cb, scene.tol)) continue;
          for (const p of intersect(ca, cb, scene.tol)) {
            const d = distance(p, at);
            if (d <= reach) crossings.push({ d, p, meet: [a, b] });
          }
        }
    }
  }
  return crossings.sort((x, y) => x.d - y.d);
}

/**
 * What a click at `at` takes, within `reach` (in the drawing's units).
 * Points snap only to points that exist: a named point (by its clearest
 * name, when several share it), or a crossing (or touching point) of two
 * elements, which gets the simplest pick rule that names it. There is no
 * free point anywhere.
 */
export function snap(
  scene: Scene,
  at: Vec,
  reach: number,
  want: Want,
): Target | undefined {
  if (want !== 'point') {
    const hit = curvesNear(scene, at, reach).find((n) =>
      fits(scene, n.name, want),
    );
    return hit && { kind: 'element', name: hit.name };
  }
  // A named point wins over an unnamed crossing in the same place.
  let best: { d: number; place: PointPlace } | undefined;
  for (const place of pointPlaces(scene)) {
    const d = distance(place.at, at);
    if (d <= reach && (!best || d < best.d)) best = { d, place };
  }
  if (best) return { kind: 'point', at: best.place.at, name: best.place.name };
  for (const c of crossingsNear(scene, at, reach)) {
    const choice = pickFor(scene, c.meet, c.p);
    if (choice.found)
      return {
        kind: 'point',
        at: c.p,
        meet: c.meet,
        ...(choice.pick ? { pick: choice.pick } : {}),
      };
  }
  return undefined;
}

/** Whether two targets are the same point or element. */
export function sameTarget(a: Target, b: Target, eps: number): boolean {
  if (a.kind === 'element' || b.kind === 'element')
    return a.kind === b.kind && 'name' in a && 'name' in b && a.name === b.name;
  return distance(a.at, b.at) <= eps;
}

/**
 * The step the tool's clicks make: a name for every new crossing it uses,
 * then the element, in plain words the learner can edit. `touch` chooses
 * the side of a circle to touch, when both are possible.
 */
export function buildStep(
  draft: Draft,
  tool: Tool,
  targets: readonly Target[],
  touch?: 'near' | 'far',
  symmetry: Symmetry = 0,
  drawn?: Drawn,
): NewStep {
  const create: Record<string, ElementSpec> = {};
  const taken: string[] = [];
  const fresh = (prefix: string) => {
    const name = freshName(draft, prefix, taken);
    taken.push(name);
    return name;
  };
  const names = targets.map((t) => {
    if (t.kind === 'element') return t.name;
    if (t.name) return t.name;
    const name = fresh(PREFIX.point);
    create[name] = {
      point: {
        meet: [...(t.meet as [string, string])],
        ...(t.pick ? { pick: t.pick } : {}),
      },
    } as ElementSpec;
    return name;
  });
  const [a = '', b = '', c = ''] = names;
  const spec = ((): [string, ElementSpec] | undefined => {
    switch (tool.id) {
      case 'point':
        return undefined;
      case 'compass':
        return [fresh(PREFIX.circle), { circle: { centre: a, through: b } }];
      case 'same':
        return [fresh(PREFIX.circle), { circle: { centre: b, radiusOf: a } }];
      case 'span':
        return [
          fresh(PREFIX.circle),
          { circle: { centre: c, radiusFrom: [a, b] } },
        ];
      case 'touch':
        return [
          fresh(PREFIX.circle),
          {
            circle: {
              centre: a,
              tangentTo: names.slice(1),
              ...(touch ? { touch } : {}),
            },
          },
        ];
      case 'ruler':
        return [fresh(PREFIX.line), { line: { through: [a, b] } }];
      case 'square':
        return [
          fresh(PREFIX.line),
          { line: { through: b, perpendicularTo: a } },
        ];
      case 'parallel':
        return [fresh(PREFIX.line), { line: { through: b, parallelTo: a } }];
      case 'halve':
        return [
          fresh(PREFIX.line),
          { line: { through: b, bisects: [a, b, c] } },
        ];
      case 'polygon':
        return [fresh(PREFIX.polygon), { polygon: names }];
      case 'tile':
        return [fresh('Tile'), { polygon: names }];
    }
  })();
  if (spec) create[spec[0]] = spec[1];
  // Symmetry mode: what the step draws is also turned round the centre.
  // The tile is never turned; it is the one cell that repeats.
  if (spec && symmetry && tool.id !== 'tile')
    create[fresh(PREFIX.repeat)] = {
      repeat: { of: [spec[0]], by: `rot${symmetry}` },
    } as ElementSpec;
  return { text: sayStep(create, draft, drawn), create };
}

/**
 * A symmetry-mode step without duplicate copies: a turned copy that lands
 * on the original or an earlier copy (a line through O turned by 180°)
 * is left out with `distinct`, and a repeat whose copies all land on the
 * original (a circle about O) is dropped. Checked by evaluating the step
 * where it will go (`at` steps before it).
 */
export function tidySymmetry(
  draft: Draft,
  made: NewStep,
  at: number,
  drawn?: Drawn,
): NewStep {
  const entry = Object.entries(made.create).find(([, el]) => 'repeat' in el);
  if (!entry) return made;
  const [name, el] = entry;
  if (!('repeat' in el)) return made;
  const n = el.repeat.by.startsWith('rot') ? Number(el.repeat.by.slice(3)) : 2;
  const tried = {
    ...made.create,
    [name]: { repeat: { ...el.repeat, distinct: true } },
  } as Record<string, ElementSpec>;
  const steps = [
    ...draft.steps.slice(0, at),
    { id: at + 1, text: made.text, create: tried },
  ];
  let members: number;
  try {
    const g = evaluate({ steps } as never).elements.get(name)?.geometry;
    if (g?.kind !== 'group') return made;
    members = g.members.length;
  } catch {
    return made;
  }
  if (members === n - 1) return made;
  const create = { ...made.create };
  if (members === 0) delete create[name];
  else create[name] = tried[name] as ElementSpec;
  return { text: sayStep(create, draft, drawn), create };
}
