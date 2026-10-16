import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { ConstructionShape } from '@tastir/agent-protocol';
import { StudioClient } from './client.js';
import { GoalsShape } from './studio.js';

/**
 * The Tastir studio as an MCP server, for Claude Code, Codex, Gemini or any
 * other MCP client. It holds no drawing itself: every tool is a call to the
 * running studio, so several agents and the owner share one drawing.
 */
export const INSTRUCTIONS = `Tastir draws Islamic geometric patterns with ruler and compass only. You work on a shared studio project with the owner and possibly other agents.

Every point comes from O and A (given, OA is the unit, A at 0°) or from crossings of lines and circles you construct. Never invent coordinates. When two elements cross more than once, choose the crossing with angle: the direction in degrees from O, counter-clockwise, 0° toward A (90° is up). Use angle null only when they cross once.

Work in this order: construct the lines, circles and crossings; ink the straight sides of the pattern between named points; set the repeating tile (four or six named points in order around a convex tile whose copies cover the plane); then paint the pieces. The ink must close pieces that cover the tile exactly, with no loose ends; a tile's opposite sides are copies of each other, so ink one of each pair at least.

Every edit takes the project's current revision. If someone else changed the drawing first, the edit is refused: call inspect, look at what changed, and continue from it. Never undo other people's work unless the owner asks; undo only_mine is the default. Each edit is all or nothing, so a refused edit changed nothing; read its message, fix the request and try again. Use check to see every remaining problem. Leave a short note when you finish a stage or need the owner to decide something.`;

const Project = z
  .string()
  .describe('The project id, from list_projects or new_project.');
const Revision = z
  .number()
  .int()
  .describe(
    'The revision the edit is based on, from the latest inspect or edit result.',
  );

export function createMcpServer(client: StudioClient, author?: string) {
  const server = new McpServer(
    { name: 'tastir-studio', version: '0.1.0' },
    { instructions: INSTRUCTIONS },
  );
  const who = () => {
    const name = author ?? server.server.getClientVersion()?.name ?? 'agent';
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
  ) =>
    run(() =>
      client.call('POST', `/projects/${project}/edit`, {
        author: who(),
        revision,
        edit: change,
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
      },
    },
    ({ project, revision, add, remove }) =>
      edit(project, revision, { op: 'construct', add, remove }),
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
      },
    },
    ({ project, revision, add, remove }) =>
      edit(project, revision, { op: 'ink', add, remove }),
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
      },
    },
    ({ project, revision, vertices }) =>
      edit(project, revision, { op: 'tile', vertices }),
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
      },
    },
    ({ project, revision, palette, colors }) =>
      edit(project, revision, { op: 'paint', palette, colors }),
  );
  server.registerTool(
    'set_goals',
    {
      description:
        'Change what check measures: fold, maximum steps, tile shape, number of kinds of piece.',
      inputSchema: { project: Project, revision: Revision, goals: GoalsShape },
    },
    ({ project, revision, goals }) =>
      edit(project, revision, { op: 'goals', goals }),
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
        },
      },
      ({ project, revision, steps, only_mine }) =>
        run(() =>
          client.call('POST', `/projects/${project}/travel`, {
            author: who(),
            revision,
            direction,
            steps,
            mine: only_mine,
          }),
        ),
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
      inputSchema: { project: Project, text: z.string().min(1).max(4000) },
    },
    ({ project, text }) =>
      run(() =>
        client.call('POST', `/projects/${project}/notes`, {
          author: who(),
          text,
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
