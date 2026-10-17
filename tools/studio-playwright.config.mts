import { defineConfig } from '@playwright/test';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// The studio's browser checks: pnpm studio with a throwaway project folder,
// which the tests also reach directly, as an agent would.
const port = process.env['TASTIR_STUDIO_BROWSER_PORT'] ?? '4395';
const baseURL = `http://127.0.0.1:${port}`;
process.env['TASTIR_STUDIO_DIR'] ??= join(
  tmpdir(),
  `tastir-studio-browser-${process.pid}`,
);
export default defineConfig({
  testDir: '../apps/studio/e2e',
  outputDir: '../test-results/studio-browser',
  workers: 1,
  fullyParallel: false,
  timeout: 30_000,
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
    command: 'pnpm studio',
    url: baseURL,
    reuseExistingServer: false,
    env: {
      TASTIR_STUDIO_APP_PORT: port,
      TASTIR_STUDIO_MCP_PORT: '0',
      TASTIR_STUDIO_DIR: process.env['TASTIR_STUDIO_DIR'],
    },
    timeout: 60_000,
  },
});
