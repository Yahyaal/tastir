import { z } from 'zod';

// Format v0 of the tutorial JSON, as described in docs/tutorial-format.md.
// This file checks the shape; references.ts checks that every name refers
// to an earlier element of the right kind.

/** A name a step gives to a new element. `.` and `@` are kept for the
 * names the engine derives (`k.1`, `c4@2`). */
export const NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/;
/** A reference: a name, optionally a crossing number and a copy number. */
export const REF_PATTERN = /^[A-Za-z][A-Za-z0-9_]*(\.[1-9]\d*)?(@[1-9]\d*)?$/;

const NO_COORDINATES =
  'tutorials never contain coordinates; build the point from crossings of earlier elements';

const Name = z
  .string()
  .regex(
    NAME_PATTERN,
    'a name starts with a letter and uses only letters, digits and _',
  );

const Ref = z
  .string({
    error: (iss) =>
      typeof iss.input === 'number'
        ? `${NO_COORDINATES} (got the number ${iss.input})`
        : 'expected the name of an earlier element',
  })
  .regex(REF_PATTERN, 'expected the name of an earlier element');

const PICK_RULES = 'angle, nearest, farthest, inside or outside';

export const Pick = z
  .strictObject(
    {
      angle: z.number().optional(),
      nearest: Ref.optional(),
      farthest: Ref.optional(),
      inside: Ref.optional(),
      outside: Ref.optional(),
    },
    {
      error: (iss) =>
        iss.code === 'unrecognized_keys'
          ? `pick by position is not allowed (found ${iss.keys.map((k) => `"${k}"`).join(', ')}): its meaning depends on how the engine orders crossings. Choose the point by rule with ${PICK_RULES}`
          : undefined,
    },
  )
  .refine((p) => Object.keys(p).length > 0, {
    error: `a pick needs at least one rule: ${PICK_RULES}`,
    // Only an empty pick is reported here; unknown keys already have an error.
    when: (payload) => payload.issues.length === 0,
  });

const Pair = z.tuple([Ref, Ref]);

export const PointSpec = z.strictObject({ meet: Pair, pick: Pick.optional() });
export const PointsSpec = z.strictObject({
  meet: Pair,
  pick: z.strictObject({ all: z.literal('byAngle') }),
});

export const LineSpec = z.union(
  [
    z.strictObject({ through: Pair }),
    z.strictObject({ through: Ref, perpendicularTo: Ref }),
    z.strictObject({ through: Ref, parallelTo: Ref }),
    z.strictObject({ through: Ref, bisects: z.tuple([Ref, Ref, Ref]) }),
  ],
  {
    error:
      'a line is { through: [p, q] }, { through: p, perpendicularTo: l }, { through: p, parallelTo: l } or { through: q, bisects: [p, q, r] }',
  },
);

export const CircleSpec = z.union(
  [
    z.strictObject({ centre: Ref, through: Ref }),
    z.strictObject({ centre: Ref, radiusOf: Ref }),
    z.strictObject({ centre: Ref, radiusFrom: Pair }),
    z.strictObject({
      centre: Ref,
      tangentTo: z.array(Ref).min(1),
      touch: z.enum(['near', 'far']).optional(),
    }),
  ],
  {
    error:
      'a circle is { centre, through }, { centre, radiusOf }, { centre, radiusFrom: [q, r] } or { centre, tangentTo: [...], touch? }',
  },
);

export const PolygonSpec = z
  .array(Ref)
  .min(3, 'a polygon needs at least three points');

export const Symmetry = z.union(
  [
    z.enum(['rot3', 'rot4', 'rot5', 'rot6', 'rot8', 'rot10', 'rot12', 'rot16']),
    z.templateLiteral(['mirror:', z.string().regex(REF_PATTERN)]),
  ],
  {
    error:
      'a repeat is by rot3, rot4, rot5, rot6, rot8, rot10, rot12, rot16 or mirror:<line>',
  },
);

export const RepeatSpec = z.strictObject({
  of: z.array(Ref).min(1),
  by: Symmetry,
  /** Leave out copies that land on the original or an earlier copy (a
   * line through O turned by 180°); their names then do not exist. */
  distinct: z.boolean().optional(),
});

const KINDS = [
  'point',
  'points',
  'line',
  'circle',
  'polygon',
  'repeat',
] as const;
const COORDINATE_KEYS = new Set([
  'x',
  'y',
  'at',
  'xy',
  'coords',
  'coordinates',
  'position',
]);

/** Where a coordinate hides in an element spec, outside its pick rules. */
function findCoordinate(value: unknown, path: string): string | undefined {
  if (typeof value === 'number') return path;
  if (Array.isArray(value)) {
    for (const [i, v] of value.entries()) {
      const found = findCoordinate(v, `${path}[${i}]`);
      if (found) return found;
    }
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (k === 'pick') continue;
      if (COORDINATE_KEYS.has(k)) return `${path}.${k}`;
      const found = findCoordinate(v, `${path}.${k}`);
      if (found) return found;
    }
  }
  return undefined;
}

/** The schema for each kind of element, as `{ "<kind>": spec }`. */
const ELEMENT_BY_KIND = {
  point: z.strictObject({ point: PointSpec }),
  points: z.strictObject({ points: PointsSpec }),
  line: z.strictObject({ line: LineSpec }),
  circle: z.strictObject({ circle: CircleSpec }),
  polygon: z.strictObject({ polygon: PolygonSpec }),
  repeat: z.strictObject({ repeat: RepeatSpec }),
};

export const ElementSpec = z
  .record(z.string(), z.unknown(), {
    error: `an element is { "<kind>": { ... } }`,
  })
  .superRefine((el, ctx) => {
    const keys = Object.keys(el);
    const coordinate = findCoordinate(el, 'element');
    if (coordinate) {
      ctx.addIssue({
        code: 'custom',
        message: `${NO_COORDINATES} (found one at ${coordinate.replace(/^element\.?/, '')})`,
      });
      return;
    }
    const kind = keys[0] as (typeof KINDS)[number];
    if (keys.length !== 1 || !KINDS.includes(kind)) {
      ctx.addIssue({
        code: 'custom',
        message: `an element has exactly one kind: ${KINDS.join(', ')} (got ${keys.join(', ') || 'nothing'})`,
      });
      return;
    }
    // Check against the one kind it names, so its own message comes through
    // rather than a union's "Invalid input".
    const result = ELEMENT_BY_KIND[kind].safeParse(el);
    for (const issue of result.error?.issues ?? []) {
      ctx.addIssue({
        code: 'custom',
        message: issue.message,
        path: issue.path,
      });
    }
  })
  .pipe(z.union(Object.values(ELEMENT_BY_KIND)));

const Animate = z.enum(['compass', 'ruler', 'fade']);

/** One move of a long step, shown on its own: "Step 11 · 2 of 4". */
export const Part = z.strictObject({
  text: z.string().min(1),
  /** The text when helper lines are hidden, for a part whose text
   * describes lines that are then left out. */
  textWithoutHelpers: z.string().min(1).optional(),
  create: z.record(Name, ElementSpec),
  highlight: z.array(Ref).optional(),
  animate: Animate.optional(),
});

export const Step = z
  .strictObject({
    id: z.int().positive(),
    /** With parts, the step's heading over the text of each part. */
    text: z.string().min(1),
    /** The text when helper lines are hidden (the player's “Show helper
     * lines” off), for a step whose text describes lines that are then
     * left out, or refers to a step that is then skipped. */
    textWithoutHelpers: z.string().min(1).optional(),
    create: z.record(Name, ElementSpec).optional(),
    parts: z
      .array(Part)
      .min(2, 'a step with parts has at least two')
      .optional(),
    highlight: z.array(Ref).optional(),
    animate: Animate.optional(),
    /** Evaluated but never shown: a step that only names points for the ink. */
    hidden: z.boolean().optional(),
  })
  .refine((s) => (s.create === undefined) !== (s.parts === undefined), {
    message: 'a step has either create or parts, not both and not neither',
  });

/** An ink path through named points, in order. */
export const InkThrough = z.strictObject({
  closed: z.boolean().optional(),
  through: z.array(Ref).min(2, 'an ink path goes through at least two points'),
});

/**
 * Where an ink path along a line stops: a point on it, or where it crosses
 * another element (a pick chooses when they cross more than once).
 */
export const InkEnd = z.union(
  [Ref, z.strictObject({ cross: Ref, pick: Pick.optional() })],
  {
    error:
      'an ink end is the name of a point or of the element it stops at, or { cross, pick }',
  },
);

/**
 * An ink path along one line or polygon side, between the two elements it
 * runs between, so no step has to mark its ends.
 */
export const InkAlong = z.strictObject({
  along: Ref,
  from: InkEnd,
  to: InkEnd,
});

export const InkPath = z.union([InkThrough, InkAlong], {
  error: 'an ink path is { through: [points], closed? } or { along, from, to }',
});

export const Credit = z.strictObject({
  source: z.string().min(1),
  creator: z.string().optional(),
  url: z.url().optional(),
  note: z.string().optional(),
  steps: z.array(z.int().positive()).optional(),
});

/**
 * A photo of the real pattern, to compare the wall with. A free photo
 * (public domain or Creative Commons) ships with the app: `file` is its name
 * in the player's public photos/ folder. A photo we may not ship is `private`:
 * `file` is its path under docs/research/, the dev server shows it, and the
 * built app shows a placeholder linking to `url` until a free photo is found.
 */
export const Photo = z.strictObject({
  file: z.string().regex(/^[\w./-]+$/, 'a photo file is a plain relative path'),
  caption: z.string().min(1),
  creator: z.string().min(1),
  license: z.string().min(1),
  url: z.url(),
  private: z.boolean().optional(),
});

export const ExpectedPiece = z.strictObject({
  name: Name,
  vertices: z.int().min(3),
  area: z.number().positive(),
  perCell: z.int().positive(),
  /** A deliberately small or thin piece, which the sliver check accepts. */
  small: z.boolean().optional(),
});

export const Expect = z.strictObject({
  note: z.string().optional(),
  crossings: z
    .record(
      Name,
      z.strictObject({
        count: z.int().positive(),
        distanceFromO: z.number().positive().optional(),
      }),
    )
    .optional(),
  pieceTypes: z.int().positive(),
  pieces: z.array(ExpectedPiece).min(1),
  cellArea: z.number().positive().optional(),
});

/**
 * Colors by where a piece sits, for walls whose same-shaped pieces take
 * different colors (Comares bones: white across, black and colored up).
 * The coloring repeats every `repeat` cells along the cell's two slides;
 * each rule colors the named pieces it matches, later rules winning. A rule
 * can match a piece's turn (its long axis, in degrees from the horizontal),
 * its place among the cell's pieces of that shape (`nth`, counted along
 * the cell's second slide, then its first), and the cell of the repeat it
 * is in.
 */
const Placements = z.strictObject({
  repeat: z.tuple([z.int().min(1), z.int().min(1)]),
  rules: z
    .array(
      z.strictObject({
        piece: Name,
        turn: z.number().min(0).max(180).optional(),
        nth: z.int().min(0).optional(),
        cell: z.tuple([z.int().min(0), z.int().min(0)]).optional(),
        color: z.string().min(1),
      }),
    )
    .min(1),
});

/**
 * Colouring by ring round each rosette: `true`, or hand corrections that
 * give a whole shape (`petal`) or one ring of it (`petal@2`, its second
 * ring out from the centre) a role.
 */
const Rings = z.union([
  z.literal(true),
  z.strictObject({
    colors: z.record(
      z
        .string()
        .regex(
          /^[A-Za-z][A-Za-z0-9_]*(@[1-9]\d*)?$/,
          'a ring is a piece name, or a piece name and @ and its ring',
        ),
      z.enum(['white', 'black', 'main', 'second', 'spark']),
    ),
    // How many rosettes take turns before the wall repeats: 1 colours
    // every rosette alike. Left out, neighbours take turns as the lattice
    // allows.
    rosettes: z.int().min(1).max(6).optional(),
  }),
]);

const Hex = z
  .string()
  .regex(/^#[0-9a-f]{6}$/, 'a colour is # and six hex digits');

/**
 * The look of the original in the tutorial's photo: a palette picked from
 * the photo, the colour of the lines (grout, or the edges of the bands),
 * the colour of the bands, and whether it is carved (plaster or wood), so
 * the lines and bands are drawn in relief.
 */
const Original = z.strictObject({
  palette: z.strictObject({
    a: Hex,
    b: Hex,
    c: Hex,
    d: Hex,
    ground: Hex,
  }),
  lines: Hex.optional(),
  band: Hex.optional(),
  carved: z.boolean().optional(),
});

export const TutorialShape = z.strictObject({
  format: z.literal(0),
  id: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'an id is lower-case words joined by -'),
  title: z.string().min(1),
  /** A shorter name for cards and menus, where the title is long. */
  short: z.string().min(1).optional(),
  /** A second line under the short name: the place, or whose construction. */
  subtitle: z.string().min(1).optional(),
  fold: z.int().min(3),
  /** The pattern turns into itself but has no mirror symmetry (a pinwheel). */
  chiral: z.boolean().optional(),
  style: z.string().min(1),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  credits: z.array(Credit),
  /** Historical verification is separate from approval to teach the drawing. */
  verification: z
    .strictObject({
      status: z.enum(['unverified', 'verified']),
      note: z.string().min(1),
    })
    .optional(),
  photos: z.array(Photo).optional(),
  given: z.strictObject({ O: z.string().min(1), A: z.string().min(1) }),
  steps: z.array(Step).min(1),
  ink: z.strictObject({
    text: z.string().optional(),
    paths: z.array(InkPath).min(1),
  }),
  pattern: z.strictObject({
    cell: Ref,
    /**
     * The whole panel to trace in the ink stage, when the tile carries a
     * shared band on only two sides: a convex polygon holding the tile. Its
     * copies overlap by the difference; the tile stays the repeat.
     */
    panel: Ref.optional(),
    /** What the learner reads when the inked tile is repeated. */
    text: z.string().optional(),
    palette: z.string().optional(),
    /**
     * How the wall is shown at first, as on the real pattern: separate
     * tiles with grout (the default), or strapwork, where the lines are
     * bands woven between the pieces (carved wood and plaster, Fès zellige).
     */
    look: z.enum(['tiles', 'strapwork', 'interlace', 'lines']).optional(),
    colors: z.record(Name, z.string().min(1)),
    placements: Placements.optional(),
    rings: Rings.optional(),
    original: Original.optional(),
  }),
  expect: Expect,
});

export type Tutorial = z.infer<typeof TutorialShape>;
export type Step = z.infer<typeof Step>;
export type Part = z.infer<typeof Part>;

/**
 * A step's parts, in order: its own parts, or the whole step as one part.
 * Everything that walks the construction goes through this.
 */
export function partsOf(step: Step): Part[] {
  if (step.parts) return step.parts;
  return [
    {
      text: step.text,
      create: step.create ?? {},
      ...(step.highlight ? { highlight: step.highlight } : {}),
      ...(step.animate ? { animate: step.animate } : {}),
    },
  ];
}
export type ElementSpec = z.infer<typeof ElementSpec>;
export type PointSpec = z.infer<typeof PointSpec>;
export type PointsSpec = z.infer<typeof PointsSpec>;
export type LineSpec = z.infer<typeof LineSpec>;
export type CircleSpec = z.infer<typeof CircleSpec>;
export type PolygonSpec = z.infer<typeof PolygonSpec>;
export type RepeatSpec = z.infer<typeof RepeatSpec>;
export type Pick = z.infer<typeof Pick>;
export type Symmetry = z.infer<typeof Symmetry>;
export type Placements = z.infer<typeof Placements>;
export type InkPath = z.infer<typeof InkPath>;
export type InkThrough = z.infer<typeof InkThrough>;
export type InkAlong = z.infer<typeof InkAlong>;
export type InkEnd = z.infer<typeof InkEnd>;
export type Photo = z.infer<typeof Photo>;
export type Expect = z.infer<typeof Expect>;
export type ExpectedPiece = z.infer<typeof ExpectedPiece>;
