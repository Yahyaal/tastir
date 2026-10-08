import { useCallback, useEffect, useRef, useState } from 'react';
import type { Vec } from '@tastir/engine';
import { between, centreOf, panBy, width, zoomAt, type Rect } from './camera';

/** How far the pointer moves before a press becomes a drag. */
const DRAG_PX = 4;

/** Zoom stays between these multiples of the frame's width. */
const ZOOM_IN = 1 / 20;
const ZOOM_OUT = 3;

/** How long the view takes to glide to a new frame. */
const GLIDE_MS = 450;

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/** Tutorial-frame units per screen pixel in the drawing. */
function unitsPerPixel(svg: SVGSVGElement, view: Rect): number {
  const m = svg.getScreenCTM?.();
  if (m && m.a) return 1 / Math.hypot(m.a, m.b);
  return width(view) / (svg.clientWidth || 1000);
}

/** The tutorial-frame point under a screen position. */
function frameAt(
  svg: SVGSVGElement,
  view: Rect,
  clientX: number,
  clientY: number,
): Vec {
  const m = svg.getScreenCTM?.();
  if (!m || !m.a) return centreOf(view);
  const p = new DOMPoint(clientX, clientY).matrixTransform(m.inverse());
  return { x: p.x, y: -p.y };
}

type SvgRef = React.RefObject<SVGSVGElement | null>;

/** The drawings a camera moves: one, or several sharing one view. */
const svgsOf = (refs: SvgRef | readonly SvgRef[]): SVGSVGElement[] =>
  (Array.isArray(refs) ? refs : [refs as SvgRef]).flatMap((r) =>
    r.current ? [r.current] : [],
  );

/**
 * The view of the construction. It glides to `frame` whenever `frame` or
 * `stage` changes (each step frames itself, even when two steps share a
 * frame), and drag, wheel and pinch on the drawing take over until then.
 * With `instant`, it jumps. Several drawings (a stable array of refs)
 * share one view: zooming or panning one moves them all.
 */
export function useCamera(
  frame: Rect,
  svgRef: SvgRef | readonly SvgRef[],
  { stage = 0, instant = false, active = true } = {},
) {
  const [view, setView] = useState(frame);
  const current = useRef(view);
  current.current = view;
  const frameRef = useRef(frame);
  frameRef.current = frame;
  const glide = useRef(0);
  // Whether the last press became a drag, so its click can be ignored.
  const dragged = useRef(false);

  const stopGlide = () => cancelAnimationFrame(glide.current);

  const goTo = useCallback(
    (target: Rect) => {
      stopGlide();
      if (instant || typeof requestAnimationFrame !== 'function') {
        setView(target);
        return;
      }
      const from = current.current;
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / GLIDE_MS);
        setView(between(from, target, ease(t)));
        if (t < 1) glide.current = requestAnimationFrame(tick);
      };
      glide.current = requestAnimationFrame(tick);
    },
    [instant],
  );

  // A new stage or a new frame takes the view there.
  const frameKey = `${stage}:${frame.minX},${frame.minY},${frame.maxX},${frame.maxY}`;
  useEffect(() => {
    goTo(frame);
    return stopGlide;
    // The key stands for the frame's value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameKey, goTo]);

  // (Listeners are attached again at each stage, as a stage may swap the
  // drawing for another.)
  // Wheel and trackpad pinch zoom about the pointer. The listener is not
  // passive, so the page does not scroll while zooming.
  useEffect(() => {
    const svgs = svgsOf(svgRef);
    if (!svgs.length || !active) return;
    const offs = svgs.map((svg) => {
      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        stopGlide();
        // Pinch arrives as a wheel with ctrlKey and small deltas.
        const wanted = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015));
        // Keep the width within ZOOM_IN and ZOOM_OUT of the frame's.
        const w = width(current.current);
        const limit = width(frameRef.current);
        const factor = Math.min(
          Math.max(wanted, w / (limit * ZOOM_OUT)),
          w / (limit * ZOOM_IN),
        );
        const at = frameAt(svg, current.current, e.clientX, e.clientY);
        setView(zoomAt(current.current, at, factor));
      };
      svg.addEventListener('wheel', onWheel, { passive: false });
      return () => svg.removeEventListener('wheel', onWheel);
    });
    return () => offs.forEach((off) => off());
  }, [svgRef, active, stage]);

  // Dragging pans. The drag starts only once the pointer has moved a few
  // pixels, so a plain click still reaches what is under it (free inking).
  useEffect(() => {
    const svgs = svgsOf(svgRef);
    if (!svgs.length || !active) return;
    const offs = svgs.map((svg) => {
      let start: { x: number; y: number; id: number } | undefined;
      let last: { x: number; y: number } | undefined;
      const down = (e: PointerEvent) => {
        if (e.button !== 0) return;
        start = { x: e.clientX, y: e.clientY, id: e.pointerId };
        dragged.current = false;
      };
      const move = (e: PointerEvent) => {
        if (!start) return;
        if (!last) {
          if (Math.hypot(e.clientX - start.x, e.clientY - start.y) < DRAG_PX)
            return;
          stopGlide();
          dragged.current = true;
          last = { x: start.x, y: start.y };
          svg.setPointerCapture?.(start.id);
          svg.classList.add('dragging');
        }
        const u = unitsPerPixel(svg, current.current);
        const dx = e.clientX - last.x;
        const dy = e.clientY - last.y;
        last = { x: e.clientX, y: e.clientY };
        // Screen y points down, the frame's y up.
        setView(panBy(current.current, -dx * u, dy * u));
      };
      const up = () => {
        start = undefined;
        last = undefined;
        svg.classList.remove('dragging');
      };
      svg.addEventListener('pointerdown', down);
      svg.addEventListener('pointermove', move);
      svg.addEventListener('pointerup', up);
      svg.addEventListener('pointercancel', up);
      return () => {
        svg.removeEventListener('pointerdown', down);
        svg.removeEventListener('pointermove', move);
        svg.removeEventListener('pointerup', up);
        svg.removeEventListener('pointercancel', up);
      };
    });
    return () => offs.forEach((off) => off());
  }, [svgRef, active, stage]);

  return { view, goTo, wasDrag: () => dragged.current };
}
