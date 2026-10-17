// A stand-in chat app for the studio card's browser check: it shows the
// card's page in a frame through the MCP Apps host bridge, as claude.ai
// does, and passes the card's tool calls to a real studio MCP server.
// Usage: node --conditions=@tastir/source --import tsx apps/studio/e2e/card-host.mts <port>
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { CARD, createMcpServer } from '../src/mcp.js';
import { DirectClient } from '../src/routes.js';
import { Studio } from '../src/studio.js';

const repo = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const port = Number(process.argv[2] ?? 4398);
const studio = new Studio(
  await mkdtemp(join(tmpdir(), 'studio-card-')),
  join(repo, 'tutorials'),
);
const direct = new DirectClient(studio);
const server = createMcpServer(direct, { name: 'Claude', actor: 'c1' });
const client = new Client(
  { name: 'stand-in chat', version: '1' },
  {
    capabilities: {
      extensions: {
        'io.modelcontextprotocol/ui': {
          mimeTypes: ['text/html;profile=mcp-app'],
        },
      },
    } as never,
  },
);
const [a, b] = InMemoryTransport.createLinkedPair();
await Promise.all([server.connect(a), client.connect(b)]);
const card = String(
  ((await client.readResource({ uri: CARD })).contents[0] as { text: string })
    .text,
);

const { build } = createRequire(join(repo, 'apps/live-room/package.json'))(
  'esbuild',
);
const host = (
  await build({
    stdin: {
      contents: `
import { AppBridge, PostMessageTransport } from '@modelcontextprotocol/ext-apps/app-bridge';
const project = new URLSearchParams(location.search).get('project');
const frame = document.getElementById('card');
const bridge = new AppBridge(null, { name: 'Stand-in chat', version: '1' }, { serverTools: {} });
bridge.oncalltool = async (params) =>
  (await fetch('/call', { method: 'POST', body: JSON.stringify(params) })).json();
bridge.oninitialized = () => bridge.sendToolInput({ arguments: { project } });
await bridge.connect(new PostMessageTransport(frame.contentWindow, frame.contentWindow));
frame.srcdoc = await (await fetch('/card.html')).text();
`,
      resolveDir: join(repo, 'apps/studio'),
      loader: 'ts',
    },
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'browser',
    target: 'es2022',
  })
).outputFiles[0].text;

const body = async (request: import('node:http').IncomingMessage) => {
  const chunks: Buffer[] = [];
  for await (const c of request) chunks.push(c as Buffer);
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
};
createServer((request, response) => {
  void (async () => {
    const path = (request.url ?? '/').split('?')[0];
    if (path === '/card.html') {
      response.writeHead(200, { 'Content-Type': 'text/html' });
      return response.end(card);
    }
    if (path === '/call' && request.method === 'POST') {
      const params = await body(request);
      const result = await client.callTool(params);
      response.writeHead(200, { 'Content-Type': 'application/json' });
      return response.end(JSON.stringify(result));
    }
    if (path === '/__test/agent' && request.method === 'POST') {
      const q = await body(request);
      const value = await direct
        .call(q.method, q.path, q.data)
        .catch((e: Error) => ({ error: e.message }));
      response.writeHead(200, { 'Content-Type': 'application/json' });
      return response.end(JSON.stringify(value));
    }
    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.end(
      `<!doctype html><html><head><meta charset="utf-8"><title>Stand-in chat</title></head><body><h1>Stand-in chat</h1><iframe id="card" title="Studio card" sandbox="allow-scripts allow-forms" style="width:600px;height:760px;border:1px solid #999"></iframe><script type="module">${host}</script></body></html>`,
    );
  })().catch((e: Error) => {
    response.writeHead(500);
    response.end(e.message);
  });
}).listen(port, '127.0.0.1', () =>
  process.stdout.write(`Stand-in chat: http://127.0.0.1:${port}\n`),
);
