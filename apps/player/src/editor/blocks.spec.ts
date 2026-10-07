import example from '@tutorials/eight-fold-star-and-cross.json';
import { cellOf } from '@tastir/engine';
import { parseTutorial } from '@tastir/schema';
import { insertBlock, STARTER_BLOCKS } from './blocks';
import { check, copyUpTo, pointPlaces, type Draft } from './document';
import { inkableOf, runOf, withTile } from './finish';

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

  it('reuses what the drawing already has, and adds only what is new', () => {
    const find = (id: string) => {
      const b = STARTER_BLOCKS.find((x) => x.id === id);
      if (!b) throw new Error(id);
      return b;
    };
    const eighths = insertBlock(circleOnly, find('divide-8'), onCircle, 1);
    expect(eighths.steps).toBe(3);
    // The square tile needs the line through the centre and the one square
    // to it, both drawn already: only its tangents and corners are added.
    const tile = insertBlock(eighths.draft, find('square-tile'), onCircle, 4);
    expect(tile.steps).toBe(2);
    expect(check(tile.draft).status.size).toBe(6);
    expect([...check(tile.draft).status.values()].every((s) => s.ok)).toBe(
      true,
    );
    // The same block again adds nothing.
    expect(insertBlock(tile.draft, find('divide-8'), onCircle, 6).steps).toBe(
      0,
    );
    const names = tile.draft.steps.flatMap((s) => Object.keys(s.create ?? {}));
    expect(new Set(names).size).toBe(names.length);
  });

  it('brings the rosette’s own ink', () => {
    const lee = STARTER_BLOCKS.find((b) => b.id === 'lee-rosette-8');
    if (!lee) throw new Error();
    const { draft } = insertBlock(circleOnly, lee, onCircle, 1);
    expect(draft.ink?.paths).toHaveLength(16);
  });
});

describe('inking whole runs', () => {
  it('inks a petal line of the rosette in one click, from point to point', () => {
    const lee = STARTER_BLOCKS.find((b) => b.id === 'lee-rosette-8');
    const tile = STARTER_BLOCKS.find((b) => b.id === 'square-tile');
    if (!lee || !tile) throw new Error();
    const one = insertBlock(circleOnly, lee, onCircle, 1);
    const two = insertBlock(one.draft, tile, onCircle, one.draft.steps.length);
    const draft = withTile(two.draft, two.tile ?? '');
    const { scene } = check(draft);
    const inkable = inkableOf(draft, scene);
    if (!inkable) throw new Error('no tile');
    const named = pointPlaces(scene).map((p) => p.at);
    const runs = inkable.pieces.map((p) => runOf(inkable, p.id, named, scene));
    // Some lines are cut into several bits; a click takes them all.
    expect(Math.max(...runs.map((r) => r.length))).toBeGreaterThan(1);
  });
});
