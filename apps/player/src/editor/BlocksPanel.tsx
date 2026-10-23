import { useState } from 'react';
import { deleteBlock, listBlocks, STARTER_BLOCKS, type Block } from './blocks';
import './editor.css';

/** The building blocks to insert: the starter shelf and the learner's own. */
export function BlocksPanel({
  hasCircle,
  onUse,
}: {
  /** Whether there is a circle to work on yet. */
  hasCircle: boolean;
  onUse: (block: Block) => void;
}) {
  const [mine, setMine] = useState(listBlocks);
  const [asking, setAsking] = useState<string>();
  const card = (b: Block, own: boolean) => (
    <li key={b.id} className="block-card">
      <button type="button" className="secondary" onClick={() => onUse(b)}>
        {b.name}
      </button>
      <span className="hint">{b.text}</span>
      {own ? (
        asking === b.id ? (
          <span className="block-delete">
            Delete this block?{' '}
            <button
              type="button"
              className="quiet"
              onClick={() => {
                deleteBlock(b.id);
                setMine(listBlocks());
                setAsking(undefined);
              }}
            >
              Delete
            </button>
            <button
              type="button"
              className="quiet"
              onClick={() => setAsking(undefined)}
            >
              Keep
            </button>
          </span>
        ) : (
          <button
            type="button"
            className="quiet"
            onClick={() => setAsking(b.id)}
          >
            Delete {b.name}
          </button>
        )
      ) : null}
    </li>
  );
  return (
    <>
      <section className="blocks">
        <h2>Building blocks</h2>
        <p className="hint">
          A few steps at once. Choose one, then click what it asks for; its
          steps are added as ordinary steps, using what is already drawn.
        </p>
        {hasCircle ? null : (
          <p className="hint lost">
            These blocks work on a circle: draw one with the Circle tool first
            (click O, then A).
          </p>
        )}
        <ul>{STARTER_BLOCKS.map((b) => card(b, false))}</ul>
      </section>
      {mine.length ? (
        <section className="blocks">
          <h2>My blocks</h2>
          <ul>{mine.map((b) => card(b, true))}</ul>
        </section>
      ) : null}
    </>
  );
}
