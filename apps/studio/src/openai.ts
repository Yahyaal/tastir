import { createHash, randomBytes } from 'node:crypto';
import { and, eq, lt } from 'drizzle-orm';
import type { Request, Response } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { openaiIdentities, openaiTransactions, type Db } from './pg.js';
import type { Owner } from './owner.js';

export interface OpenAIOptions {
  readonly clientId: string;
  readonly tokenAuthMethod: 'none' | 'client_secret_basic';
  readonly clientSecret?: string;
  /** A local provider for tests; environment settings always use OpenAI. */
  readonly testIssuer?: string;
}

const ISSUER = 'https://auth.openai.com';
const COOKIE = 'tastir_openai_login';
const random = () => randomBytes(32).toString('base64url');
const hash = (value: string) =>
  createHash('sha256').update(value).digest('base64url');
const safeNext = (value: unknown) =>
  typeof value === 'string' &&
  value.startsWith('/') &&
  !value.startsWith('//') &&
  !/[\\\r\n]/.test(value)
    ? value
    : '/connections';

/** Keep this feature off until the hosted client registration is configured. */
export function openAISettings(
  env: Record<string, string | undefined>,
): OpenAIOptions | undefined {
  const clientId = env['OPENAI_SIGN_IN_CLIENT_ID']?.trim();
  const method = env['OPENAI_SIGN_IN_TOKEN_AUTH_METHOD']?.trim();
  const clientSecret = env['OPENAI_SIGN_IN_CLIENT_SECRET']?.trim();
  if (!clientId && !method && !clientSecret) return undefined;
  if (
    !clientId ||
    (method !== 'none' && method !== 'client_secret_basic') ||
    (method === 'client_secret_basic') !== !!clientSecret
  )
    throw new Error(
      'Configure the registered OpenAI sign-in client, authentication method and matching secret.',
    );
  return {
    clientId,
    tokenAuthMethod: method,
    ...(clientSecret ? { clientSecret } : {}),
  };
}

/** Website identity sign-in only; this does not request ChatGPT inference tokens. */
export class OpenAILogin {
  private metadata?: Promise<{
    issuer: string;
    authorization_endpoint: string;
    token_endpoint: string;
    jwks: ReturnType<typeof createRemoteJWKSet>;
  }>;

  constructor(
    private readonly options: OpenAIOptions,
    private readonly db: Db,
    private readonly owner: Owner,
    private readonly baseUrl: URL,
  ) {
    if (
      !options.clientId ||
      !['none', 'client_secret_basic'].includes(options.tokenAuthMethod)
    )
      throw new Error(
        'OpenAI sign-in needs its registered client ID and token authentication method.',
      );
    if (
      (options.tokenAuthMethod === 'client_secret_basic') !==
      !!options.clientSecret
    )
      throw new Error(
        'Only confidential OpenAI clients require a client secret.',
      );
    if (
      options.testIssuer &&
      !/^http:\/\/127\.0\.0\.1:\d+$/.test(options.testIssuer)
    )
      throw new Error('The test issuer must be a local test server.');
  }

  private provider() {
    if (!this.metadata) {
      this.metadata = (async () => {
        const issuer = this.options.testIssuer ?? ISSUER;
        const response = await fetch(
          `${issuer}/.well-known/openid-configuration`,
          {
            signal: AbortSignal.timeout(10_000),
          },
        );
        if (!response.ok) throw new Error('OpenAI discovery failed.');
        const data = (await response.json()) as Record<string, unknown>;
        if (data['issuer'] !== issuer)
          throw new Error('OpenAI issuer mismatch.');
        const endpoint = (key: string) => {
          const url = new URL(String(data[key]));
          if (url.origin !== issuer || url.username || url.password || url.hash)
            throw new Error('OpenAI endpoint mismatch.');
          return url.href;
        };
        return {
          issuer,
          authorization_endpoint: endpoint('authorization_endpoint'),
          token_endpoint: endpoint('token_endpoint'),
          jwks: createRemoteJWKSet(new URL(endpoint('jwks_uri'))),
        };
      })().catch((error: unknown) => {
        this.metadata = undefined;
        throw error;
      });
    }
    return this.metadata;
  }

  private cookie(value: string, seconds: number) {
    return `${COOKIE}=${value}; Path=/auth/openai; HttpOnly; SameSite=Lax; Max-Age=${seconds}${this.baseUrl.protocol === 'https:' ? '; Secure' : ''}`;
  }

  async start(request: Request, response: Response, linkingOwner?: string) {
    try {
      const provider = await this.provider();
      const browser = random();
      const state = random();
      const nonce = random();
      const verifier = random();
      await this.db
        .delete(openaiTransactions)
        .where(lt(openaiTransactions.expires, new Date()));
      await this.db.insert(openaiTransactions).values({
        id: hash(browser),
        state,
        nonce,
        verifier,
        next: linkingOwner ? '/connections' : safeNext(request.query['next']),
        owner: linkingOwner ?? null,
        expires: new Date(Date.now() + 600_000),
      });
      const to = new URL(provider.authorization_endpoint);
      to.search = new URLSearchParams({
        client_id: this.options.clientId,
        redirect_uri: new URL('/auth/openai/callback', this.baseUrl).href,
        response_type: 'code',
        scope: 'openid profile email',
        state,
        nonce,
        code_challenge: hash(verifier),
        code_challenge_method: 'S256',
      }).toString();
      response.setHeader('Set-Cookie', this.cookie(browser, 600));
      response.redirect(to.href);
    } catch {
      response
        .status(503)
        .type('text/plain')
        .send(
          'ChatGPT sign-in is unavailable. Try again or sign in with Google.',
        );
    }
  }

  async callback(request: Request, response: Response) {
    const refuse = () => {
      response
        .status(403)
        .type('text/plain')
        .send(
          'ChatGPT sign-in could not be completed. Sign in with Google, then link ChatGPT on the Connections page, or try again.',
        );
    };
    response.setHeader('Set-Cookie', this.cookie('', 0));
    try {
      const browser = (request.headers.cookie ?? '')
        .split(';')
        .map((part) => part.trim())
        .find((part) => part.startsWith(`${COOKIE}=`))
        ?.slice(COOKIE.length + 1);
      if (!browser || !/^[\w-]{43}$/.test(browser)) return refuse();
      // DELETE RETURNING is atomic even when separate Vercel instances race.
      const [pending] = await this.db
        .delete(openaiTransactions)
        .where(eq(openaiTransactions.id, hash(browser)))
        .returning();
      if (
        !pending ||
        pending.expires.getTime() <= Date.now() ||
        request.query['state'] !== pending.state ||
        request.query['error'] ||
        typeof request.query['code'] !== 'string'
      )
        return refuse();
      if (pending.owner && (await this.owner.who(request)) !== pending.owner)
        return refuse();
      const provider = await this.provider();
      const headers: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      };
      if (this.options.tokenAuthMethod === 'client_secret_basic') {
        const encode = (value: string) =>
          new URLSearchParams({ v: value }).toString().slice(2);
        headers['Authorization'] =
          `Basic ${Buffer.from(`${encode(this.options.clientId)}:${encode(this.options.clientSecret!)}`).toString('base64')}`;
      }
      const result = await fetch(provider.token_endpoint, {
        method: 'POST',
        headers,
        signal: AbortSignal.timeout(10_000),
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: request.query['code'],
          redirect_uri: new URL('/auth/openai/callback', this.baseUrl).href,
          client_id: this.options.clientId,
          code_verifier: pending.verifier,
        }),
      });
      if (!result.ok) return refuse();
      const tokens = (await result.json()) as { id_token?: unknown };
      if (typeof tokens.id_token !== 'string') return refuse();
      const { payload } = await jwtVerify(tokens.id_token, provider.jwks, {
        issuer: provider.issuer,
        audience: this.options.clientId,
        requiredClaims: ['sub', 'exp', 'iat'],
        clockTolerance: 5,
      });
      if (
        payload['nonce'] !== pending.nonce ||
        typeof payload.sub !== 'string' ||
        !payload.sub ||
        (payload['azp'] !== undefined &&
          payload['azp'] !== this.options.clientId) ||
        (Array.isArray(payload.aud) &&
          payload.aud.length > 1 &&
          payload['azp'] !== this.options.clientId) ||
        typeof payload.iat !== 'number' ||
        payload.iat > Date.now() / 1000 + 5
      )
        return refuse();
      const identity = and(
        eq(openaiIdentities.issuer, provider.issuer),
        eq(openaiIdentities.client, this.options.clientId),
        eq(openaiIdentities.subject, payload.sub),
      );
      // Only a signed-in owner can explicitly associate this subject.
      if (pending.owner)
        await this.db
          .insert(openaiIdentities)
          .values({
            issuer: provider.issuer,
            client: this.options.clientId,
            subject: payload.sub,
            owner: pending.owner,
          })
          .onConflictDoNothing();
      const [linked] = await this.db
        .select()
        .from(openaiIdentities)
        .where(identity);
      if (!linked || (pending.owner && linked.owner !== pending.owner))
        return refuse();
      await this.owner.establish(linked.owner, response, pending.next);
    } catch {
      refuse();
    }
  }

  async linked(email: string) {
    const rows = await this.db
      .select()
      .from(openaiIdentities)
      .where(
        and(
          eq(openaiIdentities.owner, email),
          eq(openaiIdentities.issuer, this.options.testIssuer ?? ISSUER),
          eq(openaiIdentities.client, this.options.clientId),
        ),
      );
    return rows.length > 0;
  }

  async unlink(email: string) {
    await this.db
      .delete(openaiIdentities)
      .where(
        and(
          eq(openaiIdentities.owner, email),
          eq(openaiIdentities.issuer, this.options.testIssuer ?? ISSUER),
          eq(openaiIdentities.client, this.options.clientId),
        ),
      );
  }
}
