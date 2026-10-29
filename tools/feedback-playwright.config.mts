import { defineConfig } from '@playwright/test';
const port = '4498';
const baseURL = `http://127.0.0.1:${port}`;
export default defineConfig({
  testDir: '../apps/studio/e2e-feedback',
  outputDir: '../test-results/feedback',
  workers: 1,
  fullyParallel: false,
  timeout: 45000,
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
    env: {
      TASTIR_HOSTED_PORT: port,
      NODE_OPTIONS: '--max-old-space-size=1536',
    },
    timeout: 180000,
  },
});
