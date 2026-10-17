import { type Dispatch } from 'react';
import { colourName } from './colourNames';
import { PieceShape } from './drawing';
import {
  GLAZES,
  paletteNames,
  paletteOf,
  type ColorAction,
  type History,
  type Method,
} from './coloring';
import type { Model } from './model';
import { PiecePanel } from './PiecePanel';
import { methodOf, methodsOf } from './placement';
import {
  refamily,
  regrow,
  rosetteCards,
  rosetteCounts,
  swatchesOf,
  type RosetteCard,
} from './rosettes';

const METHOD_NAMES: Record<Method, string> = {
  rings: 'Ring by ring',
  shape: 'By shape',
  place: 'By place',
};

type Fill = (piece: number, i: number, j: number) => string;

/**
 * The colour stage's panel: the palettes as strips of their colours, how
 * the wall is coloured, and then either the rosettes, ring by ring from
 * the centre out, or the pieces by shape.
 */
export function ColourPanel({
  model,
  base,
  colors,
  fill,
  brush,
  onBrush,
  history,
  dispatch,
  hovered,
  onHover,
  selected,
  onSelect,
  onReset,
  place,
  oneTile = false,
  onLight,
}: {
  /** The model as the coloring colours it (colouredModel). */
  model: Model;
  /** The tutorial's model, for the ways it can be coloured. */
  base: Model;
  colors: readonly string[];
  fill?: Fill;
  /** Ring by ring, the colour a click paints with. */
  brush: string;
  onBrush: (colour: string) => void;
  history: History;
  dispatch: Dispatch<ColorAction>;
  hovered?: number;
  onHover: (type: number | undefined) => void;
  selected?: number;
  onSelect: (type: number | undefined) => void;
  onReset: () => void;
  /** The placement clicked on the wall: its colour key and colour. */
  place?: { key: string; color: string };
  /** Coloring the one tile, before it is repeated: its size is fixed. */
  oneTile?: boolean;
  /** Lights a ring on the wall while the learner points at it here. */
  onLight?: (ring: string | undefined) => void;
}) {
  const now = history.now;
  const methods = methodsOf(base);
  const method = methodOf(base, now);
  const rings = method === 'rings' && !!fill && rosetteCards(model).length > 0;
  const tools = (
    <div className="color-tools">
      <button
        type="button"
        className="quiet"
        disabled={!history.past.length}
        onClick={() => dispatch({ kind: 'undo' })}
      >
        Undo
      </button>
      <button
        type="button"
        className="quiet"
        disabled={!history.future.length}
        onClick={() => dispatch({ kind: 'redo' })}
      >
        Redo
      </button>
      <button type="button" className="quiet" onClick={onReset}>
        Reset
      </button>
    </div>
  );
  // The palette comes first: it sets every colour at once, and the
  // learner changes single rings after it.
  return (
    <div className="piece-panel colour-panel">
      <div className="colour-step">
        <h3>Palette</h3>
        <div className="palette-strips" role="group" aria-label="Palette">
          {paletteNames(model).map((name) => {
            const g = GLAZES[name];
            const p = paletteOf(model, name);
            const strip = g
              ? [g.white, g.black, ...g.families.flat()]
              : [p.ground, p.a, p.b, p.c, p.d];
            return (
              <button
                key={name}
                type="button"
                aria-pressed={name === now.palette}
                onClick={() => dispatch({ kind: 'palette', palette: name })}
              >
                <span className="palette-strip" aria-hidden="true">
                  {[...new Set(strip)].map((c) => (
                    <span key={c} style={{ background: c }} />
                  ))}
                </span>
                {name}
              </button>
            );
          })}
        </div>
      </div>
      {now.squareBands ? (
        <p role="status">
          Concentric square bands: {now.squareBands.colors.length} colors, one
          square thick. The motif repeats every{' '}
          {now.squareBands.colors.length * 2 - 1} squares.{' '}
          <button
            type="button"
            onClick={() =>
              dispatch({
                kind: 'reset',
                to: { ...now, squareBands: undefined },
              })
            }
          >
            Remove square bands
          </button>
        </p>
      ) : null}
      {methods.length > 1 ? (
        <div className="colour-methods" role="group" aria-label="Colour">
          {methods.map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={m === method}
              onClick={() =>
                // Colours chosen one way do not carry to another.
                dispatch({
                  kind: 'reset',
                  to: {
                    palette: now.palette,
                    chosen: {},
                    ...(m === methods[0] ? {} : { method: m }),
                  },
                })
              }
            >
              {METHOD_NAMES[m]}
            </button>
          ))}
        </div>
      ) : null}
      {rings && fill ? (
        <Rosettes
          model={model}
          fill={fill}
          brush={brush}
          onBrush={onBrush}
          history={history}
          dispatch={dispatch}
          oneTile={oneTile}
          tools={tools}
          onLight={onLight}
        />
      ) : (
        <>
          <PiecePanel
            model={model}
            colors={colors}
            history={history}
            dispatch={dispatch}
            hovered={hovered}
            onHover={onHover}
            selected={selected}
            onSelect={onSelect}
            onReset={onReset}
            place={place}
            tools={false}
          />
          {tools}
        </>
      )}
    </div>
  );
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** A rosette card's name: its letter, the filler stars, or between them. */
function cardName(card: RosetteCard, rosettes: number): string {
  if (card.kind === 'between') return 'Between the rosettes';
  if (card.kind === 'filler') return 'Filler stars';
  return rosettes > 1
    ? `Rosette ${LETTERS[card.family] ?? card.family + 1}`
    : 'The rosette';
}

/**
 * Ring by ring: the colour a click paints with, and how many rosettes
 * the unit holds, doubled to colour neighbours apart.
 */
function Rosettes({
  model,
  fill,
  brush,
  onBrush,
  history,
  dispatch,
  oneTile,
  tools,
  onLight,
}: {
  model: Model;
  fill: Fill;
  brush: string;
  onBrush: (colour: string) => void;
  history: History;
  dispatch: Dispatch<ColorAction>;
  oneTile: boolean;
  /** Undo, Redo and Reset, beside the colours. */
  tools: React.ReactNode;
  onLight?: (ring: string | undefined) => void;
}) {
  const now = history.now;
  const { now: count, turns, options } = rosetteCounts(model);
  const resize = (n: number) =>
    dispatch({
      kind: 'reset',
      to: {
        palette: now.palette,
        chosen:
          n > count
            ? regrow(model, now, fill, count, n)
            : refamily(now.chosen, count, n),
        ...(now.method ? { method: now.method } : {}),
        // The lattice's own number is the default, so it is not kept.
        ...(n === turns ? {} : { rosettes: n }),
      },
    });
  const at = options.indexOf(count);
  const bigger = options[at + 1];
  const smaller = options[at - 1];
  const cards = rosetteCards(model);
  return (
    <div className="rosettes">
      <div className="colour-step">
        <h3>1 · Pick a color</h3>
        <div className="chooser brush" role="group" aria-label="Paint with">
          {swatchesOf(model, now.palette).map((c) => (
            <button
              key={c}
              type="button"
              className={
                c === brush ? 'swatch-button current' : 'swatch-button'
              }
              style={{ background: c }}
              aria-label={colourName(c)}
              title={`${colourName(c)} ${c}`}
              data-color={c}
              aria-pressed={c === brush}
              onClick={() => onBrush(c)}
            />
          ))}
          <label className="any-color">
            <span className="visually-hidden">Any color</span>
            <input
              type="color"
              value={brush}
              onChange={(e) => onBrush(e.target.value)}
            />
          </label>
        </div>
        {tools}
      </div>
      <div className="colour-step">
        <h3>2 · Click a piece on the wall, or here</h3>
        <p className="hint">
          Its whole ring round the rosette takes the color.
        </p>
        {cards.map((card) => (
          <div key={card.family} className="ring-card">
            <h4>{cardName(card, count)}</h4>
            <div
              className="ring-pieces"
              role="group"
              aria-label={cardName(card, count)}
            >
              {card.rows.map((row, n) => (
                <button
                  key={row.key}
                  type="button"
                  className="ring-piece"
                  aria-label={`${cardName(card, count)}, ring ${n + 1}`}
                  title={`Ring ${n + 1}`}
                  onPointerEnter={() => onLight?.(row.key)}
                  onPointerLeave={() => onLight?.(undefined)}
                  onFocus={() => onLight?.(row.key)}
                  onBlur={() => onLight?.(undefined)}
                  onClick={() =>
                    dispatch({ kind: 'paint', type: row.key, color: brush })
                  }
                >
                  <PieceShape
                    model={model}
                    type={row.type}
                    color={fill(row.piece, row.i, row.j)}
                  />
                </button>
              ))}
            </div>
          </div>
        ))}
        {options.length > 1 && !oneTile ? (
          <div className="rosette-count">
            <span className="color-tools">
              <button
                type="button"
                className="quiet"
                disabled={bigger === undefined}
                onClick={() => bigger && resize(bigger)}
              >
                {bigger === 2 * count ? 'Double the unit' : 'Grow the unit'}
              </button>
              <button
                type="button"
                className="quiet"
                disabled={smaller === undefined}
                onClick={() => smaller && resize(smaller)}
              >
                {2 * (smaller ?? 0) === count
                  ? 'Halve the unit'
                  : 'Shrink the unit'}
              </button>
            </span>
            <small>
              {count === 1
                ? 'One rosette: every rosette takes the same colours.'
                : count === turns
                  ? `${count} rosettes take turns, so no two alike touch.`
                  : `${count} rosettes, each with its own colours.`}
            </small>
          </div>
        ) : null}
      </div>
    </div>
  );
}
