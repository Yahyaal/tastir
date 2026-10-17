import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { HttpError, failure, route } from './routes.js';
import type { Studio } from './studio.js';

/**
 * The studio's local web service. It listens on 127.0.0.1 only, and every
 * request needs the secret the launcher hands to the MCP server and to the
 * Tastir dev server, so no other website can reach a drawing.
 */
export interface ServerOptions {
  studio: Studio;
  secret: string;
  /** The Tastir dev server's origin, the one browser page allowed in. */
  appOrigin?: string;
  port?: number;
}

const same = (a: string, b: string) =>
  Buffer.byteLength(a) === Buffer.byteLength(b) &&
  timingSafeEqual(Buffer.from(a), Buffer.from(b));

async function body(request: IncomingMessage): Promise<unknown> {
  if (request.headers['content-type']?.split(';')[0] !== 'application/json')
    throw new HttpError(415, 'Send application/json.');
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 24_000_000)
      throw new HttpError(413, 'The request is too large.');
    chunks.push(Buffer.from(chunk));
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, 'The request was not valid JSON.');
  }
}

function send(response: ServerResponse, status: number, value: unknown) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
  });
  response.end(JSON.stringify(value));
}

export async function startServer(options: ServerOptions) {
  if (options.secret.length < 32)
    throw new Error('The studio needs a long secret.');
  const { studio } = options;
  let port = 0;
  const server = createServer((request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    void (async () => {
      if (request.headers.host !== `127.0.0.1:${port}`)
        throw new HttpError(403, 'This host is not allowed.');
      const origin = request.headers.origin;
      if (
        !same(
          String(request.headers['x-tastir-studio'] ?? ''),
          options.secret,
        ) ||
        (origin !== undefined && origin !== options.appOrigin) ||
        request.headers['sec-fetch-site'] === 'cross-site'
      )
        throw new HttpError(
          403,
          'This request did not come from Tastir or its studio tools.',
        );
      const url = new URL(request.url ?? '/', `http://127.0.0.1:${port}`);
      const method = request.method ?? 'GET';
      if (method === 'GET' && url.pathname === '/events') {
        response.writeHead(200, {
          'Content-Type': 'text/event-stream; charset=utf-8',
          Connection: 'keep-alive',
        });
        response.write(': connected\n\n');
        const unsubscribe = studio.subscribe((event) =>
          response.write(`data: ${JSON.stringify(event)}\n\n`),
        );
        const beat = setInterval(() => response.write(': beat\n\n'), 25_000);
        request.on('close', () => {
          clearInterval(beat);
          unsubscribe();
        });
        return;
      }
      const answer = await route(studio, method, url, () => body(request));
      if (answer.kind === 'png') {
        response.writeHead(200, {
          'Content-Type': 'image/png',
          'X-Tastir-Revision': String(answer.revision),
          'X-Tastir-Size': String(answer.size),
        });
        response.end(answer.png);
        return;
      }
      return send(response, 200, answer.value);
    })().catch((error: unknown) => {
      if (response.headersSent) {
        response.end();
        return;
      }
      const { status, error: message } = failure(error);
      send(response, status, { error: message });
    });
  });
  server.headersTimeout = 10_000;
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(options.port ?? 0, '127.0.0.1', () => {
      server.off('error', reject);
      resolve();
    });
  });
  const address = server.address();
  if (!address || typeof address === 'string')
    throw new Error('The studio did not get a port.');
  port = address.port;
  return {
    url: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.closeAllConnections();
        server.close((e) => (e ? reject(e) : resolve()));
      }),
  };
}
