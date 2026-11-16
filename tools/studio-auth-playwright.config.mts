import { fileURLToPath } from 'node:url';
import { defineConfig } from '@playwright/test';
const port = process.env['TASTIR_AUTH_PORT'] ?? '4302';
const baseURL = `http://localhost:${port}`;
export default defineConfig({
  testDir: '../apps/player/e2e-auth',
  outputDir: '../test-results/studio-auth',
  workers: 1,
  fullyParallel: false,
  timeout: 45000,
  use: {
    baseURL,
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
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    command: `pnpm exec vite --config apps/player/vite.config.mts --port ${port} --strictPort`,
    env: { VITE_TASTIR_STUDIO: 'hosted' },
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120000,
  },
});
