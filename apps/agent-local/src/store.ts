import { mkdir, open, readFile, rename, rm, chmod } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { AgentError } from './errors.js';

export const TokensShape = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().optional(),
  idToken: z.string().optional(),
  scopes: z.array(z.string()),
  expiresAt: z.number().finite(),
});
export const ProfileShape = z.object({
  id: z.string(),
  clientId: z.string(),
  subject: z.string().optional(),
  email: z.string().optional(),
  tokens: TokensShape.optional(),
});
export type Profile = z.infer<typeof ProfileShape>;
const StateShape = z.object({
  hostId: z.string(),
  profiles: z.array(ProfileShape),
  activeId: z.string().nullable(),
});
type State = z.infer<typeof StateShape>;

export class StateStore {
  private queue: Promise<unknown> = Promise.resolve();
  private constructor(
    readonly directory: string,
    private data: State,
  ) {}

  static async open(directory: string): Promise<StateStore> {
    await mkdir(directory, { recursive: true, mode: 0o700 });
    await chmod(directory, 0o700);
    const lockPath = join(directory, 'runtime.lock');
    try {
      const lock = await open(lockPath, 'wx', 0o600);
      await lock.writeFile(String(process.pid));
      await lock.close();
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
      const pid = Number(await readFile(lockPath, 'utf8'));
      let running = true;
      if (Number.isInteger(pid) && pid > 0) {
        try {
          process.kill(pid, 0);
          running = true;
        } catch (e) {
          running = (e as NodeJS.ErrnoException).code !== 'ESRCH';
        }
      }
      if (running)
        throw new AgentError(
          'already_running',
          'A local assistant is already using this account storage. Stop it before starting another.',
        );
      await rm(lockPath);
      return StateStore.open(directory);
    }
    try {
      let data: State;
      try {
        data = StateShape.parse(
          JSON.parse(await readFile(join(directory, 'accounts.json'), 'utf8')),
        );
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT')
          throw new AgentError(
            'storage_unreadable',
            'The saved assistant account file cannot be read. It has been left unchanged.',
          );
        data = {
          hostId: `urn:uuid:${randomUUID()}`,
          profiles: [],
          activeId: null,
        };
      }
      const store = new StateStore(directory, data);
      await store.update((s) => s);
      return store;
    } catch (error) {
      await rm(lockPath, { force: true });
      throw error;
    }
  }

  read(): State {
    return structuredClone(this.data);
  }

  update(change: (state: State) => State): Promise<void> {
    const task = this.queue.then(async () => {
      const next = StateShape.parse(change(this.read()));
      const temporary = join(this.directory, `accounts-${randomUUID()}.tmp`);
      try {
        const file = await open(temporary, 'wx', 0o600);
        try {
          await file.writeFile(JSON.stringify(next));
          await file.sync();
        } finally {
          await file.close();
        }
        await rename(temporary, join(this.directory, 'accounts.json'));
        this.data = next;
      } finally {
        await rm(temporary, { force: true });
      }
    });
    this.queue = task.catch(() => undefined);
    return task;
  }

  async close() {
    await this.queue;
    await rm(join(this.directory, 'runtime.lock'), { force: true });
  }
}
