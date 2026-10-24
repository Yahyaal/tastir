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
 * width of its lines (the grout, for tiles), bands or lattice.
 */
export function WallControls({
  style,
  onStyle,
  grout,
  onGrout,
  sample,
}: {
  style: WallStyle;
  onStyle: (style: WallStyle) => void;
  grout: number;
  onGrout: (grout: number) => void;
  /** A small picture of the wall in a style. */
  sample: (style: WallStyle) => ReactNode;
}) {
  const id = useId();
  const jali = style === 'jali';
  // The lines style always draws a line, however thin.
  const least = jali ? 0.5 : style === 'lines' ? 0.25 : 0;
  const width = Math.max(least, grout);
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
          {jali ? 'Lattice' : banded(style) ? 'Band width' : 'Line width'}
        </label>
        <input
          id={id}
          type="range"
          min={least}
          max={3}
          step={0.25}
          value={width}
          onChange={(e) => onGrout(Number(e.target.value))}
        />
        <output htmlFor={id} aria-hidden="true">
          {width === 0 ? 'none' : `${width}×`}
        </output>
      </div>
      <p className="hint">
        {jali ? 'An open screen. Switch styles to see your tile colors. ' : ''}
        Drag to move along the wall, scroll to zoom.
      </p>
    </section>
  );
}
