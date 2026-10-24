import type { JaliAppearance, PenLook } from '@tastir/schema';
import {
  pieceAt,
  rectangularPeriod,
  type Pattern,
  type Vec,
} from '@tastir/engine';
import { useId, useMemo, useRef } from 'react';
import { fit, viewBox, width } from './camera';
import { DEFAULT_FINISH, type Finish } from './coloring';
import { relief, strapWidths, tiling } from './drawing';
import { patchesAt, patchPath, weaveRepeat } from './interlace';
import type { Model } from './model';
import { useCamera } from './useCamera';
import { placeKey } from './placement';
import { ringsOf } from './rings';
import { boardRef as agentBoardRef } from '../agent/screenTargets';
import { repeatTargets } from '../agent/repeatTargets';
import { JaliFramework, JaliGround, latticeWidth } from './jali';
import { DEFAULT_PEN, PAPER, penStrokes, washOpacity } from './pen';

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

/** The whole move into colour lasts about this long, however many rings. */
const FILL_MS = 3600;
/** The most time between one ring and the next. */
const RING_MS = 400;

/**
 * When each piece takes its colour as the wall comes in, in milliseconds:
 * ring by ring from the middle of each rosette (and of each filler star)
 * outward. A piece's ring is its distance from the nearest such middle;
 * a pattern without rosettes counts out from the cell's origin. Every copy of
 * a piece is the same distance from its own middle, so the cell's pieces
 * are enough.
 */
export function fillDelays(pattern: Pattern): number[] {
  const { u, v, origin } = pattern.cell;
  const centres = ringsOf(pattern)?.centres.map((c) => c.at) ?? [origin];
  const size = Math.hypot(u.x, u.y) + Math.hypot(v.x, v.y);
  const distances = pattern.pieces.map(({ polygon }) => {
    const n = polygon.length;
    const mid = polygon.reduce(
      (a, p) => ({ x: a.x + p.x / n, y: a.y + p.y / n }),
      { x: 0, y: 0 },
    );
    const d = Math.min(
      ...centres.map((c) => Math.hypot(c.x - mid.x, c.y - mid.y)),
    );
    // Pieces of one ring sit at the same distance, up to rounding.
    return Math.round((d / size) * 2000);
  });
  const rings = [...new Set(distances)].sort((a, b) => a - b);
  const step = Math.min(RING_MS, FILL_MS / Math.max(1, rings.length));
  return distances.map((d) => Math.round(rings.indexOf(d) * step));
}

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
  pen = DEFAULT_PEN,
  finish = DEFAULT_FINISH,
  onHover,
  onPick,
  enter = false,
  lit,
  boardRef,
  boardCamera,
}: {
  /** Optional shared board for image capture and annotations in the assistant. */
  boardRef?: React.RefObject<SVGSVGElement | null>;
  boardCamera?: ReturnType<typeof useCamera>;
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
  /** How the lines style draws: pen, wash and ink. */
  pen?: PenLook;
  /** The colours of the lines and bands, and whether they are carved. */
  finish?: Finish;
  /** Tells which piece type is under the pointer (the wall itself does
   * not change: the piece panel marks the type). */
  onHover?: (type: number | undefined) => void;
  onPick?: (
    type: number,
    place: { piece: number; i: number; j: number },
  ) => void;
  /** A ring's colour key (placeKey): its pieces are lit on the wall and the
   * others dimmed, while the learner points at the ring in the panel. */
  lit?: string;
  /** Play the move into colour: each piece takes its colour in turn,
   * ring by ring from the middles of the rosettes outward. */
  enter?: boolean;
}) {
  const id = useId().replace(/:/g, '');
  const ownRef = useRef<SVGSVGElement>(null);
  const svgRef = boardRef ?? ownRef;
  const start = useMemo(() => tiling(model).view, [model]);
  const ownCamera = useCamera(start, svgRef, { active: !boardCamera });
  const camera = boardCamera ?? ownCamera;
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
  const lines = style === 'lines';
  // The lines style draws a double or pencil line along the ink; a single
  // pen line is the pieces' own edges.
  const strokes = lines ? penStrokes(pen.pen) : [];
  const groutWidth = strapWidths(
    model,
    jali ? latticeWidth(grout) : grout,
  ).grout;

  // The pieces and ink strokes in tile coordinates, with neighbours' copies.
  const shifted = useMemo(() => {
    const out: {
      type: number;
      piece: number;
      i: number;
      j: number;
      points: string;
      fill: string;
    }[] = [];
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
              piece: k,
              i,
              j,
              points: pts(corners),
              fill: fill ? fill(k, i, j) : (colors[piece.type] ?? '#999999'),
            });
          });
        if (banded(style) || jali || finish.carved || strokes.length)
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
  }, [
    pattern,
    tile,
    fill,
    colors,
    jali,
    style,
    groutWidth,
    finish.carved,
    strokes.length,
  ]);
  const bandPath = useMemo(
    () =>
      shifted.lines.map(([a, b]) => `M${a.x} ${a.y}L${b.x} ${b.y}`).join(''),
    [shifted],
  );
  const overPath = useMemo(() => {
    const d = (list: Vec[][]) => list.map((ps) => patchPath(ps)).join('');
    return { out: d(shifted.over), in: d(shifted.overIn) };
  }, [shifted]);

  // Coming in, each piece takes its colour in turn, from the middles out.
  const delays = useMemo(
    () => (enter ? fillDelays(pattern) : undefined),
    [enter, pattern],
  );

  // The pieces of the ring pointed at in the panel.
  const litPieces = useMemo(
    () =>
      lit === undefined
        ? undefined
        : new Set(
            shifted.pieces.flatMap((p, n) =>
              placeKey(model, p.piece, p.i, p.j) === lit ? [n] : [],
            ),
          ),
    [lit, shifted, model],
  );

  // Camera changes only move the covering rectangle; the tile's SVG
  // children can be reused without rebuilding every polygon on each frame.
  const pieceNodes = useMemo(
    () =>
      shifted.pieces.map((p, i) => (
        <polygon
          key={i}
          data-type={p.type}
          data-delay={delays?.[p.piece]}
          className={litPieces?.has(i) ? 'wall-piece lit' : 'wall-piece'}
          style={
            {
              '--type': p.type,
              ...(delays
                ? { animationDelay: `${delays[p.piece] ?? 0}ms` }
                : {}),
            } as React.CSSProperties
          }
          points={p.points}
          fill={(lines && !pen.wash) || jali ? 'none' : p.fill}
          fillOpacity={lines && pen.wash ? washOpacity(pen.pen) : undefined}
          stroke={
            style === 'tiles'
              ? finish.lines
              : lines && pen.pen === 'single'
                ? pen.ink
                : 'none'
          }
          strokeWidth={lines ? groutWidth * 0.8 : groutWidth}
          strokeLinejoin="round"
        />
      )),
    [shifted, jali, style, lines, pen, groutWidth, finish, delays, litPieces],
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
      ref={
        import.meta.env.DEV
          ? agentBoardRef(
              svgRef,
              (_svg, box) =>
                repeatTargets(model, box).map((t) => ({
                  ...t,
                  id: `geometry:${t.id}`,
                })),
              model,
            )
          : svgRef
      }
      className={`drawing wall style-${style}${enter ? ' color-enter' : ''}${litPieces ? ' lighting' : ''}`}
      viewBox={viewBox(camera.view)}
      preserveAspectRatio={boardCamera ? 'xMidYMid meet' : 'xMidYMid slice'}
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
          {lines ? (
            <rect width={tile.lu} height={tile.lv} fill={PAPER} />
          ) : null}
          {pieceNodes}
          {/* Carved: each line or band in relief, a shadow below it and a
              light edge above (light from the top left). */}
          {finish.carved && !jali && style !== 'interlace' && !strokes.length
            ? relief(bandPath, banded(style) ? groutWidth * 4 : groutWidth)
            : null}
          {strokes.map((s, k) => (
            <path
              key={k}
              className={`pen-${pen.pen}`}
              d={bandPath}
              fill="none"
              stroke={s.paper ? PAPER : pen.ink}
              strokeOpacity={s.opacity}
              strokeWidth={groutWidth * s.width}
              strokeLinecap="round"
              strokeLinejoin="round"
              transform={
                s.dx || s.dy
                  ? `translate(${groutWidth * s.dx} ${groutWidth * s.dy})`
                  : undefined
              }
            />
          ))}
          {banded(style)
            ? (['out', 'in'] as const).map((layer) => (
                <g key={layer} className={`band-${layer}`}>
                  {/* Every band line in one path, so a wall of hundreds of
                      lines stays light. */}
                  <path
                    d={bandPath}
                    fill="none"
                    stroke={layer === 'out' ? finish.lines : finish.band}
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
                  stroke={layer === 'out' ? finish.lines : finish.band}
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
