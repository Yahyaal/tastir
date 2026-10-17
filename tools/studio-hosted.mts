// The hosted studio on this computer, with real settings (see
// apps/studio/src/vercel.ts), serving a hosted build made first with
//   VITE_TASTIR_STUDIO=hosted pnpm exec vite build --config apps/player/vite.config.mts --outDir ../../dist/studio-hosted
// Usage: pnpm studio:hosted   (PORT, default 4397)
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hostedFromEnv } from '../apps/studio/src/vercel.js';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env['PORT'] ?? 4397);
const { app } = await hostedFromEnv({
  site: join(repo, 'dist', 'studio-hosted'),
});
createServer(app).listen(port, '127.0.0.1', () =>
  process.stdout.write(`Hosted studio: http://127.0.0.1:${port}\n`),
);
