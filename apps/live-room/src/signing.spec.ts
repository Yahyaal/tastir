import { describe, expect, it, vi } from 'vitest';
import {
  createConnectionTicket,
  issueRoomTicket,
  notifyRevision,
  signRevisionNotification,
} from './server.js';
import { verifyClaims, signClaims } from './signing.js';
const secret = 'ab'.repeat(32);
const base = { secret, project: 'project-1', nowSeconds: 1000 };
describe('server signing contract', () => {
  it('binds subscription tickets to a project, origin, purpose and bounded expiry', async () => {
    const result = await createConnectionTicket({
      ...base,
      origin: 'https://studio.example',
      roomOrigin: 'https://room.example',
    });
    expect(result.url).toBe('wss://room.example/projects/project-1/connect');
    expect(await verifyClaims(secret, result.ticket, 1001)).toMatchObject({
      purpose: 'subscribe',
      project: 'project-1',
      origin: 'https://studio.example',
      expiresAt: 1060,
    });
    expect(await verifyClaims(secret, result.ticket, 1060)).toBeNull();
    expect(await verifyClaims(secret, result.ticket, 994)).toBeNull();
    expect(await verifyClaims('cd'.repeat(32), result.ticket, 1001)).toBeNull();
    expect(await verifyClaims(secret, result.ticket.slice(1), 1001)).toBeNull();
    expect(await verifyClaims(secret, 'x'.repeat(2049), 1001)).toBeNull();
  });
  it('rejects unsafe configuration, identifiers, revisions and lifetimes', async () => {
    await expect(
      issueRoomTicket({
        ...base,
        secret: '',
        origin: 'https://studio.example',
      }),
    ).rejects.toThrow();
    await expect(
      issueRoomTicket({
        ...base,
        origin: 'https://studio.example',
        ttlSeconds: 121,
      }),
    ).rejects.toThrow();
    await expect(
      issueRoomTicket({
        ...base,
        project: '../other',
        origin: 'https://studio.example',
      }),
    ).rejects.toThrow();
    await expect(
      issueRoomTicket({ ...base, origin: 'http://public.example' }),
    ).rejects.toThrow();
    await expect(
      issueRoomTicket({ ...base, origin: 'https://studio.example/path' }),
    ).rejects.toThrow();
    await expect(
      signRevisionNotification({ ...base, revision: 0 }),
    ).rejects.toThrow();
    const tooLong = await signClaims(secret, {
      v: 1,
      purpose: 'revision',
      project: 'project-1',
      issuedAt: 1000,
      expiresAt: 1121,
      revision: 1,
    });
    expect(await verifyClaims(secret, tooLong, 1001)).toBeNull();
  });
  it('signs revision hints separately from page tickets', async () => {
    const token = await signRevisionNotification({ ...base, revision: 8 });
    expect(await verifyClaims(secret, token, 1001)).toMatchObject({
      purpose: 'revision',
      project: 'project-1',
      revision: 8,
    });
  });
  it('publishes best effort and never reports a committed save as failed by throwing', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal('fetch', fetchMock);
    try {
      expect(
        await notifyRevision({
          secret,
          project: 'project-1',
          revision: 3,
          roomOrigin: 'https://room.example',
        }),
      ).toBe(true);
      expect(fetchMock.mock.calls[0]?.[0]).toBe(
        'https://room.example/projects/project-1/revisions',
      );
      const init = fetchMock.mock.calls[0]?.[1];
      expect(
        await verifyClaims(secret, init.headers.Authorization.slice(7)),
      ).toMatchObject({ revision: 3, purpose: 'revision' });
      fetchMock.mockRejectedValue(new Error('Offline'));
      expect(
        await notifyRevision({
          secret,
          project: 'project-1',
          revision: 4,
          roomOrigin: 'https://room.example',
        }),
      ).toBe(false);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
