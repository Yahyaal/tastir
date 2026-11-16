# Review: duplicates and ink overlays (14–15 November 2026)

Update, 15 November: the owner authorized the recommendations. Phone pinch zoom, region counts and the Comares credit are now fixed locally; physical phone confirmation remains open. [The visual follow-up](http://localhost:4200/#/notes/teaching-update) and [palette study](http://localhost:4200/#/plan/palettes) show the new work. The original audit evidence follows.

Prefer pictures? [Open the eight-slide research presentation](http://localhost:4200/#/notes/ink-presentation), covering the method, results, limits and proposed next steps.

The ink audit supports all ten earlier place merges: every archived drawing agrees fully with its current base tutorial in both directions, within the stated tolerance. The two rosette pairs remain different in their current ink. This is a review of the actual tutorial lines; it does not establish a match to historical photographs or approve further tutorial changes.

## Findings and recommendations

### 1. The rosette pairs have differences that piece counts do not explain

The [Paccard large rosette](http://localhost:4200/#/paccard-222-rosette/result) and [ring version](http://localhost:4200/#/paccard-222-rosette-ring/result) cover about 82.49% and 82.56% of each other's lines at the best tested placement. [Their overlay](http://localhost:4200/__review/renders/ink-overlay/paccard-rosettes.png) highlights the differences around the rosette ring.

The [Najjarin fountain](http://localhost:4200/#/fes-najjarin-rosette/result) and [Bou Inania in Meknes](http://localhost:4200/#/meknes-bou-inania-rosette/result) both have twenty piece types, but cover 96.87% and 95.96% of each other's ink at the best tested placement. [Their overlay](http://localhost:4200/__review/renders/ink-overlay/najjarin-bou-inania.png) highlights differences around the corner motifs. Matching type counts do not establish equal arrangements.

Keep both pairs separate while their sources are reviewed. One drawing could need a correction; this audit alone cannot decide whether the historical patterns themselves differ. The current Variations families can remain during that review.

### 2. Library region counts omit alternate places

In the [library](http://localhost:4200/#/), “Alhambra and Nasrid Spain” displays 36 patterns, but selecting it returns 39 cards. [The marked screenshot](http://localhost:4200/__review/renders/ink-overlay/region-counts.png) highlights the menu count of 36 and the actual result heading of 39. The same check found six incorrect region counts in the current local library:

| Region | Displayed | Actual matching cards |
| --- | --- | --- |
| Books and other | 36 | 37 |
| India | 13 | 14 |
| Spain and Portugal, other | 12 | 13 |
| Alhambra and Nasrid Spain | 36 | 39 |
| Iran | 23 | 24 |
| Turkey | 7 | 8 |

`facetCounts` in `apps/player/src/app/browsing.ts` counts the selected family face and its variations but does not include their places. The menu's list of available values and the actual filter both do include places. Fix the count calculation so each displayed number equals the number of cards returned by applying that facet with the other current filters, counting each card once. This is recorded as BUG.2 in `docs/TASKS.md`; the production filter code has not been changed in this review.

### 3. The Comares construction credit still describes the removed construction

Open [Comares stars and crosses](http://localhost:4200/#/alhambra-comares-stars). Its retained place credit says the grid and tracing follow Manuel Martínez Vela's article and attaches that credit to steps 1–5. The archived tutorial did build a grid with additional compass circles, then a circle through a diagonal grid corner. The current shared construction instead divides a circle and crosses two squares; its steps 4 and 5 join the two squares. The source note therefore describes a construction that the learner no longer sees.

[Compare the archived construction with the current one](http://localhost:4200/__review/renders/ink-overlay/comares-construction-credit.png): the red marks show the old grid-corner construction at step 4 and the current crossed squares at step 5. Each panel is framed independently; this picture compares construction methods, not scale.

The source can remain credited as evidence identifying the Comares design. Recommended replacement for its note: “This article identifies the Comares panel. This lesson uses the standard eight-fold star-and-cross construction; the grid construction previously taught here has been replaced.” Remove the old step mapping at the same time. This is a proposed attribution correction only; no tutorial credit has been changed in this review.

### 4. All ten archived drawings agree with the current base ink

A is the tutorial before it became a place; B is its current base tutorial. “Cells A/B” counts primitive repeat cells in the supplied tiles. Grey lines coincide, blue belongs only to A, and orange only to B. Every picture in this table should therefore be entirely grey.

| Archived tutorial, at its current address | Current base | A/B coverage | Cells A/B | Evidence |
| --- | --- | --- | --- | --- |
| [Star rosettes of the Ben Youssef madrasa (Marrakesh)](http://localhost:4200/#/ben-youssef-star-rosettes/result) | [Star rosettes of the Attarine madrasa (Fez)](http://localhost:4200/#/attarine-star-rosettes/result) | 100% / 100% | 1 / 1 | [Overlay](http://localhost:4200/__review/renders/ink-overlay/merges/ben-youssef-star-rosettes--attarine-star-rosettes.png) |
| [Star rosettes of a Seville tile (V&A)](http://localhost:4200/#/seville-vanda-star-rosettes/result) | [Star rosettes of the Attarine madrasa (Fez)](http://localhost:4200/#/attarine-star-rosettes/result) | 100% / 100% | 1 / 1 | [Overlay](http://localhost:4200/__review/renders/ink-overlay/merges/seville-vanda-star-rosettes--attarine-star-rosettes.png) |
| [Star rosettes of Alberto Leon’s mosaic design](http://localhost:4200/#/leon-mosaic-star-rosettes/result) | [Star rosettes of the Attarine madrasa (Fez)](http://localhost:4200/#/attarine-star-rosettes/result) | 100% / 100% | 1 / 1 | [Overlay](http://localhost:4200/__review/renders/ink-overlay/merges/leon-mosaic-star-rosettes--attarine-star-rosettes.png) |
| [Divided stars of Imamzadeh Ismail, Isfahan](http://localhost:4200/#/ismail-shrine-divided-stars/result) | [Divided stars of Chehel Sotoun, Isfahan](http://localhost:4200/#/chehel-sotoun-divided-stars/result) | 100% / 100% | 1 / 1 | [Overlay](http://localhost:4200/__review/renders/ink-overlay/merges/ismail-shrine-divided-stars--chehel-sotoun-divided-stars.png) |
| [Interlaced loops of the Alhambra Museum](http://localhost:4200/#/alhambra-museum-loops/result) | [Interlaced loops of the Chellah minaret (Rabat)](http://localhost:4200/#/chellah-minaret-loops/result) | 100% / 100% | 2 / 2 | [Overlay](http://localhost:4200/__review/renders/ink-overlay/merges/alhambra-museum-loops--chellah-minaret-loops.png) |
| [Comares stars and crosses](http://localhost:4200/#/alhambra-comares-stars/result) | [Eight-fold star and cross](http://localhost:4200/#/eight-fold-star-and-cross/result) | 100% / 100% | 1 / 1 | [Overlay](http://localhost:4200/__review/renders/ink-overlay/merges/alhambra-comares-stars--eight-fold-star-and-cross.png) |
| [Interlaced star and cross of the Gowhar Shad mosque, Mashhad](http://localhost:4200/#/mashhad-gowhar-interlace/result) | [Eight-fold star and octagon](http://localhost:4200/#/eight-fold-star-and-octagon/result) | 100% / 100% | 1 / 2 | [Overlay](http://localhost:4200/__review/renders/ink-overlay/merges/mashhad-gowhar-interlace--eight-fold-star-and-octagon.png) |
| [Stars of the Zeynebiye madrasa (Hani)](http://localhost:4200/#/hani-zeynebiye-stars/result) | [Four-fold ring of circles](http://localhost:4200/#/four-fold-ring-of-circles/result) | 100% / 100% | 2 / 1 | [Overlay](http://localhost:4200/__review/renders/ink-overlay/merges/hani-zeynebiye-stars--four-fold-ring-of-circles.png) |
| [Interlaced stars of the tomb of Itimad al-Daula, Agra](http://localhost:4200/#/itimad-daula-stars/result) | [Four-fold ring of circles](http://localhost:4200/#/four-fold-ring-of-circles/result) | 100% / 100% | 1 / 1 | [Overlay](http://localhost:4200/__review/renders/ink-overlay/merges/itimad-daula-stars--four-fold-ring-of-circles.png) |
| [Twelve-pointed star bands of the Mexuar patio, Alhambra](http://localhost:4200/#/mexuar-twelve-star-bands/result) | [Twelve-pointed star bands of Öljeitü’s mausoleum, Sultaniyeh](http://localhost:4200/#/sultaniyeh-twelve-star-bands/result) | 100% / 100% | 1 / 1 | [Overlay](http://localhost:4200/__review/renders/ink-overlay/merges/mexuar-twelve-star-bands--sultaniyeh-twelve-star-bands.png) |

The historical files were read using `git show` at `51160b09504a118bf611ea1576a76b2293390ba8`, immediately before the first place merge. The base tutorials were read from the working tree based on `ee3ebba94376687f1965933e2c6dd541b73def96`; those tutorial files were not modified. No checkout, stash, merge, push or deploy was used. The audit script is `tools/audit-ink-merges.mts`; run `node --conditions=@tastir/source --import tsx tools/audit-ink-merges.mts` from the repository root to regenerate the JSON, SVG and PNG evidence under the ignored `docs/review/ink-overlay/merges/` directory. Its summary records the SHA-256 of the comparison implementation.

This establishes line equivalence between the archived and current drawings. It does not independently verify the colours, original construction method, attribution or photographs of each building.

### 5. Candidate detection now counts occurrences but remains a heuristic

The old set comparison discarded how often each neighbourhood occurred. It now counts occurrence density in an area equal to the largest piece's area. Both the wall area and that reference area scale together, and a supercell increases both its area and its counts, so the fingerprint stays invariant under scale and re-tiling. This avoids running primitive-repeat discovery merely to normalize a candidate fingerprint. The side-neighbour labels also now use separators, avoiding ambiguity between multi-digit shape indices.

The regenerated [duplicates page](http://localhost:4200/#/plan/duplicates) covers the current 233 tutorials and eight groups sharing shape sets. Its old “Same design” label is now “Candidate match”. The page can compare any two current tutorials, including pairs outside those groups. Rounded shape measurements, sampled neighbourhoods and local frequency counts still cannot prove global sameness; confirm candidates with ink coverage over a common repeat.

## Navigation and storage checks

The production build passed 22 automated browser checks across desktop and phone Chromium viewports (`apps/player/e2e/places.spec.ts`). Each of the ten places opens at its own result address, retains its title through a share link, and saves and reloads a new design at its own place/design address. Each viewport also checks that all ten places are found by their own names in search. Clipboard stubs keep these checks inside isolated browser contexts without writing to the owner's storage or clipboard.

These identity checks cover newly created saved designs and links. Historical photo matching, colour resampling against every archived original, and a full provenance audit are not implied by the ink checks above. BUG.1 was separately reproduced in phone touch emulation and remains open for its own fix and real-device verification.

Final workspace lint, typechecking and tests passed, as did the production player build. Nx reported all 13 test tasks successful, with 10 reused from cache. All 466 whole-library known-equal comparisons passed; the two audit files and the ten-merge summary record hashes matching the final comparison implementation. Browser smoke checks confirmed same/different/inconclusive handling and all 14 review image links. See [implementation validation](ink-overlay-2026-11-14.md#validation) for commands, test-fixture stabilization and the explicitly deferred historical, colour, engine-equivalence and timing checks.

## Guidance for the next agents

Use piece shapes and local counts to find candidates, then compare the ink. A confirmed line match can support representing an already approved design as another place; incomplete or inconclusive coverage needs a marked picture and owner review. Preserve separate constructions when they are pedagogically important, even when their final lines agree. A Variations family and a computed “built from the same pieces” relationship should remain independent.

Before merging another tutorial, check the old address, search result, share link and saved design, as well as its attribution and original colours. A place must retain its own design source while clearly identifying which shared construction is being taught. `Place` currently has no separate historical-verification field; add one before showing per-building verification badges rather than inheriting the base building's status.

The next palette work should begin with the existing palette strips and the three proposed representative walls, then show candidates from the owner's liked rosettes. Keep that decision separate from repairing geometry. The stale start documents and queue still need the rewrite proposed in [the next steps](../NEXT-STEPS-2026-11-14.md); this review has not silently changed the product priorities.

## Owner decision, 15 November

The owner authorized proceeding with the recommendations. The Comares attribution correction in finding 3 is now applied locally, including removal of the obsolete step mapping. The ink evidence does not call for undoing any of the ten place merges. The new [visual follow-up](http://localhost:4200/#/notes/teaching-update) covers subsequent fixes and teaching investigations.
