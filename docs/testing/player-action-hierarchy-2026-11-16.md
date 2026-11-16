# Player action hierarchy — 16 November 2026

The owner found Save and Next lesson too similar, asked for clearer pattern navigation, and requested icon-only Feedback beside Settings with a shorter Settings tooltip. The changes extend the selected Outline design.

Try [the finished first lesson](http://localhost:4200/#/eight-fold-star-and-cross/result) and [the watch view](http://localhost:4200/#/eight-fold-star-and-cross/watch/1).

Next lesson keeps the filled primary appearance. Save becomes a neutral outlined secondary action when shown beside Next lesson; it stays prominent where there is no next-lesson action. Share remains secondary. Previous and Next pattern links now form one navigation group: Previous is quiet, Next has a restrained tinted outline, and directional arrows and destination titles remain available. Both preserve the current view and library order.

Feedback is a speech-bubble icon immediately beside Settings in a shared utility group with the theme control. Its accessible name still explains reporting/feedback, its tooltip says Feedback, and its existing context/snapshot collection is preserved. Other feedback entry points keep their text labels. Settings now uses Settings for its trigger tooltip, accessible name and heading, with Close settings on its close button. All three utility targets are 44px and have visible keyboard focus. Medium desktop widths use two intentional header rows rather than orphaning the utility icons.

## Checks

The focused player, animation, settings and feedback tests passed: 48 tests. The desktop/tablet/phone production-browser pass passed 86 cases with one existing skip, including next-lesson hierarchy, unsaved-work protection, library navigation, settings keyboard behavior, sharing and layout. Further final checks are recorded below.

On the actual local dev app, light/dark desktop and phone checks confirmed icon-only Feedback, Settings tooltip, no horizontal overflow, keyboard opening, closing without submitting, and focus returning to Feedback. Screenshots: `/tmp/tastir-ui-actions-{desktop,phone}-{light,dark}.png`. No feedback report was submitted and no account was signed in. This work is local; not deployed.

## Screenshot critique loop

1. The first pass separated primary and secondary actions and grouped the utilities. Reviewing the captures exposed desktop utility icons orphaned on their own row.
2. A second pass made the medium desktop header two deliberate rows. Light/dark desktop and phone result screenshots now show clear hierarchy and consistent utility placement.
3. Construction and open-Settings captures on desktop, tablet and phone confirmed panel bounds and keyboard close/focus behavior. The phone construction capture exposed a full Share row above the drawing, which pushed the instructions down. That secondary action was moved below the instructions, with Next remaining fixed at the bottom. Desktop sharing is unchanged.

The stopping criteria for this pass are a clear primary next action, visible secondary save/share choices, grouped navigation and utilities, usable focus/targets, no horizontal overflow, and readable teaching content. Theme alternatives are reserved for genuinely unresolved design directions; this pass refines the selected Outline direction. The owner’s screenshot/critique/iterate workflow is now a standing preference.

## Final validation and visual review

After the last phone-sharing refinement, full root tests passed across all eight projects (13 Nx tasks, one Vitest worker), followed by root lint/typecheck/build and **39 desktop/tablet/phone sharing and layout checks**. The preceding pass also completed 86 broader browser checks with one configured skip, 36 path/layout checks after the header refinement, and 48 focused unit checks. Repeated checks overlap; these are run counts, not distinct test totals.

The final dark phone construction capture confirms the stage starts at y=229 rather than y=301, a 72px improvement. Share remains reachable below the instructions and Next remains in the viewport after scrolling. Construction, result and open-Settings captures were inspected on desktop, tablet and phone; light/dark result views were checked. Feedback keyboard opening/closing and returned focus passed in both themes on desktop and phone, without submitting a report.

Open [the before/after screenshot review](http://localhost:4200/__review/renders/player-actions-2026-11-16/index.html). The local ignored review folder keeps the comparison board and four full-size result screenshots; its HTML was rendered and visually inspected. The visual critique loop reached a satisfactory result for the requested controls. No competing direction required a theme vote. Everything remains local and un-deployed.

## UI.2: owner refinement — centered navigation and three action weights

The owner found the revised header crowded and preferred Previous–title–Next. The current title is now centered between compact, neutral chevrons. Patterns is an icon-only drawer toggle with its existing accessible name, expanded state, Escape behavior and focus return. The wordmark remains a link to the library; its accessible name is All patterns. Variations, places and viewing choices occupy a second row.

The three finish actions now use filled Next lesson, outlined Save, and text-style Copy link with a link icon. The visual guideline is a single high-emphasis action with lower-emphasis alternatives ([Carbon guidance](https://carbondesignsystem.com/components/button/usage/)); the styling follows the selected Outline design.

Screenshot critique first brought the arrows closer to the title, then caught a narrow view-switch overflow at 320px. At that width the title takes its own line and view choices fit. Menu and utility targets are 44px. Reviewed captures include 1280px light Result, 1280px dark Watch, 1024px dark Result, 390px Phone, 320px narrow Phone, and a 1600px pattern with source credits. Side-menu open/Escape/focus and Settings opening passed in the local app.

[Current before/after visual review](http://localhost:4200/__review/renders/player-header-2026-11-16/index.html). Screenshots are kept in the ignored local review folder. Final regression results follow below.

UI.2 validation: full root unit tests passed across all eight projects (13 tasks), with 36 focused player/settings/save tests and 86 desktop/tablet/phone browser cases passed (one existing phone skip). Final review caught a CSS grid boundary case when a neighboring arrow is absent. Explicit grid slots now preserve the title position. That CSS-only correction and its browser regression were checked with fresh root lint/typecheck/build and 58 browser cases passed, with two configured phone skips (phone pattern browsing uses the drawer). The TypeScript player behavior remained unchanged after the full unit pass. The new regression verifies both ends of the actual library on desktop and tablet. Final formatting and diff checks passed.

The local screenshot gallery was rendered at 1440px, all visible images loaded, and the result was visually reviewed (`/tmp/tastir-centered-review.png`). No account was signed in and no feedback submitted. UI.2 remains local and un-deployed.
