import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { filtered, neighbours } from './browsing';
import {
  FAMILIES,
  grouped,
  isHidden,
  variationsOf,
  type Entry,
} from './library';
import { startAddress } from './Variations';

// Tests run from apps/player or from the repo root.
const TUTORIALS = join(
  process.cwd().replace(/\/apps\/player$/, ''),
  'tutorials',
);
const ids = readdirSync(TUTORIALS)
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.replace(/\.json$/, ''));

const entry = (id: string, title = id): Entry => ({ id, json: { title } });

describe('variations.json', () => {
  it('names only tutorials in the library', () => {
    for (const f of FAMILIES)
      for (const id of f.members) expect(ids, `${f.id}: ${id}`).toContain(id);
  });

  it('puts no tutorial in two families, and no family id twice', () => {
    const members = FAMILIES.flatMap((f) => f.members);
    expect(new Set(members).size).toBe(members.length);
    expect(new Set(FAMILIES.map((f) => f.id)).size).toBe(FAMILIES.length);
  });

  it('gives every family a title and at least two members', () => {
    for (const f of FAMILIES) {
      expect(f.title.trim(), f.id).not.toBe('');
      expect(f.members.length, f.id).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('the library’s families', () => {
  const all = ids.map((id) => entry(id));

  it('shows one card for each family, in its main tutorial’s place', () => {
    const cards = grouped(all);
    const inFamilies = FAMILIES.flatMap((f) => f.members).length;
    expect(cards).toHaveLength(all.length - inFamilies + FAMILIES.length);
    const arrows = cards.find((e) => e.id === 'alhambra-star-and-arrows');
    expect(arrows?.variations?.map((e) => e.id)).toEqual([
      'alhambra-star-and-arrows-shifted',
    ]);
    expect(cards.some((e) => e.id === 'alhambra-star-and-arrows-shifted')).toBe(
      false,
    );
    // Alphabetically the hexagonal tile comes first; the card is the main one.
    expect(cards.some((e) => e.id === 'mian-stellated-rosettes')).toBe(true);
    expect(cards.some((e) => e.id === 'mian-stellated-hex')).toBe(false);
  });

  it('shows a hidden main tutorial’s family by its first member not hidden', () => {
    expect(isHidden('kurt-eight-fold-zellige')).toBe(true);
    const card = grouped(all).find((e) =>
      e.id.startsWith('kurt-eight-fold-zellige'),
    );
    expect(card?.id).toBe('kurt-eight-fold-zellige-shifted');
    expect(card?.variations?.map((e) => e.id)).toEqual([
      'kurt-eight-fold-zellige',
      'kurt-eight-fold-zellige-filled',
    ]);
  });

  it('keeps a family of one listed member as a plain card', () => {
    const [only] = grouped([entry('alhambra-star-and-arrows-shifted')]);
    expect(only?.id).toBe('alhambra-star-and-arrows-shifted');
    expect(only?.variations).toBeUndefined();
  });

  it('finds a family by any member’s title, showing that member', () => {
    const cards = grouped([
      entry('six-fold-snowflake', 'Six-fold snowflake'),
      entry('twelve-fold-rosette-mian', 'Twelve-fold rosette'),
      entry('twelve-fold-rosette-mian-hex', 'Rosette, hexagonal tile'),
    ]);
    const found = filtered(cards, { query: 'hexagonal' });
    expect(found.map((e) => e.id)).toEqual(['twelve-fold-rosette-mian-hex']);
    // Still one family card, with the main tutorial among its variations.
    expect(found[0]?.variations?.map((e) => e.id)).toEqual([
      'twelve-fold-rosette-mian',
    ]);
  });

  it('walks a family as one place, from whichever variation is open', () => {
    const cards = grouped([
      entry('alhambra-star-and-arrows'),
      entry('alhambra-star-and-arrows-shifted'),
      entry('six-fold-snowflake'),
    ]);
    expect(
      neighbours(cards, 'alhambra-star-and-arrows-shifted', {}).next?.id,
    ).toBe('six-fold-snowflake');
    expect(neighbours(cards, 'six-fold-snowflake', {}).previous?.id).toBe(
      'alhambra-star-and-arrows',
    );
  });
});

describe('switching variation', () => {
  const all = ids.map((id) => entry(id));

  it('offers the family’s members, main first, with the open one', () => {
    expect(
      variationsOf('twelve-fold-rosette-mian-hex', all).map((e) => e.id),
    ).toEqual(['twelve-fold-rosette-mian', 'twelve-fold-rosette-mian-hex']);
    expect(variationsOf('six-fold-snowflake', all)).toEqual([]);
  });

  it('opens the other variation at the same stage', () => {
    expect(startAddress('mian-stellated-hex', 'result')).toBe(
      '#/mian-stellated-hex/result',
    );
    expect(startAddress('mian-stellated-hex', 'repeat')).toBe(
      '#/mian-stellated-hex/repeat',
    );
    expect(startAddress('mian-stellated-hex', 'beginning')).toBe(
      '#/mian-stellated-hex/watch',
    );
  });
});
