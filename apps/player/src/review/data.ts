// What the overnight run of 3–4 October 2026 needs from the owner, shown
// on the dev-only review page (#/review). Pictures come from docs/review
// (our renders) and docs/research (reference photos and source drawings),
// which the dev server serves under /__review; they never ship.

export interface Picture {
  /** Path under /__review: renders/<id>/<file> or research/<id>/<file>. */
  readonly src: string;
  readonly caption: string;
}

export interface Source {
  readonly label: string;
  readonly url: string;
}

export interface Pattern {
  readonly id: string;
  readonly title: string;
  readonly fold: number;
  readonly status: 'decide' | 'decided' | 'verified';
  /** For "decided": the owner's decision and what I am doing about it. */
  readonly decision?: string;
  /** One sentence: what this pattern is. */
  readonly summary: string;
  /** What happened, in plain words. */
  readonly story: readonly string[];
  readonly pictures: readonly Picture[];
  /** For "decide": the questions to answer. For "verified": what to glance at. */
  readonly asks: readonly string[];
  readonly sources: readonly Source[];
}

const MAMOOT = 'https://mamootdiy.com';

export const PATTERNS: readonly Pattern[] = [
  {
    id: 'band-and-pointer-2026-10-22',
    title: 'The home page’s star band and the editor’s pointers',
    fold: 8,
    status: 'decided',
    decision:
      'Pointers Q are kept, with the line or circle the click will draw in gold (picture 5). On 22 October you chose to remove both star bands from the home page instead, which is cleaner.',
    summary:
      'You found the star band on the home page too crowded to read, and asked whether the editor’s tool pointers could be easier to see and recognise.',
    story: [
      'The band is cramped because it squeezes a whole field of stars into 18 pixels, so each star is about eleven pixels wide and half of them are cut off at the edges. Design B in picture 1 keeps only one row of whole stars, about two thirds taller, separated by a thin line of plaster as grout separates real zellige tiles, with a hairline above and below like the edge of a dado. B2 is the same with brass crosses between the stars, which is livelier but louder. C keeps today’s field, only larger.',
      'You asked whether a second colour could show the line that halves the angle. It can, if the colour always means the same thing, so in every sign the line or circle the click will draw is gold and what is already there is white: the halving line, the square-to line, the second parallel, the touching circle, the copied circle and the new block. Gold rather than red because red nearly vanishes on the blue and green badges at real size, and gold matches the orange the board already uses for the line being drawn.',
      'The pointers (picture 2) are all the same dark ink today, so they tell tools apart only by the small sign. Design Q fills the badge with one colour per kind of tool, blue for the compass tools, green for the ruler tools, terracotta for the shapes and brass for the point, with a white sign and a white edge, so the colour says the kind before you read the sign and it stands out on both boards. R uses one orange for every tool. The crosshair stays dark with a light edge, a touch thicker, with a coloured dot at its centre.',
    ],
    pictures: [
      {
        src: 'renders/band-and-pointer-2026-10-22/A-bands.png',
        caption:
          '1. The star band: A as it is now, B one row of stars with grout (my pick), B2 with brass crosses, C today’s field made larger. Light theme on top, dark below.',
      },
      {
        src: 'renders/band-and-pointer-2026-10-22/B-pointers.png',
        caption:
          '2. The pointers at three times their size and at real size: P now, Q one colour per kind of tool (my pick), R one orange for all.',
      },
      {
        src: 'renders/band-and-pointer-2026-10-22/C-band-light.png',
        caption: '3. Built: band B on the home page, light theme.',
      },
      {
        src: 'renders/band-and-pointer-2026-10-22/C-band-dark.png',
        caption: '4. Built: band B on the home page, dark theme.',
      },
      {
        src: 'renders/band-and-pointer-2026-10-22/D-pointers.png',
        caption:
          '5. Built: pointers Q, with the line or circle the click will draw in gold beside what is already there (same opening, touching, square to, parallel, halve angle, block).',
      },
    ],
    asks: ['Nothing to do.'],
    sources: [],
  },
  {
    id: 'atelier-review-2026-10-22',
    title: 'Antigravity’s design branch (atelier-ui)',
    fold: 8,
    status: 'decided',
    summary:
      'You asked Antigravity to review the design and improve it; it wrote a long proposal and committed a smaller set of changes on its own branch.',
    decision:
      'You liked the idea behind its compass pointer but it did not show for you, so (22 October) every editor tool now has its own pointer, built on main: a crosshair aimed at the exact click point, with the tool’s sign beside it (picture E). Nothing else is taken from the branch, which can be closed.',
    story: [
      'What it proposed and what it built are far apart. The proposal promised hover-only card buttons, a brass compass that swings each circle, a slider fading the construction into the ink, a sun that casts the jali’s shadow, and the four stages renamed as “historic rites”. None of these was built, though its summary says everything discussed was. What it did build: star glyphs on the fold chips, a lift and zoom on cards under the mouse, a fade between pages, bevels on the frames and colour buttons, two more jali backgrounds, and a compass-shaped cursor in the editor.',
      'The star glyphs do not work (B): at their size the 8, 10, 12 and 16-pointed stars are all the same grey blob, so they add noise without telling the folds apart, and on a phone they push the chips into a lumpy block (C). Moving “See it” to the middle of the picture wraps it onto two lines over the pattern on a phone (C). The bevels are hard to see on a computer (D) and are written as fixed white and black, which breaks the rule that every colour has a light and a dark value. The “sunlight” for the jali is two more flat background colours with lighting names. The page fade snapshots the whole screen on every page change, which costs time on the large walls, and you asked for speed first.',
      'Two smaller problems: the branch starts before last night’s fix 8 and today’s changes, so merging it would put the arch back round the home drawing, which you just squared; and the “4 historic rites” names for the stages are not a real tradition, which breaks our rule of making no claims we cannot back. Worth keeping: the editor’s cursor turns into a small compass when the compass tool is chosen, which is a nice touch and costs nothing.',
      'Ideas from the proposal worth a later look, as their own tasks: a compass and ruler drawn moving during “Watch it drawn”, and a brief glow where two circles cross to show why a point exists.',
    ],
    pictures: [
      {
        src: 'renders/atelier-review-2026-10-22/A-cards-branch.png',
        caption:
          'A. The branch’s cards: star glyphs on the chips and folds, “See it” in the middle of the picture under the mouse.',
      },
      {
        src: 'renders/atelier-review-2026-10-22/A2-cards-main.png',
        caption: 'A2. The same cards on the live app today, for comparison.',
      },
      {
        src: 'renders/atelier-review-2026-10-22/B-fold-glyphs.png',
        caption:
          'B. The fold chips zoomed three times: the 8, 10, 12 and 16-fold stars look alike.',
      },
      {
        src: 'renders/atelier-review-2026-10-22/C-phone-cards.png',
        caption:
          'C. On a phone: the chips bunch into a block and “See it” wraps onto two lines over the picture.',
      },
      {
        src: 'renders/tool-pointers-2026-10-22/A-pointers.png',
        caption:
          'E. The editor’s new pointers, one per tool, on the light board (top) and the dark one (bottom), at four times their size.',
      },
      {
        src: 'renders/atelier-review-2026-10-22/D-color-wells.png',
        caption:
          'D. The colour stage with the bevelled frame and colour buttons; the difference is hard to see.',
      },
    ],
    asks: ['What to take from the branch (question above).'],
    sources: [],
  },
  {
    id: 'design-review-2026-10-22',
    title: 'Design review: the app against the approved design',
    fold: 8,
    status: 'decided',
    summary:
      'You asked (21 October) why the cards lost the arch from the design, and for a full review of the app against the design canvas, with every fix made overnight. Eight fixes are in.',
    decision:
      'You chose (22 October) the arch for the library cards only. An opened pattern, watched or drawn along, and the home page’s animated drawing sit in a rectangular cedar frame, so I squared the home drawing again. You also asked to hide or show the original photo while viewing a pattern: the button is now on the drawing’s top corner, “Hide the original” or “Show the original”, instead of down in the side panel, where on a phone it sat a screen below the photo.',
    story: [
      'I compared every screen of the design canvas (style, library, lesson, colour, draw along, phone) with the app, light and dark, desktop and phone. The lesson and the colour stage already match it closely. The differences were these, each now fixed in its own commit.',
      '1, the arch. The design shows each card’s picture as a window in an arch and the home page’s drawing inside a cedar arch; the build had square corners, by oversight, not by decision (A, B, D). 2, the card buttons cut “Watch it drawn” at the border; they now share a row when both fit and stack when not (B). 3, labels and badges still used the old typewriter font, which the design dropped; they now use the text font in small letter-spaced capitals (A).',
      '4, draw along was furthest from the design: numbered capsules, a blue heading and tiny square tools. It now has the lesson’s khatam-star timeline, cedar labels, the tools in one pill with the chosen tool in saffron, and pill buttons. The layout is unchanged, so the board still never moves between steps (C). 5, the design and the 14 October UX review both asked for a library search: type a name, place or tradition, in any case and without accents (E). 6, an address Tastir cannot open now shows a plain notice with a way back instead of red typewriter text (G). 7, the editor’s tools and the upcoming page’s chips are pills like everything else (F). 8, on a phone the editor’s title now comes first, with Play and “Kept in this browser” on the row under it.',
      'Left as they are, on purpose: the lesson’s drawing keeps its rectangular cedar frame, as in the design’s desktop lesson (H), because an arch would hide points and circles near its top corners while you draw and zoom. The design’s phone lesson does show it in an arch (I is the app today); you chose the rectangle there too. Noticed but not changed: the Comares bones card has no line under its name, which is tutorial text rather than design.',
      'Checks: player unit tests 755 passed (1 skipped), lint and typecheck pass, and the browser suite 151 passed (17 skipped) on desktop, tablet and phone. Nothing is pushed, so the live site is unchanged until you say so.',
    ],
    pictures: [
      {
        src: 'renders/design-review-2026-10-22/A-home-arch.png',
        caption:
          'A. The home page: the drawing inside a cedar arch, and the labels in the text font.',
      },
      {
        src: 'renders/design-review-2026-10-22/B-cards-arch.png',
        caption:
          'B. Library cards: each picture is a window in an arch; the two buttons stack so their words fit.',
      },
      {
        src: 'renders/design-review-2026-10-22/D-phone-cards-dark.png',
        caption: 'D. The same cards on a phone, in the dark theme.',
      },
      {
        src: 'renders/design-review-2026-10-22/C-draw-along.png',
        caption:
          'C. Draw along: the khatam-star timeline, cedar labels, the tools in one pill, pill buttons.',
      },
      {
        src: 'renders/design-review-2026-10-22/E-search.png',
        caption:
          'E. The new library search: “comares” finds 6 of 39; Clear all empties it.',
      },
      {
        src: 'renders/design-review-2026-10-22/F-editor.png',
        caption: 'F. The pattern editor with pill tools.',
      },
      {
        src: 'renders/design-review-2026-10-22/G-broken-address.png',
        caption:
          'G. An address that leads nowhere: a plain notice and a way back.',
      },
      {
        src: 'renders/design-review-2026-10-22/H-lesson-board.png',
        caption:
          'H. The lesson on a computer, unchanged: a rectangular cedar frame, as in the design.',
      },
      {
        src: 'renders/design-review-2026-10-22/I-phone-lesson-dark.png',
        caption:
          'I. The lesson on a phone today: the same rectangular frame. The design’s phone mockup put this drawing in an arch.',
      },
    ],
    asks: [
      'Should the lesson’s drawing on a phone sit in an arch, as in the design’s phone mockup (picture I is today)?',
    ],
    sources: [
      {
        label: 'The approved design canvas',
        url: 'https://claude.ai/artifact/McyS36FxVoDKxVCUKNZmX1',
      },
    ],
  },
  {
    id: 'eight-fold-khatam',
    title: 'Eight-fold khatam',
    fold: 4,
    status: 'decided',
    decision:
      'You (11 October): Keep this as an unverified Safavid khatam drawing. It is now in the library with a historical-match label; future community contributions may provide a matching reference.',
    summary:
      'A Safavid khatam construction study after Sandy Kurt, kept in the library without claiming a verified match to the Hakim Mosque woodwork.',
    story: [
      'The construction follows Sandy Kurt’s tutorial “4fold Pattern from Al-Hakim Mosque, Isfahan” (steps 4–9), establishing a unit circle divided into eight parts, static and dynamic squares, radius-0.5 circles, and diagonal facet lines.',
      'We tested a 1 px red overlay (photo-overlay.png) against the free Wikimedia Commons candidate from the carved sandstone jali at Akbar’s Tomb in Sikandra (CC BY-SA 4.0 by LBM1948). While the eight-pointed stars align with the star voids, the band lattice does not match: the Sikandra jali features diamond (45°) and cartouche voids where our construction builds small squares, green hexagons, and white kites.',
      'The only free Commons candidate of the Al-Hakim Mosque minbar woodwork (“Rotten green design.jpg”) shows a damaged panel with the central star completely rotted away and missing, and continuous strap planks rather than mosaic tile facets. No matching free photo was found. The owner approved keeping the drawing as an unverified study on 11 October; the mismatching Sikandra photo is not shipped with it.',
    ],
    pictures: [
      {
        src: 'renders/eight-fold-khatam/photo-overlay.png',
        caption:
          'Our lines (red, 1 px) overlaid on the Sikandra jali screen: the stars align, but the surrounding band lattice mismatches.',
      },
      {
        src: 'renders/eight-fold-khatam/wall.png',
        caption: 'Our wall repeated.',
      },
      {
        src: 'renders/eight-fold-khatam/tile.png',
        caption: 'The static tile pieces.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Sandy Kurt, 4fold Pattern from Al-Hakim Mosque, Isfahan',
        url: 'https://sandykurt.com/free-tutorials',
      },
    ],
  },
  {
    id: 'eight-fold-star-and-octagon',
    title: 'Eight-fold star and octagon',
    fold: 4,
    status: 'decided',
    decision:
      'You (11 October): Ship this Mughal star-and-octagon drawing at intermediate level. It is now in the library; its historical photo match remains unverified.',
    summary:
      'An intermediate Mughal star-and-octagon study after Sandy Kurt. The monument photograph is a historical reference, not a verified match.',
    story: [
      'From the pietra dura marble inlay panels on the exterior wall of the Tomb of I’timād-ud-Daulah in Agra (Mughal, 1622–1628 CE), documented in Sandy Kurt’s tutorial “4fold Pattern from the Tomb of Itimud ad-Daula”.',
      'The construction establishes a circle divided into eight parts, static and dynamic squares, and small circles of radius 0.5 at the centre and axes. The dynamic square tile carries an eight-pointed star at the centre and corner points that tile with regular octagons and small squares, forming clean eight-pointed stars across the wall with no stray lines.',
      'The earlier line-for-line verification claim was rejected in the 10 October team review: the repeat orientation and alignment do not match the monument panel. The owner approved publishing the intermediate drawing on 11 October. Historical verification remains pending.',
    ],
    pictures: [
      {
        src: 'renders/eight-fold-star-and-octagon/photo-overlay.png',
        caption:
          'Our lines (red, 1 px) overlaid on the Tomb of I’timād-ud-Daulah marble inlay panel (CC BY-SA 4.0 by Sabyasachi Paldas): the historical match remains unverified.',
      },
      {
        src: 'renders/eight-fold-star-and-octagon/wall.png',
        caption:
          'Our wall repeated, with clean eight-pointed stars and octagons.',
      },
      {
        src: 'renders/eight-fold-star-and-octagon/tile.png',
        caption: 'The dynamic square tile pieces.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Sandy Kurt, 4fold Pattern from the Tomb of Itimud ad-Daula',
        url: 'https://sandykurt.com/free-tutorials',
      },
      {
        label:
          'Wikimedia Commons: Inlay work detail on I’timad-ud-Daulah, Agra (Sabyasachi Paldas, CC BY-SA 4.0)',
        url: 'https://commons.wikimedia.org/wiki/File:Inlay_work_detail_on_I%27timad-ud-Daulah,_Agra.jpg',
      },
    ],
  },
  {
    id: 'ten-pointed-star-decagon-rect',
    title: 'Ten-pointed star and decagon, rectangular repeat',
    fold: 10,
    status: 'decided',
    decision:
      'You (11 October): Keep this as an unverified ten-fold rectangular repeat. Research the authentic Darb-e Imam pattern separately in Upcoming.',
    summary:
      'A ten-pointed star and decagon construction study in a rectangular repeat, kept with an unverified historical-match label.',
    story: [
      'This tutorial was drafted as a 10-fold pattern repeated across a rectangular tile. It was previously labeled as the Darb-e Imam portal girih tiling, but that shrine portal features a famous two-level quasi-crystalline girih pattern which this rectangular repeat is not, and it was never verified against a monument photograph.',
      'We renamed it to accurately describe what it is: "Ten-pointed star and decagon, rectangular repeat", and removed claims of being Darb-e Imam, world-renowned, or quasicrystalline.',
      'The construction itself builds cleanly with ruler and compass (10 steps) and tiles periodically, and the owner approved keeping it as an unverified study on 11 October.',
    ],
    pictures: [],
    asks: [],
    sources: [
      {
        label:
          'Separate upcoming Darb-e Imam reference (Lu & Steinhardt, Science 2007)',
        url: 'https://doi.org/10.1126/science.1135491',
      },
    ],
  },
  {
    id: 'draw-along-plan',
    title: 'Plan: draw along',
    fold: 8,
    status: 'decided',
    decision:
      'You (7 October): Next is always open, so a learner can peek ahead or draw several steps at once; the two drawings line up; all tools, the right one only as a hint, each with a tooltip; a third “Draw along” button on beginner cards and in the player. The builder and tester agents are building it.',
    summary:
      'Your split-screen idea: the tutorial shows each step on the right and the learner draws it on the left, starting with the thirteen beginner patterns.',
    story: [
      'The whole plan, with mock-ups made from the real editor and player, is on its own page: open #/plan/draw-along. In short, the right half is the player and the left half is the editor; a step counts as done when the learner’s drawing has the same circles and lines in the same places, however they were drawn; three levels of hints and “Draw it for me” help a stuck learner; at the end they ink their own drawing and colour its wall.',
      'Three things are yours to decide; the questions are at the top of this page. Once you answer, the builder and tester agents build it task by task, as before.',
    ],
    pictures: [
      {
        src: 'renders/user-patterns/draw-along/a-split-screen.png',
        caption:
          'A: the learner’s board (left). B: the step to copy (right). C: the hint buttons; Next opens when the board has the step.',
      },
      {
        src: 'renders/user-patterns/draw-along/b-hints.png',
        caption: 'The three hint levels on the board.',
      },
    ],
    asks: [],
    sources: [{ label: 'The draw-along plan', url: '/#/plan/draw-along' }],
  },
  {
    id: 'lee-rosette-block',
    title: 'The rosette building block',
    fold: 8,
    status: 'decided',
    decision:
      'You (7 October): it does not look like our rosette; skip it for now and focus on the beginner patterns. The block is removed from the editor’s Building blocks.',
    summary:
      'A building block in the editor that draws an eight-fold rosette round a circle by Anthony Lee’s method, and inks it.',
    story: [
      'In the editor, Building blocks has “A. J. Lee’s rosette (eight-fold)”. On a circle it adds eight steps, all ruler and compass: the octagon’s side middles, the star lines, a circle about each corner, the halving lines and petal lines, and where the petal lines meet past the inner points. It inks itself, so with the square tile round the circle it plays at once.',
      'The result (A) has the same structure as our sixteen-fold rosette (B): a star in the middle and a ring of petals, with six corners each. It is credited to Anthony Lee and to Craig Kaplan, whose paper generalises the method, and any pattern that uses the block keeps that credit in its file.',
    ],
    pictures: [
      {
        src: 'renders/user-patterns/lee/a-rosette-block.png',
        caption:
          'A: a new pattern with one circle, the rosette block and the square tile block, played to the colour stage.',
      },
      {
        src: 'renders/user-patterns/lee/b-sixteen-fold-rosette.png',
        caption: 'B: our sixteen-fold rosette, for comparison.',
      },
    ],
    asks: [
      'Does A read as a real eight-fold rosette, or should its petals or the lines round it change?',
    ],
    sources: [],
  },
  {
    id: 'send-to-library',
    title: 'Send it to the library',
    fold: 8,
    status: 'decided',
    decision:
      'You (7 October): hide the button until there is a form or a server, rather than publish an address. It is hidden; learners can still download their pattern file.',
    summary:
      'A learner with a finished pattern can make a library-ready file with their name in its credits, to send to us for review.',
    story: [
      'In the editor, “About the pattern” has “Send it to the library” once the pattern is tiled and inked. The learner types their name, downloads the file, and is told we check it, give it a golden test, show it on this page and credit them if it joins the library.',
      'There is no server yet, so the file has to reach us by hand, and the page needs to say where. Today it shows “[the address the Tastir team will give here]”.',
    ],
    pictures: [],
    asks: [],
    sources: [],
  },
  {
    id: 'photos-of-originals',
    title: 'Compare with the original (new)',
    fold: 4,
    status: 'decided',
    decision:
      'You: ship free photos wherever possible; use the others on the dev server only, with a placeholder in the built app until a free one is found. Done for the eleven tutorials added on 5–6 October.',
    summary:
      'At the color stage, “Compare with the original” shows a photo of the real pattern beside the wall, with its photographer and licence.',
    story: [
      'Seven Alhambra tutorials have free, open-licensed photos shipping with the app (from Wikimedia Commons and Flickr under Creative Commons or Public Domain), alongside the Met minbar doors and Cairo minbars for the other traditions. Following a line-for-line audit across 2×2 repeat crops with 1 px thin lines:',
      '• Kept: Sala de los Reyes stars (Shesmax, CC BY-SA 3.0 es) verified line-for-line across octagons, stars, and crosses; David Wade’s photo SPA 0408x is kept as a private reference.',
      '• Dropped: Sala de la Barca stars (muffinn photo is a field of small stars, a different pattern); Comares bath stars (Venturini photo has different ribbon interlace topology from AL01); Comares frames (Ashaio photo has stars at every grid position, differing from Wichmann SPA 1416 where diamonds alternate); Reyes fret (Laurent 1870s alcove photo is too distant and low-resolution at 48 px per repeat to verify strapwork). These four retain David Wade’s private photos.',
      'One thing to judge: some walls are turned 45° from the photo (the Arrayanes squares and the Leones fret, for example), because the tutorial puts the grid along the axes. If that makes comparing hard, I can turn the photo to match.',
    ],
    pictures: [],
    asks: [],
    sources: [],
  },
  {
    id: 'redesign-review',
    title: 'Codex’s review of the redesign: what I think',
    fold: 8,
    status: 'decided',
    decision:
      'You (14 October): agreed with my two pushbacks (no tool chosen for the learner; the wall pinned instead of a second preview), and asked for the four “fix first” items, 1 to 4, one commit each. All four are done: 1 the result fits a tablet and the timeline never scrolls the page; 2 the browser tests follow the redesign (148 pass), and two faults they found are fixed (the draw-along board moved at a step without tools; the ink bitmap fell a pixel short at a close zoom); 3 changes before a design is named are kept in this browser and come back; 4 the editor starts with copies and whole-line inking off. Then you asked for 5 to 8, also done: 5 the phone says what to tap beside the board, and a suggested tool is dashed, not chosen; 6 “Your pattern is ready” with Save first at the end; 7 a ring pointed at in the panel lights up on the wall, and on a phone the wall stays pinned while the panel scrolls; 8 tools 44 px on phones, and colours named instead of hex codes. Then 9 and 10, done too: Continue also offers a drawing left partway, and the library has Clear all with an empty message that names the filters. All ten items of the review are done.',
    summary:
      'Codex reviewed the redesign and found nine things to improve. I agree with almost all of them, push back on two details, and found one more problem myself.',
    story: [
      'I checked Codex’s two strongest claims myself, and both are true. At tablet width the finished pattern opens scrolled to the bottom with the drawing 2,027 px tall (A); that is my mistake from R2 and R3. And the editor still starts with symmetric and whole-line inking switched on, which breaks your 8 October rule that anything doing more than the click shows it first or starts off. I also found that 46 of the browser tests fail: I never ran that suite during the redesign. Many of them still expect the old design (two boards, cards opening the result), but some may be real problems, so each needs a look.',
      'Fix first, in this order. 1, the tablet: below 1,100 px the colour panel goes under the wall, the drawing keeps a bounded height, and the timeline scrolls only its own row, never the page. 2, the browser tests: update the ones that test the old design, and fix any real fault the others show. 3, first colours kept: an unnamed design is kept as a draft in this browser as soon as it changes, as draw along already does, and comes back when you return. 4, the editor starts with symmetric and whole-line inking off.',
      'Next. 5, the phone’s draw along: one short live prompt in the bottom bar (“Tap the centre O”, then “Tap E”). Here I push back on one detail: Codex suggests choosing the tool for the learner, but choosing the compass or ruler is part of learning the construction, and we decided that no tool is chosen at first. Instead, the suggested tool should look clearly different from a chosen one. 6, the end of the lesson: “Your pattern is ready” with Save and Share at the top of the panel, and Make a variation and other patterns after them. 7, painting: when you point at a ring in the panel, that ring lights up on the wall. I would not add a second small preview; on a phone the wall stays pinned at the top while the panel scrolls. 8, larger tool buttons on phones (44 px) and colour names instead of hex codes for screen readers. I would leave choosing points with the keyboard for later, if ever: it is a lot of work, and you now have the arrow keys for Back and Next.',
      'Later. 9, Continue on the home page also offers a draw-along you left partway. 10, the library: a Clear all button, and the empty message names the filters chosen (it still says “both choices” with three filters). A search box can wait until the library is bigger; with 39 patterns the filters find them quickly.',
    ],
    pictures: [
      {
        src: 'renders/redesign/Review9-continue-drawing.png',
        caption:
          '9. Continue offers the drawing you left most recently (“Drawing along · Step 2 of 6”) and opens your board.',
      },
      {
        src: 'renders/redesign/Review10-clear-all.png',
        caption:
          '10. No pattern left by the filters: the message names them, with Clear all beside it and beside the filters.',
      },
      {
        src: 'renders/redesign/Review5-phone-prompt.png',
        caption:
          '5. Draw along on a phone: what to tap sits right under the board, above the bar; the suggested tool (Compass) has a dashed outline and is not chosen for you.',
      },
      {
        src: 'renders/redesign/Review6-ready.png',
        caption:
          '6. The end of a lesson: “Your pattern is ready” comes first, with Save and Copy a share link; the colours follow. The bottom button says Save my design.',
      },
      {
        src: 'renders/redesign/Review7-ring-lit.png',
        caption:
          '7. Pointing at Rosette A’s ring 4 (the small stars) in the panel: those stars stay bright on the wall and the rest fades.',
      },
      {
        src: 'renders/redesign/Review7-phone-pinned.png',
        caption:
          '7. On a phone, scrolled down to the palettes: the wall stays pinned at the top.',
      },
      {
        src: 'renders/redesign-review-2026-10-14/tablet-color-initial.png',
        caption:
          'A. The finished pattern at 1024 × 768 (Codex’s picture): opened at the bottom of the page, the drawing far taller than the screen.',
      },
      {
        src: 'renders/redesign-review-2026-10-14/phone-light-star-draw.png',
        caption:
          'B. Draw along on a phone (Codex’s picture): the board first, but what to tap is below it, partly under the bar.',
      },
      {
        src: 'renders/redesign-review-2026-10-14/phone-light-star-result.png',
        caption:
          'C. The end of a lesson on a phone (Codex’s picture): Save is far down the page.',
      },
    ],
    asks: [
      'Shall I do the four “fix first” items (1–4) now, one commit each?',
      'Do you agree with my two pushbacks (no tool chosen for the learner; no second preview while painting)?',
    ],
    sources: [
      {
        label: 'Codex’s review',
        url: '/__review/renders/redesign-review-2026-10-14/index.html',
      },
    ],
  },
  {
    id: 'redesign',
    title: 'The new look: plaster, zellige and ink, in light and dark',
    fold: 8,
    status: 'decided',
    decision:
      'You (13 October): start R1; draw along moves to one board with a faint guide (G), built in R5. On the colours panel mock you asked for my suggestion: I will build it as part of R3, because the mock and R3 are the same panel. Its palettes as colour strips, ring by ring or by shape, one row per ring and saving with the design all stay; R3 only puts the paint colours above the palettes. You can refine it once it is in the player. All six are built (13 and 14 October): the pictures marked R1 to R6 show them.',
    summary:
      'The plan for building the redesign you approved into the player, one task at a time, with a light and a dark mode.',
    story: [
      'The look moves from the dark blueprint to a drafting table in a Fès courtyard. The ground is warm plaster, the drawing is ink on paper inside a cedar arch, and the zellige colours appear only on coloured pieces and on the step being drawn. Steps are marked by eight-pointed khatam stars (pictures A, C, E). The dark mode keeps every piece of that on a deep ink ground, with brass labels and a lighter cedar frame (B, D). A sun and moon button in every header switches between them; the app starts in the device’s setting and remembers your choice in this browser. Every screen is on the design canvas: https://claude.ai/artifact/McyS36FxVoDKxVCUKNZmX1',
      'Two things from your earlier decisions stay as they are. The step colours keep the four roles you chose for Bou Inania (grey for earlier lines, orange for new lines, blue for what the step uses, green for new ink that turns black), so the red-brown points in the mocks become blue. The palettes stay visible as one-click colour strips, following your 11 October rule of no dropdown where the choices fit on screen; they move below the paint colours instead of above them.',
      'The plan also takes in the usability review written today (docs/UX-REVIEW-2026-10-13.md), because most of its first fixes are the same screens: the starter button opening step 1, the controls staying beside the drawing on a phone, one tool at a time in draw along, and the colour tools first.',
      'R1, the themes. I will give styles.css, along.css, editor.css and review.css one set of colour names with a light and a dark value each, switch the fonts to Marcellus, Manrope and Reem Kufi, and add the switch to the headers. Nothing moves on the page in this task, so you can check the colours alone.',
      'R2, the lesson. The drawing sits in the arch with the step text beside it, and one timeline under it in four chapters (Construct, Ink, Repeat, Colour) replaces the grid of step numbers. Back and Next are the only big buttons, and a lesson reopens at the step you left.',
      'R3, the colour panel: paint colours first, then the pieces by ring, then the palettes as strips, with Undo beside them.',
      'R4, the home page: the starter button opens step 1, a strip offers to continue the last lesson, the filters fit in one row, a whole card opens its lesson, and the Review page and Project notes links move to a footer that only the dev server shows.',
      'R5, draw along: only the tools the step needs are shown, the rest under More tools, and the instruction sits above the board (the last question on this page decides one board or two).',
      'R6, the phone: the drawing first, with the step text and buttons in a panel at the bottom.',
      'Each task is one commit, shown here before and after in both themes, with all tests, lint and typecheck passing. Tests that look for labels that change are updated in the same commit, never deleted.',
    ],
    pictures: [
      {
        src: 'renders/redesign/R6-phone-after.png',
        caption:
          'R6. On a phone, after: the home page’s words and Start button first; the lesson’s header on one row (back, ☰, the title, ⋯ settings, the moon) with the step under the drawing; the colour tools right under the wall; draw along with your board first, the tools under it, and Back and Next fixed at the bottom.',
      },
      {
        src: 'renders/redesign/R6-phone-before.png',
        caption: 'R6. The same four screens before.',
      },
      {
        src: 'renders/redesign/Along-kept.png',
        caption:
          'Draw along, after Keep: “Kept in My patterns as …”, with Play it, Make a variation and My patterns, over the board. The button says Kept ✓ until something changes, then Keep the changes.',
      },
      {
        src: 'renders/redesign/Along-guide-points.png',
        caption:
          'Draw along, step 5: the guide shows only the points the step starts from (blue); the crossings its lines make appear on your board once you draw them.',
      },
      {
        src: 'renders/redesign/R5-step1-light.png',
        caption:
          'R5. Draw along on one board: your board takes the whole width, and the step to copy lies over it as a faint dashed guide (here the first circle, through O and E). Only the step’s tool shows, Compass, with More tools beside it.',
      },
      {
        src: 'renders/redesign/R5-step5-dark.png',
        caption:
          'R5. Step 5, dark: the static square dashed through the points on your board, and only Polygon among the tools.',
      },
      {
        src: 'renders/redesign/R5-ink-light.png',
        caption:
          'R5. The ink: the pattern’s ink, faint, on your board to trace over.',
      },
      {
        src: 'renders/redesign/R5-repeat-light.png',
        caption:
          'R5. The repeat and the colours keep two halves: your wall, and the wall to aim for (or the colours).',
      },
      {
        src: 'renders/redesign/Fix-bou-repeat-2x2.png',
        caption:
          'Bou Inania’s repeat, 2 × 2: four copies of the tile the ink shows, one rosette with half a band on every side, so the halves meet in whole bands and the corner quarters in eight-pointed stars.',
      },
      {
        src: 'renders/redesign/Fill-bou-frames.png',
        caption:
          'The move into colour on Bou Inania, a frame every half second or so: each rosette starts at its centre star and fills ring by ring outward. The old cover, which sat slightly off the wall, is gone.',
      },
      {
        src: 'renders/redesign/R4-home-dark.png',
        caption:
          'R4. The home page, dark: the header fits one row, a strip offers to continue the lesson left partway (here Bou Inania at step 9), and Start with the star and cross opens step 1, with its level and length beside it.',
      },
      {
        src: 'renders/redesign/R4-home-light.png',
        caption: 'R4. The same, light, with no lesson left partway.',
      },
      {
        src: 'renders/redesign/R4-cards-dark.png',
        caption:
          'R4. The filters in one row: symmetry as buttons, level and tradition as menus. A whole card opens its lesson at step 1; See the result and Draw along are quiet links under it.',
      },
      {
        src: 'renders/redesign/R4-footer-light.png',
        caption:
          'R4. The Review page and Project notes links, now in the footer (the dev server only).',
      },
      {
        src: 'renders/redesign/R3-bou-light.png',
        caption:
          'R3. The colour panel on Bou Inania: 1 pick a colour (Undo beside it), 2 click a piece on the wall or here. Every ring of each rosette and of the filler stars is a small piece in its colour; a click paints the whole ring.',
      },
      {
        src: 'renders/redesign/R3-bou-dark-palettes.png',
        caption:
          'R3. Further down: the size of the unit, then the palettes as strips of their colours, one click each.',
      },
      {
        src: 'renders/redesign/R3-star-light.png',
        caption:
          'R3. The star and cross: two rosettes and the crosses between them, one piece each.',
      },
      {
        src: 'renders/redesign/R3-comares-dark.png',
        caption:
          'R3. Comares bones is coloured by place, not by rings, so it keeps its list of pieces; the step’s words and buttons come after the panel at this stage.',
      },
      {
        src: 'renders/redesign/R2-step-light.png',
        caption:
          'R2. A lesson at step 4: the drawing in its cedar frame, the step beside it with Back and Next, and the timeline of khatam stars along the bottom (green done, orange here).',
      },
      {
        src: 'renders/redesign/R2-step-dark.png',
        caption: 'R2. The same step, dark.',
      },
      {
        src: 'renders/redesign/R2-resumed-dark.png',
        caption:
          'R2. Bou Inania opened again after leaving it at step 9: “Continued where you left off”, with Start from step 1 beside it. The 22 steps fit on one row.',
      },
      {
        src: 'renders/redesign/R2-ink-light.png',
        caption: 'R2. The ink: Color it and Repeat it stay the two ways on.',
      },
      {
        src: 'renders/redesign/R2-color-light.png',
        caption:
          'R2. The color stage: the step and its buttons sit above the color panel, which R3 rebuilds.',
      },
      {
        src: 'renders/redesign/R2-phone.png',
        caption:
          'R2. On a phone the timeline sits above the drawing and scrolls sideways. R6 tidies the rest of the phone.',
      },
      {
        src: 'renders/redesign/R1-home-light.png',
        caption:
          'R1. The home page in the light theme. The switch (the moon) sits by New pattern; the header wraps onto two rows until R4 moves the Review page and Project notes links to a footer.',
      },
      {
        src: 'renders/redesign/R1-home-dark.png',
        caption: 'R1. The same, dark.',
      },
      {
        src: 'renders/redesign/R1-step-light.png',
        caption:
          'R1. A lesson step, light: orange is the new line, blue what it works from, as before.',
      },
      {
        src: 'renders/redesign/R1-step-dark.png',
        caption: 'R1. The same step, dark.',
      },
      {
        src: 'renders/redesign/R1-result-light.png',
        caption: 'R1. The colour stage, light. The tile colours are unchanged.',
      },
      {
        src: 'renders/redesign/R1-result-dark.png',
        caption: 'R1. The colour stage, dark.',
      },
      {
        src: 'renders/redesign/R1-draw-light.png',
        caption: 'R1. Draw along, light (one board comes in R5).',
      },
      {
        src: 'renders/redesign/R1-draw-dark.png',
        caption: 'R1. Draw along, dark.',
      },
      {
        src: 'renders/redesign/A-home-light.png',
        caption: 'A. Home, light.',
      },
      {
        src: 'renders/redesign/B-home-dark.png',
        caption: 'B. Home, dark.',
      },
      {
        src: 'renders/redesign/C-lesson-light.png',
        caption:
          'C. A lesson at step 4: the arch, the step text, and the four-chapter timeline.',
      },
      {
        src: 'renders/redesign/D-lesson-dark.png',
        caption: 'D. The same step, dark.',
      },
      {
        src: 'renders/redesign/E-colour-light.png',
        caption:
          'E. The colour stage: paint colours first, then the pieces by ring.',
      },
      {
        src: 'renders/redesign/F-draw-along-today.png',
        caption: 'F. Draw along today: two boards side by side.',
      },
      {
        src: 'renders/redesign/G-draw-along-one-board.png',
        caption:
          'G. Draw along on one board: the line to draw shows as a faint dotted guide.',
      },
    ],
    asks: [
      'Shall I start with R1, the light and dark themes?',
      'Draw along: two boards side by side (F) or one board with a faint guide (G)?',
    ],
    sources: [],
  },
  {
    id: 'ux-steps',
    title: 'Making long tutorials easy to follow (Bou Inania, step 13)',
    fold: 12,
    status: 'decided',
    decision:
      'You: inking as you go becomes a switch in every tutorial so you can compare it with inking at the end; yes to the four colours; yes to parts of one step (“Step 11 · 2 of 4”); yes to showing the next tile in blue. All six changes are built (open the Bou Inania rosette: the step 13 dots are gone, step 6 shows the inner circle and rays it uses in blue, steps 8 to 12 play in parts, and the last step shows the next tiles in blue; the Ink menu at the top switches between inking at the end and as you go).',
    summary:
      'Why step 13 is unreadable, and five changes that would make the long tutorials easy to follow. Every picture uses the real Bou Inania geometry.',
    story: [
      'Step 13 is not a drawing step (picture A). The player can only ink between named points, so the tutorial names every turning point of the pattern: 1,549 points and 88 helper lines, all in the “new” colour with their names. The learner has nothing to do and cannot see anything. Seven other tutorials have the same kind of step, but smaller (Kurt’s wheel 216 points, the four-fold ring 196, the stellated rosettes 176).',
      'First change: remove the marking steps. An ink path would name its line and the two lines where it stops, so the engine finds those points without showing them. This was already the next format change on the list. Step 13 then keeps only its one real idea, the band at the tile edge, and picture E shows that idea instead of describing it. The next tile is drawn beside this one in blue, and the band breaks where its lines come through.',
      'Second change: ink as you go (picture B). I checked every inked stretch of this pattern, and each one can be inked in the step that draws the line it turns onto. Step 6 inks the star, 7 the big twelve-sided figure, and 8 the small stars and pentagons (a third of the ink); 9 adds the octagon and frame, 10 the ring round the shields, and 11–12 the corners. Nothing is left for the end, so the last stage only clears the construction away and shows the finished pattern. The learner sees each line turn into pattern straight after drawing it, which is how the pattern is drawn by hand.',
      'Third change: four colours, each with one meaning (picture C). Earlier lines are light grey and new lines orange. Blue marks what this step uses: the crossing is ringed and the direction to follow is dashed. Ink drawn now is green and turns black at the next step. The colours stay distinct for colour-blind viewers, and each role also has its own thickness or dash, so colour is never the only clue. Only the one to three points the text talks about get a label, written in words (“from here”, “to here”) instead of codes like M1013.',
      'Fourth change: one move at a time (picture D). Steps 8 to 12 each pack two to four constructions into one paragraph, and step 11 has four. Split into 11a to 11d, each part shows only its own crossing and direction. The counter would read “Step 11 · 2 of 4”, so the tutorial still has 14 steps. Lines that only help find a point (11c and 11d make no ink of their own) would be drawn thin and dashed, so they read as helpers.',
      'Fifth change: the view follows the work. Each step zooms to the area it works in (step 12’s corner star is tiny today), then zooms out to show the copies turning round. Construction that will not be used again fades, and a button hides all the grey lines.',
      'Order of work, one task each, after your answers: the ink path change and removing the marking steps, then the colours and labels, then inking as you go, then the sub-steps and the zooming, and finally rewriting Bou Inania with all of it before moving the other long tutorials over.',
    ],
    pictures: [
      {
        src: 'renders/ux-steps/A-today-step13.png',
        caption: 'A. Step 13 today: 1,549 named points and 88 helper lines.',
      },
      {
        src: 'renders/ux-steps/B-ink-as-you-go.png',
        caption:
          'B. Ink as you go: green is the ink each step adds, black the ink already there.',
      },
      {
        src: 'renders/ux-steps/C-step6-roles.png',
        caption:
          'C. Step 6 with four colours: blue is what the step uses, orange the new lines, green the new ink.',
      },
      {
        src: 'renders/ux-steps/D-step11-split.png',
        caption:
          'D. Step 11 split into four moves, each with its crossing ringed and its direction dashed.',
      },
      {
        src: 'renders/ux-steps/E-overlap.png',
        caption:
          'E. The band at the edge, shown with the next tile in blue instead of 1,549 marks.',
      },
    ],
    asks: [
      'Should every tutorial ink as it goes (B)?',
      'Are the four colours right (C)?',
      'Split long steps into parts (D)?',
      'Show the next tile for the band (E)?',
    ],
    sources: [
      {
        label:
          'Okabe and Ito: colours that colour-blind viewers can tell apart',
        url: 'https://jfly.uni-koeln.de/color/',
      },
    ],
  },
  {
    id: 'alhambra-comares-frames',
    title: 'Framed stars of the Salón de Comares (new)',
    fold: 4,
    status: 'verified',
    summary:
      'A honey star in a square frame with black corners, teal stars round it, and small diamonds, all held in interlaced white bands.',
    story: [
      'All the stars are the same: two squares on one small circle, whose radius is one minus half the diagonal of the unit square. The frame round the honey star and the small diamonds come from that star’s own corners, so after the first circle every length is found with the ruler and a compass already open. Brian Wichmann’s drawing gave the design; the tutorial takes ten steps.',
      'Over David Wade’s photo, the tutorial’s lines run inside the white bands everywhere: round the frame, the stars and the diamonds (picture). On the panel the stars left and right of the frame are glazed black, those above and below teal.',
    ],
    pictures: [
      {
        src: 'renders/alhambra-comares-frames/photo-overlay.png',
        caption:
          'Left: the panel. Right: the same with the tutorial’s lines in red.',
      },
      {
        src: 'renders/alhambra-comares-frames/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Alhambra, Salón de Comares (SPA1416)',
        url: 'https://tilingsearch.mit.edu/HTML/data174/SPA1416.html',
      },
      {
        label: 'David Wade, Pattern in Islamic Art (photo SPA 1416)',
        url: 'https://patterninislamicart.com/',
      },
    ],
  },
  {
    id: 'alhambra-reyes-dodecagrams',
    title: 'Twelve-pointed stars of the Sala de los Reyes (new)',
    fold: 6,
    status: 'verified',
    summary:
      'A zellige of black twelve-pointed stars on a triangular grid, ringed by blue, honey and teal six-sided tiles and white kites.',
    story: [
      'Brian Wichmann’s drawing turned out to need only two kinds of line: twelve round each star, all touching one small circle whose radius is half the star’s point, and the sides of the hexagon through six points of the star’s circle. The tutorial finds the small circle with ruler and compass and copies the lines to the neighbouring stars, in eleven steps, on a hexagonal tile.',
      'Over David Wade’s photo of the panel, every tile has its outline (picture).',
    ],
    pictures: [
      {
        src: 'renders/alhambra-reyes-dodecagrams/photo-overlay.png',
        caption:
          'Left: the panel. Right: the same with the tutorial’s outlines in red.',
      },
      {
        src: 'renders/alhambra-reyes-dodecagrams/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Alhambra, Sala de los Reyes (P069)',
        url: 'https://tilingsearch.mit.edu/HTML/data177/P069.html',
      },
      {
        label: 'David Wade, Pattern in Islamic Art (photo SPA 1908)',
        url: 'https://patterninislamicart.com/',
      },
    ],
  },
  {
    id: 'alhambra-reyes-fret',
    title: 'Carved fret of the Sala de los Reyes (new)',
    fold: 4,
    status: 'verified',
    summary:
      'Carved plaster: long bars and hooked frets turning round a cross, with a small diamond wherever two bands cross. A pinwheel, so it has no mirror.',
    story: [
      'Every line of Brian Wichmann’s drawing is either horizontal or vertical at an odd sixth of OA, or slanting in pairs round the small diamonds that sit at the thirds. The diamond’s size comes from one circle: about O through the point a sixth of the way to the corner. The tutorial divides OA into sixths with the ruler and finds the diamonds with the compass, in eleven steps.',
      'I found every small diamond in David Wade’s photo of the panel (42 of them) and all fit the tutorial’s diamonds. Over the photo the tutorial’s lines follow the carved grooves (picture).',
    ],
    pictures: [
      {
        src: 'renders/alhambra-reyes-fret/photo-overlay.png',
        caption:
          'Left: the carved panel. Right: the same with the tutorial’s lines in red.',
      },
      { src: 'renders/alhambra-reyes-fret/wall.png', caption: 'Our wall.' },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Alhambra, Sala de los Reyes (PG365)',
        url: 'https://tilingsearch.mit.edu/HTML/data8/PG365.html',
      },
      {
        label: 'David Wade, Pattern in Islamic Art (photo SPA 0405x)',
        url: 'https://patterninislamicart.com/',
      },
    ],
  },
  {
    id: 'alhambra-mexuar-porch-fret',
    title: 'Ceiling fret of the Mexuar porch (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Long bars and hooked frets turning round a small star, like the Sala de los Reyes fret but with no diamonds where the bands cross. A variation of that fret: the two share one card in the library.',
    story: [
      'Every line of Brian Wichmann’s drawing sits at a third of OA plus or minus a small offset of √2/6, so the tutorial reuses the Reyes fret’s way of dividing OA into thirds and adds one circle for the offset, in eight steps.',
      'There is no photo of this ceiling to check against, so it is marked not yet verified. Over Wichmann’s drawing, every band centre line lies on ours (picture).',
    ],
    pictures: [
      {
        src: 'renders/alhambra-mexuar-porch-fret/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/alhambra-mexuar-porch-fret/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Alhambra, Mexuar/Arrayanes corridor (AL2)',
        url: 'https://tilingsearch.mit.edu/HTML/data184/AL2.html',
      },
    ],
  },
  {
    id: 'alhambra-mexuar-corridor-stars',
    title: 'Stars and frets of the Mexuar corridor (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Eight-pointed stars with T-shaped frets turning round them and a small square where four frets meet. A pinwheel, so it has no mirror.',
    story: [
      'The star is two squares, and the bands are exactly as wide as one star point; one crossing of two lines gives both sizes, in eight steps.',
      'No photo of the corridor panel has been found yet, so it is marked not yet verified. Over Wichmann’s drawing every edge matches (picture).',
    ],
    pictures: [
      {
        src: 'renders/alhambra-mexuar-corridor-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/alhambra-mexuar-corridor-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Alhambra, Mexuar Patio corridor (P051)',
        url: 'https://tilingsearch.mit.edu/HTML/data159/P051.html',
      },
    ],
  },
  {
    id: 'alhambra-museum-loops',
    title: 'Interlaced loops of the Alhambra Museum (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Notched square loops woven together, with an eight-pointed star in each loop. The same design is on the Chellah minaret in Rabat (CM014), which can become a variation.',
    story: [
      'Every line is at √2/4 or 1 − √2/4 from the centre, or on a diagonal through a half; the √2/4 comes from one circle crossing a diagonal, in seven steps.',
      'Wichmann colours the two sets of loops differently; the tutorial draws them as one band, which the colouring can still tell apart. No photo yet, so it is marked not yet verified.',
    ],
    pictures: [
      {
        src: 'renders/alhambra-museum-loops/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      { src: 'renders/alhambra-museum-loops/wall.png', caption: 'Our wall.' },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Alhambra Museum (RE3559)',
        url: 'https://tilingsearch.mit.edu/HTML/data183/RE3559.html',
      },
    ],
  },
  {
    id: 'shah-i-zinda-octagons',
    title: 'Octagons and stars of the Shah-i-Zinda (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Regular octagons touching corner to corner, with a four-pointed star in each gap: a five-step beginner tutorial.',
    story: [
      'The octagon’s corners lie on the first circle, so the whole pattern comes from dividing that circle into eight, in five steps.',
      'Our wall matches David Wade’s photo TRA 0301 by eye (private, not shipped). The Qaytbay floor below is its variation: the two share one card in the library.',
    ],
    pictures: [
      {
        src: 'research/tilingsearch-45/F254L/F254L-pdf.png',
        caption: 'Wichmann’s drawing.',
      },
      { src: 'renders/shah-i-zinda-octagons/wall.png', caption: 'Our wall.' },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Shah-i-Zinda, Samarkand (F254L)',
        url: 'https://tilingsearch.mit.edu/HTML/data147/F254L.html',
      },
    ],
  },
  {
    id: 'qaytbay-floor-octagons',
    title: 'Octagons of the Qaytbay madrasa floor (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'The Shah-i-Zinda octagons with their sides carried on past the corners, which closes a small octagon and four darts where four octagons meet.',
    story: [
      'It shares its first five steps with the Shah-i-Zinda octagons and adds two, so it is a variation of that pattern.',
      'No photo was available; checked against Wichmann’s drawing only.',
    ],
    pictures: [
      {
        src: 'research/tilingsearch-45/W2/W2-pdf.png',
        caption: 'Wichmann’s drawing.',
      },
      { src: 'renders/qaytbay-floor-octagons/wall.png', caption: 'Our wall.' },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Qaytbay madrasa floor (W2)',
        url: 'https://tilingsearch.mit.edu/HTML/data202/W2.html',
      },
    ],
  },
  {
    id: 'sircali-stars',
    title: 'Eight-pointed stars of the Sırçalı madrasa (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Sharp eight-pointed stars touching point to point, with notched crosses between them: a five-step beginner tutorial.',
    story: [
      'Each star line joins a point on the circle through the grid corner to a grid corner. It uses the same grid and tile as our Comares stars, but with the sharper star.',
      'No photo was available; checked against Wichmann’s drawing only.',
    ],
    pictures: [
      {
        src: 'research/tilingsearch-45/BON36/BON36-pdf.png',
        caption: 'Wichmann’s drawing.',
      },
      { src: 'renders/sircali-stars/wall.png', caption: 'Our wall.' },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Sırçalı madrasa, Konya (BON36)',
        url: 'https://tilingsearch.mit.edu/HTML/data211/BON36.html',
      },
    ],
  },
  {
    id: 'topkapi-scroll-pinwheel',
    title: 'Pinwheel of stars from the Topkapı scroll (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Eight-pointed stars turned so they do not line up with the page, with boot-shaped pieces and pentagons wheeling round them. A pinwheel, so it has no mirror.',
    story: [
      'Every edge lies on the star’s own lines or on one small diamond, so the construction is the star, four circles and that diamond, in six steps. The tile is a tilted square, because the stars do not sit on an upright grid.',
      'The photo the source lists shows a different scroll panel, so this is checked against Wichmann’s drawing only.',
    ],
    pictures: [
      {
        src: 'research/tilingsearch-45/R9/R9-pdf.png',
        caption: 'Wichmann’s drawing.',
      },
      { src: 'renders/topkapi-scroll-pinwheel/wall.png', caption: 'Our wall.' },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Topkapı Scroll, page 318 (R9)',
        url: 'https://tilingsearch.mit.edu/HTML/data19/R9.html',
      },
    ],
  },
  {
    id: 'alhambra-leones-door-stars',
    title:
      'Stars and arrows of the Patio de los Leones doors (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Equal eight-pointed stars at the centre and corners of each square, with hexagons, arrows, triangles and kites between them, every line a star side carried on.',
    story: [
      'One circle gives the star size (√2 − 1), and the rest is the stars’ own sides drawn long, in eight steps. Wichmann draws it turned by 45°; it is turned back to match David Wade’s photo SPA 0424x, which shows the same pieces (by eye; the photo is private).',
    ],
    pictures: [
      {
        src: 'renders/alhambra-leones-door-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/alhambra-leones-door-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Alhambra, Patio de los Leones (A233)',
        url: 'https://tilingsearch.mit.edu/HTML/data164/A233.html',
      },
    ],
  },
  {
    id: 'alhambra-comares-soffit-stars',
    title: 'Interlaced stars of the Comares soffits (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'The same layout as the Leones door stars with smaller stars (radius ½), so the hexagons, kites and triangles merge into one ground piece, woven as interlace.',
    story: [
      'Nine steps; the half of OA comes from one crossing. No photo was checked, only Wichmann’s drawing.',
    ],
    pictures: [
      {
        src: 'renders/alhambra-comares-soffit-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/alhambra-comares-soffit-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Alhambra, Salón de Comares (AL1)',
        url: 'https://tilingsearch.mit.edu/HTML/data187/AL1.html',
      },
    ],
  },
  {
    id: 'alhambra-comares-throne-dado',
    title:
      'Black and white stars of the Comares throne alcove (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'A white star in the middle and black ones at the corners, with crosses, boats, octagons and hexagons in black and white between them; the colouring follows Wichmann’s.',
    story: [
      'Twelve steps on a larger tile (four of OA across). Its centre ring is the same as the Leones door stars. Checked against Wichmann’s drawing only.',
    ],
    pictures: [
      {
        src: 'renders/alhambra-comares-throne-dado/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/alhambra-comares-throne-dado/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Alhambra, Salón de Comares (F219)',
        url: 'https://tilingsearch.mit.edu/HTML/data150/F219.html',
      },
    ],
  },
  {
    id: 'alhambra-leones-southeast-doors',
    title:
      'Stars and diamonds of the Patio de los Leones south-east doors (Alhambra) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square cell side by side. A large star sits at every corner of every cell, and a small star at every centre.',
    story: [
      'The finished design was read from Brian Wichmann’s SPA0417X drawing, its corners snapped to exact values. We devised the construction: a small star at O with the tip radius of the Leones door stars, its sides carried on, and lines at 45° through two points that follow from the circle with centre K1. The drawing gives no steps.',
      'Wichmann draws the design turned by 45°, with the stars above each other as on the doors; it is turned here so that the tile is the square cell. His bevelled bands are drawn as single lines along their middles. The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out.',
      '9 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/alhambra-leones-southeast-doors/photo-overlay.png',
        caption:
          'David Wade’s photo with the tutorial’s lines in red (private, not shipped).',
      },
      {
        src: 'renders/alhambra-leones-southeast-doors/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/alhambra-leones-southeast-doors/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Patio de los Leones, Alhambra (SPA0417X)',
        url: 'https://tilingsearch.mit.edu/HTML/data190/SPA0417X.html',
      },
    ],
  },
  {
    id: 'alhambra-leones-gallery-stars',
    title:
      'Stars of the Patio de los Leones south gallery (Alhambra) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square cell side by side. A small four-pointed star sits at every corner, ringed by four stars.',
    story: [
      'The finished design was read from Brian Wichmann’s SPA0508X drawing, its corners snapped to exact values. We devised the construction: every line is a side of an eight-pointed star of tip radius √2 − 1, at O or on the sides of the cell, carried on. The drawing gives no steps.',
      'Wichmann made the repeat from a single motif of the ceiling panel, so the wall is his and ours, not the building’s. His bevelled bands are drawn as single lines along their middles. The compass steps, their order and the named points are ours.',
      '11 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/alhambra-leones-gallery-stars/photo-overlay.png',
        caption:
          'David Wade’s photo with the tutorial’s lines in red (private, not shipped).',
      },
      {
        src: 'renders/alhambra-leones-gallery-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/alhambra-leones-gallery-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Patio de los Leones, Alhambra (SPA0508X)',
        url: 'https://tilingsearch.mit.edu/HTML/data190/SPA0508X.html',
      },
    ],
  },
  {
    id: 'alhambra-arrayanes-portico-doors',
    title:
      'Stars and octagons of the Patio de los Arrayanes doors (Alhambra) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the cell side by side. The stars make rows, and each row is the mirror image of the next.',
    story: [
      'The finished design was read from Brian Wichmann’s P077 drawing, its corners snapped to exact values. We devised the construction: the star at O has the tip radius of the Leones door stars, its sides are carried on, and the rows of stars are √2 apart, the radius of the circle through the corners of the square. The drawing gives no steps.',
      'His bevelled bands are drawn as single lines along their middles. No photo of the doors was checked: the copy of Wade’s SPA 2816 we hold shows a carved stucco panel instead. The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out.',
      '11 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/alhambra-arrayanes-portico-doors/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/alhambra-arrayanes-portico-doors/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Patio de los Arrayanes, Alhambra (P077)',
        url: 'https://tilingsearch.mit.edu/HTML/data159/P077.html',
      },
    ],
  },
  {
    id: 'chellah-minaret-loops',
    title:
      'Interlaced loops of the Chellah minaret (Rabat) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square cell side by side. Each loop weaves over and under its four neighbours.',
    story: [
      'The finished design was read from Brian Wichmann’s CM014 drawing. It is the design of the Alhambra Museum loops, built the same way: the straight bands pass where a circle of radius one half, or its mirror image, crosses the diagonal. The drawing gives no steps.',
      'The compass operations, step order and named crossings are our reconstruction. Wichmann’s colours follow Castéra’s plate of the minaret; no photo of the minaret was available to check the lines.',
      '7 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/chellah-minaret-loops/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/chellah-minaret-loops/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Chellah mosque minaret, Rabat (CM014)',
        url: 'https://tilingsearch.mit.edu/HTML/data15/CM014.html',
      },
    ],
  },
  {
    id: 'alcazar-interlaced-stars',
    title: 'Interlaced stars of the Alcázar of Seville (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square cell side by side. A large star sits at every centre and a small one at every corner. A long hexagon joins each two large stars.',
    story: [
      'The finished design was read from Brian Wichmann’s SPA2215 drawing, its corners snapped to exact values. Its lines are those of the Patio de los Leones doors: a star at O and one at each corner of the cell, both the same size, every side carried on. We reused that construction; the drawing gives no steps.',
      'The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. No photo of the real panel was checked.',
      '8 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/alcazar-interlaced-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/alcazar-interlaced-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Alcázar, Seville (SPA2215)',
        url: 'https://tilingsearch.mit.edu/HTML/data173/SPA2215.html',
      },
    ],
  },
  {
    id: 'toledo-tile-interlace',
    title: 'Interlaced stars of a Toledo tile (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square cell side by side. A large star sits at every centre and a smaller one at every corner.',
    story: [
      'The finished design was read from Brian Wichmann’s RAY12 drawing, its corners snapped to exact values. We devised the construction: the star of the Patio de los Leones doors at O and at each corner of the cell, a square through R and the diamond through A, B, C and D. The drawing gives no steps.',
      'Wichmann draws the design turned by 45°; it is turned back here so that the tile is the square cell. The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. No photo of the tile was checked.',
      '10 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/toledo-tile-interlace/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/toledo-tile-interlace/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Toledo tile, V&A (RAY12)',
        url: 'https://tilingsearch.mit.edu/HTML/data183/RAY12.html',
      },
    ],
  },
  {
    id: 'toledo-tile-stars',
    title: 'Stars and arrows of a Toledo tile (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square cell side by side. A star sits at every centre and every corner. Eight arrows point at each star at a centre, and four at each star at a corner.',
    story: [
      'The finished design was read from Brian Wichmann’s RAY1 drawing, its corners snapped to exact values. We devised the construction, the same as for the other Toledo tile with four more diagonals. The drawing gives no steps.',
      'The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. No photo of the tile was checked.',
      '11 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/toledo-tile-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/toledo-tile-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Toledo tile, V&A (RAY1)',
        url: 'https://tilingsearch.mit.edu/HTML/data184/RAY1.html',
      },
    ],
  },
  {
    id: 'spanish-mosaic-stars',
    title:
      'Stars of a Spanish tile mosaic (David Collection) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square cell side by side. A star sits at every centre and every corner.',
    story: [
      'The finished design was read from Brian Wichmann’s DS4 drawing, its corners snapped to exact values. We devised the construction: a star at O and one at each corner of the cell, both the same size, the square through M and four diagonals through V and W. The drawing gives no steps.',
      'Wichmann draws the design turned by 45°; it is turned back here so that the tile is the square cell. The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. No photo of the panel was checked.',
      '10 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/spanish-mosaic-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/spanish-mosaic-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Tile mosaic panel, Spain (DS4)',
        url: 'https://tilingsearch.mit.edu/HTML/data184/DS4.html',
      },
    ],
  },
  {
    id: 'alcazar-mosaic-stars',
    title: 'Tile mosaic stars of the Alcázar of Seville (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square cell side by side. A large star sits at every centre and a small star at every corner. A cross sits between each two large stars.',
    story: [
      'The finished design was read from Brian Wichmann’s H424 drawing, its corners snapped to exact values. We devised the construction: every line lies at one of two distances, t and 3t, from O, from the middle of a side of the cell or from a corner. The drawing gives no steps.',
      'The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. No photo of the real mosaic was checked.',
      '11 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/alcazar-mosaic-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/alcazar-mosaic-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Alcázar, Seville (H424)',
        url: 'https://tilingsearch.mit.edu/HTML/data9/H424.html',
      },
    ],
  },
  {
    id: 'qom-atabaki-stars',
    title: 'Stars and squares of the Atabaki court, Qom (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square cell side by side. A star sits at every centre, with a large square at each corner and on each side of the cell.',
    story: [
      'The finished design was read from Brian Wichmann’s F77 drawing, its corners snapped to exact values. We devised the construction: a star of two squares at O, and a diamond on the same circle round A, B, C and D, every side carried on. The drawing gives no steps.',
      'Wichmann draws the design turned by 45°; it is turned here so that the tile is the square cell. The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. No photo of the wall was checked.',
      '8 steps, beginner.',
    ],
    pictures: [
      {
        src: 'renders/qom-atabaki-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/qom-atabaki-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Atabaki court, Qom (F77)',
        url: 'https://tilingsearch.mit.edu/HTML/data16/F77.html',
      },
    ],
  },
  {
    id: 'mashhad-courtyard-stars',
    title:
      'Stars and crosses of the new courtyard, Mashhad (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square cell side by side. A star sits at every centre and a cross at every corner.',
    story: [
      'The finished design was read from Brian Wichmann’s F82 drawing, its corners snapped to exact values. It has every line of the Atabaki court design of Qom (F77), inked another way, so it uses the same construction. The drawing gives no steps.',
      'Wichmann draws the design turned by 45°; it is turned here so that the tile is the square cell. The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. No photo of the wall was checked.',
      '6 steps, beginner.',
    ],
    pictures: [
      {
        src: 'renders/mashhad-courtyard-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/mashhad-courtyard-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: The new courtyard, Mashhad (F82)',
        url: 'https://tilingsearch.mit.edu/HTML/data16/F82.html',
      },
    ],
  },
  {
    id: 'shiraz-qavam-crosses',
    title: 'Crosses of the Qavam Hosseiniyeh, Shiraz (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square cell side by side. A cross sits at every centre and a diamond at every corner.',
    story: [
      'The finished design was read from Brian Wichmann’s P47 drawing, its corners snapped to exact values. We devised the construction: one length, the radius of the circle round K1 through F, gives the point and the shoulder of the cross, and the cross’s lines carried on give the rest. The drawing gives no steps.',
      'Wichmann draws the design turned by 45°; it is turned here so that the tile is the square cell. The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. No photo of the wall was checked.',
      '7 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/shiraz-qavam-crosses/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/shiraz-qavam-crosses/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Qavam Hosseiniyeh, Shiraz (P47)',
        url: 'https://tilingsearch.mit.edu/HTML/data180/P47.html',
      },
    ],
  },
  {
    id: 'herat-minaret-stars',
    title:
      'Stars and crosses of the Husayn Baykara minaret, Herat (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square cell side by side. Large stars sit on the grid, a cross between each two, and a large piece where four cells touch.',
    story: [
      'The finished design was read from Brian Wichmann’s PG223 drawing, its corners snapped to exact values in units of its shortest edge. Every line is a line of the Sala de la Barca stars, so the construction is theirs: the same large star, with the forks and the small square between four stars left as one large piece. The drawing gives no steps.',
      'Wichmann draws the design turned by 45° from the Barca frame; it is turned here so that both share their steps. The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. No photo of the minaret was checked.',
      '11 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/herat-minaret-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/herat-minaret-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Husayn Baykara madrasa, Herat (PG223)',
        url: 'https://tilingsearch.mit.edu/HTML/data8/PG223.html',
      },
    ],
  },
  {
    id: 'mashhad-gowhar-interlace',
    title:
      'Interlaced star and cross of the Gowhar Shad mosque, Mashhad (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the tile side by side. Neighbouring stars touch at their points. The lines carried on from the stars weave over and under each other.',
    story: [
      'The finished design was read from Brian Wichmann’s CM066B drawing, the centre lines of its bands snapped to exact values. They are the lines of the eight-fold star and cross, with the flat square’s sides carried on to the sides of the tile, so the construction is that one. The drawing gives no steps.',
      'Wichmann draws the design turned by 45°; it is turned here so that the tile is the square round the circle. The comparison with the drawing checks the finished lines, not how the design was first laid out. No photo of the mosque was checked.',
      '7 steps, beginner.',
    ],
    pictures: [
      {
        src: 'renders/mashhad-gowhar-interlace/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/mashhad-gowhar-interlace/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Mosque of Gowhar Shad, Mashhad (CM066B)',
        url: 'https://tilingsearch.mit.edu/HTML/data15/CM066B.html',
      },
    ],
  },
  {
    id: 'casablanca-house-crosses',
    title: 'Crosses and arrows of a house in Casablanca (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square cell side by side. The arrows of neighbouring crosses touch tip to tip, and a large piece fills the space round each corner.',
    story: [
      'The finished design was read from Brian Wichmann’s P269C3 drawing, its corners snapped to exact values. We devised the construction. The drawing gives no steps.',
      'The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. The real panel is richly ornamented with double bands; the drawing, and so this tutorial, leaves that out. No photo of the house was checked.',
      '6 steps, beginner.',
    ],
    pictures: [
      {
        src: 'renders/casablanca-house-crosses/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/casablanca-house-crosses/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Private house, Casablanca (P269C3)',
        url: 'https://tilingsearch.mit.edu/HTML/data164/P269C3.html',
      },
    ],
  },
  {
    id: 'leon-tile-stars',
    title:
      'Stars and squares of a tile photographed by Alberto Leon (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the tile side by side. A small square sits between each four stars, touching their points, and bands with ten sides join the squares.',
    story: [
      'The finished design was read from Brian Wichmann’s LEON10 drawing, its corners snapped to exact values. It is the design of the Patio de los Arrayanes squares with larger stars and smaller squares, so it starts with the same steps. We devised the construction. The drawing gives no steps.',
      'The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. The place of the tile is not known, and no photo of it was checked.',
      '5 steps, beginner.',
    ],
    pictures: [
      {
        src: 'renders/leon-tile-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/leon-tile-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Tile for sale, photo by Alberto Leon (LEON10)',
        url: 'https://tilingsearch.mit.edu/HTML/data194/LEON10.html',
      },
    ],
  },
  {
    id: 'paccard-zellige-frets',
    title: 'Red frets of a Moroccan zellige panel (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square cell side by side. Small stars and large stars with arms take turns like the squares of a chessboard. Red frets wind between them.',
    story: [
      'The finished design was read from Brian Wichmann’s P201 drawing, its corners snapped to exact values. We devised the construction. The drawing gives no steps.',
      'The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. The drawing fits stars whose points reach 3/(5 + 2√2) of OA to within 0.0003 of OA; we use that value. The frets turn like a pinwheel round each small star, so the design has no mirror. No photo of the panel was checked.',
      '8 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/paccard-zellige-frets/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/paccard-zellige-frets/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Zellige panel, Morocco (Paccard) (P201)',
        url: 'https://tilingsearch.mit.edu/HTML/data183/P201.html',
      },
    ],
  },
  {
    id: 'badi-palace-stars',
    title:
      'Interlaced stars of the El Badi Palace (Marrakesh) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square cell side by side. A star sits at every centre and every corner, and a small square halfway between two stars.',
    story: [
      'The finished design was read from Brian Wichmann’s MAR1 drawing, the centre lines of its bands snapped to exact values. We devised the construction. Its stars and first steps are those of the Spanish tile mosaic; four more diagonals through Z make the small squares at A, B, C and D. The drawing gives no steps.',
      'The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. Wichmann draws the lines as interlaced bands; the tutorial draws their centre lines. No photo of the palace was checked.',
      '10 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/badi-palace-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/badi-palace-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: El Badi Palace, Marrakesh (MAR1)',
        url: 'https://tilingsearch.mit.edu/HTML/data197/MAR1.html',
      },
    ],
  },
  {
    id: 'chellah-mosque-stars',
    title:
      'Interlaced stars of the Chellah mosque (Rabat) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square cell side by side. Stars sit in rows and columns, and the bands between them weave over and under.',
    story: [
      'The finished design was read from Brian Wichmann’s C103 drawing, the centre lines of its bands snapped to exact values. We devised the construction. Its stars and first steps are those of the Spanish tile mosaic, with one more star at A and four diagonals through Z. The drawing gives no steps.',
      'The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. Wichmann draws the lines as interlaced bands; the tutorial draws their centre lines. No photo of the mosque was checked.',
      '11 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/chellah-mosque-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/chellah-mosque-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Chellah mosque, Rabat (C103)',
        url: 'https://tilingsearch.mit.edu/HTML/data152/C103.html',
      },
    ],
  },
  {
    id: 'nim-avard-stars',
    title:
      'Stars, squares and pentagons of the Nim Avard madrasa, Isfahan (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square cell side by side. A star sits at every centre. A square sits at every corner, with four pentagons round it.',
    story: [
      'The finished design was read from Brian Wichmann’s F81 drawing, its corners snapped to exact values. It has the lines of the Mashhad courtyard design (F82), with more of them inked: each cross is cut into a square and four pentagons. So it uses the same construction. The drawing gives no steps.',
      'The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. No photo of the madrasa was checked.',
      '7 steps, beginner.',
    ],
    pictures: [
      {
        src: 'renders/nim-avard-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/nim-avard-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Nim Avard madrasa, Isfahan (F81)',
        url: 'https://tilingsearch.mit.edu/HTML/data16/F81.html',
      },
    ],
  },
  {
    id: 'tillya-kari-squares',
    title:
      'Interlaced squares of the Tillya-Kari madrasa, Samarkand (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square cell side by side. A turned square sits at every centre and an upright square at every corner.',
    story: [
      'The finished design was read from Brian Wichmann’s A222 drawing, the centre lines of its bands snapped to exact values. We devised the construction: lines through F and a square at O turned by 45°. The drawing gives no steps.',
      'The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. Wichmann draws the lines as interlaced bands; the tutorial draws their centre lines. No photo of the madrasa was checked.',
      '5 steps, beginner.',
    ],
    pictures: [
      {
        src: 'renders/tillya-kari-squares/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/tillya-kari-squares/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Tillya-Kari madrasa, Samarkand (A222)',
        url: 'https://tilingsearch.mit.edu/HTML/data15/A222.html',
      },
    ],
  },
  {
    id: 'charbagh-stars',
    title:
      'Interlaced stars of the Charbagh madrasa, Isfahan (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square cell side by side. A star sits at every centre and every corner, and a ten-sided piece halfway between two stars.',
    story: [
      'The finished design was read from Brian Wichmann’s A7 drawing, the centre lines of its bands snapped to exact values. We devised the construction. Its stars are those of the Leones doors of the Alhambra, at O and at each corner, so it starts with their steps; lines through V and W and the lines AC, CB, BD and DA make the rest. The drawing gives no steps.',
      'The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. Wichmann draws the lines as interlaced bands; the tutorial draws their centre lines. No photo of the madrasa was checked.',
      '11 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/charbagh-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/charbagh-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Charbagh madrasa, Isfahan (A7)',
        url: 'https://tilingsearch.mit.edu/HTML/data9/A7.html',
      },
    ],
  },
  {
    id: 'tash-khauli-crosses',
    title: 'Crosses of the Tash-Khauli palace, Khiva (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square cell side by side. A cross sits at every centre, and a square with four pentagons round it at every corner.',
    story: [
      'The finished design was read from Brian Wichmann’s R241B drawing, the centre lines of its bands snapped to exact values: every line lies on a grid of sixths of OA. We devised the construction: the line from K2 to A marks a half and a third, and the rest follows from them. The drawing gives no steps.',
      'The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. Wichmann draws the lines as bands; the tutorial draws their centre lines. No photo of the palace was checked.',
      '7 steps, beginner.',
    ],
    pictures: [
      {
        src: 'renders/tash-khauli-crosses/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/tash-khauli-crosses/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Tash-Khauli palace, Khiva (R241B)',
        url: 'https://tilingsearch.mit.edu/HTML/data185/R241B.html',
      },
    ],
  },
  {
    id: 'sikandra-stars',
    title: 'Stars and crosses of Akbar’s tomb, Sikandra (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square cell side by side. Four stars sit round every centre, and a cross sits at every corner.',
    story: [
      'The finished design was read from Brian Wichmann’s IND0703 drawing, its corners snapped to exact values in thirds of OA. We devised the construction: a star at T, a third of the way to K1, turned round O, and two more kinds of line through P and Z. The drawing gives no steps.',
      'The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. David Wade’s photo of the tomb, which Wichmann drew from, was not checked.',
      '10 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/sikandra-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/sikandra-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Akbar’s tomb, Sikandra (IND0703)',
        url: 'https://tilingsearch.mit.edu/HTML/data172/IND0703.html',
      },
    ],
  },
  {
    id: 'agra-kite-stars',
    title:
      'Stars and kite rosettes of a drawing from Agra (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square cell side by side. A star sits at every centre, an octagon between two stars, and eight kites round every corner.',
    story: [
      'The finished design was read from Brian Wichmann’s VA3 drawing, its corners snapped to exact values. Every line runs through a corner of the cell and halves an angle there, so the construction is two lines through K1, turned round O; circles of radius K1F round A and C give the second point of each. The drawing gives no steps.',
      'Wichmann draws the design turned by 67.5°; it is turned here so that the tile is the square cell. The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. Wichmann draws the lines as bevelled bands; the tutorial draws their centre lines. No photo was checked.',
      '6 steps, beginner.',
    ],
    pictures: [
      {
        src: 'renders/agra-kite-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/agra-kite-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Agra, India (VA3)',
        url: 'https://tilingsearch.mit.edu/HTML/data193/VA3.html',
      },
    ],
  },
  {
    id: 'iznik-green-mosque-pinwheel',
    title: 'Pinwheel of the Green Mosque (Iznik) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square cell side by side. The ten-sided tiles turn round O like the sails of a windmill.',
    story: [
      'The finished design was read from Brian Wichmann’s GREEN1 drawing, its corners snapped to exact values. We devised the construction: every line is a side of a small square carried on, or a diagonal of the cell. The drawing gives no steps.',
      'The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. Wichmann’s drawing is turned by 45° here, so that O sits where four tiles turn round a point. No photo of the mosque was checked.',
      '7 steps, beginner.',
    ],
    pictures: [
      {
        src: 'renders/iznik-green-mosque-pinwheel/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/iznik-green-mosque-pinwheel/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Green Mosque, Iznik (GREEN1)',
        url: 'https://tilingsearch.mit.edu/HTML/data187/GREEN1.html',
      },
    ],
  },
  {
    id: 'iranian-tile-crosses',
    title: 'Crosses and squares of Iranian tilework (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square cell side by side. Squares and four-armed crosses take turns on the diagonals, with long crosses between them.',
    story: [
      'The finished design was read from Brian Wichmann’s P35 drawing, its corners snapped to exact values. We devised the construction: the arms of the crosses are as wide as their pointed ends are long, which one line from A fixes. The drawing gives no steps.',
      'The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. No photo of a building was checked; the book gives none in colour.',
      '9 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/iranian-tile-crosses/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/iranian-tile-crosses/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: After al-Naqsh, Iranian tilework, volume 4 (P35)',
        url: 'https://tilingsearch.mit.edu/HTML/data17/P35.html',
      },
    ],
  },
  {
    id: 'cahier-pinwheel-stars',
    title:
      'Pinwheel of eight-pointed stars (Cahier and Martin) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the tile side by side. The stars run in rows that climb one step in two. The thirteen-sided tiles turn round the points between them.',
    story: [
      'The finished design was read from Brian Wichmann’s CM036 drawing, its corners snapped to exact values. We devised the construction: each star is two equal squares, and every line is a side of the star at O or of one of the four stars nearest to it. The drawing gives no steps.',
      'The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. The source names no building, and no photo was checked.',
      '11 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/cahier-pinwheel-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/cahier-pinwheel-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: After Cahier and Martin, page 36 (CM036)',
        url: 'https://tilingsearch.mit.edu/HTML/data15/CM036.html',
      },
    ],
  },
  {
    id: 'pompeii-stars-and-rhombi',
    title: 'Stars and rhombi of a Roman mosaic (Pompeii) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square cell side by side. The stars touch point to point, and eight rhombi fill the space round each meeting point.',
    story: [
      'The finished design was read from Brian Wichmann’s F34 drawing, its corners snapped to exact values. We devised the construction: every line halves an angle of 45° at O or at a corner of the cell. The drawing gives no steps.',
      'The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. No photo of the mosaic was checked.',
      '6 steps, beginner.',
    ],
    pictures: [
      {
        src: 'renders/pompeii-stars-and-rhombi/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/pompeii-stars-and-rhombi/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Roman mosaic, Pompeii (F34)',
        url: 'https://tilingsearch.mit.edu/HTML/data155/F34.html',
      },
    ],
  },
  {
    id: 'hippo-mosaic-octagons',
    title:
      'Braided octagons of a Roman mosaic (Hippo Regius) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square cell side by side. The bands run on from cell to cell and weave over and under.',
    story: [
      'The finished design was read from Brian Wichmann’s ROMAN11 drawing, the centre lines of its bands snapped to exact values. We devised the construction: four lines cross at each of A, B, C and D, halving the angles there. The drawing gives no steps.',
      'The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. Wichmann draws the lines as bevelled bands, and the floor has thick braids; the tutorial draws their centre lines. No photo of the floor was checked.',
      '5 steps, beginner.',
    ],
    pictures: [
      {
        src: 'renders/hippo-mosaic-octagons/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/hippo-mosaic-octagons/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Roman mosaic, Hippone (Annaba) (ROMAN11)',
        url: 'https://tilingsearch.mit.edu/HTML/data192/ROMAN11.html',
      },
    ],
  },
  {
    id: 'kritliya-house-stars',
    title:
      'Interlaced stars of the Kritliya House (Cairo) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square cell side by side. The bands run on from star to star and weave over and under.',
    story: [
      'The finished design was read from Brian Wichmann’s KHC drawing, the centre lines of its bands snapped to exact values. We devised the construction: the star at O, then four lines set by two small circles, all turned round O. The drawing gives no steps.',
      'The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. Wichmann draws the lines as interlaced bands; the tutorial draws their centre lines, turned by 45° so that the stars next to O sit at the corners of the cell. No photo of the house was checked.',
      '13 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/kritliya-house-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/kritliya-house-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Bayt al-Kritliya, Cairo (KHC)',
        url: 'https://tilingsearch.mit.edu/HTML/data186/KHC.html',
      },
    ],
  },
  {
    id: 'bou-inania-interlaced-stars',
    title:
      'Interlaced stars of the Bou Inania madrasa (Fez) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square cell side by side. A star sits at every centre and every corner, and a long star halfway between two centres.',
    story: [
      'The finished design was read from Brian Wichmann’s P060 drawing, the centre lines of its bands snapped to exact values. We devised the construction: the star at O is two squares on the circle through G, the same star sits at each corner, and the diamond ABCD with lines at the same distance from A makes the rest. The drawing gives no steps.',
      'The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. Wichmann draws the lines as interlaced bands; the tutorial draws their centre lines. No photo of the madrasa was checked.',
      '11 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/bou-inania-interlaced-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/bou-inania-interlaced-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Bou Inania madrasa, Fez (P060)',
        url: 'https://tilingsearch.mit.edu/HTML/data11/P060.html',
      },
    ],
  },
  {
    id: 'dar-el-bey-crosses',
    title: 'Crosses and stars of Dar el Bey (Tunis) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square cell side by side. A framed cross sits at every centre and a small star at every corner.',
    story: [
      'The finished design was read from Brian Wichmann’s CL39 drawing, the centre lines of its bands snapped to exact values. We devised the construction: the small stars at the corners are two squares through U, their sides carried on make the points of the cross at O, and a square frame through F holds the cross. The drawing gives no steps.',
      'The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. Wichmann draws the lines as interlaced bands; the tutorial draws their centre lines. No photo of the building was checked.',
      '9 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/dar-el-bey-crosses/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/dar-el-bey-crosses/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Dar el Bey, Tunis (CL39)',
        url: 'https://tilingsearch.mit.edu/HTML/data208/CL39.html',
      },
    ],
  },
  {
    id: 'cahier-martin-arrow-stars',
    title:
      'Stars, arrows and squares from Cahier and Martin (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square cell side by side. A star with four arrows sits in every large square, and a small star where the bands cross.',
    story: [
      'The finished design was read from Brian Wichmann’s CM054A drawing, its corners snapped to exact values. We devised the construction: one line from C through U fixes the large square at R, and every other line comes from R. The drawing gives no steps.',
      'The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. No photo of a building was checked: the source gives no place.',
      '9 steps, beginner.',
    ],
    pictures: [
      {
        src: 'renders/cahier-martin-arrow-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/cahier-martin-arrow-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Cahier and Martin, page 54 (CM054A)',
        url: 'https://tilingsearch.mit.edu/HTML/data15/CM054A.html',
      },
    ],
  },
  {
    id: 'khojent-tile-stars',
    title:
      'Interlaced star and squares of a tile from Khojent (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square cell side by side. A large star sits at every centre, and a grid of small squares between two stars.',
    story: [
      'The finished design was read from Brian Wichmann’s VA6 drawing, the centre lines of its bands snapped to exact values. We devised the construction: the line through K1 and R fixes the point S of the star at O, the star is two squares on the circle through S, and line AD fixes the square through Q. The drawing gives no steps.',
      'The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. Wichmann draws the lines as interlaced bands; the tutorial draws their centre lines. The tile itself was not checked.',
      '8 steps, beginner.',
    ],
    pictures: [
      {
        src: 'renders/khojent-tile-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/khojent-tile-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Tomb of Sheikh Badr al-Din Nuri, Khojent (VA6)',
        url: 'https://tilingsearch.mit.edu/HTML/data184/VA6.html',
      },
    ],
  },
  {
    id: 'nishapur-madrasa-stars',
    title:
      'Stars and crosses of the Tepe madrasa, Nishapur (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square cell side by side. A star sits at every centre and a small square at every corner.',
    story: [
      'The finished design was read from Brian Wichmann’s W1 drawing, its corners snapped to exact values. We devised the construction: one line from K1 through E fixes P, and every line is drawn through P, S or T. The drawing gives no steps.',
      'The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. Wichmann draws white bands over the lines; the tutorial draws the lines. No photo of the bricks was checked.',
      '7 steps, beginner.',
    ],
    pictures: [
      {
        src: 'renders/nishapur-madrasa-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/nishapur-madrasa-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Tepe madrasa, Nishapur (W1)',
        url: 'https://tilingsearch.mit.edu/HTML/data193/W1.html',
      },
    ],
  },
  {
    id: 'bourgoin-star-octagons',
    title: 'Stars and octagons of Bourgoin’s plate 44 (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square cell side by side. A star sits at every centre and an octagon at every corner.',
    story: [
      'The finished design was read from Brian Wichmann’s P044 drawing of Bourgoin’s plate, its corners snapped to exact values. We devised the construction: one radius, K1E, sets the octagon at each corner, and every line is a side of an octagon, carried on: they make the star at O. The drawing gives no steps.',
      'The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. Bourgoin gives no building, and no photo of a real wall was checked.',
      '5 steps, beginner.',
    ],
    pictures: [
      {
        src: 'renders/bourgoin-star-octagons/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/bourgoin-star-octagons/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Jules Bourgoin, plate 44 (P044)',
        url: 'https://tilingsearch.mit.edu/HTML/data10/P044.html',
      },
    ],
  },
  {
    id: 'mazar-shrine-stars',
    title: 'Stars of the Mazar-e Sharif shrine (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square cell side by side. Four stars sit round every cross, point to point with the next four.',
    story: [
      'The finished design was read from Brian Wichmann’s IRAN7 drawing, its corners snapped to exact values. We devised the construction: two circles fix P, the centre of a star whose point touches A, and every line is a side of one of the four stars round O. The drawing gives no steps.',
      'The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. Wichmann draws white bands over the lines; the tutorial draws the lines. No photo of the shrine was checked.',
      '6 steps, beginner.',
    ],
    pictures: [
      {
        src: 'renders/mazar-shrine-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/mazar-shrine-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Shrine of Ali, Mazar-e Sharif (IRAN7)',
        url: 'https://tilingsearch.mit.edu/HTML/data187/IRAN7.html',
      },
    ],
  },
  {
    id: 'sale-madrasa-stars',
    title: 'Stars of the Merinid madrasa, Salé (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square cell side by side. A star sits at every centre and a small star at every corner.',
    story: [
      'The finished design was read from Brian Wichmann’s C129A drawing, its corners snapped to exact values. We devised the construction: one line from K1 through E fixes P, and every line is drawn through P, S, T, U, W or Q. The drawing gives no steps.',
      'The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. Castéra’s picture is uncoloured; the colours are ours. No photo of the madrasa was checked.',
      '9 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/sale-madrasa-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/sale-madrasa-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Merinid madrasa, Salé (C129A)',
        url: 'https://tilingsearch.mit.edu/HTML/data152/C129A.html',
      },
    ],
  },
  {
    id: 'isfahan-masjid-ali-crosses',
    title:
      'Stars and crosses of the Masjid-e Ali, Isfahan (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square cell side by side. Stars and crosses take turns along every row.',
    story: [
      'The finished design was read from Brian Wichmann’s data189/IRA1329 drawing, its corners snapped to exact values. We devised the construction: one line from K1 through E fixes P, and every line is drawn through P, F, J, M, N or R. The drawing gives no steps.',
      'The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. Wichmann draws white bands over the lines; the tutorial draws the lines. Wichmann draws the design turned by 45°; it is turned back here, as on the portal. His drawing was compared by eye with David Wade’s photo IRA 1329 (stars and crosses in rows, with small square panels of square Kufic in the crosses and the ground); no overlay was made, because the portal is curved.',
      '8 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/isfahan-masjid-ali-crosses/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/isfahan-masjid-ali-crosses/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Masjid-e Ali, Isfahan (IRA1329)',
        url: 'https://tilingsearch.mit.edu/HTML/data189/IRA1329.html',
      },
    ],
  },
  {
    id: 'isfahan-masjid-ali-crosses-plain',
    title:
      'Stars and crosses of the Masjid-e Ali, Isfahan (without squares) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square cell side by side. Stars and crosses take turns along every row.',
    story: [
      'The finished design was read from Brian Wichmann’s data172/IRA1329 drawing, its corners snapped to exact values. We devised the construction: one line from K1 through E fixes P, and every line is drawn through P, F, J, M, N. The drawing gives no steps.',
      'The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. Wichmann draws white bands over the lines; the tutorial draws the lines. Wichmann’s second drawing of the same portal leaves out the small squares; this variant follows it. His drawing was compared by eye with David Wade’s photo IRA 1329 (stars and crosses in rows, with small square panels of square Kufic in the crosses and the ground); no overlay was made, because the portal is curved.',
      '8 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/isfahan-masjid-ali-crosses-plain/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/isfahan-masjid-ali-crosses-plain/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Masjid-e Ali, Isfahan (IRA1329_172)',
        url: 'https://tilingsearch.mit.edu/HTML/data172/IRA1329.html',
      },
    ],
  },
  {
    id: 'cahier-martin-cross-stars',
    title:
      'Stars, crosses and squares from Cahier and Martin (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square cell side by side. A star sits in the middle and a cross at every corner and side. Large squares fill the space between them.',
    story: [
      'The finished design was read from Brian Wichmann’s CM010 drawing, its corners snapped to exact values. We devised the construction: one circle from K1 fixes the star’s square at G, and every other line comes from G and the cell. The drawing gives no steps.',
      'The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. No photo of a building was checked: the source gives no place.',
      '8 steps, beginner.',
    ],
    pictures: [
      {
        src: 'renders/cahier-martin-cross-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/cahier-martin-cross-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Cahier and Martin, page 10 (CM010)',
        url: 'https://tilingsearch.mit.edu/HTML/data15/CM010.html',
      },
    ],
  },
  {
    id: 'cahier-martin-star-crosses',
    title:
      'Small stars, crosses and hexagons from Cahier and Martin (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square cell side by side. The crosses join through the hexagons into a square net, with plain ground in each square.',
    story: [
      'The finished design was read from Brian Wichmann’s CM033 drawing, its corners snapped to exact values in thirds of OA. We devised the construction: the line from K2 to A marks a third at F, and every other line comes from F. The drawing gives no steps.',
      'The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. No photo of a building was checked: the source gives no place.',
      '6 steps, beginner.',
    ],
    pictures: [
      {
        src: 'renders/cahier-martin-star-crosses/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/cahier-martin-star-crosses/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Cahier and Martin, page 33 (CM033)',
        url: 'https://tilingsearch.mit.edu/HTML/data15/CM033.html',
      },
    ],
  },
  {
    id: 'sutton-crosses-and-kites',
    title: 'Stars, hexagons and kites from Daud Sutton (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square cell side by side. A large star sits in the middle and a small star at every corner.',
    story: [
      'The finished design was read from Brian Wichmann’s DS3 drawing, its corners snapped to exact values. We devised the construction: one circle from K1 fixes the star’s square at G, and every other line comes from G and the cell. The drawing gives no steps.',
      'The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. No photo of a building was checked: the source gives no place.',
      '7 steps, beginner.',
    ],
    pictures: [
      {
        src: 'renders/sutton-crosses-and-kites/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/sutton-crosses-and-kites/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Daud Sutton, Islamic Design, page 27 (DS3)',
        url: 'https://tilingsearch.mit.edu/HTML/data184/DS3.html',
      },
    ],
  },
  {
    id: 'sicily-panel-stars',
    title: 'Stars of a wooden panel from medieval Sicily (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square cell side by side. Small and large stars take turns along every row.',
    story: [
      'The finished design was read from Brian Wichmann’s BM1 drawing, its corners snapped to exact values. We devised the construction: every line touches a small circle round O, A, C or K1, all of one radius, found by halving the length ON. The drawing gives no steps.',
      'The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. The panel itself was not checked: no free photo of it was found.',
      '9 steps, beginner.',
    ],
    pictures: [
      {
        src: 'renders/sicily-panel-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/sicily-panel-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: British Museum, wooden panel from Sicily (BM1)',
        url: 'https://tilingsearch.mit.edu/HTML/data207/BM1.html',
      },
    ],
  },
  {
    id: 'alhambra-museum-interlaced-stars',
    title:
      'Interlaced stars of a Nasrid panel in the Alhambra Museum (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square cell side by side. A star sits in the middle and at every corner, with a long piece between each two.',
    story: [
      'The finished design was read from Brian Wichmann’s P008A drawing, its band centre lines snapped to exact values. We devised the construction: one line from E through M fixes the star, as in the Leones fret, and every other line comes from it. The drawing gives no steps.',
      'The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. The panel itself was not checked: no free photo of it was found.',
      '10 steps, beginner.',
    ],
    pictures: [
      {
        src: 'renders/alhambra-museum-interlaced-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/alhambra-museum-interlaced-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Alhambra Museum, Granada (P008A)',
        url: 'https://tilingsearch.mit.edu/HTML/data159/P008A.html',
      },
    ],
  },
  {
    id: 'assisi-basilica-stars',
    title:
      'Stars and squares of the Basilica of St Francis, Assisi (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square cell side by side. The stars stand in rows, with a square between four stars and a diamond between two.',
    story: [
      'The finished design was read from Brian Wichmann’s P78B drawing, its corners snapped to exact values. We devised the construction: the circle through the cell’s corners gives the star’s long sides, and every other line comes from R. The drawing gives no steps.',
      'The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. No photo of the basilica was checked.',
      '6 steps, beginner.',
    ],
    pictures: [
      {
        src: 'renders/assisi-basilica-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/assisi-basilica-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Basilica of St Francis, Assisi (P78B)',
        url: 'https://tilingsearch.mit.edu/HTML/data4/P78B.html',
      },
    ],
  },
  {
    id: 'itimad-daula-stars',
    title:
      'Interlaced stars of the tomb of Itimad al-Daula, Agra (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square cell side by side. A star sits at every centre, two stars on every side and a small square at every corner.',
    story: [
      'The finished design was read from Brian Wichmann’s F78 drawing, the centre lines of its bands snapped to exact values. We devised the construction. Every line is a side of a star of two squares, carried on: the star at O, which is the star of the Leones doors, and a star of the same size at T, two on each side of the cell. The drawing gives no steps.',
      'The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. Wichmann draws the lines as interlaced bands; the tutorial draws their centre lines. No photo of the tomb was checked.',
      '10 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/itimad-daula-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/itimad-daula-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Tomb of Itimad al-Daula, Agra (F78)',
        url: 'https://tilingsearch.mit.edu/HTML/data153/F78.html',
      },
    ],
  },
  {
    id: 'fatehpur-sikri-stars',
    title:
      'Interlaced stars of Rajah Birbal’s house, Fatehpur Sikri (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the tilted square tile side by side. Four stars turn one way round each centre and the other way round each corner.',
    story: [
      'The finished design was read from Brian Wichmann’s IND01 drawing, the centre lines of its bands snapped to exact values. We devised the construction. Every line is a side of a star of two squares, carried on. Four stars turn round O; the line through Z that halves the angle W2ZQ is a mirror of the pattern, which gives the stars that turn the other way round each corner of the tile. The drawing gives no steps.',
      'The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. Wichmann draws the lines as interlaced bands; the tutorial draws their centre lines, turned by 22.5° so that the stars stand upright. No photo of the house was checked.',
      '11 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/fatehpur-sikri-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/fatehpur-sikri-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Rajah Birbal’s house, Fatehpur Sikri (IND01)',
        url: 'https://tilingsearch.mit.edu/HTML/data175/IND01.html',
      },
    ],
  },
  {
    id: 'damghan-minaret-stars',
    title:
      'Star and squares of the Friday mosque minaret, Damghan (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square cell side by side. A star sits at every centre and a small square at every corner, with rows of squares between them.',
    story: [
      'The finished design was read from Brian Wichmann’s BON47 drawing, its corners snapped to exact values. We devised the construction. The star at O is the classic star of two squares; every other line runs through a crossing of the star’s lines carried on (V, P, W, X and Y), and the cell’s corner K1 lies four times as far from O as the star’s point S2. The drawing gives no steps.',
      'The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. No photo of the minaret was checked.',
      '9 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/damghan-minaret-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/damghan-minaret-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Friday mosque, Damghan (BON47)',
        url: 'https://tilingsearch.mit.edu/HTML/data211/BON47.html',
      },
    ],
  },
  {
    id: 'cairo-embassy-stars',
    title:
      'Stars and crosses of the French Embassy ceiling, Cairo (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the tilted square tile side by side. A large piece sits at every centre and every corner, with stars and crosses between them.',
    story: [
      'The finished design was read from Brian Wichmann’s FE1 drawing, its corners snapped to exact values. We devised the construction. It is the eight-fold star and cross: stars of two squares stand round O, every side carried on, and the lines through W add the next stars. Round O and round the tile’s corners the lines between the cross and its four stars are left out, so they make one large piece. The drawing gives no steps.',
      'The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. No photo of the ceiling was checked.',
      '8 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/cairo-embassy-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/cairo-embassy-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: French Embassy, Cairo (FE1)',
        url: 'https://tilingsearch.mit.edu/HTML/data208/FE1.html',
      },
    ],
  },
  {
    id: 'bourgoin-plate-64',
    title: 'Stars and octagons of Bourgoin’s plate 64 (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the tilted square tile side by side. A star sits at every centre and a large octagon at every corner.',
    story: [
      'The finished design was read from Brian Wichmann’s P064 drawing, its corners snapped to exact values. We devised the construction. The star at O is the classic star of two squares, and every other line runs through a crossing of its lines carried on (V and P), as in the Damghan minaret. The large octagons sit at the corners of a square tile turned by 22.5°. The drawing gives no steps.',
      'The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. No photo of a real panel was checked.',
      '7 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/bourgoin-plate-64/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/bourgoin-plate-64/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Jules Bourgoin, plate 64 (P064)',
        url: 'https://tilingsearch.mit.edu/HTML/data11/P064.html',
      },
    ],
  },
  {
    id: 'khayrbak-mosque-stars',
    title:
      'Stars and arrows of the Khayrbak mosque, Cairo (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. A star sits at every centre and a small square at every corner, with arrows pointing from star to star.',
    story: [
      'The finished design was read from Brian Wichmann’s P60B drawing, its corners snapped to exact values. We devised the construction. Every line runs across, up or at 45°, and one length fixes them all: the point S, found with the line from K3 to M. The star at O is made of eight lines that touch the small circle; carried on, they make the small squares at the corners. The drawing gives no steps.',
      'The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. Wichmann draws it as an interlace of bands; we draw the centre lines of the bands. No photo of the stonework was checked.',
      '9 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/khayrbak-mosque-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/khayrbak-mosque-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Mosque of Khayrbak, Cairo (P60B)',
        url: 'https://tilingsearch.mit.edu/HTML/data4/P60B.html',
      },
    ],
  },
  {
    id: 'fes-palace-door-stars',
    title:
      'Stars and rosettes of a door in the Royal Palace Museum, Fès (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. A rosette sits at every centre, and a star ringed by chevrons at every corner.',
    story: [
      'The finished design was read from Brian Wichmann’s C101 drawing, its corners snapped to exact values. We devised the construction. A star of two squares sits on every point of a square grid, and every line runs across, up or at 45°. The tips of the rosette’s petals lie on the circle about O through the inner points of the next stars. The drawing gives no steps.',
      'The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. No photo of the door was checked.',
      '10 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/fes-palace-door-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/fes-palace-door-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Royal Palace Museum, Fès (C101)',
        url: 'https://tilingsearch.mit.edu/HTML/data152/C101.html',
      },
    ],
  },
  {
    id: 'moulay-idriss-interlace',
    title:
      'Interlaced stars of the Moulay Idriss zaouia (Fez) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. The stars’ surroundings alternate along each row.',
    story: [
      'The finished design was read from Brian Wichmann’s C268A vector drawing. The band centre lines were snapped to exact values on a half-OA grid. The drawing gives no steps. We devised the construction from the square’s midpoint and two squares on the circle of radius MG.',
      'The compass steps, their order and the named points are ours. The tutorial draws the centre lines of Wichmann’s 10 pt interlaced bands. Its square cell spans two small-star spacings because their surroundings alternate. The palette is illustrative; no photograph was checked. The page heading names Moulay Idriss zaouia, while its Wade references name Moulay Ishmael mosque.',
      '14 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/moulay-idriss-interlace/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/moulay-idriss-interlace/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Moulay Idriss zaouia, Fez (C268A)',
        url: 'https://tilingsearch.mit.edu/HTML/data152/C268A.html',
      },
    ],
  },
  {
    id: 'meknes-bou-inania-star-rings',
    title: 'Star rings of the Bou Inania madrasa (Meknes) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. A smaller star sits among each group of three larger stars.',
    story: [
      'The finished design was read from Brian Wichmann’s P164 vector drawing. The band centre lines were snapped to exact values on a half-OA grid. The drawing gives no steps. We devised the construction, sharing its first five steps with the Moulay Idriss interlace: the square’s midpoint sets the first star, then its inner corners and the midpoint set the remaining lines.',
      'The compass steps, their order and the named points are ours. The tutorial draws the centre lines of Wichmann’s 11 pt interlaced bands. The full square repeat contains three equal stars and one smaller star. The palette is illustrative; no photograph was checked.',
      '13 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/meknes-bou-inania-star-rings/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/meknes-bou-inania-star-rings/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Bou Inania madrasa, Meknes (P164)',
        url: 'https://tilingsearch.mit.edu/HTML/data153/P164.html',
      },
    ],
  },
  {
    id: 'tetouan-sakkala-knots',
    title:
      'Stars and square knots of the Sakkala (Tetouan) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. A square knot sits at every corner between four stars.',
    story: [
      'The finished design was read from Brian Wichmann’s MOR2615 vector drawing. The band centre lines were snapped to exact values. The drawing gives no steps. We devised the construction, reusing the star of the Leones doors. The crossing V sets the small square at each cell corner.',
      'The compass steps, their order and the named points are ours. The tutorial draws the centre lines of Wichmann’s 5 pt bands. The palette is illustrative; no photograph was checked.',
      '9 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/tetouan-sakkala-knots/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/tetouan-sakkala-knots/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Sakkala, Tetouan (MOR2615)',
        url: 'https://tilingsearch.mit.edu/HTML/data173/MOR2615.html',
      },
    ],
  },
  {
    id: 'attarine-star-rosettes',
    title: 'Star rosettes of the Attarine madrasa (Fez) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. Stars fill the spaces between the rosettes.',
    story: [
      'The finished design was read from Brian Wichmann’s MOR0323 vector drawing. The corners were snapped to exact values on the square-root-of-two grid. The drawing gives no steps. We devised the construction, sharing the Charbagh opening as two guide squares and their continued sides. Lines through W, Y and Z complete the rosettes and their surrounding stars.',
      'The compass steps, their order and the named points are ours. The finished tile edges follow the plain drawing. The palette is illustrative; no photograph was checked.',
      '14 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/attarine-star-rosettes/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/attarine-star-rosettes/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Attarine madrasa, Fez (MOR0323)',
        url: 'https://tilingsearch.mit.edu/HTML/data172/MOR0323.html',
      },
    ],
  },
  {
    id: 'meknes-bou-inania-petals',
    title:
      'Petal rosettes of the Bou Inania madrasa (Meknes) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. A pointed star sits at every corner between four rosettes.',
    story: [
      'The finished design was read from Brian Wichmann’s MOR0910 vector drawing. The corners were snapped to exact values with the small star’s point radius as the unit. The drawing gives no steps. We devised the construction: the unit star and a square diagonal set the compass transfers, and earlier crossings give every remaining line.',
      'The compass steps, their order and the named points are ours. OA is the small star’s point radius; the cell half-side is two radii plus three square diagonals. The finished tile edges follow the plain drawing. The palette is illustrative; no photograph was checked.',
      '16 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/meknes-bou-inania-petals/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/meknes-bou-inania-petals/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Bou Inania madrasa, Meknes (MOR0910)',
        url: 'https://tilingsearch.mit.edu/HTML/data190/MOR0910.html',
      },
    ],
  },
  {
    id: 'meknes-bou-inania-rosette-rings',
    title:
      'Rosette rings of the Bou Inania madrasa (Meknes) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. Stars and arrows join the rosettes along the rows.',
    story: [
      'The finished design was read from Brian Wichmann’s P70 vector drawing. The corners were snapped to exact values with the small star’s point radius as the unit. The drawing gives no steps. We devised the construction, sharing the unit-star and compass-transfer opening with the Meknes petal rosettes. The crossings R, V, W, X and Y1 to Y4 set the inner stars and outer pieces.',
      'The compass steps, their order and the named points are ours. OA is the small star’s point radius; the cell half-side is four radii plus three square diagonals. The finished tile edges follow the plain drawing. The palette is illustrative; no photograph was checked.',
      '22 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/meknes-bou-inania-rosette-rings/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/meknes-bou-inania-rosette-rings/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Bou Inania madrasa, Meknes (P70)',
        url: 'https://tilingsearch.mit.edu/HTML/data21/P70.html',
      },
    ],
  },
  {
    id: 'fes-bou-inania-cross-stars',
    title:
      'Crosses and stars of the Bou Inania madrasa (Fez) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. Stars and small squares fill the spaces between the crosses.',
    story: [
      'The finished design was read from Brian Wichmann’s MOR2832X vector drawing. The grey bevel shading was separated from the coloured faces, and the band centre lines snapped to exact values. The drawing gives no steps. We devised the construction from half-unit lines and circles of radius OM.',
      'The compass steps, their order and the named points are ours. The 9 pt bevelled bands are represented by their centre lines. The large cruciform piece has 24 corners in this centre-line tiling. OA is one third of the cell half-side. The palette is illustrative; no photograph was checked.',
      '10 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/fes-bou-inania-cross-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/fes-bou-inania-cross-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Bou Inania madrasa, Fez (MOR2832X)',
        url: 'https://tilingsearch.mit.edu/HTML/data190/MOR2832X.html',
      },
    ],
  },
  {
    id: 'rabat-throne-octagons',
    title:
      'Octagons and stars of the Royal Palace throne room (Rabat) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary: 'Put copies of the square tile side by side.',
    story: [
      'The finished design was read from Wichmann’s C126A drawing. Its band centre lines were snapped to the square-root-of-two grid in small-star-radius units. The unit-star opening and square-diagonal compass transfers are shared with the Meknes rosette rings; different crossings complete the octagons. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The 8 pt bands are represented by their centre lines. Wichmann says his drawing regularizes the panel in Castéra’s book; we follow that regularized drawing, without claiming the wall’s exact proportions. The palette is illustrative; no photograph was checked.',
      '18 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/rabat-throne-octagons/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/rabat-throne-octagons/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Royal Palace throne room, Rabat (C126A)',
        url: 'https://tilingsearch.mit.edu/HTML/data152/C126A.html',
      },
    ],
  },
  {
    id: 'rabat-rosette-bands',
    title: 'Rosette bands from Rabat (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary: 'Put copies of the square tile side by side.',
    story: [
      'The finished design was read from Wichmann’s MOR1137 vector drawing and snapped to exact values in small-star-radius units. Four radii and two unit-square diagonals set the cell half-side. The construction shares the unit-star opening with the Meknes and Rabat reconstructions, then adds lines through the guide squares’ corners to make the bands and the small central cross. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The finished tile edges follow the plain drawing. The opening squares are guides; the cross at O is picked out from them at the ink stage. The palette is illustrative; no photograph was checked.',
      '17 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/rabat-rosette-bands/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/rabat-rosette-bands/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Rabat (MOR1137)',
        url: 'https://tilingsearch.mit.edu/HTML/data190/MOR1137.html',
      },
    ],
  },
  {
    id: 'ben-youssef-arrow-bands',
    title:
      'Arrow bands of the Ben Youssef madrasa (Marrakesh) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary: 'Put copies of the square tile side by side.',
    story: [
      'The finished design was read from Wichmann’s C129B drawing and snapped to exact values in small-star-radius units. Two radii and two unit-square diagonals set the cell half-side. The construction shares the unit-star opening with the Meknes reconstructions; crossings R, V and W then set the bands and square knots. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The finished tile edges follow the plain drawing. Castéra’s original example is uncoloured, according to Wichmann; the tutorial therefore opens as lines. Its palette is illustrative; no photograph was checked.',
      '15 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/ben-youssef-arrow-bands/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/ben-youssef-arrow-bands/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Ben Youssef madrasa, Marrakesh (C129B)',
        url: 'https://tilingsearch.mit.edu/HTML/data152/C129B.html',
      },
    ],
  },
  {
    id: 'fes-bou-inania-octagonal-rosettes',
    title:
      'Octagonal rosettes of the Bou Inania madrasa (Fez) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary: 'Put copies of the square tile side by side.',
    story: [
      'The finished design was read from Wichmann’s MOR2841X vector drawing and snapped to exact values in small-star-radius units. Three radii and two unit-square diagonals set the half-side. The unit-star opening is shared with the earlier reconstructions. Compass transfers from J give M2, whose distance from O is the outer octagon’s apothem. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The finished tile edges follow the plain drawing. The palette is illustrative; no photograph was checked.',
      '20 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/fes-bou-inania-octagonal-rosettes/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/fes-bou-inania-octagonal-rosettes/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Bou Inania madrasa, Fez (MOR2841X)',
        url: 'https://tilingsearch.mit.edu/HTML/data190/MOR2841X.html',
      },
    ],
  },
  {
    id: 'moulay-ismail-octagons',
    title:
      'Octagons and pointed stars of the Moulay Ismail mosque (Fez) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary: 'Put copies of the square tile side by side.',
    story: [
      'The finished design was read from Wichmann’s MOR0606 vector drawing. Its band centre lines were snapped to the square-root-of-two grid in small-star-radius units. It uses the same construction grid as the Rabat throne-room octagons, but inks different runs to form the pointed centre star and the twelve-sided pieces. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The 5 pt bands are represented by their centre lines. The initial squares at O are guides for the finished larger star. The palette is illustrative; no photograph was checked.',
      '18 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/moulay-ismail-octagons/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/moulay-ismail-octagons/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Moulay Ismail mosque, Fez (MOR0606)',
        url: 'https://tilingsearch.mit.edu/HTML/data172/MOR0606.html',
      },
    ],
  },
  {
    id: 'ben-youssef-star-rosettes',
    title:
      'Star rosettes of the Ben Youssef madrasa (Marrakesh) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary: 'Put copies of the square tile side by side.',
    story: [
      'The finished design was read from Wichmann’s P77 drawing. Its exact tile shapes, areas and counts agree with the Attarine star rosettes after shifting the centre. This variation shares all of that tutorial’s construction steps. The repeat and proportions are the same; the source’s filling distinguishes this version. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The source is shifted to place an eight-petal rosette at O, matching the Attarine opening. The repeated geometry is unchanged. Colours are read from the vector drawing: the centre star is maroon, the corner star white and the filler stars black. No photograph was checked.',
      '14 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/ben-youssef-star-rosettes/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/ben-youssef-star-rosettes/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Ben Youssef madrasa, Marrakesh (P77)',
        url: 'https://tilingsearch.mit.edu/HTML/data205/P77.html',
      },
    ],
  },
  {
    id: 'toledo-synagogue-star-bands',
    title: 'Stars and bands of a synagogue in Toledo (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary: 'Put copies of the square tile side by side.',
    story: [
      'The finished design was read from Wichmann’s SPA2929 drawing. Grey bevel shading was separated from the coloured faces, and the 6 pt band centre lines snapped to exact values. The unit-star opening is shared with the earlier reconstructions. Three square-diagonal transfers from B give the cell; the lines through M complete the bands. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The shaded bands are represented by their centre lines. The palette is illustrative; no photograph was checked. The source names only a synagogue in Toledo, so no more specific building is asserted.',
      '8 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/toledo-synagogue-star-bands/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/toledo-synagogue-star-bands/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Synagogue, Toledo (SPA2929)',
        url: 'https://tilingsearch.mit.edu/HTML/data173/SPA2929.html',
      },
    ],
  },
  {
    id: 'alhambra-mexuar-grid-fret',
    title:
      'Grid fret of the Sala del Mexuar patio (Alhambra) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary: 'Put copies of the square tile side by side.',
    story: [
      'The finished design was read from Wichmann’s data192/ALH1 drawing. After taking the 8 pt band centre lines and turning the frame by 45 degrees, the corners lie on a rational grid in tenths of OA. Line K4F gives a fifth, and line E1E2 halves it to a tenth; compass transfers make the odd tenths. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The tutorial draws band centre lines. The square cell follows the primitive diagonal lattice; the change of frame preserves the drawing’s handedness. Wichmann notes two reversed hexagons in the real panel’s upper left; this tutorial follows his regular repeat. The palette is illustrative; no photograph was checked.',
      '10 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/alhambra-mexuar-grid-fret/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/alhambra-mexuar-grid-fret/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Sala del Mexuar patio, Alhambra (ALH1)',
        url: 'https://tilingsearch.mit.edu/HTML/data192/ALH1.html',
      },
    ],
  },
  {
    id: 'alhambra-dos-hermanas-ceiling-stars',
    title:
      'Pointed stars of the Dos Hermanas side-chamber ceiling (Alhambra) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary: 'Put copies of the square tile side by side.',
    story: [
      'The finished design was read from Wichmann’s NC5 vector drawing. Its band centre lines were snapped to exact half-unit square-root-of-two values. Every edge is a side of one of four eight-pointed stars with 45-degree tips, continued. The circle transfer through E locates their centres, and the crossings make the small central star. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The 8 pt bands are represented by their centre lines. The palette is illustrative; no photograph of the ceiling was checked.',
      '7 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/alhambra-dos-hermanas-ceiling-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/alhambra-dos-hermanas-ceiling-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Sala de las Dos Hermanas, Alhambra (NC5)',
        url: 'https://tilingsearch.mit.edu/HTML/data174/NC5.html',
      },
    ],
  },
  {
    id: 'alhambra-dos-hermanas-band-stars',
    title:
      'Star bands of the Sala de las Dos Hermanas (Alhambra) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary: 'Put copies of the square tile side by side.',
    story: [
      'The finished design was read from Wichmann’s MUL128K drawing. Its band centre lines fit exact square-root-of-two values. The shared unit-star opening sets the smaller stars. Four radii and two square diagonals set the half-side; compass transfers and star-side crossings set the bands. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The 7 pt bands are represented by their centre lines. The palette is illustrative; no photograph was checked.',
      '17 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/alhambra-dos-hermanas-band-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/alhambra-dos-hermanas-band-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Sala de las Dos Hermanas, Alhambra (MUL128K)',
        url: 'https://tilingsearch.mit.edu/HTML/data175/MUL128K.html',
      },
    ],
  },
  {
    id: 'seville-vanda-star-rosettes',
    title: 'Star rosettes of a Seville tile (V&A) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary: 'Put copies of the square tile side by side.',
    story: [
      'The finished design was read from Wichmann’s PG229 drawing. Turning the frame by 45 degrees reveals the same primitive repeat, exact proportions and tile network as the Attarine star rosettes. This variation shares every construction step. Its source filling distinguishes this version. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The frame is turned by 45 degrees to match the Attarine opening. The repeated linework is unchanged. The source colours are retained as placement rules: ochre stars, slate-blue petals and long hexagons, black seven-sided pieces and arrows, and white remaining pieces. No photograph was checked.',
      '14 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/seville-vanda-star-rosettes/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/seville-vanda-star-rosettes/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Seville tile, Victoria and Albert Museum (PG229)',
        url: 'https://tilingsearch.mit.edu/HTML/data8/PG229.html',
      },
    ],
  },
  {
    id: 'cordoba-synagogue-star-bands',
    title: 'Star bands of the synagogue in Córdoba (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary: 'Put copies of the square tile side by side.',
    story: [
      'The finished design was read from Wichmann’s SPA2103X drawing and snapped to exact square-root-of-two values. Two radii and two unit-square diagonals set the half-side. The construction shares the Ben Youssef arrow-band grid, adding a radius transfer from J. The ink picks out different stars, connecting bands and square knots. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The 7 pt bands are represented by their centre lines. Wichmann says colour was added because the original is uncoloured, so the tutorial opens as lines. The palette is illustrative; no photograph was checked.',
      '16 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/cordoba-synagogue-star-bands/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/cordoba-synagogue-star-bands/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Synagogue, Córdoba (SPA2103X)',
        url: 'https://tilingsearch.mit.edu/HTML/data192/SPA2103X.html',
      },
    ],
  },
  {
    id: 'alcazar-reyes-octagon-bands',
    title:
      'Octagons of the Dormitorio de Reyes Moros (Alcázar, Seville) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary: 'Put copies of the square tile side by side.',
    story: [
      'The finished design was read from Wichmann’s NC7 drawing. Its band centre lines fit exact square-root-of-two values. The opening shares the Rabat throne-room octagon grid; three further crossing and compass steps complete the different stars and octagonal bands. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The 6 pt bands are represented by their centre lines. The palette is illustrative; no photograph was checked.',
      '20 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/alcazar-reyes-octagon-bands/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/alcazar-reyes-octagon-bands/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Dormitorio de Reyes Moros, Alcázar Real, Seville (NC7)',
        url: 'https://tilingsearch.mit.edu/HTML/data174/NC7.html',
      },
    ],
  },
  {
    id: 'bourgoin-58-star-bands',
    title: 'Star bands of Bourgoin plate 58 (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary: 'Put copies of the square tile side by side.',
    story: [
      'The finished design was read from Wichmann’s P058 drawing and its band centres snapped to exact square-root-of-two values. The unit-star opening is shared with the earlier reconstructions. Neighbouring stars on an axis have different surroundings, so the repeat spans two star spacings. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The 12 pt bands are represented by their centre lines. The palette is illustrative; no photograph was checked. The source highlights one star in ochre; the tutorial repeats a consistent shape palette.',
      '13 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/bourgoin-58-star-bands/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/bourgoin-58-star-bands/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Bourgoin, plate 58 (P058)',
        url: 'https://tilingsearch.mit.edu/HTML/data162/P058.html',
      },
    ],
  },
  {
    id: 'hani-zeynebiye-stars',
    title: 'Stars of the Zeynebiye madrasa (Hani) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. The ring of stars repeats between the small squares.',
    story: [
      'The finished design was read from Wichmann’s BON61 drawing. Its exact geometry and tile counts match the existing Four-fold ring of circles, whose twelve steps from Sandy Kurt’s credited tutorial are reused verbatim. The drawing gives no steps; the comparison establishes the geometric match, not a historical construction for the madrasa.',
      'The existing ring-of-circles construction is reused. The source drawing’s navy stars, yellow bowties, green and peach pentagons, and brown squares distinguish this filling variation. No photograph or monument match was independently checked.',
      '12 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/hani-zeynebiye-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/hani-zeynebiye-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Zeynebiye madrasa, Hani, Turkey (BON61)',
        url: 'https://tilingsearch.mit.edu/HTML/data211/BON61.html',
      },
    ],
  },
  {
    id: 'bourgoin-144-octagon-bands',
    title: 'Octagon bands of Bourgoin plate 144 (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary: 'Put copies of the square tile side by side.',
    story: [
      'The finished design was read from Wichmann’s P144 drawing. A 22.5-degree frame turn reveals its primitive square repeat. The guide octagon touches the unit circle, and its corners give the star. The star-side crossing P and compass transfers set the remaining parallels at exact square-root-of-two values. An axis-aligned cell chosen from neighbouring source stars would give a false repeat. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The frame is turned by 22.5 degrees. The 3 pt bands are represented by their centre lines. The palette is illustrative; no photograph was checked.',
      '12 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/bourgoin-144-octagon-bands/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/bourgoin-144-octagon-bands/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Bourgoin, plate 144 (P144)',
        url: 'https://tilingsearch.mit.edu/HTML/data12/P144.html',
      },
    ],
  },
  {
    id: 'lindisfarne-folio-2b-stepped-bands',
    title:
      'Stepped bands from folio 2b of the Lindisfarne Gospels (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary: 'Put copies of the square tile side by side.',
    story: [
      'The finished design was read from Wichmann’s L34A drawing. Its plain tile corners lie exactly on an integer grid, with a repeat sixteen small-square sides wide. Compass steps give that grid; four diagonals through the seventh mark close the outer stepped bands. This is a Celtic manuscript pattern, not an attribution to an Islamic building. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The finished tile edges follow the plain drawing. The palette is illustrative; the manuscript page was not independently checked.',
      '9 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/lindisfarne-folio-2b-stepped-bands/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/lindisfarne-folio-2b-stepped-bands/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Lindisfarne Gospels, folio 2b, pattern 1 (L34A)',
        url: 'https://tilingsearch.mit.edu/HTML/data1/L34A.html',
      },
    ],
  },
  {
    id: 'leon-mosaic-star-rosettes',
    title: 'Star rosettes of Alberto Leon’s mosaic design (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary: 'Put copies of the square tile side by side.',
    story: [
      'The finished design was read from Wichmann’s LEON7 drawing. Its primitive repeat, tile network and exact proportions match the Attarine star rosettes. This filling variation shares all fourteen construction steps, alongside the Ben Youssef and Seville versions. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The repeated geometry is unchanged. The source’s red and black stars, blue petals and seven-sided pieces, ochre and black long hexagons, and white remaining pieces distinguish this version. The white surround remains divided into the source’s individual tiles. No photograph was checked.',
      '14 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/leon-mosaic-star-rosettes/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/leon-mosaic-star-rosettes/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Mosaic in Islamic Design, from Alberto Leon (LEON7)',
        url: 'https://tilingsearch.mit.edu/HTML/data194/LEON7.html',
      },
    ],
  },
  {
    id: 'abas-salman-232-star-bands',
    title: 'Star bands from Abas and Salman, page 232 (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary: 'Put copies of the square tile side by side.',
    story: [
      'The finished design was read from Wichmann’s PG232 drawing and snapped to exact square-root-of-two values. Two radii and one unit-square diagonal set the half-side. The shared unit-star opening supplies the smaller star; the continued lines and exact parallels also close the larger star with 45-degree tips. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The finished tile edges follow the plain drawing. The palette is illustrative; no photograph was checked. The page gives no building attribution, so none is added.',
      '11 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/abas-salman-232-star-bands/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/abas-salman-232-star-bands/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Abas and Salman, page 232 (PG232)',
        url: 'https://tilingsearch.mit.edu/HTML/data8/PG232.html',
      },
    ],
  },
  {
    id: 'racinet-37-octagonal-rings',
    title: 'Octagonal rings from Racinet plate 37 (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary: 'Put copies of the square tile side by side.',
    story: [
      'The finished design was read from Wichmann’s R37D drawing. Its band centres fit exact square-root-of-two values. The construction shares the Rabat throne-room octagon grid, adding two compass and crossing steps for the different rims and connecting pieces. The first two squares are guides for the larger pointed star. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The 7 pt bands are represented by their centre lines. The palette is illustrative; no photograph was checked. The source identifies Algerian architectural motifs but gives no individual building.',
      '19 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/racinet-37-octagonal-rings/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/racinet-37-octagonal-rings/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Algerian motifs in Racinet, plate 37 (R37D)',
        url: 'https://tilingsearch.mit.edu/HTML/data202/R37D.html',
      },
    ],
  },
  {
    id: 'salim-chishti-square-lattice',
    title:
      'Square lattice of Salim Chishti’s tomb (Fatehpur Sikri) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary: 'Put copies of the square tile side by side.',
    story: [
      'The finished design was read from Wichmann’s data206/SM3 drawing. Its polygon edges already coincide; the ochre stroke is not a gap between inset tiles. Half the small-square side gives the unit. Two radii and a unit-square diagonal give the half-side 2 + square root of two; four diagonals then close the pentagons and hexagons. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The shared polygon boundaries follow the plain drawing; no band expansion is applied. The palette is illustrative; no photograph was checked. The lower pattern is the one identified by the source.',
      '6 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/salim-chishti-square-lattice/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/salim-chishti-square-lattice/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Salim Chishti’s tomb, Fatehpur Sikri, lower pattern (SM3)',
        url: 'https://tilingsearch.mit.edu/HTML/data206/SM3.html',
      },
    ],
  },
  {
    id: 'maku-floor-hexagons',
    title: 'Squares and long hexagons of a floor in Maku (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. A small square sits at every corner, with a long hexagon on each side of it.',
    story: [
      'The finished design was read from Brian Wichmann’s SHAF27 drawing, its corners snapped to exact values. We devised the construction. Every corner comes from the point where the 45° line crosses the circle through A. The drawing gives no steps.',
      'The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. No photo of the floor was checked.',
      '6 steps, beginner.',
    ],
    pictures: [
      {
        src: 'renders/maku-floor-hexagons/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/maku-floor-hexagons/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Floor tiling, Maku, Iran (SHAF27)',
        url: 'https://tilingsearch.mit.edu/HTML/data199/SHAF27.html',
      },
    ],
  },
  {
    id: 'nasrid-textile-stars',
    title:
      'Stars and arrows of a Nasrid textile in the Metropolitan Museum (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. The stars at O and at the corners make a chessboard. A bone joins each star at O to the next.',
    story: [
      'The finished design was read from Brian Wichmann’s MMA2 drawing, its corners snapped to exact values. We devised the construction. Each star is cut by eight lines at one distance from its centre, and the other lines lie at three times that distance from a star, or at three times that distance from the next star. The drawing gives no steps.',
      'Wichmann draws the stars on a square grid; here his drawing is turned by 45° so that the tile is a square with one kind of star at O and the other at its corners. The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. No photo of the textile was checked.',
      '10 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/nasrid-textile-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/nasrid-textile-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Silk textile fragment, Granada, Metropolitan Museum (MMA2)',
        url: 'https://tilingsearch.mit.edu/HTML/data196/MMA2.html',
      },
    ],
  },
  {
    id: 'fes-palace-ceiling-stars',
    title:
      'Interlaced stars of a ceiling in the Royal Palace, Fès (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. A star sits at every centre and every corner, with a diagonal cross between each two centres.',
    story: [
      'The finished design was read from Brian Wichmann’s P397 drawing, its corners snapped to exact values. We devised the construction. Every line is a side of a star of two squares, all the same size. The stars sit at O, at the corners of the cell, and where the 22.5° line from O crosses a side of the cell. The drawing gives no steps.',
      'The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. No photo of the ceiling was checked.',
      '8 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/fes-palace-ceiling-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/fes-palace-ceiling-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Royal Palace, Fès (P397)',
        url: 'https://tilingsearch.mit.edu/HTML/data186/P397.html',
      },
    ],
  },
  {
    id: 'alhambra-arrayanes-porch-ceiling',
    title:
      'Interlaced stars of a porch ceiling by the Patio de los Arrayanes, Alhambra (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. A star sits at every centre and every corner, and at the middle of every side.',
    story: [
      'The finished design was read from Brian Wichmann’s ALHAMK drawing, its corners snapped to exact values. We devised the construction. Its lines are exactly those of the Nasrid textile stars, so the construction is the same; only the inked pieces differ. Each star is cut by eight lines at one distance from its centre. The drawing gives no steps.',
      'The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. Our lines were also laid over David Wade’s photo of the ceiling (SPA 0524x). They follow its bands in the middle of the ceiling; towards the photo’s edges the camera’s angle bends the ceiling away from a flat fit, and no difference from the drawing was found.',
      '10 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/alhambra-arrayanes-porch-ceiling/photo-overlay.png',
        caption:
          'David Wade’s photo with the tutorial’s lines in red (private, not shipped).',
      },
      {
        src: 'renders/alhambra-arrayanes-porch-ceiling/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/alhambra-arrayanes-porch-ceiling/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Alhambra, Granada: porch into the Patio de los Arrayanes (ALHAMK)',
        url: 'https://tilingsearch.mit.edu/HTML/data189/ALHAMK.html',
      },
    ],
  },
  {
    id: 'dar-el-bey-stars',
    title: 'Stars round a cross, Dar el Bey (Tunis) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square cell side by side. A cross sits at every centre with four stars round it, and a star sits at every corner.',
    story: [
      'The finished design was read from Brian Wichmann’s CL35 drawing, the centre lines of its bands snapped to exact values. We devised the construction. Every star is two squares on a circle of the same radius: the stars at the corners come first, as in the Dar el Bey crosses, and four more stars sit round O at S, twice that radius from O. Their sides carried on make the notched cross at O. The drawing gives no steps.',
      'The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. Wichmann draws the lines as interlaced bands; the tutorial draws their centre lines. No photo of the building was checked.',
      '10 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/dar-el-bey-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/dar-el-bey-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Dar el Bey, Tunis (CL35)',
        url: 'https://tilingsearch.mit.edu/HTML/data208/CL35.html',
      },
    ],
  },
  {
    id: 'agra-fort-stars',
    title: 'Stars and crosses of the Agra Fort (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square cell side by side. A star sits at every centre and a small cross of squares at every corner.',
    story: [
      'The finished design was read from Brian Wichmann’s IND0312 drawing, its corners snapped to exact values. We devised the construction. The star at O is two squares; the circle through K1 gives the sides of the next stars, and those fix the square at O. A circle about M doubles the square’s side for the lines of the small crosses at the corners. The drawing gives no steps.',
      'The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. Wichmann draws the lines as white bands; the tutorial draws their centre lines. David Wade’s photo was not checked.',
      '7 steps, beginner.',
    ],
    pictures: [
      {
        src: 'renders/agra-fort-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/agra-fort-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Agra Fort, India (IND0312)',
        url: 'https://tilingsearch.mit.edu/HTML/data172/IND0312.html',
      },
    ],
  },
  {
    id: 'birbal-house-stars',
    title: 'Stars of Rajah Birbal’s house, Fatehpur Sikri (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square cell side by side. A star sits at every centre and every corner.',
    story: [
      'The finished design was read from Brian Wichmann’s P94 drawing. We devised the construction. Every line runs at 22.5° to the cell’s sides: sixteen lines through A, B, C and D, and eight through N and its turns, the inner corners of the star at O. The drawing gives no steps.',
      'Wichmann draws the design turned by 22.5°; it is turned here so that the tile is the square cell. Where four pieces meet at A his drawing has a tiny square with uneven bevels; here the lines meet in a point, and the gap becomes two thin white triangles. The compass steps, their order and the named points are ours. No photo of the ceiling was checked.',
      '6 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/birbal-house-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/birbal-house-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Rajah Birbal’s house, Fatehpur Sikri (P94)',
        url: 'https://tilingsearch.mit.edu/HTML/data185/P94.html',
      },
    ],
  },
  {
    id: 'seville-tile-stars',
    title: 'Sharp stars of a Seville tile panel (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square cell side by side. A star ringed by eight hexagons sits at every centre, and the stars between them have four.',
    story: [
      'The finished design was read from Brian Wichmann’s RAY10 drawing, its corners snapped to exact values. We devised the construction. Every star is the same: eight lines touching a small circle about its centre. The star at O comes first; the circles about A copy its lines to the stars at A and at the corners, and one more circle about O gives the lines that close the hexagons round O. The drawing gives no steps.',
      'Wichmann draws the design turned by 45°; it is turned back here so that the tile is the square cell. The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. The V&A photo of the panel was not checked.',
      '8 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/seville-tile-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/seville-tile-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Tile panel from Seville, V&A, London (RAY10)',
        url: 'https://tilingsearch.mit.edu/HTML/data183/RAY10.html',
      },
    ],
  },
  {
    id: 'bahramiye-mosque-stars',
    title:
      'Interlaced stars of the Bahramiye mosque, Aleppo (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square cell side by side. A star sits at every centre and a small square at every corner.',
    story: [
      'The finished design was read from Brian Wichmann’s AJL1 drawing, the centre lines of its bands snapped to exact values. We devised the construction. The star at O is two squares, found with line DE; that line then crosses the star’s sides at M, L and J, which fix most of the other lines, and the line through E fixes the rest. The drawing gives no steps.',
      'The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. Wichmann draws the lines as interlaced bands; the tutorial draws their centre lines. No photo of the carving was checked.',
      '8 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/bahramiye-mosque-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/bahramiye-mosque-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Bahramiye mosque, Aleppo (AJL1)',
        url: 'https://tilingsearch.mit.edu/HTML/data198/AJL1.html',
      },
    ],
  },
  {
    id: 'marrakesh-crafts-stars',
    title:
      'Stars and crosses of the Crafts Center, Marrakesh (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square cell side by side. A star sits at every centre and every corner, with a green cross between each two.',
    story: [
      'The finished design was read from Brian Wichmann’s P99 drawing, its corners matched to exact values. We devised the construction. The stars at O and at the corners are two squares, as large as the small star of the Comares bath stars, and are found the same way: from X, where line K1D crosses the line that halves the angle AOE. The point T, found with the circle through K1, closes the small squares and the green crosses. The drawing gives no steps.',
      'The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. No photo of the mosaic was checked.',
      '9 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/marrakesh-crafts-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/marrakesh-crafts-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Crafts Center, Marrakesh (P99)',
        url: 'https://tilingsearch.mit.edu/HTML/data164/P99.html',
      },
    ],
  },
  {
    id: 'alhambra-museum-pointed-stars',
    title:
      'Pointed stars of a tile panel in the Alhambra museum (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. A large star sits at the centre of every tile. A small star sits at every corner and at the middle of every side.',
    story: [
      'The finished design was read from Brian Wichmann’s P008B drawing, its corners snapped to exact values. We devised the construction. Its lines are exactly those of the Arrayanes porch ceiling and the Nasrid textile stars, so the construction is the same; only the inked pieces differ. The star at O and the eight kites round it become one large star with sharp points. The drawing gives no steps.',
      'The compass steps, their order and the named points are ours. The comparison with the drawing checks the finished lines, not how the design was first laid out. The colours follow Wichmann’s drawing, which he took from the original; no photograph was checked.',
      '10 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/alhambra-museum-pointed-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/alhambra-museum-pointed-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Alhambra museum, Granada (P008B)',
        url: 'https://tilingsearch.mit.edu/HTML/data159/P008B.html',
      },
    ],
  },
  {
    id: 'marrakesh-throne-rosette',
    title:
      'Rosette and octagons of the Royal Palace throne room (Marrakesh) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. A small black star sits at every corner.',
    story: [
      'The finished design was read from Wichmann’s C126B drawing. Its tile corners were snapped to the square-root-of-two grid in small-star-radius units. The unit-star opening and square-diagonal compass transfers are shared with the Rabat throne-room octagons; different crossings complete the rosette, the crosses and the octagons. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The tile edges follow the plain drawing; its white strokes over the joints are not bands. The colours follow Wichmann’s drawing, mapped to the Alhambra palette: the teal and blue octagons turn in a pinwheel, though the lines themselves are mirror-symmetric. No photograph was checked.',
      '12 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/marrakesh-throne-rosette/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/marrakesh-throne-rosette/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Royal Palace throne room, Marrakesh (C126B)',
        url: 'https://tilingsearch.mit.edu/HTML/data152/C126B.html',
      },
    ],
  },
  {
    id: 'alhambra-dos-hermanas-jamb-rosette',
    title:
      'Rosette of the arch jambs in the Sala de las Dos Hermanas, Alhambra (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. A small octagon sits at every corner.',
    story: [
      'The finished design was read from Wichmann’s NC2 drawing. Every line runs at 22.5° to the square repeat. Turned by 22.5°, the band centre lines snap to the square-root-of-two grid in units of the red star’s point radius, and the four line directions share one set of distances from O. So all lines are perpendiculars to the 22.5° line through O, marked by compass transfers and turned by 45°. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The 9 pt bands are represented by their centre lines. Our lines were laid over David Wade’s photograph SPA 1803 of the jamb and follow its white bands; no difference from the drawing was found. The colours follow Wichmann’s approximate drawing on the Alhambra palette (his red as honey-brown); the jamb itself also has purple pieces.',
      '9 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/alhambra-dos-hermanas-jamb-rosette/photo-overlay.png',
        caption:
          'David Wade’s photo with the tutorial’s lines in red (private, not shipped).',
      },
      {
        src: 'renders/alhambra-dos-hermanas-jamb-rosette/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/alhambra-dos-hermanas-jamb-rosette/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Alhambra, Granada: Sala de las Dos Hermanas, north arch (NC2)',
        url: 'https://tilingsearch.mit.edu/HTML/data174/NC2.html',
      },
    ],
  },
  {
    id: 'isfahan-seyyed-stars',
    title:
      'Stars and pentagons of the Seyyed mosque (Isfahan) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. A blue star sits at every corner.',
    story: [
      'The finished design was read from Wichmann’s IRAN2 drawing. Its tile corners were snapped to the square-root-of-two grid with the star’s point radius as the unit. The stars stand two apart along the lines of a larger pattern, so every line is at one of four distances from O, or at the same distances from the corner of the tile. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The tile edges follow the plain drawing; its white strokes over the joints are not bands. The colours follow Wichmann’s drawing: blue stars and blue ten-sided crosses mark the larger pattern among the gold stars. His second drawing of the panel (IRAN4) draws that larger pattern as lines over the same pieces; the lines are not inked here. No photograph was checked.',
      '11 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/isfahan-seyyed-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/isfahan-seyyed-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Masjid-e Sayyed, Isfahan (IRAN2)',
        url: 'https://tilingsearch.mit.edu/HTML/data209/IRAN2.html',
      },
    ],
  },
  {
    id: 'isfahan-sayyed-crosses',
    title:
      'Stars and crosses of the Masjid-e Sayyed (Isfahan) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side, corner to corner along the horizontal and vertical lines.',
    story: [
      'The finished design was read from Wichmann’s IRA1617 drawing. Its tile corners were snapped to the square-root-of-two grid with the star’s point radius as the unit. The stars stand two apart along the lines of a larger pattern, so every line is at one of a few distances from O, or at the same distances from the corner of the tile. The opening is shared with the Seyyed mosque stars (IRAN2), drawn in the same frame. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The tile edges follow the plain drawing; its white strokes over the joints are not bands. Wichmann also draws the larger pattern as lines over the pieces; those lines are not inked here. The colours follow his drawing. Wade’s photograph was not overlaid.',
      '10 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/isfahan-sayyed-crosses/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/isfahan-sayyed-crosses/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Masjid-e Sayyed, Isfahan (IRA1617)',
        url: 'https://tilingsearch.mit.edu/HTML/data201/IRA1617.html',
      },
    ],
  },
  {
    id: 'paccard-222-rosette',
    title:
      'Large rosette of a Moroccan panel (Paccard, page 222) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. A star rosette sits at every corner.',
    story: [
      'The finished design was read from Wichmann’s P18B drawing. Its tile corners were snapped to the square-root-of-two grid with the small star’s point radius as the unit. Every line, in all four directions, lies at one of twelve distances from O, so each is drawn once as a vertical line and turned round O; three diagonals near the corner of the tile complete the corner rosette. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The tile edges follow the plain drawing; its thin strokes over the joints are not bands. The colours follow Wichmann’s drawing, mapped to the Marinid zellige palette. His drawing of the bottom-left panel of the same page (P18A) changes the large rosette and shares the rest. No photograph was checked.',
      '11 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/paccard-222-rosette/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/paccard-222-rosette/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Morocco, after Paccard, page 222 top left (P18B)',
        url: 'https://tilingsearch.mit.edu/HTML/data157/P18B.html',
      },
    ],
  },
  {
    id: 'paccard-222-rosette-ring',
    title:
      'Ringed rosette of a Moroccan panel (Paccard, page 222) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. A star rosette sits at every corner.',
    story: [
      'The finished design was read from Wichmann’s P18A drawing. Its tile corners were snapped to the square-root-of-two grid with the small star’s point radius as the unit. It is the top-left panel of the same page (P18B) with a different ring round the large rosette: two of its distances from O are replaced by one, and the rest of the construction is shared. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The tile edges follow the plain drawing; its thin strokes over the joints are not bands. The colours follow Wichmann’s drawing, mapped to the Marinid zellige palette. No photograph was checked.',
      '12 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/paccard-222-rosette-ring/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/paccard-222-rosette-ring/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Morocco, after Paccard, page 222 bottom left (P18A)',
        url: 'https://tilingsearch.mit.edu/HTML/data157/P18A.html',
      },
    ],
  },
  {
    id: 'meknes-throne-rosette',
    title:
      'Rosette of the Royal Palace throne room (Meknes) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. A rosette sits at the centre of every tile.',
    story: [
      'The finished design was read from Wichmann’s C176A drawing. Its tile corners were snapped to the square-root-of-two grid in small-star-radius units. The unit-star opening is shared with the other Moroccan reconstructions. After it every line, the tile’s sides too, is drawn through a crossing of the star’s sides, carried on, with earlier lines, and turned round O. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The tile edges follow the plain drawing. The colours follow Wichmann’s drawing: red, black and white, in the Modern Moroccan palette. No photograph was checked. Wichmann notes that his drawing omits the panel’s central 24-pointed star; this repeat follows his drawing.',
      '22 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/meknes-throne-rosette/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/meknes-throne-rosette/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Royal Palace throne room, Meknes (C176A)',
        url: 'https://tilingsearch.mit.edu/HTML/data152/C176A.html',
      },
    ],
  },
  {
    id: 'fes-rosette-rings',
    title: 'Rosettes in octagonal rings (Fès) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. A rosette sits at the centre and at every corner.',
    story: [
      'The finished design was read from Wichmann’s MOR0719 drawing. Its tile corners were snapped to the square-root-of-two grid in small-star-radius units. The unit-star opening is shared with the other Moroccan reconstructions. After it almost every line is drawn through a crossing of the star’s sides, carried on, with earlier lines, and turned round O; two compass transfers set the lines of the rosettes at the tile’s corners. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The tile edges follow the plain drawing. The tile holds two rosettes, one at O and a quarter at each corner. The colours follow Wichmann’s drawing in the Marinid zellige palette. Wade’s photograph MOR 0719 was not checked.',
      '19 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/fes-rosette-rings/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/fes-rosette-rings/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Fès (MOR0719)',
        url: 'https://tilingsearch.mit.edu/HTML/data181/MOR0719.html',
      },
    ],
  },
  {
    id: 'seville-octagon-rings',
    title:
      'Stars in octagonal rings, a Seville tile panel (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. A star sits at the centre and at every corner.',
    story: [
      'The finished design was read from Wichmann’s RAY7 drawing, its interlaced bands reduced to their centre lines and snapped to the square-root-of-two grid. The circle, the octagon round it and the octagon of the lines at height V give the star; every other line is drawn through a crossing of earlier lines and turned round O. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The bands are drawn as their centre lines, woven over and under as in the drawing. The colours follow Wichmann’s drawing, which he says are as in the original, mapped to the Alhambra palette. No photograph was checked.',
      '12 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/seville-octagon-rings/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/seville-octagon-rings/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Seville tiles, Victoria and Albert Museum (RAY7)',
        url: 'https://tilingsearch.mit.edu/HTML/data183/RAY7.html',
      },
    ],
  },
  {
    id: 'sidi-said-window',
    title:
      'Pierced plaster window of the Dar Si Said museum (Marrakesh) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. A small star sits at the centre and at every corner.',
    story: [
      'The finished design was read from Wichmann’s L90 drawing, its bevelled bands reduced to their centre lines and snapped to the square-root-of-two grid. It shares every construction line but one with the Seville octagon rings: the circle, the octagon round it and the lines at height V, then lines through crossings of earlier lines, turned round O. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The plaster bands are drawn as their centre lines; the pieces are the window’s openings, in one colour, and the small kites and triangles where the bands cross, which are solid plaster. No photograph was checked.',
      '11 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/sidi-said-window/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/sidi-said-window/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Dar Si Said museum, Marrakesh (L90)',
        url: 'https://tilingsearch.mit.edu/HTML/data181/L90.html',
      },
    ],
  },
  {
    id: 'fes-najjarin-rosette',
    title: 'Rosette of the Najjarin fountain (Fès) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. A rosette sits at the centre of every tile.',
    story: [
      'The finished design was read from Wichmann’s BR14 drawing. Its tile corners were snapped to the square-root-of-two grid in small-star-radius units. The unit-star opening is shared with the other Moroccan reconstructions. After it every line is drawn through a crossing of earlier lines and turned round O; the tile’s sides come the same way, and the corner star’s sides from a compass mark at the tile’s corner. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The tile edges follow the plain drawing. The colours follow Wichmann’s drawing in the Marinid zellige palette; his light blue ring takes the palette’s blue, as his violet-blue pieces do. No photograph was checked.',
      '16 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/fes-najjarin-rosette/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/fes-najjarin-rosette/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Najjarin fountain, medina of Fès (BR14)',
        url: 'https://tilingsearch.mit.edu/HTML/data198/BR14.html',
      },
    ],
  },
  {
    id: 'meknes-bou-inania-rosette',
    title: 'Rosette of the Bou Inania madrasa (Meknes) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. A rosette sits at the centre of every tile.',
    story: [
      'The finished design was read from Wichmann’s MOR2404X drawing. Its tile corners were snapped to the square-root-of-two grid in small-star-radius units. It is the Najjarin fountain rosette with different rosettes at the tile’s corners, so it shares that tutorial’s opening steps. After the unit star every line is drawn through a crossing of earlier lines and turned round O; the tile’s sides come the same way, and the corner star’s sides from a compass mark at the tile’s corner. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The tile edges follow the plain drawing. The colours follow Wichmann’s drawing in the Modern Moroccan palette: his maroon is the palette’s red and his light blue its dark blue. Wade’s photo MOR 2404x was not checked.',
      '15 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/meknes-bou-inania-rosette/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/meknes-bou-inania-rosette/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Bou Inania madrasa, Meknes (MOR2404X)',
        url: 'https://tilingsearch.mit.edu/HTML/data175/MOR2404X.html',
      },
    ],
  },
  {
    id: 'meknes-throne-star-rosette',
    title:
      'Star rosette of the Royal Palace throne room (Meknes) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. A rosette sits at the centre of every tile.',
    story: [
      'The finished design was read from Wichmann’s C122C drawing. Its tile corners were snapped to the square-root-of-two grid in small-star-radius units. The unit-star opening is shared with the other Moroccan reconstructions. After it every line, the tile’s sides too, is drawn through a crossing of earlier lines and turned round O. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The tile edges follow the plain drawing. The colours follow Wichmann’s drawing, which keeps the original colouring: green, red, black and white, in the Tétouan palette, whose dark navy stands for his black. No photograph was checked.',
      '13 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/meknes-throne-star-rosette/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/meknes-throne-star-rosette/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Royal Palace throne room, Meknes (C122C)',
        url: 'https://tilingsearch.mit.edu/HTML/data152/C122C.html',
      },
    ],
  },
  {
    id: 'meknes-moulay-ismail-rosette',
    title: 'Rosette of the tomb of Moulay Ismail (Meknes) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. A rosette sits at the centre of every tile.',
    story: [
      'The finished design was read from Wichmann’s MOR0803 drawing. Its tile corners were snapped to the square-root-of-two grid in small-star-radius units. The opening, the unit star and the first six lines after it, is shared with the Meknes throne-room star rosette. After the unit star every line, the tile’s sides too, is drawn through a crossing of earlier lines and turned round O. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The tile edges follow the plain drawing. The colours follow Wichmann’s drawing: orange, green, black and white, in the Marinid zellige palette, whose honey stands for his orange. Wade’s photos MOR 0803 and MOR 0911 were not checked.',
      '11 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/meknes-moulay-ismail-rosette/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/meknes-moulay-ismail-rosette/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Tomb of Moulay Ismail, Meknes (MOR0803)',
        url: 'https://tilingsearch.mit.edu/HTML/data173/MOR0803.html',
      },
    ],
  },
  {
    id: 'fes-throne-star-burst',
    title:
      'Star burst of the Royal Palace throne room (Fès) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. A rosette sits at the centre of every tile.',
    story: [
      'The finished design was read from Wichmann’s C122B drawing. Its tile corners were snapped to the square-root-of-two grid in small-star-radius units. It is the Meknes throne-room star rosette with a different middle to the rosette, so it shares that tutorial’s steps and adds one family of diagonals for the long arms round the small star. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The tile edges follow the plain drawing. The colours follow Wichmann’s drawing, which keeps the original colouring: green, black, white and one maroon star, in the Tétouan palette, whose dark navy stands for his black. Wade’s photo MOR 0422 was not checked.',
      '14 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/fes-throne-star-burst/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/fes-throne-star-burst/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Royal Palace throne room, Fès (C122B)',
        url: 'https://tilingsearch.mit.edu/HTML/data152/C122B.html',
      },
    ],
  },
  {
    id: 'marrakesh-bahia-rosette',
    title: 'Rosette of the Bahia Palace (Marrakesh) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. A rosette sits at the centre of every tile.',
    story: [
      'The finished design was read from Wichmann’s MOR1218 drawing. Its tile corners were snapped to the square-root-of-two grid in small-star-radius units. The unit-star opening is shared with the other Moroccan reconstructions. After it every line, the tile’s sides too, is drawn through a crossing of earlier lines and turned round O. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The tile edges follow the plain drawing. The colours follow Wichmann’s drawing in the Marinid zellige palette: his ochre takes the palette’s amber. Wade’s photo MOR 1218 was not checked.',
      '16 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/marrakesh-bahia-rosette/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/marrakesh-bahia-rosette/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Bahia Palace, Marrakesh (MOR1218)',
        url: 'https://tilingsearch.mit.edu/HTML/data190/MOR1218.html',
      },
    ],
  },
  {
    id: 'fes-petal-star-rosette',
    title: 'Petal and star rosette (Fès) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. Four petal flowers ring the small star at the centre of every tile.',
    story: [
      'The finished design was read from Wichmann’s MOR0411 drawing. Its tile corners were snapped to the square-root-of-two grid in small-star-radius units. The unit-star opening is shared with the other Moroccan reconstructions. After it every line, the tile’s sides too, is drawn through a crossing of earlier lines and turned round O. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The tile edges follow the plain drawing. The colours follow Wichmann’s drawing in the Modern Moroccan palette: his red is the palette’s red and his light blue its dark blue. Wade’s photo MOR 0411 was not checked.',
      '20 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/fes-petal-star-rosette/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/fes-petal-star-rosette/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Fès (MOR0411)',
        url: 'https://tilingsearch.mit.edu/HTML/data175/MOR0411.html',
      },
    ],
  },
  {
    id: 'paris-mosque-rosette',
    title: 'Rosette of the Grande Mosquée (Paris) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. A rosette sits at the centre of every tile.',
    story: [
      'The finished design was read from Wichmann’s FR1 drawing. Its tile corners were snapped to the square-root-of-two grid in small-star-radius units. The unit-star opening is shared with the other Moroccan reconstructions. After it every line, the tile’s sides too, is drawn through a crossing of earlier lines and turned round O. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The tile edges follow the plain drawing. The colours follow Wichmann’s drawing in the Alhambra palette, which has his black, light blue, brown and dark blue: his light blue takes the palette’s teal. No photograph was checked.',
      '16 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/paris-mosque-rosette/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/paris-mosque-rosette/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Grande Mosquée de Paris (FR1)',
        url: 'https://tilingsearch.mit.edu/HTML/data200/FR1.html',
      },
    ],
  },
  {
    id: 'meknes-throne-ring-rosette',
    title:
      'Ringed rosette of the Royal Palace throne room (Meknes) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. A ringed rosette sits at the centre of every tile.',
    story: [
      'The finished design was read from Wichmann’s C124 drawing. Its tile corners were snapped to the square-root-of-two grid in small-star-radius units. The opening, the unit star and the first eight lines after it, is shared with the Meknes throne-room star rosette from the same room. After the unit star every line, the tile’s sides too, is drawn through a crossing of earlier lines and turned round O. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The tile edges follow the plain drawing. The colours follow Wichmann’s drawing, which keeps the original colouring: red, green, black and white, in the Tétouan palette, whose dark navy stands for his black. No photograph was checked.',
      '16 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/meknes-throne-ring-rosette/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/meknes-throne-ring-rosette/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Royal Palace throne room, Meknes (C124)',
        url: 'https://tilingsearch.mit.edu/HTML/data188/C124.html',
      },
    ],
  },
  {
    id: 'fes-moulay-ismail-interlace',
    title:
      'Interlaced rosette of the Moulay Ismail mosque (Fès) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. A rosette sits at the centre of every tile.',
    story: [
      'The finished design was read from Wichmann’s MOR0331 drawing, an interlace of bands, by their centre lines. Its tile corners were snapped to the square-root-of-two grid in star-radius units. The unit-star opening is shared with the other Moroccan reconstructions. After it every line, the tile’s sides too, is drawn through a crossing of earlier lines and turned round O. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The lines are the centre lines of the drawing’s bands; the over-and-under weave is not drawn. The colours follow Wichmann’s drawing: black, red and green, in the Tétouan palette, whose dark navy stands for his black; the bands themselves are not pieces. Wade’s photo MOR 0331 was not checked.',
      '21 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/fes-moulay-ismail-interlace/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/fes-moulay-ismail-interlace/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Moulay Ismail mosque, Fès (MOR0331)',
        url: 'https://tilingsearch.mit.edu/HTML/data189/MOR0331.html',
      },
    ],
  },
  {
    id: 'telouet-residence-rosettes',
    title: 'Rosettes of the royal residence (Telouet) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. A large rosette sits at the centre of every tile, and a cross rosette at every corner.',
    story: [
      'The finished design was read from Wichmann’s F16 drawing. Its tile corners were snapped to the square-root-of-two grid in star-radius units. The unit-star opening is shared with the other Moroccan reconstructions. After it every line, the tile’s sides too, is drawn through a crossing of earlier lines and turned round O. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The tile edges follow the plain drawing, which shows part of a larger pattern. The colours follow Wichmann’s drawing, which keeps the original colouring, in the Marinid zellige palette: his green, blue and black take the palette’s, and his orange and red both take its honey, since the palette has no red. No photograph was checked.',
      '16 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/telouet-residence-rosettes/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/telouet-residence-rosettes/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Royal residence, Telouet (F16)',
        url: 'https://tilingsearch.mit.edu/HTML/data166/F16.html',
      },
    ],
  },
  {
    id: 'fes-bou-inania-interlaced-rosette',
    title:
      'Interlaced rosette of the Bou Inania madrasa (Fès) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. A rosette sits at the centre of every tile.',
    story: [
      'The finished design was read from Wichmann’s P71TL drawing, an interlace of bands, by their centre lines. Its tile corners were snapped to the square-root-of-two grid in star-radius units. Every line of the Meknes throne-room star rosette is a line of this design too, so its whole construction is shared; four more lines follow. After the unit star every line, the tile’s sides too, is drawn through a crossing of earlier lines and turned round O. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The lines are the centre lines of the drawing’s bands; the over-and-under weave is not drawn. The colours follow Wichmann’s drawing: black, dark red and blue, in the Modern Moroccan palette; the bands themselves are not pieces. Wade’s photo MOR 0203 was not checked.',
      '15 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/fes-bou-inania-interlaced-rosette/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/fes-bou-inania-interlaced-rosette/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Bou Inania madrasa, Fès (P71TL)',
        url: 'https://tilingsearch.mit.edu/HTML/data166/P71TL.html',
      },
    ],
  },
  {
    id: 'telouet-framed-rosette',
    title:
      'Framed rosette of the royal residence (Telouet) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. A large rosette sits at every corner of the tile.',
    story: [
      'The finished design was read from Wichmann’s F17 drawing. Its tile corners were snapped to the square-root-of-two grid in small-star-radius units. The unit-star opening is shared with the other Moroccan reconstructions. After it every line, the tile’s sides too, is drawn through a crossing of earlier lines and turned round O. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The tile edges follow the plain drawing. The colours follow Wichmann’s drawing, which keeps the original colouring, in the Tétouan palette, whose dark navy stands for his black; his blue and light green, which the palette lacks, are fixed colours. No photograph was checked.',
      '17 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/telouet-framed-rosette/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/telouet-framed-rosette/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Royal residence, Telouet (F17)',
        url: 'https://tilingsearch.mit.edu/HTML/data166/F17.html',
      },
    ],
  },
  {
    id: 'fes-attarine-rosette',
    title: 'Rosette of the Attarine madrasa (Fès) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. A rosette sits at the centre of every tile.',
    story: [
      'The finished design was read from Wichmann’s MOR0321 drawing. Its tile corners were snapped to the square-root-of-two grid in small-star-radius units. The unit-star opening is shared with the other Moroccan reconstructions. After it every line, the tile’s sides too, is drawn through a crossing of earlier lines and turned round O. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The tile edges follow the plain drawing. The colours follow Wichmann’s drawing in the Tétouan palette, whose dark navy stands for his black. No photograph was checked.',
      '15 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/fes-attarine-rosette/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/fes-attarine-rosette/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Attarine madrasa, Fès (MOR0321)',
        url: 'https://tilingsearch.mit.edu/HTML/data175/MOR0321.html',
      },
    ],
  },
  {
    id: 'marrakesh-bahia-ring-rosette',
    title:
      'Ringed rosette of the Bahia Palace (Marrakesh) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. A rosette sits at the centre of every tile.',
    story: [
      'The finished design was read from Wichmann’s C123 drawing. Its tile corners were snapped to the square-root-of-two grid in small-star-radius units. The unit-star opening is shared with the other Moroccan reconstructions. After it every line, the tile’s sides too, is drawn through a crossing of earlier lines and turned round O. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The tile edges follow the plain drawing. The original is uncoloured; the colours follow Wichmann’s drawing in the Tétouan palette, whose dark navy stands for his black and whose red for his dark red. No photograph was checked.',
      '11 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/marrakesh-bahia-ring-rosette/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/marrakesh-bahia-ring-rosette/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Bahia Palace, Marrakesh (C123)',
        url: 'https://tilingsearch.mit.edu/HTML/data152/C123.html',
      },
    ],
  },
  {
    id: 'fes-two-rosettes',
    title: 'Two rosettes (Fès) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. A large rosette sits at the centre of every tile, and a rosette of eight petals at each corner.',
    story: [
      'The finished design was read from Wichmann’s MOR0837 drawing. Its tile corners were snapped to the square-root-of-two grid in small-star-radius units. The unit-star opening is shared with the other Moroccan reconstructions. After it every line, the tile’s sides too, is drawn through a crossing of earlier lines and turned round O. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The tile edges follow the plain drawing. The colours follow Wichmann’s drawing in the Marinid zellige palette. Wade’s photo MOR 0837 was not checked.',
      '14 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/fes-two-rosettes/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/fes-two-rosettes/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Fès, Morocco (MOR0837)',
        url: 'https://tilingsearch.mit.edu/HTML/data181/MOR0837.html',
      },
    ],
  },
  {
    id: 'meknes-manezeh-fountain-rosette',
    title: 'Rosette of the Manezeh fountain (Meknes) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. A large rosette sits at the centre of every tile, and a rosette of eight petals at each corner.',
    story: [
      'The finished design was read from Wichmann’s F19 drawing. Its tile corners were snapped to the square-root-of-two grid in small-star-radius units. Every line of the Fès two rosettes (MOR0837) is a line of this design too, so its whole construction is shared; one more set of lines, drawn through a crossing of earlier lines and turned round O, changes the large rosette. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The tile edges follow the plain drawing. The colours follow Wichmann’s drawing, which keeps the colours of Paccard’s plate: black, green, red and light blue, in the Marinid zellige palette, which has no red: his red takes the palette’s honey and his light blue its blue. No photograph was checked.',
      '15 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/meknes-manezeh-fountain-rosette/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/meknes-manezeh-fountain-rosette/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Manezeh fountain, Meknes (F19)',
        url: 'https://tilingsearch.mit.edu/HTML/data166/F19.html',
      },
    ],
  },
  {
    id: 'alhambra-comares-west-dado',
    title:
      'Rosette dado of the Salón de Comares west wall, Alhambra (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. A rosette sits at the centre of every tile.',
    story: [
      'The finished design was read from Wichmann’s F169 drawing, an interlace of bands, by their centre lines. Its tile corners were snapped to the square-root-of-two grid in star-radius units. After the unit star every line, the tile’s sides too, is drawn through a crossing of earlier lines and turned round O. Two of those lines are helpers that the finished pattern does not use: no crossing of the pattern’s own lines lies on another of its lines. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The lines are the centre lines of the drawing’s bands; the over-and-under weave is not drawn. The colours follow Wichmann’s drawing, which keeps the panel’s own: black, teal, honey and blue, in the Alhambra palette; the bands themselves are not pieces. No photograph was checked.',
      '18 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/alhambra-comares-west-dado/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/alhambra-comares-west-dado/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Salón de Comares, Alhambra, Granada (F169)',
        url: 'https://tilingsearch.mit.edu/HTML/data150/F169.html',
      },
    ],
  },
  {
    id: 'marrakesh-dar-el-bacha-rosette',
    title:
      'Rosette of the Dar el Bacha palace (Marrakesh) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. A rosette sits at the centre of every tile, and its mirror image at each corner.',
    story: [
      'The finished design was read from Wichmann’s MIR19 drawing. Its tile corners were snapped to the square-root-of-two grid in small-star-radius units. The unit-star opening is shared with the other Moroccan reconstructions. After it every line, the tile’s sides too, is drawn through a crossing of earlier lines and turned round O. The pattern turns about O but has no mirror through it. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The tile edges follow the plain drawing. The colours follow Wichmann’s drawing in the Marinid zellige palette: his pale green takes its green, his rust its honey, and his dark blue and sea green both its blue. No photograph was checked; Wichmann notes that the photo shows a band round the panel, which is not drawn.',
      '16 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/marrakesh-dar-el-bacha-rosette/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/marrakesh-dar-el-bacha-rosette/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Dar el Bacha palace, Marrakesh (MIR19)',
        url: 'https://tilingsearch.mit.edu/HTML/data215/MIR19.html',
      },
    ],
  },
  {
    id: 'fes-motif-rosette',
    title: 'Star and rosette motif (Fès) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. A red rosette sits at the centre of every tile, a white star at every corner.',
    story: [
      'The finished design was read from Wichmann’s FEZ7 drawing. Its tile corners were snapped to the square-root-of-two grid in small-star-radius units. The unit-star opening is shared with the other Moroccan reconstructions. After it every line, the tile’s sides too, is drawn through a crossing of earlier lines and turned round O. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The tile edges follow the plain drawing. The colours follow Wichmann’s drawing in the Modern Moroccan palette. No photograph was checked.',
      '18 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/fes-motif-rosette/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/fes-motif-rosette/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Fès (FEZ7)',
        url: 'https://tilingsearch.mit.edu/HTML/data191/FEZ7.html',
      },
    ],
  },
  {
    id: 'isfahan-ali-notched-tiles',
    title: 'Notched tiles of the Masjid-e Ali, Isfahan (new, Tiling Search)',
    fold: 2,
    status: 'decide',
    summary: 'Put copies of the rectangular tile side by side.',
    story: [
      'The finished design was read from Brian Wichmann’s IRA1330 drawing and its corners snapped to exact values. OA is the half-diagonal of a small square. Two compass transfers of the unit-square diagonal give the rectangular repeat. The drawing gives no steps; we devised the construction.',
      'The plain tile boundaries are retained. The palette is illustrative. No building photograph was checked. The compass steps, their order and the named points are ours.',
      '12 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/isfahan-ali-notched-tiles/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/isfahan-ali-notched-tiles/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Masjid-e Ali, Isfahan (IRA1330)',
        url: 'https://tilingsearch.mit.edu/HTML/data189/IRA1330.html',
      },
    ],
  },
  {
    id: 'hama-azem-door-tiles',
    title: 'Notched door tiles of the Azem Palace, Hama (new, Tiling Search)',
    fold: 2,
    status: 'decide',
    summary: 'Put copies of the rectangular tile side by side.',
    story: [
      'The finished design was read from Brian Wichmann’s HAMA drawing and its corners snapped to exact values. OA is one straight side of the ten-sided tile. Compass transfers of the square diagonal fix the rectangular repeat. The drawing gives no steps; we devised the construction.',
      'His bevelled wood is represented by single lines along the middles of its 15 pt bands. The palette is illustrative. No door photograph was checked. The compass steps, their order and the named points are ours.',
      '12 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/hama-azem-door-tiles/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/hama-azem-door-tiles/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Azem Palace, Hama, Syria (HAMA)',
        url: 'https://tilingsearch.mit.edu/HTML/data187/HAMA.html',
      },
    ],
  },
  {
    id: 'isfahan-royal-mosque-star-rows',
    title: 'Rows of stars of the Royal Mosque, Isfahan (new, Tiling Search)',
    fold: 2,
    status: 'decide',
    summary: 'Put copies of the rectangular tile side by side.',
    story: [
      'The finished design was read from Brian Wichmann’s IRA0501 drawing and its corners snapped to exact values. OA is the star’s point radius. Its two squares and compass transfers of the unit-square diagonal fix the rectangular repeat. The drawing gives no steps; we devised the construction.',
      'The plain tile boundaries are retained. The palette is illustrative. No building photograph was checked. The compass steps, their order and the named points are ours.',
      '11 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/isfahan-royal-mosque-star-rows/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/isfahan-royal-mosque-star-rows/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Royal Mosque, Isfahan (IRA0501)',
        url: 'https://tilingsearch.mit.edu/HTML/data193/IRA0501.html',
      },
    ],
  },
  {
    id: 'iranian-star-columns',
    title:
      'Stars and upright connectors from an Iranian collection (new, Tiling Search)',
    fold: 2,
    status: 'decide',
    summary: 'Put copies of the square tile side by side.',
    story: [
      'The finished design was read from Brian Wichmann’s F80 drawing and its corners snapped to exact values. It shares the Charbagh star construction, then adds verticals and diagonals for connectors that keep one direction. The drawing gives no steps; we devised the construction.',
      'The plain tile boundaries are retained. The palette is illustrative. The source names no building; none is assigned here. The compass steps, their order and the named points are ours.',
      '14 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/iranian-star-columns/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/iranian-star-columns/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Al-Naqsh, volume 3, figure 80 (F80)',
        url: 'https://tilingsearch.mit.edu/HTML/data16/F80.html',
      },
    ],
  },
  {
    id: 'pompeii-squares-and-triangles',
    title:
      'Squares and triangles of a Roman mosaic, Pompeii (new, Tiling Search)',
    fold: 2,
    status: 'decide',
    summary: 'Put copies of the square tile side by side.',
    story: [
      'The finished design was read from Brian Wichmann’s CM006A drawing. The frame is turned by 45° so OA follows a mirror line and is half a square diagonal. The square and its compass transfers give every corner exactly. The drawing gives no steps; we devised the construction.',
      'The plain boundaries are retained. The palette is illustrative. This is a Roman mosaic, not an Islamic building attribution. No photograph was checked. The compass steps, their order and the named points are ours.',
      '7 steps, beginner.',
    ],
    pictures: [
      {
        src: 'renders/pompeii-squares-and-triangles/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/pompeii-squares-and-triangles/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Roman mosaic, Pompeii (CM006A)',
        url: 'https://tilingsearch.mit.edu/HTML/data6/CM006A.html',
      },
    ],
  },
  {
    id: 'nishapur-mahruq-star-rows',
    title:
      'Stars and connecting tiles of the Mahruq imamzadeh, Nishapur (new, Tiling Search)',
    fold: 2,
    status: 'decide',
    summary: 'Put copies of the rectangular tile side by side.',
    story: [
      'The finished design was read from Brian Wichmann’s F109 drawing and its corners snapped to exact values. OA is the star’s point radius. Compass transfers of the square diagonal and of OA give the longer rectangular repeat. The drawing gives no steps; we devised the construction.',
      'The plain tile boundaries are retained. The palette is illustrative. The source says the original colouring had extensive ornamentation, which is not reconstructed here. No tomb photograph was checked. The compass steps, their order and the named points are ours.',
      '15 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/nishapur-mahruq-star-rows/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/nishapur-mahruq-star-rows/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Mahruq imamzadeh, Nishapur (F109)',
        url: 'https://tilingsearch.mit.edu/HTML/data16/F109.html',
      },
    ],
  },
  {
    id: 'kerman-ganj-ali-khan-chevrons',
    title:
      'Stars and chevrons of the Ganj Ali Khan complex, Kerman (new, Tiling Search)',
    fold: 1,
    status: 'decide',
    summary: 'Put copies of the rectangular tile side by side.',
    story: [
      'The finished design was read from Brian Wichmann’s P111 drawing and its corners snapped to exact values. OA is the star’s point radius and follows a mirror. The chevrons keep their direction, so the boundaries have no half-turn. The drawing gives no steps; we devised the construction.',
      'The plain boundaries and the three source fill classes are retained. The palette is illustrative. Two ten-sided forms share one piece key because their areas, side lengths and perimeters agree; their different outlines are retained. No building photograph was checked. The compass steps, their order and the named points are ours.',
      '9 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/kerman-ganj-ali-khan-chevrons/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/kerman-ganj-ali-khan-chevrons/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Ganj Ali Khan complex, Kerman (P111)',
        url: 'https://tilingsearch.mit.edu/HTML/data181/P111.html',
      },
    ],
  },
  {
    id: 'bourgoin-52-octagon-rows',
    title: 'Octagon rows of Bourgoin plate 52 (new, Tiling Search)',
    fold: 2,
    status: 'decide',
    summary: 'Put copies of the rectangular tile side by side.',
    story: [
      'The finished design was read from Brian Wichmann’s P052 drawing and its corners snapped to exact values. The frame turns by −22.5°. OA is the radius of the circle inside the octagon through the star’s points. The guide construction is shared with plate 144; the narrower rectangle gives this different arrangement. The drawing gives no steps; we devised the construction.',
      'The plain boundaries are retained. The palette is illustrative. The page identifies no building, and none is assigned here. No building photograph was checked. The compass steps, their order and the named points are ours.',
      '12 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/bourgoin-52-octagon-rows/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/bourgoin-52-octagon-rows/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Bourgoin, plate 52 (P052)',
        url: 'https://tilingsearch.mit.edu/HTML/data11/P052.html',
      },
    ],
  },
  {
    id: 'golestan-palace-star-rows',
    title:
      'Stars and connecting tiles of the Golestan Palace, Tehran (new, Tiling Search)',
    fold: 2,
    status: 'decide',
    summary: 'Put copies of the rectangular tile side by side.',
    story: [
      'The finished design was read from Brian Wichmann’s P30 drawing and its corners snapped to exact values. OA is the star’s point radius. The star’s two squares and transfers of the unit-square diagonal give the rectangular repeat. The drawing gives no steps; we devised the construction.',
      'The plain boundaries and the three source fill classes are retained. The numeric palette is illustrative. Equal star outlines in different surroundings remain one piece type. No palace photograph was checked. The compass steps, their order and the named points are ours.',
      '10 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/golestan-palace-star-rows/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/golestan-palace-star-rows/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Golestan Palace, Tehran (P30)',
        url: 'https://tilingsearch.mit.edu/HTML/data17/P30.html',
      },
    ],
  },
  {
    id: 'mosul-imam-yahya-star-rows',
    title:
      'Stars above the door of the Imam Yahya mosque, Mosul (new, Tiling Search)',
    fold: 2,
    status: 'decide',
    summary: 'Put copies of the rectangular tile side by side.',
    story: [
      'The finished design was read from Brian Wichmann’s S45A drawing and its corners snapped to exact values. The frame turns by 45° to put OA on a mirror. OA is the star’s point radius; compass transfers of the square diagonal fix the repeat. The drawing gives no steps; we devised the construction.',
      'The plain boundaries are retained in the turned teaching frame. The palette is illustrative. No mosque photograph or original museum drawing was independently checked. The compass steps, their order and the named points are ours.',
      '9 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/mosul-imam-yahya-star-rows/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/mosul-imam-yahya-star-rows/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Imam Yahya mosque, Mosul, Iraq (S45A)',
        url: 'https://tilingsearch.mit.edu/HTML/data9/S45A.html',
      },
    ],
  },
  {
    id: 'agra-fort-band-rows',
    title: 'Stars and banded rows of the Agra Fort (new, Tiling Search)',
    fold: 2,
    status: 'decide',
    summary: 'Put copies of the rectangular tile side by side.',
    story: [
      'The finished design was read from Brian Wichmann’s DW5 drawing and its band centre lines snapped to exact values. OA is the star’s point radius. The unit star and compass transfers fix the rectangular repeat. The drawing gives no steps; we devised the construction.',
      'The bevel facets are replaced by single lines along the centres of the 15 pt bands. The four source fill classes are retained with an illustrative numeric palette. No fort photograph was checked. The compass steps, their order and the named points are ours.',
      '11 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/agra-fort-band-rows/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/agra-fort-band-rows/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Agra Fort, Agra, India (DW5)',
        url: 'https://tilingsearch.mit.edu/HTML/data214/DW5.html',
      },
    ],
  },
  {
    id: 'amol-marashi-tile-rows',
    title:
      'Tile rows of the Mir Qavam al-Din Mar’ashi building, Amol (new, Tiling Search)',
    fold: 2,
    status: 'decide',
    summary: 'Put copies of the rectangular tile side by side.',
    story: [
      'The finished design was read from Brian Wichmann’s IRAN16 drawing and its corners snapped to exact values. OA is half a small square’s side. The unit-square diagonal and compass transfers give the longer rectangular repeat. The drawing gives no steps; we devised the construction.',
      'The plain boundaries and four source fill classes are retained. The numeric palette is illustrative. No building photograph was checked. The compass steps, their order and the named points are ours.',
      '10 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/amol-marashi-tile-rows/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/amol-marashi-tile-rows/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Mir Qavam al-Din Mar’ashi building, Amol (IRAN16)',
        url: 'https://tilingsearch.mit.edu/HTML/data197/IRAN16.html',
      },
    ],
  },
  {
    id: 'qom-atiq-courtyard-rows',
    title: 'Stars and squares of the Atiq courtyard, Qom (new, Tiling Search)',
    fold: 2,
    status: 'decide',
    summary: 'Put copies of the rectangular tile side by side.',
    story: [
      'The finished design was read from Brian Wichmann’s P105 drawing and its corners snapped to exact values. OA is a small square’s half-diagonal. Compass transfers of OA, OM and the unit-square diagonal give the rectangular repeat. The drawing gives no steps; we devised the construction.',
      'The plain boundaries and three source fill classes are retained. The numeric palette is illustrative. No courtyard photograph was checked. The compass steps, their order and the named points are ours.',
      '19 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/qom-atiq-courtyard-rows/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/qom-atiq-courtyard-rows/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Atiq courtyard, Qom, Iran (P105)',
        url: 'https://tilingsearch.mit.edu/HTML/data181/P105.html',
      },
    ],
  },
  {
    id: 'nasrid-casket-stars',
    title: 'Interlaced stars of a Nasrid casket (new, Tiling Search)',
    fold: 2,
    status: 'decide',
    summary: 'Put copies of the rectangular tile side by side.',
    story: [
      'The finished design was read from Brian Wichmann’s VA1 drawing and its band centre lines snapped to exact values. OA is the full star’s point radius. The unit star and compass transfers fix the rectangular repeat. The drawing gives no steps; we devised the construction.',
      'The coloured faces are expanded to the centres of the 12 pt bands. The player weaves those centre lines and retains the five source fill classes with an illustrative numeric palette. No museum photograph was checked. The compass steps, their order and the named points are ours.',
      '17 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/nasrid-casket-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/nasrid-casket-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Nasrid casket, V&A 270-1895, Granada (VA1)',
        url: 'https://tilingsearch.mit.edu/HTML/data185/VA1.html',
      },
    ],
  },
  {
    id: 'alhambra-partal-turned-stars',
    title:
      'Turned stars of the Torre de las Damas, Alhambra (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. A turned star sits at the centre of every tile, and a square star at every corner.',
    story: [
      'The finished design was read from Wichmann’s SPA0807 drawing, an interlace of bands, by their centre lines. Its corners were snapped to the square-root-of-two grid in star-radius units, in the tile’s four directions and in the four directions turned by 22.5°. The tile’s half side is (1 + √2)² star radii: line OS2 meets the vertical through A at height 1 + √2, and line OS1 carries that out to the tile’s side. One helper line, the horizontal through P, is not in the finished pattern. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The lines are the centre lines of the drawing’s bands; the over-and-under weave is drawn by the player’s interlace look. Laid over Wade’s photo SPA 0807, our lines follow the square frames and the corner stars on the flat jamb; the turned stars lie where the wall curves into the arch, so the photo could not confirm or correct them, and the drawing is kept.',
      '11 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/alhambra-partal-turned-stars/photo-overlay.png',
        caption:
          'David Wade’s photo with the tutorial’s lines in red (private, not shipped).',
      },
      {
        src: 'renders/alhambra-partal-turned-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/alhambra-partal-turned-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Torre de las Damas, Partal, Alhambra, Granada (SPA0807)',
        url: 'https://tilingsearch.mit.edu/HTML/data191/SPA0807.html',
      },
    ],
  },
  {
    id: 'alhambra-mexuar-vestibule-rosettes',
    title:
      'Sixteen-pointed rosettes of the Mexuar vestibule ceiling, Alhambra (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the tile side by side, corner to corner. A rosette sits at the centre of every tile, and an eight-pointed star at every corner.',
    story: [
      'The finished design was read from Wichmann’s E41 drawing, an interlace of bands, by their centre lines. Every star, sixteen-pointed or eight-pointed, has its sides at one distance d from its centre. A rosette’s ring of sixteen lines is made of the next rosettes’ star sides, and the ring lies |AT| further out than the star’s sides, where T is the turned star on the tile’s side. These two facts fix d, marked here with the compass as half of KG. No three lines of the drawing meet in one point, so every other family is carried by the compass set to d, by turning round O, or by the tile’s mirror. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The lines are the centre lines of the drawing’s bands; the over-and-under weave is drawn by the player’s interlace look. No photograph of this ceiling was available to check: the Wade photograph paired with E41 in our research (SPA 1917, the Sala del Mexuar dado) shows a different design, with narrower sixteen-pointed stars.',
      '12 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/alhambra-mexuar-vestibule-rosettes/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/alhambra-mexuar-vestibule-rosettes/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Mexuar patio, vestibule ceiling, Alhambra, Granada (E41)',
        url: 'https://tilingsearch.mit.edu/HTML/data208/E41.html',
      },
    ],
  },
  {
    id: 'cairo-bagasi-rosettes',
    title: 'Rosettes of Barsbay al-Bagasi (Cairo) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. A sixteen-pointed star sits at the centre of every tile, and an octagon at each corner.',
    story: [
      'The finished design was read from Wichmann’s B153 drawing, a sixteen-pointed star on a square tile with an octagon at each corner, its bands drawn as parallel strips. Every edge runs at a multiple of 11.25°. The tile’s half-side is 6.5 + 3√2 strips (drawing: 10.7428), and every line but the star’s runs through a crossing of the strips, the tile’s sides and the lines through their middles. The star’s size is free in the drawing (2.0292 strips from O to each star line); we draw it through a crossing already on the board, 3(√3 − 1) cos 22.5° = 2.0290 strips from O. A narrower strip round the corner octagons is the star’s radius times sin 22.5°. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The bands follow their centre lines; the band width is not drawn. The star is 0.0002 strips (0.005 pt in the drawing) smaller than Wichmann’s. Colours follow his drawing in the Mamluk wood palette. No photograph was checked.',
      '21 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/cairo-bagasi-rosettes/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/cairo-bagasi-rosettes/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Barsbay al-Bagasi, Cairo (B153)',
        url: 'https://tilingsearch.mit.edu/HTML/data188/B153.html',
      },
    ],
  },
  {
    id: 'bourgoin-153-rosettes',
    title: 'Rosettes of Bourgoin’s plate 153 (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. A sixteen-pointed star sits at the centre of every tile, and an octagon at each corner.',
    story: [
      'The finished design was read from Wichmann’s B153A drawing of Bourgoin’s plate 153, the design of Barsbay al-Bagasi (B153) drawn as tiles. Every line of that design is a line here, so its whole construction is shared; more lines round the star, each through a crossing of earlier lines, change the pieces round it. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The colours follow Wichmann’s drawing in the Mamluk wood palette. No photograph was checked.',
      '23 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/bourgoin-153-rosettes/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/bourgoin-153-rosettes/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Bourgoin, Les arts arabes, plate 153 (B153A)',
        url: 'https://tilingsearch.mit.edu/HTML/data188/B153A.html',
      },
    ],
  },
  {
    id: 'mughal-jali-octagons',
    title: 'Octagons of a Mughal jali screen (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. The large octagons touch at the middles of the tile’s sides.',
    story: [
      'The finished design was read from Wichmann’s MET1 drawing, whose pieces are drawn edge to edge. O is the centre of the four pieces that turn round the middle of the tile, and OA is half the repeat. Every edge runs at a multiple of 22.5° and lies on one of a few lines: the sides of the octagon in the circle through A (drawing 0.9238 from O, cos 22.5° = 0.9239), the sides of a smaller octagon through P (drawing 0.6681, tan 33.75° = 0.6682), where P is the centre of the circle inside the triangle OAS3, and the horizontal, vertical and 45° lines through P and its turns (drawing 0.2557, 0.2557 exactly). The four hooked pieces round O need one more line each way, through the crossing Q (drawing 0.1059 from O, 0.1059 exactly). The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. Wichmann’s page gives the symmetry as p4m, but the four pieces round the centre of the tile turn without a mirror, so the design is a pinwheel; we follow the drawing. His thick and thin bands (the two levels of the design) are drawn as plain lines. Colours follow the shapes, not his drawing, which is one colour. No photograph was checked.',
      '9 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/mughal-jali-octagons/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/mughal-jali-octagons/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Jali screen, India (Metropolitan Museum of Art) (MET1)',
        url: 'https://tilingsearch.mit.edu/HTML/data193/MET1.html',
      },
    ],
  },
  {
    id: 'salim-chishti-octagons',
    title:
      'Octagons of Salim Chishti’s tomb (Fatehpur Sikri) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. The large octagons touch at the middles of the tile’s sides.',
    story: [
      'The finished design was read from Wichmann’s SM27 drawing, whose pieces are drawn edge to edge. O is the centre of the four pieces that turn round the middle of the tile, and OA is half the repeat. Every edge runs at a multiple of 22.5° and lies on one of a few lines: the sides of the octagon in the circle through A (drawing 0.9238 from O, cos 22.5° = 0.9239), the sides of a smaller octagon through P (drawing 0.6681, tan 33.75° = 0.6682), where P is the centre of the circle inside the triangle OAS3, and the horizontal, vertical and 45° lines through P and its turns (drawing 0.2557, 0.2557 exactly). The four pinwheel pieces round O lie on the 22.5° lines through O. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. Wichmann’s page gives the symmetry as p4m, but the four pieces round the centre of the tile turn without a mirror, so the design is a pinwheel; we follow the drawing. His thick and thin bands (the two levels of the design) are drawn as plain lines. Colours follow the shapes, not his drawing, which is one colour. No photograph was checked.',
      '8 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/salim-chishti-octagons/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/salim-chishti-octagons/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Tomb of Salim Chishti, Fatehpur Sikri (SM27)',
        url: 'https://tilingsearch.mit.edu/HTML/data206/SM27.html',
      },
    ],
  },
  {
    id: 'bourgoin-149-rosettes',
    title: 'Rosettes of Bourgoin’s plate 149 (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. A sixteen-pointed star sits at the centre of every tile. Eight-pointed stars sit on its sides, and a four-pointed star at each corner.',
    story: [
      'The finished design was read from Wichmann’s A285 drawing of Bourgoin’s plate 149 (top): a sixteen-pointed star on a square tile, eight-pointed stars on the tile’s sides and a four-pointed star at each corner, every star split into kites. Every edge runs at a multiple of 11.25°. The star’s lines join points of its circle 90° apart. The tile’s half-side is the one free length (drawing: 1.97067 times the star’s radius); we take the crossing of the 45° line through A with the chord from U3 to S7, 1.97086. Every other line runs through a crossing of earlier lines. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The tile is 0.01% larger than Wichmann’s (0.024 pt in his drawing). Wichmann colours each piece and its mirror image differently; we colour by shape. No photograph was checked.',
      '18 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/bourgoin-149-rosettes/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/bourgoin-149-rosettes/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Bourgoin, plate 149 (top) (A285)',
        url: 'https://tilingsearch.mit.edu/HTML/data15/A285.html',
      },
    ],
  },
  {
    id: 'shafai-248-rosettes',
    title: 'Rosettes from Shafai, page 248 (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. A sixteen-pointed star sits at the centre of every tile, and eight-pointed stars sit on its sides.',
    story: [
      'The finished design was read from Wichmann’s SHAF2 drawing of a pattern in Shafai’s book: the design of Bourgoin’s plate 149 on a smaller square tile, a sixteen-pointed star at its centre and eight-pointed stars on its sides, every star split into kites. Every edge runs at a multiple of 11.25°. The star is the same, so the first four steps are shared. The tile’s half-side comes exactly from two corners of the star’s own lines, and every other line runs through a crossing of earlier lines. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. Wichmann colours each piece and its mirror image differently; we colour by shape. No photograph was checked.',
      '20 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/shafai-248-rosettes/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/shafai-248-rosettes/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Shafai, page 248 (SHAF2)',
        url: 'https://tilingsearch.mit.edu/HTML/data200/SHAF2.html',
      },
    ],
  },
  {
    id: 'bourgoin-65-rosettes',
    title: 'Rosettes of Bourgoin’s plate 65 (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. A sixteen-pointed star sits at the centre of every tile, and an octagon at each corner.',
    story: [
      'The finished design was read from Wichmann’s P065 drawing of Bourgoin’s plate 65: sixteen-pointed stars on a square grid, with octagons between them. Every edge runs at a multiple of 22.5°, and every line is one of three sets of lines about the star: the sixteen lines joining points of the circle 90° apart, sixteen lines parallel to them nearer O, and eight more. Each runs through a crossing of earlier lines. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. Colours follow Wichmann’s drawing. No photograph was checked.',
      '7 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/bourgoin-65-rosettes/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/bourgoin-65-rosettes/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Bourgoin, plate 65 (P065)',
        url: 'https://tilingsearch.mit.edu/HTML/data168/P065.html',
      },
    ],
  },
  {
    id: 'hafiz-tomb-rosettes',
    title: 'Rosettes of the tomb of Hafiz (Shiraz) (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. The sixteen-pointed stars sit at the tile’s centre and, between them, four-pointed stars at its corners.',
    story: [
      'The finished design was read from Wichmann’s FIG8 drawing: sixteen-pointed stars ringed by kites and pentagons, eight-pointed stars between them, octagons, and a four-pointed star at each corner of the square tile. Every edge runs at 11.25° plus a multiple of 22.5°. The star’s lines join points of its circle 90° apart and, carried on, make the kites round it. Each pentagon has three equal outer sides, and the eight-pointed star’s points fix the tile; every other line runs through a crossing of earlier lines. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The tile is 0.005% smaller than Wichmann’s (0.008 pt in his drawing). Colours follow his drawing. No photograph was checked.',
      '12 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/hafiz-tomb-rosettes/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/hafiz-tomb-rosettes/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Tomb of Hafiz, Shiraz (FIG8)',
        url: 'https://tilingsearch.mit.edu/HTML/data169/FIG8.html',
      },
    ],
  },
  {
    id: 'jali-screen-pinwheel',
    title: 'Pinwheel of a Mughal jali screen (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the square tile side by side. The pinwheel turns about the centre of every tile.',
    story: [
      'The finished design was read from Wichmann’s MET2 drawing, whose pieces are drawn edge to edge. O is a centre of four-fold turning and OA is half the repeat. All but two of its lines run at 22.5° to the tile’s sides or at 45° to those, and each passes through a corner of the tile, the middle of a side or a centre of a tile (drawing within 0.0005 of OA). The other two lines each way are horizontal and vertical, halfway from O to the tile’s sides. Every line runs through a crossing of earlier lines inside the tile. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. Wichmann’s page gives the symmetry as p4m, but the lines at 22.5° and at 67.5° are not mirror images of each other, so the design is a pinwheel; we follow the drawing. His thick and thin bands (the two levels of the design) are drawn as plain lines. Its bands end against each other, as in a pierced screen, so it is never shown woven. Colours follow the shapes, not his drawing, which is one colour. No photograph was checked.',
      '10 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/jali-screen-pinwheel/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/jali-screen-pinwheel/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Jali screen, India (Metropolitan Museum of Art) (MET2)',
        url: 'https://tilingsearch.mit.edu/HTML/data193/MET2.html',
      },
    ],
  },
  {
    id: 'tayabad-zayn-stars',
    title:
      'Ten-pointed stars of the shrine of Zayn al-Din, Tayabad (new, Tiling Search)',
    fold: 2,
    status: 'decide',
    summary:
      'Put copies of the rectangular tile side by side. A ten-pointed star sits at the centre and at each corner of every tile.',
    story: [
      'The finished design was read from Wichmann’s F66B drawing, whose pieces are drawn edge to edge. O is the centre of a ten-pointed star made of two regular pentagons, and OA is the distance from O to the star’s lines. The repeat is a rectangle of half-sides 3 + √5 and 1/sin 36° (in OA), with a second kind of star at its corners. Every line runs at 90° to the star’s radius at A, B, C and on round, and every offset, fitted as (a + b√5)/c, lies within 0.0007 of OA of the drawing. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. Colours follow the shapes, not his drawing. No photograph was checked.',
      '13 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/tayabad-zayn-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/tayabad-zayn-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Shrine of Zayn al-Din, Tayabad, Iran (F66B)',
        url: 'https://tilingsearch.mit.edu/HTML/data13/F66B.html',
      },
    ],
  },
  {
    id: 'fatehpur-masjid-decagons',
    title:
      'Decagons and pentagons of the Friday Mosque, Fatehpur Sikri (new, Tiling Search)',
    fold: 2,
    status: 'decide',
    summary:
      'Put copies of the rectangular tile side by side. A decagon sits at the centre and at each corner of every tile.',
    story: [
      'The finished design was read from Wichmann’s SM6 drawing, whose pieces are drawn edge to edge. O is the centre of a regular decagon and OA its inradius. The decagons sit at the centre and the corners of a rectangle of half-sides 2φ and 2φ tan 54° (in OA, φ the golden ratio). Every line runs parallel to a side of the decagon, and, about some decagon’s centre, passes through it, along a side or at φ from it (drawing within 0.001 of OA). The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. Colours follow the shapes: Wichmann draws the kites dark green and the rest white, with the lines as red bands. No photograph was checked.',
      '13 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/fatehpur-masjid-decagons/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/fatehpur-masjid-decagons/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Friday Mosque, Fatehpur Sikri, India (SM6)',
        url: 'https://tilingsearch.mit.edu/HTML/data206/SM6.html',
      },
    ],
  },
  {
    id: 'fatehpur-masjid-small-decagons',
    title:
      'Small decagons of the Friday Mosque, Fatehpur Sikri (new, Tiling Search)',
    fold: 2,
    status: 'decide',
    summary:
      'Put copies of the rectangular tile side by side. A decagon sits at the centre and at each corner of every tile.',
    story: [
      'The finished design was read from Wichmann’s SM28 drawing, whose pieces are drawn edge to edge. It is the design of his SM6 (Fatehpur Sikri decagons) with a smaller decagon and no ring of pentagons round it, so it shares that tutorial’s opening, outer ring and tile: O is the centre of a decagon, OA the inradius of SM6’s larger one, and the decagons sit at the centre and the corners of a rectangle of half-sides 2φ and 2φ tan 54°. Every other line matches the drawing within 0.001 of OA. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. In the drawing the small decagon’s sides are 0.6994 of OA from its centre (0.7 of SM6’s), a length no crossing of the design gives. We draw them through W, where two circles of the opening cross, at 0.6993: the pieces match the drawing within 0.0004 of OA. Colours follow the shapes, not his drawing (dark green kites, the rest white, red bands). No photograph was checked.',
      '14 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/fatehpur-masjid-small-decagons/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/fatehpur-masjid-small-decagons/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Friday Mosque, Fatehpur Sikri, India (SM28)',
        url: 'https://tilingsearch.mit.edu/HTML/data206/SM28.html',
      },
    ],
  },
  {
    id: 'salim-chishti-decagons',
    title:
      'Decagons of Salim Chishti’s tomb (Fatehpur Sikri) (new, Tiling Search)',
    fold: 2,
    status: 'decide',
    summary:
      'Put copies of the rectangular tile side by side. A decagon sits at the centre and at every corner.',
    story: [
      'The finished design was read from Wichmann’s F207 drawing, whose pieces are drawn edge to edge. The decagons sit at the centre and the corners of a rectangle whose sides are in the ratio of 1 to tan 36°. Every line is one of 25 lines about a decagon: the five lines through its centre and its corners, the lines of its ten sides, and the lines of the sides of the decagon of radius √5 about it (drawing within 0.001 of OA). The decagons at the tile’s corners get their lines by mirroring those about O. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. Colours follow the shapes; the screen itself is white marble with no colour. No photograph was checked.',
      '15 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/salim-chishti-decagons/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/salim-chishti-decagons/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Tomb of Salim Chishti, Fatehpur Sikri (F207)',
        url: 'https://tilingsearch.mit.edu/HTML/data153/F207.html',
      },
    ],
  },
  {
    id: 'mirza-akber-31-stars',
    title: 'Ten-pointed stars of Mirza Akber’s sheet 31 (new, Tiling Search)',
    fold: 2,
    status: 'decide',
    summary:
      'Put copies of the rectangular tile side by side. A ten-pointed star sits at the centre and at every corner.',
    story: [
      'The finished design was read from Wichmann’s S31A drawing, whose pieces are drawn edge to edge. Each ten-pointed star is two regular pentagons; a ring of ten regular pentagons sits on its points, and the far sides of those pentagons are the only other lines a star needs. The stars sit at the centre and the corners of a rectangle 2(2 + √5) by 2 tan 54° in units of the star’s radius (drawing within 0.0006). The stars at the tile’s corners get their lines from crossings on the tile’s top side. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. Wichmann’s drawing has two strips between its columns of stars, and only the left one is symmetric (a glide down its middle, as his pmg needs); the right strip has the same pentagons but green pieces where the left one has its crosses and octagons, and fits no symmetry. We build the left strip on both sides of every column, so the stars have both mirrors (cmm). Colours follow the shapes. No photograph was checked.',
      '14 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/mirza-akber-31-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/mirza-akber-31-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Mirza Akber, Persian decoration, sheet 31 (S31A)',
        url: 'https://tilingsearch.mit.edu/HTML/data9/S31A.html',
      },
    ],
  },
  {
    id: 'bourgoin-183-stars',
    title:
      'Ten-pointed stars and decagons of Bourgoin’s plate 183 (new, Tiling Search)',
    fold: 2,
    status: 'decide',
    summary:
      'Put copies of the rectangular tile side by side. A ten-pointed star sits at the centre and at every corner.',
    story: [
      'The finished design was read from Wichmann’s P183 drawing, whose pieces are drawn edge to edge. Each ten-pointed star is two regular pentagons. The stars stand in columns, with regular decagons between the columns. The stars sit at the centre and the corners of a rectangle 2(2 + √5) by 2 tan 54° in units of the star’s radius (drawing within 0.002), the frame of Mirza Akber’s sheet 31, whose opening this shares. Every other line is a parallel to a line of the star through a crossing of earlier lines. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. Colours follow his drawing, by shape. No photograph was checked.',
      '19 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/bourgoin-183-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/bourgoin-183-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: J. Bourgoin, Arabic Geometrical Pattern and Design, plate 183 (P183)',
        url: 'https://tilingsearch.mit.edu/HTML/data12/P183.html',
      },
    ],
  },
  {
    id: 'isfahan-imamzadeh-ismail-stars',
    title:
      'Ten-pointed stars of the Imamzadeh Ismail, Isfahan (new, Tiling Search)',
    fold: 2,
    status: 'decide',
    summary:
      'Put copies of the rectangular tile side by side. A ten-pointed star sits at the centre and at every corner.',
    story: [
      'The finished design was read from Wichmann’s SHAF10 drawing, whose pieces are drawn edge to edge. Each ten-pointed star is two regular pentagons. The stars sit at the centre and the corners of a rectangle 6φ by 2φ·tan 54° in units of the star’s radius, and the stars at the corners have other neighbours than the one at O; a pentagonal rosette of five hexagons round a pentagon sits on each side of O. Every edge is parallel to a line of the star (drawing within 0.001 of OA), and each line is drawn through a crossing of earlier lines. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. Colours follow his drawing, by shape. The original is a carved door; no photograph was checked.',
      '19 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/isfahan-imamzadeh-ismail-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/isfahan-imamzadeh-ismail-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Shrine of the Imamzadeh Ismail, Isfahan, Iran (SHAF10)',
        url: 'https://tilingsearch.mit.edu/HTML/data199/SHAF10.html',
      },
    ],
  },
  {
    id: 'mihrimah-uskudar-stars',
    title:
      'Ten-pointed stars of the Mihrimah Sultan mosque, Üsküdar (new, Tiling Search)',
    fold: 2,
    status: 'decide',
    summary:
      'Put copies of the rectangular tile side by side. A ten-pointed star sits at the centre of every tile.',
    story: [
      'The finished design was read from Wichmann’s MIR17 drawing of interlaced bands; the band centre lines give the tiling. One ten-pointed star with sharp points of 72° sits in each tile, and every other band runs parallel to one of its ten lines. With OA the distance from O to the star’s lines, the tile is a rectangle 2(7 + 3√5) by 4 tan 72°, and every offset from O is a + b√5 (drawing within 0.003 of OA, the accuracy of its bevelled bands). Each line is drawn through a crossing of earlier lines. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The bands are drawn as their centre lines. Colours follow the shapes; his drawing has one colour for every piece but the star. No photograph was checked.',
      '23 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/mihrimah-uskudar-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/mihrimah-uskudar-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Mihrimah Sultan mosque, Üsküdar, Istanbul (MIR17)',
        url: 'https://tilingsearch.mit.edu/HTML/data214/MIR17.html',
      },
    ],
  },
  {
    id: 'atik-valide-uskudar-stars',
    title:
      'Ten-pointed stars of the Atik Valide mosque, Üsküdar (new, Tiling Search)',
    fold: 2,
    status: 'decide',
    summary:
      'Put copies of the rectangular tile side by side. A ten-pointed star sits at the centre and at every corner.',
    story: [
      'The finished design was read from Wichmann’s MIR26 drawing of interlaced bands; the band centre lines give the tiling. Ten-pointed stars with sharp points of 72° sit at the centre and the corners of the tile, and the two kinds have different surroundings. Every band runs parallel to one of the star’s ten lines. With OA the distance from O to the star’s lines, the tile is a rectangle 2(11 + 5√5) by 2(11 + 5√5)/tan 72° (drawing within 0.003 of OA). Each line is drawn through a crossing of earlier lines. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The bands are drawn as their centre lines. Colours follow his drawing, by shape. No photograph was checked.',
      '22 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/atik-valide-uskudar-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/atik-valide-uskudar-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Atik Valide mosque, Üsküdar, Istanbul (MIR26)',
        url: 'https://tilingsearch.mit.edu/HTML/data216/MIR26.html',
      },
    ],
  },
  {
    id: 'alhambra-mexuar-dado-rosettes',
    title:
      'Sixteen-pointed rosettes of the Sala del Mexuar dado, Alhambra (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary:
      'Put copies of the tile side by side, corner to corner. A rosette sits at the centre of every tile, and an eight-pointed star at every corner.',
    story: [
      'The finished design was read from Wichmann’s E41 drawing of the Sala del Mexuar dado (data18), by the centre lines of its white bands. Every one of its lines is a line of the Mexuar vestibule ceiling design (data208/E41), to within 0.0004 of OA, so this tutorial shares that construction step for step. The dado inks fewer lines: the sixteen short lines that close the tiny kites round each rosette’s star are left out, so the star is larger. The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. The lines are the centre lines of the drawing’s bands. David Wade’s photograph SPA 1917 of the dado agrees with the drawing: our lines run along its white bands, and its stars at the rosettes touch the bands with no tiny kites round them. Colours follow the photograph: black petals, ochre stars, blue and green pieces.',
      '12 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/alhambra-mexuar-dado-rosettes/photo-overlay.png',
        caption:
          'David Wade’s photo with the tutorial’s lines in red (private, not shipped).',
      },
      {
        src: 'renders/alhambra-mexuar-dado-rosettes/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/alhambra-mexuar-dado-rosettes/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Sala del Mexuar, north wall dado, Alhambra, Granada (E41-data18)',
        url: 'https://tilingsearch.mit.edu/HTML/data18/E41.html',
      },
    ],
  },
  {
    id: 'camlica-mosque-stars',
    title:
      'Ten-pointed stars of the Çamlıca mosque shutter, Istanbul (new, Tiling Search)',
    fold: 1,
    status: 'decide',
    summary:
      'Put copies of the rectangular tile side by side. A ten-pointed star sits at the centre of every tile and halfway along its top and bottom sides.',
    story: [
      'The finished design was read from Wichmann’s MIR1 drawing, whose pieces are drawn edge to edge. O is the centre of a ten-pointed star whose sides are the ten lines AC, CE, … and BD, DF, …: two regular pentagons. The pattern has mirrors through the stars and half turns between them, but no half turn about a star, so it is checked by its mirror only. The repeat is a rectangle of half-sides 2 + √5 and φ/sin 36° (in OA, φ the golden ratio), with a second star on its top and bottom sides. Every line runs at an odd multiple of 18°, and every offset is (a + b√5)/20 (drawing within 0.0016 of OA). The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. Wichmann marks this drawing as his possible completion of a partial panel, a window shutter of the Çamlıca mosque; we build the completed pattern his drawing shows. His drawing of the shutter itself (MIR11, data213), a strip that repeats only along its length, lies exactly on our lines: every one of its edges is an edge of the completion. Colours follow the shapes. No photograph was checked.',
      '25 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/camlica-mosque-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/camlica-mosque-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Çamlıca mosque, Istanbul, a completed window shutter (MIR1)',
        url: 'https://tilingsearch.mit.edu/HTML/data214/MIR1.html',
      },
    ],
  },
  {
    id: 'topkapi-door-stars',
    title:
      'Ten-pointed stars of a Topkapı Palace door, Istanbul (new, Tiling Search)',
    fold: 2,
    status: 'decide',
    summary:
      'Put copies of the rectangular tile side by side. A ten-pointed star sits at the centre and at each corner of every tile.',
    story: [
      'The finished design was read from Wichmann’s TOP1 drawing, whose pieces are drawn edge to edge. O is the centre of a ten-pointed star whose sides are the ten lines AD, BE, CF and on round, and OA is the radius of its points. The repeat is a rectangle of half-sides 2√5 and 10 tan 54° (in OA), with stars at its centre and corners and on rows between. Every line runs at a multiple of 36°, and every offset is sin 36° times a + b√5 with whole numbers a and b (drawing within 0.0002 of OA). The drawing gives no steps; we devised the construction.',
      'The compass steps, their order and the named points are ours. Wichmann draws the pieces red and white; our colours keep his red pieces in the warm slots and his white ones in the light slots. No photograph was checked.',
      '21 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/topkapi-door-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/topkapi-door-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Door, Topkapı Palace, Istanbul (TOP1)',
        url: 'https://tilingsearch.mit.edu/HTML/data198/TOP1.html',
      },
    ],
  },
  {
    id: 'alcazar-six-eight-stars',
    title:
      'Six- and eight-pointed stars of the Alcázar, Seville (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary: 'Put copies of the square tile side by side.',
    story: [
      'The finished design was read from Wichmann’s CM022 drawing. The unit star and a square-root-of-three compass transfer fix the six-pointed stars and the full square repeat. The drawing gives no steps; we devised the construction.',
      'The 15 pt bands are represented by their centre lines. The palette is illustrative. No photograph was checked. The compass steps, their order and named points are ours.',
      '12 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/alcazar-six-eight-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/alcazar-six-eight-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Hall of the Ambassadors, Alcázar of Seville (CM022)',
        url: 'https://tilingsearch.mit.edu/HTML/data15/CM022.html',
      },
    ],
  },
  {
    id: 'salim-chishti-dodecagons',
    title:
      'Dodecagons of Salim Chishti’s tomb, Fatehpur Sikri (new, Tiling Search)',
    fold: 6,
    status: 'decide',
    summary: 'Put copies of the hexagonal tile side by side.',
    story: [
      'The finished design was read from Wichmann’s ASU2 drawing. The drawing gives no construction steps. The standard twelve-division opening is shared with the existing Mian rosette lesson. The pentagon boundaries and the hexagonal repeat were reconstructed from the drawing.',
      'The 12 pt bands are represented by their centre lines. The compass steps, order and named points are ours. The palette is illustrative; no photograph was checked.',
      '9 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/salim-chishti-dodecagons/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/salim-chishti-dodecagons/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Salim Chishti’s tomb, Fatehpur Sikri (ASU2)',
        url: 'https://tilingsearch.mit.edu/HTML/data216/ASU2.html',
      },
    ],
  },
  {
    id: 'turkish-sultana-mixed-stars',
    title:
      'Mixed stars of the Turkish Sultana’s House, Fatehpur Sikri (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary: 'Put copies of the square tile side by side.',
    story: [
      'The finished design was read from Wichmann’s P41 drawing. The drawing gives no steps. The twelve-division opening is shared with the Mian lesson. Compass transfers fix both eight-pointed stars, the six-pointed stars and the regular hexagons; parallels through their crossings complete the connectors.',
      'The plain polygon boundaries are retained. The compass operations, step order and named points are ours. The palette is illustrative. No building photograph was checked.',
      '28 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/turkish-sultana-mixed-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/turkish-sultana-mixed-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Turkish Sultana’s House, Fatehpur Sikri (P41)',
        url: 'https://tilingsearch.mit.edu/HTML/data186/P41.html',
      },
    ],
  },
  {
    id: 'agra-twelve-six-stars',
    title: 'Twelve- and six-pointed stars of Agra Fort (new, Tiling Search)',
    fold: 6,
    status: 'decide',
    summary: 'Put copies of the hexagonal tile side by side.',
    story: [
      'The finished design was read from Wichmann’s IND0403 drawing. The drawing gives no steps. Three squares construct the star. A parallel intercept fixes the repeat length exactly; six parallel families through existing crossings supply all remaining lines.',
      'The teaching frame turns by 15°. Black and brown bevel facets are removed, and the coloured faces expanded by 5 pt to recover the 10 pt band centre lines. The compass steps, order and named points are ours. The palette is illustrative; no fort photograph was independently checked.',
      '20 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/agra-twelve-six-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/agra-twelve-six-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Agra Fort, Agra, India (IND0403)',
        url: 'https://tilingsearch.mit.edu/HTML/data174/IND0403.html',
      },
    ],
  },
  {
    id: 'agra-twelve-six-stars-kites',
    title: 'Kite-filled twelve-pointed stars of Agra Fort (new, Tiling Search)',
    fold: 6,
    status: 'decide',
    summary: 'Put copies of the hexagonal tile side by side.',
    story: [
      'The finished design was read from Wichmann’s IND0403 drawing. The drawing gives no steps. Three squares construct the star. A parallel intercept fixes the repeat length exactly; six parallel families through existing crossings supply all remaining lines. This variation shares the complete construction with agra-twelve-six-stars. The existing lines through O divide its central star into twelve kites.',
      'The teaching frame turns by −15°. Black and brown bevel facets are removed, and the coloured faces expanded by 5 pt to recover the 10 pt band centre lines. The compass steps, order and named points are ours. The palette is illustrative; no fort photograph was independently checked.',
      '20 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/agra-twelve-six-stars-kites/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/agra-twelve-six-stars-kites/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Agra Fort, Agra, India (IND0405)',
        url: 'https://tilingsearch.mit.edu/HTML/data214/IND0405.html',
      },
    ],
  },
  {
    id: 'dhahabi-house-six-stars',
    title:
      'Six-pointed stars of the al-Dhahabi house, Cairo (new, Tiling Search)',
    fold: 6,
    status: 'decide',
    summary: 'Put copies of the hexagonal tile side by side.',
    story: [
      'The finished design was read from Wichmann’s F8785 drawing. The drawing gives no steps. The large unit star, small stars at the cell corners and three parallel families construct every boundary.',
      'The plain polygon boundaries are retained. The full repeat distinguishes large and small stars. The compass steps, order and named points are ours. The palette is illustrative; no house photograph was independently checked.',
      '15 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/dhahabi-house-six-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/dhahabi-house-six-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Jamal al-Din al-Dhahabi house, Cairo (F8785)',
        url: 'https://tilingsearch.mit.edu/HTML/data201/F8785.html',
      },
    ],
  },
  {
    id: 'mexuar-twelve-star-bands',
    title:
      'Twelve-pointed star bands of the Mexuar patio, Alhambra (new, Tiling Search)',
    fold: 6,
    status: 'decide',
    summary: 'Put copies of the hexagonal tile side by side.',
    story: [
      'The finished design was read from Wichmann’s W85 drawing. The drawing gives no steps. The unit star of three squares shares IND0403’s opening. The unit-square diagonal fixes the hexagonal repeat; these lines supply every boundary.',
      'The frame turns15°. The black faces are expanded by4.5pt to recover the9pt band centre lines. The ribbon facets are replaced by one strapwork band. The compass steps, order and named points are ours. The palette and band colour are illustrative; no monument photograph was independently checked.',
      '9 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/mexuar-twelve-star-bands/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/mexuar-twelve-star-bands/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Mexuar patio, Alhambra (W85)',
        url: 'https://tilingsearch.mit.edu/HTML/data18/W85.html',
      },
    ],
  },
  {
    id: 'sultaniyeh-twelve-star-bands',
    title:
      'Twelve-pointed star bands of Öljeitü’s mausoleum, Sultaniyeh (new, Tiling Search)',
    fold: 6,
    status: 'decide',
    summary: 'Put copies of the hexagonal tile side by side.',
    story: [
      'The finished design was read from Wichmann’s IRA2633 coloured ribbon drawing. Its band centre lines coincide with W85’s complete mesh. This filling variation shares every construction step and ink reference with mexuar-twelve-star-bands. The drawing gives no construction instructions.',
      'The source’s15pt ribbons are represented by their centre lines with the strapwork look. The grey stars, green pentagons and triangles, and black kites retain three distinct fill classes. The numeric palette and single band colour are illustrative. The frame turns15°. The compass operations, order and named points are ours. No monument photograph was independently checked.',
      '9 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/sultaniyeh-twelve-star-bands/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/sultaniyeh-twelve-star-bands/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Öljeitü’s mausoleum, Sultaniyeh (IRA2633)',
        url: 'https://tilingsearch.mit.edu/HTML/data189/IRA2633.html',
      },
    ],
  },
  {
    id: 'damascus-fountain-stars',
    title: 'Star surround of a Damascus fountain (new, Tiling Search)',
    fold: 6,
    status: 'decide',
    summary: 'Put copies of the hexagonal tile side by side.',
    story: [
      'The finished design was read from Wichmann’s DM1 drawing. The drawing gives no steps. The three-square star opening, a square diagonal, compass transfers and one midpoint fix the repeat and every parallel family.',
      'The teaching frame turns−15°. The plain source boundaries are retained. The compass steps, order and named points are ours. The palette is illustrative. No fountain photograph was independently checked.',
      '20 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/damascus-fountain-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/damascus-fountain-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Fountain surround, Damascus (DM1)',
        url: 'https://tilingsearch.mit.edu/HTML/data204/DM1.html',
      },
    ],
  },
  {
    id: 'ibn-arabi-six-stars',
    title: 'Six-pointed stars of Ibn al-Arabi’s mausoleum (new, Tiling Search)',
    fold: 6,
    status: 'decide',
    summary: 'Put copies of the hexagonal tile side by side.',
    story: [
      'The finished design was read from Wichmann’s SYR0222 drawing. The drawing gives no steps. Two triangles, diagonal intercepts and compass transfers fix every parallel family.',
      'The teaching frame turns 30°. Plain source boundaries are retained. The steps, order and named points are ours. The palette is illustrative. No monument photograph was independently checked.',
      '21 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/ibn-arabi-six-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/ibn-arabi-six-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Ibn al-Arabi mausoleum, Damascus (SYR0222)',
        url: 'https://tilingsearch.mit.edu/HTML/data197/SYR0222.html',
      },
    ],
  },
  {
    id: 'bourgoin-98-divided-stars',
    title: 'Divided stars of Bourgoin’s Plate 98 (new, Tiling Search)',
    fold: 6,
    status: 'decide',
    summary: 'Put copies of the hexagonal tile side by side.',
    story: [
      'The finished design was read from Wichmann’s A192 drawing. The drawing gives no steps. Three squares and two parallel families construct the divided stars and their connectors.',
      'Plain polygon boundaries are retained. The white strokes are outlines centred on those boundaries. The steps, order and named points are ours. The palette is illustrative. No historical photograph was checked.',
      '12 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/bourgoin-98-divided-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/bourgoin-98-divided-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Bourgoin, Plate 98, upper design (A192)',
        url: 'https://tilingsearch.mit.edu/HTML/data15/A192.html',
      },
    ],
  },
  {
    id: 'samarkand-star-knots',
    title: 'Four- and six-pointed star knots, Samarkand (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary: 'Put copies of the square tile side by side.',
    story: [
      'The finished design was read from Wichmann’s SAM1 drawing. The drawing gives no steps. A four-pointed star, two compass transfers and parallels through earlier crossings fix the mesh.',
      'The 10pt bands are represented by their centre lines. The square repeat preserves the p4g pattern’s handed arrangement round its fourfold centres. The steps, order and named points are ours. The palette is illustrative. No historical photograph was checked.',
      '18 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/samarkand-star-knots/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/samarkand-star-knots/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Samarkand, after Tony Lee’s drawing (SAM1)',
        url: 'https://tilingsearch.mit.edu/HTML/data184/SAM1.html',
      },
    ],
  },
  {
    id: 'bourgoin-106-star-lattice',
    title: 'Star lattice of Bourgoin’s Plate 106 (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary: 'Put copies of the square tile side by side.',
    story: [
      'The finished design was read from Wichmann’s P106 drawing. The drawing gives no steps. An angle bisector and a projected circle point fix the eight-pointed star. Compass transfers and four parallel families complete its square repeat.',
      'Plain polygon boundaries are retained. The steps, order and named points are ours. The palette is illustrative. No monument photograph was independently checked.',
      '18 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/bourgoin-106-star-lattice/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/bourgoin-106-star-lattice/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Bourgoin, Plate 106; examples in Cairo (P106)',
        url: 'https://tilingsearch.mit.edu/HTML/data168/P106.html',
      },
    ],
  },
  {
    id: 'bourgoin-92-twelve-stars',
    title: 'Twelve-pointed stars of Bourgoin’s Plate 92 (new, Tiling Search)',
    fold: 6,
    status: 'decide',
    summary: 'Put copies of the hexagonal tile side by side.',
    story: [
      'The finished design was read from Wichmann’s P092 drawing. The drawing gives no steps. Two turned hexagons make the twelve-pointed star. Compass transfers set the hexagonal repeat and one height; a parallel through a crossing completes the mesh.',
      'The 4pt bands are represented by their centre lines. The teaching frame turns30°. The steps, order and named points are ours. The palette is illustrative. No monument photograph was independently checked.',
      '14 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/bourgoin-92-twelve-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/bourgoin-92-twelve-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Bourgoin, Plate92; examples in Cairo (P092)',
        url: 'https://tilingsearch.mit.edu/HTML/data11/P092.html',
      },
    ],
  },
  {
    id: 'maragha-twelve-star-bands',
    title: 'Twelve-star bands of Gunbad-i Surkh, Maragha (new, Tiling Search)',
    fold: 6,
    status: 'decide',
    summary: 'Put copies of the hexagonal tile side by side.',
    story: [
      'The finished design was read from Wichmann’s CR1 drawing. The drawing gives no steps. Two turned hexagons, a diagonal intercept and a fifth-part construction fix the band centres.',
      'The 7pt ribbons are represented by their centre lines. The teaching frame turns−15°. The steps, order and named points are ours. The palette and single band colour are illustrative. The source’s two-colour weave phase is not claimed as a photograph match. No monument photograph was independently checked.',
      '18 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/maragha-twelve-star-bands/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/maragha-twelve-star-bands/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Gunbad-i Surkh, Maragha (CR1)',
        url: 'https://tilingsearch.mit.edu/HTML/data210/CR1.html',
      },
    ],
  },
  {
    id: 'qalawun-twelve-star-knots',
    title: 'Twelve-star knots of Qalawun’s mausoleum (new, Tiling Search)',
    fold: 6,
    status: 'decide',
    summary: 'Put copies of the hexagonal tile side by side.',
    story: [
      'The finished design was read from Wichmann’s DS1 drawing. The drawing gives no steps. Three squares make the twelve-pointed star. Compass transfers set the hexagonal repeat and one height; a parallel through a crossing completes the mesh.',
      'The 10pt bands are represented by their centre lines. The teaching frame turns15°. The steps, order and named points are ours. The palette is illustrative. No monument photograph was independently checked.',
      '14 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/qalawun-twelve-star-knots/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/qalawun-twelve-star-knots/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Qalawun mausoleum, Cairo (DS1)',
        url: 'https://tilingsearch.mit.edu/HTML/data184/DS1.html',
      },
    ],
  },
  {
    id: 'chester-beatty-twelve-stars',
    title:
      'Twelve-star lattice of a Chester Beatty Qur’an (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary: 'Put copies of the square tile side by side.',
    story: [
      'The finished design was read from Wichmann’s F294 drawing. The drawing gives no steps. Four triangles and six parallel families construct the stars and their connectors.',
      'The 8pt bands are represented by their centre lines. The steps, order and named points are ours. The palette is illustrative. No historical photograph was checked.',
      '16 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/chester-beatty-twelve-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/chester-beatty-twelve-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Chester Beatty Library Qur’an (F294)',
        url: 'https://tilingsearch.mit.edu/HTML/data164/F294.html',
      },
    ],
  },
  {
    id: 'el-djem-dodecagons',
    title: 'Dodecagons of a Roman mosaic, El Djem (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary: 'Put copies of the square tile side by side.',
    story: [
      'The finished design was read from Wichmann’s BON1 drawing. The drawing gives no steps. A regular dodecagon, a diagonal intercept and two parallel families construct the mesh.',
      'The 8pt green strokes are centred outlines; the original polygon boundaries are retained. The steps, order and named points are ours. The palette is illustrative. No historical photograph was checked.',
      '12 steps, intermediate.',
    ],
    pictures: [
      {
        src: 'renders/el-djem-dodecagons/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/el-djem-dodecagons/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Roman mosaic, El Djem, Tunisia (BON1)',
        url: 'https://tilingsearch.mit.edu/HTML/data209/BON1.html',
      },
    ],
  },
  {
    id: 'bourgoin-141-mixed-stars',
    title: 'Mixed stars of Bourgoin’s Plate 141 (new, Tiling Search)',
    fold: 6,
    status: 'decide',
    summary: 'Put copies of the hexagonal tile side by side.',
    story: [
      'The finished design was read from Wichmann’s P141 drawing. The drawing gives no steps. Four triangles, compass sums and a third-part construction fix the repeat and parallel families.',
      'Plain polygon boundaries are retained. The teaching frame turns15°. The steps, order and named points are ours. The palette is illustrative. No historical photograph was independently checked.',
      '17 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/bourgoin-141-mixed-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/bourgoin-141-mixed-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Bourgoin, Plate141 (P141)',
        url: 'https://tilingsearch.mit.edu/HTML/data12/P141.html',
      },
    ],
  },
  {
    id: 'bourgoin-142-star-rows',
    title: 'Star rows of Bourgoin’s Plate 142 (new, Tiling Search)',
    fold: 2,
    status: 'decide',
    summary: 'Put copies of the rectangular tile side by side.',
    story: [
      'The finished design was read from Wichmann’s P142 drawing. The drawing gives no steps. The four-triangle opening is shared with P141. Compass transfers set a rectangular repeat; parallels through earlier crossings complete its mesh.',
      'Plain polygon boundaries are retained. The teaching frame turns45°. The conventional centred rectangle contains two twelve-pointed stars. The guide families turn more often than the finished cmm pattern. The steps, order and named points are ours. The palette is illustrative. No historical photograph was independently checked.',
      '27 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/bourgoin-142-star-rows/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/bourgoin-142-star-rows/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Bourgoin, Plate142 (P142)',
        url: 'https://tilingsearch.mit.edu/HTML/data12/P142.html',
      },
    ],
  },
  {
    id: 'seville-six-eight-twelve-stars',
    title:
      'Six-, eight- and twelve-pointed stars of Seville (new, Tiling Search)',
    fold: 6,
    status: 'decide',
    summary: 'Put copies of the hexagonal tile side by side.',
    story: [
      'The finished design was read from Wichmann’s SEV2 drawing. The drawing gives no steps. The four-triangle opening is shared with F294. A quarter-part construction fixes the repeat, and circle projections fix the eight-star carriers.',
      'The 8pt bands are represented by their centre lines. The teaching frame turns30°. The steps, order and named points are ours. The palette is illustrative. No monument photograph was independently checked.',
      '15 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/seville-six-eight-twelve-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/seville-six-eight-twelve-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Reales Alcázares, Seville (SEV2)',
        url: 'https://tilingsearch.mit.edu/HTML/data18/SEV2.html',
      },
    ],
  },
  {
    id: 'bourgoin-87-chelates',
    title: 'Star chelates of Bourgoin’s Plate 87 (new, Tiling Search)',
    fold: 6,
    status: 'decide',
    summary: 'Put copies of the hexagonal tile side by side.',
    story: [
      'The finished design was read from Wichmann’s B87 drawing. The drawing gives no steps. The first eight steps are shared with P141. Three diagonal halvings and compass complements construct all further parallel families.',
      'Plain polygon boundaries are retained. The teaching frame turns15°. The steps, order and named points are ours. The palette is illustrative. No historical photograph was independently checked.',
      '21 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/bourgoin-87-chelates/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/bourgoin-87-chelates/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Bourgoin, Plate87 (B87)',
        url: 'https://tilingsearch.mit.edu/HTML/data188/B87.html',
      },
    ],
  },
  {
    id: 'fathabad-mixed-stars',
    title: 'Mixed stars of the Fathabad tile fragments (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary: 'Put copies of the square tile side by side.',
    story: [
      'The finished design was read from Wichmann’s MIR24 drawing. The drawing gives no steps. A regular-hexagon side is the unit. Compass transfers set the three-square star and the repeat; corner-star and parallel families complete the mesh.',
      'The 6pt bands are represented by their centre lines. The steps, order and named points are ours. The palette is illustrative. No fragment photograph was independently checked.',
      '24 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/fathabad-mixed-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/fathabad-mixed-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Fathabad, Bukhara; Hamburg museum fragments (MIR24)',
        url: 'https://tilingsearch.mit.edu/HTML/data216/MIR24.html',
      },
    ],
  },
  {
    id: 'qawsun-quran-stars',
    title: 'Stars of a Qur’an page from Qawsun mosque (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary: 'Put copies of the square tile side by side.',
    story: [
      'The finished design was read from Wichmann’s DA1 drawing. The drawing gives no steps. Three squares, a third-part construction and parallels through crossings fix the square mesh.',
      'Plain polygon boundaries are retained. The teaching frame turns45° onto the actual square slides. The steps, order and named points are ours. The palette is illustrative. No manuscript photograph was independently checked.',
      '21 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/qawsun-quran-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/qawsun-quran-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Qawsun mosque Qur’an, after Prisse d’Avennes (DA1)',
        url: 'https://tilingsearch.mit.edu/HTML/data187/DA1.html',
      },
    ],
  },
  {
    id: 'museum-divided-stars',
    title:
      'Divided stars of the Turkish and Islamic Arts Museum (new, Tiling Search)',
    fold: 6,
    status: 'decide',
    summary: 'Put copies of the hexagonal tile side by side.',
    story: [
      'The finished design was read from Wichmann’s TAI1 drawing. The drawing gives no steps. The three-square opening is shared with the Agra star lesson. A third-part construction and compass sum set the repeat; parallels through crossings complete the divided stars.',
      'Grey bevel facets are removed and the20pt bands represented by their centre lines. The teaching frame turns15°. The steps, order and named points are ours. The palette is illustrative. No monument photograph was independently checked.',
      '19 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/museum-divided-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/museum-divided-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Minbar balustrade, Turkish and Islamic Arts Museum, Istanbul (TAI1)',
        url: 'https://tilingsearch.mit.edu/HTML/data193/TAI1.html',
      },
    ],
  },
  {
    id: 'otrush-star-chelates',
    title: 'Star chelates of al-Otrush mosque, Aleppo (new, Tiling Search)',
    fold: 6,
    status: 'decide',
    summary: 'Put copies of the hexagonal tile side by side.',
    story: [
      'The finished design was read from Wichmann’s AJL8 drawing. The drawing gives no steps. The first six steps share the Qawsun three-square opening. A third, compass sum and four diagonal halvings set the repeat and carrier distances.',
      'Grey bevel facets are removed and the5pt bands represented by their centre lines. The steps, order and named points are ours. The palette is illustrative. No monument photograph was independently checked.',
      '23 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/otrush-star-chelates/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/otrush-star-chelates/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Al-Otrush mosque, Aleppo, Syria (AJL8)',
        url: 'https://tilingsearch.mit.edu/HTML/data198/AJL8.html',
      },
    ],
  },
  {
    id: 'barsbay-twelve-star-doors',
    title: 'Twelve-star doors of Sultan Barsbay, Cairo (new, Tiling Search)',
    fold: 2,
    status: 'decide',
    summary: 'Put copies of the rectangular tile side by side.',
    story: [
      'The finished design was read from Wichmann’s EGY1030 drawing. The drawing gives no steps. The first six steps share the Chester Beatty four-triangle opening. Compass sums construct the centred rectangle, small radius and corner diagonals; parallels through crossings complete the mesh.',
      'Grey bevel facets are removed and the8pt bands represented by their centre lines. Guide families turn more often than the finished cmm pattern. The steps, order and named points are ours. The palette is illustrative. No monument photograph was independently checked.',
      '28 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/barsbay-twelve-star-doors/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/barsbay-twelve-star-doors/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Al-Ashraf Barsbay, Cairo, Egypt (EGY1030)',
        url: 'https://tilingsearch.mit.edu/HTML/data180/EGY1030.html',
      },
    ],
  },
  {
    id: 'ismail-shrine-divided-stars',
    title: 'Divided stars of Imamzadeh Ismail, Isfahan (new, Tiling Search)',
    fold: 2,
    status: 'decide',
    summary: 'Put copies of the diamond tile side by side.',
    story: [
      'The finished design was read from Wichmann’s SHAF18 drawing. The drawing gives no steps. The first nine construction operations share the P142 opening. Compass sums set the diamond repeat; parallels through crossings complete the divided stars.',
      'Grey bevel facets below0.6 are removed; the pale-grey kites are retained. The10pt bands are represented by their centre lines. Guide families turn more often than the finished pattern. The steps, order and named points are ours. The palette is illustrative. No monument photograph was independently checked.',
      '41 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/ismail-shrine-divided-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/ismail-shrine-divided-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Imamzadeh Ismail shrine, Isfahan, Iran (SHAF18)',
        url: 'https://tilingsearch.mit.edu/HTML/data200/SHAF18.html',
      },
    ],
  },
  {
    id: 'shah-mosque-chiral-grille',
    title:
      'Chiral divided stars of the Shah Mosque grille (new, Tiling Search)',
    fold: 6,
    status: 'decide',
    summary: 'Put copies of the hexagonal tile side by side.',
    story: [
      'The finished design was read from Wichmann’s F38 drawing. The drawing gives no steps. The shared three-square opening locates a unit kite edge. A fifth and twentieth of it set two connector lengths. Parallels and one further compass transfer locate the chiral mesh and its angled hexagonal repeat.',
      'Plain source boundaries are retained. The independent edge lengths use6/5 and29/20 of the unit kite edge, matching the rounded source vertices. The steps, order and named points are ours. Colours retain the diagram’s classes and are illustrative; the source states that the wooden original has no colour. No monument photograph was independently checked.',
      '36 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/shah-mosque-chiral-grille/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/shah-mosque-chiral-grille/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Shah Mosque, Isfahan, Iran (F38)',
        url: 'https://tilingsearch.mit.edu/HTML/data153/F38.html',
      },
    ],
  },
  {
    id: 'chehel-sotoun-divided-stars',
    title: 'Divided stars of Chehel Sotoun, Isfahan (new, Tiling Search)',
    fold: 2,
    status: 'decide',
    summary: 'Put copies of the diamond tile side by side.',
    story: [
      'The finished design was read from Wichmann’s OR1 drawing. The drawing gives no steps. The complete construction is shared with the Ismail shrine tutorial. Turning the source frame by90° gives the same mesh and kite proportions.',
      'Brown bevel facets are removed. The7pt bands are represented by their centre lines. The steps, order and named points are ours. The colours retain the diagram’s classes and are illustrative. The olive six-stars use a two-by-two colour repeat, larger than the geometric repeat. The olive six-stars use a two-by-two colour repeat, larger than the geometric repeat. The olive six-stars use a two-by-two colour repeat, larger than the geometric repeat. No monument photograph was independently checked.',
      '41 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/chehel-sotoun-divided-stars/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/chehel-sotoun-divided-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Chehel Sotoun Palace, Isfahan, Iran (OR1)',
        url: 'https://tilingsearch.mit.edu/HTML/data213/OR1.html',
      },
    ],
  },
  {
    id: 'rabat-mixed-star-rosette',
    title: 'Mixed-star rosette from Rabat (new, Tiling Search)',
    fold: 4,
    status: 'decide',
    summary: 'Put copies of the square tile side by side.',
    story: [
      'The finished design was read from Wichmann’s MOR1118 drawing. The drawing gives no steps. The first six steps share the Chester Beatty four-triangle opening. Compass sums and diagonal halvings locate the rosette and mixed-star mesh.',
      'The6pt bands are represented by their centre lines. The square half-side is(3+5√2+√6)/2 of the twelve-star radius. The half inner-star edge sets the smaller stars. Extra guide turns do not assert extra symmetry of the finished ink. The steps, order and named points are ours. The palette is illustrative. No monument photograph was independently checked.',
      '49 steps, advanced.',
    ],
    pictures: [
      {
        src: 'renders/rabat-mixed-star-rosette/drawing-overlay.png',
        caption: 'Wichmann’s drawing with the tutorial’s lines in red.',
      },
      {
        src: 'renders/rabat-mixed-star-rosette/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Mosque, Rabat, Morocco (MOR1118)',
        url: 'https://tilingsearch.mit.edu/HTML/data190/MOR1118.html',
      },
    ],
  },
  {
    id: 'alhambra-arrayanes-squares',
    title: 'Squares and stars of the Patio de los Arrayanes (new)',
    fold: 4,
    status: 'verified',
    summary:
      'A simple dado: large squares set in white bands, with a small eight-pointed star where the bands cross. A beginner design.',
    story: [
      'Brian Wichmann draws this dado with larger squares than the real one. Over David Wade’s photo, the real squares are each inscribed in a circle of radius OA about a corner of the cell, and every white band tile ends in a point, its seams running along the diagonals from a square’s corner to the star’s point. So the tutorial follows the photo, and keeps Wichmann’s star, whose size matches.',
      'Over the photo, our outlines follow every square, star and seam (picture).',
    ],
    pictures: [
      {
        src: 'renders/alhambra-arrayanes-squares/photo-overlay.png',
        caption:
          'Left: the dado. Right: the same with the tutorial’s outlines in red.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Alhambra, Patio de los Arrayanes (PG299)',
        url: 'https://tilingsearch.mit.edu/HTML/data8/PG299.html',
      },
      {
        label: 'David Wade, Pattern in Islamic Art (photo SPA 0111)',
        url: 'https://patterninislamicart.com/',
      },
    ],
  },
  {
    id: 'alhambra-leones-fret',
    title: 'Pinwheel fret of the Patio de los Leones (new)',
    fold: 4,
    status: 'verified',
    summary:
      'Eight-pointed stars with fret bands hooking round them like a pinwheel: it turns into itself by a quarter turn but has no mirror.',
    story: [
      'The frets run along the diagonals of a square grid, and the stars are two squares each. One line sets the stars’ size: from the point where the diagonal crosses the circle, through the middle of the radius above O, to the other diagonal. Brian Wichmann’s drawing gave the design; the tutorial takes nine steps.',
      'Over David Wade’s photo of the carved panel, every line of the tutorial lies on a carved groove, and the frets turn the same way (picture).',
    ],
    pictures: [
      {
        src: 'renders/alhambra-leones-fret/photo-overlay.png',
        caption:
          'Left: the carved panel. Right: the same with the tutorial’s lines in red.',
      },
      {
        src: 'renders/alhambra-leones-fret/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Alhambra, Patio de los Leones (C55)',
        url: 'https://tilingsearch.mit.edu/HTML/data18/C55.html',
      },
      {
        label: 'David Wade, Pattern in Islamic Art (photo SPA 0218)',
        url: 'https://patterninislamicart.com/',
      },
    ],
  },
  {
    id: 'alhambra-barca-stars',
    title: 'Interlaced stars of the Sala de la Barca (new)',
    fold: 4,
    status: 'verified',
    summary:
      'A second design from the Comares bath construction: the same large stars, with a small square instead of the small star, and the bands interlaced between them.',
    story: [
      'Brian Wichmann’s drawing of this Sala de la Barca panel turned out to use every line of the Comares bath stars, plus four lines through the middles of the small square’s sides. So the tutorial is the bath construction with one more step, inked differently: a family of two designs from one construction.',
      'David Wade’s photo of the panel matches: our lines run down the middle of its white bands (picture).',
    ],
    pictures: [
      {
        src: 'renders/alhambra-barca-stars/photo-overlay.png',
        caption:
          'Left: the panel. Right: the same with the tutorial’s lines in red.',
      },
      {
        src: 'renders/alhambra-barca-stars/wall.png',
        caption: 'Our wall.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Alhambra, Sala de la Barca (CM052)',
        url: 'https://tilingsearch.mit.edu/HTML/data15/CM052.html',
      },
      {
        label: 'David Wade, Pattern in Islamic Art (photo SPA 1624x)',
        url: 'https://patterninislamicart.com/',
      },
    ],
  },
  {
    id: 'alhambra-reyes-stars',
    title: 'Stars, octagons and crosses of the Sala de los Reyes (new)',
    fold: 4,
    status: 'verified',
    summary:
      'A zellige of the Sala de los Reyes: the same eight-pointed star round every point of a square grid, with octagons and crosses alternating at the centres.',
    story: [
      'Each motif is one star: a circle divided into eight, every point joined to the one three places round, and the octagon round it. Octagons and four-armed crosses alternate at the centres like a chessboard. The crosses’ notches are found with the compass: open it to a side of the octagon, put it on the star’s point and mark inwards. The tutorial takes eleven steps; Brian Wichmann’s drawing gave the design.',
      'David Wade’s photo of the panel matches piece for piece (picture). As on the panel, the kites round the crosses are dark and those round the octagons pale. Near the top of the panel two rows repeat instead of alternating, probably a repair.',
    ],
    pictures: [
      {
        src: 'renders/alhambra-reyes-stars/photo-overlay.png',
        caption:
          'Left: the panel. Right: the same with the tutorial’s outlines in red.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Alhambra, Sala de los Reyes (M060)',
        url: 'https://tilingsearch.mit.edu/HTML/data9/M060.html',
      },
      {
        label: 'David Wade, Pattern in Islamic Art (photo SPA 0408x)',
        url: 'https://patterninislamicart.com/',
      },
    ],
  },
  {
    id: 'alhambra-comares-dado',
    title: 'Octagons and hexagons of the Comares dado (new)',
    fold: 4,
    status: 'verified',
    summary:
      'The tiled dado of the Salón de Comares: white octagons, honey-coloured long hexagons, and a cross of five small squares where four cells meet.',
    story: [
      'Brian Wichmann drew this dado exactly, and David Wade photographed it. All its edges run at 0°, 45° or 90°, and one length sets them all: half the diagonal of the small square at each corner. One line gives it: from a corner of the cell through the point where the diagonal crosses the circle, to the opposite side. The tutorial takes nine steps.',
      'The red lines in the picture are the tutorial’s outlines over Wade’s photo; each tile of the dado sits in one of them. As on the dado, the middle square of each cross is white and the four round it black.',
    ],
    pictures: [
      {
        src: 'renders/alhambra-comares-dado/photo-overlay.png',
        caption:
          'Left: the dado. Right: the same with the tutorial’s outlines in red.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Brian Wichmann, Tiling Search: Alhambra, Salón de Comares (J43A)',
        url: 'https://tilingsearch.mit.edu/HTML/data5/J43A.html',
      },
      {
        label: 'David Wade, Pattern in Islamic Art (photo SPA 0204)',
        url: 'https://patterninislamicart.com/',
      },
    ],
  },
  {
    id: 'alhambra-bath-stars',
    title: 'Interlaced stars of the Comares bath (new)',
    fold: 4,
    status: 'verified',
    summary:
      'An Alhambra design from the Comares bath: large and small eight-pointed stars with interlaced bands between them.',
    story: [
      'Brian Wichmann’s Tiling Search has an exact drawing of this design. Every band turned out to be a side of one of two stars, each made of two squares, carried on until it meets the next star. Two crossings fix the stars’ sizes: the line from a corner of the cell to the bottom of the circle crosses the 22.5° line exactly above the large star’s point, and the small star’s circle runs through the point on the cell side level with the large star’s top. The tutorial builds it that way in eleven steps.',
      'David Wade photographed a carved wooden panel with the same design. Our lines run along the middle of its bands (picture).',
    ],
    pictures: [
      {
        src: 'renders/alhambra-bath-stars/photo-overlay.png',
        caption:
          'Left: the carved panel. Right: the same with the tutorial’s lines in red.',
      },
      { src: 'renders/alhambra-bath-stars/wall.png', caption: 'Our wall.' },
    ],
    asks: [],
    sources: [
      {
        label: 'Brian Wichmann, Tiling Search: Alhambra, Baño Real (AL01)',
        url: 'https://tilingsearch.mit.edu/HTML/data182/AL01.html',
      },
      {
        label: 'David Wade, Pattern in Islamic Art (photo MOR 0711)',
        url: 'https://patterninislamicart.com/',
      },
    ],
  },
  {
    id: 'design-h2',
    title: 'Design H2: minbar doors from Cairo (new)',
    fold: 12,
    status: 'verified',
    summary:
      'A pair of carved minbar doors from Cairo, about 1325–30, now in the Metropolitan Museum. Twelve-pointed rosettes on a hexagonal repeat.',
    story: [
      'The rosette is Samira Mian’s first rosette, the one in her square and hexagonal tiles, but the doors ink it differently: a small star ringed by twelve kites, then twelve shields. Each shield runs from a star point to the kites’ tips, out along the 15° lines, and ends flat on a line that touches the circle at one of its twelve points. Between every three rosettes this leaves a triangle.',
      'The small five-pointed stars of the doors sit where five bands meet, at the corners of those triangles, so they are inlays at crossings rather than pieces, like the tiny arrows of the al-Maridani minbar. The first picture shows the doors with our lines over them; the second shows the triangle between three rosettes.',
    ],
    pictures: [
      {
        src: 'renders/minbar-doors-cairo/photo-overlay.png',
        caption:
          'Left: the doors, straightened. Right: the same with the tutorial’s lines in red. Each carved piece sits inside one of our pieces, half a band in from its edges.',
      },
      {
        src: 'renders/minbar-doors-cairo/photo-gap.png',
        caption:
          'Between three rosettes: the triangle, with a five-pointed star inlaid at each corner.',
      },
      { src: 'renders/minbar-doors-cairo/wall.png', caption: 'Our wall.' },
    ],
    asks: [],
    sources: [
      {
        label:
          'The Met: Pair of Minbar Doors, Egypt, ca. 1325–30 (public-domain photo)',
        url: 'https://www.metmuseum.org/art/collection/search/444812',
      },
      {
        label: 'Samira Mian: Twelvefold Islamic Geometric Rosette',
        url: 'https://www.samiramian.uk/twelvefoldrosette',
      },
    ],
  },
  {
    id: 'design-h1',
    title: 'Design H1: the al-Maridani minbar is already in the library',
    fold: 4,
    status: 'verified',
    summary:
      'The carved woodwork of the al-Maridani minbar in Cairo (1340) is exactly Samira Mian’s stellated rosettes, the tutorial you already approved.',
    story: [
      'I measured every carved inlay on the photo. Each one is framed by bands of the same width, so its edges show where the pattern lines run. Every line found is one of her construction lines: the two hexagons in the circle, her star lines, and the small hexagons and corner piece. The red lines in the first picture are her tutorial’s ink, laid over the photo, and every inlay sits in one of its pieces.',
      'A second minbar has the same design: the one in the mosque of al-Nasir Muhammad in the Citadel, twenty years older (third picture). Its inlays sit in the same pieces.',
      'One place needed a close look (A in the second picture). At the tip of each small kite, the band runs straight on to the tiny white arrow, with no line across it, just as in her drawing. So nothing in her tutorial changes. It now credits the minbar photo too, its title names the minbar, and its status is verified.',
    ],
    pictures: [
      {
        src: 'renders/mian-stellated-rosettes/photo-overlay.png',
        caption:
          'Left: one tile of the minbar, averaged from the photo. Right: the same with her tutorial’s lines in red.',
      },
      {
        src: 'renders/mian-stellated-rosettes/photo-kite-tip.png',
        caption:
          'A: at a kite tip the band runs on unbroken to the tiny white arrow, so no line crosses there.',
      },
      {
        src: 'renders/mian-stellated-rosettes/nasir-overlay.png',
        caption:
          'A second minbar with the same design: al-Nasir Muhammad’s, in the Citadel (1318–35), with the same lines over it.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Photo: al-Maridani minbar, Cairo, lantern slide (Wikimedia Commons)',
        url: 'https://commons.wikimedia.org/wiki/File:Ca%C3%AFro._Amir_al-Maridani-moskee_Minbar_Detail_van_het_houten_maaswerk,_GDE002950.jpg',
      },
      {
        label:
          'Samira Mian: Twelvefold Islamic Geometric Rosette (activity 8 video)',
        url: 'https://www.samiramian.uk/twelvefoldrosette',
      },
    ],
  },
  {
    id: 'mian-stellated-rosettes',
    title: 'Stellated twelve-fold rosettes, Samira Mian (new)',
    fold: 4,
    status: 'decided',
    decision:
      'You: close, but 12 of the small six-cornered kites per tile, not 4, and no 16-cornered ground piece. Fixed: the rosette ring is now twelve-fold out to its circle, which gives 12 kites and splits the 16-cornered piece; the slivers at the star tips are gone too (8 piece shapes, none thin).',
    summary:
      'Her activity 8: twelve-fold rosettes in square cells, with four hexagons and an octagon at every corner.',
    story: [
      'Built from your screenshots of her video, step by step and credited to her. Her rosette is her first rosette scaled into the cell: the twelve lines joining circle points 60° apart, a circle through their crossings, the inner circle from one chord, and the star lines; together they explain 98% of the ink in her rosette stage. At each corner, the 60° line from O crossing the cell side gives a hexagon’s centre, a small circle gives its inner corner, and the two missing sides carried to the diagonal close the octagon, as she shows.',
      'The rosette’s ink was read from her screenshot; the hexagons and octagon are drawn exactly from her steps. Two tiny slivers remain near the star tips (marked small).',
    ],
    pictures: [
      {
        src: 'renders/mian-stellated/wall-compare.png',
        caption: 'Left: our wall. Right: her finished drawing.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Samira Mian: Twelvefold Islamic Geometric Rosette (activity 8 video)',
        url: 'https://www.samiramian.uk/twelvefoldrosette',
      },
    ],
  },
  {
    id: 'bou-inania-v2',
    title: 'Bou Inania rosette, her way',
    fold: 12,
    status: 'decided',
    decision:
      'You: an eight-pointed star at each corner with the same piece all round it, no little triangles. Done (first picture). /#/bou-inania-rosette',
    summary:
      'Built her way in 14 steps, with the tile copies overlapping by one band. Each corner now has an eight-pointed star with four identical pieces round it.',
    story: [
      'Your note: the corner piece was an incomplete star, two small triangles sat beside it, and two different pieces surrounded it. Now one step draws the star at each corner (its square, plus a diamond found with the compass), the diamond’s sides run on to make the pointed ends of the long hexagons, and the four pieces between the hexagons are the same shape.',
      'Earlier note, still fixed: the long hexagons are separate from the pieces beside them.',
    ],
    pictures: [
      {
        src: 'renders/bou-inania-v2/corner-star.png',
        caption:
          'The corner of the wall, before and now: grey star, four purple pieces round it, green long hexagons.',
      },
      {
        src: 'renders/bou-inania-v2/wall-now.png',
        caption: 'The wall now.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Samira Mian: Twelvefold Islamic Geometric Rosette',
        url: 'https://www.samiramian.uk/twelvefoldrosette',
      },
      {
        label:
          'Clear drawing of the pattern by @aslam.geometricpatterns (saved by you)',
        url: 'https://www.instagram.com/aslam.geometricpatterns/',
      },
      {
        label: 'Photo: Bou Inania madrasa zellige (Wikimedia Commons)',
        url: 'https://commons.wikimedia.org/wiki/File:Bou_inania_DSCF2978.jpg',
      },
      {
        label:
          'Ouazene, Benslimane et al.: Varieties of 12-fold rosettes in Moroccan geometric ornament (J. Appl. Cryst. 2019, paywalled)',
        url: 'https://doi.org/10.1107/S1600576719004928',
      },
    ],
  },
  {
    id: 'twelve-fold-rosette-mian',
    title: 'Twelve-fold rosette: Samira Mian’s construction (new)',
    fold: 12,
    status: 'decided',
    decision:
      'You: keep A (B removed). Fixed as you pointed out: the base of the white triangles is no longer inked, and the outline lines run on to the tile edge, so the repeat closes the shapes between rosettes as in her square and hexagonal tiles. Both tiles are now in the library.',
    summary:
      'Twelve petals round a twelve-pointed star, with the outline lines carried on into the neighbouring tiles; a square tile and a hexagonal one.',
    story: [
      'I measured her tiles: every line she inks is in ours, and every line we ink is in hers (first picture). Square: 11 steps, seven piece shapes. Hexagon: 11 steps, five piece shapes. The thin white bow between rosettes is marked small, since it is part of her design.',
    ],
    pictures: [
      {
        src: 'renders/twelve-fold-rosette-mian/compare-tiles.png',
        caption: 'Her tiles and ours, side by side.',
      },
      {
        src: 'renders/twelve-fold-rosette-mian/wall.png',
        caption: 'The square-tile wall.',
      },
      {
        src: 'renders/twelve-fold-rosette-mian-hex/wall.png',
        caption: 'The hexagonal-tile wall.',
      },
    ],
    asks: [
      'A look at both in the player: /#/twelve-fold-rosette-mian and /#/twelve-fold-rosette-mian-hex.',
    ],
    sources: [
      {
        label: 'Samira Mian: Twelvefold Islamic Geometric Rosette',
        url: 'https://www.samiramian.uk/twelvefoldrosette',
      },
    ],
  },
  {
    id: 'bou-inania-twelve-fold-wall',
    title: 'Design E: Bou Inania twelve-fold wall (rebuilt)',
    fold: 12,
    status: 'decided',
    decision:
      'You: faithful, her way. Done: the rosette is now drawn as fifteen sets of twelve lines (thirteen that carry its edges and two helpers), each set through a corner already on the paper and touching one circle about O. 21 steps instead of 25, no copied points, and the same wall as before (same pieces, so the golden test is unchanged).',
    summary:
      'The zellige wall of the Bou Inania madrasa in Fès: twelve-fold rosettes on a square grid, eight-pointed stars in orange rings at the corners, black bands along the grid lines meeting in an X.',
    story: [
      'Built as you asked: my best guess from the photo, by extending lines and choosing their crossings. No published drawing of this wall exists that I could find, so it is marked unverified until you judge it.',
      'How: I straightened the photo, averaged every rosette, corner and edge into one sharp tile, traced its white bands, and fitted a ruler-and-compass drawing to them. Every line of the rosette runs at a multiple of 15°; the whole rosette follows from two crossings tied to the tile. The fit is within about a seventh of a band’s width of the photo (second picture: our lines in red over the averaged photo).',
      'The tutorial has 25 steps and 15 piece shapes. Choose the Strapwork style on the color stage to see it most like the real wall (first picture). Known differences: the real corner stars have more pieces inside their ring, and the small white pieces at the rim are simplified.',
    ],
    pictures: [
      {
        src: 'renders/bou-inania-twelve-fold-wall/compare-wall.png',
        caption:
          'Left: the real wall. Right: Design E in the player, Strapwork style.',
      },
      {
        src: 'renders/bou-inania-twelve-fold-wall/overlay-photo.png',
        caption: 'Our ink (red) over the photo averaged into one sharp tile.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Wikimedia Commons: Bou Inania zellige photo',
        url: 'https://commons.wikimedia.org/wiki/File:Bou_inania_DSCF2978.jpg',
      },
    ],
  },
  {
    id: 'alhambra-star-and-arrows',
    title: 'Alhambra star and arrows',
    fold: 8,
    status: 'decided',
    decision:
      'You: keep the guessed square repeat, and try rows shifted by half a rosette. Done: the shifted version is in the library as “Alhambra star and arrows, shifted rows”. As you suggested, its rows sit as close as they can (√2 apart instead of 2), and the gaps then close into chevrons with no extra band. Your photo’s design B could not be identified beyond the product page; it stays on my list.',
    summary:
      'An eight-pointed star whose points become arrows, framed by two squares, from a painted ceiling in the Alhambra.',
    story: [
      'I rebuilt this from Mamoot’s eight-step tutorial, and every inked line lands exactly on the source’s final drawing (first picture: our lines in red over theirs in black).',
      'The problem is the repeat. The app needs a tile that repeats to make a wall, but the only photo shows a single rosette on a ceiling, sitting inside a larger network of bands that one photo is not enough to reconstruct. The source itself says the rosette “doesn’t produce a very interesting tessellation”. The only repeat I could make is my own: rosettes on a square grid, touching at their outer points, with a large plain area between them (third picture). That repeat is not attested anywhere I could find.',
      'Overnight I hid it from the app because I could not verify it. It is back in the library now so you can try it.',
      'Update: you sent two photos of an “Alhambra mosaic” from marocarchitecture.com. They are real repeating patterns, but a different one: there, each small eight-pointed star is ringed by eight short pentagons with interlaced bands between, while our rosette has eight long blades and arrows framed by two squares (comparison below). So they do not verify this rosette’s repeat, but they would make a good tutorial of their own.',
    ],
    pictures: [
      {
        src: 'renders/alhambra-star-and-arrows/overlay-ink.png',
        caption:
          'Our ink (red) drawn over the source’s final drawing (black). They coincide everywhere.',
      },
      {
        src: 'research/alhambra-star-and-arrows/photo-alhambra-ceiling.png',
        caption:
          'The real rosette on an Alhambra ceiling (photo from the source page). Note the bands carrying on beyond it.',
      },
      {
        src: 'renders/alhambra-star-and-arrows/wall.png',
        caption:
          'My guessed repeat: rosettes touching tip to tip on a square grid. This part is invented.',
      },
      {
        src: 'renders/alhambra-star-and-arrows/tried-octagon-family.png',
        caption:
          'Your photo (left) against the octagon-and-square family at four angles. Its stars are thin and spiky; yours are fat two-square stars, so this is not it.',
      },
      {
        src: 'renders/alhambra-star-and-arrows/compare-maroc.png',
        caption:
          'Left: your marocarchitecture.com photo (close-up). Right: our rosette. The ring around the centre star differs: pentagons there, blades here.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Mamoot: “A Rosette Tile from the Alhambra” (the steps I followed)',
        url: `${MAMOOT}/2021/02/01/islamic-geometry-rosette-tile-from-the-alhambra/`,
      },
      {
        label: 'marocarchitecture.com: “Alhambra mosaic 1690” (your photos)',
        url: 'https://marocarchitecture.com/products/alhambra-mosaic-1690-12-pointed-star-with-laces',
      },
      {
        label: 'Mamoot: “Four-Fold Model” (the starting construction)',
        url: `${MAMOOT}/2020/12/26/islamic-geometry-four-fold-model/`,
      },
    ],
  },
  {
    id: 'four-fold-ring-of-circles',
    title: 'Four-fold ring of circles',
    fold: 4,
    status: 'decided',
    decision:
      'You: ship it with credit, and split steps 9–11. I agree on credit: the step text is ours, the construction is credited in the app, and if she objects it can be removed. Done: the old steps 9–11 are now six steps, one for each direction of line, then two steps that only fade in the turning points of the pattern (they are marks, not drawing). Removing those mark steps entirely needs a small format change, which I have noted for later.',
    summary:
      'A square pattern of eight-pointed stars and crossed bands, built from a ring of small circles each divided by two squares.',
    story: [
      'This comes from Sandy Kurt’s free “4fold Pattern Tutorial”. The construction is a ring of eight small circles around a ninth, each holding a lying and a standing square whose sides run right across the tile. I generated the tutorial with a script, because the pattern has 40 lines and 220 inked segments, and the ink matches her final drawing exactly (first picture).',
      'Two things stop me shipping it on my own judgement. First, Kurt does not say which building the pattern comes from, and the Mughal stone screen I hoped was the same one is not (third picture: its big stars sit among smaller octagons, while ours has equal stars everywhere). Second, her PDF says “All rights reserved”. Our step text is our own and the steps are grouped differently, with credit to her, but the sequence closely follows hers.',
      'Because the pattern was generated, the later steps mark many points at once (step 9 marks 80, step 11 marks 360). It plays, but those steps are heavy for a learner.',
    ],
    pictures: [
      {
        src: 'renders/four-fold-ring-of-circles/overlay-ink.png',
        caption:
          'Our ink (red) over Sandy Kurt’s final drawing (black): an exact match.',
      },
      {
        src: 'renders/four-fold-ring-of-circles/wall.png',
        caption: 'Our wall, coloured by piece.',
      },
      {
        src: 'research/four-fold-model/photo-sikandra-jali.jpg',
        caption:
          'A Mughal stone screen (Sikandra) that looked similar but is a different pattern.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Sandy Kurt: free tutorials page (“4fold pattern” PDF)',
        url: 'https://sandykurt.com/free-tutorials',
      },
    ],
  },
  {
    id: 'twelve-fold-dodecagrams',
    title: 'Twelve-pointed stars',
    fold: 12,
    status: 'decided',
    decision:
      'You: keep it as a beginner design, and make more advanced designs from it. Agreed: the same twelve-pointed stars can be joined differently (every fourth or fifth point instead of every second), carried into interlaced bands, or set further apart with new shapes between them. Those are on my list.',
    summary:
      'Two six-pointed stars in every circle of a hexagonal grid, making twelve-pointed stars that touch point to point.',
    story: [
      'This follows the “Dodecagram pattern” in Envato Tuts+’s “Working With 6 and 12”. I measured the source drawing to get the proportions right, and our seven stars lie exactly on its final picture (first picture).',
      'I found no photo of this exact pattern on a real building. Twelve-pointed stars are common (Ibn Tulun and Mamluk window grilles, for example), but drawn differently. It is a simple, pleasant beginner pattern, which is why I would like your opinion rather than dropping it.',
    ],
    pictures: [
      {
        src: 'renders/twelve-fold-dodecagrams/overlay.png',
        caption:
          'Left: the source’s final drawing. Right: our stars in red over it. They coincide.',
      },
      {
        src: 'renders/twelve-fold-dodecagrams/wall.png',
        caption: 'Our wall, coloured by piece.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Envato Tuts+: “Geometric Design: Working With 6 and 12”',
        url: 'https://design.tutsplus.com/tutorials/geometric-design-working-with-6-and-12--cms-22872',
      },
    ],
  },
  {
    id: 'kurt-eight-fold-zellige',
    title: 'Eight-fold zellige wheel (Design C, new)',
    fold: 8,
    status: 'decided',
    decision:
      'You: shift the rows as in the Alhambra star. Agreed and done: “Eight-fold zellige wheel, shifted rows” is in the library. With a half-wheel shift the rows come down from 2 apart to 2√2 − 1 (the height is drawn with one circle), the wheels nest and each touches four neighbours corner to corner (first picture). The square version stays too.',
    summary:
      'Sandy Kurt’s eight-fold zellige wheel: octagons, bands and a star in the middle, built with her nineteen steps.',
    story: [
      'Built as you asked (keep both C and D). Her drawings showed that two values in our old notes were guessed wrong; with the right values, every line of her finished drawing lies on her construction, and our ink matches it (first picture, ours in red).',
      'Her tutorial shows one wheel, not a wall. The wheel’s large octagons reach exactly to the edge of a 2 × 2 square, so I repeat it on that square (second picture). That repeat is mine, not hers.',
      'The wheel is very fine, so two pieces are small by our rules: the orange kites inside the large octagons, and the thin blue star where wheels meet. Our test now accepts small pieces only when a tutorial names them as small on purpose.',
    ],
    pictures: [
      {
        src: 'renders/kurt-eight-fold-zellige/design-C.png',
        caption:
          'Left: our ink (red) over Kurt’s finished drawing. Right: the wheel repeated on a 2 × 2 square.',
      },
      {
        src: 'renders/kurt-eight-fold-zellige/step-12.png',
        caption:
          'One of the steps: the circles around the ring centres cut the new lines, and the vertical bands are ruled through those points.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Sandy Kurt: free tutorials page (“8fold zellige” PDF)',
        url: 'https://sandykurt.com/free-tutorials',
      },
    ],
  },
  {
    id: 'kurt-eight-fold-zellige-filled',
    title: 'Eight-fold zellige wheel, filled (new)',
    fold: 4,
    status: 'decided',
    summary:
      'Kurt’s wheel repeated so that the wheels overlap and each one’s middle fills the space between four others; every other wheel’s middle has its own colours.',
    story: [
      'You saw that the empty space between four wheels is exactly the middle of a wheel. It is, and more: it is the middle of another wheel. Repeat the plain wheel on the standing square from step 4 (half the old square tile, turned 45°) and the wheels overlap, each one’s middle filling the space between four others and their rings running along the same lines.',
      'So the tutorial draws nothing beyond the plain wheel: step 18 marks the standing square as the tile. My first version drew a mirrored copy of the middle at the tile corner instead. It gave the same wall but was much heavier and slow in your browser; this one is as light as the plain wheel.',
      'You then saw a cross still empty where four wheels meet. Step 19 carries the sides of the four octagons that bite into it on through the cross. They close an octagon in the middle, the same as the wheel’s own, and what is left of each arm is one of the wheel’s small five-pointed bands, so the cross becomes an octagon ringed by four stars and no new shape appears.',
      'You asked for the middle in the space to have different colours. Every other wheel now has its middle in its own colours: cream octagons, wine-red stars and rosette, and blue bands. In the colour stage, click one of its pieces to change all the pieces placed like it.',
      'The coloured wall turns into itself by a quarter turn about the wheel’s centre, not an eighth, so the tutorial is listed with the four-fold patterns, as the Bou Inania wall is.',
    ],
    pictures: [
      {
        src: 'renders/kurt-eight-fold-zellige-filled/wall.png',
        caption:
          'The filled wall (in the review renderer’s colours, not the tutorial’s): every space between four wheels holds the middle of another wheel.',
      },
    ],
    asks: [
      'Nothing for now: the wheel is recoloured with the new tradition palettes, and you choose its colours from those pictures.',
    ],
    sources: [
      {
        label: 'Sandy Kurt: free tutorials page (“8fold zellige” PDF)',
        url: 'https://sandykurt.com/free-tutorials',
      },
    ],
  },
  {
    id: 'eight-fold-zellige',
    title: 'Eight-fold rosette (existed before tonight)',
    fold: 8,
    status: 'decided',
    decision:
      'You: keep both. Done: Design D stays as it is (the notes no longer tie it to Sandy Kurt), and her Design C is built as “Eight-fold zellige wheel” (see its card and the question at the top).',
    summary:
      'An eight-pointed star ringed by eight petals, with an octagon inside a second star where four tiles meet.',
    story: [
      'This tutorial was already in the app. I looked for a photo of it and found none. The geometry notes say it was reconstructed from the text of Sandy Kurt’s free “8fold zellige” PDF, without her drawings.',
      'Tonight I downloaded her PDF and compared her final drawing with our wall (first picture). They are different patterns: hers is a much richer zellige design with crossing bands and octagons, while ours is a simpler, classic eight-fold rosette pattern. So ours is not a reconstruction of hers. It may still be a real pattern; I just could not find it on a building.',
    ],
    pictures: [
      {
        src: 'renders/eight-fold-zellige/compare-wall.png',
        caption:
          'Left: Sandy Kurt’s final 8-fold zellige drawing. Right: our wall. Not the same pattern.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Sandy Kurt: free tutorials page (“8fold zellige” PDFs)',
        url: 'https://sandykurt.com/free-tutorials',
      },
    ],
  },
  {
    id: 'sixteen-fold-rosette',
    title: 'Sixteen-fold rosette (existed before tonight)',
    fold: 16,
    status: 'decided',
    decision:
      'You: build E too. F stays as the beginner version. Then you: build it as my best guess from the photo, extending the lines and choosing the crossings that get closest to the image. In progress.',
    summary:
      'A sixteen-pointed star ringed by sixteen petals, rosettes touching on a square grid.',
    story: [
      'This tutorial was already in the app. Compared with a real sixteen-fold zellige wall at the Bou Inania madrasa in Fès (first picture), the rosette itself is plausible, but the real wall is much richer: the space between rosettes is filled with further rings, small stars and octagons, where ours leaves one large plain piece.',
      'Design E progress (correction): the Bou Inania rosette is twelve-fold, not sixteen-fold. Straightening the photo and measuring how each rosette repeats around its centre gives 12 every time, and by eye it has 12 petals, 12 orange pentagons and 12 small black stars (second picture). So Design E will be a twelve-fold rosette on a square grid, with eight-fold stars at the corners.',
      'Averaging every rosette, every corner and every edge of the photo with their symmetries gives one sharp tile (third picture), which I am now fitting a ruler-and-compass drawing to. The rosette is already fitted: every edge runs at a multiple of 15°, and the whole rosette follows from one starting point by crossings of lines, which is how the tutorial will build it. The corners and the bands between rosettes are next.',
    ],
    pictures: [
      {
        src: 'renders/sixteen-fold-rosette/compare-wall.png',
        caption:
          'Left: zellige at the Bou Inania madrasa, Fès. Right: our wall. The rosettes are alike; the ground between them is not.',
      },
      {
        src: 'research/sixteen-fold-rosette/photo-rosette-twelve-rays.png',
        caption:
          'One rosette of the photo, straightened, with twelve rays drawn: twelve petals, pentagons and stars, so it is twelve-fold.',
      },
      {
        src: 'research/bou-inania/tile-composite.png',
        caption:
          'The whole tile, averaged from every rosette, corner and edge in the photo: the reference Design E is being fitted to.',
      },
    ],
    asks: [],
    sources: [
      {
        label: 'Wikimedia Commons: Bou Inania zellige photo',
        url: 'https://commons.wikimedia.org/wiki/File:Bou_inania_DSCF2978.jpg',
      },
    ],
  },
  {
    id: 'alhambra-comares-stars',
    title: 'Comares stars and crosses (new)',
    fold: 4,
    status: 'decided',
    decision: 'You: keep it, on the strength of the published tracing.',
    summary:
      'Notched eight-pointed stars and crosses from a tile panel in the Hall of Comares, on the grid of eight-pointed stars.',
    story: [
      'This uses the article’s second base: the square grid plus an eight-pointed star at chosen grid points, its turned square found with a circle through the four diagonal grid corners. Our wall matches the tracing exactly.',
      'Same source as the Infantas crosses. The article prints no photo of this panel, so I can only check against its tracing (drawing 1 in the article).',
    ],
    pictures: [
      {
        src: 'renders/alhambra-comares-stars/overlay-ink.png',
        caption:
          'Our lines (red) over the article’s tracing (black): an exact match.',
      },
      {
        src: 'renders/alhambra-comares-stars/wall.png',
        caption: 'Our wall, coloured by piece.',
      },
      {
        src: 'renders/alhambra-comares-stars/step-04.png',
        caption:
          'Step 4: the circle through four grid corners gives the turned square of the eight-pointed star.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Martínez Vela: “La Alhambra con regla y compás” (ALZADA 115, 2017, PDF)',
        url: 'https://www.riarte.es/handle/20.500.12251/633',
      },
    ],
  },
  {
    id: 'alhambra-comares-lattice',
    title: 'Comares star lattice (new)',
    fold: 4,
    status: 'decided',
    decision: 'You: keep it, on the strength of the published tracing.',
    summary:
      'Crossing bands closing into twelve-sided pieces, from a second Comares panel, on the same star grid.',
    story: [
      'Same star-grid base as Design K, with a larger repeat (every four squares diagonally). Our wall matches the tracing exactly.',
      'Same source as the Infantas crosses. The article prints no photo of this panel, so I can only check against its tracing (drawing 2 in the article).',
    ],
    pictures: [
      {
        src: 'renders/alhambra-comares-lattice/overlay-ink.png',
        caption:
          'Our lines (red) over the article’s tracing (black): an exact match.',
      },
      {
        src: 'renders/alhambra-comares-lattice/wall.png',
        caption: 'Our wall, coloured by piece.',
      },
      {
        src: 'renders/alhambra-comares-lattice/step-04.png',
        caption:
          'Step 4: the circle through four grid corners gives the turned square of the eight-pointed star.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Martínez Vela: “La Alhambra con regla y compás” (ALZADA 115, 2017, PDF)',
        url: 'https://www.riarte.es/handle/20.500.12251/633',
      },
    ],
  },
  {
    id: 'alhambra-mexuar-stars',
    title: 'Mexuar stars (new)',
    fold: 4,
    status: 'decided',
    decision: 'You: keep it, on the strength of the published tracing.',
    summary:
      'Stepped stars meeting at small crossed squares, from the tile panel of the Mexuar, on the same star grid.',
    story: [
      'Same star-grid base as Designs K and L. Our wall matches the tracing exactly, including the small crossed squares.',
      'Same source as the Infantas crosses. The article prints no photo of this panel, so I can only check against its tracing (drawing 3 in the article).',
    ],
    pictures: [
      {
        src: 'renders/alhambra-mexuar-stars/overlay-ink.png',
        caption:
          'Our lines (red) over the article’s tracing (black): an exact match.',
      },
      {
        src: 'renders/alhambra-mexuar-stars/wall.png',
        caption: 'Our wall, coloured by piece.',
      },
      {
        src: 'renders/alhambra-mexuar-stars/step-04.png',
        caption:
          'Step 4: the circle through four grid corners gives the turned square of the eight-pointed star.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Martínez Vela: “La Alhambra con regla y compás” (ALZADA 115, 2017, PDF)',
        url: 'https://www.riarte.es/handle/20.500.12251/633',
      },
    ],
  },
  {
    id: 'alhambra-infantas-stars',
    title: 'Infantas plaster stars (new)',
    fold: 4,
    status: 'decided',
    decision: 'You: keep it, on the strength of the published tracing.',
    summary:
      'Notched four-pointed stars from a carved plaster panel in the Torre de las Infantas, on the same grid as the Infantas crosses.',
    story: [
      'Same source and same six opening steps as the Infantas crosses; only the inked lines differ. Our wall matches the article’s tracing exactly (first picture: our lines in red over the tracing in black).',
      'The article prints no photo of this panel, and the photos of the tower I found do not show its tiles, so I cannot check the tracing against the real wall myself.',
    ],
    pictures: [
      {
        src: 'renders/alhambra-infantas-stars/wall-colored.png',
        caption:
          'New (your request): the plaster panel has no colors, so this is my choice in the Alhambra tile colors. Each tile holds four stars and each takes its own color, so every star differs from all four of its neighbours. Click a star in the player to try others.',
      },
      {
        src: 'renders/alhambra-infantas-stars/overlay-ink.png',
        caption:
          'Our lines (red) over the article’s tracing (black): an exact match.',
      },
      {
        src: 'renders/alhambra-infantas-stars/wall.png',
        caption: 'Our wall: one notched star shape, four per tile.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Martínez Vela: “La Alhambra con regla y compás” (ALZADA 115, 2017, PDF)',
        url: 'https://www.riarte.es/handle/20.500.12251/633',
      },
    ],
  },
  {
    id: 'alhambra-infantas-crosses',
    title: 'Infantas crosses (new)',
    fold: 4,
    status: 'decided',
    decision: 'You: keep it, on the strength of the published tracing.',
    summary:
      'Crosses and pinwheel shapes from the tile panel of the Torre de las Infantas, the first design of the Alhambra grid family.',
    story: [
      'From Manuel Martínez Vela’s article “La Alhambra con regla y compás”, which traces several Alhambra panels on a square grid with its diagonals. Our wall matches the article’s tracing exactly (first picture).',
      'Correction: earlier I called this “Comares bones” and marked it verified against the article’s photo of the Comares panel. Re-reading the article, the photo shows a different panel; this tracing is the Torre de las Infantas tile panel, which has no photo. Laying our lines on the Comares photo confirms they do not match (second picture). I am building the real Comares bones from that photo separately.',
    ],
    pictures: [
      {
        src: 'renders/alhambra-infantas-crosses/compare-wall.png',
        caption:
          'The Comares photo (left), the Infantas tracing (middle) and our wall (right): ours matches the tracing, not the photo.',
      },
      {
        src: 'renders/alhambra-infantas-crosses/overlay-photo.png',
        caption:
          'Our lines (red) on the Comares photo: they cut through its bone-shaped tiles, so it is a different design.',
      },
      {
        src: 'renders/alhambra-infantas-crosses/step-05.png',
        caption:
          'Step 5: the grid with both diagonals of every square, the base the whole family shares.',
      },
    ],
    asks: [],
    sources: [
      {
        label:
          'Martínez Vela: “La Alhambra con regla y compás” (ALZADA 115, 2017, PDF)',
        url: 'https://www.riarte.es/handle/20.500.12251/633',
      },
    ],
  },
  {
    id: 'alhambra-comares-bones',
    title: 'Comares bones (new)',
    fold: 4,
    status: 'verified',
    summary:
      'The “bones” tile panel of the Hall of Comares: one bone shape, upright and lying, interlocking like a basket weave.',
    story: [
      'Read straight from the photo of the real panel that Martínez Vela prints with the grid and diagonals drawn over it. Every piece is the same bone, three squares long with half-square knobs at its ends; I checked that the bones fill the plane with no gaps, and our lines fall on every edge between coloured tiles in the photo (first picture).',
      'One thing the photo cannot show: where one white bone ends and the next begins, because white meets white. The coloured bones fix the geometry, and bones are the only shape that fills the white areas, so the white edges follow from them.',
    ],
    pictures: [
      {
        src: 'renders/alhambra-comares-bones/overlay-ink.png',
        caption: 'Our lines (red) on the photo of the real Comares panel.',
      },
      {
        src: 'renders/alhambra-comares-bones/wall-colored.png',
        caption:
          'New (your request): colored as the photo. Lying bones are white; standing bones are black in every other column and alternate teal and brown in the columns between. The player can now color same-shaped pieces by where they sit, and clicking a bone recolors the bones placed like it.',
      },
      {
        src: 'renders/alhambra-comares-bones/wall.png',
        caption: 'Before: one bone shape, two per tile, one color.',
      },
    ],
    asks: ['A quick look at the wall in the player.'],
    sources: [
      {
        label:
          'Martínez Vela: “La Alhambra con regla y compás” (ALZADA 115, 2017, PDF)',
        url: 'https://www.riarte.es/handle/20.500.12251/633',
      },
    ],
  },
  {
    id: 'six-fold-snowflake',
    title: 'Six-fold snowflake',
    fold: 6,
    status: 'verified',
    summary:
      'A small six-pointed star inside a large one, with the small star’s lines running out to the tile’s edge.',
    story: [
      'Built from Mamoot’s “Six-Fold Snowflake”, step by step against its drawings. The wall matches the window grille of the Mosque of Ibn Tulun and a carved panel from the Eski Mosque: small stars, each ringed by six hexagons, with chevrons and diamonds between.',
      'This was the first six-fold pattern, and it is why the app now accepts a hexagon as the repeating tile.',
    ],
    pictures: [
      {
        src: 'renders/six-fold-snowflake/compare-wall.png',
        caption: 'Left: Ibn Tulun window grille. Right: our wall.',
      },
      {
        src: 'renders/six-fold-snowflake/compare-ink.png',
        caption: 'Left: the source’s final inking. Right: ours.',
      },
    ],
    asks: [
      'In the player, go through to the wall and check it looks like the photo.',
    ],
    sources: [
      {
        label: 'Mamoot: “A Six-Fold Snowflake”',
        url: `${MAMOOT}/2022/04/06/islamic-geometry-a-six-fold-snowflake/`,
      },
    ],
  },
  {
    id: 'six-fold-star-and-hexagons',
    title: 'Star and hexagons',
    fold: 6,
    status: 'verified',
    summary:
      'Six-pointed stars each ringed by six regular hexagons, the hexagons touching only at their corners.',
    story: [
      'Built from Charlotte Webb’s teaching handout. The handout suggests repeating the large hexagon, but doing that gives the wrong wall (third picture: hexagons glued together in threes). The real Timurid tiles in the handout’s own photo repeat a smaller hexagon, and with that tile the wall matches the photo.',
    ],
    pictures: [
      {
        src: 'research/six-fold-star-and-hexagons/photo-atm-tiles.png',
        caption: 'The real tiles (photo from the handout).',
      },
      {
        src: 'renders/six-fold-star-and-hexagons/wall.png',
        caption: 'Our wall, with the smaller tile.',
      },
      {
        src: 'renders/six-fold-star-and-hexagons/wall-large-tile-rejected.png',
        caption:
          'What the handout’s suggested tile gives. Rejected: it does not match the photo.',
      },
    ],
    asks: ['A quick look at the wall in the player.'],
    sources: [
      {
        label:
          'Charlotte Webb: “Art in the Mathematics Classroom” (ATM handout, slides 12–13)',
        url: 'https://atm.org.uk/write/MediaUploads/Conference/2019%20Conference/Speakers/Art_in_the_Mathematics_classroom.pdf',
      },
    ],
  },
  {
    id: 'six-fold-hammerhead',
    title: 'Six-fold hammerheads',
    fold: 6,
    status: 'verified',
    summary:
      'A small star held by six hammer-shaped pieces, from the Alcázar of Seville and a door in Aleppo.',
    story: [
      'Built from Mamoot’s “Six-Fold Hammerhead Pattern”. Our ink lies exactly on the source’s final drawing. The motif can repeat two ways; the Alcázar tiles show which, and our wall matches the source’s drawing of that way line for line.',
    ],
    pictures: [
      {
        src: 'renders/six-fold-hammerhead/compare-walls.png',
        caption:
          'Top: the Alcázar of Seville tiles beside our wall. Bottom: the source’s drawing of this repeat beside our wall.',
      },
    ],
    asks: ['A quick look at the wall in the player.'],
    sources: [
      {
        label: 'Mamoot: “Six-Fold Hammerhead Pattern”',
        url: `${MAMOOT}/2020/12/19/islamic-geometry-six-fold-hammerhead-pattern/`,
      },
    ],
  },
  {
    id: 'ibn-tulun-window',
    title: 'Ibn Tulun window',
    fold: 6,
    status: 'verified',
    summary:
      'A twelve-pointed star with six “fish” and two interwoven stars, from a window grille of the Mosque of Ibn Tulun in Cairo.',
    story: [
      'Built from Mamoot’s tutorial (learned from William Charles Riding). Our ink lies exactly on the source’s final drawing (first picture), and the wall matches the grille photo: stars ringed by chevrons, three-armed openings between them, and small square holes. The photo is small, so this match is by those features rather than by measurement.',
    ],
    pictures: [
      {
        src: 'renders/ibn-tulun-window/overlay-ink.png',
        caption: 'Our ink (red) over the source’s final drawing (black).',
      },
      {
        src: 'renders/ibn-tulun-window/compare-photo.png',
        caption: 'Left: the window grille. Right: our wall as lines.',
      },
      {
        src: 'renders/ibn-tulun-window/wall.png',
        caption: 'Our wall, coloured by piece.',
      },
    ],
    asks: [
      'This is the most complex new tutorial (10 steps, marked advanced). Step through it in the player and check the text reads clearly.',
    ],
    sources: [
      {
        label: 'Mamoot: “A Window from Ibn Tulun Masjid”',
        url: `${MAMOOT}/2020/12/21/islamic-geometry-a-window-from-ibn-tulun-masjid/`,
      },
    ],
  },
  {
    id: 'eight-fold-star-and-cross',
    title: 'Star and cross (existed before tonight)',
    fold: 8,
    status: 'verified',
    summary:
      'Eight-pointed stars meeting point to point, with crosses between.',
    story: [
      'Already in the app. Checked tonight against the Kashan lustre tiles of 1297–98 in the Museum für Islamische Kunst, Berlin, and it matches.',
    ],
    pictures: [
      {
        src: 'renders/jali/eight-fold-star-and-cross.png',
        caption:
          'Jali A — the owner approved this stone-screen appearance on 11 October.',
      },
      {
        src: 'renders/jali/bou-inania-rosette.png',
        caption:
          'Jali B — the approved stone finish on Bou Inania. Color and material controls are now available at Color.',
      },
      ...(['stone', 'wood', 'metal'] as const).map((material) => ({
        src: `renders/jali/direct-${material}-desktop.png`,
        caption: `Jali ${material}: material buttons, visible finish swatches and a direct Custom color button.`,
      })),
      {
        src: 'renders/jali/direct-wood-phone.png',
        caption:
          'Wood on a phone: Oak, Walnut and Cedar apply immediately; Custom color opens the native picker in one click.',
      },
      ...(['marble', 'oak', 'bronze'] as const).map((finish) => ({
        src: `renders/jali/textures/compare-${finish}.png`,
        caption: `Jali ${finish}: before (left), textured finish (right), at normal viewing size.`,
      })),
      ...(['marble', 'sandstone', 'oak', 'silver'] as const).map((finish) => ({
        src: `renders/jali/textures/eight-fold-star-and-cross-${finish}-desktop-detail.png`,
        caption: `Zoomed ${finish} texture: surfaces gain detail while the openings remain clear.`,
      })),
      {
        src: 'renders/jali/textures/bou-inania-rosette-oak-phone.png',
        caption:
          'Textured oak on Bou Inania at phone size; the dense pattern remains the focus.',
      },
      ...(
        [
          'limestone',
          'marble',
          'sandstone',
          'slate',
          'oak',
          'walnut',
          'cedar',
          'silver',
          'gold',
          'bronze',
          'copper',
        ] as const
      ).map((finish) => ({
        src: `renders/jali/finish-${finish}.png`,
        caption: `Jali ${finish} preset — framework color can be customized while keeping the material treatment.`,
      })),
      {
        src: 'renders/eight-fold-star-and-cross/compare-wall.png',
        caption: 'Left: the Kashan tiles. Right: our wall.',
      },
    ],
    asks: ['Nothing to do.'],
    sources: [
      {
        label: 'Wikimedia Commons: Kashan star and cross tiles',
        url: 'https://commons.wikimedia.org/wiki/File:Tiles._Field_cross_and_star_pattern._From_Kashan,_Iran._Dated_697_AH_(1297-1298_CE)._Quartz_ceramic,_underglaze_and_luster_painting._Islamic_Art_Museum_(Museum_f%C3%BCr_Islamische_Kunst),_Berlin,_Germany.jpg',
      },
    ],
  },
];

export interface Question {
  /** Stable key for the saved answer. */
  readonly id: string;
  /** One or two short lines. Designs are named by the letters in the pictures. */
  readonly text: string;
  /** One-click answers; the owner can still type their own. */
  readonly choices?: readonly string[];
  readonly pictures: readonly Picture[];
  /** The pattern card with the details. */
  readonly card: string;
  /** Other cards this question is about. */
  readonly also?: readonly string[];
}

/**
 * The questions for the owner, most important first; a question that only
 * matters given an earlier answer comes straight after it.
 */
export const QUESTIONS: readonly Question[] = [
  {
    id: 'tilingsearch-45-first',
    text: 'A hundred and seventeen new patterns from Tiling Search (twenty-eight of them built by Codex)’s 45° list (cards marked new, Tiling Search). Do they look right, and is it fine that most have no photo of the real wall yet?',
    choices: ['They look right', 'Some need work (say which)'],
    pictures: [
      {
        src: 'renders/alhambra-mexuar-porch-fret/drawing-overlay.png',
        caption: 'Mexuar porch fret: Wichmann’s drawing with our lines in red.',
      },
      {
        src: 'renders/shah-i-zinda-octagons/wall.png',
        caption: 'Shah-i-Zinda octagons: our wall.',
      },
    ],
    card: 'alhambra-mexuar-porch-fret',
    also: [
      'alhambra-mexuar-corridor-stars',
      'alhambra-museum-loops',
      'shah-i-zinda-octagons',
      'qaytbay-floor-octagons',
      'sircali-stars',
      'topkapi-scroll-pinwheel',
      'alhambra-leones-door-stars',
      'alhambra-comares-soffit-stars',
      'alhambra-comares-throne-dado',
      'alhambra-leones-southeast-doors',
      'alhambra-leones-gallery-stars',
      'alhambra-arrayanes-portico-doors',
      'chellah-minaret-loops',
      'alcazar-interlaced-stars',
      'toledo-tile-interlace',
      'toledo-tile-stars',
      'spanish-mosaic-stars',
      'alcazar-mosaic-stars',
      'qom-atabaki-stars',
      'mashhad-courtyard-stars',
      'shiraz-qavam-crosses',
      'herat-minaret-stars',
      'mashhad-gowhar-interlace',
      'casablanca-house-crosses',
      'leon-tile-stars',
      'paccard-zellige-frets',
      'badi-palace-stars',
      'chellah-mosque-stars',
      'nim-avard-stars',
      'tillya-kari-squares',
      'charbagh-stars',
      'tash-khauli-crosses',
      'sikandra-stars',
      'agra-kite-stars',
      'iznik-green-mosque-pinwheel',
      'iranian-tile-crosses',
      'cahier-pinwheel-stars',
      'pompeii-stars-and-rhombi',
      'hippo-mosaic-octagons',
      'kritliya-house-stars',
      'bou-inania-interlaced-stars',
      'dar-el-bey-crosses',
      'cahier-martin-arrow-stars',
      'khojent-tile-stars',
      'nishapur-madrasa-stars',
      'bourgoin-star-octagons',
      'mazar-shrine-stars',
      'sale-madrasa-stars',
      'isfahan-masjid-ali-crosses',
      'isfahan-masjid-ali-crosses-plain',
      'cahier-martin-cross-stars',
      'cahier-martin-star-crosses',
      'sutton-crosses-and-kites',
      'sicily-panel-stars',
      'alhambra-museum-interlaced-stars',
      'assisi-basilica-stars',
      'itimad-daula-stars',
      'fatehpur-sikri-stars',
      'damghan-minaret-stars',
      'cairo-embassy-stars',
      'bourgoin-plate-64',
      'khayrbak-mosque-stars',
      'fes-palace-door-stars',
      'moulay-idriss-interlace',
      'meknes-bou-inania-star-rings',
      'tetouan-sakkala-knots',
      'attarine-star-rosettes',
      'meknes-bou-inania-petals',
      'meknes-bou-inania-rosette-rings',
      'fes-bou-inania-cross-stars',
      'rabat-throne-octagons',
      'rabat-rosette-bands',
      'ben-youssef-arrow-bands',
      'fes-bou-inania-octagonal-rosettes',
      'moulay-ismail-octagons',
      'ben-youssef-star-rosettes',
      'toledo-synagogue-star-bands',
      'alhambra-mexuar-grid-fret',
      'alhambra-dos-hermanas-ceiling-stars',
      'alhambra-dos-hermanas-band-stars',
      'seville-vanda-star-rosettes',
      'cordoba-synagogue-star-bands',
      'alcazar-reyes-octagon-bands',
      'bourgoin-58-star-bands',
      'hani-zeynebiye-stars',
      'bourgoin-144-octagon-bands',
      'lindisfarne-folio-2b-stepped-bands',
      'leon-mosaic-star-rosettes',
      'abas-salman-232-star-bands',
      'racinet-37-octagonal-rings',
      'salim-chishti-square-lattice',
      'maku-floor-hexagons',
      'nasrid-textile-stars',
      'fes-palace-ceiling-stars',
      'alhambra-arrayanes-porch-ceiling',
      'dar-el-bey-stars',
      'agra-fort-stars',
      'birbal-house-stars',
      'seville-tile-stars',
      'bahramiye-mosque-stars',
      'marrakesh-crafts-stars',
      'alhambra-museum-pointed-stars',
      'marrakesh-throne-rosette',
      'alhambra-dos-hermanas-jamb-rosette',
      'isfahan-seyyed-stars',
      'isfahan-sayyed-crosses',
      'paccard-222-rosette',
      'paccard-222-rosette-ring',
      'meknes-throne-rosette',
      'fes-rosette-rings',
      'seville-octagon-rings',
      'sidi-said-window',
      'fes-najjarin-rosette',
      'meknes-bou-inania-rosette',
      'meknes-throne-star-rosette',
      'meknes-moulay-ismail-rosette',
      'fes-throne-star-burst',
      'marrakesh-bahia-rosette',
      'fes-petal-star-rosette',
      'paris-mosque-rosette',
      'meknes-throne-ring-rosette',
      'fes-moulay-ismail-interlace',
      'telouet-residence-rosettes',
      'fes-bou-inania-interlaced-rosette',
      'telouet-framed-rosette',
      'fes-attarine-rosette',
      'marrakesh-bahia-ring-rosette',
      'fes-two-rosettes',
      'meknes-manezeh-fountain-rosette',
      'alhambra-comares-west-dado',
      'marrakesh-dar-el-bacha-rosette',
      'fes-motif-rosette',
      'isfahan-ali-notched-tiles',
      'hama-azem-door-tiles',
      'isfahan-royal-mosque-star-rows',
      'iranian-star-columns',
      'pompeii-squares-and-triangles',
      'nishapur-mahruq-star-rows',
      'kerman-ganj-ali-khan-chevrons',
      'bourgoin-52-octagon-rows',
      'golestan-palace-star-rows',
      'mosul-imam-yahya-star-rows',
      'agra-fort-band-rows',
      'amol-marashi-tile-rows',
      'qom-atiq-courtyard-rows',
      'nasrid-casket-stars',
      'alhambra-partal-turned-stars',
      'alhambra-mexuar-vestibule-rosettes',
      'cairo-bagasi-rosettes',
      'bourgoin-153-rosettes',
      'mughal-jali-octagons',
      'salim-chishti-octagons',
      'bourgoin-149-rosettes',
      'shafai-248-rosettes',
      'bourgoin-65-rosettes',
      'hafiz-tomb-rosettes',
      'jali-screen-pinwheel',
      'tayabad-zayn-stars',
      'fatehpur-masjid-decagons',
      'fatehpur-masjid-small-decagons',
      'salim-chishti-decagons',
      'mirza-akber-31-stars',
      'bourgoin-183-stars',
      'isfahan-imamzadeh-ismail-stars',
      'mihrimah-uskudar-stars',
      'atik-valide-uskudar-stars',
      'alhambra-mexuar-dado-rosettes',
      'camlica-mosque-stars',
      'topkapi-door-stars',
      'alcazar-six-eight-stars',
      'salim-chishti-dodecagons',
      'turkish-sultana-mixed-stars',
      'agra-twelve-six-stars',
      'agra-twelve-six-stars-kites',
      'dhahabi-house-six-stars',
      'mexuar-twelve-star-bands',
      'sultaniyeh-twelve-star-bands',
      'damascus-fountain-stars',
      'ibn-arabi-six-stars',
      'bourgoin-98-divided-stars',
      'samarkand-star-knots',
      'bourgoin-106-star-lattice',
      'bourgoin-92-twelve-stars',
      'maragha-twelve-star-bands',
      'qalawun-twelve-star-knots',
      'chester-beatty-twelve-stars',
      'el-djem-dodecagons',
      'bourgoin-141-mixed-stars',
      'bourgoin-142-star-rows',
      'seville-six-eight-twelve-stars',
      'bourgoin-87-chelates',
      'fathabad-mixed-stars',
      'qawsun-quran-stars',
      'museum-divided-stars',
      'otrush-star-chelates',
      'barsbay-twelve-star-doors',
      'ismail-shrine-divided-stars',
      'shah-mosque-chiral-grille',
      'chehel-sotoun-divided-stars',
      'rabat-mixed-star-rosette',
    ],
  },
];

export interface ProgressItem {
  readonly title: string;
  readonly text: string;
  /** A card on this page, or a tutorial in the player (`/#/<id>`). */
  readonly link?: { readonly label: string; readonly href: string };
}

/**
 * Where the work stands, shown at the top of the review page: what is done,
 * what is left (in the order I will do it) and what waits on the owner.
 * Updated as the work moves; `updated` is the date of the last change.
 */
export const PROGRESS: {
  readonly updated: string;
  readonly goal: string;
  readonly done: readonly ProgressItem[];
  readonly now: ProgressItem;
  readonly next: readonly ProgressItem[];
  readonly waiting: readonly ProgressItem[];
} = {
  updated: '29 October 2026',
  goal: 'Build the queue of pattern tutorials: every family with several real, verified designs, each drawn step by step with ruler and compass, and the player showing them well.',
  done: [
    {
      title: 'F6 preparation: feedback database and bot-check widget ready',
      text: 'PR #14 is merged. The live database now has the feedback migration, and the deployed configuration endpoint responds successfully with reporting still off. The Cloudflare Managed widget is created for tastir-studio.vercel.app; its keys and a new cleanup secret are saved in your ignored private settings file. Choose the public contact email, copy the five feedback settings into Vercel, and follow the guide to redeploy and test. Vercel is not signed in on this computer, so those dashboard steps remain yours.',
      link: {
        label: 'Your step-by-step launch guide',
        href: '#/notes/feedback-go-live',
      },
    },
    {
      title: 'PR #14 review fixes: feedback intake and retry recovery',
      text: 'Sender limits now run before the global attempt budget, and the global minute/day counters update together. Production hides Feedback when intake is off; the dev server keeps the form available for review. The drawing checkbox explains when attachments are unavailable. Interrupted sends can reclaim an expired lease under a database row lock, with stale-worker protection and tracked image cleanup. The setup guide also explains the daily cron’s 401 response until its secret is configured.',
      link: {
        label: 'Feedback setup and review',
        href: '#/notes/feedback-setup',
      },
    },
    {
      title: 'Pattern feedback: first release built for review (28 October)',
      text: 'On codex/pattern-feedback, learners can report a pattern or step without an account and optionally attach their drawing. Your private inbox has review notes, status, issue groups, spam quarantine, bulk deletion, retention and a preview before copying selected reports for AI. Bot checks, shared rate and storage limits, private images and safe retries protect intake. Production reporting stays disabled until its settings and deployed checks are complete. Direct agent access remains a later phase.',
      link: {
        label: 'Feedback setup, review and remaining rollout',
        href: '#/notes/feedback-setup',
      },
    },
    {
      title: 'Feedback form on a phone',
      text: 'A real browser capture from the local fixture. The form keeps the pattern and step, has optional email and drawing evidence, and keeps unsent text when closed or when verification fails. Light and dark desktop/phone captures are saved with the browser checks.',
      link: {
        label: 'See the phone feedback form',
        href: '/__review/renders/feedback/phone-form-light.png',
      },
    },
    {
      title: 'Private report review',
      text: 'The owner sees the original comment, exact instruction and optional board. Current-lesson review preserves existing progress; a construction copy is a separate saved pattern. Contact details are omitted from AI exports, whose messages can be redacted before downloading.',
      link: {
        label: 'See the desktop report review',
        href: '/__review/renders/feedback/desktop-inbox-light.png',
      },
    },
    {
      title: 'Hidden patterns (your request, 24 October)',
      text: 'Bou Inania twelve-fold wall and Eight-fold zellige wheel are hidden: the live site leaves them out of the library, the side menu and next/previous, but they still open from a direct link, so saved designs and shared links keep working. This dev server still lists them with a grey Hidden badge. To hide or show any pattern, open it, click the gear (View settings) and use Hide from the library or Show in the library; the change reaches the live site with the next push.',
      link: { label: 'The library', href: '/#/' },
    },
    {
      title:
        'Lines: woven double lines, and paint and pencil colours (your feedback, 24 October)',
      text: 'The Double pen now weaves like interlace: at each crossing one band goes over and the other under, the band below darkens in the top band’s shadow, and every band casts a soft shadow on the paper, so the strips look laid on each other. The wash no longer looks like faint digital colour: with Single and Double it is watercolour (soft blotches where the paint pooled or thinned, paper grain through it, a darker edge round each piece), and with Pencil it is coloured pencil (slanted shading strokes with white specks where the pencil skipped the paper), with a grainy graphite line. Downloads look the same. Open the wall, pick Lines, zoom in and try each pen. One cost: these textures make dragging the wall slower than the plain styles; it was smooth enough in my tests, but tell me if it lags on your machine.',
      link: {
        label: 'Zellige wheel, filled: the wall',
        href: '/#/kurt-eight-fold-zellige-filled/result',
      },
    },
    {
      title: 'Your own grout and band colours (24 October)',
      text: 'Until now the bands of strapwork and interlace were always ivory with dark edges, so a wall like your sketchbook star (terracotta bands) could not be made. Under the width slider there are now swatches: Band color and Edge color for strapwork and interlace, Grout color for tiles, each with a custom colour. They are part of the colouring, so Undo, Redo, saving and share links keep them, and choosing another palette keeps them. Try Strapwork with a Terracotta band.',
      link: {
        label: 'Zellige wheel, filled: the wall',
        href: '/#/kurt-eight-fold-zellige-filled/result',
      },
    },
    {
      title:
        'Lines style: a drawing with a pen, a wash and an ink (your request, 24 October)',
      text: 'Colours now work in Lines: the pieces take a light wash of their colours on warm paper, like a coloured drawing, and “Lines only” turns the wash off (the colour panel then hides, as for Jali). Under “The drawing” you choose the pen: Single, Double (two lines with paper between, joined where they cross, like your sketchbook star) or Pencil (a soft line gone over twice), and the ink: black, sepia, indigo, red ochre or your own colour. “Grout” is now “Line width” (tiles and lines) or “Band width” (strapwork and interlace). Saved designs, share links and the SVG/PNG download keep all of it; the printed colouring sheet stays bare black lines on white. Open the wall, pick Lines, and try the three pens.',
      link: {
        label: 'Zellige wheel, filled: the wall',
        href: '/#/kurt-eight-fold-zellige-filled/result',
      },
    },
    {
      title: 'Source tutorials: direct links for comparing the drawing steps',
      text: 'The lesson and Draw along now say Tutorial beneath the pattern name, linked to the specific source. The construction panel puts drawing tutorials first, with the author, PDF/video/written format and the app steps that use them. Twelve lessons now link directly to the published PDF or video; the ATM handout opens at page 12. Finished drawings, photographs and the challenge with hints are labeled separately. The audit report opens with an index of all twenty patterns with instructional sources.',
      link: {
        label: 'Find the source tutorials',
        href: '#/notes/construction-sources',
      },
    },
    {
      title: 'Codex’s construction-source audit reviewed and merged',
      text: 'The counts add up, spot checks agree with the pattern status and credits, and the code is small and tested; it is merged into main (23 October). Every lesson now has “How this construction was made”. Three small things were left as they are; the review says which.',
      link: {
        label: 'Read the review',
        href: '#/notes/codex-provenance-review',
      },
    },
    {
      title: 'All 39 patterns: where their construction steps came from',
      text: 'Eleven use published instructions, nine combine instructions with our additions, fifteen reconstruct finished designs, three are app-developed studies and one is a standard construction. Among the twenty with instructional sources, five have documented close correspondence, eleven have identifiable adaptations and four lack a complete fidelity check. Every pattern now has a source assessment under “How this construction was made”. The report gives source mappings, departures and evidence for each; historical verification remains a separate question.',
      link: {
        label: 'Read the construction-source audit',
        href: '#/notes/construction-sources',
      },
    },
    {
      title: 'Design review: the app brought back to the approved design',
      text: 'Arched card pictures and a cedar arch on the home drawing, card buttons that fit, the old typewriter font gone, draw along in the lesson’s look, a library search, a plain page for a broken address, pill controls in the editor and upcoming page, and the editor’s title first on a phone. One question: an arch for the lesson on a phone.',
      link: {
        label: 'See the review and the pictures',
        href: '#design-review-2026-10-22',
      },
    },
    {
      title: 'H6 and H8: phone answer, every client and deployed speed',
      text: 'You answered Claude’s question inside the claude.ai card from your phone, which completes H8. Claude, ChatGPT, Codex and Antigravity each finished the square brief. After the one-request fix, an agent’s edit reached the open page in 83 to 217 ms in all twenty deployed tries. Only the week of free-plan use is left.',
      link: {
        label: 'Read the hosted Studio acceptance checks',
        href: '#/notes/studio-hosted',
      },
    },
    {
      title: 'H6: find the ChatGPT square and see its finished wall',
      text: 'ChatGPT saved the square correctly, including its repeating tile and blue color. Your work now lists online Studio projects, the shared editor says View finished wall, and the chat card shows the colored repeat when ready. Desktop and phone checks cover the complete route. The connection guide and incident report record each issue, cause, fix and lesson.',
      link: {
        label: 'Read the Studio issues and lessons',
        href: '#/notes/studio-lessons',
      },
    },
    {
      title: 'M2: the editor, assistant and MCP share one project',
      text: 'The owner draws with the compass, the in-app assistant adds geometry, and a real MCP client edits the same Studio project. Saves use server revisions and authored history. Undo mine stops at another author; ordinary Undo still works across the shared history. An owner edit made during an assistant save stays recoverable. A named copy reloads and exports with its paint. Six desktop/phone checks pass using simulated model replies and the real app and service; this is not a live provider evaluation.',
      link: {
        label: 'See the shared editor and matching walls',
        href: '/__review/renders/m2-three-workers/proof.html',
      },
    },
    {
      title: 'The wall panel: style and band width back at the top',
      text: 'On 13 October the colours were put first at the colour stage, and since the finished wall counts as that stage, Style and Band slid below the screen. On the finished wall the panel now opens with the wall: its five styles as buttons that each show your own pattern and colours in that style, the band or grout width with its value, and the original photo as a toggle beside them. The palettes come first in Colors, as one-click strips half as tall, and the paper size sits beside Print as two buttons.',
      link: {
        label: 'See it on a finished wall',
        href: '#/alhambra-comares-dado/result',
      },
    },
    {
      title: 'AI.2a: colorful companion and useful error recovery',
      text: 'The smiling zellige star uses Tastir’s theme colors. Confirmed usage limits, temporary usage-check failures and account restrictions now have separate explanations. Manage usage is directly beside recovery controls, editing the prompt does not resend it, and earlier changes survive a later service failure. This phone preview uses simulated responses.',
      link: {
        label: 'See the new companion on a phone',
        href: '/__review/renders/assistant-feedback/phone-dark.png',
      },
    },
    {
      title: 'AI.2–3: compact chat and normal drawing tools',
      text: 'The toolbar companion opens a real conversation without covering Save. Follow-ups survive navigation and closing. It can create and edit normal patterns, ink, choose repeats, color shapes/rings/positions, save named copies and use the real Undo history. Assistant-only Undo protects manual work. This responsive preview uses simulated replies with the real app.',
      link: {
        label: 'See the phone chat',
        href: '/__review/renders/assistant-chat/phone.png',
      },
    },
    {
      title: 'Chat in the dark theme',
      text: 'The companion uses the existing theme colors, accessible buttons and a fixed composer. Earlier messages scroll above the input. Keyboard Enter sends, Shift+Enter adds a line, and touch Enter stays multiline. Escape closes the panel and returns focus to its toolbar icon.',
      link: {
        label: 'See the dark desktop chat',
        href: '/__review/renders/assistant-chat/desktop-dark.png',
      },
    },
    {
      title: 'AI.1: normal wall colors, Undo and saving',
      text: 'You chose one-square-thick borders: black 1×1, teal out to 3×3, blue to 5×5 and orange to 7×7. The assistant now applies this repeating motif to the normal Squares and stars wall while preserving its stars and connecting bands. One Undo reverses the whole request; Redo restores it. Normal saving, sharing and SVG export keep the colors. Live GPT-6.1-Sol completed coloring, Undo and Redo. All 108 assistant browser checks and 151 production browser checks passed (17 production skips), along with full unit tests, lint, TypeScript and build. Checks ran sequentially with one worker and bounded memory.',
      link: {
        label: 'See the actual live Redo result',
        href: '/__review/renders/agent-square-colors/live-redo.png',
      },
    },
    {
      title: 'AI.1: Claude’s review and two additional fixes',
      text: 'The sending notice now names saved pattern/design titles, and review/notes text is excluded. Malformed calls can be corrected; follow-ups keep bounded text context while only the latest image is resent. Account UI is separate, the launcher requires the companion, tool guidance is clearer, and the model list has a short cache. Expanded checks also exposed and fixed a stale-image capture race and a build-mode issue that included Notes in production. Branch cleanup, keyring storage, remote access-token revocation and the larger workspace split remain tracked follow-ups. The setup guide records the responsive captures and remaining visual refinements.',
      link: {
        label: 'Read the checks and current limits',
        href: '/#/notes/agent-setup',
      },
    },
    {
      title: 'AI agent: points on normal editor and tutorial screens',
      text: 'Ask it to point at centre O, a visible wall or unit piece, or a named page button. The marker uses the actual drawing and follows zoom and scrolling; pointing at a control does not press it. Live ChatGPT checks passed for a tutorial point, an editor point and a control. All 36 affected browser checks passed on desktop, tablet and phone, along with the full unit suite, lint, TypeScript and production build. The earlier complete browser run was interrupted by the crash and is not counted as passing. Checks now run one at a time with bounded memory. This picture shows the actual live editor result.',
      link: {
        label: 'See the live editor highlight',
        href: '/__review/renders/agent-screen-pointing/live-editor.png',
      },
    },
    {
      title: 'AI agent: knows its edits and fits new geometry',
      text: 'Your latest screenshots exposed two gaps: the assistant asked whose Undo steps they were, and newly constructed corners could be outside its image. New edits now record their author, request and label. Undo your changes can undo its consecutive edits directly and refuses to cross a manual or unidentified edit. Added geometry now frames itself, and the assistant has Fit to show the full construction and continue drawing. A live request undid all three assistant changes without a clarification; an isolated live Fit request switched from the wall to Construction, sent the new image and completed. The initial combined Fit check timed out before the final reply; the isolated check passed without a code change. Old history remains unidentified. The picture is the actual live Undo result with the account masked.',
      link: {
        label: 'See Undo your changes working',
        href: '/__review/renders/agent-history-context/live-undo.png',
      },
    },
    {
      title: 'AI agent: Undo and Redo work by request',
      text: 'Your screenshot found a missing tool: the assistant could describe Undo but could not trigger it. It now uses the same Undo/Redo history as the drawing buttons, with the available step counts and a fresh image after each successful request. The live GPT-6.1-Sol check drew a square, repeated it and colored it blue; Undo all three edits removed the square, tile and color, and Redo all three restored them. Empty history and requests beyond the available steps leave the drawing unchanged. Normal editor/player history is not connected yet. The picture is the actual live Undo result, with the account hidden.',
      link: {
        label: 'See the live Undo result',
        href: '/__review/renders/agent-undo/live-undo.png',
      },
    },
    {
      title: 'AI agent: navigation preserves your drawing',
      text: 'On codex/ai-agent-navigation, ask the assistant to open Your work, a library wall or construction, drawing along, or an available saved pattern, editor or design. It waits for the destination to display and receives the new page before finishing. The live GPT-6.1-Sol check drew four sides, opened Your work, then returned to the same drawing; Undo still removed the whole square. The panel stays available on ordinary pages, with compact account settings and a phone layout. Unsaved-design questions stay in control. If a saved copy changes in the editor, Keep as new pattern preserves both versions. Workspace tests, lint, TypeScript, production build and all 57 assistant browser checks passed. The picture is the actual return to the drawing, with the account hidden.',
      link: {
        label: 'See the live return to the drawing',
        href: '/__review/renders/agent-navigation/live-return.png',
      },
    },
    {
      title: 'AI agent: repeating tiles and coloring are working',
      text: 'On codex/ai-agent-repeat-color, the assistant can turn finite ink into a checked four- or six-corner tile, show the infinite wall and color each shape type. The live GPT-6.1-Sol request drew 12 sides, repeated N–E–S–W and painted the inner squares cobalt blue and surrounding quadrilaterals gold. Each change returned a fresh image before the next response. Undo/Redo cover tile and color edits, and Keep in My patterns preserves a normal playable tutorial with the same colors. All workspace tests, lint, TypeScript checks, production build and 42 assistant browser checks passed. The picture is the actual live result with the saved account hidden.',
      link: {
        label: 'See the live colored repeat',
        href: '/__review/renders/agent-repeat-color/live-repeat.png',
      },
    },
    {
      title: 'AI agent: new ruler-and-compass geometry is working',
      text: 'On codex/ai-agent-construction, the assistant can start from just O and A, add named lines and circles, and mark chosen intersections. In the live check it created C0, C1, Top, Bottom and Axis, then used the new points for a finite side. Each edit sent a fresh image before the model continued. Undo removed the side first and the construction batch second; Redo restored both. Saving preserves the complete editable draft. All geometry tests, workspace tests, lint, TypeScript checks and 36 assistant browser checks passed. The picture shows the actual live result with the account hidden.',
      link: {
        label: 'See the live compass construction',
        href: '/__review/renders/agent-construction/live-construction.png',
      },
    },
    {
      title: 'AI agent: editable square with Undo is working',
      text: 'On codex/ai-agent-drawing, ChatGPT can join existing named points into finite sides and remove sides it added. A live request drew jW–jN–jE–jS as four sides in one edit, received the updated image and completed its reply. One Undo removed all four sides; Redo restored them. Change endpoints or remove a side below the board. Keep in My patterns saves an editable copy. New points, compass circles and coloring remain later work. The picture is the actual live result with the account label hidden.',
      link: {
        label: 'See the live square',
        href: '/__review/renders/agent-drawing/live-square.png',
      },
    },
    {
      title: 'AI agent Phase 0: live ChatGPT request fixed and verified',
      text: 'The owner’s first request failed because the valid stream omitted its content-type header. It also delivered the tool call in finalized item events while leaving the final output list empty. Both are handled now, with actions still held until successful completion. A live GPT-6.1-Sol request sent the board image, highlighted O, acknowledged the mark and completed the explanation. All 25 runtime tests, workspace tests, lint, TypeScript checks and 15 assistant browser checks passed. The picture shows the real result with the saved account masked.',
      link: {
        label: 'See the successful live result',
        href: '/__review/renders/agent-phase-0/live-fixed.png',
      },
    },
    {
      title: 'AI agent Phase 0: local connection workspace implemented',
      text: 'On codex/ai-agent-phase-0, pnpm dev:agent opens a real Tastir drawing with ChatGPT sign-in, account-specific models, board-image capture, questions and a highlighting tool. The browser acknowledges a displayed mark before the model continues, and rejects stale or stopped responses. The full checks passed, including 151 existing app browser checks and 15 assistant checks. The first live account check now passed too. Original pattern creation and coloring come later.',
      link: { label: 'Open the local assistant', href: '/#/agent' },
    },
    {
      title: 'AI agent: detailed implementation plan',
      text: 'The plan covers ChatGPT sign-in, seeing and pointing, original editable constructions, inking, repeats, coloring and saving. It maps the existing engine and editor to proposed tools, with revisions, undo, visual checks and phased acceptance tests. The first connection workspace is implemented; the remaining capabilities are planned.',
      link: { label: 'Read the AI agent plan', href: '/#/notes/agent' },
    },
    {
      title: 'Codex’s review: all ten items are done',
      text: 'Continue offers a drawing left partway and opens where it was left. The library has Clear all beside its filters, and an empty result names what was chosen. The earlier review finished with 151 browser tests and 664 unit tests passing.',
      link: { label: 'Before and after', href: '#redesign' },
    },
    {
      title: 'Storage recovery: the warning points to a share link',
      text: 'When browser storage is blocked or full, the warning now says to use “Copy a share link” and keep the link before leaving. A named save uses the same storage, so it cannot solve that failure. Desktop and phone browser checks confirmed that the share link restores the palette, painted ring, style and band width in a fresh browser.',
      link: {
        label: 'See the corrected warning',
        href: '/__review/renders/storage-recovery-warning/desktop.png',
      },
    },
    {
      title: 'Redesign reviewed: keep the direction and refine the workflows',
      text: 'The paper and ink themes, lesson layout, single-board guide, smaller initial tool set, and paint colors before palettes improve the app. All 39 results opened, and the main drawing, saving and sharing flows worked. The illustrated review compares the old and new screens and shows the next fixes: the tablet result grows too tall and opens at the bottom, a first color edit can still be lost, and the phone needs its next drawing prompt beside the board.',
      link: {
        label: 'Read the redesign review and comparisons',
        href: '/__review/renders/redesign-review-2026-10-14/index.html',
      },
    },
    {
      title: 'App usability review: a clearer first lesson and easier coloring',
      text: 'The review covers the library, watching and drawing, the editor, coloring, styles, saving, sharing and exports at desktop, tablet and phone sizes. All 39 results opened. The illustrated report has 18 improvements in priority order, with current screenshots and a proposed learner journey. Start with the starter button, recovery before a first save, controls near the mobile drawing, and guidance for each click.',
      link: {
        label: 'Read the illustrated usability review',
        href: '/__review/renders/ux-audit-2026-10-13/index.html',
      },
    },
    {
      title: 'One switch: watch it drawn, result, draw along',
      text: 'The top bar of the player and of draw along has the same three choices as the library cards. Watch and Result switch in place without loading the pattern again, and the address follows, so a reload opens the same view. Previous, Next and the Patterns menu keep the view you are in: from a result, Next shows the next pattern’s result.',
      link: { label: 'Try it', href: '/#/alhambra-barca-stars/result' },
    },
    {
      title: 'Browsing: your place kept, previous and next, a pattern menu',
      text: 'Going back to the library, by Back or “All patterns”, puts you on the same card with the same filters. In the player, the buttons beside the title open the pattern before or after this one in the library’s order (only the filtered ones if you filtered), and “Patterns” at the top left opens every pattern in a side menu.',
      link: { label: 'Try it', href: '/#/alhambra-barca-stars' },
    },
    {
      title: 'Zellige wheel: a hexagon tile, and the gaps filled',
      text: 'Your two ideas from the feedback document. The shifted rows now repeat a hexagon round each wheel instead of a slanted box, so the dotted tile no longer cuts wheels in half; the wall is unchanged. And a new tutorial fills the space between four wheels: rebuilt your way after the first version was slow, the plain wheel now repeats on the standing square so the wheels overlap and each one’s middle fills the space, with every other middle in its own colours (question at the top).',
      link: {
        label: 'Eight-fold zellige wheel, filled',
        href: '/#/kurt-eight-fold-zellige-filled/result',
      },
    },
    {
      title: 'Review decisions: keep the construction studies',
      text: 'The khatam and star-and-octagon drawings are now playable, with their source credits and historical-match labels. Star and octagon is intermediate. The ten-fold rectangular study stays; authentic Darb-e Imam research stays in Upcoming. Approval to teach a drawing is separate from verifying its match to a monument. Future community contributions are part of the owner’s longer-term plan.',
      link: { label: 'See the library', href: '/#/' },
    },
    {
      title: 'Jali: material textures',
      text: 'Finish buttons now preview and apply stone pores/veins, wood grain and brushed or hammered metal. Texture colors follow your framework color. I inspected normal and zoomed screenshots on desktop and phone, including dense Bou Inania. The first wood grain was too evenly striped and sandstone too pitted; both were refined. Marble reads most clearly; metal and limestone stay subtle. The openings remain clear. Full tests, lint, typecheck, build and all 24 browser checks pass. Before/after comparisons and close-ups are on the Star and cross card.',
      link: {
        label: 'See the texture screenshots',
        href: '#eight-fold-star-and-cross',
      },
    },
    {
      title: 'Jali: three material families and eleven finishes',
      text: 'At Color, choose Style → Jali. The ink becomes a marble-colored framework with clear openings and a continuous backlit ground. Lattice adjusts its width. Saving, sharing, My designs previews, SVG and PNG keep the style and width; switching to Tiles restores your colors. The owner approved the appearance and the follow-ups on 11 October. Jali finish now has Stone, Wood and Metal families, with eleven finish presets and Custom color in each family. Material buttons show finish swatches directly. One click applies a finish; Custom color opens the native picker directly, and background presets also apply immediately. The material/finish dropdowns and extra color dialog are removed. Reset restores the original stone appearance. Material selection changes only the framework starting color. Saving, sharing, previews and downloads retain the finish. Older designs keep their stone appearance. All 18 Jali browser checks, lint, typecheck, build and the final full test suite pass. See the testing report in Notes.',
      link: {
        label: 'Try Jali at Color',
        href: '/#/eight-fold-star-and-cross/result',
      },
    },
    {
      title: 'UI redesign merged: Islamic geometric atelier',
      text: 'The new look is merged across the entire app. The home page introduces the drafting atelier with the calligraphic Arabic brand mark (تسطير), curated Moroccan dossiers, and a transparent Upcoming Masterwork Queue with CC credits. Draw along, editor, and review were restyled to the unified dark atelier theme, the step colour legend matches the orange and blue drawn elements, and board stability across stages was measured at 0 px movement across desktop, tablet, and mobile.',
      link: { label: 'Explore the atelier', href: '/#/' },
    },
    {
      title: 'Draw along',
      text: 'Every beginner card and the player have a “Draw along” button. You draw the pattern yourself on the left, with the editor’s tools, while the right shows the step as the player draws it; both drawings are the same size and move together. A step is ticked when it is on your board, whichever way you drew it, and Next is always open. “Show me a hint” shows a little more each time, and “Draw it for me” draws the step. After the last step you ink your board; when its pieces match the pattern’s, it becomes one of your patterns and goes on to the wall to colour. Leaving and coming back finds your board as you left it. A test draws all thirteen beginner patterns this way and gets their pieces.',
      link: { label: 'Try it', href: '/#/eight-fold-star-and-cross/draw' },
    },
    {
      title: 'Your own patterns, phase 5: share',
      text: 'A pattern can be kept as a file and opened again from the home page in any browser, and “Copy a share link” at the colour stage puts the pattern with its colours in one address: whoever opens it sees the same wall and can keep a copy. A finished pattern can be sent to us: the learner’s name goes into its credits and the file is ready for the library.',
      link: { label: 'Try it', href: '/#/eight-fold-star-and-cross/result' },
    },
    {
      title: 'Your own patterns, phase 4: building blocks',
      text: 'In the editor, Building blocks adds a few steps at once on a circle: divide it into 4, 6, 8, 12 or 16, the two squares of the eight-pointed star, a ring of touching circles, the square or hexagon tile round it. A block reuses what is already drawn, one Undo takes it out, and learners can save their own steps as a block.',
      link: { label: 'Try it', href: '/#/' },
    },
    {
      title: 'Your own patterns, phase 3: from nothing',
      text: '“New pattern” on the home page opens the editor with only the centre and one point. Symmetry mode turns everything you draw round the centre four to sixteen times, so the eight-fold star and cross takes five clicked steps; our test rebuilds it that way and it passes the same checks as ours.',
      link: { label: 'Try it', href: '/#/' },
    },
    {
      title: 'Your own patterns, phase 2: the editor',
      text: 'On any step of a tutorial, “Make my own copy from here” opens your copy in the editor: compass, ruler and the other tools click only points that exist, each step gets plain words you can edit, broken steps show in red with the reason, and Undo works. You choose the tile, ink the lines (their symmetric copies follow), and press Play to watch and colour your pattern like any tutorial. Your patterns are on the home page under My patterns.',
      link: { label: 'Try it', href: '/#/eight-fold-star-and-cross' },
    },
    {
      title: 'Your own patterns, phase 1: My designs',
      text: 'At the ink and color stages, “Save as my design” asks for a name in the page and keeps your inking, colors, wall style and grout in this browser. The home page then shows a “My designs” shelf above the patterns, each design drawn as its wall; clicking one opens its tutorial at the wall just as you left it, with “Save” to update it and “Save as new” to keep both. Each card can be renamed, or deleted after it asks. To try it, open the Comares bath stars, go to Ink, click “Make your own”, erase a few lines, recolor a piece at Color, save it as “Test”, then go back to all patterns.',
      link: { label: 'Try it', href: '/#/alhambra-bath-stars/result' },
    },
    {
      title: 'Bou Inania: the whole panel, overlapping its neighbours',
      text: 'The ink stage now traces the whole square panel with its band on all four sides, and the panels around it slide out overlapping it by one band; the repeating tile and the coloring are unchanged. The dotted outline appears before the first line, so you see where each line stops. The tracing is faster: every pattern\u2019s ink, pauses included, fits in about eight seconds.',
      link: { label: 'Try it', href: '/#/bou-inania-rosette' },
    },
    {
      title: 'Clearer dots, a guided ink, and a faster player',
      text: 'New points and lines are blue and what a step works from is saffron, with no rings; on Next the last step’s blue turns saffron (or grey) and a key under each step says what the colours mean. The tile step draws only the tile. The ink stage is a guided tracing: for each line, its turning points appear, the ruler comes down and the pen joins them, from the centre out; the tiles around it appear at the end. Big patterns no longer freeze: Bou Inania’s repeat went from a 3.4 s freeze to smooth, the color stage from 1.2 s, and camera moves run at full frame rate.',
      link: { label: 'Try it', href: '/#/bou-inania-rosette' },
    },
    {
      title: 'Calmer, more natural drawing',
      text: 'The view no longer zooms in and out: each step shows everything drawn so far and only widens, smoothly, when the drawing grows. Ruler lines grow outward from the point they are ruled through; a step with many lines draws them round the centre in turn. The ink starts at the centre and works outward ring by ring, so a star closes before the next ring. On the tile step the tile’s own ink appears first, then its neighbours one by one. The tile border is dotted.',
      link: { label: 'Try it', href: '/#/twelve-fold-rosette-mian' },
    },
    {
      title: 'A new look for the whole app',
      text: 'The drawing sits on a pale plaster plate in a deep lapis frame; saffron marks what is happening now. The home page opens with a pattern drawing itself and three plain sentences on how it works, then the patterns as a tiled wall you can filter by tradition and level. In a tutorial, the left column shows every step and the ink, repeat and color stages, and you can click any of them; the settings sit in one menu; at the color stage the wall tools and colors are on the right. On a phone, Back and Next stay at the bottom.',
      link: { label: 'See it', href: '/#/' },
    },
    {
      title: 'Two ways in from the home page, and photos at full size',
      text: 'Each card has “Watch it drawn” (from step 1) and “Result and original” (straight to the finished wall with the photo beside it; the address is #/<id>/result). Click the photo to see it over the whole page, fitted or at actual size. Tutorials with free photos ship open-licensed photographs at full resolution.',
      link: { label: 'Try it', href: '/#/alhambra-leones-fret/result' },
    },
    {
      title: 'Compare with the original',
      text: 'A button at the color stage shows the photo of the real pattern beside the wall. Seven Alhambra tutorials ship verified free open-licensed photos; the remaining four use private reference photos on the dev server.',
      link: { label: 'Try it', href: '/#/alhambra-arrayanes-squares' },
    },
    {
      title: 'Clearer steps, all six changes',
      text: 'No more steps full of red dots (seventeen marking steps hidden in sixteen tutorials, the new Alhambra ones included); four colours with one meaning each and no point codes unless you tick Show names; an Ink menu at the top to ink at the end or as you go; long Bou Inania steps played in parts (“Step 11 · 2 of 4”); the next tiles in blue on the tile step; and each step zooms to where it works, then widens.',
      link: { label: 'Bou Inania rosette', href: '/#/bou-inania-rosette' },
    },
    {
      title: 'Framed stars of the Salón de Comares',
      text: 'A new advanced tutorial: a framed honey star, teal stars and diamonds in interlaced bands, checked against the photo of the panel.',
      link: { label: 'Open it', href: '/#/alhambra-comares-frames' },
    },
    {
      title: 'Twelve-pointed stars of the Sala de los Reyes',
      text: 'A new tutorial on a hexagonal tile: black twelve-pointed stars with blue, honey and teal tiles round them, matching the photo of the panel.',
      link: { label: 'Open it', href: '/#/alhambra-reyes-dodecagrams' },
    },
    {
      title: 'Carved fret of the Sala de los Reyes',
      text: 'A new advanced tutorial: a pinwheel of bars and frets on sixths of OA, every diamond matching the photo of the panel.',
      link: { label: 'Open it', href: '/#/alhambra-reyes-fret' },
    },
    {
      title: 'Squares and stars of the Patio de los Arrayanes',
      text: 'A new beginner tutorial, built to the photo of the real dado, which has smaller squares than the published drawing.',
      link: { label: 'Open it', href: '/#/alhambra-arrayanes-squares' },
    },
    {
      title: 'Pinwheel fret of the Patio de los Leones',
      text: 'A new tutorial: frets hooking round eight-pointed stars, all turning one way. It matches the carved panel line for line.',
      link: { label: 'Open it', href: '/#/alhambra-leones-fret' },
    },
    {
      title: 'Stars of the Sala de la Barca',
      text: 'A second design from the Comares bath construction, one step longer, checked against a photo of the panel.',
      link: { label: 'Open it', href: '/#/alhambra-barca-stars' },
    },
    {
      title: 'Stars of the Sala de los Reyes',
      text: 'A new tutorial: eight-pointed stars round octagons and crosses, checked piece for piece against a photo of the panel.',
      link: { label: 'Open it', href: '/#/alhambra-reyes-stars' },
    },
    {
      title: 'The Comares dado',
      text: 'A new beginner tutorial: octagons, long hexagons and crosses of small squares, one length found with a single line. Checked against a photo of the real dado.',
      link: { label: 'Open it', href: '/#/alhambra-comares-dado' },
    },
    {
      title: 'Interlaced stars of the Comares bath',
      text: 'A new Alhambra tutorial from Brian Wichmann’s exact drawing, checked against a photo of a carved panel with the same design. Each band is a side of a large or small eight-pointed star.',
      link: { label: 'Open it', href: '/#/alhambra-bath-stars' },
    },
    {
      title: 'Second Ibn Tulun grille: parked',
      text: 'A new design found on Commons (star openings, rhombi, and long openings that meet in threes like cubes). The photo is straightened, but the openings are deep and their inner walls hide the bands, so I parked it with notes rather than guess.',
    },
    {
      title: 'Design H3: another minbar, same design',
      text: 'The minbar of al-Nasir Muhammad in the Citadel has the same design as the al-Maridani minbar, so Samira Mian’s stellated rosettes now have two real examples. No new twelve-fold wood design turned up.',
      link: { label: 'See the card', href: '#design-h1' },
    },
    {
      title: 'Design H2: minbar doors from Cairo',
      text: 'A new tutorial, checked against the Metropolitan Museum’s photo: Samira Mian’s rosette on a hexagonal repeat, inked as on the doors, with a triangle between every three rosettes.',
      link: { label: 'Open it', href: '/#/minbar-doors-cairo' },
    },
    {
      title: 'Design H1: the al-Maridani minbar',
      text: 'It is Samira Mian’s stellated rosettes, already in the library: every carved inlay on the photo lies in one of its pieces. The tutorial now credits the minbar and is marked verified.',
      link: { label: 'See the card', href: '#design-h1' },
    },
    {
      title: 'Bou Inania rosette, her way',
      text: 'Fourteen steps; the tile copies overlap by one band; an eight-pointed star at each corner with four identical pieces round it.',
      link: { label: 'Open it', href: '/#/bou-inania-rosette' },
    },
    {
      title: 'Samira Mian’s stellated rosettes',
      text: 'Her activity 8 in the library: rosettes in square cells, hexagons and an octagon at the corners.',
      link: { label: 'Open it', href: '/#/mian-stellated-rosettes' },
    },
    {
      title: 'Design E rebuilt her way',
      text: 'Fifteen sets of twelve lines, each through a corner already drawn; 21 steps; the same wall.',
      link: {
        label: 'Bou Inania wall',
        href: '/#/bou-inania-twelve-fold-wall',
      },
    },
    {
      title: 'Inking with a ruler, and the tile in green',
      text: 'As you suggested: the ink is drawn one ruler line at a time (a pale blue ruler shows where it lies), parallel lines one after the other with the partner flashing blue, then the short joining stretches. The tile outline is traced in green at the end of the ink, every copy carries it in the repeat, and it fades once the wall is built.',
      link: { label: 'Try it', href: '/#/twelve-fold-rosette-mian' },
    },
    {
      title: 'Samira Mian’s rosette, fixed',
      text: 'No triangle bases; outline lines carried to the tile edge; square and hexagonal tiles, both matching hers line for line.',
      link: { label: 'Square tile', href: '/#/twelve-fold-rosette-mian' },
    },
    {
      title: 'Design E: the Fès wall, built',
      text: 'A 25-step tutorial of the Bou Inania wall, read from the photo and fitted to it; on the color stage choose Strapwork to see it like the real wall. Waiting for your judgement (question at the top).',
      link: {
        label: 'Bou Inania twelve-fold wall',
        href: '/#/bou-inania-twelve-fold-wall',
      },
    },
    {
      title: 'Colors by placement',
      text: 'Pieces of the same shape can now take different colors by their direction and their place in the wall. Comares bones are colored like the photo (white across; black, teal and brown standing up), and the Infantas plaster stars in four colors. Click a piece in the color stage and tick “Only pieces placed like this one” to recolor just those.',
      link: { label: 'Comares bones', href: '/#/alhambra-comares-bones' },
    },
    {
      title: 'The two “cannot be played” errors',
      text: 'Fixed. The dev server was not watching the engine and schema folders, so it kept an old copy of the tutorial format that did not know the new colors. It now watches them, and it restarted itself with the fix.',
    },
    {
      title: 'Hand-drawn transitions',
      text: 'Ink is drawn line by line along each path (red while drawing, black when done, no pen dot); the repeat copies the tile along a row, then copies the row up and across (showing the shift when rows are shifted); color is painted one color at a time from the centre out.',
      link: {
        label: 'Eight-fold zellige wheel, shifted rows',
        href: '/#/kurt-eight-fold-zellige-shifted',
      },
    },
    {
      title: 'Design C with shifted rows',
      text: 'Rows of Kurt’s wheels shifted by half a wheel and moved closer, to 2√2 − 1 apart, so the wheels nest.',
      link: {
        label: 'Eight-fold zellige wheel, shifted rows',
        href: '/#/kurt-eight-fold-zellige-shifted',
      },
    },
    {
      title: 'Design E: reading the photo',
      text: 'The Bou Inania wall turned out to be twelve-fold, not sixteen-fold. I averaged every rosette, corner and edge of the photo into one sharp tile, and fitted the rosette exactly: every line at a multiple of 15°, tied to the tile by two crossings, buildable by ruler and compass, within a seventh of a band’s width of the photo. The centre star is decided too.',
      link: { label: 'Design E card', href: '#sixteen-fold-rosette' },
    },
  ],
  now: {
    title: 'Tiling Search 45° tilings (your request while away, 25 October)',
    text: 'Of the 161 tilings on the list, we had 4. Seven new ones are built so far, each checked against Wichmann’s drawing: the Mexuar porch fret and corridor stars, the Alhambra Museum loops, the Shah-i-Zinda and Qaytbay octagons, the Sırçalı stars and the Topkapı pinwheel. Variations of one design now share one library card, with a Variations switch at the top of the pattern (try the Sala de los Reyes fret). The way to read Wichmann’s drawings exactly was found today: every corner lies on a grid of whole numbers and halves of √2, so the proportions come out exact. More batches follow; the full comparison is in the notes.',
    link: {
      label: 'Tiling Search notes',
      href: '#/notes/tilingsearch-45',
    },
  },
  next: [
    {
      title: 'Feedback: production acceptance and optional direct agent access',
      text: 'The migration and Cloudflare widget are ready. Add your contact email, copy the prepared feedback settings into Vercel Production, verify private storage and cleanup, then enable reporting and send a real browser report. Follow the guide and observe a week of usage. F7 can later add report-specific, revocable agent grants.',
      link: {
        label: 'Turn on feedback: your remaining steps',
        href: '#/notes/feedback-go-live',
      },
    },
    {
      title: 'AI agent: broader live evaluation and local release',
      text: 'Exercise more original construction requests and recovery cases, then finish account recovery, credential storage and local packaging. The chat and normal drawing/coloring tools are implemented; the wider generation evaluation remains.',
      link: { label: 'Read the remaining phases', href: '/#/notes/agent' },
    },
    {
      title: 'Ink in under a second',
      text: 'Pressing Ink in draw along on Bou Inania now takes about a third of the time it did, but still around three seconds on a slow machine. The goal is under one second on both Bou Inania tutorials.',
    },
    {
      title: 'Your answers on four wall styles',
      text: 'Gemini added six wall styles without asking. Jali and interlace are built; I recommend dropping the other four (illumination, carved stucco, wood marquetry, blueprint) because they are skins that teach nothing about the geometry. Say if you want any of them.',
    },
    {
      title: 'More designs per family',
      text: 'At least one more for each family: an Alhambra panel from Wichmann’s line drawings, an Ibn Tulun window grille with a published construction, and an eight-fold variant, each with a photo.',
    },
    {
      title: 'Córdoba Synagogue, one more try',
      text: 'The geometry is solved; choosing which bits of line are inked is not. One more attempt with the method in my notes; if it fails I will ask you whether a simpler Córdoba design is acceptable.',
    },
  ],
  waiting: [
    {
      title: 'Hosted ChatGPT sign-in: confirm the OpenAI website registration',
      text: 'The hosted Studio sign-in code is prepared, with explicit linking from your existing owner account. It stays off until the provisioned OpenAI client ID, registered callback and authentication method are configured. OpenAI approval and a real hosted sign-in have not been verified. This identity login does not enable the in-app chatbot; hosted ChatGPT-plan usage needs separate partner access. The local assistant remains available with pnpm dev:agent.',
      link: {
        label: 'ChatGPT setup: direct links and step-by-step actions',
        href: '#/notes/chatgpt-hosted',
      },
    },
    {
      title: 'H6 and H5: Studio checks',
      text: 'H6 waits only on a week of free-plan use (read around 29 October), and H5 on the export check you moved to later.',
      link: {
        label: 'Read the hosted Studio acceptance checks',
        href: '#/notes/studio-hosted',
      },
    },
    {
      title: 'Alhambra interlace',
      text: 'Needs a better source than the product page: a photo or drawing of the whole panel.',
    },
    {
      title: 'Alhambra rosette’s real repeat',
      text: 'Needs a photo of the ceiling or wall around the rosette, to see how it repeats.',
    },
  ],
};
