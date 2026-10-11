import type { Vec } from '@tastir/engine';
import type { Rect } from './camera';

/** Shared by the live wall, saved-design preview and standalone SVG. */
export const JALI_LIGHT = [
  { offset: '0%', color: '#c9d8d4' },
  { offset: '48%', color: '#708d87' },
  { offset: '100%', color: '#263f3c' },
] as const;

// Offset the lit edge and the shadow rather than fluting the centre of
// every band. Widths and offsets are multiples of the normal grout width,
// in SVG coordinates (y down), lit from the upper left.
export const JALI_LAYERS = [
  { name: 'shadow', color: '#23332e', width: 8.4, x: 0.9, y: 1.3 },
  { name: 'edge', color: '#a9987e', width: 7.6, x: 0, y: 0 },
  { name: 'light', color: '#fff8e9', width: 6, x: -0.44, y: -0.44 },
  { name: 'stone', color: '#e6dcc7', width: 5.4, x: 0.24, y: 0.24 },
] as const;

/** A zero-width framework would lose the screen altogether. */
export const latticeWidth = (grout: number) => Math.max(0.5, grout);

/** One continuous ground, outside the repeated tile, so light has no seams. */
export function JaliGround({ id, view }: { id: string; view: Rect }) {
  return (
    <g className="jali-ground" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0.8" y2="1">
          {JALI_LIGHT.map((s) => (
            <stop key={s.offset} offset={s.offset} stopColor={s.color} />
          ))}
        </linearGradient>
      </defs>
      <rect
        x={view.minX}
        y={-view.maxY}
        width={view.maxX - view.minX}
        height={view.maxY - view.minY}
        fill={`url(#${id})`}
      />
    </g>
  );
}

/** One bundled path per layer keeps dense screens inexpensive to paint. */
export function JaliFramework({
  path,
  width,
  toLocalOffset = (x, y) => ({ x, y }),
}: {
  path: string;
  width: number;
  /** Convert screen-oriented lighting to the SVG pattern tile's frame. */
  toLocalOffset?: (x: number, y: number) => Vec;
}) {
  return (
    <g className="jali-framework" fill="none" pointerEvents="none">
      {JALI_LAYERS.map((layer) => {
        const d = toLocalOffset(layer.x * width, layer.y * width);
        return (
          <path
            key={layer.name}
            data-layer={layer.name}
            d={path}
            stroke={layer.color}
            strokeWidth={layer.width * width}
            strokeLinecap="round"
            strokeLinejoin="round"
            transform={`translate(${d.x} ${d.y})`}
          />
        );
      })}
    </g>
  );
}
