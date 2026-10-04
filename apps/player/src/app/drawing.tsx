import type { Geometry, Line, SceneElement, Vec } from '@tastir/engine';
import { pieceColors, type Model } from './model';

interface Rect {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
}

/** SVG has y pointing down; the tutorial frame has y pointing up. */
const sx = (p: Vec) => p.x;
const sy = (p: Vec) => -p.y;
const points = (ps: readonly Vec[]) =>
  ps.map((p) => `${sx(p)},${sy(p)}`).join(' ');
const viewBox = (r: Rect) =>
  `${r.minX} ${-r.maxY} ${r.maxX - r.minX} ${r.maxY - r.minY}`;

/** Everything the construction draws, with a margin around it. */
function boundsOf(model: Model): Rect {
  const xs: number[] = [];
  const ys: number[] = [];
  const add = (p: Vec, r = 0) => {
    xs.push(p.x - r, p.x + r);
    ys.push(p.y - r, p.y + r);
  };
  for (const { geometry: g } of model.scene.elements.values()) {
    if (g.kind === 'point') add(g.at);
    if (g.kind === 'circle') add(g.circle.centre, g.circle.radius);
    if (g.kind === 'polygon') g.vertices.forEach((p) => add(p));
  }
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const pad = 0.12 * Math.max(maxX - minX, maxY - minY);
  return {
    minX: minX - pad,
    minY: minY - pad,
    maxX: maxX + pad,
    maxY: maxY + pad,
  };
}

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
  g,
  view,
  className,
}: {
  g: Geometry;
  view: Rect;
  className: string;
}) {
  switch (g.kind) {
    case 'line': {
      const seg = clip(g.line, view);
      if (!seg) return null;
      const [a, b] = seg;
      return (
        <line
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
          className={className}
          cx={sx(g.circle.centre)}
          cy={sy(g.circle.centre)}
          r={g.circle.radius}
          vectorEffect="non-scaling-stroke"
        />
      );
    case 'polygon':
      return (
        <polygon
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
  size,
}: {
  el: SceneElement;
  current: boolean;
  size: number;
}) {
  if (el.geometry.kind !== 'point') return null;
  const p = el.geometry.at;
  return (
    <circle
      className={current ? 'mark current' : 'mark'}
      cx={sx(p)}
      cy={sy(p)}
      r={size * (current ? 0.011 : 0.008)}
    />
  );
}

interface Label {
  readonly at: Vec;
  readonly text: string;
  readonly className: string;
}

/**
 * Names for the points of this step, the points it highlights and the
 * given points. Points at the same place get one label, preferring the
 * current step's names (E is where A is).
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
    return { at, text: named.map((el) => el.name).join(' = '), className };
  });
}

function Labels({ labels, size }: { labels: readonly Label[]; size: number }) {
  return (
    <g>
      {labels.map(({ at, text, className }) => {
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

/**
 * The construction up to `upTo`: the elements of step `upTo` in color and
 * earlier ones in light grey. With `ink`, everything is faint and the ink
 * strokes are drawn over it.
 */
export function Construction({
  model,
  upTo,
  ink = false,
}: {
  model: Model;
  upTo: number;
  ink?: boolean;
}) {
  const view = boundsOf(model);
  const size = view.maxX - view.minX;
  const shown = [...model.scene.elements.values()].filter(
    (el) => el.step <= upTo,
  );
  const isCurrent = (el: SceneElement) => !ink && el.step === upTo;
  const highlighted = new Set(model.tutorial.steps[upTo - 1]?.highlight ?? []);
  return (
    <svg
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
            g={el.geometry}
            view={view}
            className={isCurrent(el) ? 'el current' : ink ? 'el faint' : 'el'}
          />
        ))}
      </g>
      {ink ? (
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
            <Mark key={el.name} el={el} current={isCurrent(el)} size={size} />
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
 * The view for the repeated tile, about three tiles wide around the
 * original, and the shifts that copy the tile edge to edge across it.
 */
function tiling(model: Model): { view: Rect; shifts: Vec[] } {
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
    minX: centre.x - 3 * span,
    maxX: centre.x + 3 * span,
    minY: centre.y - 2 * span,
    maxY: centre.y + 2 * span,
  };
  // Enough copies to cover the view however wide the screen is.
  const reach = 8;
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
export function Wall({ model }: { model: Model }) {
  const { view, shifts } = tiling(model);
  const { pieces } = model.pattern;
  const colors = pieceColors(model);
  return (
    <svg
      className="drawing wall"
      viewBox={viewBox(view)}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="The pattern colored and tiled as a wall"
    >
      {shifts.map((d, k) => (
        <g key={k} transform={`translate(${d.x} ${-d.y})`}>
          {pieces.map((p, i) => (
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

/** The piece types with their colors and how many each tile holds. */
export function Legend({ model }: { model: Model }) {
  const colors = pieceColors(model);
  return (
    <ul className="legend">
      {model.pattern.types.map((t, i) => (
        <li key={i}>
          <span className="swatch" style={{ background: colors[i] }} />
          {t.name ?? `piece ${i + 1}`}: {t.vertices} corners, {t.perCell} per
          tile
        </li>
      ))}
    </ul>
  );
}
