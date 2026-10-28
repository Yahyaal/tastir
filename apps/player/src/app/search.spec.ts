import { filtered } from './browsing';
import type { Entry } from './library';
import { readQuery, scoreOf } from './search';

const card = (
  id: string,
  about: {
    title: string;
    subtitle?: string;
    region?: string;
    style?: string;
    fold?: number;
    credits?: { source: string; creator?: string }[];
  },
): Entry => ({ id, json: { level: 'beginner', fold: 8, ...about } });

const library = [
  card('fes-rosette', {
    title: 'Rosette of the Najjarin fountain (Fès)',
    subtitle: 'Najjarin fountain, Fès',
    region: 'Morocco',
    style: 'Moroccan',
    fold: 16,
  }),
  card('fes-stars', {
    title: 'Interlaced stars',
    subtitle: 'Bou Inania madrasa, Fez',
    region: 'Morocco',
    style: 'Marinid',
  }),
  card('barca', {
    title: 'Interlaced stars of the Sala de la Barca (Alhambra)',
    subtitle: 'Sala de la Barca, Alhambra',
    region: 'Alhambra and Nasrid Spain',
    style: 'Nasrid',
  }),
  card('bourgoin-65', {
    title: 'Rosettes of plate 65',
    region: 'Books and other',
    style: 'Mamluk',
    fold: 16,
    credits: [{ source: 'Tiling Search, P065', creator: 'Jules Bourgoin' }],
  }),
  card('isfahan', {
    title: 'Stars of the Imamzadeh Ismail',
    subtitle: 'Imamzadeh Ismail, Isfahan',
    region: 'Iran',
    style: 'Persian',
    fold: 10,
  }),
];
const ids = (query: string) => filtered(library, { query }).map((e) => e.id);

describe('the library search', () => {
  it('reads a number of points as a symmetry', () => {
    expect(readQuery('16 point')).toEqual({ words: [], fold: 16 });
    expect(readQuery('sixteen-fold Fez')).toEqual({ words: ['fez'], fold: 16 });
    expect(readQuery('twelve pointed')).toEqual({ words: [], fold: 12 });
    expect(readQuery('8-fold')).toEqual({ words: [], fold: 8 });
    expect(readQuery('fez twelve')).toEqual({ words: ['fez'], fold: 12 });
    // Digits on their own are a word to look for (a plate, a page).
    expect(readQuery('plate 65')).toEqual({ words: ['plate', '65'] });
  });

  it('finds other spellings and related names of places', () => {
    expect(ids('fez')).toEqual(['fes-rosette', 'fes-stars']);
    expect(ids('fes')).toEqual(['fes-rosette', 'fes-stars']);
    expect(ids('granada')).toEqual(['barca']);
    expect(ids('esfahan')).toEqual(['isfahan']);
  });

  it('finds a star of those points on a tile that turns less', () => {
    const rosette: Entry = {
      ...card('square-rosette', { title: 'Square rosette', fold: 4 }),
      preview: {
        title: 'Square rosette',
        style: 'Mamluk',
        level: 'beginner',
        fold: 4,
        steps: 9,
        photos: false,
        thumbnail: '',
        stars: [16, 8],
      },
    };
    expect(
      filtered([rosette, ...library], { query: '16 point' }).map((e) => e.id),
    ).toEqual(['square-rosette', 'fes-rosette', 'bourgoin-65']);
  });

  it('reads a small number on its own as points or as a word', () => {
    // Twelve-pointed stars, or a 12 in the text (a plate, a page).
    const twelve = card('fes-twelve', {
      title: 'Twelve-pointed stars',
      subtitle: 'Bou Inania, Fès',
      fold: 12,
    });
    const plate = card('plate-12', {
      title: 'Bourgoin plate 12',
      subtitle: 'Fès',
      fold: 8,
    });
    expect(
      filtered([twelve, plate, ...library], { query: 'fes 12' }).map(
        (e) => e.id,
      ),
    ).toEqual(['plate-12', 'fes-twelve']);
    // A number too big for points is only a word.
    expect(ids('bourgoin 65')).toEqual(['bourgoin-65']);
    expect(ids('fes 65')).toEqual([]);
  });

  it('filters by points and words together', () => {
    expect(ids('fez sixteen-fold')).toEqual(['fes-rosette']);
    expect(ids('16 point')).toEqual(['fes-rosette', 'bourgoin-65']);
  });

  it('finds sources and the start of a word', () => {
    expect(ids('bourgoin')).toEqual(['bourgoin-65']);
    expect(ids('alham')).toEqual(['barca']);
  });

  it('forgives one wrong letter in a long word, not in a short one', () => {
    expect(ids('alhmbra')).toEqual(['barca']);
    expect(ids('najarin')).toEqual(['fes-rosette']);
    expect(ids('fex')).toEqual([]);
  });

  it('puts matches in the title before matches elsewhere', () => {
    // "Rosette" is in one title, and in another only as "Rosettes".
    expect(ids('interlaced')).toEqual(['fes-stars', 'barca']);
    const titled = scoreOf(library[2] as Entry, ['barca']);
    const placed = scoreOf(library[4] as Entry, ['isfahan']);
    expect(titled).toBeGreaterThan(placed as number);
    expect(ids('morocco')).toEqual(['fes-rosette', 'fes-stars']);
  });
});
