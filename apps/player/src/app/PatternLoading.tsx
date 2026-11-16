import { useId } from 'react';
import { LIBRARY } from './library';
import { PROGRESS_TEXT, type Progress } from './workerClient';

/** Real preparation stages, with the pattern visible while its geometry loads. */
export function PatternLoading({
  address,
  progress = 'checking',
}: {
  address?: string;
  progress?: Progress;
}) {
  const heading = useId();
  const entry = LIBRARY.find((item) => item.id === address);
  const preview = entry?.preview;
  const stages = ['checking', 'drawing', 'pieces'] as const;
  const at = stages.indexOf(progress);
  return (
    <main className="player pattern-loading" aria-labelledby={heading}>
      <a className="pattern-loading-home" href="#/">
        ← All patterns
      </a>
      <div className="pattern-loading-card">
        {preview ? (
          <img
            className="pattern-loading-preview"
            src={
              import.meta.env.BASE_URL +
              (preview.thumbnailSmall ?? preview.thumbnail)
            }
            width="240"
            height="240"
            alt=""
          />
        ) : (
          <svg
            className="pattern-loading-preview"
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            <path
              d="M50 6 63 32 94 50 63 63 50 94 37 63 6 50 37 37Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <circle
              cx="50"
              cy="50"
              r="32"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
          </svg>
        )}
        <h1 id={heading}>Opening {preview?.title ?? 'your pattern'}</h1>
        <p role="status">{PROGRESS_TEXT[progress]}</p>
        <ol
          className="pattern-loading-stages"
          aria-label="Preparing your pattern"
        >
          {stages.map((stage, index) => (
            <li
              key={stage}
              className={index < at ? 'complete' : ''}
              aria-current={index === at ? 'step' : undefined}
            >
              <span aria-hidden="true">{index + 1}</span>
              {
                ['Check instructions', 'Draw construction', 'Find pieces'][
                  index
                ]
              }
            </li>
          ))}
        </ol>
        <p className="pattern-loading-hint">
          Preparing the construction and its inked pieces.
        </p>
      </div>
    </main>
  );
}
