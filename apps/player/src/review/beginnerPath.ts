/** A review proposal, not an automatically promoted or completed course. */
export interface PathLesson {
  readonly id: string;
  readonly focus: string;
  readonly practice: string;
  readonly buildsOn: readonly string[];
  readonly recordedStatus: 'verified' | 'approved';
  readonly evidence: string;
  readonly photo: 'missing' | 'historical-reference' | 'recorded-match';
  readonly photoFile?: string;
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

export const BEGINNER_PATH: readonly PathLesson[] = [
  {
    id: 'eight-fold-star-and-cross',
    focus: 'Read named points and turn a construction into ink.',
    practice:
      'Draw the circle through A. Notice how two squares become the star when you choose the inked turns.',
    buildsOn: [],
    recordedStatus: 'verified',
    evidence:
      'The status log records a match to the Kashan star-and-cross tiles. This tutorial currently ships no free example photo.',
    photo: 'missing',
  },
  {
    id: 'six-fold-star-and-hexagons',
    focus: 'Carry one compass opening around the circle.',
    practice:
      'Keep the same opening as the circle centers move. Follow the crossings to build six equal directions.',
    buildsOn: ['eight-fold-star-and-cross'],
    recordedStatus: 'verified',
    evidence:
      'The status log records a Timurid tile photo check. That is separate from a free photo being available in this lesson.',
    photo: 'missing',
  },
  {
    id: 'twelve-fold-dodecagrams',
    focus: 'Find more directions from the six-fold construction.',
    practice:
      'Compare the two six-pointed stars turned relative to one another; trace the twelve-point result.',
    buildsOn: ['six-fold-star-and-hexagons'],
    recordedStatus: 'approved',
    evidence:
      'The status log approves the published Tuts+ drawing. It explicitly records no photo of a real example.',
    photo: 'missing',
  },
  {
    id: 'six-fold-snowflake',
    focus: 'Use points on an existing star to make a smaller star.',
    practice:
      'Find the points halfway along the star sides, then compare the inner and outer stars.',
    buildsOn: ['six-fold-star-and-hexagons'],
    recordedStatus: 'verified',
    evidence:
      'The status log records checks against the Ibn Tulun window and Eski Mosque panel. No free example photo is shipped here.',
    photo: 'missing',
  },
  {
    id: 'alhambra-comares-bones',
    focus: 'Carry a compass length into a square grid.',
    practice:
      'Follow the equal-length transfers along each axis, then see how diagonal lines cross that grid.',
    buildsOn: ['six-fold-star-and-hexagons'],
    recordedStatus: 'verified',
    evidence:
      'Status log: verified Comares bones. A credited CC BY 4.0 example photo is shipped with the lesson.',
    photo: 'recorded-match',
    photoFile: 'alhambra-comares-bones.jpg',
  },
  {
    id: 'alhambra-comares-dado',
    focus: 'Repeat the work of one corner with a quarter turn.',
    practice:
      'Watch the lines built in one corner before following their rotated copies to the other corners.',
    buildsOn: ['alhambra-comares-bones'],
    recordedStatus: 'verified',
    evidence:
      'Status log: verified Comares dado. A credited CC BY-SA 4.0 example photo is shipped with the lesson.',
    photo: 'recorded-match',
    photoFile: 'alhambra-comares-dado.jpg',
  },
  {
    id: 'eight-fold-khatam',
    focus: 'Add circles whose centers are away from O.',
    practice:
      'Start from familiar eight-fold divisions, then follow the smaller circles that establish new crossings.',
    buildsOn: ['eight-fold-star-and-cross', 'alhambra-comares-dado'],
    recordedStatus: 'approved',
    evidence:
      'The owner approved this study after Sandy Kurt. Its historical match remains explicitly unverified; no matching free photo ships.',
    photo: 'missing',
  },
  {
    id: 'eight-fold-star-and-octagon',
    focus: 'Make sixteen directions from the eight-fold start.',
    practice:
      'Look for the additional halfway directions before following the repeated star lines.',
    buildsOn: ['eight-fold-khatam', 'twelve-fold-dodecagrams'],
    recordedStatus: 'approved',
    evidence:
      'Owner-approved study after Sandy Kurt. Its CC BY-SA 4.0 photo is a historical reference, not a verified pattern match.',
    photo: 'historical-reference',
    photoFile: 'itimad-star-and-octagon.jpg',
  },
  {
    id: 'eight-fold-zellige',
    focus: 'Construct one motif and turn its copies around O.',
    practice:
      'Follow the circle and point that are turned by 45°, then compare the repeated star lines.',
    buildsOn: ['eight-fold-star-and-octagon'],
    recordedStatus: 'approved',
    evidence:
      'The status log records Design D as owner-approved. This is an app-developed construction and currently has no shipped example photo.',
    photo: 'missing',
  },
  {
    id: 'twelve-fold-rosette-mian',
    focus: 'Use an inner circle to establish a rosette ring.',
    practice:
      'Watch how the extra circle supplies the points through which the rosette lines run.',
    buildsOn: ['twelve-fold-dodecagrams', 'eight-fold-zellige'],
    recordedStatus: 'approved',
    evidence:
      'The status log approves Samira Mian’s rosette against her teaching pictures. Those checks do not supply a free example photo in this lesson.',
    photo: 'missing',
  },
  {
    id: 'twelve-fold-rosette-mian-hex',
    focus: 'Compare another tile around a familiar rosette.',
    practice:
      'Compare the square and hexagonal tile outlines and the gaps they create between neighboring rosettes.',
    buildsOn: ['twelve-fold-rosette-mian'],
    recordedStatus: 'approved',
    evidence:
      'The status log approves the hexagonal arrangement. No free example photo is shipped with it.',
    photo: 'missing',
  },
  {
    id: 'minbar-doors-cairo',
    focus: 'Read the inked lines separately from the construction.',
    practice:
      'Compare the rosette foundations with the doors’ inked star and kite outlines; notice which construction lines are left behind.',
    buildsOn: ['twelve-fold-rosette-mian-hex'],
    recordedStatus: 'verified',
    evidence:
      'Status log: verified against the museum photograph. The credited Met example is shipped under Public Domain / CC0.',
    photo: 'recorded-match',
    photoFile: 'cairo-minbar-doors-met.jpg',
  },
];

export type PathFilter = 'all' | 'photo' | 'gaps';
export const pathMatches = (lesson: PathLesson, filter: PathFilter) =>
  filter === 'all' ||
  (filter === 'photo'
    ? lesson.photo === 'recorded-match'
    : lesson.photo !== 'recorded-match');
