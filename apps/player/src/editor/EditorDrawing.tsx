import {
  distance,
  type Geometry,
  type InkPiece,
  type Scene,
  type Vec,
} from '@tastir/engine';
import { useMemo, useRef, useState } from 'react';
import { InkRaster } from './InkRaster';
import { viewBox, width, type Rect } from '../app/camera';
import { useCamera } from '../app/useCamera';
import {
  crossingsNear,
  pointPlaces,
  type PointPlace,
  type Target,
  type Tool,
  type ToolId,
} from './tools';

/** How near a click must be to take something, in screen pixels. */
const REACH_PX = 12;
/** Point names show this near the pointer, in screen pixels. */
const NAMES_PX = 70;
/** Unnamed crossings show as faint dots this near the pointer. */
const DOTS_PX = 45;
/** With this few named points in view, every name shows. */
const ALL_NAMES = 30;
/** Otherwise at most this many names show, nearest the pointer first. */
const NEAR_NAMES = 6;

/** A frame that holds every point and circle drawn, with room round it. */
export function frameOf(scene: Scene): Rect {
  let minX = -1.4;
  let maxX = 1.4;
  let minY = -1.4;
  let maxY = 1.4;
  const take = (p: Vec, r = 0) => {
    minX = Math.min(minX, p.x - r);
    maxX = Math.max(maxX, p.x + r);
    minY = Math.min(minY, p.y - r);
    maxY = Math.max(maxY, p.y + r);
  };
  for (const el of scene.elements.values()) {
    const g = el.geometry;
    if (g.kind === 'point') take(g.at);
    else if (g.kind === 'circle') take(g.circle.centre, g.circle.radius);
    else if (g.kind === 'polygon') g.vertices.forEach((v) => take(v));
  }
  const pad = 0.08 * Math.max(maxX - minX, maxY - minY);
  return {
    minX: minX - pad,
    minY: minY - pad,
    maxX: maxX + pad,
    maxY: maxY + pad,
  };
}

/**
 * The construction so far, with what the tool has taken in saffron and
 * what a click would take ringed. Drag pans, the wheel (or a pinch) zooms,
 * and Fit shows everything again. Point names show near the pointer, so a
 * big drawing stays readable; unnamed crossings near it show as faint dots
 * to click.
 */
export function EditorDrawing({
  scene,
  selected,
  targets,
  tool,
  hover,
  ink,
  candidates,
  tile,
  onHover,
  onClick,
  camera: shared,
  svgRef: sharedRef,
  fitTo,
  faint: extras,
  glow,
  rings,
  dashed,
  labelOf,
  current: currentNames,
  pen,
  penDots,
  numbered,
}: {
  scene: Scene;
  selected?: number;
  targets: readonly Target[];
  tool?: Tool | ToolId;
  hover?: Target;
  /** In ink mode: the bits of line, and which are inked; a hint may make
   * some glow and show others dashed. */
  ink?: {
    pieces: readonly InkPiece[];
    chosen: ReadonlySet<string>;
    glow?: ReadonlySet<string>;
    dashed?: ReadonlySet<string>;
    /** Copies just inked, which flash briefly. */
    fresh?: ReadonlySet<string>;
    /** Inked bits drawn again where the learner drew them: on the tile's
     * edge, the wall keeps one of two copies, and the other is shown too. */
    echo?: readonly { readonly a: Vec; readonly b: Vec }[];
  };
  /** Circles to choose between, drawn dashed. */
  candidates?: readonly { centre: Vec; radius: number }[];
  /** In ink mode: the tile's corners, drawn dotted, as only what is
   * inside it can be inked. */
  tile?: readonly Vec[];
  onHover: (at: Vec, reach: number) => void;
  onClick: (at: Vec, reach: number) => void;
  /** A camera shared with another drawing (drawing along): its view is
   * shown, and Fit goes to `fitTo`. */
  camera?: {
    readonly view: Rect;
    readonly goTo: (r: Rect) => void;
    readonly wasDrag: () => boolean;
  };
  svgRef?: React.RefObject<SVGSVGElement | null>;
  fitTo?: Rect;
  /** Elements drawn faint: the learner's own extras when drawing along. */
  faint?: ReadonlySet<string>;
  /** Elements that glow: what a step works from (a hint). */
  glow?: ReadonlySet<string>;
  /** Points ringed: where to click (a hint). */
  rings?: readonly Vec[];
  /** Figures drawn dashed: the answer (a hint). */
  dashed?: readonly Geometry[];
  /** The name shown for a point, when it differs from the board's own;
   * an empty name hides it. */
  labelOf?: (place: PointPlace) => string | undefined;
  /** Elements drawn as the step at hand (orange), when drawing along. */
  current?: ReadonlySet<string>;
  /** Inking with a pen: where it is down, and the dots one straight
   * stroke reaches; a line follows the pointer from the pen. */
  pen?: { readonly at: Vec; readonly reach: readonly Vec[] };
  /** Every dot the pen can go down on; those near the pointer show. */
  penDots?: readonly Vec[];
  /** The rings are numbered 1, 2, in the order to click them. */
  numbered?: boolean;
}) {
  const ownFrame = useMemo(() => frameOf(scene), [scene]);
  const frame = fitTo ?? ownFrame;
  const ownRef = useRef<SVGSVGElement>(null);
  const svgRef = sharedRef ?? ownRef;
  const own = useCamera(frame, ownRef, { active: !shared });
  const camera = shared ?? own;
  const view = camera.view;
  const [pointer, setPointer] = useState<Vec>();
  // Screen to drawing: the SVG keeps its aspect (meet), centred.
  const toFrame = (clientX: number, clientY: number) => {
    const r = svgRef.current?.getBoundingClientRect();
    const w = width(view);
    const h = view.maxY - view.minY;
    if (!r || !r.width || !r.height) return undefined;
    const s = Math.min(r.width / w, r.height / h);
    const ox = (r.width - w * s) / 2;
    const oy = (r.height - h * s) / 2;
    return {
      at: {
        x: view.minX + (clientX - r.left - ox) / s,
        y: view.maxY - (clientY - r.top - oy) / s,
      },
      perPx: 1 / s,
    };
  };
  const unit = width(view) / 400;
  // Units per screen pixel, as last measured (or as the view suggests).
  const perPx = useRef(unit);
  const far = 4 * Math.max(width(frame), frame.maxY - frame.minY);
  const named = (t: Target) =>
    t.kind === 'element' ? t.name : (t.name ?? undefined);
  const taken = new Set(targets.map(named).filter(Boolean));

  const shapes: React.ReactNode[] = [];
  for (const el of scene.elements.values()) {
    const g = el.geometry;
    if (g.kind === 'point' || g.kind === 'group') continue;
    const cls = [
      'el',
      el.step === selected || currentNames?.has(el.name) ? 'current' : '',
      taken.has(el.name) || (hover && named(hover) === el.name) ? 'taken' : '',
      extras?.has(el.name) ? 'extra' : '',
      glow?.has(el.name) ? 'glow' : '',
    ]
      .filter(Boolean)
      .join(' ');
    if (g.kind === 'circle')
      shapes.push(
        <circle
          key={el.name}
          className={cls}
          cx={g.circle.centre.x}
          cy={g.circle.centre.y}
          r={g.circle.radius}
        />,
      );
    else if (g.kind === 'line') {
      const { point: p, dir: d } = g.line;
      shapes.push(
        <line
          key={el.name}
          className={cls}
          x1={p.x - d.x * far}
          y1={p.y - d.y * far}
          x2={p.x + d.x * far}
          y2={p.y + d.y * far}
        />,
      );
    } else
      shapes.push(
        <polygon
          key={el.name}
          className={cls}
          points={g.vertices.map((v) => `${v.x},${v.y}`).join(' ')}
        />,
      );
  }

  // Named points: one dot and at most one name per place.
  const inView = (p: Vec) =>
    p.x >= view.minX &&
    p.x <= view.maxX &&
    p.y >= view.minY &&
    p.y <= view.maxY;
  const places = useMemo(() => pointPlaces(scene), [scene]);
  const visible = places.filter((p) => inView(p.at));
  const current = new Set(
    [...scene.elements.values()]
      .filter((el) => el.step === selected && el.geometry.kind === 'point')
      .map((el) => el.name),
  );
  // Near the pointer, only the few nearest names, so they never pile up.
  const nearPointer = new Set(
    pointer === undefined
      ? []
      : visible
          .map((p) => ({
            p,
            d: Math.hypot(p.at.x - pointer.x, p.at.y - pointer.y),
          }))
          .filter(({ d }) => d <= NAMES_PX * perPx.current)
          .sort((a, b) => a.d - b.d)
          .slice(0, visible.length > 150 ? 3 : NEAR_NAMES)
          .map(({ p }) => p.name),
  );
  const showName = (p: (typeof places)[number]) =>
    visible.length <= ALL_NAMES ||
    taken.has(p.name) ||
    p.names.some((n) => current.has(n)) ||
    nearPointer.has(p.name);
  const crowded = visible.length > 150;
  const dots = visible.map((p) => (
    <circle
      key={`d${p.name}`}
      className={
        p.names.some((n) => current.has(n))
          ? 'dot current'
          : crowded
            ? 'dot crowded'
            : 'dot'
      }
      cx={p.at.x}
      cy={p.at.y}
      r={unit * (crowded ? 1.6 : 3)}
    />
  ));
  const labels = visible
    .filter(showName)
    .map((p) => ({ p, text: labelOf?.(p) ?? p.name }))
    .filter(({ text }) => text)
    .map(({ p, text }) => (
      <text
        key={`n${p.name}`}
        className="point-name"
        x={p.at.x + unit * 5}
        y={-(p.at.y + unit * 5)}
        fontSize={unit * 12}
      >
        {text}
      </text>
    ));
  // Crossings with no name yet, near the pointer: places a click can take.
  const faint = useMemo(() => {
    if (!pointer || ink) return [];
    const reach = DOTS_PX * perPx.current;
    return crossingsNear(scene, pointer, reach)
      .filter(
        (c) =>
          !places.some(
            (p) => Math.hypot(p.at.x - c.p.x, p.at.y - c.p.y) < 1e-6,
          ),
      )
      .slice(0, 60);
  }, [pointer, ink, scene, places]);

  // Every dot the pen can go down on, small and light, so a phone shows
  // them too (drawn once per board and zoom, not on every pointer move).
  const allDots = useMemo(() => {
    if (!penDots) return undefined;
    const r = unit * 2.2;
    if (
      penDots.length > 1000 &&
      typeof CanvasRenderingContext2D !== 'undefined'
    )
      return <InkRaster view={view} dots={penDots} radius={r} />;
    if (penDots.length > 1000)
      return (
        <path
          className="pen-dot"
          d={penDots
            .map(
              ({ x, y }) =>
                `M${x - r},${y}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0`,
            )
            .join('')}
        />
      );
    return penDots.map((d, i) => (
      <circle key={`pd${i}`} className="pen-dot" cx={d.x} cy={d.y} r={r} />
    ));
  }, [penDots, unit, view]);
  // A large construction has hundreds of thousands of selectable bits.
  // They still remain separate in the geometry; equal-style strokes can
  // share an SVG path instead of creating one DOM node per bit.
  const inkPieces = ink?.pieces;
  const inkChosen = ink?.chosen;
  const inkGlow = ink?.glow;
  const inkDashed = ink?.dashed;
  const inkFresh = ink?.fresh;
  const inkLayers = useMemo(() => {
    if (!inkPieces) return undefined;
    const classes = (id: string) =>
      'ink-piece' +
      (inkChosen?.has(id) ? ' inked' : '') +
      (inkGlow?.has(id) ? ' glow' : '') +
      (inkDashed?.has(id) ? ' answer' : '') +
      (inkFresh?.has(id) ? ' fresh' : '');
    if (inkPieces.length <= 1000)
      return inkPieces.map((piece) => ({
        cls: classes(piece.id),
        pieces: [piece],
        raster: false,
        path: undefined,
      }));
    const groups = new Map<string, InkPiece[]>();
    for (const piece of inkPieces) {
      const cls = classes(piece.id);
      const group = groups.get(cls);
      if (group) group.push(piece);
      else groups.set(cls, [piece]);
    }
    const raster =
      inkPieces.length > 1000 &&
      typeof CanvasRenderingContext2D !== 'undefined';
    return [...groups].map(([cls, pieces]) => ({
      cls,
      pieces,
      raster: raster && cls === 'ink-piece',
      path:
        inkPieces.length > 1000 && !(raster && cls === 'ink-piece')
          ? pieces
              .map(({ segment: { a, b } }) => `M${a.x},${a.y}L${b.x},${b.y}`)
              .join('')
          : undefined,
    }));
  }, [inkPieces, inkChosen, inkGlow, inkDashed, inkFresh]);
  const inkDrawing = inkLayers?.map(({ cls, pieces, raster, path }) =>
    raster ? (
      <InkRaster key={cls} view={view} pieces={pieces} />
    ) : path !== undefined ? (
      <path key={cls} className={cls} d={path} />
    ) : (
      pieces.map((p) => (
        <line
          key={p.id}
          className={cls}
          x1={p.segment.a.x}
          y1={p.segment.a.y}
          x2={p.segment.b.x}
          y2={p.segment.b.y}
        />
      ))
    ),
  );

  const toolId = typeof tool === 'string' ? tool : tool?.id;
  const polyPoints = useMemo(() => {
    if (toolId !== 'polygon' && toolId !== 'tile') return [];
    return targets
      .filter((t): t is Target & { kind: 'point' } => t.kind === 'point')
      .map((t) => t.at);
  }, [targets, toolId]);

  const isClosingHover = useMemo(() => {
    if (!polyPoints.length || hover?.kind !== 'point') return false;
    const minLeast = toolId === 'tile' ? 4 : 3;
    if (polyPoints.length < minLeast) return false;
    const first = polyPoints[0];
    return first ? distance(hover.at, first) <= scene.tol.eps : false;
  }, [polyPoints, hover, toolId, scene.tol.eps]);

  const polyEnd = hover?.kind === 'point' ? hover.at : pointer;

  const ring = (t: Target, i: number | string, cls: string) => {
    if (t.kind !== 'point') return null;
    const isFirstPolyTarget =
      (toolId === 'polygon' || toolId === 'tile') && i === 0 && isClosingHover;
    return (
      <circle
        key={`${cls}${i}`}
        className={cls + (isFirstPolyTarget ? ' closing' : '')}
        cx={t.at.x}
        cy={t.at.y}
        r={unit * (isFirstPolyTarget ? 9 : 7)}
      />
    );
  };
  return (
    <div className="editor-canvas">
      <svg
        ref={svgRef}
        className="drawing editor-drawing"
        viewBox={viewBox(view)}
        role="img"
        aria-label="The construction so far"
        onPointerMove={(e) => {
          const f = toFrame(e.clientX, e.clientY);
          if (!f) return;
          perPx.current = f.perPx;
          setPointer(f.at);
          onHover(f.at, REACH_PX * f.perPx);
        }}
        onPointerLeave={() => {
          setPointer(undefined);
          onHover({ x: Infinity, y: Infinity }, 0);
        }}
        onClick={(e) => {
          if (camera.wasDrag()) return;
          const f = toFrame(e.clientX, e.clientY);
          if (f) onClick(f.at, REACH_PX * f.perPx);
        }}
      >
        <g transform="scale(1,-1)" style={{ strokeWidth: unit * 1.5 }}>
          {shapes}
          {/* The tile under the ink, so ink along its edge shows. */}
          {tile ? (
            <polygon
              className="tile-outline"
              points={tile.map((v) => `${v.x},${v.y}`).join(' ')}
            />
          ) : null}
          {inkDrawing}
          {ink?.echo?.map((s, i) => (
            <line
              key={`e${i}`}
              className="ink-piece inked echo"
              x1={s.a.x}
              y1={s.a.y}
              x2={s.b.x}
              y2={s.b.y}
            />
          ))}
          {faint.map((c, i) => (
            <circle
              key={`f${i}`}
              className="crossing"
              cx={c.p.x}
              cy={c.p.y}
              r={unit * 2.5}
            />
          ))}
          {candidates?.map((c, i) => (
            <circle
              key={`c${i}`}
              className="candidate"
              cx={c.centre.x}
              cy={c.centre.y}
              r={c.radius}
            />
          ))}
          {dashed?.map((g, i) => (
            <Dashed key={`a${i}`} g={g} far={far} />
          ))}
          {dots}
          {allDots}
          {pen
            ? pen.reach.map((d, i) => (
                <circle
                  key={`pr${i}`}
                  className="pen-dot reach"
                  cx={d.x}
                  cy={d.y}
                  r={unit * 3.5}
                />
              ))
            : null}
          {pen && pointer ? (
            <line
              className="pen-band"
              x1={pen.at.x}
              y1={pen.at.y}
              x2={pointer.x}
              y2={pointer.y}
            />
          ) : null}
          {pen ? (
            <circle
              className="pen-at"
              cx={pen.at.x}
              cy={pen.at.y}
              r={unit * 6}
            />
          ) : null}
          {rings?.map((p, i) => (
            <circle
              key={`r${i}`}
              className={numbered && i === 0 ? 'hint-ring start' : 'hint-ring'}
              cx={p.x}
              cy={p.y}
              r={unit * 9}
            />
          ))}
          {/* In-progress polygon and tile: preview surface wash, dotted segments, and rubber-band */}
          {polyPoints.length >= 2 && polyEnd ? (
            <polygon
              className="polygon-preview"
              points={[...polyPoints, ...(isClosingHover ? [] : [polyEnd])]
                .map((p) => `${p.x},${p.y}`)
                .join(' ')}
            />
          ) : null}
          {polyPoints.map((p, i) => {
            if (i === 0) return null;
            const prev = polyPoints[i - 1];
            if (!prev) return null;
            return (
              <line
                key={`poly-seg-${i}`}
                className="polygon-band"
                x1={prev.x}
                y1={prev.y}
                x2={p.x}
                y2={p.y}
              />
            );
          })}
          {polyPoints.length >= 1 && polyEnd ? (
            <line
              className={`polygon-band rubber${isClosingHover ? ' closing' : ''}`}
              x1={polyPoints[polyPoints.length - 1]!.x}
              y1={polyPoints[polyPoints.length - 1]!.y}
              x2={polyEnd.x}
              y2={polyEnd.y}
            />
          ) : null}
          {targets.map((t, i) => ring(t, i, 'target'))}
          {hover ? ring(hover, 'h', 'hover') : null}
        </g>
        <g className="labels">
          {labels}
          {numbered
            ? rings?.map((p, i) => (
                <text
                  key={`rn${i}`}
                  className="ring-number"
                  x={p.x + unit * 11}
                  y={-(p.y + unit * 11)}
                  fontSize={unit * 15}
                >
                  {i + 1}
                </text>
              ))
            : null}
        </g>
      </svg>
      <button type="button" className="fit" onClick={() => camera.goTo(frame)}>
        Fit
      </button>
    </div>
  );
}

/** A figure of the answer, dashed, for the learner to draw over. */
function Dashed({ g, far }: { g: Geometry; far: number }) {
  if (g.kind === 'circle')
    return (
      <circle
        className="answer"
        cx={g.circle.centre.x}
        cy={g.circle.centre.y}
        r={g.circle.radius}
      />
    );
  if (g.kind === 'line') {
    const { point: p, dir: d } = g.line;
    return (
      <line
        className="answer"
        x1={p.x - d.x * far}
        y1={p.y - d.y * far}
        x2={p.x + d.x * far}
        y2={p.y + d.y * far}
      />
    );
  }
  if (g.kind === 'polygon')
    return (
      <polygon
        className="answer"
        points={g.vertices.map((v) => `${v.x},${v.y}`).join(' ')}
      />
    );
  return null;
}
