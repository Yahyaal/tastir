import { defineConfig } from 'vitest/config';
export default defineConfig({
  root: import.meta.dirname,
  test: {
    name: 'project-core',
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    // Its tests still sit beside the player's and studio's code, which
    // reaches it through re-exports.
    passWithNoTests: true,
  },
});
