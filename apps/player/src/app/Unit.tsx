import { useMemo } from 'react';
import type { Model } from './model';
import { placeKey } from './placement';
import { rosetteCards, unitPieces } from './rosettes';

/**
 * The unit before it repeats, drawn large on a plain ground: one whole
 * rosette of each family that takes turns and the filler stars between
 * them. A click on a piece opens its ring in the colour panel.
 */
export function Unit({
  model,
  fill,
  onHover,
  onPick,
}: {
  model: Model;
  fill: (piece: number, i: number, j: number) => string;
  onHover?: (type: number | undefined) => void;
  onPick?: (
    type: number,
    place: { piece: number; i: number; j: number },
  ) => void;
}) {
  const pieces = useMemo(() => unitPieces(model), [model]);
  // Each ring's number round its rosette, to name the pieces.
  const ringOf = useMemo(
    () =>
      new Map(
        rosetteCards(model).flatMap((c) =>
          c.rows.map((r, n) => [r.key, n + 1] as const),
        ),
      ),
    [model],
  );
  const nameOf = (type: number) => {
    const t = model.pattern.types[type];
    return t?.name ?? `${t?.vertices ?? 0}-corner piece`;
  };
  const box = useMemo(() => {
    const xs = pieces.flatMap((p) => p.polygon.map((q) => q.x));
    const ys = pieces.flatMap((p) => p.polygon.map((q) => q.y));
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const w = Math.max(...xs) - minX;
    const h = Math.max(...ys) - minY;
    const pad = 0.04 * Math.max(w, h);
    // Drawn y up, as the wall is.
    return `${minX - pad} ${-(minY + h) - pad} ${w + 2 * pad} ${h + 2 * pad}`;
  }, [pieces]);
  if (!pieces.length) return null;
  return (
    <svg
      className="unit"
      viewBox={box}
      role="img"
      aria-label="The unit that repeats"
      onPointerLeave={() => onHover?.(undefined)}
    >
      <g transform="scale(1,-1)">
        {pieces.map((p) => (
          <polygon
            key={`${p.piece}@${p.i},${p.j}`}
            className="unit-piece"
            role="button"
            aria-label={`Paint ring ${ringOf.get(placeKey(model, p.piece, p.i, p.j)) ?? '?'}, the ${nameOf(p.type)}s`}
            data-type={p.type}
            points={p.polygon.map((q) => `${q.x},${q.y}`).join(' ')}
            fill={fill(p.piece, p.i, p.j)}
            onPointerEnter={() => onHover?.(p.type)}
            onClick={() => onPick?.(p.type, { piece: p.piece, i: p.i, j: p.j })}
          />
        ))}
      </g>
    </svg>
  );
}
