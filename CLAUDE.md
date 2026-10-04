# Tastir

A web app that walks people through Islamic geometric pattern tutorials one step at a time: each Next draws the next compass circle or ruler line exactly, and the finished pattern can be colored by piece and tiled into an infinite wall.

## Read these first

- `docs/PRD.md` is the product: what we are building and why.
- `docs/TASKS.md` is the work, in order, each task with its acceptance test. Do one task per session.
- `docs/tutorial-format.md` is the tutorial JSON format, with a full worked example in `tutorials/`.
- `docs/geometry-notes.md` holds lessons from the prototype. Read it before touching intersections, motifs or piece finding, because each note is a bug that already happened once.
- `docs/prototype/` is a working single-file prototype. Port from it; do not import it.

## Rules that do not bend

1. **The engine is pure TypeScript.** `packages/engine` has no DOM, no React and no runtime dependencies, so it runs in tests, in a Web Worker and on a server.
2. **Tutorials never contain coordinates.** Every point comes from a crossing or a tangency of earlier elements. If a tutorial seems to need a number, the construction is missing a step.
3. **The engine never guesses.** A missing, ambiguous or impossible reference is an error naming the step and the element.
4. **Every tutorial has a golden test** built from its `expect` block. An engine change that alters a tutorial's pieces must fail the tests.
5. **Tests pass before a task is done.** Run the full test and lint commands and paste the result in your summary.

## How to work with me

- Before writing code for a task, show a short plan and wait for my OK.
- Write plans and explanations as short connected sentences, each decision with its reason ("put X in Y because Z"). Do not send fragment lists I have to decode, and do not list options you rejected.
- One task, one commit. Use a clear commit message that names the task number.
- When something in the docs looks wrong or contradicts the code, say so and ask; do not silently pick one.
- Anything visual (the player) I will check by eye in the browser, so tell me the command to run and what I should see.

## Layout (created in task 0.1)

```
packages/engine    geometry, evaluator, pieces
packages/schema    Zod schema for the tutorial format
apps/player        React + Vite + SVG player
tutorials/         tutorial JSON files
docs/              PRD, tasks, format, notes, prototype
```

## Commands

Run everything from the repo root. The workspace is Nx with pnpm, so `pnpm nx run <project>:<target>` runs one target for one project (`engine`, `schema`, `player`).

```
pnpm install       install all dependencies
pnpm test          Vitest in every project
pnpm lint          ESLint in every project
pnpm typecheck     strict TypeScript in every project
pnpm format        Prettier over code and config (Markdown and tutorials are left as written)
pnpm dev           player dev server at http://localhost:4200
```

The engine's tsconfig has no DOM or Node types, so any DOM use in `packages/engine` fails typecheck.

## Content rules

Tutorial text and drawings are always our own. Classic constructions (dividing a circle, static and dynamic squares, star and cross) are general knowledge. A specific sequence taken from one book, PDF or video must be credited in the tutorial's `credits`, and a near-copy of one published tutorial is not allowed. The files in `docs/research/` are private references and are never shipped in the app.
