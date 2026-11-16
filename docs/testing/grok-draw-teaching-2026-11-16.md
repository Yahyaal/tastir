# Repair 6: draw-along names, next-tool guidance and stage order

The reported first-step mismatch is reproduced on the named Star and cross lesson. Before the repair, a fresh hosted production build displayed “Draw a circle with centre O through A” while the footer said “Choose Circle, click O, then E.” A direct browser capture from the retained pre-change build records that mismatch at `docs/review/reliability-2026-11-16/before-first-step.png`; the owner’s dev server was never reverted.

The naming map previously read all finished-scene points and chose E over the coincident given point A. It now considers only points introduced through the current beat. Later steps can still use E after introducing it; peeking back at the first step returns to A.

The next required tool was already computed, but selecting another tool hid that advice behind the selected tool’s generic click prompt. When that tool differs from the next required tool, the concrete recommendation now remains in the existing instruction row, including after a refused click. It does not choose or draw with another tool on the learner’s behalf.

Construction → Ink → Repeat → Color is the implemented draw-along order. Reaching Ink after construction is deliberate; Repeat follows after the board is inked, with Color-first also available. A complete browser path will verify reachability rather than relabel this observation a bug.

The three older unnamed draw-along reports in Grok’s review remain unconfirmed. The supplied report does not identify their exact lessons or steps, so these new named reproductions are not evidence that those three never occurred. Existing saved-board, instruction-layout, geometry and end-to-end checks are retained.

## Verified

Root lint, TypeScript, all 13 test tasks and the production build passed serially with one worker and a 3 GB Node heap cap. The three focused name/guidance/instruction files passed eight checks before the additional Perpendicular regression was added; the full root run includes that ninth check. The production browser run passed all 110 desktop/phone cases across `draw-teaching` and `journey`, including every beginner lesson’s construction/ink board stability and guide checks, real circle and perpendicular drawing through clicks/touch emulation, saved-board reload, storage-refusal recovery and the full Ink → Repeat → Color path.

The retained before build and new after build were captured independently at 1280×900, with the same initial lesson state. Full pages and cropped hints are under `docs/review/reliability-2026-11-16/` and shown in the visual update; no private source imagery is used. Logs: `/tmp/tastir-draw-{focused,browser}.log` and `/tmp/tastir-repair6-{lint,types,tests,build}.log`. Physical-phone acceptance remains separate.
