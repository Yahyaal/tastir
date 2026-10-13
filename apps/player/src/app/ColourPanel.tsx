import { useEffect, useRef, useState, type Dispatch } from 'react';
import {
  GLAZES,
  glazeOf,
  paletteNames,
  paletteOf,
  type ColorAction,
  type History,
  type Method,
} from './coloring';
import { PieceShape } from './drawing';
import type { Model } from './model';
import { PiecePanel } from './PiecePanel';
import { methodOf, methodsOf } from './placement';
import {
  copyRosette,
  refamily,
  rosetteCards,
  rosetteCounts,
  type RosetteCard,
  type RingRow,
} from './rosettes';

const METHOD_NAMES: Record<Method, string> = {
  rings: 'Ring by ring',
  shape: 'By shape',
  place: 'By place',
};

const letter = (f: number) => String.fromCharCode(65 + f);

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
  history,
  dispatch,
  hovered,
  onHover,
  selected,
  onSelect,
  onReset,
  place,
}: {
  /** The model as the coloring colours it (colouredModel). */
  model: Model;
  /** The tutorial's model, for the ways it can be coloured. */
  base: Model;
  colors: readonly string[];
  fill?: Fill;
  history: History;
  dispatch: Dispatch<ColorAction>;
  hovered?: number;
  onHover: (type: number | undefined) => void;
  selected?: number;
  onSelect: (type: number | undefined) => void;
  onReset: () => void;
  /** The placement clicked on the wall: its colour key and colour. */
  place?: { key: string; color: string };
}) {
  const now = history.now;
  const methods = methodsOf(base);
  const method = methodOf(base, now);
  return (
    <div className="piece-panel colour-panel">
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
      {method === 'rings' && fill && rosetteCards(model).length ? (
        <Rosettes
          model={model}
          fill={fill}
          history={history}
          dispatch={dispatch}
          onHover={onHover}
          picked={place?.key}
        />
      ) : (
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
      )}
    </div>
  );
}

/** The rosettes of the repeat, each a card of its rings. */
function Rosettes({
  model,
  fill,
  history,
  dispatch,
  onHover,
  picked,
}: {
  model: Model;
  fill: Fill;
  history: History;
  dispatch: Dispatch<ColorAction>;
  onHover: (type: number | undefined) => void;
  picked?: string;
}) {
  const now = history.now;
  const cards = rosetteCards(model);
  const { now: count, most } = rosetteCounts(model);
  const [open, setOpen] = useState<string>();
  // A piece clicked on the wall opens its ring here.
  useEffect(() => {
    if (picked) setOpen(picked);
  }, [picked]);
  const rosettes = (n: number, chosen: Record<string, string>) =>
    dispatch({
      kind: 'reset',
      to: {
        palette: now.palette,
        chosen,
        ...(now.method ? { method: now.method } : {}),
        // The lattice's own number is the default, so it is not kept.
        ...(n === most ? {} : { rosettes: n }),
      },
    });
  const copy = (to: number, reverse: boolean) =>
    dispatch({
      kind: 'reset',
      to: {
        ...now,
        chosen: {
          ...now.chosen,
          ...copyRosette(model, now, fill, 0, to, reverse),
        },
      },
    });
  const title = (c: RosetteCard) =>
    c.kind === 'filler'
      ? 'Filler star'
      : c.kind === 'between'
        ? 'Between the rosettes'
        : count === 1
          ? 'Every rosette'
          : `Rosette ${letter(c.family)}`;
  return (
    <div className="rosettes">
      <p className="hint">
        Colour a rosette ring by ring, from the centre out. Click a piece on the
        wall to open its ring.
      </p>
      {most > 1 ? (
        <p className="rosette-count">
          {count < most ? (
            <button
              type="button"
              onClick={() =>
                rosettes(most, {
                  ...refamily(now.chosen, count, most),
                  ...Object.assign(
                    {},
                    ...Array.from({ length: most - 1 }, (_, k) =>
                      copyRosette(model, now, fill, 0, k + 1, k % 2 === 0),
                    ),
                  ),
                })
              }
            >
              Add a rosette
            </button>
          ) : (
            <button
              type="button"
              className="quiet"
              onClick={() => rosettes(1, refamily(now.chosen, count, 1))}
            >
              Colour every rosette alike
            </button>
          )}{' '}
          <small>
            {count === 1
              ? 'Every rosette takes the same colours.'
              : `${count} rosettes take turns, so no two alike touch.`}
          </small>
        </p>
      ) : null}
      {cards.map((c) => (
        <section
          key={c.family}
          className={`rosette-card ${c.kind}`}
          aria-label={title(c)}
        >
          <header>
            <h3>{title(c)}</h3>
            {c.kind === 'rosette' && c.family > 0 ? (
              <span className="rosette-actions">
                <button
                  type="button"
                  className="quiet"
                  onClick={() => copy(c.family, true)}
                >
                  A swapped
                </button>
                <button
                  type="button"
                  className="quiet"
                  onClick={() => copy(c.family, false)}
                >
                  Same as A
                </button>
              </span>
            ) : null}
          </header>
          <ol className="ring-rows" onPointerLeave={() => onHover(undefined)}>
            {c.rows.map((r, n) => (
              <Ring
                key={r.key}
                model={model}
                row={r}
                ring={n + 1}
                colour={fill(r.piece, r.i, r.j)}
                open={open === r.key}
                onOpen={() => setOpen(open === r.key ? undefined : r.key)}
                onHover={onHover}
                onPaint={(color) =>
                  dispatch({ kind: 'paint', type: r.key, color })
                }
                swatches={swatchesOf(model, now.palette)}
              />
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

/** A palette's colours to paint with: its white, black and glazes. */
function swatchesOf(model: Model, palette: string): string[] {
  const g = glazeOf(palette, model);
  return [...new Set([g.white, g.black, ...g.families.flat()])];
}

function Ring({
  model,
  row,
  ring,
  colour,
  open,
  onOpen,
  onHover,
  onPaint,
  swatches,
}: {
  model: Model;
  row: RingRow;
  ring: number;
  colour: string;
  open: boolean;
  onOpen: () => void;
  onHover: (type: number | undefined) => void;
  onPaint: (colour: string) => void;
  swatches: readonly string[];
}) {
  const ref = useRef<HTMLLIElement>(null);
  useEffect(() => {
    if (open) ref.current?.scrollIntoView?.({ block: 'nearest' });
  }, [open]);
  const t = model.pattern.types[row.type];
  const name = t?.name ?? `${t?.vertices ?? 0}-corner piece`;
  return (
    <li
      ref={ref}
      className={open ? 'active' : undefined}
      onPointerEnter={() => onHover(row.type)}
    >
      <button
        type="button"
        className="piece-button"
        aria-expanded={open}
        aria-label={`Recolor ring ${ring}, the ${name}s`}
        onClick={onOpen}
      >
        <PieceShape model={model} type={row.type} color={colour} />
        <span>
          {name}
          <small>ring {ring}</small>
        </span>
      </button>
      {open ? (
        <div
          className="chooser"
          role="group"
          aria-label={`Colors for the ${name}s`}
        >
          {swatches.map((c) => (
            <button
              key={c}
              type="button"
              className={
                c === colour ? 'swatch-button current' : 'swatch-button'
              }
              style={{ background: c }}
              aria-label={c}
              onClick={() => onPaint(c)}
            />
          ))}
          <label className="any-color">
            Any color{' '}
            <input
              type="color"
              value={colour}
              onChange={(e) => onPaint(e.target.value)}
            />
          </label>
        </div>
      ) : null}
    </li>
  );
}
