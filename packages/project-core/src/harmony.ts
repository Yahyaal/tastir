/**
 * Colour harmony for the palette engine (docs/PALETTE-ENGINE.md): colours
 * measured in OKLab, a space where equal distances look equally different
 * (Ottosson, 2020), and a search that colours a wall's parts so they keep
 * the tutorial's wish unless a rule of good colouring breaks.
 *
 * Pure: no DOM and no model, so it runs anywhere and is tested alone.
 */

/** A colour in OKLab: lightness 0–1, and the two opponent axes. */
export interface Lab {
  readonly L: number;
  readonly a: number;
  readonly b: number;
}

const labCache = new Map<string, Lab>();

/** A hex colour (#rrggbb) in OKLab. */
export function oklab(hex: string): Lab {
  const key = hex.toLowerCase();
  const hit = labCache.get(key);
  if (hit) return hit;
  const n = parseInt(key.replace('#', '').slice(0, 6), 16) || 0;
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const r = lin((n >> 16) & 255);
  const g = lin((n >> 8) & 255);
  const bl = lin(n & 255);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * bl);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * bl);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * bl);
  const lab = {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
  labCache.set(key, lab);
  return lab;
}

/** Convert OKLab back to #rrggbb sRGB, scaling chroma into gamut while preserving hue and lightness. */
export function fromOklab(lab: Lab): string {
  const L = Math.max(0, Math.min(1, lab.L));
  const linear = (a: number, b: number): [number, number, number] => {
    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.291485548 * b;
    const l = l_ * l_ * l_;
    const m = m_ * m_ * m_;
    const s = s_ * s_ * s_;
    return [
      +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
    ];
  };
  const inGamut = (rgb: [number, number, number]) =>
    rgb[0] >= -1e-6 &&
    rgb[0] <= 1 + 1e-6 &&
    rgb[1] >= -1e-6 &&
    rgb[1] <= 1 + 1e-6 &&
    rgb[2] >= -1e-6 &&
    rgb[2] <= 1 + 1e-6;
  let rgb = linear(lab.a, lab.b);
  if (!inGamut(rgb)) {
    let lo = 0;
    let hi = 1;
    for (let k = 0; k < 14; k++) {
      const mid = (lo + hi) / 2;
      if (inGamut(linear(lab.a * mid, lab.b * mid))) lo = mid;
      else hi = mid;
    }
    rgb = linear(lab.a * lo, lab.b * lo);
  }
  const srgb = (v: number) => {
    const c = Math.max(0, Math.min(1, v));
    const enc = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
    return Math.round(Math.max(0, Math.min(1, enc)) * 255)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${srgb(rgb[0])}${srgb(rgb[1])}${srgb(rgb[2])}`;
}

/** How different two colours look: OKLab distance (0 the same, ~1 black to
 * white). */
export function deltaE(x: string, y: string): number {
  const p = oklab(x);
  const q = oklab(y);
  return Math.hypot(p.L - q.L, p.a - q.a, p.b - q.b);
}

/** Chroma (colourfulness) and hue angle in degrees. */
export function lch(hex: string): { L: number; C: number; h: number } {
  const { L, a, b } = oklab(hex);
  const h = (Math.atan2(b, a) * 180) / Math.PI;
  return { L, C: Math.hypot(a, b), h: h < 0 ? h + 360 : h };
}

/** Hue distance in degrees, 0–180. */
const hueGap = (x: number, y: number) => {
  const d = Math.abs(x - y) % 360;
  return d > 180 ? 360 - d : d;
};

/**
 * The harmonic templates of Matsuda, as Cohen-Or et al. used them for
 * colour harmonisation (2006): sectors of the hue wheel, as [centre offset,
 * width] in degrees. A colour scheme whose hues all fall in the sectors of
 * one template, turned any way, is held to be harmonious.
 */
const TEMPLATES: readonly (readonly (readonly [number, number])[])[] = [
  [[0, 18]], // i: one hue
  [[0, 94]], // V: neighbouring hues
  [
    [0, 18],
    [90, 79.2],
  ], // L
  [
    [0, 18],
    [270, 79.2],
  ], // L mirrored: L is not symmetric, so turning it never gives its mirror
  [
    [0, 18],
    [180, 18],
  ], // I: complements
  [[0, 180]], // T: half the wheel
  [
    [0, 93.6],
    [180, 18],
  ], // Y
  [
    [0, 93.6],
    [180, 93.6],
  ], // X
];

/**
 * How far a scheme falls outside its best harmonic template: each colour's
 * hue distance from the nearest sector, weighted by its chroma (a near-grey
 * has no hue to clash) and by its share of the wall. 0 is in harmony.
 */
export function disharmony(
  used: ReadonlyMap<string, number>,
  step = 10,
): number {
  const hues = [...used].flatMap(([c, w]) => {
    const { C, h } = lch(c);
    return C > 0.03 ? [{ h, w: w * Math.min(1, C / 0.12) }] : [];
  });
  if (hues.length < 2) return 0;
  let best = Infinity;
  for (const t of TEMPLATES)
    for (let turn = 0; turn < 360; turn += step) {
      let sum = 0;
      for (const { h, w } of hues) {
        let off = Infinity;
        for (const [centre, width] of t) {
          const gap = hueGap(h, centre + turn) - width / 2;
          off = Math.min(off, Math.max(0, gap));
        }
        sum += (off / 180) * w;
      }
      if (sum < best) best = sum;
    }
  return best;
}

/** A wall's colouring as a problem: its parts (shapes, rings or placed
 * pieces), what each wants, and which touch. */
export interface ColourProblem {
  /** Each part's wished colour (the tutorial's). */
  readonly wish: readonly string[];
  /** Each part's share of the wall's area. */
  readonly share: readonly number[];
  /** Touching parts, and how much they touch (a weight). */
  readonly pairs: readonly (readonly [number, number, number])[];
  /** Parts the learner coloured, kept as they are. */
  readonly locked: readonly boolean[];
  /** The palette's own colours, first choice. */
  readonly palette: readonly string[];
  /** Its glaze's other colours, second choice. */
  readonly extras?: readonly string[];
  /** A lighter or darker firing of a palette colour, last choice. */
  readonly shades?: readonly string[];
  /** Colours no part may take (the bands' own, under bands). */
  readonly hides?: (colour: string) => boolean;
}

/** The weights of the rules: a broken rule costs far more than a moved
 * part, and taste (contrast, proportion, harmony) settles the rest. */
export const COST = {
  /** Touching parts in one colour, or two that read as one. */
  same: 30000,
  near: 20000,
  /** A part in a colour that hides the bands. */
  hidden: 30000,
  /** Touching parts too close in lightness: shapes read by value first
   * (Itten's light–dark contrast; WCAG asks the same of text). */
  value: 40,
  /** Touching strong complements of one lightness vibrate. */
  vibrate: 60,
  /** One colour over 60% of the wall. */
  flood: 600,
  /** The strongest colour should be the accent, a small share (60–30–10). */
  accent: 120,
  /** Hues outside one harmonic template. */
  harmony: 150,
  /** Moving a part from its wish, more for a large part: dear enough that
   * taste alone never repaints a wall, so only a broken rule moves a part
   * and taste then chooses among the colours that mend it. */
  moved: 160,
  movedArea: 120,
  /** A moved part keeps its role: its lightness (a light ground stays
   * light) and no louder than it was (Reviewers: dark or saturated grounds
   * broke the 60–30–10 balance). */
  role: 3000,
  loud: 3000,
  /** Black or near-black given to a part that was not dark, by its area. */
  dark: 1200,
  /** Using a glaze colour, or a shade, past the palette. */
  extra: 3,
  shade: 9,
} as const;

/** Colours closer than this read as one where they touch. */
export const NEAR_E = 0.1;

/** Whether two touching colours read as one: close in OKLab, or two darks
 * (black by navy, dark teal by teal) that differ by little more. */
export function merges(x: string, y: string): boolean {
  const d = deltaE(x, y);
  if (d < NEAR_E) return true;
  const p = lch(x);
  const q = lch(y);
  // Two darks (black by navy, dark teal by teal).
  if (d < 0.2 && p.L < 0.42 && q.L < 0.42) return true;
  // Two firings of one hue, close in lightness too (ochre by yellow).
  // A wider test (any one lightness, any one hue) moved pieces of walls the
  // reviewers liked, so it stays a matter of taste (the value cost).
  return d < 0.16 && p.C > 0.04 && q.C > 0.04 && hueGap(p.h, q.h) < 18;
}
/** Lightness gap neighbours should keep. */
const VALUE_GAP = 0.1;

/**
 * Colours for each part: the wish kept where the rules allow, else the
 * cheapest change, by a deterministic search that lets the smallest parts
 * give way first, so the large ones that set the wall's look keep theirs.
 */
export function solveColours(problem: ColourProblem): string[] {
  const { wish, share, pairs, locked } = problem;
  const n = wish.length;
  if (!n) return [];
  const lower = (c: string) => c.toLowerCase();
  const palette = [...new Set(problem.palette.map(lower))];
  const extras = [...new Set((problem.extras ?? []).map(lower))].filter(
    (c) => !palette.includes(c),
  );
  const shades = [...new Set((problem.shades ?? []).map(lower))].filter(
    (c) => !palette.includes(c) && !extras.includes(c),
  );
  const hides = problem.hides ?? (() => false);
  const at = wish.map(lower);
  const want = at.slice();
  const candidates = [...palette, ...extras, ...shades];
  const near: number[][] = Array.from({ length: n }, () => []);
  const weight: number[][] = Array.from({ length: n }, () => []);
  for (const [x, y, w] of pairs) {
    if (x === y) continue;
    near[x]?.push(y);
    weight[x]?.push(w);
    near[y]?.push(x);
    weight[y]?.push(w);
  }
  const pairCost = (x: string, y: string, w: number) => {
    if (x === y) return COST.same * w;
    if (merges(x, y)) return COST.near * w;
    const p = lch(x);
    const q = lch(y);
    let sum = 0;
    const gap = Math.abs(p.L - q.L);
    if (gap < VALUE_GAP) sum += COST.value * w * (1 - gap / VALUE_GAP);
    if (p.C > 0.1 && q.C > 0.1 && hueGap(p.h, q.h) > 150 && gap < 0.08)
      sum += COST.vibrate * w;
    return sum;
  };
  const ownCost = (i: number, c: string) => {
    if (locked[i]) return 0;
    let sum = hides(c) ? COST.hidden : 0;
    const w = want[i] as string;
    if (c !== w) {
      const s = share[i] ?? 0;
      const p = lch(c);
      const q = lch(w);
      sum +=
        COST.moved +
        COST.movedArea * s * 10 +
        COST.role * s * Math.abs(p.L - q.L) +
        COST.loud * s * Math.max(0, p.C - q.C) +
        (p.L < 0.35 && q.L >= 0.35 ? COST.dark * s : 0);
    }
    return (
      sum +
      (extras.includes(c) ? COST.extra : shades.includes(c) ? COST.shade : 0)
    );
  };
  const localCost = (i: number, c: string) => {
    let sum = ownCost(i, c);
    const list = near[i] ?? [];
    const ws = weight[i] ?? [];
    for (let k = 0; k < list.length; k++)
      sum += pairCost(c, at[list[k] as number] as string, ws[k] ?? 1);
    return sum;
  };
  // The whole wall's terms: flood, accent and harmony, from the share each
  // colour covers.
  const harmonyMemo = new Map<string, number>();
  const used = new Map<string, number>();
  at.forEach((c, i) => used.set(c, (used.get(c) ?? 0) + (share[i] ?? 0)));
  const wallCost = () => {
    let sum = 0;
    let strongest = '';
    let chroma = -1;
    for (const [c, s] of used) {
      if (s <= 1e-9) continue;
      if (s > 0.6) sum += COST.flood * (s - 0.6);
      const C = lch(c).C;
      if (
        C > chroma + 1e-12 ||
        (Math.abs(C - chroma) <= 1e-12 && (!strongest || c < strongest))
      ) {
        chroma = C;
        strongest = c;
      }
    }
    const accent = used.get(strongest) ?? 0;
    if (chroma > 0.12 && accent > 0.35) sum += COST.accent * (accent - 0.35);
    // The scheme's harmony, kept by its colours and shares to the
    // nearest 2%: the search weighs the same schemes again and again.
    const live = [...used].filter(([, s]) => s > 1e-9);
    const sig = live
      .map(([c, s]) => `${c}:${Math.round(s * 50)}`)
      .sort()
      .join(' ');
    let off = harmonyMemo.get(sig);
    if (off === undefined) {
      off = disharmony(new Map(live), 15);
      harmonyMemo.set(sig, off);
    }
    return sum + COST.harmony * off;
  };
  const move = (i: number, from: string, to: string) => {
    const s = share[i] ?? 0;
    used.set(from, (used.get(from) ?? 0) - s);
    used.set(to, (used.get(to) ?? 0) + s);
    at[i] = to;
  };

  const order = [...wish.keys()].sort(
    (x, y) => (share[x] ?? 0) - (share[y] ?? 0) || x - y,
  );
  // The wall's terms are global, so with many parts they are only weighed
  // for parts large enough to change them.
  const wallMatters = (i: number) => (share[i] ?? 0) > 0.01 || n <= 40;
  for (let pass = 0; pass < 10; pass++) {
    let changed = false;
    for (const i of order) {
      if (locked[i]) continue;
      const was = at[i] as string;
      const weigh = wallMatters(i);
      const base = localCost(i, was) + (weigh ? wallCost() : 0);
      let best = base;
      let pick = was;
      for (const c of candidates) {
        if (c === was) continue;
        let v = localCost(i, c);
        if (v >= best) continue;
        if (weigh) {
          move(i, was, c);
          v += wallCost();
          move(i, c, was);
        }
        if (v < best - 1e-9) {
          best = v;
          pick = c;
        }
      }
      if (pick !== was) {
        move(i, was, pick);
        changed = true;
      }
    }
    if (!changed) break;
  }
  // Keep each colour as the palette wrote it.
  const written = new Map(
    [
      ...problem.palette,
      ...(problem.extras ?? []),
      ...(problem.shades ?? []),
      ...wish,
    ].map((c) => [lower(c), c]),
  );
  return at.map((c, i) =>
    locked[i] ? (wish[i] as string) : (written.get(c) ?? c),
  );
}
