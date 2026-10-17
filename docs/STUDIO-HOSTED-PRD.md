# Hosted studio

The plan for using the studio from anywhere, on a phone or a laptop, with Claude, ChatGPT, Codex and Gemini working on the same drawing as you. It builds on [the studio plan](STUDIO-PLAN.md), whose local version is done (see [the studio log](STUDIO-LOG.md)). Written 16 October 2026 and revised the same day with Codex's review of how the studio and its in-app assistant fit together (`docs/AI-STUDIO-INTEGRATION-REVIEW.md` on Codex's branch). Codex and Claude agreed every change; this file owns the tasks and their status, and the review is the reasoning behind M1 to M3.

## At a glance

- **Where it stands:** M0, M1, H1 and H2 are done (17 October); Codex is on M2; the rest is planned.
- **What happens first:** M0, merging Codex's branch and this one into main, once Codex has finished and you say go. Then M1 to M3 make the studio, the in-app assistant and outside agents work on one project, before anything is hosted.
- **What it costs:** nothing. Every service stays on its free plan.
- **What it runs on:** Vercel and Neon, the same as finsight, with a free Cloudflare Durable Object per project so an agent's edits appear at once.
- **What you still decide:** whether private research photos may be uploaded (decision 4). Nothing waits on it.

## Decisions

A ticked box is decided.

- [x] **1. Where it runs:** Vercel Hobby and a new free Neon project, as in finsight. Decided 16 October.
- [x] **2. The region:** Neon in AWS US East (Ohio) and Vercel functions in Cleveland (`cle1`), the nearest to Oklahoma. Decided 16 October.
- [x] **3. Sign-in:** Google through Auth.js, with only your address on the allow list, copied from finsight. Decided 16 October.
- [ ] **4. Private photos on the server:** may research photos that are not free be uploaded, where they stay private in Blob? Until you say yes, only free photos go up.
- [x] **5. Free plans only:** every service stays free, and Durable Objects come in only as the free live room (H7). Decided 16 October.

## Tasks

Done in this order, one commit each. A ticked box is done; whoever finishes a task ticks it here in the same commit, and an unticked box means planned, not started. H1 to H4 will be built and tested on this computer against a local Postgres, so only H5 needs the accounts.

- [x] **M0 · Merge the branches.** Codex's agent branches go into main, then `claude/studio` is rebased onto main and merged.
  - **Who:** you decide when, an agent does it.
  - **Done when:** main holds both, and the full test, lint, typecheck and browser checks pass. Codex's old copy of `docs/STUDIO-PLAN.md` and its extra "Studio plan" tab are dropped in favour of `claude/studio`'s.
- [x] **M1 · Never lose your unsaved change.** When an agent saves first, the studio page today drops your pending change and wrongly says Undo brings it back. It will keep that change, explain what happened, and offer to retry it against the latest drawing or keep it as a copy.
  - **Who:** an agent.
  - **Done when:** a browser test makes an agent and you edit at the same moment, and your change can be retried (checked against the agent's newer drawing, never replacing it blindly) or recovered as a copy.
- [ ] **M2 · One project, three workers.** You in the editor, the in-app assistant and an outside agent over MCP all work on the same project on this computer. Required before deploying.
  - **Who:** you with an agent.
  - **Done when:** all three edit one drawing; a stale edit is refused whole; each one's "undo mine" stops at the others' work; a named copy saves, reloads and exports with its colours; and the pictures match what you see.
- [ ] **M3 · Shared editing code.** The editing commands the studio and the in-app assistant both use move into one package (`packages/project-core`), pure TypeScript with no browser or network code, so the two never drift apart.
  - **Who:** an agent.
  - **Done when:** the studio and the assistant both use the package, and every existing test passes unchanged.
- [ ] **H0 · Check every client before building.** Open the local studio through a temporary public tunnel and add it to claude.ai (web and phone), Claude Code, ChatGPT developer mode, Codex and Antigravity.
  - **Who:** you with an agent.
  - **Done when:** the log has a table saying, for each client, whether it connected, whether it could change the drawing, and whether it showed a picture.
- [x] **H1 · Agents over the internet.** MCP over HTTP at `/mcp` beside today's local one; `ask` returns a question number at once and `wait_for_answer` waits at most 45 seconds; every change carries a command ID so a retry is never applied twice; smaller pictures, labelled as the server's drawing.
  - **Who:** an agent.
  - **Done when:** a test client over HTTP builds the square brief; `ask` returns at once and the answer arrives through `wait_for_answer`; a retried edit returns the first result without editing twice, and a reused ID with different content is refused; every default picture is under 100,000 base64 characters.
- [x] **H2 · Projects in a database.** The studio can keep projects in files (as now) or in Postgres; nothing is kept in memory between requests.
  - **Who:** an agent.
  - **Done when:** every studio test passes with both; of two edits based on the same revision, one is saved and the other refused whole; and the edit, its history entry and its command receipt are saved in one transaction.
- [ ] **H3 · Sign-in.** You sign in with Google; agents sign in with OAuth and you approve each one; each connection has a lasting identity that owns its edits; a Connections page lists them, renames them and can revoke any.
  - **Who:** an agent.
  - **Done when:** a test runs the whole sign-in with a stand-in Google; renaming a connection or refreshing its token keeps its edits its own; a revoked agent is refused at once; and a redirect to an unknown address is refused.
- [ ] **H4 · The studio page on Vercel.** The studio page in its own build, photo upload to private storage, export and import, and a phone layout.
  - **Who:** an agent.
  - **Done when:** the studio browser checks pass on a local Vercel build, on desktop and phone.
- [ ] **H5 · Deploy.** The Neon database, the Vercel project, photo storage, settings, and size and rate limits.
  - **Who:** you create the free Vercel and Neon accounts or projects, an agent does the rest.
  - **Done when:** the studio answers at its address, a redeploy keeps every project, and an exported project opens in the local studio unchanged.
- [ ] **H6 · Live with every agent, and measured.** Connect each client, update the setup notes, run the square brief in each, and measure speed and a week's use against the free limits.
  - **Who:** you with an agent.
  - **Done when:** each client that can write finishes the square brief, you answer one question from your phone, and the log has the speeds and the use.
- [ ] **H7 · The live room on Durable Objects.** One room per project that tells open pages about each new edit at once, on Cloudflare's free plan.
  - **Who:** you make a free Cloudflare account, an agent does the rest.
  - **Done when:** an agent's edit shows on the open page in under half a second, the page keeps working with the room switched off, and a week of use stays inside the free daily limits.
- [ ] **H8 · Optional: the drawing inside the chat.** An MCP App that shows the live drawing in claude.ai.
  - **Who:** an agent.
  - **Done when:** you see the live drawing in a Claude conversation and answer a question there.

### What can run at the same time

Two agents can work at once when their tasks touch different files, each in its own worktree on its own branch, merged one at a time. This computer runs out of memory with two test runs at once, so agents working in parallel take turns for the heavy checks (tests, browser checks, builds): one waits until the other's run has finished.

1. **Now, while Codex finishes its branch:** M1 and H1 in parallel. M1 changes only the studio page (`apps/player/src/studio/`), and H1 only the studio service (`apps/studio/`), and Codex touches neither. H0 can follow as soon as H1 has its HTTP endpoint, because a chat app cannot reach today's local-only connection.
2. **Then alone:** M0, the merge, because it touches everything.
3. **Then:** M2 (you with an agent, mostly checking) beside H2 (the database store, in `apps/studio/`).
4. **Then alone:** M3, the shared package, because it moves code that both the studio and the assistant use.
5. **Then three at once:** H3 (sign-in, mostly new files), H4 (the studio page on Vercel) and H7 (the live room, a new Cloudflare Worker in its own folder that runs locally for free). H8 can join here too.
6. **Then in order, with you:** H5 (deploy) and H6 (live use and measuring), and H7 goes live after H6's first measurements.

The details behind each task are below.

## What the owner wants

The owner wants to use the studio from the deployed app, not only on the computer at home. They want to open a project in a browser anywhere, including on a phone, and have Claude, ChatGPT, Codex or Gemini work on the same drawing with them. Each agent should still use the owner's own $20 plan, because Anthropic forbids third-party apps from signing in with a Claude plan, and that rule is why the studio works through MCP in the first place. The owner wants the app and the drawing to feel fast, and wants to use only free plans, while trying out Cloudflare Durable Objects to learn them.

## Why the local studio cannot simply be deployed

The local studio is built to be reachable only from the computer it runs on, and every part would change for a hosted version. The studio page exists only on the dev server, because `app/app.tsx` loads it behind a dev check, and the GitHub Pages build leaves it out. The service listens on 127.0.0.1 and trusts anyone holding a secret file, which works only when every program runs on the same machine. It is one long-running process that keeps open projects, marks and waiting questions in memory, and projects are folders on the local disk. Agents start `tools/studio-mcp.sh` as a local program over stdio, but the chat apps (claude.ai, ChatGPT, the Gemini app) can only reach a server on the public internet over Streamable HTTP, with OAuth sign-in. The author name comes from an environment variable each client sets, and a remote client cannot set it.

## Which agents can connect, and how

These facts were checked on 16 October 2026; the sources are listed at the end. Two of them changed this year, so each one is checked again live in task H0 before any code depends on it.

| Agent | How it connects to a hosted studio | What we know |
| --- | --- | --- |
| Claude in claude.ai, the desktop app and the phone app | A custom connector, added by pasting the server's URL in Settings → Connectors. | Supported on Pro. Claude speaks Streamable HTTP, follows the 2025-03-26, 2025-06-18 and 2025-11-25 authorization specs, registers itself through Dynamic Client Registration, and returns to `https://claude.ai/api/mcp/auth_callback` (allow `https://claude.com/api/mcp/auth_callback` too). A tool call times out after 240 seconds and a tool result is limited to about 150,000 characters. Claude shows MCP Apps, which are interactive pages inside the chat. |
| Claude Code | `claude mcp add --transport http tastir-studio https://…/mcp`, then sign in from `/mcp`. | Same OAuth, with a loopback redirect on a random port. Tool timeout and output size are configurable. |
| ChatGPT on the web | Developer mode, then add a custom app by URL. | Uncertain for Plus. Write tools were opened to Plus and Pro in September 2025, but later help pages say full MCP, including tools that change things, is only for Business, Enterprise and Edu, with Plus limited to read-only tools. Task H0 tests this in the owner's account; if Plus cannot write, ChatGPT can still look and comment, and Codex remains the way to use the ChatGPT plan for drawing. |
| Codex CLI | `codex mcp add tastir-studio --url https://…/mcp`, then `codex mcp login tastir-studio`. | Streamable HTTP with OAuth is supported; credentials go to the system keyring. |
| Gemini | Antigravity CLI (`agy`) with a `serverUrl` entry in `~/.gemini/config/mcp_config.json`, signing in from `/mcp`. | Gemini CLI stopped serving Google AI Pro accounts on 18 June 2026, and Antigravity CLI replaced it, so [the setup notes](STUDIO-SETUP.md) are out of date for Gemini. The Gemini web app also takes custom MCP apps since mid-2026, but reports say only for personal accounts in the US and in English. Users report that AI Pro limits in Antigravity are tight. |

## How it will work

### Vercel and Neon, the same as finsight

The hosted studio runs on Vercel's free Hobby plan with a free Neon Postgres database and Google sign-in through Auth.js, the same stack as the owner's finsight app. The owner already knows how to run it, and it costs nothing at one person's use. Hobby is for personal, non-commercial projects, which a private studio is. Its free allowances (about 1 million function calls, 4 hours of active CPU and 360 GB-hours of memory a month) are far more than one person and a few agents use, and the studio tracks its own use against them (task H6).

Vercel does not keep a process running or keep a disk, so the studio's service changes shape. Each request is handled on its own and keeps nothing in memory afterwards, and everything that was in memory or in folders moves to Neon. The `Studio` class gets a store interface with two versions: the file store used today, so `pnpm studio` and the stdio MCP server keep working at home exactly as now, and a Postgres store for Vercel. The edit logic (`ops.ts`, `project.ts`) does not change, because it already works on one project at a time and returns a new revision.

The deployment serves three things at one address, for example `tastir-studio.vercel.app`. `/mcp` is the MCP server for agents over Streamable HTTP, using Vercel's MCP handler. `/api` is today's HTTP routes as Vercel functions, used by the studio page. `/` is a build of the Tastir player with the studio page switched on, served from Vercel's CDN. Serving the page from the same address means the owner's sign-in is an ordinary first-party cookie and the page never holds a token. The public site on GitHub Pages stays as it is, without the studio, because the studio is private to signed-in people.

### Projects in Neon

A project becomes rows in a separate free Neon project, so the studio's data never mixes with finsight's. The drawing and its goals are one row in `projects` with a `revision` column; each history entry is a row in `revisions` with its author and label, so loading a project does not load its whole history; notes, questions and answers are rows in `notes`; marks are rows in `marks` that expire after an hour; and the photo's size and alignment are on the project, with the image itself in Vercel Blob (below). Connected agents and their tokens are in `oauth_clients` and `oauth_tokens`.

An edit reads the project, checks it with the same code as today, and saves it in one transaction whose update only succeeds if the revision is still the one the edit was based on (`UPDATE projects … WHERE id = $1 AND revision = $2`). That is the same rule the local studio enforces in memory, so an edit based on an old view is still refused whole. The database code uses postgres.js with `prepare: false` against Neon's pooled address, as finsight's decisions file explains, because a save reads the project, checks it and writes it in one transaction, and Neon's HTTP driver only runs fixed batches of queries, not a transaction that decides what to write after reading. Migrations use Drizzle, as in finsight.

### Photos in private Vercel Blob

Reference photos go in a private Vercel Blob store, which Vercel made generally available on 30 June 2026. The browser uploads a photo straight to Blob with a one-time signed address, because a Vercel function accepts at most 4.5 MB per request, and the browser first shrinks the photo to at most 2,000 pixels on its long side. Photos are only ever read through a signed-in route or a short-lived signed address, never at a public one. This matters because many research photos are not free to share, and the content rules allow only free photos in the public app.

### Signing in

The owner signs in to the studio page with Google through Auth.js, with an allow list holding only the owner's address at first, copying finsight's `auth.config.ts`. Sessions are Auth.js JWT cookies, so signing in needs no session table.

Agents sign in through OAuth 2.1 with PKCE, with the studio acting as its own authorization server, built on the MCP TypeScript SDK's auth support. When an agent connects for the first time, the client opens the studio's sign-in page. If the owner is not signed in, it sends them through Google, then shows "Allow Claude to work on your studio projects?" with Allow and Deny. The studio supports Dynamic Client Registration, because Claude uses it, and Client ID Metadata Documents, which the newest spec prefers. Redirects are allowed only to the claude.ai and claude.com callbacks, ChatGPT's callback and loopback addresses.

Each token belongs to one client, so the author name comes from the token and not from an environment variable. The client's own name ("Claude", "ChatGPT", "Codex", "Antigravity") is the default, and the owner can rename it, for example to "Claude on phone". A Connections page lists every connected client with when it was last used, and the owner can revoke any of them. Tokens are kept only as hashes, access tokens last an hour and refresh tokens rotate.

### Tool changes for chat apps

These work locally but would fail or mislead once agents connect over the internet, so they change for every client.

1. **`ask` waits too long.** It waits up to ten minutes for the owner's answer, but claude.ai stops a tool call after 240 seconds and Codex after 60 by default. `ask` will save the question and return its number at once, and a new `wait_for_answer` tool waits at most 45 seconds, which leaves room under Codex's 60, then says the question is still open so the agent can wait again. Questions stay in the database, so an answer given later is never lost.
2. **Pictures are too big.** A construction picture at the default 1,000 pixels is 125 KB, about 167,000 characters as base64, which is over claude.ai's limit of about 150,000. At 700 pixels it is about 113,000. The default size drops to 768 pixels, the PNG is written with a limited palette, and a test checks that every default picture stays under 100,000 characters.
3. **Who made each edit.** The author comes from the connection's lasting identity (above) instead of `TASTIR_AUTHOR`, which stays only for the local stdio server. The name shown is only a label.
4. **Retries.** A request can fail on the way back after the edit was saved, and the agent then sends it again. Every change (an edit, a note, a question) carries a command ID, unique per project and connection, saved in the same transaction. A repeat returns the first result without doing it again, and a reused ID with different content is refused. Reads need no ID.
5. **Which picture is which.** A picture the server draws shows the saved project at a named revision, not the owner's screen. Only a connected browser knows what the owner is looking at, so a tool that means the owner's live view says so, with its age, and says plainly when no browser is open.

### Speed

The drawing feels as fast as the app does today, because it is drawn in the browser by the same engine and Web Worker, not on the server. The owner's own edits show at once and are saved in the background; if a save is refused because an agent changed the drawing first, the page takes the agent's version and says so, as it does locally. The page itself comes from Vercel's CDN.

Three things depend on the server, and each has a target that task H6 measures.

- **An agent's edit reaching the page.** Vercel cannot hold a connection open cheaply, so the page asks for the project's revision every second while someone has edited in the last two minutes, every five seconds otherwise, and not at all while the tab is hidden. Each check is a single small read. An agent's edit therefore shows within about a second while work is going on. Target: under 1.5 seconds.
- **Saving an edit.** One function call and one transaction, which should take 100 to 300 milliseconds when the Vercel functions and Neon are in the same region. Target: under 400 milliseconds.
- **The first request after a quiet spell.** Neon's free plan stops the database after five minutes without use and cannot be set otherwise; the first query afterwards takes about half a second, and a Vercel function that has gone cold adds a few hundred milliseconds more. This happens once, when work starts, and an agent at work keeps both awake. Target: under 1.5 seconds.

The owner is in Oklahoma, so the Neon database goes in AWS US East (Ohio) and the Vercel functions in Cleveland (`cle1`), which is the same AWS region. A save then crosses the country once, from Oklahoma to Ohio and back, and the function and the database talk to each other inside one region.

Task H7 below makes an agent's edit reach the page much faster, on Cloudflare's free plan.

### A live room on Durable Objects, free

The owner wants to learn Durable Objects without paying monthly, so they come in as a small, free addition that makes the studio faster. They do not replace Vercel and Neon.

A Cloudflare Durable Object is a small program with its own storage that lives at one place on Cloudflare's network, and every request for it reaches that one copy. Each studio project gets one, a "live room". The studio page keeps a WebSocket open to its project's room. After every saved edit, the Vercel function tells the room the new revision, and the room passes it to every open page at once, which then reads the change from Vercel as it does now. An agent's edit should then show in well under half a second instead of up to a second, and the page stops checking every second. Neon stays the only place a drawing is kept, so the room holds nothing that could be lost, and if the room cannot be reached the page goes back to checking every few seconds.

This fits the free plan, which needs no card and fails instead of billing when a daily limit is reached. Cloudflare's documentation gives a Durable Object 30 seconds of CPU for each request or WebSocket message, separately from the 10 milliseconds a plain Worker gets on the free plan, and a room uses far less than either because it only passes small messages along. The free plan allows 100,000 Durable Object requests and 13,000 GB-seconds a day, and the room uses the WebSocket Hibernation API so that an open but quiet page costs nothing. Free accounts get SQLite-backed objects only, which a room does not need yet. The room checks a short-lived ticket signed by Vercel before it accepts a page's WebSocket, and Vercel signs its revision messages with a shared secret, so nobody else can listen or send.

If the room works well and the owner wants to go further, a second step can try holding the drawing itself in the Durable Object, checking each edit there within its 30 seconds of CPU. That is a larger change and stays out of this plan until H7 has shown how the free plan behaves in real use.

### The studio page on Vercel

The studio page, which today exists only on the dev server, becomes part of a separate build served by the Vercel deployment. It talks to `/api` directly with the session cookie instead of through the dev server's `/__studio` proxy, and the change stream becomes the revision checks above. Photo upload, alignment, questions, marks and notes all work as they do locally. The page works on a phone, because the owner will often answer an agent's question away from the desk.

### Moving projects between home and the server

An Export button downloads a project as a zip of the same files the local studio keeps (`project.json`, `pattern.json` and the photo), and Import takes one back. That moves a project between the local studio and the hosted one, so the owner can keep working offline, and it is also the backup. Neon's free plan keeps a short history of the database for restoring a mistake.

### Safety limits

The address is public, so every route needs a session or a token. Requests are limited in size (edits at 1 MB, photos at 10 MB through Blob) and in rate per client. Logs never hold tokens or photos. Projects and storage have caps, with a clear message when one is reached; Neon's free plan holds 0.5 GB, which is thousands of projects because photos are in Blob. No AI API keys are stored, because every agent uses its own app and its own plan.

### Deploying

Vercel deploys on push to the branch it watches, as finsight does. Because GitHub Actions are off at the owner's request, nothing else checks the code first, so the rule is the same as finsight's: run `pnpm check` and the studio checks locally before pushing, and say so. Database migrations run by hand with a command that names the database it changes.

### Later: the drawing inside the chat

Claude and ChatGPT both show MCP Apps, which are small interactive pages a tool can open inside the conversation. An `open_studio` tool could show the live drawing, its marks and the open question right in the chat, so on a phone the owner can see what the agent means without switching apps. This is optional and comes after everything above works.

### Not in this work

Accounts for other people and sharing projects with them belong to the product plan's accounts phase ([PRD](PRD.md), "Accounts and library"). The hosted studio is built so that this can come later: projects already record their authors, the database already has an owner on each project, and the allow list can become real accounts. The contest runner stays a local tool, because it starts the agents' command-line programs on the owner's computer.

## Risks

- **ChatGPT Plus may be read-only.** If so, ChatGPT can look and comment but not draw, and the ChatGPT plan draws through Codex instead. H0 settles it before any work depends on it.
- **Gemini keeps changing.** Its command-line route moved once this year. The studio depends only on MCP, so any Gemini client that speaks it can connect.
- **OAuth problems in the clients.** People have reported claude.ai connector sign-in bugs (see the sources). The sign-in tests run against the SDK's own client, and H0 tests the real ones early.
- **Polling may feel slow.** Until H7, an agent's edit can take up to a second to show. H6 measures it, and H7's live room fixes it.
- **The free Durable Object limits may differ in practice.** Cloudflare's pages give a Durable Object 30 seconds of CPU per message but a plain Worker only 10 milliseconds on the free plan. The room does very little work, and H7 checks real use against the daily limits; the studio keeps working without the room.
- **Free allowances change.** Vercel and Neon have both changed their free plans before. H6 records real use, so a change shows up before it bites.
- **A public address.** Anything on the internet is probed. Every route needs sign-in, there is one allow-listed account, and there are no API keys on the server to steal.
- **Usage limits on $20 plans.** Pictures use a lot of them. Smaller default pictures help, and work is saved after every edit, so a stopped agent loses nothing.

## Sources

- Anthropic: [Build an MCP server for Claude](https://claude.com/docs/connectors/building) (transport, OAuth specs, callback URL, 240-second timeout, 150,000-character limit, MCP Apps), [Authentication for connectors](https://claude.com/docs/connectors/building/authentication), [Get started with MCP Apps](https://claude.com/docs/connectors/building/mcp-apps/getting-started), [custom connectors help article](https://support.claude.com/en/articles/11503834-building-custom-connectors-via-remote-mcp-servers), [reported OAuth callback issue](https://github.com/anthropics/claude-ai-mcp/issues/313).
- MCP: [authorization spec](https://modelcontextprotocol.io/specification/latest/basic/authorization), [client registration (CIMD preferred, DCR kept for compatibility)](https://modelcontextprotocol.io/specification/latest/basic/authorization/client-registration).
- OpenAI: [developer mode announcement, September 2025](https://x.com/OpenAIDevs/status/1965807401745207708), [Connect from ChatGPT](https://developers.openai.com/apps-sdk/deploy/connect-chatgpt), [a 2026 summary of the plan limits](https://coworker.ai/blog/chatgpt-mcp) (third party; the help article itself could not be fetched).
- Google: [Transitioning Gemini CLI to Antigravity CLI](https://developers.googleblog.com/an-important-update-transitioning-gemini-cli-to-antigravity-cli/), [Gemini CLI stopped serving individual accounts](https://github.com/google-gemini/gemini-cli/discussions/28017), [Antigravity MCP docs](https://antigravity.google/docs/mcp?tab=cli), [AI Pro limits in Antigravity](https://discuss.ai.google.dev/t/google-ai-pro-quota-on-antigravity-is-far-too-restrictive/144912), [Gemini app custom apps](https://zapier.com/blog/gemini-connectors/) (third party).
- Codex: [MCP in Codex](https://developers.openai.com/ja-JP/docs/extend/mcp), [Codex CLI OAuth and Streamable HTTP](https://codex.danielvaughan.com/2026/06/03/codex-cli-mcp-v0136-per-server-env-targeting-oauth-streamable-http-concurrent-tools/) (third party).
- Vercel: [limits](https://vercel.com/docs/limits) (Hobby: about 1 million calls, 4 CPU-hours, 360 GB-hours a month; 300-second functions), [function limitations](https://vercel.com/docs/functions/limitations) (4.5 MB request body), [private Blob is generally available](https://vercel.com/changelog/vercel-private-blob-is-now-generally-available).
- Neon: [scale to zero](https://neon.tech/docs/introduction/scale-to-zero) (five minutes, fixed on the free plan), [connection latency](https://neon.com/docs/connect/connection-latency) (a few hundred milliseconds after a suspend), [free plan summary](https://costbench.com/software/database-as-service/neon/free-plan) (third party: 0.5 GB and 100 compute hours per project).
- Cloudflare: [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) (10 ms of CPU per request on the free plan), [Durable Objects limits](https://developers.cloudflare.com/durable-objects/platform/limits) (30 seconds of CPU per request or WebSocket message; SQLite only and 5 GB on the free plan), [Durable Objects pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/) (free plan: 100,000 requests and 13,000 GB-seconds a day; over a limit, operations fail instead of being billed).
- The owner's finsight app (`~/Documents/projects/finsight`): README, `CLAUDE.md` and `DECISIONS.md` for the Vercel, Neon, Auth.js and postgres.js setup.
- Measured here: picture sizes from the running local studio on 16 October 2026 (construction 125 KB at 1,000 pixels, 84 KB at 700; wall 48 KB at 1,000).
