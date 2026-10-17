import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { ConstructionShape } from '@tastir/agent-protocol';
import { StudioClient, type StudioCaller } from './client.js';
import { GoalsShape, LONGEST_WAIT } from './studio.js';

/**
 * The Tastir studio as an MCP server, for Claude Code, Codex, Gemini or any
 * other MCP client. It holds no drawing itself: every tool is a call to the
 * running studio, so several agents and the owner share one drawing.
 */
export const INSTRUCTIONS = `Tastir draws Islamic geometric patterns with ruler and compass only. You work on a shared studio project with the owner and possibly other agents.

Every point comes from O and A (given, OA is the unit, A at 0°) or from crossings of lines and circles you construct. Never invent coordinates. When two elements cross more than once, choose the crossing with angle: the direction in degrees from O, counter-clockwise, 0° toward A (90° is up). Use angle null only when they cross once.

Work in this order: construct the lines, circles and crossings; ink the straight sides of the pattern between named points; set the repeating tile (four or six named points in order around a convex tile whose copies cover the plane); then paint the pieces. The ink must close pieces that cover the tile exactly, with no loose ends; a tile's opposite sides are copies of each other, so ink one of each pair at least.

Every edit takes the project's current revision. If someone else changed the drawing first, the edit is refused: call inspect, look at what changed, and continue from it. Never undo other people's work unless the owner asks; undo only_mine is the default. Each edit is all or nothing, so a refused edit changed nothing; read its message, fix the request and try again. Use check to see every remaining problem.

Give every change a new command_id (any unique text, such as a UUID). If a call fails on the way back and you are not sure it was done, send it again with the same command_id: it is never done twice, and the answer says so.

Pictures from view are drawn by the studio from the saved project at a named revision. They are not the owner's screen, and the owner may be looking at something else.

When the project has a reference photo, you are recreating that pattern. Look at the overlay (your ink in magenta over the photo) after each meaningful change, find where your lines leave the photo's, and change the construction, not the ink alone: the result must still be a ruler-and-compass construction. Where the photo is worn, hidden or unclear, ask the owner rather than guess. A reconstruction is done when check passes and the owner accepts the overlay. Leave a short note when you finish a stage or need the owner to decide something.`;

const Project = z
  .string()
  .describe('The project id, from list_projects or new_project.');
const CommandId = z
  .string()
  .regex(/^[A-Za-z0-9._:-]{1,80}$/)
  .optional()
  .describe(
    'A new unique id for this change. Send the same id again only to retry a call whose answer you did not get; it is never done twice.',
  );
const Revision = z
  .number()
  .int()
  .describe(
    'The revision the edit is based on, from the latest inspect or edit result.',
  );

/** A signed-in connection: the name its changes show, and its lasting id. */
export interface Identity {
  readonly name: string;
  readonly actor: string;
}

export function createMcpServer(
  client: StudioCaller,
  author?: string | Identity,
) {
  const server = new McpServer(
    { name: 'tastir-studio', version: '0.1.0' },
    { instructions: INSTRUCTIONS },
  );
  const actor = typeof author === 'object' ? { actor: author.actor } : {};
  const who = () => {
    const name =
      (typeof author === 'object' ? author.name : author) ??
      server.server.getClientVersion()?.name ??
      'agent';
    return (
      name
        .replace(/[^A-Za-z0-9 ._()-]/g, '-')
        .replace(/^[^A-Za-z0-9]+/, '')
        .slice(0, 60) || 'agent'
    );
  };
  const run = async (work: () => Promise<unknown>) => {
    try {
      return {
        content: [
          { type: 'text' as const, text: JSON.stringify(await work()) },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: error instanceof Error ? error.message : String(error),
          },
        ],
      };
    }
  };
  const edit = (
    project: string,
    revision: number,
    change: Record<string, unknown>,
    command?: string,
  ) =>
    run(() =>
      client.call('POST', `/projects/${project}/edit`, {
        author: who(),
        ...actor,
        revision,
        edit: change,
        ...(command ? { command } : {}),
      }),
    );

  server.registerTool(
    'list_projects',
    {
      description:
        'The studio projects, newest first, with their current revision.',
    },
    () => run(() => client.call('GET', '/projects')),
  );
  server.registerTool(
    'list_library',
    {
      description:
        "Tastir's library tutorials, which a new project can start from.",
    },
    () => run(() => client.call('GET', '/library')),
  );
  server.registerTool(
    'new_project',
    {
      description:
        'Start a project: from O and A only, or from a library tutorial up to one of its steps. Optional goals are checked by check.',
      inputSchema: {
        title: z.string().min(1).max(120),
        fold: z
          .number()
          .int()
          .min(2)
          .max(24)
          .optional()
          .describe('The symmetry you mean to draw, 8 by default.'),
        from_tutorial: z
          .string()
          .optional()
          .describe('A library tutorial id to copy.'),
        up_to_step: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe('Copy the tutorial up to this step; all by default.'),
        goals: GoalsShape.optional(),
      },
    },
    ({ title, fold, from_tutorial, up_to_step, goals }) =>
      run(() =>
        client.call('POST', '/projects', {
          author: who(),
          title,
          ...(fold ? { fold } : {}),
          ...(from_tutorial
            ? {
                from: {
                  tutorial: from_tutorial,
                  ...(up_to_step !== undefined ? { step: up_to_step } : {}),
                },
              }
            : {}),
          ...(goals ? { goals } : {}),
        }),
      ),
  );
  server.registerTool(
    'inspect',
    {
      description:
        'The current drawing: revision, steps, named points with positions, lines, circles, polygons, ink ids, tile and pieces, and recent history with authors.',
      inputSchema: { project: Project },
    },
    ({ project }) => run(() => client.call('GET', `/projects/${project}`)),
  );
  server.registerTool(
    'construct',
    {
      description:
        'Add ruler lines, compass circles and crossing points in order (later ones may use earlier names), or remove elements nothing else is built on. All or nothing.',
      inputSchema: {
        project: Project,
        revision: Revision,
        add: z.array(ConstructionShape).max(32).default([]),
        remove: z
          .array(z.string())
          .max(32)
          .default([])
          .describe('Names of elements to remove.'),
        command_id: CommandId,
      },
    },
    ({ project, revision, add, remove, command_id }) =>
      edit(project, revision, { op: 'construct', add, remove }, command_id),
  );
  server.registerTool(
    'ink',
    {
      description:
        'Ink straight sides of the pattern between named points, or remove ink by id (ink1, ink2… from inspect). A ruler line is added under a side that has none. All or nothing.',
      inputSchema: {
        project: Project,
        revision: Revision,
        add: z
          .array(z.strictObject({ from: z.string(), to: z.string() }))
          .max(64)
          .default([]),
        remove: z.array(z.string()).max(64).default([]),
        command_id: CommandId,
      },
    },
    ({ project, revision, add, remove, command_id }) =>
      edit(project, revision, { op: 'ink', add, remove }, command_id),
  );
  server.registerTool(
    'set_tile',
    {
      description:
        'Make the repeating tile from four or six named points in order around it. It is refused unless the ink closes pieces that cover it exactly, with no loose ends across its seams. The pieces it finds are listed by inspect.',
      inputSchema: {
        project: Project,
        revision: Revision,
        vertices: z.array(z.string()).min(4).max(6),
        command_id: CommandId,
      },
    },
    ({ project, revision, vertices, command_id }) =>
      edit(project, revision, { op: 'tile', vertices }, command_id),
  );
  server.registerTool(
    'paint',
    {
      description:
        'Color the pieces: a palette from inspect, and/or #rrggbb colors for piece ids from inspect. A palette starts the colors afresh.',
      inputSchema: {
        project: Project,
        revision: Revision,
        palette: z.string().nullable().default(null),
        colors: z
          .array(z.strictObject({ piece: z.string(), color: z.string() }))
          .max(128)
          .default([]),
        command_id: CommandId,
      },
    },
    ({ project, revision, palette, colors, command_id }) =>
      edit(project, revision, { op: 'paint', palette, colors }, command_id),
  );
  server.registerTool(
    'set_goals',
    {
      description:
        'Change what check measures: fold, maximum steps, tile shape, number of kinds of piece.',
      inputSchema: {
        project: Project,
        revision: Revision,
        goals: GoalsShape,
        command_id: CommandId,
      },
    },
    ({ project, revision, goals, command_id }) =>
      edit(project, revision, { op: 'goals', goals }, command_id),
  );
  for (const direction of ['undo', 'redo'] as const)
    server.registerTool(
      direction,
      {
        description: `${direction === 'undo' ? 'Undo' : 'Redo'} the latest changes. With only_mine (the default) it refuses to pass a change someone else made.`,
        inputSchema: {
          project: Project,
          revision: Revision,
          steps: z.number().int().min(1).max(100).default(1),
          only_mine: z.boolean().default(true),
          command_id: CommandId,
        },
      },
      ({ project, revision, steps, only_mine, command_id }) =>
        run(() =>
          client.call('POST', `/projects/${project}/travel`, {
            author: who(),
            ...actor,
            revision,
            direction,
            steps,
            mine: only_mine,
            ...(command_id ? { command: command_id } : {}),
          }),
        ),
    );
  server.registerTool(
    'view',
    {
      description:
        "A picture the studio draws from the saved project (not the owner's screen): the construction (guides faint, ink dark, tile dashed, points named), the wall of colored pieces, the reference photo, or the overlay (the photo with your ink drawn over it in magenta, and O and A in cyan, once the owner has lined it up). Give an area in drawing units (positions from inspect) to look closer. Look after a meaningful change, not after every edit: pictures use a lot of your plan.",
      inputSchema: {
        project: Project,
        what: z
          .enum(['construction', 'wall', 'reference', 'overlay'])
          .default('construction'),
        area: z
          .strictObject({
            x: z.number(),
            y: z.number(),
            width: z.number().positive(),
            height: z.number().positive(),
          })
          .optional()
          .describe('The lower-left corner and size of the part to show.'),
        size: z
          .number()
          .int()
          .min(200)
          .max(1600)
          .default(768)
          .describe(
            'Pixels on the longer side. A picture too big for a chat app is drawn smaller.',
          ),
      },
    },
    async ({ project, what, area, size }) => {
      try {
        const q = new URLSearchParams({ what, size: String(size) });
        if (area)
          for (const [k, v] of Object.entries(area)) q.set(k, String(v));
        const picture = await client.picture(
          `/projects/${project}/picture?${q}`,
        );
        return {
          content: [
            {
              type: 'image' as const,
              data: picture.data,
              mimeType: 'image/png',
            },
            {
              type: 'text' as const,
              text: `The ${what} at revision ${picture.revision}, ${picture.size} pixels on its longer side, drawn by the studio from the saved project. It is not the owner's screen.`,
            },
          ],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: 'text' as const,
              text: error instanceof Error ? error.message : String(error),
            },
          ],
        };
      }
    },
  );
  server.registerTool(
    'set_reference',
    {
      description:
        'Give the project a reference photo from docs/research or apps/player/public/photos. The owner then lines it up in Tastir by placing O and A on it; until then overlay only shows the photo.',
      inputSchema: {
        project: Project,
        path: z
          .string()
          .describe(
            'Relative to the repository, for example docs/research/name.jpg.',
          ),
        source: z
          .string()
          .optional()
          .describe('Where the photo came from, for the credits.'),
      },
    },
    ({ project, path, source }) =>
      run(() =>
        client.call('POST', `/projects/${project}/reference`, {
          author: who(),
          path,
          ...(source ? { source } : {}),
        }),
      ),
  );
  server.registerTool(
    'point',
    {
      description:
        'Mark a named element (from inspect) in Tastir with a short label, to show the owner what you mean. It changes nothing in the drawing.',
      inputSchema: {
        project: Project,
        target: z.string(),
        label: z.string().min(1).max(200),
      },
    },
    ({ project, target, label }) =>
      run(() =>
        client.call('POST', `/projects/${project}/marks`, {
          author: who(),
          target,
          label,
        }),
      ),
  );
  server.registerTool(
    'clear_marks',
    {
      description: 'Remove your marks from the drawing.',
      inputSchema: { project: Project },
    },
    ({ project }) =>
      run(() =>
        client.call('POST', `/projects/${project}/marks/clear`, {
          author: who(),
        }),
      ),
  );
  server.registerTool(
    'ask',
    {
      description:
        'Ask the owner a question, marking the element it is about. It returns the question number at once; then call wait_for_answer. Never guess an answer: carry on with what does not depend on it.',
      inputSchema: {
        project: Project,
        question: z.string().min(1).max(4000),
        about: z
          .string()
          .optional()
          .describe('A named element the question is about.'),
        command_id: CommandId,
      },
    },
    ({ project, question, about, command_id }) =>
      run(async () => {
        const asked = (await client.call(
          'POST',
          `/projects/${project}/questions`,
          {
            author: who(),
            text: question,
            ...(about ? { about } : {}),
            ...(command_id ? { command: command_id } : {}),
          },
        )) as { question: { id: number } };
        return {
          question: asked.question.id,
          note: 'Asked. Call wait_for_answer with this question number to wait for the owner.',
        };
      }),
  );
  server.registerTool(
    'wait_for_answer',
    {
      description: `Wait up to ${LONGEST_WAIT} seconds for the owner's answer to a question. If it has not come, call again, or carry on with what does not depend on it and check read_notes later. The question stays open, and an answer given later is kept.`,
      inputSchema: {
        project: Project,
        question: z.number().int().min(1).describe('The number ask returned.'),
        seconds: z.number().int().min(0).max(LONGEST_WAIT).default(40),
      },
    },
    ({ project, question, seconds }) =>
      run(async () => {
        const reply = (await client.call(
          'GET',
          `/projects/${project}/questions/${question}?wait=${seconds}`,
          undefined,
          seconds + 15,
        )) as { answer: { text: string } | null };
        return reply.answer
          ? { question, answer: reply.answer.text }
          : {
              question,
              answer: null,
              note: 'No answer yet. Call wait_for_answer again, or carry on with what does not depend on it.',
            };
      }),
  );
  server.registerTool(
    'check',
    {
      description:
        "Every remaining problem: broken steps, ink off the construction, the tile, loose ends, and the project's goals. An empty list means it is done.",
      inputSchema: { project: Project },
    },
    ({ project }) =>
      run(() => client.call('GET', `/projects/${project}/check`)),
  );
  server.registerTool(
    'note',
    {
      description:
        "Post a short note to the project's thread, which the owner and other agents read.",
      inputSchema: {
        project: Project,
        text: z.string().min(1).max(4000),
        command_id: CommandId,
      },
    },
    ({ project, text, command_id }) =>
      run(() =>
        client.call('POST', `/projects/${project}/notes`, {
          author: who(),
          text,
          ...(command_id ? { command: command_id } : {}),
        }),
      ),
  );
  server.registerTool(
    'read_notes',
    {
      description:
        'The notes in the project thread after a note id (0 for all).',
      inputSchema: {
        project: Project,
        after: z.number().int().min(0).default(0),
      },
    },
    ({ project, after }) =>
      run(() =>
        client.call('GET', `/projects/${project}/notes?after=${after}`),
      ),
  );
  return server;
}

export async function runMcp(root: string) {
  const server = createMcpServer(
    new StudioClient(root),
    process.env['TASTIR_AUTHOR'],
  );
  await server.connect(new StdioServerTransport());
}
