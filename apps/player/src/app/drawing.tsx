import { useId, useLayoutEffect, useMemo, useRef } from 'react';
import type {
  Geometry,
  InkPiece,
  InkStroke,
  Line,
  SceneElement,
  Vec,
} from '@tastir/engine';
import {
  compassStart,
  FRESH_INK,
  usedNames,
  rulerOrder,
  RULER_COLOR,
  TILE_COLOR,
} from './animation';
import { fit, fullView, viewBox, width, type Rect } from './camera';
import { pieceColors, tutorialColoring, type Coloring } from './coloring';
import { placeFills } from './placement';
import { carriersOf, hiddenBeats, inkBeatsOf, type Model } from './model';
import type { WallStyle } from './Wall';

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
  seen,
}: {
  name: string;
  g: Geometry;
  view: Rect;
  /** What is on screen, so a line's stroke can spend its time there. */
  seen?: Rect;
  className: string;
  /** Where a circle's stroke starts, in degrees in the tutorial frame. */
  startDeg?: number;
}) {
  switch (g.kind) {
    case 'line': {
      const seg = clip(g.line, view);
      if (!seg) return null;
      const [a, b] = seg;
      // The ruler is laid through the line's own point: the stroke grows
      // from there outward, and reaches the edges of the screen first.
      const t = (p: Vec) =>
        (p.x - g.line.point.x) * g.line.dir.x +
        (p.y - g.line.point.y) * g.line.dir.y;
      const ta = t(a);
      const tb = t(b);
      const span = tb - ta || 1;
      const from = Math.min(1, Math.max(0, -ta / span));
      const onScreen = seen ? clip(g.line, seen) : undefined;
      const reach = onScreen
        ? Math.max(Math.abs(t(onScreen[0])), Math.abs(t(onScreen[1]))) /
          Math.abs(span)
        : 1;
      return (
        <line
          data-name={name}
          data-grow={`${from.toFixed(4)} ${Math.min(1, reach).toFixed(4)}`}
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
  wasNew,
  size,
}: {
  el: SceneElement;
  current: boolean;
  used: boolean;
  /** Made by the step before: starts blue, then takes its new colour. */
  wasNew?: boolean;
  size: number;
}) {
  if (el.geometry.kind !== 'point') return null;
  const p = el.geometry.at;
  const dot = (
    <circle
      data-name={el.name}
      className={[
        'mark',
        current ? 'current' : used ? 'used' : '',
        wasNew ? 'was-new' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      cx={sx(p)}
      cy={sy(p)}
      r={size * (current || used ? 0.012 : 0.008)}
    />
  );
  return dot;
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
 * At the end of the ink: the ink of the eight tiles around this one, faint
 * and in blue, so the learner sees each of their lines meet this tile's
 * edge where one of its own lines carries on (each is copied off the
 * finished tile, or a corner off the side copy before it, and slides out to
 * its place, round the tile; see playInk).
 */
function NextTiles({ model }: { model: Model }) {
  const { u, v } = model.pattern.cell;
  const at = (i: number, j: number): Vec => ({
    x: i * u.x + j * v.x,
    y: i * u.y + j * v.y,
  });
  // Round the tile like a hand, starting on the left and going clockwise
  // on screen: each side's copy comes off the tile, then the corner after
  // it comes off that side's copy (left, top-left, top, top-right...).
  const clockwise = (p: Vec) =>
    (Math.atan2(-p.y, p.x) - Math.PI + 4 * Math.PI) % (2 * Math.PI);
  const sides = [at(-1, 0), at(0, 1), at(1, 0), at(0, -1)].sort(
    (p, q) => clockwise(p) - clockwise(q),
  );
  const shifts: { to: Vec; from: Vec }[] = sides.flatMap((side, k) => {
    const after = sides[(k + 1) % 4] as Vec;
    return [
      { to: side, from: at(0, 0) },
      { to: { x: side.x + after.x, y: side.y + after.y }, from: side },
    ];
  });
  const d = model.pattern.ink
    .map(
      (s) =>
        `M${sx(s.segment.a)} ${sy(s.segment.a)}L${sx(s.segment.b)} ${sy(s.segment.b)}`,
    )
    .join('');
  return (
    <g className="ink next-tiles" aria-label="The next tiles">
      {shifts.map(({ to, from }, k) => (
        <g
          key={k}
          data-next-tile={k}
          data-shift={`${to.x} ${-to.y}`}
          data-from={`${from.x} ${-from.y}`}
          transform={`translate(${to.x} ${-to.y})`}
        >
          <path className="tile-ink" d={d} />
        </g>
      ))}
    </g>
  );
}

/**
 * The points the ink turns at or ends at (not those where it runs straight
 * on), each with the first ruler line of the ink order that reaches it, so
 * the ink stage can show a line's points just before the pen joins them.
 */
function InkDots({ model, size }: { model: Model; size: number }) {
  const key = (p: Vec) => `${p.x.toFixed(6)},${p.y.toFixed(6)}`;
  // The directions of ink leaving each endpoint.
  const leaving = new Map<string, Vec[]>();
  for (const { segment: s } of model.pattern.ink) {
    const d = { x: s.b.x - s.a.x, y: s.b.y - s.a.y };
    const n = Math.hypot(d.x, d.y) || 1;
    const u = { x: d.x / n, y: d.y / n };
    for (const [p, v] of [
      [s.a, u],
      [s.b, { x: -u.x, y: -u.y }],
    ] as const) {
      leaving.set(key(p), [...(leaving.get(key(p)) ?? []), v]);
    }
  }
  // Straight on: exactly two stretches leaving in opposite directions.
  const straight = (k: string) => {
    const ds = leaving.get(k) ?? [];
    return (
      ds.length === 2 &&
      Math.abs((ds[0] as Vec).x + (ds[1] as Vec).x) < 1e-6 &&
      Math.abs((ds[0] as Vec).y + (ds[1] as Vec).y) < 1e-6
    );
  };
  const lineOf = new Map<string, { at: Vec; line: number }>();
  rulerOrder(model).forEach((r, line) => {
    for (const { index } of r.strokes) {
      const { a, b } = (model.pattern.ink[index] as InkStroke).segment;
      for (const p of [a, b]) {
        const k = key(p);
        if (straight(k) || lineOf.has(k)) continue;
        lineOf.set(k, { at: p, line });
      }
    }
  });
  return (
    <g className="ink-dots" aria-hidden="true">
      {[...lineOf.values()].map(({ at, line }, i) => (
        <circle
          key={i}
          className="ink-dot"
          data-dot-line={line}
          cx={sx(at)}
          cy={sy(at)}
          r={size * 0.007}
        />
      ))}
    </g>
  );
}

/**
 * When inking as you go: the ink of the steps before `upTo` in black, and
 * the ink step `upTo` makes in green (named so its step can draw it in).
 */
function InkSoFar({ model, upTo }: { model: Model; upTo: number }) {
  const steps = inkBeatsOf(model);
  return (
    <g className="ink so-far">
      {model.pattern.ink.map((s, i) => {
        const step = steps[i] ?? Infinity;
        if (step > upTo) return null;
        const fresh = step === upTo;
        return (
          <line
            key={i}
            className={fresh ? 'fresh' : undefined}
            data-name={fresh ? FRESH_INK : undefined}
            x1={sx(s.segment.a)}
            y1={sy(s.segment.a)}
            x2={sx(s.segment.b)}
            y2={sy(s.segment.b)}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
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
  frame,
  ink = false,
  svgRef,
  showNames = false,
  inkSoFar = false,
  pen = true,
  freeInk,
  enter = false,
  arrived = false,
}: {
  model: Model;
  upTo: number;
  /** The part of the tutorial frame to show. */
  view?: Rect;
  /** The step's settled frame: sizes marks and clips lines, so the drawing
   * is built once per step and a moving camera only changes the viewBox. */
  frame?: Rect;
  ink?: boolean;
  svgRef?: React.Ref<SVGSVGElement>;
  /** Name the points this step makes and uses (codes like E or M12). */
  showNames?: boolean;
  /** Inking as you go: the ink made so far, this step's in green. */
  inkSoFar?: boolean;
  /** On the ink stage, ink the pattern with a pen (inking at the end). */
  pen?: boolean;
  /** On the ink stage: every piece the learner can ink, and which are. */
  freeInk?: FreeInk;
  /** Play the move into the ink stage: the construction fades back while
   * a pen inks the pattern (playInk in animation.ts). */
  enter?: boolean;
  /** Arrived with Next: what the step before made turns from blue to its
   * new colour. */
  arrived?: boolean;
}) {
  const settled = frame ?? view;
  const content = useMemo(() => {
    const size = width(settled);
    // Lines are clipped well beyond the frame, so panning never shows an end.
    const clipTo = fit(settled, 1.6);
    const hidden = hiddenBeats(model.tutorial);
    const shown = [...model.scene.elements.values()].filter(
      (el) => el.beat <= upTo && !hidden.has(el.beat),
    );
    const isCurrent = (el: SceneElement) => !ink && el.beat === upTo;
    // The step shown before this one, among those the learner sees.
    const before = Math.max(
      -1,
      ...shown.map((el) => el.beat).filter((b) => b < upTo),
    );
    const wasNew = (el: SceneElement) => arrived && !ink && el.beat === before;
    const highlighted = new Set(ink ? [] : usedNames(model, upTo));
    /** What the step works from: blue while the step is shown. */
    const used = (el: SceneElement) => highlighted.has(el.name);
    // Lines that never carry ink only help to find points: drawn dashed.
    const carriers = carriersOf(model);
    const helper = (el: SceneElement) =>
      (el.geometry.kind === 'line' || el.geometry.kind === 'polygon') &&
      !carriers.has(el.name);
    return (
      <>
        <g>
          {shown.map((el) => (
            <Shape
              key={el.name}
              name={el.name}
              startDeg={compassStart(model, el.name)}
              g={el.geometry}
              view={clipTo}
              seen={settled}
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
                wasNew(el) ? 'was-new' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            />
          ))}
        </g>
        {inkSoFar && !ink ? <InkSoFar model={model} upTo={upTo} /> : null}

        {ink && freeInk ? <FreeInkPieces {...freeInk} /> : null}
        {ink && !freeInk && enter && pen ? (
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
            <NextTiles model={model} />
            {enter && pen ? <InkDots model={model} size={size} /> : null}
          </g>
        ) : (
          <g>
            {shown.map((el) => (
              <Mark
                key={el.name}
                el={el}
                current={isCurrent(el)}
                used={used(el)}
                wasNew={wasNew(el)}
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
      </>
    );
    // Rebuilt when the step or what it shows changes, not when the view moves.
  }, [
    model,
    upTo,
    settled,
    ink,
    showNames,
    inkSoFar,
    pen,
    freeInk,
    enter,
    arrived,
  ]);
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
      {content}
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
  const inkId = `tile-ink-${useId().replace(/:/g, '')}`;
  const inkPath = useMemo(
    () =>
      ink
        .map(
          (s) =>
            `M${sx(s.segment.a)} ${sy(s.segment.a)}L${sx(s.segment.b)} ${sy(s.segment.b)}`,
        )
        .join(''),
    [ink],
  );
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
      <defs>
        {/* The tile's ink, drawn once and reused by every copy, so a
            pattern with hundreds of lines stays light. */}
        <path id={inkId} className="tile-ink" d={inkPath} />
      </defs>
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
          {isOrigin(d) ? (
            ink.map((s, k) => (
              <line
                key={k}
                x1={sx(s.segment.a)}
                y1={sy(s.segment.a)}
                x2={sx(s.segment.b)}
                y2={sy(s.segment.b)}
                vectorEffect="non-scaling-stroke"
              />
            ))
          ) : (
            <use href={`#${inkId}`} />
          )}
        </g>
      ))}
    </svg>
  );
}

/** The accent for things in motion (--current in styles.css). */
const ACCENT_COLOR = '#2f5bb7';

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

/** The strapwork look's colours: a light band with dark edges. */
export const STRAP_EDGE = '#23201c';
export const STRAP_BAND = '#f7f2e6';

/**
 * Grout and band widths in proportion to the tile, so every pattern gets the
 * same look; shared by the wall and the thumbnails.
 */
export function strapWidths(model: Model, grout = 1) {
  const xs = model.pattern.cell.corners.map((p) => p.x);
  const unit = (Math.max(...xs) - Math.min(...xs)) / 2;
  const g = 0.012 * unit * grout;
  return { grout: g, edge: g * 4, band: g * 2.4 };
}

/**
 * A small square picture of the colored pattern, for the library, as the
 * wall first shows it: tiles with grout, or strapwork, where each pattern
 * line is a light band with dark edges.
 */
export function Thumbnail({
  model,
  coloring = tutorialColoring(model),
  look = model.tutorial.pattern.look,
}: {
  model: Model;
  /** A learner's colors (a saved design); else the tutorial's own. */
  coloring?: Coloring;
  /** A learner's wall style; else the tutorial's. */
  look?: WallStyle;
}) {
  const reach = 2;
  const { view } = tiling(model, { halfWide: 1, halfHigh: 1, reach });
  const { cell } = model.pattern;
  const colors = pieceColors(model, coloring);
  // Pieces of one shape can take different colors by where they sit (the
  // Comares bones); the wall's own rule then colors each copy.
  const fill = model.tutorial.pattern.placements
    ? placeFills(model, coloring)
    : undefined;
  const widths = strapWidths(model);
  // As the wall first shows it: strapwork bands, tiles with grout, or
  // only the lines.
  const strap = look === 'strapwork';
  const lines = look === 'lines';
  // Only what shows: pieces and lines whose box meets the view.
  const seen = fit(view, 1 + widths.edge);
  const meets = (ps: readonly Vec[]) =>
    Math.max(...ps.map((p) => p.x)) >= seen.minX &&
    Math.min(...ps.map((p) => p.x)) <= seen.maxX &&
    Math.max(...ps.map((p) => p.y)) >= seen.minY &&
    Math.min(...ps.map((p) => p.y)) <= seen.maxY;
  const move = (p: Vec, d: Vec): Vec => ({ x: p.x + d.x, y: p.y + d.y });
  const poly = (ps: readonly Vec[]) =>
    `M${ps.map((q) => `${sx(q)} ${sy(q)}`).join('L')}Z`;
  // One path per color and one per band layer keeps the library light.
  const byColor = new Map<string, string[]>();
  const strokes: string[] = [];
  for (let i = -reach; i <= reach; i++) {
    for (let j = -reach; j <= reach; j++) {
      const d = {
        x: cell.u.x * i + cell.v.x * j,
        y: cell.u.y * i + cell.v.y * j,
      };
      model.pattern.pieces.forEach((p, k) => {
        const polygon = p.polygon.map((q) => move(q, d));
        if (!meets(polygon)) return;
        const color = lines
          ? 'none'
          : fill
            ? fill(k, i, j)
            : (colors[p.type] ?? '#999999');
        const list = byColor.get(color) ?? [];
        list.push(poly(polygon));
        byColor.set(color, list);
      });
      for (const s of model.pattern.ink) {
        const a = move(s.segment.a, d);
        const b = move(s.segment.b, d);
        if (meets([a, b])) strokes.push(`M${sx(a)} ${sy(a)}L${sx(b)} ${sy(b)}`);
      }
    }
  }
  return (
    <svg className="thumbnail" viewBox={viewBox(view)} aria-hidden="true">
      {[...byColor].map(([color, ds]) => (
        <path
          key={color}
          className={strap ? 'piece strap' : 'piece'}
          d={ds.join('')}
          fill={color}
          style={strap ? { stroke: color } : undefined}
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {(strap ? (['edge', 'band'] as const) : []).map((layer) => (
        <path
          key={layer}
          d={strokes.join('')}
          fill="none"
          stroke={layer === 'edge' ? STRAP_EDGE : STRAP_BAND}
          strokeWidth={widths[layer]}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}
