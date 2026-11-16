# Grok’s live-site review: what to do next

The owner supplied Grok’s report on 15 November. Its successful newcomer journey is encouraging. A short review is evidence about the paths tested, not proof that every previously reported problem is absent. Keep the three draw-along reports as unconfirmed until their original steps have explicit regression coverage; do not delete them because they did not recur.

## Implementation progress

Item 1 is fixed locally. A controlled Your work poller regression reproduced 13 failed requests in 12 seconds; the shared session gate now reduces that to one sign-in check and no project requests. Ten focused unit cases, six hosted-browser cases and full root verification passed. This resolves a concrete path that the earlier short live Studio visit did not exercise. See [the visual update](http://localhost:4200/#/notes/reliability-update) and [the technical evidence](testing/grok-auth-2026-11-15.md). Item 2 is also fixed locally: the viewer exports a portable construction/design file and clean-browser imports restore it. Full verification and 24 export/sharing browser cases passed. [File evidence](testing/grok-files-2026-11-15.md). Item 3, collection links and Arabic search, is next.

## Recommended order

| Order | Work | Evidence and acceptance |
| --- | --- | --- |
| 1 | Reproduce and stop signed-out request retries | Grok reported 118 failed calls. A fresh mobile browser check on 15 November saw no home-page API requests over 15 seconds, then one `/api/me` 401 and one successful sign-in-options request over 15 seconds in Studio. It did not reproduce the flood. However, `useStudioEvents` catches every polling error and schedules another check. Trace the reported navigation/session-expiry case, stop polling and prevent protected reloads after confirmed sign-out, and resume only after verified sign-in. Test initial sign-out, session expiry, tab visibility, remounts and actual sign-in recovery. Do not permanently classify network failures as signed-out. |
| 2 | Make editable downloads easy to find | The editor already offers “Download the tutorial file” and “Download my pattern file”; JSON import and round-trip tests exist. The regular result screen offers SVG/PNG without the editable-file action. Expose a clearly labelled pattern download there. Verify opening the exported file in a clean browser restores the construction and the intended design appearance; do not imply an SVG/PNG contains editable tutorial steps. |
| 3 | Fix broken library entry points and Arabic search | Direct `https://tastir-studio.vercel.app/#collection` reproduced “There is no tutorial called collection”. The route parser treats the anchor as a tutorial id. Search tokenization uses `[^a-z0-9]`, so Arabic-only input becomes an empty query. Preserve Unicode query tokens; inspect what Arabic titles/aliases actually exist before promising Arabic semantic search. Add tests for Arabic, mixed scripts, no matches, direct anchors and reloads. |
| 4 | Audit accessibility and mobile performance | Grok’s 87/78 scores and listed audit failures were not independently rerun. Capture the report, route, build, device profile and actual failing elements first. Fix contrast, labels, ARIA, headings and the main landmark as applicable. Then measure image and first-paint improvements with the same audit conditions. |
| 5 | Improve ordinary step navigation and teaching clarity | New share links already restore the exact step and viewing choices. The ordinary watch URL still does not encode the step, and browser Back still works at route level. Evaluate readable step URLs separately from sharing, with a deliberate policy that avoids an autoplay entry for every frame/step. Check the reported draw-along A/E mismatch and Perpendicular instruction on named lessons. Construction → ink → repeat is the current lesson order; verify repeat is reachable after ink before calling that order a bug. |

## Already addressed in the approved release

The region-count discrepancy is BUG.2. Facet counts now call the same filter as the list and include alternate places; this specifically covers the 36-versus-39 Alhambra example. Phone pinch zoom is implemented and tested in gesture emulation; acceptance on the owner’s physical phone remains open. Outline is the selected, sole settings panel, with clearer speed selection and colour-changing switch labels. Share links restore the complete presentation without replacing recipient preferences.

The existing search scorer weights title/short title above subtitle, region/style and credit text. “Favor titles” is therefore already implemented. Broad English queries such as “star” can still match many descriptions/sources; improve result relevance deliberately instead of claiming the current code has no ranking.

## Retained follow-ups

Grok also reported a bare “Checking the tutorial…” loader, icon-only editor tooltips, a Duplicate action in Your work, clearer notice that Make a variation saves a copy, faint repeat ghosts, cropped saved-design thumbnails, and horizontal scrolling in the phone draw-along toolbar and Your work row. These remain reported usability issues, not independently reproduced fixes. Preserve the three prior draw-along reports and obtain named-lesson reproductions for the newer A/E, Perpendicular and stage-order observations.

The Studio’s authenticated workflow was not tested by Grok or this signed-out audit. Signing in on someone else’s computer is unnecessary for triage: use a controlled authenticated test session or an owner-run acceptance check instead. No account sign-in, issues, messages or configuration changes were made for this review.

## Evidence and limits

Source review: `apps/player/src/studio/client.ts`, `studio/StudioPage.tsx`, `app/search.ts`, `app/browsing.ts`, `app/routing.ts`, `app/app.tsx`, `app/Player.tsx`, `editor/AboutPanel.tsx` and `editor/files.ts`. Short live browser log: `/tmp/tastir-grok-live-audit.log`. This was a fresh signed-out phone-sized Chromium session; it does not rule out a longer-session, navigation-specific or expired-cookie request loop. The audit happened before this release was merged, so it represents the prior live build.

Release verification before publication: root lint and typecheck passed; all 13 root test tasks passed; the player production build passed; 44 desktop/phone browser tests passed, with two intentional desktop touch skips. Production assets exclude private review content, the developer visibility endpoint and retired theme preferences. Detailed local logs: `/tmp/tastir-release-{lint,types,tests,build,browser}.log`.
