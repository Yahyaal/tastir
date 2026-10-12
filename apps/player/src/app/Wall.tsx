import type { JaliAppearance } from '@tastir/schema';
import { pieceAt, rectangularPeriod, type Vec } from '@tastir/engine';
import { useId, useMemo, useRef } from 'react';
import { fit, viewBox, width } from './camera';
import { STRAP_BAND, STRAP_EDGE, strapWidths, tiling } from './drawing';
import { patchesAt, patchPath, weaveRepeat } from './interlace';
import type { Model } from './model';
import { useCamera } from './useCamera';
import { ColorReveal } from './ColorReveal';
import { JaliFramework, JaliGround, latticeWidth } from './jali';

export type WallStyle = 'tiles' | 'strapwork' | 'interlace' | 'lines' | 'jali';
export const WALL_STYLES: readonly WallStyle[] = [
  'tiles',
  'strapwork',
  'interlace',
  'lines',
  'jali',
];

/** Whether a style draws the ink as bands (interlace weaves them). */
export const banded = (style: WallStyle | undefined) =>
  style === 'strapwork' || style === 'interlace';

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
  jali: appearance,
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
  jali?: JaliAppearance;
  /** Tells which piece type is under the pointer (the wall itself does
   * not change: the piece panel marks the type). */
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
  const { pattern } = model;
  // The weave may repeat after two tiles: the wall's tile holds whole
  // repeats of both the colouring and the weave.
  const [wm, wn] = useMemo(
    (): readonly [number, number] =>
      style === 'interlace' ? weaveRepeat(pattern) : [1, 1],
    [style, pattern],
  );
  const rm = lcm(repeat[0], wm);
  const rn = lcm(repeat[1], wn);
  const tile = useMemo(() => tileFrame(model, [rm, rn]), [model, rm, rn]);
  // Grout in proportion to the tile, so every pattern gets the same look.
  const jali = style === 'jali';
  const groutWidth = strapWidths(
    model,
    jali ? latticeWidth(grout) : grout,
  ).grout;

  // The pieces and ink strokes in tile coordinates, with neighbours' copies.
  const shifted = useMemo(() => {
    const out: { type: number; points: string; fill: string }[] = [];
    const lines: [Vec, Vec][] = [];
    const over: Vec[][] = [];
    const overIn: Vec[][] = [];
    const { u, v } = pattern.cell;
    for (let i = -tile.reach; i <= tile.reach; i++) {
      for (let j = -tile.reach; j <= tile.reach; j++) {
        const dx = u.x * i + v.x * j;
        const dy = u.y * i + v.y * j;
        const move = (p: Vec) => tile.toTile({ x: p.x + dx, y: p.y + dy });
        if (!jali)
          pattern.pieces.forEach((piece, k) => {
            const corners = piece.polygon.map(move);
            // The SVG pattern clips to this rectangle. Keep a stroke-width
            // margin so grout just outside an edge can still paint into it.
            const margin = groutWidth;
            if (
              corners.every((p) => p.x < -margin) ||
              corners.every((p) => p.x > tile.lu + margin) ||
              corners.every((p) => p.y < -margin) ||
              corners.every((p) => p.y > tile.lv + margin)
            )
              return;
            out.push({
              type: piece.type,
              points: pts(corners),
              fill: fill ? fill(k, i, j) : (colors[piece.type] ?? '#999999'),
            });
          });
        for (const s of pattern.ink)
          lines.push([move(s.segment.a), move(s.segment.b)]);
        // The patches are already placed in tile (i, j).
        if (style === 'interlace')
          for (const p of patchesAt(pattern, i, j, groutWidth * 4)) {
            over.push(p.edge.map(tile.toTile));
            overIn.push(p.band.map(tile.toTile));
          }
      }
    }
    return { pieces: out, lines, over, overIn };
  }, [pattern, tile, fill, colors, jali, style, groutWidth]);
  const bandPath = useMemo(
    () =>
      shifted.lines.map(([a, b]) => `M${a.x} ${a.y}L${b.x} ${b.y}`).join(''),
    [shifted],
  );
  const overPath = useMemo(() => {
    const d = (list: Vec[][]) => list.map((ps) => patchPath(ps)).join('');
    return { out: d(shifted.over), in: d(shifted.overIn) };
  }, [shifted]);

  // Camera changes only move the covering rectangle; the tile's SVG
  // children can be reused without rebuilding every polygon on each frame.
  const pieceNodes = useMemo(
    () =>
      shifted.pieces.map((p, i) => (
        <polygon
          key={i}
          data-type={p.type}
          className="wall-piece"
          style={{ '--type': p.type } as React.CSSProperties}
          points={p.points}
          fill={style === 'lines' || jali ? 'none' : p.fill}
          stroke={style === 'tiles' || style === 'lines' ? INK : 'none'}
          strokeWidth={style === 'lines' ? groutWidth * 0.8 : groutWidth}
          strokeLinejoin="round"
        />
      )),
    [shifted, jali, style, groutWidth],
  );

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

  const cover = fit(camera.view, 1);
  return (
    <svg
      ref={svgRef}
      className={`drawing wall style-${style}${enter ? ' color-enter' : ''}`}
      viewBox={viewBox(camera.view)}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="The pattern repeated as a wall"
      onPointerMove={(e) => {
        if (!jali) onHover?.(typeAt(e.clientX, e.clientY)?.type);
      }}
      onPointerLeave={() => onHover?.(undefined)}
      onClick={(e) => {
        if (camera.wasDrag() || jali) return;
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
          {pieceNodes}
          {banded(style)
            ? (['out', 'in'] as const).map((layer) => (
                <g key={layer} className={`band-${layer}`}>
                  {/* Every band line in one path, so a wall of hundreds of
                      lines stays light. */}
                  <path
                    d={bandPath}
                    fill="none"
                    stroke={layer === 'out' ? INK : BAND}
                    strokeWidth={
                      layer === 'out' ? groutWidth * 4 : groutWidth * 2.4
                    }
                    strokeLinecap="round"
                  />
                </g>
              ))
            : null}
          {/* Interlace: the band on top at each crossing, drawn again over
              the one below, with square ends so it joins its own band. */}
          {style === 'interlace' && overPath.out
            ? (['out', 'in'] as const).map((layer) => (
                <path
                  key={layer}
                  className={`over-${layer}`}
                  d={overPath[layer]}
                  fill="none"
                  stroke={layer === 'out' ? INK : BAND}
                  strokeWidth={
                    layer === 'out' ? groutWidth * 4 : groutWidth * 2.4
                  }
                  strokeLinecap="butt"
                  strokeLinejoin="round"
                />
              ))
            : null}
          {jali ? (
            <JaliFramework
              appearance={appearance}
              path={bandPath}
              width={groutWidth}
              toLocalOffset={(x, y) =>
                tile.toTile({
                  x: pattern.cell.origin.x + x,
                  y: pattern.cell.origin.y - y,
                })
              }
            />
          ) : null}
        </pattern>
      </defs>
      {jali ? (
        <JaliGround
          id={`jali-light-${id}`}
          view={cover}
          appearance={appearance}
        />
      ) : null}
      <rect
        x={cover.minX}
        y={-cover.maxY}
        width={width(cover)}
        height={cover.maxY - cover.minY}
        fill={`url(#wall-${id})`}
      />
      {enter && !jali ? (
        <ColorReveal pattern={pattern} view={start} groutWidth={groutWidth} />
      ) : null}
    </svg>
  );
}

/** The least common multiple of two small whole numbers. */
function lcm(a: number, b: number): number {
  let x = a;
  let y = b;
  while (y) [x, y] = [y, x % y];
  return (a / x) * b;
}
