import { mkdtemp, rm, stat, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import { StateStore } from './store.js';
import { ChatGPTAuth, verifyIdentity } from './auth.js';

let directory: string;
let store: StateStore;
beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'tastir-auth-'));
  store = await StateStore.open(directory);
});
afterEach(async () => {
  await store.close();
  await rm(directory, { recursive: true, force: true });
});
const tokens = {
  access_token: 'access-secret',
  refresh_token: 'refresh-secret',
  id_token: 'id-secret',
  token_type: 'Bearer',
  expires_in: 3600,
  scope: 'openid chatgpt.tokens.use.direct resource.invoke',
};
const identity = async () => ({
  subject: 'owner',
  email: 'owner@example.test',
});
async function signIn(auth: ChatGPTAuth, issued = 'oaiapp_test') {
  const start = new URL(auth.start('http://127.0.0.1:1455/auth/callback'));
  await auth.callback(
    new URLSearchParams({
      state: start.searchParams.get('state')!,
      code: 'code-secret',
      client_id: issued,
    }),
  );
}

describe('ChatGPT OAuth', () => {
  it('preserves a rotating refresh when reauthorization later fails', async () => {
    let grants = 0;
    const send = vi
      .fn<typeof fetch>()
      .mockImplementation(async (_url, init) => {
        const form = init!.body as URLSearchParams;
        if (form.get('grant_type') === 'refresh_token')
          return Response.json({
            ...tokens,
            access_token: 'rotated-access',
            refresh_token: 'rotated-refresh',
          });
        return ++grants === 1
          ? Response.json(tokens)
          : new Response('{}', { status: 400 });
      });
    const auth = new ChatGPTAuth(store, send, identity);
    await signIn(auth);
    const profile = store.read().profiles[0]!;
    const reconnect = new URL(
      auth.start('http://127.0.0.1:1455/auth/callback', profile.id),
    );
    expect(await auth.accessToken(true)).toBe('rotated-access');
    await expect(
      auth.callback(
        new URLSearchParams({
          state: reconnect.searchParams.get('state')!,
          code: 'expired-code',
          client_id: profile.clientId,
        }),
      ),
    ).rejects.toMatchObject({ code: 'connection_failed' });
    expect(store.read().profiles[0]!.tokens).toMatchObject({
      accessToken: 'rotated-access',
      refreshToken: 'rotated-refresh',
    });
  });

  it('cannot activate a sign-in cancelled while code exchange is in flight', async () => {
    let release!: (value: Response) => void;
    const send = vi.fn<typeof fetch>().mockImplementation(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    const auth = new ChatGPTAuth(store, send, identity);
    const url = new URL(auth.start('http://127.0.0.1:1455/auth/callback'));
    const callback = auth.callback(
      new URLSearchParams({
        state: url.searchParams.get('state')!,
        code: 'code',
        client_id: 'oaiapp_test',
      }),
    );
    await vi.waitFor(() => expect(release).toBeTypeOf('function'));
    expect(auth.status().signingIn).toBe(true);
    auth.cancelSignIn();
    release(Response.json(tokens));
    await expect(callback).rejects.toMatchObject({ code: 'sign_in_cancelled' });
    expect(auth.status().connected).toBe(false);
    expect(auth.status().signingIn).toBe(false);
  });
  it('uses PKCE and the issued client ID, and keeps credentials out of status', async () => {
    const send = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(JSON.stringify(tokens)));
    const auth = new ChatGPTAuth(store, send, identity);
    const url = new URL(auth.start('http://127.0.0.1:1455/auth/callback'));
    expect(url.searchParams.get('client_id')).toBe('dynamic_agent_client');
    expect(url.searchParams.get('ext_agent_host_id')).toBe(store.read().hostId);
    expect(url.searchParams.get('scope')).toContain(
      'chatgpt.tokens.use.direct',
    );
    await auth.callback(
      new URLSearchParams({
        state: url.searchParams.get('state')!,
        code: 'code-secret',
        client_id: 'oaiapp_test',
      }),
    );
    const form = send.mock.calls[0]![1]!.body as URLSearchParams;
    expect(form.get('client_id')).toBe('oaiapp_test');
    expect(form.get('redirect_uri')).toBe(
      'http://127.0.0.1:1455/auth/callback',
    );
    expect(
      createHash('sha256')
        .update(form.get('code_verifier')!)
        .digest('base64url'),
    ).toBe(url.searchParams.get('code_challenge'));
    expect(auth.status().sharing).toBe(true);
    expect(JSON.stringify(auth.status())).not.toMatch(
      /access-secret|refresh-secret|id-secret|code-secret/,
    );
    const profile = store.read().profiles[0]!;
    const again = new URL(
      auth.start('http://127.0.0.1:2000/auth/callback', profile.id),
    );
    expect(again.searchParams.get('client_id')).toBe('oaiapp_test');
    expect(again.searchParams.has('agent_name_hint')).toBe(false);
    expect(again.searchParams.has('id_token_hint')).toBe(false);
  });
  it('rejects mismatched state and returning client before token exchange', async () => {
    const send = vi
      .fn<typeof fetch>()
      .mockImplementation(async () => new Response(JSON.stringify(tokens)));
    const auth = new ChatGPTAuth(store, send, identity);
    const start = new URL(auth.start('http://127.0.0.1:1455/auth/callback'));
    await expect(
      auth.callback(
        new URLSearchParams({
          state: 'wrong',
          code: 'code',
          client_id: 'oaiapp_test',
        }),
      ),
    ).rejects.toMatchObject({ code: 'invalid_callback' });
    expect(send).not.toHaveBeenCalled();
    await auth.callback(
      new URLSearchParams({
        state: start.searchParams.get('state')!,
        code: 'code',
        client_id: 'oaiapp_test',
      }),
    );
    const next = new URL(
      auth.start(
        'http://127.0.0.1:1455/auth/callback',
        store.read().profiles[0]!.id,
      ),
    );
    send.mockClear();
    await expect(
      auth.callback(
        new URLSearchParams({
          state: next.searchParams.get('state')!,
          code: 'code',
          client_id: 'other',
        }),
      ),
    ).rejects.toMatchObject({ code: 'registration_incomplete' });
    expect(send).not.toHaveBeenCalled();
  });
  it('requires explicit plan scope, independently of identity sign-in', async () => {
    const send = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response(JSON.stringify({ ...tokens, scope: 'openid email' })),
      );
    const auth = new ChatGPTAuth(store, send, identity);
    await signIn(auth);
    expect(auth.status()).toMatchObject({ connected: true, sharing: false });
    await expect(auth.accessToken()).rejects.toMatchObject({
      code: 'plan_permission_required',
    });
  });
  it('serializes refresh and saves rotating tokens together', async () => {
    const send = vi
      .fn<typeof fetch>()
      .mockImplementation(async (_url, init) => {
        const form = init!.body as URLSearchParams;
        return new Response(
          JSON.stringify(
            form.get('grant_type') === 'refresh_token'
              ? {
                  ...tokens,
                  access_token: 'new-access',
                  refresh_token: 'new-refresh',
                  scope: undefined,
                }
              : tokens,
          ),
        );
      });
    const auth = new ChatGPTAuth(store, send, identity);
    await signIn(auth);
    send.mockClear();
    expect(
      await Promise.all([auth.accessToken(true), auth.accessToken(true)]),
    ).toEqual(['new-access', 'new-access']);
    expect(send).toHaveBeenCalledTimes(1);
    expect(store.read().profiles[0]!.tokens).toMatchObject({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    });
    expect(auth.status().sharing).toBe(true);
  });
  it('cannot resurrect credentials when disconnected during refresh', async () => {
    let release!: (response: Response) => void;
    const send = vi.fn<typeof fetch>().mockImplementation(async (url, init) => {
      if (String(url).endsWith('/revoke'))
        return new Response(null, { status: 200 });
      if ((init!.body as URLSearchParams).get('grant_type') === 'refresh_token')
        return new Promise<Response>((resolve) => {
          release = resolve;
        });
      return new Response(JSON.stringify(tokens));
    });
    const auth = new ChatGPTAuth(store, send, identity);
    await signIn(auth);
    const refreshing = auth.accessToken(true);
    await vi.waitFor(() => expect(release).toBeTypeOf('function'));
    await auth.disconnect();
    release(new Response(JSON.stringify(tokens)));
    await expect(refreshing).rejects.toMatchObject({
      code: 'connection_changed',
    });
    expect(store.read().profiles[0]!.tokens).toBeUndefined();
  });
  it('retains a new registration if token exchange fails', async () => {
    const send = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response('{}', { status: 400 }));
    const auth = new ChatGPTAuth(store, send, identity);
    await expect(signIn(auth)).rejects.toMatchObject({
      code: 'connection_failed',
    });
    expect(store.read().profiles[0]!.clientId).toBe('oaiapp_test');
    expect(auth.status().connected).toBe(false);
  });
});

describe('identity and storage boundaries', () => {
  it('verifies a signed token and rejects an incorrect audience, nonce and expired token', async () => {
    const keys = await generateKeyPair('RS256');
    const jwks = createLocalJWKSet({
      keys: [{ ...(await exportJWK(keys.publicKey)), kid: 'test' }],
    });
    const sign = (audience = 'oaiapp_test', expiry: number | string = '5m') =>
      new SignJWT({ nonce: 'nonce', email: 'owner@example.test' })
        .setProtectedHeader({ alg: 'RS256', kid: 'test' })
        .setSubject('owner')
        .setIssuer('https://auth.openai.com')
        .setAudience(audience)
        .setIssuedAt()
        .setExpirationTime(expiry)
        .sign(keys.privateKey);
    expect(
      await verifyIdentity(await sign(), 'oaiapp_test', 'nonce', jwks),
    ).toMatchObject({ subject: 'owner' });
    await expect(
      verifyIdentity(await sign('other'), 'oaiapp_test', 'nonce', jwks),
    ).rejects.toThrow();
    await expect(
      verifyIdentity(await sign(), 'oaiapp_test', 'wrong', jwks),
    ).rejects.toThrow();
    await expect(
      verifyIdentity(
        await sign('oaiapp_test', 1),
        'oaiapp_test',
        'nonce',
        jwks,
      ),
    ).rejects.toThrow();
  });
  it('protects account files and serializes updates', async () => {
    expect((await stat(directory)).mode & 0o777).toBe(0o700);
    expect((await stat(join(directory, 'accounts.json'))).mode & 0o777).toBe(
      0o600,
    );
    await Promise.all(
      ['a', 'b'].map((id) =>
        store.update((s) => ({
          ...s,
          profiles: [...s.profiles, { id, clientId: id }],
        })),
      ),
    );
    expect(store.read().profiles.map((p) => p.id)).toEqual(['a', 'b']);
    await expect(StateStore.open(directory)).rejects.toMatchObject({
      code: 'already_running',
    });
  });
  it('preserves unreadable storage instead of replacing it', async () => {
    const other = await mkdtemp(join(tmpdir(), 'tastir-bad-auth-'));
    try {
      await writeFile(join(other, 'accounts.json'), 'unreadable');
      await expect(StateStore.open(other)).rejects.toMatchObject({
        code: 'storage_unreadable',
      });
      expect(await readFile(join(other, 'accounts.json'), 'utf8')).toBe(
        'unreadable',
      );
    } finally {
      await rm(other, { recursive: true, force: true });
    }
  });
});
