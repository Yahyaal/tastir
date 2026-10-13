import type { Vec } from '@tastir/engine';
import { useMemo } from 'react';
import type { Model } from './model';
import { placeKey } from './placement';
import { rosetteCards } from './rosettes';

type Place = { piece: number; i: number; j: number };

/**
 * A few coloured tiles, `count` along each slide: the unit alone, or the
 * copies the learner asked for. Each piece is drawn whole, so the block's
 * edge follows the pieces, and a click on one paints it.
 */
export function Tiles({
  model,
  count,
  fill,
  lines,
  onHover,
  onPick,
}: {
  model: Model;
  count: readonly [number, number];
  /** A piece's colour, by the cell it is copied to. */
  fill: (piece: number, i: number, j: number) => string;
  /** The colour of the lines between pieces. */
  lines: string;
  onHover?: (type: number | undefined) => void;
  onPick?: (type: number, place: Place) => void;
}) {
  const { cell, pieces, types } = model.pattern;
  const [m, n] = count;
  const placed = useMemo(() => {
    const out: (Place & { type: number; polygon: Vec[] })[] = [];
    for (let i = 0; i < m; i++)
      for (let j = 0; j < n; j++) {
        const d = {
          x: i * cell.u.x + j * cell.v.x,
          y: i * cell.u.y + j * cell.v.y,
        };
        pieces.forEach((p, k) =>
          out.push({
            piece: k,
            i,
            j,
            type: p.type,
            polygon: p.polygon.map((q) => ({ x: q.x + d.x, y: q.y + d.y })),
          }),
        );
      }
    return out;
  }, [cell, pieces, m, n]);
  // Each ring's number round its rosette, to name the pieces.
  const ringOf = useMemo(
    () =>
      new Map(
        rosetteCards(model).flatMap((c) =>
          c.rows.map((r, k) => [r.key, k + 1] as const),
        ),
      ),
    [model],
  );
  const box = useMemo(() => {
    const xs = placed.flatMap((p) => p.polygon.map((q) => q.x));
    const ys = placed.flatMap((p) => p.polygon.map((q) => q.y));
    const minX = Math.min(...xs);
    const maxY = Math.max(...ys);
    const w = Math.max(...xs) - minX;
    const h = maxY - Math.min(...ys);
    const pad = 0.04 * Math.max(w, h);
    // Drawn y up, as the wall is.
    return `${minX - pad} ${-maxY - pad} ${w + 2 * pad} ${h + 2 * pad}`;
  }, [placed]);
  const nameOf = (p: Place & { type: number }) => {
    const t = types[p.type];
    const name = `the ${t?.name ?? `${t?.vertices ?? 0}-corner piece`}s`;
    const ring = ringOf.get(placeKey(model, p.piece, p.i, p.j));
    return ring ? `Paint ring ${ring}, ${name}` : `Recolor ${name}`;
  };
  return (
    <svg
      className="drawing tiles"
      viewBox={box}
      role="img"
      aria-label={m * n === 1 ? 'The unit' : `The unit repeated ${m} by ${n}`}
      onPointerLeave={() => onHover?.(undefined)}
    >
      <g transform="scale(1,-1)">
        {placed.map((p) => (
          <polygon
            key={`${p.piece}@${p.i},${p.j}`}
            className="tile-piece"
            role="button"
            aria-label={nameOf(p)}
            data-type={p.type}
            points={p.polygon.map((q) => `${q.x},${q.y}`).join(' ')}
            fill={fill(p.piece, p.i, p.j)}
            stroke={lines}
            onPointerEnter={() => onHover?.(p.type)}
            onClick={() => onPick?.(p.type, { piece: p.piece, i: p.i, j: p.j })}
          />
        ))}
      </g>
    </svg>
  );
}
