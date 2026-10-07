import type { Scene } from '@tastir/engine';
import { useEffect, useState } from 'react';
import { viewBox } from '../app/camera';
import { check } from './document';
import { frameOf } from './EditorDrawing';
import { deletePattern, savePattern, type UserPattern } from './patterns';

const day = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

/**
 * The learner's own patterns, on the home page: each with its drawing so
 * far, Edit, Play once it is tiled and inked, rename, and delete (which
 * asks first).
 */
export function PatternShelf({
  patterns,
  onChange,
}: {
  patterns: readonly UserPattern[];
  /** Called after a rename or delete, to read the patterns again. */
  onChange: () => void;
}) {
  return (
    <section aria-labelledby="my-patterns" className="shelf">
      <div className="collection-head">
        <h2 id="my-patterns">My patterns</h2>
        <p>Your own constructions, kept in this browser.</p>
      </div>
      <ul className="cards">
        {patterns.map((p) => (
          <PatternCard key={p.id} pattern={p} onChange={onChange} />
        ))}
      </ul>
    </section>
  );
}

function PatternCard({
  pattern,
  onChange,
}: {
  pattern: UserPattern;
  onChange: () => void;
}) {
  const { tutorial } = pattern;
  const [doing, setDoing] = useState<'rename' | 'delete'>();
  const [name, setName] = useState(tutorial.title);
  // The drawing is worked out after the page shows, so a big pattern does
  // not hold up the home page.
  const [scene, setScene] = useState<Scene>();
  useEffect(() => {
    const t = setTimeout(() => setScene(check(tutorial).scene), 0);
    return () => clearTimeout(t);
  }, [tutorial]);
  const ready = Boolean(tutorial.pattern?.cell && tutorial.ink?.paths.length);
  return (
    <li className="card-item">
      <a className="card" href={`#/edit/${pattern.id}`}>
        {scene ? (
          <Sketch scene={scene} />
        ) : (
          <div className="thumbnail waiting" />
        )}
        <h3 title={tutorial.title}>{tutorial.title}</h3>
        <p className="meta">
          <span>{tutorial.steps.length} steps</span>
          <span>{day(pattern.updated)}</span>
          {pattern.basedOn ? <span>from {pattern.basedOn.title}</span> : null}
        </p>
      </a>
      {doing === 'rename' ? (
        <form
          className="card-actions design-rename"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            savePattern(pattern.id, { ...tutorial, title: name.trim() });
            setDoing(undefined);
            onChange();
          }}
        >
          <input
            type="text"
            aria-label={`New name for ${tutorial.title}`}
            value={name}
            maxLength={80}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Escape') setDoing(undefined);
            }}
            onChange={(e) => setName(e.target.value)}
          />
          <button type="submit" className="button" disabled={!name.trim()}>
            Rename
          </button>
          <button
            type="button"
            className="button secondary"
            onClick={() => setDoing(undefined)}
          >
            Cancel
          </button>
        </form>
      ) : doing === 'delete' ? (
        <div className="card-actions design-delete" role="group">
          <p>Delete “{tutorial.title}”? This cannot be undone.</p>
          <button
            type="button"
            className="button danger"
            onClick={() => {
              deletePattern(pattern.id);
              onChange();
            }}
          >
            Delete
          </button>
          <button
            type="button"
            className="button secondary"
            onClick={() => setDoing(undefined)}
          >
            Keep it
          </button>
        </div>
      ) : (
        <div className="card-actions pattern-actions">
          <a className="button watch" href={`#/edit/${pattern.id}`}>
            Edit
          </a>
          {ready ? (
            <a className="button result" href={`#/mine/${pattern.id}`}>
              Play
            </a>
          ) : (
            <span className="not-yet">Tile and ink it to play</span>
          )}
          <button
            type="button"
            className="button secondary"
            onClick={() => {
              setName(tutorial.title);
              setDoing('rename');
            }}
          >
            Rename
          </button>
          <button
            type="button"
            className="button secondary"
            onClick={() => setDoing('delete')}
          >
            Delete
          </button>
        </div>
      )}
    </li>
  );
}

/** The construction so far, small, as the card's picture. */
function Sketch({ scene }: { scene: Scene }) {
  const frame = frameOf(scene);
  const far = 4 * (frame.maxX - frame.minX);
  return (
    <svg
      className="thumbnail sketch"
      viewBox={viewBox(frame)}
      aria-hidden="true"
    >
      <g transform="scale(1,-1)">
        {[...scene.elements.values()].map((el) => {
          const g = el.geometry;
          if (g.kind === 'circle')
            return (
              <circle
                key={el.name}
                cx={g.circle.centre.x}
                cy={g.circle.centre.y}
                r={g.circle.radius}
              />
            );
          if (g.kind === 'line') {
            const { point: p, dir: d } = g.line;
            return (
              <line
                key={el.name}
                x1={p.x - d.x * far}
                y1={p.y - d.y * far}
                x2={p.x + d.x * far}
                y2={p.y + d.y * far}
              />
            );
          }
          if (g.kind === 'polygon')
            return (
              <polygon
                key={el.name}
                className="shape"
                points={g.vertices.map((v) => `${v.x},${v.y}`).join(' ')}
              />
            );
          return null;
        })}
      </g>
    </svg>
  );
}
