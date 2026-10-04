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
    id: 'alhambra-star-and-arrows',
    title: 'Alhambra star and arrows',
    fold: 8,
    status: 'decided',
    decision:
      'You: keep the guessed square repeat, and try rows shifted by half a rosette. Done: the shifted version is in the library as “Alhambra star and arrows, shifted rows” (see the new question). Your photo’s design B could not be identified beyond the product page; it stays on my list.',
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
    status: 'decide',
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
    id: 'eight-fold-zellige',
    title: 'Eight-fold rosette (existed before tonight)',
    fold: 8,
    status: 'decided',
    decision:
      'You: keep both. Keeping our Design D as it is (fixing the notes that wrongly tied it to Sandy Kurt) and building her Design C as a new tutorial, credited to her.',
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
      'You: build E too. Keeping F as the beginner version and building the full Bou Inania wall E as a new advanced tutorial.',
    summary:
      'A sixteen-pointed star ringed by sixteen petals, rosettes touching on a square grid.',
    story: [
      'This tutorial was already in the app. Compared with a real sixteen-fold zellige wall at the Bou Inania madrasa in Fès (first picture), the rosette itself is plausible, but the real wall is much richer: the space between rosettes is filled with further rings, small stars and octagons, where ours leaves one large plain piece.',
    ],
    pictures: [
      {
        src: 'renders/sixteen-fold-rosette/compare-wall.png',
        caption:
          'Left: zellige at the Bou Inania madrasa, Fès. Right: our wall. The rosettes are alike; the ground between them is not.',
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
    status: 'decide',
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
    status: 'decide',
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
    status: 'decide',
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
    status: 'decide',
    summary:
      'Notched four-pointed stars from a carved plaster panel in the Torre de las Infantas, on the same grid as the Infantas crosses.',
    story: [
      'Same source and same six opening steps as the Infantas crosses; only the inked lines differ. Our wall matches the article’s tracing exactly (first picture: our lines in red over the tracing in black).',
      'The article prints no photo of this panel, and the photos of the tower I found do not show its tiles, so I cannot check the tracing against the real wall myself.',
    ],
    pictures: [
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
    status: 'decide',
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
        src: 'renders/alhambra-comares-bones/wall.png',
        caption: 'Our wall: one bone shape, two per tile.',
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
export const QUESTIONS: readonly Question[] = [
  {
    id: 'design-a-shifted',
    text: 'Design A with your shifted rows (right) only closes up if I add a straight band between the rows. Keep this version too?',
    choices: [
      'Keep both repeats',
      'Keep only the shifted one',
      'Keep only the square one',
    ],
    pictures: [
      {
        src: 'renders/alhambra-star-and-arrows-shifted/designs-A2.png',
        caption:
          'Left: the square repeat. Right: rows shifted by half a rosette; the long horizontal lines between rows are the band I added.',
      },
    ],
    card: 'alhambra-star-and-arrows',
  },

  {
    id: 'designs-i-l',
    text: 'Designs I–M match published tracings of Alhambra panels line for line, but I found no photos of the real tiles. Keep them on the strength of the tracings?',
    choices: ['Keep all four', 'Only with photos', 'Remove them'],
    pictures: [
      {
        src: 'renders/alhambra-comares-stars/designs-I-M.png',
        caption:
          'Top: the article’s tracings. Bottom: our walls. Each card below shows ours drawn in red over the tracing.',
      },
    ],
    card: 'alhambra-comares-stars',
    also: [
      'alhambra-infantas-crosses',
      'alhambra-infantas-stars',
      'alhambra-comares-lattice',
      'alhambra-mexuar-stars',
    ],
  },
  {
    id: 'design-h',
    text: 'Design H matches its tutorial, but I found no building with it. Keep it as a beginner exercise or remove it?',
    choices: ['Keep it', 'Remove it'],
    pictures: [
      {
        src: 'renders/twelve-fold-dodecagrams/design-H.png',
        caption: 'Design H',
      },
    ],
    card: 'twelve-fold-dodecagrams',
  },
];
