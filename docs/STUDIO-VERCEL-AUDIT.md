# H5 Vercel packaging handoff — 17 October 2026

This is the evidence/check list behind [the owner's short setup guide](STUDIO-DEPLOY.md), not another task plan. The hosted PRD remains authoritative. The initial audit used Claude’s in-progress H4 checkout. The server packaging follow-up below uses the merged H4/H7/H5 tree at `81728bd`. Studio source remains unchanged.

## What documentation establishes

Vercel supports a root `api/index.ts` Node function, including Express. Root package `type: module` selects ESM. Its TypeScript support does **not** build TypeScript project references, so root `tsconfig` references cannot stand in for packaging workspace code. Use the Node runtime for the native renderer. [Node runtime](https://vercel.com/docs/functions/runtimes/node-js), [Express support](https://vercel.com/docs/frameworks/backend/express).

A root project gives the build access to all pnpm workspace packages. Workspace dependencies must be explicitly declared; Studio currently declares engine/schema/protocol and H4 must declare the live-room package it imports. Lockfile detection exists, but Vercel says an explicit `pnpm install` override selects the oldest available pnpm. The install command now explicitly selects `npx --yes pnpm@10.30.3 install --frozen-lockfile`; verify that version in the deployed build log. [Monorepos](https://vercel.com/docs/monorepos), [package manager selection](https://vercel.com/docs/package-managers).

`outputDirectory`, `regions`, `functions.includeFiles` and rewrites are supported configuration fields. The config sets `dist/studio-hosted`, `cle1`, 60-second function duration and explicitly includes tutorials plus the generated server, fonts and native renderer. It rewrites REST, MCP, OAuth discovery and sign-in/connection routes to `/api`. That is plausible configuration, **not a platform routing proof**. [Configuration reference](https://vercel.com/docs/project-configuration/vercel-json).

Vercel uses Node File Trace to collect function dependencies; computed filesystem reads may need `includeFiles`. Resvg ships precompiled native `.node` files, including Linux GNU builds. Thus a local PNG test proves the local binary works, not that Vercel's artifact contains it. [Vercel file tracing](https://vercel.com/kb/guide/how-can-i-use-files-in-serverless-functions), [resvg's own documentation](https://github.com/thx/resvg-js).

## Before the first deployed build — agent checks

1. **Use the merged tree and pin the install.** Repository root, Other framework, Node 22, production branch main; keep the lockfile and pnpm workspace intact. Verify `pnpm --version` in the build log is 10.30.3. Do not omit optional dependencies: resvg selects its native platform package from them. The build command now runs `node tools/studio-build.mjs` before the hosted Vite build. It uses esbuild already pinned in the live-room workspace; no dependency or lockfile changes are needed.

2. **Build with the actual Vercel builder.** After the owner creates the project, use `pnpm dlx vercel@64.5.0 login`, `pnpm dlx vercel@64.5.0 link` (select the existing project), `pnpm dlx vercel@64.5.0 pull --yes --environment=production`, then `pnpm dlx vercel@64.5.0 build --prod`. `.vercel/` is ignored and contains private pulled settings; do not attach it or its env files to reports. Vercel documents pulling project settings before a local build. [Build CLI](https://vercel.com/docs/cli/build), [pull CLI](https://vercel.com/docs/cli/pull).

3. **Workspace resolution: implemented and locally proved.** `tools/studio-build.mjs` bundles `apps/studio/src/vercel.ts` into `dist/studio-function/server/index.mjs`, using esbuild’s `@tastir/source` condition. Internal `@tastir/*` packages and JavaScript dependencies are included. Only Node built-ins and `@resvg/resvg-js` remain external; the script fails if the bundle metadata reports another runtime dependency. Optional `ws` native accelerators are disabled at build time, retaining its JavaScript fallbacks. A `createRequire(import.meta.url)` banner supports bundled CommonJS dependencies. `api/index.ts` imports this generated ESM module; it no longer imports Studio TypeScript. Build-time declarations are generated for that import and are not needed at runtime.

   The standalone proof below transpiles the real API entry and runs it from a temporary directory outside the checkout, without TypeScript, workspace links, `NODE_PATH`, source conditions or a TS loader. Node’s filesystem permission model restricts the function to that artifact. It uses a dedicated real PostgreSQL 16 cluster, migrated separately during test setup, and proves a project is actually stored. This establishes the generated function’s runtime independence; the linked Vercel builder/manifest inspection in check 2 still needs the owner’s project settings.

4. **Native/assets packaging: implemented and locally proved.** The build copies resvg’s loader and installed optional native package(s) into a real `dist/studio-function/node_modules` tree, dereferencing pnpm links and omitting TypeScript declarations. On this Linux x64 GNU machine the artifact contains `@resvg/resvg-js-linux-x64-gnu/resvgjs.linux-x64-gnu.node`. Build on Vercel to select its own platform binary; do not upload a macOS-built native artifact. Optional dependencies must remain enabled.

   Fonts and their licence are copied to `dist/studio-function/fonts`, preserving `picture.ts`’s `../fonts` lookup relative to the bundled module. Tutorials stay at the function root’s `tutorials/`, preserving the existing working-directory lookup. Explicit `includeFiles` globs cover these assets, the module and its native dependencies. The isolated test imports a shipped tutorial through HTTP, saves it, requests a real 400-pixel PNG, checks decoded pixels, and observes the actual renderer receiving only the packaged font with `loadSystemFonts: false`. A separate native text render with those same font options proves visible glyphs. System font fallback is refused by the assertions and filesystem permissions.

   The measured standalone package is **52 files, 10,998,178 bytes uncompressed** (about 11.0 MB decimal / 10.49 MiB), including the API JavaScript, tutorials, renderer and font. Individually gzipped files total **3,598,627 bytes**; this is a compression estimate, not a Vercel ZIP measurement. The server module alone is **4,716,229 bytes**. Vercel documents a standard **250 MB uncompressed** Node function limit, including runtime layers, so this application payload leaves substantial headroom. The test enforces a conservative 250,000,000-byte ceiling. Inspect the final `.vercel/output/functions/` artifact and its size after check 2; that platform wrapper/layer overhead is not included in this standalone measurement. No large-function beta is required. [Current function limits](https://vercel.com/docs/functions/limitations).

5. **Prove rewrites and request bodies on Vercel.** Fetch `/` and a built static asset. Anonymous `/api/me` must return JSON 401, not a static 404 or HTML. OAuth discovery at `/.well-known/oauth-authorization-server` must name the production site; anonymous `/mcp` must return an OAuth 401 with the expected resource metadata. `/login` must produce a Google redirect with callback `https://<site>/auth/google`; callback, token, register, revoke, consent and connection routes must reach Express at their original paths. Exercise a JSON save and a consent form POST: confirm the platform does not pre-consume the body before Express parses it. If necessary, an API/config fix is Vercel's documented `NODEJS_HELPERS=0` setting, followed by testing both body types. [Advanced Node configuration](https://vercel.com/docs/functions/runtimes/node-js/advanced-node-configuration).

6. **Check real persistence/private access.** Use the owner's Google session to save/reload/redeploy/export, upload and read a private Blob photo, and get a rendered PNG. Confirm anonymous photo/project access is refused and production MCP discovery passes any platform deployment protection. Confirm Worker ticket renewal and notifications use `LIVE_ROOM_ORIGIN`/`LIVE_ROOM_SECRET`, with `STUDIO_ORIGINS` set to the exact Studio origin. In the browser Network panel, verify a WebSocket 101 followed by `ready` and `revision` messages; an edit arriving through polling alone does not prove room authentication works. Exercise upload/JSON size caps and request-rate limits before opening the deployment to agents. Preflight validates presence and database state; it cannot prove provider token permissions or that two independently entered room secrets match.

## Database URL compatibility

Reading the pinned postgres.js 3.4.9 sources (`src/connection.js` and `src/index.js` in its installed package) shows that `sslmode=require` explicitly disables certificate verification, whereas `verify-full` keeps Node's certificate verification. Unknown URL parameters are forwarded as server startup settings; this driver has no `channel_binding` implementation. The guide/preflight therefore require `sslmode=verify-full` and reject a libpq `channel_binding` parameter. This changes deployment configuration, not Studio source. The preflight connection also explicitly requires certificate verification. Tests check the real driver's parsed SSL option; successful Neon connectivity still needs the owner's actual database.

## Local evidence

The isolated account-free `vercel build` probe and final validation results are recorded in [the H5 test report](testing/h5-deploy-prep-2026-10-17.md). No deployed Vercel artifact or provider account is claimed validated by this preparation task. If the CLI requires login/project settings, the six checks above remain the explicit first H5 deployment gate; account setup can proceed in parallel with that agent work.


## Reproduce the source-free function proof

Install workspace dependencies with pnpm 10.30.3 and a local PostgreSQL installation providing `initdb`, `pg_ctl` and `psql`. Run as a non-root user. The test finds standard PostgreSQL 16/15 Linux paths and common macOS 16 paths, or accepts `STUDIO_TEST_POSTGRES_BIN=/path/to/bin`. It creates a private temporary cluster with trust authentication bound to loopback, uses no provider credentials or existing database, and stops/removes it afterwards.

Run one check at a time, after confirming no other Vitest or Playwright process is active:

```sh
node --test --test-concurrency=1 tools/studio-build.spec.mjs
```

The test builds the server, stages only its packaged files plus a transpiled API entry, starts the function under Node 22 filesystem restrictions, and checks anonymous `/api/me` → JSON 401, OAuth issuer/authorization/token addresses, the Google callback address, authenticated tutorial loading, a real Postgres write and labelled PNG output. Fixture-only session credentials are generated locally; no secrets are printed. The function process can read only its staged directory. Test instrumentation wraps the packaged native renderer to assert its font options while still calling the real renderer; it does not alter Studio code or substitute an image.

The full hosted build can be run without provider settings using the `buildCommand` in `vercel.json`. Actual Vercel tracing, rewrites, request parsing, Google sign-in, Blob permissions and deployed rendering remain checks 2, 5 and 6. The earlier account-free CLI probe required authentication, so this follow-up does not claim a deployed function or a Vercel-generated manifest has passed.

### Follow-up verification — 17 October 2026

All checks ran sequentially with bounded Node heaps, after checking for other Vitest/Playwright processes. Results on the merged `81728bd` base plus this packaging change:

- `pnpm test --maxWorkers=1`: passed, including preflight tests and all eight Nx test projects (13 tasks with dependencies; eight task results reused from cache).
- `pnpm lint --parallel=1`: passed, all eight projects; explicit ESLint of `api/index.ts`, `tools/studio-build.mjs` and its test also passed.
- `pnpm typecheck --parallel=1`: passed, all eight projects and seven dependency tasks. An additional strict, standalone NodeNext `tsc --noEmit` check of `api/index.ts` passed against the generated declaration.
- The exact `vercel.json` build command: passed, producing both the server bundle and hosted frontend. Vite retained its existing warning about a frontend chunk exceeding 500 kB.
- `node --test --test-concurrency=1 tools/studio-build.spec.mjs`: passed against PostgreSQL 16 in about three seconds, including staging assets from the actual `includeFiles` configuration. Sizes above are from that final run.
- Formatting and `git diff --check`: passed. Only the API entry, Vercel config, new build script/test and this audit changed; no Studio source was edited.
