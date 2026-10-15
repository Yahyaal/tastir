import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { StartShape, ContinueShape } from '@tastir/agent-protocol';
import { StateStore } from './store.js';
import { ChatGPTAuth } from './auth.js';
import { AgentRuntime } from './inference.js';
import { AgentError, publicError } from './errors.js';

interface Options {
  directory: string;
  secret: string;
  appOrigin: string;
  port?: number;
  fetcher?: typeof fetch;
}
const sameSecret = (actual: string, expected: string) =>
  Buffer.byteLength(actual) === Buffer.byteLength(expected) &&
  timingSafeEqual(Buffer.from(actual), Buffer.from(expected));

async function body(request: IncomingMessage): Promise<unknown> {
  if (request.headers['content-type']?.split(';')[0] !== 'application/json')
    throw new AgentError(
      'json_required',
      'Use an application/json request.',
      415,
    );
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 6_000_000)
      throw new AgentError(
        'request_too_large',
        'The drawing image is too large. Fit the drawing and try again.',
        413,
      );
    chunks.push(Buffer.from(chunk));
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new AgentError(
      'invalid_json',
      'The local request was not valid JSON.',
    );
  }
}

function json(response: ServerResponse, value: unknown, status = 200) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
  });
  response.end(JSON.stringify(value));
}

export async function createCompanion(options: Options) {
  if (options.secret.length < 32)
    throw new Error('A local connection secret is required.');
  const appUrl = new URL(options.appOrigin);
  if (
    appUrl.protocol !== 'http:' ||
    !['localhost', '127.0.0.1'].includes(appUrl.hostname) ||
    appUrl.origin !== options.appOrigin
  )
    throw new Error('The assistant app must use an HTTP loopback origin.');
  const store = await StateStore.open(options.directory);
  const auth = new ChatGPTAuth(store, options.fetcher);
  const runtime = new AgentRuntime(auth, options.fetcher);
  let port = 0;
  const server = createServer((request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    const controller = new AbortController();
    request.on('aborted', () => controller.abort());
    response.on('close', () => {
      if (!response.writableEnded) controller.abort();
    });
    void (async () => {
      if (request.headers.host !== `127.0.0.1:${port}`)
        throw new AgentError(
          'host_rejected',
          'This local assistant host is not allowed.',
          403,
        );
      const url = new URL(request.url ?? '/', `http://127.0.0.1:${port}`);
      if (url.pathname === '/auth/callback' && request.method === 'GET') {
        try {
          await auth.callback(url.searchParams);
          runtime.cancelAll();
          response.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8',
            'Content-Security-Policy':
              "default-src 'none'; frame-ancestors 'none'",
          });
          response.end(
            '<!doctype html><title>Tastir connected</title><h1>ChatGPT connected</h1><p>Return to the Tastir tab. You can close this window.</p>',
          );
        } catch (error) {
          const safe = publicError(error);
          response.writeHead(safe.status, {
            'Content-Type': 'text/plain; charset=utf-8',
          });
          response.end(safe.message);
        }
        return;
      }
      if (
        !sameSecret(
          String(request.headers['x-tastir-bridge'] ?? ''),
          options.secret,
        ) ||
        (request.headers.origin !== undefined &&
          request.headers.origin !== options.appOrigin) ||
        request.headers['sec-fetch-site'] === 'cross-site'
      )
        throw new AgentError(
          'connection_rejected',
          'This request did not come from the paired Tastir app.',
          403,
        );
      const path = url.pathname;
      if (path === '/status' && request.method === 'GET') {
        json(response, auth.status());
        return;
      }
      if (path === '/models' && request.method === 'GET') {
        json(
          response,
          await runtime.models(
            AbortSignal.any([controller.signal, AbortSignal.timeout(20_000)]),
          ),
        );
        return;
      }
      if (request.method !== 'POST')
        throw new AgentError(
          'route_missing',
          'This assistant endpoint does not exist.',
          404,
        );
      const data = await body(request);
      if (path === '/auth/start') {
        const parsed = z
          .strictObject({ profileId: z.string().optional() })
          .parse(data);
        json(response, {
          url: auth.start(
            `http://127.0.0.1:${port}/auth/callback`,
            parsed.profileId,
          ),
        });
        return;
      }
      if (path === '/auth/cancel') {
        auth.cancelSignIn();
        json(response, auth.status());
        return;
      }
      if (path === '/auth/select') {
        const { profileId } = z
          .strictObject({ profileId: z.string() })
          .parse(data);
        runtime.cancelAll();
        await auth.select(profileId);
        json(response, auth.status());
        return;
      }
      if (path === '/auth/disconnect') {
        runtime.cancelAll();
        await auth.disconnect();
        json(response, auth.status());
        return;
      }
      const tab = request.headers['x-tastir-tab'];
      if (typeof tab !== 'string' || !z.uuid().safeParse(tab).success)
        throw new AgentError(
          'tab_missing',
          'A valid local tab connection is required.',
          403,
        );
      if (path === '/turn/start') {
        const parsed = StartShape.parse(data);
        json(
          response,
          await runtime.start(
            tab,
            parsed.model,
            parsed.prompt,
            parsed.snapshot,
            controller.signal,
            parsed.requestId,
          ),
        );
        return;
      }
      if (path === '/turn/continue') {
        const parsed = ContinueShape.parse(data);
        json(
          response,
          await runtime.resume(
            tab,
            parsed.runId,
            parsed.results,
            controller.signal,
          ),
        );
        return;
      }
      if (path === '/turn/cancel') {
        const { runId } = z.strictObject({ runId: z.uuid() }).parse(data);
        runtime.cancel(runId, tab);
        json(response, { stopped: true });
        return;
      }
      throw new AgentError(
        'route_missing',
        'This assistant endpoint does not exist.',
        404,
      );
    })().catch((error) => {
      if (response.destroyed) return;
      const safe =
        error instanceof z.ZodError
          ? {
              code: 'invalid_request',
              message:
                'The assistant request did not match its expected format.',
              status: 400,
            }
          : controller.signal.aborted
            ? {
                code: 'cancelled',
                message: 'The assistant request was stopped.',
                status: 499,
              }
            : publicError(error);
      json(
        response,
        { error: { code: safe.code, message: safe.message } },
        safe.status,
      );
    });
  });
  server.requestTimeout = 30_000;
  server.headersTimeout = 10_000;
  try {
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(options.port ?? 0, '127.0.0.1', () => {
        server.off('error', reject);
        resolve();
      });
    });
  } catch (error) {
    await store.close();
    throw error;
  }
  const address = server.address();
  if (!address || typeof address === 'string')
    throw new Error('The companion did not bind a local port.');
  port = address.port;
  return {
    url: `http://127.0.0.1:${port}`,
    auth,
    runtime,
    async close() {
      runtime.cancelAll();
      auth.shutdown();
      server.closeAllConnections();
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
      await store.close();
    },
  };
}
