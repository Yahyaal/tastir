import {
  createHash,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';
import { z } from 'zod';
import type { ConnectionStatus } from '@tastir/agent-protocol';
import { AgentError, jsonRequest, publicError } from './errors.js';
import { StateStore, type Profile } from './store.js';

const ISSUER = 'https://auth.openai.com';
const TOKEN = `${ISSUER}/api/accounts/oauth/token`;
const RESOURCE = 'https://api.openai.com/v1';
const PLAN_SCOPE = 'chatgpt.tokens.use.direct';
const SCOPES = `openid profile email offline_access resource.invoke ${PLAN_SCOPE}`;
const remoteKeys = createRemoteJWKSet(
  new URL(`${ISSUER}/.well-known/jwks.json`),
);

export async function verifyIdentity(
  token: string,
  clientId: string,
  nonce?: string,
  keys: JWTVerifyGetKey = remoteKeys,
) {
  const { payload } = await jwtVerify(token, keys, {
    issuer: ISSUER,
    audience: clientId,
    algorithms: ['RS256'],
    requiredClaims: ['sub', 'exp', 'iat'],
    clockTolerance: 5,
  });
  if (!payload.sub || (nonce !== undefined && payload.nonce !== nonce))
    throw new AgentError(
      'identity_invalid',
      'The returned ChatGPT identity could not be verified. Sign in again.',
    );
  return {
    subject: payload.sub,
    email: typeof payload.email === 'string' ? payload.email : undefined,
  };
}

const TokenResponse = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1).optional(),
  id_token: z.string().min(1).optional(),
  expires_in: z.number().positive().finite(),
  token_type: z.string().refine((value) => value.toLowerCase() === 'bearer'),
  scope: z.string().optional(),
});
type Pending = {
  state: string;
  nonce: string;
  verifier: string;
  redirect: string;
  profile?: Profile;
  expires: number;
};

export class ChatGPTAuth {
  private pending?: Pending;
  private refreshing = new Map<string, Promise<string>>();
  private generation = 0;
  private disposed = false;
  private exchanging = 0;
  error: string | null = null;
  constructor(
    readonly store: StateStore,
    private fetcher: typeof fetch = fetch,
    private verify = verifyIdentity,
  ) {}

  private profile() {
    const state = this.store.read();
    return state.profiles.find((p) => p.id === state.activeId);
  }

  status(): ConnectionStatus {
    if (this.pending && this.pending.expires < Date.now()) {
      this.pending = undefined;
      this.error = 'Sign-in expired. Try connecting again.';
    }
    const state = this.store.read();
    const profile = this.profile();
    return {
      profiles: state.profiles.map((p) => ({
        id: p.id,
        label: `${p.email ?? 'ChatGPT account'} · ${p.id.slice(0, 6)}`,
        connected: !!p.tokens,
      })),
      activeId: state.activeId,
      connected: !!profile?.tokens,
      sharing: !!profile?.tokens?.scopes.includes(PLAN_SCOPE),
      signingIn: !!this.pending || this.exchanging > 0,
      error: this.error,
    };
  }

  start(redirect: string, profileId?: string) {
    this.generation++;
    const state = this.store.read();
    const profile = profileId
      ? state.profiles.find((p) => p.id === profileId)
      : undefined;
    if (profileId && !profile)
      throw new AgentError(
        'account_missing',
        'That saved account is no longer available.',
      );
    const pending: Pending = {
      state: randomBytes(32).toString('base64url'),
      nonce: randomBytes(32).toString('base64url'),
      verifier: randomBytes(32).toString('base64url'),
      redirect,
      profile,
      expires: Date.now() + 10 * 60_000,
    };
    this.pending = pending;
    this.error = null;
    const url = new URL(`${ISSUER}/api/accounts/authorize`);
    url.search = new URLSearchParams({
      client_id: profile?.clientId ?? 'dynamic_agent_client',
      ext_agent_host_id: state.hostId,
      ...(profile ? {} : { agent_name_hint: 'Tastir' }),
      ...(profile?.email ? { login_hint: profile.email } : {}),
      response_type: 'code',
      redirect_uri: redirect,
      scope: SCOPES,
      resource: RESOURCE,
      state: pending.state,
      nonce: pending.nonce,
      code_challenge_method: 'S256',
      code_challenge: createHash('sha256')
        .update(pending.verifier)
        .digest('base64url'),
    }).toString();
    return url.toString();
  }

  async callback(params: URLSearchParams) {
    const pending = this.pending;
    const state = params.get('state') ?? '';
    if (
      !pending ||
      pending.expires < Date.now() ||
      Buffer.byteLength(state) !== Buffer.byteLength(pending.state) ||
      !timingSafeEqual(Buffer.from(state), Buffer.from(pending.state)) ||
      params.getAll('state').length !== 1
    )
      throw new AgentError(
        'invalid_callback',
        'This sign-in link is invalid or expired. Return to Tastir and reconnect.',
      );
    this.pending = undefined;
    const generation = ++this.generation;
    this.exchanging++;
    try {
      if (params.has('error'))
        throw new AgentError(
          'sign_in_declined',
          'ChatGPT sign-in was not completed. You can try again in Tastir.',
        );
      const code = params.get('code');
      const clientId = params.get('client_id') ?? pending.profile?.clientId;
      if (
        !code ||
        !clientId ||
        clientId === 'dynamic_agent_client' ||
        params.getAll('code').length !== 1 ||
        params.getAll('client_id').length > 1 ||
        (pending.profile && clientId !== pending.profile.clientId)
      )
        throw new AgentError(
          'registration_incomplete',
          'ChatGPT did not return the expected app registration. Reconnect to try again.',
        );
      const profile: Profile = pending.profile ?? {
        id: randomUUID(),
        clientId,
      };
      // Keep the issued registration even if the one-time code expires.
      await this.store.update((s) =>
        s.profiles.some((p) => p.id === profile.id)
          ? s
          : { ...s, profiles: [...s.profiles, profile] },
      );
      const token = TokenResponse.parse(
        await jsonRequest(this.fetcher, TOKEN, {
          method: 'POST',
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: clientId,
            code,
            code_verifier: pending.verifier,
            redirect_uri: pending.redirect,
            resource: RESOURCE,
          }),
        }),
      );
      if (!token.id_token)
        throw new AgentError(
          'identity_missing',
          'ChatGPT did not return an identity token. Reconnect.',
        );
      const identity = await this.verify(
        token.id_token,
        clientId,
        pending.nonce,
      );
      if (profile.subject && identity.subject !== profile.subject)
        throw new AgentError(
          'account_changed',
          'This sign-in returned a different account. Add it as another account instead.',
        );
      if (generation !== this.generation)
        throw new AgentError(
          'sign_in_cancelled',
          'This sign-in was cancelled.',
        );
      await this.store.update((s) => {
        if (generation !== this.generation)
          throw new AgentError(
            'sign_in_cancelled',
            'This sign-in was cancelled.',
          );
        return {
          ...s,
          activeId: profile.id,
          profiles: s.profiles.map((p) =>
            p.id !== profile.id
              ? p
              : {
                  ...p,
                  ...identity,
                  tokens: {
                    accessToken: token.access_token,
                    refreshToken: token.refresh_token,
                    idToken: token.id_token,
                    scopes: (token.scope ?? '').split(/\s+/).filter(Boolean),
                    expiresAt: Date.now() + token.expires_in * 1000,
                  },
                },
          ),
        };
      });
      this.error = null;
    } catch (error) {
      if (generation === this.generation)
        this.error = publicError(error).message;
      throw error;
    } finally {
      this.exchanging--;
    }
  }

  async accessToken(force = false): Promise<string> {
    const profile = this.profile();
    const tokens = profile?.tokens;
    if (!profile || !tokens)
      throw new AgentError(
        'sign_in_required',
        'Connect your ChatGPT account first.',
        401,
      );
    if (!tokens.scopes.includes(PLAN_SCOPE))
      throw new AgentError(
        'plan_permission_required',
        'Reconnect and allow Tastir to use your ChatGPT plan.',
        403,
      );
    if (!force && tokens.expiresAt > Date.now() + 60_000)
      return tokens.accessToken;
    const running = this.refreshing.get(profile.id);
    if (running) return running;
    const refresh = (async () => {
      if (!tokens.refreshToken)
        throw new AgentError(
          'sign_in_required',
          'Your connection expired. Reconnect with ChatGPT.',
          401,
        );
      const next = TokenResponse.parse(
        await jsonRequest(this.fetcher, TOKEN, {
          method: 'POST',
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: profile.clientId,
            refresh_token: tokens.refreshToken,
            resource: RESOURCE,
          }),
        }),
      );
      const identity = next.id_token
        ? await this.verify(next.id_token, profile.clientId)
        : undefined;
      if (identity && identity.subject !== profile.subject)
        throw new AgentError(
          'account_changed',
          'The refreshed ChatGPT account did not match. Reconnect.',
        );
      const scopes =
        next.scope === undefined
          ? tokens.scopes
          : next.scope.split(/\s+/).filter(Boolean);
      await this.store.update((s) => {
        if (
          this.disposed ||
          s.profiles.find((p) => p.id === profile.id)?.tokens?.accessToken !==
            tokens.accessToken ||
          s.profiles.find((p) => p.id === profile.id)?.tokens?.refreshToken !==
            tokens.refreshToken
        )
          throw new AgentError(
            'connection_changed',
            'The ChatGPT connection changed. Start the request again.',
          );
        return {
          ...s,
          profiles: s.profiles.map((p) =>
            p.id !== profile.id
              ? p
              : {
                  ...p,
                  tokens: {
                    accessToken: next.access_token,
                    refreshToken: next.refresh_token ?? tokens.refreshToken,
                    idToken: next.id_token ?? tokens.idToken,
                    scopes,
                    expiresAt: Date.now() + next.expires_in * 1000,
                  },
                },
          ),
        };
      });
      if (this.profile()?.id !== profile.id)
        throw new AgentError(
          'connection_changed',
          'The active account changed. Start the request again.',
        );
      if (!scopes.includes(PLAN_SCOPE))
        throw new AgentError(
          'plan_permission_required',
          'ChatGPT plan permission is no longer enabled. Reconnect.',
          403,
        );
      return next.access_token;
    })().catch((error) => {
      this.error = publicError(error).message;
      throw error;
    });
    this.refreshing.set(profile.id, refresh);
    try {
      return await refresh;
    } finally {
      this.refreshing.delete(profile.id);
    }
  }

  async select(id: string) {
    if (!this.store.read().profiles.some((p) => p.id === id))
      throw new AgentError('account_missing', 'That account is not saved.');
    this.generation++;
    this.pending = undefined;
    this.error = null;
    await this.store.update((s) => ({ ...s, activeId: id }));
  }

  cancelSignIn() {
    this.generation++;
    this.pending = undefined;
  }

  shutdown() {
    this.disposed = true;
    this.cancelSignIn();
  }

  async disconnect() {
    this.generation++;
    this.pending = undefined;
    this.error = null;
    const profile = this.profile();
    // Clear locally first so an in-flight refresh cannot restore the connection.
    await this.store.update((s) => ({
      ...s,
      profiles: s.profiles.map((p) =>
        p.id === profile?.id ? { ...p, tokens: undefined } : p,
      ),
    }));
    if (!profile?.tokens?.refreshToken) return;
    try {
      const result = await this.fetcher(`${ISSUER}/api/accounts/oauth/revoke`, {
        method: 'POST',
        signal: AbortSignal.timeout(10_000),
        body: new URLSearchParams({
          token: profile.tokens.refreshToken,
          token_type_hint: 'refresh_token',
          client_id: profile.clientId,
        }),
      });
      if (!result.ok) throw new Error('Revocation failed');
    } catch {
      this.error =
        'Disconnected locally. Remote revocation was not confirmed; you can disconnect Tastir in ChatGPT settings.';
    }
  }
}
