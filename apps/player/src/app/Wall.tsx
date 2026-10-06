import { pieceAt, rectangularPeriod, type Vec } from '@tastir/engine';
import { useId, useLayoutEffect, useMemo, useRef } from 'react';
import { fit, viewBox, width } from './camera';
import { STRAP_BAND, STRAP_EDGE, strapWidths, tiling } from './drawing';
import type { Model } from './model';
import { useCamera } from './useCamera';

export type WallStyle = 'tiles' | 'strapwork' | 'lines';
export const WALL_STYLES: readonly WallStyle[] = [
  'tiles',
  'strapwork',
  'lines',
];

const INK = STRAP_EDGE;
const BAND = STRAP_BAND;

/**
 * Maps the tutorial frame into the tile's own frame and back. The SVG
 * pattern tile is always a rectangle: the cell itself, or for a
 * parallelogram cell the rectangle that spans the same lattice, so grout
 * is never sheared.
 */
function tileFrame(model: Model, [m, n]: readonly [number, number] = [1, 1]) {
  const base = model.pattern.cell;
  // The coloring may repeat after more than one cell along each slide.
  const cell = {
    ...base,
    u: { x: base.u.x * m, y: base.u.y * m },
    v: { x: base.v.x * n, y: base.v.y * n },
  };
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
  const reach = (v === cell.v ? 1 : 4) * Math.max(m, n);
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
  fill,
  repeat = [1, 1],
  look: style = 'tiles',
  grout = 1,
  hovered,
  onHover,
  onPick,
  enter = false,
}: {
  model: Model;
  colors: readonly string[];
  /** The fill for each placement (piece, and the cell it is copied to),
   * when same-shaped pieces take different colors; else `colors`. */
  fill?: (piece: number, i: number, j: number) => string;
  /** How many cells along each slide the coloring repeats after. */
  repeat?: readonly [number, number];
  look?: WallStyle;
  /** Grout (or band) width, as a multiple of the normal width. */
  grout?: number;
  /** The piece type to highlight on every copy, if any. */
  hovered?: number;
  onHover?: (type: number | undefined) => void;
  onPick?: (
    type: number,
    place: { piece: number; i: number; j: number },
  ) => void;
  /** Play the move into colour: each piece type floods in, one by one. */
  enter?: boolean;
}) {
  const id = useId().replace(/:/g, '');
  const svgRef = useRef<SVGSVGElement>(null);
  const start = useMemo(() => tiling(model).view, [model]);
  const camera = useCamera(start, svgRef);
  const [rm, rn] = repeat;
  const tile = useMemo(() => tileFrame(model, [rm, rn]), [model, rm, rn]);
  const { pattern } = model;
  // Grout in proportion to the tile, so every pattern gets the same look.
  const groutWidth = strapWidths(model, grout).grout;

  // The pieces and ink strokes in tile coordinates, with neighbours' copies.
  const shifted = useMemo(() => {
    const out: { type: number; corners: Vec[]; fill: string }[] = [];
    const lines: [Vec, Vec][] = [];
    const { u, v } = pattern.cell;
    for (let i = -tile.reach; i <= tile.reach; i++) {
      for (let j = -tile.reach; j <= tile.reach; j++) {
        const dx = u.x * i + v.x * j;
        const dy = u.y * i + v.y * j;
        const move = (p: Vec) => tile.toTile({ x: p.x + dx, y: p.y + dy });
        pattern.pieces.forEach((piece, k) => {
          out.push({
            type: piece.type,
            corners: piece.polygon.map(move),
            fill: fill ? fill(k, i, j) : (colors[piece.type] ?? '#999999'),
          });
        });
        for (const s of pattern.ink)
          lines.push([move(s.segment.a), move(s.segment.b)]);
      }
    }
    return { pieces: out, lines };
  }, [pattern, tile, fill, colors]);

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
    const piece = hit ? pattern.pieces[hit.index] : undefined;
    if (!hit || !piece) return undefined;
    // Which copy of the cell: the shift in steps of the two slides.
    const { u, v } = pattern.cell;
    const det = u.x * v.y - u.y * v.x;
    const i = Math.round((hit.shift.x * v.y - hit.shift.y * v.x) / det);
    const j = Math.round((u.x * hit.shift.y - u.y * hit.shift.x) / det);
    return { type: piece.type, place: { piece: hit.index, i, j } };
  };

  // The pieces sit in an SVG pattern, where CSS animations do not play, so
  // the colouring is a white veil over the wall: one copy of every piece
  // in the first view. Like a hand with one colour at a time, each type's
  // veils fade from the centre outwards, then the next type's. Once faded
  // the veil stays, invisible and ignoring the pointer.
  const veil = useMemo(() => {
    if (!enter) return [];
    const { shifts } = tiling(model);
    const view = start;
    const out: { type: number; pts: string; dist: number }[] = [];
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
        const c = moved.reduce((a, q) => ({ x: a.x + q.x, y: a.y + q.y }), {
          x: 0,
          y: 0,
        });
        out.push({
          type: p.type,
          pts: moved.map((q) => `${q.x},${-q.y}`).join(' '),
          dist: Math.hypot(c.x, c.y) / moved.length,
        });
      }
    }
    return out;
  }, [enter, model, pattern, start]);

  const veilRef = useRef<SVGGElement>(null);
  useLayoutEffect(() => {
    const g = veilRef.current;
    if (!g || !veil.length) return;
    const nodes = [...g.querySelectorAll<SVGPolygonElement>('polygon')];
    if (nodes.some((n) => typeof n.animate !== 'function')) {
      g.style.display = 'none';
      return;
    }
    const far = Math.max(...veil.map((v) => v.dist)) || 1;
    const byType = pattern.types.map(() => [] as number[]);
    veil.forEach((v, i) => byType[v.type]?.push(i));
    const anims: Animation[] = [];
    let k = 0;
    byType.forEach((list, order) => {
      for (const i of list) {
        const v = veil[i];
        const node = nodes[k++];
        if (!v || !node) continue;
        anims.push(
          node.animate([{ opacity: 1 }, { opacity: 0 }], {
            duration: COLOR_FILL_MS,
            delay:
              400 + order * COLOR_TYPE_MS + (v.dist / far) * COLOR_SPREAD_MS,
            easing: 'ease-out',
            fill: 'both',
          }),
        );
      }
    });
    return () => anims.forEach((a) => a.cancel());
  }, [veil, pattern]);

  const cover = fit(camera.view, 1);
  return (
    <svg
      ref={svgRef}
      className={`drawing wall style-${style}${enter ? ' color-enter' : ''}`}
      viewBox={viewBox(camera.view)}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="The pattern repeated as a wall"
      onPointerMove={(e) => onHover?.(typeAt(e.clientX, e.clientY)?.type)}
      onPointerLeave={() => onHover?.(undefined)}
      onClick={(e) => {
        if (camera.wasDrag()) return;
        const hit = typeAt(e.clientX, e.clientY);
        if (hit) onPick?.(hit.type, hit.place);
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
              fill={style === 'lines' ? 'none' : p.fill}
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
        <g ref={veilRef} className="color-veil" aria-hidden="true">
          {pattern.types.map((_, type) => (
            <g
              key={type}
              className="veil-type"
              data-type={type}
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

/** The colouring: each piece's fade, one type after another, and how long
 * one type takes to spread from the centre to the edge of the view. */
const COLOR_FILL_MS = 350;
const COLOR_TYPE_MS = 1100;
const COLOR_SPREAD_MS = 800;
