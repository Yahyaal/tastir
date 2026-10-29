// The hosted studio on this computer, for its browser checks: the hosted
// build of Tastir, the hosted server with an in-process Postgres (PGlite)
// and a stand-in Google, and a test-only door for a pretend agent.
// Usage: pnpm studio:hosted:test  (TASTIR_HOSTED_PORT, default 4396)
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hostedApp } from '../apps/studio/src/hosted.js';
import type { PgBackend } from '../apps/studio/src/pg.js';
import { DirectClient } from '../apps/studio/src/routes.js';
import { OWNER, standInGoogle } from '../apps/studio/src/standin.js';
import { Studio } from '../apps/studio/src/studio.js';
import { testBackend } from '../apps/studio/src/testing.js';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env['TASTIR_HOSTED_PORT'] ?? 4396);
const site = join(repo, 'dist', 'studio-hosted');

if (!process.argv.includes('--no-build'))
  execFileSync(
    'pnpm',
    [
      'exec',
      'vite',
      'build',
      '--config',
      'apps/player/vite.config.mts',
      '--outDir',
      site,
      '--emptyOutDir',
    ],
    {
      cwd: repo,
      stdio: 'inherit',
      env: { ...process.env, VITE_TASTIR_STUDIO: 'hosted' },
    },
  );

const store = await testBackend('pglite');
const google = await standInGoogle();
const studio = new Studio(store.root, join(repo, 'tutorials'), store.backend);
// The live room, when the browser checks start one (wrangler dev).
const live =
  process.env['TASTIR_HOSTED_LIVE_ORIGIN'] &&
  process.env['TASTIR_HOSTED_LIVE_SECRET']
    ? {
        roomOrigin: process.env['TASTIR_HOSTED_LIVE_ORIGIN'],
        secret: process.env['TASTIR_HOSTED_LIVE_SECRET'],
      }
    : undefined;
const hosted = hostedApp({
  // Only this local fixture supplies a fake verifier. Production never accepts these tokens.
  feedback: {
    enabled: true,
    siteKey: 'fixture-feedback-key',
    contact: 'owner@fixture.invalid',
    verify: async (token) => token === 'fixture-feedback-token',
    images: (() => {
      const files = new Map<string, Buffer>();
      return {
        put: async (key: string, bytes: Buffer) => {
          files.set(key, bytes);
        },
        get: async (key: string) => {
          const value = files.get(key);
          if (!value) throw new Error('No fixture image');
          return value;
        },
        remove: async (key: string) => {
          files.delete(key);
        },
      };
    })(),
  },
  studio,
  db: (store.backend as PgBackend).db,
  baseUrl: new URL(`http://127.0.0.1:${port}`),
  allow: [OWNER],
  secret: 'a-session-secret-for-the-browser-checks-only',
  google: google.google,
  site,
  ...(live ? { live } : {}),
});

// A pretend agent, only in this test server: it calls the studio as an
// agent's tools do.
const agent = new DirectClient(studio);
createServer((request, response) => {
  // Points the server at a room that is not there, to check that pages
  // keep up without it, or back at the real one.
  if (request.url?.startsWith('/__test/room') && live) {
    const origin =
      new URL(request.url, 'http://x').searchParams.get('origin') || null;
    live.roomOrigin =
      origin ?? process.env['TASTIR_HOSTED_LIVE_ORIGIN'] ?? live.roomOrigin;
    response.end('ok');
    return;
  }
  if (request.url !== '/__test/agent' || request.method !== 'POST')
    return hosted.app(request, response);
  const chunks: Buffer[] = [];
  request.on('data', (c: Buffer) => chunks.push(c));
  request.on('end', () => {
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    agent
      .call(body.method, body.path, body.data)
      .then((value) => [200, value] as const)
      .catch((e: Error) => [400, { error: e.message }] as const)
      .then(([status, value]) => {
        response.writeHead(status, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify(value));
      });
  });
}).listen(port, '127.0.0.1', () =>
  process.stdout.write(`Hosted studio test server: http://127.0.0.1:${port}\n`),
);
