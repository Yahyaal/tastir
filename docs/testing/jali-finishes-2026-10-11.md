# Jali colors and materials — Tasks 2.1a–2.1c, 11 October 2026

Implementation is on `codex/jali` in `/home/yahya/Documents/projects/Tastir-jali`. Other worktrees and main are unchanged. The requested controls are implemented and available for review. Tasks 2.1a–2.1c now pass the full suite and are checked complete. Earlier speed-check failures are retained below as historical validation results.

At Color, choose Style → Jali. Choose Stone, Wood or Metal, then a finish within that family or Custom color. Independent Framework color and Background color pickers and Reset Jali finish are available. Selecting a material sets its starting framework color and preserves the background. Reset restores the original stone appearance and courtyard background, preserving the lattice width and tile colors.

Stone retains the owner-approved bevels. Custom colors derive the bevel and shadow colors from the framework. Wood adds two fine, broken grain strokes; gold and silver use stronger bevel contrast and a narrow polished highlight. These are stylized vector finishes. A single continuous background gradient derives from the chosen background color; apertures remain open. The renderer uses four to six bundled paths and no lighting filters, including on both dense Bou Inania patterns.

Optional validated finish metadata preserves older saved designs and share links with the original defaults. Saving, reopening, sharing, keeping a shared copy, My designs thumbnails, SVG and PNG retain material and colors. Finish changes participate in the unsaved-design check. Reset followed by switching to Tiles and saving replaces the previously saved finish instead of leaving old settings behind. Existing palettes, geometry and tutorials are unchanged.

## Earlier validation (before the owner correction)

- `pnpm lint`: exit 0.
- `pnpm typecheck`: exit 0.
- `pnpm exec nx run player:build`: exit 0.
- Focused Jali/render/export, design-store and exchange specs: 42 tests pass. These cover all four materials with custom colors, matching preview/export attributes, legacy data and malformed finish metadata.
- `pnpm test`: schema and player targets pass; 670 engine checks pass. Two existing engine checks fail their 300 ms Bou Inania ink/piece preparation budget. No engine source or threshold was changed.
- Isolated current-branch speed retry: the same two failures, ink 418.1/417.4 ms and pieces 404.0/334.7 ms (rosette/wall).
- Baseline comparison at pre-change commit `7ffcb19`, in a temporary detached worktree: the same two checks fail, ink 323.6/381.8 ms and pieces 370.0/283.8 ms. The temporary worktree was removed. This reproduces the failures without the finish implementation; the full suite is not reported as green.
- `pnpm exec playwright test apps/player/e2e/jali.spec.ts --max-failures=1`: 15 browser checks across desktop, tablet and phone. They cover four patterns, all materials, independent colors, reset, pan/zoom, saved-design dirty state, reload, share, thumbnails, SVG/PNG, restored tile colors, and saving a reset after switching styles.
- Phone layout: 390 px viewport and 390 px document width; controls do not introduce horizontal overflow.

Screenshots are regenerated under ignored `docs/review/jali/`. The review page’s Star and cross card shows the material controls, desktop/phone color chooser and all eleven finish previews. Its Progress section describes the new controls and the outstanding full-suite timing result.

## Try it

Open `http://localhost:4292/#/eight-fold-star-and-cross/result`, choose Style → Jali, and scroll the side panel to Jali finish. Try each material, change the two colors separately, and reset. Repeat with `#/bou-inania-rosette/result` or `#/bou-inania-twelve-fold-wall/result`. Save a design, reload, open its share link and inspect its SVG/PNG downloads. Switch to Tiles to see the preserved tile colors.

If the separate preview server is stopped:

```sh
cd /home/yahya/Documents/projects/Tastir-jali
pnpm exec vite --config apps/player/vite.config.mts --port 4292 --strictPort
```

Open `http://localhost:4292/#/review` for the labelled finish pictures. The owner's existing port 4290 server is separate.

## Earlier right-edge picker attempt (superseded)

The owner reported that the browser-native color popup was cut off at the right edge. Jali now uses an editor that expands inside the side panel instead of opening a native popup. Click either color swatch to show preset swatches and RGB sliders, or type a complete six-digit hex color in its field. Incomplete/invalid text never changes the saved color; leaving the field restores the current value. Escape closes the editor and returns focus to its opener.

Focused unit checks: 21 pass, including the three new editor tests. The combined browser suites pass 18 checks across desktop, tablet and phone, covering both editors' bounds, keyboard slider edits and Escape focus, plus the original save/share/export and material cases. After the final input styling, all three layout checks pass again against a fresh build. Screenshots are `inline-picker-desktop.png`, `inline-picker-tablet.png` and `inline-picker-phone.png` under `docs/review/jali/`, with desktop/phone pictures on the review card. Lint, typecheck and production build pass.

Suggested future finishes are sandstone with fine grain, marble with subtle veining, and aged bronze with patina. These remain proposals. The Met's [red sandstone screen](https://www.metmuseum.org/art/collection/search/453343) and [marble screen](https://www.metmuseum.org/art/collection/search/453241) provide historical references for the first two; bronze is suggested as a decorative finish.

The full `pnpm test` rerun for the picker fix passes schema and player, with 670 engine checks passing and the same two existing 300 ms Bou Inania preparation checks failing. The full-suite validation gate remains open; the engine and its timing thresholds are unchanged.


## Earlier owner correction: grouped materials and centered dialog (superseded)

The owner asked why Jali differed from the other styles and requested a material family followed by finish choices. The inline RGB/hex editor is removed. The color chooser now reuses the existing swatch button styles and native Any color input, in a compact centered dialog. The native input sits at the dialog’s left edge, away from the browser’s right edge. Close or Escape restores focus to the opener; keyboard focus stays within the chooser while it is open.

| Material | Finish presets |
| --- | --- |
| Stone | Limestone, Marble, Sandstone, Slate |
| Wood | Oak, Walnut, Cedar |
| Metal | Silver, Gold, Bronze, Copper |

Every family includes Custom color. Finish selection updates the framework color while preserving the background. Custom framework colors retain the family’s bevel, grain or polished treatment. These are stylized vector/color finishes, without new marble veins, sandstone grain or bronze patina. Reset restores the original stone finish and both original colors. Width and tile colors stay independent.

The schema now stores the material family and finish, rejects a finish from another family, and reads older gold/silver settings as Metal with the corresponding finish. Older stone/wood settings acquire their original finish names. Migration preserves framework/background colors and the drawing treatment. Storage readers apply this normalization, as do shared-link readers. Thumbnails and SVGs include matching material and finish attributes.

Validation for this correction:

- Initial focused checks: 66 tests pass, including every preset’s render/export agreement, all family options, custom/background independence, old stored/shared settings and malformed metadata. Eleven additional preset share round-trip checks are included in the final full suite.
- `pnpm lint`, `pnpm typecheck`, `pnpm build`: exit 0 after the final code changes. A later simultaneous build/typecheck run removed declaration outputs while TypeScript was using them; rebuilding declarations with `pnpm exec tsc --build apps/player/tsconfig.json --emitDeclarationOnly --force` and rerunning `pnpm typecheck` alone resolves that generated-output race. Run build and typecheck sequentially in this worktree.
- Browser checks: 18 pass across desktop, tablet and phone (49.9 seconds). Cover every preset, custom colors, chooser bounds, native-input placement, Escape/focus return, saves, shares, thumbnails, pan/zoom, SVG/PNG downloads and reset while another style is active.
- First browser pass exposed the chooser inheriting the full player height; fixed before the final pass. Its custom-selector focus check now focuses the select before making the choice, matching keyboard use.
- Headless browser checks exercise the native input’s value/change events and its position. They cannot inspect the operating system’s native color popup; click Any color in your browser as the final visual check.
- Final `pnpm test`: exit 0, schema, engine and player targets pass (3 minutes 18 seconds). The two Bou Inania timing checks pass on this run without changes to engine code or budgets. Earlier runs, including the pre-change baseline, failed them; this result does not establish that the timing checks are stable on every machine.

Current screenshots: `material-controls-desktop.png`, `color-chooser-desktop.png`, `color-chooser-phone.png` and `finish-<name>.png` under ignored `docs/review/jali/`, visible at `http://localhost:4292/#/review`. Use `http://localhost:4292/#/eight-fold-star-and-cross/result` → Style → Jali to try the controls. Choose Material, then Finish; choose Custom color or either color swatch to open the familiar chooser. Existing port 4290 serves a separate worktree.


## Owner correction: direct material buttons and visible finish swatches

The owner rejected the material/finish dropdowns and the extra color dialog because they required too many clicks. Material is now a three-button selector. Clicking Wood reveals Oak, Walnut and Cedar buttons with visible color samples; Stone and Metal reveal their own finishes. A finish applies immediately with one click, and the selected finish is marked. Clicking the already-selected material leaves a custom color intact.

Each family’s Custom color button opens the browser-native color picker directly. It uses an invisible native input anchored near the center of the viewport, so the native popup is not attached to the far-right panel. No intermediate dialog, dropdown or second button is involved. Canceling the picker leaves the appearance unchanged. Background presets apply directly, with a separate one-click custom button. Material, custom-color and background targets are at least 44 px tall. Existing save/share/export data and rendering are unchanged.

The review page now shows the directly visible controls for all three materials, plus Wood on a phone. Screenshots are `direct-<material>-<viewport>.png` under `docs/review/jali/`.

Validation for the direct controls:

- `pnpm test`: exit 0 (1 minute 50 seconds). Player tests ran again; unchanged engine/schema results were reused from the prior successful run.
- `pnpm lint`, `pnpm typecheck`, `pnpm build`: exit 0. Typecheck found unsupported `exact` options in the new Testing Library queries; removed them before the passing run. Build ran after typecheck to avoid the previously documented output race.
- All 18 browser checks pass (43.9 seconds), covering desktop/tablet/phone, every material/finish, immediate preset changes, one-click and keyboard native-picker requests, custom color independence, save/share/thumbnails/SVG/PNG, pan/zoom and reset.
- A final native-picker follow-up passes all three viewport checks (10.6 seconds), calling the real native picker and canceling with Escape before counting direct click/keyboard requests. No runtime errors or changed color on cancel.
- Desktop and phone screenshots inspected: directly visible material buttons and labelled finish swatches, with no material/finish dropdowns or intermediate chooser dialog. Headless checks observe the native picker request from the actual button click and keyboard activation; the OS popup itself still needs the owner’s visual check.
