// Brings a studio database's tables up to date. It names the database it
// changes and changes only the one given:
//   pnpm studio:db:migrate <postgres://…>
import { migratePostgres } from '../apps/studio/src/pg.js';

const url = process.argv[2] ?? process.env['TASTIR_STUDIO_DATABASE_URL'];
if (!url) throw new Error('Give the database address to migrate.');
const where = new URL(url);
process.stdout.write(`Migrating ${where.host}${where.pathname}…\n`);
await migratePostgres(url);
process.stdout.write('Done.\n');
