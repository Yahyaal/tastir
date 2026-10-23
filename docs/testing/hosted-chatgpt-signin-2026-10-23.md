# Tutorial integration and hosted ChatGPT sign-in — 23 October 2026

## Delivered

The source-link work from `codex/source-tutorial-links` was merged on top of Claude's `9e9ad09` changes as `2430465`. All 39 tutorial JSON files were compared structurally with that main revision after removing `credits`: the remaining objects are identical, including step wording, ink parts, repeat, expectations and construction findings. Four source-credit merge conflicts were resolved without replacing the newer constructions or wording.

The hosted Studio has optional website identity sign-in with ChatGPT. It requires a registered hosted OpenAI client and remains disabled when its settings are absent. Owner access is linked explicitly from an existing authenticated Studio session; a matching OpenAI email grants no access. The browser gets a normal Studio session, never an OpenAI ID/access token. A new Postgres migration stores explicit subject links and short-lived, one-use login transactions.

## Verification

Checks ran sequentially with a 2 GB Node heap and one test worker. The existing app at port 4200, local assistant at 4291 and source-link preview at 4299 were left running.

| Check | Result |
| --- | --- |
| Schema integration | 34 tests passed |
| Focused player integration against Claude's latest steps | 219 tests passed across six files |
| Hosted OpenAI identity tests | 26 passed; simulated provider, signed JWTs and PKCE |
| Full `pnpm test -- --maxWorkers=1` | All 8 projects passed; 11 deployment preflight checks also passed |
| Full lint and TypeScript checks | All 8 projects passed |
| Workspace production build | All 8 projects passed |
| Vercel server packaging and hosted player build | Passed |
| Built hosted sign-in browser checks | Passed at 1280×900 and 390×844 |
| Tutorial links on updated main | Passed at both sizes, with no page errors |

Sign-in tests cover public and confidential token authentication, explicit linking, returning login, unlinking, email-match refusal, form protection, an identity already linked to another owner, simultaneous callback replay, expired transactions, wrong state/cookie, authorization denial, signature/issuer/audience/nonce/authorized-party checks, missing required claims, future issued-at, missing ID token and unsafe return paths. The server accepts an identity-only token response without access or refresh tokens.

The browser check used a throwaway PGlite database and a local simulated identity provider. It exercised Google owner sign-in, explicit ChatGPT linking, sign-out, returning ChatGPT sign-in to the requested Studio page, authenticated owner access, unlinking, and configured/disabled button visibility. These are implementation checks, not a live OpenAI evaluation. Phone screenshots were also inspected for clipping and readable controls. Temporary simulated servers were stopped after checking.

The source browser checks verified exact PDFs and video URLs, coverage of app steps, Watch and Draw along headers, challenge/drawing labels, the twenty instructional-source index entries and all 39 audit findings. Screenshots are local ignored artifacts under `docs/review/hosted-chatgpt-signin/` and `docs/review/source-tutorial-links/`.

## Still required before hosted activation

No OpenAI approval, registered website client, or real hosted OpenAI sign-in has been verified. Available local settings have no hosted OpenAI sign-in client. No Vercel credentials were available, and the Vercel integration was unconnected when checked; remote project settings were not inspected. No deployment or remote database migration was performed.

Locate the provisioned client registration, confirm the exact callback and token authentication method, configure the server settings, apply `0003_openai_sign_in.sql`, and complete a real sign-in on the registered HTTPS domain. [The setup guide](../CHATGPT-HOSTED-SIGN-IN.md) lists the values and owner flow. Hosted chatbot/ChatGPT-plan usage needs its separate partner authorization and supported inference contract. The existing local assistant remains the working chatbot route.
