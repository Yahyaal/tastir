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
