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
    id: 'photos-of-originals',
    title: 'Compare with the original (new)',
    fold: 4,
    status: 'decided',
    decision:
      'You: ship free photos wherever possible; use the others on the dev server only, with a placeholder in the built app until a free one is found. Done for the eleven tutorials added on 5–6 October.',
    summary:
      'At the color stage, “Compare with the original” shows a photo of the real pattern beside the wall, with its photographer and licence.',
    story: [
      'Five tutorials have free photos that ship with the app: the Arrayanes squares, the Comares dado and the Sala de los Reyes twelve-pointed stars (Wikimedia Commons, Creative Commons), the minbar doors (the Met, public domain) and the stellated rosettes (two Cairo minbars, public domain and CC BY). I checked the two Alhambra photos by laying our lines over them, as with Wade’s; the Sala de los Reyes photo is taken at an angle and was matched by eye.',
      'Six still use David Wade’s photos: the bath stars, Barca stars, Leones fret, Reyes stars, Reyes fret and Comares frames. You see them on the dev server; the built app shows “A photo of the real pattern is to come” with a link to Wade’s site. They are on the queue to find free photos for.',
      'One thing to judge: some walls are turned 45° from the photo (the Arrayanes squares and the Leones fret, for example), because the tutorial puts the grid along the axes. If that makes comparing hard, I can turn the photo to match.',
    ],
    pictures: [],
    asks: [],
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
export const QUESTIONS: readonly Question[] = [];

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
  updated: '6 October 2026',
  goal: 'Build the queue of pattern tutorials: every family with several real, verified designs, each drawn step by step with ruler and compass, and the player showing them well.',
  done: [
    {
      title: 'A new look for the whole app',
      text: 'The drawing sits on a pale plaster plate in a deep lapis frame; saffron marks what is happening now. The home page opens with a pattern drawing itself and three plain sentences on how it works, then the patterns as a tiled wall you can filter by tradition and level. In a tutorial, the left column shows every step and the ink, repeat and color stages, and you can click any of them; the settings sit in one menu; at the color stage the wall tools and colors are on the right. On a phone, Back and Next stay at the bottom.',
      link: { label: 'See it', href: '/#/' },
    },
    {
      title: 'Two ways in from the home page, and photos at full size',
      text: 'Each card has “Watch it drawn” (from step 1) and “Result and original” (straight to the finished wall with the photo beside it; the address is #/<id>/result). Click the photo to see it over the whole page, fitted or at actual size. The free photos now ship at their full resolution (up to 4032 px), and the Leones fret has a free Flickr photo (CC BY-SA), so five tutorials still wait for one.',
      link: { label: 'Try it', href: '/#/alhambra-leones-fret/result' },
    },
    {
      title: 'Compare with the original',
      text: 'A button at the color stage shows the photo of the real pattern beside the wall. Five tutorials have free photos that ship; six show Wade’s photos on the dev server only, with a placeholder in the built app.',
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
    title: 'Overnight run finished (6 October, 8 am)',
    text: 'Eight new Alhambra tutorials, each checked against David Wade’s photo of the real panel, plus the minbar doors from Cairo. Two Alhambra designs were parked because the photo shows a different panel from the published drawing. Each new tutorial has a card below.',
  },
  next: [
    {
      title: 'More designs per family',
      text: 'At least one more for each family: an Alhambra panel from Wichmann’s line drawings, an Ibn Tulun window grille with a published construction, and an eight-fold star-and-octagon variant, each with a photo.',
    },
    {
      title: 'Inking along a line',
      text: 'A small format change: an ink path can name a line and the two lines it runs between, so tutorials no longer need steps that only mark turning points (the four-fold ring has two such steps, 360 marks).',
    },
    {
      title: 'Córdoba Synagogue, one more try',
      text: 'The geometry is solved; choosing which bits of line are inked is not. One more attempt with the method in my notes; if it fails I will ask you whether a simpler Córdoba design is acceptable.',
    },
  ],
  waiting: [
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
