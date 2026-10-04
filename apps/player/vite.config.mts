/// <reference types='vitest' />
import { fileURLToPath } from 'node:url';
import { defaultClientConditions, defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const tutorials = fileURLToPath(new URL('../../tutorials', import.meta.url));

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/player',
  server: {
    port: 4200,
    host: 'localhost',
  },
  preview: {
    port: 4300,
    host: 'localhost',
  },
  plugins: [
    react(),
    {
      // tutorials/ is outside the app, so the dev server would not notice a
      // tutorial being added or changed without this.
      name: 'watch-tutorials',
      configureServer(server) {
        server.watcher.add(tutorials);
      },
    },
  ],
  resolve: {
    // Use the workspace packages' TypeScript sources directly, so the dev
    // server needs no build step for the engine or the schema.
    conditions: ['@tastir/source', ...defaultClientConditions],
    alias: {
      '@tutorials': tutorials,
    },
  },
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [],
  // },
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  test: {
    name: 'player',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
    },
  },
}));
