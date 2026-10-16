import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { StudioError } from './ops.js';
import {
  EditRequest,
  NewShape,
  NoteRequest,
  Studio,
  TravelRequest,
} from './studio.js';

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

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function body(request: IncomingMessage): Promise<unknown> {
  if (request.headers['content-type']?.split(';')[0] !== 'application/json')
    throw new HttpError(415, 'Send application/json.');
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 8_000_000) throw new HttpError(413, 'The request is too large.');
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
      const parts = url.pathname.split('/').filter(Boolean);
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
      if (method === 'GET' && url.pathname === '/projects')
        return send(response, 200, await studio.list());
      if (method === 'GET' && url.pathname === '/library')
        return send(response, 200, await studio.library());
      if (method === 'POST' && url.pathname === '/projects')
        return send(
          response,
          200,
          await studio.create(NewShape.parse(await body(request))),
        );
      if (parts[0] === 'projects' && parts[1]) {
        const id = parts[1];
        const what = parts[2] ?? '';
        if (method === 'GET' && what === '')
          return send(response, 200, await studio.view(id));
        if (method === 'GET' && what === 'draft')
          return send(response, 200, await studio.draft(id));
        if (method === 'GET' && what === 'check')
          return send(response, 200, await studio.check(id));
        if (method === 'GET' && what === 'notes')
          return send(
            response,
            200,
            await studio.notes(
              id,
              Number(url.searchParams.get('after') ?? 0) || 0,
            ),
          );
        if (method === 'POST' && what === 'edit')
          return send(
            response,
            200,
            await studio.edit(id, EditRequest.parse(await body(request))),
          );
        if (method === 'POST' && what === 'travel')
          return send(
            response,
            200,
            await studio.travel(id, TravelRequest.parse(await body(request))),
          );
        if (method === 'POST' && what === 'notes')
          return send(
            response,
            200,
            await studio.note(id, NoteRequest.parse(await body(request))),
          );
      }
      throw new HttpError(404, 'There is no such studio address.');
    })().catch((error: unknown) => {
      if (response.headersSent) return response.end();
      if (error instanceof HttpError)
        return send(response, error.status, { error: error.message });
      if (error instanceof StudioError)
        return send(response, 400, { error: error.message });
      if (error instanceof z.ZodError)
        return send(response, 400, {
          error: `The request did not match: ${error.issues
            .slice(0, 3)
            .map((i) => `${i.path.join('.') || 'request'}: ${i.message}`)
            .join('; ')}`,
        });
      console.error(error);
      send(response, 500, {
        error: 'The studio could not finish this request.',
      });
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
