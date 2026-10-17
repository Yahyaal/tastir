import { createHash, randomBytes } from 'node:crypto';
import type { Response } from 'express';
import { and, eq, gt, isNull, lt } from 'drizzle-orm';
import type { OAuthRegisteredClientsStore } from '@modelcontextprotocol/sdk/server/auth/clients.js';
import {
  InvalidClientMetadataError,
  InvalidGrantError,
  InvalidTokenError,
} from '@modelcontextprotocol/sdk/server/auth/errors.js';
import type {
  AuthorizationParams,
  OAuthServerProvider,
} from '@modelcontextprotocol/sdk/server/auth/provider.js';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import type {
  OAuthClientInformationFull,
  OAuthTokens,
} from '@modelcontextprotocol/sdk/shared/auth.js';
import {
  authCodes,
  authRequests,
  connections,
  oauthClients,
  tokens,
  type Db,
} from './pg.js';

/**
 * How agents sign in to the hosted studio: OAuth 2.1 with PKCE, the studio
 * as its own authorization server, built on the MCP SDK's handlers. Every
 * app that connects is approved by the owner once, and each approval is a
 * connection with a lasting id that owns the edits made through it, so a
 * rename or a new token never changes whose work is whose. Codes and tokens
 * are kept only as hashes; a revoked connection's tokens stop at once.
 */
export const ACCESS_SECONDS = 60 * 60;
const REFRESH_SECONDS = 30 * 24 * 60 * 60;
const CODE_SECONDS = 5 * 60;
const REQUEST_SECONDS = 10 * 60;

/** Where an agent's app may be sent back to after the owner approves. */
export const REDIRECTS = [
  'https://claude.ai/api/mcp/auth_callback',
  'https://claude.com/api/mcp/auth_callback',
  'https://chatgpt.com/connector_platform_oauth_redirect',
];

export function redirectAllowed(uri: string, extra: readonly string[] = []) {
  if ([...REDIRECTS, ...extra].includes(uri)) return true;
  try {
    const url = new URL(uri);
    // Command-line agents (Claude Code, Codex) listen on this computer.
    return (
      url.protocol === 'http:' &&
      ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)
    );
  } catch {
    return false;
  }
}

const hash = (secret: string) =>
  createHash('sha256').update(secret).digest('hex');
const secret = (prefix: string) =>
  `${prefix}_${randomBytes(32).toString('base64url')}`;
const later = (seconds: number) => new Date(Date.now() + seconds * 1000);

/** The name an approval shows by default: the app's own, or its address. */
export function clientName(client: OAuthClientInformationFull) {
  const name = client.client_name?.trim();
  if (name) return name.slice(0, 60);
  try {
    return new URL(client.redirect_uris[0] ?? '').hostname || 'Agent';
  } catch {
    return 'Agent';
  }
}

export interface AuthOptions {
  readonly db: Db;
  /** Where to send the owner to approve: /consent?request=<id>. */
  readonly consentPath?: string;
  /** More redirect addresses to allow, for tests. */
  readonly redirects?: readonly string[];
  /** How a client id metadata document is fetched; a test may stand in. */
  readonly fetch?: typeof fetch;
}

export class StudioAuth implements OAuthServerProvider {
  readonly clientsStore: OAuthRegisteredClientsStore;

  constructor(private readonly options: AuthOptions) {
    const db = options.db;
    this.clientsStore = {
      getClient: async (id) => {
        const [row] = await db
          .select()
          .from(oauthClients)
          .where(eq(oauthClients.id, id));
        const fresh =
          row && Date.now() - row.fetched.getTime() < 60 * 60 * 1000;
        if (row && (fresh || !id.startsWith('https://')))
          return row.info as unknown as OAuthClientInformationFull;
        if (id.startsWith('https://')) return this.metadataClient(id);
        return undefined;
      },
      registerClient: async (client) => {
        const info = client as OAuthClientInformationFull;
        this.checkRedirects(info.redirect_uris);
        await db.insert(oauthClients).values({
          id: info.client_id,
          info: info as unknown as Record<string, unknown>,
        });
        return info;
      },
    };
  }

  private checkRedirects(uris: readonly string[]) {
    const bad = uris.find((u) => !redirectAllowed(u, this.options.redirects));
    if (bad)
      throw new InvalidClientMetadataError(
        `The studio does not send sign-ins to ${bad}.`,
      );
  }

  /**
   * A client whose id is the address of its metadata document (the newest
   * MCP spec's preferred way): fetched over https without following
   * redirects, checked, and kept for an hour.
   */
  private async metadataClient(id: string) {
    const get = this.options.fetch ?? fetch;
    let info: OAuthClientInformationFull;
    try {
      const response = await get(id, {
        redirect: 'error',
        signal: AbortSignal.timeout(5000),
        headers: { Accept: 'application/json' },
      });
      const text = await response.text();
      if (!response.ok || text.length > 64_000) return undefined;
      info = JSON.parse(text) as OAuthClientInformationFull;
    } catch {
      return undefined;
    }
    if (info.client_id !== id || !Array.isArray(info.redirect_uris))
      return undefined;
    this.checkRedirects(info.redirect_uris);
    const kept = { ...info, token_endpoint_auth_method: 'none' };
    await this.options.db
      .insert(oauthClients)
      .values({ id, info: kept as unknown as Record<string, unknown> })
      .onConflictDoUpdate({
        target: oauthClients.id,
        set: {
          info: kept as unknown as Record<string, unknown>,
          fetched: new Date(),
        },
      });
    return kept;
  }

  /** Holds the request and sends the owner to approve it. */
  async authorize(
    client: OAuthClientInformationFull,
    params: AuthorizationParams,
    res: Response,
  ) {
    this.checkRedirects([params.redirectUri]);
    const id = randomBytes(18).toString('base64url');
    await this.options.db.insert(authRequests).values({
      id,
      client: client.client_id,
      redirect: params.redirectUri,
      challenge: params.codeChallenge,
      state: params.state ?? null,
      expires: later(REQUEST_SECONDS),
    });
    res.redirect(`${this.options.consentPath ?? '/consent'}?request=${id}`);
  }

  /** A request still waiting for the owner, with its app. */
  async pending(id: string) {
    const [row] = await this.options.db
      .select()
      .from(authRequests)
      .where(
        and(eq(authRequests.id, id), gt(authRequests.expires, new Date())),
      );
    if (!row) return undefined;
    const client = await this.clientsStore.getClient(row.client);
    return client ? { request: row, client } : undefined;
  }

  /**
   * The owner's answer. Allow makes a connection and a code for the app;
   * either way the app's own address to go back to is returned.
   */
  async decide(id: string, allow: boolean): Promise<string | undefined> {
    const found = await this.pending(id);
    if (!found) return undefined;
    const { request, client } = found;
    await this.options.db.delete(authRequests).where(eq(authRequests.id, id));
    const back = new URL(request.redirect);
    if (request.state) back.searchParams.set('state', request.state);
    if (!allow) {
      back.searchParams.set('error', 'access_denied');
      return back.href;
    }
    const connection = `c${randomBytes(9).toString('base64url')}`;
    const code = secret('tsc');
    await this.options.db.transaction(async (tx) => {
      await tx.insert(connections).values({
        id: connection,
        client: client.client_id,
        name: clientName(client),
      });
      await tx.insert(authCodes).values({
        hash: hash(code),
        client: client.client_id,
        connection,
        redirect: request.redirect,
        challenge: request.challenge,
        expires: later(CODE_SECONDS),
      });
    });
    back.searchParams.set('code', code);
    return back.href;
  }

  private async code(client: OAuthClientInformationFull, code: string) {
    const [row] = await this.options.db
      .select()
      .from(authCodes)
      .where(
        and(eq(authCodes.hash, hash(code)), gt(authCodes.expires, new Date())),
      );
    if (!row || row.client !== client.client_id)
      throw new InvalidGrantError('That sign-in code is not valid.');
    return row;
  }

  async challengeForAuthorizationCode(
    client: OAuthClientInformationFull,
    code: string,
  ) {
    return (await this.code(client, code)).challenge;
  }

  private async issue(
    client: string,
    connection: string,
  ): Promise<OAuthTokens> {
    const access = secret('tsa');
    const refresh = secret('tsr');
    await this.options.db.insert(tokens).values([
      {
        hash: hash(access),
        kind: 'access',
        client,
        connection,
        expires: later(ACCESS_SECONDS),
      },
      {
        hash: hash(refresh),
        kind: 'refresh',
        client,
        connection,
        expires: later(REFRESH_SECONDS),
      },
    ]);
    return {
      access_token: access,
      token_type: 'bearer',
      expires_in: ACCESS_SECONDS,
      refresh_token: refresh,
      scope: 'studio',
    };
  }

  async exchangeAuthorizationCode(
    client: OAuthClientInformationFull,
    code: string,
    _verifier?: string,
    redirectUri?: string,
  ) {
    const row = await this.code(client, code);
    if (redirectUri !== undefined && redirectUri !== row.redirect)
      throw new InvalidGrantError('The redirect address does not match.');
    // A code works once.
    const used = await this.options.db
      .delete(authCodes)
      .where(eq(authCodes.hash, row.hash))
      .returning({ hash: authCodes.hash });
    if (!used.length)
      throw new InvalidGrantError('That code was already used.');
    return this.issue(client.client_id, row.connection);
  }

  async exchangeRefreshToken(
    client: OAuthClientInformationFull,
    refreshToken: string,
  ) {
    // The old refresh token is used up by the exchange (rotation).
    const [row] = await this.options.db
      .delete(tokens)
      .where(
        and(
          eq(tokens.hash, hash(refreshToken)),
          eq(tokens.kind, 'refresh'),
          gt(tokens.expires, new Date()),
        ),
      )
      .returning();
    if (!row || row.client !== client.client_id)
      throw new InvalidGrantError('That refresh token is not valid.');
    if (!(await this.live(row.connection)))
      throw new InvalidGrantError('This connection was removed.');
    return this.issue(client.client_id, row.connection);
  }

  private async live(id: string) {
    const [row] = await this.options.db
      .select()
      .from(connections)
      .where(and(eq(connections.id, id), isNull(connections.revoked)));
    return row;
  }

  async verifyAccessToken(token: string): Promise<AuthInfo> {
    const [row] = await this.options.db
      .select()
      .from(tokens)
      .where(and(eq(tokens.hash, hash(token)), eq(tokens.kind, 'access')));
    if (!row || row.expires.getTime() <= Date.now())
      throw new InvalidTokenError('This token is not valid. Sign in again.');
    const connection = await this.live(row.connection);
    if (!connection)
      throw new InvalidTokenError('This connection was removed by the owner.');
    if (!connection.used || Date.now() - connection.used.getTime() > 60_000)
      await this.options.db
        .update(connections)
        .set({ used: new Date() })
        .where(eq(connections.id, connection.id));
    return {
      token,
      clientId: row.client,
      scopes: ['studio'],
      expiresAt: Math.floor(row.expires.getTime() / 1000),
      extra: { connection: connection.id, name: connection.name },
    };
  }

  async revokeToken(
    client: OAuthClientInformationFull,
    request: { token: string },
  ) {
    await this.options.db
      .delete(tokens)
      .where(
        and(
          eq(tokens.hash, hash(request.token)),
          eq(tokens.client, client.client_id),
        ),
      );
  }

  /** The owner's view of every connection, newest first. */
  async connections() {
    const rows = await this.options.db.select().from(connections);
    return rows
      .filter((r) => !r.revoked)
      .sort((a, b) => b.created.getTime() - a.created.getTime());
  }

  async rename(id: string, name: string) {
    const clean = name
      .trim()
      .replace(/[^A-Za-z0-9 ._()-]/g, '-')
      .slice(0, 60);
    if (!clean) return;
    await this.options.db
      .update(connections)
      .set({ name: clean })
      .where(eq(connections.id, id));
  }

  /** Removes a connection; its tokens stop working on the next call. */
  async revoke(id: string) {
    await this.options.db.transaction(async (tx) => {
      await tx
        .update(connections)
        .set({ revoked: new Date() })
        .where(eq(connections.id, id));
      await tx.delete(tokens).where(eq(tokens.connection, id));
    });
  }

  /** Clears expired requests, codes and tokens. */
  async sweep() {
    const now = new Date();
    await this.options.db
      .delete(authRequests)
      .where(lt(authRequests.expires, now));
    await this.options.db.delete(authCodes).where(lt(authCodes.expires, now));
    await this.options.db.delete(tokens).where(lt(tokens.expires, now));
  }
}
