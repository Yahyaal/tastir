import type {
  CircleSpec,
  ElementSpec,
  LineSpec,
  Pick,
  Tutorial,
} from '@tastir/schema';
import {
  bisector,
  circleRadiusFrom,
  circleTangentTo,
  circleThrough,
  circleWithRadiusOf,
  GeometryError,
  lineThrough,
  parallelThrough,
  perpendicularThrough,
} from './construct.js';
import { intersect, overlap } from './intersect.js';
import {
  circle,
  line,
  project,
  segment,
  type Circle,
  type Curve,
  type Line,
  type Segment,
} from './shapes.js';
import { mergePoints, tolerance, type Tolerance } from './tolerance.js';
import {
  add,
  angleDeg,
  distance,
  dot,
  length,
  rotate,
  scale,
  sub,
  vec,
  type Vec,
} from './vec.js';

export type Geometry =
  | { readonly kind: 'point'; readonly at: Vec }
  | { readonly kind: 'line'; readonly line: Line }
  | { readonly kind: 'circle'; readonly circle: Circle }
  | {
      readonly kind: 'polygon';
      readonly vertices: readonly Vec[];
      readonly sides: readonly Segment[];
    }
  /** The crossings of a `points` element, or the copies of a `repeat`. */
  | { readonly kind: 'group'; readonly members: readonly string[] };

export interface SceneElement {
  readonly name: string;
  /** The step that made it; 0 for the given points O and A. */
  readonly step: number;
  /** The elements it was built from, so the player can show why it exists. */
  readonly deps: readonly string[];
  readonly geometry: Geometry;
}

export interface Scene {
  /** Every element in the order it was made, by name. */
  readonly elements: ReadonlyMap<string, SceneElement>;
  readonly tol: Tolerance;
}

/** A step that cannot be evaluated, naming the step and the element. */
export class TutorialError extends Error {
  override name = 'TutorialError';

  constructor(
    readonly step: number | 'ink' | 'pattern',
    readonly element: string,
    readonly reason: string,
  ) {
    const where = typeof step === 'number' ? `Step ${step}` : `The ${step}`;
    super(`${where}, element "${element}": ${reason}`);
  }
}

/** The angle between two directions, in degrees, in [0, 180]. */
const angleBetween = (a: number, b: number) =>
  Math.abs(((((a - b) % 360) + 540) % 360) - 180);

const fmt = (n: number) => n.toFixed(5).replace(/\.?0+$/, '');

/** A candidate point as the learner would describe it. */
function describe(p: Vec, tol: Tolerance) {
  return length(p) <= tol.eps
    ? 'at O'
    : `at ${fmt(angleDeg(p))}°, ${fmt(length(p))} from O`;
}

/**
 * Evaluates a tutorial in its own frame: O at the origin, A at (1, 0), so
 * OA is the unit of length and the direction OA is 0°. Throws a
 * `TutorialError` for any missing, ambiguous or impossible reference.
 */
export function evaluate(tutorial: Tutorial): Scene {
  const tol = tolerance(1);
  const elements = new Map<string, SceneElement>();
  const put = (
    name: string,
    step: number,
    deps: string[],
    geometry: Geometry,
  ) => elements.set(name, { name, step, deps, geometry });
  put('O', 0, [], { kind: 'point', at: vec(0, 0) });
  put('A', 0, [], { kind: 'point', at: vec(1, 0) });

  for (const step of tutorial.steps) {
    for (const [name, spec] of Object.entries(step.create)) {
      const fail = (reason: string): never => {
        throw new TutorialError(step.id, name, reason);
      };
      if (elements.has(name)) fail('this name is already used');
      const deps: string[] = [];
      const ctx = new Context(elements, tol, deps, fail);
      try {
        for (const [n, g, d] of ctx.build(name, spec)) {
          put(n, step.id, d ?? deps, g);
        }
      } catch (e) {
        if (e instanceof GeometryError) fail(e.message);
        throw e;
      }
    }
  }
  return { elements, tol };
}

type Built = [name: string, geometry: Geometry, deps?: string[]];

/** Resolves references and builds one element, recording what it used. */
class Context {
  constructor(
    private readonly elements: ReadonlyMap<string, SceneElement>,
    private readonly tol: Tolerance,
    private readonly deps: string[],
    readonly fail: (reason: string) => never,
  ) {}

  get(ref: string): SceneElement {
    const el = this.elements.get(ref);
    if (!el) return this.fail(`"${ref}" does not exist`);
    if (!this.deps.includes(ref)) this.deps.push(ref);
    return el;
  }

  point(ref: string): Vec {
    const g = this.get(ref).geometry;
    return g.kind === 'point' ? g.at : this.fail(`"${ref}" is not a point`);
  }

  line(ref: string): Line {
    const g = this.get(ref).geometry;
    return g.kind === 'line' ? g.line : this.fail(`"${ref}" is not a line`);
  }

  circle(ref: string): Circle {
    const g = this.get(ref).geometry;
    return g.kind === 'circle'
      ? g.circle
      : this.fail(`"${ref}" is not a circle`);
  }

  /** The curves a `meet` crosses: a line, a circle, or a polygon's sides. */
  curves(ref: string): readonly Curve[] {
    const g = this.get(ref).geometry;
    if (g.kind === 'line') return [g.line];
    if (g.kind === 'circle') return [g.circle];
    if (g.kind === 'polygon') return g.sides;
    return this.fail(
      `"${ref}" is ${g.kind === 'point' ? 'a point' : 'a group'}; only lines, circles and polygons can meet`,
    );
  }

  build(name: string, spec: ElementSpec): Built[] {
    if ('point' in spec) {
      const at = this.choose(
        this.meet(spec.point.meet),
        spec.point.pick,
        spec.point.meet,
      );
      return [[name, { kind: 'point', at }]];
    }
    if ('points' in spec) return this.allByAngle(name, spec.points.meet);
    if ('line' in spec)
      return [[name, { kind: 'line', line: this.buildLine(spec.line) }]];
    if ('circle' in spec) {
      return [
        [name, { kind: 'circle', circle: this.buildCircle(spec.circle) }],
      ];
    }
    if ('polygon' in spec) return [[name, this.buildPolygon(spec.polygon)]];
    return this.repeat(name, spec.repeat.of, spec.repeat.by);
  }

  private buildLine(spec: LineSpec): Line {
    if ('perpendicularTo' in spec) {
      const through = this.point(spec.through);
      return perpendicularThrough(through, this.line(spec.perpendicularTo));
    }
    if ('parallelTo' in spec) {
      const through = this.point(spec.through);
      return parallelThrough(through, this.line(spec.parallelTo));
    }
    if ('bisects' in spec) {
      const [p, q, r] = spec.bisects;
      if (q !== spec.through) {
        this.fail(
          `a bisector goes through the vertex of its angle, "${q}", not "${spec.through}"`,
        );
      }
      return bisector(this.point(p), this.point(q), this.point(r), this.tol);
    }
    const [p, q] = spec.through;
    return lineThrough(this.point(p), this.point(q), this.tol);
  }

  private buildCircle(spec: CircleSpec): Circle {
    const centre = this.point(spec.centre);
    if ('through' in spec) {
      return circleThrough(centre, this.point(spec.through), this.tol);
    }
    if ('radiusOf' in spec) {
      return circleWithRadiusOf(centre, this.circle(spec.radiusOf));
    }
    if ('radiusFrom' in spec) {
      const [q, r] = spec.radiusFrom;
      return circleRadiusFrom(centre, this.point(q), this.point(r), this.tol);
    }
    const targets = spec.tangentTo.map((ref) => {
      const g = this.get(ref).geometry;
      if (g.kind === 'line') return g.line;
      if (g.kind === 'circle') return g.circle;
      return this.fail(
        `"${ref}" is not a line or a circle, so nothing can touch it`,
      );
    });
    return circleTangentTo(centre, targets, this.tol);
  }

  private buildPolygon(refs: readonly string[]): Geometry {
    const vertices = refs.map((r) => this.point(r));
    const sides = vertices.map((a, i) => {
      const b = vertices[(i + 1) % vertices.length] as Vec;
      if (distance(a, b) <= this.tol.eps) {
        this.fail(
          `corners "${refs[i]}" and "${refs[(i + 1) % refs.length]}" are the same point`,
        );
      }
      return segment(a, b);
    });
    return { kind: 'polygon', vertices, sides };
  }

  /** Every crossing of two elements, each once. */
  private meet([a, b]: readonly [string, string]): Vec[] {
    const ca = this.curves(a);
    const cb = this.curves(b);
    const points: Vec[] = [];
    for (const x of ca) {
      for (const y of cb) {
        if (overlap(x, y, this.tol)) {
          this.fail(
            `"${a}" and "${b}" lie along each other, so they do not cross at separate points`,
          );
        }
        points.push(...intersect(x, y, this.tol));
      }
    }
    return mergePoints(points, this.tol);
  }

  /** The one candidate the pick rules choose; anything else is an error. */
  private choose(
    candidates: Vec[],
    pick: Pick | undefined,
    [a, b]: readonly [string, string],
  ): Vec {
    const list = (ps: Vec[]) => ps.map((p) => describe(p, this.tol)).join('; ');
    if (candidates.length === 0) this.fail(`"${a}" and "${b}" do not meet`);
    let pool = candidates;
    if (pick?.inside)
      pool = pool.filter(
        (p) => this.side(p, pick.inside as string) === 'inside',
      );
    if (pick?.outside)
      pool = pool.filter(
        (p) => this.side(p, pick.outside as string) === 'outside',
      );
    if (pool.length === 0) {
      this.fail(
        `no crossing of "${a}" and "${b}" matches the pick (crossings ${list(candidates)})`,
      );
    }

    const winners: Vec[] = [];
    const best = (score: (p: Vec) => number, rule: string, unit: number) => {
      const scored = pool
        .map((p) => ({ p, s: score(p) }))
        .sort((x, y) => x.s - y.s);
      const [first, second] = scored;
      if (
        second &&
        second.s - (first as { s: number }).s <= this.tol.eps * unit
      ) {
        this.fail(
          `${rule} cannot choose between ${list([(first as { p: Vec }).p, second.p])}`,
        );
      }
      winners.push((first as { p: Vec }).p);
    };
    if (pick?.angle !== undefined) {
      const target = pick.angle;
      for (const p of pool) {
        if (length(p) <= this.tol.eps) {
          this.fail(
            `a crossing is at O, which has no angle, so "angle: ${target}" cannot choose`,
          );
        }
      }
      // Compare angles in degrees, with the tolerance scaled to match.
      best(
        (p) => angleBetween(angleDeg(p), target),
        `"angle: ${target}"`,
        180 / Math.PI,
      );
    }
    if (pick?.nearest) {
      const q = this.point(pick.nearest);
      best((p) => distance(p, q), `"nearest: ${pick.nearest}"`, 1);
    }
    if (pick?.farthest) {
      const q = this.point(pick.farthest);
      best((p) => -distance(p, q), `"farthest: ${pick.farthest}"`, 1);
    }

    if (winners.length === 0) {
      if (pool.length > 1) {
        this.fail(
          `${pool.length} crossings of "${a}" and "${b}" match (${list(pool)}); add a pick rule to choose one`,
        );
      }
      return pool[0] as Vec;
    }
    const chosen = winners[0] as Vec;
    if (winners.some((w) => distance(w, chosen) > this.tol.eps)) {
      this.fail(`the pick rules choose different crossings (${list(winners)})`);
    }
    return chosen;
  }

  /** Whether p is inside or outside a circle or polygon, or on its edge. */
  private side(p: Vec, ref: string): 'inside' | 'outside' | 'edge' {
    const g = this.get(ref).geometry;
    if (g.kind === 'circle') {
      const d = distance(p, g.circle.centre) - g.circle.radius;
      return d < -this.tol.eps
        ? 'inside'
        : d > this.tol.eps
          ? 'outside'
          : 'edge';
    }
    if (g.kind === 'polygon') {
      if (g.sides.some((s) => distanceToSegment(p, s) <= this.tol.eps))
        return 'edge';
      return pointInPolygon(p, g.vertices) ? 'inside' : 'outside';
    }
    return this.fail(
      `"${ref}" is not a circle or a polygon, so it has no inside`,
    );
  }

  /** Every crossing, named name.1, name.2, … counter-clockwise from 0°. */
  private allByAngle(name: string, meet: readonly [string, string]): Built[] {
    const pts = this.meet(meet);
    if (pts.length === 0)
      this.fail(`"${meet[0]}" and "${meet[1]}" do not meet`);
    const withAngle = pts.map((p) => {
      if (length(p) <= this.tol.eps) {
        this.fail('a crossing is at O, which has no angle to order it by');
      }
      const a = angleDeg(p);
      return { p, a: 360 - a <= 1e-9 ? 0 : a };
    });
    withAngle.sort((x, y) => x.a - y.a);
    withAngle.forEach((x, i) => {
      const next = withAngle[i + 1];
      if (next && (next.a - x.a) * (Math.PI / 180) <= this.tol.eps) {
        this.fail(
          `two crossings lie at the same angle (${fmt(x.a)}°), so they cannot be ordered`,
        );
      }
    });
    const deps = [...this.deps];
    const members = withAngle.map((_, i) => `${name}.${i + 1}`);
    return [
      [name, { kind: 'group', members }],
      ...withAngle.map((x, i): Built => [
        members[i] as string,
        { kind: 'point', at: x.p },
        [...deps, name],
      ]),
    ];
  }

  /** Copies under a rotation about O or a mirror, named orig@1, orig@2, … */
  private repeat(name: string, of: readonly string[], by: string): Built[] {
    let transforms: ((p: Vec) => Vec)[];
    let mirror: string | undefined;
    if (by.startsWith('mirror:')) {
      mirror = by.slice('mirror:'.length);
      const m = this.line(mirror);
      transforms = [(p) => sub(scale(project(p, m), 2), p)];
    } else {
      const n = Number(by.slice('rot'.length));
      transforms = Array.from({ length: n - 1 }, (_, i) => {
        const turn = (2 * Math.PI * (i + 1)) / n;
        return (p: Vec) => rotate(p, turn);
      });
    }
    const out: Built[] = [];
    const members: string[] = [];
    for (const orig of of) {
      const g = this.get(orig).geometry;
      transforms.forEach((t, i) => {
        const copy = `${orig}@${i + 1}`;
        members.push(copy);
        out.push([
          copy,
          transformGeometry(g, t, () =>
            this.fail(`"${orig}" is a group; repeat its members instead`),
          ),
          mirror ? [orig, mirror] : [orig],
        ]);
      });
    }
    return [[name, { kind: 'group', members }], ...out];
  }
}

/** Geometry moved by a rotation or reflection (an isometry). */
function transformGeometry(
  g: Geometry,
  t: (p: Vec) => Vec,
  onGroup: () => never,
): Geometry {
  switch (g.kind) {
    case 'point':
      return { kind: 'point', at: t(g.at) };
    case 'line': {
      const p = t(g.line.point);
      return {
        kind: 'line',
        line: line(p, sub(t(add(g.line.point, g.line.dir)), p)),
      };
    }
    case 'circle':
      return {
        kind: 'circle',
        circle: circle(t(g.circle.centre), g.circle.radius),
      };
    case 'polygon': {
      const vertices = g.vertices.map(t);
      return {
        kind: 'polygon',
        vertices,
        sides: vertices.map((a, i) =>
          segment(a, vertices[(i + 1) % vertices.length] as Vec),
        ),
      };
    }
    case 'group':
      return onGroup();
  }
}

export function distanceToSegment(p: Vec, s: Segment): number {
  const d = sub(s.b, s.a);
  const t = Math.max(0, Math.min(1, dot(sub(p, s.a), d) / dot(d, d)));
  return distance(p, add(s.a, scale(d, t)));
}

/** Even–odd test; points on the edge may go either way. */
export function pointInPolygon(p: Vec, vertices: readonly Vec[]): boolean {
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const a = vertices[i] as Vec;
    const b = vertices[j] as Vec;
    if (
      a.y > p.y !== b.y > p.y &&
      p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x
    ) {
      inside = !inside;
    }
  }
  return inside;
}

/** The point an element names; throws if it is not a point. */
export function pointOf(scene: Scene, name: string): Vec {
  const g = scene.elements.get(name)?.geometry;
  if (g?.kind !== 'point')
    throw new Error(`"${name}" is not a point in this scene`);
  return g.at;
}
