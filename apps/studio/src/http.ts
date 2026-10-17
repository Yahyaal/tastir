import { randomUUID, timingSafeEqual } from 'node:crypto';
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { StudioClient } from './client.js';
import { createMcpServer } from './mcp.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

/**
 * The studio's MCP server over Streamable HTTP, for agents that cannot
 * start a local program: claude.ai, ChatGPT, or any client reaching the
 * studio through a tunnel. Until sign-in exists (task H3) the address
 * itself is the key: /mcp/<key>, with a long random key kept in the
 * studio folder, because chat apps cannot send a header of their own.
 * Each connection is a session with its own server, and its edits carry
 * the name the client gives itself.
 */
export interface HttpOptions {
  readonly root: string;
  readonly key: string;
  readonly port?: number;
  readonly host?: string;
}

const MAX_SESSIONS = 32;
const IDLE = 60 * 60 * 1000;

const same = (a: string, b: string) =>
  Buffer.byteLength(a) === Buffer.byteLength(b) &&
  timingSafeEqual(Buffer.from(a), Buffer.from(b));

function fail(response: ServerResponse, status: number, message: string) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
  });
  response.end(
    JSON.stringify({
      jsonrpc: '2.0',
      error: { code: -32000, message },
      id: null,
    }),
  );
}

async function json(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 1_000_000) throw new Error('The request is too large.');
    chunks.push(Buffer.from(chunk));
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

/**
 * MCP sessions over Streamable HTTP: each connection gets its own server
 * and session, and a session answers only the one who opened it (`owner`:
 * the local key, or a signed-in connection's id).
 */
export function mcpSessions(
  make: (request: IncomingMessage) => {
    server: () => McpServer;
    owner: string;
  },
) {
  const sessions = new Map<
    string,
    { transport: StreamableHTTPServerTransport; used: number; owner: string }
  >();
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const s of sessions.values())
      if (now - s.used > IDLE) void s.transport.close();
  }, 60_000);
  sweep.unref();

  const handle = async (request: IncomingMessage, response: ServerResponse) => {
    try {
      // Chat apps call from their servers; a web page in a browser never
      // has any business here.
      if (request.headers.origin !== undefined)
        return fail(response, 403, 'Browser pages may not call the studio.');
      const made = make(request);
      const id = request.headers['mcp-session-id'];
      const known = typeof id === 'string' ? sessions.get(id) : undefined;
      if (known) {
        if (known.owner !== made.owner)
          return fail(response, 404, 'That session has ended. Connect again.');
        known.used = Date.now();
        const body =
          request.method === 'POST' ? await json(request) : undefined;
        return await known.transport.handleRequest(request, response, body);
      }
      if (request.method !== 'POST')
        return fail(response, 400, 'Start with an initialize request.');
      const body = await json(request);
      if (!isInitializeRequest(body))
        return fail(
          response,
          id ? 404 : 400,
          id
            ? 'That session has ended. Connect again.'
            : 'Start with an initialize request.',
        );
      if (sessions.size >= MAX_SESSIONS)
        return fail(response, 503, 'Too many agents are connected.');
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sid) => {
          sessions.set(sid, { transport, used: Date.now(), owner: made.owner });
        },
      });
      transport.onclose = () => {
        if (transport.sessionId) sessions.delete(transport.sessionId);
      };
      await made.server().connect(transport);
      await transport.handleRequest(request, response, body);
    } catch (error) {
      if (response.headersSent) {
        response.end();
        return;
      }
      fail(
        response,
        400,
        error instanceof SyntaxError
          ? 'The request was not valid JSON.'
          : error instanceof Error
            ? error.message
            : 'The studio could not finish this request.',
      );
    }
  };
  return {
    handle,
    close: async () => {
      clearInterval(sweep);
      await Promise.all([...sessions.values()].map((s) => s.transport.close()));
    },
  };
}

export async function startMcpHttp(options: HttpOptions) {
  if (options.key.length < 32) throw new Error('The MCP key is too short.');
  const client = new StudioClient(options.root);
  const sessions = mcpSessions(() => ({
    server: () => createMcpServer(client),
    owner: 'key',
  }));
  const server = createServer((request, response) => {
    const path = (request.url ?? '/').split('?')[0] ?? '/';
    const [first, key, ...rest] = path.split('/').filter(Boolean);
    if (first !== 'mcp' || !key || rest.length || !same(key, options.key))
      return fail(response, 404, 'There is nothing here.');
    void sessions.handle(request, response);
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(options.port ?? 0, options.host ?? '127.0.0.1', () => {
      server.off('error', reject);
      resolve();
    });
  });
  const address = server.address();
  if (!address || typeof address === 'string')
    throw new Error('The MCP server did not get a port.');
  return {
    url: `http://127.0.0.1:${address.port}/mcp/${options.key}`,
    close: async () => {
      await sessions.close();
      await new Promise<void>((resolve, reject) => {
        server.closeAllConnections();
        server.close((e) => (e ? reject(e) : resolve()));
      });
    },
  };
}
