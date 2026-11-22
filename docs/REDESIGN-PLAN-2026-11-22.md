# Redesign plan: windows on a route (22 November 2026)

The owner chose the design shown at [#/ui-demos/arches](http://localhost:4200/#/ui-demos/arches) and asked for a detailed plan to build it into the real app, covering everything the app does today, how much each part matters, and keeping it clear and intuitive. The owner answered its questions on 22 November (see [Decisions](#decisions)); only the welcome for first-time visitors is still open, with the options shown at [#/notes/ui-concepts](http://localhost:4200/#/notes/ui-concepts).

## What we are building

The library opens on a wave route from Córdoba to Agra drawn over pencil lines of each place's own pattern, so a newcomer sees at once that these patterns come from real places and can pick one. Below it, Start here holds the twelve lessons, which draw themselves when you point at one, and then every pattern in a grid of windows, each shaped like the arch of its tradition, so the shape says where a pattern comes from before you read a word. Clicking a window opens the pattern on its finished wall, because the wall is the reward and the reason to learn; Make it yours floats over the wall, and Learn to draw it starts the steps in today's layout, which works and which the owner wanted kept.

Each decision below is the owner's pick from the demos, with the reason it helps:

- **The wall is the default view.** People come for the pattern; the steps are one click away (Learn to draw it, or Watch it drawn on the card). Today's address `#/<pattern>` already opens the finished wall, so links people have shared keep working.
- **Pointing at a window shows View (gold), Watch it drawn and Draw along**, centred and only as wide as their words, so the picture stays visible and the main choice is obvious.
- **Only Start here lessons play on hover**, because a construction playing on every card would be noise and cost the engine work for 195 cards.
- **The route filters the library and the home opens on all patterns**, so nothing is hidden behind a choice.
- **Make it yours floats over the wall** with a button to hide it, so the wall stays the hero and can be seen whole.

## Every feature today, and where it goes

Importance is how much it matters to people using the app: **core** (most visits use it), **regular** (many people, some of the time), **occasional** (few people, or rarely) and **owner** (the owner or developers only).

### The library

| Today | In the new design | Importance |
| --- | --- | --- |
| Hero: a compass drawing and three steps explaining the app | Removed: a wow for a first visit but little use after, and it costs a screen of height. A first visit gets a short welcome instead (still open) | regular |
| Start here (the twelve-lesson path) and Begin | Start here shelf, the lessons as round windows that play on hover, with Begin or Continue lesson N | core |
| Work in progress row (continue where you left off) | A Continue card at the front of Start here, only when there is work in progress | regular |
| My designs and my patterns shelves | Stay on Your work; the home shows a "Your work (n)" link in the top bar | occasional |
| Search | In the top bar, same matching as today (`search.ts`) | core |
| Place filter (side menu, with counts) | The route: each place's stretch is clickable, with its count, and lights its part of the drawing | core |
| Tradition filter (Nasrid, Marinid, Mamluk…) and its context panel | Under the heading of a chosen place: its traditions as chips, and the place's line of context and Arabic name | regular |
| Star (fold) and level filters, Photo | The filter row under the route, as in the demo | regular |
| Sort | In the heading line | occasional |
| Filter tags and Clear filters | Clear filters beside the count in the heading | regular |
| Browse drawer on phones | Not needed: the route scrolls sideways and the filters are one row | — |
| Pattern books (40 designs from books and drawings) | A button in the heading line, as in the demo | occasional |
| Card details: title, star, level dots, steps, place, "2 designs" | Kept under each window; the badge sits inside the arch | core |
| Upcoming teaser | A quiet link at the foot of the grid | occasional |
| `#/collection` address | Kept as an alias of the library, for old links | owner |
| Hidden patterns (owner's visibility switch) | Unchanged | owner |
| Developer links in the footer | Unchanged, development builds only | owner |
| New pattern, theme switch | Top bar | regular |

### The pattern page

| Today | In the new design | Importance |
| --- | --- | --- |
| Finished wall, zoom, pinch, drag, reset view | The page opens on it, full width, with reset in the corner | core |
| Watch: steps, Journey track, Back/Next, Play, keys | Today's layout, unchanged, reached by Learn to draw it or the mode switch | core |
| Mode switch Watch / Result / Draw | One switch in the top bar: Wall (gold) / Watch it drawn / Draw along | core |
| Five wall styles | Make it yours: a picture of each style in the wall's own colours | core |
| Palettes and painting pieces | Make it yours: palettes, then the colour bowls; tap a piece to paint every copy | core |
| Band, edge and grout colours; jali controls | Make it yours, under "More colours", opened only when wanted | occasional |
| Designs (variations) and Places (the same design elsewhere) | A row under the title in Make it yours, when a pattern has more than one | regular |
| Photo of the real pattern beside the wall, and the source credit | A "The real wall" button in Make it yours that opens the photo beside the wall (owner: photos are for reference) | occasional |
| Next lesson, Make a variation | The filled button at the foot of Make it yours | regular |
| Save design, Share link | Save and Share at the foot of Make it yours | regular |
| Make it in 3D | 3D beside them | occasional |
| Print sheet, Copy into the editor at any step, Feedback | A "More" menu (⋯) at the foot of Make it yours; Copy here also stays on the steps | occasional |
| Previous/Next pattern and the Patterns sidebar with search | Arrows around the title stay; the Patterns sidebar stays as an icon in the top bar | regular |
| Settings: speed, ink order, names, helper lines, reduce motion | Unchanged, in the top bar's gear | occasional |
| Unsaved-changes guard, colour-first order, copies, paper, loading card | Unchanged | regular |

### Other pages

Learn, Your work, Draw along, Make in 3D, the editor, shared designs, Studio and the assistant, the feedback inbox and Upcoming keep their content. Each gets the same one-line top bar, so the app feels like one thing; nothing else on them changes in this redesign. The review, notes and plan pages are for the owner and stay as they are.

### What goes away

- **The hero animation on the home page.** The route does its job (what is this, where to start) in less height.
- **The library side menu and phone browse drawer.** The route and one row of filters replace them.
- **The demos.** `#/ui-demos` (ours) and `#/concepts` and `#/demos` (Gemini's) are removed once the real screens are built, so the app has one design.

## How it will be built

The demos are throwaway: they reuse Gemini's `useDemoStudio`, keep their own progress and only pretend to save. The real build ports the pieces into `apps/player/src/app/` and wires them to the real player, so every feature above keeps working. The engine and the tutorials do not change, so the golden tests prove the patterns are untouched.

- **Arches.** One module, `app/arches.ts`, holds the shapes (drawn in a 100 × 125 box, as clip paths) and which arch each pattern takes, by its tradition, falling back to its place, with unit tests that every shape stays inside its box and that every tutorial gets an arch. The frame and the gold edge are drawn over the picture, because a clipped element cannot show a border or a shadow of its own.
- **The pencil band behind the route.** Drawing nine walls with the engine on every visit costs about a second of work on a phone, so a build script (`pnpm route-band`, run with the catalogue) renders the band once into two small SVG files, light and dark, with Turkey shown closer. The home then loads a picture, and the band follows the library when patterns change.
- **The place in the address.** Choosing a place writes `#/places/<place>`, so a place can be shared and Back works; other filters stay remembered as today.
- **Touch screens.** There is no pointing on a phone, so a tap on the window opens the wall as it does on a computer, and the two other actions show as small icons under the title. Start here plays its lesson only when the card scrolls fully into view, one at a time.
- **Tests.** Each task updates the browser tests it touches in the same commit, on desktop, tablet and phone, and adds its own; today 73 browser tests run in three sizes (416 runs). Every task ends with the full test, lint and typecheck, and `pnpm test:browser`.

## The tasks, in order

One task per session and one commit per task, each with its acceptance test. Each is shown to the owner on the review page with pictures before the next begins.

1. **REDESIGN.1 Arches and windows.** The arch module, a `Window` card component (picture, arch, frame, badge, hover and focus buttons, touch icons) and the tradition-to-arch table. Accepted when a review page shows one card of every arch in light and dark, and keyboard focus reveals the buttons.
2. **REDESIGN.2 The route.** The wave, the clickable stretches, the build-time pencil band, `#/places/<place>`, the slim line on scroll and the phone row. Accepted when every place can be chosen by clicking its stretch, its dot or with the keyboard, and Back returns to all patterns.
3. **REDESIGN.3 The new library page.** Top bar, route, filter row, Start here (with Continue and hover play), the place heading with its traditions, Pattern books, sort, the grid of windows and the empty state; the old hero, side menu and drawer are removed. Accepted when every library feature in the table above works, and the browser tests for browsing, entry points, accessibility and the learning path pass.
4. **REDESIGN.4 The wall page.** The floating Make it yours: style pictures, palettes, painting, More colours, designs and places, The real wall, Next, Save, Share, 3D and the More menu; hide and show; a sheet on phones. Accepted when every pattern-page feature in the table works from the panel, and the sharing, settings and places tests pass.
5. **REDESIGN.5 The steps and the top bar.** The one-line top bar on the pattern page with the mode switch, around today's step layout; the same top bar on Learn, Your work and the other pages. Accepted when the playback, journey, navigation, draw-along and layout-fit tests pass on all three sizes.
6. **REDESIGN.6 Clean up and check.** Remove the demos and the old library code, check speed (the home and a wall open as fast as today), reduced motion, screen readers and phone gestures, and update the notes. Accepted when the owner has looked at every screen on the review page and the live preview.

## Decisions

The owner answered on 22 November:

1. **The arch follows the pattern's tradition**, with its place as the fallback: Mudéjar takes the horseshoe, Nasrid the scalloped arch, Marinid, Moroccan and Maghrebi the pointed horseshoe, Mamluk and Tulunid the keel, Ottoman and Seljuk the pointed arch, Persian and Safavid the four-centred arch, Timurid the portal, Mughal the cusped arch, and the rest the round arch.
2. **The welcome for first-time visitors is still open.** The hero goes (the owner: a wow for a first visit, but not useful beyond that and it takes a lot of space). Three ways to welcome a first visit are shown at [#/notes/ui-concepts](http://localhost:4200/#/notes/ui-concepts) for the owner to choose later; REDESIGN.3 builds the chosen one.
3. **The pencil band is made at build time**, in a light and a dark version.
4. **The tradition filter stays**, as chips under a chosen place.
5. **The Patterns sidebar stays** on the pattern page, as an icon in the top bar.
6. **The demos are committed on `ui/concept-lab` as a record**, and the redesign is built on a fresh branch from main.
