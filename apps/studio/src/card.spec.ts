import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import {
  EXTENSION_ID,
  RESOURCE_MIME_TYPE,
} from '@modelcontextprotocol/ext-apps/server';
import { CARD, createMcpServer } from './mcp.js';
import { DirectClient } from './routes.js';
import { Studio } from './studio.js';
import { testBackend, type TestBackend } from './testing.js';

const tutorials = join(import.meta.dirname, '../../../tutorials');

describe('the studio card in a chat (MCP Apps)', () => {
  let store: TestBackend;
  let studio: Studio;
  beforeEach(async () => {
    store = await testBackend('files');
    studio = new Studio(store.root, tutorials, store.backend);
  });
  afterEach(() => store.close());

  /** A chat app connecting, saying whether it shows cards. */
  async function connect(cards: boolean) {
    const server = createMcpServer(new DirectClient(studio), {
      name: 'Claude',
      actor: 'c1',
    });
    const client = new Client(
      { name: 'chat', version: '1' },
      {
        capabilities: cards
          ? ({
              extensions: {
                [EXTENSION_ID]: { mimeTypes: [RESOURCE_MIME_TYPE] },
              },
            } as never)
          : {},
      },
    );
    const [a, b] = InMemoryTransport.createLinkedPair();
    await Promise.all([server.connect(a), client.connect(b)]);
    const call = async (name: string, args: Record<string, unknown>) =>
      (await client.callTool({ name, arguments: args })) as {
        isError?: boolean;
        content: { type: string; text?: string }[];
        structuredContent?: Record<string, any>;
      };
    return { client, call };
  }

  it('offers open_studio with its page, and keeps the card tools from the model', async () => {
    const { client } = await connect(true);
    const tools = (await client.listTools()).tools;
    const meta = (name: string) =>
      tools.find((t) => t.name === name)?._meta as
        { ui?: { resourceUri?: string; visibility?: string[] } } | undefined;
    expect(meta('open_studio')?.ui?.resourceUri).toBe(CARD);
    expect(meta('open_studio')?.ui?.visibility).toBeUndefined();
    expect(meta('studio_snapshot')?.ui?.visibility).toEqual(['app']);
    expect(meta('answer_question')?.ui?.visibility).toEqual(['app']);
    const page = await client.readResource({ uri: CARD });
    expect(page.contents[0]?.mimeType).toBe(RESOURCE_MIME_TYPE);
    expect(String((page.contents[0] as { text: string }).text)).toContain(
      'Questions for you',
    );
  });

  it('gives the card the drawing, sending the picture only when it changed', async () => {
    const { call } = await connect(true);
    const id = (await studio.create({ author: 'owner', title: 'Card' }))
      .project;
    await studio.edit(id, {
      author: 'claude',
      revision: 1,
      edit: {
        op: 'construct',
        add: [{ kind: 'circle', name: 'C0', centre: 'O', through: 'A' }],
        remove: [],
      },
    });
    await studio.ask(id, { author: 'claude', text: 'Is this right?' });
    const opened = await call('open_studio', { project: id });
    expect(opened.structuredContent).toEqual({ project: id });
    const first = (await call('studio_snapshot', { project: id }))
      .structuredContent!;
    expect(first).toMatchObject({
      title: 'Card',
      revision: 2,
      last: { author: 'claude', label: 'Added C0' },
      questions: [{ author: 'claude', text: 'Is this right?' }],
    });
    expect(
      Buffer.from(first['picture'], 'base64').subarray(1, 4).toString(),
    ).toBe('PNG');
    const again = (await call('studio_snapshot', { project: id, revision: 2 }))
      .structuredContent!;
    expect(again['picture']).toBeUndefined();

    // The owner answers in the card, under their own name.
    const question = first['questions'][0].id as number;
    expect(
      (await call('answer_question', { project: id, question, text: 'Yes.' }))
        .isError,
    ).toBeFalsy();
    const answer = (await studio.notes(id)).notes.at(-1);
    expect(answer).toMatchObject({
      author: 'owner',
      text: 'Yes.',
      answers: question,
    });
    expect(
      (await call('studio_snapshot', { project: id, revision: 2 }))
        .structuredContent!['questions'],
    ).toEqual([]);
  });

  it('never lets an app without cards answer for the owner', async () => {
    const { call } = await connect(false);
    const id = (await studio.create({ author: 'owner', title: 'No card' }))
      .project;
    const asked = await studio.ask(id, { author: 'claude', text: 'Well?' });
    const r = await call('answer_question', {
      project: id,
      question: asked.question.id,
      text: 'Yes.',
    });
    expect(r.isError).toBe(true);
    expect((await studio.notes(id)).notes).toHaveLength(1);
  });

  it('shows the saved colored repeating wall once the square has a tile', async () => {
    const { call } = await connect(true);
    const id = (
      await studio.create({ author: 'ChatGPT', title: 'Square check' })
    ).project;
    await studio.edit(id, {
      author: 'ChatGPT',
      revision: 1,
      edit: {
        op: 'construct',
        add: [
          { kind: 'circle', name: 'C', centre: 'O', through: 'A' },
          { kind: 'line', name: 'H', from: 'O', to: 'A' },
          {
            kind: 'perpendicular',
            name: 'V',
            through: 'O',
            perpendicularTo: 'H',
          },
          { kind: 'point', name: 'N', meet: ['C', 'V'], pick: { angle: 90 } },
          { kind: 'point', name: 'W', meet: ['C', 'H'], pick: { angle: 180 } },
          { kind: 'point', name: 'S', meet: ['C', 'V'], pick: { angle: 270 } },
        ],
        remove: [],
      },
    });
    expect(
      (await call('studio_snapshot', { project: id })).structuredContent,
    ).toMatchObject({ pictureKind: 'construction' });
    await studio.edit(id, {
      author: 'ChatGPT',
      revision: 2,
      edit: {
        op: 'ink',
        add: [
          { from: 'A', to: 'N' },
          { from: 'N', to: 'W' },
          { from: 'W', to: 'S' },
          { from: 'S', to: 'A' },
        ],
        remove: [],
      },
    });
    await studio.edit(id, {
      author: 'ChatGPT',
      revision: 3,
      edit: { op: 'tile', vertices: ['A', 'N', 'W', 'S'] },
    });
    const view = await studio.view(id);
    const piece = view.drawing.tile?.pieces[0]?.id;
    if (!piece) throw new Error('The square has no tile piece');
    await studio.edit(id, {
      author: 'ChatGPT',
      revision: 4,
      edit: {
        op: 'paint',
        palette: null,
        colors: [{ piece, color: '#2453a6' }],
      },
    });
    const result = await call('studio_snapshot', { project: id, revision: 2 });
    const wall = await new DirectClient(studio).picture(
      `/projects/${id}/picture?what=wall&size=640`,
    );
    expect(result.structuredContent).toMatchObject({
      revision: 5,
      pictureKind: 'wall',
      picture: wall.data,
    });
    expect((await studio.view(id)).drawing.tile?.pieces[0]?.color).toBe(
      '#2453a6',
    );
  });

  it('serves the page built from the card’s current code', async () => {
    const { cardPage } = (await import(
      join(import.meta.dirname, '../../../tools/studio-card.mjs')
    )) as { cardPage: () => Promise<string> };
    const built = await readFile(
      join(import.meta.dirname, 'card/page.ts'),
      'utf8',
    );
    expect(built === (await cardPage()), 'run node tools/studio-card.mjs').toBe(
      true,
    );
  });
});
