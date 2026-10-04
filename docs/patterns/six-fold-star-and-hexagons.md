# Star and hexagons

**Sources.** Charlotte Webb's ATM handout (slides 12–13) draws this pattern in three pictures: two triangles in the mother circle, the hexagon through their points, and "channels" through the triangles' crossings carried out to the hexagon, then six hexagons around a star, with a photo of the real tilework. Kaplan's dissertation describes the same pattern as six-pointed stars set in a tiling of hexagons, and Wikipedia describes the construction in words. No second source with a drawing per step was found.

**Steps.** Steps 1–3 reuse the six-fold foundation from the snowflake. Step 4 (two triangles pointing left and right) and step 6 (the six channel lines carried to the hexagon) matched the ATM drawings on the first try, and the ink of six corner hexagons matched the handout's final outline on the first try.

**Decisions.** The handout says the large hexagon tiles, and the first version repeated it. The wall then had three hexagons sharing edges at every tile corner and small rhombi between, which is not what the photo shows: there every hexagon touches three stars and meets other hexagons only at its corners. So the tile is the smaller hexagon through the middles of the six corner hexagons (step 7), and each corner hexagon is completed by the two neighbouring tiles. Building step 7 exposed a schema bug: `rot6` and the other new rotations named no copies, which is now fixed and tested.

**Result.** Two piece types, the star (12 corners, tips at 1/√3) and the regular hexagon of side 1/3, two per tile. The wall matches the photo: stars ringed by six hexagons that touch only at corners.

Status: verified
