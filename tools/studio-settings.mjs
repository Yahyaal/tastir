// Makes the private settings file for putting the studio online,
// .env.studio-preflight.local, with every setting named, the two secrets
// filled in with new random values and the rest left for the owner to
// fill, following docs/STUDIO-DEPLOY.md. It never overwrites the file.
// Usage: pnpm studio:settings
import { randomBytes } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const file = join(
  fileURLToPath(new URL('../', import.meta.url)),
  '.env.studio-preflight.local',
);
const secret = () => randomBytes(32).toString('hex');
const text = `# The hosted studio's settings. Private: never share this file or paste
# it into a chat. Fill each empty value as docs/STUDIO-DEPLOY.md says.

# Part 1, Neon
TASTIR_STUDIO_DATABASE_URL=

# Part 2, Vercel (your site's address, without a slash at the end)
TASTIR_STUDIO_URL=

# Part 3, Google
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
TASTIR_STUDIO_OWNERS=

# Part 4, Cloudflare
LIVE_ROOM_ORIGIN=

# Made for you; leave as they are
TASTIR_STUDIO_SESSION_SECRET=${secret()}
LIVE_ROOM_SECRET=${secret()}
`;
try {
  await writeFile(file, text, { mode: 0o600, flag: 'wx' });
  process.stdout.write(
    `Made ${file}\nOpen it in your editor and fill it in as you go.\n`,
  );
} catch (e) {
  if (e.code !== 'EEXIST') throw e;
  process.stdout.write(`${file} is already there, so it was left as it is.\n`);
}
