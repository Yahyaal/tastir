import type { PenLook } from '@tastir/schema';
import { CustomColor } from './JaliControls';
import { washFill } from './drawnTexture';
import {
  DEFAULT_PEN,
  INKS,
  PAPER,
  PENS,
  penStrokes,
  samePen,
  type Pen,
} from './pen';

const PEN_NAMES: Record<Pen, string> = {
  single: 'Single',
  double: 'Double',
  pencil: 'Pencil',
};

/** An eight-pointed star of two squares, the corner of a sample. */
const STAR =
  'M20 4L24.7 12.7L33.3 6.7L27.3 15.3L36 20L27.3 24.7L33.3 33.3L24.7 27.3L20 36L15.3 27.3L6.7 33.3L12.7 24.7L4 20L12.7 15.3L6.7 6.7L15.3 12.7Z';

/** A small star drawn with a pen, so each choice shows what it does. */
function PenSample({ look }: { look: PenLook }) {
  const strokes = penStrokes(look.pen);
  return (
    <svg className="pen-sample" viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" fill={PAPER} />
      <path
        d={STAR}
        fill={look.wash ? '#c8792e' : 'none'}
        fillOpacity={washFill(look.pen).opacity}
      />
      {strokes.map((s, k) => (
        <path
          key={k}
          d={STAR}
          fill="none"
          stroke={s.paper ? PAPER : look.ink}
          strokeOpacity={s.opacity}
          strokeWidth={1.5 * s.width}
          strokeLinejoin="round"
          transform={`translate(${1.5 * s.dx} ${1.5 * s.dy})`}
        />
      ))}
    </svg>
  );
}

/**
 * The lines style's own choices: the pen (one line, two lines with paper
 * between, or pencil), whether the pieces take a wash of their colours,
 * and the ink. Every choice is one click, shown as a sample or a swatch.
 */
export function PenControls({
  look,
  onChange,
}: {
  look: PenLook;
  onChange: (look: PenLook) => void;
}) {
  return (
    <section>
      <h2>The drawing</h2>
      <div className="pen-controls">
        <div className="pen-choices" role="group" aria-label="Pen">
          {PENS.map((pen) => (
            <button
              key={pen}
              type="button"
              aria-pressed={look.pen === pen}
              onClick={() => onChange({ ...look, pen })}
            >
              <PenSample look={{ ...look, pen }} />
              <span>{PEN_NAMES[pen]}</span>
            </button>
          ))}
        </div>
        <div className="pen-wash" role="group" aria-label="Colour">
          {[false, true].map((wash) => (
            <button
              key={String(wash)}
              type="button"
              aria-pressed={look.wash === wash}
              onClick={() => onChange({ ...look, wash })}
            >
              {wash ? 'Colour wash' : 'Lines only'}
            </button>
          ))}
        </div>
        <h3 className="jali-background-heading">Ink</h3>
        <div className="chooser" role="group" aria-label="Ink colors">
          {INKS.map((p) => (
            <button
              key={p.color}
              type="button"
              className={
                p.color === look.ink.toLowerCase()
                  ? 'swatch-button current'
                  : 'swatch-button'
              }
              style={{ background: p.color }}
              aria-label={`${p.name}`}
              title={p.name}
              aria-pressed={p.color === look.ink.toLowerCase()}
              onClick={() => onChange({ ...look, ink: p.color })}
            />
          ))}
        </div>
        <CustomColor
          label="Ink color"
          color={look.ink}
          selected={!INKS.some((p) => p.color === look.ink.toLowerCase())}
          onChange={(ink) => onChange({ ...look, ink })}
        />
        {look.wash ? null : (
          <p className="hint">Choose Colour wash to colour the pieces.</p>
        )}
      </div>
      <button
        type="button"
        className="quiet"
        disabled={samePen(look)}
        onClick={() => onChange(DEFAULT_PEN)}
      >
        Reset the drawing
      </button>
    </section>
  );
}
