import { useLayoutEffect, useRef } from 'react';
import type { Pattern } from '@tastir/engine';
import type { Rect } from './camera';

const TYPE_MS = 1100;
const SPREAD_MS = 800;
const FADE_MS = 350;

/** A temporary raster cover over the vector wall. Shapes are painted once
 * per type; each frame only composites those cached images with a radial
 * fade. The finished, interactive wall stays SVG at every zoom level. */
export function ColorReveal({
  pattern,
  view,
  groutWidth,
}: {
  pattern: Pattern;
  view: Rect;
  groutWidth: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const canvas = ref.current;
    // jsdom and browsers without canvas show the finished vector wall.
    if (!canvas || typeof Path2D === 'undefined') return;
    const ctx = canvas.getContext('2d');
    if (!ctx || typeof canvas.animate !== 'function') return;
    const bounds = canvas.getBoundingClientRect();
    const worldWidth = view.maxX - view.minX;
    const worldHeight = view.maxY - view.minY;
    // Bound transient bitmap memory on very large/high-DPI displays.
    const scale = Math.min(
      (bounds.width / worldWidth) * window.devicePixelRatio,
      2048 / Math.max(worldWidth, worldHeight),
      Math.sqrt(
        16_000_000 / ((pattern.types.length + 3) * worldWidth * worldHeight),
      ),
    );
    if (!(scale > 0)) return;
    const w = Math.ceil(worldWidth * scale);
    const h = Math.ceil(worldHeight * scale);
    canvas.width = w;
    canvas.height = h;
    const make = () => {
      const buffer = document.createElement('canvas');
      buffer.width = w;
      buffer.height = h;
      return buffer;
    };
    const buffers = pattern.types.map(make);
    const scratch = make();
    const future = make();
    const futureContext = future.getContext('2d');
    const work = scratch.getContext('2d');
    const contexts = buffers.map((buffer) => buffer.getContext('2d'));
    if (!work || !futureContext || contexts.some((c) => !c)) return;
    const style = getComputedStyle(canvas);
    for (const context of contexts) {
      if (!context) continue;
      context.fillStyle = style.getPropertyValue('--paper').trim();
      context.strokeStyle = style.getPropertyValue('--ink').trim();
      context.lineWidth = groutWidth;
      context.lineJoin = 'round';
    }
    const paths = pattern.pieces.map(
      ({ polygon }) =>
        new Path2D(`M${polygon.map((p) => `${p.x},${-p.y}`).join('L')}Z`),
    );
    // Inverse lattice coordinates give a conservative range of copies.
    // Include each piece's extent, including pieces crossing the cell edge.
    const { u, v } = pattern.cell;
    const det = u.x * v.y - u.y * v.x;
    const lattice = (x: number, y: number) => ({
      i: (x * v.y - y * v.x) / det,
      j: (u.x * y - u.y * x) / det,
    });
    const corners = [
      lattice(view.minX, view.minY),
      lattice(view.minX, view.maxY),
      lattice(view.maxX, view.minY),
      lattice(view.maxX, view.maxY),
    ];
    const pieceBounds = pattern.pieces.map(({ polygon }) => ({
      minX: Math.min(...polygon.map((p) => p.x)),
      maxX: Math.max(...polygon.map((p) => p.x)),
      minY: Math.min(...polygon.map((p) => p.y)),
      maxY: Math.max(...polygon.map((p) => p.y)),
    }));
    const vertices = pattern.pieces.flatMap((p) =>
      p.polygon.map((q) => lattice(q.x, q.y)),
    );
    if (!vertices.length) return;
    const i0 =
      Math.floor(
        Math.min(...corners.map((p) => p.i)) -
          Math.max(...vertices.map((p) => p.i)),
      ) - 1;
    const i1 =
      Math.ceil(
        Math.max(...corners.map((p) => p.i)) -
          Math.min(...vertices.map((p) => p.i)),
      ) + 1;
    const j0 =
      Math.floor(
        Math.min(...corners.map((p) => p.j)) -
          Math.max(...vertices.map((p) => p.j)),
      ) - 1;
    const j1 =
      Math.ceil(
        Math.max(...corners.map((p) => p.j)) -
          Math.min(...vertices.map((p) => p.j)),
      ) + 1;
    for (let i = i0; i <= i1; i++)
      for (let j = j0; j <= j1; j++) {
        const dx = i * u.x + j * v.x;
        const dy = i * u.y + j * v.y;
        pattern.pieces.forEach((piece, k) => {
          const b = pieceBounds[k];
          const context = contexts[piece.type];
          const path = paths[k];
          if (
            !b ||
            !context ||
            !path ||
            b.maxX + dx < view.minX - groutWidth ||
            b.minX + dx > view.maxX + groutWidth ||
            b.maxY + dy < view.minY - groutWidth ||
            b.minY + dy > view.maxY + groutWidth
          )
            return;
          context.setTransform(
            scale,
            0,
            0,
            scale,
            (dx - view.minX) * scale,
            (view.maxY - dy) * scale,
          );
          context.fill(path);
          context.stroke(path);
        });
      }
    const far =
      Math.max(
        ...[
          [view.minX, view.minY],
          [view.minX, view.maxY],
          [view.maxX, view.minY],
          [view.maxX, view.maxY],
        ].map(([x = 0, y = 0]) => Math.hypot(x, y)),
      ) * scale;
    const duration =
      400 + Math.max(0, buffers.length - 1) * TYPE_MS + SPREAD_MS + FADE_MS;
    // A single browser animation is the clock, so Finish/Back and tests can
    // settle it just like the construction and repeat animations.
    const animation = canvas.animate(
      [
        { opacity: 1, offset: 0 },
        { opacity: 1, offset: 1 },
      ],
      { duration, fill: 'backwards' },
    );
    const release = () => {
      for (const buffer of [...buffers, scratch, future, canvas]) {
        buffer.width = 1;
        buffer.height = 1;
      }
    };
    let frame = 0;
    let futureFrom = -1;
    const paint = () => {
      if (
        animation.playState === 'finished' ||
        animation.playState === 'idle'
      ) {
        release();
        return;
      }
      const time = Number(animation.currentTime ?? 0);
      ctx.clearRect(0, 0, w, h);
      const firstFuture = Math.min(
        buffers.length,
        Math.max(0, Math.floor((time - 400) / TYPE_MS) + 1),
      );
      // The types whose turn has not begun are static. Composite them once
      // when the next type starts, not once per type on every frame.
      if (futureFrom !== firstFuture) {
        futureContext.clearRect(0, 0, w, h);
        for (let type = firstFuture; type < buffers.length; type++) {
          const buffer = buffers[type];
          if (buffer) futureContext.drawImage(buffer, 0, 0);
        }
        futureFrom = firstFuture;
      }
      for (
        let type = Math.max(0, firstFuture - 2);
        type < firstFuture;
        type++
      ) {
        const buffer = buffers[type];
        const t = time - 400 - type * TYPE_MS;
        if (!buffer || t >= SPREAD_MS + FADE_MS) continue;
        if (t <= 0) {
          ctx.drawImage(buffer, 0, 0);
          continue;
        }
        work.globalCompositeOperation = 'source-over';
        work.clearRect(0, 0, w, h);
        work.drawImage(buffer, 0, 0);
        work.globalCompositeOperation = 'destination-out';
        const inner = Math.max(0, (t - FADE_MS) / SPREAD_MS) * far;
        const outer = (t / SPREAD_MS) * far;
        const cx = -view.minX * scale;
        const cy = view.maxY * scale;
        const gradient = work.createRadialGradient(
          cx,
          cy,
          inner,
          cx,
          cy,
          outer,
        );
        gradient.addColorStop(0, `rgba(0,0,0,${Math.min(1, t / FADE_MS)})`);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        work.fillStyle = gradient;
        work.fillRect(0, 0, w, h);
        ctx.drawImage(scratch, 0, 0);
      }
      if (firstFuture < buffers.length) ctx.drawImage(future, 0, 0);
      frame = requestAnimationFrame(paint);
    };
    paint();
    return () => {
      cancelAnimationFrame(frame);
      animation.cancel();
      release();
    };
  }, [pattern, view, groutWidth]);
  return (
    <foreignObject
      className="color-veil"
      x={view.minX}
      y={-view.maxY}
      width={view.maxX - view.minX}
      height={view.maxY - view.minY}
      aria-hidden="true"
    >
      <canvas
        ref={ref}
        style={{ display: 'block', width: '100%', height: '100%', opacity: 0 }}
      />
    </foreignObject>
  );
}
