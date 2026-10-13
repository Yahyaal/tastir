/** @jsxRuntime automatic */
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
import { boxOf, fit, fullView, viewBox, width, type Rect } from './camera';
import {
  DEFAULT_FINISH,
  finishOf,
  pieceColors,
  tutorialColoring,
  type Coloring,
} from './coloring';
import { byPlace, colouredModel, placeFills } from './placement';
import { carriersOf, hiddenBeats, inkBeatsOf, type Model } from './model';
import { patchesAt, patchPath } from './interlace';
import type { JaliAppearance } from '@tastir/schema';
import type { WallStyle } from './Wall';
import { JaliFramework, JaliGround, latticeWidth } from './jali';

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
  all = false,
): Label[] {
  const groups: { at: Vec; els: SceneElement[] }[] = [];
  for (const el of points) {
    if (el.geometry.kind !== 'point') continue;
    if (!all && !current(el) && !highlighted.has(el.name) && el.step !== 0)
      continue;
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
  names,
  optional,
  fadeLines = false,
}: {
  /** Helper lines nothing needs, drawn lighter (drawing along, with
   * helper lines shown). */
  optional?: ReadonlySet<string>;
  /** Exactly the point names to show (drawing along: those the step text
   * uses), instead of the step's own and highlighted points. */
  names?: ReadonlySet<string>;
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
  /** Smoothly fade out construction lines and circles while keeping ink. */
  fadeLines?: boolean;
}) {
  const settled = frame ?? view;
  const content = useMemo(() => {
    const size = width(settled);
    // Lines are clipped well beyond the frame, so panning never shows an end.
    const clipTo = fit(settled, 1.6);
    const hidden = hiddenBeats(model.tutorial);
    const shown = [...model.scene.elements.values()].filter(
      (el) =>
        el.beat <= upTo && !hidden.has(el.beat) && !model.hide?.has(el.name),
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
        <g className="construction-guides" stroke="var(--faint)">
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
                optional?.has(el.name) ? 'optional' : '',
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
            {names ? (
              <Labels
                labels={labelsFor(
                  shown.filter((el) => names.has(el.name)),
                  isCurrent,
                  highlighted,
                  true,
                )}
                size={size}
              />
            ) : showNames ? (
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
    names,
    optional,
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
      className={`drawing ${ink && enter ? 'ink-enter' : ''} ${fadeLines ? 'fade-lines' : ''}`}
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
  count,
  enter = false,
  speed = 1,
  paused = false,
}: {
  model: Model;
  /** Only so many copies along the row and up, else the whole wall. */
  count?: readonly [number, number];
  enter?: boolean;
  speed?: number;
  paused?: boolean;
}) {
  const pauseRef = useRef(paused);
  pauseRef.current = paused;
  const { cell, ink } = model.pattern;
  const { row, next } = useMemo(() => rowBasis(model), [model]);
  const [cm, cn] = count ?? [0, 0];
  const view = useMemo(() => {
    if (!cm) return tiling(model).view;
    // Just the copies asked for, with a margin.
    const corners = [];
    for (let i = 0; i < cm; i++)
      for (let j = 0; j < cn; j++)
        for (const c of cell.corners)
          corners.push({
            x: c.x + i * row.x + j * next.x,
            y: c.y + i * row.y + j * next.y,
          });
    return fit(boxOf(corners) ?? tiling(model).view, 0.06);
  }, [model, cm, cn, cell, row, next]);
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
        const asked = !cm || (i >= 0 && i < cm && j >= 0 && j < cn);
        if (asked && inView(d)) out.push({ i, j, d });
      }
    return out;
  }, [row, next, view, cm, cn]);

  // All tiles in a later row move together. Animate that row once instead
  // of maintaining identical transforms, opacity, and color on every tile.
  const rows = useMemo(() => {
    const groups = new Map<number, typeof copies>();
    for (const copy of copies) {
      const list = groups.get(copy.j) ?? [];
      list.push(copy);
      groups.set(copy.j, list);
    }
    return [...groups];
  }, [copies]);

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
    let previous = performance.now();
    let elapsed = 0;
    const ease = (t: number) => 1 - (1 - t) ** 3;
    const camera = () => {
      const now = performance.now();
      if (!pauseRef.current) elapsed += now - previous;
      previous = now;
      const t = Math.min(1, elapsed / rowsStart);
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
    for (const node of svg.querySelectorAll<SVGGElement>('[data-slide]')) {
      if (typeof node.animate !== 'function') continue;
      const [i, j] = (node.dataset['slide'] ?? '0,0')
        .split(',')
        .map(Number) as [number, number];
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
      preserveAspectRatio={cm ? 'xMidYMid meet' : 'xMidYMid slice'}
      role="img"
      aria-label="The inked tile repeated edge to edge"
    >
      <defs>
        {/* The tile's ink, drawn once and reused by every copy, so a
            pattern with hundreds of lines stays light. */}
        <path id={inkId} className="tile-ink" d={inkPath} />
        {enter ? (
          <polygon
            id={`${inkId}-outline`}
            className="copy-outline"
            points={points(cell.corners)}
            stroke={TILE_COLOR}
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
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
      {rows.map(([j, tiles]) => (
        <g
          key={j}
          className="ink"
          data-slide={j === 0 ? undefined : `0,${j}`}
          transform={`translate(${j * next.x} ${-j * next.y})`}
        >
          {tiles.map(({ i, d }) => (
            <g
              key={i}
              data-copy={`${i},${j}`}
              data-slide={j === 0 ? `${i},0` : undefined}
              className={isOrigin(d) ? 'ink original' : undefined}
              transform={`translate(${i * row.x} ${-i * row.y})`}
            >
              {enter ? (
                <use
                  className="copy-outline-instance"
                  href={`#${inkId}-outline`}
                />
              ) : null}
              <use href={`#${inkId}`} />
            </g>
          ))}
        </g>
      ))}
    </svg>
  );
}

/** The accent for things in motion (--current in styles.css). */
const ACCENT_COLOR = '#f59e0b';

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

/**
 * A carved line or band: its shadow offset down and right, and a light
 * edge offset up and left, both under the line itself.
 */
export function relief(d: string, width: number) {
  const o = width * 0.3;
  return (
    <g className="relief">
      <path
        d={d}
        fill="none"
        stroke="rgba(0, 0, 0, 0.35)"
        strokeWidth={width}
        strokeLinecap="round"
        transform={`translate(${o} ${o})`}
      />
      <path
        d={d}
        fill="none"
        stroke="rgba(255, 255, 255, 0.4)"
        strokeWidth={width}
        strokeLinecap="round"
        transform={`translate(${-o} ${-o})`}
      />
    </g>
  );
}

/** The strapwork look's colours: a light band with dark edges. */
export const STRAP_EDGE = DEFAULT_FINISH.lines;
export const STRAP_BAND = DEFAULT_FINISH.band;

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

export interface PaletteColorGroup {
  color: string;
  minDistance: number;
  names: string[];
}

/**
 * Returns distinct colors present in the pattern, ordered strictly by how close
 * their innermost piece sits to the middle (0, 0) of the design.
 */
export function orderedPaletteColors(
  model: Model,
  coloring = tutorialColoring(model),
  view?: Rect,
): PaletteColorGroup[] {
  const reach = 2;
  const { view: defaultView } = tiling(model, {
    halfWide: 1,
    halfHigh: 1,
    reach,
  });
  const activeView = view ?? defaultView;
  const { cell } = model.pattern;
  const colors = pieceColors(model, coloring);
  const coloured = colouredModel(model, coloring);
  const fill = byPlace(coloured) ? placeFills(coloured, coloring) : undefined;
  const widths = strapWidths(model);
  const seen = fit(activeView, 1 + widths.edge);
  const meets = (ps: readonly Vec[]) =>
    Math.max(...ps.map((p) => p.x)) >= seen.minX &&
    Math.min(...ps.map((p) => p.x)) <= seen.maxX &&
    Math.max(...ps.map((p) => p.y)) >= seen.minY &&
    Math.min(...ps.map((p) => p.y)) <= seen.maxY;
  const move = (p: Vec, d: Vec): Vec => ({ x: p.x + d.x, y: p.y + d.y });

  const colorMap = new Map<
    string,
    { minDistance: number; names: Set<string> }
  >();

  for (let i = -reach; i <= reach; i++) {
    for (let j = -reach; j <= reach; j++) {
      const d = {
        x: cell.u.x * i + cell.v.x * j,
        y: cell.u.y * i + cell.v.y * j,
      };
      model.pattern.pieces.forEach((p, k) => {
        const polygon = p.polygon.map((q) => move(q, d));
        if (!meets(polygon)) return;
        const color = fill ? fill(k, i, j) : (colors[p.type] ?? '#999999');
        const cx = polygon.reduce((sum, q) => sum + q.x, 0) / polygon.length;
        const cy = polygon.reduce((sum, q) => sum + q.y, 0) / polygon.length;
        const dist = Math.hypot(cx, cy);
        const name = model.pattern.types[p.type]?.name;

        const entry = colorMap.get(color) ?? {
          minDistance: Infinity,
          names: new Set<string>(),
        };
        if (dist < entry.minDistance) entry.minDistance = dist;
        if (name) entry.names.add(name);
        colorMap.set(color, entry);
      });
    }
  }

  return [...colorMap.entries()]
    .map(([color, { minDistance, names }]) => ({
      color,
      minDistance,
      names: [...names],
    }))
    .sort((a, b) => a.minDistance - b.minDistance);
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
  grout = 1,
  jali: appearance,
  coloredUpTo,
  activeColorIndex,
  view: givenView,
}: {
  model: Model;
  /** A learner's colors (a saved design); else the tutorial's own. */
  coloring?: Coloring;
  /** A learner's wall style; else the tutorial's. */
  look?: WallStyle;
  /** Saved lattice, band or grout width. */
  grout?: number;
  jali?: JaliAppearance;
  /** If set, only colors with index < coloredUpTo receive their color; others show blueprint tone. */
  coloredUpTo?: number;
  /** Currently active color index being animated/rippled in quick succession. */
  activeColorIndex?: number;
  /** If set, renders within this camera view (e.g. locked to fullView) rather than tiling view. */
  view?: Rect;
}) {
  const lightId = `jali-thumb-${useId().replace(/:/g, '')}`;
  const reach = 2;
  const { view: defaultView } = tiling(model, {
    halfWide: 1,
    halfHigh: 1,
    reach,
  });
  const view = givenView ?? defaultView;
  const { cell } = model.pattern;
  const colors = pieceColors(model, coloring);
  const finish = finishOf(model, coloring);
  // Pieces of one shape can take different colors by where they sit (the
  // Comares bones); the wall's own rule then colors each copy.
  const coloured = colouredModel(model, coloring);
  const fill = byPlace(coloured) ? placeFills(coloured, coloring) : undefined;
  const jali = look === 'jali';
  const widths = strapWidths(model, jali ? latticeWidth(grout) : grout);
  // As the wall first shows it: strapwork bands, tiles with grout, or
  // only the lines.
  const strap = look === 'strapwork' || look === 'interlace';
  const woven = look === 'interlace';
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

  const strokes: string[] = [];
  // Interlace: the band on top at each crossing, drawn again.
  const over: string[] = [];
  const overIn: string[] = [];
  const overAt = (i: number, j: number) => {
    if (!woven) return;
    const place = (q: Vec) => `${sx(q)} ${sy(q)}`;
    for (const p of patchesAt(model.pattern, i, j, widths.edge))
      if (meets(p.band)) {
        over.push(patchPath(p.edge, place));
        overIn.push(patchPath(p.band, place));
      }
  };
  const overLayers = () =>
    (['edge', 'band'] as const).map((layer) =>
      over.length ? (
        <path
          key={`over-${layer}`}
          d={(layer === 'edge' ? over : overIn).join('')}
          fill="none"
          stroke={layer === 'edge' ? finish.lines : finish.band}
          strokeWidth={widths[layer]}
          strokeLinecap="butt"
          strokeLinejoin="round"
        />
      ) : null,
    );

  // When coloredUpTo is defined (e.g. progressive coloring in hero), render individual pieces
  // grouped by UNIQUE COLOR, rippling strictly from the middle (center rosette) outward.
  if (coloredUpTo !== undefined && !jali) {
    const palette = orderedPaletteColors(model, coloring, view);
    const colorIndexMap = new Map<string, number>();
    palette.forEach((p, idx) => colorIndexMap.set(p.color, idx));

    interface VisPiece {
      id: string;
      d: string;
      color: string;
      dist: number;
      angle: number;
    }
    const visPieces: VisPiece[] = [];

    for (let i = -reach; i <= reach; i++) {
      for (let j = -reach; j <= reach; j++) {
        const d = {
          x: cell.u.x * i + cell.v.x * j,
          y: cell.u.y * i + cell.v.y * j,
        };
        model.pattern.pieces.forEach((p, k) => {
          const polygon = p.polygon.map((q) => move(q, d));
          if (!meets(polygon)) return;
          const targetColor = fill
            ? fill(k, i, j)
            : (colors[p.type] ?? '#999999');
          const cx = polygon.reduce((sum, q) => sum + q.x, 0) / polygon.length;
          const cy = polygon.reduce((sum, q) => sum + q.y, 0) / polygon.length;
          const dist = Math.hypot(cx, cy);
          // Angle normalized from 12 o'clock clockwise: [0, 2*PI)
          let angle = Math.atan2(cy, cx) + Math.PI / 2;
          if (angle < 0) angle += Math.PI * 2;

          visPieces.push({
            id: `p-${p.type}-${i}-${j}-${k}`,
            d: poly(polygon),
            color: lines ? 'none' : targetColor,
            dist,
            angle,
          });
        });
        for (const s of model.pattern.ink) {
          const a = move(s.segment.a, d);
          const b = move(s.segment.b, d);
          if (meets([a, b]))
            strokes.push(`M${sx(a)} ${sy(a)}L${sx(b)} ${sy(b)}`);
        }
        overAt(i, j);
      }
    }

    // Group by unique color
    const byColorGroup = new Map<string, VisPiece[]>();
    for (const vp of visPieces) {
      const list = byColorGroup.get(vp.color) ?? [];
      list.push(vp);
      byColorGroup.set(vp.color, list);
    }

    interface StaggeredPiece extends VisPiece {
      colorIndex: number;
      staggerIndex: number;
      stepDelay: number;
    }
    const staggeredPieces: StaggeredPiece[] = [];

    for (const [color, list] of byColorGroup.entries()) {
      const cIdx = colorIndexMap.get(color) ?? 0;

      // Sort strictly from the middle (center rosette, lowest r) outward:
      list.sort((a, b) => {
        const dDiff = a.dist - b.dist;
        if (Math.abs(dDiff) > 0.15) {
          return dDiff;
        }
        return a.angle - b.angle;
      });

      // Quick, smooth cadence: between 22ms and 48ms per piece so each color family
      // completes within ~500ms without feeling sluggish or frenetic
      const stepDelay = Math.max(
        22,
        Math.min(48, Math.floor(480 / Math.max(1, list.length))),
      );

      list.forEach((vp, idx) => {
        staggeredPieces.push({
          ...vp,
          colorIndex: cIdx,
          staggerIndex: idx,
          stepDelay,
        });
      });
    }

    return (
      <svg className="thumbnail" viewBox={viewBox(view)} aria-hidden="true">
        {staggeredPieces.map((p) => {
          const isColored = p.colorIndex < coloredUpTo;
          const isRippling = p.colorIndex === activeColorIndex;
          const currentColor = isColored ? p.color : 'rgba(18, 28, 48, 0.45)';
          return (
            <path
              key={p.id}
              className={`piece ${strap ? 'strap' : ''} ${isRippling ? 'rippling' : ''}`}
              d={p.d}
              fill={currentColor}
              style={{
                fill: currentColor,
                stroke: strap ? currentColor : undefined,
                transition:
                  'fill 0.35s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                transitionDelay: isRippling
                  ? `${p.staggerIndex * p.stepDelay}ms`
                  : '0ms',
              }}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
        {(strap ? (['edge', 'band'] as const) : []).map((layer) => (
          <path
            key={layer}
            d={strokes.join('')}
            fill="none"
            stroke={layer === 'edge' ? finish.lines : finish.band}
            strokeWidth={widths[layer]}
            strokeLinecap="round"
          />
        ))}
        {overLayers()}
        {!strap && strokes.length > 0 && (
          <path
            className="thumbnail-lines"
            d={strokes.join('')}
            fill="none"
            stroke="rgba(226, 232, 240, 0.4)"
            strokeWidth={0.015}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
    );
  }

  // Fast bundled path rendering for static catalog thumbnails (coloredUpTo === undefined)
  const byColor = new Map<string, string[]>();
  for (let i = -reach; i <= reach; i++) {
    for (let j = -reach; j <= reach; j++) {
      const d = {
        x: cell.u.x * i + cell.v.x * j,
        y: cell.u.y * i + cell.v.y * j,
      };
      if (!jali)
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
      overAt(i, j);
    }
  }
  if (jali) {
    return (
      <svg
        className="thumbnail style-jali"
        viewBox={viewBox(view)}
        aria-hidden="true"
      >
        <JaliGround id={lightId} view={view} appearance={appearance} />
        <JaliFramework
          path={strokes.join('')}
          width={widths.grout}
          appearance={appearance}
        />
      </svg>
    );
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
      {finish.carved && !woven
        ? relief(strokes.join(''), strap ? widths.edge : widths.grout)
        : null}
      {(strap ? (['edge', 'band'] as const) : []).map((layer) => (
        <path
          key={layer}
          d={strokes.join('')}
          fill="none"
          stroke={layer === 'edge' ? finish.lines : finish.band}
          strokeWidth={widths[layer]}
          strokeLinecap="round"
        />
      ))}
      {overLayers()}
      {!strap && !lines && finish !== DEFAULT_FINISH && (
        <path
          d={strokes.join('')}
          fill="none"
          stroke={finish.lines}
          strokeWidth={widths.grout}
          strokeLinecap="round"
        />
      )}
      {!strap && coloredUpTo !== undefined && strokes.length > 0 && (
        <path
          className="thumbnail-lines"
          d={strokes.join('')}
          fill="none"
          stroke="rgba(226, 232, 240, 0.4)"
          strokeWidth={0.015}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
}
