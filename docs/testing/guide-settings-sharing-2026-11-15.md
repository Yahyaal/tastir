# Guide, settings and sharing, 15 November 2026

Start with [the three-slide visual update](http://localhost:4200/#/notes/settings-update). The [guide study](http://localhost:4200/#/notes/ink-guide) also compares faint lines with point-only cues. This document records the implementation and validation behind the presentation.

## Owner's decisions

The owner wants the satisfaction of the complete pattern being inked at the end. A destination cue should help explain where the construction is heading, and should become the default ink option. They also requested visible choices instead of dropdowns for Speed and Ink, modern switches for the three binary settings, and a clearly recognizable Hide from library action with an icon. Their general preference for avoiding unnecessary dropdowns is recorded in `docs/WORKING-WITH-OWNER.md`; a broader audit is retained as UI.2 in `docs/TASKS.md`.

## Guide first

The player now offers Guide first, At the end, and As you go. Guide first is the default and shows non-interactive, faint dashed segments only on the last visible construction beat. Earlier steps remain uninked, the guide has no ink-animation identifiers, and the actual ink stage still performs the complete reveal. The guide uses prepared tutorial ink; it does not change geometry, the learner's ink choices, saved designs or exports. A short on-board label identifies it as a preview. The guide is removed at the ink stage.

A new versioned preference distinguishes the new default from the old automatically remembered end-only default. An existing progressive-inking preference is migrated; all three choices can be explicitly selected and remembered. A browser that cannot store preferences still uses the chosen setting for the visit. The line treatment is recommended because it shows connections as well as endpoints; the point-only treatment remains an alternative in the visual study.

## View settings

Native grouped radio inputs provide segmented speed and ink choices. Native checkbox inputs with switch semantics provide labelled binary options, including visible descriptions, focus treatment, keyboard support and readable on/off states. The layout adapts to a phone without turning short choice sets into selects. Escape and a close button dismiss the panel and return focus; pointer presses outside also dismiss it. These choices follow the [WAI radio-group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/) and [switch guidance](https://www.w3.org/WAI/ARIA/apg/patterns/switch/).

The visibility action uses an eye/visibility icon, a bordered button, a saving state and disabled repeat clicks while saving. A failed write preserves the existing visibility and reports the failure. It remains a development-only action; browser review never changes the real hidden-pattern file.

## Shared presentation

Existing Copy a share link already carried colours, custom inking, style, width, pen/wash and Jali appearance. It now also records the current stage, speed, ink mode, helper/name switches, whether the original is shown, colour/repeat order, tile arrangement and the applicable camera rectangle. The link opens paused at the chosen stage. Sharing is now available during construction as well as at the finished wall.

Optional presentation data is validated on encoding and decoding. Old links without it still open as before. Unknown modes, invalid speeds, impossible frames and excessive tile arrangements are rejected. Restored camera widths are bounded, and restoration is idempotent when React StrictMode replays mount effects. A live-browser check exposed that replay issue; a dedicated regression covers it.

A link's settings override viewing defaults for that visit and do not write to the recipient's saved preferences. System reduced motion is respected even when the sender had animations enabled. Shared frame coordinates adapt to the available screen; this is not a frozen screenshot or a replacement for the recipient's device theme. The ordinary library address remains a navigation address: use **Copy a share link** to capture the current presentation. Link content is a snapshot at the time of copying, not a live connection to subsequent sender edits.

## Validation

The initial focused run passed 58 existing checks for the player, animation, sharing and camera. New checks cover the final-only guide, the full ink stage, settings state, progressive-preference migration, restored framing, receiver preference isolation, reduced motion, StrictMode, malformed presentation data and visibility-save handling. Browser smoke checks passed at 1280 and 390 pixels in light/dark themes, including native keyboard arrows without moving the lesson, all three switches, the guide and subsequent reveal, clean-browser lesson links and styled, zoomed wall links. Both switch alignment and framing are checked rather than judged only from screenshots.

Screenshots are under `docs/review/settings-2026-11-15/` and linked in the visual update. Final validation passed: `pnpm lint --parallel=1`, `pnpm typecheck --parallel=1`, `pnpm test --maxWorkers=1`, and `pnpm nx run player:build`. Nx reported all 13 test tasks successful (five reused from cache); the full serial test run took 10 minutes 46 seconds. The expanded focused run passed 96 checks, and the panel-guide regression also verifies that preview segments exactly match the subsequent clipped-panel ink.

Production Chromium passed 40 tests with two intentional desktop skips for the phone-only touch cases. These cover six new settings/sharing scenarios across desktop and phone, existing Jali appearance/export/sharing checks, all 22 place-identity scenarios, and both touch-zoom views. The development-browser visual review passed all three slides and their images at 1280 and 390 pixels, both guide-cue alternatives, and overflow/error checks. A final normal-motion check confirmed real ink animations after the guide and inspected the dense Najjarin guide in the actual player. Production JavaScript marker checks found neither the development visibility endpoint/button text nor the new private evidence-page label. No engine geometry or tutorial construction was changed, and nothing was pushed or deployed.

The actual-player final checks also confirmed that normal-motion inking animations run after the guide disappears. Captures are available for [the simple guide](http://localhost:4200/__review/renders/settings-2026-11-15/guide-eight-fold-star-and-cross.png) and [the dense Najjarin guide](http://localhost:4200/__review/renders/settings-2026-11-15/guide-fes-najjarin-rosette.png); these show the real construction context, not the more isolated cue-study framing. The local server remains available at port 4200.
