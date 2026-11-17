import type { WallStyle } from './Wall';

/**
 * The style a wall is drawn in (STYLE.3, 17 November 2026). Interlace
 * replaced strapwork: they draw the same bands, and the weave is what the
 * owner always preferred. Only a pattern whose bands cannot weave keeps
 * strapwork, which is then its only banded style. A tutorial, design or
 * link that names the other one opens in the one shown.
 */
export function shownStyle(
  look: WallStyle | undefined,
  woven: boolean | undefined,
): WallStyle {
  if (woven === false)
    return look === 'interlace' ? 'strapwork' : (look ?? 'tiles');
  return look === 'strapwork' ? 'interlace' : (look ?? 'tiles');
}

/** The styles a pattern offers: interlace, or strapwork if it cannot weave. */
export const stylesFor = (woven: boolean | undefined): readonly WallStyle[] =>
  (['tiles', 'strapwork', 'interlace', 'lines', 'jali'] as const).filter(
    (s) => s !== (woven === false ? 'interlace' : 'strapwork'),
  );
