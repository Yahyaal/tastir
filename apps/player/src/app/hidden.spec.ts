import hidden from './hidden.json';
import { isHidden, listed, type Entry } from './library';

const entry = (id: string): Entry => ({ id, json: {} });

describe('patterns hidden from the library', () => {
  const all = [entry('six-fold-snowflake'), ...hidden.map(entry)];

  it('are left out on the live site', () => {
    expect(listed(all, false).map((e) => e.id)).toEqual(['six-fold-snowflake']);
  });

  it('are all listed on the dev server, to be judged again', () => {
    expect(listed(all, true)).toHaveLength(all.length);
  });

  it('are the two the owner chose on 24 October', () => {
    expect(isHidden('bou-inania-twelve-fold-wall')).toBe(true);
    expect(isHidden('kurt-eight-fold-zellige')).toBe(true);
    expect(isHidden('kurt-eight-fold-zellige-filled')).toBe(false);
  });
});
