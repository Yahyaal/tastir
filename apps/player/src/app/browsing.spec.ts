import { neighbours, titleOf } from './browsing';
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
