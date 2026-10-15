import { defineConfig } from 'vitest/config';
export default defineConfig({
  root: import.meta.dirname,
  test: {
    name: 'agent-local',
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
  },
});
