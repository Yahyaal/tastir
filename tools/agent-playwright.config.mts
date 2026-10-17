import { defineConfig } from '@playwright/test';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const port = process.env['TASTIR_AGENT_BROWSER_PORT'] ?? '4394';
const baseURL = `http://127.0.0.1:${port}`;
export default defineConfig({
  testDir: '../apps/agent-local/e2e',
  outputDir: '../test-results/agent-browser',
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
      name: 'tablet',
      use: { viewport: { width: 1024, height: 768 }, hasTouch: true },
    },
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
    command: 'pnpm dev:agent',
    url: baseURL,
    reuseExistingServer: false,
    env: {
      TASTIR_AGENT_APP_PORT: port,
      TASTIR_AGENT_DATA_DIR: join(
        tmpdir(),
        `tastir-agent-browser-${process.pid}`,
      ),
    },
    timeout: 60_000,
  },
});
