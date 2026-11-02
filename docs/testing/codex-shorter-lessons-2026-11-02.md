# Shorter lessons, 2 November 2026

Rabat is shorter by eleven steps. Its finished ink, tile and piece polygons match the saved baseline. The next lessons are the shared Ismail and Chehel Sotoun construction.

Counts include all visible steps. Actions count each part in place of its parent step. Words include each step’s main text and its parts, including headings, but exclude alternative helper texts. The inventory was measured before editing, at `fc459d7`. Rows with no after-count are an inventory only, not a completed construction review. A dash means the lesson has not been changed or checked.

| Tutorial | Steps before → after | Actions before → after | Words before → after | Ink matched |
| --- | ---: | ---: | ---: | --- |
| `rabat-mixed-star-rosette` | 49 → 38 | 52 → 41 | 1688 → 1442 | Yes, 352 segments |
| `ismail-shrine-divided-stars` | 41 → — | 44 → — | 1302 → — | — |
| `chehel-sotoun-divided-stars` | 41 → — | 44 → — | 1302 → — | — |
| `shah-mosque-chiral-grille` | 36 → — | 38 → — | 1207 → — | — |
| `turkish-sultana-mixed-stars` | 28 → — | 28 → — | 971 → — | — |
| `barsbay-twelve-star-doors` | 28 → — | 41 → — | 1339 → — | — |
| `bourgoin-142-star-rows` | 27 → — | 30 → — | 912 → — | — |
| `camlica-mosque-stars` | 25 → — | 25 → — | 1777 → — | — |
| `fathabad-mixed-stars` | 24 → — | 26 → — | 781 → — | — |
| `mihrimah-uskudar-stars` | 23 → — | 23 → — | 1081 → — | — |
| `bourgoin-153-rosettes` | 23 → — | 23 → — | 938 → — | — |
| `otrush-star-chelates` | 23 → — | 25 → — | 741 → — | — |
| `atik-valide-uskudar-stars` | 22 → — | 22 → — | 998 → — | — |
| `meknes-throne-rosette` | 22 → — | 23 → — | 1033 → — | — |
| `meknes-bou-inania-rosette-rings` | 22 → — | 23 → — | 773 → — | — |
| `topkapi-door-stars` | 21 → — | 21 → — | 1432 → — | — |
| `fes-moulay-ismail-interlace` | 21 → — | 22 → — | 876 → — | — |
| `cairo-bagasi-rosettes` | 21 → — | 21 → — | 811 → — | — |
| `qawsun-quran-stars` | 21 → — | 23 → — | 779 → — | — |
| `bourgoin-87-chelates` | 21 → — | 24 → — | 690 → — | — |
| `ibn-arabi-six-stars` | 21 → — | 21 → — | 580 → — | — |
| `fes-petal-star-rosette` | 20 → — | 21 → — | 785 → — | — |
| `alcazar-reyes-octagon-bands` | 20 → — | 21 → — | 765 → — | — |
| `shafai-248-rosettes` | 20 → — | 20 → — | 702 → — | — |
| `fes-bou-inania-octagonal-rosettes` | 20 → — | 21 → — | 729 → — | — |
| `kurt-eight-fold-zellige-shifted` | 20 → — | 23 → — | 746 → — | — |
| `damascus-fountain-stars` | 20 → — | 22 → — | 641 → — | — |
| `agra-twelve-six-stars-kites` | 20 → — | 22 → — | 625 → — | — |
| `agra-twelve-six-stars` | 20 → — | 22 → — | 625 → — | — |

## Rabat mixed-star rosette

Grouped the independent diagonal halvings, the three vertical guide families and the three circle-and-tangent families. Paired later lines with the same direction. Reused the circle about A from the opening and both crossings of the circle about N3. Kept one name, Q3, for the crossing that also had the name Q4. Removed the eleven unused copies of the horizontal line through P3 as well. These changes remove repeated instructions, two unnecessary circles and unused guide lines. The shared opening and four triangle parts are unchanged.

The local generator produces the same construction steps as the tutorial. Rabat’s changes are confined to its own generator. The existing ink paths, expect block, source statements and credits are unchanged. Regenerated the complete tutorial into a temporary file from the original MOR1118 piece data, read from the owner’s worktree. The steps, ink and expect block match exactly.

Saved each original dump at `docs/review/<id>/before/dump.json` before editing that lesson. These review files are ignored by git. For Rabat, I sorted each segment’s endpoints, rounded coordinates to nine decimal places, and compared the complete unordered sets. All 352 segments matched. The tile and every piece polygon matched exactly. The canonical segment-set SHA-256 is `53a3a0e39cb10a66aa57ed52e6831eacf3f8316199a166d61e361dc77177d958`.

Inspected all step pictures in order and the wall. A human should look most closely at steps 14–18, where the halvings and compass sums are grouped, and 28–29, where the guide families are grouped. The full-helper pictures remain dense. The renderer fixes its view to the tile, so some distant compass centres are clipped as before. Browser playback and hand construction have not been checked.

## Checks

`pnpm install` and `pnpm nx run schema:build` passed. Heavy commands run sequentially in a systemd scope with `MemoryMax=3G` and `MemorySwapMax=0`; Node has a 2304 MB heap and Vitest uses one worker. The full engine suite passed all 4,074 tests in 23 files, including golden, weave and crossing-equivalence checks. The final run took 869.39 seconds. All five targeted plain-text and helper-text checks for Rabat passed. Numbered points in the edited text exist by the step that names them. Comparing old and new helper visibility found no changed visibility for retained lines. Lint passed for all eight projects. Type checks passed for all eight projects and their seven prerequisite tasks.

The normal `pnpm typecheck` and `pnpm test` scripts invoke `pnpm catalog`. The brief prohibits that command. Type checks used the same Nx targets directly, with a local copy of the owner’s existing ignored catalogue so previews need not be regenerated, and text checks used an ignored temporary Vitest configuration with the real tutorial fixtures and an unused empty catalogue module. No catalogue command, server or browser suite ran. Browser playback, hand construction and the other application unit suites remain unchecked.
