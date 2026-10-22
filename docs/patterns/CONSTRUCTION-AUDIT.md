# Pattern construction audit — 21 October 2026

This audit covers all **39 library tutorials** at base commit `1878913`. It answers where each teaching sequence came from, which parts were reconstructed, and how much evidence supports fidelity to published instructions. Findings are also stored in every tutorial’s `construction` metadata and shown under **How this construction was made** in the player. The report opens at `#/notes/construction-sources`; the review page links here.

## Summary

| Origin of the teaching sequence | Patterns |
| --- | ---: |
| Published instructions, with no independently reconstructed section large enough to change category | 11 |
| Published instructions combined with our reconstructed or designed additions | 9 |
| Finished drawings/photos, with the teaching sequence worked out here | 15 |
| App-developed studies | 3 |
| Standard construction with no particular sequence claimed | 1 |
| **Total** | **39** |

Of the **20** with an instructional component, **5** have recorded close correspondence, **11** have identifiable adaptations, and **4** cannot yet receive a complete fidelity verdict. The other **19** have no external step sequence to score. These are qualitative evidence categories, not percentages of correctness.

The largest reconstruction group is the Alhambra family. Nine Wichmann references are finished vector patterns, and six ALZADA references are completed tracings or a photograph on a shared grid. The published designs and grid methods are credited, but the numbered compass operations are ours. A source link or a list of credited app steps does not turn a finished drawing into a step-by-step source.

The clearest rejected attribution is **eight-fold-zellige**: the recorded review found it differs from Sandy Kurt’s wheel. It remains a separate app-developed study. **sixteen-fold-rosette** generalises that simpler rosette; its early comparison photo was later identified as twelve-fold Bou Inania. **ten-pointed-star-decagon-rect** is an app-developed rectangular study, not the Darb-e Imam spandrel.

Both **Bou Inania** tutorials are mixed. The rosette tutorial borrows only its central rosette method from Samira Mian; most surrounding lines come from @aslam’s finished drawing. The wall tutorial borrows only the 150° star-line idea and fits the rest to a photo. Neither is a fully published construction for the whole panel. Being exact ruler-and-compass geometry is compatible with having chosen the geometry to fit a finished picture.

Several repeat choices are ours: both **star-and-arrows** repeats and all three **Kurt wheel** repeats. The **star-and-hexagons** repeat deliberately corrects the handout. **minbar-doors-cairo** combines Mian’s geometry with photo-derived inking. **mian-stellated-hex** combines existing material for a challenge whose author explicitly provides hints rather than a full lesson.

## What was checked and what remains uncertain

I read all current tutorial credits, construction texts, ink/repeat definitions, relevant generators, tracked build/review logs and owner decisions. I inspected the locally saved primary-source HTML and extracted the text of the relevant PDFs. ALZADA’s printed page 45 was inspected as an image to distinguish its grid-family drawings from its separate numbered Partal example. Current khatam and star-and-octagon geometry was evaluated, rendered and inspected beside selected PDF drawings. Evidence paths below identify the exact material supporting each verdict; private research files remain private and were only read in the original worktree.

“Close” means the **earlier construction log or status record explicitly documents a source comparison**, and the current sequence remains consistent with that account. It is not a claim that this audit reran every old overlay. “Adapted” includes regrouped operations and deliberately changed repeats, as well as measured interpretations of unclear source drawings. “Unassessed” means an instructional origin is supported but a complete comparison of the current sequence, ink and repeat is missing. A plausible source match, a successful geometry test or a photo match alone cannot fill that gap.

No new full video review, image registration, whole-library pixel comparison or historical authentication was performed. In particular, the activity 8 video and the unreviewed activity 9 challenge do not receive an invented fidelity score. The two newer Sandy Kurt studies have identifiable source sequences, but their nine-step implementations still need registered comparisons across all stages before an exact-match claim is justified. Their rejected monument matches do **not** establish that they failed to follow the PDFs.

Existing historical verification and owner approval are preserved separately. Some old logs still say “abandoned” for tutorials later approved; later decisions in STATUS.md and the review page control whether they ship. Old `sources.md` files for khatam and star-and-octagon contain superseded exact-photo-match assertions. The old Bou Inania comparison overstates the published provenance of the full rosette tutorial, and its corner-only centerline measurement does not establish whole-wall accuracy or historical construction lineage.

## Findings for every pattern

The inventory below uses the exact library IDs. The detailed entries then give the source mapping, departures and evidence.

| Pattern | Origin | Fidelity to instructions |
| --- | --- | --- |
| [alhambra-arrayanes-squares](#/alhambra-arrayanes-squares) | Finished-design reconstruction | No external sequence to score |
| [alhambra-barca-stars](#/alhambra-barca-stars) | Finished-design reconstruction | No external sequence to score |
| [alhambra-bath-stars](#/alhambra-bath-stars) | Finished-design reconstruction | No external sequence to score |
| [alhambra-comares-bones](#/alhambra-comares-bones) | Finished-design reconstruction | No external sequence to score |
| [alhambra-comares-dado](#/alhambra-comares-dado) | Finished-design reconstruction | No external sequence to score |
| [alhambra-comares-frames](#/alhambra-comares-frames) | Finished-design reconstruction | No external sequence to score |
| [alhambra-comares-lattice](#/alhambra-comares-lattice) | Finished-design reconstruction | No external sequence to score |
| [alhambra-comares-stars](#/alhambra-comares-stars) | Finished-design reconstruction | No external sequence to score |
| [alhambra-infantas-crosses](#/alhambra-infantas-crosses) | Finished-design reconstruction | No external sequence to score |
| [alhambra-infantas-stars](#/alhambra-infantas-stars) | Finished-design reconstruction | No external sequence to score |
| [alhambra-leones-fret](#/alhambra-leones-fret) | Finished-design reconstruction | No external sequence to score |
| [alhambra-mexuar-stars](#/alhambra-mexuar-stars) | Finished-design reconstruction | No external sequence to score |
| [alhambra-reyes-dodecagrams](#/alhambra-reyes-dodecagrams) | Finished-design reconstruction | No external sequence to score |
| [alhambra-reyes-fret](#/alhambra-reyes-fret) | Finished-design reconstruction | No external sequence to score |
| [alhambra-reyes-stars](#/alhambra-reyes-stars) | Finished-design reconstruction | No external sequence to score |
| [alhambra-star-and-arrows](#/alhambra-star-and-arrows) | Instructions + our additions | Adapted; see departures |
| [alhambra-star-and-arrows-shifted](#/alhambra-star-and-arrows-shifted) | Instructions + our additions | Adapted; see departures |
| [bou-inania-rosette](#/bou-inania-rosette) | Instructions + our additions | Adapted; see departures |
| [bou-inania-twelve-fold-wall](#/bou-inania-twelve-fold-wall) | Instructions + our additions | Adapted; see departures |
| [eight-fold-khatam](#/eight-fold-khatam) | Instructions | Not fully assessed |
| [eight-fold-star-and-cross](#/eight-fold-star-and-cross) | Standard construction | No external sequence to score |
| [eight-fold-star-and-octagon](#/eight-fold-star-and-octagon) | Instructions | Not fully assessed |
| [eight-fold-zellige](#/eight-fold-zellige) | App-developed study | No external sequence to score |
| [four-fold-ring-of-circles](#/four-fold-ring-of-circles) | Instructions | Adapted; see departures |
| [ibn-tulun-window](#/ibn-tulun-window) | Instructions | Adapted; see departures |
| [kurt-eight-fold-zellige](#/kurt-eight-fold-zellige) | Instructions + our additions | Adapted; see departures |
| [kurt-eight-fold-zellige-filled](#/kurt-eight-fold-zellige-filled) | Instructions + our additions | Adapted; see departures |
| [kurt-eight-fold-zellige-shifted](#/kurt-eight-fold-zellige-shifted) | Instructions + our additions | Adapted; see departures |
| [mian-stellated-hex](#/mian-stellated-hex) | Instructions + our additions | Not fully assessed |
| [mian-stellated-rosettes](#/mian-stellated-rosettes) | Instructions | Not fully assessed |
| [minbar-doors-cairo](#/minbar-doors-cairo) | Instructions + our additions | Adapted; see departures |
| [six-fold-hammerhead](#/six-fold-hammerhead) | Instructions | Close, documented previously |
| [six-fold-snowflake](#/six-fold-snowflake) | Instructions | Close, documented previously |
| [six-fold-star-and-hexagons](#/six-fold-star-and-hexagons) | Instructions | Adapted; see departures |
| [sixteen-fold-rosette](#/sixteen-fold-rosette) | App-developed study | No external sequence to score |
| [ten-pointed-star-decagon-rect](#/ten-pointed-star-decagon-rect) | App-developed study | No external sequence to score |
| [twelve-fold-dodecagrams](#/twelve-fold-dodecagrams) | Instructions | Close, documented previously |
| [twelve-fold-rosette-mian](#/twelve-fold-rosette-mian) | Instructions | Close, documented previously |
| [twelve-fold-rosette-mian-hex](#/twelve-fold-rosette-mian-hex) | Instructions | Close, documented previously |

### alhambra-arrayanes-squares

**Origin:** Finished-design reconstruction. **Fidelity:** No external sequence to score.

The finished design was read from Brian Wichmann’s PG299 drawing. We devised the construction using the star from the drawing, with square size and pointed band ends taken from the photo. The reference does not supply this sequence of steps.

The photograph takes precedence over PG299: its squares are smaller and its band ends are pointed. The tutorial intentionally combines those proportions with Wichmann’s star.

**Source-to-app mapping and evidence limits.** PG299 is a vector picture of the completed pattern. The extraction pipeline reads polygon edges and band centrelines; the generator derives exact constructions afterwards. No numbered source-step map exists. The documented square half-side changes from about 0.77 in PG299 to 1/sqrt(2) in the photo, approximately 8% smaller.

**Evidence:** `tools/review/alhambra_wichmann/README.md`; `tools/review/alhambra_wichmann/gen_arrayanes_squares.py`; `tutorials/alhambra-arrayanes-squares.json`; `docs/patterns/STATUS.md`.

**Public references:** [Tiling Search, data8/PG299: Alhambra, Patio de los Arrayanes](https://tilingsearch.mit.edu/HTML/data8/PG299.html), [Photograph SPA 0111 (zellige dado, Patio de los Arrayanes)](https://patterninislamicart.com/).

### alhambra-barca-stars

**Origin:** Finished-design reconstruction. **Fidelity:** No external sequence to score.

The finished design was read from Brian Wichmann’s CM052 drawing. We devised the construction using the bath-star construction with changed corner squares. The reference does not supply this sequence of steps.

The app’s compass operations, step order and named intersections are our reconstruction. Recorded drawing and photo comparisons assess the finished line structure, not whether these were the historical construction steps.

**Source-to-app mapping and evidence limits.** CM052 is a vector picture of the completed pattern. The extraction pipeline reads polygon edges and band centrelines; the generator derives exact constructions afterwards. No numbered source-step map exists. The generator and its matching finish script are the executable record of our reconstruction.

**Evidence:** `tools/review/alhambra_wichmann/README.md`; `tools/review/alhambra_wichmann/gen_barca_stars.py`; `tutorials/alhambra-barca-stars.json`; `docs/patterns/STATUS.md`.

**Public references:** [Tiling Search, data15/CM052: Alhambra, Sala de la Barca](https://tilingsearch.mit.edu/HTML/data15/CM052.html), [Photograph SPA 1624x (Sala de la Barca)](https://patterninislamicart.com/).

### alhambra-bath-stars

**Origin:** Finished-design reconstruction. **Fidelity:** No external sequence to score.

The finished design was read from Brian Wichmann’s AL01 drawing. We devised the construction using large and small stars whose radii are fixed by two crossings. The reference does not supply this sequence of steps.

The app’s compass operations, step order and named intersections are our reconstruction. Recorded drawing and photo comparisons assess the finished line structure, not whether these were the historical construction steps.

**Source-to-app mapping and evidence limits.** AL01 is a vector picture of the completed pattern. The extraction pipeline reads polygon edges and band centrelines; the generator derives exact constructions afterwards. No numbered source-step map exists. The generator and its matching finish script are the executable record of our reconstruction.

**Evidence:** `tools/review/alhambra_wichmann/README.md`; `tools/review/alhambra_wichmann/gen_bath_stars.py`; `tutorials/alhambra-bath-stars.json`; `docs/patterns/STATUS.md`.

**Public references:** [Tiling Search, data182/AL01: Alhambra, Baño Real (Comares bath)](https://tilingsearch.mit.edu/HTML/data182/AL01.html), [Photograph MOR 0711 (carved wooden panel)](https://patterninislamicart.com/).

### alhambra-comares-bones

**Origin:** Finished-design reconstruction. **Fidelity:** No external sequence to score.

This uses Manuel Martínez Vela’s published grid method and the photograph of the bones panel with grid and diagonals overlaid in ALZADA 115, page 45. We read the outlines and supplied the compass construction and step grouping.

The article explains the shared grid and shows the completed tracing. It does not give this pattern’s numbered app sequence. Its separate nine-step Partal example is a different pattern. Source credits identify the design and method, not a verbatim sequence.

**Source-to-app mapping and evidence limits.** PDF page 2 (printed pages 44–45) contains the grid family; page 3 discusses other examples; page 4 supplies the numbered Partal lesson, which is not one of these tutorials. App steps construct the common grid before tracing read segments. The source photo establishes the bones panel, whereas adjacent Infantas tracings were initially mislabelled as that panel; the later correction is recorded in LESSONS.md.

**Evidence:** `docs/research/alhambra-star-and-arrows/patronato/alzada.pdf`; `tools/review/grid_tutorial.py`; `docs/patterns/QUEUE.md`; `tutorials/alhambra-comares-bones.json`.

**Public references:** [La Alhambra con regla y compás: el trazado de los diseños geométricos nazaríes (ALZADA 115, 2017)](https://www.riarte.es/handle/20.500.12251/633).

### alhambra-comares-dado

**Origin:** Finished-design reconstruction. **Fidelity:** No external sequence to score.

The finished design was read from Brian Wichmann’s J43A drawing. We devised the construction using a band size obtained from a line through a cell corner. The reference does not supply this sequence of steps.

The app’s compass operations, step order and named intersections are our reconstruction. Recorded drawing and photo comparisons assess the finished line structure, not whether these were the historical construction steps.

**Source-to-app mapping and evidence limits.** J43A is a vector picture of the completed pattern. The extraction pipeline reads polygon edges and band centrelines; the generator derives exact constructions afterwards. No numbered source-step map exists. The generator and its matching finish script are the executable record of our reconstruction.

**Evidence:** `tools/review/alhambra_wichmann/README.md`; `tools/review/alhambra_wichmann/gen_comares_dado.py`; `tutorials/alhambra-comares-dado.json`; `docs/patterns/STATUS.md`.

**Public references:** [Tiling Search, data5/J43A: Alhambra, Salón de Comares](https://tilingsearch.mit.edu/HTML/data5/J43A.html), [Photograph SPA 0204 (zellige dado of the Salón de Comares)](https://patterninislamicart.com/).

### alhambra-comares-frames

**Origin:** Finished-design reconstruction. **Fidelity:** No external sequence to score.

The finished design was read from Brian Wichmann’s SPA1416 drawing. We devised the construction using a star circle, a frame through the star’s corners, and small diamonds. The reference does not supply this sequence of steps.

The app’s compass operations, step order and named intersections are our reconstruction. Recorded drawing and photo comparisons assess the finished line structure, not whether these were the historical construction steps.

**Source-to-app mapping and evidence limits.** SPA1416 is a vector picture of the completed pattern. The extraction pipeline reads polygon edges and band centrelines; the generator derives exact constructions afterwards. No numbered source-step map exists. The generator and its matching finish script are the executable record of our reconstruction.

**Evidence:** `tools/review/alhambra_wichmann/README.md`; `tools/review/alhambra_wichmann/gen_comares_frames.py`; `tutorials/alhambra-comares-frames.json`; `docs/patterns/STATUS.md`.

**Public references:** [Tiling Search, data174/SPA1416: Alhambra, Salón de Comares](https://tilingsearch.mit.edu/HTML/data174/SPA1416.html), [Photograph SPA 1416 (zellige, Salón de Comares)](https://patterninislamicart.com/).

### alhambra-comares-lattice

**Origin:** Finished-design reconstruction. **Fidelity:** No external sequence to score.

This uses Manuel Martínez Vela’s published grid method and drawing 2 on the eight-pointed-star grid in ALZADA 115, page 45. We read the outlines and supplied the compass construction and step grouping.

The article explains the shared grid and shows the completed tracing. It does not give this pattern’s numbered app sequence. Its separate nine-step Partal example is a different pattern. Source credits identify the design and method, not a verbatim sequence.

**Source-to-app mapping and evidence limits.** PDF page 2 (printed pages 44–45) contains the grid family; page 3 discusses other examples; page 4 supplies the numbered Partal lesson, which is not one of these tutorials. App steps construct the common grid before tracing read segments. Existing credit step numbers refer to our source-derived material, not corresponding numbered instructions in the article.

**Evidence:** `docs/research/alhambra-star-and-arrows/patronato/alzada.pdf`; `tools/review/star_grid_tutorial.py`; `docs/patterns/QUEUE.md`; `tutorials/alhambra-comares-lattice.json`.

**Public references:** [La Alhambra con regla y compás: el trazado de los diseños geométricos nazaríes (ALZADA 115, 2017)](https://www.riarte.es/handle/20.500.12251/633).

### alhambra-comares-stars

**Origin:** Finished-design reconstruction. **Fidelity:** No external sequence to score.

This uses Manuel Martínez Vela’s published grid method and drawing 1 on the eight-pointed-star grid in ALZADA 115, page 45. We read the outlines and supplied the compass construction and step grouping.

The article explains the shared grid and shows the completed tracing. It does not give this pattern’s numbered app sequence. Its separate nine-step Partal example is a different pattern. Source credits identify the design and method, not a verbatim sequence.

**Source-to-app mapping and evidence limits.** PDF page 2 (printed pages 44–45) contains the grid family; page 3 discusses other examples; page 4 supplies the numbered Partal lesson, which is not one of these tutorials. App steps construct the common grid before tracing read segments. Existing credit step numbers refer to our source-derived material, not corresponding numbered instructions in the article.

**Evidence:** `docs/research/alhambra-star-and-arrows/patronato/alzada.pdf`; `tools/review/star_grid_tutorial.py`; `docs/patterns/QUEUE.md`; `tutorials/alhambra-comares-stars.json`.

**Public references:** [La Alhambra con regla y compás: el trazado de los diseños geométricos nazaríes (ALZADA 115, 2017)](https://www.riarte.es/handle/20.500.12251/633).

### alhambra-infantas-crosses

**Origin:** Finished-design reconstruction. **Fidelity:** No external sequence to score.

This uses Manuel Martínez Vela’s published grid method and the Infantas tile tracing on a square grid and diagonals in ALZADA 115, page 45. We read the outlines and supplied the compass construction and step grouping.

The article explains the shared grid and shows the completed tracing. It does not give this pattern’s numbered app sequence. Its separate nine-step Partal example is a different pattern. Source credits identify the design and method, not a verbatim sequence.

**Source-to-app mapping and evidence limits.** PDF page 2 (printed pages 44–45) contains the grid family; page 3 discusses other examples; page 4 supplies the numbered Partal lesson, which is not one of these tutorials. App steps construct the common grid before tracing read segments. Existing credit step numbers refer to our source-derived material, not corresponding numbered instructions in the article.

**Evidence:** `docs/research/alhambra-star-and-arrows/patronato/alzada.pdf`; `tools/review/grid_tutorial.py`; `docs/patterns/QUEUE.md`; `tutorials/alhambra-infantas-crosses.json`.

**Public references:** [La Alhambra con regla y compás: el trazado de los diseños geométricos nazaríes (ALZADA 115, 2017)](https://www.riarte.es/handle/20.500.12251/633).

### alhambra-infantas-stars

**Origin:** Finished-design reconstruction. **Fidelity:** No external sequence to score.

This uses Manuel Martínez Vela’s published grid method and the Infantas plaster tracing on a square grid and diagonals in ALZADA 115, page 45. We read the outlines and supplied the compass construction and step grouping.

The article explains the shared grid and shows the completed tracing. It does not give this pattern’s numbered app sequence. Its separate nine-step Partal example is a different pattern. Source credits identify the design and method, not a verbatim sequence.

**Source-to-app mapping and evidence limits.** PDF page 2 (printed pages 44–45) contains the grid family; page 3 discusses other examples; page 4 supplies the numbered Partal lesson, which is not one of these tutorials. App steps construct the common grid before tracing read segments. Existing credit step numbers refer to our source-derived material, not corresponding numbered instructions in the article.

**Evidence:** `docs/research/alhambra-star-and-arrows/patronato/alzada.pdf`; `tools/review/grid_tutorial.py`; `docs/patterns/QUEUE.md`; `tutorials/alhambra-infantas-stars.json`.

**Public references:** [La Alhambra con regla y compás: el trazado de los diseños geométricos nazaríes (ALZADA 115, 2017)](https://www.riarte.es/handle/20.500.12251/633).

### alhambra-leones-fret

**Origin:** Finished-design reconstruction. **Fidelity:** No external sequence to score.

The finished design was read from Brian Wichmann’s C55 drawing. We devised the construction using frets on the grid diagonals and a star radius found by a single line. The reference does not supply this sequence of steps.

The app’s compass operations, step order and named intersections are our reconstruction. Recorded drawing and photo comparisons assess the finished line structure, not whether these were the historical construction steps.

**Source-to-app mapping and evidence limits.** C55 is a vector picture of the completed pattern. The extraction pipeline reads polygon edges and band centrelines; the generator derives exact constructions afterwards. No numbered source-step map exists. The generator and its matching finish script are the executable record of our reconstruction.

**Evidence:** `tools/review/alhambra_wichmann/README.md`; `tools/review/alhambra_wichmann/gen_leones_fret.py`; `tutorials/alhambra-leones-fret.json`; `docs/patterns/STATUS.md`.

**Public references:** [Tiling Search, data18/C55: Alhambra, Patio de los Leones](https://tilingsearch.mit.edu/HTML/data18/C55.html), [Photograph SPA 0218 (carved panel, Patio de los Leones)](https://patterninislamicart.com/).

### alhambra-mexuar-stars

**Origin:** Finished-design reconstruction. **Fidelity:** No external sequence to score.

This uses Manuel Martínez Vela’s published grid method and drawing 3 on the eight-pointed-star grid in ALZADA 115, page 45. We read the outlines and supplied the compass construction and step grouping.

The article explains the shared grid and shows the completed tracing. It does not give this pattern’s numbered app sequence. Its separate nine-step Partal example is a different pattern. Source credits identify the design and method, not a verbatim sequence.

**Source-to-app mapping and evidence limits.** PDF page 2 (printed pages 44–45) contains the grid family; page 3 discusses other examples; page 4 supplies the numbered Partal lesson, which is not one of these tutorials. App steps construct the common grid before tracing read segments. Existing credit step numbers refer to our source-derived material, not corresponding numbered instructions in the article.

**Evidence:** `docs/research/alhambra-star-and-arrows/patronato/alzada.pdf`; `tools/review/star_grid_tutorial.py`; `docs/patterns/QUEUE.md`; `tutorials/alhambra-mexuar-stars.json`.

**Public references:** [La Alhambra con regla y compás: el trazado de los diseños geométricos nazaríes (ALZADA 115, 2017)](https://www.riarte.es/handle/20.500.12251/633).

### alhambra-reyes-dodecagrams

**Origin:** Finished-design reconstruction. **Fidelity:** No external sequence to score.

The finished design was read from Brian Wichmann’s P069 drawing. We devised the construction using twelve tangents round each star and a hexagonal repeat. The reference does not supply this sequence of steps.

The app’s compass operations, step order and named intersections are our reconstruction. Recorded drawing and photo comparisons assess the finished line structure, not whether these were the historical construction steps.

**Source-to-app mapping and evidence limits.** P069 is a vector picture of the completed pattern. The extraction pipeline reads polygon edges and band centrelines; the generator derives exact constructions afterwards. No numbered source-step map exists. The generator and its matching finish script are the executable record of our reconstruction.

**Evidence:** `tools/review/alhambra_wichmann/README.md`; `tools/review/alhambra_wichmann/gen_reyes_dodecagram.py`; `tutorials/alhambra-reyes-dodecagrams.json`; `docs/patterns/STATUS.md`.

**Public references:** [Tiling Search, data177/P069: Alhambra, Sala de los Reyes](https://tilingsearch.mit.edu/HTML/data177/P069.html), [Photograph SPA 1908 (zellige, Sala de los Reyes)](https://patterninislamicart.com/).

### alhambra-reyes-fret

**Origin:** Finished-design reconstruction. **Fidelity:** No external sequence to score.

The finished design was read from Brian Wichmann’s PG365 drawing. We devised the construction using sixths of the grid unit and compass-built small diamonds, preserving the pinwheel’s handedness. The reference does not supply this sequence of steps.

The app’s compass operations, step order and named intersections are our reconstruction. Recorded drawing and photo comparisons assess the finished line structure, not whether these were the historical construction steps.

**Source-to-app mapping and evidence limits.** PG365 is a vector picture of the completed pattern. The extraction pipeline reads polygon edges and band centrelines; the generator derives exact constructions afterwards. No numbered source-step map exists. The generator and its matching finish script are the executable record of our reconstruction.

**Evidence:** `tools/review/alhambra_wichmann/README.md`; `tools/review/alhambra_wichmann/gen_reyes_fret.py`; `tutorials/alhambra-reyes-fret.json`; `docs/patterns/STATUS.md`.

**Public references:** [Tiling Search, data8/PG365: Alhambra, Sala de los Reyes](https://tilingsearch.mit.edu/HTML/data8/PG365.html), [Photograph SPA 0405x (carved plaster, Sala de los Reyes)](https://patterninislamicart.com/).

### alhambra-reyes-stars

**Origin:** Finished-design reconstruction. **Fidelity:** No external sequence to score.

The finished design was read from Brian Wichmann’s M060 drawing. We devised the construction using stars at grid points and compass-built notches in the crosses. The reference does not supply this sequence of steps.

The app’s compass operations, step order and named intersections are our reconstruction. Recorded drawing and photo comparisons assess the finished line structure, not whether these were the historical construction steps.

**Source-to-app mapping and evidence limits.** M060 is a vector picture of the completed pattern. The extraction pipeline reads polygon edges and band centrelines; the generator derives exact constructions afterwards. No numbered source-step map exists. The generator and its matching finish script are the executable record of our reconstruction.

**Evidence:** `tools/review/alhambra_wichmann/README.md`; `tools/review/alhambra_wichmann/gen_reyes_stars.py`; `tutorials/alhambra-reyes-stars.json`; `docs/patterns/STATUS.md`.

**Public references:** [Tiling Search, data9/M060: Alhambra, Sala de los Reyes](https://tilingsearch.mit.edu/HTML/data9/M060.html), [Photograph SPA 0408x (zellige of the Sala de los Reyes)](https://patterninislamicart.com/).

### alhambra-star-and-arrows

**Origin:** Instructions + our additions. **Fidelity:** Adapted; see departures.

The rosette follows Mamoot’s Alhambra lesson. The build log records first-try step matches and an exact overlay of the final motif.

Repeating it in square grid is our addition. The source shows one ceiling rosette, and neither a historical wall with this repeat nor the surrounding ceiling band network was established.

**Source-to-app mapping and evidence limits.** App 1–6 expand the standard four-fold base; app 7–9 follow source 4–7 (small circle, eight-point star, extended lines); ink follows source 8. The square cell is our repeat choice. The old abandoned note predates the owner’s approval.

**Evidence:** `docs/patterns/alhambra-star-and-arrows.md`; `docs/research/alhambra-star-and-arrows/rosette.html`; `tutorials/alhambra-star-and-arrows.json`; `docs/patterns/STATUS.md`.

**Public references:** [Islamic Geometry: A Rosette Tile from The Alhambra](https://mamootdiy.com/2021/02/01/islamic-geometry-rosette-tile-from-the-alhambra/).

### alhambra-star-and-arrows-shifted

**Origin:** Instructions + our additions. **Fidelity:** Adapted; see departures.

The rosette follows Mamoot’s Alhambra lesson. The build log records first-try step matches and an exact overlay of the final motif.

Repeating it in half-shifted rows is our addition. The source shows one ceiling rosette, and neither a historical wall with this repeat nor the surrounding ceiling band network was established.

**Source-to-app mapping and evidence limits.** App 1–6 expand the standard four-fold base; app 7–9 follow source 4–7 (small circle, eight-point star, extended lines); ink follows source 8. App 10 constructs the half-shifted repeat. The old abandoned note predates the owner’s approval.

**Evidence:** `docs/patterns/alhambra-star-and-arrows.md`; `docs/research/alhambra-star-and-arrows/rosette.html`; `tutorials/alhambra-star-and-arrows-shifted.json`; `docs/patterns/STATUS.md`.

**Public references:** [Islamic Geometry: A Rosette Tile from The Alhambra](https://mamootdiy.com/2021/02/01/islamic-geometry-rosette-tile-from-the-alhambra/).

### bou-inania-rosette

**Origin:** Instructions + our additions. **Fidelity:** Adapted; see departures.

Only the central rosette method is taken from Samira Mian. Most of the surrounding construction was worked out from @aslam.geometricpatterns’ finished drawing.

The construction is not a published step-by-step method for the whole Bou Inania panel. The shield band is omitted, joining shields to neighbouring dark pieces. The overlapping repeat and corner-star details were reconstructed, then simplified.

**Source-to-app mapping and evidence limits.** Mian’s credit covers current steps 5–6 only (inner circle and 150° star lines). The drawing credit explicitly says every line beyond the rosette was read from the image. The old comparison’s description of the entire tutorial as a published method is too broad. Final-ink cleanup and 1,840→465 element simplification do not establish historical construction lineage.

**Evidence:** `tools/review/bou_inania_v2/README.md`; `tools/review/bou_inania_v2/gen_bou_inania_v2.py`; `docs/patterns/STATUS.md`; `docs/patterns/bou-inania-tutorials-comparison.md`.

**Public references:** [Twelvefold Islamic Geometric Rosette (online tutorial)](https://www.samiramian.uk/twelvefoldrosette), [Drawing of the Bou Inania pattern](https://www.instagram.com/aslam.geometricpatterns/), [Zellige of the Bou Inania madrasa, Fès (photograph, Wikimedia Commons)](https://commons.wikimedia.org/wiki/File:Bou_inania_DSCF2978.jpg).

### bou-inania-twelve-fold-wall

**Origin:** Instructions + our additions. **Fidelity:** Adapted; see departures.

Most line distances were fitted to a photograph of the Bou Inania wall, then expressed as exact ruler and compass operations. Only the 150° star-line idea in step 4 is credited to Samira Mian.

This is our fitted reconstruction. Exact crossings do not establish the original craftsman’s method. The outer-tip compass move was chosen to match the fit; the rim is a nearby exact substitute. The corner ring was corrected to four axis and four bent pieces.

**Source-to-app mapping and evidence limits.** Current 18-step sequence matches the simplified-construction account: step 4 borrows star lines; step 6 deliberately targets the fitted tip; step 14 uses the hexagon-derived rim; steps 15–17 reconstruct the corner cluster. The report’s ~2% corner-region distance is not a whole-wall fidelity score; it used estimated spacing without perspective correction. Do not rank source reliability from that difference.

**Evidence:** `docs/patterns/bou-inania-wall-simple-construction.md`; `docs/patterns/bou-inania-wall-review-2026-10-09.md`; `tools/review/bou_inania/gen_design_e.py`; `docs/patterns/bou-inania-centerline-verification.md`.

**Public references:** [Twelvefold Islamic Geometric Rosette (online tutorial)](https://www.samiramian.uk/twelvefoldrosette), [Bou Inania madrasa, Fès: zellij tiling in the entrance stairway (photograph, Wikimedia Commons)](https://commons.wikimedia.org/wiki/File:Bou_inania_DSCF2978.jpg).

### eight-fold-khatam

**Origin:** Instructions. **Fidelity:** Not fully assessed.

The generator and credits identify Sandy Kurt’s Al-Hakim Mosque PDF. The current sequence uses its squares and small-circle construction, regrouped into nine app steps.

The saved PDF was read and selected drawings compared during this audit, but a complete comparison of every current step, ink segment and repeat is not established. Earlier exact monument-match claims were rejected; that does not by itself show whether the PDF was followed accurately.

**Source-to-app mapping and evidence limits.** PDF 1 expands to app 1–5; PDF 2–3 establish the small circles in app 6; PDF 4–10 supply the side-line families grouped into app 7–8; PDF 11–12 supply facets in app 9; PDF 13–14 trace and tile. Current small-circle centres are the dynamic square’s diagonal midpoints, radius OA/2. Fresh current ink renders were examined beside PDF highlight pages (Hakim page 14 / Itimad page 9); this was a qualitative spot check, not a registered overlay. No numerical fidelity claim is supported. The private sources.md files still contain superseded exact-photo-match assertions.

**Evidence:** `docs/research/four-fold-model/kurt/hakim.pdf`; `tools/review/gen_hakim.py`; `docs/testing/review-decisions-2026-10-11.md`; `apps/player/src/review/data.ts`.

**Public references:** [4fold Pattern from Al-Hakim Mosque, Isfahan](https://sandykurt.com/free-tutorials).

### eight-fold-star-and-cross

**Origin:** Standard construction. **Fidelity:** No external sequence to score.

This is the standard eight-pointed star made from two squares in a circle, repeated on a tangent square. No specific published teaching sequence is claimed.

The Kashan tile photograph was used to check the finished pattern. It is a historical reference, not a set of construction instructions.

**Source-to-app mapping and evidence limits.** Six app steps build the circle, axes, diagonals, two squares and tile. Empty credits are consistent with the recorded general-knowledge construction; they are not proof that the pattern was guessed from the photo.

**Evidence:** `tutorials/eight-fold-star-and-cross.json`; `docs/research/eight-fold-star-and-cross/sources.md`; `docs/OVERNIGHT.md`.

### eight-fold-star-and-octagon

**Origin:** Instructions. **Fidelity:** Not fully assessed.

The generator and credits identify Sandy Kurt’s Tomb of Itimud ad-Daula PDF. The current sequence uses its squares and small-circle construction, regrouped into nine app steps.

The saved PDF was read and selected drawings compared during this audit, but a complete comparison of every current step, ink segment and repeat is not established. Earlier exact monument-match claims were rejected; that does not by itself show whether the PDF was followed accurately.

**Source-to-app mapping and evidence limits.** PDF 1 expands to app 1–3; PDF 2 to app 4–5; PDF 3 to app 6; PDF 4–7 draw small-square sides represented partially/grouped in app 7–9; PDF 8–9 trace and tile. App 9 explicitly selects the inward intersections on the outer circles. Fresh current ink renders were examined beside PDF highlight pages (Hakim page 14 / Itimad page 9); this was a qualitative spot check, not a registered overlay. No numerical fidelity claim is supported. The private sources.md files still contain superseded exact-photo-match assertions.

**Evidence:** `docs/research/four-fold-model/kurt/itimad.pdf`; `tools/review/gen_itimad.py`; `docs/testing/review-decisions-2026-10-11.md`; `apps/player/src/review/data.ts`.

**Public references:** [4fold Pattern from the Tomb of Itimud ad-Daula](https://sandykurt.com/free-tutorials).

### eight-fold-zellige

**Origin:** App-developed study. **Fidelity:** No external sequence to score.

This simpler rosette was worked out for Tastir. An earlier attempt associated it with the text of Sandy Kurt’s zellige PDF, but the recorded drawing comparison found a different design.

It must not be described as following Kurt’s wheel instructions. The owner kept it as a separate construction study. A matching historical panel has not been established.

**Source-to-app mapping and evidence limits.** App 5–10 build an octagon-based rosette using a compass transfer at its corners, star lines and parallel petal sides; app 11 extends the corner lines. The recorded review explicitly rejects the earlier attribution to Kurt’s richer wheel. This is not proof of novelty: “original” here means an app-developed sequence.

**Evidence:** `git commit 23639a9`; `apps/player/src/review/data.ts (Design D)`; `docs/OVERNIGHT.md`; `tutorials/eight-fold-zellige.json`.

### four-fold-ring-of-circles

**Origin:** Instructions. **Fidelity:** Adapted; see departures.

The ring circles, squares and ink follow Sandy Kurt’s 4fold Pattern Tutorial. The work log records an exact final-ink overlay.

The app groups the square sides by direction and draws shared long lines once. The current 12 steps are not the PDF’s 12 numbered operations; later simplification also removed intermediate mark points. No monument match is established.

**Source-to-app mapping and evidence limits.** PDF 1–2 divide the circle and draw the squares; 3–4 establish the ring circles; 5–6 divide them; 7 onward draw their square sides. Current app 7 supplies the circle family, 8 its directions, 9–12 the four side directions. Credit steps [7,8,9,10] omit current sourced steps 11–12; extend that range. The old abandoned log predates approval.

**Evidence:** `docs/patterns/four-fold-ring-of-circles.md`; `docs/research/four-fold-model/kurt/4fold.pdf`; `tools/review/gen_four_fold_ring.py`; `docs/patterns/STATUS.md`.

**Public references:** [4fold Pattern Tutorial](https://sandykurt.com/free-tutorials).

### ibn-tulun-window

**Origin:** Instructions. **Fidelity:** Adapted; see departures.

The sequence follows Mamoot’s Ibn Tulun window lesson: triangles, three squares, twelve-pointed star, fish and two bending stars. The work log records an exact final-ink overlay.

The source does not fully specify the fish and bending-star endpoints in words. Those details were measured from its step drawings and expressed as exact crossings and parallel lines. We use its clover repeat.

**Source-to-app mapping and evidence limits.** App 1–5 expand source 1 and the hexagon of source 2; app 6 completes source 2’s triangles; app 7 = source 3’s squares; app 8 = source 4’s star; app 9 interprets source 5’s fish; app 10 combines source 6–8’s diagonals and bending stars; ink = source 9. Thus ambiguous endpoints were reconstructed within a published sequence.

**Evidence:** `docs/patterns/ibn-tulun-window.md`; `docs/research/ibn-tulun-window/mamoot-tulun.html`.

**Public references:** [Islamic Geometry: A Window from Ibn Tulun Masjid](https://mamootdiy.com/2020/12/21/islamic-geometry-a-window-from-ibn-tulun-masjid/).

### kurt-eight-fold-zellige

**Origin:** Instructions + our additions. **Fidelity:** Adapted; see departures.

The wheel follows Sandy Kurt’s 8fold Zellige PDF. Its circles, octagons and central rosette are sourced; the final ink was read from her finished drawing.

We added an edge-to-edge square repeat. The PDF teaches one wheel. The app splits, combines and reorders its operations, so its step numbers are not the PDF’s. The repeat is not presented as a historical reconstruction.

**Source-to-app mapping and evidence limits.** PDF 1–3 correspond to app 1–5; PDF 4–5 to app 6; 6–7 to app 7; 8 to app 8; 9–10 to app 9; 11–12 to app 10; 13 to app 11; 14–16 to app 12–15; 17 to app 16; 19 to app 17. PDF 18 is the final tracing, represented by app ink. App 18 onward constructs our repeat. The filled version adds cross-filling at app 19. A full fresh image overlay was not performed.

**Evidence:** `docs/research/eight-fold-zellige/kurt-8fold_zellige.pdf`; `tools/review/kurt8/gen_kurt_zellige.py`; `tools/review/kurt8/gen_filled.py`; `apps/player/src/review/data.ts`; `docs/patterns/STATUS.md`.

**Public references:** [8fold Zellige (free PDF tutorial)](https://sandykurt.com/free-tutorials).

### kurt-eight-fold-zellige-filled

**Origin:** Instructions + our additions. **Fidelity:** Adapted; see departures.

The wheel follows Sandy Kurt’s 8fold Zellige PDF. Its circles, octagons and central rosette are sourced; the final ink was read from her finished drawing.

We added an overlapping square repeat and extra lines filling the remaining cross. The PDF teaches one wheel. The app splits, combines and reorders its operations, so its step numbers are not the PDF’s. The repeat is not presented as a historical reconstruction.

**Source-to-app mapping and evidence limits.** PDF 1–3 correspond to app 1–5; PDF 4–5 to app 6; 6–7 to app 7; 8 to app 8; 9–10 to app 9; 11–12 to app 10; 13 to app 11; 14–16 to app 12–15; 17 to app 16; 19 to app 17. PDF 18 is the final tracing, represented by app ink. App 18 onward constructs our repeat. The filled version adds cross-filling at app 19. A full fresh image overlay was not performed.

**Evidence:** `docs/research/eight-fold-zellige/kurt-8fold_zellige.pdf`; `tools/review/kurt8/gen_kurt_zellige.py`; `tools/review/kurt8/gen_filled.py`; `apps/player/src/review/data.ts`; `docs/patterns/STATUS.md`.

**Public references:** [8fold Zellige (free PDF tutorial)](https://sandykurt.com/free-tutorials).

### kurt-eight-fold-zellige-shifted

**Origin:** Instructions + our additions. **Fidelity:** Adapted; see departures.

The wheel follows Sandy Kurt’s 8fold Zellige PDF. Its circles, octagons and central rosette are sourced; the final ink was read from her finished drawing.

We added a shifted repeat, later represented by a hexagon. The PDF teaches one wheel. The app splits, combines and reorders its operations, so its step numbers are not the PDF’s. The repeat is not presented as a historical reconstruction.

**Source-to-app mapping and evidence limits.** PDF 1–3 correspond to app 1–5; PDF 4–5 to app 6; 6–7 to app 7; 8 to app 8; 9–10 to app 9; 11–12 to app 10; 13 to app 11; 14–16 to app 12–15; 17 to app 16; 19 to app 17. PDF 18 is the final tracing, represented by app ink. App 18 onward constructs our repeat. The filled version adds cross-filling at app 19. A full fresh image overlay was not performed.

**Evidence:** `docs/research/eight-fold-zellige/kurt-8fold_zellige.pdf`; `tools/review/kurt8/gen_kurt_zellige.py`; `tools/review/kurt8/gen_filled.py`; `apps/player/src/review/data.ts`; `docs/patterns/STATUS.md`.

**Public references:** [8fold Zellige (free PDF tutorial)](https://sandykurt.com/free-tutorials).

### mian-stellated-hex

**Origin:** Instructions + our additions. **Fidelity:** Not fully assessed.

This combines Samira Mian’s stellated rosette with a hexagonal tile. Her activity 9 is an independent challenge with hints and pictures, not a complete step-by-step lesson.

The app supplies its own combined 10-step sequence. The saved source page explicitly asks for independent construction. Neither a full comparison with the challenge drawings nor a matching historical wall is documented.

**Source-to-app mapping and evidence limits.** App 1–8 reuse the square stellated motif’s construction; 9 uses a tangent hexagon; 10 marks ink endpoints. Source activity 9 hints specify twelve divisions, two hexagons, then 24 divisions and the proportioning line/circle. The app combines these ideas rather than following a supplied full sequence. The al-Maridani photo credit corroborates the motif, not this hexagonal wall.

**Evidence:** `docs/research/mian-rosette/page.html`; `tools/review/mian_stellated/gen_mian_stellated_hex.py`; `docs/patterns/STATUS.md`; `git commit d2c1599`.

**Public references:** [Twelvefold Islamic Geometric Rosette, activity 9: stellated rosettes in a hexagonal arrangement (challenge)](https://www.samiramian.uk/twelvefoldrosette), [Lantern slide of the minbar of the al-Maridani mosque, Cairo (14th century): detail of the wooden panelling (Wikimedia Commons, GDE002950)](https://commons.wikimedia.org/wiki/File:Ca%C3%AFro._Amir_al-Maridani-moskee_Minbar_Detail_van_het_houten_maaswerk,_GDE002950.jpg).

### mian-stellated-rosettes

**Origin:** Instructions. **Fidelity:** Not fully assessed.

The credits say the construction follows activity 8 of Samira Mian’s lesson step by step. The generators and saved reference pictures support that origin; the finished pattern also has recorded photo comparisons.

App steps 9–11 build the corner hexagons and octagon, and 12–13 mark endpoints and the tile. A complete comparison of these 13 current steps with the activity 8 video is still needed; matching the minbar does not prove the sequence matches.

**Source-to-app mapping and evidence limits.** App 1–8 build the stellated rosette (two extended hexagons, 24 divisions, proportioning circle, 150° lines); 9–11 fill the square corners; 12–13 finish. All are credited. Activity 8 is video based; no full source-step comparison log was found. QUEUE.md records an earlier 97.8% ink match to one source frame; that is useful partial evidence, not a score for the complete sequence. H1’s inlay measurements assess the result, not instruction fidelity.

**Evidence:** `tools/review/mian_stellated/gen_mian_stellated.py`; `tools/review/design_h/README.md`; `docs/research/mian-rosette/page.html`; `docs/patterns/STATUS.md`.

**Public references:** [Twelvefold Islamic Geometric Rosette, activity 8: stellated rosettes in a square arrangement (video)](https://www.samiramian.uk/twelvefoldrosette), [Lantern slide of the minbar of the al-Maridani mosque, Cairo (14th century): detail of the wooden panelling (Wikimedia Commons, GDE002950)](https://commons.wikimedia.org/wiki/File:Ca%C3%AFro._Amir_al-Maridani-moskee_Minbar_Detail_van_het_houten_maaswerk,_GDE002950.jpg), [Photograph of the minbar of the mosque of al-Nasir Muhammad, Cairo Citadel (1318–35), by Sailko (Wikimedia Commons, CC BY 3.0)](https://commons.wikimedia.org/wiki/File:Cairo,_cittadella,_moschea_di_an-nasr_mohammed,_1318-1335,_minbar,_intarsi.JPG).

### minbar-doors-cairo

**Origin:** Instructions + our additions. **Fidelity:** Adapted; see departures.

The inner circle, twelve star lines and hexagonal tile use Samira Mian’s method. The actual lines to ink were reconstructed from the Met’s photograph of the minbar doors.

The rosette is inked differently from the plain Mian tutorial to reproduce the doors: small star, kites, flat-ended shields and triangles between rosettes. A measured finished-design match is recorded; there is no published sequence for the entire door pattern.

**Source-to-app mapping and evidence limits.** Mian’s credit covers app 1–8; app 9 draws all twelve tangents, 10 names endpoints, 11 selects the hexagonal tile. The museum photo supplies the ink, not construction instructions. Distinguish the borrowed core from the reconstructed result.

**Evidence:** `tools/review/design_h2/README.md`; `tools/review/design_h2/gen_minbar_doors.py`; `docs/patterns/STATUS.md`.

**Public references:** [Twelvefold Islamic Geometric Rosette (online tutorial)](https://www.samiramian.uk/twelvefoldrosette), [Pair of Minbar Doors, Egypt, probably Cairo, ca. 1325–30 (The Metropolitan Museum of Art, 91.1.2064, public domain photo)](https://www.metmuseum.org/art/collection/search/444812).

### six-fold-hammerhead

**Origin:** Instructions. **Fidelity:** Close, documented previously.

The motif and inking follow Mamoot’s Hammerhead instructions. The work log records source-step comparisons and an ink overlay.

Where the source’s size note disagrees with its written construction, we follow the written construction and drawing. Of the source’s two repeats, we use the one matching the Alcázar reference.

**Source-to-app mapping and evidence limits.** App 1–4 expand the foundation and mirror lines; app 5 builds the two hexagons; app 6 joins crossings three places apart; app 7 finds the small star on petal arcs. Recorded measurement supports star-line distance 0.125 OA rather than the conflicting note’s 0.134 OA. These are earlier measurements, not new audit measurements.

**Evidence:** `docs/patterns/six-fold-hammerhead.md`; `docs/research/six-fold-hammerhead/mamootdiy.html`.

**Public references:** [Islamic Geometry: Six-Fold Hammerhead Pattern](https://mamootdiy.com/2020/12/19/islamic-geometry-six-fold-hammerhead-pattern/).

### six-fold-snowflake

**Origin:** Instructions. **Fidelity:** Close, documented previously.

The motif and inking follow Mamoot’s numbered Snowflake instructions. The original work log records step comparisons and a corrected small star that matches the source’s lines.

The six-fold foundation is expanded into several app steps. The repeat uses the source’s hexagon. The current written sequence was checked against the saved page; the earlier image overlay has not been rerun.

**Source-to-app mapping and evidence limits.** App 1–3 = source foundation; app 4–6 = source 2–4; app 7–8 = source 5–6; ink = source 7–8. A first extra set of small-star triangles was removed in the recorded build.

**Evidence:** `docs/patterns/six-fold-snowflake.md`; `docs/research/six-fold-snowflake/mamoot-snowflake.html`.

**Public references:** [Islamic Geometry: A Six-Fold “Snowflake”](https://mamootdiy.com/2022/04/06/islamic-geometry-a-six-fold-snowflake/).

### six-fold-star-and-hexagons

**Origin:** Instructions. **Fidelity:** Adapted; see departures.

The triangles, hexagon and channel lines follow Charlotte Webb’s ATM handout. The work log records first-try matches of those drawings and the final motif.

App step 7 replaces the handout’s suggested large-hexagon repeat with a smaller hexagon. This is an intentional correction made to match the tilework photo, so the complete lesson is an adaptation.

**Source-to-app mapping and evidence limits.** App 4–6 = handout’s three six-fold construction pictures (PDF pages 12–13). App 1–3 supply the foundation. App 7 is our replacement repeat; Kaplan corroborates the intended hexagon arrangement rather than providing this sequence.

**Evidence:** `docs/patterns/six-fold-star-and-hexagons.md`; `docs/research/six-fold-star-and-hexagons/atm-handout.pdf`.

**Public references:** [Art in the Mathematics Classroom: Islamic Geometry (ATM conference handout)](https://atm.org.uk/write/MediaUploads/Conference/2019%20Conference/Speakers/Art_in_the_Mathematics_classroom.pdf), [Computer Graphics and Geometric Ornamental Design, chapter 3](https://cs.uwaterloo.ca/~csk/other/phd/kaplan_diss_starpatterns_print.pdf).

### sixteen-fold-rosette

**Origin:** App-developed study. **Fidelity:** No external sequence to score.

This was developed by extending Tastir’s simpler eight-fold rosette to sixteen divisions. The creation commit describes that generalisation; no published sequence is credited.

It is a construction study, not a reconstruction of the Bou Inania wall. The photographed Bou Inania rosette used in the early comparison was later identified as twelve-fold, and its surrounding network differs substantially.

**Source-to-app mapping and evidence limits.** App 5 divides into sixteen; 6–7 find polygon corners and transfer the side-half length; 8 joins every seventh inner mark; 9–10 form petals. Earlier comparisons wrongly called the Bou Inania reference sixteen-fold; do not repeat that identification. No claim of newly inventing the general rosette method is made.

**Evidence:** `git commit 4938dda`; `apps/player/src/review/data.ts (Design F and correction)`; `docs/OVERNIGHT.md`; `tutorials/sixteen-fold-rosette.json`.

### ten-pointed-star-decagon-rect

**Origin:** App-developed study. **Fidelity:** No external sequence to score.

This is Tastir’s rectangular ten-fold study, built from the standard decagon construction. Its only construction credit names Tastir.

The rectangular repeat is not a reconstruction of the Darb-e Imam spandrel. No external step-by-step source or matching historical panel is established for this complete design.

**Source-to-app mapping and evidence limits.** Current app has 9 steps, not the 10 listed in STATUS.md: golden-ratio chord construction, ten divisions, every-third-point star, decagon, rectangular cell, inner crossings. Its existing historical-unverified label is correct. Empty external sourcing does not invalidate the underlying standard decagon construction.

**Evidence:** `tutorials/ten-pointed-star-decagon-rect.json`; `docs/testing/review-decisions-2026-10-11.md`; `docs/patterns/STATUS.md`.

### twelve-fold-dodecagrams

**Origin:** Instructions. **Fidelity:** Close, documented previously.

The two six-pointed stars turned 30° apart follow the Tuts+ construction. The work log records a measured, exact overlay of the repeated stars on its final drawing.

The app expands the shared six-fold foundation and represents the repeat with a tangent hexagon. This is a documented drawing match; no matching monument photo was established.

**Source-to-app mapping and evidence limits.** App 6–7 are the two stars credited to Tuts+; app 1–5 build their twelve divisions, and app 8 supplies the cell. The early log says abandoned, but the later owner/status decision approves shipping it.

**Evidence:** `docs/patterns/twelve-fold-dodecagrams.md`; `docs/research/twelve-fold-star/tuts-6-and-12.html`; `docs/patterns/STATUS.md`.

**Public references:** [Geometric Design: Working With 6 and 12 (Dodecagram Pattern)](https://design.tutsplus.com/tutorials/geometric-design-working-with-6-and-12--cms-22872).

### twelve-fold-rosette-mian

**Origin:** Instructions. **Fidelity:** Close, documented previously.

The chord-sized inner circle, 150° star lines, inking and square tile follow Samira Mian’s twelve-fold rosette lesson. The project records a line-for-line comparison with her pictures.

The app groups the work into 11 steps, including explicit intersection marks. This audit checked the written construction and saved source page; the video and every intermediate picture were not compared again.

**Source-to-app mapping and evidence limits.** Current app 1–4 create the twelve divisions; 5 creates the rosette outline; 6 the 15° directions; 7 the proportioning chord and inner circle; 8–9 the 150° star; 10 the square tile; 11 explicit ink endpoints. Credits cover all 11 app steps. Source activities 2–3 provide the rosette and the two tile choices. Close means the earlier documented comparison, not a new full video audit.

**Evidence:** `tutorials/twelve-fold-rosette-mian.json`; `tools/review/gen_twelve_rosette.py`; `docs/patterns/STATUS.md`; `docs/research/mian-rosette/page.html`.

**Public references:** [Twelvefold Islamic Geometric Rosette (online tutorial)](https://www.samiramian.uk/twelvefoldrosette).

### twelve-fold-rosette-mian-hex

**Origin:** Instructions. **Fidelity:** Close, documented previously.

The chord-sized inner circle, 150° star lines, inking and hexagonal tile follow Samira Mian’s twelve-fold rosette lesson. The project records a line-for-line comparison with her pictures.

The app groups the work into 11 steps, including explicit intersection marks. This audit checked the written construction and saved source page; the video and every intermediate picture were not compared again.

**Source-to-app mapping and evidence limits.** Current app 1–4 create the twelve divisions; 5 creates the rosette outline; 6 the 15° directions; 7 the proportioning chord and inner circle; 8–9 the 150° star; 10 the hexagonal tile; 11 explicit ink endpoints. Credits cover all 11 app steps. Source activities 2–3 provide the rosette and the two tile choices. Close means the earlier documented comparison, not a new full video audit.

**Evidence:** `tutorials/twelve-fold-rosette-mian-hex.json`; `tools/review/gen_twelve_rosette.py`; `docs/patterns/STATUS.md`; `docs/research/mian-rosette/page.html`.

**Public references:** [Twelvefold Islamic Geometric Rosette (online tutorial)](https://www.samiramian.uk/twelvefoldrosette).

## Follow-up priorities

1. Compare the current nine-step khatam and star-and-octagon studies with every PDF stage, then register their ink/repeats against the final source drawings. Establish instruction fidelity before returning to their separately unresolved monument matches.
2. Compare the current square stellated rosette with Mian’s complete activity 8 video, and the hexagonal version with her activity 9 pictures/hints. Keep the challenge’s independent-construction role explicit.
3. For Bou Inania, seek a published full-panel construction or retain the fitted-reconstruction description. Compare whole-panel line families and omitted shield bands rather than inferring authenticity from a corner-only distance score.
4. For future patterns, record a source-to-app step map and separate motif, ink and repeat comparisons at build time. A finished drawing can be a sound design reference without supplying the teaching method.

The ring-of-circles credit has been extended through current app steps 11–12, which still draw the sourced square sides after regrouping. The player’s step link now says “Source for this step” because some sources are drawings rather than tutorials. No construction geometry, ink or repeat has been changed by this audit.

## Implementation and validation

The audit uses optional validated `construction` metadata so existing saved/imported tutorials remain compatible. Every shipped library JSON has an assessment; unaudited user files receive no automatic verdict. Editable copies keep the original credits but drop its audit, since the complete library sequence is no longer guaranteed. The player shows source notes and linked credits in a scrollable reading panel opened from each lesson, using the existing theme colors. The review page and project notes link to this report.

Validation completed on 22 October 2026:

- Full workspace tests: `NODE_OPTIONS=--max-old-space-size=2048 NX_DAEMON=false pnpm nx run-many -t test --parallel=1 --maxWorkers=1` passed for all eight projects (13 tasks including dependencies).
- `pnpm test:studio:preflight`: 11 passed. Catalog generation validated all 39 tutorials.
- Full lint, TypeScript checks and production builds passed with one project at a time. These were rerun successfully after the reading-panel adjustment.
- After that adjustment, the four affected player test files passed **39 tests**, including source links, absence of automatic verdicts on unaudited files, editable-copy credit preservation and Escape/focus return.
- Real Chromium checks passed at **1280 × 900** and **390 × 844**: open an instructional source assessment, read and scroll it inside the viewport, close with Escape, open a finished-design reconstruction assessment, and open the report with all 39 inventory rows. No page errors occurred. Final screenshots were inspected; the reading panel replaces an initial inline disclosure that clipped inside the lesson layout.
- A JSON comparison with the base commit confirms unchanged construction steps, ink, repeat and golden expectations in all 39 files. The only credit edit extends the ring-of-circles source through steps 11–12.
- `git diff --check` passed. No private research assets were added to public or tracked files.

The isolated local preview uses port **4297**. The report opens at `http://localhost:4297/#/notes/construction-sources`; every pattern’s **How this construction was made** button opens its assessment. Preview screenshots are in the ignored local `docs/review/construction-audit/` folder.
