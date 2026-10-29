import express, { type Request } from 'express';
import { isIP } from 'node:net';
import { timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { FEEDBACK_LIMITS } from '@tastir/schema';
import { Feedback, FeedbackError } from './feedback.js';
import type { Owner } from './owner.js';

function cookie(request: Request) {
  return request.headers.cookie
    ?.split(';')
    .map((s) => s.trim())
    .find((s) => s.startsWith('tastir_feedback='))
    ?.slice(16);
}
function network(request: Request, vercel: boolean) {
  // Production uses only Vercel's overwritten header. Local/test servers ignore forwarded headers.
  const value = vercel
    ? request.headers['x-vercel-forwarded-for']
    : request.socket.remoteAddress;
  if (typeof value !== 'string' || !isIP(value))
    throw new FeedbackError(
      503,
      'network',
      'Feedback is temporarily unavailable. Please keep your message and retry later.',
    );
  return value.startsWith('::ffff:') ? value.slice(7) : value.toLowerCase();
}
const sameSecret = (a: string, b: string) => {
  const first = Buffer.from(a),
    second = Buffer.from(b);
  return first.length === second.length && timingSafeEqual(first, second);
};
const ExportShape = z.strictObject({
  ids: z.array(z.uuid()).min(1).max(20),
  goal: z.string().trim().min(1).max(4000),
  messages: z.record(z.uuid(), z.string().max(4000)).default({}),
  includeNotes: z.boolean().default(false),
});
const ControlsShape = z.strictObject({
  paused: z.boolean().optional(),
  attachmentsPaused: z.boolean().optional(),
});

/** Mounted before the Studio's 4 MB parser and owner-only project router. */
export function feedbackRoutes(
  feedback: Feedback,
  owner: Owner,
  origin: string,
) {
  const router = express.Router();
  router.use((_q, r, next) => {
    r.setHeader('Cache-Control', 'private, no-store');
    r.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });
  router.get('/feedback/config', async (_q, r) => {
    r.setHeader('Cache-Control', 'public, max-age=30, s-maxage=30');
    r.json(await feedback.config());
  });
  router.get('/feedback/cleanup', async (q, r) => {
    const expected = feedback.options.cronSecret;
    if (
      !expected ||
      !sameSecret(q.headers.authorization ?? '', `Bearer ${expected}`)
    ) {
      r.status(401).json({ error: 'Sign in to manage feedback.' });
      return;
    }
    r.json(await feedback.cleanup());
  });
  router.use(['/feedback/session', '/feedback'], async (q, _r, next) => {
    if (q.method !== 'POST') {
      next();
      return;
    }
    if (q.headers.origin !== origin)
      throw new FeedbackError(
        403,
        'origin',
        'Open the reporting form on Tastir to send feedback.',
      );
    if (
      !q.is('application/json') ||
      (q.headers['content-encoding'] &&
        q.headers['content-encoding'] !== 'identity')
    )
      throw new FeedbackError(
        415,
        'format',
        'Send feedback using the app form.',
      );
    if (!feedback.options.enabled)
      throw new FeedbackError(
        503,
        'paused',
        'Feedback is temporarily paused. Keep your message and try again later.',
        600,
      );
    await feedback.attempt(
      network(q, !!feedback.options.vercel),
      feedback.validSession(cookie(q)),
    );
    next();
  });
  router.post(
    '/feedback/session',
    express.json({ limit: '1kb', inflate: false }),
    (q, r) => {
      const session = feedback.session(cookie(q));
      r.setHeader(
        'Set-Cookie',
        `tastir_feedback=${session}; Path=/api/feedback; HttpOnly; SameSite=Strict; Max-Age=86400${origin.startsWith('https:') ? '; Secure' : ''}`,
      );
      r.json({ ready: true });
    },
  );
  router.post(
    '/feedback',
    express.json({ limit: FEEDBACK_LIMITS.body, inflate: false, strict: true }),
    async (q, r) => {
      r.status(201).json(
        await feedback.submit(
          q.body,
          network(q, !!feedback.options.vercel),
          feedback.validSession(cookie(q)),
        ),
      );
    },
  );

  const admin = express.Router();
  admin.use(async (q, r, next) => {
    if (!(await owner.who(q))) {
      r.status(401).json({ error: 'Sign in to review feedback.' });
      return;
    }
    if (
      q.method !== 'GET' &&
      (q.headers.origin !== origin ||
        q.headers['x-tastir-csrf'] !== owner.csrf(q))
    ) {
      r.status(403).json({ error: 'Reload the inbox before saving.' });
      return;
    }
    next();
  });
  admin.use(express.json({ limit: '128kb', inflate: false }));
  admin.get('/session', (q, r) => {
    r.json({ csrf: owner.csrf(q) });
  });
  admin.get('/stats', async (_q, r) => {
    r.json(await feedback.stats());
  });
  admin.post('/controls', async (q, r) => {
    const input = ControlsShape.safeParse(q.body);
    if (!input.success)
      throw new FeedbackError(
        400,
        'validation',
        'Check the feedback settings.',
      );
    r.json(await feedback.controls(input.data));
  });
  admin.post('/cleanup', async (_q, r) => {
    r.json(await feedback.cleanup());
  });
  admin.post('/export', async (q, r) => {
    const input = ExportShape.safeParse(q.body);
    if (!input.success)
      throw new FeedbackError(
        400,
        'validation',
        'Check the selected reports and investigation goal.',
      );
    const p = input.data;
    if (Object.keys(p.messages).some((id) => !p.ids.includes(id)))
      throw new FeedbackError(
        400,
        'selection',
        'Only redact selected reports.',
      );
    r.json(
      await feedback.export(
        p.ids,
        (await owner.who(q))!,
        p.goal,
        p.messages,
        p.includeNotes,
      ),
    );
  });
  admin.get('/', async (q, r) => {
    const input = z
      .object({
        status: z.enum(['new', 'reviewing', 'resolved', 'archived']).optional(),
        moderation: z.enum(['inbox', 'quarantined', 'spam']).optional(),
        pattern: z.string().max(160).optional(),
        group: z.string().max(160).optional(),
        search: z.string().max(200).optional(),
        offset: z.coerce.number().int().min(0).max(10000).optional(),
      })
      .safeParse(q.query);
    if (!input.success)
      throw new FeedbackError(400, 'validation', 'Check the inbox filters.');
    r.json(await feedback.list(input.data));
  });
  admin.get('/:id/image', async (q, r) => {
    r.type('png').send(await feedback.image(String(q.params.id)));
  });
  admin.get('/:id', async (q, r) => {
    r.json(await feedback.detail(String(q.params.id)));
  });
  admin.post('/:id', async (q, r) => {
    r.json(
      await feedback.update(String(q.params.id), q.body, (await owner.who(q))!),
    );
  });
  admin.delete('/:id', async (q, r) => {
    await feedback.delete(String(q.params.id));
    r.json({ deleted: true });
  });
  router.use('/owner/feedback', admin);
  router.use(
    (
      error: unknown,
      _q: express.Request,
      r: express.Response,
      _next: express.NextFunction,
    ) => {
      const limit =
        typeof error === 'object' &&
        error !== null &&
        'type' in error &&
        error.type === 'entity.too.large';
      const invalid =
        typeof error === 'object' &&
        error !== null &&
        'type' in error &&
        error.type === 'entity.parse.failed';
      const e =
        error instanceof FeedbackError
          ? error
          : limit
            ? new FeedbackError(
                413,
                'size',
                'This drawing is too large. Remove it to send your message.',
              )
            : invalid
              ? new FeedbackError(
                  400,
                  'validation',
                  'This feedback could not be read. Open the form and try again.',
                )
              : new FeedbackError(
                  503,
                  'unavailable',
                  'Feedback could not finish. Your message is still here; please retry.',
                  30,
                );
      if (e.retryAfter) r.setHeader('Retry-After', String(e.retryAfter));
      r.status(e.status).json({ code: e.code, error: e.message });
    },
  );
  return router;
}
