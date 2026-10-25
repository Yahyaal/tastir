# Pattern status

The [construction-source audit (21 October 2026)](CONSTRUCTION-AUDIT.md) records, for all 39 tutorials, which sequences follow published instructions, which were reconstructed from finished designs, and the evidence for instruction fidelity. These are separate from the finished-design statuses below. Each pattern also shows its findings in the player under **How this construction was made**.

Every tutorial in the library (`tutorials/`), updated 12 October 2026. **Verified** means the tiled pattern was compared with a photo of the real pattern and the line structure matches. **Approved** means it matches a published drawing or the owner's chosen source, and the owner decided to keep it on the review page; the card there gives the reason. The review page (`#/review`) has a card for most patterns with pictures and the owner's decisions, and each early pattern's log is in `docs/patterns/<id>.md`.

## Twelve-fold

| Tutorial | Fold | Steps | Status | Notes |
| --- | --- | --- | --- | --- |
| bou-inania-rosette | 4 | 14 | approved (5 Oct) | The Bou Inania rosette built with Samira Mian's method from the clear drawing by @aslam.geometricpatterns. Simplified from 1,840 to 465 elements using along (eliminating 1,375 mark points). The tile copies overlap by one band; there is an eight-pointed star at each corner. One known difference: the band round the green shields is not drawn, so each shield is joined to the black piece beside it. |
| bou-inania-twelve-fold-wall | 4 | 18 | simplified (9 Oct) | Simplified construction with no hidden step, ring cut fixed (4 axis trapezoids + 4 bent diagonal pieces), ink runs `along` lines. Credits updated with photo details and Samira Mian for star lines. |
| twelve-fold-rosette-mian | 4 | 11 | approved | Samira Mian's twelve-fold rosette, square tile, checked line for line against her pictures. |
| twelve-fold-rosette-mian-hex | 12 | 11 | approved | The same rosette on a hexagonal tile. |
| minbar-doors-cairo | 12 | 11 | verified (5 Oct) | Design H2, the Met's minbar doors from Cairo (about 1325–30): Samira Mian's rosette on her hexagonal tile, inked as on the doors (small star and kites, shields ending flat on the lines touching the circle, triangles between rosettes). Checked against the museum's photo (`tools/review/design_h2/`). |
| mian-stellated-rosettes | 4 | 13 | verified (5 Oct) | Her activity 8: stellated rosettes, with hexagons and an octagon at the corners. It is Design H1, the woodwork of the al-Maridani minbar in Cairo: every inlay of the photo was measured and lies in one piece of this pattern (`tools/review/design_h/`, tools 9 and 10). The minbar of al-Nasir Muhammad in the Citadel has the same design (`tools/review/design_h3/`). |
| mian-stellated-hex | 12 | 10 | added (8 Oct), not reviewed | Samira Mian's stellated rosette on a hexagonal tile, added during the UI redesign (commit d2c1599). No photo, and nobody has checked it against her drawing or asked the owner yet. |
| twelve-fold-dodecagrams | 6 | 8 | approved | Matches the Tuts+ drawing; kept as a beginner design. No photo of a real example. |
| ibn-tulun-window | 6 | 10 | verified | Matches a window grille of the Mosque of Ibn Tulun. |

## Six-fold

| Tutorial | Fold | Steps | Status | Notes |
| --- | --- | --- | --- | --- |
| six-fold-snowflake | 6 | 8 | verified | Matches the Ibn Tulun window grille and the Eski Mosque panel. |
| six-fold-star-and-hexagons | 6 | 7 | verified | Matches the Timurid tile photo; the source's suggested tile was wrong, the smaller hexagon is right. |
| six-fold-hammerhead | 6 | 7 | verified | Matches the source line for line and the Alcázar of Seville panel. |

## Eight-fold and the Alhambra grids

| Tutorial | Fold | Steps | Status | Notes |
| --- | --- | --- | --- | --- |
| eight-fold-star-and-cross | 8 | 6 | verified | Matches the Kashan star-and-cross lustre tiles (1297–98). |
| eight-fold-khatam | 4 | 9 | approved, historical match unverified (11 Oct) | Owner chose to keep the Safavid khatam study after Sandy Kurt. Public card/player label says the historical match is unverified. The mismatching Sikandra photo is not shipped. Future contributions may supply a matching reference. |
| eight-fold-star-and-octagon | 4 | 9 | approved, historical match unverified (11 Oct) | Owner chose to ship the Mughal study after Sandy Kurt at intermediate level. The earlier exact-match claim was rejected in the 10 October review. The free photo is retained as a clearly labelled historical reference. |
| eight-fold-zellige | 8 | 11 | approved | Design D, kept by the owner. |
| kurt-eight-fold-zellige | 8 | 18 | approved | Design C, Sandy Kurt's zellige wheel. Simplified from 19 steps (563 elements) to 18 steps (347 elements) using along. |
| kurt-eight-fold-zellige-shifted | 8 | 20 | approved | The same with rows shifted by half a wheel. Simplified from 20 steps (570 elements) to 19 steps (354 elements) using along. On 11 October the slanted tile became a hexagon round each wheel (the owner's idea): upright sides on the square, roofs halfway to the next row's wheels, built in a new step 20; the wall and the pieces are unchanged. |
| kurt-eight-fold-zellige-filled | 4 | 19 | built (12 Oct) | The plain wheel repeated on the standing square of step 4 (the owner's idea, simplified on 11 October): the wheels overlap, each one's middle fills the space between four others and their rings run along the same lines. On 12 October the owner asked to fill the cross left where four wheels meet: step 19 carries the sides of the octagons biting into it on through the cross, closing an octagon like the wheel's own with one of the wheel's bands on each side, so no new shape appears. Every other wheel has its middle in its own colours (a 2 × 2 colour repeat). Fold 4 because the coloured wall turns into itself only by a quarter turn about O. Our own design; no photo. |
| four-fold-ring-of-circles | 4 | 12 | approved | Design G, Sandy Kurt's drawing, shipped with credit. Simplified from 14 steps (566 elements) to 12 steps (196 elements) using along. No photo found. |
| alhambra-star-and-arrows | 8 | 9 | approved | The rosette matches the source exactly; the square repeat is a guess (no real repeat found). |
| alhambra-star-and-arrows-shifted | 8 | 10 | approved | The same rosette with rows shifted by half a rosette. |
| alhambra-comares-frames | 4 | 10 | verified (6 Oct) | Framed eight-pointed stars, plain stars and diamonds in interlaced bands, Salón de Comares, from Wichmann's drawing (SPA1416). Checked against David Wade's photo SPA 1416 (free candidate by Ashaio dropped: different dado pattern with stars at every grid point). |
| alhambra-reyes-dodecagrams | 6 | 11 | verified (6 Oct) | Twelve-pointed stars on a triangular grid, the zellige of the Sala de los Reyes, from Wichmann's drawing (P069): twelve lines round each star touching one small circle, and the hexagon of the star's circle. Checked against David Wade's photo SPA 1908. |
| alhambra-reyes-fret | 4 | 11 | verified (6 Oct) | Carved pinwheel fret of the Sala de los Reyes, from Wichmann's drawing (PG365); chiral; sixths of OA and small diamonds. Checked against David Wade's photo SPA 0405x (free candidate by Laurent dropped: alcove photo too distant and low resolution to check bands). |
| alhambra-mexuar-porch-fret | 4 | 8 | drawing only (25 Oct) | Ceiling fret of the Mexuar porch, from Wichmann's AL2; chiral; lines at thirds of OA ± √2/6, vertices snapped to the a + b·√2/2 grid. A variation of alhambra-reyes-fret (same family in variations.json). No photo yet. |
| alhambra-mexuar-corridor-stars | 4 | 8 | drawing only (25 Oct) | Stars and T-frets of the Mexuar corridor, from Wichmann's P051; chiral; star half-side 1/(5√2 − 4), bands one star point wide. No photo yet. |
| alhambra-museum-loops | 4 | 7 | drawing only (25 Oct) | Interlaced notched loops with stars, from Wichmann's RE3559 (Alhambra Museum); the Chellah minaret (CM014) is the same design. Lines at √2/4 and 1 − √2/4. No photo yet. |
| shah-i-zinda-octagons | 4 | 5 | drawing only (25 Oct) | Regular octagons touching corner to corner with four-pointed stars, from Wichmann's F254L (Shah-i-Zinda, Samarkand). Matches Wade's TRA 0301 by eye (private). Main of the touching-octagons family. |
| qaytbay-floor-octagons | 4 | 7 | drawing only (25 Oct) | F254L's octagon sides carried on to close a small octagon and four darts, from Wichmann's W2 (Qaytbay madrasa floor). Variation of shah-i-zinda-octagons. No photo. |
| sircali-stars | 4 | 5 | drawing only (25 Oct) | Sharp {8/3} stars touching point to point with notched crosses, diamond tile, from Wichmann's BON36 (Sırçalı madrasa, Konya). Same grid and tile as alhambra-comares-stars. No photo. |
| topkapi-scroll-pinwheel | 4 | 6 | drawing only (25 Oct) | Tilted khatam stars with boots and pentagons, chiral, tilted square tile, from Wichmann's R9 (Topkapı Scroll p. 318). The listed photo shows another panel. |
| alhambra-arrayanes-squares | 4 | 7 | verified (25 Oct) | Large squares in white bands with small stars, the dado of the Patio de los Arrayanes. Wichmann's PG299 proportions: each square's corner touches a point of the star, its sides on the star's inner square drawn long (owner check on 25 Oct against the shipped photo; the 6 Oct build had smaller squares, read from Wade's SPA 0111, with a gap). |
| alhambra-leones-fret | 4 | 9 | verified (6 Oct) | Pinwheel fret round eight-pointed stars, Patio de los Leones, from Wichmann's drawing (C55); chiral. The star's size from one line. Checked against David Wade's photo SPA 0218, turning the same way. |
| alhambra-barca-stars | 4 | 12 | verified (6 Oct) | Interlaced eight-pointed stars and small squares of the Sala de la Barca, from Wichmann's drawing (CM052): the Comares bath construction with one more step. Checked against David Wade's photo SPA 1624x (free candidate by muffinn dropped: different pattern of star field). |
| alhambra-reyes-stars | 4 | 11 | verified (6 Oct) | Eight-pointed stars with octagons and four-armed crosses alternating, the zellige of the Sala de los Reyes, from Wichmann's drawing (M060). Checked and verified line-for-line against Wikimedia Commons photo by Shesmax / Tuscasasrurales (CC BY-SA 3.0 es); David Wade's photo SPA 0408x kept as private reference. |
| alhambra-comares-dado | 4 | 9 | verified (6 Oct) | Octagons, long hexagons and crosses of five squares, the zellige dado of the Salón de Comares, from Wichmann's drawing (J43A); one length fixed by a single line from a cell corner. Checked against David Wade's photo SPA 0204. |
| alhambra-bath-stars | 4 | 11 | verified (6 Oct) | Interlaced eight-pointed stars of the Comares bath, from Wichmann's Tiling Search drawing (AL01); each band is a side of a large or small star, sizes fixed by two crossings. Checked against David Wade's photo MOR 0711 of a carved panel with the same design (free candidate by Venturini dropped: ribbon interlace topology differs). |
| alhambra-comares-bones | 4 | 6 | verified | Matches the Comares "bones" panel photo, coloured by placement. |
| alhambra-comares-stars | 4 | 5 | approved | From the published tracing (ALZADA, Martínez Vela). |
| alhambra-comares-lattice | 4 | 5 | approved | From the published tracing. |
| alhambra-mexuar-stars | 4 | 5 | approved | From the published tracing. |
| alhambra-infantas-stars | 4 | 6 | approved | From the published tracing; coloured by placement. |
| alhambra-infantas-crosses | 4 | 6 | approved | From the published tracing; a pinwheel (four-fold, no mirror). |

## Sixteen-fold

| Tutorial | Fold | Steps | Status | Notes |
| --- | --- | --- | --- | --- |
| sixteen-fold-rosette | 16 | 10 | approved | Design F, kept as the beginner version; the real Bou Inania sixteen-fold rosettes are much richer. |

## Ten-fold studies

| Tutorial | Fold | Steps | Status | Notes |
| --- | --- | --- | --- | --- |
| ten-pointed-star-decagon-rect | 10 | 10 | approved, historical match unverified (11 Oct) | Owner chose to keep this rectangular study. It is not the Darb-e Imam spandrel reconstruction; that historical target remains in Upcoming. |
