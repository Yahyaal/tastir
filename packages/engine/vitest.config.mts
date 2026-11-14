import { defineConfig } from 'vitest/config';

const include = [
  '{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
];
const perf = ['src/perf.spec.ts'];
// The exact-equivalence specs run every tutorial through a frozen copy of
// the old engine (over half an hour together). They guard rewrites of the
// engine's speed, so they run on demand, not on every change.
const equivalence = [
  'src/performance-equivalence.spec.ts',
  'src/crossings-equivalence.spec.ts',
];

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
    // sharing the CPU. The exact-equivalence specs are left out too (owner,
    // 13 November 2026): `pnpm test:equivalence` runs them, after any change
    // to the engine's geometry. The golden tests stay in `pnpm test`.
    ...(process.env['TASTIR_PERF'] === '1'
      ? { name: 'engine-speed', include: perf }
      : process.env['TASTIR_EQUIVALENCE'] === '1'
        ? {
            name: 'engine-equivalence',
            include: equivalence,
            // The frozen engine is slow on purpose; one tutorial can take
            // minutes, so these do not race the rest of the machine.
            maxWorkers: 1,
          }
        : { name: 'engine', include, exclude: [...perf, ...equivalence] }),
  },
}));
