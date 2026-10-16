import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * How the MCP server reaches the running studio: the launcher writes its
 * address and secret to studio/.service.json (readable by the owner only),
 * and this reads it again on every call, so a restarted studio is found.
 */
export class StudioClient {
  constructor(readonly root: string) {}

  private async service(): Promise<{ url: string; secret: string }> {
    try {
      return JSON.parse(
        await readFile(join(this.root, '.service.json'), 'utf8'),
      ) as {
        url: string;
        secret: string;
      };
    } catch {
      throw new Error(
        'The studio is not running. Ask the owner to start it with pnpm studio.',
      );
    }
  }

  async call(
    method: 'GET' | 'POST',
    path: string,
    data?: unknown,
  ): Promise<unknown> {
    const { url, secret } = await this.service();
    let response: Response;
    try {
      response = await fetch(`${url}${path}`, {
        method,
        headers: {
          'X-Tastir-Studio': secret,
          'Content-Type': 'application/json',
        },
        ...(data === undefined ? {} : { body: JSON.stringify(data) }),
        signal: AbortSignal.timeout(60_000),
      });
    } catch {
      throw new Error(
        'The studio is not answering. Ask the owner to start it with pnpm studio.',
      );
    }
    const value = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    if (!response.ok)
      throw new Error(value.error ?? `The studio answered ${response.status}.`);
    return value;
  }
}
