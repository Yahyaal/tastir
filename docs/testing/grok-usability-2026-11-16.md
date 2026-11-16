# Repair 7: copies, personal previews, loading and repeat guides

## Changes

Your work offers Duplicate for saved designs and local constructions. A design copy preserves ink, palette/custom colors, finish, style, pen and Jali appearance under a fresh id/date and a distinct bounded name. It still references its source construction, as other designs do. A construction copy preserves its whole draft, attribution/provenance and any hand-laid wall, with its own identity and name. Duplication does not delete, rename or modify the original; it keeps the work list open, shows a saved message and offers a clear alert if storage refuses the write.

Make a variation now explicitly explains that a copy is saved in this browser before opening the editor. It continues to copy the construction and tile; it does not promise that a plain construction copy contains every saved-design appearance.

Personal cards now have rectangular preview edges; library cards retain the owner-selected arches. Card actions keep Edit/Play together where applicable, with compact secondary actions and 44px targets. No tutorial geometry, camera framing or catalogue colors change.

The shared player/draw-along loading screen shows the pattern's metadata preview/title, the current real preparation stage, and an All patterns link. It uses the worker's existing checking/drawing/pieces progress; no artificial percentage, minimum wait or timer is introduced.

Repeat candidates use a stronger blue dashed edge (theme accent, 0.9 stroke opacity, 1.5px) instead of the faint amber edge (0.5, 1.2px). The candidate fill remains light and distinct from placed ink. The intermediate-badge contrast colors are moved into paired theme variables, preserving their verified colors.

Editor tooltips already existed (native title and accessible description). Phone toolbars and the home work row already intentionally scroll horizontally. These behaviors were exercised rather than reported as newly implemented.

## Early verification

Eighteen focused duplication/shelf checks passed, including fresh identities, exact appearance preservation, provenance and laid-wall preservation, independent later edits, repeated bounded names, unfinished drafts and write refusals. Fourteen desktop/phone browser cases passed for variation saving, construction/design duplication and reopening/reload, preview shape, storage failure, delayed real module loading, tooltip attributes, phone tool reachability and the horizontal work row. The timestamp baseline in the variation test is taken after the editor's normal autosave/reload, immediately before Duplicate, so it measures duplication rather than unrelated autosave.

Before/after captures use separate retained/current production builds and fresh browser contexts; no files on the owner's running server were reverted. Evidence is under `docs/review/reliability-2026-11-16/`. Only app-rendered images are used. Logs: `/tmp/tastir-ui-{focused,browser-final}.log`. Final repository and combined browser verification follow below.

## Final verification

Root lint, TypeScript, all 13 test tasks and the player production build passed against a fixed snapshot, with one worker and a 3 GB Node heap cap. The final focused duplication/shelf run passed 19 cases (8 duplication + 11 shelf). The complete public desktop/phone Playwright run passed **251 cases with 11 configured platform skips** in 9.1 minutes; it includes the newly added direct ghost placement check, all beginner board/guide checks, copy creation and reopening, storage failures, file round trips, sharing, Jali, ink timing and touch emulation. The skips cover desktop touch cases and phone cases whose performance/desktop navigation assertions intentionally run elsewhere.

An interim run picked up a newly added Unicode case alongside an older cached helper transform because a helper was edited while that run was active. The fixed snapshot was checked directly (including the Unicode case), then the complete root and browser runs were repeated without source edits. Final verdict logs are `/tmp/tastir-ui-focused-final.log`, `/tmp/tastir-repair7-{lint-final2,types-final2,tests-final,build-final,browser-all}.log`.

The final captures were regenerated after the 44px action layout was finished. The morning presentation was inspected at 390px/1280px, light/dark; no horizontal overflow, page errors or failed evidence-image requests, including with both evidence disclosures expanded. Production JavaScript contains no morning-report/private-review asset paths.

## Final mobile delivery audit

A separate signed-out hosted production build was served on localhost:4413. Lighthouse 13.6.0 ran three serial cold mobile navigations, using the same 390×844/DPR2, simulated-mobile/4× CPU conditions as the initial audit. All three scored 100 for automated home-page accessibility; performance was 96, 95, 96.

| Median metric | Original local baseline | Final overnight build |
| --- | ---: | ---: |
| Accessibility score | 88 | 100 |
| Performance score | 96 | 96 |
| First/largest paint | 1.436 s | 1.430 s |
| Total blocking time | 226.5 ms | 220.5 ms |
| Layout shift | 0.000088 | 0 |
| Initial transfer | 846,082 bytes | 672,725 bytes |

Transfer is about 20.5% below the original baseline. Small differences from the earlier repair-4 snapshot reflect subsequent code and normal run variation. Per-run versions/timestamps/metrics are recorded in `docs/testing/grok-audit-metrics-2026-11-16.json`; raw local reports are `/tmp/tastir-lighthouse/overnight-*.json`. These scores describe the tested home page/profile, not all app accessibility or a directly comparable change from Grok’s live 78/87. Font delivery remains a measured future optimization.
