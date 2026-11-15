import { useState } from 'react';
import { isHidden } from './library';

/** The action icon shared by the real visibility control and its preview. */
export function VisibilityIcon({ hidden }: { hidden: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      {!hidden && <path d="M3 3l18 18" />}
    </svg>
  );
}

/**
 * Dev server only: hides this pattern from the library on the live site,
 * or shows it again. The dev server writes the choice into hidden.json
 * (the /__hidden endpoint in vite.config.mts), and it reaches the live site
 * with the next push.
 */
export function HideToggle({ id }: { id: string }) {
  const [hidden, setHidden] = useState(() => isHidden(id));
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch('/__hidden', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, hidden: !hidden }),
      });
      if (!res.ok) throw new Error(await res.text());
      setHidden(!hidden);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="hide-toggle">
      <button
        type="button"
        className="visibility-action"
        disabled={busy}
        aria-busy={busy}
        title="The dev server always lists every pattern; hidden ones carry a badge."
        onClick={() => void toggle()}
      >
        <VisibilityIcon hidden={hidden} />
        {busy
          ? 'Saving…'
          : hidden
            ? 'Show in the library'
            : 'Hide from the library'}
      </button>
      {failed ? (
        <p className="error" role="alert">
          The dev server could not save this.
        </p>
      ) : null}
    </div>
  );
}
