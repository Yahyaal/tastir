import type { Pattern } from '@tastir/engine';
import type { Tutorial } from '@tastir/schema';
import type { Slot } from '../app/coloring';
import { ringsOf, type RingRole } from '../app/rings';

/**
 * The colours proposed for every tutorial (owner's pick on #/plan/colors,
 * columns C and D): the palette of its tradition, and each piece coloured
 * by its role. Shown side by side with today's on the colours page, then
 * written into the tutorials once the owner agrees. Pure, so a script can
 * run it in Node.
 */

/** The palette of each tradition named in a tutorial's `style`. */
const TRADITION: Readonly<Record<string, string>> = {
  Moroccan: 'Marinid zellige',
  'Marinid zellige (Fès)': 'Marinid zellige',
  Nasrid: 'Alhambra',
  Timurid: 'Timurid tile',
  'Timurid / Persian': 'Timurid tile',
  Safavid: 'Timurid tile',
  Seljuk: 'Timurid tile',
  Mughal: 'Timurid tile',
  Mamluk: 'Mamluk wood',
  Tulunid: 'Mamluk wood',
};

export const traditionPalette = (style: string | undefined) =>
  TRADITION[style ?? ''] ?? 'Marinid zellige';

/**
 * The tutorials coloured by hand from a photo of the real wall. They keep
 * their slots: the Alhambra palette already gives each slot the role the
 * tradition palettes do, so only the palette's name changes.
 */
const fromPhoto = (t: Tutorial) => t.pattern.palette === 'Alhambra';

/**
 * Hand corrections: tutorials whose own slots read better in the new
 * palette than the rule's. The rule takes the large ground of Kurt's
 * wheels for the star (it has the most corners) and turns the Bou Inania
 * rosette honey all over; their own slots give a black, green and honey
 * wheel on a light ground.
 */
const OWN_SLOTS: ReadonlySet<string> = new Set([
  'bou-inania-rosette',
  'kurt-eight-fold-zellige',
  'kurt-eight-fold-zellige-filled',
  'kurt-eight-fold-zellige-shifted',
]);

/**
 * Colour by role: the star (the type with most corners) takes the accent
 * `b`, the type covering most of the wall is the ground (light; dark `a`
 * under strapwork, whose bands are already light), and every other type
 * takes the first slot none of its neighbours has, from dark, second,
 * accent (second, accent, light under strapwork).
 */
export function roleSlots(pattern: Pattern, strapwork: boolean): Slot[] {
  const { pieces, types, cell } = pattern;
  // Which types touch: pieces sharing an edge, over the cell's neighbours.
  const key = (x: number, y: number) => `${x.toFixed(3)},${y.toFixed(3)}`;
  const edges = new Map<string, Set<number>>();
  for (let i = -1; i <= 1; i++)
    for (let j = -1; j <= 1; j++) {
      const dx = i * cell.u.x + j * cell.v.x;
      const dy = i * cell.u.y + j * cell.v.y;
      for (const piece of pieces) {
        const ps = piece.polygon;
        ps.forEach((p, k) => {
          const q = ps[(k + 1) % ps.length] ?? p;
          const a = key(p.x + dx, p.y + dy);
          const b = key(q.x + dx, q.y + dy);
          const edge = a < b ? `${a}|${b}` : `${b}|${a}`;
          edges.set(edge, (edges.get(edge) ?? new Set()).add(piece.type));
        });
      }
    }
  const touches = types.map(() => new Set<number>());
  for (const set of edges.values())
    for (const a of set) for (const b of set) if (a !== b) touches[a]?.add(b);

  const cover = (t: number) => (types[t]?.area ?? 0) * (types[t]?.perCell ?? 0);
  const order = types.map((_, t) => t);
  const star = [...order].sort(
    (a, b) =>
      (types[b]?.vertices ?? 0) - (types[a]?.vertices ?? 0) ||
      cover(b) - cover(a),
  )[0];
  const ground = [...order]
    .filter((t) => t !== star)
    .sort((a, b) => cover(b) - cover(a))[0];
  const slot = new Map<number, Slot>();
  if (star !== undefined) slot.set(star, 'b');
  if (ground !== undefined) slot.set(ground, strapwork ? 'a' : 'ground');
  const choices: Slot[] = strapwork ? ['c', 'b', 'ground'] : ['a', 'c', 'b'];
  for (const t of [...order].sort((a, b) => cover(b) - cover(a))) {
    if (slot.has(t)) continue;
    const near = [...(touches[t] ?? [])].map((n) => slot.get(n));
    const clashes = (c: Slot) => near.filter((n) => n === c).length;
    const best = [...choices].sort((a, b) => clashes(a) - clashes(b))[0];
    slot.set(t, best ?? 'c');
  }
  return order.map((t) => slot.get(t) ?? 'ground');
}

export interface Proposal {
  readonly palette: string;
  /** The slot for each named piece, as in `pattern.colors`. */
  readonly colors: Readonly<Record<string, string>>;
  /** Its own slots kept, only the palette changing: it was coloured from
   * a photo, or the rule went wrong on it. */
  readonly kept: 'photo' | 'hand' | false;
}

/** The proposed palette and piece colours for a tutorial. */
export function proposal(tutorial: Tutorial, pattern: Pattern): Proposal {
  const palette = traditionPalette(tutorial.style);
  if (fromPhoto(tutorial) || OWN_SLOTS.has(tutorial.id))
    return {
      palette,
      colors: tutorial.pattern.colors,
      kept: fromPhoto(tutorial) ? 'photo' : 'hand',
    };
  const slots = roleSlots(pattern, tutorial.pattern.look === 'strapwork');
  const colors: Record<string, string> = { ...tutorial.pattern.colors };
  pattern.types.forEach((t, i) => {
    if (t.name) colors[t.name] = slots[i] ?? 'ground';
  });
  return { palette, colors, kept: false };
}

/**
 * Hand corrections to colouring by rings, by tutorial: a role for a whole
 * shape (`petal`) or one ring of it (`petal@2`), as in `pattern.rings`.
 */
export const RING_FIXES: Readonly<
  Record<string, Readonly<Record<string, RingRole>>>
> = {};

/**
 * Tutorials kept by shape though rings would find a centre: the Comares
 * bones are one shape, white lying across and coloured standing up as on
 * the photo, and rings lose that.
 */
const BY_SHAPE: ReadonlySet<string> = new Set(['alhambra-comares-bones']);

/** What colouring by rings changes in a tutorial's `pattern`. */
export interface RingProposal {
  readonly how: 'rings' | 'shape';
  readonly pattern: Partial<Tutorial['pattern']>;
}

/**
 * The colouring proposed now (Colours 4): the tradition's glazes, by
 * rings where the pattern has a rosette, else by shape as in `proposal`.
 */
export function ringProposal(
  tutorial: Tutorial,
  pattern: Pattern,
): RingProposal {
  if (ringsOf(pattern) && !BY_SHAPE.has(tutorial.id)) {
    const fixes = RING_FIXES[tutorial.id];
    return {
      how: 'rings',
      pattern: {
        palette: traditionPalette(tutorial.style),
        rings: fixes ? { colors: { ...fixes } } : true,
        placements: undefined,
      },
    };
  }
  const p = proposal(tutorial, pattern);
  return {
    how: 'shape',
    pattern: { palette: p.palette, colors: { ...p.colors } },
  };
}
