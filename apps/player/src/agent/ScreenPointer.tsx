import { useEffect, useState } from 'react';
import type { Geometry } from '@tastir/engine';
import type { Highlight, Snapshot } from '@tastir/agent-protocol';
import {
  boardIdentity,
  boardTargets,
  boardWindow,
  controls,
  screenRoot,
  visibleElement,
} from './screenTargets';

type Mark = Highlight & {
  route: string;
  callId: string;
  target: Snapshot['targets'][number];
  svg?: SVGSVGElement;
  node?: HTMLElement;
  source?: unknown;
  stage?: number;
};
let mark: Mark | undefined;
const listeners = new Set<() => void>();
const changed = () => listeners.forEach((listener) => listener());
export function clearScreenHighlight() {
  mark = undefined;
  changed();
}

/** Resolve only IDs the app supplied; no model selectors, coordinates or clicks. */
export function showScreenHighlight(
  callId: string,
  request: Highlight,
  snapshot: Snapshot,
  svg?: SVGSVGElement,
) {
  const target = snapshot.targets.find((t) => t.id === request.targetId);
  if (!target) return false;
  if (target.kind === 'control') {
    const current = controls().find((c) => c.target.id === target.id);
    if (!current || JSON.stringify(current.target) !== JSON.stringify(target))
      return false;
    mark = {
      ...request,
      callId,
      route: window.location.hash,
      target,
      node: current.node,
    };
  } else {
    if (
      !svg ||
      !boardTargets(svg).some(
        (t) => JSON.stringify(t) === JSON.stringify(target),
      )
    )
      return false;
    const identity = boardIdentity(svg);
    mark = {
      ...request,
      callId,
      route: window.location.hash,
      target,
      svg,
      source: identity?.source,
      stage: identity?.stage,
    };
  }
  changed();
  return true;
}

export function screenHighlightDisplayed(callId: string) {
  const shown = document.querySelector<HTMLElement>('[data-screen-pointer]');
  return (
    mark?.callId === callId &&
    shown?.dataset['pointerSnapshot'] === mark.snapshotId &&
    shown.dataset['screenPointer'] === mark.targetId &&
    !!shown.querySelector('[data-pointer-shape]')
  );
}

function picture(m: Mark) {
  if (window.location.hash !== m.route || !screenRoot()) return;
  if (m.node) {
    if (!screenRoot()?.contains(m.node) || !visibleElement(m.node)) return;
    const r = m.node.getBoundingClientRect();
    return {
      shape: (
        <rect
          data-pointer-shape
          x={r.x - 4}
          y={r.y - 4}
          width={r.width + 8}
          height={r.height + 8}
          rx="9"
        />
      ),
      x: r.left,
      y: r.top - 30,
    };
  }
  const svg = m.svg;
  if (!svg || !screenRoot()?.contains(svg) || !visibleElement(svg)) return;
  const identity = boardIdentity(svg);
  if (!identity || identity.source !== m.source || identity.stage !== m.stage)
    return;
  const matrix = svg.getScreenCTM();
  if (!matrix?.a) return;
  const r = boardWindow(svg);
  if (r.right <= r.left || r.bottom <= r.top) return;
  const g = m.target.geometry as unknown as Geometry;
  const unit = 1 / Math.hypot(matrix.a, matrix.b);
  let shape;
  let x = r.left + 8,
    y = r.top + 8;
  if (g.kind === 'point') {
    const p = new DOMPoint(g.at.x, -g.at.y).matrixTransform(matrix);
    if (p.x < r.left || p.x > r.right || p.y < r.top || p.y > r.bottom) return;
    x = p.x + 12;
    y = p.y - 48;
    shape = <circle cx={g.at.x} cy={g.at.y} r={9 * unit} />;
  } else if (g.kind === 'circle') {
    shape = (
      <circle
        cx={g.circle.centre.x}
        cy={g.circle.centre.y}
        r={g.circle.radius}
      />
    );
  } else if (g.kind === 'polygon') {
    shape = (
      <polygon points={g.vertices.map((p) => `${p.x},${p.y}`).join(' ')} />
    );
  } else if (g.kind === 'line') {
    const far =
      ((r.right - r.left + r.bottom - r.top) * unit * 10) /
      Math.hypot(g.line.dir.x, g.line.dir.y);
    shape = (
      <line
        x1={g.line.point.x - g.line.dir.x * far}
        y1={g.line.point.y - g.line.dir.y * far}
        x2={g.line.point.x + g.line.dir.x * far}
        y2={g.line.point.y + g.line.dir.y * far}
      />
    );
  } else return;
  return {
    x: Math.max(r.left + 8, Math.min(r.right - 220, x)),
    y,
    shape: (
      <svg
        x={r.left}
        y={r.top}
        width={r.right - r.left}
        height={r.bottom - r.top}
        viewBox={`${r.left} ${r.top} ${r.right - r.left} ${r.bottom - r.top}`}
        overflow="hidden"
      >
        <g
          data-pointer-shape
          transform={`matrix(${matrix.a} ${matrix.b} ${matrix.c} ${matrix.d} ${matrix.e} ${matrix.f})`}
        >
          <g
            clipPath={
              svg.querySelector('[clip-path]')?.getAttribute('clip-path') ??
              undefined
            }
          >
            <g transform="scale(1 -1)">{shape}</g>
          </g>
        </g>
      </svg>
    ),
  };
}

/** Project live SVG coordinates each frame so scrolling and camera motion stay aligned. */
export function ScreenPointer({ active }: { active: boolean }) {
  const [current, setCurrent] = useState(mark);
  const [, redraw] = useState(0);
  useEffect(() => {
    const listener = () => setCurrent(mark);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  useEffect(() => {
    if (!active) clearScreenHighlight();
  }, [active]);
  useEffect(() => {
    if (!current || !active) return;
    let frame = 0;
    let lastPosition = '';
    const tick = () => {
      if (
        window.location.hash !== current.route ||
        (current.svg &&
          (!current.svg.isConnected ||
            boardIdentity(current.svg)?.source !== current.source ||
            boardIdentity(current.svg)?.stage !== current.stage)) ||
        (current.node && !current.node.isConnected)
      ) {
        clearScreenHighlight();
        return;
      }
      const rect = (current.svg ?? current.node)?.getBoundingClientRect();
      const matrix = current.svg?.getScreenCTM();
      const position = JSON.stringify([
        rect && [rect.x, rect.y, rect.width, rect.height],
        matrix && [matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f],
        current.svg && boardWindow(current.svg),
        window.innerWidth,
        window.innerHeight,
      ]);
      if (position !== lastPosition) {
        lastPosition = position;
        redraw((n) => n + 1);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [current, active]);
  const display = current && active ? picture(current) : undefined;
  if (!display) return null;
  return (
    <div
      data-screen-pointer={current?.targetId}
      data-pointer-snapshot={current?.snapshotId}
      data-agent-annotation
      className="agent-screen-pointer"
      aria-label="Assistant pointing"
    >
      <svg
        className="agent-screen-pointer-svg"
        width={window.innerWidth}
        height={window.innerHeight}
        aria-hidden="true"
      >
        {display.shape}
      </svg>
      <p
        role="status"
        style={{
          left: Math.max(8, Math.min(window.innerWidth - 220, display.x)),
          top: Math.max(8, Math.min(window.innerHeight - 64, display.y)),
        }}
      >
        {current?.label}
      </p>
    </div>
  );
}
