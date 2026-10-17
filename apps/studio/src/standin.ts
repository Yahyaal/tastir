import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { SignJWT, exportJWK, generateKeyPair } from 'jose';

/**
 * A stand-in Google for tests: it signs in whoever `state.email` says at
 * once, with ID tokens signed by a key of its own, so the owner's sign-in
 * runs end to end without a Google account.
 */
export const OWNER = 'owner@example.com';

export async function standInGoogle(port = 0) {
  const { publicKey, privateKey } = await generateKeyPair('RS256');
  const jwk = { ...(await exportJWK(publicKey)), kid: 'k1', alg: 'RS256' };
  const state = { email: OWNER, nonce: '', url: '' };
  const app = express();
  app.get('/authorize', (request, response) => {
    state.nonce = String(request.query['nonce']);
    const back = new URL(String(request.query['redirect_uri']));
    back.searchParams.set('code', 'google-code');
    back.searchParams.set('state', String(request.query['state']));
    response.redirect(back.href);
  });
  app.post('/token', express.urlencoded({ extended: false }), async (_q, r) => {
    r.json({
      id_token: await new SignJWT({
        email: state.email,
        email_verified: true,
        nonce: state.nonce,
      })
        .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
        .setIssuer(state.url)
        .setAudience('google-client')
        .setIssuedAt()
        .setExpirationTime('5m')
        .sign(privateKey),
    });
  });
  app.get('/jwks', (_q, r) => r.json({ keys: [jwk] }));
  const server: Server = createServer(app);
  await new Promise<void>((r) => server.listen(port, '127.0.0.1', r));
  state.url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const url = state.url;
  return {
    server,
    url,
    state,
    /** The settings hostedApp needs to use this stand-in. */
    google: {
      clientId: 'google-client',
      clientSecret: 'google-secret',
      issuer: url,
      authorizeUrl: `${url}/authorize`,
      tokenUrl: `${url}/token`,
      jwksUrl: `${url}/jwks`,
    },
  };
}
