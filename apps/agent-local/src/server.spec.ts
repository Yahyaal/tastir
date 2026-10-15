import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCompanion } from './server.js';

describe('local companion boundary', () => {
  it('requires pairing, rejects other origins, hides credentials, and validates requests', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'tastir-server-'));
    const secret = 'a-test-only-secret-that-is-long-enough';
    const companion = await createCompanion({
      directory,
      secret,
      appOrigin: 'http://127.0.0.1:4291',
    });
    try {
      expect((await fetch(`${companion.url}/status`)).status).toBe(403);
      expect(
        (
          await fetch(`${companion.url}/status`, {
            headers: {
              'X-Tastir-Bridge': secret,
              Origin: 'https://other.example',
            },
          })
        ).status,
      ).toBe(403);
      expect(
        (
          await fetch(`${companion.url}/status`, {
            headers: {
              'X-Tastir-Bridge': secret,
              'Sec-Fetch-Site': 'cross-site',
            },
          })
        ).status,
      ).toBe(403);
      const status = await fetch(`${companion.url}/status`, {
        headers: { 'X-Tastir-Bridge': secret },
      });
      expect(status.headers.get('cache-control')).toBe('no-store');
      expect(await status.json()).toMatchObject({
        profiles: [],
        connected: false,
        sharing: false,
      });
      const invalid = await fetch(`${companion.url}/auth/start`, {
        method: 'POST',
        headers: {
          'X-Tastir-Bridge': secret,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ access_token: 'do-not-echo-this' }),
      });
      expect(invalid.status).toBe(400);
      expect(await invalid.text()).not.toContain('do-not-echo-this');
      const rejected = await fetch(
        `${companion.url}/auth/callback?code=secret&state=invalid`,
      );
      expect(rejected.status).toBe(400);
      expect(await rejected.text()).not.toContain('secret');
    } finally {
      await companion.close();
      await rm(directory, { recursive: true, force: true });
    }
  });
});
