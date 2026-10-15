# Try the local drawing assistant

The first implementation lives on `codex/ai-agent-phase-0`. It connects a local companion to ChatGPT, sends an image of a real Tastir construction, and lets the model highlight a named object. The code and automated tests are separate from the live account check: that check still needs the owner to sign in and complete a request.

## Start it

From this checkout, run `pnpm install --frozen-lockfile`, then `pnpm dev:agent`. Open the address printed in the terminal, normally [the local assistant](http://127.0.0.1:4291/#/agent). Keep the terminal running. The public site and an ordinary `pnpm dev` server do not have this companion connection.

Choose a construction and select O, the center, or another named object. You can also click a point or line on the board. Pan, zoom and Fit use the same drawing component as the editor.

Press Continue with ChatGPT. In the browser sign-in window, choose the intended account and workspace and allow Tastir to use your ChatGPT plan. Return to Tastir when the callback says the account is connected. Cancel sign-in is available if you want to abandon the attempt.

The assistant should show Using ChatGPT plan and load the models available to that account. Identity sign-in by itself does not enable inference. The current official integration describes eligible Plus and Pro accounts; actual access must be verified with a completed request. [Official quickstart](https://developers.openai.com/siwc/quickstart)

## Complete the first live check

Keep O selected and send “Explain the selected object and point to it.” Sending includes your request, the current board PNG and the visible named geometry. The app shows the captured image under Board image sent with the last request.

A successful pointing test displays a turquoise annotation on the object. The browser reports that it displayed the mark, then the model completes its explanation. Only that completed sequence shows “Live check completed: image sent, highlight acknowledged, final response completed.” A populated model menu alone is not a successful check.

Changing the selection, theme, camera or board size while the model is preparing a pointer makes the old observation stale. The app rejects the old pointer and asks for a new view. Existing semantic annotations follow the camera. Stop cancels the current request and rejects late results. The annotation does not change construction geometry or ink.

This first version explains and highlights objects in this workspace. It does not yet create or color patterns, operate the other screens, capture the whole tab, or retain a conversation between separate requests. Those remain in the [implementation plan](AI-AGENT-PLAN.md).

## Accounts and local storage

The companion keeps its installation ID, account registrations and OAuth credentials under `~/.config/tastir/agent/`, or under `XDG_CONFIG_HOME/tastir/agent/` when that environment variable is set. The directory is owner-only and the account file is written atomically with owner-only permissions. Tokens never enter the frontend, browser storage, source control or application logs.

Saved account labels include a short registration identifier so two workspaces with the same email can be distinguished. Select a saved account to use its connection, Continue with ChatGPT to reconnect it, or Add account to make a separate registration. Disconnect clears the selected account's local tokens and attempts remote revocation. A failed revocation is reported; the account can also be disconnected in ChatGPT settings. The registration and installation ID are retained for reconnection. [Account lifecycle](https://developers.openai.com/siwc/token-sharing-open-source/profiles-and-sessions)

Manage usage opens ChatGPT's usage settings. Requests consume the existing plan allowance. Usage limits and inference failures are displayed without switching to API-key billing.

To choose another app port, set `TASTIR_AGENT_APP_PORT`, for example `TASTIR_AGENT_APP_PORT=4295 pnpm dev:agent`. `TASTIR_AGENT_DATA_DIR` can select a separate private account directory; keep it outside the checkout. The companion chooses an available loopback port automatically and pairs only with the app started by this command.

## What is tested

The automated tests cover PKCE and callback validation, signed identity verification, explicit plan consent, rotating refresh tokens, disconnect during refresh, protected account storage, loopback request pairing, completed streaming responses, late usage errors, browser tool acknowledgements, stale views and Stop.

Browser checks use simulated account and model responses. They send a real board PNG and check its pixels, exercise the real annotation UI, and verify canvas layers survive capture. They do not spend ChatGPT usage or establish live account eligibility. Desktop, tablet and phone checks run with `pnpm test:agent:browser`; the usual `pnpm check` also covers the existing application.

The capture currently supports construction SVG and embedded canvas layers. Full-tab capture and verification of the finished Jali and colored-wall views belong to the later visual integration phase. The run budget is three model responses and two minutes, including time waiting for tool results. Stop or an error can leave a previously acknowledged annotation visible; Clear assistant highlight removes it.

The official integration currently requires streaming requests with response storage disabled and supports the app-defined highlighting tool. Public hosted distribution needs a separate availability review. [Inference contract](https://developers.openai.com/siwc/token-sharing-open-source/models-and-inference), [preview limitations](https://developers.openai.com/siwc/token-sharing-open-source/preview-limitations)

## Verification on 15 October 2026

The full `pnpm check` passed: lint, TypeScript checks, unit tests, production build, and the existing application browser suite (151 passed, 17 skipped by its configuration). `pnpm test:agent:browser` passed all 15 checks across desktop, tablet and phone. After the final account-state fixes, the local runtime's 19 unit tests, lint, TypeScript checks and build passed again.

Manual browser checks found no page errors or horizontal overflow at 1280, 1024 and 390 pixels. The setup and review links opened correctly, and the production JavaScript excluded the local assistant UI. These are the signed-out workspace views: [desktop](/__review/renders/agent-phase-0/desktop.png), [tablet](/__review/renders/agent-phase-0/tablet.png), [phone](/__review/renders/agent-phase-0/phone.png), and [dark theme](/__review/renders/agent-phase-0/dark.png).

The live account check remains pending. At verification, the local companion had no connected ChatGPT account, and no inference was made using the owner's plan during these automated checks.
