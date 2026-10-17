import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawn, spawnSync } from 'node:child_process';
import { createHmac } from 'node:crypto';
import { createRequire } from 'node:module';
import { createServer } from 'node:net';
import { once } from 'node:events';
import {
  cp,
  glob,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { gzipSync } from 'node:zlib';
import { buildStudio, output, root } from './studio-build.mjs';

const require = createRequire(import.meta.url);
const { build } = createRequire(join(root, 'apps/live-room/package.json'))(
  'esbuild',
);
const sharp = require('sharp');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    timeout: 30_000,
    ...options,
  });
  assert.equal(
    result.status,
    0,
    `${command} failed: ${result.error?.message ?? ''}\n${result.stdout ?? ''}\n${result.stderr ?? ''}`,
  );
  return result.stdout;
}

async function files(directory) {
  const found = [];
  for (const name of await readdir(directory)) {
    const path = join(directory, name);
    const stat = await lstat(path);
    assert.ok(
      !stat.isSymbolicLink(),
      `Packaged files must not link to the checkout: ${path}`,
    );
    if (stat.isDirectory()) found.push(...(await files(path)));
    else found.push(path);
  }
  return found;
}

async function postgresBin() {
  const candidates = process.env.STUDIO_TEST_POSTGRES_BIN
    ? [process.env.STUDIO_TEST_POSTGRES_BIN]
    : [
        '/usr/lib/postgresql/16/bin',
        '/usr/lib/postgresql/15/bin',
        '/usr/local/opt/postgresql@16/bin',
        '/opt/homebrew/opt/postgresql@16/bin',
      ];
  const path = candidates.find((candidate) =>
    existsSync(join(candidate, 'initdb')),
  );
  assert.ok(
    path,
    'Install PostgreSQL or set STUDIO_TEST_POSTGRES_BIN to its bin directory. Run this test as a non-root user.',
  );
  return path;
}

// This bootstrap is test-only. The function it loads is the actual API entry,
// transpiled exactly once to JS, importing the packaged production bundle.
const bootstrap = String.raw`
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const renderer = require('./dist/studio-function/node_modules/@resvg/resvg-js');
const NativeResvg = renderer.Resvg;
const font = fileURLToPath(new URL('./dist/studio-function/fonts/DejaVuSans.ttf', import.meta.url));
await readFile(font); // Permission model permits only this artifact, never the checkout.
let fontCalls = 0;
let textCalls = 0;
let fontPng;
renderer.Resvg = class extends NativeResvg {
  constructor(svg, options) {
    assert.equal(options.font.loadSystemFonts, false);
    assert.deepEqual(options.font.fontFiles, [font]);
    fontCalls++;
    if (svg.includes('<text')) {
      textCalls++;
      // Prove the same font options produce visible glyphs with the real native renderer.
      fontPng = new NativeResvg('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60"><rect width="200" height="60" fill="white"/><text x="10" y="40" font-family="DejaVu Sans" font-size="28" fill="black">Tastir O A</text></svg>', {font: options.font}).render().asPng();
    }
    super(svg, options);
  }
};
const { default: app } = await import('./api/index.mjs');
const server = app.listen(0, '127.0.0.1', () => process.send({port: server.address().port}));
process.on('message', () => process.send({fontCalls, textCalls, fontPng: fontPng?.toString('base64')}));
`;

test(
  'H5: packaged function runs without source against real local PostgreSQL',
  { timeout: 120_000 },
  async (t) => {
    const pg = await postgresBin();
    await buildStudio();
    const temporary = await mkdtemp(join(tmpdir(), 'tastir-function-proof-'));
    const artifact = join(temporary, 'artifact');
    const data = join(temporary, 'pg');
    let started = false;
    let child;
    let stderr = '';
    try {
      await mkdir(join(artifact, 'api'), { recursive: true });
      // Stage the files selected by the real deployment config, not a parallel
      // hard-coded asset list that could hide a broken includeFiles setting.
      const config = JSON.parse(
        await readFile(join(root, 'vercel.json'), 'utf8'),
      );
      assert.ok(
        config.buildCommand.startsWith('node tools/studio-build.mjs && '),
      );
      for await (const path of glob(
        config.functions['api/index.ts'].includeFiles,
        { cwd: root },
      )) {
        if (!(await lstat(join(root, path))).isFile()) continue;
        await mkdir(dirname(join(artifact, path)), { recursive: true });
        await cp(join(root, path), join(artifact, path));
      }
      await writeFile(join(artifact, 'package.json'), '{"type":"module"}\n');
      await build({
        entryPoints: [join(root, 'api/index.ts')],
        outfile: join(artifact, 'api/index.mjs'),
        platform: 'node',
        format: 'esm',
        target: 'node22',
        bundle: false,
      });
      const packaged = await files(artifact);
      assert.ok(
        !packaged.some((path) => /\.(?:ts|mts|tsx)$/.test(path)),
        'No TypeScript source or declarations in the isolated function',
      );
      assert.ok(
        packaged.some((path) => path.endsWith('.node')),
        'Native resvg binary included',
      );
      assert.deepEqual(
        await readFile(
          join(artifact, 'dist/studio-function/fonts/DejaVuSans.ttf'),
        ),
        await readFile(join(root, 'apps/studio/fonts/DejaVuSans.ttf')),
      );
      const bytes = await Promise.all(packaged.map((path) => readFile(path)));
      const size = bytes.reduce((sum, value) => sum + value.length, 0);
      const compressed = bytes.reduce(
        (sum, value) => sum + gzipSync(value).length,
        0,
      );
      assert.ok(
        size < 250_000_000,
        'Function must fit Vercel’s standard 250 MB uncompressed limit',
      );
      t.diagnostic(
        `Packaged function: ${packaged.length} files, ${size} bytes uncompressed, ${compressed} bytes individually gzipped (not a Vercel ZIP).`,
      );
      const meta = JSON.parse(
        await readFile(join(root, 'dist/studio-function-meta.json'), 'utf8'),
      );
      assert.ok(
        Object.keys(meta.inputs).some((path) =>
          path.includes('packages/project-core/src/'),
        ),
      );
      assert.ok(
        Object.keys(meta.inputs).some((path) =>
          path.includes('apps/live-room/src/server.ts'),
        ),
      );
      assert.ok(
        Object.values(meta.outputs).every((chunk) =>
          chunk.imports.every((entry) => !entry.path.startsWith('@tastir/')),
        ),
      );

      // Dedicated, disposable real Postgres cluster; never the owner's database.
      run(join(pg, 'initdb'), [
        '-D',
        data,
        '-U',
        'fixture',
        '-A',
        'trust',
        '--no-locale',
        '--encoding=UTF8',
      ]);
      const socket = createServer();
      socket.listen(0, '127.0.0.1');
      await once(socket, 'listening');
      const port = socket.address().port;
      await new Promise((done) => socket.close(done));
      run(join(pg, 'pg_ctl'), [
        '-D',
        data,
        '-l',
        join(temporary, 'postgres.log'),
        '-w',
        '-t',
        '15',
        '-o',
        `-h 127.0.0.1 -p ${port} -k ${temporary} -F`,
        'start',
      ]);
      started = true;
      const url = `postgres://fixture@127.0.0.1:${port}/postgres?sslmode=disable`;
      // Migrations are setup, separate from the isolated function process below.
      run(
        process.execPath,
        [
          '--conditions=@tastir/source',
          '--import',
          'tsx',
          'tools/studio-db.mts',
        ],
        { cwd: root, env: { ...process.env, TASTIR_STUDIO_DATABASE_URL: url } },
      );
      await writeFile(join(artifact, 'proof.mjs'), bootstrap);
      const secret = 'isolated-local-proof-'.repeat(3);
      child = spawn(
        process.execPath,
        [
          '--max-old-space-size=512',
          '--permission',
          `--allow-fs-read=${artifact}`,
          '--allow-addons',
          'proof.mjs',
        ],
        {
          cwd: artifact,
          // Explicit environment: no NODE_PATH, TS loaders or provider credentials.
          env: {
            PATH: process.env.PATH,
            HOME: temporary,
            TASTIR_STUDIO_DATABASE_URL: url,
            TASTIR_STUDIO_URL: 'https://tastir-proof.example',
            TASTIR_STUDIO_OWNERS: 'owner@example.invalid',
            TASTIR_STUDIO_SESSION_SECRET: secret,
            GOOGLE_CLIENT_ID: 'fixture.apps.googleusercontent.com',
            GOOGLE_CLIENT_SECRET: 'local-fixture-only',
          },
          stdio: ['ignore', 'ignore', 'pipe', 'ipc'],
        },
      );
      child.stderr.on('data', (chunk) => {
        stderr += chunk;
      });
      const first = await Promise.race([
        once(child, 'message', { signal: AbortSignal.timeout(20_000) }),
        once(child, 'exit').then(() => {
          throw new Error(`Packaged function exited: ${stderr}`);
        }),
      ]);
      const site = `http://127.0.0.1:${first[0].port}`;
      const request = (path, options) =>
        fetch(`${site}${path}`, {
          signal: AbortSignal.timeout(10_000),
          ...options,
        });
      const me = await request('/api/me');
      assert.equal(me.status, 401);
      assert.deepEqual(await me.json(), {
        error: 'Sign in to use the studio.',
      });
      const metadata = await (
        await request('/.well-known/oauth-authorization-server')
      ).json();
      assert.equal(metadata.issuer, 'https://tastir-proof.example/');
      assert.equal(
        metadata.authorization_endpoint,
        'https://tastir-proof.example/authorize',
      );
      assert.equal(
        metadata.token_endpoint,
        'https://tastir-proof.example/token',
      );
      const login = await request('/login', { redirect: 'manual' });
      assert.equal(login.status, 302);
      assert.equal(
        new URL(login.headers.get('location')).searchParams.get('redirect_uri'),
        'https://tastir-proof.example/auth/google',
      );
      const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString(
        'base64url',
      );
      const payload = Buffer.from(
        JSON.stringify({
          email: 'owner@example.invalid',
          aud: 'session',
          exp: Math.floor(Date.now() / 1000) + 300,
        }),
      ).toString('base64url');
      const signed = `${header}.${payload}`;
      const token = `${signed}.${createHmac('sha256', secret).update(signed).digest('base64url')}`;
      const headers = {
        cookie: `tastir_session=${token}`,
        'content-type': 'application/json',
      };
      const library = await (await request('/api/library', { headers })).json();
      assert.ok(library.length >= 39, 'Shipped tutorials load');
      const made = await request('/api/projects', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          author: 'owner',
          title: 'Packaged font proof',
          from: { tutorial: 'eight-fold-khatam', step: 2 },
        }),
      });
      assert.equal(made.status, 200, await made.clone().text());
      const project = await made.json();
      assert.ok(project.project, JSON.stringify(project));
      const picture = await request(
        `/api/projects/${project.project}/picture?size=400`,
        { headers },
      );
      assert.equal(picture.status, 200, await picture.clone().text());
      assert.equal(picture.headers.get('content-type'), 'image/png');
      const png = Buffer.from(await picture.arrayBuffer());
      assert.deepEqual(
        png.subarray(0, 8),
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      );
      const image = await sharp(png).metadata();
      assert.equal(Math.max(image.width, image.height), 400);
      assert.ok(
        (await sharp(png).stats()).channels.some(
          (channel) => channel.stdev > 5,
        ),
      );
      const evidence = once(child, 'message', {
        signal: AbortSignal.timeout(10_000),
      });
      child.send('font evidence');
      const [font] = await evidence;
      assert.ok(
        font.fontCalls >= 2 && font.textCalls >= 2,
        'HTTP picture rendered point labels using the packaged font',
      );
      assert.ok(
        (await sharp(Buffer.from(font.fontPng, 'base64')).stats()).channels[0]
          .min < 100,
        'Native renderer produced visible text glyphs with the bundled font',
      );
      const saved = run(join(pg, 'psql'), [
        '-h',
        '127.0.0.1',
        '-p',
        String(port),
        '-U',
        'fixture',
        '-d',
        'postgres',
        '-Atc',
        'select count(*) from projects',
      ]);
      assert.equal(saved.trim(), '1', 'Real project persisted to Postgres');
      t.diagnostic(
        '401, OAuth metadata/callback, tutorial import, Postgres write and labelled PNG passed with filesystem access restricted to the isolated artifact.',
      );
      t.diagnostic(
        `Server bundle: ${relative(root, output)}/server/index.mjs. No checkout imports or system font fallback permitted.`,
      );
    } finally {
      if (child && child.exitCode === null && child.signalCode === null) {
        const exited = once(child, 'exit');
        child.kill('SIGTERM');
        await exited;
      }
      if (started)
        run(join(pg, 'pg_ctl'), [
          '-D',
          data,
          '-w',
          '-t',
          '15',
          '-m',
          'immediate',
          'stop',
        ]);
      await rm(temporary, { recursive: true, force: true });
    }
  },
);
