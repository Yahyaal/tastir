import { useCallback, useEffect, useState } from 'react';
import { studioCall } from './client';

/**
 * Judging a contest (#/studio/contest/<id>): every design lettered, its
 * wall beside the others, with no model names until the owner picks one.
 */
interface Design {
  readonly letter: string;
  readonly project: string;
  readonly outcome: 'finished' | 'stopped' | 'failed';
  readonly problems: readonly string[];
  readonly model?: string;
  readonly seconds?: number;
  readonly edits?: number;
  readonly reason?: string | null;
}

interface Shown {
  readonly id: string;
  readonly brief: { readonly title: string; readonly text: string };
  readonly judged: boolean;
  readonly pick: string | null;
  readonly rejected: readonly string[];
  readonly designs: readonly Design[];
}

const done = (d: Design) => d.outcome === 'finished' && !d.problems.length;

export function ContestPage({ id }: { id: string }) {
  const [shown, setShown] = useState<Shown>();
  const [error, setError] = useState<string>();
  const [rejected, setRejected] = useState<readonly string[]>([]);
  const load = useCallback(() => {
    studioCall<Shown>('GET', `/contests/${id}`)
      .then((s) => {
        setShown(s);
        setRejected(s.rejected);
      })
      .catch((e: Error) => setError(e.message));
  }, [id]);
  useEffect(load, [load]);
  const pick = (project: string) =>
    studioCall<Shown>('POST', `/contests/${id}/judge`, {
      pick: project,
      rejected,
    })
      .then(setShown)
      .catch((e: Error) => setError(e.message));
  if (!shown)
    return <p className="notice">{error ?? 'Loading the contest…'}</p>;
  return (
    <section className="notice studio-contest">
      <h1>{shown.brief.title}</h1>
      <p>{shown.brief.text}</p>
      <p className="studio-meta">
        {shown.judged
          ? 'You picked a favourite, so the models are shown.'
          : 'The models stay hidden until you pick a favourite.'}
      </p>
      {error ? (
        <p className="studio-error" role="alert">
          {error}
        </p>
      ) : null}
      <ul className="studio-designs">
        {shown.designs.map((d) => (
          <li
            key={d.project}
            className={shown.pick === d.project ? 'picked' : undefined}
          >
            <h2>Design {d.letter}</h2>
            {done(d) ? (
              <img
                src={`/__studio/projects/${d.project}/picture?what=wall&size=600`}
                alt={`The wall of design ${d.letter}`}
              />
            ) : (
              <p>
                {d.outcome === 'stopped'
                  ? 'Stopped before it finished.'
                  : 'Not finished.'}{' '}
                {d.problems.slice(0, 3).join(' ')}
              </p>
            )}
            {shown.judged ? (
              <p className="studio-meta">
                {d.model}, {d.seconds} s, {d.edits} edits
                {d.reason ? `, ${d.reason}` : ''}.{' '}
                <a href={`#/studio/${d.project}`}>Open</a>
              </p>
            ) : null}
            {done(d) ? (
              <div className="studio-judge">
                <label>
                  <input
                    type="checkbox"
                    checked={rejected.includes(d.project)}
                    onChange={(e) =>
                      setRejected((r) =>
                        e.target.checked
                          ? [...r, d.project]
                          : r.filter((p) => p !== d.project),
                      )
                    }
                  />{' '}
                  Not good
                </label>
                <button
                  type="button"
                  className="button"
                  onClick={() => void pick(d.project)}
                >
                  {shown.pick === d.project
                    ? 'Your favourite'
                    : `Pick design ${d.letter}`}
                </button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
