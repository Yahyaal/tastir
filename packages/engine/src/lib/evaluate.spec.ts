import type { Tutorial } from '@tastir/schema';
import { starAndCross } from '../test/tutorials.js';
import { evaluate, pointOf, TutorialError } from './evaluate.js';
import { angleDeg, length } from './vec.js';

/** The example with one step's element replaced, unchecked by the schema. */
function withElement(step: number, name: string, spec: unknown): Tutorial {
  const t = structuredClone(starAndCross());
  (t.steps[step - 1]?.create as Record<string, unknown>)[name] = spec;
  return t;
}

/** The example plus one extra step creating `create`. */
function withStep(create: Record<string, unknown>): Tutorial {
  const t = structuredClone(starAndCross());
  t.steps.push({ id: 7, text: 'Extra.', create } as Tutorial['steps'][number]);
  return t;
}

function errorOf(t: Tutorial): TutorialError {
  try {
    evaluate(t);
  } catch (e) {
    if (e instanceof TutorialError) return e;
    throw e;
  }
  throw new Error('expected a TutorialError');
}

describe('evaluating the star and cross', () => {
  const scene = evaluate(starAndCross());

  it('sets up the frame: O at the origin, OA = 1 at 0°', () => {
    expect(pointOf(scene, 'O')).toEqual({ x: 0, y: 0 });
    expect(pointOf(scene, 'A')).toEqual({ x: 1, y: 0 });
  });

  it('gives eight crossings k.1–k.8 at 0.76537 from O, counter-clockwise from 22.5°', () => {
    const k = scene.elements.get('k');
    expect(k?.geometry).toEqual({
      kind: 'group',
      members: ['k.1', 'k.2', 'k.3', 'k.4', 'k.5', 'k.6', 'k.7', 'k.8'],
    });
    for (let i = 1; i <= 8; i++) {
      const p = pointOf(scene, `k.${i}`);
      expect(length(p)).toBeCloseTo(Math.sqrt(2 - Math.SQRT2), 12);
      expect(length(p).toFixed(5)).toBe('0.76537');
      expect(angleDeg(p)).toBeCloseTo(22.5 + 45 * (i - 1), 10);
    }
  });

  it('picks the four points on the circle by angle', () => {
    expect(pointOf(scene, 'E').x).toBeCloseTo(1, 15);
    expect(pointOf(scene, 'N').y).toBeCloseTo(1, 15);
    expect(pointOf(scene, 'W').x).toBeCloseTo(-1, 15);
    expect(pointOf(scene, 'S').y).toBeCloseTo(-1, 15);
    expect(angleDeg(pointOf(scene, 'SE'))).toBeCloseTo(315, 12);
  });

  it('records the step and the elements each element was built from', () => {
    expect(scene.elements.get('v')).toMatchObject({
      step: 2,
      deps: ['O', 'h'],
    });
    expect(scene.elements.get('d1')).toMatchObject({
      step: 3,
      deps: ['E', 'O', 'N'],
    });
    expect(scene.elements.get('k.3')).toMatchObject({
      step: 5,
      deps: ['dynamic', 'static', 'k'],
    });
    expect(scene.elements.get('cell')).toMatchObject({
      step: 6,
      deps: ['c1', 'c2', 'c3', 'c4'],
    });
  });

  it('makes the tile a square of side 2 around the circle', () => {
    const g = scene.elements.get('cell')?.geometry;
    expect(g?.kind).toBe('polygon');
    if (g?.kind !== 'polygon') return;
    expect(g.vertices.map((p) => [Math.round(p.x), Math.round(p.y)])).toEqual([
      [1, 1],
      [-1, 1],
      [-1, -1],
      [1, -1],
    ]);
  });
});

describe('errors name the step and the element', () => {
  it('reports an ambiguous meet without a pick', () => {
    const e = errorOf(withElement(2, 'E', { point: { meet: ['c', 'h'] } }));
    expect(e.step).toBe(2);
    expect(e.element).toBe('E');
    expect(e.message).toBe(
      'Step 2, element "E": 2 crossings of "c" and "h" match (at 180°, 1 from O; at 0°, 1 from O); add a pick rule to choose one',
    );
  });

  it('reports a pick that cannot choose between two crossings', () => {
    const e = errorOf(
      withElement(2, 'E', { point: { meet: ['c', 'h'], pick: { angle: 90 } } }),
    );
    expect(e.message).toBe(
      'Step 2, element "E": "angle: 90" cannot choose between at 180°, 1 from O; at 0°, 1 from O',
    );
  });

  it('reports a missing reference', () => {
    const e = errorOf(
      withElement(3, 'd1', {
        line: { through: 'O', bisects: ['E', 'O', 'Q'] },
      }),
    );
    expect(e.message).toBe('Step 3, element "d1": "Q" does not exist');
  });

  it('reports elements that never meet', () => {
    const e = errorOf(withStep({ far: { point: { meet: ['tE', 'tW'] } } }));
    expect(e.message).toBe('Step 7, element "far": "tE" and "tW" do not meet');
  });

  it('reports a tangent circle that cannot exist', () => {
    const e = errorOf(
      withStep({ bad: { circle: { centre: 'k.1', tangentTo: ['v', 'd1'] } } }),
    );
    expect(e.message).toBe(
      'Step 7, element "bad": no single radius touches all 2 targets (each is touched at radius 0.70711, 0.29289)',
    );
  });

  it('reports touch when every target is a line', () => {
    const e = errorOf(
      withStep({
        bad: {
          circle: { centre: 'k.2', tangentTo: ['v', 'd1'], touch: 'far' },
        },
      }),
    );
    expect(e.message).toBe(
      'Step 7, element "bad": "touch" chooses a side of a circle, but every target is a line',
    );
  });

  it('touches the near or far side of a circle', () => {
    const scene = evaluate(
      withStep({
        inner: { circle: { centre: 'k.1', tangentTo: ['c'], touch: 'near' } },
        outer: { circle: { centre: 'k.1', tangentTo: ['c'], touch: 'far' } },
      }),
    );
    const radius = (name: string) => {
      const g = scene.elements.get(name)?.geometry;
      return g?.kind === 'circle' ? g.circle.radius : NaN;
    };
    const d = Math.sqrt(2 - Math.SQRT2);
    expect(radius('inner')).toBeCloseTo(1 - d, 12);
    expect(radius('outer')).toBeCloseTo(1 + d, 12);
  });

  it('reports a reference of the wrong kind', () => {
    const e = errorOf(
      withElement(2, 'v', { line: { through: 'O', perpendicularTo: 'c' } }),
    );
    expect(e.message).toBe('Step 2, element "v": "c" is not a line');
  });
});

describe('pick rules and repeats', () => {
  it('combines inside, nearest and farthest', () => {
    const scene = evaluate(
      withStep({
        near: { point: { meet: ['c', 'd1'], pick: { nearest: 'N' } } },
        far: { point: { meet: ['c', 'd1'], pick: { farthest: 'N' } } },
        inner: {
          point: {
            meet: ['static', 'h'],
            pick: { inside: 'dynamic', angle: 0 },
          },
        },
      }),
    );
    expect(angleDeg(pointOf(scene, 'near'))).toBeCloseTo(45, 12);
    expect(angleDeg(pointOf(scene, 'far'))).toBeCloseTo(225, 12);
    expect(pointOf(scene, 'inner').x).toBeCloseTo(Math.SQRT1_2, 12);
  });

  it('reports pick rules that disagree', () => {
    const e = errorOf(
      withStep({
        p: { point: { meet: ['c', 'd1'], pick: { angle: 45, nearest: 'S' } } },
      }),
    );
    expect(e.message).toBe(
      'Step 7, element "p": the pick rules choose different crossings (at 45°, 1 from O; at 225°, 1 from O)',
    );
  });

  it('copies elements by rotation and by mirror', () => {
    const scene = evaluate(
      withStep({
        spokes: { repeat: { of: ['NE'], by: 'rot8' } },
        flip: { repeat: { of: ['k.1'], by: 'mirror:h' } },
      }),
    );
    expect(scene.elements.get('spokes')?.geometry).toMatchObject({
      kind: 'group',
    });
    expect(angleDeg(pointOf(scene, 'NE@1'))).toBeCloseTo(90, 12);
    expect(pointOf(scene, 'NE@7').x).toBeCloseTo(1, 12);
    expect(pointOf(scene, 'NE@7').y).toBeCloseTo(0, 12);
    expect(angleDeg(pointOf(scene, 'k.1@1'))).toBeCloseTo(337.5, 12);
    expect(scene.elements.get('k.1@1')?.deps).toEqual(['k.1', 'h']);
  });
});
