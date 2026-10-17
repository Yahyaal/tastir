// Starts the studio: the service that owns the shared drawings, and the
// Tastir dev server beside it. Usage: pnpm studio [--no-app | --assistant]
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { chmod, mkdir, readFile, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { Studio, startMcpHttp, startServer } from '../apps/studio/src/index.js';
import { writeAtomic } from '../apps/studio/src/store.js';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
const root = process.env['TASTIR_STUDIO_DIR'] ?? join(repo, 'studio');
const withApp = !process.argv.includes('--no-app');
const withAssistant = process.argv.includes('--assistant');
if (withAssistant && !withApp)
  throw new Error('The in-app assistant needs the Studio page.');
const appPort = Number(process.env['TASTIR_STUDIO_APP_PORT'] ?? 4293);
if (!Number.isInteger(appPort) || appPort < 1024 || appPort > 65535)
  throw new Error(
    'TASTIR_STUDIO_APP_PORT must be a port between 1024 and 65535.',
  );
// Agents that cannot start a local program reach the studio over HTTP at a
// fixed port, so a tunnel or a connector keeps the same address.
const mcpPort = Number(process.env['TASTIR_STUDIO_MCP_PORT'] ?? 4294);
if (!Number.isInteger(mcpPort) || mcpPort < 0 || mcpPort > 65535)
  throw new Error('TASTIR_STUDIO_MCP_PORT must be a port number.');
const origin = `http://127.0.0.1:${appPort}`;
const info = join(root, '.service.json');

// One studio at a time, so two services never write the same project.
const running = await readFile(info, 'utf8')
  .then((t) => (JSON.parse(t) as { pid: number }).pid)
  .catch(() => undefined);
if (running) {
  let alive = true;
  try {
    process.kill(running, 0);
  } catch (e) {
    alive = (e as NodeJS.ErrnoException).code !== 'ESRCH';
  }
  if (alive)
    throw new Error(`The studio is already running (process ${running}).`);
}

// The projects hold the owner's own work and may hold private photos.
await mkdir(root, { recursive: true, mode: 0o700 });
await chmod(root, 0o700);
const studio = new Studio(root, join(repo, 'tutorials'));
await studio.list();
const secret = randomBytes(32).toString('base64url');
const service = await startServer({ studio, secret, appOrigin: origin });
// The key in the HTTP address is kept, so an agent added once keeps working.
const keyFile = join(root, '.mcp-key');
let key = (await readFile(keyFile, 'utf8').catch(() => '')).trim();
if (key.length < 32) {
  key = randomBytes(32).toString('base64url');
  await writeAtomic(keyFile, key);
}
const mcp = await startMcpHttp({ root, key, port: mcpPort });
await writeAtomic(
  info,
  JSON.stringify({ url: service.url, secret, pid: process.pid, mcp: mcp.url }),
);

// One page origin owns both proxies; neither service secret reaches the browser.
const agentSecret = randomBytes(32).toString('base64url');
const companion = withAssistant
  ? await (
      await import('../apps/agent-local/src/index.js')
    ).createCompanion({
      directory:
        process.env['TASTIR_AGENT_DATA_DIR'] ??
        join(
          process.env['XDG_CONFIG_HOME'] ?? join(homedir(), '.config'),
          'tastir',
          'agent',
        ),
      appOrigin: origin,
      secret: agentSecret,
    })
  : undefined;

let child: ReturnType<typeof spawn> | undefined;
const stopped = new Promise<void>((resolve) => {
  const stop = () => {
    child?.kill('SIGTERM');
    resolve();
  };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  if (withApp) {
    child = spawn(
      'pnpm',
      [
        'exec',
        'vite',
        '--config',
        'apps/player/vite.config.mts',
        '--port',
        String(appPort),
        '--host',
        '127.0.0.1',
        '--strictPort',
      ],
      {
        cwd: repo,
        stdio: 'inherit',
        env: {
          ...process.env,
          ...(companion
            ? {
                VITE_TASTIR_AGENT: 'true',
                TASTIR_AGENT_TARGET: companion.url,
                TASTIR_AGENT_SECRET: agentSecret,
              }
            : {}),
          TASTIR_STUDIO_TARGET: service.url,
          TASTIR_STUDIO_SECRET: secret,
        },
      },
    );
    child.once('exit', () => resolve());
  }
});
process.stdout.write(
  `\nTastir studio: ${withApp ? `${origin}/#/studio` : 'running without the app'}\nProjects are kept in ${root}\nAgents connect with tools/studio-mcp.sh, or over HTTP at\n  ${mcp.url}\n(see docs/STUDIO-SETUP.md; the address is a password, so keep it private).\n\n`,
);
try {
  await stopped;
} finally {
  await rm(info, { force: true });
  await companion?.close();
  await mcp.close();
  await service.close();
}
