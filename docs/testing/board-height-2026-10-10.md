# Board height after Claude's 10 October review

Review: `docs/prompts/team-2026-10-10.md`, Codex follow-up. Branch: `codex/learning-reliability`, merged from main at `92f1b61` before editing.

Instructions now occupy exactly three lines at every audited width. Longer instructions scroll inside that box. A visible “Scroll for more ↓” hint changes to “Scroll up ↑” at the end, and the scrollable text accepts keyboard focus. Resizing updates the hint. Feedback sits beside the instructions on desktop and below them on phone, so it does not take height from the desktop boards. Two heading lines accommodate the hint without moving the boards.

## Layout audit

Ran `TASTIR_LAYOUT_OUTPUT=docs/review/codex-layout-height node tools/check-draw-along.mjs` against the worktree dev server on port 4290. All seven tutorials and five viewport sizes were run together after the final CSS change. No build or catalog commands ran during the audit.

**35 cases, 1,144 stage observations, zero failures, exit code 0.** The audit checks equal and aligned boards, no movement between stages, identical desktop boxes across tutorials, no wrapped step chips, no horizontal page overflow, desktop footer fit, readable feedback, and three-line instructions with a scroll hint and keyboard access whenever they overflow. It covers construction before and after drawing, ink opening and completion, repeat, filled wall, color, and phone reference and palette switching. There were 200 observations with overflowing instructions.

| Viewport | Learner x | Reference x | Board y | Board width | Board height | Height gained |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1280×800 | 20 | 654 | 268 | 606 | 451.203125 | 60 px |
| 1366×768 | 20 | 697 | 268 | 649 | 419.203125 | 60 px |
| 1440×900 | 20 | 734 | 268 | 686 | 551.203125 | 60 px |
| 1024×768 | 20 | 526 | 317 | 478 | 370.203125 | 116 px |
| 390×844 | 20 | toggled | 492.625 or 515.65625 | 350 | 523.265625 | unchanged |

Movement within each tutorial is zero at every size. Desktop boxes match across all seven tutorials. Phone board position depends on the tutorial header, while width and height match across tutorials. Phone pages scroll vertically. At 1280×800, the boards exceed the requested minimum of 443 px.

Screenshots and raw measurements are in ignored `docs/review/codex-layout-height/`. Additional browser checks used the longest Bou Inania wall instruction at 1280, 1024, and 390 px widths: focusing it and pressing End reached the last line at all three widths. Screenshots were inspected at tablet and phone widths.

An initial partial audit caught two feedback messages that needed four lines beside the instructions. The final desktop feedback box allows six lines within the existing text row. The complete audit was restarted after that correction.

## Project checks

After the audit, `pnpm test`, `pnpm lint`, and `pnpm typecheck` each finished with exit code 0. The tests include instruction scroll hints, keyboard focus, resize behavior, and resetting changed text to its first line. Tests ran without a concurrent layout audit or build. `git diff --check` also passed.

## Check by eye

Refresh `http://localhost:4290/#/bou-inania-twelve-fold-wall/draw` in the running worktree server. At 1280×800 the boards should be taller, with no large empty band above the tools. Select step 16 for a long instruction; scroll inside the text to read it all. The boards should stay still when moving between steps, Ink, Repeat, and Color.
