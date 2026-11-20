import { LIBRARY, listed, type Entry } from './library';
import { availableLearningPath, learningPosition } from './learningPath';
import './learningPath.css';

export function LearningStart({ entries }: { entries: readonly Entry[] }) {
  const lessons = availableLearningPath(entries);
  const first = lessons[0];
  if (!first) return null;
  return (
    <section className="learning-start" aria-labelledby="learning-start-title">
      <div>
        <p className="learning-eyebrow">A guided beginning</p>
        <h2 id="learning-start-title">Start here</h2>
        <p>
          From one circle to a rosette: {lessons.length} lessons in a
          recommended order, each introducing a new focus.
        </p>
        <div className="learning-actions">
          <a className="learning-primary" href={`#/${first.lesson.id}/watch/1`}>
            Start learning
          </a>
          <a href="#/learn">See the learning path</a>
        </div>
      </div>
      <div
        className="learning-start-pictures"
        aria-label="First lessons in the path"
      >
        {lessons.slice(0, 3).map(({ lesson, entry, number }) => (
          <a
            key={lesson.id}
            href={`#/${lesson.id}/result`}
            aria-label={`Lesson ${number}: ${entry.preview?.title ?? lesson.id}`}
          >
            {entry.preview ? (
              <img
                src={
                  import.meta.env.BASE_URL +
                  (entry.preview.thumbnailSmall ?? entry.preview.thumbnail)
                }
                alt=""
                width="160"
                height="160"
              />
            ) : (
              <span>{number}</span>
            )}
            <b aria-hidden="true">{number}</b>
          </a>
        ))}
      </div>
    </section>
  );
}

/** Suggestions are available at a finish, without inferring course completion. */
export function NextPathLesson({
  id,
  draw = false,
  entries = listed(LIBRARY),
}: {
  id: string;
  draw?: boolean;
  entries?: readonly Entry[];
}) {
  const position = learningPosition(id, entries);
  if (!position) return null;
  const { current, next } = position;
  return (
    <section className="learning-next" aria-labelledby="learning-next-title">
      <p className="learning-eyebrow">
        Beginner’s path · lesson {current.number} of {current.total}
      </p>
      <h2 id="learning-next-title">
        {next ? 'Next recommended lesson' : 'The last lesson in this path'}
      </h2>
      {next ? (
        <>
          <p>
            <strong>
              {next.entry.preview?.short ??
                next.entry.preview?.title ??
                next.lesson.id}
            </strong>
          </p>
          <p>{next.lesson.focus}</p>
          <div className="learning-actions">
            <a
              className="learning-primary"
              href={`#/${next.lesson.id}/${draw ? 'draw' : 'watch/1'}`}
            >
              Next lesson
            </a>
            <a href="#/learn">See the whole path</a>
          </div>
        </>
      ) : (
        <>
          <p>
            Explore another pattern, or revisit an earlier lesson to practice a
            particular idea.
          </p>
          <div className="learning-actions">
            <a className="learning-primary" href="#/learn">
              Review the learning path
            </a>
            <a href="#collection">Explore the library</a>
          </div>
        </>
      )}
    </section>
  );
}
