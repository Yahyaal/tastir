# H5 deployment preparation — 17 October 2026

Branch: `codex/h5-deploy-prep`, based on `origin/main` at `fd87d3f`. This prepares the owner's provider setup; it does not complete H5 or deploy a service.

## Delivered

- [Numbered owner setup steps](../STUDIO-DEPLOY.md): Neon in Ohio, Vercel/GitHub/private Blob, Google web OAuth callback, Free Cloudflare/Worker, and the nine server settings with their destinations. Local signing-key generation writes a private file without displaying keys. Credentials go directly into provider settings/private local files, never a chat.
- `pnpm studio:preflight [--settings private-file]`: validates production settings and HTTPS origins, requires certificate-verified Postgres TLS, then checks migration hashes/timestamps and required tables/columns in a read-only transaction. Bounded connection/query timeouts and fixed diagnostics cover authentication, DNS, permissions and TLS errors without echoing values or driver details. Exit code is 1 for any failure. It does not apply migrations or access drawing contents.
- [Vercel packaging audit](../STUDIO-VERCEL-AUDIT.md): primary documentation, observed H4 configuration, and exact first-deployment gates for pnpm version, workspace source-condition imports, isolated function execution, native PNG/font/tutorial assets, rewrites/body handling and private access.

No source edits were made in `apps/studio/`, `apps/player/src/studio/` or `apps/live-room/`. The H4 deployment/configuration files were inspected read-only from Claude's checkout, because they are not in this branch's main base. They still had the unversioned pnpm install override and frontend-only build command on the final read. The audit documents the permitted API/config/build changes to make if the linked artifact checks fail. No H4 deployment files were copied into this branch.

## Validation

Checks ran sequentially using the shared heavy-check lock and process checks, waiting for other Vitest/Playwright runs. Node heaps were bounded to 768–1024 MB; Nx and test worker parallelism were one. Existing dev servers were left running.

| Check | Result |
| --- | --- |
| `pnpm exec eslint tools/studio-preflight.mjs tools/studio-preflight.spec.mjs` | Pass |
| `pnpm test --maxWorkers=1` | Pass: 11 new Node tests, then 6 Nx projects / 10 tasks including dependencies |
| `pnpm lint --parallel=1` | Pass: 6 projects |
| `pnpm typecheck --parallel=1` | Pass: 6 projects / 12 tasks including dependencies |
| `git diff --check` | Pass |
| Isolated `vercel@64.5.0 build --yes` | Cannot build without successful Vercel authentication/project setup; no artifact produced |

The 11 new tests use the checked-in SQL migrations with Drizzle and an isolated PGlite database. They verify a fully migrated schema, retention of a seeded private drawing, missing/changed migration receipts, a dropped real column, a fresh unmigrated database, invalid/missing settings, no database access for malformed addresses, the pinned postgres.js SSL option, omitted unsupported libpq URL parameters, provider/driver error redaction, actionable error classifications, H4 settings drift, CLI exit codes and explicit private settings-file parsing. The public CLI diagnostics are checked against credential sentinels, including raw exceptions containing every supplied value. These are fake fixture credentials, not provider secrets.

The Vercel probe used an empty temporary CLI global-config directory, unset `VERCEL_TOKEN`, `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`, and disabled interactive input/telemetry. CLI 64.5.0 started on Node 22.23.3, attempted authentication, and returned: “The specified token is not valid.” It exited 1 before building. This is an authentication prerequisite, not evidence that the function or rewrites work. The linked build and isolated-artifact checks remain the explicit first H5 gate.

## Remaining owner/hosted checks

The owner supplies provider values privately tomorrow and runs migrations/preflight against the actual Neon database. A successful Neon TLS connection is not claimed from PGlite tests. Google sign-in, private Blob token/store access, matching Worker/Vercel signing keys, Vercel routing/body parsing/native rendering, request limits and persistence across redeployment require the real accounts and merged H4/H7 code. Follow the audit and owner guide before ticking H5. H6 owns deployed timing and the week of free-plan usage.
