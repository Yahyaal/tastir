# Working settings themes — 15 November 2026

The owner asked to compare working alternatives visually before selecting an aesthetic. Open [the theme explorer](http://localhost:4200/#/notes/settings-designs). Atelier, Precision and Mosaic use the same functional settings controls, with distinct typography, layout, colour and hierarchy. Compare all three, preview light/dark and phone width, or compare the previous design.

Preview controls share example state and never change a pattern or call the library visibility endpoint. Appearance previews restore the saved appearance when leaving. “Use” explicitly saves the selected panel theme and appearance locally; “Try beside a pattern” also opens the real lesson settings once. The existing panel stays the default until a theme is chosen. No winner has been selected and nothing is published.

The actual settings panel exposes the same three theme choices. Choices persist on reload. Radio inputs, keyboard navigation, Escape/focus return and reduced-motion support are preserved. Theme choices are personal interface preferences, separate from the pattern palette and shared presentation snapshot.

## Verification

Visual browser checks cover all three themes in light/dark at 1440px and 390px, aligned switches, working inputs, comparison view, no horizontal overflow or page errors, and application to a real lesson. Captures are under `docs/review/settings-refinement-2026-11-15/` (local review artefacts).

Unit coverage checks preview isolation, shared preview state, safe demo visibility, explicit application, one-time lesson opening and synchronized preferences when storage is unavailable. Browser regression coverage checks persistence after reload and keyboard controls in desktop and phone projects. Full verification passed: root lint (8 projects), root typecheck (8 projects plus dependencies), root tests (13 tasks, including the full player suite), and the production player build. Production browser checks passed 10 tests; two desktop-only touch cases were intentionally skipped. The visual gallery checks passed at both widths in both appearances. Logs: `/tmp/tastir-settings-designs-{lint,types-all,tests-all,build,browser-all,visual}.log`.

## Second round — owner’s preferred combination

The owner preferred Mosaic’s colours, Atelier’s illustrated ink buttons and Precision’s minimal style, with larger icons and less unused space. Four new variants — Lagoon, Ribbon, Outline and Inlay — now share blue/teal accents, compact system typography and 56px ink diagrams (previously 30px in Atelier). Tight padding gives the illustrations more of each button. Speed captions and the decorative heading copy are removed in these variants.

All settings themes now expose each switch’s state in its text: enabled labels use the accent colour and heavier weight, plus “✓ On”; disabled labels use a quieter readable colour and “Off”. Screen-reader names remain stable; the native switch announces its state. The toggle descriptions stay readable in both states.

The explorer opens with the four new variants. “Original three” preserves the previous comparison, and all seven are selectable in the real settings panel. The new comparison uses two columns on desktop and stacks on phones. Preview isolation and explicit application remain unchanged. Screenshots are in `docs/review/settings-refinement-round2-2026-11-15/`. Visual checks verify all four at 1440px and 390px in both appearances, different computed label colours and font weights for On/Off, 56px diagrams, alignment and no horizontal overflow. Production browser persistence/keyboard coverage now includes every new variant.

Second-round verification passed: root lint, root typecheck, all root tests (13 tasks), production build, and 18 production browser tests (two intentional desktop touch skips). The visual checks passed for every new variant at both widths and appearances. Production assets contain neither the private visibility endpoint nor the review gallery. Logs: `/tmp/tastir-refined-{lint,types,tests,build,browser,visual}.log`.

## Selected direction — Outline

The owner selected Outline and asked to remove the On/Off words and check marks. These have been removed from the switch labels in all themes, retaining the label colour and weight changes. Native switch semantics continue to announce checked state. Outline is now the fallback for missing, invalid or unavailable saved panel preferences, and the first preview in the explorer. Explicitly saved theme choices are retained.

Outline’s speed selector now uses a filled teal thumb, larger numerals, a defined track, hover feedback and 44px targets at both desktop and phone widths. Light mode uses white selected text; dark mode uses dark text on a brighter teal. All three selected speeds measured 5.44:1 text contrast in light and 7.28:1 in dark at both 1440px and 390px. Screenshots: `docs/review/settings-outline-2026-11-15/`. Five focused preference/preview tests passed, including the new default and retained explicit preference check. Verification passed: root lint, root typecheck, full root tests (13 tasks), production build, and 18 browser tests (two intentional desktop touch skips). The browser checks confirm Outline is the default in both projects. Private review content and the visibility endpoint are absent from production assets. Logs use `/tmp/tastir-outline-*.log`.

## Finalization — Outline only

At the owner’s request, removed all alternative settings themes, the panel-theme picker, preference hook/storage listeners, comparison component/styles and comparison-only tests. Removed preview-only settings props, artwork/captions used by the alternatives and the one-time gallery opener. Consolidated the selected Outline CSS into `playerSettings.css`; the component has no theme-variant attributes or theme selection logic. Old saved theme values are simply ignored. Light/dark appearance remains available through the app’s existing appearance control.

The review navigation and active project/progress notes now point to the actual lesson. Old comparison-page bookmarks show the existing guide/settings review instead of a broken page. Historic research notes and screenshots remain as evidence.

Nine focused settings/visibility tests passed. Visual checks of the actual lesson panel passed at 1440px and 390px in light/dark, with a legacy Mosaic preference present: 44px speed targets, 5.44:1/7.28:1 selected-text contrast, working switches without state words or check marks, no picker, no overflow or page errors. Captures: `docs/review/settings-outline-only-2026-11-15/`. Production browser coverage now exercises all seven retired preference values after reload. Verification passed: root lint, root typecheck, full root tests (13 tasks), production build, and 22 browser tests (two intentional desktop touch skips). Logs use `/tmp/tastir-outline-only-*.log`.
