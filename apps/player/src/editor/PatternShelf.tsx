import type { Scene } from '@tastir/engine';
import { useEffect, useState } from 'react';
import { viewBox } from '../app/camera';
import { Thumbnail } from '../app/drawing';
import { useModel } from '../app/workerClient';
import { deleteDesign, listDesigns } from '../app/designs';
import { check, emptyDraft } from './document';
import { readPattern } from './files';
import { frameOf } from './EditorDrawing';
import {
  addPattern,
  deletePattern,
  freeTitle,
  playable,
  savePattern,
  type UserPattern,
} from './patterns';

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
        <NewPattern />
      </div>
      <ul className="cards">
        {patterns.map((p) => (
          <PatternCard key={p.id} pattern={p} onChange={onChange} />
        ))}
      </ul>
    </section>
  );
}

/**
 * “New pattern”: the editor with only the centre O and the point A, as a
 * blank sheet with a compass and a ruler.
 */
/** A file's text (FileReader where File.text is missing). */
const readText = (f: File): Promise<string> =>
  typeof f.text === 'function'
    ? f.text()
    : new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = () => reject(r.error);
        r.readAsText(f);
      });

export function NewPattern() {
  const [said, setSaid] = useState<string>();
  const refused = () =>
    setSaid(
      'This browser would not keep the pattern: its storage is blocked (a private window) or full.',
    );
  /** Opens a pattern (or tutorial) file as a pattern of one's own. */
  const open = (text: string) => {
    const read = readPattern(text);
    if ('reason' in read) return setSaid(read.reason);
    const made = addPattern(
      { ...read.tutorial, title: freeTitle(read.tutorial.title) },
      read.basedOn,
    );
    if (!made) return refused();
    window.location.hash = `#/edit/${made.id}`;
  };
  return (
    <span className="new-pattern">
      <button
        type="button"
        className="button"
        onClick={() => {
          const made = addPattern(
            emptyDraft('my-pattern', freeTitle('My pattern')),
          );
          if (!made) return refused();
          window.location.hash = `#/edit/${made.id}`;
        }}
      >
        New pattern
      </button>
      <label className="button secondary open-file">
        Open a pattern file
        <input
          type="file"
          accept=".json,application/json"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void readText(f).then(open);
          }}
        />
      </label>
      {said ? (
        <span className="refused" role="alert">
          {said}
        </span>
      ) : null}
    </span>
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
  const ready = Boolean(tutorial.pattern?.cell && tutorial.ink?.paths.length);
  // A finished pattern shows its wall, like a design; one still being
  // made shows its construction so far.
  const [scene, setScene] = useState<Scene>();
  const [file, setFile] = useState<unknown>();
  useEffect(() => {
    const t = setTimeout(() => {
      const found = ready ? playable(pattern.id) : undefined;
      if (found && 'entry' in found) setFile(found.entry.json);
      else setScene(check(tutorial).scene);
    }, 0);
    return () => clearTimeout(t);
  }, [tutorial, ready, pattern.id]);
  const designs =
    doing === 'delete'
      ? listDesigns().filter((d) => d.tutorial === `mine/${pattern.id}`)
      : [];
  return (
    <li className="card-item">
      <a className="card" href={`#/edit/${pattern.id}`}>
        {file ? (
          <WallThumb json={file} />
        ) : scene ? (
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
          <p>
            Delete “{tutorial.title}”? This cannot be undone.
            {designs.length
              ? ` It has ${designs.length === 1 ? 'one saved design' : `${designs.length} saved designs`}, which cannot open without it.`
              : ''}
          </p>
          <button
            type="button"
            className="button danger"
            onClick={() => {
              for (const d of designs) deleteDesign(d.id);
              deletePattern(pattern.id);
              onChange();
            }}
          >
            {designs.length ? 'Delete it and its designs' : 'Delete'}
          </button>
          {designs.length ? (
            <button
              type="button"
              className="button secondary"
              onClick={() => {
                deletePattern(pattern.id);
                onChange();
              }}
            >
              Only the pattern
            </button>
          ) : null}
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

/** The finished wall, small, loaded in the worker like a library card. */
function WallThumb({ json }: { json: unknown }) {
  const { model } = useModel(json);
  return model ? (
    <Thumbnail model={model} />
  ) : (
    <div className="thumbnail waiting" />
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
