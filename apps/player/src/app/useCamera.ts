import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
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
  {
    stage = 0,
    instant = false,
    active = true,
    paused = false,
    initialView,
  }: {
    stage?: number;
    instant?: boolean;
    active?: boolean;
    paused?: boolean;
    initialView?: Rect;
  } = {},
) {
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const [view, setView] = useState(() => {
    if (!initialView) return frame;
    // Bound supplied framing just as user gestures are bounded.
    const ratio = width(initialView) / (initialView.maxY - initialView.minY);
    const expected = width(frame) / (frame.maxY - frame.minY);
    if (
      !Number.isFinite(ratio) ||
      ratio <= 0 ||
      ratio / expected < 0.5 ||
      ratio / expected > 2
    )
      return frame;
    const wanted = width(initialView);
    const bounded = Math.max(
      width(frame) * ZOOM_IN,
      Math.min(width(frame) * ZOOM_OUT, wanted),
    );
    return wanted === bounded
      ? initialView
      : zoomAt(initialView, centreOf(initialView), wanted / bounded);
  });
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
      const from = current.current;
      if (
        from.minX === target.minX &&
        from.maxX === target.maxX &&
        from.minY === target.minY &&
        from.maxY === target.maxY
      )
        return;
      if (
        instant ||
        typeof requestAnimationFrame !== 'function' ||
        (typeof window.matchMedia === 'function' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      ) {
        setView(target);
        return;
      }
      let previous = performance.now();
      let elapsed = 0;
      const tick = (now: number) => {
        if (!pausedRef.current) elapsed += now - previous;
        previous = now;
        const t = Math.min(1, elapsed / GLIDE_MS);
        setView(between(from, target, ease(t)));
        if (t < 1) glide.current = requestAnimationFrame(tick);
      };
      glide.current = requestAnimationFrame(tick);
    },
    [instant],
  );

  // A new stage or a new frame takes the view there.
  const frameKey = `${stage}:${frame.minX},${frame.minY},${frame.maxX},${frame.maxY}`;
  const openingFrame = useRef(initialView ? frameKey : undefined);
  useLayoutEffect(() => {
    if (!active) return;
    // Keep restoration idempotent when StrictMode replays mount effects.
    if (openingFrame.current === frameKey) return stopGlide;
    openingFrame.current = undefined;
    goTo(frame);
    return stopGlide;
    // The key stands for the frame's value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameKey, goTo, active]);

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

  // One pointer pans after the drag threshold. Two touch contacts zoom
  // about their initial midpoint and pan with their moving midpoint.
  // Use a gesture snapshot so batched pointer events cannot drift the anchor.
  useEffect(() => {
    const svgs = svgsOf(svgRef);
    if (!svgs.length || !active) return;
    const offs = svgs.map((svg) => {
      type Contact = { x: number; y: number; touch: boolean };
      const contacts = new Map<number, Contact>();
      let start: { x: number; y: number; id: number } | undefined;
      let last: { x: number; y: number } | undefined;
      let pinch:
        | {
            view: Rect;
            at: Vec;
            x: number;
            y: number;
            distance: number;
            units: number;
          }
        | undefined;
      const apply = (target: Rect) => {
        current.current = target;
        setView(target);
      };
      const pair = () => {
        const points = [...contacts.values()];
        const a = points[0],
          b = points[1];
        if (points.length !== 2 || !a?.touch || !b?.touch) return undefined;
        return {
          x: (a.x + b.x) / 2,
          y: (a.y + b.y) / 2,
          distance: Math.hypot(a.x - b.x, a.y - b.y),
        };
      };
      const beginPinch = () => {
        const p = pair();
        pinch =
          p && p.distance > 0
            ? {
                ...p,
                view: current.current,
                at: frameAt(svg, current.current, p.x, p.y),
                units: unitsPerPixel(svg, current.current),
              }
            : undefined;
      };
      const down = (e: PointerEvent) => {
        if (e.button !== 0) return;
        contacts.set(e.pointerId, {
          x: e.clientX,
          y: e.clientY,
          touch: e.pointerType === 'touch',
        });
        if (contacts.size === 1) {
          start = { x: e.clientX, y: e.clientY, id: e.pointerId };
          last = undefined;
          dragged.current = false;
        } else {
          stopGlide();
          dragged.current = true;
          start = undefined;
          last = undefined;
          beginPinch();
        }
        if (contacts.size > 1)
          for (const id of contacts.keys()) svg.setPointerCapture?.(id);
      };
      const move = (e: PointerEvent) => {
        const contact = contacts.get(e.pointerId);
        if (!contact) return;
        contacts.set(e.pointerId, { ...contact, x: e.clientX, y: e.clientY });
        if (contacts.size >= 2) {
          e.preventDefault();
          const p = pair();
          if (!p || !pinch) {
            beginPinch();
            return;
          }
          const w = width(pinch.view),
            limit = width(frameRef.current);
          const factor = Math.min(
            Math.max(p.distance / pinch.distance, w / (limit * ZOOM_OUT)),
            w / (limit * ZOOM_IN),
          );
          const zoomed = zoomAt(pinch.view, pinch.at, factor);
          apply(
            panBy(
              zoomed,
              (-(p.x - pinch.x) * pinch.units) / factor,
              ((p.y - pinch.y) * pinch.units) / factor,
            ),
          );
          return;
        }
        if (!start || start.id !== e.pointerId) return;
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
        const dx = e.clientX - last.x,
          dy = e.clientY - last.y;
        last = { x: e.clientX, y: e.clientY };
        apply(panBy(current.current, -dx * u, dy * u));
      };
      const up = (e: PointerEvent) => {
        if (!contacts.delete(e.pointerId)) return;
        pinch = undefined;
        last = undefined;
        start = undefined;
        if (contacts.size === 1) {
          const [id, point] = [...contacts.entries()][0] ?? [];
          if (id !== undefined && point) {
            start = { ...point, id };
            // Continue panning without selecting a piece after a pinch.
            last = { x: point.x, y: point.y };
          }
        } else if (contacts.size === 2) beginPinch();
        svg.classList.remove('dragging');
      };
      const lost = (e: PointerEvent) => {
        // Capturing a touch from a child path releases that child's implicit
        // capture. That transfer is not the end of our gesture.
        if (e.target === svg && !svg.hasPointerCapture?.(e.pointerId)) up(e);
      };
      svg.addEventListener('pointerdown', down);
      svg.addEventListener('pointermove', move, { passive: false });
      svg.addEventListener('pointerup', up);
      svg.addEventListener('pointercancel', up);
      svg.addEventListener('lostpointercapture', lost);
      return () => {
        svg.removeEventListener('pointerdown', down);
        svg.removeEventListener('pointermove', move);
        svg.removeEventListener('pointerup', up);
        svg.removeEventListener('pointercancel', up);
        svg.removeEventListener('lostpointercapture', lost);
        for (const id of contacts.keys())
          if (svg.hasPointerCapture?.(id)) svg.releasePointerCapture?.(id);
        svg.classList.remove('dragging');
      };
    });
    return () => offs.forEach((off) => off());
  }, [svgRef, active, stage]);

  return { view, goTo, wasDrag: () => dragged.current };
}
