import type { Entry } from './library';

/**
 * The library's search: one box that looks through everything a tutorial
 * says about itself, in the learner's browser. It understands
 *
 * - other spellings and related names of places (Fez and Fès, Granada and
 *   the Alhambra), from a small dictionary;
 * - a number of points ("16 point", "twelve-fold"), which filters by
 *   symmetry instead of looking for the words;
 * - a word one letter off ("Alhmbra"), for words of five letters or more;
 *
 * and puts matches in the title before matches in the subtitle, and those
 * before matches in the sources.
 */

/** Lower case without accents, so “fes” finds “Fès” and “salon” “Salón”. */
export const plain = (text: string) =>
  text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

const words = (text: string) =>
  plain(text)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

/** Names that find each other: other spellings, and a city and its palace. */
const SAME: readonly (readonly string[])[] = [
  ['fez', 'fes'],
  ['isfahan', 'esfahan', 'ispahan'],
  ['granada', 'alhambra'],
  ['istanbul', 'constantinople'],
  ['cairo', 'qahira'],
  ['marrakesh', 'marrakech'],
  ['meknes', 'meknez'],
  ['tetouan', 'tetuan'],
  ['samarkand', 'samarqand'],
  ['bukhara', 'bokhara'],
  ['mashhad', 'meshed'],
  ['qom', 'qum'],
  ['seville', 'sevilla'],
  ['cordoba', 'cordova'],
  ['damascus', 'dimashq'],
  ['aleppo', 'halab'],
  ['uskudar', 'scutari'],
  ['sultaniyeh', 'soltaniyeh'],
  ['konya', 'iconium'],
  ['zellige', 'zellij', 'zillij'],
  ['khatam', 'khatem'],
];
const alsoOf = new Map(SAME.flatMap((group) => group.map((w) => [w, group])));

const NUMBERS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  eight: 8,
  ten: 10,
  twelve: 12,
  sixteen: 16,
};
/** Words after a number that make it a count of points. */
const POINTS = new Set(['fold', 'point', 'pointed', 'points']);

/** What the learner typed: the words to look for, and a symmetry if they
 * asked for one ("16 point", "sixteen-fold"). */
export function readQuery(query: string): {
  readonly words: readonly string[];
  readonly fold?: number;
} {
  const all = words(query);
  const left: string[] = [];
  let fold: number | undefined;
  for (let i = 0; i < all.length; i++) {
    const w = all[i] as string;
    const n = /^\d+$/.test(w) ? Number(w) : NUMBERS[w];
    // "16fold" and "16-fold" read alike once the hyphen is gone.
    const glued = /^(\d+)(fold|point|pointed)$/.exec(w);
    if (glued) fold = Number(glued[1]);
    else if (n !== undefined && POINTS.has(all[i + 1] ?? '')) {
      fold = n;
      i++;
    }
    // A number spelled out ("fez twelve") asks for points too; digits on
    // their own are words to look for (a plate, a page).
    else if (n !== undefined && n >= 5 && !/^\d/.test(w)) fold = n;
    else left.push(w);
  }
  return { words: left, ...(fold ? { fold } : {}) };
}

/** A tutorial's text, field by field, most important first. */
function fields(entry: Entry): readonly (readonly [number, string])[] {
  const json = (entry.json ?? {}) as Record<string, unknown>;
  const p = entry.preview;
  const text = (v: unknown) => (typeof v === 'string' ? v : '');
  const credits = Array.isArray(json['credits'])
    ? (json['credits'] as { source?: unknown; creator?: unknown }[])
        .map((c) => `${text(c.source)} ${text(c.creator)}`)
        .join(' ')
    : '';
  return [
    [
      4,
      `${text(p?.title ?? json['title'])} ${text(p?.short ?? json['short'])}`,
    ],
    [
      3,
      `${text(p?.subtitle ?? json['subtitle'])} ${entry.id.replace(/-/g, ' ')}`,
    ],
    [
      2,
      `${text(p?.region ?? json['region'])} ${text(p?.style ?? json['style'])}`,
    ],
    [1, p?.words ?? credits],
  ];
}

/** Whether two words are at most one letter apart: one added, dropped or
 * changed. */
function oneOff(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else {
      i++;
      j++;
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

/**
 * How well a tutorial answers the words: the sum, over the words, of the
 * weight of the most important field each is found in; undefined when a
 * word is found nowhere. A word is found as the start of a word or inside
 * one (so "alham" finds Alhambra while it is being typed), by another name
 * from the dictionary, or one letter off.
 */
export function scoreOf(
  entry: Entry,
  query: readonly string[],
): number | undefined {
  if (!query.length) return 0;
  const parts = fields(entry).map(
    ([weight, text]) => [weight, plain(text), words(text)] as const,
  );
  let score = 0;
  for (const q of query) {
    const names = alsoOf.get(q) ?? [q];
    let best = 0;
    for (const [weight, text, list] of parts) {
      if (weight <= best) continue;
      const found =
        names.some((n) => text.includes(n)) ||
        (q.length >= 5 && list.some((w) => w.length >= 4 && oneOff(q, w)));
      if (found) best = weight;
    }
    if (!best) return undefined;
    score += best;
  }
  return score;
}
