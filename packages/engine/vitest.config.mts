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
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
    },
    // The speed targets are timed alone, after everything else, so the
    // golden tests (which grow with every tutorial) do not share the CPU.
    projects: [
      {
        extends: true as const,
        test: {
          name: 'engine',
          include,
          exclude: perf,
          sequence: { groupOrder: 0 },
        },
      },
      {
        extends: true as const,
        test: {
          name: 'engine-speed',
          include: perf,
          sequence: { groupOrder: 1 },
        },
      },
    ],
  },
}));
