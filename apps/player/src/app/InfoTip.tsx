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
  const [dismissed, setDismissed] = useState(false);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const escape = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (
        open ||
        root.current?.matches(':hover') ||
        root.current?.contains(document.activeElement)
      ) {
        setOpen(false);
        setDismissed(true);
      }
    };
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [open]);
  return (
    <div
      className={`info-tip${open ? ' open' : ''}${dismissed ? ' dismissed' : ''}`}
      ref={root}
      onMouseLeave={() => setDismissed(false)}
      onBlur={() => setDismissed(false)}
    >
      <button
        type="button"
        className="info-tip-button"
        aria-label={label}
        aria-expanded={open}
        aria-describedby={id}
        onClick={() => {
          setDismissed(false);
          setOpen(!open);
        }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9.5" />
          <path d="M12 11v6M12 7.5v.01" />
        </svg>
      </button>
      <div className="info-tip-bubble" role="tooltip" id={id}>
        {children}
      </div>
    </div>
  );
}
