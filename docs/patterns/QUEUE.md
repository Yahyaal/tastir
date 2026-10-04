# Work queue

Continue from the first unchecked item after any interruption (including a usage limit). Report results on the review page (`#/review`), one card per pattern.

Standing goals: many designs per pattern family, not one; build toward letting users make their own designs.

- [ ] **Alhambra interlace from the owner's photos (blocked: asked the owner for the pattern's origin or a bigger photo).** Measured: square lattice, two-square stars of radius 0.17·spacing, points at 22.5°+45k, eight pentagons round each star. Ruled out: Hankin on 4.8.8 at 40–88° (stars too thin), tilingsearch AL1/C1/F172, Kurt's 8-fold zellige PDFs, ALZADA grid drawings. Photos: `docs/research/alhambra-star-and-arrows/maroc/`.
- [ ] **Alhambra grid family (many designs from one base).** `docs/research/alhambra-star-and-arrows/alzada-grid-family.png` (ALZADA 115, 2017, Martínez Vela, p. 45): six real Alhambra panels drawn on one square grid with diagonals or two-square stars: Comares "los huesos", Torre de las Infantas alicatado and yesería, Comares 1 and 2, Mexuar 3, Sala de los Reyes 4. Build them as a family of tutorials sharing their opening steps; credit the article. Pipeline: crop from p-2.png (docs/research/alhambra-grid/), `gridread.py`, `gridsym.py`, `gridvote.py` (scratchpad copies in docs/research/alhambra-grid/tools/), then `tools/review/grid_tutorial.py`. Done: Comares bones, Infantas stars. Next: drawings 1–4 (d1–d4.png), which sit on a second grid of eight-pointed stars (circles of radius one square diagonal), not on the blue grid: the generator needs that base first.
- [ ] **Alhambra rosette's real repeat.** Search for the ceiling or panel where the Mamoot rosette repeats; rebuild the tile to match if found.
- [ ] **Compare the two** on the review page and ask the owner which to keep (both is fine).
- [ ] **More designs per family.** For each family already built (six-fold base, eight-fold squares, the twelve-fold base), add further well-documented designs.
- [ ] **User-made designs (future).** Note what the player needs so learners can generate new designs from a construction.
