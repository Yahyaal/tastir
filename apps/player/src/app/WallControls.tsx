import { useId } from 'react';
import { banded, WALL_STYLES, type WallStyle } from './Wall';

const STYLE_NAMES: Record<WallStyle, string> = {
  tiles: 'Tiles',
  strapwork: 'Strapwork',
  interlace: 'Interlace',
  lines: 'Lines',
  jali: 'Jali',
};

/** An eight-pointed star in a 40 by 40 box, the same in every sample. */
const STAR = Array.from({ length: 16 }, (_, k) => {
  const r = k % 2 ? 7.4 : 15;
  const a = (k * Math.PI) / 8 - Math.PI / 2;
  return `${(20 + r * Math.cos(a)).toFixed(2)},${(20 + r * Math.sin(a)).toFixed(2)}`;
}).join(' ');

/** A small picture of each style, so the choice is seen, not read. */
function StyleSample({ style }: { style: WallStyle }) {
  return (
    <svg
      className={`style-sample sample-${style}`}
      viewBox="0 0 40 40"
      aria-hidden="true"
    >
      <rect className="ground" width="40" height="40" />
      {style === 'interlace' ? (
        <polygon className="band-edge" points={STAR} />
      ) : null}
      <polygon className="star" points={STAR} />
    </svg>
  );
}

/**
 * The finished wall's own controls: its style as samples to click, the
 * width of its grout, bands or lattice, and the original photo beside it.
 */
export function WallControls({
  style,
  onStyle,
  grout,
  onGrout,
  comparing,
  onCompare,
}: {
  style: WallStyle;
  onStyle: (style: WallStyle) => void;
  grout: number;
  onGrout: (grout: number) => void;
  /** Whether the original is beside the wall; absent when there is none. */
  comparing?: boolean;
  onCompare: (comparing: boolean) => void;
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
            <StyleSample style={s} />
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
