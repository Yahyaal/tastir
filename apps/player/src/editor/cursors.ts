// The editor's mouse pointer for each tool: a crosshair whose centre is the
// exact point a click lands on, with the tool's own sign in a small badge
// beside it, so the learner sees what the next click will do.
import type { ToolId } from './tools';

// A pointer is an image, so it cannot follow the theme's colours: dark ink
// with a light outline reads on both the light and the dark board.
const INK = '#1C2733';
const HALO = '#FFFAF0';

/** Each tool's sign, drawn in the badge (a 16 px square at 15,15). */
const SIGNS: Record<ToolId, string> = {
  point: `<circle cx="23" cy="23" r="2.4" fill="${INK}"/>`,
  compass: `<circle cx="23" cy="23" r="5"/>`,
  same: `<circle cx="23" cy="23" r="5.5"/><circle cx="23" cy="23" r="2.5"/>`,
  span: `<path d="M18 23h10M20 21l-2 2 2 2M26 21l2 2-2 2"/>`,
  touch: `<circle cx="23" cy="21.5" r="4"/><path d="M17 25.5h12"/>`,
  ruler: `<path d="M18 28L28 18"/>`,
  square: `<path d="M18 28h10M23 28V18"/>`,
  parallel: `<path d="M21 18v10M25 18v10"/>`,
  halve: `<path d="M28 28H18l8-9"/><path d="M18 28l10-4.5" stroke-dasharray="2 1.5"/>`,
  polygon: `<path d="M23 18l4.8 3.5-1.8 5.6h-6l-1.8-5.6z"/>`,
  tile: `<rect x="18.5" y="18.5" width="9" height="9"/>`,
  block: `<rect x="18" y="20" width="7" height="7"/><rect x="21" y="17" width="7" height="7"/>`,
};

// The crosshair is centred on 8,8, with a gap so the point aimed at shows.
const CROSS = 'M8 1v5M8 10v5M1 8h5M10 8h5';

/** The CSS cursor for a tool: its pointer, or the plain crosshair. */
export function toolCursor(id: ToolId): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">` +
    `<path d="${CROSS}" stroke="${HALO}" stroke-width="3.5" stroke-linecap="round"/>` +
    `<path d="${CROSS}" stroke="${INK}" stroke-width="1.5" stroke-linecap="round"/>` +
    `<rect x="15" y="15" width="16" height="16" rx="4" fill="${HALO}" stroke="${INK}"/>` +
    `<g fill="none" stroke="${INK}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${SIGNS[id]}</g>` +
    `</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 8 8, crosshair`;
}
