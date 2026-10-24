import { useState } from 'react';
import { isHidden } from './library';

/**
 * Dev server only: hides this pattern from the library on the live site,
 * or shows it again. The dev server writes the choice into hidden.json
 * (the /__hidden endpoint in vite.config.mts), and it reaches the live site
 * with the next push.
 */
export function HideToggle({ id }: { id: string }) {
  const [hidden, setHidden] = useState(() => isHidden(id));
  const [failed, setFailed] = useState(false);
  const toggle = async () => {
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
    }
  };
  return (
    <div className="hide-toggle">
      <button
        type="button"
        className="quiet"
        title="The dev server always lists every pattern; hidden ones carry a badge."
        onClick={() => void toggle()}
      >
        {hidden ? 'Show in the library' : 'Hide from the library'}
      </button>
      {failed ? (
        <p className="error" role="alert">
          The dev server could not save this.
        </p>
      ) : null}
    </div>
  );
}
