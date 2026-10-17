import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import {
  createConnectionTicket,
  signRevisionNotification,
} from '../dist/server.js';

// Only talks to the local development server; never deploys or reads a Cloudflare account.
const origin = 'http://127.0.0.1:8797';
const variables = await readFile(
  new URL('../.dev.vars', import.meta.url),
  'utf8',
);
const secret = /^LIVE_ROOM_SECRET="?([a-f\d]{64})"?$/im.exec(variables)?.[1];
assert.ok(secret, 'Run setup:local first');
const project = `smoke-${randomUUID()}`;
assert.equal((await fetch(`${origin}/health`)).status, 200);
assert.equal(
  (await fetch(`${origin}/projects/${project}/revisions`, { method: 'POST' }))
    .status,
  403,
);
const token = await signRevisionNotification({ secret, project, revision: 1 });
const started = performance.now();
const response = await fetch(`${origin}/projects/${project}/revisions`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
});
assert.equal(response.status, 202);
assert.deepEqual(await response.json(), { accepted: true, revision: 1 });
const elapsed = Math.round(performance.now() - started);
const ticket = await createConnectionTicket({
  secret,
  project,
  roomOrigin: origin,
  origin: 'http://127.0.0.1:4293',
});
assert.equal(ticket.url, `ws://127.0.0.1:8797/projects/${project}/connect`);
console.log(
  JSON.stringify({
    health: 'pass',
    unsignedPublish: 'refused',
    signedPublish: 'pass',
    publishRoundTripMs: elapsed,
    ticketGeneration: 'pass',
  }),
);
