# Review of Antigravity's `atelier-ui` branch (22 October)

The owner asked Antigravity to review Tastir's design and improve it. It wrote a proposal and committed `9c0a8bb` on branch `atelier-ui` (worktree `../Tastir-atelier-ui`), based on `7dec029`, before design-review fix 8 and the 22 October changes. The review page card `atelier-review-2026-10-22` has the pictures and the question.

## Proposal against what was built

The proposal's main ideas were not built, though its summary says everything discussed was: hover-only card actions, a moving brass compass and ruler, a construction-to-ink fade slider, a sun-and-shadow engine for jali, and the stages renamed as "the 4 historic rites" (not a real tradition, so it breaks the rule against claims we cannot back).

What the commit does:

| Change | Verdict |
|---|---|
| `FoldGlyph`: star polygons on fold chips and card facts | Drop. At 11–13 px the 8, 10, 12 and 16-pointed stars are the same blob; on a phone the chips bunch into a block |
| Card "See it" moved to the picture's centre, hover lift and zoom | Drop. "See it" wraps onto two lines over the picture on a phone |
| Inset bevels on frames, wall and colour buttons | Drop. Barely visible, and written with fixed `#fff`/`#000`/`rgba`, breaking the light/dark variable rule |
| "Morning sun" and "Afternoon amber" jali backgrounds | Drop. Two flat colours, not lighting |
| View transition fade on every hash change (`routing.ts`, `as any`) | Optional. Snapshots the whole page on each navigation, a cost on large walls when performance comes first |
| Compass-shaped cursor when the editor's compass tool is chosen | Keep |
| `.thumbnail-fold-badge` CSS | Unused by any markup |

Merging the branch as it is would also restore the arch around the home drawing, which the owner chose to square on 22 October.

## Ideas worth their own tasks later

A compass and ruler shown moving during "Watch it drawn", and a short glow where two circles cross to show why a point exists.
