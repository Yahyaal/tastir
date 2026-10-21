# ChatGPT connection and finished square — 21 October 2026

The owner followed [Connect your other apps](../STUDIO-CONNECT.md), connected ChatGPT, and created **Square check from ChatGPT**. This report records the failures, their causes, the fixes and what the checks establish. The original discovery fix was deployed in `c50f2df`; the project-discovery and preview fixes follow it.

## Issues and causes

| Issue seen by the owner | Cause and evidence | Correction |
| --- | --- | --- |
| No Advanced settings or Developer mode where the guide said to look | The guide made an outdated interface path a prerequisite. The current official connection guide starts in Plugins; account and workspace access still matter. | Replace the setup path with Plugins → + → Add custom MCP server, OAuth, Create as a plugin, install, then select it in a new chat. Date and link the official sources. Missing controls do not establish a broken Studio login or a need to upgrade. |
| Connection reported `MCP_ACTION_DISCOVERY_FAILED`, naming `construct` | The response explicitly said **“Authentication succeeded, action discovery failed.”** Login and token exchange completed; ChatGPT rejected the tool's serialized input schema. Its construction alternatives and homogeneous tuples were emitted in forms this client rejected. | Publish the eleven construction alternatives as `anyOf`, and `bisects`, `radiusFrom` and `meet` as arrays with exact length limits. Preserve item constraints, unknown-field rejection and atomic edit validation. Test the actual MCP `tools/list` response, rather than only the Zod inputs. |
| “Connector already exists,” with two entries visible | Repeated setup attempts left duplicate entries visible and two Studio grants. Whether ChatGPT retained a partial installation after failed discovery is **not established**; that is a possible explanation, not a confirmed internal cause. | Reuse an existing Tastir entry and refresh its tools. Do not repeat Add for a server already listed. Remove an unwanted duplicate only after identifying the working entry. The guide now separates an installation entry from a Studio authorization grant. |
| The prompt contained `<app name>` | A comparison-test placeholder was presented as text to paste without a concrete example. | The default prompt now says **Square check from ChatGPT**. Codex and Antigravity users replace ChatGPT with their app's name. The prompt explicitly asks to show the finished colored repeating wall. |
| The project opened by its exact link but was absent from Your work | The project was online, while Your work listed browser-local patterns and designs. The hosted homepage had no Studio link and could hide Your work when the local browser had no saves. | Add hosted homepage Studio navigation and always show Your work. Include online Studio projects there, with authenticated wall thumbnails and construction fallbacks. Signed-out visitors see a sign-in link. Local-only builds keep their existing behavior. |
| The chat card showed circles and lines, without the blue repeat | The card always requested a construction picture, even after the saved project had a tile and paint. | Render the repeating wall when a usable tile exists, label it **Finished wall · repeating tiles and colors**, and retain construction for unfinished or temporarily unplayable drawings. Continue fetching pictures only when the revision changes. |
| It was unclear how to see the finished result in Tastir | The shared editor's **Play** label did not explain that it opened the colored wall. The construction canvas itself does not display the finished repeat. | Rename the shared-project action **View finished wall** and explain the route in the connection guide. |
| The selected square was described as “not a tile” | A motif heuristic ran before checking whether the polygon was already the selected valid tile. | Give the selected tile's actual state precedence over the heuristic, and show its confirmation. |
| After refreshing, ChatGPT showed a blue repeat but the Studio link still showed an outlined square | Both screenshots show revision 5. The chat card now renders the finished wall, while `#/studio/<project>` opens the construction editor. These are two views of the same saved project. | Explain the distinction explicitly in the guide: use **View finished wall** at the top of the editor to open its colored repeat. A construction outline alone does not establish missing saved paint. |

## What was actually saved

The owner's original project was already correct at revision **5**. Its authored history contains creation, construction, ink, tile and paint from ChatGPT. The tile corners are A–N–W–S and its piece is painted `#2453a6`. The saved geometry renders as a blue square repeated across the wall. These were navigation and presentation failures; the fix does not reconstruct or overwrite the owner's project.

This distinction matters: inspecting the saved paint proved persistence, but did not prove that the owner could find the project or see the result through the app's normal controls.

## Verification

Heavy checks ran sequentially with bounded Node heaps. The first full workspace test run serialized Nx projects but still allowed multiple Vitest workers. Player and Studio had timeouts under memory pressure. The other six projects passed; rerunning the complete Player and Studio suites with one worker passed. The initial timeout run is not counted as a passing run.

| Check | Result |
| --- | --- |
| Full workspace `pnpm test`, followed by `pnpm exec nx run-many -t test --projects=player,studio --parallel=1 --maxWorkers=1` | All projects passed across these runs; Player: 752 passed, 1 skipped; Studio: 55 passed |
| `pnpm lint --parallel=1` | All eight projects passed |
| `pnpm typecheck --parallel=1` | All eight projects and their build dependencies passed |
| Chat card browser checks, desktop and phone | 4 passed: live updates/questions and the finished blue-square card |
| Focused hosted browser checks, desktop and phone | 4 passed: visitor sign-in route and homepage → Your work → saved project → View finished wall |
| Packaged server build, `node tools/studio-build.mjs` | Passed |
| Notes/review checks after adding the incident report to the app | 14 passed, 1 skipped; affected-file lint and Player typecheck passed |
| Fresh production browser checks, desktop and phone | Passed: homepage navigation, online project discovery, selected tile confirmation, main blue repeating wall, no horizontal overflow, original saved revision still 5 |
| Authenticated production MCP and card snapshot | Passed: initialization, discovery of 23 compatible tool schemas, eleven construction alternatives, and the existing project's finished wall; temporary diagnostic credentials removed |

The hosted check scopes its blue-fill assertion to the **main repeating wall**, checks the SVG repeat definition, confirms the saved project is still revision 5, and checks horizontal overflow on desktop and phone. A blue swatch or a small style-preview thumbnail cannot satisfy the assertion. The card regression compares the returned picture with the real wall-rendering endpoint.

Production deployment and fresh-browser verification are recorded in the [Studio log](../STUDIO-LOG.md). Vercel subsequently confirmed deployment of `b4ad5fe`, including the implementation in `2eebe50`; the production UI and card checks above passed against it. The owner's refreshed screenshots also show the updated card and editor. Notes are intentionally available only on the local dev server; the production verification probe was corrected to exclude that route. These checks do not complete H6's remaining clients, phone question, deployed timing or week of usage measurements, or H8's owner-answer acceptance check.

## Lessons to carry forward

1. **Diagnose the failing stage.** Missing UI controls, OAuth, installation, tool discovery, tool execution and result display are separate stages. Preserve the exact error before changing login settings.
2. **Verify client compatibility at the wire.** Acceptance by the MCP SDK and shared schema does not establish acceptance by every client. Exercise serialized discovery and malformed input rejection together.
3. **Test from the homepage in a fresh browser.** A working deep link and correct database row miss navigation gaps. Check signed-out and signed-in states, desktop and phone, and the actual final view the prompt promises.
4. **Make the saved result visible.** The preview, caption and primary action should describe the current result. Authoritative selected state must take precedence over a heuristic warning.
5. **Keep online and browser-local saves understandable.** Both belong under Your work, with clear ownership and sign-in behavior; local counts must not imply that online projects are absent.
6. **Use a complete fixture for a completed result.** Copying a tutorial's construction does not necessarily supply ink, a tile or paint. The browser fixture now performs the real construct → ink → tile → paint commands.
7. **Limit test workers explicitly.** Nx `--parallel=1` serializes projects, not Vitest forks. Use `--maxWorkers=1` as well, keep heaps bounded, and do not overlap browser suites, tests and builds. Resource-driven timeouts are not a reason to loosen product checks or increase unrelated timeouts.
8. **Record uncertainty and remaining acceptance work.** Duplicate connector entries were observed; the client's internal retention behavior was not. A successful server check is not evidence that every chat host refreshed an existing card or that all H6/H8 criteria passed.
9. **Separate pushed, deployed and verified.** A successful Git push does not establish that Vercel started or completed a build. An empty provider-status list is not a running-build signal. Check the provider result and the served application, then record fresh-browser evidence before calling a UI fix live. [Vercel's Git deployment documentation](https://vercel.com/docs/git/vercel-for-github) describes the automatic trigger; the initial delay here remains unexplained, even though deployment subsequently succeeded.
10. **Compare the same view as well as the same revision.** A finished preview and a construction editor can look different with identical saved data. Name the view and its action explicitly when explaining what the owner should see.

## Source record

The corrected setup instructions were checked on 21 October 2026 against OpenAI's [connection guide](https://developers.openai.com/plugins/deploy/connect-chatgpt), [authentication guide](https://developers.openai.com/plugins/build/auth), and [plugin installation guide](https://learn.chatgpt.com/docs/plugins). The owner's screenshots and error report supplied the observed failures; saved Studio history, actual MCP responses, rendered pictures and browser checks supplied the implementation evidence.
