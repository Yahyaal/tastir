import { neighbourhoodCounts } from './neighbourhoodCounts';

it('distinguishes the same neighbourhood types occurring in different amounts', () => {
  expect(neighbourhoodCounts(['star', 'star', 'cross'], 1)).not.toBe(
    neighbourhoodCounts(['star', 'cross', 'cross'], 1),
  );
});
it('is unchanged when a tile is doubled or quadrupled', () => {
  const tile = ['star', 'star', 'cross'];
  expect(neighbourhoodCounts([...tile, ...tile], 2)).toBe(
    neighbourhoodCounts(tile, 1),
  );
  expect(neighbourhoodCounts([...tile, ...tile, ...tile, ...tile], 4)).toBe(
    neighbourhoodCounts(tile, 1),
  );
});
it('does not depend on piece traversal order', () => {
  expect(neighbourhoodCounts(['cross', 'star', 'star'], 2.5)).toBe(
    neighbourhoodCounts(['star', 'cross', 'star'], 2.5),
  );
});
it('rejects an area that cannot normalize the counts', () => {
  expect(() => neighbourhoodCounts(['star'], 0)).toThrow(/positive/);
});
