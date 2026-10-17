import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { chromium } from '@playwright/test';
import { createConnectionTicket, notifyRevision } from '../dist/server.js';

// Standalone test fixture, not Studio auth or a product page.
const origin = 'http://127.0.0.1:8798';
const roomOrigin = 'http://127.0.0.1:8797';
const variables = await readFile(
  new URL('../.dev.vars', import.meta.url),
  'utf8',
);
const secret = /^LIVE_ROOM_SECRET="?([a-f\d]{64})"?$/im.exec(variables)?.[1];
assert.ok(secret, 'Run setup:local first');
const project = `browser-${randomUUID()}`;
let revision = 0;
let reads = 0;
let available = true;
const pageHtml = `<!doctype html><title>Live room test fixture</title><p id="revision">Loading</p>
<script type="module">
import { watchProject } from '/client.js';
window.start = () => watchProject({
  project: ${JSON.stringify(project)},
  getTicket: async (signal) => (await fetch('/ticket', { signal, cache: 'no-store' })).json(),
  refresh: async (signal) => {
    const data = await (await fetch('/project', { signal, cache: 'no-store' })).json();
    if (!signal.aborted) document.querySelector('#revision').textContent = String(data.revision);
    return data.revision;
  },
  onStatus: (status) => { window.roomStatus = status; },
});
window.stop = window.start();
</script>`;
const server = createServer((request, response) => {
  void (async () => {
    response.setHeader('Cache-Control', 'no-store');
    if (request.url === '/') {
      response.setHeader('Content-Type', 'text/html');
      response.end(pageHtml);
    } else if (request.url === '/client.js' || request.url === '/protocol.js') {
      response.setHeader('Content-Type', 'text/javascript');
      response.end(
        await readFile(new URL(`../dist${request.url}`, import.meta.url)),
      );
    } else if (request.url === '/ticket') {
      response.setHeader('Content-Type', 'application/json');
      response.end(
        JSON.stringify(
          await createConnectionTicket({
            secret,
            project,
            origin,
            roomOrigin: available ? roomOrigin : 'http://127.0.0.1:8799',
          }),
        ),
      );
    } else if (request.url === '/project') {
      reads++;
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ revision }));
    } else {
      response.statusCode = 404;
      response.end();
    }
  })().catch(() => {
    response.statusCode = 500;
    response.end('Fixture request failed');
  });
});
await new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(8798, '127.0.0.1', resolve);
});
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(origin);
  await page.waitForFunction(() => window.roomStatus === 'live', undefined, {
    timeout: 10_000,
  });
  await page.waitForFunction(
    () => document.querySelector('#revision').textContent === '0',
  );
  const started = performance.now();
  revision = 1;
  assert.equal(
    await notifyRevision({ secret, project, revision, roomOrigin }),
    true,
  );
  await page.waitForFunction(
    () => document.querySelector('#revision').textContent === '1',
    undefined,
    { timeout: 5000 },
  );
  const hintToRenderMs = Math.round(performance.now() - started);
  // Reopen against an unreachable port, then change the source AFTER fallback starts.
  await page.evaluate(() => window.stop());
  available = false;
  await page.evaluate(() => {
    window.stop = window.start();
  });
  await page.waitForFunction(() => window.roomStatus === 'polling', undefined, {
    timeout: 10_000,
  });
  const pollingStarted = performance.now();
  revision = 2;
  await page.waitForFunction(
    () => document.querySelector('#revision').textContent === '2',
    undefined,
    { timeout: 7000 },
  );
  const pollingToRenderMs = Math.round(performance.now() - pollingStarted);
  await page.evaluate(() => window.stop());
  await page.waitForTimeout(100);
  const afterStop = reads;
  await page.waitForTimeout(3300);
  assert.equal(reads, afterStop, 'Cleanup must stop polling');
  console.log(
    JSON.stringify({
      nativeSocket: 'pass',
      hintToRenderMs,
      unreachableRoomPolling: 'pass',
      pollingToRenderMs,
      cleanup: 'pass',
      fixture: 'simulated Studio state; actual browser and Worker',
    }),
  );
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
