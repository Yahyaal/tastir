import { SquareBandsShape } from '@tastir/schema';
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
  kind: z.enum(['point', 'line', 'circle', 'polygon', 'control']),
  geometry: z.record(z.string(), z.unknown()),
});
const HexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);
export const RepeatShape = z.strictObject({
  vertices: z.array(Id).min(4).max(6),
  palette: Id,
  colors: z.record(Id, HexColor),
});
export type RepeatSettings = z.infer<typeof RepeatShape>;
export const ColorSquareBandsShape = z.strictObject({
  snapshotId: Id,
  documentRevision: Id,
  label: z.string().min(1).max(160),
  targetId: Id,
  colors: SquareBandsShape.shape.colors,
});
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
export const DestinationShape = z.strictObject({
  id: Id,
  title: z.string().min(1).max(300),
  route: z.string().max(500),
  kind: z.enum([
    'library',
    'work',
    'assistant',
    'wall',
    'watch',
    'draw',
    'editor',
  ]),
});
export type Destination = z.infer<typeof DestinationShape>;
export const ScreenShape = z.strictObject({
  route: z.string().max(500),
  title: z.string().max(300),
  description: z.string().max(2000),
  destinations: z.array(DestinationShape).max(500),
});
export const NavigateShape = z.strictObject({
  snapshotId: Id,
  documentRevision: Id,
  destinationId: Id,
  label: z.string().min(1).max(160),
});
export type Navigate = z.infer<typeof NavigateShape>;
export const HistoryActionShape = z.strictObject({
  source: z.enum(['assistant', 'manual', 'unknown']),
  requestId: Id.nullable(),
  label: z.string().min(1).max(160),
});
export type HistoryAction = z.infer<typeof HistoryActionShape>;
export const FitViewShape = z.strictObject({
  snapshotId: Id,
  documentRevision: Id,
  label: z.string().min(1).max(160),
});
export const TravelHistoryShape = z.strictObject({
  snapshotId: Id,
  documentRevision: Id,
  direction: z.enum(['undo', 'redo']),
  scope: z.enum(['steps', 'assistant']).default('steps'),
  steps: z.number().int().min(1).max(50),
  label: z.string().min(1).max(160),
});
export const SnapshotShape = z
  .strictObject({
    id: Id,
    documentId: Id,
    documentRevision: Id,
    viewRevision: z.string().min(1).max(2000),
    title: z.string().max(300),
    selected: Id.nullable(),
    targets: z.array(TargetShape).max(5000),
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
    mode: z.enum(['construction', 'repeat', 'screen']).default('construction'),
    palettes: z.array(Id).max(50).default([]),
    history: z
      .strictObject({
        undoSteps: z.number().int().min(0).max(50),
        redoSteps: z.number().int().min(0).max(50),
        undo: z.array(HistoryActionShape).max(50).default([]),
        redo: z.array(HistoryActionShape).max(50).default([]),
      })
      .nullable()
      .default(null),
    coloring: z
      .strictObject({
        squareTypes: z.array(Id).max(128),
        squareBands: SquareBandsShape.nullable(),
      })
      .nullable()
      .default(null),
    screen: ScreenShape.nullable().default(null),
    image: z
      .string()
      .max(4_000_000)
      .regex(/^data:image\/png;base64,[A-Za-z0-9+/]+=*$/)
      .nullable(),
  })
  .superRefine((snapshot, ctx) => {
    if (snapshot.mode !== 'screen' && !snapshot.image)
      ctx.addIssue({
        code: 'custom',
        path: ['image'],
        message: 'A drawing observation needs its board image.',
      });
    if (snapshot.mode === 'screen' && !snapshot.screen)
      ctx.addIssue({
        code: 'custom',
        path: ['screen'],
        message: 'A page observation needs its current route and destinations.',
      });
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
    name: z.literal('color_square_bands'),
    arguments: ColorSquareBandsShape,
  }),
  z.strictObject({
    id: Id,
    name: z.literal('fit_view'),
    arguments: FitViewShape,
  }),
  z.strictObject({
    id: Id,
    name: z.literal('travel_history'),
    arguments: TravelHistoryShape,
  }),
  z.strictObject({
    id: Id,
    name: z.literal('navigate'),
    arguments: NavigateShape,
  }),
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
      name: 'color_square_bands',
      strict: true,
      description:
        'On a normal Color/result page with observation.coloring, color one square-grid shape in concentric square borders. Choose a VISIBLE polygon targetId whose geometry.typeId is in observation.coloring.squareTypes; it becomes the centre square. colors are #RRGGBB from centre outward: black, teal, blue, orange gives 1×1 black, teal border out to 3×3, blue out to 5×5, orange out to 7×7. Each border is one square thick, measured along the repeat cell axes. The whole motif repeats every 7 square cells in this example. Other shapes retain their existing colors. Explain the repeating motif and clarify requests such as 2×2/3×3/4×4 when alignment or thickness is ambiguous before applying. This is spatial wall coloring, NOT rosette Ring by ring. One call is one Undo in the NORMAL PAGE color history. A fresh image must confirm success. Does not save a design or edit geometry.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          snapshotId: { type: 'string' },
          documentRevision: { type: 'string' },
          label: { type: 'string' },
          targetId: { type: 'string' },
          colors: { type: 'array', items: { type: 'string' } },
        },
        required: [
          'snapshotId',
          'documentRevision',
          'label',
          'targetId',
          'colors',
        ],
      },
    },
    {
      type: 'function',
      name: 'fit_view',
      strict: true,
      description:
        'Show Construction and fit ALL current named points and circles into the board. Use this yourself when needed geometry is outside the image or the repeat wall hides construction points. A fresh image and visible target IDs follow; no drawing edits or history changes. Do not ask the person to zoom out when this tool can do it.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          snapshotId: { type: 'string' },
          documentRevision: { type: 'string' },
          label: { type: 'string' },
        },
        required: ['snapshotId', 'documentRevision', 'label'],
      },
    },
    {
      type: 'function',
      name: 'travel_history',
      strict: true,
      description:
        'Undo or redo edits in the current observation: normal-page COLOR history when observation.coloring exists, otherwise workspace edits. Use the SAME history as the drawing buttons. Check observation.history.undo/redo: ordered NEXT action first, with source, requestId and label. For undo your changes use scope:assistant and count consecutive assistant actions from the start; stop at manual/unknown actions. No extra confirmation is needed for identified assistant actions. scope:steps allows the explicit number of edits the user requested, regardless of author. A plain Undo/Redo means one step. Restores geometry, tile and colors together. Never simulate Undo by deleting or repainting objects. Excessive steps or crossing a manual/unknown edit with assistant scope fails atomically. A fresh drawing observation follows success. Does not undo navigation or other pages.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          snapshotId: { type: 'string' },
          documentRevision: { type: 'string' },
          direction: { type: 'string', enum: ['undo', 'redo'] },
          scope: { type: 'string', enum: ['steps', 'assistant'] },
          steps: { type: 'integer', minimum: 1, maximum: 50 },
          label: { type: 'string' },
        },
        required: [
          'snapshotId',
          'documentRevision',
          'direction',
          'scope',
          'steps',
          'label',
        ],
      },
    },
    {
      type: 'function',
      name: 'navigate',
      strict: true,
      description:
        'Open a Tastir destination from the latest observation.screen.destinations. Use its exact destinationId; never invent a route or URL. This preserves the assistant workspace and respects unsaved-change questions in the normal player. The browser confirms the destination actually rendered before returning a fresh screen observation. No automatic saving or discarding. Use assistant destination to return to the editable drawing workspace. On normal screens navigation, questions and highlighting supplied targets are supported.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          snapshotId: { type: 'string' },
          documentRevision: { type: 'string' },
          destinationId: { type: 'string' },
          label: { type: 'string' },
        },
        required: ['snapshotId', 'documentRevision', 'destinationId', 'label'],
      },
    },
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
