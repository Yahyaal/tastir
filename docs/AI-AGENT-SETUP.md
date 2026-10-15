# Try the local drawing assistant

The current implementation lives on `codex/ai-agent-construction`, following the connection and editable-side milestones. It connects a local companion to ChatGPT, sends an image of a real Tastir construction, highlights named objects, constructs ruler lines, compass circles and intersection points, and draws editable straight sides between named points. The owner connected ChatGPT, and a live image, highlighting and final-reply check passed on 15 October 2026.

## Start it

From this checkout, run `pnpm install --frozen-lockfile`, then `pnpm dev:agent`. Open the address printed in the terminal, normally [the local assistant](http://127.0.0.1:4291/#/agent). Keep the terminal running. The public site and an ordinary `pnpm dev` server do not have this companion connection.

Choose a construction and select O, the center, or another named object. You can also click a point or line on the board. Pan, zoom and Fit use the same drawing component as the editor.

Press Continue with ChatGPT. In the browser sign-in window, choose the intended account and workspace and allow Tastir to use your ChatGPT plan. Return to Tastir when the callback says the account is connected. Cancel sign-in is available if you want to abandon the attempt.

The assistant should show Using ChatGPT plan and load the models available to that account. Identity sign-in by itself does not enable inference. The current official integration describes eligible Plus and Pro accounts; actual access must be verified with a completed request. [Official quickstart](https://developers.openai.com/siwc/quickstart)

## Complete the first live check

Keep O selected and send “Explain the selected object and point to it.” Sending includes your request, the current board PNG and the visible named geometry. The app shows the captured image under Board image sent with the last request.

A successful pointing test displays a turquoise annotation on the object. The browser reports that it displayed the mark, then the model completes its explanation. Only that completed sequence shows “Live check completed: image sent, highlight acknowledged, final response completed.” A populated model menu alone is not a successful check.

Changing the selection, theme, camera or board size while the model is preparing a pointer makes the old observation stale. The app rejects the old pointer and asks for a new view. Existing semantic annotations follow the camera. Stop cancels the current request and rejects late results. The annotation does not change construction geometry or ink.

## Draw the square

Choose Eight-fold star and octagon, press Use square request, then Send current view. You can instead type “Draw the square jW, jN, jE, jS.” The assistant can add finite sides between existing named points and remove sides it previously added. All four sides belong in one edit, so Undo drawing edit removes the whole square and Redo drawing edit restores it.

The Your drawing panel lists each side. Change either endpoint with its point selector, or remove that side. These controls use the same validation and history as the assistant. Invalid edits apply no changes. Undo and Redo stop a pending model request first, and document revisions always advance, including when undoing, so an old reply cannot edit a restored version.

After a model edit, the browser waits for the drawing to render, captures a fresh image and sends it with the tool result and the updated named segments. The model then completes its reply. The success message is “Drawing updated: edits displayed, current image sent, final response completed.” Stop after an applied edit leaves it visible; Undo removes it.

Keep in My patterns saves an editable copy in this browser, using Tastir's existing construction steps and ink paths. Open in editor opens that copy with its source credit. Keep again updates the same copy. Workspace edits and Undo history last only while this construction stays open, so keep changes before leaving or refreshing. The workspace allows 128 sides, 32 additions per edit and the last 50 edits in Undo history.

The assistant still cannot color patterns, choose a repeating tile, operate other screens, capture the whole tab, or retain a conversation between separate requests. Those remain in the [implementation plan](AI-AGENT-PLAN.md). Drawing can currently use only named points in the current observation; use Fit if a needed point is outside the view.

## Construct from O and A

Choose Start from O and A in Construction, then Use compass request and Send current view. This starts with only the given centre O and the unit point A. The sample asks for circle C0 about O through A, circle C1 about A through O, their upper intersection Top and lower intersection Bottom, and the ruler line Axis through those new points.

You can append “Finally add one finite side from Top to Bottom” to exercise construction and inking in one request, or ask for that side afterward. The model receives a new image and named geometry after each edit, so later calls can reference the new points. Lines extend across the drawing; finite sides are the darker ink between named endpoints. Fit frames the current construction if it grows outside the view.

Construction batches contain up to 16 ordered operations and the workspace holds up to 128 added construction elements. A line references two named points; a circle references its centre and a point on its circumference. A new point references two earlier curves. For multiple crossings, the model must give an explicit angle rule about O; otherwise an ambiguous crossing rejects the whole batch. New geometry has unique names and never uses raw coordinates. Missing references, coincident endpoints, zero-radius circles and impossible intersections also reject the whole batch.

The New construction list describes each new element. Select finds it in the object selector; Remove deletes it only if the remaining construction and ink still work. Undo and Redo cover both construction and sides in order. A construction-only draft can be kept before drawing any finite sides. Keep in My patterns preserves every construction dependency; a blank-start draft has no copied-library credit. Workspace changes still need keeping before leaving or refreshing.

## Accounts and local storage

The companion keeps its installation ID, account registrations and OAuth credentials under `~/.config/tastir/agent/`, or under `XDG_CONFIG_HOME/tastir/agent/` when that environment variable is set. The directory is owner-only and the account file is written atomically with owner-only permissions. Tokens never enter the frontend, browser storage, source control or application logs.

Saved account labels include a short registration identifier so two workspaces with the same email can be distinguished. Select a saved account to use its connection, Continue with ChatGPT to reconnect it, or Add account to make a separate registration. Disconnect clears the selected account's local tokens and attempts remote revocation. A failed revocation is reported; the account can also be disconnected in ChatGPT settings. The registration and installation ID are retained for reconnection. [Account lifecycle](https://developers.openai.com/siwc/token-sharing-open-source/profiles-and-sessions)

Manage usage opens ChatGPT's usage settings. Requests consume the existing plan allowance. Usage limits and inference failures are displayed without switching to API-key billing.

To choose another app port, set `TASTIR_AGENT_APP_PORT`, for example `TASTIR_AGENT_APP_PORT=4295 pnpm dev:agent`. `TASTIR_AGENT_DATA_DIR` can select a separate private account directory; keep it outside the checkout. The companion chooses an available loopback port automatically and pairs only with the app started by this command.

## What is tested

The automated tests cover PKCE and callback validation, signed identity verification, explicit plan consent, rotating refresh tokens, disconnect during refresh, protected account storage, loopback request pairing, completed streaming responses, late usage errors, browser tool acknowledgements, stale views and Stop.

Browser checks use simulated account and model responses. They send a real board PNG and check its pixels, exercise the real annotation UI, and verify canvas layers survive capture. They do not spend ChatGPT usage or establish live account eligibility. Desktop, tablet and phone checks run with `pnpm test:agent:browser`; the usual `pnpm check` also covers the existing application.

The capture currently supports construction SVG and embedded canvas layers. Full-tab capture and verification of the finished Jali and colored-wall views belong to the later visual integration phase. The run budget is three model responses and two minutes, including time waiting for tool results. Stop or an error can leave a previously acknowledged annotation visible; Clear assistant highlight removes it.

The integration uses streaming requests with response storage disabled and app-defined highlighting and segment-editing tools. Public hosted distribution needs a separate availability review. [Inference contract](https://developers.openai.com/siwc/token-sharing-open-source/models-and-inference), [preview limitations](https://developers.openai.com/siwc/token-sharing-open-source/preview-limitations)

## Verification on 15 October 2026

The full `pnpm check` passed: lint, TypeScript checks, unit tests, production build, and the existing application browser suite (151 passed, 17 skipped by its configuration). `pnpm test:agent:browser` passed all 15 checks across desktop, tablet and phone. After the final account-state fixes, the local runtime's 19 unit tests, lint, TypeScript checks and build passed again.

Manual browser checks found no page errors or horizontal overflow at 1280, 1024 and 390 pixels. The setup and review links opened correctly, and the production JavaScript excluded the local assistant UI. These are the signed-out workspace views: [desktop](/__review/renders/agent-phase-0/desktop.png), [tablet](/__review/renders/agent-phase-0/tablet.png), [phone](/__review/renders/agent-phase-0/phone.png), and [dark theme](/__review/renders/agent-phase-0/dark.png).

The owner's first live request exposed two assumptions in the stream reader. The HTTP 200 response omitted Content-Type, and its terminal response had an empty output array even though finalized item events contained the tool call. The reader now accepts a missing header, preserves finalized items in output order, and releases them only after a valid response.completed event. Explicitly incompatible content types, gaps in item order, interrupted streams and late failures still reject the response. Opaque continuation fields remain intact. [Official streaming events](https://developers.openai.com/api/reference/resources/responses/streaming-events).

After this fix, a live request using the connected account and GPT-6.1-Sol sent the board PNG with O selected, returned one highlighting call, displayed a turquoise ring at O, acknowledged it to the model and received the final completed explanation. The UI displayed the full live-check success message. [See the live result, with the saved account masked](/__review/renders/agent-phase-0/live-fixed.png). This establishes the first account-specific round trip; it does not establish reliability across other models or later creation features.

The fix passed all 25 local runtime tests, including regression coverage for both live response differences, preserved continuation data, duplicate prevention and incomplete streams. The workspace's pnpm test, pnpm lint and pnpm typecheck passed. All 15 assistant browser checks also passed. Automated tests use simulated responses; the live test above used the owner's connected plan.


## Editable drawing verification on 15 October 2026

On `codex/ai-agent-drawing`, a live GPT-6.1-Sol request drew jW–jN–jE–jS with one edit_segments call. The browser displayed four finite sides, returned the current PNG and revised observation, and received “Drew the square jW–jN–jE–jS with all four sides.” The full drawing-success indicator appeared. One Undo left zero sides; Redo restored four. [Live result, account masked](/__review/renders/agent-drawing/live-square.png).

The four geometry tests check equal side lengths, right angles, closure, atomic rejection, manual replacement, Undo/Redo revisions and a valid editor draft with four engine ink strokes. The local runtime's 26 tests cover tool continuation with the required fresh same-document observation. The 24 assistant browser checks passed across desktop, tablet and phone, including manual editing, saving and reopening an editor copy, stale observations and Stop. The workspace pnpm test, pnpm lint and pnpm typecheck passed.

Responsive views use simulated model responses: [phone](/__review/renders/agent-drawing/phone-simulated.png), [tablet](/__review/renders/agent-drawing/tablet-simulated.png), and [dark desktop](/__review/renders/agent-drawing/desktop-dark-simulated.png). They are layout checks; the separately labeled live result above proves the connected-account drawing round trip.


## Ruler and compass verification on 15 October 2026

On `codex/ai-agent-construction`, a live GPT-6.1-Sol request started from O and A, created the two circles, Top, Bottom and Axis in one construct call, then used Top and Bottom in an edit_segments call. Both successful edits sent fresh images and observations before the next model response. The final explanation completed with five construction elements and one finite side visible. The first Undo removed only the side; the second removed the whole construction batch. Two Redos restored both. [Actual live result, account masked](/__review/renders/agent-construction/live-construction.png).

All eight drawing and construction geometry tests passed, including exact intersection locations, atomic rejection, named dependencies, saved drafts and history. The runtime now tests fresh-observation requirements for both construction and finite-side tools. All 36 assistant browser checks passed across desktop, tablet and phone; they cover a construction-to-ink continuation, saved editor copies, blocked dependent deletion, ambiguous crossings, stale observations and Stop. The workspace pnpm test, pnpm lint and pnpm typecheck passed.

Responsive screenshots use simulated responses: [phone](/__review/renders/agent-construction/phone-simulated.png), [tablet](/__review/renders/agent-construction/tablet-simulated.png), and [dark desktop](/__review/renders/agent-construction/dark-desktop-simulated.png). They showed no horizontal overflow or page errors. These layout checks are separate from the live request above.
