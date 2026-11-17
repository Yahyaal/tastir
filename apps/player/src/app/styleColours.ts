import {
  colorReducer,
  isPaper,
  PAPER_PALETTES,
  type ColorAction,
  type Coloring,
  type History,
} from './coloring';
import type { WallStyle } from './Wall';

/**
 * Each wall style keeps its own colours (STYLE.5, owner's choice of 17
 * November 2026).
 *
 * The glaze styles (tiles, strapwork, interlace, and the screen, which
 * shows no colours) share colours until one is changed: a style with no
 * colours of its own shows those of the glaze style changed last, or the
 * design's colouring. Changing colours in a style gives it its own, with
 * its own undo, and the others stay as they were. Watercolour uses the
 * paper palettes: until it is coloured it shows the glaze colouring's way
 * of colouring in the first paper palette, since tile colours look dull on
 * paper.
 */
export interface StyleColours {
  /** The colouring a glaze style shows when none has been changed. */
  readonly base: History;
  /** The styles coloured on their own, with their histories. */
  readonly own: Partial<Record<WallStyle, History>>;
  /** The glaze style changed last, whose colours the others show. */
  readonly last?: WallStyle;
}

const fresh = (now: Coloring): History => ({ past: [], now, future: [] });

/** Whether a style is coloured with the paper palettes. */
export const paperStyle = (style: WallStyle) => style === 'lines';

/** The colours a style shows now, with its undo history. */
export function historyOf(state: StyleColours, style: WallStyle): History {
  const own = state.own[style];
  if (own) return own;
  const glaze = (state.last && state.own[state.last]) || state.base;
  if (!paperStyle(style)) return glaze;
  // Watercolour, not yet coloured: the same way of colouring, in paper.
  const now = glaze.now;
  if (isPaper(now.palette)) return fresh(now);
  const { finish: _finish, ...rest } = now;
  return fresh({ ...rest, palette: PAPER_PALETTES[0] ?? 'Rose', chosen: {} });
}

/** A change of colours in one style: that style keeps its own from now. */
export function styleColoursReducer(
  state: StyleColours,
  { style, action }: { style: WallStyle; action: ColorAction },
): StyleColours {
  const before = historyOf(state, style);
  const after = colorReducer(before, action);
  if (after === before) return state;
  return {
    ...state,
    own: { ...state.own, [style]: after },
    ...(paperStyle(style) ? {} : { last: style }),
  };
}

/** The state a design opens with: its colouring, and each style's own. */
export function styleColoursOf(
  coloring: Coloring,
  colorings: Partial<Record<WallStyle, Coloring>> = {},
): StyleColours {
  const own: Partial<Record<WallStyle, History>> = {};
  for (const [style, c] of Object.entries(colorings))
    if (c) own[style as WallStyle] = fresh(c);
  return { base: fresh(coloring), own };
}

/**
 * What a design stores: the colouring the glaze styles show, and the
 * colourings of the styles coloured on their own that differ from it.
 */
export function storedColours(state: StyleColours): {
  coloring: Coloring;
  colorings?: Partial<Record<WallStyle, Coloring>>;
} {
  const coloring = historyOf(state, 'tiles').now;
  const colorings: Partial<Record<WallStyle, Coloring>> = {};
  for (const [style, h] of Object.entries(state.own))
    if (h && h.now !== coloring) colorings[style as WallStyle] = h.now;
  return Object.keys(colorings).length ? { coloring, colorings } : { coloring };
}
