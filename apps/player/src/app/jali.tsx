import { useId } from 'react';
import { JaliTexturePattern } from './jaliTexture';
import type { Vec } from '@tastir/engine';
import type { JaliAppearance } from '@tastir/schema';
import type { Rect } from './camera';

export const JALI_MATERIALS = [
  { material: 'stone', name: 'Stone' },
  { material: 'wood', name: 'Wood' },
  { material: 'metal', name: 'Metal' },
] as const;
export const JALI_FINISHES = [
  {
    material: 'stone',
    finish: 'limestone',
    name: 'Limestone',
    color: '#e6dcc7',
  },
  { material: 'stone', finish: 'marble', name: 'Marble', color: '#f0eee8' },
  {
    material: 'stone',
    finish: 'sandstone',
    name: 'Sandstone',
    color: '#c9ad7f',
  },
  { material: 'stone', finish: 'slate', name: 'Slate', color: '#66717a' },
  { material: 'wood', finish: 'oak', name: 'Oak', color: '#96603c' },
  { material: 'wood', finish: 'walnut', name: 'Walnut', color: '#593d2b' },
  { material: 'wood', finish: 'cedar', name: 'Cedar', color: '#b46b46' },
  { material: 'metal', finish: 'silver', name: 'Silver', color: '#bfc8d0' },
  { material: 'metal', finish: 'gold', name: 'Gold', color: '#d6ac46' },
  { material: 'metal', finish: 'bronze', name: 'Bronze', color: '#a77b43' },
  { material: 'metal', finish: 'copper', name: 'Copper', color: '#bd7656' },
] as const;
export const DEFAULT_JALI: JaliAppearance = {
  material: 'stone',
  finish: 'limestone',
  framework: '#e6dcc7',
  background: '#708d87',
};

/** Mix opaque hex colors; the schema also keeps export attributes safe. */
function mix(color: string, target: string, amount: number): string {
  const channels = [1, 3, 5].map((at) => {
    const a = parseInt(color.slice(at, at + 2), 16);
    const b = parseInt(target.slice(at, at + 2), 16);
    return Math.round(a + (b - a) * amount)
      .toString(16)
      .padStart(2, '0');
  });
  return '#' + channels.join('');
}

export function sameJali(a = DEFAULT_JALI, b = DEFAULT_JALI): boolean {
  return (
    a.material === b.material &&
    a.finish === b.finish &&
    a.framework.toLowerCase() === b.framework.toLowerCase() &&
    a.background.toLowerCase() === b.background.toLowerCase()
  );
}

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

interface Layer {
  name: string;
  color: string;
  width: number;
  x: number;
  y: number;
  dash?: readonly number[];
}

/** Fixed bundled strokes: no lighting filters, even on dense screens. */
export function jaliLayers(
  appearance: JaliAppearance = DEFAULT_JALI,
): readonly Layer[] {
  const { material, framework: color } = appearance;
  const metal = material === 'metal';
  const layers: Layer[] =
    material === 'stone' && color.toLowerCase() === DEFAULT_JALI.framework
      ? JALI_LAYERS.map((layer) => ({ ...layer }))
      : [
          {
            name: 'shadow',
            color: mix(color, '#000000', 0.76),
            width: 8.4,
            x: 0.9,
            y: 1.3,
          },
          {
            name: 'edge',
            color: mix(color, '#000000', metal ? 0.55 : 0.3),
            width: 7.6,
            x: 0,
            y: 0,
          },
          {
            name: 'light',
            color: mix(color, '#ffffff', metal ? 0.82 : 0.35),
            width: 6,
            x: -0.44,
            y: -0.44,
          },
          { name: material, color, width: 5.4, x: 0.24, y: 0.24 },
        ];
  if (material === 'wood') {
    layers.push(
      {
        name: 'grain-dark',
        color: mix(color, '#000000', 0.22),
        width: 0.24,
        x: -0.8,
        y: -0.8,
        dash: [7, 2, 13, 4],
      },
      {
        name: 'grain-light',
        color: mix(color, '#ffffff', 0.16),
        width: 0.2,
        x: 1,
        y: 1,
        dash: [11, 3, 5, 2],
      },
    );
  } else if (metal) {
    layers.push({
      name: 'gleam',
      color: mix(color, '#ffffff', 0.9),
      width: 0.42,
      x: -1.1,
      y: -1.1,
    });
  }
  return layers;
}

export function jaliLight(background = DEFAULT_JALI.background) {
  return background.toLowerCase() === DEFAULT_JALI.background
    ? JALI_LIGHT
    : [
        { offset: '0%', color: mix(background, '#ffffff', 0.52) },
        { offset: '48%', color: background },
        { offset: '100%', color: mix(background, '#000000', 0.55) },
      ];
}

/** A zero-width framework would lose the screen altogether. */
export const latticeWidth = (grout: number) => Math.max(0.5, grout);

/** One continuous ground, outside the repeated tile, so light has no seams. */
export function JaliGround({
  id,
  view,
  appearance = DEFAULT_JALI,
}: {
  id: string;
  view: Rect;
  appearance?: JaliAppearance;
}) {
  return (
    <g className="jali-ground" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0.8" y2="1">
          {jaliLight(appearance.background).map((s) => (
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
  appearance = DEFAULT_JALI,
  toLocalOffset = (x, y) => ({ x, y }),
}: {
  path: string;
  width: number;
  appearance?: JaliAppearance;
  /** Convert screen-oriented lighting to the SVG pattern tile's frame. */
  toLocalOffset?: (x: number, y: number) => Vec;
}) {
  const textureId = `jali-texture-${useId()}`;
  const x = toLocalOffset(1, 0);
  const y = toLocalOffset(0, 1);
  const textureOffset = toLocalOffset(0.24 * width, 0.24 * width);
  return (
    <g
      className="jali-framework"
      data-material={appearance.material}
      data-finish={appearance.finish}
      fill="none"
      pointerEvents="none"
    >
      <defs>
        <JaliTexturePattern
          id={textureId}
          appearance={appearance}
          width={width}
          transform={`matrix(${x.x} ${x.y} ${y.x} ${y.y} 0 0)`}
        />
      </defs>
      {jaliLayers(appearance).map((layer) => {
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
            strokeDasharray={layer.dash?.map((n) => n * width).join(' ')}
            transform={`translate(${d.x} ${d.y})`}
          />
        );
      })}
      <path
        data-layer="texture"
        d={path}
        stroke={`url(#${textureId})`}
        strokeWidth={5.1 * width}
        strokeLinecap="round"
        strokeLinejoin="round"
        transform={`translate(${textureOffset.x} ${textureOffset.y})`}
      />
    </g>
  );
}
