import { execFileSync } from 'node:child_process';
/// <reference types='vitest' />
import { createReadStream } from 'node:fs';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultClientConditions, defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { reviewFile, reviewFolders } from './reviewFiles';

const tutorials = fileURLToPath(new URL('../../tutorials', import.meta.url));
const packages = fileURLToPath(new URL('../../packages', import.meta.url));
const docs = fileURLToPath(new URL('../../docs', import.meta.url));

/** The folders the review page may show pictures from, by URL prefix. */
const REVIEW_FOLDERS = reviewFolders(docs);
const IMAGE_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.pdf': 'application/pdf',
  '.html': 'text/html; charset=utf-8',
};

export default defineConfig(({ mode }) => ({
  root: import.meta.dirname,
  // GitHub Pages serves the app under /<repo>/; the deploy workflow sets
  // TASTIR_BASE to that path. Locally the app lives at the root.
  base: process.env['TASTIR_BASE'] ?? '/',
  cacheDir: '../../node_modules/.vite/apps/player',
  server: {
    port: 4200,
    host: 'localhost',
    proxy: {
      ...(process.env['TASTIR_AGENT_TARGET'] &&
      process.env['TASTIR_AGENT_SECRET']
        ? {
            '/__agent': {
              target: process.env['TASTIR_AGENT_TARGET'],
              changeOrigin: true,
              headers: {
                'X-Tastir-Bridge': process.env['TASTIR_AGENT_SECRET'],
              },
              rewrite: (path: string) => path.replace(/^\/__agent/, ''),
            },
          }
        : {}),
      // pnpm studio: the shared drawings, with the studio's secret added
      // here so it never reaches the page.
      ...(process.env['TASTIR_STUDIO_TARGET'] &&
      process.env['TASTIR_STUDIO_SECRET']
        ? {
            '/__studio': {
              target: process.env['TASTIR_STUDIO_TARGET'],
              changeOrigin: true,
              headers: {
                'X-Tastir-Studio': process.env['TASTIR_STUDIO_SECRET'],
              },
              rewrite: (path: string) => path.replace(/^\/__studio/, ''),
            },
          }
        : {}),
    },
  },
  preview: {
    port: 4300,
    host: 'localhost',
  },
  plugins: [
    react(),
    {
      name: 'library-previews',
      resolveId(id) {
        if (id === 'virtual:tastir-fixtures') return '\0tastir-fixtures';
        return null;
      },
      load(id) {
        if (id === '\0tastir-fixtures')
          return mode === 'test'
            ? `export { default } from ${JSON.stringify(resolve(import.meta.dirname, 'src/app/libraryFixtures.ts'))};`
            : 'export default {};';
        return null;
      },
      buildStart() {
        execFileSync(
          process.execPath,
          [
            '--conditions=@tastir/source',
            '--import',
            'tsx',
            resolve(import.meta.dirname, 'src/build/catalog.tsx'),
          ],
          { cwd: resolve(import.meta.dirname, '../..'), stdio: 'inherit' },
        );
      },
      handleHotUpdate(ctx) {
        if (
          ctx.file.startsWith(tutorials + sep) &&
          ctx.file.endsWith('.json')
        ) {
          execFileSync(
            process.execPath,
            [
              '--conditions=@tastir/source',
              '--import',
              'tsx',
              resolve(import.meta.dirname, 'src/build/catalog.tsx'),
            ],
            { cwd: resolve(import.meta.dirname, '../..'), stdio: 'inherit' },
          );
          ctx.server.ws.send({ type: 'full-reload' });
        }
      },
    },
    {
      // tutorials/ and packages/ (the engine and the schema) are outside
      // the app, so the dev server would not notice them change without
      // this, and would go on serving the old engine or tutorial format.
      name: 'watch-tutorials',
      configureServer(server) {
        server.watcher.add([tutorials, packages]);
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
          const roots = REVIEW_FOLDERS[folder ?? ''];
          if (!roots) return next();
          const file = reviewFile(roots, rest);
          const type = IMAGE_TYPES[extname(file ?? '').toLowerCase()];
          if (!file || !type) {
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
    setupFiles: ['./src/test-setup.ts'],
    // Whole-player renders in jsdom take 2–7 s, and over 5 s (Vitest's default
    // limit) when the machine is busy, which made the coloring test flaky.
    testTimeout: 30_000,
    maxWorkers: 2,
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
    },
  },
}));
