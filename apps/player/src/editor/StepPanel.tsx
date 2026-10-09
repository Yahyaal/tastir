import { useState } from 'react';
import { type Draft, type StepStatus } from './document';
import './editor.css';

const STATUS_OK =
  'This step works: everything in it is exact and only one figure fits.';

/** How much of a step's text the step list shows. */
/** The selected step: its text, how it stands, and what is saved. */
export function StepPanel({
  id,
  text,
  create,
  status,
  last,
  dependents: built,
  tile,
  onTile,
  say,
  motif,
  onText,
  onMove,
  onDelete,
  onSaveBlock,
}: {
  draft: Draft;
  id: number;
  text: string;
  create: unknown;
  status?: StepStatus;
  last: number;
  dependents: readonly number[];
  /** The tile's polygon, if one is chosen. */
  tile?: string;
  /** Whether a polygon is part of the motif rather than a tile. */
  motif: (name: string) => boolean;
  /** An element in plain words, to tell two shapes apart. */
  say: (name: string) => string;
  /** Makes a polygon the tile; the reason when it cannot repeat. */
  onTile: (polygon: string) => string | undefined;
  onText: (text: string) => void;
  onMove: (to: number) => void;
  onDelete: (withDependents: boolean) => void;
  /** Keeps steps from this one to `to` as a block; what happened. */
  onSaveBlock: (to: number, name: string) => string;
}) {
  const [asking, setAsking] = useState(false);
  const [blockTo, setBlockTo] = useState(id);
  const [blockName, setBlockName] = useState('');
  const [blockSaid, setBlockSaid] = useState<string>();
  const [notTile, setNotTile] = useState<string>();
  const polygons = Object.entries(
    (create ?? {}) as Record<string, Record<string, unknown>>,
  )
    .filter(([, el]) => 'polygon' in el)
    .map(([name]) => name);
  const steps = (ns: readonly number[]) =>
    ns.length === 1
      ? `step ${ns[0]}`
      : `steps ${ns.slice(0, -1).join(', ')} and ${ns.at(-1)}`;
  return (
    <>
      <section>
        <h2>Step {id}</h2>
        <label className="step-text">
          Text the learner reads
          <textarea
            value={text}
            rows={5}
            onChange={(e) => onText(e.target.value)}
          />
        </label>
        {status?.ok === false ? (
          <p className="step-status broken" role="alert">
            ✗ This step is broken. {status.reason}
          </p>
        ) : (
          <p className="step-status ok">✓ {STATUS_OK}</p>
        )}
        <p className="dot-key">
          <span className="new">orange: what this step makes</span>
          <span className="used">blue: what it works from</span>
        </p>
      </section>
      <section>
        <h2>Change it</h2>
        <div className="wall-tools">
          <button
            type="button"
            className="secondary"
            disabled={id === 1}
            onClick={() => onMove(id - 1)}
          >
            Move up
          </button>
          <button
            type="button"
            className="secondary"
            disabled={id === last}
            onClick={() => onMove(id + 1)}
          >
            Move down
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => (built.length ? setAsking(true) : onDelete(false))}
          >
            Delete
          </button>
        </div>
        {asking ? (
          <div className="delete-check" role="group" aria-label="Delete">
            <p>
              Step {id} is used by {steps(built)}, which would break without it.
            </p>
            <button
              type="button"
              onClick={() => {
                setAsking(false);
                onDelete(true);
              }}
            >
              Delete {built.length === 1 ? 'both' : `all ${built.length + 1}`}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setAsking(false);
                onDelete(false);
              }}
            >
              Only step {id}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => setAsking(false)}
            >
              Keep
            </button>
          </div>
        ) : null}
      </section>
      {polygons.length ? (
        <section>
          <h2>The tile</h2>
          {polygons.map((name) =>
            motif(name) ? (
              <p key={name} className="hint">
                This shape is part of the pattern, not a tile that holds it. For
                a star or rosette, draw a square (or hexagon) around the circle,
                touching it, and use its corners as the tile.
              </p>
            ) : name === tile ? (
              <p key={name} className="step-status ok">
                ✓{' '}
                {polygons.length > 1
                  ? `${say(name)[0]?.toUpperCase()}${say(name).slice(1)}`
                  : 'This shape'}{' '}
                is the tile that repeats.
              </p>
            ) : (
              <button
                key={name}
                type="button"
                className="secondary"
                onClick={() => setNotTile(onTile(name))}
              >
                Use {polygons.length > 1 ? say(name) : 'this shape'} as the tile
              </button>
            ),
          )}
          {notTile ? (
            <p className="step-status broken" role="alert">
              {notTile}
            </p>
          ) : null}
        </section>
      ) : null}
      <section className="save-block">
        <h2>Save as a building block</h2>
        <div className="about-row">
          <label>
            Steps {id} to
            <select
              value={blockTo}
              onChange={(e) => setBlockTo(Number(e.target.value))}
            >
              {Array.from({ length: last - id + 1 }, (_, i) => id + i).map(
                (n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ),
              )}
            </select>
          </label>
          <label>
            Block name
            <input
              type="text"
              value={blockName}
              maxLength={60}
              onChange={(e) => setBlockName(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="secondary"
            disabled={!blockName.trim()}
            onClick={() => setBlockSaid(onSaveBlock(blockTo, blockName))}
          >
            Save the block
          </button>
        </div>
        {blockSaid ? (
          <p className="hint" role="status">
            {blockSaid}
          </p>
        ) : null}
      </section>
      <section>
        <details className="saved-form">
          <summary>Show the saved form</summary>
          <code className="step-json">{JSON.stringify(create, null, 2)}</code>
        </details>
      </section>
    </>
  );
}
