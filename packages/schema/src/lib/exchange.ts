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
export const ColoringShape = z.strictObject({
  palette: z.string(),
  chosen: z.record(z.string(), z.string()),
});
export const SharedDesignShape = z.strictObject({
  name: z.string(),
  inked: z.array(z.string()).optional(),
  coloring: ColoringShape,
  look: z.enum(['tiles', 'strapwork', 'lines', 'jali']),
  grout: z.number().min(0).max(100),
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
