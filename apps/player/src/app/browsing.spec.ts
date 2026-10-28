import {
  facetCounts,
  filtered,
  foldLabel,
  neighbours,
  titleOf,
} from './browsing';
import type { Entry } from './library';

const entry = (id: string, fold: number, style = 'Nasrid'): Entry => ({
  id,
  json: { id, title: `The ${id}`, fold, style, level: 'beginner' },
});

const library = [
  entry('a', 8),
  entry('b', 12),
  entry('c', 8),
  entry('d', 6, 'Mamluk'),
  entry('e', 8),
];

describe('previous and next pattern', () => {
  it('follow the library order', () => {
    const { previous, next } = neighbours(library, 'b', {});
    expect([previous?.id, next?.id]).toEqual(['a', 'c']);
  });

  it('walk only the patterns the filters show', () => {
    const { previous, next } = neighbours(library, 'c', { fold: 8 });
    expect([previous?.id, next?.id]).toEqual(['a', 'e']);
  });

  it('walk the whole library from a pattern the filters hide', () => {
    const { previous, next } = neighbours(library, 'd', { fold: 8 });
    expect([previous?.id, next?.id]).toEqual(['c', 'e']);
  });

  it('stop at the first and the last', () => {
    expect(neighbours(library, 'a', {}).previous).toBeUndefined();
    expect(neighbours(library, 'e', {}).next).toBeUndefined();
    expect(neighbours(library, 'nowhere', {})).toEqual({});
  });

  it('are named by the tutorial title', () => {
    expect(titleOf(library[1] as Entry)).toBe('The b');
  });
});

describe('searching the library', () => {
  const library: Entry[] = [
    { id: 'fes-star', json: { title: 'Star of Fès', style: 'Marinid' } },
    {
      id: 'salon-frames',
      json: { title: 'Framed stars', subtitle: 'Salón de Comares' },
    },
    { id: 'cairo-door', json: { title: 'Minbar doors', style: 'Mamluk' } },
  ];
  const ids = (query: string) => filtered(library, { query }).map((e) => e.id);

  it('finds every word, in any case and without accents', () => {
    expect(ids('fes')).toEqual(['fes-star']);
    expect(ids('SALON comares')).toEqual(['salon-frames']);
    expect(ids('stars comares')).toEqual(['salon-frames']);
    expect(ids('mamluk')).toEqual(['cairo-door']);
  });

  it('shows everything for no words, and nothing for words no pattern has', () => {
    expect(ids('  ')).toHaveLength(3);
    expect(ids('zellige')).toEqual([]);
  });
});

describe('mirror and half-turn filters', () => {
  it('labels mirrors and retains the existing fold labels', () => {
    expect([1, 2, 8].map(foldLabel)).toEqual(['Mirror', '2-fold', '8-fold']);
  });

  it('filters either low fold without losing the other', () => {
    const low = [entry('mirror', 1), entry('half-turn', 2), ...library];
    expect(filtered(low, { fold: 1 }).map((e) => e.id)).toEqual(['mirror']);
    expect(filtered(low, { fold: 2 }).map((e) => e.id)).toEqual(['half-turn']);
  });
});

describe('the side menu', () => {
  const at = (
    id: string,
    region: string,
    fold: number,
    level = 'beginner',
  ): Entry => ({
    id,
    json: { title: id, region, fold, level, style: 'Nasrid' },
  });
  const cards = [
    at('alhambra', 'Alhambra and Nasrid Spain', 8),
    at('fes', 'Morocco', 8),
    at('meknes', 'Morocco', 12, 'advanced'),
    {
      ...at('arrayanes', 'Alhambra and Nasrid Spain', 8),
      variations: [at('leon-tile', 'Morocco', 8)],
    },
  ];

  it('filters by region, and a family shows the member that matches', () => {
    expect(filtered(cards, { region: 'Morocco' }).map((e) => e.id)).toEqual([
      'fes',
      'meknes',
      'leon-tile',
    ]);
    const leon = filtered(cards, { region: 'Morocco' })[2];
    expect(leon?.variations?.map((e) => e.id)).toEqual(['arrayanes']);
  });

  it('counts each value under the other filters', () => {
    const regions = facetCounts(cards, { fold: 8 }, 'region');
    expect(regions.get('Morocco')).toBe(2);
    expect(regions.get('Alhambra and Nasrid Spain')).toBe(2);
    const folds = facetCounts(cards, { region: 'Morocco' }, 'fold');
    expect(folds.get(8)).toBe(2);
    expect(folds.get(12)).toBe(1);
    expect(facetCounts(cards, { level: 'advanced' }, 'fold').get(8)).toBe(
      undefined,
    );
  });
});
