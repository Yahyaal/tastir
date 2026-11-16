import type { Entry } from './library';
export interface LearningLesson {
  readonly id: string;
  readonly focus: string;
  readonly practice: string;
  readonly buildsOn: readonly string[];
  readonly photo: 'missing' | 'historical-reference' | 'recorded-match';
}
export const PATH_CHAPTERS = [
  {
    title: 'Learn the moves',
    detail:
      'A named point, one compass opening, finer divisions, then a star inside a star.',
  },
  {
    title: 'Extend the construction',
    detail:
      'Carry a length into a grid, repeat a corner, and add more construction around the first circle.',
  },
  {
    title: 'Read the motif, tile and ink',
    detail:
      'Repeat a motif, build a rosette, then compare what changes when the tile or inking changes.',
  },
] as const;
export const LEARNING_PATH: readonly LearningLesson[] = [
  {
    id: 'eight-fold-star-and-cross',
    focus: 'Read named points and turn a construction into ink.',
    practice:
      'Draw the circle through A. Notice how two squares become the star when you choose the inked turns.',
    buildsOn: [],
    photo: 'missing',
  },
  {
    id: 'six-fold-star-and-hexagons',
    focus: 'Carry one compass opening around the circle.',
    practice:
      'Keep the same opening as the circle centers move. Follow the crossings to build six equal directions.',
    buildsOn: ['eight-fold-star-and-cross'],
    photo: 'missing',
  },
  {
    id: 'twelve-fold-dodecagrams',
    focus: 'Find more directions from the six-fold construction.',
    practice:
      'Compare the two six-pointed stars turned relative to one another; trace the twelve-point result.',
    buildsOn: ['six-fold-star-and-hexagons'],
    photo: 'missing',
  },
  {
    id: 'six-fold-snowflake',
    focus: 'Use points on an existing star to make a smaller star.',
    practice:
      'Find the points halfway along the star sides, then compare the inner and outer stars.',
    buildsOn: ['six-fold-star-and-hexagons'],
    photo: 'missing',
  },
  {
    id: 'alhambra-comares-bones',
    focus: 'Carry a compass length into a square grid.',
    practice:
      'Follow the equal-length transfers along each axis, then see how diagonal lines cross that grid.',
    buildsOn: ['six-fold-star-and-hexagons'],
    photo: 'recorded-match',
  },
  {
    id: 'alhambra-comares-dado',
    focus: 'Repeat the work of one corner with a quarter turn.',
    practice:
      'Watch the lines built in one corner before following their rotated copies to the other corners.',
    buildsOn: ['alhambra-comares-bones'],
    photo: 'recorded-match',
  },
  {
    id: 'eight-fold-khatam',
    focus: 'Add circles whose centers are away from O.',
    practice:
      'Start from familiar eight-fold divisions, then follow the smaller circles that establish new crossings.',
    buildsOn: ['eight-fold-star-and-cross', 'alhambra-comares-dado'],
    photo: 'missing',
  },
  {
    id: 'eight-fold-star-and-octagon',
    focus: 'Make sixteen directions from the eight-fold start.',
    practice:
      'Look for the additional halfway directions before following the repeated star lines.',
    buildsOn: ['eight-fold-khatam', 'twelve-fold-dodecagrams'],
    photo: 'historical-reference',
  },
  {
    id: 'eight-fold-zellige',
    focus: 'Construct one motif and turn its copies around O.',
    practice:
      'Follow the circle and point that are turned by 45°, then compare the repeated star lines.',
    buildsOn: ['eight-fold-star-and-octagon'],
    photo: 'missing',
  },
  {
    id: 'twelve-fold-rosette-mian',
    focus: 'Use an inner circle to establish a rosette ring.',
    practice:
      'Watch how the extra circle supplies the points through which the rosette lines run.',
    buildsOn: ['twelve-fold-dodecagrams', 'eight-fold-zellige'],
    photo: 'missing',
  },
  {
    id: 'twelve-fold-rosette-mian-hex',
    focus: 'Compare another tile around a familiar rosette.',
    practice:
      'Compare the square and hexagonal tile outlines and the gaps they create between neighboring rosettes.',
    buildsOn: ['twelve-fold-rosette-mian'],
    photo: 'missing',
  },
  {
    id: 'minbar-doors-cairo',
    focus: 'Read the inked lines separately from the construction.',
    practice:
      'Compare the rosette foundations with the doors’ inked star and kite outlines; notice which construction lines are left behind.',
    buildsOn: ['twelve-fold-rosette-mian-hex'],
    photo: 'recorded-match',
  },
];
/** Only recommend tutorials actually present in the visible library. */
export function availableLearningPath(entries: readonly Entry[]) {
  return LEARNING_PATH.flatMap((lesson) => {
    const entry = entries.find((entry) => entry.id === lesson.id);
    return entry ? [{ lesson, entry }] : [];
  }).map((item, index, items) => ({
    ...item,
    number: index + 1,
    total: items.length,
  }));
}
export function learningPosition(id: string, entries: readonly Entry[]) {
  const available = availableLearningPath(entries);
  const index = available.findIndex((item) => item.lesson.id === id);
  return index < 0
    ? undefined
    : {
        current: available[index]!,
        next: available[index + 1],
        first: available[0]!,
      };
}
