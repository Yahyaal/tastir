import { createHash, randomBytes } from 'node:crypto';
import type { Request, Response } from 'express';
import {
  SignJWT,
  createRemoteJWKSet,
  jwtVerify,
  type JWTVerifyGetKey,
} from 'jose';

/**
 * The owner's sign-in to the hosted studio: Google's OpenID Connect code
 * flow with PKCE, checked against an allow list of addresses, ending in a
 * signed session cookie. One provider and one person do not need a sign-in
 * library; jose checks Google's signed ID token.
 */
export interface GoogleOptions {
  readonly clientId: string;
  readonly clientSecret: string;
  /** Google's addresses by default; a test stands in its own. */
  readonly issuer?: string;
  readonly authorizeUrl?: string;
  readonly tokenUrl?: string;
  readonly jwksUrl?: string;
}

export interface OwnerOptions {
  readonly google: GoogleOptions;
  /** The addresses allowed in: at first, only the owner's. */
  readonly allow: readonly string[];
  /** At least 32 characters; signs the session cookie. */
  readonly secret: string;
  /** The studio's public address, such as https://tastir-studio.vercel.app. */
  readonly baseUrl: URL;
}

const SESSION = 'tastir_session';
const LOGIN = 'tastir_login';
const SESSION_DAYS = 30;

function cookies(request: Request): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (request.headers.cookie ?? '').split(';')) {
    const at = part.indexOf('=');
    if (at > 0)
      out[part.slice(0, at).trim()] = decodeURIComponent(
        part.slice(at + 1).trim(),
      );
  }
  return out;
}

/** Only a path on this site may be returned to after signing in. */
const safeNext = (next: unknown) =>
  typeof next === 'string' && next.startsWith('/') && !next.startsWith('//')
    ? next
    : '/connections';

export class Owner {
  private readonly key: Uint8Array;
  private readonly jwks: JWTVerifyGetKey;
  private readonly google: Required<GoogleOptions>;
  private readonly secure: boolean;

  constructor(private readonly options: OwnerOptions) {
    if (options.secret.length < 32)
      throw new Error('The session secret must be at least 32 characters.');
    this.key = new TextEncoder().encode(options.secret);
    this.google = {
      issuer: 'https://accounts.google.com',
      authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      jwksUrl: 'https://www.googleapis.com/oauth2/v3/certs',
      ...options.google,
    };
    this.jwks = createRemoteJWKSet(new URL(this.google.jwksUrl));
    this.secure = options.baseUrl.protocol === 'https:';
  }

  private cookie(name: string, value: string, seconds: number) {
    return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${seconds}${this.secure ? '; Secure' : ''}`;
  }

  /** The signed-in owner's address, or undefined. */
  async who(request: Request): Promise<string | undefined> {
    const token = cookies(request)[SESSION];
    if (!token) return undefined;
    try {
      const { payload } = await jwtVerify(token, this.key, {
        audience: 'session',
      });
      const email = payload['email'];
      return typeof email === 'string' &&
        this.options.allow.includes(email.toLowerCase())
        ? email
        : undefined;
    } catch {
      return undefined;
    }
  }

  /** A token for this session's forms, so another site cannot post them. */
  csrf(request: Request) {
    return createHash('sha256')
      .update(`${this.options.secret}\n${cookies(request)[SESSION] ?? ''}`)
      .digest('base64url');
  }

  /** Sends the owner to Google, remembering where to come back to. */
  async login(request: Request, response: Response) {
    const state = randomBytes(18).toString('base64url');
    const nonce = randomBytes(18).toString('base64url');
    const verifier = randomBytes(32).toString('base64url');
    const challenge = createHash('sha256').update(verifier).digest('base64url');
    const pending = await new SignJWT({
      state,
      nonce,
      verifier,
      next: safeNext(request.query['next']),
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setAudience('login')
      .setExpirationTime('10m')
      .sign(this.key);
    const to = new URL(this.google.authorizeUrl);
    to.search = new URLSearchParams({
      client_id: this.google.clientId,
      redirect_uri: new URL('/auth/google', this.options.baseUrl).href,
      response_type: 'code',
      scope: 'openid email',
      state,
      nonce,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      prompt: 'select_account',
    }).toString();
    response.setHeader('Set-Cookie', this.cookie(LOGIN, pending, 600));
    response.redirect(to.href);
  }

  /** Google's answer: checks it and starts a session for an allowed address. */
  async callback(request: Request, response: Response) {
    const refuse = (why: string) => {
      response.status(403).type('text/plain').send(why);
    };
    let pending: Record<string, unknown>;
    try {
      pending = (
        await jwtVerify(cookies(request)[LOGIN] ?? '', this.key, {
          audience: 'login',
        })
      ).payload;
    } catch {
      return refuse(
        'This sign-in took too long or did not start here. Try again.',
      );
    }
    if (request.query['state'] !== pending['state'] || !request.query['code'])
      return refuse('This sign-in does not match the one that was started.');
    const answer = await fetch(this.google.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: String(request.query['code']),
        client_id: this.google.clientId,
        client_secret: this.google.clientSecret,
        redirect_uri: new URL('/auth/google', this.options.baseUrl).href,
        code_verifier: String(pending['verifier']),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    const body = (await answer.json().catch(() => ({}))) as {
      id_token?: string;
    };
    if (!answer.ok || !body.id_token)
      return refuse('Google did not confirm the sign-in.');
    let claims: Record<string, unknown>;
    try {
      claims = (
        await jwtVerify(body.id_token, this.jwks, {
          issuer: this.google.issuer,
          audience: this.google.clientId,
        })
      ).payload;
    } catch {
      return refuse('Google’s answer could not be checked.');
    }
    const email = String(claims['email'] ?? '').toLowerCase();
    if (
      claims['nonce'] !== pending['nonce'] ||
      claims['email_verified'] !== true
    )
      return refuse('Google’s answer could not be checked.');
    if (!this.options.allow.includes(email))
      return refuse(`${email} may not use this studio.`);
    await this.establish(email, response, safeNext(pending['next']));
  }

  /** Called only after a provider identity has been checked and authorized. */
  async establish(email: string, response: Response, next: string) {
    if (!this.options.allow.includes(email))
      throw new Error('This account may not use the studio.');
    const session = await new SignJWT({ email })
      .setProtectedHeader({ alg: 'HS256' })
      .setAudience('session')
      .setExpirationTime(`${SESSION_DAYS}d`)
      .sign(this.key);
    const existing = response.getHeader('Set-Cookie');
    response.setHeader('Set-Cookie', [
      ...(Array.isArray(existing)
        ? existing
        : existing
          ? [String(existing)]
          : []),
      this.cookie(SESSION, session, SESSION_DAYS * 24 * 60 * 60),
      this.cookie(LOGIN, '', 0),
    ]);
    response.redirect(safeNext(next));
  }

  logout(response: Response) {
    response.setHeader('Set-Cookie', this.cookie(SESSION, '', 0));
    response.redirect('/');
  }
}
