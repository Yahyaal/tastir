# H7: project live rooms

This independent Worker sends **revision hints** to authenticated pages. Studio/Neon remains authoritative for projects, permissions, conflict handling and history. There is no drawing data or editing API in this app. Studio integration belongs to H4 and is deliberately not included here.

## Run locally, without a Cloudflare account

From the workspace root:

```sh
pnpm install
pnpm --filter @tastir/live-room setup:local
WRANGLER_SEND_METRICS=false pnpm --filter @tastir/live-room dev --ip 127.0.0.1 --port 8797
```

`setup:local` creates an ignored `apps/live-room/.dev.vars` file containing a random 32-byte `LIVE_ROOM_SECRET`, with owner-only permissions. It refuses to overwrite an existing file. Set that **same secret in the Studio server environment** when wiring H4; never expose it to the browser or commit it. The checked-in example has an empty value, so missing configuration fails closed. The local allowlist in `wrangler.jsonc` accepts Studio at `http://127.0.0.1:4293` and `http://127.0.0.1:4498`; use the exact origin, including scheme and port.

`GET http://127.0.0.1:8797/health` returns `200` when the secret is configured. The Worker runs entirely locally with SQLite-backed Durable Objects; no login, deployment or paid resources are needed for these checks.

```sh
# Run each check separately, after other agents' Vitest/Playwright runs finish.
pnpm exec vitest run --config apps/live-room/vitest.config.mts --maxWorkers=1
pnpm --filter @tastir/live-room typecheck
pnpm exec eslint apps/live-room
pnpm --filter @tastir/live-room build
# With wrangler dev running on 127.0.0.1:8797, after build:
pnpm --filter @tastir/live-room smoke:local
```

For the real-browser fixture, stop the normal dev command and start it with the fixture's exact origin allowed:

```sh
WRANGLER_SEND_METRICS=false pnpm --filter @tastir/live-room dev --ip 127.0.0.1 --port 8797 --var STUDIO_ORIGINS:http://127.0.0.1:8798
# In another terminal, after build; no other test run should be active:
pnpm --filter @tastir/live-room smoke:browser
```

This starts a temporary HTTP fixture on `127.0.0.1:8798`, uses one headless Chromium, and shuts both down afterward. It needs the workspace's Playwright Chromium installation. It checks the real browser/Worker handshake and delivery, an unreachable room, and cleanup; its ticket endpoint and project reads are simulated, so it is not a Studio integration test.

The Miniflare tests execute the actual Worker and Durable Object, including WebSocket upgrades, signed publication, room isolation, retries, expired leases, actual hibernating eviction/reconstruction and runtime ping replies. The browser-client tests use a controlled transport to check polling, reconnects, expiry and cleanup. They do not claim a deployed Studio latency or free-plan usage measurement.

## Contract for H4

Add `@tastir/live-room: workspace:*` to Studio's dependencies when integrating it. Only `@tastir/live-room/client` is safe to import in a page. The signing helper is a separate server entry point, with no secret imports in the client dependency graph.

### Issue a page ticket on the Studio server

An authenticated Studio endpoint must check that the session can **read this project**, then return the result of:

```ts
import { createConnectionTicket } from '@tastir/live-room/server';

const result = await createConnectionTicket({
  secret: process.env.LIVE_ROOM_SECRET!,
  roomOrigin: process.env.LIVE_ROOM_ORIGIN!, // http://127.0.0.1:8797 locally
  project: projectId,
  origin: process.env.STUDIO_ORIGIN!, // trusted configuration, not arbitrary user input
});
// Return JSON with Cache-Control: no-store; no redirects, no shared caching.
```

The helper only signs; it cannot authorize a session. Keep the endpoint same-origin and protected by the existing session rules. A ticket is a bearer credential scoped to one project and one exact Studio origin. Its default lease is 60 seconds and the maximum is 120 seconds. The browser obtains a fresh ticket before expiry, which rechecks access. Revocation therefore takes effect within the current ticket lease. Rotation of the shared secret invalidates newly submitted old signatures; existing sockets remain bounded by their leases.

Project IDs must contain 1–128 ASCII letters, digits, `_` or `-`, starting with a letter/digit. Revisions must be monotonically increasing safe integers, starting with 1 for the first committed change; ready messages may report 0. Do not reuse a project ID for an unrelated revision history. Origins must be HTTPS; HTTP is accepted only on loopback for development.

### Notify after a committed edit

```ts
import { notifyRevision } from '@tastir/live-room/server';

// Save and history/receipt transaction has ALREADY committed successfully.
// Use the platform's waitUntil/background-task hook to finish this promise.
const notification = notifyRevision({
  secret: process.env.LIVE_ROOM_SECRET!,
  roomOrigin: process.env.LIVE_ROOM_ORIGIN!,
  project: saved.id,
  revision: saved.revision,
});
```

The helper has a two-second timeout and returns a boolean without throwing. It must never roll back a save, report a committed save as failed, or retry the edit when publication fails. A disconnected page polls; a connected page periodically reconciles too, because any notification can be lost.

### Subscribe in the page

```ts
import { watchProject } from '@tastir/live-room/client';

const stop = watchProject({
  project: projectId,
  initialRevision: loadedRevision,
  getTicket: async (signal) => {
    const response = await fetch(`/api/projects/${projectId}/live-ticket`, {
      credentials: 'same-origin', cache: 'no-store', signal,
    });
    if (!response.ok) return null; // Disabled/unavailable room: polling still works.
    return response.json();
  },
  refresh: async (signal) => {
    // Use the existing guarded Studio reload, including unsaved-change recovery.
    // Respect signal BEFORE applying data and return its authoritative revision.
    return refreshProjectFromStudio(signal);
  },
});
// On unmount/project change/sign out:
stop();
```

There is an immediate read and another on connection. New hints trigger reads, coalesced so they do not overlap. Polling runs every three seconds while offline, while a read fails or while the source lags a hint. A healthy connection reconciles every minute. Ticket retrieval/connection failures back off with jitter up to about 30 seconds; unreachable ticket endpoints time out after five seconds, and stalled authoritative reads abort after ten seconds. Native runtime ping/pong detects half-open sockets without waking the room. `stop()` closes the socket, aborts work and clears timers. The supplied callbacks must honour cancellation before applying state; the client cannot undo side effects inside an application's callback. H4 can mount/unmount with page visibility and its own session lifecycle to conserve free requests.

## Wire protocol and security

- `GET /projects/:id/connect` upgrades with `Origin` and subprotocols `tastir.live.v1, ticket.<signed-token>`. Only the public protocol is echoed. Credentials never go in URL query parameters. Log redaction must also cover `Sec-WebSocket-Protocol`, `Authorization` and ticket endpoint response bodies.
- `POST /projects/:id/revisions` is server-to-server only, has no body, and carries `Authorization: Bearer <signed-revision-token>`. Browser Origin headers are refused; no CORS access is granted. Publish tokens cannot open sockets and page tickets cannot publish.
- HMAC-SHA256 signs a versioned, purpose-bound payload with project, timestamps and either origin or revision. Both the Worker and the room verify signatures/expiry; unauthorized requests do not create rooms. Server clocks should remain synchronized (at most five seconds of future issuance is tolerated).
- Messages are `{type: "ready" | "revision", project, revision}`. The room stores only the latest notified revision for duplicate/out-of-order suppression. Database state and all authorization stay in Studio.
- Each room accepts at most 32 live sockets. Subscribers can only send the automatic `ping`; other messages close the socket. Expired sockets are pruned before any broadcast. A quiet expired socket may remain connected but receives no project notifications; no per-room timer prevents hibernation.
- Sockets use `ctx.acceptWebSocket`, `ctx.getWebSockets` and serialized ticket attachments. There are no in-memory socket maps or intervals in the Durable Object. Runtime `ping`/`pong` automatic responses preserve hibernation eligibility. See Cloudflare's [hibernation example](https://developers.cloudflare.com/durable-objects/examples/websocket-hibernation-server/) and [WebSocket guidance](https://developers.cloudflare.com/durable-objects/best-practices/websockets/).

## Deployment and acceptance still pending

H7 stays **unchecked** in the hosted PRD. Claude wires H4; H5/H6 configure the deployed origins and shared secret and deploy on a **Workers Free** account. Do not enable paid resources as a fallback. `new_sqlite_classes` is used for Free-plan compatibility. Before deployment review Cloudflare's current [limits](https://developers.cloudflare.com/durable-objects/platform/limits/) and [pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/).

H6 must measure **committed agent edit → drawing visible** on the deployed Studio (under 500 ms), repeat with the Worker stopped/disabled to show polling still works, and record a full week against free daily limits. Local room delivery times do not establish that end-to-end result. Also record real auth renewal/revocation, secret rotation and mobile reconnect behaviour during that deployed check. This branch does not deploy, edit Studio, or mark those criteria complete.
