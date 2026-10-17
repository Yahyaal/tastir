import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import {
  SETTINGS,
  compareDatabase,
  expectedDatabase,
  preflight,
  readDatabase,
  validateSettings,
} from './studio-preflight.mjs';

const root = resolve(import.meta.dirname, '..');
const require = createRequire(join(root, 'apps/studio/package.json'));
const { PGlite } = require('@electric-sql/pglite');
const { drizzle } = require('drizzle-orm/pglite');
const { migrate } = require('drizzle-orm/pglite/migrator');
const env = {
  TASTIR_STUDIO_DATABASE_URL:
    'postgres://fixture:private-password@database.invalid/neondb?sslmode=verify-full',
  TASTIR_STUDIO_URL: 'https://tastir-fixture.vercel.app',
  TASTIR_STUDIO_OWNERS: 'owner@tastir.invalid',
  TASTIR_STUDIO_SESSION_SECRET: '19ab'.repeat(16),
  GOOGLE_CLIENT_ID: '123-fixture.apps.googleusercontent.com',
  GOOGLE_CLIENT_SECRET: 'private-google-value',
  BLOB_READ_WRITE_TOKEN: 'private-blob-value',
  LIVE_ROOM_ORIGIN: 'https://tastir-live-fixture.workers.dev',
  LIVE_ROOM_SECRET: '27cd'.repeat(16),
};
let db;
let fixture;
let expected;
before(async () => {
  db = new PGlite();
  await migrate(drizzle(db), {
    migrationsFolder: join(root, 'apps/studio/drizzle'),
  });
  expected = await expectedDatabase(root);
  fixture = await mkdtemp(join(tmpdir(), 'tastir-preflight-'));
  await mkdir(join(fixture, 'apps/studio/src'), { recursive: true });
  await mkdir(join(fixture, 'api'));
  await symlink(
    join(root, 'apps/studio/drizzle'),
    join(fixture, 'apps/studio/drizzle'),
    'dir',
  );
  await writeFile(
    join(fixture, 'apps/studio/src/vercel.ts'),
    SETTINGS.map((name) => `setting('${name}');`).join('\n'),
  );
  await writeFile(join(fixture, 'api/index.ts'), '// H4 entry fixture\n');
  await writeFile(join(fixture, 'vercel.json'), '{}');
});
after(async () => {
  await db?.close();
  if (fixture) await rm(fixture, { recursive: true, force: true });
});
const inspect = () => readDatabase(async (sql) => (await db.query(sql)).rows);
test('complete settings and the actual migrated schema pass without altering database contents', async () => {
  await db.exec(
    "INSERT INTO projects VALUES ('preflight-project', 'Private drawing', 'now', 'now', 1, 1, '{}', null)",
  );
  const result = await preflight({
    env,
    root: fixture,
    inspectDatabase: inspect,
  });
  assert.equal(
    result.every((item) => item.ok),
    true,
    JSON.stringify(result),
  );
  assert.deepEqual((await db.query('SELECT title FROM projects')).rows, [
    { title: 'Private drawing' },
  ]);
});
test('migration history is checked by hashes and timestamps, including a missing migration', async () => {
  const actual = await inspect();
  assert.equal(compareDatabase(expected, actual).ok, true);
  assert.equal(
    compareDatabase(expected, {
      ...actual,
      migrations: actual.migrations.slice(1),
    }).ok,
    false,
  );
  assert.equal(
    compareDatabase(expected, {
      ...actual,
      migrations: actual.migrations.map((row, i) =>
        i === 0 ? { ...row, hash: 'changed' } : row,
      ),
    }).ok,
    false,
  );
  assert.equal(
    compareDatabase(expected, {
      ...actual,
      migrations: actual.migrations.map((row, i) =>
        i === 0 ? { ...row, created_at: '0' } : row,
      ),
    }).ok,
    false,
  );
});
test('a migrated journal cannot conceal a missing real database column', async () => {
  await db.exec('ALTER TABLE entries DROP COLUMN actor');
  try {
    assert.equal(compareDatabase(expected, await inspect()).ok, false);
  } finally {
    await db.exec('ALTER TABLE entries ADD COLUMN actor text');
  }
});
test('an empty database reports missing migrations without writing tables', async () => {
  const empty = new PGlite();
  try {
    const result = await preflight({
      env,
      root: fixture,
      inspectDatabase: () =>
        readDatabase(async (sql) => (await empty.query(sql)).rows),
    });
    assert.match(
      result.find((item) => item.name === 'Database').message,
      /migration tables are missing/,
    );
    assert.equal(
      (
        await empty.query(
          "SELECT count(*) AS count FROM information_schema.tables WHERE table_schema = 'public'",
        )
      ).rows[0].count,
      0,
    );
  } finally {
    await empty.close();
  }
});
test('missing/placeholder settings, insecure URLs and weak/shared keys fail before a database connection', async () => {
  assert.equal(
    validateSettings({}).filter((item) => !item.ok).length,
    SETTINGS.length,
  );
  for (const name of SETTINGS) {
    const result = validateSettings({ ...env, [name]: '<replace-me>' });
    assert.equal(result.find((item) => item.name === name).ok, false);
  }
  for (const name of ['TASTIR_STUDIO_URL', 'LIVE_ROOM_ORIGIN']) {
    for (const value of [
      'http://tastir.invalid',
      'https://user:password@tastir.invalid',
      'https://tastir.invalid/path',
      'https://localhost',
      'https://tastir.invalid?secret=value',
    ]) {
      assert.equal(
        validateSettings({ ...env, [name]: value }).find(
          (item) => item.name === name,
        ).ok,
        false,
      );
    }
  }
  assert.equal(
    validateSettings({
      ...env,
      LIVE_ROOM_SECRET: env.TASTIR_STUDIO_SESSION_SECRET,
    }).some((item) => !item.ok),
    true,
  );
  assert.equal(
    validateSettings({
      ...env,
      TASTIR_STUDIO_SESSION_SECRET: 'x'.repeat(32),
    }).find((item) => item.name === 'TASTIR_STUDIO_SESSION_SECRET').ok,
    false,
  );
  let calls = 0;
  const result = await preflight({
    root: fixture,
    env: {
      ...env,
      TASTIR_STUDIO_DATABASE_URL: 'postgres://unsafe/without-tls',
    },
    inspectDatabase: async () => {
      calls++;
    },
  });
  assert.equal(calls, 0);
  assert.equal(
    result.some((item) => !item.ok),
    true,
  );
});
test('database exceptions and diagnostics never disclose values, including an error containing every credential', async () => {
  const result = await preflight({
    env,
    root: fixture,
    inspectDatabase: async () => {
      throw new Error(Object.values(env).join('\n'));
    },
  });
  const text = JSON.stringify(result);
  for (const value of Object.values(env))
    assert.equal(text.includes(value), false);
  assert.match(text, /Driver details are hidden/);
});
test('H4 files must exist, and new server setting names require a guide/preflight update', async () => {
  const source = join(fixture, 'apps/studio/src/vercel.ts');
  const original = await readFile(source, 'utf8');
  await writeFile(source, `${original}\nsetting('NEW_REQUIRED_SETTING');`);
  try {
    const result = await preflight({
      env,
      root: fixture,
      inspectDatabase: inspect,
    });
    assert.equal(
      result.find((item) => item.name === 'H4 settings contract').ok,
      false,
    );
  } finally {
    await writeFile(source, original);
  }
  const missing = await preflight({ env: {}, root: tmpdir() });
  assert.equal(
    missing.find((item) => item.name === 'H4 deployment files').ok,
    false,
  );
});
test('CLI exits nonzero with plain missing-setting diagnostics and no secret output', () => {
  const childEnv = { ...process.env };
  for (const name of SETTINGS) delete childEnv[name];
  childEnv.GOOGLE_CLIENT_SECRET = 'sentinel-private-google-value';
  childEnv.BLOB_READ_WRITE_TOKEN = 'sentinel-private-blob-value';
  const child = spawnSync(process.execPath, ['tools/studio-preflight.mjs'], {
    cwd: root,
    env: childEnv,
    encoding: 'utf8',
  });
  assert.equal(child.status, 1);
  assert.match(child.stdout, /FAIL TASTIR_STUDIO_DATABASE_URL/);
  assert.equal(
    (child.stdout + child.stderr).includes('sentinel-private-'),
    false,
  );
  const missingFile = spawnSync(
    process.execPath,
    ['tools/studio-preflight.mjs', '--settings', '/unavailable/private-env'],
    { cwd: root, env: childEnv, encoding: 'utf8' },
  );
  assert.equal(missingFile.status, 1);
  assert.match(missingFile.stderr, /Cannot read the environment file/);
});

test('the deployment URL must match postgres.js TLS verification and omit libpq-only startup parameters', async () => {
  const postgres = require('postgres');
  const client = postgres(env.TASTIR_STUDIO_DATABASE_URL);
  try {
    assert.equal(client.options.ssl, 'verify-full');
  } finally {
    await client.end();
  }
  for (const suffix of [
    '?sslmode=require',
    '?sslmode=disable',
    '?sslmode=verify-full&channel_binding=require',
  ]) {
    const value = env.TASTIR_STUDIO_DATABASE_URL.split('?')[0] + suffix;
    assert.equal(
      validateSettings({ ...env, TASTIR_STUDIO_DATABASE_URL: value }).find(
        (item) => item.name === 'TASTIR_STUDIO_DATABASE_URL',
      ).ok,
      false,
    );
  }
});

test('connection failures produce actionable fixed diagnostics without raw driver details', async () => {
  for (const [code, wording] of [
    ['28P01', /authentication failed/],
    ['ENOTFOUND', /host could not be found/],
    ['42501', /permission denied/],
    ['UNABLE_TO_VERIFY_LEAF_SIGNATURE', /TLS certificate validation failed/],
  ]) {
    const result = await preflight({
      env,
      root: fixture,
      inspectDatabase: async () => {
        throw Object.assign(new Error(env.TASTIR_STUDIO_DATABASE_URL), {
          code,
        });
      },
    });
    const diagnostic = result.find((item) => item.name === 'Database');
    assert.equal(diagnostic.ok, false);
    assert.match(diagnostic.message, wording);
    assert.equal(
      JSON.stringify(result).includes(env.TASTIR_STUDIO_DATABASE_URL),
      false,
    );
  }
});

test('CLI reads an explicitly selected private settings file and keeps its contents out of diagnostics', async () => {
  const file = join(fixture, 'private-settings.env');
  const values = {
    ...env,
    TASTIR_STUDIO_DATABASE_URL: 'invalid-address-with-private-password',
  };
  await writeFile(
    file,
    Object.entries(values)
      .map(([name, value]) => `${name}=${JSON.stringify(value)}`)
      .join('\n'),
    { mode: 0o600 },
  );
  const childEnv = { ...process.env };
  for (const name of SETTINGS) delete childEnv[name];
  const child = spawnSync(
    process.execPath,
    ['tools/studio-preflight.mjs', '--settings', file],
    { cwd: root, env: childEnv, encoding: 'utf8' },
  );
  assert.equal(child.status, 1);
  assert.match(child.stdout, /OK BLOB_READ_WRITE_TOKEN: Present/);
  assert.match(child.stdout, /OK LIVE_ROOM_SECRET/);
  for (const value of Object.values(values))
    assert.equal((child.stdout + child.stderr).includes(value), false);
});
