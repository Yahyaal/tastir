# Design review against the approved canvas — 22 October 2026

The owner asked why the library cards lost the arch shown on the design canvas (https://claude.ai/artifact/McyS36FxVoDKxVCUKNZmX1), and for a full review of the app against that design with every suggested fix made overnight. The review page (`#/review`, card `design-review-2026-10-22`) has the pictures.

## What was compared

Every artboard of the canvas (style sheet, library, lesson, colour stage, draw along, phone lesson; light and dark) against the running app at 1440 × 900 and 390 × 844 in both themes, plus the screens the canvas does not draw (editor, upcoming page, Your work, a broken address).

## What differed, and the fix

| Difference | Cause | Fix (commit) |
| --- | --- | --- |
| Card pictures and the home drawing had square corners; the design puts them in an arch | Dropped during R4 by oversight; no decision recorded | Arched card pictures and a cedar arch round the home drawing (`22105b5`) |
| “Watch it drawn” cut at the button border | Two fixed columns with `nowrap` | Buttons share a row when both fit, else stack (`22105b5`) |
| Labels and badges in a typewriter face | The blueprint era's `--mono`; the design has no such face | `--mono` now points at the text face; the font is no longer loaded (`22105b5`) |
| Draw along: numbered capsules, blue display heading, tiny square tools | Draw along was not brought into R2's lesson look | Shared khatam star (`app/khatam.tsx`), cedar labels, one pill of tools, pill buttons; layout unchanged (`ea47a68`) |
| No library search | Asked for by the design and the 14 October UX review | Search by name, subtitle, tradition or address, case- and accent-insensitive, kept with the filters, cleared by Clear all (`bce4d79`) |
| A broken address showed red typewriter text in the top bar | Old error view | A notice like the missing-design page, with a way back (`1878913`) |
| Editor tools and upcoming chips square-cornered | Not covered by the redesign tasks | Pills (`7dec029`) |
| The editor's title fell below Play and the kept status on a phone | Header order | Title on the first row, Play and the status on the second (`fb5ad78`) |

## Deliberately unchanged

The lesson's construction board keeps its rectangular cedar frame, as in the canvas's desktop lesson: an arch would hide points near its top corners while the learner draws, pans and zooms. The canvas's phone lesson shows an arch, but the owner chose (22 October) the arch for the cards only: an opened pattern, watched or drawn along, sits in a rectangle on every screen, and so does the home page's animated drawing, which was squared again. The owner also asked to hide or show the original photo while viewing a pattern; the toggle moved from the side panel onto the drawing's top corner, where it is next to the photo on a phone too.

## Noticed, not changed

The Comares bones card has no subtitle; that is tutorial text, not design.

## Checks

Player unit tests 755 passed (1 skipped), lint and typecheck pass, and `pnpm test:browser` 151 passed (17 skipped) on desktop, tablet and phone, after the first seven fixes; the editor tests (199) and the browser suite again after the eighth. The commits are local; nothing was pushed.

## Lesson

A design canvas is a checklist, not a mood board: after building a redesign, compare each artboard with the running app screen by screen before calling it done. The arch was in four artboards and none of the build tasks named it.
