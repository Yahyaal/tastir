import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseEnv } from 'node:util';

const repository = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// Settings the hosted server reads that Vercel sets itself: connecting the
// private Blob store to the project adds BLOB_STORE_ID (or a token), so the
// owner never copies them and this check does not ask for them.
export const PLATFORM_SETTINGS = [
  'BLOB_STORE_ID',
  'BLOB_READ_WRITE_TOKEN',
  'VERCEL',
];

// Optional feedback settings are validated together when intake is enabled.
export const FEEDBACK_SETTINGS = [
  'TASTIR_FEEDBACK_ENABLED',
  'TURNSTILE_SITE_KEY',
  'TURNSTILE_SECRET_KEY',
  'TASTIR_FEEDBACK_CONTACT',
  'CRON_SECRET',
];

export const SETTINGS = [
  'TASTIR_STUDIO_DATABASE_URL',
  'TASTIR_STUDIO_URL',
  'TASTIR_STUDIO_OWNERS',
  'TASTIR_STUDIO_SESSION_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'LIVE_ROOM_ORIGIN',
  'LIVE_ROOM_SECRET',
];
const placeholder = (value) =>
  /(?:^<[^>]+>$|replace[_ -]?me|change[_ -]?me|your[_ -]|example\.(?:com|org|net)|^secret$|^test$)/i.test(
    value,
  );
function check(name, ok, message) {
  return { name, ok, message };
}
function httpsOrigin(value) {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      url.pathname === '/' &&
      url.origin === value &&
      !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    );
  } catch {
    return false;
  }
}
/** All diagnostics are fixed text and setting NAMES. Never interpolate a value or driver error. */
export function validateSettings(env) {
  const checks = [];
  const values = Object.fromEntries(
    SETTINGS.map((name) => [name, env[name]?.trim() ?? '']),
  );
  for (const name of SETTINGS) {
    const value = values[name];
    if (!value || placeholder(value)) {
      checks.push(
        check(
          name,
          false,
          'Missing or still a placeholder; follow STUDIO-DEPLOY.md.',
        ),
      );
      continue;
    }
    let ok = true;
    let message = 'Present.';
    if (name === 'TASTIR_STUDIO_DATABASE_URL') {
      try {
        const url = new URL(value);
        ok =
          ['postgres:', 'postgresql:'].includes(url.protocol) &&
          !!url.hostname &&
          !!url.username &&
          !!url.password &&
          url.pathname.length > 1 &&
          !url.hash &&
          url.searchParams.get('sslmode') === 'verify-full' &&
          !url.searchParams.has('channel_binding');
      } catch {
        ok = false;
      }
      message = ok
        ? 'Postgres address has credentials and requires certificate-verified TLS.'
        : 'Use the Neon postgres.js address with credentials, database name and sslmode=verify-full; omit the libpq-only channel_binding parameter.';
    } else if (name === 'TASTIR_STUDIO_URL' || name === 'LIVE_ROOM_ORIGIN') {
      ok = httpsOrigin(value);
      message = ok
        ? 'Public HTTPS origin.'
        : 'Use an HTTPS origin only, without a path, query, credentials or localhost.';
    } else if (name === 'TASTIR_STUDIO_OWNERS') {
      ok = value
        .split(',')
        .every((email) => /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/.test(email.trim()));
      message = ok
        ? 'Owner email allowlist is present.'
        : 'Use comma-separated email addresses, with no empty entries.';
    } else if (name === 'TASTIR_STUDIO_SESSION_SECRET') {
      ok =
        value.length >= 32 &&
        value === env[name] &&
        !/^([\s\S])\1+$/.test(value);
      message = ok
        ? 'Session signing secret is present.'
        : 'Use at least 32 random characters, without surrounding whitespace.';
    } else if (name === 'LIVE_ROOM_SECRET') {
      ok =
        /^[a-f\d]{64}$/i.test(value) &&
        value === env[name] &&
        !/^([a-f\d])\1+$/i.test(value);
      message = ok
        ? 'Room signing secret has the required format.'
        : 'Use a random 32-byte key encoded as exactly 64 hexadecimal characters.';
    } else if (name === 'GOOGLE_CLIENT_ID') {
      ok = /^[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(value);
      message = ok
        ? 'Google web client ID is present.'
        : 'Use the web application client ID from Google Auth Platform.';
    } else {
      ok = value === env[name] && !/\s/.test(value);
      message = ok
        ? 'Present (not authenticated by this check).'
        : 'Remove whitespace; copy the full value directly from the provider.';
    }
    checks.push(check(name, ok, message));
  }
  if (
    values.LIVE_ROOM_SECRET &&
    values.LIVE_ROOM_SECRET === values.TASTIR_STUDIO_SESSION_SECRET
  ) {
    checks.push(
      check(
        'Signing keys',
        false,
        'Generate separate session and room signing secrets.',
      ),
    );
  }
  if (env.TASTIR_FEEDBACK_ENABLED === '1') {
    const siteKey = env.TURNSTILE_SITE_KEY?.trim() ?? '';
    const tokenSecret = env.TURNSTILE_SECRET_KEY?.trim() ?? '';
    const contact = env.TASTIR_FEEDBACK_CONTACT?.trim() ?? '';
    const cronSecret = env.CRON_SECRET ?? '';
    const ready =
      siteKey &&
      tokenSecret &&
      !placeholder(siteKey) &&
      !placeholder(tokenSecret) &&
      !/^[123]x0{10,}/.test(siteKey) &&
      !/^[123]x0{10,}/.test(tokenSecret) &&
      contact.length <= 254 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) &&
      cronSecret.length >= 32 &&
      cronSecret === cronSecret.trim() &&
      !/^([\s\S])\1+$/.test(cronSecret);
    checks.push(
      check(
        'Feedback setup',
        !!ready,
        ready
          ? 'Feedback settings present; verify real Turnstile, private storage, cron and provider limits before enabling.'
          : 'Enabled feedback needs production TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY, a valid TASTIR_FEEDBACK_CONTACT, and a random CRON_SECRET of at least 32 characters. Test keys cannot enable production intake.',
      ),
    );
  }
  return checks;
}

/** Reads checked-in migration metadata, not application code or private data. */
export async function expectedDatabase(root) {
  const folder = join(root, 'apps/studio/drizzle');
  const journal = JSON.parse(
    await readFile(join(folder, 'meta/_journal.json'), 'utf8'),
  );
  if (!Array.isArray(journal.entries) || !journal.entries.length)
    throw new Error('Migration metadata unavailable');
  const migrations = [];
  for (const entry of journal.entries) {
    if (
      !/^\d{4}_[A-Za-z0-9_-]+$/.test(entry.tag) ||
      !Number.isSafeInteger(entry.when)
    )
      throw new Error('Invalid migration metadata');
    const sql = await readFile(join(folder, `${entry.tag}.sql`), 'utf8');
    migrations.push({
      hash: createHash('sha256').update(sql).digest('hex'),
      created_at: String(entry.when),
    });
  }
  const latest = journal.entries.at(-1);
  const snapshot = JSON.parse(
    await readFile(
      join(
        folder,
        'meta',
        `${String(latest.idx).padStart(4, '0')}_snapshot.json`,
      ),
      'utf8',
    ),
  );
  const columns = Object.values(snapshot.tables).flatMap((table) =>
    Object.values(table.columns).map((column) => ({
      table_schema: table.schema || 'public',
      table_name: table.name,
      column_name: column.name,
    })),
  );
  return { migrations, columns };
}
export function compareDatabase(expected, actual) {
  const same =
    expected.migrations.length === actual.migrations.length &&
    expected.migrations.every(
      (migration, i) =>
        migration.hash === actual.migrations[i]?.hash &&
        migration.created_at === String(actual.migrations[i]?.created_at),
    );
  if (!same)
    return check(
      'Database migrations',
      false,
      'Migration history differs from this checkout. Run studio:db:migrate from the merged H4/H7 checkout, then retry.',
    );
  const found = new Set(
    actual.columns.map(
      (column) =>
        `${column.table_schema}.${column.table_name}.${column.column_name}`,
    ),
  );
  if (
    !expected.columns.every((column) =>
      found.has(
        `${column.table_schema}.${column.table_name}.${column.column_name}`,
      ),
    )
  ) {
    return check(
      'Database schema',
      false,
      'Required tables or columns are missing. Check the selected database and repair its schema before deploying.',
    );
  }
  return check(
    'Database',
    true,
    'Reachable over verified TLS; migration history and required tables/columns match this checkout.',
  );
}
/** query returns rows. Kept separate so tests exercise real SQL against an isolated database. */
export async function readDatabase(query) {
  const migrations = await query(
    'SELECT hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at, id',
  );
  const columns = await query(
    "SELECT table_schema, table_name, column_name FROM information_schema.columns WHERE table_schema = 'public'",
  );
  return { migrations, columns };
}
async function inspectPostgres(url, root) {
  const require = createRequire(join(root, 'apps/studio/package.json'));
  const postgres = require('postgres');
  const client = postgres(url, {
    prepare: false,
    max: 1,
    connect_timeout: 5,
    idle_timeout: 1,
    ssl: { rejectUnauthorized: true },
    onnotice: () => undefined,
    debug: false,
  });
  let timer;
  try {
    return await Promise.race([
      client.begin('read only', async (tx) => {
        await tx.unsafe("SET LOCAL statement_timeout = '5s'");
        await tx.unsafe("SET LOCAL lock_timeout = '1s'");
        return readDatabase((sql) => tx.unsafe(sql));
      }),
      new Promise((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              Object.assign(new Error('Database timeout'), {
                code: 'ETIMEDOUT',
              }),
            ),
          12_000,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
    await client.end({ timeout: 1 });
  }
}
export async function preflight({
  env = process.env,
  root = repository,
  inspectDatabase = inspectPostgres,
} = {}) {
  const checks = validateSettings(env);
  try {
    const source = await readFile(
      join(root, 'apps/studio/src/vercel.ts'),
      'utf8',
    );
    const names = [
      ...source.matchAll(
        /(?:setting\(\s*['"]|process\.env\[\s*['"]|process\.env\.)([A-Z][A-Z0-9_]*)/g,
      ),
    ].map((match) => match[1]);
    const unknown = [...new Set(names)].filter(
      (name) =>
        !SETTINGS.includes(name) &&
        !PLATFORM_SETTINGS.includes(name) &&
        !FEEDBACK_SETTINGS.includes(name),
    );
    checks.push(
      check(
        'H4 settings contract',
        !unknown.length,
        unknown.length
          ? `New setting names need documenting and validation: ${unknown.join(', ')}.`
          : 'Hosted server setting names are covered.',
      ),
    );
    for (const file of ['vercel.json', 'api/index.js']) {
      await readFile(join(root, file), 'utf8');
    }
  } catch {
    checks.push(
      check(
        'H4 deployment files',
        false,
        'Hosted deployment files are missing or unreadable. Merge H4 before deploying.',
      ),
    );
  }
  if (checks.find((item) => item.name === 'TASTIR_STUDIO_DATABASE_URL')?.ok) {
    try {
      const expected = await expectedDatabase(root);
      const actual = await inspectDatabase(
        env.TASTIR_STUDIO_DATABASE_URL.trim(),
        root,
      );
      checks.push(compareDatabase(expected, actual));
    } catch (error) {
      const diagnostics = {
        '42P01':
          'Database is reachable but migration tables are missing. Run studio:db:migrate first.',
        '3F000':
          'Database is reachable but migration tables are missing. Run studio:db:migrate first.',
        '28P01':
          'Database authentication failed. Check the role and password in the private connection string.',
        28000:
          'Database authentication failed. Check the role and password in the private connection string.',
        '3D000':
          'The selected database does not exist. Copy the connection string for the correct Neon database.',
        42501:
          'Database permission denied. The selected role needs access to the migration journal and schema metadata.',
        ENOTFOUND:
          'Database host could not be found. Check the connection string and DNS/network access.',
        EAI_AGAIN:
          'Database DNS lookup failed. Check network access and retry.',
        ECONNREFUSED:
          'Database connection was refused. Check the host, port and network access.',
        ETIMEDOUT:
          'Database connection timed out. Check network access and retry.',
        CERT_HAS_EXPIRED:
          'Database TLS certificate validation failed. Check the endpoint and system clock; keep verification enabled.',
        UNABLE_TO_VERIFY_LEAF_SIGNATURE:
          'Database TLS certificate validation failed. Check the endpoint and trusted certificates; keep verification enabled.',
      };
      const message = Object.hasOwn(diagnostics, error?.code)
        ? diagnostics[error.code]
        : 'Database check failed. Check the connection string, TLS, network access and migration files. Driver details are hidden.';
      checks.push(check('Database', false, message));
    }
  }
  return checks;
}
export async function main(args = process.argv.slice(2)) {
  let env = process.env;
  if (args.length) {
    if (args.length !== 2 || args[0] !== '--settings') {
      console.error(
        'Usage: pnpm studio:preflight [--settings path-to-private-env-file]',
      );
      return 1;
    }
    try {
      const text = await readFile(args[1], 'utf8');
      if (Buffer.byteLength(text) > 64 * 1024)
        throw new Error('File too large');
      env = { ...parseEnv(text), ...process.env };
    } catch {
      console.error(
        'Cannot read the environment file. Check its path, permissions and format.',
      );
      return 1;
    }
  }
  try {
    const checks = await preflight({ env });
    for (const item of checks)
      console.log(`${item.ok ? 'OK' : 'FAIL'} ${item.name}: ${item.message}`);
    console.log(
      'This checks configuration and database state. Google/Blob credentials, the shared Cloudflare key and deployed routing still need the H5 smoke checks.',
    );
    return checks.every((item) => item.ok) ? 0 : 1;
  } catch {
    console.error(
      'Preflight could not complete. No credential values or driver details are shown.',
    );
    return 1;
  }
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  process.exitCode = await main();
}
