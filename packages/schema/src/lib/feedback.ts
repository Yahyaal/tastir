import { z } from 'zod';
import { ColoringShape, DraftShape } from './exchange.js';

export const FEEDBACK_LIMITS = {
  body: 512 * 1024,
  snapshot: 64 * 1024,
  image: 256 * 1024,
  imageSide: 1024,
  imagePixels: 1_000_000,
  message: 4000,
  exportReports: 20,
  exportBytes: 5 * 1024 * 1024,
} as const;

export function utf8Size(text: string): number {
  let bytes = 0;
  for (const char of text) {
    const n = char.codePointAt(0)!;
    bytes += n <= 0x7f ? 1 : n <= 0x7ff ? 2 : n <= 0xffff ? 3 : 4;
  }
  return bytes;
}

/** Stable across object key order. Used only with trusted/validated tutorial data. */
export function feedbackCanonicalJson(value: unknown): string {
  const order = (v: unknown): unknown =>
    Array.isArray(v)
      ? v.map(order)
      : v && typeof v === 'object'
        ? Object.fromEntries(
            Object.entries(v)
              .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
              .map(([k, x]) => [k, order(x)]),
          )
        : v;
  return JSON.stringify(order(value));
}

/** Bound structure before the tutorial schema traverses untrusted drawing data. */
export function boundedFeedbackJson(value: unknown): boolean {
  let nodes = 0;
  function visit(v: unknown, depth: number): boolean {
    if (++nodes > 12000 || depth > 16) return false;
    if (typeof v === 'string') return v.length <= 8192;
    if (typeof v === 'number') return Number.isFinite(v) && Math.abs(v) <= 1e9;
    if (v === null || typeof v === 'boolean') return true;
    if (Array.isArray(v))
      return v.length <= 5000 && v.every((x) => visit(x, depth + 1));
    if (typeof v !== 'object') return false;
    const entries = Object.entries(v);
    return (
      entries.length <= 5000 &&
      entries.every(
        ([key, x]) =>
          key.length <= 180 &&
          !['__proto__', 'prototype', 'constructor'].includes(key) &&
          visit(x, depth + 1),
      )
    );
  }
  return visit(value, 0);
}

export const FeedbackCategory = z.enum(['problem', 'stuck', 'comment']);
export const FeedbackStatus = z.enum([
  'new',
  'reviewing',
  'resolved',
  'archived',
]);
export const FeedbackModeration = z.enum(['inbox', 'quarantined', 'spam']);
export const FeedbackContextShape = z.strictObject({
  version: z.literal(1),
  pattern: z.string().max(160),
  title: z.string().max(240),
  mode: z.enum(['watch', 'draw', 'result', 'error']),
  stage: z.string().max(40),
  index: z.int().min(0).max(10000).optional(),
  stepIds: z.array(z.int().min(1).max(10000)).max(40).default([]),
  label: z.string().max(240),
  instruction: z.string().max(8192),
  tutorialHash: z
    .string()
    .regex(/^[a-f0-9]{64}$/)
    .optional(),
  build: z.string().max(80),
  viewport: z.tuple([z.int().min(0).max(20000), z.int().min(0).max(20000)]),
  browser: z.string().max(80),
  input: z.enum(['touch', 'pointer']),
  tool: z.string().max(80).optional(),
  hintLevel: z.int().min(0).max(20).optional(),
});
export type FeedbackContext = z.infer<typeof FeedbackContextShape>;

export const FeedbackSnapshotShape = z
  .unknown()
  .refine(
    (value) =>
      boundedFeedbackJson(value) &&
      utf8Size(JSON.stringify(value) ?? '') <= FEEDBACK_LIMITS.snapshot,
    'This drawing is too large to attach. You can send your message without it.',
  )
  .pipe(
    z.strictObject({
      draft: DraftShape,
      inked: z.array(z.string().max(180)).max(3000).optional(),
      copies: z
        .array(
          z.strictObject({
            x: z.number().finite().min(-10000).max(10000),
            y: z.number().finite().min(-10000).max(10000),
          }),
        )
        .max(1000)
        .optional(),
      coloring: ColoringShape.optional(),
    }),
  )
  .refine(
    ({ draft }) =>
      draft.fold <= 64 &&
      (draft.star ?? 3) <= 128 &&
      (draft.pattern?.placements?.repeat.every((n) => n <= 32) ?? true),
    'This drawing has too many repeats to attach. Send the message without the drawing.',
  );
export type FeedbackSnapshot = z.infer<typeof FeedbackSnapshotShape>;

export const FeedbackSubmissionShape = z
  .strictObject({
    id: z.uuid(),
    retrySecret: z.string().regex(/^[a-f0-9]{64}$/),
    token: z.string().min(1).max(2048),
    category: FeedbackCategory,
    message: z.string().trim().min(1).max(FEEDBACK_LIMITS.message),
    email: z.union([z.literal(''), z.email().max(254)]).optional(),
    context: FeedbackContextShape,
    snapshot: FeedbackSnapshotShape.optional(),
    image: z
      .string()
      .max(Math.ceil(FEEDBACK_LIMITS.image / 3) * 4 + 24)
      .regex(/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/)
      .optional(),
  })
  .refine((v) => !v.image || !!v.snapshot, {
    message: 'Attach a drawing snapshot with its board image.',
    path: ['image'],
  });
export type FeedbackSubmission = z.infer<typeof FeedbackSubmissionShape>;

export const FeedbackUpdateShape = z.strictObject({
  version: z.int().min(1),
  status: FeedbackStatus.optional(),
  moderation: FeedbackModeration.optional(),
  priority: z.enum(['normal', 'high']).optional(),
  group: z.string().trim().max(160).optional(),
  note: z.string().trim().min(1).max(4000).optional(),
  retainDays: z.int().min(1).max(730).optional(),
  retainEvidenceDays: z.int().min(1).max(365).optional(),
});
