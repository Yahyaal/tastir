# Jali material textures — Task 2.1d, 11 October 2026

Work is isolated on `codex/jali` in `/home/yahya/Documents/projects/Tastir-jali`. The owner requested textures and explicitly asked for screenshots and analysis. Finish selection applies texture automatically, keeping the material buttons, visible finish swatches and direct custom-color interaction.

| Finish | Surface |
| --- | --- |
| Limestone | Small, quiet pores |
| Marble | Branching grey veins with a light edge |
| Sandstone | Fine, irregular light/dark grains |
| Slate | Layered striations |
| Oak / Walnut / Cedar | Curved grain and restrained knots, with different grain spacing |
| Silver / Gold | Fine brushed marks over the polished bevel |
| Bronze / Copper | Small hammered marks and brushing |

Custom framework colors retain their family’s texture. Wood uses the oak grain for Custom color, stone uses limestone pores, and metal uses brushing. All texture colors are derived from the current framework color, so custom colors remain coherent. These are stylized vector surfaces, not photographic material simulations.

## Rendering and exports

A transparent SVG texture tile is painted only on one additional bundled lattice stroke. Its width stays inside the solid framework body; there is no full-page noise overlay, mask, lighting filter or polygon fill across the openings. Texture definitions contain at most 48 small marks, independent of the pattern’s piece count. The existing four to six framework layers remain; the texture adds one stroke. Rotated tile frames map the texture axes with the same transform as the bevel lighting.

The live wall, saved thumbnail, finish-button sample and standalone SVG use the same deterministic marks. PNG is rendered from that SVG. Existing appearance metadata and save/share formats remain sufficient; finish/material and custom colors determine the surface. Saving and sharing require no new steps.

## Screenshot inspection and changes

The first desktop pass captured normal and zoomed views for every finish. I opened and inspected oak at both scales, marble, sandstone, bronze and silver close-ups. Marble veining read clearly, and the empty openings remained clean. Wood was too uniformly striped across upright bands; sandstone speckles looked more like pits than fine grain. I changed wood to uneven grain spacing, reduced its contrast and light streaks, and made sandstone grains smaller, more numerous and softer. Metal brushing stayed restrained so its bevel carried the material at normal size.

The first dense-pattern camera-return assertion compared SVG floating-point strings exactly and failed on a difference of about 0.00000003 after zooming out. The screenshot test now checks return within 0.00001 coordinate units; no camera code changed.

The final pass captured 90 wall screenshots: normal and zoomed views of eleven finishes on Star and cross, and four representative finishes on Bou Inania, across desktop, tablet and phone. I inspected the revised desktop close-ups, normal oak on Bou Inania, phone oak at normal/detail sizes, phone Bou Inania oak and marble, the material-button samples, the eight-material detail sheet, and the marble before/after comparison.

Final findings: marble has the strongest immediately recognizable surface; wood reads more softly after uneven spacing and reduced contrast; sandstone marks are smaller and less pitted. Brushed metal and limestone are intentionally quiet. At normal scale—especially on dense Bou Inania—the effect is subtle and the pattern carries the view. Zooming exposes the surface. No texture painted across the openings, no visible texture seams stood out in these captures, and the phone controls remained fully visible with textured samples. These remain illustrative SVG textures, not photorealistic renders. Screenshots live under ignored `docs/review/jali/textures/`; the review page links normal-size before/after comparisons, enlarged detail views and a phone rendering of dense Bou Inania. Before pictures are preserved from the previous untextured finish screenshots without switching the running worktree to old code.

## Validation

Initial focused renderer/export and controls checks: 35 pass. They compare texture marks, derived colors and widths between wall, thumbnail and export, validate unique paint references, and confirm the texture stroke stays narrower than the framework body. Final validation:

- `pnpm test`: exit 0, 1 minute 32 seconds. Player tests reran; unchanged engine/schema successful results were reused from cache.
- `pnpm lint`, `pnpm typecheck`, `pnpm build`: exit 0 after the texture refinement. Typecheck and build ran sequentially.
- `pnpm exec playwright test apps/player/e2e/jali.spec.ts apps/player/e2e/jali-picker.spec.ts apps/player/e2e/jali-texture.spec.ts`: 24 pass across desktop, tablet and phone. Coverage includes every texture, button samples, bounded SVG marks, clear apertures, normal/detail captures, zoom/pan, direct native picker, custom colors, reset, saving/reopening/sharing, thumbnails and SVG/PNG downloads.
- Browser runtime errors: none in the screenshot cases. Document width stays within the tested viewport.

Images are reproducible with the browser command. `compare-marble.png`, `compare-oak.png`, `compare-bronze.png` combine the preserved before image with the corresponding final normal screenshot. `detail-contact-sheet.png` arranges eight final close-ups for visual inspection. The original PNG screenshots are retained alongside them.

## Try it

Open `http://localhost:4292/#/eight-fold-star-and-cross/result`, choose Style → Jali, click a material, then a finish. Texture is visible in the finish samples and applied to the framework immediately. Zoom in or increase Lattice to inspect the surface. Try Marble, Sandstone and Oak, then compare Silver with Bronze. Check a custom color and switch back to Tiles.

For dense geometry, open `http://localhost:4292/#/bou-inania-rosette/result`. Screenshots and findings are at `http://localhost:4292/#/review`, on the Star and cross card. The separate port 4290 worktree is unchanged.
