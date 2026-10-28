import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { BlobPhotos, BlobFeedbackImages } from './blob.js';
import { turnstileVerifier } from './feedback.js';
import { hostedApp } from './hosted.js';
import { connectPostgres } from './pg.js';
import { Studio } from './studio.js';
import { openAISettings } from './openai.js';

/**
 * The hosted studio made from its settings, as Vercel runs it (api/index.js)
 * and as `pnpm studio:hosted` runs it on this computer:
 *
 *   TASTIR_STUDIO_DATABASE_URL    the Neon (or any Postgres) address
 *   TASTIR_STUDIO_URL             the public address, https://…
 *   TASTIR_STUDIO_OWNERS          the Google addresses allowed in, comma-separated
 *   TASTIR_STUDIO_SESSION_SECRET  at least 32 random characters
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET   the Google sign-in client
 *   BLOB_STORE_ID or BLOB_READ_WRITE_TOKEN   a private Blob store for photos;
 *                                 Vercel adds BLOB_STORE_ID when the store is
 *                                 connected to the project and signs in to it
 *                                 by itself (optional; without one photos are
 *                                 kept in the database)
 *   LIVE_ROOM_ORIGIN, LIVE_ROOM_SECRET   the live room on Cloudflare and the
 *                                 secret shared with it (optional; without
 *                                 them pages check for changes themselves)
 */
function setting(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`The hosted studio needs ${name}.`);
  return value;
}

export async function hostedFromEnv(options: { site?: string } = {}) {
  const repo = process.cwd();
  // Contests stay a local tool; this folder only has to exist.
  const root = join(tmpdir(), 'tastir-studio');
  const backend = await connectPostgres(
    setting('TASTIR_STUDIO_DATABASE_URL'),
    root,
    process.env['BLOB_STORE_ID'] || process.env['BLOB_READ_WRITE_TOKEN']
      ? new BlobPhotos()
      : undefined,
  );
  const studio = new Studio(root, join(repo, 'tutorials'), backend);
  const feedbackEnabled = process.env['TASTIR_FEEDBACK_ENABLED'] === '1';
  const siteKey = process.env['TURNSTILE_SITE_KEY']?.trim() ?? '';
  const botSecret = process.env['TURNSTILE_SECRET_KEY']?.trim() ?? '';
  const feedbackContact = process.env['TASTIR_FEEDBACK_CONTACT']?.trim() ?? '';
  if (
    feedbackEnabled &&
    (!siteKey ||
      !botSecret ||
      feedbackContact.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(feedbackContact) ||
      /^[123]x0{10,}/.test(siteKey) ||
      /^[123]x0{10,}/.test(botSecret) ||
      (process.env['CRON_SECRET']?.trim().length ?? 0) < 32)
  )
    throw new Error(
      'Feedback needs production Turnstile keys, a deletion contact and a cleanup secret before enabling intake.',
    );
  return hostedApp({
    feedback: {
      enabled: feedbackEnabled,
      siteKey,
      contact: feedbackContact,
      verify: turnstileVerifier(
        botSecret,
        new URL(setting('TASTIR_STUDIO_URL')).hostname,
      ),
      vercel: process.env['VERCEL'] === '1',
      cronSecret: process.env['CRON_SECRET'],
      ...(process.env['BLOB_STORE_ID'] || process.env['BLOB_READ_WRITE_TOKEN']
        ? { images: new BlobFeedbackImages() }
        : {}),
    },
    studio,
    db: backend.db,
    baseUrl: new URL(setting('TASTIR_STUDIO_URL')),
    allow: setting('TASTIR_STUDIO_OWNERS')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
    secret: setting('TASTIR_STUDIO_SESSION_SECRET'),
    google: {
      clientId: setting('GOOGLE_CLIENT_ID'),
      clientSecret: setting('GOOGLE_CLIENT_SECRET'),
    },
    openai: openAISettings(process.env),
    ...(options.site ? { site: options.site } : {}),
    ...(process.env['LIVE_ROOM_ORIGIN'] && process.env['LIVE_ROOM_SECRET']
      ? {
          live: {
            roomOrigin: process.env['LIVE_ROOM_ORIGIN'],
            secret: process.env['LIVE_ROOM_SECRET'],
          },
        }
      : {}),
  });
}
