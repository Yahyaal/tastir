import { useMemo } from 'react';
import { allProgress } from '../along/progress';
import { lessonsInProgress } from './lessons';
import { ThemeSwitch } from './theme';
import {
  availableLearningPath,
  LEARNING_PATH,
  PATH_CHAPTERS,
} from './learningPath';
import type { Entry } from './library';
import './learningPath.css';

export function LearningPath({ entries }: { entries: readonly Entry[] }) {
  const lessons = availableLearningPath(entries);
  const progressById = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of lessonsInProgress()) {
      map.set(
        item.address,
        item.label ? `Watching · ${item.label}` : 'Watching in progress',
      );
    }
    for (const item of allProgress()) {
      if (item.kept?.pattern) {
        map.set(item.tutorial, 'Drawn & kept in My patterns');
      } else if (item.board.steps.length > 0 || item.inked.length > 0) {
        map.set(
          item.tutorial,
          item.label ? `Drawing · ${item.label}` : 'Drawing in progress',
        );
      }
    }
    return map;
  }, []);
  return (
    <main className="learning-page">
      <header className="learning-top">
        <a className="home" href="#/">
          <span aria-hidden="true">←</span>
          <span className="wordmark">
            Tastir{' '}
            <span
              className="brand-arabic"
              aria-hidden="true"
              lang="ar"
              dir="rtl"
            >
              تسطير
            </span>
          </span>
          <span className="learning-crumb">All patterns</span>
        </a>
        <ThemeSwitch />
      </header>
      <header className="learning-intro">
        <p className="learning-eyebrow">
          Beginner’s path · {lessons.length} lessons
        </p>
        <h1>From one circle to a rosette.</h1>
        <p>
          Start with the circle and basic tools, then build toward grids,
          repeated motifs and rosettes. Follow the order, or return to an
          earlier lesson for practice.
        </p>
        <p className="learning-muted">
          Later lessons include intermediate practice. Each keeps its original
          difficulty label. Some examples have no reference photo yet; the
          source and verification notes remain available in each tutorial.
        </p>
      </header>
      {!lessons.length ? (
        <p>
          No path lessons are currently available.{' '}
          <a href="#collection">Browse the library.</a>
        </p>
      ) : null}
      {PATH_CHAPTERS.map((chapter, index) => {
        const members = lessons.filter(
          (item) =>
            Math.floor(
              LEARNING_PATH.findIndex(
                (lesson) => lesson.id === item.lesson.id,
              ) / 4,
            ) === index,
        );
        if (!members.length) return null;
        return (
          <section
            key={chapter.title}
            className="learning-chapter"
            aria-labelledby={`learning-chapter-${index}`}
          >
            <p className="learning-eyebrow">Chapter {index + 1}</p>
            <h2 id={`learning-chapter-${index}`}>{chapter.title}</h2>
            <p>{chapter.detail}</p>
            <ol className="learning-cards">
              {members.map(({ lesson, entry, number }) => (
                <li key={lesson.id} value={number} className="learning-card">
                  <a
                    className="learning-picture"
                    href={`#/${lesson.id}/result`}
                    aria-label={`See ${entry.preview?.title ?? lesson.id}`}
                  >
                    {entry.preview ? (
                      <img
                        src={
                          import.meta.env.BASE_URL +
                          (entry.preview.thumbnailSmall ??
                            entry.preview.thumbnail)
                        }
                        alt=""
                        width="320"
                        height="320"
                        loading="lazy"
                      />
                    ) : null}
                    <span>{number}</span>
                  </a>
                  <div className="learning-card-copy">
                    <h3>
                      {entry.preview?.short ??
                        entry.preview?.title ??
                        lesson.id}
                    </h3>
                    <p className="learning-meta">
                      {entry.preview?.level ?? 'Lesson'}
                      {entry.preview ? ` · ${entry.preview.steps} steps` : ''}
                    </p>
                    {progressById.get(lesson.id) ? (
                      <p className="learning-progress-pill">
                        {progressById.get(lesson.id)}
                      </p>
                    ) : null}
                    <p className="learning-focus">{lesson.focus}</p>
                    <p>{lesson.practice}</p>
                    <p className="learning-reference">
                      {lesson.photo === 'missing'
                        ? 'Reference photo not yet available'
                        : lesson.photo === 'historical-reference'
                          ? 'Historical reference; pattern match unverified'
                          : 'Reference photo in the lesson'}
                    </p>
                    <div className="learning-actions">
                      <a
                        className="learning-primary"
                        href={`#/${lesson.id}/watch/1`}
                      >
                        Watch this lesson
                      </a>
                      <a href={`#/${lesson.id}/draw`}>Draw along</a>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </main>
  );
}
