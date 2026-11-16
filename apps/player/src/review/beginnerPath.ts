import { LEARNING_PATH, type LearningLesson } from '../app/learningPath';
export { PATH_CHAPTERS } from '../app/learningPath';
export interface PathLesson extends LearningLesson {
  readonly recordedStatus: 'verified' | 'approved';
  readonly evidence: string;
  readonly photoFile?: string;
}
const EVIDENCE: Readonly<
  Record<string, Pick<PathLesson, 'recordedStatus' | 'evidence' | 'photoFile'>>
> = {
  'eight-fold-star-and-cross': {
    recordedStatus: 'verified',
    evidence:
      'The status log records a match to the Kashan star-and-cross tiles. This tutorial currently ships no free example photo.',
  },
  'six-fold-star-and-hexagons': {
    recordedStatus: 'verified',
    evidence:
      'The status log records a Timurid tile photo check. That is separate from a free photo being available in this lesson.',
  },
  'twelve-fold-dodecagrams': {
    recordedStatus: 'approved',
    evidence:
      'The status log approves the published Tuts+ drawing. It explicitly records no photo of a real example.',
  },
  'six-fold-snowflake': {
    recordedStatus: 'verified',
    evidence:
      'The status log records checks against the Ibn Tulun window and Eski Mosque panel. No free example photo is shipped here.',
  },
  'alhambra-comares-bones': {
    recordedStatus: 'verified',
    evidence:
      'Status log: verified Comares bones. A credited CC BY 4.0 example photo is shipped with the lesson.',
    photoFile: 'alhambra-comares-bones.jpg',
  },
  'alhambra-comares-dado': {
    recordedStatus: 'verified',
    evidence:
      'Status log: verified Comares dado. A credited CC BY-SA 4.0 example photo is shipped with the lesson.',
    photoFile: 'alhambra-comares-dado.jpg',
  },
  'eight-fold-khatam': {
    recordedStatus: 'approved',
    evidence:
      'The owner approved this study after Sandy Kurt. Its historical match remains explicitly unverified; no matching free photo ships.',
  },
  'eight-fold-star-and-octagon': {
    recordedStatus: 'approved',
    evidence:
      'Owner-approved study after Sandy Kurt. Its CC BY-SA 4.0 photo is a historical reference, not a verified pattern match.',
    photoFile: 'itimad-star-and-octagon.jpg',
  },
  'eight-fold-zellige': {
    recordedStatus: 'approved',
    evidence:
      'The status log records Design D as owner-approved. This is an app-developed construction and currently has no shipped example photo.',
  },
  'twelve-fold-rosette-mian': {
    recordedStatus: 'approved',
    evidence:
      'The status log approves Samira Mian’s rosette against her teaching pictures. Those checks do not supply a free example photo in this lesson.',
  },
  'twelve-fold-rosette-mian-hex': {
    recordedStatus: 'approved',
    evidence:
      'The status log approves the hexagonal arrangement. No free example photo is shipped with it.',
  },
  'minbar-doors-cairo': {
    recordedStatus: 'verified',
    evidence:
      'Status log: verified against the museum photograph. The credited Met example is shipped under Public Domain / CC0.',
    photoFile: 'cairo-minbar-doors-met.jpg',
  },
};
export const BEGINNER_PATH: readonly PathLesson[] = LEARNING_PATH.map(
  (lesson) => ({ ...lesson, ...EVIDENCE[lesson.id]! }),
);
export type PathFilter = 'all' | 'photo' | 'gaps';
export const pathMatches = (lesson: PathLesson, filter: PathFilter) =>
  filter === 'all' ||
  (filter === 'photo'
    ? lesson.photo === 'recorded-match'
    : lesson.photo !== 'recorded-match');
