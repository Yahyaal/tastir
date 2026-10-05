import { pieceAt, rectangularPeriod, type Vec } from '@tastir/engine';
import { useId, useMemo, useRef } from 'react';
import { fit, viewBox, width, type Rect } from './camera';
import { tiling } from './drawing';
import type { Model } from './model';
import { useCamera } from './useCamera';

export type WallStyle = 'tiles' | 'strapwork' | 'lines';
export const WALL_STYLES: readonly WallStyle[] = [
  'tiles',
  'strapwork',
  'lines',
];

const INK = '#23201c';
const BAND = '#f7f2e6';

/**
 * Maps the tutorial frame into the tile's own frame and back. The SVG
 * pattern tile is always a rectangle: the cell itself, or for a
 * parallelogram cell the rectangle that spans the same lattice, so grout
 * is never sheared.
 */
function tileFrame(model: Model) {
  const { cell } = model.pattern;
  const { origin } = cell;
  const { u, v } = rectangularPeriod(cell) ?? cell;
  const lu = Math.hypot(u.x, u.y);
  const lv = Math.hypot(v.x, v.y);
  const eu = { x: u.x / lu, y: u.y / lu };
  const ev = { x: v.x / lv, y: v.y / lv };
  /** A frame point in tile coordinates: along u, along v. */
  const toTile = (p: Vec) => {
    const d = { x: p.x - origin.x, y: p.y - origin.y };
    return { x: d.x * eu.x + d.y * eu.y, y: d.x * ev.x + d.y * ev.y };
  };
  // Tile coordinates to SVG (whose y points down): through the frame.
  const matrix = `matrix(${eu.x} ${-eu.y} ${ev.x} ${-ev.y} ${origin.x} ${-origin.y})`;
  // How many cells either way it takes to cover the rectangle.
  const reach = v === cell.v ? 1 : 4;
  return { lu, lv, toTile, matrix, reach };
}

const pts = (ps: readonly Vec[]) => ps.map((p) => `${p.x},${p.y}`).join(' ');

/**
 * The colored pattern repeated without end: one SVG pattern tile holds the
 * cell's pieces (and their copies from the neighbouring cells, so pieces
 * crossing its edge are whole), and one rectangle covering the view
 * is filled with it. Drag pans, the wheel zooms.
 */
export function Wall({
  model,
  colors,
  look: style = 'tiles',
  grout = 1,
  hovered,
  onHover,
  onPick,
  enter = false,
}: {
  model: Model;
  colors: readonly string[];
  look?: WallStyle;
  /** Grout (or band) width, as a multiple of the normal width. */
  grout?: number;
  /** The piece type to highlight on every copy, if any. */
  hovered?: number;
  onHover?: (type: number | undefined) => void;
  onPick?: (type: number) => void;
  /** Play the move into colour: each piece type floods in, one by one. */
  enter?: boolean;
}) {
  const id = useId().replace(/:/g, '');
  const svgRef = useRef<SVGSVGElement>(null);
  const start = useMemo(() => tiling(model).view, [model]);
  const camera = useCamera(start, svgRef);
  const tile = useMemo(() => tileFrame(model), [model]);
  const { pattern } = model;
  // Grout in proportion to the tile, so every pattern gets the same look.
  const unit = width(fullCell(model)) / 2;
  const groutWidth = 0.012 * unit * grout;

  // The pieces and ink strokes in tile coordinates, with neighbours' copies.
  const shifted = useMemo(() => {
    const out: { type: number; corners: Vec[] }[] = [];
    const lines: [Vec, Vec][] = [];
    const { u, v } = pattern.cell;
    for (let i = -tile.reach; i <= tile.reach; i++) {
      for (let j = -tile.reach; j <= tile.reach; j++) {
        const dx = u.x * i + v.x * j;
        const dy = u.y * i + v.y * j;
        const move = (p: Vec) => tile.toTile({ x: p.x + dx, y: p.y + dy });
        for (const piece of pattern.pieces) {
          out.push({ type: piece.type, corners: piece.polygon.map(move) });
        }
        for (const s of pattern.ink)
          lines.push([move(s.segment.a), move(s.segment.b)]);
      }
    }
    return { pieces: out, lines };
  }, [pattern, tile]);

  const pieceClass = (type: number) =>
    hovered === undefined
      ? 'wall-piece'
      : hovered === type
        ? 'wall-piece hl'
        : 'wall-piece dim';

  /** The piece type under a screen position. */
  const typeAt = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    const m = svg?.getScreenCTM?.();
    const at = m?.a
      ? (() => {
          const q = new DOMPoint(clientX, clientY).matrixTransform(m.inverse());
          return { x: q.x, y: -q.y };
        })()
      : {
          x: (camera.view.minX + camera.view.maxX) / 2,
          y: (camera.view.minY + camera.view.maxY) / 2,
        };
    const hit = pieceAt(pattern, at);
    return hit ? pattern.pieces[hit.index]?.type : undefined;
  };

  // The pieces sit in an SVG pattern, where CSS animations do not play, so
  // the colour flood is a white veil over the wall: one copy of every piece
  // in the first view, fading out a type at a time. Once faded it stays,
  // invisible and ignoring the pointer.
  const veil = useMemo(() => {
    if (!enter) return [];
    const { shifts } = tiling(model);
    const view = start;
    const out: { type: number; pts: string }[] = [];
    for (const d of shifts) {
      for (const p of pattern.pieces) {
        const moved = p.polygon.map((q) => ({ x: q.x + d.x, y: q.y + d.y }));
        if (
          moved.every((q) => q.x < view.minX) ||
          moved.every((q) => q.x > view.maxX) ||
          moved.every((q) => q.y < view.minY) ||
          moved.every((q) => q.y > view.maxY)
        )
          continue;
        out.push({
          type: p.type,
          pts: moved.map((q) => `${q.x},${-q.y}`).join(' '),
        });
      }
    }
    return out;
  }, [enter, model, pattern, start]);

  const cover = fit(camera.view, 1);
  return (
    <svg
      ref={svgRef}
      className={`drawing wall style-${style}${enter ? ' color-enter' : ''}`}
      viewBox={viewBox(camera.view)}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="The pattern repeated as a wall"
      onPointerMove={(e) => onHover?.(typeAt(e.clientX, e.clientY))}
      onPointerLeave={() => onHover?.(undefined)}
      onClick={(e) => {
        if (camera.wasDrag()) return;
        const type = typeAt(e.clientX, e.clientY);
        if (type !== undefined) onPick?.(type);
      }}
    >
      <defs>
        <pattern
          id={`wall-${id}`}
          patternUnits="userSpaceOnUse"
          width={tile.lu}
          height={tile.lv}
          patternTransform={tile.matrix}
        >
          {style === 'lines' ? (
            <rect width={tile.lu} height={tile.lv} fill="#fff" />
          ) : null}
          {shifted.pieces.map((p, i) => (
            <polygon
              key={i}
              data-type={p.type}
              className={pieceClass(p.type)}
              style={{ '--type': p.type } as React.CSSProperties}
              points={pts(p.corners)}
              fill={style === 'lines' ? 'none' : colors[p.type]}
              stroke={
                style === 'tiles' ? INK : style === 'lines' ? INK : 'none'
              }
              strokeWidth={style === 'lines' ? groutWidth * 0.8 : groutWidth}
              strokeLinejoin="round"
            />
          ))}
          {style === 'strapwork'
            ? (['out', 'in'] as const).map((layer) => (
                <g key={layer} className={`band-${layer}`}>
                  {shifted.lines.map(([a, b], i) => (
                    <line
                      key={i}
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke={layer === 'out' ? INK : BAND}
                      strokeWidth={
                        layer === 'out' ? groutWidth * 4 : groutWidth * 2.4
                      }
                      strokeLinecap="round"
                    />
                  ))}
                </g>
              ))
            : null}
        </pattern>
      </defs>
      <rect
        x={cover.minX}
        y={-cover.maxY}
        width={width(cover)}
        height={cover.maxY - cover.minY}
        fill={`url(#wall-${id})`}
      />
      {veil.length ? (
        <g className="color-veil" aria-hidden="true">
          {pattern.types.map((_, type) => (
            <g
              key={type}
              className="veil-type"
              style={{ '--type': type } as React.CSSProperties}
              fill="#fff"
              stroke={INK}
              strokeWidth={groutWidth}
              strokeLinejoin="round"
            >
              {veil
                .filter((v) => v.type === type)
                .map((v, i) => (
                  <polygon key={i} points={v.pts} />
                ))}
            </g>
          ))}
        </g>
      ) : null}
    </svg>
  );
}

/** The cell's box, for sizing grout in proportion to the pattern. */
function fullCell(model: Model): Rect {
  const xs = model.pattern.cell.corners.map((p) => p.x);
  const ys = model.pattern.cell.corners.map((p) => p.y);
  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  };
}
