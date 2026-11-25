import { mkdtemp, rm, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { StateStore } from './store.js';

describe('StateStore runtime.lock handling', () => {
  it('blocks a second live holder and a freshly created empty lock, but recovers stale locks', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'tastir-store-'));
    const lockPath = join(directory, 'runtime.lock');
    try {
      // 1. Live holder rejects a second open().
      const store = await StateStore.open(directory);
      await expect(StateStore.open(directory)).rejects.toMatchObject({
        code: 'already_running',
      });
      await store.close();

      // 2. Fresh empty lock (simulating the race between open('wx') and writeFile(pid))
      //    must NOT be deleted as stale.
      await writeFile(lockPath, '', { mode: 0o600 });
      await expect(StateStore.open(directory)).rejects.toMatchObject({
        code: 'already_running',
      });

      // 3. Stale empty lock older than the grace period is recovered cleanly.
      const staleTime = new Date(Date.now() - 10_000);
      await utimes(lockPath, staleTime, staleTime);
      const recovered = await StateStore.open(directory);
      await recovered.close();

      // 4. Stale lock with a dead PID is recovered cleanly.
      await writeFile(lockPath, '99999999', { mode: 0o600 });
      const recoveredDead = await StateStore.open(directory);
      await recoveredDead.close();
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
