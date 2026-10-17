import { defineConfig } from '@playwright/test';

// The hosted studio's browser checks, on this computer: see
// tools/studio-hosted-test.mts. Running them on Vercel itself is task H5.
import { randomBytes } from 'node:crypto';

const port = process.env['TASTIR_HOSTED_PORT'] ?? '4396';
const baseURL = `http://127.0.0.1:${port}`;
// The live room runs on Cloudflare's local runtime, with a secret made for
// this run only.
const roomPort = process.env['TASTIR_HOSTED_ROOM_PORT'] ?? '8796';
const room = `http://127.0.0.1:${roomPort}`;
process.env['TASTIR_HOSTED_ROOM_SECRET'] ??= randomBytes(32).toString('hex');
const secret = process.env['TASTIR_HOSTED_ROOM_SECRET'];
export default defineConfig({
  testDir: '../apps/studio/e2e-hosted',
  outputDir: '../test-results/studio-hosted',
  workers: 1,
  fullyParallel: false,
  timeout: 45_000,
  use: {
    baseURL,
    headless: true,
    reducedMotion: 'reduce',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 800 } } },
    {
      name: 'phone',
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: [
    {
      command: `pnpm --filter @tastir/live-room exec wrangler dev --local --ip 127.0.0.1 --port ${roomPort} --var LIVE_ROOM_SECRET:${secret} --var STUDIO_ORIGINS:${baseURL}`,
      url: `${room}/health`,
      reuseExistingServer: false,
      env: { WRANGLER_SEND_METRICS: 'false' },
      timeout: 120_000,
    },
    {
      command: 'pnpm studio:hosted:test',
      url: `${baseURL}/api/me`,
      reuseExistingServer: false,
      env: {
        TASTIR_HOSTED_PORT: port,
        TASTIR_HOSTED_LIVE_ORIGIN: room,
        TASTIR_HOSTED_LIVE_SECRET: secret,
      },
      timeout: 240_000,
    },
  ],
});
