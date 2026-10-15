import { z } from 'zod';

const Id = z.string().min(1).max(180);
export const TargetShape = z.strictObject({
  id: Id,
  kind: z.enum(['point', 'line', 'circle', 'polygon']),
  geometry: z.record(z.string(), z.unknown()),
});
export const SnapshotShape = z.strictObject({
  id: Id,
  documentId: Id,
  documentRevision: Id,
  viewRevision: z.string().min(1).max(2000),
  title: z.string().max(300),
  selected: Id.nullable(),
  targets: z.array(TargetShape).min(1).max(5000),
  image: z
    .string()
    .max(4_000_000)
    .regex(/^data:image\/png;base64,[A-Za-z0-9+/]+=*$/),
});
export type Snapshot = z.infer<typeof SnapshotShape>;
export const HighlightShape = z.strictObject({
  snapshotId: Id,
  targetId: Id,
  label: z.string().min(1).max(160),
});
export type Highlight = z.infer<typeof HighlightShape>;
export const CallShape = z.strictObject({
  id: Id,
  name: z.literal('highlight_target'),
  arguments: HighlightShape,
});
export type ToolCall = z.infer<typeof CallShape>;
export const ResultShape = z.strictObject({
  callId: Id,
  ok: z.boolean(),
  message: z.string().min(1).max(500),
});
export type ToolResult = z.infer<typeof ResultShape>;
export const StartShape = z.strictObject({
  requestId: z.uuid(),
  model: Id,
  prompt: z.string().min(1).max(8000),
  snapshot: SnapshotShape,
});
export const ContinueShape = z.strictObject({
  runId: z.uuid(),
  results: z.array(ResultShape).min(1).max(8),
});
export const ReplyShape = z.strictObject({
  runId: z.uuid(),
  text: z.string().max(40_000),
  calls: z.array(CallShape).max(8),
});
export type TurnReply = z.infer<typeof ReplyShape>;
export const StatusShape = z.strictObject({
  profiles: z.array(
    z.strictObject({ id: Id, label: z.string(), connected: z.boolean() }),
  ),
  activeId: Id.nullable(),
  connected: z.boolean(),
  sharing: z.boolean(),
  signingIn: z.boolean(),
  error: z.string().nullable(),
});
export type ConnectionStatus = z.infer<typeof StatusShape>;
export const ModelsShape = z.array(
  z.strictObject({ slug: Id, name: z.string().min(1) }),
);
export type ModelChoice = z.infer<typeof ModelsShape>[number];

/** The app executes this only against the observation that produced it. */
export function checkHighlight(
  call: ToolCall,
  snapshot: Snapshot,
  currentRevision: string,
): ToolResult {
  if (
    call.arguments.snapshotId !== snapshot.id ||
    currentRevision !== snapshot.viewRevision
  )
    return {
      callId: call.id,
      ok: false,
      message: 'The view changed. Ask for a new image before pointing.',
    };
  if (!snapshot.targets.some((t) => t.id === call.arguments.targetId))
    return {
      callId: call.id,
      ok: false,
      message: 'That target is not in this observation.',
    };
  return {
    callId: call.id,
    ok: true,
    message: `Highlighted ${call.arguments.targetId}: ${call.arguments.label}`,
  };
}

export const HIGHLIGHT_TOOL = {
  type: 'namespace',
  name: 'tastir',
  description: 'Point at named objects in the current Tastir drawing.',
  tools: [
    {
      type: 'function',
      name: 'highlight_target',
      description:
        'Highlight an object from the supplied snapshot. The browser reports whether it was actually displayed.',
      strict: true,
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          snapshotId: { type: 'string' },
          targetId: { type: 'string' },
          label: { type: 'string' },
        },
        required: ['snapshotId', 'targetId', 'label'],
      },
    },
  ],
} as const;
