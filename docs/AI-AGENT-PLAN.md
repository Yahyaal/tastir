# AI agent for Tastir

Detailed implementation plan, 15 October 2026. The owner wants an agent that answers questions, navigates Tastir, draws and colors its own patterns from instructions, sees the current view, and points things out on screen. The Phase 0 connection workspace is implemented on `codex/ai-agent-phase-0`; its first live account check passed after fixing the stream reader. [Try the local assistant](AI-AGENT-SETUP.md). The first editable-segment milestone is implemented on `codex/ai-agent-drawing`; the ruler-and-compass milestone on `codex/ai-agent-construction` now also creates new geometry from O and A. The repeat-and-color milestone on `codex/ai-agent-repeat-color` adds checked four- or six-corner tiles, the existing infinite wall, shape colors, palette selection and normal playable saves. Each batch has Undo and sends a fresh view after success. Navigation is added on `codex/ai-agent-navigation`: a persistent workspace and a companion panel open real app destinations, respect unsaved changes and confirm rendered page context. Regular pages now support questions, navigation and pointing at registered visible geometry and controls on codex/ai-agent-screen-pointing. Geometry edits remain in the workspace. Individual-piece and ring coloring, broader construction tools, normal-page edit adapters and automatic saving below remain planned work.

## The experience we are building

You open an Assistant beside the drawing and say: “Make an eight-pointed star pattern with smaller stars between the large ones. Use dark blue, turquoise and ivory. Show me how you built it.” The agent creates an editable construction, inks the chosen lines, forms a repeating tile, colors the pieces, and shows the wall. You can watch its construction play one step at a time, take over with ordinary tools, and ask for another version.

You then say: “Make this ring turquoise, leave the center blue, and show me where the tile repeats.” The agent reads your selection and current view, changes the intended ring, and outlines the repeating tile with a labeled pointer. “Undo that” restores the previous colors and geometry together when both belonged to its change.

The output is an ordinary Tastir pattern, using existing formats for construction, ink, colors, playback, saving and sharing. The agent creates new arrangements within supported construction rules. It cannot promise every imaginable design or prove that a pattern has never been drawn before.

Start with a personal local version using your ChatGPT plan. Keep Tastir's themes, visible color swatches, and drawing-first phone layout.

## Foundations and gaps in the current app

| Existing part | How we will use it |
| --- | --- |
| `editor/document.ts` | Create empty drafts, add or change steps, and report broken references. |
| `editor/tools.ts` and `editor/blocks.ts` | Use compass, ruler, intersections, symmetry and reusable blocks. Blocks expand into editable steps. |
| `editor/finish.ts` | Choose a tile, select ink paths, and turn a finished draft into a playable tutorial. |
| `app/coloring.ts`, `app/rings.ts` and `app/placement.ts` | Identify rings, shapes and individual repeated pieces, and apply colors through the current model. |
| `app/model.ts`, `app/workerClient.ts` and the engine | Evaluate constructions and find pieces away from the interface thread. |
| `app/camera.ts`, `app/useCamera.ts` and drawing components | Locate targets in the visible drawing after zooming or panning. |
| `editor/patterns.ts`, `app/designs.ts`, saving and sharing | Preserve editable constructions and colored designs, and reopen or export them. |
| Editor, draw-along and coloring history | Extend separate undo behavior into an operation covering a complete agent request. |

These are functions inside separate screens, rather than a shared agent interface. A saved construction and a colored design currently live in different records. Construction, ink, repeat and color also have separate state and histories. Coordinated saving and undo are implementation work, not capabilities we can assume already exist.

## ChatGPT connection

Use the official Sign in with ChatGPT flow. Eligible Plus and Pro users can grant permission to use their plan separately from identity sign-in. Verify that your actual account can complete requests before building the full feature. [Official quickstart](https://developers.openai.com/siwc/quickstart)

The documented path covers open-source and locally hosted apps. Paid or remotely hosted apps require the partner route. Tastir currently declares `UNLICENSED`; a visible repository would not by itself establish an open-source license. The personal local prototype does not depend on changing that license. Review public distribution separately. [Plan usage overview](https://developers.openai.com/siwc/token-sharing-open-source)

The current preview accepts suitable image inputs and app-defined function/custom tools. Native computer use and image generation are unavailable on this route. Drawing and pointing will be implemented by Tastir, using its geometry. Voice is later work because this flow also excludes audio input. [Preview limitations](https://developers.openai.com/siwc/token-sharing-open-source/preview-limitations)

Call the public Responses API with streaming enabled and response storage disabled. Keep conversation context locally and check terminal stream events. Discover account-specific model choices rather than hard-coding a model; a catalog entry alone does not prove inference access. [Models and inference](https://developers.openai.com/siwc/token-sharing-open-source/models-and-inference)

## Architecture

The flow is: your request reaches the local agent; the agent asks Tastir for current state and an image; it proposes tool actions; Tastir checks and executes them; the agent reads results and inspects the drawing again.

The React app owns the live document, selection, navigation and visible changes. A local Node companion owns authentication, model requests and the agent loop. They exchange typed messages through a paired local session. In development, use a same-origin proxy. A packaged local version can have the companion serve the built app on loopback.

Bind the companion to loopback, validate browser origin and host, and require a session credential. Another website must not be able to consume your plan through this process. Give the model only Tastir's approved tools. Drawing a pattern does not require terminal access, filesystem access or arbitrary script execution.

Use OAuth Authorization Code with PKCE, a stable installation identifier and the required loopback callback. Validate returned identity and granted plan permissions, and retain the issued registration for later sign-ins. Adapt the official local example where suitable. [Registration and sign-in](https://developers.openai.com/siwc/token-sharing-open-source/sign-in), [official integration example](https://developers.openai.com/cookbook/articles/sign-in-with-chatgpt)

Keep OpenAI tokens in protected runtime storage outside the repository and browser storage. Serialize refresh and store replacement credentials together. The browser receives connection status, never OpenAI tokens. Show the connected account, “Using ChatGPT plan,” a Manage usage link, and Disconnect. Usage-limit failures stop the run while preserving completed work. [Accounts and sessions](https://developers.openai.com/siwc/token-sharing-open-source/profiles-and-sessions)

## Seeing what you see

Give the agent both structured state and images. State identifies geometry exactly; images show how the visible result looks.

The structured snapshot includes route, document ID, visible stage and step, selection, visible elements, tile, ink, piece and ring identifiers, effective colors, camera, helper visibility, open panels and available controls. Start with a compact outline and fetch details on demand. Distinguish an element existing in the document from one visible at the current step.

Each observation carries a document revision, view revision and snapshot ID. Images and target positions must come from the same settled render. Edits refer to those revisions so Tastir can reject stale actions and ask the agent to observe again.

First capture the visible board from its actual SVG and bitmap layers, including its current camera, colors and style. Verify raster ink, Jali textures and theme styling during the feasibility work. Pair the image with the interface's visible semantic controls and positions. Label a board image accurately; it is not a screenshot of the whole tab.

For a pixel-accurate view of the entire Tastir tab, add optional browser tab capture. The browser requires the person to choose the tab. Test support on the intended browser in Phase 0. Once connected, take frames when needed and after significant actions rather than continuously sending video. Show visual connection status and allow it to be paused. Where tab capture is unavailable, keep the board image and structured interface view and explain that narrower capability.

Wait for animations and rendering to settle before capture. Avoid the agent's own pointer obscuring its next observation. Refresh coordinate observations after scroll, resize, camera movement or panel changes. Tell the owner when connecting visual context that request images and state are sent to OpenAI. Keep private research pages outside normal context unless the owner deliberately includes them.

## Pointing and understanding “this”

Add a separate annotation layer. The agent can ring a point, trace a line or piece, outline a ring or tile, or place an arrow and short label beside a control. Marks disappear when dismissed or their target becomes invalid. They never become construction geometry or ink and do not intercept drawing clicks.

Prefer named targets: a construction reference, ring ID, piece plus repeated-tile address, or stable control ID. Resolve their current screen positions inside Tastir so pointers follow zoom and pan. A repeated piece needs its tile address because the same base piece appears many times on the wall.

For an unnamed detail, accept a normalized image position or region tied to its snapshot and crop dimensions. Tastir handles scaling, SVG transforms and the inverted drawing Y axis. Reject image coordinates after their snapshot becomes stale.

Let you click a piece or select a region before asking a question. Send the selection, nearby named geometry and an image crop so “this star” is meaningful. If several targets remain possible, highlight candidates and ask a short question. Accompany pointing with text, support keyboard access and respect reduced motion.

If a target is outside the view, identify where it is. A navigation or “show me” request may bring it into view. An ordinary explanation should not unexpectedly move the board.

## The agent's tools

Expose a small versioned interface. Every mutating call includes document ID, base revision, request ID and operation ID. Validate payloads and targets before execution. A repeated operation ID returns the previous outcome instead of applying the change twice.

| Group | Proposed tools and behavior |
| --- | --- |
| Observe | `get_view`, `inspect_document`, `inspect_selection`, `capture_view` return actual state and snapshot IDs. |
| Navigate | `search_patterns`, `open_pattern`, `go_to_stage`, `go_to_step`, `fit_view` use existing routes and unsaved-work handling. |
| Point | `highlight_target`, `point_to`, `clear_annotations` report whether the intended target was found. |
| Construct | `create_draft`, `apply_steps`, `insert_block`, `change_steps` build scratch geometry from supported elements and references. |
| Ink and repeat | `inspect_ink`, `set_ink_paths`, `set_tile`, `preview_repeat` resolve segments and neighboring tiles. |
| Color | `inspect_color_targets`, `set_palette`, `paint_targets`, `set_coloring_method` use the same rules as visible controls. |
| Verify | `validate_draft`, `render_preview` return diagnostics, counts and real rendered previews. |
| Finish | `commit_changes`, `undo_operation`, `redo_operation`, `save_work`, `export_work` return actual outcomes. |

These names describe the proposed contract, not functions already implemented. Expose their schemas in the supported function-tool format and verify tool-result continuation in Phase 0.

Use useful batches such as adding one construction step instead of simulated mouse clicks. Errors name the failing step and references, with valid choices where practical. Never execute unfinished streamed arguments. Accept planned mutations after the response completes successfully, then validate and journal each operation before execution.

## Drawing original patterns

Turn a request into explicit goals: symmetry, main motif, arrangement, repeat, colors and features to preserve. State the interpretation briefly and proceed when clear. Ask only when ambiguity materially changes the result.

Begin a new construction from the editor's empty draft with O and A. Use named intersections, circles, ruler lines, polygons and supported symmetry. Blocks provide useful operations, but the finished feature must also combine primitive steps and vary inking to make new arrangements. Copying tutorials cannot be the only generation strategy.

Keep definitions within the current tutorial rules. Coordinates can describe pointers and diagnostics; they cannot be smuggled into tutorial geometry. Explain an unsupported construction instead of presenting an arbitrary vector drawing as a ruler-and-compass tutorial.

Work in a scratch draft, evaluate batches, inspect the construction, and ink its intended segments. Choose a tile from constructed geometry, find closed pieces and render neighboring repeats so seams and corners can be checked. A faint preview can show progress on the main board while the existing design stays recoverable. The completed pattern must open in the ordinary editor and play in the ordinary player.

Start with a reliable eight-fold original, then six- and twelve-fold examples and combinations within supported operations. Difficult mixed-symmetry walls and historical reconstructions come later. Label new work as the owner's AI-assisted design, preserve credits for reused sources, and avoid claiming a verified monument match without evidence.

## Coloring and refinement

Read effective colors after palette, ring, shape and placement rules are applied. Resolve whether “make this blue” means one placed piece, a shape family, a ring or all matching rosettes. Use the selection and wording to determine scope.

Support instructions such as “alternate blue and green rosettes,” “leave the center white,” and “use warmer colors but keep the black outlines.” Show swatches and scope beside the change. If a request cannot fit the current coloring model, explain that before broadening its effect.

After geometry changes, recompute piece and ring addresses. Preserve colors only when identities still match. Ambiguous remapping returns to inspection; a stale piece index must not recolor a different shape.

Coordinate the construction and colored-design records when saving. Verify reopening, pattern-file export and share-link import preserve geometry, ink, repeat, coloring method, colors and supported appearance. Report storage refusal rather than claiming success.

## Working together and undo

A clear request authorizes its drawing, coloring and navigation actions. The agent should not ask permission for every line. New patterns become separate saved items by default. Changes to an existing pattern affect the requested parts and create a recoverable checkpoint.

Treat one user request as one visible operation group across geometry, ink and color. Keep a journal containing before and after state, tool results and persistence outcomes. If a two-record save partly succeeds, recover or roll back to consistency and report the outcome. Claim a completed save only after verification.

Advance the document revision on human edits. An agent action based on an older revision cannot overwrite newer work. Observe again and continue from the new drawing where intent remains clear; resolve overlapping changes explicitly. Scope each run to its tab and document so late replies cannot affect a different project.

Provide Stop throughout the run. Cancel requests and pending work, invalidate late responses and leave a valid checkpoint. Undo an agent operation without removing later independent human edits; reject an unsafe undo and offer an identified earlier version instead. Redo requires a matching starting state.

## Verification and repair

Schema parsing is the first check. Evaluate references and steps, verify finite geometry, check ink follows its construction, find closed pieces, and inspect tile coverage and seams. Add diagnostics for loose ends, overlaps, unexpected gaps and slivers where current functions do not expose them. Check the requested symmetry, motif counts and color constraints when defined.

Reuse `firstFailingStep`, `strokesOffConstruction`, `strokesOffCrossings` and `hasSymmetry` as appropriate. A construction draft can be valid but unfinished; a completed repeating pattern must pass its finishing checks. Intentional irregularity needs declared constraints instead of a universal symmetry requirement.

The editor already derives an `expect` block from finished geometry. This is a baseline, not independent proof of correctness. Check separate geometric invariants, the user's constraints and rendered results. Historical accuracy requires source evidence and review.

Have the agent inspect construction, tile and wall previews, then repair its scratch draft from precise diagnostics. Begin with a provisional maximum of three repairs and a runtime-enforced wall-clock/run budget; tune these from measurements. Current endpoint limits mean the runtime must enforce budgets rather than assuming all ordinary request limit fields are supported. On exhaustion, preserve the best valid draft and identify the remaining problem.

## The Assistant panel

On desktop, place the conversation alongside the board. Include a composer, connection status, visible color swatches and a compact activity line: Drawing, Inking, Coloring or Checking. Explain actions and outcomes in ordinary language. Make Stop and Undo the latest change easy to reach.

Reserve panel space once when it opens. Streaming text and annotations must not repeatedly move or resize the board. Preserve the camera unless the requested action needs another view. On a phone, use a collapsible sheet while keeping the drawing visible and controls reachable. Review both themes and the existing drawing-first layout requirements.

Offer “Explain this step,” “Make a new pattern,” “Change these colors” and “Show the repeat” as starting prompts, with free instructions always available. Manual drawing remains available and is observed at the next agent snapshot.

## Build sequence

Each phase produces a reviewable result. Phase 0 resolves external uncertainties; Phase 6 completes the requested local agent.

| Phase | Work | Completion evidence |
| --- | --- | --- |
| 0. Prove sign-in, vision and tools | Build minimal local authentication and request handling. Test your account's model access, image input, function call and result continuation, refresh, and capture behavior. | A real completed plan-backed request identifies a selected visible shape and calls a highlighting tool. Record supported behavior. If access fails, report the exact blocker before expanding the build. |
| 1. Share app state and commands | Add snapshots, revisions, operation IDs, scratch drafts and coordinated history. Adapt existing state without replacing the engine. | Deterministic commands create, ink, color, navigate, undo and reopen a fixture. Stale and duplicated commands cannot corrupt it. |
| 2. See and point | Add capture, selection context, registered geometry and controls, and annotations. | Point at the correct piece, tile edge and control after pan, zoom, scroll and resize; refresh stale observations. |
| 3. Draw an original | Connect primitive steps, blocks, inking, tile choice and diagnostics to the agent loop. | Create an eight-fold pattern from an empty draft and show a clean repeat. It plays and remains manually editable. |
| 4. Color and save | Add ring, shape and placed-piece coloring, coordinated save and portable output. | Follow a multi-color request, recolor just one selected ring, reload and round-trip through export and share import. Undo restores the last request. |
| 5. Repair and collaborate | Add visual inspection, bounded repair, Stop, reconnection, conflict recovery and six- and twelve-fold generation. | Repair invalid candidates or clearly preserve them as unfinished. Stop works during inference and geometry processing; human edits survive. |
| 6. Finish the local experience | Polish desktop and phone behavior, accounts, usage states, accessibility, startup and recovery. Run the acceptance suite. | A documented startup flow supports a full create, color, point, refine and save session. Required checks pass and the owner reviews results. |
| 7. Choose public distribution | Recheck partner access and current requirements for a hosted service or packaged local app. | Confirm eligibility and validate a separately reviewed distribution route end to end. |

Phase 0 is a capability test, not the finished product. The complete local release includes original drawing, coloring, seeing and pointing.

**First drawing milestone (15 October).** After confirming the connection, the owner approved drawing jW–jN–jE–jS as four editable sides. `codex/ai-agent-drawing` adds a bounded segment-editing command, shared manual editing and Undo/Redo, fresh images after mutations and saving a copy through the existing editor format. This is a first part of the command and drawing phases: it uses existing named points, and does not yet create new points, circles, complete original patterns or color them. One requested square is one undoable edit.

**Ruler-and-compass milestone (15 October).** `codex/ai-agent-construction` starts from O and A or extends a library construction. A bounded ordered batch creates named lines, circles and chosen intersections through the existing editor and engine; subsequent model calls can use those new points for finite ink. Undo/Redo, dependency checks, fresh images, source-preserving editor copies and construction-only saving are implemented. A live request completed construction, inking and its final response. Tile choice, finished repeating motifs and coloring remain later work.

## Proposed files

| Location | Responsibility |
| --- | --- |
| `packages/agent-protocol/` | Shared schemas for tools, snapshots, revisions, target addresses, results and operation events. No UI or credentials. |
| `apps/agent-local/` | Authentication, protected credentials, model discovery, streaming, orchestration, budgets and local transport. |
| `apps/player/src/agent/` | Assistant UI, screen adapters, target registry, capture, annotations, scratch previews and transaction coordination. |
| Existing editor, player and draw-along screens | Register active state and invoke shared commands rather than duplicating behavior for AI. |
| Existing schema and engine packages | Validate ordinary pattern data and perform geometry. Preserve the engine's pure TypeScript boundary. |
| Focused package tests and `apps/player/e2e/` | Deterministic contracts, history and browser scenarios. Live model evaluation runs separately. |

Keep the public build usable without the companion and load agent integration only when needed. Notes and private references remain outside production. Use the documented `pnpm dev:agent` command; only that server enables the assistant launcher.

## Acceptance scenarios

| Request or event | Required observable result |
| --- | --- |
| “Draw your own eight-pointed star pattern with smaller stars between.” | Creates editable steps from an empty draft and satisfies the agreed motif constraints. It is not a renamed library copy. |
| “Try a six-fold version,” then “Try twelve-fold.” | Release examples successfully demonstrate valid constructions and repeats for both. |
| “Use blue and turquoise, with ivory centers.” | Effective rendered colors match and persist after reload. |
| Select a ring: “Only make this ring green.” | The ring changes while its center and neighboring rings retain their colors. |
| “Where does this repeat?” | A labeled outline marks the repeating tile in the current wall. |
| “Show the intersection used in this step.” | Points at the correct visible intersection, or identifies and reveals a hidden one when requested. |
| “Open my last design and go to coloring.” | Opens the real saved record through existing navigation safeguards. |
| Pan, zoom, scroll or resize during an explanation. | Named annotations track their targets; stale image coordinates are rejected. |
| Draw a line while the agent prepares an edit. | The human edit survives; the agent observes the newer revision before changing it. |
| Stop, usage limit, network failure or tab disconnect. | No late mutation occurs and a valid recoverable checkpoint remains. |
| “Undo that,” then Redo. | Restores the requested operation across affected data and protects later independent work. |
| Save, reload, export and import a colored original. | Geometry, ink, tile, coloring method and appearance round-trip; save failure is visible. |

Use fixed fixtures and recorded tool transcripts for deterministic tests. Run a separate live evaluation set of around twelve representative prompts across repeated trials, recording success, repair count, time and available usage data. Report successes and failures instead of treating one successful generation as reliability. The owner judges whether new designs look good; geometric validity alone does not settle that.

During implementation, run lint, typecheck, unit tests, build and Chromium checks sequentially where generated output is shared. Add focused checks for transactions, revisions, pointers and the completed creation flow. Review desktop, tablet and phone captures. The first supported environment is the owner's local Linux browser; confirm other environments during packaging work.

## Next step

Phase 0's first live check passed on the owner's connected account: a current board image and named selection produced a displayed, acknowledged highlight and a completed final reply. The connection workspace and shared observation contracts are implemented. The first segment-editing command now draws an editable square between existing points, refreshes the observation and supports Undo/Redo and editor-copy saving. The next milestone now also creates new ruler-and-compass geometry from O and A, feeds the resulting points into finite ink and saves the full draft. Closed motifs, tile checks, repeating walls and shape colors are implemented. Navigation now preserves the workspace and opens real tutorials and saved work through the existing router. Pointing now uses registered geometry and visible controls in the normal editor/player, with markers that follow the camera and scrolling. AI.1 now connects checked square-grid concentric colors to the normal result page and its Undo history, with saved/shared coloring data. It supports one-cell borders in a repeating motif; literal even-sided requests need clarification. Next, connect geometry edits to the open normal editor, then broaden ring and placed-piece coloring. The initial live success is a capability check; the broader evaluation set remains later work.
