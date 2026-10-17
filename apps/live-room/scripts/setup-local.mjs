import { randomBytes } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
await writeFile(
  new URL('../.dev.vars', import.meta.url),
  `LIVE_ROOM_SECRET="${randomBytes(32).toString('hex')}"\n`,
  { flag: 'wx', mode: 0o600 },
);
process.stdout.write(
  'Created apps/live-room/.dev.vars with a private local key. Existing keys are never overwritten.\n',
);
