import { defineConfig } from 'vitest/config';

const include = [
  '{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
];
const perf = ['src/perf.spec.ts'];

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/packages/engine',
  test: {
    watch: false,
    globals: true,
    environment: 'node',
    // Functional geometry cases can be large; speed budgets are tested separately.
    testTimeout: 20_000,
    maxWorkers: 2,
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
    },
    // The speed targets fail at random on a busy machine, so `pnpm test`
    // leaves them out: `pnpm test:perf` runs them alone, with nothing else
    // sharing the CPU. The exact-equivalence specs stay in `pnpm test`.
    ...(process.env['TASTIR_PERF'] === '1'
      ? { name: 'engine-speed', include: perf }
      : { name: 'engine', include, exclude: perf }),
  },
}));
