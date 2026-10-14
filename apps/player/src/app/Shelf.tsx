import { useMemo, useState } from 'react';
import { playable } from '../editor/patterns';
import { Thumbnail } from './drawing';
import {
  BACKUP,
  deleteDesign,
  NAME_LIMIT,
  renameDesign,
  unreadableKept,
  unreadableNow,
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
        <h3 id="my-designs">My designs</h3>
        <p>Your own inking and colors, kept in this browser.</p>
      </div>
      {unreadableNow() || unreadableKept() ? (
        <p className="shelf-note" role="note">
          Some saved designs could not be read, perhaps because they were made
          by a newer version of Tastir. They are not lost:{' '}
          {unreadableNow()
            ? 'they are left as they are, and kept aside when you next save'
            : 'a copy is kept in this browser'}{' '}
          under <code>{BACKUP}</code>.
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

/** A design's card; without actions (the home page's row) it is only
 * the link to its wall. */
export function DesignCard({
  design,
  entry,
  onChange,
  actions = true,
}: {
  design: Design;
  entry?: Entry;
  onChange: () => void;
  actions?: boolean;
}) {
  // A design of the learner's own pattern (mine/<id>) is drawn from the
  // pattern kept in this browser.
  // Read again whenever the list is (the design object is new each time),
  // so a pattern deleted meanwhile shows as deleted.
  const own = useMemo(() => {
    const id = /^mine\/(.+)$/.exec(design.tutorial)?.[1];
    return id === undefined ? undefined : playable(id);
  }, [design]);
  const ownEntry = own && 'entry' in own ? own.entry : undefined;
  const shown = entry ?? ownEntry;
  return (
    <li className="card-item">
      {shown ? (
        <DesignLink design={design} entry={shown} />
      ) : (
        <div className="card">
          <div className="thumbnail broken" />
          <h4 title={design.name}>{design.name}</h4>
          <p className="error">
            {design.tutorial.startsWith('mine/')
              ? own === undefined
                ? 'Its pattern was deleted, so it cannot open. You can delete it too.'
                : 'Its pattern cannot be played now: open the pattern in the editor to mend it.'
              : `Its tutorial, ${design.tutorial}, is no longer in the library.`}
          </p>
        </div>
      )}
      {actions ? <DesignActions design={design} onChange={onChange} /> : null}
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
          grout={design.grout}
          jali={design.jali}
        />
      ) : (
        <div className={error ? 'thumbnail broken' : 'thumbnail waiting'} />
      )}
      <h4 title={design.name}>{design.name}</h4>
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
