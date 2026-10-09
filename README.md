# Tastir

Tastir teaches Islamic geometric patterns through compass-and-ruler constructions. Watch a pattern unfold, draw beside the tutorial, ink selected lines, repeat the tile, and color the wall. You can save designs in your browser, make your own construction in the editor, export pattern files, and share designs by link.

## Run locally

Use Node 22.12 or newer and pnpm 10.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open http://localhost:4200. Library previews are generated automatically. To work alongside another agent, use a separate worktree and a different port:

```sh
git worktree add ../Tastir-my-work -b my-work
cd ../Tastir-my-work
pnpm install --frozen-lockfile
pnpm nx run player:dev --port=4290 --strictPort
```

## Check changes locally

```sh
pnpm exec playwright install chromium
pnpm check
```

`pnpm check` runs lint, strict TypeScript checks, geometry and UI tests, the production build, and Chromium browser tests. Browser tests use port 4392 and cover desktop, tablet, and phone viewports. To run individual checks:

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:browser
pnpm exec playwright show-report
```

Generated previews, reports, and browser traces are ignored by Git. `pnpm catalog` rebuilds the library metadata and thumbnails; adding a tutorial does not require changing the app's code. Browser test traces and screenshots appear in `test-results/` on failure.

**GitHub Actions is disabled at the owner's request.** Tests run locally and consume no GitHub Actions minutes. The Pages workflow is manual-only; automatic deployments are paused. Re-enabling Actions and requesting a deployment are separate, explicit actions.

## Project structure

- `packages/engine`: pure TypeScript geometry, construction evaluation, inking, and piece finding. No DOM or React.
- `packages/schema`: tutorial, draft, and sharing validation.
- `apps/player/src/app`: routing, library, player, saving, and sharing.
- `apps/player/src/along`: drawing beside a tutorial, hints, pen inking, and hand-placed repeats.
- `apps/player/src/editor`: construction tools and editable patterns.
- `tutorials`: source JSON, validated against golden geometry tests.
- `apps/player/e2e`: real-browser regression tests.
- `docs`: product decisions, pattern verification, and working notes.

Tutorial data loads on demand. The library uses generated metadata and WebP previews; opening a tutorial evaluates it in a Web Worker. Stored work remains in the current browser; export a pattern file to keep a portable copy. Share links contain the design data rather than uploading it to a server.

## Working on Tastir

Start with [the project overview](docs/PROJECT.md), [working with the owner](docs/WORKING-WITH-OWNER.md), and [the tutorial format](docs/tutorial-format.md). Read [geometry notes](docs/geometry-notes.md) before changing construction or piece finding. [Pattern status](docs/patterns/STATUS.md) records verification; passing geometry tests alone does not establish that a design matches a historical example.

The dev server includes `#/review`, `#/notes`, and `#/plan`. Private research and internal review pages are excluded from the production build. Do not add private reference photos to public assets.
