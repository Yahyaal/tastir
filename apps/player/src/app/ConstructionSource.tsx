import { useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useModalFocus } from './useModalFocus';
import './ConstructionSource.css';
import type { Tutorial } from '@tastir/schema';

const bases = {
  instructions: 'Based on published instructions',
  mixed: 'Published instructions with our own additions',
  reconstruction: 'Construction worked out from a finished design',
  original: 'Construction developed for Tastir',
  standard: 'Standard compass and ruler construction',
  undocumented: 'Construction source not established',
} as const;

const fidelity = {
  close: 'Close correspondence is documented for the sourced construction.',
  adapted: 'The source has been adapted; the changes are described below.',
  unassessed:
    'How closely the current sequence follows the source is not fully checked.',
  'not-applicable': 'There is no published sequence to compare step by step.',
} as const;

/** The construction's origin is different from its historical verification. */
export function ConstructionSource({ tutorial }: { tutorial: Tutorial }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const source = tutorial.construction;
  if (!source) return null;
  return (
    <>
      <button
        type="button"
        className="quiet construction-source-launch"
        onClick={() => setOpen(true)}
      >
        How this construction was made
      </button>
      {open ? (
        <SourceDialog tutorial={tutorial} source={source} onClose={close} />
      ) : null}
    </>
  );
}

function SourceDialog({
  tutorial,
  source,
  onClose,
}: {
  tutorial: Tutorial;
  source: NonNullable<Tutorial['construction']>;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  useModalFocus(
    dialog,
    closeButton,
    onClose,
    '.caption',
    '.construction-source-launch',
  );
  return createPortal(
    <div
      className="construction-source-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialog}
        className="construction-source-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="How this construction was made"
      >
        <header>
          <h2>How this construction was made</h2>
          <button ref={closeButton} type="button" onClick={onClose}>
            Close
          </button>
        </header>
        <div className="construction-source-body">
          <p>
            <strong>{bases[source.basis]}</strong>
          </p>
          <p>{source.note}</p>
          <p>{fidelity[source.fidelity]}</p>
          <p>{source.changes}</p>
          {tutorial.credits.some((credit) => credit.url) ? (
            <ul>
              {tutorial.credits
                .filter((credit) => credit.url)
                .map((credit, i) => (
                  <li key={`${credit.url}-${i}`}>
                    <a href={credit.url} target="_blank" rel="noreferrer">
                      {credit.source}
                      {credit.creator ? ` — ${credit.creator}` : ''}
                    </a>
                    {credit.note ? <p>{credit.note}</p> : null}
                  </li>
                ))}
            </ul>
          ) : null}
          <p>
            Reviewed {source.reviewed}. This describes the construction’s
            source; historical matching is assessed separately.
          </p>
        </div>
      </section>
    </div>,
    document.body,
  );
}
