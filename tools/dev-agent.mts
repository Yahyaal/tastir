import { randomBytes } from 'node:crypto';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { createCompanion } from '../apps/agent-local/src/index.js';

const appPort = Number(process.env['TASTIR_AGENT_APP_PORT'] ?? 4291);
if (!Number.isInteger(appPort) || appPort < 1024 || appPort > 65535)
  throw new Error(
    'TASTIR_AGENT_APP_PORT must be a port between 1024 and 65535.',
  );
const origin = `http://127.0.0.1:${appPort}`;
const secret = randomBytes(32).toString('base64url');
const companion = await createCompanion({
  directory:
    process.env['TASTIR_AGENT_DATA_DIR'] ??
    join(
      process.env['XDG_CONFIG_HOME'] ?? join(homedir(), '.config'),
      'tastir',
      'agent',
    ),
  appOrigin: origin,
  secret,
});
const child = spawn(
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
    stdio: 'inherit',
    env: {
      ...process.env,
      VITE_TASTIR_AGENT: 'true',
      TASTIR_AGENT_TARGET: companion.url,
      TASTIR_AGENT_SECRET: secret,
    },
  },
);
let stopping = false;
const stop = () => {
  if (!stopping) {
    stopping = true;
    child.kill('SIGTERM');
  }
};
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
process.stdout.write(
  `\nTastir local assistant: ${origin}/#/agent\nOpen this address to connect your ChatGPT account.\n\n`,
);
try {
  process.exitCode = await new Promise<number>((resolve, reject) => {
    child.once('exit', (code) => resolve(stopping ? 0 : (code ?? 1)));
    child.once('error', reject);
  });
} finally {
  stop();
  await companion.close();
}
