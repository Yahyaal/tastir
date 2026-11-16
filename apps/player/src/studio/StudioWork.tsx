import { useCallback, useEffect, useState } from 'react';
import {
  SignedOut,
  studioCall,
  studioUrl,
  useStudioEvents,
  useStudioSignedIn,
  type ProjectLine,
} from './client';

/** Online projects belong on Your work alongside this browser's patterns. */
export function StudioWork() {
  const signedIn = useStudioSignedIn();
  const [projects, setProjects] = useState<readonly ProjectLine[]>();
  const [error, setError] = useState<Error>();
  const load = useCallback(() => {
    void studioCall<ProjectLine[]>('GET', '/projects')
      .then((result) => {
        setProjects(result);
        setError(undefined);
      })
      .catch((reason: Error) => {
        if (!(reason instanceof SignedOut)) setError(reason);
      });
  }, []);
  useEffect(() => {
    if (signedIn === false) {
      setProjects(undefined);
      return;
    }
    load();
  }, [load, signedIn]);
  useStudioEvents(load);
  return (
    <section className="shelf" aria-labelledby="studio-projects">
      <div className="collection-head">
        <h3 id="studio-projects">Studio projects</h3>
        <p>Saved online and shared with your AI apps.</p>
        <a href="#/studio">Open Studio →</a>
      </div>
      {signedIn === false ? (
        <p>
          <a href="/login?next=%2F%23%2Fwork">
            Sign in to see your Studio projects
          </a>
        </p>
      ) : error ? (
        <p role="status">
          {error.message}{' '}
          <button type="button" onClick={load}>
            Try again
          </button>
        </p>
      ) : projects === undefined ? (
        <p role="status">Loading Studio projects…</p>
      ) : projects.length === 0 ? (
        <p>No Studio projects yet. Start one in Studio or ask your AI app.</p>
      ) : (
        <ul className="cards">
          {projects.map((project) => (
            <li className="card-item" key={project.id}>
              <a className="card" href={`#/studio/${project.id}`}>
                <img
                  className="thumbnail"
                  src={studioUrl(
                    `/projects/${project.id}/picture?what=wall&size=360&revision=${project.revision}`,
                  )}
                  alt=""
                  width="360"
                  height="360"
                  loading="lazy"
                  onError={(event) => {
                    const image = event.currentTarget;
                    if (image.src.includes('what=wall'))
                      image.src = studioUrl(
                        `/projects/${project.id}/picture?what=construction&size=360&revision=${project.revision}`,
                      );
                  }}
                />
                <h4>{project.title}</h4>
                <p className="meta">
                  Revision {project.revision} · Saved online
                </p>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
