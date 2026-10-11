import type { JaliAppearance } from '@tastir/schema';
import { DEFAULT_JALI, JALI_MATERIALS, sameJali } from './jali';
import { InlineColorPicker } from './InlineColorPicker';

export function JaliControls({
  appearance,
  onChange,
}: {
  appearance: JaliAppearance;
  onChange: (appearance: JaliAppearance) => void;
}) {
  return (
    <section>
      <h2>Jali finish</h2>
      <div className="jali-controls">
        <label>
          Material
          <select
            value={appearance.material}
            onChange={(e) => {
              const preset = JALI_MATERIALS.find(
                (p) => p.material === e.target.value,
              );
              if (preset)
                onChange({
                  ...appearance,
                  material: preset.material,
                  framework: preset.color,
                });
            }}
          >
            {JALI_MATERIALS.map((p) => (
              <option key={p.material} value={p.material}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <InlineColorPicker
          label="Framework color"
          color={appearance.framework}
          onChange={(framework) => onChange({ ...appearance, framework })}
        />
        <InlineColorPicker
          label="Background color"
          color={appearance.background}
          onChange={(background) => onChange({ ...appearance, background })}
        />
      </div>
      <p className="hint">
        Materials set a starting framework color. Adjust either color to make it
        your own.
      </p>
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
