import { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useModalFocus } from './useModalFocus';

const BACKGROUNDS = [
  '#ffffff',
  '#e6dcc7',
  '#c9ad7f',
  '#a64c35',
  '#23201c',
  '#708d87',
  '#234a79',
  '#21443c',
  '#641c29',
];

/** The usual palette swatches and native Any color input, away from the right edge. */
export function JaliColorChooser({
  label,
  color,
  swatches,
  onChange,
  onClose,
}: {
  label: string;
  color: string;
  swatches?: readonly { name: string; color: string }[];
  onChange: (color: string) => void;
  onClose: () => void;
}) {
  const id = useId();
  const dialog = useRef<HTMLDivElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  useModalFocus(dialog, close, onClose, '.player', '.jali-controls button');
  const choices =
    swatches ?? BACKGROUNDS.map((value) => ({ name: value, color: value }));
  return createPortal(
    <div className="jali-color-backdrop">
      <div
        ref={dialog}
        className="jali-color-dialog player"
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
      >
        <div className="jali-color-heading">
          <h2 id={id}>{label}</h2>
          <button ref={close} type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="chooser" role="group" aria-label={`${label} swatches`}>
          {choices.map((p) => (
            <button
              key={p.color}
              type="button"
              className={
                p.color.toLowerCase() === color.toLowerCase()
                  ? 'swatch-button current'
                  : 'swatch-button'
              }
              style={{ background: p.color }}
              aria-label={`${p.name} (${p.color})`}
              onClick={() => onChange(p.color)}
            />
          ))}
        </div>
        <label className="any-color">
          <input
            type="color"
            aria-label={label}
            value={color}
            onChange={(e) => onChange(e.target.value)}
          />{' '}
          Any color
        </label>
      </div>
    </div>,
    document.body,
  );
}
