import type {
  Geometry,
  InkPiece,
  Line,
  SceneElement,
  Vec,
} from '@tastir/engine';
import { compassStart, highlightedNames } from './animation';
import { fit, fullView, viewBox, width, type Rect } from './camera';
import { pieceColors } from './coloring';
import type { Model } from './model';

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
  outlined,
  size,
}: {
  el: SceneElement;
  current: boolean;
  outlined: boolean;
  size: number;
}) {
  if (el.geometry.kind !== 'point') return null;
  const p = el.geometry.at;
  return (
    <circle
      data-name={el.name}
      className={
        current ? 'mark current' : outlined ? 'mark highlighted' : 'mark'
      }
      cx={sx(p)}
      cy={sy(p)}
      r={size * (current ? 0.011 : 0.008)}
    />
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
 * The construction up to `upTo`: the elements of step `upTo` in color and
 * earlier ones in light grey. With `ink`, everything is faint and the ink
 * strokes are drawn over it.
 */
export function Construction({
  model,
  upTo,
  view = fullView(model),
  ink = false,
  svgRef,
  outlineHighlights = false,
  freeInk,
}: {
  model: Model;
  upTo: number;
  /** The part of the tutorial frame to show. */
  view?: Rect;
  ink?: boolean;
  svgRef?: React.Ref<SVGSVGElement>;
  /** Outline the step's highlighted elements (instead of flashing them). */
  outlineHighlights?: boolean;
  /** On the ink stage: every piece the learner can ink, and which are. */
  freeInk?: FreeInk;
}) {
  const size = width(view);
  // Lines are clipped well beyond the view, so panning never shows an end.
  const clipTo = fit(view, 1);
  const shown = [...model.scene.elements.values()].filter(
    (el) => el.step <= upTo,
  );
  const isCurrent = (el: SceneElement) => !ink && el.step === upTo;
  const highlighted = new Set(ink ? [] : highlightedNames(model, upTo));
  /** Highlighted elements are outlined when they are not flashed. */
  const outlined = (el: SceneElement) =>
    outlineHighlights && highlighted.has(el.name);
  return (
    <svg
      ref={svgRef}
      className="drawing"
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
            className={
              isCurrent(el)
                ? 'el current'
                : ink
                  ? 'el faint'
                  : outlined(el)
                    ? 'el highlighted'
                    : 'el'
            }
          />
        ))}
      </g>
      {ink && freeInk ? (
        <FreeInkPieces {...freeInk} />
      ) : ink ? (
        <g className="ink">
          {model.pattern.ink.map((s, i) => (
            <line
              key={i}
              x1={sx(s.segment.a)}
              y1={sy(s.segment.a)}
              x2={sx(s.segment.b)}
              y2={sy(s.segment.b)}
              vectorEffect="non-scaling-stroke"
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
              outlined={outlined(el)}
              size={size}
            />
          ))}
          <Labels
            labels={labelsFor(shown, isCurrent, highlighted)}
            size={size}
          />
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
function tiling(
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
 * The inked tile copied edge to edge: the original in color, the copies in
 * ink, and the tile borders faint, so the new shapes between the copies
 * show where they close up.
 */
export function RepeatedInk({ model }: { model: Model }) {
  const { view, shifts } = tiling(model);
  const { cell, ink } = model.pattern;
  return (
    <svg
      className="drawing wall"
      viewBox={viewBox(view)}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="The inked tile repeated edge to edge"
    >
      <g className="tile-borders">
        {shifts.map((d, k) => (
          <polygon
            key={k}
            points={points(
              cell.corners.map((p) => ({ x: p.x + d.x, y: p.y + d.y })),
            )}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>
      {shifts.map((d, k) => (
        <g
          key={k}
          className={isOrigin(d) ? 'ink original' : 'ink'}
          transform={`translate(${d.x} ${-d.y})`}
        >
          {ink.map((s, i) => (
            <line
              key={i}
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

/** The pieces filled and the cell repeated edge to edge across the screen. */
export function Wall({
  model,
  colors = pieceColors(model),
  hovered,
  onHover,
  onPick,
}: {
  model: Model;
  colors?: readonly string[];
  /** The piece type to highlight on every copy, if any. */
  hovered?: number;
  onHover?: (type: number | undefined) => void;
  onPick?: (type: number) => void;
}) {
  const { view, shifts } = tiling(model);
  const { pieces } = model.pattern;
  const look = (type: number) =>
    hovered === undefined
      ? 'piece'
      : hovered === type
        ? 'piece hl'
        : 'piece dim';
  return (
    <svg
      className="drawing wall"
      viewBox={viewBox(view)}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="The pattern colored and tiled as a wall"
      onPointerLeave={() => onHover?.(undefined)}
    >
      {shifts.map((d, k) => (
        <g key={k} transform={`translate(${d.x} ${-d.y})`}>
          {pieces.map((p, i) => (
            <polygon
              key={i}
              data-type={p.type}
              className={look(p.type)}
              points={points(p.polygon)}
              fill={colors[p.type]}
              vectorEffect="non-scaling-stroke"
              onPointerEnter={() => onHover?.(p.type)}
              onClick={() => onPick?.(p.type)}
            />
          ))}
        </g>
      ))}
    </svg>
  );
}

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
