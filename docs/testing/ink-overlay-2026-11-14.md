# Ink overlay: implementation and validation (14–15 November 2026)

Update, 15 November: the owner authorized the recommendations. Phone pinch zoom, region counts and the Comares credit are now fixed locally; physical phone confirmation remains open. [The visual follow-up](http://localhost:4200/#/notes/teaching-update) and [palette study](http://localhost:4200/#/plan/palettes) show the new work. The original audit evidence follows.

Prefer pictures? [Open the eight-slide research presentation](http://localhost:4200/#/notes/ink-presentation), covering the method, results, limits and proposed next steps.

The owner's ink-overlay comparison is available at [Compare the ink](http://localhost:4200/#/plan/duplicates). Run `pnpm dev` from the repository root if the server is not running. Choose two tutorials and press **Compare ink**. Shared lines are grey, lines only in A are blue, and lines only in B are orange. Each pattern has its own result-page link beside the controls.

The implementation is in `apps/player/src/review/inkComparison.ts`, with a dedicated worker and `InkOverlay.tsx`. It reads the construction's ink directly; it does not change tutorials, piece finding, the teaching engine, places or saved designs. The old detector's “Same design” label has been changed to “Candidate match”.

## First pairs checked

| Pair | A covered by B | B covered by A | Result |
| --- | --- | --- | --- |
| [Eight-fold star and cross](http://localhost:4200/#/eight-fold-star-and-cross/result) against itself | 100% | 100% | The same lines |
| [Paccard large rosette](http://localhost:4200/#/paccard-222-rosette/result) against its [ring version](http://localhost:4200/#/paccard-222-rosette-ring/result) | 82.49% | 82.56% | Different lines at the best tested placement |
| [Najjarin fountain](http://localhost:4200/#/fes-najjarin-rosette/result) against [Bou Inania, Meknes](http://localhost:4200/#/meknes-bou-inania-rosette/result) | 96.87% | 95.96% | Different lines at the best tested placement |

The Najjarin/Bou Inania overlay agrees across the central rosette and much of the surrounding pattern; differences remain around the corner motifs. Matching piece-type counts alone would not have exposed these lines. These results compare the current tutorial drawings, not their historical source photographs, and do not authorize a merge or a split.

Local screenshots, regenerated during browser checks, are available through the dev server: [Najjarin/Bou Inania](http://localhost:4200/__review/renders/ink-overlay/najjarin-bou-inania.png) and [Paccard pair](http://localhost:4200/__review/renders/ink-overlay/paccard-rosettes.png). They live under the existing ignored `docs/review/` directory.

## What the comparison establishes

Ink is normalized so A's supplied cell has area 1. Collinear overlapping or touching strokes are merged, then repeated and clipped geometrically. Opposite boundary lines are counted once. The distance tolerance is `0.000001` in these normalized units. Missing subsegments are retained; a percentage rounded for display never decides sameness.

The tool finds translation periods by testing shifts between genuine ends of maximal strokes, or crossings in continuous line networks, checks coverage in both directions, and chooses an independent lattice basis. Local stroke vectors prune impossible shifts before the expensive coverage checks. It checks that the resulting lattice index accounts for the detected period classes and reduces the basis using integer operations. Relative placements allow uniform scale, arbitrary relative rotation, translation, and a separately labelled reflection. The recorded placement maps separately normalized B into normalized A; raw tutorial coordinates require undoing each cell normalization as well. No shear or independent horizontal/vertical stretching is allowed.

Endpoint geometry removes placements that cannot be exact matches. All remaining exact candidates are checked, subject to explicit search limits. Up to 24 additional approximate candidates are tested to obtain a useful picture for different patterns. “Best tested placement” does not mean a mathematically optimal alignment over all possible translations of different designs.

“The same lines” means bidirectional ink coverage over the common periodic cell within the stated tolerance. “Different lines” means unmatched portions remain after checking the exact-match candidates. “Alignment inconclusive” means a common repeat or the required search could not be established; it is not a claim that the designs differ.

## Limits and remaining work

- The search is bounded: at most 2,000 period/basis/certification candidates and 40,000 input strokes per tiled patch. Collinear path fragments are joined before tiling. If a supplied supercell exceeds the discovery limits, up to four smaller half-periods are tried, each verified against the full supplied cell in both directions before reducing it. Degenerate walls without ends or crossings, strokes whose far ends are still clipped after expanding the neighbourhood from 3 to 5 to 7 cells across, unsupported lattices or larger searches return an explicit inconclusive result. Cancellation terminates the worker.
- A pair with different minimal lattice shapes currently returns inconclusive instead of inventing a shared scale or stretching one wall.
- This does not classify “the same arrangement at different proportions”; that still requires a separate comparison of how pieces meet.
- The candidate detector now counts neighbourhood occurrence density in units of the largest piece area, so supercells and uniform scale do not change its fingerprint. These local measurements remain a heuristic, as the page explains.
- The ten previous place merges have now been checked against archived ink and all ten agree fully in both directions. [The merge review](review-duplicates-2026-11-14.md) links every overlay and records the separate provenance concern. `tools/audit-ink-merges.mts` reproduces the audit without a checkout; the selectors show current tutorial files.
- Phone viewport checks verify layout, not a physical device. A separate Chromium touch-emulation check reproduced the owner's zoom bug: a pinch pans the wall without changing zoom, double tapping does nothing, and wheel zoom still works. BUG.1 in `docs/TASKS.md` now records that evidence and the camera handler gap; its fix remains separate.

## Validation

Geometry regressions cover arbitrary rotation and scale, an ink phase shift independent of the tile origin, two- and four-cell tiles, a diagonal two-cell lattice basis, reflection, split/reversed/duplicated strokes, a removed line, a tiny missing subsegment, rejection of shear, empty ink, clipped long strokes, continuous triangular grids and line-length union accounting. Real star-and-cross and star-and-hexagons tutorials are also compared with rotated and scaled copies. UI checks cover worker cancellation on a selection change, rejection of a stale reply, and inconclusive results without invented percentages.

A whole-library invariance audit now matches all 233 current tutorials against copies rotated 17°, uniformly scaled, and shifted in ink phase independently of the tile origin. The same audit also passes all 233 doubled-tile variants, for 466 known-equal comparisons with no false differences or inconclusive results. The audit script is `tools/audit-ink-invariance.mts` (add `--retile` for doubled tiles), with full results under `docs/review/ink-overlay/invariance.json` and `invariance-retiled.json`. The earlier seven inconclusive cases were resolved by expanding bounded neighbourhoods and using crossing anchors for continuous grids.

Chromium checks exercised the real worker on Najjarin/Bou Inania and a dense-rosette self-comparison, with no page errors. The layout was inspected at desktop and 390-pixel phone widths, with no horizontal overflow. Final workspace validation passed: `pnpm lint --parallel=1`, `pnpm typecheck --parallel=1`, and `pnpm test --maxWorkers=1`. Nx reported all 13 test tasks successful (10 reused from cache). The production player build also passed, followed by all 22 place-navigation browser checks across desktop and phone viewports. Final worker checks covered same, different and inconclusive results, and all 14 review images returned HTTP 200. The recorded comparison-source hashes match the final implementation for both whole-library audits and the ten-merge audit.

Unrelated test instability encountered during the full run was corrected in test fixtures: save/editor tests use small relevant libraries, the Studio rate-limit test fixes its clock, and image-size cases receive separate setup. Assertions and timeout limits were preserved; production Studio code was not changed. Existing lint warnings remain, but lint passes.

Historical photo matching, independent colour resampling, frozen-engine equivalence and performance timing were not run. The engine was unchanged, and the machine was running another project's eleven-worker job (load approximately 15), so timing would not provide a useful baseline. These deferred handover checks are not claimed complete.

## Visual presentation (15 November)

At the owner's request, the research is now presented as eight slides at [the visual walkthrough](http://localhost:4200/#/notes/ink-presentation), linked from Review, Project notes and the comparison tool. It moves from the original question through an interactive tracing demonstration, the ten merge results, the two rosette comparisons, confidence limits, recorded bugs and a proposed roadmap.

The drawings are measured vector results, not illustrative approximations. `tools/build-ink-presentation.mts` regenerates the display figures from the comparison code and archived merge audit; coordinates are rounded only for display. A/B/overlay/differences controls expose the actual matched and unmatched segments. The alignment slider is explicitly labelled as an illustration using an already matched drawing, rather than a live recalculation. The presentation uses tracked figures, so its pattern pictures do not depend on ignored local screenshots. No tutorial or drawing engine was changed for this presentation.

All eight slides and their primary interactions were checked in Chromium at 1280- and 390-pixel widths, without horizontal overflow or page errors. Desktop and phone captures are under `docs/review/ink-overlay/presentation-*.png`. The focused presentation/navigation tests passed. Final presentation validation passed: `pnpm lint --parallel=1`, `pnpm typecheck --parallel=1` and `pnpm test --maxWorkers=1`. Nx reported all 13 test tasks successful (11 reused from cache); the full player test task ran in 7 minutes 39 seconds.
