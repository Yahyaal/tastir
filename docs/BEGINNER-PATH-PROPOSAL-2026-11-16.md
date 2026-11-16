# Beginner path: a working visual proposal

**Update, 16 November:** The owner approved building Start here and next-lesson navigation after the explanation of how it uses existing tutorials. Try [the working path](http://localhost:4200/#/learn). The historical proposal below records the evidence gaps; reference-photo and newcomer checks remain open, and the implementation is not deployed. [Implementation report](testing/learning-path-2026-11-16.md).

Open [the twelve linked pictures](http://localhost:4200/#/notes/beginner-path). This is a review-only proposal built after the owner asked to start the next task. It does not add a course to the public home page or change any tutorial, palette, difficulty rating or saved progress.

The proposed order starts with named points and equal compass openings, moves through grids and rotated corners, then reaches a rosette and comparisons of tile and ink. Each card has one new learning focus and a practice cue. Some later lessons remain intermediate stretch projects; short step counts are not treated as proof that a lesson is easy. Existing links open the actual result, first paused watch position, or draw-along board.

## Selection and evidence

The source is the project's recorded status in `docs/patterns/STATUS.md`, cross-checked with current tutorial metadata and public photo files. “Verified” or “approved” in that log is separate from the availability of a matching free photo in the shipped app. No new independent photograph match is claimed by this proposal.

The twelve candidates have four shipped free photographs, but only three are recorded matching examples: Comares bones, Comares dado and the Cairo minbar doors. The star-and-octagon study's photo is explicitly a historical reference with an unverified match. Eight other candidates ship no free example photo, even where the status log records verification against an earlier reference or owner approval. Private references are not promoted into public photos.

This does not yet satisfy the launch gate in `NEXT-STEPS-2026-11-14.md`: the path calls for a matching free photo for every lesson. The original prototype therefore stayed on the review page; subsequent owner approval authorized navigation while leaving these photo gates open. Its filters make the three recorded matches and nine open photo gates visible; original lesson numbers stay stable when filtering.

| Order | Existing lesson | New focus | Shipping-photo gate |
| --- | --- | --- | --- |
| 1 | [Eight-fold star and cross](http://localhost:4200/#/eight-fold-star-and-cross/result) | Named points and the inking reveal | Missing free photo |
| 2 | [Six-fold star and hexagons](http://localhost:4200/#/six-fold-star-and-hexagons/result) | Keep one compass opening | Missing free photo |
| 3 | [Twelve-fold dodecagrams](http://localhost:4200/#/twelve-fold-dodecagrams/result) | Finer divisions from six-fold geometry | Missing free photo |
| 4 | [Six-fold snowflake](http://localhost:4200/#/six-fold-snowflake/result) | Make an inner star from an existing star | Missing free photo |
| 5 | [Comares bones](http://localhost:4200/#/alhambra-comares-bones/result) | Transfer a length into a grid | Recorded matching free example |
| 6 | [Comares dado](http://localhost:4200/#/alhambra-comares-dado/result) | Rotate the work of one corner | Recorded matching free example |
| 7 | [Eight-fold khatam study](http://localhost:4200/#/eight-fold-khatam/result) | Circles centered away from O | Missing free photo; historical match unverified |
| 8 | [Star-and-octagon study](http://localhost:4200/#/eight-fold-star-and-octagon/result) | Sixteen directions from eight | Reference photo only; match unverified |
| 9 | [Eight-fold zellige](http://localhost:4200/#/eight-fold-zellige/result) | Turn copies of a motif around O | Missing free example |
| 10 | [Mian rosette, square tile](http://localhost:4200/#/twelve-fold-rosette-mian/result) | Establish the inner rosette ring | Missing free example |
| 11 | [Mian rosette, hexagonal tile](http://localhost:4200/#/twelve-fold-rosette-mian-hex/result) | Change the tile around a familiar motif | Missing free example |
| 12 | [Cairo minbar doors](http://localhost:4200/#/minbar-doors-cairo/result) | Read the ink separately from the construction | Recorded matching free example |

## Recommendation

Review the linked order and difficulty before building the public path. Prioritize matching free-photo checks for the opening lessons, read the instructions aloud, and try the first lessons with a newcomer. Once the selection and evidence gates pass, add Start here at the top of the library and offer the next lesson at each finish. Completion tracking needs an explicit definition; this proposal never infers completion merely from visiting a page.

## Reliability release

The seven preceding repairs are published through [PR #17](https://github.com/Yahyaal/tastir/pull/17), merge `bb6f8c1`. Vercel preview and production statuses passed. A fresh phone-sized production-browser smoke verified collection/Arabic search (18 Fez star results), numbered position and Back, editable version-2 download, the first A hint, and one signed-out `/api/me` with no `/api/projects` calls through Studio navigation. No account was signed in and no remote user data was written. This path proposal is a separate local follow-up.

## Verification

Root lint, TypeScript, all 13 test tasks and the production build passed serially with one worker and a 3 GB Node cap. Eleven focused tests cover the existing notes and the new proposal contracts; six DEV browser cases cover desktop/phone, light/dark, all twelve previews, filter counts/stable ordinals, overflow, the real paused-lesson link and the written rationale. Screenshots were inspected at 1280px dark and 390px light; the primary/secondary lesson actions align across each row.

The contracts reject hidden or missing candidates, forward prerequisites, mismatched status-log claims, absent public photo files, and treating an explicitly unverified historical reference as a recorded matching example. The proposal's module and CSS are absent from production assets. Existing photo credits remain on the actual pattern pages; no new source image or licence claim was introduced.

Reproduce the review UI checks with `pnpm exec playwright test --config tools/review-playwright.config.mts` (dedicated port 4414), serially after other checks. Logs: `/tmp/tastir-path-{focused-final,lint,types,tests,build,browser-final,visual}.log`. The owner's server on 4200 stays available. The proposal remains on its own local branch for review.
