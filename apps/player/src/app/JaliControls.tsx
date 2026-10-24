import { JaliFinishSample } from './jaliTexture';
import { useRef } from 'react';
import type { JaliAppearance } from '@tastir/schema';
import { DEFAULT_JALI, JALI_FINISHES, JALI_MATERIALS, sameJali } from './jali';

const BACKGROUNDS = [
  { name: 'Courtyard', color: '#708d87' },
  { name: 'Night blue', color: '#234a79' },
  { name: 'Charcoal', color: '#23201c' },
  { name: 'Ivory', color: '#e6dcc7' },
];

/** Open the native picker directly, anchored away from the browser's right edge. */
export function CustomColor({
  label,
  color,
  selected,
  onChange,
}: {
  label: string;
  color: string;
  selected: boolean;
  onChange: (color: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="jali-custom-color">
      <button
        type="button"
        className="jali-custom-button"
        aria-label={`Custom ${label.toLowerCase()}`}
        aria-pressed={selected}
        onClick={() => {
          const picker = input.current;
          if (!picker) return;
          if (typeof picker.showPicker === 'function') picker.showPicker();
          else picker.click();
        }}
      >
        <span
          className="jali-custom-swatch"
          style={{ background: color }}
          aria-hidden="true"
        />
        Custom color
      </button>
      <input
        ref={input}
        className="jali-native-color"
        type="color"
        value={color}
        aria-label={label}
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function JaliControls({
  appearance,
  onChange,
}: {
  appearance: JaliAppearance;
  onChange: (appearance: JaliAppearance) => void;
}) {
  const finishes = JALI_FINISHES.filter(
    (p) => p.material === appearance.material,
  );
  return (
    <section>
      <h2>Jali finish</h2>
      <div className="jali-controls">
        <div className="jali-materials" role="group" aria-label="Material">
          {JALI_MATERIALS.map((p) => (
            <button
              key={p.material}
              type="button"
              aria-pressed={appearance.material === p.material}
              onClick={() => {
                if (appearance.material === p.material) return;
                const preset = JALI_FINISHES.find(
                  (f) => f.material === p.material,
                )!;
                onChange({
                  ...appearance,
                  material: preset.material,
                  finish: preset.finish,
                  framework: preset.color,
                });
              }}
            >
              {p.name}
            </button>
          ))}
        </div>
        <div
          className="jali-finishes"
          role="group"
          aria-label="Framework finishes"
        >
          {finishes.map((p) => (
            <button
              key={p.finish}
              type="button"
              className="jali-finish-button"
              aria-pressed={
                appearance.finish === p.finish &&
                appearance.framework.toLowerCase() === p.color
              }
              onClick={() =>
                onChange({
                  ...appearance,
                  finish: p.finish,
                  framework: p.color,
                })
              }
            >
              <JaliFinishSample
                appearance={{
                  ...appearance,
                  material: p.material,
                  finish: p.finish,
                  framework: p.color,
                }}
              />
              <span>{p.name}</span>
            </button>
          ))}
        </div>
        <CustomColor
          label="Framework color"
          color={appearance.framework}
          selected={
            !finishes.some(
              (p) =>
                p.finish === appearance.finish &&
                p.color === appearance.framework.toLowerCase(),
            )
          }
          onChange={(framework) =>
            onChange({ ...appearance, framework, finish: 'custom' })
          }
        />
        <h3 className="jali-background-heading">Background</h3>
        <div className="chooser" role="group" aria-label="Background colors">
          {BACKGROUNDS.map((p) => (
            <button
              key={p.color}
              type="button"
              className={
                p.color === appearance.background.toLowerCase()
                  ? 'swatch-button current'
                  : 'swatch-button'
              }
              style={{ background: p.color }}
              aria-label={`${p.name} background`}
              title={p.name}
              aria-pressed={p.color === appearance.background.toLowerCase()}
              onClick={() => onChange({ ...appearance, background: p.color })}
            />
          ))}
        </div>
        <CustomColor
          label="Background color"
          color={appearance.background}
          selected={
            !BACKGROUNDS.some(
              (p) => p.color === appearance.background.toLowerCase(),
            )
          }
          onChange={(background) => onChange({ ...appearance, background })}
        />
      </div>
      <button
        type="button"
        className="quiet"
        disabled={sameJali(appearance)}
        onClick={() => onChange(DEFAULT_JALI)}
      >
        Reset Jali finish
      </button>
    </section>
  );
}
