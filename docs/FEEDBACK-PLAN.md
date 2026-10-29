# Pattern feedback and issue reports

Written 28 October 2026. Implementation status: the first release is built on `codex/pattern-feedback` for review. Production intake remains disabled until F6. See [setup, current behavior and validation](FEEDBACK-SETUP.md); F7 direct agent access remains optional later work. The owner requested a plan for learners to report pattern problems, difficulty following Draw along, and general comments, with private review and optional AI investigation. Spam protection must keep ordinary reporting easy.

On the development server, read this document at `#/notes/feedback`; the review page links here. The implementation and policy defaults are ready for review. Production configuration, deployed acceptance and later agent access remain separate steps.

## The result

A learner can send a short comment from the pattern or step they are viewing without creating an account. Tastir attaches the lesson context and offers to include the current drawing. The owner reviews reports in a private inbox and chooses what to share with an AI agent.

For example, someone reports “The line through B never completes” from step 6. The inbox shows the instruction they saw, the tutorial version, their optional drawing, and a link to investigate that stage. The owner can add a note, group related reports, and copy an investigation brief for an agent.

The first release includes the form, abuse protection, private inbox, drawing attachments, review copies, and manual AI export. Direct agent access is a later phase. The checkboxes below track implementation, while deployed acceptance and monitoring remain F6. The setup guide records the concrete first-release limits and reproduction boundaries.

## What the repository already provides

- `apps/player/src/along/progress.ts` keeps the tutorial address, displayed step index, drawing draft, ink, repeat placements, and colors. Capture the live state when the form opens because the saved progress may lag behind it.
- `packages/schema/src/lib/tutorial.ts` defines tutorial steps with numeric IDs. Capture both source step IDs and the displayed step/substep because grouped instructions and ink parts do not have a simple one-to-one mapping.
- `apps/studio/src/hosted.ts` provides the hosted Express service and owner authentication. The current project API is protected; public feedback needs a separate, deliberately limited route.
- `apps/studio/src/pg.ts` and the Studio migrations provide Postgres through Drizzle. `apps/studio/src/blob.ts` provides private image storage for projects. Feedback needs its own storage namespace and authorization checks.
- `apps/studio/src/mcp.ts` provides connected agent tools. Existing approval to edit Studio projects must not automatically grant access to learner reports.
- `#/review` and `#/notes` are development pages excluded from production. The production feedback inbox must be a separately authenticated page.

Reuse this infrastructure. Keep feedback out of tutorial JSON, project notes, and the public library. The hosted Studio plan's free-service requirement still applies; verify provider allowances before enabling the feature and do not promise unlimited submissions.

## The learner's experience

Place “Report an issue or leave feedback” beside the instruction panel in Watch and Draw along, and in the pattern menu for the other stages. Provide the same action on a pattern-load error screen using whatever context is still available. Keep the board and camera steady when the form opens. On a phone, use a scrollable sheet with a clearly reachable close button.

The form has three category buttons: “Something looks wrong”, “I'm stuck”, and “Comment or suggestion”. It asks “What happened, or what would you like to tell us?” Accept any non-empty message up to 4,000 characters, with a visible remaining count near the limit. Do not require a separate title, reproduction checklist, or minimum paragraph length.

Show “About: [pattern], [stage or step]” and allow the learner to change the scope to the whole pattern. Offer “Include my current drawing”, off by default, with an expandable preview of the board image and a plain explanation that editable drawing data is included. General comments need no attachment. If capture is unavailable or too large, explain this and let them send the text alone.

Offer an optional email field labeled “Email, if you would like a reply”. Explain that replies are optional and the address is private. V1 stores the contact detail for the owner; it sends no automatic emails and does not promise a reply or a fix.

Explain before Send: “We'll include the pattern, the instruction shown, and basic app details. Your report is private to the owner and may be shared with an AI tool to investigate. Your email is excluded from AI exports.” Include a short expandable list of the actual fields. The learner can remove the drawing before sending.

Start bot verification only when the form opens, so reading and drawing load no challenge script. Most successful checks should require no extra interaction. Give verification failures a short explanation and Retry without clearing the form. Keep focus, Escape handling, keyboard navigation, screen-reader labels, error announcements, and both app themes working.

After the server confirms the save, say “Thanks — your feedback was sent” and show a receipt reference. Closing the form returns to the same step and drawing. On a timeout, say the send could not be confirmed and retry with the same submission ID. On a known failure, say it was not sent. Preserve unsent text in memory while navigating within the app; do not silently persist contact details or drawings to localStorage. Offer Copy text and Download unsent report when retries are unavailable. A downloaded unsent report contains only the learner's message/context, no bot tokens or abuse metadata.

## Capturing the right context

Freeze context when the form opens; refreshing the attachment must be explicit. Collect the following bounded fields rather than copying the page, browser storage, or arbitrary logs.

| Field | Purpose and boundary |
| --- | --- |
| Pattern identity | Tutorial slug and title; for a personal pattern include only that current draft if the learner chooses to attach it. |
| Lesson position | Watch/Draw along/result mode; construction/ink/repeat/color stage; displayed step index and label; source step IDs; active substep/ink part where available. |
| Instruction | Exact heading and text shown, with a strict length bound. Preserve this even if the tutorial later changes. |
| Versions | App build ID, context schema version, tutorial content hash, and project revision when applicable. |
| App details | Coarse browser/OS family, viewport size, input mode, active drawing tool, and hint level where relevant. Avoid a fingerprint or exact device identity. |
| Optional drawing | Validated current draft, ink, repeat and color state, plus a raster image of the app's board. No full-screen capture, private reference photos, other saved designs, or conversation history. |
| Optional error | An allowlisted app error code and bounded app-generated explanation. Exclude full URLs, query strings, share-link fragments, credentials, and raw console/network logs. |

Treat client descriptions and hashes as supplied evidence. Validate the slug against the catalog when possible, but allow broken links and an older app build to report a problem. Record whether a tutorial version is known. Produce canonical hashes from the build's tutorial content, and retain versioned tutorial data with releases so an investigator can recover old instructions. Exact historical replay needs the matching tutorial content and compatible evaluator; show “Reported on an earlier version” when that is unavailable. Never substitute today's step and claim it reproduces the old report.

Opening a report must not evaluate an arbitrary uploaded tutorial. Reuse the draft schema, add structural limits before any geometry work, and restore only on an explicit owner action in an isolated review copy. Keep the original evidence immutable. If old data cannot be restored, preserve the text and board image and explain the limitation.

## Abuse protection that stays friendly

Use several independent controls. A bot check reduces automated submissions, but a valid token is not a license for unlimited reports. Cookies, IP addresses, content heuristics, and timing are signals with different weaknesses. Do not reject criticism, non-English messages, a source link, fast typing, assistive technology, or a missing cookie merely because it looks unusual.

### Background verification

Use Cloudflare Turnstile Managed mode with `appearance: interaction-only` for every public submission. The server must verify the token through Siteverify and check the expected hostname and `feedback_submit` action before creating a new report. Tokens are single-use and expire after five minutes; refresh expired checks while retaining the message. Keep the secret exclusively on the server. Use official test keys only in local/test environments and prevent a production test bypass. [Cloudflare's validation contract](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/) and [widget configuration](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/widget-configurations/) describe these behaviors.

Use a short verification timeout and a bounded retry. If the service is blocked or unavailable, retain the draft, offer Retry/Copy/Download, and let the learner continue drawing. Do not create an unverified public fallback endpoint. An owner-only setting may temporarily pause intake; switching protection off is not an outage strategy. Add the required provider privacy information when enabling the widget.

### Limits, shared networks, and duplicate sends

Enforce limits on the server across function instances and redeploys. Use atomic Postgres counters with expiry for the expected initial scale; a process-local Map is insufficient. Reuse the existing database before adding a paid service. Put a provider-supported ingress rule ahead of the function where the current free plan permits it; application counters cannot prevent function invocation or network costs from a large attack. Confirm provider controls during rollout.

Initial values below are configurable starting points for a small launch, not claims about current traffic. Watch false positives and tune them without changing the form.

| Boundary | Starting policy | Learner experience |
| --- | --- | --- |
| Browser submission attempts | 10 attempts/minute per short-lived server-issued signed session. | A brief cooldown with Retry-After; preserve the message. Missing cookies use the network checks and still permit a first report. |
| Accepted reports per browser | 5 in 10 minutes and 20 in 24 hours. | Explain when they can send again. Keep limits high enough for reporting several broken steps. |
| Network attempts | 120 attempts/minute per trusted client IP, including rejected submissions and session creation. | A temporary 429 with Retry-After. This is a separate broad ceiling for cookie rotation and malformed traffic. |
| Accepted reports per network | Above 30 in 10 minutes, quarantine further verified reports and omit attachments; above 120 in 10 minutes, temporarily throttle. | Shared schools, libraries, mobile networks, VPNs, and households get more room than one browser. Explain when an attachment must be removed; never remove it silently. |
| Entire feedback service | At most 100 new reports/hour and 500/day at launch; cap stored new attachment bytes at 20 MiB/day and retained attachments at 250 MiB. | Under unusual load, offer text-only sending if attachment capacity alone is exhausted, or explain intake is temporarily paused and offer draft recovery. |
| Incoming body | 512 KiB streamed request limit, checked before JSON/base64 decoding; explicit per-field and collection bounds. | Explain which attachment is too large and offer text-only sending. |

Count attempts before expensive verification or decoding, including invalid requests. Reserve accepted-report and storage capacity atomically so parallel requests cannot exceed a limit. Release reservations after bounded failures; include quarantined reports in all capacity totals. Use a short-lived database reservation for an in-flight submission, not an open database transaction while calling Cloudflare or object storage. Cap the number and lifetime of session/counter/reservation rows and delete expired rows in bounded batches so the defense cannot grow the database indefinitely. Avoid one row per rejected request or per arbitrary unbounded client-supplied value.

Use only the deployment's trusted proxy headers for network identity. Normalize IPv4/IPv6 and test the deployed proxy path; optionally use a generous IPv6-prefix ceiling to resist address rotation. Never trust an arbitrary leftmost forwarded address. Keep the production host allowlist explicit, including approved previews. [Vercel documents its forwarded-header behavior](https://vercel.com/docs/headers/request-headers).

Network identifiers in the database should be keyed HMAC values with a rotating secret, not raw IP addresses or plain hashes. The rotation schedule must preserve enforcement for the longest active limit window, including overlapping key periods. Store no raw IP in application report records or app logs; check provider access-log retention separately. These identifiers are pseudonymous and must expire; they are not anonymous analytics.

Give each send a random submission ID and a separate random retry secret. Store the secret's hash and a hash of normalized report content, excluding verification tokens. A retry with the same ID, secret, and content returns the original receipt without creating another report, consuming another successful-report quota, or revalidating a consumed Turnstile token. A mismatched secret or body cannot reveal another report or replace it. Bound concurrent attempts with a unique key and an in-flight state; a pending retry gets a short Retry-After. Expire retry receipts after 24 hours; the client must not automatically resend an uncertain submission after that window.

If verification succeeds but persistence fails, retain a short-lived verified reservation bound to the same ID, secret and content, or request a fresh check on retry. Never reuse verification for changed content. Use Siteverify's idempotency key for retries of the verification call itself. A known completed retry may return its receipt during an intake pause; new content still follows the current policy.

Separate retry safety from content grouping. Similar messages from different people can establish that a step is confusing. Preserve them as separate reports, suggest a group to the owner, and show the count. Do not silently discard matching criticism.

### Keep storage and processing cheap

V1 accepts only a board image generated by the app and a bounded drawing snapshot. It has no arbitrary file picker, pasted screenshot upload, PDF, SVG, archive, remote URL import, or public download link. An attacker can call the API directly, so verify content independently of the UI.

Limit a drawing snapshot to 64 KiB serialized data and a board image to 256 KiB decoded, 1,024 pixels per side, and one megapixel total. Constrain counts, nesting, string lengths, and finite numeric values in draft data before evaluation. Enforce the aggregate 512 KiB request limit after allowing for base64 expansion and other fields. If a complex legitimate drawing exceeds these bounds, send the message and instruction without it after the learner agrees.

Accept only PNG/WebP input that actually decodes within a pixel/memory/time budget; re-encode into a safe raster format and strip metadata. Set decoder concurrency and timeout limits. Use a server-generated private object key under a feedback namespace; never use a supplied filename or URL. Keep image processing out of the geometry engine and put no public rendering/evaluation work on the submission path. Attachment defenses follow [OWASP's file upload guidance](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html).

Keep the report and attachment manifest transactional; object storage is a separate system. Track upload state, reserve bytes first, and clean up abandoned objects. If optional storage fails, preserve the draft and offer to submit without the drawing; do not claim the full attachment was received. Never fall back to unbounded image storage in Postgres.

Public submissions trigger no AI inference, emails, external webhooks, geometry rendering, link fetching, or GitHub issues. This limits both cost amplification and bot-triggered side effects. Enforce small database connection pools, indexed lookups, bounded timeouts, and paginated inbox queries. These limits follow [OWASP's resource-exhaustion guidance](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html).

### Moderation and recovery

Keep workflow status separate from moderation. The owner sees a normal inbox and a Quarantined/Spam view, can restore a false positive, and can bulk mark or delete spam. Use simple bounded signals such as repeated link-heavy content or network bursts to suggest quarantine. Avoid an AI classifier on public submission. Fast completion or a honeypot value alone must not decide a report's fate; a honeypot is optional and must be inaccessible to keyboard, screen readers, and autofill.

Quarantine is a real private save and may return the ordinary receipt; it must remain reviewable. A blocked or capacity-rejected submission must say it was not accepted. A valid bot check does not bypass quotas, and a sign-in/session is not an unlimited exemption.

Provide an owner-only intake pause, attachment pause, capacity counters, and configurable limits. A submission-time flood must not lock the owner out of the inbox or disable ordinary patterns and drawing; give those paths separate budgets. Record aggregate accepted/quarantined/rejected counts and reason codes, verification failures, cleanup failures, and bytes used. Never put message bodies, email addresses, retry secrets, or bot tokens into telemetry. Show the owner capacity warnings in the inbox; postpone email digests until there is a separately bounded notification design.

## The owner's inbox

Add a hosted, owner-authenticated `#/feedback` page with New reports first. Filter by pattern, category, stage, workflow status, and moderation state. Search bounded message text and paginate results. List the pattern, learner's step label, date, short message excerpt, and related-report count.

A report opens to the message, captured instruction, version details, optional board image, and the attachment's availability. Show contact information only in an owner-only section. Provide private notes, optional priority, and workflow statuses New, Reviewing, Resolved, and Archived. Record who changed the status and when. A resolution note may link to the fixing commit or release; nothing is sent to the learner automatically.

“Open current lesson here” navigates to the reported stage in today's tutorial with a version warning if needed. “Open reported drawing as a review copy” explicitly loads validated evidence into an isolated scratch copy. Neither action replaces the owner's current editor draft, alters learner progress, or overwrites the saved report. Loading older versions must be labeled accurately.

Group related reports under one issue without merging away the original messages. Start with manual grouping and simple suggestions by pattern, tutorial hash, stage, and step; semantic clustering can come later. Unlinking or restoring a group member must remain possible.

Every data endpoint checks owner authorization on the server. A hidden route, random ID, or client-side admin check is insufficient. Serve owner/API responses with no-store caching. Render messages and notes as escaped plain text. Do not embed external images, execute HTML, automatically fetch links, or display arbitrary submitted markup. Protect owner mutations with existing session and CSRF checks; restrict public submission to the explicitly allowed same-origin JSON flow. Origin checks reduce browser misuse but do not replace bot checks and limits.

## Data and API contract

Put validated, versioned request/context shapes in `packages/schema` or a small shared feedback module. Put persistence, intake policy, moderation, and attachment access in dedicated Studio feedback modules so they remain separate from project editing.

| Proposed storage | Contents |
| --- | --- |
| `feedback_reports` | Random ID, server timestamps, category, message, workflow/moderation status, pattern/version/position fields, bounded context JSON, optimistic row version, and optional group ID. Index date/status and pattern/step for the inbox. |
| `feedback_contacts` | Optional email keyed to report ID, owner-only access and a shorter retention deadline. |
| `feedback_attachments` | Report ID, private key, type, byte/pixel sizes, content hash, snapshot schema version, upload state and expiry. Snapshots and images are separate evidence records. |
| `feedback_events` | Bounded authored private notes, status/group changes, export manifests and later agent findings. Retain the original learner message unchanged. |
| `feedback_groups` | Owner's issue title and member relationship; keep group notes separate from report evidence. |
| `feedback_intake_*` | Expiring HMAC counters, hashed retry receipts, in-flight reservations, and capacity totals. No permanent per-request abuse log. |
| Later: `feedback_agent_grants` | Selected report IDs, connection identity, allowed operations, expiry and revocation, linked to an investigation/export manifest. |

Use a database constraint for unique submission IDs and transactions for acceptance, status updates, grouping, and capacity reservations. Private contact fields and abuse identifiers must never appear in generic report serializers. Reject unknown mutation fields so callers cannot set moderation status, grants, owner notes, or server timestamps through the public route.

Proposed routes, adjusted to the existing router during implementation:

| Route | Access and behavior |
| --- | --- |
| `GET /api/feedback/config` | Public, small response: intake/attachment availability and public limits. No secrets, report counts, or administrative settings. |
| `POST /api/feedback/session` | Public and rate-limited; creates a short-lived signed first-party intake session. No report-reading privileges. |
| `POST /api/feedback` | Public but guarded; bounded validation, bot check, quotas, optional evidence, and durable receipt. No caller-controlled external destinations. |
| `/api/owner/feedback/*` | Owner-only list/detail, status, notes, grouping, moderation, deletion, attachments, exports, settings, and later grants. All mutations use CSRF protection. |
| Later: feedback MCP tools | Authenticated connection plus an active report-specific owner grant. Existing Studio OAuth alone is insufficient. |

Use machine-readable result codes with friendly copy: validation (400), verification required/expired (403), conflict on reused submission ID (409), too large (413), cooldown (429 with Retry-After), and unavailable/capacity pause (503). Return success only for a durable report, with its receipt; retries return that same receipt. Public responses contain no contact information, report detail, moderation flags, or lookup capability. A receipt reference is not a public status page.

## Sharing with an AI agent

V1 offers “Copy for AI” and “Download investigation bundle” for selected reports. Preview exactly what will leave the inbox: messages, captured instructions, versions, selected drawing evidence, owner-written investigation goal, and optional selected owner notes. Default to excluding email, network/abuse metadata, unrelated notes, and unrelated reports. Explain that a learner may have typed personal information into the message itself; let the owner redact an export without changing the original evidence.

The text brief includes stable report references, a context summary, reproduction limitations, and expected investigation output. The downloadable bundle includes a small JSON manifest and selected image/snapshot files. Copied text must explain that private attachments are available in the downloaded bundle; it must not claim the agent can open an owner-only URL. Keep an export event with the selected IDs, fields, recipient label if provided, and time; exported/downloaded copies cannot be recalled.

Start with at most 20 reports and 5 MiB of attachments per export, with a preview showing the selection size. Split larger investigations into explicit batches. Apply bounds to direct agent responses as well so a single grant cannot produce an unbounded download or model context.

For direct MCP access later, the owner selects reports, chooses a specific connected agent, writes the investigation goal, and creates an expiring grant. Add narrowly scoped `list_shared_feedback`, `get_shared_feedback`, `get_feedback_attachment`, and `add_feedback_finding` tools. Check the grant on every read/write, including attachment access and polling; revocation takes effect on the next request. Listing reveals only granted reports. Start with a 24-hour grant expiry and bounded batch/page sizes.

The grant permits reading selected evidence and appending attributed findings. It does not permit reading contacts, granting access onward, changing moderation, deleting reports, resolving issues, editing tutorials, or deploying fixes. Those actions need their existing independent authorization. Revocation stops future access; the UI must explain that it cannot remove data already read by an external tool.

Treat learner text, images, drawing labels, links, and agent findings as untrusted evidence, separate from the owner's instructions. Do not let report content expand tools or start shell commands, fetch links, or change access. A later “Investigate” action needs an explicit runtime budget, cancellation, and a human review of proposed changes. V1 has no automatic agent run. These boundaries address [OWASP's prompt-injection risk](https://community.owasp.org/attacks/PromptInjection).

## Privacy, retention, and deletion

Publish a short notice explaining the purpose, optional drawing/contact, bot-check provider, possible owner-initiated AI sharing, retention, and a way to request deletion using the receipt reference through an owner-reviewed contact channel. Choose/configure that contact route before public launch. Do not add an email-sending form as an unprotected alternative. Receipt references alone must not authorize public deletion or expose report details.

Proposed defaults: expire rate counters within their window plus one day, retry receipts after 24 hours, and moderation network identifiers within seven days. Delete quarantined/spam reports after 30 days unless restored. Delete optional contact information after 90 days. Retain drawing attachments for 90 days and report text/ordinary private notes for 12 months. Permit the owner to deliberately retain selected reports/evidence for an ongoing investigation and show that expiry change. Avoid automatically copying contact or network identifiers into notes.

Track expiries and use a bounded daily cleanup job supported by the existing hosting allowance, with a local/manual cleanup command as a recovery path. Delete private objects, associated rows, and active grants; retry failed object deletions and surface cleanup lag. Expire unreferenced upload reservations promptly. Keep aggregate counts without learner content. Document provider backup retention and that exported copies cannot be removed by deleting the source. A stopped cleanup job must be visible before storage reaches its cap.

## Implementation sequence and acceptance criteria

Implementation is on an isolated branch. F1 through F5 are built and locally validated for this first release; public intake stays disabled until the deployed F6 checks. The setup guide records the first-release decisions: fixed quota windows, PNG-only board images, a self-contained JSON investigation bundle, and construction-only editor restoration with full stage state preserved as evidence. Exact historical replay and direct agent grants are not claimed.

- [x] **F1 — Shared contract and persistence.** Define schemas, limits, canonical tutorial hashes, tables/migrations, the dedicated feedback service, immutable evidence, optimistic owner updates, receipts/reservations, and retention fields. Validate with the existing Postgres test fixture. Acceptance: parallel retries save once; collisions cannot disclose another report; unknown public fields and oversized/nested snapshots are refused; schema migration works without changing Studio projects.
- [x] **F2 — Protected intake.** Add the public routes before any broad body parser, streamed limits, trusted network identity, atomic shared counters, Turnstile adapter, upload reservation, private storage, and feature switches. Acceptance: malformed bodies, forged/replayed/wrong-host/wrong-action bot tokens, cookie resets, spoofed proxy headers, concurrent quota races, and storage failures behave as specified. Two service instances must enforce the same limits. Use a fake verifier locally and official testing keys for a separate provider integration check.
- [x] **F3 — Learner form and capture.** Integrate Watch, Draw along, result/menu, and load errors; add attachment preview/consent, coarse diagnostics, keyboard/phone layouts, and draft recovery. Acceptance: text-only anonymous sending works; capture reflects the opened step; closing, expiry, throttling, network failure, blocked scripts, and retries preserve work; no unrelated data is captured. A shared-network fixture permits multiple learners within the broad limits.
- [x] **F4 — Owner inbox and reproduction.** Add authenticated list/detail, filters, pagination, notes, status, groups, quarantine/restore, delete, private attachments, and isolated review copies. Acceptance: anonymous visitors and ordinary connected agents cannot list/read/update reports or retrieve guessed attachment IDs; submitted HTML remains text; stale owner updates are rejected; inspecting a report preserves the owner's draft and the learner's saved progress.
- [x] **F5 — AI export and operation.** Add preview/redaction, copy/download, bounded bundle manifests, audit events, intake/attachment pause, capacity display, cleanup job/command, and deployment preflight settings. Acceptance: exports omit contacts and abuse fields, contain only selected evidence/notes, label historical-replay gaps, and accurately describe attachment availability; expiry removes objects and reports/grants as required; failed cleanup and low capacity are visible. Confirm the public privacy/deletion contact.
- [ ] **F6 — Controlled public rollout.** Apply production migrations and private storage settings; provision Turnstile production keys and hostnames; confirm ingress protections and free-plan budgets; run the deployed acceptance checks with intake initially off, then enable it. Acceptance: one real anonymous report from desktop and phone reaches the owner's inbox with the expected drawing, a duplicate retry produces one record, protected reads fail for outsiders, and deployed limits/private caching match the plan. Monitor a week of actual counts, verification failures, storage and false positives before increasing caps. Deployment/enabling production is a separate owner-authorized action.
- [ ] **F7 — Optional direct agent access.** Add per-connection report grants, expiry/revoke UI, the narrowly scoped tools, and attributed findings. Acceptance: an agent reads exactly the selected reports; guessed report IDs, revoked/expired grants, reconnects with a different connection, contact requests, and attempts to change status are refused. Prompt-like text in a report cannot change tools or authority. A finding remains a proposal for owner review.

Run focused integration/browser checks for the new behavior and the repository's required lint, typecheck, tests, and affected production/hosted browser checks. Use one test worker and bounded memory, sequentially; preserve the owner's running server. Save desktop/phone and light/dark review captures for the form and inbox. Test challenge/accessibility recovery and shared-network behavior explicitly. Simulated model/provider replies do not establish that production bot checks or a live external agent work; record those checks separately.

## Release boundary

The useful first release is F1–F6: learners can report, the owner can review/reproduce, and selected evidence can be handed to any agent manually. F7 adds direct agent access after that foundation is established. Public discussions, arbitrary attachments, automatic emails, automatic AI triage, automatic code changes, and public report status pages each need a separate design before being added.
