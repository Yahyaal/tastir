# Review of Codex's pattern-provenance branch — 23 October 2026

The owner asked Codex which patterns follow published instructions and how closely; Codex answered on `codex/pattern-provenance` (commit `3cb1990`), and the owner asked Claude to review it and merge it if good. It is merged into main (`069dcb4`).

## What it adds

Every tutorial gets an optional `construction` record in the schema: its basis (published instructions, instructions with our additions, a reconstruction from a finished design, an app-developed study, or a standard construction), its fidelity to the instructions (close, adapted, unassessed or not applicable), a note, the changes, and the date reviewed. All 39 tutorials have one. The lesson shows it under "How this construction was made", kept apart from the historical verification. `docs/patterns/CONSTRUCTION-AUDIT.md` (on #/notes as "Pattern construction sources") gives the evidence for each pattern, and `BRIEF.md` now asks every new pattern to fill the record.

## What was checked

- The counts in the report agree with the table and the tutorials: 11 instructions, 9 mixed, 15 reconstructions (the Alhambra family), 3 app studies and 1 standard construction, 39 in all.
- Spot checks agree with STATUS.md and the tutorials' credits: eight-fold-zellige is the owner's Design D, separate from Sandy Kurt's wheel (its own tutorial); sixteen-fold-rosette is Design F, the beginner version; the snowflake's credit names Mamoot's order of construction.
- The code is small and tested: the schema field is optional and validated (a schema test rejects bad values), a lesson copied into the editor drops the record (the learner's copy is no longer the audited sequence), and the dialog keeps keyboard focus and closes with Escape.
- The branch started ten commits before main; the merge had one conflict (the review page's Done list), resolved by keeping both entries. All tests, lint, typecheck and the browser tests pass on the merge.

## Small things left as they are

- The lesson's step source now reads "Source for this step: Mamoot ↗" instead of "This step follows Mamoot’s tutorial ↗".
- The dialog shows the review date as 2026-10-21 rather than in words.
- Its new schema test uses two non-null assertions (lint warnings, not errors).
