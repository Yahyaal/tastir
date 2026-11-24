/*
 * The window shape of each library card, after the arches its tradition's
 * buildings are known for (owner, 22 November 2026; see
 * docs/REDESIGN-PLAN-2026-11-22.md). Every shape is drawn in a box 100 wide
 * and 125 high, because the cards are 4:5, and keeps straight sides down to
 * the base, so a row of cards still lines up and only the crown changes.
 *
 * - Mudéjar: the round horseshoe arch of Córdoba and Toledo, wider above
 *   its springing than below.
 * - Nasrid: a round arch hung with many small scallops, after the arches of
 *   the Court of the Lions.
 * - Marinid, Moroccan and Maghrebi: the pointed horseshoe arch of the Fès
 *   madrasas.
 * - Algeria and Tunisia: the polylobed arch of Tlemcen and Kairouan, a
 *   round arch of five large lobes.
 * - Mamluk and Tulunid: the keel arch of Cairo, its curves ending in short
 *   straight lines at the top.
 * - Ottoman and Seljuk: the Ottoman pointed arch, two arcs meeting high.
 * - Persian and Safavid: the four-centred arch, tight at the haunches and
 *   flat to a low point.
 * - Timurid: the portal (pishtaq), the same kind of arch set in a tall
 *   rectangular frame with its corners filled.
 * - Mughal: the cusped arch, a pointed arch made of small lobes.
 * - Everything else (pattern books, the first lessons): a plain round arch.
 */

export type ArchKind =
  | 'round'
  | 'horseshoe'
  | 'lambrequin'
  | 'pointed-horseshoe'
  | 'polylobed'
  | 'keel'
  | 'ottoman'
  | 'persian'
  | 'pishtaq'
  | 'cusped';

/** The arch of each place, for a pattern whose tradition has none. */
export const ARCH_OF_PLACE: Readonly<Record<string, ArchKind>> = {
  'Spain and Portugal, other': 'horseshoe',
  'Alhambra and Nasrid Spain': 'lambrequin',
  Morocco: 'pointed-horseshoe',
  'Algeria and Tunisia': 'polylobed',
  'Egypt, Syria and Iraq': 'keel',
  Turkey: 'ottoman',
  Iran: 'persian',
  'Central Asia': 'pishtaq',
  India: 'cusped',
};

/** Arches belong to traditions more than to places, so a Timurid pattern
 * found in Iran takes the Timurid portal. */
export const ARCH_OF_TRADITION: Readonly<Record<string, ArchKind>> = {
  Mudéjar: 'horseshoe',
  Nasrid: 'lambrequin',
  Marinid: 'pointed-horseshoe',
  Moroccan: 'pointed-horseshoe',
  Maghrebi: 'pointed-horseshoe',
  Mamluk: 'keel',
  Tulunid: 'keel',
  Ottoman: 'ottoman',
  Seljuk: 'ottoman',
  Persian: 'persian',
  Safavid: 'persian',
  Timurid: 'pishtaq',
  Mughal: 'cusped',
};

/** A pattern's arch: by its tradition, else by its place, else round. */
export const archOf = (region?: string, tradition?: string): ArchKind =>
  (tradition && ARCH_OF_TRADITION[tradition]) ||
  (region && ARCH_OF_PLACE[region]) ||
  'round';

/** Each arch's name, shown when the card is pointed at. */
export const ARCH_NAMES: Readonly<Record<ArchKind, string>> = {
  round: 'Round arch',
  horseshoe: 'Horseshoe arch, as at Córdoba',
  lambrequin: 'Scalloped arch, as at the Alhambra',
  'pointed-horseshoe': 'Pointed horseshoe arch, as in Fès',
  polylobed: 'Polylobed arch, as at Tlemcen',
  keel: 'Keel arch, as in Cairo',
  ottoman: 'Ottoman pointed arch',
  persian: 'Persian four-centred arch',
  pishtaq: 'Timurid portal, as at Samarkand',
  cusped: 'Mughal cusped arch',
};

type Pt = readonly [number, number];
const f = (v: number) => Math.round(v * 100) / 100;

/** A round arch from (0, 52) over the top to (100, 52). */
const roundAt = (t: number): Pt => {
  const a = Math.PI * (1 + t);
  return [50 + 50 * Math.cos(a), 52 + 50 * Math.sin(a)];
};

/** A pointed arch from (0, 70) up to the apex (50, 0) and down to (100, 70). */
const pointedAt = (t: number): Pt => {
  const half = (u: number): Pt => {
    const a = Math.PI + Math.acos(25 / 75) * u;
    return [75 + 75 * Math.cos(a), 70 + 75 * Math.sin(a)];
  };
  if (t <= 0.5) return half(t * 2);
  const [x, y] = half((1 - t) * 2);
  return [100 - x, y];
};

/**
 * An arch made of lobes: `n` points along the arch `raw`, joined by small
 * arcs that bulge outwards and leave a cusp pointing in between each two.
 * `depth` is a lobe's radius over its chord (a half or more; flatter near 1).
 */
function lobed(raw: (t: number) => Pt, n: number, depth: number): string {
  // The lobes bulge out past the arch they follow, so the arch is first
  // pulled in from the sides and down from the top by that much: the whole
  // window then fits its box and nothing is cut off.
  let bulge = 0;
  for (let i = 1; i <= n; i++) {
    const [x0, y0] = raw((i - 1) / n);
    const [x1, y1] = raw(i / n);
    const c = Math.hypot(x1 - x0, y1 - y0);
    const r = c * depth;
    bulge = Math.max(bulge, r - Math.sqrt(Math.max(0, r * r - (c * c) / 4)));
  }
  const m = bulge + 1.5;
  const at = (t: number): Pt => {
    const [x, y] = raw(t);
    return [m + (x * (100 - 2 * m)) / 100, y + m];
  };
  const [x0, y0] = at(0);
  let d = `M${f(x0)},125V${f(y0)}`;
  let prev = at(0);
  for (let i = 1; i <= n; i++) {
    const p = at(i / n);
    const r = Math.hypot(p[0] - prev[0], p[1] - prev[1]) * depth;
    d += `A${f(r)},${f(r)} 0 0 1 ${f(p[0])},${f(p[1])}`;
    prev = p;
  }
  return `${d}V125Z`;
}

/** The Persian four-centred arch, also drawn inside the Timurid portal. */
export const PERSIAN_PATH =
  'M0,125V35A22,22 0 0 1 11,15.95A100,100 0 0 1 50,3.15A100,100 0 0 1 89,15.95A22,22 0 0 1 100,35V125Z';

/** Each arch as an SVG path in the 100 × 125 box. */
export const ARCH_PATHS: Readonly<Record<ArchKind, string>> = {
  round: 'M0,125V50A50,50 0 0 1 100,50V125Z',
  horseshoe: 'M5,125V66A47,47 0 1 1 95,66V125Z',
  lambrequin: lobed(roundAt, 11, 0.72),
  'pointed-horseshoe':
    'M8,125V76A57.4,57.4 0 0 1 50,2A57.4,57.4 0 0 1 92,76V125Z',
  polylobed: lobed(roundAt, 5, 0.54),
  keel: 'M0,125V62C0,30 22,22 38,12L50,1L62,12C78,22 100,30 100,62V125Z',
  ottoman: 'M0,125V72A75,75 0 0 1 50,1.3A75,75 0 0 1 100,72V125Z',
  persian: PERSIAN_PATH,
  // The portal's frame is the card; its arch is drawn inside (WindowFrame).
  pishtaq: 'M4,0H96Q100,0 100,4V125H0V4Q0,0 4,0Z',
  cusped: lobed(pointedAt, 10, 0.62),
};

/** Where the Timurid portal's arch sits inside its rectangular frame. */
export const PISHTAQ_ARCH = { x: 11, y: 12, sx: 0.78, sy: 0.904 } as const;

/** Every arch, in the order of the route from Córdoba to Agra, the round
 * arch first. */
export const ARCH_KINDS: readonly ArchKind[] = [
  'round',
  'horseshoe',
  'lambrequin',
  'pointed-horseshoe',
  'polylobed',
  'keel',
  'ottoman',
  'persian',
  'pishtaq',
  'cusped',
];
