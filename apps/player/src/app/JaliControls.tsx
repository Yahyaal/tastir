import { useState } from 'react';
import type { JaliAppearance } from '@tastir/schema';
import { DEFAULT_JALI, JALI_FINISHES, JALI_MATERIALS, sameJali } from './jali';
import { JaliColorChooser } from './JaliColorChooser';

export function JaliControls({
  appearance,
  onChange,
}: {
  appearance: JaliAppearance;
  onChange: (appearance: JaliAppearance) => void;
}) {
  const [choosing, setChoosing] = useState<'framework' | 'background'>();
  const finishes = JALI_FINISHES.filter(
    (p) => p.material === appearance.material,
  );
  return (
    <section>
      <h2>Jali finish</h2>
      <div className="jali-controls">
        <label>
          Material
          <select
            value={appearance.material}
            onChange={(e) => {
              const preset = JALI_FINISHES.find(
                (p) => p.material === e.target.value,
              );
              if (preset)
                onChange({
                  ...appearance,
                  material: preset.material,
                  finish: preset.finish,
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
          Finish
          <select
            value={appearance.finish}
            onChange={(e) => {
              const preset = finishes.find((p) => p.finish === e.target.value);
              if (preset)
                onChange({
                  ...appearance,
                  finish: preset.finish,
                  framework: preset.color,
                });
              else {
                onChange({ ...appearance, finish: 'custom' });
                setChoosing('framework');
              }
            }}
          >
            {finishes.map((p) => (
              <option key={p.finish} value={p.finish}>
                {p.name}
              </option>
            ))}
            <option value="custom">Custom color</option>
          </select>
        </label>
        {(['framework', 'background'] as const).map((key) => (
          <div key={key} className="jali-color-row">
            <span>
              {key === 'framework' ? 'Framework color' : 'Background color'}
            </span>
            <button
              type="button"
              className="swatch-button"
              style={{ background: appearance[key] }}
              aria-label={`Choose ${key} color`}
              aria-haspopup="dialog"
              onClick={() => setChoosing(key)}
            />
          </div>
        ))}
      </div>
      <p className="hint">
        Choose a finish, or use your own color. The background is independent.
      </p>
      <button
        type="button"
        className="quiet"
        disabled={sameJali(appearance)}
        onClick={() => onChange(DEFAULT_JALI)}
      >
        Reset Jali finish
      </button>
      {choosing ? (
        <JaliColorChooser
          label={
            choosing === 'framework' ? 'Framework color' : 'Background color'
          }
          color={appearance[choosing]}
          onClose={() => setChoosing(undefined)}
          swatches={
            choosing === 'framework'
              ? finishes.map((p) => ({ name: p.name, color: p.color }))
              : undefined
          }
          onChange={(color) =>
            onChange({
              ...appearance,
              [choosing]: color,
              ...(choosing === 'framework'
                ? {
                    finish:
                      finishes.find(
                        (p) => p.color.toLowerCase() === color.toLowerCase(),
                      )?.finish ?? 'custom',
                  }
                : {}),
            })
          }
        />
      ) : null}
    </section>
  );
}
