# Show/hide pattern sidebar — 16 November 2026

The owner clarified that the Patterns control should show and hide a side menu beside the drawing, rather than put a list on top of it.

At widths of 1000px and above, opening Patterns reserves 256px for the browser and moves the player content into the remaining space. The sidebar is non-modal: there is no backdrop, focus trap or body-scroll lock, and the drawing and its settings remain usable. The toggle remains in the header with expanded-state styling and Show/Hide tooltips. Choosing a pattern keeps the sidebar open in the same viewing mode. The desktop preference is remembered using the existing guarded browser-settings hook.

Below 1000px, the compact layout uses the existing modal drawer with focus containment, Escape/outside close and returned focus. It closes after selecting a pattern, and does not inherit the desktop open preference. Resizing between wide and phone layouts restores the correct mode and removes the modal scroll lock. Current-pattern highlighting and unsaved-work guards are retained.

The screenshot loop reviewed 1280px light/dark, 1024px tablet and 390px phone states. It prompted right alignment for the wrapped tablet finish actions and a 44px close target. Manual resizing wide → phone drawer → wide passed, including scroll-lock cleanup. Regression checks cover canvas space, same-toggle close, settings access, selection persistence, Escape/focus and refusing navigation with unsaved edits. Final results are recorded below.

[Visual review](http://localhost:4200/__review/renders/pattern-sidebar-2026-11-16/index.html). The captures are local, ignored review artifacts. No account sign-in or remote project changes are involved. Local implementation; not deployed.

## Verification and publication approval

Full root tests passed across all eight projects (13 Nx tasks), with one worker and bounded Node heaps. Root lint/typecheck/build passed. Focused player/library/saved-design tests: 58 passed. Production-browser checks: 94 passed across desktop/tablet/phone, with two intentional phone skips. The six new sidebar cases passed, including canvas-space reservation, same-toggle close, live settings access and unsaved-work protection. Existing browser navigation also checks that selecting a pattern keeps the desktop sidebar open with the new current pattern highlighted, while phone selection closes the drawer.

The owner explicitly requested push and merge after completion. The release includes the guided learning path and its prior UI refinements on the same branch. Source-photo and newcomer checks remain open. Private review metadata is marked approved for publication; GitHub deployment status records the release outcome.
