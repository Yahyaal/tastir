import { useId, useMemo, useState } from 'react';
import type { Vec } from '@tastir/engine';
import { LIBRARY } from '../app/library';
import { useModel } from '../app/workerClient';
import { paletteOf, pieceColors, tutorialColoring } from '../app/coloring';
import { placeFills, colorRepeat, colouredModel } from '../app/placement';
import { Wall } from '../app/Wall';
import type { Model } from '../app/model';
import {
  GRAPHITE,
  INK,
  LOOKS,
  LOOK_PALETTE,
  PAPER,
  PAPER_PALETTES,
  constructionOf,
  filters,
  inset,
  outlineOf,
  shade,
  sheetOf,
  type Look,
} from './linesStudy';
import './review.css';
import './teachingUpdate.css';
import './linesStudy.css';

const SAMPLES = [
  ['eight-fold-star-and-cross', 'Star and cross'],
  ['alhambra-arrayanes-porch-ceiling', 'Arrayanes porch ceiling'],
] as const;

/** SVG's y points down; the tutorial's points up. */
const sv = (p: Vec) => ({ x: p.x, y: -p.y });
const pts = (ps: readonly Vec[]) =>
  ps.map((p) => `${p.x.toFixed(4)},${p.y.toFixed(4)}`).join(' ');
const turn = (p: Vec, c: Vec, deg: number) => {
  const a = (deg * Math.PI) / 180;
  const dx = p.x - c.x;
  const dy = p.y - c.y;
  return {
    x: c.x + dx * Math.cos(a) - dy * Math.sin(a),
    y: c.y + dx * Math.sin(a) + dy * Math.cos(a),
  };
};

/** Today's lines style, exactly as the player draws it. */
function Today({ model }: { model: Model }) {
  const coloring = useMemo(() => tutorialColoring(model), [model]);
  const preview = useMemo(
    () => colouredModel(model, coloring),
    [model, coloring],
  );
  const fill = useMemo(
    () => placeFills(preview, coloring),
    [preview, coloring],
  );
  return (
    <Wall
      model={preview}
      look="lines"
      colors={pieceColors(preview, coloring)}
      fill={fill}
      repeat={colorRepeat(preview)}
    />
  );
}

/** One finished sheet in one of the three proposed looks. */
function Sheet({
  model,
  look,
  palette,
  label,
}: {
  model: Model;
  look: Look;
  palette: string;
  label: string;
}) {
  const id = useId().replace(/:/g, '');
  const colours = PAPER_PALETTES[palette] ?? paletteOf(undefined, 'Rose');
  const sheet = useMemo(() => sheetOf(model, colours), [model, colours]);
  const { area } = sheet;
  // The line width of this study: a fixed share of the sheet, so every
  // pattern gets the same line weight and grain on the page.
  const g = (area.maxX - area.minX) / 380;
  const outline = useMemo(() => outlineOf(sheet.pieces), [sheet]);
  const construction = useMemo(
    () =>
      look === 'pencil' ? constructionOf(model, sheet.shifts, area) : undefined,
    [look, model, sheet, area],
  );
  const margin = (area.maxX - area.minX) * 0.09;
  const box = {
    x: area.minX - margin,
    y: -area.maxY - margin,
    w: area.maxX - area.minX + 2 * margin,
    h: area.maxY - area.minY + 2 * margin,
  };
  const gap = look === 'watercolour' ? 1.3 : look === 'ink-wash' ? 0.35 : 0.2;
  const outlinePath = outline
    .map(([a, b]) => {
      const p = sv(a);
      const q = sv(b);
      return `M${p.x.toFixed(4)} ${p.y.toFixed(4)}L${q.x.toFixed(4)} ${q.y.toFixed(4)}`;
    })
    .join('');
  return (
    <svg
      className="lines-sheet"
      viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
      role="img"
      aria-label={label}
    >
      <defs dangerouslySetInnerHTML={{ __html: filters(id, g) }} />
      <rect x={box.x} y={box.y} width={box.w} height={box.h} fill={PAPER} />
      {construction ? (
        <g
          fill="none"
          stroke={GRAPHITE}
          strokeWidth={g * 0.16}
          opacity={0.38}
          filter={`url(#${id}-graphite)`}
        >
          {construction.lines.map(([a, b], i) => {
            const p = sv(a);
            const q = sv(b);
            return <line key={i} x1={p.x} y1={p.y} x2={q.x} y2={q.y} />;
          })}
          {construction.circles.map(({ c, r }, i) => (
            <circle key={`c${i}`} cx={c.x} cy={-c.y} r={r} />
          ))}
        </g>
      ) : null}
      <g>
        {sheet.pieces.map((piece) => {
          const polygon = inset(piece.polygon, g * gap).map(sv);
          const colour = shade(piece.color, (piece.seed - 0.5) * 0.18);
          if (look !== 'pencil')
            return (
              <polygon
                key={piece.key}
                points={pts(polygon)}
                fill={colour}
                opacity={0.93}
                filter={`url(#${id}-paint)`}
              />
            );
          // Each piece shaded at its own slant, as a hand turns the paper.
          const slant = 25 + piece.seed * 40;
          const c = sv(piece.centre);
          const turned = polygon.map((p) => turn(p, c, -slant));
          return (
            <g key={piece.key}>
              <polygon
                points={pts(turned)}
                transform={`rotate(${slant.toFixed(2)} ${c.x.toFixed(4)} ${c.y.toFixed(4)})`}
                fill={shade(colour, 0.05)}
                filter={`url(#${id}-pencil)`}
              />
              <polygon
                points={pts(polygon)}
                fill="none"
                stroke={colour}
                strokeWidth={g * 0.45}
                strokeLinejoin="round"
                opacity={0.55}
              />
            </g>
          );
        })}
      </g>
      {look === 'ink-wash' ? (
        <path
          d={outlinePath}
          fill="none"
          stroke={INK}
          strokeWidth={g * 0.62}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.9}
          filter={`url(#${id}-pen)`}
        />
      ) : null}
      {look === 'pencil' ? (
        <path
          d={outlinePath}
          fill="none"
          stroke={GRAPHITE}
          strokeWidth={g * 0.42}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#${id}-graphite)`}
        />
      ) : null}
      <rect
        x={box.x}
        y={box.y}
        width={box.w}
        height={box.h}
        filter={`url(#${id}-paper)`}
        pointerEvents="none"
      />
    </svg>
  );
}

function SampleRow({
  id,
  name,
  palettes,
}: {
  id: string;
  name: string;
  palettes: Readonly<Record<Look, string>>;
}) {
  const { model, error } = useModel(LIBRARY.find((e) => e.id === id)?.json);
  return (
    <section className="lines-row" aria-label={name}>
      <h2>
        {name} · <a href={`#/${id}/result`}>Open pattern</a>
      </h2>
      {model ? (
        <div className="lines-grid">
          <figure className="lines-today">
            <figcaption>
              <b>Today</b> · Lines, Single pen, Colour wash
            </figcaption>
            <Today model={model} />
          </figure>
          {LOOKS.map(({ look, name: lookName }) => (
            <figure key={look}>
              <figcaption>
                <b>{lookName}</b> · {palettes[look]}
              </figcaption>
              <Sheet
                model={model}
                look={look}
                palette={palettes[look]}
                label={`${name} in ${lookName}, ${palettes[look]} colours`}
              />
            </figure>
          ))}
        </div>
      ) : (
        <p role={error ? 'alert' : 'status'}>{error ?? 'Preparing…'}</p>
      )}
    </section>
  );
}

const OWN = 'Each look’s own';

export function LinesStudy() {
  const [choice, setChoice] = useState(OWN);
  const palettes = useMemo(
    (): Readonly<Record<Look, string>> =>
      choice === OWN
        ? LOOK_PALETTE
        : { watercolour: choice, 'ink-wash': choice, pencil: choice },
    [choice],
  );
  return (
    <main className="review teaching-update lines-study">
      <nav className="review-top">
        <a href="#/notes">← Project notes</a>
        <a href="#/review">Review page →</a>
      </nav>
      <header className="review-head">
        <p className="teaching-caption">STYLE.1 · Lines study · Preview only</p>
        <h1>Make Lines look drawn and coloured by hand.</h1>
        <p className="lede">
          Today’s colour wash is one blotchy texture laid over the whole wall.
          Its blotches are larger than the pieces, so the paint runs across
          their edges and reads as camouflage. It also reuses the tile colours,
          and browns and greys look dirty on paper.
        </p>
        <p>
          The three looks below fix both. Every piece is painted on its own, so
          nothing runs from one piece into the next. Each look has colours made
          for paper. The wall becomes a finished sheet with whole pieces at its
          edge, as an artist would leave it. Nothing in the player has changed
          yet: pick a look, or tell me what to mix, and I will plan the real
          change from that.
        </p>
      </header>
      <div className="lines-looks">
        {LOOKS.map(({ look, name, note }) => (
          <p key={look}>
            <b>{name}.</b> {note}
          </p>
        ))}
      </div>
      <div
        className="lines-palettes teaching-controls"
        role="group"
        aria-label="Colours"
      >
        <span>Colours:</span>
        {[OWN, ...Object.keys(PAPER_PALETTES)].map((name) => (
          <button
            key={name}
            type="button"
            aria-pressed={choice === name}
            onClick={() => setChoice(name)}
          >
            {name}
            {name === OWN ? null : (
              <span className="lines-swatches" aria-hidden="true">
                {Object.values(PAPER_PALETTES[name] ?? {}).map((c, i) => (
                  <span key={i} style={{ background: c }} />
                ))}
              </span>
            )}
          </button>
        ))}
      </div>
      {SAMPLES.map(([id, name]) => (
        <SampleRow key={id} id={id} name={name} palettes={palettes} />
      ))}
    </main>
  );
}
