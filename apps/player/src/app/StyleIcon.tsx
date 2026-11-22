import type { ReactNode } from 'react';
import type { WallStyle } from './Wall';

/*
 * A small picture of each wall style for Make it yours (REDESIGN.4),
 * ported from the demo: one eight-pointed star drawn in the style, in the
 * wall's own colours, shown at once (the real samples of the pattern take a
 * moment to draw on a dense pattern).
 */

/** Points of an eight-pointed star made of two squares. */
function star(cx: number, cy: number, R: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 16; i++) {
    const rad = i % 2 ? r : R;
    const a = (Math.PI * i) / 8 - Math.PI / 2;
    pts.push(
      `${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`,
    );
  }
  return pts.join(' ');
}
const SQ = 'M10,10H34V34H10Z';
const DIAMOND = 'M22,5L39,22L22,39L5,22Z';
/** Short pieces of the diamond laid back over the square, for the weave. */
const OVER = [
  [27, 10, 1, 1],
  [34, 27, -1, 1],
  [17, 34, -1, -1],
  [10, 17, 1, -1],
].map(
  ([x = 0, y = 0, dx = 0, dy = 0]) =>
    `M${x - 3.2 * dx},${y - 3.2 * dy}L${x + 3.2 * dx},${y + 3.2 * dy}`,
);

/**
 * Each wall style drawn on one eight-pointed star, in the wall's own
 * colours, so the choice can be seen before it is made.
 */
export function StyleIcon({
  style,
  colors,
}: {
  style: WallStyle;
  colors: readonly string[];
}) {
  const c = (i: number, d: string) =>
    colors[i % Math.max(colors.length, 1)] ?? d;
  const ground = c(0, '#e9dcc3');
  const a = c(1, '#1f5f8b');
  const b = c(2, '#2e7d5b');
  const dark = '#2a2118';
  const band = '#f1e6cf';
  let body: ReactNode;
  if (style === 'tiles')
    body = (
      <>
        <rect width="44" height="44" fill="#d9d2c4" />
        {[
          [0, 0],
          [22, 0],
          [0, 22],
          [22, 22],
        ].map(([x = 0, y = 0]) => (
          <rect
            key={`${x}${y}`}
            x={x + 1}
            y={y + 1}
            width="20"
            height="20"
            rx="1"
            fill={b}
          />
        ))}
        <polygon
          points={star(22, 22, 17, 9)}
          fill={a}
          stroke="#d9d2c4"
          strokeWidth="2.4"
        />
        <circle
          cx="22"
          cy="22"
          r="4.5"
          fill={ground}
          stroke="#d9d2c4"
          strokeWidth="2"
        />
      </>
    );
  else if (style === 'strapwork')
    body = (
      <>
        <rect width="44" height="44" fill={b} />
        <polygon points={star(22, 22, 17, 9)} fill={a} />
        <polygon
          points={star(22, 22, 17, 9)}
          fill="none"
          stroke={dark}
          strokeWidth="5.5"
          strokeLinejoin="round"
        />
        <polygon
          points={star(22, 22, 17, 9)}
          fill="none"
          stroke={band}
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </>
    );
  else if (style === 'interlace')
    body = (
      <>
        <rect width="44" height="44" fill={b} />
        <path d={SQ} fill={a} />
        {[SQ, DIAMOND].map((p) => (
          <g key={p}>
            <path
              d={p}
              fill="none"
              stroke={dark}
              strokeWidth="5.5"
              strokeLinejoin="round"
            />
            <path
              d={p}
              fill="none"
              stroke={band}
              strokeWidth="3"
              strokeLinejoin="round"
            />
          </g>
        ))}
        {OVER.map((p) => (
          <g key={p}>
            <path d={p} stroke={dark} strokeWidth="5.5" />
            <path d={p} stroke={band} strokeWidth="3" />
          </g>
        ))}
      </>
    );
  else if (style === 'lines')
    body = (
      <>
        <rect width="44" height="44" fill="#f6efe2" />
        <circle cx="18" cy="19" r="13" fill={a} opacity="0.28" />
        <circle cx="27" cy="26" r="12" fill={b} opacity="0.28" />
        <polygon
          points={star(22, 22, 17, 9)}
          fill="none"
          stroke={dark}
          strokeWidth="1.3"
        />
        <rect
          x="5"
          y="5"
          width="34"
          height="34"
          fill="none"
          stroke={dark}
          strokeWidth="1"
          opacity="0.5"
        />
      </>
    );
  else
    body = (
      <>
        <rect width="44" height="44" fill="#c9b48e" />
        <polygon points={star(22, 22, 15, 8)} fill="#2a2118" />
        {[
          [5, 5],
          [39, 5],
          [5, 39],
          [39, 39],
        ].map(([x = 0, y = 0]) => (
          <circle key={`${x}${y}`} cx={x} cy={y} r="4" fill="#2a2118" />
        ))}
        <circle cx="22" cy="22" r="4" fill="#c9b48e" />
      </>
    );
  return (
    <svg className="style-icon" viewBox="0 0 44 44" aria-hidden="true">
      {body}
    </svg>
  );
}
