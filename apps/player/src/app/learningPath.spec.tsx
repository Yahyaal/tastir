import { render, screen } from '@testing-library/react';
import {
  LEARNING_PATH,
  availableLearningPath,
  learningPosition,
} from './learningPath';
import { LearningStart, NextPathLesson } from './LearningPathNav';
import { LearningPath } from './LearningPath';
import type { Entry } from './library';
const entries: Entry[] = LEARNING_PATH.map((lesson, index) => ({
  id: lesson.id,
  json: {},
  preview: {
    title: `Pattern ${index + 1}`,
    level: index === 6 ? 'intermediate' : 'beginner',
    steps: index + 6,
    style: 'Test',
    fold: 8,
    photos: false,
    thumbnail: 'test.webp',
  },
}));

it('keeps the approved order, skips unavailable lessons, and numbers the available path', () => {
  expect(availableLearningPath(entries).map((item) => item.lesson.id)).toEqual(
    LEARNING_PATH.map((lesson) => lesson.id),
  );
  const available = entries.filter((_, index) => index !== 1);
  expect(learningPosition(entries[0]!.id, available)?.next?.lesson.id).toBe(
    entries[2]!.id,
  );
  expect(availableLearningPath(available).map((item) => item.number)).toEqual(
    Array.from({ length: 11 }, (_, i) => i + 1),
  );
  expect(learningPosition('mine/local', entries)).toBeUndefined();
  expect(learningPosition('shared', entries)).toBeUndefined();
});
it('offers a real first position from Start here and handles empty libraries', () => {
  const view = render(<LearningStart entries={entries} />);
  expect(
    screen.getByRole('link', { name: 'Start learning' }).getAttribute('href'),
  ).toBe('#/eight-fold-star-and-cross/watch/1');
  expect(
    screen
      .getByRole('link', { name: 'See the learning path' })
      .getAttribute('href'),
  ).toBe('#/learn');
  view.rerender(<LearningStart entries={[]} />);
  expect(screen.queryByRole('heading', { name: 'Start here' })).toBeNull();
});
it('keeps the drawing mode and never writes completion state from a suggestion', () => {
  const saved = JSON.stringify({
    index: 3,
    label: 'Still learning',
    at: new Date().toISOString(),
  });
  window.localStorage.setItem(
    'tastir.lessonAt.eight-fold-star-and-cross',
    saved,
  );
  const view = render(<NextPathLesson id={entries[0]!.id} entries={entries} />);
  expect(
    screen.getByRole('link', { name: 'Next lesson' }).getAttribute('href'),
  ).toBe('#/six-fold-star-and-hexagons/watch/1');
  view.rerender(<NextPathLesson id={entries[0]!.id} entries={entries} draw />);
  expect(
    screen.getByRole('link', { name: 'Next lesson' }).getAttribute('href'),
  ).toBe('#/six-fold-star-and-hexagons/draw');
  expect(
    window.localStorage.getItem('tastir.lessonAt.eight-fold-star-and-cross'),
  ).toBe(saved);
  view.rerender(<NextPathLesson id={entries.at(-1)!.id} entries={entries} />);
  expect(screen.queryByRole('link', { name: 'Next lesson' })).toBeNull();
  expect(
    screen.getByRole('link', { name: 'Review the learning path' }),
  ).toBeTruthy();
  expect(view.container.textContent).not.toMatch(/completed|finished all/i);
});
it('shows the original ratings and reference limits on the public course', () => {
  render(<LearningPath entries={entries} />);
  expect(document.querySelectorAll('.learning-card')).toHaveLength(12);
  expect(screen.getByText('intermediate · 12 steps')).toBeTruthy();
  expect(
    screen.getByText('Historical reference; pattern match unverified'),
  ).toBeTruthy();
  expect(screen.getAllByText('Reference photo not yet available')).toHaveLength(
    8,
  );
});
