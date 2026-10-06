import { useLayoutEffect, useMemo, useRef } from 'react';
import type {
  Geometry,
  InkPiece,
  Line,
  SceneElement,
  Vec,
} from '@tastir/engine';
import {
  compassStart,
  usedNames,
  rulerOrder,
  RULER_COLOR,
  TILE_COLOR,
} from './animation';
import { fit, fullView, viewBox, width, type Rect } from './camera';
import { pieceColors } from './coloring';
import { carriersOf, hiddenSteps, type Model } from './model';

/** SVG has y pointing down; the tutorial frame has y pointing up. */
const sx = (p: Vec) => p.x;
const sy = (p: Vec) => -p.y;
const points = (ps: readonly Vec[]) =>
  ps.map((p) => `${sx(p)},${sy(p)}`).join(' ');

/** The part of an infinite line inside the rectangle (Liang–Barsky). */
function clip(l: Line, r: Rect): [Vec, Vec] | undefined {
  let t0 = -Infinity;
  let t1 = Infinity;
  const edges: [number, number, number][] = [
    [l.dir.x, l.point.x, r.minX],
    [-l.dir.x, -l.point.x, -r.maxX],
    [l.dir.y, l.point.y, r.minY],
    [-l.dir.y, -l.point.y, -r.maxY],
  ];
  for (const [d, p, lo] of edges) {
    if (d === 0) {
      if (p < lo) return undefined;
      continue;
    }
    const t = (lo - p) / d;
    if (d > 0) t0 = Math.max(t0, t);
    else t1 = Math.min(t1, t);
  }
  if (t0 > t1) return undefined;
  const at = (t: number): Vec => ({
    x: l.point.x + l.dir.x * t,
    y: l.point.y + l.dir.y * t,
  });
  return [at(t0), at(t1)];
}

function Shape({
  name,
  g,
  view,
  className,
  startDeg = 0,
}: {
  name: string;
  g: Geometry;
  view: Rect;
  className: string;
  /** Where a circle's stroke starts, in degrees in the tutorial frame. */
  startDeg?: number;
}) {
  switch (g.kind) {
    case 'line': {
      const seg = clip(g.line, view);
      if (!seg) return null;
      const [a, b] = seg;
      return (
        <line
          data-name={name}
          className={className}
          x1={sx(a)}
          y1={sy(a)}
          x2={sx(b)}
          y2={sy(b)}
          vectorEffect="non-scaling-stroke"
        />
      );
    }
    case 'circle':
      return (
        <circle
          data-name={name}
          className={className}
          cx={sx(g.circle.centre)}
          cy={sy(g.circle.centre)}
          r={g.circle.radius}
          // SVG strokes a circle from its rightmost point, clockwise on
          // screen; turn it so the stroke starts where the compass opens.
          transform={`rotate(${-startDeg} ${sx(g.circle.centre)} ${sy(g.circle.centre)})`}
          vectorEffect="non-scaling-stroke"
        />
      );
    case 'polygon':
      return (
        <polygon
          data-name={name}
          className={className}
          points={points(g.vertices)}
          vectorEffect="non-scaling-stroke"
        />
      );
    default:
      return null;
  }
}

function Mark({
  el,
  current,
  used,
  size,
}: {
  el: SceneElement;
  current: boolean;
  used: boolean;
  size: number;
}) {
  if (el.geometry.kind !== 'point') return null;
  const p = el.geometry.at;
  const dot = (
    <circle
      data-name={el.name}
      className={current ? 'mark current' : used ? 'mark used' : 'mark'}
      cx={sx(p)}
      cy={sy(p)}
      r={size * (current || used ? 0.011 : 0.008)}
    />
  );
  // A point the step works from gets a ring, so the eye finds it at once.
  if (!used || current) return dot;
  return (
    <g>
      <circle
        className="mark-ring"
        cx={sx(p)}
        cy={sy(p)}
        r={size * 0.03}
        vectorEffect="non-scaling-stroke"
      />
      {dot}
    </g>
  );
}

interface Label {
  /** The element the label belongs to, so it appears with its point. */
  readonly name: string;
  readonly at: Vec;
  readonly text: string;
  readonly className: string;
}

/**
 * Names for the points of this step, the points it highlights and the
 * given points. Points at the same place get one label, preferring the
 * current step's name (E is where A is).
 */
function labelsFor(
  points: readonly SceneElement[],
  current: (el: SceneElement) => boolean,
  highlighted: ReadonlySet<string>,
): Label[] {
  const groups: { at: Vec; els: SceneElement[] }[] = [];
  for (const el of points) {
    if (el.geometry.kind !== 'point') continue;
    if (!current(el) && !highlighted.has(el.name) && el.step !== 0) continue;
    // Copies made by a repeat carry the engine's names (C@3); the learner
    // knows them as "the same point at every corner", so they stay unnamed.
    if (el.name.includes('@')) continue;
    const at = el.geometry.at;
    const group = groups.find(
      (g) => Math.hypot(g.at.x - at.x, g.at.y - at.y) < 1e-6,
    );
    if (group) group.els.push(el);
    else groups.push({ at, els: [el] });
  }
  return groups.map(({ at, els }) => {
    // Show the names that matter most at this place, in this order.
    const tiers: [string, SceneElement[]][] = [
      ['point-name current', els.filter(current)],
      ['point-name highlighted', els.filter((el) => highlighted.has(el.name))],
      ['point-name', els],
    ];
    const [className, named] = tiers.find(([, list]) => list.length) ?? [
      'point-name',
      els,
    ];
    return {
      name: named[0]?.name ?? '',
      at,
      // One name per place, the one that matters most here.
      text: named[0]?.name ?? '',
      className,
    };
  });
}

function Labels({ labels, size }: { labels: readonly Label[]; size: number }) {
  return (
    <g>
      {labels.map(({ name, at, text, className }) => {
        const len = Math.hypot(at.x, at.y);
        // Just outside the point, away from O, turned 35° so the name does
        // not sit on a line through O.
        const turn = (35 * Math.PI) / 180;
        const [ux, uy] = len > 1e-9 ? [at.x / len, at.y / len] : [-0.9, -0.45];
        const off = {
          x: ux * Math.cos(turn) - uy * Math.sin(turn),
          y: ux * Math.sin(turn) + uy * Math.cos(turn),
        };
        return (
          <text
            key={text}
            data-name={name}
            className={className}
            x={sx(at) + off.x * size * 0.05}
            y={sy(at) - off.y * size * 0.05}
            fontSize={size * 0.032}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {text}
          </text>
        );
      })}
    </g>
  );
}

export interface FreeInk {
  readonly pieces: readonly InkPiece[];
  readonly chosen: ReadonlySet<string>;
  readonly onToggle: (id: string) => void;
}

/**
 * Every piece of construction between two crossings, inked or not; a
 * click inks or erases one. A wide invisible stroke makes them easy to hit.
 */
function FreeInkPieces({ pieces, chosen, onToggle }: FreeInk) {
  return (
    <g className="free-ink">
      {pieces.map(({ id, segment: s }) => (
        <g
          key={id}
          data-id={id}
          className={chosen.has(id) ? 'piece-line inked' : 'piece-line'}
          role="button"
          aria-pressed={chosen.has(id)}
          aria-label="Ink or erase this line"
          onClick={() => onToggle(id)}
        >
          <line
            className="hit"
            x1={sx(s.a)}
            y1={sy(s.a)}
            x2={sx(s.b)}
            y2={sy(s.b)}
            vectorEffect="non-scaling-stroke"
          />
          <line
            className="show"
            x1={sx(s.a)}
            y1={sy(s.a)}
            x2={sx(s.b)}
            y2={sy(s.b)}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      ))}
    </g>
  );
}

/**
 * The construction up to `upTo`: the elements of step `upTo` in orange,
 * the ones it works from in blue, and earlier ones in light grey; lines
 * that never carry ink are dashed. With `ink`, everything is faint and the ink
 * strokes are drawn over it.
 */
export function Construction({
  model,
  upTo,
  view = fullView(model),
  ink = false,
  svgRef,
  showNames = false,
  freeInk,
  enter = false,
}: {
  model: Model;
  upTo: number;
  /** The part of the tutorial frame to show. */
  view?: Rect;
  ink?: boolean;
  svgRef?: React.Ref<SVGSVGElement>;
  /** Name the points this step makes and uses (codes like E or M12). */
  showNames?: boolean;
  /** On the ink stage: every piece the learner can ink, and which are. */
  freeInk?: FreeInk;
  /** Play the move into the ink stage: the construction fades back while
   * a pen inks the pattern (playInk in animation.ts). */
  enter?: boolean;
}) {
  const size = width(view);
  // Lines are clipped well beyond the view, so panning never shows an end.
  const clipTo = fit(view, 1);
  const hidden = hiddenSteps(model.tutorial);
  const shown = [...model.scene.elements.values()].filter(
    (el) => el.step <= upTo && !hidden.has(el.step),
  );
  const isCurrent = (el: SceneElement) => !ink && el.step === upTo;
  const highlighted = new Set(ink ? [] : usedNames(model, upTo));
  /** What the step works from: blue while the step is shown. */
  const used = (el: SceneElement) => highlighted.has(el.name);
  // Lines that never carry ink only help to find points: drawn dashed.
  const carriers = carriersOf(model);
  const helper = (el: SceneElement) =>
    (el.geometry.kind === 'line' || el.geometry.kind === 'polygon') &&
    !carriers.has(el.name);
  return (
    <svg
      ref={svgRef}
      className={ink && enter ? 'drawing ink-enter' : 'drawing'}
      viewBox={viewBox(view)}
      role="img"
      aria-label={
        ink ? 'The inked pattern' : `The construction after step ${upTo}`
      }
    >
      <g>
        {shown.map((el) => (
          <Shape
            key={el.name}
            name={el.name}
            startDeg={compassStart(model, el.name)}
            g={el.geometry}
            view={clipTo}
            className={[
              'el',
              isCurrent(el)
                ? 'current'
                : ink
                  ? 'faint'
                  : used(el)
                    ? 'used'
                    : '',
              helper(el) ? 'helper' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          />
        ))}
      </g>
      {ink && freeInk ? <FreeInkPieces {...freeInk} /> : null}
      {ink && !freeInk && enter ? (
        <g className="rulers" aria-hidden="true">
          {rulerOrder(model).map((r, k) => (
            <line
              key={k}
              data-ruler={k}
              x1={sx(r.from)}
              y1={sy(r.from)}
              x2={sx(r.to)}
              y2={sy(r.to)}
              stroke={RULER_COLOR}
              strokeWidth={12}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
      ) : null}
      {ink && freeInk ? null : ink ? (
        <g className="ink">
          <polygon
            className="tile-outline"
            data-tile
            points={points(model.pattern.cell.corners)}
            stroke={TILE_COLOR}
            vectorEffect="non-scaling-stroke"
          />
          {model.pattern.ink.map((s, i) => (
            <line
              key={i}
              x1={sx(s.segment.a)}
              y1={sy(s.segment.a)}
              x2={sx(s.segment.b)}
              y2={sy(s.segment.b)}
              vectorEffect="non-scaling-stroke"
              data-ink={i}
            />
          ))}
        </g>
      ) : (
        <g>
          {shown.map((el) => (
            <Mark
              key={el.name}
              el={el}
              current={isCurrent(el)}
              used={used(el)}
              size={size}
            />
          ))}
          {showNames ? (
            <Labels
              labels={labelsFor(shown, isCurrent, highlighted)}
              size={size}
            />
          ) : null}
        </g>
      )}
    </svg>
  );
}

/**
 * The view for the repeated tile, `halfWide` by `halfHigh` tiles either
 * side of the original, and the shifts that copy the tile edge to edge
 * `reach` times in each direction to cover it.
 */
export function tiling(
  model: Model,
  { halfWide = 3, halfHigh = 2, reach = 8 } = {},
): { view: Rect; shifts: Vec[] } {
  const { cell } = model.pattern;
  const centre = {
    x: cell.origin.x + (cell.u.x + cell.v.x) / 2,
    y: cell.origin.y + (cell.u.y + cell.v.y) / 2,
  };
  const span = Math.max(
    Math.hypot(cell.u.x, cell.u.y),
    Math.hypot(cell.v.x, cell.v.y),
  );
  const view: Rect = {
    minX: centre.x - halfWide * span,
    maxX: centre.x + halfWide * span,
    minY: centre.y - halfHigh * span,
    maxY: centre.y + halfHigh * span,
  };
  const shifts: Vec[] = [];
  for (let i = -reach; i <= reach; i++) {
    for (let j = -reach; j <= reach; j++) {
      shifts.push({
        x: cell.u.x * i + cell.v.x * j,
        y: cell.u.y * i + cell.v.y * j,
      });
    }
  }
  return { view, shifts };
}

const isOrigin = (d: Vec) => d.x === 0 && d.y === 0;

/**
 * The two slides that build the wall: `row`, the shortest repeat, as near
 * horizontal as possible, and `next`, from one row to the next, with its
 * sideways part as small as it can be (the shift between rows).
 */
export function rowBasis(model: Model): { row: Vec; next: Vec } {
  const { u, v } = model.pattern.cell;
  const cands: Vec[] = [];
  for (let a = -2; a <= 2; a++)
    for (let b = -2; b <= 2; b++)
      if (a || b) cands.push({ x: a * u.x + b * v.x, y: a * u.y + b * v.y });
  const len = (p: Vec) => Math.hypot(p.x, p.y);
  const shortest = Math.min(...cands.map(len));
  const row =
    cands
      .filter((p) => len(p) < shortest * 1.001 && p.x > 1e-9)
      .sort((p, q) => Math.abs(p.y) - Math.abs(q.y))[0] ?? cands[0]!;
  const cross = (p: Vec) => row.x * p.y - row.y * p.x;
  const ups = cands.filter((p) => cross(p) > 1e-9);
  const h = Math.min(...ups.map(cross));
  const level = ups.filter((p) => Math.abs(cross(p) - h) < 1e-9);
  const along = (p: Vec) => (p.x * row.x + p.y * row.y) / len(row) ** 2;
  // Bring the shift into (-½, ½] of a step, nearest straight up.
  const next0 = level.sort(
    (p, q) => Math.abs(along(p)) - Math.abs(along(q)),
  )[0]!;
  const k = Math.round(along(next0));
  const next = { x: next0.x - k * row.x, y: next0.y - k * row.y };
  return { row, next };
}

/** Milliseconds for one copy or one row to slide into place. */
const SLIDE_MS = 700;
const ROW_STEP_MS = 420;
const ROWS_STEP_MS = 900;

/**
 * The inked tile copied edge to edge: the original in color, the copies in
 * ink, and the tile borders faint, so the new shapes between the copies
 * show where they close up. With `enter`, the wall is built as a hand
 * would: the tile is copied and slid along to make a row, then the row is
 * copied and slid up (and across, when the rows are shifted), row by row.
 */
export function RepeatedInk({
  model,
  enter = false,
  speed = 1,
}: {
  model: Model;
  enter?: boolean;
  speed?: number;
}) {
  const { view } = tiling(model);
  const { cell, ink } = model.pattern;
  const { row, next } = useMemo(() => rowBasis(model), [model]);
  const svgRef = useRef<SVGSVGElement>(null);
  // Every copy whose tile reaches into the view, by row (j) and place (i).
  const copies = useMemo(() => {
    const out: { i: number; j: number; d: Vec }[] = [];
    const span = Math.hypot(row.x, row.y) + Math.hypot(next.x, next.y);
    const inView = (d: Vec) =>
      d.x > view.minX - span &&
      d.x < view.maxX + span &&
      d.y > view.minY - span &&
      d.y < view.maxY + span;
    for (let j = -12; j <= 12; j++)
      for (let i = -24; i <= 24; i++) {
        const d = { x: i * row.x + j * next.x, y: i * row.y + j * next.y };
        if (inView(d)) out.push({ i, j, d });
      }
    return out;
  }, [row, next, view]);

  // The row is built first, then the rows; the camera pulls back from the
  // tile while the row grows.
  const rowsStart = useMemo(() => {
    const maxI = Math.max(
      ...copies.filter((c) => c.j === 0).map((c) => Math.abs(c.i)),
    );
    return (300 + maxI * ROW_STEP_MS + SLIDE_MS) / speed;
  }, [copies, speed]);
  const close = useMemo(() => {
    const cx = (view.minX + view.maxX) / 2;
    const cy = (view.minY + view.maxY) / 2;
    const k = 2.4;
    const hw = (view.maxX - view.minX) / 2 / k;
    const hh = (view.maxY - view.minY) / 2 / k;
    return { minX: cx - hw, maxX: cx + hw, minY: cy - hh, maxY: cy + hh };
  }, [view]);

  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!enter || !svg) return;
    const anims: Animation[] = [];
    const tr = (p: Vec) => `translate(${p.x}px, ${-p.y}px)`;
    // The camera moves on the same clock as the copies (an SVG <animate>
    // starts at mount, before a slow first render has finished).
    let frame = 0;
    const t0 = performance.now();
    const ease = (t: number) => 1 - (1 - t) ** 3;
    const camera = () => {
      const t = Math.min(1, (performance.now() - t0) / rowsStart);
      const e = ease(t);
      const mix = (a: number, b: number) => a + (b - a) * e;
      svg.setAttribute(
        'viewBox',
        viewBox({
          minX: mix(close.minX, view.minX),
          maxX: mix(close.maxX, view.maxX),
          minY: mix(close.minY, view.minY),
          maxY: mix(close.maxY, view.maxY),
        }),
      );
      if (t < 1) frame = requestAnimationFrame(camera);
    };
    camera();
    let end = rowsStart;
    for (const node of svg.querySelectorAll<SVGGElement>('[data-copy]')) {
      if (typeof node.animate !== 'function') continue;
      const [i, j] = (node.dataset['copy'] ?? '0,0').split(',').map(Number) as [
        number,
        number,
      ];
      if (i === 0 && j === 0) continue;
      const d = { x: i * row.x + j * next.x, y: i * row.y + j * next.y };
      let frames: Keyframe[];
      let delay: number;
      if (j === 0) {
        // Along the row: from the copy before it.
        const s = Math.sign(i);
        const from = { x: d.x - s * row.x, y: d.y - s * row.y };
        frames = [{ transform: tr(from) }, { transform: tr(d) }];
        delay = (300 + (Math.abs(i) - 1) * ROW_STEP_MS) / speed;
      } else {
        // A whole row: from the row before it, straight up first, then
        // across by the shift.
        const s = Math.sign(j);
        const from = { x: d.x - s * next.x, y: d.y - s * next.y };
        const rowLen = Math.hypot(row.x, row.y);
        const across = (next.x * row.x + next.y * row.y) / rowLen;
        const upOnly = {
          x: d.x - (s * across * row.x) / rowLen,
          y: d.y - (s * across * row.y) / rowLen,
        };
        frames =
          Math.abs(across) > 1e-9
            ? [
                { transform: tr(from), offset: 0 },
                { transform: tr(upOnly), offset: 0.55 },
                { transform: tr(d), offset: 1 },
              ]
            : [{ transform: tr(from) }, { transform: tr(d) }];
        delay = rowsStart + ((Math.abs(j) - 1) * ROWS_STEP_MS) / speed;
      }
      const dur = (j === 0 ? SLIDE_MS : SLIDE_MS * 1.4) / speed;
      anims.push(
        node.animate(frames, {
          duration: dur,
          delay,
          easing: 'ease-in-out',
          fill: 'backwards',
        }),
        node.animate([{ opacity: 0 }, { opacity: 0 }], {
          duration: delay,
          fill: 'none',
        }),
        node.animate([{ stroke: ACCENT_COLOR }, { stroke: ACCENT_COLOR }, {}], {
          duration: dur + 400 / speed,
          delay,
          fill: 'none',
        }),
      );
      end = Math.max(end, delay + dur);
    }
    // Each copy carries the tile's green outline while the wall is built;
    // once it is complete the outlines fade away.
    const fade = 1200 / speed;
    for (const outline of svg.querySelectorAll<SVGPolygonElement>(
      '.copy-outline',
    )) {
      if (typeof outline.animate !== 'function') continue;
      anims.push(
        outline.animate(
          [
            { opacity: 1 },
            {
              opacity: 1,
              offset: (end + 400 / speed) / (end + 400 / speed + fade),
            },
            { opacity: 0 },
          ],
          { duration: end + 400 / speed + fade, fill: 'none' },
        ),
      );
    }
    const borders = svg.querySelector<SVGGElement>('.tile-borders');
    if (borders && typeof borders.animate === 'function')
      anims.push(
        borders.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: 600,
          delay: end + 400 / speed + fade,
          fill: 'backwards',
        }),
      );
    return () => {
      cancelAnimationFrame(frame);
      svg.setAttribute('viewBox', viewBox(view));
      anims.forEach((a) => a.cancel());
    };
  }, [enter, copies, row, next, speed, rowsStart, close, view]);

  return (
    <svg
      ref={svgRef}
      className="drawing wall"
      viewBox={viewBox(view)}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="The inked tile repeated edge to edge"
    >
      <g className="tile-borders">
        {copies.map(({ d }, k) => (
          <polygon
            key={k}
            points={points(
              cell.corners.map((p) => ({ x: p.x + d.x, y: p.y + d.y })),
            )}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>
      {copies.map(({ i, j, d }) => (
        <g
          key={`${i},${j}`}
          data-copy={`${i},${j}`}
          className={isOrigin(d) ? 'ink original' : 'ink'}
          transform={`translate(${d.x} ${-d.y})`}
        >
          {enter ? (
            <polygon
              className="copy-outline"
              points={points(cell.corners)}
              stroke={TILE_COLOR}
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
          {ink.map((s, k) => (
            <line
              key={k}
              x1={sx(s.segment.a)}
              y1={sy(s.segment.a)}
              x2={sx(s.segment.b)}
              y2={sy(s.segment.b)}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
      ))}
    </svg>
  );
}

/** The accent for things in motion (--current in styles.css). */
const ACCENT_COLOR = '#d55e00';

/** One piece type's shape, small, for the piece panel. */
export function PieceShape({
  model,
  type,
  color,
}: {
  model: Model;
  type: number;
  color: string;
}) {
  const polygon =
    model.pattern.pieces.find((p) => p.type === type)?.polygon ?? [];
  const xs = polygon.map((p) => p.x);
  const ys = polygon.map((p) => p.y);
  const box = {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  };
  const pad = 0.08 * Math.max(box.maxX - box.minX, box.maxY - box.minY);
  return (
    <svg
      className="piece-shape"
      viewBox={viewBox({
        minX: box.minX - pad,
        minY: box.minY - pad,
        maxX: box.maxX + pad,
        maxY: box.maxY + pad,
      })}
      aria-hidden="true"
    >
      <polygon
        className="piece"
        points={points(polygon)}
        fill={color}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** A small square picture of the colored pattern, for the library. */
export function Thumbnail({ model }: { model: Model }) {
  const { view, shifts } = tiling(model, {
    halfWide: 1,
    halfHigh: 1,
    reach: 2,
  });
  const colors = pieceColors(model);
  return (
    <svg className="thumbnail" viewBox={viewBox(view)} aria-hidden="true">
      {shifts.map((d, k) => (
        <g key={k} transform={`translate(${d.x} ${-d.y})`}>
          {model.pattern.pieces.map((p, i) => (
            <polygon
              key={i}
              className="piece"
              points={points(p.polygon)}
              fill={colors[p.type]}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
      ))}
    </svg>
  );
}
