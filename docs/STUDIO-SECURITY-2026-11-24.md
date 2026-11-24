# Studio security fixes — 24 November 2026

Gemini audited the hosted Studio on merged main (99d9de1) on 23 November. Each finding was checked in the code. This is what happened to each one.

## Fixed

1. **Metadata fetch could reach private addresses.** `isSafeMetadataUrl` checked only the name as written. A public name that resolves to a private address got through. The fetch now goes through `publicLookup`. It resolves the name and refuses it if any address is private, so the socket connects only to an address that was checked. A redirect is still an error.
2. **The redirect after sign-in could leave the site.** `owner.ts` let `/\evil.com` through, and browsers read the backslash as a slash. `safe.ts` now holds one `safeNext` that refuses backslashes and control characters. `owner.ts` and `openai.ts` both use it.
3. **The zip import had no limits, and SVG got unchecked strings.** The import now allows at most 16 entries and 40 MB unzipped. It checks the sizes the zip declares before unzipping, and fflate never unzips past the declared size. It unzips only `project.json` and the photo. An imported `reference` must have a known file and type, whole-number sizes and numeric alignment. The overlay checks this again before it writes the SVG. The photo itself is checked as `setReference` checks it: it must be a PNG or JPEG under 15 MB, and its header must match the type and size in `project.json`. Gemini suggested this on review. A wall fill reaches the SVG only as `#rrggbb`. The fill strings in a saved draft are not checked, and resvg can load local files from an `<image>`, so this was real.
4. **An MCP project id could hold `../`.** `Project` in `mcp.ts` now uses the `ID` regex from `store.ts`.
5. **Medium findings:**
   - Expired sign-in requests, codes and tokens are now cleared by the daily cron (`/api/feedback/cleanup`), which calls `auth.sweep()`.
   - A malformed cookie escape no longer throws a `URIError`. The value is kept as written.
   - Form and inbox CSRF tokens are now compared with `timingSafeEqual` (`sameSecret`).

## Left

- **Feedback rate limit without the cookie.** Leaving out the browser cookie skips only the per-browser limit. Every submission still needs a Turnstile pass. Each network still has its limits: 120 attempts a minute and 120 accepted reports every 10 minutes, with attachments quarantined after 30. There are also global caps of 100 reports an hour and 500 a day. A strict limit for posts without a cookie would block a classroom on one address whose session call failed, and the existing tests keep that case working.
- **In-memory MCP sessions on Vercel** (`hosted.ts`, `mcpSessions` in `http.ts`). Sessions live in one function instance's memory, so a request routed to another instance finds no session and has to connect again. Each session still answers only the connection that opened it. Sessions also close after a time without use. This is a reliability limit, not a way in. Moving sessions to the database, or running MCP without sessions, is its own task. It was not changed here.
