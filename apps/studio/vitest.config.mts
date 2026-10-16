import { defaultServerConditions } from 'vite';
import { defineConfig } from 'vitest/config';
export default defineConfig({
  root: import.meta.dirname,
  // Use the workspace packages' TypeScript sources, as the player does.
  resolve: { conditions: ['@tastir/source', ...defaultServerConditions] },
  ssr: {
    resolve: { conditions: ['@tastir/source', ...defaultServerConditions] },
  },
  test: {
    name: 'studio',
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
  },
});
