import { Fragment, useState } from 'react';
import { LIBRARY } from '../app/library';
import {
  BEGINNER_PATH,
  PATH_CHAPTERS,
  pathMatches,
  type PathFilter,
} from './beginnerPath';
import './review.css';
import './beginnerPath.css';

export function BeginnerPath() {
  const [filter, setFilter] = useState<PathFilter>('all');
  const matching = BEGINNER_PATH.filter(
    (lesson) => lesson.photo === 'recorded-match',
  ).length;
  const free = BEGINNER_PATH.filter((lesson) => lesson.photoFile).length;
  return (
    <main className="review beginner-path">
      <nav className="review-top">
        <a href="#/review">← Review</a>
        <a href="#/notes/beginner-path-proposal">
          Evidence and selection notes →
        </a>
      </nav>
      <header>
        <p className="bp-kicker">Path evidence · existing library</p>
        <h1>From one circle to a rosette.</h1>
        <p>
          Twelve linked lessons, each with one new focus. The early lessons
          teach the tools; later ones are stretch projects and keep their
          existing difficulty labels. The owner approved the navigation; the
          source checks below remain open.
        </p>
      </header>
      <nav className="bp-overview" aria-label="The twelve proposed drawings">
        {BEGINNER_PATH.map((lesson, index) => {
          const preview = LIBRARY.find(
            (entry) => entry.id === lesson.id,
          )?.preview;
          return (
            <a
              key={lesson.id}
              href={`#/${lesson.id}/result`}
              aria-label={`Design ${index + 1}: ${preview?.title ?? lesson.id}`}
            >
              {preview ? (
                <img
                  src={
                    import.meta.env.BASE_URL +
                    (preview.thumbnailSmall ?? preview.thumbnail)
                  }
                  alt=""
                  width="100"
                  height="100"
                />
              ) : null}
              <span>{index + 1}</span>
            </a>
          );
        })}
      </nav>
      <div
        className="bp-summary"
        role="group"
        aria-label="Path evidence coverage"
      >
        <div>
          <strong>{BEGINNER_PATH.length}</strong>
          <span>proposed lessons</span>
        </div>
        <div>
          <strong>{free}</strong>
          <span>shipped free photos</span>
        </div>
        <div>
          <strong>{matching}</strong>
          <span>recorded matching examples</span>
        </div>
        <div>
          <strong>{BEGINNER_PATH.length - matching}</strong>
          <span>photo gates still open</span>
        </div>
      </div>
      <aside className="bp-gate" aria-label="Launch requirements">
        <h2>A learning proposal, with its evidence gaps visible.</h2>
        <p>
          The plan calls for a matching free photo for each lesson. Eight
          candidates currently ship no free photo; one has only a
          historical-reference photo. The three recorded matches below come from
          the project’s status log, not a new independent photo audit.
        </p>
        <p>
          The owner approved Start here and next-lesson navigation. Try the{' '}
          <a href="#/learn">working learning path</a>. This evidence review
          stays separate; navigation does not mark lessons complete or close the
          photo checks.
        </p>
      </aside>
      <div
        className="bp-filters"
        role="group"
        aria-label="Filter path evidence"
      >
        {(
          [
            ['all', 'All 12'],
            ['photo', 'Recorded photo matches'],
            ['gaps', 'Photo work needed'],
          ] as const
        ).map(([value, label]) => (
          <button
            type="button"
            key={value}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>
      {PATH_CHAPTERS.map((chapter, chapterIndex) => {
        const lessons = BEGINNER_PATH.slice(
          chapterIndex * 4,
          chapterIndex * 4 + 4,
        ).filter((lesson) => pathMatches(lesson, filter));
        if (!lessons.length) return null;
        return (
          <section
            key={chapter.title}
            className="bp-chapter"
            aria-labelledby={`chapter-${chapterIndex}`}
          >
            <p className="bp-kicker">Chapter {chapterIndex + 1}</p>
            <h2 id={`chapter-${chapterIndex}`}>{chapter.title}</h2>
            <p>{chapter.detail}</p>
            <ol className="bp-lessons" aria-label={chapter.title}>
              {lessons.map((lesson) => {
                const order = BEGINNER_PATH.indexOf(lesson) + 1;
                const entry = LIBRARY.find((entry) => entry.id === lesson.id);
                const preview = entry?.preview;
                const title = preview?.short ?? preview?.title ?? lesson.id;
                return (
                  <li
                    key={lesson.id}
                    id={`lesson-${order}`}
                    className="bp-lesson"
                    value={order}
                  >
                    <a
                      className="bp-picture"
                      href={`#/${lesson.id}/result`}
                      aria-label={`See ${title}`}
                    >
                      {preview ? (
                        <img
                          src={
                            import.meta.env.BASE_URL +
                            (preview.thumbnailSmall ?? preview.thumbnail)
                          }
                          alt=""
                          loading="lazy"
                          width="320"
                          height="320"
                        />
                      ) : null}
                      <span className="bp-number">{order}</span>
                    </a>
                    <div className="bp-copy">
                      <h3>{title}</h3>
                      <p className="bp-meta">
                        {preview?.level} · {preview?.steps} visible steps
                      </p>
                      <p className="bp-focus">
                        <strong>New focus</strong>
                        {lesson.focus}
                      </p>
                      <p>{lesson.practice}</p>
                      {lesson.buildsOn.length ? (
                        <p className="bp-builds">
                          Builds on{' '}
                          {lesson.buildsOn.map((id, index) => (
                            <Fragment key={id}>
                              {index ? ' and ' : ''}
                              <a
                                href={`#/${id}/watch/1`}
                                title={
                                  LIBRARY.find((entry) => entry.id === id)
                                    ?.preview?.title ?? id
                                }
                              >
                                {BEGINNER_PATH.findIndex(
                                  (lesson) => lesson.id === id,
                                ) + 1}
                              </a>
                            </Fragment>
                          ))}
                          .
                        </p>
                      ) : (
                        <p className="bp-builds">
                          Start here: only O and A are given.
                        </p>
                      )}
                      <p
                        className={`bp-photo ${lesson.photo === 'recorded-match' ? 'has-match' : ''}`}
                      >
                        {lesson.photo === 'recorded-match'
                          ? 'Public photo + recorded match'
                          : lesson.photo === 'historical-reference'
                            ? 'Reference photo; match unverified'
                            : 'No shipped free example photo'}
                      </p>
                      <details>
                        <summary>Source and evidence</summary>
                        <p>{lesson.evidence}</p>
                        <p>
                          Status log: {lesson.recordedStatus}.{' '}
                          <a href="#/notes/status">Read the status record.</a>{' '}
                          The lesson shows its construction credits separately.
                        </p>
                      </details>
                      <div className="bp-actions">
                        <a href={`#/${lesson.id}/watch/1`}>Open step 1</a>
                        <a href={`#/${lesson.id}/draw`}>Draw along</a>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
      <section className="bp-next">
        <h2>My recommendation</h2>
        <p>
          Review this order first. Then prioritize matching free-photo checks
          for the opening lessons, read the instructions aloud, and test the
          first lessons with a newcomer. After those gates, add the path at the
          top of the library and offer the next lesson at each finish.
        </p>
        <a href="#/eight-fold-star-and-cross/watch/1">
          Try the opening lesson →
        </a>
      </section>
    </main>
  );
}
