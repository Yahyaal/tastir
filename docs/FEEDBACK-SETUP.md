# Pattern feedback: setup and operation

**PR #14 is merged.** For your site, follow [Turn on feedback: your remaining steps](FEEDBACK-GO-LIVE.md). The 29 October preparation applied the database migration, created the Cloudflare widget, and saved the keys and cleanup secret in the local private settings file. The remaining work is the public contact address, Vercel settings/redeploys, and real acceptance checks. This page is the technical operating reference.

The `codex/pattern-feedback` branch implements the first release of the [feedback plan](FEEDBACK-PLAN.md): contextual reports, optional current-drawing evidence, an owner-only inbox, moderation, retention and manual AI export. Direct access by connected agents remains the optional F7 phase. Production intake defaults to off. Opening a PR does not migrate the live database or enable reporting.

## Review it locally

Run `NODE_OPTIONS=--max-old-space-size=1536 pnpm test:feedback:browser` for the complete local reporting flow. It builds the hosted player and runs desktop and phone checks sequentially, using the real Express service, an isolated migrated Postgres-compatible database, private in-memory images and a stand-in owner sign-in. Only the local fixture accepts a simulated verification token. Production has no test-token bypass.

The development notes include this guide at `#/notes/feedback-setup` and the plan at `#/notes/feedback`. The owner inbox lives at `#/feedback` on the hosted build, with a link from Studio. In production, the Feedback button appears on lessons, Draw along, results and load failures only when `/api/feedback/config` reports enabled intake. The development server keeps the button visible for owner review when intake is disabled or the backend is unavailable. Its form offers an unsent-report download and explains when drawing attachments are unavailable.

Browser checks save light/dark desktop/phone captures under `docs/review/feedback/`. They cover anonymous sending with an actual captured board image, owner-only reading, redacted AI export, blocked verification, focus return, and retrying a lost response exactly once. The current-lesson review uses isolated player state and verifies that existing lesson progress is unchanged.

## Before enabling production

Apply migration `apps/studio/drizzle/0004_feedback.sql` with the existing migration command and deployment process. It creates six feedback tables and indexes, without modifying tutorial or Studio project content. Do this before deploying code that reads the inbox. The existing preflight compares the migrated database to the checked-in migration metadata.

Set these server-side settings in the hosted deployment. The site key is intentionally public; the other secrets never go to the browser.

| Setting | Purpose |
| --- | --- |
| `TASTIR_FEEDBACK_ENABLED` | Leave absent or `0` during preparation. Set to `1` only after the deployed acceptance checks. |
| `TURNSTILE_SITE_KEY` | Production Managed widget, with the actual hosted hostname allowlisted. The UI uses interaction-only appearance. |
| `TURNSTILE_SECRET_KEY` | Corresponding production Siteverify secret. Success, hostname and `feedback_submit` action are all verified on the server. |
| `TASTIR_FEEDBACK_CONTACT` | Public email address for owner-reviewed privacy/deletion requests. It appears in the form; it sends no automated email. |
| `CRON_SECRET` | At least 32 random characters. Vercel sends it as a Bearer token to the scheduled cleanup endpoint. Use a dedicated secret. |
| Existing private Blob configuration | `BLOB_STORE_ID` or `BLOB_READ_WRITE_TOKEN`. Without a private store, text reports work and drawing attachment controls are unavailable. Images never fall back to database storage. |

The runtime refuses enabled intake with missing settings or known Turnstile test keys. `pnpm studio:preflight` also checks optional feedback configuration when enabled, without printing values. Keep preview intake disabled unless that preview has its own allowed hostname, bot widget and deliberate database/privacy configuration. Only the Vercel runtime trusts its overwritten network-address header; ordinary local servers ignore forwarded headers.

The repository's `vercel.json` schedules `GET /api/feedback/cleanup` daily at 08:00 UTC. It requires `CRON_SECRET`; an unauthorized request does no database work. Until that secret is configured, the daily job returns 401 even while feedback intake is disabled. Configure the secret during deployment preparation to avoid those daily failures. Confirm the deployed job appears and succeeds in the provider dashboard. [Vercel documents the authorization and job behavior](https://vercel.com/docs/cron-jobs/manage-cron-jobs). A real hosted Turnstile submission, Blob persistence, deployed forwarded headers, and the first scheduled cleanup still need live acceptance checks; local stand-ins do not establish those results.

Use the existing free-plan ingress/firewall controls that the deployment actually supports. Application quotas bound saved data and verification work, but cannot prevent all function-invocation or network costs during a distributed attack. Check the project's current usage and available free storage before raising limits.

## Spam and capacity controls

There is no public report listing, receipt lookup, attachment address, email delivery, AI invocation or automatic issue creation. Drawing-agent OAuth access grants no feedback access. Only the owner's signed session can read or change reports; changes also require same-origin and CSRF checks. Reports and notes render as text, and links/images supplied in comments are never fetched automatically.

Quotas are shared atomic database counters using fixed time windows. Starting values are 5 reports per browser per 10 minutes, 20 per browser per day, 100 reports globally per hour and 500 per day. After 30 reports from one network in 10 minutes, further verified text reports enter quarantine; attachments need to be removed explicitly. The broader network ceiling is 120 accepted reports per 10 minutes. Cookie rotation still encounters network and global ceilings. Network pseudonyms are keyed HMACs that change with their quota window; raw IPs are not stored in report rows or application logs.

Before parsing or bot verification, broad attempt gates allow at most 120 requests per network per minute, 10 per signed browser session per minute, 600 globally per minute and 6,000 globally per day. These include session creation and failed attempts that pass the local sender gates. Network and browser gates run first; local refusals spend no global budget. The global minute and day counters update in one transaction, so a refusal at either global limit spends neither. Counters expire and cleanup removes them in batches. Retained records are capped at 10,000, serialized learner payload at 64 MiB, images at 20 MiB/day and 250 MiB retained. The payload cap also bounds drawing snapshots in Postgres. Thresholds live together in the feedback service; pause/resume controls are available immediately in the inbox.

Each request is at most 512 KiB. A drawing snapshot is at most 64 KiB, with structural/numeric limits applied before parsing. An image is at most 256 KiB and one megapixel, with each side at most 1,024 pixels. V1 accepts only the still, 8-bit RGB/RGBA PNG produced by the app's board capture. It bounds compressed input and decompression, strips ancillary chunks, and re-encodes the image before private storage. It accepts no arbitrary uploaded files, URLs, SVG, PDF or animation.

The inbox supports quarantine/restore, spam marking, page selection, bulk deletion and explicit intake/attachment pauses. Someone sharing a school or household network has room for multiple reports, and a suspicious burst is preserved for owner review before the broad ceiling is reached. Failed sends preserve the draft in memory and offer copy/download. Uncertain sends retain their original retry reference; editing starts only after a confirmed rejection or an explicit discard warning.

## Review, AI handoff and reproduction

Filter by status, moderation state, pattern, issue group or message text. Give related reports the same group name without changing their original messages. Changes use the report's row version; stale saves fail rather than overwriting another review. The inbox shows capacity and the last successful cleanup. Contact addresses are restricted to an owner-only section and omitted from list responses and export serializers.

For AI handoff, select up to 20 reports, preview and redact their messages, write an investigation goal, and choose whether to include review notes. Copy for AI creates a text brief; Download investigation bundle creates a self-contained JSON file containing selected context, drawing snapshots and inline PNGs. It omits email and abuse identifiers. Included images and drawing labels remain untrusted evidence. Copying the text does not grant access to private attachment URLs; use the bundle for images. Exports are recorded with selected report references and field names. The app starts no model request and gives an external agent no new tools or permissions.

The report preserves the instruction, source step IDs, displayed position, app commit identifier and a canonical tutorial content hash where available. Use release Git history and the commit identifier to recover older tutorial files; the inbox compares current content and warns about version differences. Open current lesson at this step uses an isolated, non-autosaving player. It is today's lesson, with an explicit warning when it differs.

Open construction as a separate review copy creates a new local pattern without replacing existing work. That copy restores the construction draft. The original image and the captured-state download additionally preserve ink selections, repeat placements and colors; the editor does not replay those Draw along selections. Full historical replay requires the matching tutorial and evaluator and is not claimed by this release.

## Retention and cleanup recovery

Reports expire after 365 days, quarantined/spam reports after 30 days, and optional contact/drawing evidence after 90 days. Contact and evidence are withheld from reads after their deadline, even if cleanup is delayed. Expired reports are also withheld from inbox/detail reads. Review notes follow their report's deletion. Standalone export manifests expire after a year. Provider backups and exported copies have their own retention and cannot be recalled by deleting the original.

For an ongoing investigation, the owner can explicitly extend an active report up to 730 days from now and active drawing evidence up to 365 days. This is recorded in the review history. Saving a note alone does not extend retention, and removed evidence cannot be resurrected. The original learner message remains immutable; export redactions change the exported copy only.

If a send is interrupted, a retry can reclaim its receipt after the two-minute lease expires instead of waiting for the daily cleanup. Recovery uses a database row lock so only one retry takes ownership. A stale sender cannot overwrite or release that replacement. Any old private image remains tracked until deletion succeeds.

Cleanup handles a bounded amount of work per call with a 40-second work budget, retries failed private-object deletion, and retains object keys/reserved capacity until successful cleanup. Partial work or failures remain visible in the inbox; run it again to continue. Capacity gates remain enforced when cleanup is behind.

Use Run bounded cleanup in the owner inbox, or run `pnpm feedback:cleanup` with `TASTIR_STUDIO_URL` and `CRON_SECRET` in the process environment. For existing local settings, `node --env-file=.env.studio-preflight.local tools/feedback-cleanup.mjs` loads them without printing their contents. The command makes at most three bounded cleanup requests and prints aggregate counts only. Never paste the real secret into a PR, a report or a command shown to others.

Production rollout and the week of observed traffic/false positives remain F6. Optional report-scoped, revocable agent grants remain F7. Neither is enabled by this PR's test fixtures.

## Local validation (28 October 2026)

All checks ran sequentially with bounded Node heaps and one test worker.

| Check | Result |
| --- | --- |
| Full workspace suite (`pnpm test --maxWorkers=1 --outputStyle=stream`) | All 8 projects and their dependency tasks passed, including the engine's full geometry/golden suite: 4,026 tests in 23 files. |
| Full player unit suite | 2,998 tests passed in 89 files, including development-mode feedback preview. |
| Full Studio unit suite | 106 tests passed in 11 files, including 22 feedback tests. Regressions cover local refusal without global quota consumption, atomic global limits, parallel expired-lease recovery and stale-worker protection. |
| Schema suite | 44 tests passed, including structure/size bounds and canonical content serialization. |
| Deployment preflight tests | 12 passed, including optional feedback settings and refusal of production test-key configuration. |
| Real Chromium / local hosted service (`pnpm test:feedback:browser`) | All 14 desktop/phone checks passed: the original 8 plus disabled-intake visibility and attachment explanations for unavailable storage or failed configuration. Bot verification and identity providers were local stand-ins. |
| Workspace lint (`pnpm lint --parallel=1`) and strict type checks (`pnpm typecheck --parallel=1`) | Both passed across all 8 projects. Existing lint warnings remain. |
| Builds | Hosted browser build, ordinary public build and packaged Studio function with its native renderer all passed. Test-only server/token markers and private review document markers were absent from the checked production artifacts. |

The PR #14 review fixes were verified with all four requested commands before pushing, using `NODE_OPTIONS=--max-old-space-size=1536` and sequential execution. Actual production provider, persistence, ingress and scheduled-cleanup checks remain F6 as described above.
