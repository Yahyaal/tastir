import type { InkPiece, Scene, Vec } from '@tastir/engine';
import { useMemo, useRef, useState } from 'react';
import { viewBox, width, type Rect } from '../app/camera';
import { useCamera } from '../app/useCamera';
import { crossingsNear, pointPlaces, type Target } from './tools';

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
  hover,
  ink,
  onHover,
  onClick,
}: {
  scene: Scene;
  selected?: number;
  targets: readonly Target[];
  hover?: Target;
  /** In ink mode: the bits of line, and which are inked. */
  ink?: { pieces: readonly InkPiece[]; chosen: ReadonlySet<string> };
  onHover: (at: Vec, reach: number) => void;
  onClick: (at: Vec, reach: number) => void;
}) {
  const frame = useMemo(() => frameOf(scene), [scene]);
  const svgRef = useRef<SVGSVGElement>(null);
  const camera = useCamera(frame, svgRef);
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
      el.step === selected ? 'current' : '',
      taken.has(el.name) || (hover && named(hover) === el.name) ? 'taken' : '',
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
  const places = pointPlaces(scene);
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
  const labels = visible.filter(showName).map((p) => (
    <text
      key={`n${p.name}`}
      className="point-name"
      x={p.at.x + unit * 5}
      y={-(p.at.y + unit * 5)}
      fontSize={unit * 12}
    >
      {p.name}
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

  const ring = (t: Target, i: number | string, cls: string) =>
    t.kind === 'point' ? (
      <circle
        key={`${cls}${i}`}
        className={cls}
        cx={t.at.x}
        cy={t.at.y}
        r={unit * 7}
      />
    ) : null;
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
          {ink
            ? ink.pieces.map((p) => (
                <line
                  key={p.id}
                  className={
                    ink.chosen.has(p.id) ? 'ink-piece inked' : 'ink-piece'
                  }
                  x1={p.segment.a.x}
                  y1={p.segment.a.y}
                  x2={p.segment.b.x}
                  y2={p.segment.b.y}
                />
              ))
            : null}
          {faint.map((c, i) => (
            <circle
              key={`f${i}`}
              className="crossing"
              cx={c.p.x}
              cy={c.p.y}
              r={unit * 2.5}
            />
          ))}
          {dots}
          {targets.map((t, i) => ring(t, i, 'target'))}
          {hover ? ring(hover, 'h', 'hover') : null}
        </g>
        <g className="labels">{labels}</g>
      </svg>
      <button type="button" className="fit" onClick={() => camera.goTo(frame)}>
        Fit
      </button>
    </div>
  );
}
