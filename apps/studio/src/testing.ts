import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FileBackend, type Backend } from './backend.js';
import {
  MIGRATIONS,
  PgBackend,
  connectPostgres,
  migratePostgres,
} from './pg.js';

/**
 * The backends every studio test runs against: folders, and Postgres in
 * the test process (PGlite), so the tests need no database server. With
 * TEST_DATABASE_URL set (a database only for tests: its tables are
 * emptied), they also run against that real Postgres.
 */
export const BACKENDS = [
  'files',
  'pglite',
  ...(process.env['TEST_DATABASE_URL'] ? ['postgres'] : []),
] as const;
export type BackendKind = (typeof BACKENDS)[number];

export interface TestBackend {
  readonly root: string;
  /** Another backend on the same projects, as a second server would have. */
  readonly make: () => Promise<Backend>;
  readonly backend: Backend;
  readonly close: () => Promise<void>;
}

export async function testBackend(kind: BackendKind): Promise<TestBackend> {
  const root = await mkdtemp(join(tmpdir(), 'studio-'));
  const extra: Backend[] = [];
  let make: () => Promise<Backend>;
  let stop = async () => undefined as void;
  if (kind === 'files') make = async () => new FileBackend(root);
  else if (kind === 'pglite') {
    const { PGlite } = await import('@electric-sql/pglite');
    const { drizzle } = await import('drizzle-orm/pglite');
    const { migrate } = await import('drizzle-orm/pglite/migrator');
    const client = new PGlite();
    const db = drizzle(client);
    await migrate(db, { migrationsFolder: MIGRATIONS });
    make = async () => new PgBackend(db as never, root);
    stop = () => client.close();
  } else {
    const url = process.env['TEST_DATABASE_URL'] as string;
    await migratePostgres(url);
    const { default: postgres } = await import('postgres');
    const sql = postgres(url, {
      prepare: false,
      max: 1,
      onnotice: () => undefined,
    });
    await sql`truncate projects cascade`;
    await sql.end();
    make = async () => connectPostgres(url, root);
  }
  const backend = await make();
  return {
    root,
    backend,
    make: async () => {
      const b = await make();
      extra.push(b);
      return b;
    },
    close: async () => {
      for (const b of [backend, ...extra]) await b.close();
      await stop();
      await rm(root, { recursive: true, force: true });
    },
  };
}
