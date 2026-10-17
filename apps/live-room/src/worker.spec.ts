import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Miniflare, type WebSocket as TestSocket } from 'miniflare';
import { build } from 'esbuild';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { issueRoomTicket, signRevisionNotification } from './server.js';
import { ROOM_PROTOCOL } from './protocol.js';
const secret = 'ab'.repeat(32);
const origin = 'http://127.0.0.1:4293';
let mf: Miniflare;
let directory: string;
const sockets: TestSocket[] = [];
function nextMessage(socket: TestSocket): Promise<string> {
  const message = new Promise<string>((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.removeEventListener('message', listener);
      reject(new Error('No room message'));
    }, 3000);
    function listener(event: { data: unknown }): void {
      clearTimeout(timer);
      socket.removeEventListener('message', listener);
      resolve(String(event.data));
    }
    socket.addEventListener('message', listener);
  });
  // A preceding assertion may fail before the test awaits this message.
  void message.catch(() => undefined);
  return message;
}
async function headers(
  project: string,
  overrides: Parameters<typeof issueRoomTicket>[0] = {
    secret,
    project,
    origin,
  },
): Promise<Record<string, string>> {
  const { ticket } = await issueRoomTicket(overrides);
  return {
    Upgrade: 'websocket',
    Origin: origin,
    'Sec-WebSocket-Protocol': `${ROOM_PROTOCOL}, ticket.${ticket}`,
  };
}
async function open(
  project: string,
  options?: Parameters<typeof issueRoomTicket>[0],
): Promise<TestSocket> {
  const response = await mf.dispatchFetch(
    `http://room/projects/${project}/connect`,
    { headers: await headers(project, options) },
  );
  expect(response.status).toBe(101);
  expect(response.headers.get('Sec-WebSocket-Protocol')).toBe(ROOM_PROTOCOL);
  const socket = response.webSocket!;
  sockets.push(socket);
  const ready = nextMessage(socket);
  socket.accept();
  expect(JSON.parse(await ready)).toMatchObject({ type: 'ready', project });
  return socket;
}
async function publish(project: string, revision: number, token?: string) {
  return mf.dispatchFetch(`http://room/projects/${project}/revisions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token ?? (await signRevisionNotification({ secret, project, revision }))}`,
    },
  });
}
beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), 'tastir-room-'));
  const scriptPath = join(directory, 'worker.mjs');
  await build({
    entryPoints: [new URL('./worker.ts', import.meta.url).pathname],
    outfile: scriptPath,
    bundle: true,
    format: 'esm',
    platform: 'browser',
    external: ['cloudflare:workers'],
  });
  mf = new Miniflare({
    telemetry: { enabled: false },
    workers: [
      {
        config: {
          name: 'tastir-live-room',
          compatibilityDate: '2026-07-01',
          manifest: {
            mainModule: 'worker.mjs',
            modules: {
              'worker.mjs': {
                type: 'esm',
                contents: await readFile(scriptPath, 'utf8'),
              },
            },
          },
          env: {
            LIVE_ROOM_SECRET: { type: 'text', value: secret },
            STUDIO_ORIGINS: { type: 'text', value: origin },
            ROOMS: {
              type: 'durable-object',
              worker: 'tastir-live-room',
              exportName: 'ProjectRoom',
            },
          },
          exports: {
            ProjectRoom: { type: 'durable-object', storage: 'sqlite' },
          },
        },
      },
    ],
  });
  await mf.ready;
});
afterAll(async () => {
  for (const socket of sockets) {
    try {
      socket.close();
    } catch {
      /* Already closed. */
    }
  }
  await mf?.dispose();
  if (directory) await rm(directory, { recursive: true, force: true });
});
describe('real local Durable Object rooms', () => {
  it('refuses unsigned requests and missing origins, and does not put credentials in URLs', async () => {
    expect((await mf.dispatchFetch('http://room/health')).status).toBe(200);
    expect(
      (
        await mf.dispatchFetch('http://room/projects/auth/connect', {
          headers: { Upgrade: 'websocket' },
        })
      ).status,
    ).toBe(403);
    expect((await publish('auth', 1, 'forged')).status).toBe(403);
    expect(
      (
        await mf.dispatchFetch(
          'http://room/projects/auth/connect?ticket=secret',
          { headers: await headers('auth') },
        )
      ).status,
    ).toBe(404);
    expect(
      (
        await mf.dispatchFetch('http://room/projects/auth/connect', {
          headers: await headers('auth', {
            secret,
            project: 'different',
            origin,
          }),
        })
      ).status,
    ).toBe(403);
    const badOrigin = await headers('auth');
    badOrigin.Origin = 'https://attacker.example';
    expect(
      (
        await mf.dispatchFetch('http://room/projects/auth/connect', {
          headers: badOrigin,
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await mf.dispatchFetch('http://room/projects/auth/connect', {
          headers: await headers('auth', {
            secret,
            project: 'auth',
            origin,
            nowSeconds: Math.floor(Date.now() / 1000) - 120,
            ttlSeconds: 60,
          }),
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await mf.dispatchFetch('http://room/projects/auth/connect', {
          headers: await headers('auth', {
            secret,
            project: 'auth',
            origin: 'https://elsewhere.example',
          }),
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await publish(
          'auth',
          1,
          await signRevisionNotification({
            secret,
            project: 'different',
            revision: 1,
          }),
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await publish(
          'auth',
          1,
          await signRevisionNotification({
            secret: 'cd'.repeat(32),
            project: 'auth',
            revision: 1,
          }),
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await publish(
          'auth',
          1,
          await signRevisionNotification({
            secret,
            project: 'auth',
            revision: 1,
            nowSeconds: Math.floor(Date.now() / 1000) - 120,
          }),
        )
      ).status,
    ).toBe(403);
    const pageTicket = await issueRoomTicket({
      secret,
      project: 'auth',
      origin,
    });
    expect((await publish('auth', 1, pageTicket.ticket)).status).toBe(403);
    const revision = await signRevisionNotification({
      secret,
      project: 'auth',
      revision: 1,
    });
    expect(
      (
        await mf.dispatchFetch('http://room/projects/auth/connect', {
          headers: {
            Upgrade: 'websocket',
            Origin: origin,
            'Sec-WebSocket-Protocol': `${ROOM_PROTOCOL}, ticket.${revision}`,
          },
        })
      ).status,
    ).toBe(403);
    const token = await signRevisionNotification({
      secret,
      project: 'auth',
      revision: 1,
    });
    expect(
      (
        await mf.dispatchFetch('http://room/projects/auth/revisions', {
          method: 'POST',
          headers: { Origin: origin, Authorization: `Bearer ${token}` },
        })
      ).status,
    ).toBe(403);
  });
  it('broadcasts only to the project, de-duplicates retries and keeps the latest revision', async () => {
    const a = await open('fanout');
    const b = await open('fanout');
    const other = await open('elsewhere');
    const unrelated: unknown[] = [];
    other.addEventListener('message', (e) => unrelated.push(e.data));
    const first = nextMessage(a);
    const second = nextMessage(b);
    expect((await publish('fanout', 2)).status).toBe(202);
    expect(JSON.parse(await first)).toEqual({
      type: 'revision',
      project: 'fanout',
      revision: 2,
    });
    expect(JSON.parse(await second)).toMatchObject({ revision: 2 });
    expect(await (await publish('fanout', 2)).json()).toEqual({
      accepted: false,
      revision: 2,
    });
    expect(await (await publish('fanout', 1)).json()).toEqual({
      accepted: false,
      revision: 2,
    });
    expect(unrelated).toEqual([]);
    const responses = await Promise.all([
      publish('fanout', 4),
      publish('fanout', 3),
    ]);
    expect(responses.every((r) => r.ok)).toBe(true);
    const latest = await mf.dispatchFetch(
      'http://room/projects/fanout/connect',
      { headers: await headers('fanout') },
    );
    const joined = latest.webSocket!;
    sockets.push(joined);
    const ready = nextMessage(joined);
    joined.accept();
    expect(JSON.parse(await ready)).toMatchObject({ revision: 4 });
  });
  it('rehydrates sockets and revision storage after actual hibernating eviction', async () => {
    const socket = await open('hibernation');
    const initial = nextMessage(socket);
    await publish('hibernation', 1);
    await initial;
    await mf.unsafeEvictDurableObject('tastir-live-room', 'ProjectRoom', {
      name: 'hibernation',
      webSockets: 'hibernate',
    });
    const next = nextMessage(socket);
    expect((await publish('hibernation', 2)).status).toBe(202);
    expect(JSON.parse(await next)).toEqual({
      type: 'revision',
      project: 'hibernation',
      revision: 2,
    });
    expect(await (await publish('hibernation', 1)).json()).toEqual({
      accepted: false,
      revision: 2,
    });
  });
  it('uses the runtime ping response and refuses client-originated revision messages', async () => {
    const socket = await open('read-only');
    const pong = nextMessage(socket);
    socket.send('ping');
    expect(await pong).toBe('pong');
    const closed = new Promise<number>((resolve) =>
      socket.addEventListener('close', (event) => resolve(event.code), {
        once: true,
      }),
    );
    socket.send(
      JSON.stringify({ type: 'revision', project: 'read-only', revision: 900 }),
    );
    expect(await closed).toBe(1008);
    expect(await (await publish('read-only', 1)).json()).toEqual({
      accepted: true,
      revision: 1,
    });
  });
  it('never sends revisions to a socket after its ticket lease expires', async () => {
    const socket = await open('expiry', {
      secret,
      project: 'expiry',
      origin,
      ttlSeconds: 1,
    });
    const messages: unknown[] = [];
    socket.addEventListener('message', (event) => messages.push(event.data));
    await new Promise((resolve) => setTimeout(resolve, 1100));
    const renewed = await open('expiry');
    const delivered = nextMessage(renewed);
    expect((await publish('expiry', 1)).status).toBe(202);
    expect(JSON.parse(await delivered)).toMatchObject({ revision: 1 });
    // A completed close handshake is transport-dependent. The authorization
    // guarantee is that an expired lease gets no data while a fresh peer does.
    expect(messages).toEqual([]);
  });
});
