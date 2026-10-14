import type { InkPiece, Vec } from '@tastir/engine';
import { memo, useLayoutEffect, useRef } from 'react';
import type { Rect } from '../app/camera';

/** Dense, non-interactive background geometry, rasterized at screen resolution.
 * The SVG still owns the camera, style, hit testing, and all ink/hint overlays. */
export const InkRaster = memo(function InkRaster({
  view,
  dots,
  pieces,
  radius = 0,
}: {
  view: Rect;
  dots?: readonly Vec[];
  pieces?: readonly InkPiece[];
  radius?: number;
}) {
  const host = useRef<SVGForeignObjectElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const probe = useRef<SVGPathElement>(null);
  useLayoutEffect(() => {
    const node = host.current;
    const surface = canvas.current;
    const styleNode = probe.current;
    const svg = node?.ownerSVGElement;
    if (!node || !surface || !styleNode || !svg) return;
    let lastPaint = '';
    const paint = () => {
      const started = performance.now();
      const bounds = svg.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const style = getComputedStyle(styleNode);
      const ratio = window.devicePixelRatio || 1;
      const signature = [
        bounds.width,
        bounds.height,
        ratio,
        style.fill,
        style.fillOpacity,
        style.stroke,
        style.strokeWidth,
        style.strokeDasharray,
        style.strokeOpacity,
      ].join('|');
      if (signature === lastPaint) return;
      lastPaint = signature;
      const w = view.maxX - view.minX;
      const h = view.maxY - view.minY;
      const scale = Math.min(bounds.width / w, bounds.height / h);
      // Include the letterboxed area: SVG geometry is visible there too.
      const left = view.minX - (bounds.width / scale - w) / 2;
      const top = view.maxY + (bounds.height / scale - h) / 2;
      // Laid out in screen pixels and scaled down to the drawing's units:
      // the browser rounds a foreignObject's layout to 1/64 of a unit, which
      // at a close zoom (one unit ≈ 90 px) left the bitmap a pixel short.
      node.setAttribute('x', String(left * scale));
      node.setAttribute('y', String(-top * scale));
      node.setAttribute('width', String(bounds.width));
      node.setAttribute('height', String(bounds.height));
      node.setAttribute('transform', `scale(${1 / scale},${-1 / scale})`);
      // The nearest whole pixel: rounding up could leave the bitmap more
      // than a pixel off the board when its width falls on a fraction.
      surface.width = Math.max(1, Math.round(bounds.width * ratio));
      surface.height = Math.max(1, Math.round(bounds.height * ratio));
      const ctx = surface.getContext('2d');
      if (!ctx) return;
      ctx.scale(ratio, ratio);
      const px = (x: number) => (x - left) * scale;
      const py = (y: number) => (top - y) * scale;
      if (dots) {
        ctx.fillStyle = style.fill;
        surface.style.opacity = style.fillOpacity;
        const r = radius * scale;
        // Opaque batches avoid a giant intersecting compound path. Apply
        // opacity once to the canvas, so overlapping dots do not darken.
        for (let i = 0; i < dots.length; i += 256) {
          ctx.beginPath();
          for (const dot of dots.slice(i, i + 256)) {
            const x = px(dot.x);
            const y = py(dot.y);
            if (
              x + r < 0 ||
              y + r < 0 ||
              x - r > bounds.width ||
              y - r > bounds.height
            )
              continue;
            ctx.moveTo(x + r, y);
            ctx.arc(x, y, r, 0, 2 * Math.PI);
          }
          ctx.fill();
        }
      } else if (pieces) {
        ctx.strokeStyle = style.stroke;
        ctx.lineWidth = parseFloat(style.strokeWidth);
        ctx.setLineDash(
          style.strokeDasharray === 'none'
            ? []
            : style.strokeDasharray.split(/[ ,]+/).map(parseFloat),
        );
        surface.style.opacity = style.strokeOpacity;
        for (let i = 0; i < pieces.length; i += 256) {
          ctx.beginPath();
          for (const {
            segment: { a, b },
          } of pieces.slice(i, i + 256)) {
            const ax = px(a.x),
              ay = py(a.y),
              bx = px(b.x),
              by = py(b.y);
            const pad = ctx.lineWidth;
            if (
              Math.max(ax, bx) < -pad ||
              Math.max(ay, by) < -pad ||
              Math.min(ax, bx) > bounds.width + pad ||
              Math.min(ay, by) > bounds.height + pad
            )
              continue;
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
          }
          ctx.stroke();
        }
      }
      performance.measure(dots ? 'along:raster:dots' : 'along:raster:bits', {
        start: started,
      });
    };
    // Coalesce camera/layout changes before rasterizing. In particular, Ink
    // can replace the last construction frame during the same React commit.
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(paint);
    };
    schedule();
    const resize = new ResizeObserver(schedule);
    resize.observe(svg);
    // Theme variables are inherited from the document and app containers.
    const theme = new MutationObserver(schedule);
    for (let el: Element | null = svg; el; el = el.parentElement)
      theme.observe(el, {
        attributes: true,
        attributeFilter: ['class', 'style', 'data-theme'],
      });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      theme.disconnect();
      window.removeEventListener('resize', schedule);
    };
  }, [view, dots, pieces, radius]);
  return (
    <>
      <path
        ref={probe}
        className={dots ? 'pen-dot' : 'ink-piece'}
        visibility="hidden"
      />
      <foreignObject
        ref={host}
        x={view.minX}
        y={-view.maxY}
        width={view.maxX - view.minX}
        height={view.maxY - view.minY}
        transform="scale(1,-1)"
        pointerEvents="none"
        aria-hidden="true"
      >
        <canvas
          ref={canvas}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
      </foreignObject>
    </>
  );
});
