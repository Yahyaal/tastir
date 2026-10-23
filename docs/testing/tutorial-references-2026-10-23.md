# Drawing tutorial references — 23 October 2026

The owner could not find references to the actual drawing tutorials and wanted to compare them with Tastir's steps. The existing header said only “Reference”; the audit panel listed sources after the assessment; and several credits opened a collection page rather than the relevant PDF or video.

## Result

Watch and Draw along now label the primary instructional source **Tutorial**, while finished drawings and photos are labeled as references. The first tutorial takes priority even if a photograph appears earlier in the credits. Older saved files without source kinds retain their generic reference links.

The construction panel starts with **Compare with the source tutorial**. It gives the full title, author, PDF/video/written format, the app steps using it and the credit's scope note. Those are app-step numbers, not an assertion that source numbering matches. Finished drawings, photos and background reading remain in a separate section. The hexagonal stellated Mian challenge is labeled as hints and pictures, with no claim that a full numbered lesson exists.

The construction audit now opens with an index for all 20 patterns with instructional sources (19 tutorial entries and one challenge). Its 39 findings, origin counts, fidelity verdicts and review dates are preserved. Only credits changed in tutorial JSON: geometry, steps, ink, repeat and golden expectations are identical to the branch base.

## Resource checks

The actual published resources were located through the current author/publisher pages, without copying or shipping their PDFs or artwork:

- [Sandy Kurt's published download links](https://sandykurt.com/free-tutorials): the nineteen-step wheel PDF, Al-Hakim PDF, Itimud ad-Daula PDF and 4fold Pattern PDF. These four PDFs were fetched and identified by their contents. The three wheel variants use the same actual wheel PDF; the source covers app steps 1–17, with the repeat additions remaining ours.
- [Samira Mian's activity page](https://www.samiramian.uk/twelvefoldrosette): activity 2 supplies the central rosette method for the two mixed Bou Inania lessons; activity 3 supplies the plain rosette/tile lesson and the minbar's borrowed construction; activity 8 supplies the square stellated lesson. The video URLs are exactly those linked by the author. Automated YouTube fetches failed for activities 2 and 3; video playback was not verified. Activity 9 remains linked to the page because its hints and drawings are there, and it has no complete video tutorial.
- Mamoot's current snowflake, hammerhead, Ibn Tulun and Alhambra-rosette pages were fetched; their existing URLs already lead to the actual written tutorials.
- [Charlotte Webb's ATM handout](https://atm.org.uk/write/MediaUploads/Conference/2019%20Conference/Speakers/Art_in_the_Mathematics_classroom.pdf#page=12) was fetched; pages 12–13 contain the construction. Its link now requests page 12.
- [The Tuts+ article](https://design.tutsplus.com/tutorials/geometric-design-working-with-6-and-12--cms-22872) was fetched. The credit now names Joumana Medlej and directs the reader to the Dodecagram Pattern section.

Twelve lessons now link straight to the publisher's PDF or specific video instead of the collection page. This follow-up makes existing sources accessible; it does not claim new source-fidelity or historical verification.

## Validation

Checks ran sequentially with bounded heaps and one worker:

- Schema: **34 passed**, including all library source kinds, actual app-step references, legacy credits and invalid kinds.
- Focused player/Draw along: **62 passed** across five files. The final source-panel compatibility check then passed all **5** cases after adding the older-file fallback.
- Full workspace lint, TypeScript checks and production builds passed for all eight projects.
- Chromium checks passed at **1280 × 900** and **390 × 844**: direct PDF/video links with new-tab targets, step coverage, Watch and Draw along header links, challenge labeling, finished-drawing labeling, accessible keyboard closure and the audit indices. No page errors occurred. A final report check confirmed its first table has all 20 instructional entries and its findings table retains all 39 patterns.
- Source-panel and header screenshots were inspected. Final captures are under the ignored local `docs/review/source-tutorial-links/` folder.
- A JSON comparison confirms only credits changed in tutorials. `git diff --check` passed.

The isolated preview is `http://localhost:4299/#/kurt-eight-fold-zellige/watch`; the source tutorial index is at `http://localhost:4299/#/notes/construction-sources`. Work is on `codex/source-tutorial-links`, separate from Claude's ongoing changes on main.
