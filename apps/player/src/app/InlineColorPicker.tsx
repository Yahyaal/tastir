import { useId, useRef, useState } from 'react';

const SWATCHES = [
  '#ffffff',
  '#e6dcc7',
  '#c9ad7f',
  '#a64c35',
  '#96603c',
  '#d6ac46',
  '#bfc8d0',
  '#23201c',
  '#708d87',
  '#234a79',
  '#21443c',
  '#641c29',
];
const CHANNELS = ['Red', 'Green', 'Blue'] as const;
const valid = (color: string) => /^#[0-9a-f]{6}$/i.test(color);

/** An inline editor avoids native color popups outside the browser edge. */
export function InlineColorPicker({
  label,
  color,
  onChange,
}: {
  label: string;
  color: string;
  onChange: (color: string) => void;
}) {
  const id = useId();
  const swatchRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<{ base: string; text: string }>();
  const text = draft?.base === color ? draft.text : color;
  const invalid = !valid(text);
  const channels = [1, 3, 5].map((at) => parseInt(color.slice(at, at + 2), 16));
  const choose = (next: string) => {
    setDraft(undefined);
    onChange(next);
  };
  return (
    <div className="inline-color">
      <label htmlFor={id}>{label}</label>
      <div className="inline-color-value">
        <button
          ref={swatchRef}
          type="button"
          className="inline-color-swatch"
          style={{ backgroundColor: color }}
          aria-label={`Choose ${label.toLowerCase()}`}
          aria-expanded={open}
          aria-controls={`${id}-picker`}
          onClick={() => setOpen(!open)}
        />
        <input
          id={id}
          type="text"
          value={text}
          maxLength={7}
          spellCheck={false}
          autoComplete="off"
          aria-invalid={invalid}
          aria-describedby={invalid ? `${id}-error` : undefined}
          onChange={(e) => {
            const next = e.target.value;
            setDraft({ base: color, text: next });
            if (valid(next)) onChange(next.toLowerCase());
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setDraft(undefined);
              setOpen(false);
              swatchRef.current?.focus();
            } else if (e.key === 'Enter' && valid(text)) {
              choose(text.toLowerCase());
            }
          }}
          onBlur={() => setDraft(undefined)}
        />
      </div>
      {invalid ? (
        <span id={`${id}-error`} className="hint">
          Use six hex digits, like #234a79.
        </span>
      ) : null}
      {open ? (
        <div
          id={`${id}-picker`}
          className="inline-color-picker"
          role="group"
          aria-label={`${label} picker`}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setOpen(false);
              swatchRef.current?.focus();
            }
          }}
        >
          <div className="inline-color-presets">
            {SWATCHES.map((swatch) => (
              <button
                key={swatch}
                type="button"
                className="inline-color-swatch"
                style={{ backgroundColor: swatch }}
                aria-label={`Use ${swatch}`}
                aria-pressed={color.toLowerCase() === swatch}
                onClick={() => choose(swatch)}
              />
            ))}
          </div>
          {CHANNELS.map((channel, index) => (
            <label key={channel} className="inline-color-channel">
              {channel}
              <input
                type="range"
                min={0}
                max={255}
                step={1}
                value={channels[index]}
                aria-label={`${label}: ${channel}`}
                onChange={(e) => {
                  const next = channels.map((n, i) =>
                    i === index ? Number(e.target.value) : n,
                  );
                  choose(
                    '#' +
                      next.map((n) => n.toString(16).padStart(2, '0')).join(''),
                  );
                }}
              />
              <output>{channels[index]}</output>
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}
