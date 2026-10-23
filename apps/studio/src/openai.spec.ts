import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import express from 'express';
import { eq } from 'drizzle-orm';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import { hostedApp } from './hosted.js';
import { openAISettings } from './openai.js';
import { openaiIdentities, openaiTransactions, type PgBackend } from './pg.js';
import { OWNER, standInGoogle } from './standin.js';
import { Studio } from './studio.js';
import { testBackend, type TestBackend } from './testing.js';

async function listen(app: express.Express) {
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  return {
    server,
    url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
  };
}
const close = (server: Server) =>
  new Promise<void>((resolve) => {
    server.close(() => resolve());
    server.closeAllConnections();
  });

/** Simulated provider, with real signed JWTs and an actual PKCE check. */
async function provider() {
  const keys = await generateKeyPair('RS256');
  const jwk = {
    ...(await exportJWK(keys.publicKey)),
    kid: 'test',
    alg: 'RS256',
  };
  const app = express();
  const site = await listen(app);
  const state = {
    subject: 'openai-owner',
    claims: {} as Record<string, unknown>,
    auth: new URL(site.url),
    tokenCalls: 0,
    headers: {} as Record<string, unknown>,
    tokenBody: {} as Record<string, string>,
    badSignature: false,
    missingToken: false,
  };
  const codes = new Map<string, { nonce: string; challenge: string }>();
  app.get('/.well-known/openid-configuration', (_q, r) =>
    r.json({
      issuer: site.url,
      authorization_endpoint: `${site.url}/authorize`,
      token_endpoint: `${site.url}/token`,
      jwks_uri: `${site.url}/jwks`,
    }),
  );
  app.get('/jwks', (_q, r) => r.json({ keys: [jwk] }));
  app.get('/authorize', (q, r) => {
    state.auth = new URL(q.originalUrl, site.url);
    const code = String(codes.size) + Math.random();
    codes.set(code, {
      nonce: String(q.query['nonce']),
      challenge: String(q.query['code_challenge']),
    });
    const back = new URL(String(q.query['redirect_uri']));
    back.search = new URLSearchParams({
      code,
      state: String(q.query['state']),
    }).toString();
    r.redirect(back.href);
  });
  app.post('/token', express.urlencoded({ extended: false }), async (q, r) => {
    state.tokenCalls++;
    state.headers = q.headers;
    state.tokenBody = q.body;
    const pending = codes.get(q.body.code);
    codes.delete(q.body.code);
    const challenge = createHash('sha256')
      .update(q.body.code_verifier)
      .digest('base64url');
    if (!pending || challenge !== pending.challenge) {
      r.status(400).json({});
      return;
    }
    const token = await new SignJWT({
      sub: state.subject,
      email: OWNER,
      nonce: pending.nonce,
      iss: site.url,
      aud: 'registered-client',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 300,
      ...state.claims,
    })
      .setProtectedHeader({ alg: 'RS256', kid: 'test' })
      .sign(keys.privateKey);
    r.json(
      state.missingToken
        ? {}
        : { id_token: state.badSignature ? token + 'x' : token },
    );
  });
  return { ...site, state };
}

function browser(base: string) {
  const cookies = new Map<string, string>();
  const request = async (
    path: string,
    init: RequestInit = {},
    follow = true,
  ): Promise<Response> => {
    const target = new URL(path, base);
    const response = await fetch(target, {
      ...init,
      redirect: 'manual',
      headers: {
        ...init.headers,
        ...(target.origin === base
          ? {
              Cookie: [...cookies].map(([k, v]) => `${k}=${v}`).join('; '),
            }
          : {}),
      },
    });
    if (target.origin === base)
      for (const cookie of response.headers.getSetCookie()) {
        const pair = cookie.split(';')[0]!;
        const index = pair.indexOf('=');
        cookies.set(pair.slice(0, index), pair.slice(index + 1));
      }
    const location = response.headers.get('location');
    return location && follow
      ? request(new URL(location, target).href)
      : response;
  };
  const post = (path: string, data: Record<string, string>, follow = true) =>
    request(
      path,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(data),
      },
      follow,
    );
  return { request, post, cookies };
}
const field = (html: string) => /name="csrf" value="([^"]*)"/.exec(html)![1]!;

describe('hosted ChatGPT identity sign-in', () => {
  let store: TestBackend;
  let google: Awaited<ReturnType<typeof standInGoogle>>;
  let openai: Awaited<ReturnType<typeof provider>>;
  let hosted: ReturnType<typeof hostedApp>;
  let site: Awaited<ReturnType<typeof listen>>;
  let owner: ReturnType<typeof browser>;
  let registration: {
    clientId: string;
    tokenAuthMethod: 'none' | 'client_secret_basic';
    clientSecret?: string;
    testIssuer: string;
  };
  const db = () => (store.backend as PgBackend).db;
  beforeEach(async () => {
    store = await testBackend('pglite');
    google = await standInGoogle();
    openai = await provider();
    const app = express();
    site = await listen(app);
    registration = {
      clientId: 'registered-client',
      tokenAuthMethod: 'none',
      testIssuer: openai.url,
    };
    hosted = hostedApp({
      studio: new Studio(
        store.root,
        join(import.meta.dirname, '../../../tutorials'),
        store.backend,
      ),
      db: db(),
      baseUrl: new URL(site.url),
      google: google.google,
      secret: 'a-session-secret-of-at-least-32-characters',
      allow: [OWNER],
      openai: registration,
    });
    app.use(hosted.app);
    owner = browser(site.url);
  });
  afterEach(async () => {
    await hosted.close();
    await close(site.server);
    await close(google.server);
    await close(openai.server);
    await store.close();
  });

  async function link() {
    await owner.request('/login');
    const page = await (await owner.request('/connections')).text();
    return owner.post('/auth/openai/link', { csrf: field(page) });
  }
  async function pending() {
    const start = await owner.request('/auth/openai', {}, false);
    const authorize = await owner.request(
      start.headers.get('location')!,
      {},
      false,
    );
    return authorize.headers.get('location')!;
  }

  it('explicitly links an owner, signs in again with identity-only tokens, and unlinks', async () => {
    expect(await (await owner.request('/api/sign-in-options')).json()).toEqual({
      chatgpt: true,
    });
    expect(await (await link()).text()).toContain(
      'Your ChatGPT account is linked',
    );
    expect(openai.state.auth.searchParams.get('scope')).toBe(
      'openid profile email',
    );
    expect(openai.state.auth.searchParams.get('code_challenge_method')).toBe(
      'S256',
    );
    expect(openai.state.tokenBody['client_secret']).toBeUndefined();
    expect(openai.state.headers['authorization']).toBeUndefined();
    expect(await db().select().from(openaiTransactions)).toHaveLength(0);
    let page = await (await owner.request('/connections')).text();
    await owner.post('/logout', { csrf: field(page) });
    expect((await owner.request('/auth/openai')).status).toBe(200);
    page = await (await owner.request('/connections')).text();
    await owner.post('/auth/openai/unlink', { csrf: field(page) });
    expect(await db().select().from(openaiIdentities)).toHaveLength(0);
    await owner.post('/logout', { csrf: field(page) });
    expect((await owner.request('/auth/openai')).status).toBe(403);
  });

  it('does not grant access or link by matching email, and rejects a forged linking form', async () => {
    expect((await owner.request('/auth/openai')).status).toBe(403);
    expect(await db().select().from(openaiIdentities)).toHaveLength(0);
    await owner.request('/login');
    expect(
      (await owner.post('/auth/openai/link', { csrf: 'forged' })).status,
    ).toBe(403);
    expect(await db().select().from(openaiTransactions)).toHaveLength(0);
  });

  it('uses confidential client credentials only in the Basic header', async () => {
    registration.tokenAuthMethod = 'client_secret_basic';
    registration.clientSecret = 'secret:with spaces';
    expect((await link()).status).toBe(200);
    expect(openai.state.headers['authorization']).toBe(
      `Basic ${Buffer.from('registered-client:secret%3Awith+spaces').toString('base64')}`,
    );
    expect(openai.state.tokenBody['client_secret']).toBeUndefined();
  });

  it('does not overwrite a subject linked to another local owner', async () => {
    await db()
      .insert(openaiIdentities)
      .values({
        issuer: openai.url,
        client: 'registered-client',
        subject: 'openai-owner',
        owner: 'another@example.com',
      });
    expect((await link()).status).toBe(403);
    const [identity] = await db().select().from(openaiIdentities);
    expect(identity!.owner).toBe('another@example.com');
  });

  it('consumes a callback once when two server requests race', async () => {
    await link();
    const callback = await pending();
    const cookie = `tastir_openai_login=${owner.cookies.get('tastir_openai_login')}`;
    const calls = openai.state.tokenCalls;
    const responses = await Promise.all(
      [0, 1].map(() =>
        fetch(callback, {
          redirect: 'manual',
          headers: { Cookie: cookie },
        }),
      ),
    );
    expect(responses.map((r) => r.status).sort()).toEqual([302, 403]);
    expect(openai.state.tokenCalls).toBe(calls + 1);
  });

  it.each(['state', 'cookie', 'expired', 'denied'])(
    'rejects %s before exchanging the code',
    async (problem) => {
      const callback = new URL(await pending());
      if (problem === 'state') callback.searchParams.set('state', 'wrong');
      if (problem === 'cookie') owner.cookies.clear();
      if (problem === 'expired')
        await db()
          .update(openaiTransactions)
          .set({ expires: new Date(0) })
          .where(
            eq(openaiTransactions.state, callback.searchParams.get('state')!),
          );
      if (problem === 'denied')
        callback.searchParams.set('error', 'access_denied');
      expect((await owner.request(callback.href)).status).toBe(403);
      expect(openai.state.tokenCalls).toBe(0);
    },
  );

  it.each([
    { nonce: 'wrong' },
    { iss: 'https://other.example' },
    { aud: 'other-client' },
    { exp: 1 },
    { sub: '' },
    { sub: undefined },
    { exp: undefined },
    { iat: undefined },
    { nonce: undefined },
    { azp: 'other-client' },
    { aud: ['registered-client', 'another-client'] },
    { iat: Math.floor(Date.now() / 1000) + 3600 },
  ])('rejects invalid identity claims %j', async (claims) => {
    await owner.request('/login');
    openai.state.claims = claims;
    const page = await (await owner.request('/connections')).text();
    expect(
      (await owner.post('/auth/openai/link', { csrf: field(page) })).status,
    ).toBe(403);
    expect(await db().select().from(openaiIdentities)).toHaveLength(0);
  });

  it.each(['badSignature', 'missingToken'] as const)(
    'rejects %s',
    async (problem) => {
      openai.state[problem] = true;
      expect((await link()).status).toBe(403);
      expect(await db().select().from(openaiIdentities)).toHaveLength(0);
    },
  );

  it('does not follow an external or backslash return URL', async () => {
    const response = await owner.request(
      '/auth/openai?next=%2F%5Cevil.example',
      {},
      false,
    );
    expect(response.status).toBe(302);
    const [transaction] = await db().select().from(openaiTransactions);
    expect(transaction!.next).toBe('/connections');
    expect(response.headers.get('set-cookie')).toContain(
      'HttpOnly; SameSite=Lax',
    );
    expect(response.headers.get('set-cookie')).not.toContain(
      transaction!.verifier,
    );
  });
});

describe('hosted OpenAI configuration', () => {
  it('stays disabled without a hosted registration', () =>
    expect(openAISettings({})).toBeUndefined());
  it('requires the registered token authentication method and corresponding secret', () => {
    const env = { OPENAI_SIGN_IN_CLIENT_ID: 'registered-client' };
    expect(() => openAISettings(env)).toThrow();
    expect(
      openAISettings({ ...env, OPENAI_SIGN_IN_TOKEN_AUTH_METHOD: 'none' }),
    ).toEqual({
      clientId: 'registered-client',
      tokenAuthMethod: 'none',
    });
    expect(() =>
      openAISettings({
        ...env,
        OPENAI_SIGN_IN_TOKEN_AUTH_METHOD: 'client_secret_basic',
      }),
    ).toThrow();
    expect(() =>
      openAISettings({
        ...env,
        OPENAI_SIGN_IN_TOKEN_AUTH_METHOD: 'none',
        OPENAI_SIGN_IN_CLIENT_SECRET: 'secret',
      }),
    ).toThrow();
  });
});
