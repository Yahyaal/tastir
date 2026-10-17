import { defineConfig } from 'drizzle-kit';

// The hosted studio's tables. `pnpm studio:db:generate` writes a migration
// to drizzle/ after a change to src/pg.ts.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/pg.ts',
  out: './drizzle',
});
