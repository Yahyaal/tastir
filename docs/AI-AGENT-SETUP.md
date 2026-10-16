# Try the local drawing assistant

The current implementation lives on `codex/ai-agent-navigation`, following the connection, editable-side, ruler-and-compass and repeat/color milestones. It connects a local companion to ChatGPT, sends an image of a real Tastir construction, highlights named objects, constructs ruler lines, compass circles and intersection points, draws editable straight sides between named points, repeats closed ink, colors its shape types, and opens real Tastir destinations. The owner connected ChatGPT, and a live image, highlighting and final-reply check passed on 15 October 2026.

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

## Repeat and color a drawing

On the default Eight-fold star and octagon construction, press **Use repeat and color request**, then **Send current view**. It asks for an inner square, an outer square and four connecting sides, then repeats the outer tile and colors the inner square blue and its surrounding quadrilaterals gold. Each tool edit is a separate Undo entry. Use Construction and Repeated wall to switch views; both can pan and zoom. The assistant can point at visible polygon copies on the wall.

Below the board, choose a preset palette with one click or use the visible color picker beside a shape name. A shape color affects every piece of that shape. A palette clears custom colors before applying its own colors. **Keep in My patterns → Open in editor → ▶ Play** preserves the named construction, finite ink, tile, expected pieces, palette and exact custom colors in the ordinary Tastir tutorial format.

A tile uses four distinct named corners of a parallelogram, or six corners of a convex centrally symmetric hexagon, in boundary order. The engine must support its rectangular period. Finite ink must stay inside that tile and close pieces that cover it exactly, without loose ends or slivers. Choosing a tile adds an outline; it does not ink its boundary for you. Editing sides clears their tile and colors as part of the same Undo entry; Undo restores both. Removing a construction point still used by the tile is rejected.

This step colors by shape type. Individual copies, rings, agent saving and full application screen capture remain later work. Showing Construction before sending a geometry request makes its named points available again. Save before switching construction or refreshing the page.

## Ask the assistant to take you somewhere

On the local companion, open the assistant workspace and press **Use navigation request**, then **Send current view**. You can also open **Open drawing assistant** from the library, Your work, a normal tutorial, the editor or drawing along. Ask for a place by name: “Open Your work”, “Show me the Star and cross wall”, “Watch the hexagon construction”, “Draw along with that pattern”, or “Open my last saved design”. The current destination list includes library wall/watch/draw-along routes and the latest 100 saved patterns and 100 saved designs. Only finished patterns offer a wall; drafts offer their editor.

The assistant waits for the destination to render and receives its current page context before finishing its reply. The side panel stays open as you browse. On connected ordinary pages, **Account and model** expands its connection and model choices. Close it with its button or Escape. On phones it sits in the lower half of the screen. **Return to the assistant workspace** brings back the same drawing, tile, colors and Undo history while this tab remains open. Keep in My patterns still saves to browser storage; navigating does not save or discard work for you.

The normal player's unsaved-design question remains in control. The assistant cannot choose Save, Stay or Leave without saving for you. Resolve that question and send the current view again. If you change a kept pattern in the normal editor, the assistant detects the different saved copy. **Keep as new pattern** preserves the workspace as a separate record and keeps the editor's changes.

On ordinary pages, this milestone supports questions and navigation. It sends a bounded excerpt of page text, destination titles, and the visible drawing SVG as a PNG when a board is available. Pages without a drawing send text only. It does not capture the whole tab or register normal-page pointing/editing targets. Use the workspace for geometry tools and pointing. Edits made in the normal editor do not automatically change the separate assistant workspace. Refreshing or changing the workspace's source construction still requires keeping your drawing first.

## What is tested

The automated tests cover PKCE and callback validation, signed identity verification, explicit plan consent, rotating refresh tokens, disconnect during refresh, protected account storage, loopback request pairing, completed streaming responses, late usage errors, browser tool acknowledgements, stale views and Stop.

Browser checks use simulated account and model responses. They send a real board PNG and check its pixels, exercise the real annotation UI, and verify canvas layers survive capture. They do not spend ChatGPT usage or establish live account eligibility. Desktop, tablet and phone checks run with `pnpm test:agent:browser`; the usual `pnpm check` also covers the existing application.

The capture supports construction SVG, embedded canvas layers and the repeated colored wall. Full-tab capture and finished Jali verification remain later work. The run budget is six model responses and two minutes, including time waiting for tool results. Stop or an error can leave a previously acknowledged annotation visible; Clear assistant highlight removes it.

The integration uses streaming requests with response storage disabled and app-defined highlighting, construction, segment-editing, tile and coloring tools. Public hosted distribution needs a separate availability review. [Inference contract](https://developers.openai.com/siwc/token-sharing-open-source/models-and-inference), [preview limitations](https://developers.openai.com/siwc/token-sharing-open-source/preview-limitations)

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


## Repeat and color verification on 15 October 2026

On `codex/ai-agent-repeat-color`, a live GPT-6.1-Sol request made exactly one edit_segments call for 12 sides, then set_tile for N–E–S–W, then paint_pattern for square #2453a6 and quadrilateral #dda83b, then completed its final response. All three successful mutations returned fresh observations and real PNGs. The UI displayed 12 sides, the repeated wall and both exact colors, with no page errors. [Actual live result, account masked](/__review/renders/agent-repeat-color/live-repeat.png).

The five repeat/color tests check exact area coverage, translated polygon placements, a hexagonal tile, rejected open and disconnected ink, malformed tiles, loose ends, invalid colors, Undo/Redo and a normal tutorial save/load round trip. The runtime's 30 tests cover fresh-observation requirements for all four mutation tools and the six-response limit. All 42 assistant browser checks passed on desktop, tablet and phone, followed by six targeted checks of manual palette/color edits, Undo, stale tile/color rejection and saved player colors after the last test additions. Pixel checks confirm that the captured wall contains both requested colors. The workspace pnpm test, pnpm lint, pnpm typecheck and pnpm build passed; production JavaScript excludes the local assistant tools and UI.

The responsive views use simulated provider responses: [phone](/__review/renders/agent-repeat-color/phone-simulated.png), [tablet](/__review/renders/agent-repeat-color/tablet-simulated.png), and [dark desktop](/__review/renders/agent-repeat-color/desktop-dark-simulated.png). They showed no page errors or horizontal overflow and displayed the real repeated wall. These layout checks are separate from the live account result above.


## Navigation verification on 15 October 2026

On `codex/ai-agent-navigation`, a live GPT-6.1-Sol request called edit_segments for the four sides jW–jN–jE–jS, then navigate for Your work. The destination rendered, and the runtime continued with its text-only page observation and completed the reply. A second request navigated back to the workspace, sent its real board PNG and completed the reply with the same four sides intact. One Undo removed the whole square. Both runs displayed the navigation success indicator, with no page errors. Actual views: [Your work](/__review/renders/agent-navigation/live-your-work.png), [return to the drawing, account masked](/__review/renders/agent-navigation/live-return.png).

All 57 assistant browser checks passed across desktop, tablet and phone. They cover real route transitions, returned tile/history state, saved editor/player destinations, stale and stopped navigation, normal unsaved-design guards and keeping an externally edited copy intact. The four navigation unit tests and runtime's 31 tests passed, including destination validation, deleted records, in-place saved-design addresses, fresh destination acknowledgements and text-only continuations. The workspace pnpm test, pnpm lint, pnpm typecheck and pnpm build passed. Production JavaScript excludes the assistant navigation UI and tool contract.

The selected production journey, browsing and layout suites initially produced 97 passed, one configured skip and one tablet filter-state failure. That filter check then passed three isolated repetitions; the complete browsing suite subsequently passed with 14 checks and one configured skip. The final compact-panel checks cover the six affected assistant flows on all three sizes; a concurrent test-output cleanup interrupted one tablet trace write, and that case passed its isolated rerun. These test-run issues are recorded separately from the successful live account flow.

Responsive pictures use simulated provider replies with the real app UI: [phone](/__review/renders/agent-navigation/phone-simulated.png), [tablet](/__review/renders/agent-navigation/tablet-simulated.png), and [dark desktop](/__review/renders/agent-navigation/desktop-dark-simulated.png). All three show the real tutorial wall, with no page errors or horizontal overflow. The phone panel fits within the lower 52% of the viewport and keeps its request controls above its internal scroll area.


## Ask for Undo or Redo

In the assistant workspace, ask “Undo the last edit” or “Redo the last edit.” These invoke the same drawing history as the buttons. Each construction, finite-side edit, tile choice or color batch is one step. Ask “Undo the last three edits” or “Redo all three edits” to travel multiple steps together. The assistant receives the available Undo/Redo counts and a fresh board image after a successful action. Requests beyond the available history fail without changing the drawing.

Undo/Redo apply to the assistant workspace, including its geometry, repeat tile and colors. They do not reverse navigation or edits made in a normal editor/player page. History can include manual changes; a new edit after Undo clears the Redo branch. If you mean a specific earlier edit rather than the latest batch, describe it explicitly.

On `codex/ai-agent-undo`, the owner’s screenshot showed the assistant honestly reporting that it had no Undo tool. The new travel_history tool closes that gap. A live GPT-6.1-Sol check drew a four-sided square, set its repeat tile and colored it #2453a6. A second request undid all three batches in one real history call and returned zero sides; a third request redid all three and restored the four sides and blue wall. Both calls returned current images and completed their final replies, with no page errors. Actual results, account masked: [Undo](/__review/renders/agent-undo/live-undo.png), [Redo](/__review/renders/agent-undo/live-redo.png).

Verification passed: the workspace pnpm test, pnpm lint, pnpm typecheck and pnpm build commands, plus all 69 assistant browser checks across desktop, tablet and phone. The new history cases cover restored tile/colors, a shared manual history, honest empty-history failure, stale observations and Stop. Unit checks cover atomic rejection of excessive or invalid step counts and clearing Redo after a new edit. The runtime requires a fresh image and changed same-document revision for a successful history action. Browser checks use simulated replies; the separately pictured live requests used the connected ChatGPT account.


## Edit ownership and fitting the construction

New workspace history entries include their author, request ID and label. Ask “Undo all your changes” to undo the consecutive assistant edits at the top of history. Assistant-only history travel checks every requested entry and refuses the entire action if it would cross a manual or unidentified edit. “Undo the last request” can use the shared request ID to identify its batches. An explicit request such as “Undo all changes” can include manual edits. Undo and Redo preserve these records; edits made before ownership tracking remain unidentified.

New construction geometry is framed automatically, including circles and points outside the original tutorial frame. The assistant can call fit_view to show Construction and fit the whole current drawing, even from the repeated wall. It then receives a fresh PNG and visible named points and can continue the original drawing request. This changes the view only, with no drawing history entry or document revision change. Assistant camera moves finish immediately so captured observations match the displayed board. These capabilities apply to the workspace; normal-page geometry adapters remain future work.

On `codex/ai-agent-history-context`, a live GPT-6.1-Sol request drew, repeated and colored a square. The exact request “Undo all your changes” undid its three edits directly, with no ownership clarification; Redo restored them. [Actual Undo result, account masked](/__review/renders/agent-history-context/live-undo.png). A subsequent Fit request in this combined check returned its tool call but did not complete within the browser’s 125-second wait. The exact cause was not established. An isolated live Fit check on a repeated wall then returned fit_view, switched to Construction, sent its fresh observation and completed the final reply in about eight seconds, without a code change. The repeat used simulated setup edits for this isolated check; Fit and its final reply used the real connected account. [Actual live Fit result, account masked](/__review/renders/agent-history-context/live-fit.png).

The six focused browser checks passed on desktop, tablet and phone, covering new geometry outside the original frame, a manually zoomed view, fitting then using its newly visible point, author tracking across requests, refusal to cross a manual edit, and an explicit Undo all changes. Unit coverage checks preserved request groups, Undo/Redo ownership, unknown older entries and atomic rejection. The runtime rejects a successful Fit acknowledgement unless it receives a fresh construction PNG of the unchanged document.

The complete assistant browser suite passed all 75 checks across desktop, tablet and phone after correcting two test locators (the object chooser lists offscreen points too, and the Remove button’s accessible name includes its side number). Workspace pnpm test, pnpm lint, pnpm typecheck and pnpm build passed.
