import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

/**
 * A small ⓘ that says a longer text in a bubble: on hover or focus, and on
 * a tap for a phone, which has no hover. A tap elsewhere or Escape closes it.
 */
export function InfoTip({
  label,
  children,
}: {
  /** What the button is called, such as “How to colour”. */
  label: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const root = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', away);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);
  return (
    <span className={`info-tip${open ? ' open' : ''}`} ref={root}>
      <button
        type="button"
        className="info-tip-button"
        aria-label={label}
        aria-expanded={open}
        aria-describedby={id}
        onClick={() => setOpen(!open)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9.5" />
          <path d="M12 11v6M12 7.5v.01" />
        </svg>
      </button>
      <span className="info-tip-bubble" role="tooltip" id={id}>
        {children}
      </span>
    </span>
  );
}
