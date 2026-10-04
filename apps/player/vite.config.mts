/// <reference types='vitest' />
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultClientConditions, defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const tutorials = fileURLToPath(new URL('../../tutorials', import.meta.url));
const docs = fileURLToPath(new URL('../../docs', import.meta.url));

/** The folders the review page may show pictures from, by URL prefix. */
const REVIEW_FOLDERS: Record<string, string> = {
  renders: resolve(docs, 'review'),
  research: resolve(docs, 'research'),
};
const IMAGE_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.pdf': 'application/pdf',
  '.html': 'text/html; charset=utf-8',
};

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
    {
      // The review page (#/review) shows renders from docs/review and
      // reference pictures from docs/research. Those are private and must
      // never ship, so they are served by the dev server only and are not
      // part of any build.
      name: 'review-files',
      apply: 'serve',
      configureServer(server) {
        server.middlewares.use('/__review', (req, res, next) => {
          const [folder, ...rest] = decodeURIComponent(
            (req.url ?? '').split('?')[0] ?? '',
          )
            .replace(/^\//, '')
            .split('/');
          const root = REVIEW_FOLDERS[folder ?? ''];
          if (!root) return next();
          const file = resolve(root, ...rest);
          const type = IMAGE_TYPES[extname(file).toLowerCase()];
          if (
            !file.startsWith(root + sep) ||
            !type ||
            !existsSync(file) ||
            !statSync(file).isFile()
          ) {
            res.statusCode = 404;
            res.end('Not found');
            return;
          }
          res.setHeader('Content-Type', type);
          res.setHeader('Cache-Control', 'no-cache');
          createReadStream(file).pipe(res);
        });
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
  // The engine worker is an ES module, like the app.
  worker: {
    format: 'es',
  },
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
