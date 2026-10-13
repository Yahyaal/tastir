import type { Vec } from '@tastir/engine';
import { useId, useMemo } from 'react';
import type { Model } from './model';
import { placeKey } from './placement';
import { rosetteCards } from './rosettes';

type Place = { piece: number; i: number; j: number };

/**
 * A few coloured tiles, `count` along each slide: the unit alone, or the
 * copies the learner asked for. The block is cut at the tiles' edges, so a
 * piece across an edge shows the part inside, from whichever copy it
 * belongs to, and a click on one paints it.
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
  // The tiles' outlines, which cut the block.
  const outlines = useMemo(() => {
    const out: Vec[][] = [];
    for (let i = 0; i < m; i++)
      for (let j = 0; j < n; j++)
        out.push(cell.corners.map((q) => shift(q, cell, i, j)));
    return out;
  }, [cell, m, n]);
  const placed = useMemo(() => {
    const out: (Place & { type: number; polygon: Vec[] })[] = [];
    // The pieces of the tiles and of the ring of copies round them, so a
    // piece that crosses into a tile from a neighbour is there too.
    for (let i = -1; i <= m; i++)
      for (let j = -1; j <= n; j++)
        pieces.forEach((p, k) => {
          const polygon = p.polygon.map((q) => shift(q, cell, i, j));
          const mid = {
            x: polygon.reduce((t, q) => t + q.x, 0) / polygon.length,
            y: polygon.reduce((t, q) => t + q.y, 0) / polygon.length,
          };
          if ([mid, ...polygon].some((q) => outlines.some((o) => inside(q, o))))
            out.push({ piece: k, i, j, type: p.type, polygon });
        });
    return out;
  }, [cell, pieces, outlines, m, n]);
  const clip = useId();
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
    const all = outlines.flat();
    const xs = all.map((q) => q.x);
    const ys = all.map((q) => q.y);
    const minX = Math.min(...xs);
    const maxY = Math.max(...ys);
    const w = Math.max(...xs) - minX;
    const h = maxY - Math.min(...ys);
    const pad = 0.04 * Math.max(w, h);
    // Drawn y up, as the wall is.
    return `${minX - pad} ${-maxY - pad} ${w + 2 * pad} ${h + 2 * pad}`;
  }, [outlines]);
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
      <defs>
        <clipPath id={clip}>
          {outlines.map((o, k) => (
            <polygon
              key={k}
              transform="scale(1,-1)"
              points={o.map((q) => `${q.x},${q.y}`).join(' ')}
            />
          ))}
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
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
              onClick={() =>
                onPick?.(p.type, { piece: p.piece, i: p.i, j: p.j })
              }
            />
          ))}
        </g>
      </g>
    </svg>
  );
}

/** A point slid onto the copy of the cell `i` and `j` slides along. */
function shift(q: Vec, cell: { u: Vec; v: Vec }, i: number, j: number): Vec {
  return {
    x: q.x + i * cell.u.x + j * cell.v.x,
    y: q.y + i * cell.u.y + j * cell.v.y,
  };
}

/** Whether a point lies strictly inside a convex outline. */
function inside(q: Vec, outline: readonly Vec[]): boolean {
  let sign = 0;
  for (let k = 0; k < outline.length; k++) {
    const a = outline[k] as Vec;
    const b = outline[(k + 1) % outline.length] as Vec;
    const c = (b.x - a.x) * (q.y - a.y) - (b.y - a.y) * (q.x - a.x);
    if (Math.abs(c) < 1e-9) return false;
    if (sign === 0) sign = Math.sign(c);
    else if (Math.sign(c) !== sign) return false;
  }
  return true;
}
