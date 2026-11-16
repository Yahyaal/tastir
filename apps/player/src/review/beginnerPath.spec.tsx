import { fireEvent, render, screen } from '@testing-library/react';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parseTutorial } from '@tastir/schema';
import { BEGINNER_PATH, pathMatches } from './beginnerPath';
import { BeginnerPath } from './BeginnerPath';
const root = process.cwd().replace(/\/apps\/player$/, '');
const status = readFileSync(join(root, 'docs/patterns/STATUS.md'), 'utf8');
const hidden: string[] = JSON.parse(
  readFileSync(join(root, 'apps/player/src/app/hidden.json'), 'utf8'),
);

it('proposes twelve distinct available lessons with only earlier prerequisites', () => {
  expect(BEGINNER_PATH).toHaveLength(12);
  const earlier = new Set<string>();
  for (const lesson of BEGINNER_PATH) {
    expect(earlier.has(lesson.id)).toBe(false);
    expect(hidden).not.toContain(lesson.id);
    for (const prerequisite of lesson.buildsOn)
      expect(earlier.has(prerequisite), `${lesson.id}: ${prerequisite}`).toBe(
        true,
      );
    const tutorial = parseTutorial(
      JSON.parse(
        readFileSync(join(root, `tutorials/${lesson.id}.json`), 'utf8'),
      ),
    );
    expect(tutorial.id).toBe(lesson.id);
    const row = status
      .split('\n')
      .find((line) => line.startsWith(`| ${lesson.id} |`));
    expect(row?.split('|')[4]?.trim()).toMatch(
      new RegExp(`^${lesson.recordedStatus}`),
    );
    earlier.add(lesson.id);
  }
});

it('keeps shipping-photo evidence separate from approval and historical references', () => {
  for (const lesson of BEGINNER_PATH) {
    const tutorial = parseTutorial(
      JSON.parse(
        readFileSync(join(root, `tutorials/${lesson.id}.json`), 'utf8'),
      ),
    );
    const free =
      tutorial.photos?.filter(
        (photo) =>
          !photo.private && /CC BY|CC0|Public domain/.test(photo.license),
      ) ?? [];
    if (lesson.photo === 'missing') expect(free).toHaveLength(0);
    else {
      const photo = free.find((photo) => photo.file === lesson.photoFile);
      expect(photo).toBeDefined();
      expect(
        existsSync(join(root, 'apps/player/public/photos', lesson.photoFile!)),
      ).toBe(true);
      if (lesson.photo === 'recorded-match') {
        expect(lesson.recordedStatus).toBe('verified');
        expect(tutorial.verification?.status).not.toBe('unverified');
      } else expect(tutorial.verification?.status).toBe('unverified');
    }
  }
  expect(
    BEGINNER_PATH.filter((lesson) => lesson.photo === 'recorded-match'),
  ).toHaveLength(3);
  expect(
    BEGINNER_PATH.filter((lesson) => lesson.photo === 'historical-reference'),
  ).toHaveLength(1);
});

it('partitions photo work without hiding the original lesson numbers or saving progress', () => {
  const before = window.localStorage.length;
  render(<BeginnerPath />);
  expect(document.querySelectorAll('.bp-lesson')).toHaveLength(12);
  fireEvent.click(
    screen.getByRole('button', { name: 'Recorded photo matches' }),
  );
  expect(
    [...document.querySelectorAll('.bp-lesson')].map((el) =>
      el.getAttribute('value'),
    ),
  ).toEqual(['5', '6', '12']);
  fireEvent.click(screen.getByRole('button', { name: 'Photo work needed' }));
  expect(document.querySelectorAll('.bp-lesson')).toHaveLength(9);
  expect(document.getElementById('lesson-8')).not.toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'All 12' }));
  expect(
    document.querySelector('a[href="#/eight-fold-star-and-cross/watch/1"]'),
  ).not.toBeNull();
  expect(window.localStorage.length).toBe(before);
  expect(
    BEGINNER_PATH.filter((lesson) => pathMatches(lesson, 'photo')).length +
      BEGINNER_PATH.filter((lesson) => pathMatches(lesson, 'gaps')).length,
  ).toBe(12);
});
