import { useEffect, useRef, type RefObject } from 'react';

/** Keyboard containment and focus return for modal viewers and confirmations. */
export function useModalFocus(
  dialog: RefObject<HTMLElement | null>,
  closeButton: RefObject<HTMLElement | null>,
  onClose: () => void,
  returnRoot: string,
  returnTarget: string,
) {
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const origin = opener?.closest(returnRoot);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === 'Escape') {
        e.preventDefault();
        close.current();
      } else if (e.key === 'Tab') {
        const controls = [
          ...el.querySelectorAll<HTMLElement>(
            'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
          ),
        ].filter(
          (control) =>
            !control.closest('[hidden], [inert], [aria-hidden="true"]'),
        );
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (
          !el.contains(document.activeElement) ||
          (e.shiftKey
            ? document.activeElement === first
            : document.activeElement === last)
        ) {
          e.preventDefault();
          (e.shiftKey ? last : first)?.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = overflow;
      const target = opener?.isConnected
        ? opener
        : origin?.querySelector<HTMLElement>(returnTarget);
      target?.focus({ preventScroll: true });
    };
  }, [dialog, closeButton, returnRoot, returnTarget]);
  // A failed image or changed tab can remove the currently focused control.
  useEffect(() => {
    if (!dialog.current?.contains(document.activeElement))
      closeButton.current?.focus({ preventScroll: true });
  });
}
