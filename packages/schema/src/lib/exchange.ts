import { z } from 'zod';
import { InkPath, Step, TutorialShape } from './tutorial.js';

/** A draft may be unfinished or have broken references, but its data must be readable. */
export const DraftShape = TutorialShape.partial({
  ink: true,
  pattern: true,
  expect: true,
}).extend({
  steps: z.array(Step).max(1000),
  ink: z
    .strictObject({ text: z.string().optional(), paths: z.array(InkPath) })
    .optional(),
});
export const BasedOnShape = z.strictObject({
  tutorial: z.string().min(1),
  title: z.string().min(1),
  step: z.int().min(0),
});
/** A periodic square-grid motif, measured in whole lattice cells. */
export const SquareBandsShape = z.strictObject({
  sharedBorder: z.boolean().optional(),
  typeId: z.string().min(1).max(180),
  centre: z.tuple([
    z.int().min(-10000).max(10000),
    z.int().min(-10000).max(10000),
  ]),
  colors: z
    .array(z.string().regex(/^#[0-9a-fA-F]{6}$/))
    .min(2)
    .max(6),
});
export type SquareBands = z.infer<typeof SquareBandsShape>;
export const ColoringShape = z.strictObject({
  squareBands: SquareBandsShape.optional(),
  palette: z.string(),
  chosen: z.record(z.string(), z.string()),
  method: z.enum(['rings', 'shape', 'place']).optional(),
  rosettes: z.int().min(1).max(6).optional(),
});
/** Read old four-material designs as the new material families. */
const FINISHES = {
  stone: ['limestone', 'marble', 'sandstone', 'slate', 'custom'],
  wood: ['oak', 'walnut', 'cedar', 'custom'],
  metal: ['silver', 'gold', 'bronze', 'copper', 'custom'],
} as const;
export const JaliAppearanceShape = z
  .strictObject({
    material: z.enum(['stone', 'wood', 'metal', 'gold', 'silver']),
    finish: z
      .enum([
        'limestone',
        'marble',
        'sandstone',
        'slate',
        'oak',
        'walnut',
        'cedar',
        'silver',
        'gold',
        'bronze',
        'copper',
        'custom',
      ])
      .optional(),
    framework: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    background: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  })
  .transform((value) => {
    const legacyMetal =
      value.material === 'gold' || value.material === 'silver';
    const material = legacyMetal
      ? 'metal'
      : (value.material as 'stone' | 'wood' | 'metal');
    const finish =
      value.finish ??
      (legacyMetal
        ? (value.material as 'gold' | 'silver')
        : material === 'stone'
          ? 'limestone'
          : material === 'wood'
            ? 'oak'
            : 'silver');
    return { ...value, material, finish };
  })
  .refine(
    (value) =>
      (FINISHES[value.material] as readonly string[]).includes(value.finish),
    {
      message: 'Choose a finish from the selected material family.',
    },
  );
export type JaliAppearance = z.infer<typeof JaliAppearanceShape>;
/**
 * How the lines style draws: one pen line, two lines with paper between
 * them (an outlined band), or pencil; whether the pieces take a light wash
 * of their colours; and the ink's colour.
 */
export const PenLookShape = z.strictObject({
  pen: z.enum(['single', 'double', 'pencil']),
  wash: z.boolean(),
  ink: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});
export type PenLook = z.infer<typeof PenLookShape>;
export const SharedDesignShape = z.strictObject({
  name: z.string(),
  inked: z.array(z.string()).optional(),
  coloring: ColoringShape,
  look: z.enum(['tiles', 'strapwork', 'interlace', 'lines', 'jali']),
  grout: z.number().min(0).max(100),
  jali: JaliAppearanceShape.optional(),
  pen: PenLookShape.optional(),
});
export const SharedShape = z
  .strictObject({
    library: z.string().min(1).optional(),
    tutorial: DraftShape.optional(),
    basedOn: BasedOnShape.optional(),
    design: SharedDesignShape.optional(),
  })
  .refine((s) => (s.library !== undefined) !== (s.tutorial !== undefined), {
    message:
      'A share link must contain either a library reference or a pattern.',
  });
