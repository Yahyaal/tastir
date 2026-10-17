import { defineConfig } from '@playwright/test';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const port = process.env['TASTIR_STUDIO_BROWSER_PORT'] ?? '4496';
process.env['TASTIR_STUDIO_DIR'] ??= join(
  tmpdir(),
  `tastir-three-workers-${process.pid}`,
);
export default defineConfig({
  testDir: '../apps/agent-local/e2e-studio',
  outputDir: '../test-results/shared-project',
  workers: 1,
  fullyParallel: false,
  timeout: 60_000,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
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
    command: 'pnpm studio:agent',
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    env: {
      TASTIR_STUDIO_APP_PORT: port,
      TASTIR_STUDIO_MCP_PORT: '0',
      TASTIR_STUDIO_DIR: process.env['TASTIR_STUDIO_DIR'],
      TASTIR_AGENT_DATA_DIR: join(
        tmpdir(),
        `tastir-three-workers-agent-${process.pid}`,
      ),
    },
    timeout: 60_000,
  },
});
