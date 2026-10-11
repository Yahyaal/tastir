# Jali colors and materials — Tasks 2.1a and 2.1b, 11 October 2026

Implementation is on `codex/jali` in `/home/yahya/Documents/projects/Tastir-jali`. Other worktrees and main are unchanged. The requested controls are implemented and available for review; the task checkboxes remain open because the full test suite has the baseline speed failures described below.

At Color, choose Style → Jali. Jali finish offers Stone, Wood, Gold and Silver, independent Framework color and Background color pickers, and Reset Jali finish. Selecting a material sets its starting framework color and preserves the background. Reset restores the original stone appearance and courtyard background, preserving the lattice width and tile colors.

Stone retains the owner-approved bevels. Custom colors derive the bevel and shadow colors from the framework. Wood adds two fine, broken grain strokes; gold and silver use stronger bevel contrast and a narrow polished highlight. These are stylized vector finishes. A single continuous background gradient derives from the chosen background color; apertures remain open. The renderer uses four to six bundled paths and no lighting filters, including on both dense Bou Inania patterns.

Optional validated finish metadata preserves older saved designs and share links with the original defaults. Saving, reopening, sharing, keeping a shared copy, My designs thumbnails, SVG and PNG retain material and colors. Finish changes participate in the unsaved-design check. Reset followed by switching to Tiles and saving replaces the previously saved finish instead of leaving old settings behind. Existing palettes, geometry and tutorials are unchanged.

## Validation

- `pnpm lint`: exit 0.
- `pnpm typecheck`: exit 0.
- `pnpm exec nx run player:build`: exit 0.
- Focused Jali/render/export, design-store and exchange specs: 42 tests pass. These cover all four materials with custom colors, matching preview/export attributes, legacy data and malformed finish metadata.
- `pnpm test`: schema and player targets pass; 670 engine checks pass. Two existing engine checks fail their 300 ms Bou Inania ink/piece preparation budget. No engine source or threshold was changed.
- Isolated current-branch speed retry: the same two failures, ink 418.1/417.4 ms and pieces 404.0/334.7 ms (rosette/wall).
- Baseline comparison at pre-change commit `7ffcb19`, in a temporary detached worktree: the same two checks fail, ink 323.6/381.8 ms and pieces 370.0/283.8 ms. The temporary worktree was removed. This reproduces the failures without the finish implementation; the full suite is not reported as green.
- `pnpm exec playwright test apps/player/e2e/jali.spec.ts --max-failures=1`: 15 browser checks across desktop, tablet and phone. They cover four patterns, all materials, independent colors, reset, pan/zoom, saved-design dirty state, reload, share, thumbnails, SVG/PNG, restored tile colors, and saving a reset after switching styles.
- Phone layout: 390 px viewport and 390 px document width; controls do not introduce horizontal overflow.

Screenshots are regenerated under ignored `docs/review/jali/`. The review page's Star and cross card shows labelled Stone, Wood, Gold and Silver previews. Its Progress section describes the new controls and the outstanding full-suite timing result.

## Try it

Open `http://localhost:4292/#/eight-fold-star-and-cross/result`, choose Style → Jali, and scroll the side panel to Jali finish. Try each material, change the two colors separately, and reset. Repeat with `#/bou-inania-rosette/result` or `#/bou-inania-twelve-fold-wall/result`. Save a design, reload, open its share link and inspect its SVG/PNG downloads. Switch to Tiles to see the preserved tile colors.

If the separate preview server is stopped:

```sh
cd /home/yahya/Documents/projects/Tastir-jali
pnpm exec vite --config apps/player/vite.config.mts --port 4292 --strictPort
```

Open `http://localhost:4292/#/review` for the labelled finish pictures. The owner's existing port 4290 server is separate.

## Right-edge picker fix

The owner reported that the browser-native color popup was cut off at the right edge. Jali now uses an editor that expands inside the side panel instead of opening a native popup. Click either color swatch to show preset swatches and RGB sliders, or type a complete six-digit hex color in its field. Incomplete/invalid text never changes the saved color; leaving the field restores the current value. Escape closes the editor and returns focus to its opener.

Focused unit checks: 21 pass, including the three new editor tests. The combined browser suites pass 18 checks across desktop, tablet and phone, covering both editors' bounds, keyboard slider edits and Escape focus, plus the original save/share/export and material cases. After the final input styling, all three layout checks pass again against a fresh build. Screenshots are `inline-picker-desktop.png`, `inline-picker-tablet.png` and `inline-picker-phone.png` under `docs/review/jali/`, with desktop/phone pictures on the review card. Lint, typecheck and production build pass.

Suggested future finishes are sandstone with fine grain, marble with subtle veining, and aged bronze with patina. These remain proposals. The Met's [red sandstone screen](https://www.metmuseum.org/art/collection/search/453343) and [marble screen](https://www.metmuseum.org/art/collection/search/453241) provide historical references for the first two; bronze is suggested as a decorative finish.

The full `pnpm test` rerun for the picker fix passes schema and player, with 670 engine checks passing and the same two existing 300 ms Bou Inania preparation checks failing. The full-suite validation gate remains open; the engine and its timing thresholds are unchanged.
