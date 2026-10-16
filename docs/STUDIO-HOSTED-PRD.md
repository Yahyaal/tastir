# Hosted studio: product requirements and tasks

Written 16 October 2026 at the owner's request, while Codex finishes its branch. It builds on [the studio plan](STUDIO-PLAN.md), whose local version is done (see [the studio log](STUDIO-LOG.md)). Nothing here is built yet. An HTML copy with a tick list and the owner's answers to the decisions lives at https://claude.ai/artifact/RmC2jZKaN1mMqgN8mvdzHB (read its `tasks` and `decisions` collections with the ArtifactData tool, and tick a task there when it is done); this file is the version other agents read, and the two must say the same thing.

## What the owner wants

The owner wants to use the studio from the deployed app, not only on the computer at home. They want to open a project in a browser anywhere, including on a phone, and have Claude, ChatGPT, Codex or Gemini work on the same drawing with them. Each agent should still use the owner's own $20 plan, because Anthropic forbids third-party apps from signing in with a Claude plan, and that rule is why the studio works through MCP in the first place.

## Why the local studio cannot simply be deployed

The local studio is built to be reachable only from the computer it runs on, and every part would change for a hosted version. The studio page exists only on the dev server, because `app/app.tsx` loads it behind a dev check, and the GitHub Pages build leaves it out. The service listens on 127.0.0.1 and trusts anyone holding a secret file, which works only when every program runs on the same machine. Projects are folders on the local disk. Agents start `tools/studio-mcp.sh` as a local program over stdio, but the chat apps (claude.ai, ChatGPT, the Gemini app) can only reach a server on the public internet over Streamable HTTP, with OAuth sign-in. The author name comes from an environment variable each client sets, and a remote client cannot set it.

## Which agents can connect, and how

These facts were checked on 16 October 2026; the sources are listed at the end. Two of them changed this year, so each one is checked again live in task H0 before any code depends on it.

| Agent | How it connects to a hosted studio | What we know |
| --- | --- | --- |
| Claude in claude.ai, the desktop app and the phone app | A custom connector, added by pasting the server's URL in Settings → Connectors. | Supported on Pro. Claude speaks Streamable HTTP, follows the 2025-03-26, 2025-06-18 and 2025-11-25 authorization specs, registers itself through Dynamic Client Registration, and returns to `https://claude.ai/api/mcp/auth_callback` (allow `https://claude.com/api/mcp/auth_callback` too). A tool call times out after 240 seconds and a tool result is limited to about 150,000 characters. Claude shows MCP Apps, which are interactive pages inside the chat. |
| Claude Code | `claude mcp add --transport http tastir-studio https://…/mcp`, then sign in from `/mcp`. | Same OAuth, with a loopback redirect on a random port. Tool timeout and output size are configurable. |
| ChatGPT on the web | Developer mode, then add a custom app by URL. | Uncertain for Plus. Write tools were opened to Plus and Pro in September 2025, but later help pages say full MCP, including tools that change things, is only for Business, Enterprise and Edu, with Plus limited to read-only tools. Task H0 tests this in the owner's account; if Plus cannot write, ChatGPT can still look and comment, and Codex remains the way to use the ChatGPT plan for drawing. |
| Codex CLI | `codex mcp add tastir-studio --url https://…/mcp`, then `codex mcp login tastir-studio`. | Streamable HTTP with OAuth is supported; credentials go to the system keyring. |
| Gemini | Antigravity CLI (`agy`) with a `serverUrl` entry in `~/.gemini/config/mcp_config.json`, signing in from `/mcp`. | Gemini CLI stopped serving Google AI Pro accounts on 18 June 2026, and Antigravity CLI replaced it, so [the setup notes](STUDIO-SETUP.md) are out of date for Gemini. The Gemini web app also takes custom MCP apps since mid-2026, but reports say only for personal accounts in the US and in English. Users report that AI Pro limits in Antigravity are tight. |

## What we will build

### One service on the internet

The hosted studio is the same `apps/studio` service running on one small server with a disk, at an HTTPS address such as `tastir-studio.fly.dev`. We keep it as one Node process that owns every drawing, because that is the design the local studio already relies on: every edit, from anyone, goes through the same checks and the same history in one place, and the file store, the PNG renderer and the live updates all work unchanged. The same code keeps running locally exactly as it does today, so `pnpm studio` and the stdio MCP server still work when the owner is at home.

The service serves three things at one address. `/mcp` is the MCP server for agents over Streamable HTTP. `/api` is today's HTTP routes, used by the studio page. `/` is a build of the Tastir player with the studio page switched on. Serving the page from the same address means the owner's sign-in is an ordinary first-party cookie and the page never holds a token. The public site on GitHub Pages stays as it is, without the studio, because the studio is private to signed-in people.

### Signing in

The owner signs in to the studio page with GitHub, because the owner already has a GitHub account and it needs no password store of our own. Only GitHub accounts on an allow list can sign in, and at first the list holds only the owner.

Agents sign in through OAuth 2.1 with PKCE, with the studio acting as its own authorization server, built on the MCP TypeScript SDK's auth support. When an agent connects for the first time, the client opens the studio's sign-in page. If the owner is not signed in, it sends them through GitHub, then shows "Allow Claude to work on your studio projects?" with Allow and Deny. The studio supports Dynamic Client Registration, because Claude uses it, and Client ID Metadata Documents, which the newest spec prefers. Redirects are allowed only to the claude.ai and claude.com callbacks, ChatGPT's callback and loopback addresses.

Each token belongs to one client, so the author name comes from the token and not from an environment variable. The client's own name ("Claude", "ChatGPT", "Codex", "Antigravity") is the default, and the owner can rename it, for example to "Claude on phone". A Connections page lists every connected client with when it was last used, and the owner can revoke any of them. Tokens are kept only as hashes, access tokens last an hour and refresh tokens rotate.

### Tool changes for chat apps

Three things work locally but would fail in a chat app, so they change for every client.

1. **`ask` waits too long.** It waits up to ten minutes for the owner's answer, but claude.ai stops a tool call after 240 seconds. `ask` will wait at most 200 seconds and then say the question is still open. A new `wait_for_answer` tool lets the agent keep waiting without asking again.
2. **Pictures are too big.** A construction picture at the default 1,000 pixels is 125 KB, about 167,000 characters as base64, which is over claude.ai's limit of about 150,000. At 700 pixels it is about 113,000. The default size drops to 768 pixels, the PNG is written with a limited palette, and a test checks that every default picture stays under 100,000 characters.
3. **Who made each edit.** The author comes from the token (above) instead of `TASTIR_AUTHOR`, which stays only for the local stdio server.

### The studio page on the server

The studio page, which today exists only on the dev server, becomes part of a separate build that the service serves. It talks to `/api` directly with the session cookie instead of through the dev server's `/__studio` proxy, and live updates still arrive over server-sent events. Photo upload, alignment, questions, marks and notes all work as they do locally. The page works on a phone, because the owner will often answer an agent's question away from the desk.

### Projects and photos on the server

Projects stay as folders of plain files on the server's disk, exactly as they are locally (`project.json`, `pattern.json` and the photo), because the code already writes them atomically and any agent can read them. Every write is followed by a daily snapshot of the disk, and an Export button downloads a project as a zip. A project can be moved between the local studio and the hosted one by export and import, so the owner can keep working offline.

Reference photos stay private. They are served only to the signed-in owner and to connected agents, never at a public address. This matters because many research photos are not free to share, and the content rules allow only free photos in the public app.

### Safety limits

The address is public, so the service treats every request as untrusted until it is signed in. Every route needs a session or a token. Requests are limited in size (photos at 10 MB, edits at 1 MB) and in rate per client. Logs never hold tokens or photos. The number of projects and the disk use have caps, with a clear message when one is reached. No AI API keys are stored, because every agent uses its own app and its own plan, so the only running cost is the server.

### Deploying

GitHub Actions are switched off at the owner's request, so deploying is a manual command, `pnpm studio:deploy`, run after `pnpm check` passes. It builds a container image with the service and the studio build of the player, and the container runs as an unprivileged user with the project folder on a mounted disk. A health check at `/health` tells the host when the service is up.

### Later: the drawing inside the chat

Claude and ChatGPT both show MCP Apps, which are small interactive pages a tool can open inside the conversation. An `open_studio` tool could show the live drawing, its marks and the open question right in the chat, so on a phone the owner can see what the agent means without switching apps. This is optional and comes after everything above works.

### Not in this work

Accounts for other people, sharing projects with them and storing projects in a database belong to the product plan's accounts phase ([PRD](PRD.md), "Accounts and library"). The hosted studio is built so that this can come later: projects already record their authors, and the allow list can become real accounts. The contest runner stays a local tool, because it starts the agents' command-line programs on the owner's computer.

## Decisions for the owner

These need the owner's answer before the work they block. Each has a recommendation.

1. **Where it runs.** Recommended: Fly.io, one small machine with 512 MB to 1 GB of memory and a 1 GB disk, at a few dollars a month. It runs the Node service unchanged with a real disk. Cloudflare Workers would cost about the same but would need the file store, the PNG renderer and the live updates rewritten, and its free plan's CPU limit is too small for piece finding. This blocks H4.
2. **The address.** Recommended: start with the free `*.fly.dev` address and move to a domain of the owner's later. This blocks H4.
3. **Sign-in.** Recommended: GitHub, with only the owner on the allow list. This blocks H2.
4. **Private photos on the server.** The owner decides whether research photos that are not free may be uploaded to the hosted studio, where they stay private. This blocks nothing; until then, only free photos go up.

## Tasks

Each task is one commit with its acceptance test, run one project at a time as the checks notes require. The first one needs the owner and no code. H1 to H3 can be built and tested entirely on this computer, so the hosting decision only blocks H4.

| ID | Task | Who | Done when |
| --- | --- | --- | --- |
| M0 | Merge Codex's agent branches into main, then rebase `claude/studio` onto main and merge it. | Owner decides, agent does | `main` holds both, and the full test, lint, typecheck and browser checks pass. |
| H0 | Check every door before building. Start the local studio with a temporary public tunnel and add it to claude.ai (web and phone), Claude Code, ChatGPT developer mode, Codex and Antigravity. | Owner with agent | A table in the log records, for each client, whether it connected, whether it could call a tool that changes the drawing, and whether it showed a picture. |
| H1 | Remote MCP. Add Streamable HTTP at `/mcp` beside stdio; take the author from the connection; shorten `ask` and add `wait_for_answer`; cap picture size. | Agent | An MCP SDK client over HTTP builds the square brief; a test shows `ask` returns within 200 seconds with the question still open; every default picture is under 100,000 base64 characters. |
| H2 | Sign-in. GitHub login with an allow list, OAuth 2.1 with PKCE, DCR and CIMD, the consent page, hashed tokens, refresh rotation, the Connections page with revoke. | Agent | A test runs the whole OAuth flow with the SDK's client and a stand-in GitHub, a revoked token is refused at once, and a redirect to an unknown address is refused. |
| H3 | The studio page on the service. A studio build of the player served at `/`, `/api` with the session cookie, SSE, photo upload, and the layout on a phone. | Agent | The studio browser checks pass against the service's own build on desktop and phone, signed in with the stand-in GitHub. |
| H4 | Deploy. Dockerfile, the Fly app and disk, secrets, `/health`, daily snapshots, export and import, size and rate limits, `pnpm studio:deploy`. | Owner decides, agent does | The deployed studio answers at its address, a deploy keeps every project, and an exported project imports into the local studio unchanged. |
| H5 | Live with every agent. Connect each client to the hosted studio, update the setup notes (Gemini through Antigravity), and run the square brief in each. | Owner with agent | Each client that H0 showed can write finishes the square brief, and the owner answers one question from the phone. |
| H6 | Optional: the drawing inside the chat as an MCP App. | Agent | In claude.ai the owner sees the live drawing in the conversation and answers a question there. |

## Risks

- **ChatGPT Plus may be read-only.** If so, ChatGPT can look and comment but not draw, and the ChatGPT plan draws through Codex instead. H0 settles it before any work depends on it.
- **Gemini keeps changing.** Its command-line route moved once this year. The studio depends only on MCP, so any Gemini client that speaks it can connect.
- **OAuth problems in the clients.** People have reported claude.ai connector sign-in bugs (see the sources). The sign-in tests run against the SDK's own client, and H0 tests the real ones early.
- **A public address.** Anything on the internet is probed. Every route needs sign-in, there is one allow-listed account, and there are no API keys on the server to steal.
- **Usage limits on $20 plans.** Pictures use a lot of them. Smaller default pictures help, and work is saved after every edit, so a stopped agent loses nothing.

## Sources

- Anthropic: [Build an MCP server for Claude](https://claude.com/docs/connectors/building) (transport, OAuth specs, callback URL, 240-second timeout, 150,000-character limit, MCP Apps), [Authentication for connectors](https://claude.com/docs/connectors/building/authentication), [Get started with MCP Apps](https://claude.com/docs/connectors/building/mcp-apps/getting-started), [custom connectors help article](https://support.claude.com/en/articles/11503834-building-custom-connectors-via-remote-mcp-servers), [reported OAuth callback issue](https://github.com/anthropics/claude-ai-mcp/issues/313).
- MCP: [authorization spec](https://modelcontextprotocol.io/specification/latest/basic/authorization), [client registration (CIMD preferred, DCR kept for compatibility)](https://modelcontextprotocol.io/specification/latest/basic/authorization/client-registration).
- OpenAI: [developer mode announcement, September 2025](https://x.com/OpenAIDevs/status/1965807401745207708), [Connect from ChatGPT](https://developers.openai.com/apps-sdk/deploy/connect-chatgpt), [a 2026 summary of the plan limits](https://coworker.ai/blog/chatgpt-mcp) (third party; the help article itself could not be fetched).
- Google: [Transitioning Gemini CLI to Antigravity CLI](https://developers.googleblog.com/an-important-update-transitioning-gemini-cli-to-antigravity-cli/), [Gemini CLI stopped serving individual accounts](https://github.com/google-gemini/gemini-cli/discussions/28017), [Antigravity MCP docs](https://antigravity.google/docs/mcp?tab=cli), [AI Pro limits in Antigravity](https://discuss.ai.google.dev/t/google-ai-pro-quota-on-antigravity-is-far-too-restrictive/144912), [Gemini app custom apps](https://zapier.com/blog/gemini-connectors/) (third party).
- Codex: [MCP in Codex](https://developers.openai.com/ja-JP/docs/extend/mcp), [Codex CLI OAuth and Streamable HTTP](https://codex.danielvaughan.com/2026/06/03/codex-cli-mcp-v0136-per-server-env-targeting-oauth-streamable-http-concurrent-tools/) (third party).
- Measured here: picture sizes from the running local studio on 16 October 2026 (construction 125 KB at 1,000 pixels, 84 KB at 700; wall 48 KB at 1,000).
