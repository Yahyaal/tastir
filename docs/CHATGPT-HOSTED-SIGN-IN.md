# ChatGPT sign-in on Vercel

## Current status

The local assistant still uses `pnpm dev:agent` and a loopback companion. Its locally registered client and account files do not establish hosted access. Do not copy those tokens or that client ID into Vercel.

The hosted Studio now has an optional, standard OpenID Connect website sign-in implementation. It is **disabled until a registered website client is configured**. No real OpenAI registration or hosted sign-in has been verified for Tastir. The owner recalls possible approval but is unsure. Available local settings contain no hosted OpenAI sign-in client; Vercel credentials are not available in this environment, so its remote settings have not been inspected.

This feature authenticates the Studio owner. It does **not** enable a hosted in-app chatbot, use the owner's ChatGPT plan for inference, or change the public pattern library's access. The existing ChatGPT-to-Studio MCP connection is another separate feature.

Official contracts checked on 23 October 2026:

- [Website identity sign-in](https://developers.openai.com/siwc/website): registered client, exact callback, PKCE, nonce, server-side one-time transaction, verified ID token, first-party session.
- [Request a client](https://developers.openai.com/siwc/request-client-id): hosted website availability is a limited trial for selected commercial partners.
- [ChatGPT plan usage in open-source apps](https://developers.openai.com/siwc/token-sharing-open-source): the local open-source route is separate from paid or remotely hosted apps.

## Enable after registration is confirmed

Find the OpenAI application registration or approval email. Confirm its client ID, registered token-endpoint authentication method, and this exact callback with OpenAI:

`https://tastir-studio.vercel.app/auth/openai/callback`

Use the actual production domain if it differs. Preview domains need their own exact registered callbacks and matching Studio base URL. Do not use an illustrative client ID from documentation.

Configure server-side Vercel environment variables (never `VITE_` variables):

| Setting | Value |
| --- | --- |
| `OPENAI_SIGN_IN_CLIENT_ID` | The provisioned website client ID |
| `OPENAI_SIGN_IN_TOKEN_AUTH_METHOD` | Exactly the registered method: `none` or `client_secret_basic` |
| `OPENAI_SIGN_IN_CLIENT_SECRET` | Only for `client_secret_basic`; leave absent for `none` |

Keep the existing Google, session, database, owner allowlist and Studio URL settings. Apply migration `0003_openai_sign_in.sql` with `pnpm studio:db:migrate` using the intended production database configuration, then run `pnpm studio:preflight`. The migration adds identity links and short-lived login transactions. It does not change any project table. Deploy the tested branch only after configuration is available. The production migration was applied on 23 October 2026 after the owner requested deployment; both sign-in tables are present and the existing project count is unchanged. Releases use the existing GitHub main → Vercel connection.

## First use

1. Sign in to the hosted Studio with the existing Google owner account.
2. Open `/connections` and choose **Link ChatGPT account**. This explicitly associates the verified OpenAI subject with the signed-in owner.
3. Sign out. On the Studio sign-in page, choose **Continue with ChatGPT**. It should return to the requested Studio page.
4. **Unlink ChatGPT** on Connections prevents future sign-ins through that association. It does not invalidate an existing Studio session; use **Sign out** to end that browser session. Google sign-in remains available.

An unknown OpenAI subject receives no project access even if its email matches the owner. Sign-in keys are the verified issuer, client ID and subject; provider email is never an authorization shortcut. Removing an email from `TASTIR_STUDIO_OWNERS` prevents its Studio sessions and linked sign-ins from being authorized.

## Implementation and checks

`apps/studio/src/openai.ts` loads OpenAI discovery, pins production endpoints to the OpenAI issuer, requests identity scopes only, and checks signed ID tokens using `jose`. It accepts identity-only responses without access or refresh tokens. Confidential client secrets go only in the HTTP Basic header.

A random HttpOnly, SameSite=Lax cookie (Secure on HTTPS) binds the browser to a ten-minute database transaction. PKCE verifiers stay server-side. Atomic `DELETE … RETURNING` consumes each transaction once across Vercel instances. Expired transactions are removed on subsequent login starts. Linking and unlinking require a Studio session and its form token. Callbacks verify state, expiration, signature, issuer, audience, authorized party when applicable, required claims and nonce. Raw ID tokens are not stored or returned to the browser.

Automated tests use a simulated provider with real signed JWTs and a PKCE check. They are not evidence of approval or a real hosted OpenAI sign-in. Before enabling in production, complete a real sign-in, sign-out/re-entry and unlink check on the registered HTTPS domain, verify the owner allowlist, and inspect the callback cookies. Hosted chatbot work still needs the separate partner authorization and supported inference contract; identity sign-in alone supplies neither.
