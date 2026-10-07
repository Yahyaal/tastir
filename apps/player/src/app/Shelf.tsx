import { useState } from 'react';
import { Thumbnail } from './drawing';
import {
  BACKUP,
  deleteDesign,
  NAME_LIMIT,
  renameDesign,
  unreadableKept,
  type Design,
} from './designs';
import type { Entry } from './library';
import { PROGRESS_TEXT, useModel } from './workerClient';

const day = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

/**
 * The learner's saved designs, above the library: each drawn as its wall,
 * opening at the wall, with rename and delete (delete asks first).
 */
export function Shelf({
  designs,
  entries,
  onChange,
}: {
  designs: readonly Design[];
  entries: readonly Entry[];
  /** Called after a rename or delete, to read the designs again. */
  onChange: () => void;
}) {
  return (
    <section aria-labelledby="my-designs" className="shelf">
      <div className="collection-head">
        <h2 id="my-designs">My designs</h2>
        <p>Your own inking and colors, kept in this browser.</p>
      </div>
      {unreadableKept() ? (
        <p className="shelf-note">
          Some saved designs could not be read, perhaps from a newer version of
          Tastir. They are not lost: a copy is kept in this browser under{' '}
          <code>{BACKUP}</code>.
        </p>
      ) : null}
      <ul className="cards">
        {designs.map((d) => (
          <DesignCard
            key={d.id}
            design={d}
            entry={entries.find((e) => e.id === d.tutorial)}
            onChange={onChange}
          />
        ))}
      </ul>
    </section>
  );
}

function DesignCard({
  design,
  entry,
  onChange,
}: {
  design: Design;
  entry?: Entry;
  onChange: () => void;
}) {
  return (
    <li className="card-item">
      {entry ? (
        <DesignLink design={design} entry={entry} />
      ) : (
        <div className="card">
          <div className="thumbnail broken" />
          <h3 title={design.name}>{design.name}</h3>
          <p className="error">
            Its tutorial, {design.tutorial}, is no longer in the library.
          </p>
        </div>
      )}
      <DesignActions design={design} onChange={onChange} />
    </li>
  );
}

/** The design's wall and name, loaded in the worker like a library card. */
function DesignLink({ design, entry }: { design: Design; entry: Entry }) {
  const { model, error, progress } = useModel(entry.json, design.inked);
  return (
    <a
      className="card"
      href={`#/${design.tutorial}/design/${encodeURIComponent(design.id)}`}
    >
      {model ? (
        <Thumbnail
          model={model}
          coloring={design.coloring}
          look={design.look}
        />
      ) : (
        <div className={error ? 'thumbnail broken' : 'thumbnail waiting'} />
      )}
      <h3 title={design.name}>{design.name}</h3>
      {error ? (
        <p className="error">Cannot be played: {error}</p>
      ) : (
        <p className="meta">
          <span>
            {model?.tutorial.title ?? PROGRESS_TEXT[progress ?? 'checking']}
          </span>
          <span>{day(design.updated)}</span>
        </p>
      )}
    </a>
  );
}

/** Rename in place, and delete after asking. */
function DesignActions({
  design,
  onChange,
}: {
  design: Design;
  onChange: () => void;
}) {
  const [doing, setDoing] = useState<'rename' | 'delete'>();
  const [name, setName] = useState(design.name);
  if (doing === 'rename')
    return (
      <form
        className="card-actions design-rename"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          renameDesign(design.id, name.trim());
          setDoing(undefined);
          onChange();
        }}
      >
        <input
          type="text"
          aria-label={`New name for ${design.name}`}
          value={name}
          maxLength={NAME_LIMIT}
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
    );
  if (doing === 'delete')
    return (
      <div className="card-actions design-delete" role="group">
        <p>Delete “{design.name}”? This cannot be undone.</p>
        <button
          type="button"
          className="button danger"
          onClick={() => {
            deleteDesign(design.id);
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
    );
  return (
    <div className="card-actions">
      <button
        type="button"
        className="button secondary"
        onClick={() => {
          setName(design.name);
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
  );
}
