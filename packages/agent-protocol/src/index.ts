import { z } from 'zod';

const Id = z.string().min(1).max(180);
export const SegmentShape = z.strictObject({ id: Id, from: Id, to: Id });
export type DrawingSegment = z.infer<typeof SegmentShape>;
const Name = z
  .string()
  .regex(/^[A-Za-z][A-Za-z0-9_]*$/)
  .max(80);
export const ConstructionShape = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('line'), name: Name, from: Id, to: Id }),
  z.strictObject({
    kind: z.literal('circle'),
    name: Name,
    centre: Id,
    through: Id,
  }),
  z.strictObject({
    kind: z.literal('intersection'),
    name: Name,
    first: Id,
    second: Id,
    angle: z.number().min(0).max(360).nullable(),
  }),
]);
export type Construction = z.infer<typeof ConstructionShape>;
export const TargetShape = z.strictObject({
  id: Id,
  kind: z.enum(['point', 'line', 'circle', 'polygon']),
  geometry: z.record(z.string(), z.unknown()),
});
const HexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);
export const RepeatShape = z.strictObject({
  vertices: z.array(Id).min(4).max(6),
  palette: Id,
  colors: z.record(Id, HexColor),
});
export type RepeatSettings = z.infer<typeof RepeatShape>;
export const SetTileShape = z.strictObject({
  snapshotId: Id,
  documentRevision: Id,
  label: z.string().min(1).max(160),
  vertices: z.array(Id).min(4).max(6),
});
export type SetTile = z.infer<typeof SetTileShape>;
export const PaintPatternShape = z.strictObject({
  snapshotId: Id,
  documentRevision: Id,
  label: z.string().min(1).max(160),
  palette: Id.nullable(),
  colors: z.array(z.strictObject({ typeId: Id, color: HexColor })).max(128),
});
export type PaintPattern = z.infer<typeof PaintPatternShape>;
export const SnapshotShape = z.strictObject({
  id: Id,
  documentId: Id,
  documentRevision: Id,
  viewRevision: z.string().min(1).max(2000),
  title: z.string().max(300),
  selected: Id.nullable(),
  targets: z.array(TargetShape).min(1).max(5000),
  segments: z.array(SegmentShape).max(128).default([]),
  constructions: z.array(ConstructionShape).max(128).default([]),
  repeat: z
    .strictObject({
      vertices: z.array(Id).min(4).max(6),
      palette: Id,
      types: z
        .array(
          z.strictObject({
            id: Id,
            color: HexColor,
            perCell: z.number().int().positive(),
          }),
        )
        .max(128),
    })
    .nullable()
    .default(null),
  mode: z.enum(['construction', 'repeat']).default('construction'),
  palettes: z.array(Id).max(50).default([]),
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
export const HighlightCallShape = z.strictObject({
  id: Id,
  name: z.literal('highlight_target'),
  arguments: HighlightShape,
});
export const EditSegmentsShape = z.strictObject({
  snapshotId: Id,
  documentRevision: Id,
  label: z.string().min(1).max(160),
  add: z.array(z.strictObject({ from: Id, to: Id })).max(32),
  remove: z.array(Id).max(128),
});
export type EditSegments = z.infer<typeof EditSegmentsShape>;
export const ConstructShape = z.strictObject({
  snapshotId: Id,
  documentRevision: Id,
  label: z.string().min(1).max(160),
  add: z.array(ConstructionShape).max(16),
  remove: z.array(Name).max(128),
});
export type Construct = z.infer<typeof ConstructShape>;
export const CallShape = z.discriminatedUnion('name', [
  z.strictObject({
    id: Id,
    name: z.literal('set_tile'),
    arguments: SetTileShape,
  }),
  z.strictObject({
    id: Id,
    name: z.literal('paint_pattern'),
    arguments: PaintPatternShape,
  }),
  HighlightCallShape,
  z.strictObject({
    id: Id,
    name: z.literal('edit_segments'),
    arguments: EditSegmentsShape,
  }),
  z.strictObject({
    id: Id,
    name: z.literal('construct'),
    arguments: ConstructShape,
  }),
]);
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
  snapshot: SnapshotShape.optional(),
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
  call: z.infer<typeof HighlightCallShape>,
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

export const DRAWING_TOOLS = {
  type: 'namespace',
  name: 'tastir',
  description:
    'Construct ruler-and-compass geometry, draw finite sides, repeat and color closed patterns, and highlight objects in Tastir.',
  tools: [
    {
      type: 'function',
      name: 'set_tile',
      strict: true,
      description:
        'Repeat the current finite ink using four or six named POINT IDs in boundary order. Four corners must form a parallelogram; six a convex centrally symmetric hexagon. The ink must already close pieces and cover the tile without gaps or loose ends. This adds a tile outline, not ink sides. Success shows the repeated wall and returns fresh piece type IDs for coloring. Replaces an earlier tile and resets its colors. One Undo restores the previous tile.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          snapshotId: { type: 'string' },
          documentRevision: { type: 'string' },
          label: { type: 'string' },
          vertices: { type: 'array', items: { type: 'string' } },
        },
        required: ['snapshotId', 'documentRevision', 'label', 'vertices'],
      },
    },
    {
      type: 'function',
      name: 'paint_pattern',
      strict: true,
      description:
        'Color a validated repeating pattern. Use typeId from observation.repeat.types and #RRGGBB colors; all pieces of that shape take that color. palette:null keeps existing colors. A named palette from observation.palettes resets custom colors before applying colors in this call. Use empty colors to apply just a palette. One batch is one Undo. A fresh image follows success.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          snapshotId: { type: 'string' },
          documentRevision: { type: 'string' },
          label: { type: 'string' },
          palette: { type: ['string', 'null'] },
          colors: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                typeId: { type: 'string' },
                color: { type: 'string' },
              },
              required: ['typeId', 'color'],
            },
          },
        },
        required: [
          'snapshotId',
          'documentRevision',
          'label',
          'palette',
          'colors',
        ],
      },
    },
    {
      type: 'function',
      name: 'construct',
      strict: true,
      description:
        'Add named ruler lines, compass circles or intersection points in one undoable batch. Later operations can reference earlier names in the same batch. Use unique new names; never overwrite existing geometry. angle is null for a unique intersection, otherwise choose by angle in degrees about O (90 upper, 270 lower); ambiguous or impossible crossings fail the WHOLE batch. remove deletes only your previously added construction elements, and fails if anything still depends on them. A fresh image and geometry follow the result. Use edit_segments afterward for finite sides.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          snapshotId: { type: 'string' },
          documentRevision: { type: 'string' },
          label: { type: 'string' },
          add: {
            type: 'array',
            items: {
              anyOf: [
                {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    kind: { type: 'string', enum: ['line'] },
                    name: { type: 'string' },
                    from: { type: 'string' },
                    to: { type: 'string' },
                  },
                  required: ['kind', 'name', 'from', 'to'],
                },
                {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    kind: { type: 'string', enum: ['circle'] },
                    name: { type: 'string' },
                    centre: { type: 'string' },
                    through: { type: 'string' },
                  },
                  required: ['kind', 'name', 'centre', 'through'],
                },
                {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    kind: { type: 'string', enum: ['intersection'] },
                    name: { type: 'string' },
                    first: { type: 'string' },
                    second: { type: 'string' },
                    angle: { type: ['number', 'null'] },
                  },
                  required: ['kind', 'name', 'first', 'second', 'angle'],
                },
              ],
            },
          },
          remove: { type: 'array', items: { type: 'string' } },
        },
        required: ['snapshotId', 'documentRevision', 'label', 'add', 'remove'],
      },
    },
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
    {
      type: 'function',
      name: 'edit_segments',
      description:
        'Add or remove finite straight segments as one undoable edit. Changing ink clears its tile and colors; Undo restores them. Use exact named POINT IDs from the latest observation. To draw a square, add its four sides in ONE call. remove contains IDs from observation.segments. Return results and a fresh board image before making further edits. Cannot create new points or arbitrary coordinates.',
      strict: true,
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          snapshotId: { type: 'string' },
          documentRevision: { type: 'string' },
          label: { type: 'string' },
          add: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: { from: { type: 'string' }, to: { type: 'string' } },
              required: ['from', 'to'],
            },
          },
          remove: { type: 'array', items: { type: 'string' } },
        },
        required: ['snapshotId', 'documentRevision', 'label', 'add', 'remove'],
      },
    },
  ],
} as const;
