import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { startMcpHttp } from './http.js';
import { startServer } from './server.js';
import { Studio } from './studio.js';
import { writeAtomic } from './store.js';

const tutorials = join(import.meta.dirname, '../../../tutorials');

describe('the studio over HTTP', () => {
  let root: string;
  let mcp: Awaited<ReturnType<typeof startMcpHttp>>;
  let close: () => Promise<void>;
  const key = randomBytes(32).toString('base64url');

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'studio-http-'));
    const secret = randomBytes(32).toString('base64url');
    const service = await startServer({
      studio: new Studio(root, tutorials),
      secret,
    });
    await writeAtomic(
      join(root, '.service.json'),
      JSON.stringify({ url: service.url, secret, pid: process.pid }),
    );
    mcp = await startMcpHttp({ root, key });
    close = async () => {
      await mcp.close();
      await service.close();
      await rm(root, { recursive: true, force: true });
    };
  });
  afterEach(() => close());

  it('lets a remote client draw, under the name it gives itself', async () => {
    const client = new Client({ name: 'claude-ai', version: '1.0.0' });
    await client.connect(new StreamableHTTPClientTransport(new URL(mcp.url)));
    const call = async (name: string, args: Record<string, unknown>) => {
      const r = (await client.callTool({ name, arguments: args })) as {
        isError?: boolean;
        content: { text: string }[];
      };
      expect(r.isError).toBeFalsy();
      return JSON.parse(r.content[0]!.text);
    };
    const tools = (await client.listTools()).tools.map((t) => t.name);
    expect(tools).toEqual(
      expect.arrayContaining(['construct', 'ask', 'wait_for_answer']),
    );
    const project = (await call('new_project', { title: 'Remote' }))
      .project as string;
    const done = await call('construct', {
      project,
      revision: 1,
      add: [{ kind: 'circle', name: 'C0', centre: 'O', through: 'A' }],
      command_id: 'remote-1',
    });
    expect(done.history.undo[0].author).toBe('claude-ai');
    await client.close();
  });

  it('answers only at its own address, and never to a web page', async () => {
    const initialize = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: { name: 'probe', version: '1' },
      },
    };
    const post = (url: string, headers: Record<string, string> = {}) =>
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
          ...headers,
        },
        body: JSON.stringify(initialize),
      });
    const wrong = mcp.url.replace(key, randomBytes(32).toString('base64url'));
    expect((await post(wrong)).status).toBe(404);
    expect(
      (await post(mcp.url, { Origin: 'https://example.com' })).status,
    ).toBe(403);
    const ok = await post(mcp.url);
    expect(ok.status).toBe(200);
    expect(ok.headers.get('mcp-session-id')).toBeTruthy();
  });
});
