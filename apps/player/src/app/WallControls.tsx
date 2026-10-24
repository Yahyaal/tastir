import { useId, type ReactNode } from 'react';
import { banded, WALL_STYLES, type WallStyle } from './Wall';
import type { Finish } from './coloring';
import { CustomColor } from './JaliControls';

type Swatch = { readonly name: string; readonly color: string };
/** Grout, and the dark edge of a band. */
const LINES: readonly Swatch[] = [
  { name: 'Dark', color: '#23201c' },
  { name: 'Sepia', color: '#6b4226' },
  { name: 'Grey', color: '#8c8a84' },
  { name: 'Ivory', color: '#f7f2e6' },
];
/** The band of strapwork and interlace. */
const BANDS: readonly Swatch[] = [
  { name: 'Ivory', color: '#f7f2e6' },
  { name: 'Terracotta', color: '#c4622d' },
  { name: 'Gold', color: '#d9a441' },
  { name: 'Lapis', color: '#2b4c8c' },
  { name: 'Green', color: '#2f7a55' },
];

/** One colour of the wall as swatches to click, and a custom colour. */
function FinishColors({
  label,
  swatches,
  color,
  onChange,
}: {
  label: string;
  swatches: readonly Swatch[];
  color: string;
  onChange: (color: string) => void;
}) {
  const now = color.toLowerCase();
  return (
    <div className="finish-colors">
      <h3 className="jali-background-heading">{label}</h3>
      <div className="chooser" role="group" aria-label={label}>
        {swatches.map((p) => (
          <button
            key={p.color}
            type="button"
            className={
              p.color === now ? 'swatch-button current' : 'swatch-button'
            }
            style={{ background: p.color }}
            aria-label={`${p.name} ${label.toLowerCase()}`}
            title={p.name}
            aria-pressed={p.color === now}
            onClick={() => onChange(p.color)}
          />
        ))}
        <CustomColor
          label={label}
          color={color}
          selected={!swatches.some((p) => p.color === now)}
          onChange={onChange}
        />
      </div>
    </div>
  );
}

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
  finish,
  onFinish,
}: {
  style: WallStyle;
  onStyle: (style: WallStyle) => void;
  grout: number;
  onGrout: (grout: number) => void;
  /** A small picture of the wall in a style. */
  sample: (style: WallStyle) => ReactNode;
  /** The grout or band colours, chosen with swatches. */
  finish?: Finish;
  onFinish?: (change: { lines?: string; band?: string }) => void;
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
      {finish && onFinish && style === 'tiles' ? (
        <FinishColors
          label="Grout color"
          swatches={LINES}
          color={finish.lines}
          onChange={(lines) => onFinish({ lines })}
        />
      ) : null}
      {finish && onFinish && banded(style) ? (
        <>
          <FinishColors
            label="Band color"
            swatches={BANDS}
            color={finish.band}
            onChange={(band) => onFinish({ band })}
          />
          <FinishColors
            label="Edge color"
            swatches={LINES}
            color={finish.lines}
            onChange={(lines) => onFinish({ lines })}
          />
        </>
      ) : null}
      <p className="hint">
        {jali ? 'An open screen. Switch styles to see your tile colors. ' : ''}
        Drag to move along the wall, scroll to zoom.
      </p>
    </section>
  );
}
