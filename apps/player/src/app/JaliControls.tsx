import type { JaliAppearance } from '@tastir/schema';
import { DEFAULT_JALI, JALI_MATERIALS, sameJali } from './jali';

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
        <label>
          Framework color
          <input
            type="color"
            value={appearance.framework}
            onChange={(e) =>
              onChange({ ...appearance, framework: e.target.value })
            }
          />
        </label>
        <label>
          Background color
          <input
            type="color"
            value={appearance.background}
            onChange={(e) =>
              onChange({ ...appearance, background: e.target.value })
            }
          />
        </label>
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
