/*
 * The places of the library, west to east, as the route from Córdoba to Agra
 * shows them (REDESIGN.2, docs/REDESIGN-PLAN-2026-11-22.md). Each key is a
 * tutorial's `region`. Pure data and arithmetic, so the band script
 * (build/routeBand.tsx) and the tests use it without a browser.
 */

export interface Place {
  /** The tutorials' `region`. */
  readonly key: string;
  /** The name on the route. */
  readonly short: string;
  readonly arabic: string;
  /** One line about the place, shown when it is pointed at. */
  readonly about: string;
}

/** The places on the route, west to east. */
export const ROUTE_PLACES: readonly Place[] = [
  {
    key: 'Spain and Portugal, other',
    short: 'Spain & Portugal',
    arabic: 'الأندلس',
    about:
      'Mudéjar work in Seville, Toledo and Córdoba, and tiles from across Iberia.',
  },
  {
    key: 'Alhambra and Nasrid Spain',
    short: 'Alhambra',
    arabic: 'الحمراء',
    about:
      'The Nasrid palaces of Granada: tiled dados, plaster frets and painted ceilings.',
  },
  {
    key: 'Morocco',
    short: 'Morocco',
    arabic: 'المغرب',
    about:
      'Zellige from the Marinid madrasas of Fès to the palaces of Marrakesh.',
  },
  {
    key: 'Algeria and Tunisia',
    short: 'Algeria & Tunisia',
    arabic: 'تونس',
    about: 'Palaces and mosques of Tunis, Kairouan and Tlemcen.',
  },
  {
    key: 'Egypt, Syria and Iraq',
    short: 'Egypt, Syria & Iraq',
    arabic: 'القاهرة',
    about: 'Mamluk minbars, doors and domes of Cairo and Damascus.',
  },
  {
    key: 'Turkey',
    short: 'Turkey',
    arabic: 'الأناضول',
    about: 'Seljuk portals of Konya and Ottoman mosques of Istanbul.',
  },
  {
    key: 'Iran',
    short: 'Iran',
    arabic: 'إيران',
    about: 'Brick and tile from Isfahan, Maragha and Nishapur.',
  },
  {
    key: 'Central Asia',
    short: 'Central Asia',
    arabic: 'سمرقند',
    about: 'Timurid tilework of Samarkand, Bukhara and Khojent.',
  },
  {
    key: 'India',
    short: 'India',
    arabic: 'الهند',
    about: 'Mughal inlay and jali screens of Agra and Fatehpur Sikri.',
  },
];

/** Designs from pattern books and drawings: not a place on the map. */
export const BOOKS: Place = {
  key: 'Books and other',
  short: 'Pattern books',
  arabic: 'كتب',
  about:
    'Constructions from pattern books and drawings (Bourgoin, Sutton, Abas and Salman), and classic designs found in many places.',
};

/** Every place a pattern can come from, the route's first. */
export const PLACES: readonly Place[] = [...ROUTE_PLACES, BOOKS];

/**
 * Where each stop sits: x from 0 (west) to 1 (east), y from 0 (top) to 1.
 * The stops go high and low in turn, so the route is a wave and each
 * name has room above a high stop or below a low one.
 */
export const STOPS: readonly (readonly [number, number])[] = [
  [0.055, 0.7],
  [0.165, 0.42],
  [0.275, 0.7],
  [0.385, 0.42],
  [0.5, 0.7],
  [0.615, 0.42],
  [0.725, 0.7],
  [0.835, 0.42],
  [0.945, 0.7],
];

/** A stop is high when it sits above the middle; its name goes above it. */
export const isHigh = (i: number) => (STOPS[i]?.[1] ?? 1) < 0.5;

/**
 * The stretch of the route each place owns, from half way to its west
 * neighbour to half way to its east one; the ends reach the edges.
 */
export function stretches(): readonly { from: number; to: number }[] {
  return STOPS.map(([x], i) => ({
    from: i ? (x + (STOPS[i - 1]?.[0] ?? 0)) / 2 : 0,
    to: i < STOPS.length - 1 ? (x + (STOPS[i + 1]?.[0] ?? 1)) / 2 : 1,
  }));
}

/** The wave through the stops, as an SVG path in a `w` × `h` box. */
export function wavePath(w: number, h: number): string {
  const pts = STOPS.map(([x, y]) => [x * w, y * h] as const);
  const first = pts[0]?.[1] ?? h / 2;
  return [
    `M0,${first}`,
    ...pts.map(([x1, y1], i) => {
      const [x0, y0] = i ? (pts[i - 1] ?? [0, y1]) : [0, y1];
      const mx = (x0 + x1) / 2;
      return `C${mx},${y0} ${mx},${y1} ${x1},${y1}`;
    }),
    `L${w},${pts[pts.length - 1]?.[1] ?? h / 2}`,
  ].join(' ');
}

/**
 * The patterns drawn in pencil behind each place, the first that exists
 * taken; and how much closer to show the ones too fine to read.
 */
export const BAND: Readonly<Record<string, readonly string[]>> = {
  'Spain and Portugal, other': ['seville-tile-stars', 'toledo-tile-stars'],
  'Alhambra and Nasrid Spain': ['alhambra-comares-dado'],
  Morocco: ['bou-inania-rosette', 'fes-attarine-rosette'],
  'Algeria and Tunisia': ['sidi-said-window'],
  'Egypt, Syria and Iraq': ['qalawun-twelve-star-knots', 'cairo-embassy-stars'],
  Turkey: ['topkapi-door-stars', 'sircali-stars'],
  Iran: ['isfahan-imamzadeh-ismail-stars', 'isfahan-seyyed-stars'],
  'Central Asia': ['samarkand-star-knots', 'tash-khauli-crosses'],
  India: ['agra-fort-stars', 'fatehpur-sikri-stars'],
};
export const BAND_ZOOM: Readonly<Record<string, number>> = { Turkey: 2.2 };

/** The address of a place (`#/places/<place>`), or of all patterns. */
export const placeHref = (key?: string) =>
  key ? `#/places/${encodeURIComponent(key)}` : '#/';

/** The place an address names (`places/<place>`, without `#/`), if any. */
export function placeInRoute(route: string): string | undefined {
  const m = /^places\/(.+)$/.exec(route);
  if (!m?.[1]) return undefined;
  let key = m[1];
  try {
    key = decodeURIComponent(key);
  } catch {
    return undefined;
  }
  return PLACES.find((p) => p.key === key)?.key;
}
