import { createServer, type Server } from 'node:http';
import { randomUUID } from 'node:crypto';
import { SignJWT } from 'jose';
import { and, eq, sql } from 'drizzle-orm';
import { Resvg } from '@resvg/resvg-js';
import { emptyDraft } from './player.js';
import {
  Feedback,
  feedbackPng,
  turnstileVerifier,
  type FeedbackOptions,
} from './feedback.js';
import { hostedApp } from './hosted.js';
import { Studio } from './studio.js';
import { testBackend, type TestBackend } from './testing.js';
import {
  PgBackend,
  feedbackReports,
  feedbackReceipts,
  feedbackCounters,
  feedbackContacts,
  feedbackSettings,
  feedbackEvents,
} from './pg.js';

const secret = 'feedback-fixture-session-secret-32-characters';
const context = {
  version: 1,
  pattern: 'eight-fold-star',
  title: 'Eight-fold star',
  mode: 'draw',
  stage: 'step',
  index: 2,
  stepIds: [3],
  label: 'Step 3',
  instruction: 'Draw a line through B.',
  build: 'fixture',
  viewport: [390, 844],
  browser: 'Firefox / Linux',
  input: 'touch',
};
const submission = (extra: Record<string, unknown> = {}) => ({
  id: randomUUID(),
  retrySecret: 'ab'.repeat(32),
  token: 'valid',
  category: 'stuck',
  message: 'The line does not complete.',
  context,
  ...extra,
});
const dataPng = () =>
  `data:image/png;base64,${new Resvg('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="red"/></svg>').render().asPng().toString('base64')}`;

describe('private feedback with guarded anonymous intake', () => {
  let fixture: TestBackend;
  let db: PgBackend['db'];
  let server: Server;
  let hosted: ReturnType<typeof hostedApp>;
  let origin: string;
  let service: Feedback;
  let options: FeedbackOptions;
  let ownerCookie: string;
  const images = new Map<string, Buffer>();
  beforeAll(async () => {
    fixture = await testBackend('pglite');
    db = (fixture.backend as PgBackend).db;
    ownerCookie = `tastir_session=${await new SignJWT({ email: 'owner@fixture.invalid' }).setProtectedHeader({ alg: 'HS256' }).setAudience('session').setExpirationTime('1h').sign(new TextEncoder().encode(secret))}`;
  });
  beforeEach(async () => {
    await db.delete(feedbackReports);
    await db.delete(feedbackReceipts);
    await db.delete(feedbackCounters);
    await db.delete(feedbackSettings);
    await db.delete(feedbackEvents);
    images.clear();
    options = {
      enabled: true,
      siteKey: 'fixture-key',
      contact: 'owner@fixture.invalid',
      verify: vi.fn(async (token) => token === 'valid'),
      images: {
        put: async (key, bytes) => {
          images.set(key, bytes);
        },
        get: async (key) => images.get(key)!,
        remove: async (key) => {
          images.delete(key);
        },
      },
    };
    service = new Feedback(db, options, secret);
    server = createServer((q, r) => hosted.app(q, r));
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve),
    );
    const address = server.address();
    origin = `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`;
    hosted = hostedApp({
      db,
      studio: new Studio(fixture.root, 'tutorials', fixture.backend),
      baseUrl: new URL(origin),
      secret,
      allow: ['owner@fixture.invalid'],
      google: { clientId: 'fixture', clientSecret: 'fixture' },
      feedback: options,
    });
  });
  afterEach(async () => {
    await hosted.close();
    server.closeAllConnections();
    await new Promise<void>((r) => server.close(() => r()));
  });
  afterAll(async () => {
    await fixture.close();
  });
  const post = (
    body: unknown,
    path = '/api/feedback',
    headers: Record<string, string> = {},
  ) =>
    fetch(origin + path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: origin,
        ...headers,
      },
      body: JSON.stringify(body),
    });
  async function owner() {
    const response = await fetch(`${origin}/api/owner/feedback/session`, {
      headers: { Cookie: ownerCookie },
    });
    return {
      Cookie: ownerCookie,
      'X-Tastir-CSRF': ((await response.json()) as { csrf: string }).csrf,
    };
  }

  it('saves an anonymous report and returns the same receipt after a lost response without verifying the consumed token again', async () => {
    const body = submission({ email: 'learner@fixture.invalid' });
    const first = await post(body);
    expect(first.status).toBe(201);
    const receipt = (await first.json()) as { receipt: string };
    const retry = await post({ ...body, token: 'expired-consumed-token' });
    expect(await retry.json()).toEqual(receipt);
    expect(options.verify).toHaveBeenCalledTimes(1);
    expect((await db.select().from(feedbackReports)).length).toBe(1);
    expect(JSON.stringify(receipt)).not.toContain('learner@');
    const mismatch = await post({ ...body, message: 'Changed content' });
    expect(mismatch.status).toBe(409);
    expect(JSON.stringify(await mismatch.json())).not.toContain(
      receipt.receipt,
    );
  });
  it('blocks cross-origin posts, unknown fields, malformed and oversized bodies before verification', async () => {
    expect(
      (
        await post(submission(), '/api/feedback', {
          Origin: 'https://attacker.invalid',
        })
      ).status,
    ).toBe(403);
    expect((await post(submission({ status: 'resolved' }))).status).toBe(400);
    expect(
      (await post(submission({ message: 'x'.repeat(530000) }))).status,
    ).toBe(413);
    const invalid = await fetch(origin + '/api/feedback', {
      method: 'POST',
      headers: { Origin: origin, 'Content-Type': 'application/json' },
      body: '{',
    });
    expect(invalid.ok).toBe(false);
    expect(options.verify).not.toHaveBeenCalled();
    expect(await db.select().from(feedbackReports)).toHaveLength(0);
  });
  it('refuses invalid bot tokens and preserves the ability to retry the same body with a fresh token', async () => {
    const body = submission({ token: 'forged' });
    expect((await post(body)).status).toBe(403);
    expect(await db.select().from(feedbackReceipts)).toHaveLength(0);
    expect((await post({ ...body, token: 'valid' })).status).toBe(201);
  });
  it('enforces unique claims across two services sharing the database', async () => {
    const other = new Feedback(db, options, secret),
      body = submission();
    const results = await Promise.allSettled(
      Array.from({ length: 8 }, (_, i) =>
        (i % 2 ? other : service).submit(body, 'network'),
      ),
    );
    expect(results.some((r) => r.status === 'fulfilled')).toBe(true);
    expect(await db.select().from(feedbackReports)).toHaveLength(1);
    const retry = await other.submit(
      { ...body, token: 'already-used' },
      'network',
    );
    expect(retry.receipt).toBeTruthy();
    expect(options.verify).toHaveBeenCalledTimes(1);
  });
  it('limits one browser while allowing different learners on a shared network', async () => {
    const browser = service.session();
    for (let n = 0; n < 5; n++)
      await service.submit(submission(), 'shared-network', browser);
    await expect(
      service.submit(submission(), 'shared-network', browser),
    ).rejects.toMatchObject({ status: 429 });
    await service.submit(submission(), 'shared-network', service.session());
    expect(await db.select().from(feedbackReports)).toHaveLength(6);
  });
  it('counts rejected requests without allowing spoofed proxy headers to create new network identities', async () => {
    for (let n = 0; n < 120; n++) await service.attempt('127.0.0.1');
    const response = await post(submission(), '/api/feedback', {
      'X-Forwarded-For': '203.0.113.1',
      'X-Vercel-Forwarded-For': '203.0.113.2',
    });
    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('60');
    const global = await db
      .select()
      .from(feedbackCounters)
      .where(sql`${feedbackCounters.key} like 'attempt:global:day:%'`);
    expect(global[0]?.value).toBe(121);
  });
  it('quarantines verified network bursts without discarding separate learner messages', async () => {
    for (let n = 0; n < 31; n++)
      await service.submit(submission(), 'classroom');
    expect(
      (await service.list({ moderation: 'quarantined' })).reports,
    ).toHaveLength(1);
    expect(await db.select().from(feedbackReports)).toHaveLength(31);
    await expect(
      service.submit(
        submission({ snapshot: { draft: emptyDraft('test', 'My board') } }),
        'classroom',
      ),
    ).rejects.toMatchObject({ code: 'attachments' });
  });
  it('keeps contact details and private PNGs behind owner authentication, including for bearer-only drawing agents', async () => {
    const response = await post(
      submission({
        email: 'private@fixture.invalid',
        snapshot: { draft: emptyDraft('test', 'My drawing') },
        image: dataPng(),
      }),
    );
    expect(response.status).toBe(201);
    const { receipt } = (await response.json()) as { receipt: string };
    for (const suffix of ['', `/${receipt}`, `/${receipt}/image`]) {
      expect(
        (await fetch(`${origin}/api/owner/feedback${suffix}`)).status,
      ).toBe(401);
      expect(
        (
          await fetch(`${origin}/api/owner/feedback${suffix}`, {
            headers: { Authorization: 'Bearer drawing-agent' },
          })
        ).status,
      ).toBe(401);
    }
    const headers = await owner();
    const list = await fetch(`${origin}/api/owner/feedback`, { headers });
    expect(await list.text()).not.toContain('private@');
    const detail = await fetch(`${origin}/api/owner/feedback/${receipt}`, {
      headers,
    });
    expect(((await detail.json()) as { email: string }).email).toBe(
      'private@fixture.invalid',
    );
    const image = await fetch(`${origin}/api/owner/feedback/${receipt}/image`, {
      headers,
    });
    expect(image.headers.get('cache-control')).toContain('no-store');
    expect(image.headers.get('content-type')).toContain('image/png');
    expect(image.status).toBe(200);
  });
  it('requires CSRF on owner mutations, rejects stale changes, and leaves the learner message immutable', async () => {
    const { receipt } = await service.submit(submission(), 'network');
    expect(
      (
        await post(
          { version: 1, status: 'resolved' },
          `/api/owner/feedback/${receipt}`,
          { Cookie: ownerCookie },
        )
      ).status,
    ).toBe(403);
    const headers = await owner();
    expect(
      (
        await post(
          {
            version: 1,
            status: 'reviewing',
            note: 'Investigating',
            group: 'line-step',
          },
          `/api/owner/feedback/${receipt}`,
          headers,
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await post(
          { version: 1, status: 'resolved' },
          `/api/owner/feedback/${receipt}`,
          headers,
        )
      ).status,
    ).toBe(409);
    expect(
      (
        await post(
          { version: 2, message: 'Replace the learner comment' },
          `/api/owner/feedback/${receipt}`,
          headers,
        )
      ).status,
    ).toBe(400);
    expect((await service.detail(receipt)).message).toBe(
      'The line does not complete.',
    );
  });
  it('exports only selected reports, supports redaction and excludes contacts and abuse identifiers', async () => {
    const a = await service.submit(
      submission({ email: 'private@fixture.invalid' }),
      'secret-network',
    );
    const b = await service.submit(
      submission({ message: 'Unselected report' }),
      'secret-network',
    );
    await service.update(
      a.receipt,
      { version: 1, note: 'Private investigation note' },
      'owner',
    );
    const bundle = await service.export(
      [a.receipt],
      'owner',
      'Find the cause',
      { [a.receipt]: 'Redacted comment' },
      false,
    );
    const text = JSON.stringify(bundle);
    expect(text).toContain('Redacted comment');
    expect(text).not.toContain('private@');
    expect(text).not.toContain('secret-network');
    expect(text).not.toContain('Private investigation note');
    expect(text).not.toContain(b.receipt);
    expect((await service.detail(a.receipt)).message).toBe(
      'The line does not complete.',
    );
    expect(
      await db
        .select()
        .from(feedbackEvents)
        .where(eq(feedbackEvents.kind, 'export')),
    ).toHaveLength(1);
  });
  it('records deliberate retention changes without extending deadlines just because a note was saved', async () => {
    const { receipt } = await service.submit(submission(), 'network');
    const before = await service.detail(receipt);
    const after = await service.update(
      receipt,
      { version: 1, moderation: 'inbox', note: 'Keep investigating.' },
      'owner',
    );
    expect(after.expires).toEqual(before.expires);
    const held = await service.update(
      receipt,
      { version: 2, retainDays: 730, retainEvidenceDays: 365 },
      'owner',
    );
    expect(held.expires.getTime()).toBeGreaterThan(after.expires.getTime());
    expect(held.events.some((e) => e.detail['retainDays'] === 730)).toBe(true);
  });
  it('reclaims reservations after an upload failure and never confirms an attachment it did not save', async () => {
    options.images!.put = async () => {
      throw new Error('private provider error');
    };
    await expect(
      service.submit(
        submission({
          snapshot: { draft: emptyDraft('test', 'My board') },
          image: dataPng(),
        }),
        'network',
      ),
    ).rejects.toMatchObject({ status: 503 });
    expect(await db.select().from(feedbackReports)).toHaveLength(0);
    expect(await db.select().from(feedbackReceipts)).toHaveLength(0);
    expect(
      (
        await db
          .select()
          .from(feedbackCounters)
          .where(eq(feedbackCounters.key, 'image:retained'))
      )[0]?.value,
    ).toBe(0);
  });
  it('allows text-only sending while optional image storage is unavailable', async () => {
    options.images!.put = async () => {
      throw new Error('Storage down');
    };
    await expect(
      service.submit(
        submission({
          snapshot: { draft: emptyDraft('test', 'My board') },
          image: dataPng(),
        }),
        'network',
      ),
    ).rejects.toMatchObject({ code: 'attachments' });
    const result = await service.submit(submission(), 'network');
    expect((await service.detail(result.receipt)).message).toBe(
      'The line does not complete.',
    );
  });
  it('retains failed-delete keys for cleanup, then removes expired evidence and contact without exposing expired fields', async () => {
    const { receipt } = await service.submit(
      submission({
        email: 'expired@fixture.invalid',
        snapshot: { draft: emptyDraft('test', 'My board') },
        image: dataPng(),
      }),
      'network',
    );
    const past = new Date(Date.now() - 1000);
    await db
      .update(feedbackReports)
      .set({ evidenceExpires: past })
      .where(eq(feedbackReports.id, receipt));
    await db
      .update(feedbackContacts)
      .set({ expires: past })
      .where(eq(feedbackContacts.report, receipt));
    expect((await service.detail(receipt)).snapshot).toBeNull();
    expect((await service.detail(receipt)).email).toBe('');
    const remove = options.images!.remove;
    options.images!.remove = async () => {
      throw new Error('Storage temporarily down');
    };
    expect((await service.cleanup()).failed).toBe(1);
    expect(images.size).toBe(1);
    options.images!.remove = remove;
    expect((await service.cleanup()).failed).toBe(0);
    expect(images.size).toBe(0);
    expect(await db.select().from(feedbackContacts)).toHaveLength(0);
    await service.delete(receipt);
    expect(
      (
        await db
          .select()
          .from(feedbackCounters)
          .where(and(eq(feedbackCounters.key, 'report:retained')))
      )[0]?.value,
    ).toBe(0);
  });
  it('allows a completed retry while intake is paused and offers no public receipt lookup', async () => {
    const body = submission();
    const result = await service.submit(body, 'network');
    await service.controls({ paused: true });
    expect(
      await service.submit({ ...body, token: 'consumed' }, 'network'),
    ).toEqual(result);
    await expect(service.submit(submission(), 'network')).rejects.toMatchObject(
      { code: 'paused' },
    );
    expect(
      (await fetch(`${origin}/api/feedback/${result.receipt}`)).status,
    ).toBe(401);
  });
  it('rejects malformed and excessive PNG input and re-encodes a bounded board raster', () => {
    const good = dataPng();
    expect(feedbackPng(good).subarray(0, 8).toString('hex')).toBe(
      '89504e470d0a1a0a',
    );
    expect(() => feedbackPng('data:image/png;base64,SGVsbG8=')).toThrow();
    const huge = Buffer.from(good.split(',')[1]!, 'base64');
    huge.writeUInt32BE(1000000, 16);
    expect(() =>
      feedbackPng(`data:image/png;base64,${huge.toString('base64')}`),
    ).toThrow();
  });
  it('checks the provider success flag, hostname and feedback action on the server', async () => {
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    try {
      const verify = turnstileVerifier('private-secret', 'tastir.example');
      for (const body of [
        { success: false },
        {
          success: true,
          hostname: 'attacker.example',
          action: 'feedback_submit',
        },
        { success: true, hostname: 'tastir.example', action: 'login' },
      ]) {
        fetcher.mockResolvedValueOnce(Response.json(body));
        expect(await verify('token')).toBe(false);
      }
      fetcher.mockResolvedValueOnce(
        Response.json({
          success: true,
          hostname: 'tastir.example',
          action: 'feedback_submit',
        }),
      );
      expect(await verify('token')).toBe(true);
      const init = fetcher.mock.calls[0]![1];
      expect(JSON.parse(init.body)).toMatchObject({
        secret: 'private-secret',
        response: 'token',
      });
      expect(init.signal).toBeInstanceOf(AbortSignal);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
