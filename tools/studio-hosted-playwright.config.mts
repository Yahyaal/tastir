import { defineConfig } from '@playwright/test';

// The hosted studio's browser checks, on this computer: see
// tools/studio-hosted-test.mts. Running them on Vercel itself is task H5.
const port = process.env['TASTIR_HOSTED_PORT'] ?? '4396';
const baseURL = `http://127.0.0.1:${port}`;
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
  webServer: {
    command: 'pnpm studio:hosted:test',
    url: `${baseURL}/api/me`,
    reuseExistingServer: false,
    env: { TASTIR_HOSTED_PORT: port },
    timeout: 240_000,
  },
});
