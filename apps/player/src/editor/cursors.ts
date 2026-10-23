// The editor's mouse pointer for each tool: a crosshair whose centre is the
// exact point a click lands on, with the tool's own sign in a small badge
// beside it, so the learner sees what the next click will do.
import type { ToolId } from './tools';

// A pointer is an image, so it cannot follow the theme's colours: dark ink
// with a light outline reads on both the light and the dark board.
const INK = '#1C2733';
const HALO = '#FFFAF0';
// The sign is white on the badge; where a tool draws a line or circle in
// relation to one already there, the new one is gold, like the orange of
// the line being drawn on the board.
const GIVEN = '#FFFFFF';
const NEW = '#FFD15C';

// The badge's colour says the kind of tool before the sign is read: the
// theme's lapis for the compass tools, zellige green for the ruler tools,
// terracotta for the shapes and brass for the point.
const COMPASS = '#1F4E8C';
const RULER = '#1E6B52';
const SHAPE = '#A3452A';
const POINT = '#9A6410';

/** Each tool's badge colour and sign, drawn in the badge (17 px at 14.5). */
const SIGNS: Record<ToolId, readonly [string, string]> = {
  point: [POINT, `<circle cx="23" cy="23" r="2.6" fill="${GIVEN}"/>`],
  compass: [
    COMPASS,
    `<circle cx="23" cy="23" r="5"/><circle cx="23" cy="23" r="1" fill="${GIVEN}"/>`,
  ],
  same: [
    COMPASS,
    `<circle cx="20.5" cy="23" r="3.4"/><circle cx="25.5" cy="23" r="3.4" stroke="${NEW}"/>`,
  ],
  span: [COMPASS, `<path d="M18 23h10M20 21l-2 2 2 2M26 21l2 2-2 2"/>`],
  touch: [
    COMPASS,
    `<path d="M17 26.5h12"/><circle cx="23" cy="22" r="4" stroke="${NEW}"/>`,
  ],
  ruler: [RULER, `<path d="M18 28L28 18"/>`],
  square: [RULER, `<path d="M18 28h10"/><path d="M23 28V18" stroke="${NEW}"/>`],
  parallel: [
    RULER,
    `<path d="M20.5 18v10"/><path d="M25.5 18v10" stroke="${NEW}"/>`,
  ],
  halve: [
    RULER,
    `<path d="M28 28H18l8-9"/><path d="M18 28l10-4.5" stroke="${NEW}"/>`,
  ],
  polygon: [SHAPE, `<path d="M23 18l4.8 3.5-1.8 5.6h-6l-1.8-5.6z"/>`],
  tile: [SHAPE, `<rect x="18.5" y="18.5" width="9" height="9"/>`],
  block: [
    SHAPE,
    `<rect x="18" y="20" width="7" height="7"/><rect x="21" y="17" width="7" height="7" stroke="${NEW}"/>`,
  ],
};

// The crosshair is centred on 8,8, with a gap so the point aimed at shows.
const CROSS = 'M8 1v5M8 10v5M1 8h5M10 8h5';

/** The CSS cursor for a tool: its pointer, or the plain crosshair. */
export function toolCursor(id: ToolId): string {
  const [badge, sign] = SIGNS[id];
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">` +
    `<path d="${CROSS}" stroke="${HALO}" stroke-width="4" stroke-linecap="round"/>` +
    `<path d="${CROSS}" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>` +
    `<circle cx="8" cy="8" r="1" fill="${badge}" stroke="${HALO}" stroke-width="0.6"/>` +
    `<rect x="14.5" y="14.5" width="17" height="17" rx="4.5" fill="${badge}" stroke="${HALO}" stroke-width="1.5"/>` +
    `<g fill="none" stroke="${GIVEN}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${sign}</g>` +
    `</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 8 8, crosshair`;
}
