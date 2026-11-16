import { parseTutorial } from '@tastir/schema';
import example from '@tutorials/eight-fold-star-and-cross.json';
import {
  addDesign,
  duplicateDesign,
  getDesign,
  listDesigns,
  NAME_LIMIT,
  updateDesign,
} from './designs';
import {
  addPattern,
  duplicatePattern,
  getPattern,
  listPatterns,
  savePattern,
  setPatternWall,
} from '../editor/patterns';
import { emptyDraft } from '../editor/document';
import { DEFAULT_JALI } from './jali';
import { DEFAULT_PEN } from './pen';

const tutorial = parseTutorial(example);

beforeEach(() => window.localStorage.clear());
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

it('duplicates the complete appearance under a fresh identity and preserves the original', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-16T01:00:00Z'));
  const original = addDesign({
    name: 'Blue wall',
    tutorial: tutorial.id,
    coloring: { palette: 'Chefchaouen', chosen: { star: 'a' } },
    inked: ['edge-a'],
    look: 'jali',
    grout: 1.5,
    jali: DEFAULT_JALI,
    pen: DEFAULT_PEN,
  })!;
  vi.setSystemTime(new Date('2026-11-16T02:00:00Z'));
  const copy = duplicateDesign(original.id)!;
  expect(copy).toEqual({
    ...original,
    id: expect.any(String),
    name: 'Blue wall copy',
    created: '2026-11-16T02:00:00.000Z',
    updated: '2026-11-16T02:00:00.000Z',
  });
  expect(copy.id).not.toBe(original.id);
  expect(getDesign(original.id)).toEqual(original);
  updateDesign(copy.id, {
    name: 'Changed copy',
    coloring: { palette: 'Alhambra', chosen: {} },
  });
  expect(getDesign(original.id)).toEqual(original);
  expect(listDesigns()).toHaveLength(2);
});

it('gives repeated design copies distinct bounded names', () => {
  const original = addDesign({
    name: 'x'.repeat(NAME_LIMIT),
    tutorial: tutorial.id,
    coloring: { palette: 'Chefchaouen', chosen: {} },
    look: 'tiles',
    grout: 1,
  })!;
  const first = duplicateDesign(original.id)!,
    second = duplicateDesign(original.id)!;
  expect(first.name).toMatch(/ copy$/);
  expect(second.name).toMatch(/ copy 2$/);
  expect(first.name.length).toBeLessThanOrEqual(NAME_LIMIT);
  expect(second.name.length).toBeLessThanOrEqual(NAME_LIMIT);
  expect(first.name).not.toBe(second.name);
});

it('copies the whole construction, credits, provenance and laid wall without copying its identity', () => {
  const original = addPattern(tutorial, {
    tutorial: tutorial.id,
    title: tutorial.title,
    step: 6,
  })!;
  setPatternWall(original.id, { copies: [{ x: 2, y: 0 }] });
  const before = getPattern(original.id)!;
  const copy = duplicatePattern(original.id)!;
  expect(copy.id).not.toBe(original.id);
  expect(copy.tutorial).toEqual({
    ...before.tutorial,
    title: `${tutorial.title} copy`,
  });
  expect(copy.basedOn).toEqual(before.basedOn);
  expect(copy.wall).toEqual(before.wall);
  savePattern(copy.id, { ...copy.tutorial, title: 'Changed copy' });
  expect(getPattern(original.id)).toEqual(before);
  expect(listPatterns()).toHaveLength(2);
});

it('also duplicates unfinished constructions', () => {
  const original = addPattern(emptyDraft('draft', 'Unfinished'))!;
  expect(duplicatePattern(original.id)?.tutorial.steps).toEqual([]);
});

it.each(['design', 'pattern'] as const)(
  'a refused %s copy leaves the original stored data intact',
  (kind) => {
    const original =
      kind === 'design'
        ? addDesign({
            name: 'Original',
            tutorial: tutorial.id,
            coloring: { palette: 'Chefchaouen', chosen: {} },
            look: 'tiles',
            grout: 1,
          })!
        : addPattern(tutorial)!;
    const key = kind === 'design' ? 'tastir.designs' : 'tastir.patterns';
    const before = window.localStorage.getItem(key);
    const write = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('Quota exceeded');
      });
    expect(
      kind === 'design'
        ? duplicateDesign(original.id)
        : duplicatePattern(original.id),
    ).toBeUndefined();
    write.mockRestore();
    expect(window.localStorage.getItem(key)).toBe(before);
  },
);

it('does not save a copy of a missing item', () => {
  expect(duplicateDesign('missing')).toBeUndefined();
  expect(duplicatePattern('missing')).toBeUndefined();
  expect(listDesigns()).toEqual([]);
  expect(listPatterns()).toEqual([]);
});

it('keeps Unicode characters intact when making room for the copy suffix', () => {
  const original = addDesign({
    name: '🌟'.repeat(30),
    tutorial: tutorial.id,
    coloring: { palette: 'Chefchaouen', chosen: {} },
    look: 'tiles',
    grout: 1,
  })!;
  expect(duplicateDesign(original.id)?.name).toBe('🌟'.repeat(27) + ' copy');
});
