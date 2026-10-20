import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { join } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import type { OAuthClientProvider } from '@modelcontextprotocol/sdk/client/auth.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type {
  OAuthClientInformationMixed,
  OAuthTokens,
} from '@modelcontextprotocol/sdk/shared/auth.js';
import express from 'express';
import { redirectAllowed, StudioAuth } from './auth.js';
import { hostedApp } from './hosted.js';
import type { PgBackend } from './pg.js';
import { Studio } from './studio.js';
import { OWNER, standInGoogle } from './standin.js';
import { testBackend, type TestBackend } from './testing.js';

const tutorials = join(import.meta.dirname, '../../../tutorials');
const listen = async (handler: Parameters<typeof createServer>[1]) => {
  const server = createServer(handler);
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  return {
    server,
    url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
  };
};
const closeServer = (server: Server) =>
  new Promise<void>((r) => {
    server.closeAllConnections();
    server.close(() => r());
  });

/** A browser for the owner: follows redirects on the studio, keeping cookies. */
function browser(studio: string) {
  const jar = new Map<string, string>();
  const go = async (
    url: string,
    init: RequestInit = {},
  ): Promise<{ url: string; status: number; text: string }> => {
    const target = new URL(url, studio);
    const response = await fetch(target, {
      ...init,
      redirect: 'manual',
      headers: {
        ...(init.headers as Record<string, string>),
        ...(target.origin === studio
          ? { Cookie: [...jar].map(([k, v]) => `${k}=${v}`).join('; ') }
          : {}),
      },
    });
    if (target.origin === studio)
      for (const c of response.headers.getSetCookie()) {
        const [pair] = c.split(';');
        const at = pair!.indexOf('=');
        jar.set(pair!.slice(0, at), pair!.slice(at + 1));
      }
    const location = response.headers.get('location');
    if (response.status >= 300 && response.status < 400 && location) {
      const next = new URL(location, target);
      // The app's own callback is where the browser's part ends.
      if (next.pathname === '/callback')
        return { url: next.href, status: response.status, text: '' };
      return go(next.href);
    }
    return {
      url: target.href,
      status: response.status,
      text: await response.text(),
    };
  };
  const field = (html: string, name: string) =>
    new RegExp(`name="${name}" value="([^"]*)"`).exec(html)?.[1] ?? '';
  return { go, field };
}

class AppProvider implements OAuthClientProvider {
  info?: OAuthClientInformationMixed;
  saved?: OAuthTokens;
  verifier = '';
  authUrl?: URL;
  constructor(readonly name: string) {}
  get redirectUrl() {
    return 'http://127.0.0.1:9/callback';
  }
  get clientMetadata() {
    return {
      client_name: this.name,
      redirect_uris: [this.redirectUrl],
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
    };
  }
  clientInformation() {
    return this.info;
  }
  saveClientInformation(info: OAuthClientInformationMixed) {
    this.info = info;
  }
  tokens() {
    return this.saved;
  }
  saveTokens(tokens: OAuthTokens) {
    this.saved = tokens;
  }
  redirectToAuthorization(url: URL) {
    this.authUrl = url;
  }
  saveCodeVerifier(v: string) {
    this.verifier = v;
  }
  codeVerifier() {
    return this.verifier;
  }
}

describe('signing in to the hosted studio', () => {
  let store: TestBackend;
  let google: Awaited<ReturnType<typeof standInGoogle>>;
  let hosted: ReturnType<typeof hostedApp>;
  let site: { server: Server; url: string };

  beforeEach(async () => {
    store = await testBackend('pglite');
    google = await standInGoogle();
    const db = (store.backend as PgBackend).db;
    // The address is known only once listening, so the app is made then.
    const holder: { app?: express.Express } = {};
    site = await listen((q, r) => holder.app!(q, r));
    hosted = hostedApp({
      studio: new Studio(store.root, tutorials, store.backend),
      db,
      baseUrl: new URL(site.url),
      allow: [OWNER],
      secret: 'a-session-secret-of-at-least-32-characters',
      google: google.google,
      redirects: ['http://127.0.0.1:9/callback'],
    });
    holder.app = hosted.app;
  });
  afterEach(async () => {
    await hosted.close();
    await closeServer(site.server);
    await closeServer(google.server);
    await store.close();
  });

  /** An app connects: it is sent to sign in, the owner allows it. */
  async function connect(name: string, owner = browser(site.url)) {
    const provider = new AppProvider(name);
    const mcp = new URL('/mcp', site.url);
    const first = new Client({ name, version: '1' });
    await expect(
      first.connect(
        new StreamableHTTPClientTransport(mcp, { authProvider: provider }),
      ),
    ).rejects.toThrow();
    const consent = await owner.go(provider.authUrl!.href);
    expect(consent.text).toContain(`Allow ${name} to work on your studio`);
    const back = await owner.go('/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        request: owner.field(consent.text, 'request'),
        csrf: owner.field(consent.text, 'csrf'),
        decision: 'allow',
      }).toString(),
    });
    const code = new URL(back.url).searchParams.get('code')!;
    const transport = new StreamableHTTPClientTransport(mcp, {
      authProvider: provider,
    });
    await transport.finishAuth(code);
    const client = new Client({ name, version: '1' });
    await client.connect(
      new StreamableHTTPClientTransport(mcp, { authProvider: provider }),
    );
    const call = async (tool: string, args: Record<string, unknown>) => {
      const r = (await client.callTool({ name: tool, arguments: args })) as {
        isError?: boolean;
        content: { text: string }[];
      };
      if (r.isError) throw new Error(r.content[0]!.text);
      return JSON.parse(r.content[0]!.text);
    };
    return { provider, client, call, owner };
  }

  const circle = (name: string) => ({
    kind: 'circle',
    name,
    centre: 'O',
    through: 'A',
  });

  it('runs the whole flow: approve, draw, rename, refresh, revoke', async () => {
    const claude = await connect('Claude');
    const id = (await claude.call('new_project', { title: 'Signed in' }))
      .project as string;
    let view = await claude.call('construct', {
      project: id,
      revision: 1,
      add: [circle('C1')],
    });
    expect(view.history.undo[0].author).toBe('Claude');

    // The owner renames the connection; its earlier edit is still its own.
    const [connection] = await hosted.auth.connections();
    const list = await claude.owner.go('/connections');
    await claude.owner.go(`/connections/${connection!.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        csrf: claude.owner.field(list.text, 'csrf'),
        action: 'rename',
        name: 'Claude on phone',
      }).toString(),
    });
    view = await claude.call('construct', {
      project: id,
      revision: 2,
      add: [circle('C2')],
    });
    expect(view.history.undo[0].author).toBe('Claude on phone');

    // A new token from the refresh token: the old refresh token is used up,
    // and the connection's edits stay its own.
    const refresh = async (token: string) =>
      fetch(new URL('/token', site.url), {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: token,
          client_id: (claude.provider.info as { client_id: string }).client_id,
        }).toString(),
      });
    const old = claude.provider.saved!.refresh_token!;
    const renewed = await refresh(old);
    expect(renewed.status).toBe(200);
    claude.provider.saved = (await renewed.json()) as OAuthTokens;
    expect((await refresh(old)).status).toBe(400);
    view = await claude.call('undo', { project: id, revision: 3, steps: 2 });
    expect(view.revision).toBe(4);

    // Another app's connection is its own: Claude's undo-mine stops at it.
    const codex = await connect('Codex', claude.owner);
    await codex.call('construct', {
      project: id,
      revision: 4,
      add: [circle('X')],
    });
    await expect(
      claude.call('redo', { project: id, revision: 5, steps: 1 }),
    ).rejects.toThrow();

    // Removed: its next call is refused at once.
    await hosted.auth.revoke(connection!.id);
    await expect(claude.call('inspect', { project: id })).rejects.toThrow();
    expect((await codex.call('inspect', { project: id })).revision).toBe(5);
  });

  it('knows where each chat app returns after sign-in', () => {
    for (const uri of [
      'https://claude.ai/api/mcp/auth_callback',
      'https://chatgpt.com/connector_platform_oauth_redirect',
      'https://chatgpt.com/connector/oauth/AbC_12-x',
      'https://antigravity.google/oauth-callback',
      'http://127.0.0.1:51234/callback',
    ])
      expect(redirectAllowed(uri), uri).toBe(true);
    for (const uri of [
      'https://chatgpt.com/connector/oauth/a/b',
      'https://chatgpt.com/connector/oauth/a?next=https://evil.example',
      'https://chatgpt.com.evil.example/connector/oauth/a',
      'http://chatgpt.com/connector/oauth/a',
      'https://antigravity.google/oauth-callback/x',
    ])
      expect(redirectAllowed(uri), uri).toBe(false);
  });

  it('refuses an app that would send the sign-in somewhere unknown', async () => {
    const registered = await fetch(new URL('/register', site.url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_name: 'Somewhere',
        redirect_uris: ['https://evil.example/callback'],
        token_endpoint_auth_method: 'none',
      }),
    });
    expect(registered.status).toBe(400);
    const anonymous = await fetch(new URL('/mcp', site.url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    expect(anonymous.status).toBe(401);
  });

  it('lets in only the allowed address', async () => {
    google.state.email = 'someone@example.com';
    const page = await browser(site.url).go('/connections');
    expect(page.status).toBe(403);
    expect(page.text).toContain('may not use this studio');
  });

  it('reads an app from its client id metadata document', async () => {
    const id = 'https://app.example/oauth/client.json';
    const documents: Record<string, unknown> = {
      [id]: {
        client_id: id,
        client_name: 'Metadata app',
        redirect_uris: ['https://claude.ai/api/mcp/auth_callback'],
      },
      'https://app.example/wrong.json': {
        client_id: 'https://app.example/other.json',
        redirect_uris: ['https://claude.ai/api/mcp/auth_callback'],
      },
    };
    const auth = new StudioAuth({
      db: (store.backend as PgBackend).db,
      fetch: (async (url: string) =>
        new Response(JSON.stringify(documents[url] ?? {}), {
          status: documents[url] ? 200 : 404,
        })) as typeof fetch,
    });
    expect((await auth.clientsStore.getClient(id))?.client_name).toBe(
      'Metadata app',
    );
    expect(
      await auth.clientsStore.getClient('https://app.example/wrong.json'),
    ).toBeUndefined();
  });
});
