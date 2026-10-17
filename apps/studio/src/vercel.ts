import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { BlobPhotos } from './blob.js';
import { hostedApp } from './hosted.js';
import { connectPostgres } from './pg.js';
import { Studio } from './studio.js';

/**
 * The hosted studio made from its settings, as Vercel runs it (api/index.ts)
 * and as `pnpm studio:hosted` runs it on this computer:
 *
 *   TASTIR_STUDIO_DATABASE_URL    the Neon (or any Postgres) address
 *   TASTIR_STUDIO_URL             the public address, https://…
 *   TASTIR_STUDIO_OWNERS          the Google addresses allowed in, comma-separated
 *   TASTIR_STUDIO_SESSION_SECRET  at least 32 random characters
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET   the Google sign-in client
 *   BLOB_READ_WRITE_TOKEN         a private Blob store for photos (optional;
 *                                 without it photos are kept in the database)
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
    process.env['BLOB_READ_WRITE_TOKEN'] ? new BlobPhotos() : undefined,
  );
  const studio = new Studio(root, join(repo, 'tutorials'), backend);
  return hostedApp({
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
