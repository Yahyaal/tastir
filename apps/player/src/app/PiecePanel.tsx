import { useState, type Dispatch } from 'react';
import {
  PALETTES,
  SLOTS,
  typeKey,
  type ColorAction,
  type History,
} from './coloring';
import { PieceShape } from './drawing';
import type { Model } from './model';

const SLOT_NAMES: Record<string, string> = {
  a: 'first color',
  b: 'second color',
  c: 'third color',
  d: 'fourth color',
  ground: 'ground',
};

/**
 * Each piece type with its shape, count and color. Hovering a type
 * highlights every copy on the wall; choosing one opens its colors.
 */
export function PiecePanel({
  model,
  colors,
  history,
  dispatch,
  hovered,
  onHover,
  selected,
  onSelect,
  onReset,
  place,
}: {
  model: Model;
  colors: readonly string[];
  history: History;
  dispatch: Dispatch<ColorAction>;
  hovered?: number;
  onHover: (type: number | undefined) => void;
  selected?: number;
  onSelect: (type: number | undefined) => void;
  onReset: () => void;
  /** The placement clicked on the wall, when the tutorial colors by
   * placement: its color key and its color now. */
  place?: { key: string; color: string };
}) {
  const [onlyHere, setOnlyHere] = useState(true);
  const { types } = model.pattern;
  const nameOf = (i: number) =>
    types[i]?.name ?? `${types[i]?.vertices ?? 0}-corner piece`;
  const palette = PALETTES[history.now.palette] ?? {};
  const chosenType = selected === undefined ? undefined : types[selected];
  const here = place && onlyHere ? place : undefined;
  const current =
    here?.color ?? (selected === undefined ? undefined : colors[selected]);
  const target = (t: NonNullable<typeof chosenType>) =>
    here ? here.key : typeKey(t);
  return (
    <div className="piece-panel">
      <div className="color-tools">
        <label>
          Palette{' '}
          <select
            value={history.now.palette}
            onChange={(e) =>
              dispatch({ kind: 'palette', palette: e.target.value })
            }
          >
            {Object.keys(PALETTES).map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
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
      <ul className="piece-types" onPointerLeave={() => onHover(undefined)}>
        {types.map((t, i) => (
          <li
            key={typeKey(t)}
            className={
              i === selected ? 'active' : i === hovered ? 'hovered' : undefined
            }
            onPointerEnter={() => onHover(i)}
          >
            <button
              type="button"
              className="piece-button"
              aria-label={`Recolor every ${nameOf(i)}`}
              aria-expanded={i === selected}
              onClick={() => onSelect(i === selected ? undefined : i)}
            >
              <PieceShape model={model} type={i} color={colors[i] ?? '#999'} />
              <span>
                {nameOf(i)}
                <small>
                  {t.vertices} corners · {t.perCell} per tile
                </small>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {chosenType && selected !== undefined ? (
        <div
          className="chooser"
          role="group"
          aria-label={
            here
              ? `Colors for this ${nameOf(selected)}'s place`
              : `Colors for every ${nameOf(selected)}`
          }
        >
          {place ? (
            <label className="only-here">
              <input
                type="checkbox"
                checked={onlyHere}
                onChange={(e) => setOnlyHere(e.target.checked)}
              />{' '}
              Only pieces placed like this one
            </label>
          ) : null}
          {SLOTS.map((slot) => {
            const color = (palette as Record<string, string>)[slot] ?? '#999';
            return (
              <button
                key={slot}
                type="button"
                className={
                  color === current ? 'swatch-button current' : 'swatch-button'
                }
                style={{ background: color }}
                aria-label={`${SLOT_NAMES[slot]} (${color})`}
                onClick={() =>
                  dispatch({ kind: 'paint', type: target(chosenType), color })
                }
              />
            );
          })}
          <label className="any-color">
            Any color{' '}
            <input
              type="color"
              value={current ?? '#999999'}
              onChange={(e) =>
                dispatch({
                  kind: 'paint',
                  type: target(chosenType),
                  color: e.target.value,
                })
              }
            />
          </label>
        </div>
      ) : (
        <p className="hint">
          Point at a piece to see every copy; click one to recolor it.
        </p>
      )}
    </div>
  );
}
