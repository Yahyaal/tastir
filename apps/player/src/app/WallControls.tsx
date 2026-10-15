import { useId, type ReactNode } from 'react';
import { banded, WALL_STYLES, type WallStyle } from './Wall';

const STYLE_NAMES: Record<WallStyle, string> = {
  tiles: 'Tiles',
  strapwork: 'Strapwork',
  interlace: 'Interlace',
  lines: 'Lines',
  jali: 'Jali',
};

/**
 * The finished wall's own controls: its style as samples to click (the
 * learner's own pattern and colours in each style), the
 * width of its grout, bands or lattice, and the original photo beside it.
 */
export function WallControls({
  style,
  onStyle,
  grout,
  onGrout,
  comparing,
  onCompare,
  sample,
}: {
  style: WallStyle;
  onStyle: (style: WallStyle) => void;
  grout: number;
  onGrout: (grout: number) => void;
  /** Whether the original is beside the wall; absent when there is none. */
  comparing?: boolean;
  onCompare: (comparing: boolean) => void;
  /** A small picture of the wall in a style. */
  sample: (style: WallStyle) => ReactNode;
}) {
  const id = useId();
  const jali = style === 'jali';
  const width = jali ? Math.max(0.5, grout) : grout;
  return (
    <section className="wall-section">
      <h2>The wall</h2>
      <div className="wall-styles" role="group" aria-label="Style">
        {WALL_STYLES.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={s === style}
            onClick={() => onStyle(s)}
          >
            <span className="style-sample">{sample(s)}</span>
            <span>{STYLE_NAMES[s]}</span>
          </button>
        ))}
      </div>
      <div className="wall-width">
        <label htmlFor={id}>
          {jali ? 'Lattice' : banded(style) ? 'Band' : 'Grout'}
        </label>
        <input
          id={id}
          type="range"
          min={jali ? 0.5 : 0}
          max={3}
          step={0.25}
          value={width}
          onChange={(e) => onGrout(Number(e.target.value))}
        />
        <output htmlFor={id} aria-hidden="true">
          {width === 0 ? 'none' : `${width}×`}
        </output>
      </div>
      {comparing === undefined ? null : (
        <button
          type="button"
          className="compare-toggle"
          aria-pressed={comparing}
          title="A photo of the real pattern, beside the wall. Click it to see it at full size."
          onClick={() => onCompare(!comparing)}
        >
          {comparing ? 'Hide the original' : 'Compare with the original'}
        </button>
      )}
      <p className="hint">
        {jali ? 'An open screen. Switch styles to see your tile colors. ' : ''}
        Drag to move along the wall, scroll to zoom.
      </p>
    </section>
  );
}
