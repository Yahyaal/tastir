import type { Vec } from '@tastir/engine';
import { useMemo, useState } from 'react';
import type { Model } from './model';
import { Unit } from './Unit';
import { blockGhosts, blockOf, fillBlocks } from './unitWall';

type Place = { piece: number; i: number; j: number };

const pts = (vs: readonly Vec[]) => vs.map((v) => `${v.x},${v.y}`).join(' ');

/**
 * Colouring the unit, as the tile is repeated in drawing along: the unit
 * on the left, large, to paint piece by piece, and on the right a wall
 * built from copies of it, a click on a ghost placing the next copy.
 */
export function UnitBoard({
  model,
  fill,
  onHover,
  onPick,
}: {
  model: Model;
  fill: (piece: number, i: number, j: number) => string;
  onHover?: (type: number | undefined) => void;
  onPick?: (type: number, place: Place) => void;
}) {
  const block = useMemo(() => blockOf(model), [model]);
  const [copies, setCopies] = useState<Vec[]>([]);
  // The block's outline for the ghosts: every piece's edge, in one path.
  const outline = useMemo(
    () =>
      block?.pieces
        .map((p) => `M${p.polygon.map((q) => `${q.x},${q.y}`).join('L')}Z`)
        .join('') ?? '',
    [block],
  );
  if (!block) return null;
  const ghosts = blockGhosts(block, copies);
  const placed = [{ x: 0, y: 0 }, ...copies];
  // The view holds every copy and every ghost.
  const xs = block.pieces.flatMap((p) => p.polygon.map((q) => q.x));
  const ys = block.pieces.flatMap((p) => p.polygon.map((q) => q.y));
  const at = [...placed, ...ghosts.map((g) => g.at)];
  const minX = Math.min(...xs) + Math.min(...at.map((a) => a.x));
  const maxX = Math.max(...xs) + Math.max(...at.map((a) => a.x));
  const minY = Math.min(...ys) + Math.min(...at.map((a) => a.y));
  const maxY = Math.max(...ys) + Math.max(...at.map((a) => a.y));
  const pad = 0.03 * Math.max(maxX - minX, maxY - minY);
  const box = `${minX - pad} ${-maxY - pad} ${maxX - minX + 2 * pad} ${maxY - minY + 2 * pad}`;
  return (
    <div className="unit-board">
      <div className="unit-half">
        <p className="unit-hint">Your unit: click a piece to paint its ring.</p>
        <Unit model={model} fill={fill} onHover={onHover} onPick={onPick} />
      </div>
      <div className="unit-half">
        <div className="unit-hint">
          <span>Click a ghost to place a copy.</span>
          <button
            type="button"
            className="quiet"
            onClick={() => setCopies(fillBlocks(block, copies))}
          >
            Fill the wall for me
          </button>
          <button
            type="button"
            className="quiet"
            disabled={!copies.length}
            onClick={() => setCopies([])}
          >
            Clear the copies
          </button>
        </div>
        <svg
          className="unit-wall"
          viewBox={box}
          role="img"
          aria-label="Your wall of units"
          onPointerLeave={() => onHover?.(undefined)}
        >
          <g transform="scale(1,-1)">
            {placed.map((d, c) => (
              <g
                key={`${d.x},${d.y}`}
                className={c ? 'unit-copy' : 'unit-copy first'}
                transform={`translate(${d.x},${d.y})`}
              >
                {block.pieces.map((p) => (
                  <polygon
                    key={`${p.piece}@${p.i},${p.j}`}
                    className="unit-piece"
                    data-type={p.type}
                    points={pts(p.polygon)}
                    fill={fill(p.piece, p.i, p.j)}
                    onPointerEnter={() => onHover?.(p.type)}
                    onClick={() =>
                      onPick?.(p.type, { piece: p.piece, i: p.i, j: p.j })
                    }
                  />
                ))}
              </g>
            ))}
            {ghosts.map((g) => (
              <path
                key={`${g.at.x},${g.at.y}`}
                className="unit-ghost"
                d={outline}
                transform={`translate(${g.at.x},${g.at.y})`}
                onClick={() => setCopies([...copies, g.at])}
              />
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}
