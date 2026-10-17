import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { firstFailingStep } from '@tastir/engine';
import { parseTutorial } from '@tastir/schema';
import { createMcpServer } from './mcp.js';
import { StudioClient } from './client.js';
import { startServer } from './server.js';
import { Studio } from './studio.js';
import { writeAtomic } from './store.js';
import { loadModel } from './player.js';

const tutorials = join(import.meta.dirname, '../../../tutorials');

describe('the studio over MCP', () => {
  let root: string;
  let close: () => Promise<void>;
  let client: Client;
  let url: string;
  let secret: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'studio-'));
    secret = randomBytes(32).toString('base64url');
    const service = await startServer({
      studio: new Studio(root, tutorials),
      secret,
    });
    url = service.url;
    await writeAtomic(
      join(root, '.service.json'),
      JSON.stringify({ url, secret, pid: process.pid }),
    );
    const server = createMcpServer(new StudioClient(root));
    const [a, b] = InMemoryTransport.createLinkedPair();
    client = new Client({ name: 'claude-code', version: '1.0.0' });
    await Promise.all([server.connect(a), client.connect(b)]);
    close = async () => {
      await client.close();
      await service.close();
      await rm(root, { recursive: true, force: true });
    };
  });
  afterEach(() => close());

  const call = async (name: string, args: Record<string, unknown> = {}) => {
    const result = (await client.callTool({ name, arguments: args })) as {
      isError?: boolean;
      content: { text: string }[];
    };
    const text = result.content[0]!.text;
    return {
      error: result.isError ? text : undefined,
      value: result.isError ? undefined : JSON.parse(text),
    };
  };

  it('plays a recorded session that draws the square from O and A', async () => {
    const tools = (await client.listTools()).tools.map((t) => t.name);
    expect(tools).toEqual(
      expect.arrayContaining([
        'construct',
        'ink',
        'set_tile',
        'paint',
        'undo',
        'check',
        'note',
      ]),
    );
    const made = await call('new_project', {
      title: 'Studio square',
      fold: 4,
      goals: { fold: 4 },
    });
    const project = made.value.project as string;
    expect(made.value.revision).toBe(1);
    let r = await call('construct', {
      project,
      revision: 1,
      add: [
        { kind: 'circle', name: 'C0', centre: 'O', through: 'A' },
        { kind: 'line', name: 'L0', from: 'O', to: 'A' },
        {
          kind: 'intersection',
          name: 'W',
          first: 'L0',
          second: 'C0',
          angle: 180,
        },
        { kind: 'circle', name: 'C1', centre: 'A', through: 'W' },
        { kind: 'circle', name: 'C2', centre: 'W', through: 'A' },
        {
          kind: 'intersection',
          name: 'T',
          first: 'C1',
          second: 'C2',
          angle: 90,
        },
        {
          kind: 'intersection',
          name: 'B',
          first: 'C1',
          second: 'C2',
          angle: 270,
        },
        { kind: 'line', name: 'Axis', from: 'T', to: 'B' },
        {
          kind: 'intersection',
          name: 'N',
          first: 'Axis',
          second: 'C0',
          angle: 90,
        },
        {
          kind: 'intersection',
          name: 'S',
          first: 'Axis',
          second: 'C0',
          angle: 270,
        },
      ],
    });
    expect(r.error).toBeUndefined();
    expect(r.value.history.undo[0]).toMatchObject({
      author: 'claude-code',
      label: expect.stringContaining('Added C0'),
    });
    r = await call('ink', {
      project,
      revision: 2,
      add: [
        { from: 'A', to: 'N' },
        { from: 'N', to: 'W' },
        { from: 'W', to: 'S' },
        { from: 'S', to: 'A' },
      ],
    });
    r = await call('set_tile', {
      project,
      revision: 3,
      vertices: ['A', 'N', 'W', 'S'],
    });
    const piece = r.value.drawing.tile.pieces[0].id as string;
    r = await call('paint', {
      project,
      revision: 4,
      palette: null,
      colors: [{ piece, color: '#2453a6' }],
    });
    expect(r.value.revision).toBe(5);
    expect((await call('check', { project })).value.problems).toEqual([]);
    await call('note', { project, text: 'The square repeats; colored blue.' });
    expect(
      (await call('read_notes', { project })).value.notes[0],
    ).toMatchObject({ author: 'claude-code' });

    // The file Tastir opens is a normal pattern file that plays.
    const file = JSON.parse(
      await readFile(join(root, project, 'pattern.json'), 'utf8'),
    );
    expect(file).toMatchObject({ tastir: 'pattern', version: 1 });
    const tutorial = parseTutorial(file.tutorial);
    expect(firstFailingStep(tutorial)).toBeUndefined();
    expect(loadModel(tutorial).pattern.types).toHaveLength(1);
  });

  it('returns a refused edit to the agent so it can fix it', async () => {
    const project = (await call('new_project', { title: 'Refusals' })).value
      .project as string;
    const stale = await call('construct', {
      project,
      revision: 7,
      add: [{ kind: 'circle', name: 'C0', centre: 'O', through: 'A' }],
    });
    expect(stale.error).toMatch(/revision 7; it is now at revision 1/);
    const bad = await call('ink', {
      project,
      revision: 1,
      add: [{ from: 'O', to: 'Q' }],
    });
    expect(bad.error).toMatch(/“Q” is not a named point/);
    expect((await call('inspect', { project })).value.revision).toBe(1);
  });

  it('points at an element and asks the owner about it', async () => {
    const project = (await call('new_project', { title: 'Questions' })).value
      .project as string;
    await call('construct', {
      project,
      revision: 1,
      add: [{ kind: 'circle', name: 'C0', centre: 'O', through: 'A' }],
    });
    expect(
      (await call('point', { project, target: 'Q', label: 'here' })).error,
    ).toMatch(/no element “Q”/);
    const pointed = await call('point', {
      project,
      target: 'C0',
      label: 'The first circle',
    });
    expect(pointed.value.mark).toMatchObject({
      author: 'claude-code',
      target: 'C0',
    });

    // The owner answers while the agent waits.
    const service = (path: string, data: unknown) =>
      fetch(`${url}${path}`, {
        method: 'POST',
        headers: {
          'X-Tastir-Studio': secret,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    // Asking returns at once, so no client's tool time limit is reached.
    const started = Date.now();
    const asked = await call('ask', {
      project,
      question: 'Is this circle the right size?',
      about: 'C0',
    });
    expect(Date.now() - started).toBeLessThan(5000);
    const question = asked.value.question as number;
    expect(question).toBeGreaterThan(0);
    const waiting = call('wait_for_answer', { project, question, seconds: 20 });
    await new Promise((r) => setTimeout(r, 100));
    await service(`/projects/${project}/notes`, {
      author: 'owner',
      text: 'Yes, keep it.',
      answers: question,
    });
    expect((await waiting).value).toEqual({
      question,
      answer: 'Yes, keep it.',
    });

    const other = (await call('ask', { project, question: 'Anything else?' }))
      .value.question as number;
    const late = await call('wait_for_answer', {
      project,
      question: other,
      seconds: 0,
    });
    expect(late.value.answer).toBeNull();
    expect(
      (await call('wait_for_answer', { project, question: other, seconds: 46 }))
        .error,
    ).toBeDefined();
    await call('clear_marks', { project });
    const marks = await fetch(`${url}/projects/${project}/marks`, {
      headers: { 'X-Tastir-Studio': secret },
    });
    expect(((await marks.json()) as { marks: unknown[] }).marks).toEqual([]);
  });

  it('does a retried change once, and refuses an id reused for another', async () => {
    const project = (await call('new_project', { title: 'Retries' })).value
      .project as string;
    const circle = { kind: 'circle', name: 'C0', centre: 'O', through: 'A' };
    const first = await call('construct', {
      project,
      revision: 1,
      add: [circle],
      command_id: 'c-1',
    });
    expect(first.value.revision).toBe(2);
    // The answer was lost on the way back, so the agent sends it again.
    const again = await call('construct', {
      project,
      revision: 1,
      add: [circle],
      command_id: 'c-1',
    });
    expect(again.error).toBeUndefined();
    expect(again.value.revision).toBe(2);
    expect(again.value.repeated.revision).toBe(2);
    expect(again.value.history.undo).toHaveLength(1);
    const reused = await call('construct', {
      project,
      revision: 2,
      add: [{ ...circle, name: 'C1' }],
      command_id: 'c-1',
    });
    expect(reused.error).toMatch(/already used for a different request/);

    const note = { project, text: 'Done the circle.', command_id: 'n-1' };
    const posted = (await call('note', note)).value.note.id as number;
    const repost = (await call('note', note)).value;
    expect(repost.note.id).toBe(posted);
    expect(repost.repeated).toBeDefined();
    expect((await call('read_notes', { project })).value.notes).toHaveLength(1);

    // Undo with a command id is also done once.
    const undo = { project, revision: 2, command_id: 'u-1' };
    expect((await call('undo', undo)).value.revision).toBe(3);
    expect((await call('undo', undo)).value.revision).toBe(3);
  });

  it('keeps every default picture small enough for a chat app', async () => {
    const project = (
      await call('new_project', {
        title: 'Pictures',
        from_tutorial: 'eight-fold-star-and-cross',
      })
    ).value.project as string;
    await call('set_reference', {
      project,
      path: 'apps/player/public/photos/cairo-minbar-doors-met.jpg',
    });
    for (const what of ['construction', 'reference', 'overlay']) {
      const result = (await client.callTool({
        name: 'view',
        arguments: { project, what },
      })) as {
        content: { type: string; data?: string; text?: string }[];
      };
      const image = result.content.find((c) => c.type === 'image');
      expect(image?.data?.length).toBeLessThan(100_000);
      expect(result.content.find((c) => c.type === 'text')?.text).toMatch(
        /not the owner's screen/,
      );
    }
  });

  it('starts from a library tutorial', async () => {
    const made = await call('new_project', {
      title: 'From the library',
      from_tutorial: 'eight-fold-star-and-cross',
      up_to_step: 2,
    });
    expect(made.value.drawing.steps).toHaveLength(2);
  });

  it('refuses requests without the secret or from another site', async () => {
    expect((await fetch(`${url}/projects`)).status).toBe(403);
    const other = await fetch(`${url}/projects`, {
      headers: { 'X-Tastir-Studio': secret, Origin: 'https://example.com' },
    });
    expect(other.status).toBe(403);
    const ok = await fetch(`${url}/projects`, {
      headers: { 'X-Tastir-Studio': secret },
    });
    expect(ok.status).toBe(200);
  });
});
