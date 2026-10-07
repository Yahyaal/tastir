import example from '@tutorials/eight-fold-star-and-cross.json';
import { cellOf } from '@tastir/engine';
import { parseTutorial } from '@tastir/schema';
import { insertBlock, STARTER_BLOCKS } from './blocks';
import { check, copyUpTo, type Draft } from './document';

const circleOnly = copyUpTo(parseTutorial(example), 1);
const onCircle = [
  { kind: 'element', name: 'c' },
  { kind: 'point', at: { x: 0, y: 0 }, name: 'O' },
  { kind: 'point', at: { x: 1, y: 0 }, name: 'A' },
] as const;

const pointsOn = (d: Draft) => {
  const { scene } = check(d);
  const seen = new Set<string>();
  for (const el of scene.elements.values())
    if (el.geometry.kind === 'point') {
      const { x, y } = el.geometry.at;
      if (Math.abs(Math.hypot(x, y) - 1) < 1e-9)
        seen.add(
          `${x.toFixed(6)},${y.toFixed(6)}`.replace(/-0\.000000/g, '0.000000'),
        );
    }
  return seen.size;
};

describe('the starter blocks', () => {
  it.each(STARTER_BLOCKS.map((b) => [b.id, b] as const))(
    '%s inserts on a drawn circle and every step works',
    (_, block) => {
      const { draft } = insertBlock(circleOnly, block, onCircle, 1);
      expect(draft.steps).toHaveLength(1 + block.steps.length);
      const { status } = check(draft);
      for (const [id, s] of status) expect([id, s.ok]).toEqual([id, true]);
    },
  );

  it.each([
    ['divide-4', 4],
    ['divide-6', 6],
    ['divide-8', 8],
    ['divide-12', 12],
    ['divide-16', 16],
  ] as const)('%s cuts the circle into %i', (id, n) => {
    const block = STARTER_BLOCKS.find((b) => b.id === id);
    if (!block) throw new Error(id);
    expect(pointsOn(insertBlock(circleOnly, block, onCircle, 1).draft)).toBe(n);
  });

  it('makes square and hexagon tiles that repeat', () => {
    for (const id of ['square-tile', 'hexagon-tile']) {
      const block = STARTER_BLOCKS.find((b) => b.id === id);
      if (!block) throw new Error(id);
      const { draft, tile } = insertBlock(circleOnly, block, onCircle, 1);
      const cell = cellOf(check(draft).scene, tile ?? '');
      expect(cell.corners).toHaveLength(id === 'square-tile' ? 4 : 6);
    }
  });

  it.each(STARTER_BLOCKS.map((b) => [b.id, b] as const))(
    '%s names each element once',
    (_, block) => {
      const names = block.steps.flatMap((s) => Object.keys(s.create));
      expect(new Set(names).size).toBe(names.length);
      for (const input of block.inputs) expect(names).not.toContain(input.name);
    },
  );

  it('gives every element a fresh name, keeping the drawing’s own', () => {
    const block = STARTER_BLOCKS.find((b) => b.id === 'divide-8');
    if (!block) throw new Error();
    const once = insertBlock(circleOnly, block, onCircle, 1).draft;
    const twice = insertBlock(once, block, onCircle, once.steps.length).draft;
    const names = twice.steps.flatMap((s) => Object.keys(s.create ?? {}));
    expect(new Set(names).size).toBe(names.length);
    expect(check(twice).status.size).toBe(7);
  });
});
