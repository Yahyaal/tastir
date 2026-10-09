import type { Photo } from '@tastir/schema';
export type UpcomingPhase =
  'Phase 1 · Immediate' | 'Phase 2 · Classical' | 'Phase 3 · Monumental';

export type UpcomingStatus = 'Playable now' | 'Planned' | 'Researching';

export interface DrawingStep {
  readonly step: number;
  readonly title: string;
  readonly instruction: string;
  readonly geometry: string;
}

export interface UpcomingPattern {
  readonly id: string;
  readonly title: string;
  readonly arabicTitle: string;
  readonly fold: number;
  readonly foldLabel: string;
  readonly style: string;
  readonly period: string;
  readonly monument: string;
  readonly location: string;
  readonly medium: string;
  readonly phase: UpcomingPhase;
  readonly status: UpcomingStatus;
  readonly summary: string;
  readonly constructionNotes: string;
  readonly photo?: Photo;
  readonly photoUrl?: string;
  readonly photoCaption?: string;
  readonly drawnUrl?: string;
  readonly drawnCaption?: string;
  readonly drawingSteps: readonly DrawingStep[];
  readonly source: {
    readonly name: string;
    readonly url?: string;
    readonly citation?: string;
  };
}

export function upcomingPhotoSrc(
  photo: Photo,
  dev: boolean = import.meta.env.DEV,
): string | undefined {
  const name = photo.file.replace(/^upcoming\//, '');
  if (!photo.private) return `${import.meta.env.BASE_URL}upcoming/${name}`;
  return dev ? `/__review/research/upcoming/${name}` : undefined;
}

export function upcomingDrawnSrc(
  drawnUrl?: string,
  dev: boolean = import.meta.env.DEV,
): string | undefined {
  if (!drawnUrl) return undefined;
  const name = drawnUrl.replace(/^upcoming\//, '');
  return dev ? `/__review/research/upcoming/${name}` : undefined;
}

export const UPCOMING_PATTERNS: readonly UpcomingPattern[] = [
  // --- PHASE 1: IMMEDIATE / HIGH PRIORITY ---
  {
    id: 'mian-stellated-hex',
    title: 'Stellated Twelvefold Rosette in a Hexagonal Arrangement',
    arabicTitle: 'خاتم الاثني عشر المجنح بسداسي التكرار',
    fold: 12,
    foldLabel: '12-fold',
    style: 'Mamluk',
    period: '1340 CE',
    monument:
      'Minbar of Amir Altunbugha al-Maridani & Mosque of al-Nasir Muhammad',
    location: 'Cairo, Egypt',
    medium: 'Woodwork with ivory & ebony inlay',
    phase: 'Phase 1 · Immediate',
    status: 'Researching',
    summary:
      'The missing honeycomb counterpart to the al-Maridani square tiling. Six stellated rosettes surround one central rosette, creating secondary 6-pointed star interstitial lattices and delicate ivory darts.',
    constructionNotes:
      'Builds from a central 24-divided circle with overlapping hexagons, extending petal lines outwards to intersect in 12-pointed star points and hexagonal tile boundary crossings.',
    photo: {
      file: 'mian-stellated-hex-photo.jpg',
      caption:
        'Historical 1340 CE Mamluk minbar woodwork with ivory inlay, Mosque of Amir Altunbugha al-Maridani, Cairo',
      creator: 'Unknown photographer',
      license: 'Public domain',
      url: 'https://commons.wikimedia.org/wiki/File:Ca%C3%AFro._Amir_al-Maridani-moskee_Minbar_Detail_van_het_houten_maaswerk,_GDE002950.jpg',
    },
    drawnUrl: 'upcoming/mian-stellated-hex-drawn.png',
    drawnCaption:
      'Finished hexagonal tiling render generated in the Tastir atelier',
    drawingSteps: [
      {
        step: 1,
        title: 'Base Circle & 12 Division Points',
        instruction:
          'Rule circle c about centre O with radius R and draw horizontal diameter. Swing compass radius R from the intersection points to divide the circumference into 12 equal points at 30\u00b0 spacing.',
        geometry: '12 vertices on perimeter, \u03b8 = 30\u00b0 radial spacing',
      },
      {
        step: 2,
        title: 'Dual Overlapping Hexagons & 15\u00b0 Rays',
        instruction:
          'Construct two nested regular hexagons to locate intermediate 15\u00b0 rays. Inscribe outer boundary circle co and inner reference circle ci tangent to the hexagonal chords.',
        geometry:
          'Rays at 15\u00b0 increments, inner radius ci = R \u00b7 cos(30\u00b0) \u00b7 tan(15\u00b0)',
      },
      {
        step: 3,
        title: '12-Pointed Stellated Star Rosette',
        instruction:
          'Rule 12 star rays connecting circumference division points through the inner circle crossing points, forming 12 acute star points and surrounding kite facets.',
        geometry: '12 star tips at r = 1.0, 12 valleys at r = 0.5176',
      },
      {
        step: 4,
        title: 'Hexagonal Honeycomb Tile Boundary',
        instruction:
          'Construct a regular hexagon tangent to the circle at 6 points. Extend star points to meet at the hexagon corners, creating secondary 6-pointed florets where three tiles meet.',
        geometry:
          'Regular hexagon cell, side length s = 2/\u221a3 R, area = 2\u221a3 R\u00b2',
      },
    ],

    source: {
      name: 'Samira Mian: Twelvefold Rosette, Activity 9',
      url: 'https://www.samiramian.uk/twelvefoldrosette',
      citation: 'YouTube Activity 9 / Minbar of Masjid Altinbugha al-Maridani',
    },
  },
  {
    id: 'darb-e-imam-decagram',
    title: 'Darb-e Imam Decagram & Girih Tiling',
    arabicTitle: 'عقدة الإمام العشري وتجريد الجريه',
    fold: 10,
    foldLabel: '10-fold',
    style: 'Timurid / Persian',
    period: '1453 CE',
    monument: 'Darb-e Imam Shrine Portal',
    location: 'Isfahan, Iran',
    medium: 'Cut-tile glazed mosaic (haft-rangi & moarraq)',
    phase: 'Phase 1 · Immediate',
    status: 'Researching',
    summary:
      'Centered on a 10-pointed star with concentric rings of pentagons, bowties, and decagons. Researching authentic girih construction.',
    constructionNotes:
      'Constructed using golden-ratio circle divisions (36° intervals) with nested decagons and pentagonal compass crossings.',
    photo: {
      file: 'darb-e-imam-portal.jpg',
      caption:
        'Historic 1453 CE portal of the Darb-e Imam shrine complex, Isfahan, featuring 10-fold Girih tilework',
      creator: 'Peter J. Lu',
      license: 'All rights reserved',
      url: 'https://doi.org/10.1126/science.1135491',
      private: true,
    },
    drawnUrl: 'upcoming/darb-e-imam-decagram-drawn.png',
    drawnCaption:
      'Finished 10-fold Girih decagram tiling render in the Tastir atelier',
    drawingSteps: [
      {
        step: 1,
        title: 'Euclidean Golden Section & 10 Points',
        instruction:
          'Draw base circle c about O and rule perpendicular axes. Find midpoint M(-0.5, 0), swing arc through (0, 1) down to horizontal axis at golden section point F = (\u221a5 - 1)/2. Step distance OF around circumference to obtain 10 exact points.',
        geometry:
          'Golden ratio \u03c6 = (\u221a5 + 1)/2, chord length = 2 \u00b7 sin(18\u00b0) = \u03c6 - 1',
      },
      {
        step: 2,
        title: '{10/3} Star Chords & Girih Decagram',
        instruction:
          'Rule 10 chords connecting each vertex Pi to Pi+3 (skipping 2 vertices, 108\u00b0 apart). Their intersections form the central 10-pointed star with sharp 36\u00b0 points.',
        geometry:
          '10-pointed star polygon {10/3}, inner crossing radius r = 0.5257 R',
      },
      {
        step: 3,
        title: 'Surrounding Kites & Interstitial Bowties',
        instruction:
          'Rule decagon perimeter chords. Trace star lines outward to form 10 surrounding kites, 10 interstitial darts, and elongated hexagons (Shesh Band).',
        geometry:
          'Concentric decagon side s = 2 \u00b7 sin(18\u00b0), kite angle = 72\u00b0',
      },
      {
        step: 4,
        title: 'Rectangular Periodic Tile Closure',
        instruction:
          'Establish rectangular tile corners at outer crossings 54\u00b0, 126\u00b0, 234\u00b0, and 306\u00b0. The width w = \u221a5 and height h = \u221a(5 + 2\u221a5) allow periodic plane tiling with 10-fold core symmetry.',
        geometry:
          'Rectangular cell w = 2.236 R, h = 3.078 R, area = 6.882 R\u00b2',
      },
    ],

    source: {
      name: 'Lu & Steinhardt (Science 2007) / Peter J. Lu',
      url: 'https://doi.org/10.1126/science.1135491',
      citation:
        'Decagonal and Quasi-crystalline Tilings in Medieval Islamic Architecture',
    },
  },
  {
    id: 'qaytbay-minbar-decagram',
    title: 'Minbar of Sultan Qaytbay Ten-Fold Rosette',
    arabicTitle: 'خاتم منبر السلطان قايتباي العشري',
    fold: 10,
    foldLabel: '10-fold',
    style: 'Mamluk',
    period: '1474 CE',
    monument: 'Complex of Sultan al-Ashraf Qaytbay',
    location: 'Northern Cemetery, Cairo, Egypt',
    medium: 'Inlaid ebony, ivory, and polished hardwood',
    phase: 'Phase 1 · Immediate',
    status: 'Researching',
    summary:
      'Classic late Mamluk decagram woodwork medallion with radiating interlacing ribbons, delicate almond shields, and fine inlaid ivory stars.',
    constructionNotes:
      'Drawn via 10-fold radial division; the star lines cross at 72° to produce regular 10-pointed stars framed by alternating kites and pentagram facets.',
    photo: {
      file: 'qaytbay-minbar-decagram.jpg',
      caption:
        'Monumental ivory-inlaid minbar woodwork of Sultan al-Ashraf Qaytbay (1474 CE), Cairo',
      creator: 'Victoria and Albert Museum',
      license: 'All rights reserved',
      url: 'https://collections.vam.ac.uk/item/O89010/',
      private: true,
    },
    drawingSteps: [
      {
        step: 1,
        title: 'Decagonal Radial Framework',
        instruction:
          'Rule base circle and orthogonal diameters. Divide circle into 10 equal sectors of 36\u00b0 using compass golden-ratio bisection.',
        geometry: '10 radial vertices, \u03b8 = 36\u00b0',
      },
      {
        step: 2,
        title: 'Primary Decagram Chords',
        instruction:
          'Rule chords skipping 2 points to generate the {10/3} star polygon; intersect with radial spokes to define strapwork ribbon paths.',
        geometry:
          '{10/3} decagram, tip angle 36\u00b0, internal crossing angle 72\u00b0',
      },
      {
        step: 3,
        title: 'Girih Strapwork & Secondary Facets',
        instruction:
          'Extend star lines to construct surrounding pentagons, bowties, and lozenges according to traditional Girih tile angles (72\u00b0 and 144\u00b0).',
        geometry:
          'Girih tiles: decagon, pentagon, bowtie, rhombus, elongated hexagon',
      },
      {
        step: 4,
        title: 'Panel Boundary & Seamless Seams',
        instruction:
          'Align strapwork terminals with the modular panel frame, ensuring ribbons cross tile seams at perpendicular angles for continuous interlace.',
        geometry: 'Over-and-under ribbon interlace, uniform band width',
      },
    ],

    source: {
      name: 'Victoria and Albert Museum (V&A 1050-1869) & Creswell Archive',
      url: 'https://collections.vam.ac.uk/item/O89010/',
      citation: 'Minbar panel from the Mosque of Qaytbay, Cairo',
    },
  },
  {
    id: 'generalife-ceiling-octagons',
    title: 'Generalife Palace Ceiling Octagonal Coffers',
    arabicTitle: 'سقف جنة العريف بالنجوم المثمنة',
    fold: 8,
    foldLabel: '8-fold',
    style: 'Nasrid',
    period: '1319 CE',
    monument: 'Palacio del Generalife',
    location: 'Granada, Spain',
    medium: 'Carved & polychrome cedar wood (carpintería de lo blanco)',
    phase: 'Phase 1 · Immediate',
    status: 'Researching',
    summary:
      'A modular coffered woodwork ceiling alternating bold eight-pointed Khatam stars and raised octagonal frames, celebrating rhythm and shadow.',
    constructionNotes:
      'Square grid with octagons tangent to unit cell boundaries; four-pointed stars form in the corner interstices.',
    photo: {
      file: 'generalife-ceiling-octagons.jpg',
      caption:
        'Nasrid woodwork ceiling with octagonal geometric coffers, Palacio del Generalife, Granada',
      creator: 'David Wade',
      license: 'All rights reserved',
      url: 'http://www.patterninislamicart.com/drawings-diagrams-analyses/1-wade-analyses/spa-spain/spa-0305',
      private: true,
    },
    drawingSteps: [
      {
        step: 1,
        title: 'Orthogonal & Diagonal Axis Matrix',
        instruction:
          'Draw base circle with radius R. Rule horizontal and vertical axes, then bisect each 90\u00b0 quadrant to establish 8 equal 45\u00b0 sectors.',
        geometry: '8 perimeter division points, \u03b8 = 45\u00b0',
      },
      {
        step: 2,
        title: '8-Pointed Khatam Star ({8/3})',
        instruction:
          'Connect alternate vertices to form two concentric squares rotated by 45\u00b0, producing the classical 8-pointed star (Khatam / Seal of Solomon).',
        geometry:
          'Octagram {8/3}, tip angle 45\u00b0, inner radius r = R \u00b7 (\u221a2 - 1)',
      },
      {
        step: 3,
        title: 'Radiating Kites & Cruciform Links',
        instruction:
          'Extend star chords outward beyond the star tips to intersect flanking rays, creating radiating kites and secondary cruciform connecting bridges.',
        geometry: 'Kite side angles: 45\u00b0, 90\u00b0, 135\u00b0',
      },
      {
        step: 4,
        title: 'Square Grid Tessellation (p4m)',
        instruction:
          'Inscribe the star within a square unit cell. Replicate the module edge-to-edge; adjacent stars link across tile seams to form secondary 4-pointed stars.',
        geometry:
          'Square cell side s = 2 R, area = 4 R\u00b2, p4m wallpaper group',
      },
    ],

    source: {
      name: 'Wichmann CM026 & David Wade SPA 0305',
      url: 'http://www.patterninislamicart.com/drawings-diagrams-analyses/1-wade-analyses/spa-spain/spa-0305',
      citation: 'Tiling Search drawing CM026 / Wade Analysis SPA 0305',
    },
  },
  {
    id: 'ibn-tulun-second-grille',
    title: 'Mosque of Ibn Tulun Star & Hexagon Window Grille',
    arabicTitle: 'شمسية مسجد ابن طولون السداسية المقرنصة',
    fold: 6,
    foldLabel: '6-fold',
    style: 'Tulunid',
    period: '879 CE',
    monument: 'Mosque of Ahmad Ibn Tulun',
    location: 'Cairo, Egypt',
    medium: 'Carved openwork stucco (yesería)',
    phase: 'Phase 1 · Immediate',
    status: 'Researching',
    summary:
      'Among the earliest surviving pierced geometric stucco grilles in the Islamic world. A 6-pointed star with deep bevelled openings and interlocking hexagonal rosettes.',
    constructionNotes:
      'Hexagonal grid based on equilateral triangles; each star is inscribed within a circle whose circumference defines the flanking rhombi.',
    photo: {
      file: 'ibn-tulun-second-grille.jpg',
      caption:
        '9th-century carved stucco window grille, Mosque of Ahmad Ibn Tulun, Cairo',
      creator: 'David Wade',
      license: 'All rights reserved',
      url: 'http://www.patterninislamicart.com',
      private: true,
    },
    drawnUrl: 'upcoming/ibn-tulun-grille-drawing.png',
    drawnCaption:
      'Finished 6-fold star and hexagon geometric grille reconstruction',
    drawingSteps: [
      {
        step: 1,
        title: 'Isometric Hexagonal Division',
        instruction:
          'Rule circle with radius R. Step compass radius R around the circumference to mark 6 equal points at 60\u00b0 spacing.',
        geometry: '6 vertices on circle, side length = radius R',
      },
      {
        step: 2,
        title: '6-Pointed Star ({6/2}) Inscription',
        instruction:
          'Connect alternate vertices with straightedge to form two intersecting equilateral triangles (Seal of Solomon / Hexagram).',
        geometry: 'Hexagram {6/2}, inner radius r = R / \u221a3 \u2248 0.577 R',
      },
      {
        step: 3,
        title: 'Hexagonal Satellite Rosettes',
        instruction:
          'Draw surrounding concentric circles centered at each of the 6 vertices; rule lines through intersections to generate interlocking lozenges and stars.',
        geometry: 'Rhombic facets with 60\u00b0 and 120\u00b0 corner angles',
      },
      {
        step: 4,
        title: 'Honeycomb Tiling (p6m)',
        instruction:
          'Frame the unit inside a regular hexagon. Tile edge-to-edge across the plane with zero gaps, forming seamless tri-hexagonal lattices.',
        geometry: 'Hexagonal lattice, p6m symmetry, 3-fold vertex junctions',
      },
    ],

    source: {
      name: 'Wikimedia Commons DSCF3561 / Creswell',
      url: 'https://commons.wikimedia.org/wiki/File:Cairo_-_Ibn_Tulun_Mosque_-_DSCF3561.JPG',
      citation: 'The Architecture of Ibn Tulun, Cairo, 879 CE',
    },
  },
  {
    id: 'humayun-jali-screen',
    title: 'Humayun’s Tomb Eight-Fold Jali Lattice',
    arabicTitle: 'شبكة المشربية المثمنة بضريح همايون',
    fold: 8,
    foldLabel: '8-fold',
    style: 'Mughal',
    period: '1572 CE',
    monument: 'Humayun’s Tomb',
    location: 'Delhi, India',
    medium: 'Pierced red sandstone & white marble (jali)',
    phase: 'Phase 1 · Immediate',
    status: 'Researching',
    summary:
      'Imperial Mughal perforated screen filtering sunlight into ethereal geometric shadows. Eight-pointed stars interlace with cruciform links across an orthogonal matrix.',
    constructionNotes:
      'Continuous interlacing strapwork; all lines run at 45° and 90° angles to create consistent ribbon widths with under-and-over weave.',
    photo: {
      file: 'humayun-jali-screen.png',
      caption:
        'Mughal carved marble jali lattice screen, Tomb of Humayun, Delhi (1570 CE)',
      creator: 'Archaeological Survey of India',
      license: 'All rights reserved',
      url: 'https://whc.unesco.org/en/list/479',
      private: true,
    },
    drawingSteps: [
      {
        step: 1,
        title: 'Orthogonal & Diagonal Axis Matrix',
        instruction:
          'Draw base circle with radius R. Rule horizontal and vertical axes, then bisect each 90\u00b0 quadrant to establish 8 equal 45\u00b0 sectors.',
        geometry: '8 perimeter division points, \u03b8 = 45\u00b0',
      },
      {
        step: 2,
        title: '8-Pointed Khatam Star ({8/3})',
        instruction:
          'Connect alternate vertices to form two concentric squares rotated by 45\u00b0, producing the classical 8-pointed star (Khatam / Seal of Solomon).',
        geometry:
          'Octagram {8/3}, tip angle 45\u00b0, inner radius r = R \u00b7 (\u221a2 - 1)',
      },
      {
        step: 3,
        title: 'Radiating Kites & Cruciform Links',
        instruction:
          'Extend star chords outward beyond the star tips to intersect flanking rays, creating radiating kites and secondary cruciform connecting bridges.',
        geometry: 'Kite side angles: 45\u00b0, 90\u00b0, 135\u00b0',
      },
      {
        step: 4,
        title: 'Square Grid Tessellation (p4m)',
        instruction:
          'Inscribe the star within a square unit cell. Replicate the module edge-to-edge; adjacent stars link across tile seams to form secondary 4-pointed stars.',
        geometry:
          'Square cell side s = 2 R, area = 4 R\u00b2, p4m wallpaper group',
      },
    ],

    source: {
      name: 'Archaeological Survey of India / UNESCO World Heritage 479',
      url: 'https://whc.unesco.org/en/list/479',
      citation: 'Mughal Stone Screens of Delhi & Agra',
    },
  },

  // --- PHASE 2: CLASSICAL ARCHITECTURAL MASTERWORKS ---
  {
    id: 'topkapi-scroll-plate28',
    title: 'Topkapi Scroll Decagonal Star Interlace',
    arabicTitle: 'عقدة لفافة طوب قابي العشارية',
    fold: 10,
    foldLabel: '10-fold',
    style: 'Timurid / Central Asian',
    period: 'Late 15th century',
    monument: 'Topkapi Palace Archives (MS H. 1956)',
    location: 'Istanbul, Turkey / Tabriz or Herat',
    medium: 'Architectural parchment scroll drawing in red & black ink',
    phase: 'Phase 2 · Classical',
    status: 'Planned',
    summary:
      'From the master architectural design manual used by master builders (ustad). Features a central 10-pointed star with radiating 5-pointed star satellites and pentagram loops.',
    constructionNotes:
      'Master scroll construction: two nested concentric circles with 10-point chords establishing the Girih tile boundaries.',
    photo: {
      file: 'topkapi-scroll-plate28.jpg',
      caption:
        'Master architect draft of 10-fold star Girih strapwork from the Topkapi Scroll (MS H. 1956, Topkapi Palace, Istanbul)',
      creator: 'G\u00fclru Necipo\u011flu / Getty Research Institute',
      license: 'All rights reserved',
      url: 'https://www.getty.edu/publications/virtuallibrary/0892363355.html',
      private: true,
    },
    drawingSteps: [
      {
        step: 1,
        title: 'Decagonal Radial Framework',
        instruction:
          'Rule base circle and orthogonal diameters. Divide circle into 10 equal sectors of 36\u00b0 using compass golden-ratio bisection.',
        geometry: '10 radial vertices, \u03b8 = 36\u00b0',
      },
      {
        step: 2,
        title: 'Primary Decagram Chords',
        instruction:
          'Rule chords skipping 2 points to generate the {10/3} star polygon; intersect with radial spokes to define strapwork ribbon paths.',
        geometry:
          '{10/3} decagram, tip angle 36\u00b0, internal crossing angle 72\u00b0',
      },
      {
        step: 3,
        title: 'Girih Strapwork & Secondary Facets',
        instruction:
          'Extend star lines to construct surrounding pentagons, bowties, and lozenges according to traditional Girih tile angles (72\u00b0 and 144\u00b0).',
        geometry:
          'Girih tiles: decagon, pentagon, bowtie, rhombus, elongated hexagon',
      },
      {
        step: 4,
        title: 'Panel Boundary & Seamless Seams',
        instruction:
          'Align strapwork terminals with the modular panel frame, ensuring ribbons cross tile seams at perpendicular angles for continuous interlace.',
        geometry: 'Over-and-under ribbon interlace, uniform band width',
      },
    ],

    source: {
      name: 'Gülru Necipoğlu: The Topkapı Scroll (Getty, 1995)',
      url: 'https://www.getty.edu/publications/virtuallibrary/0892363355.html',
      citation: 'Geometry and Ornament in Islamic Architecture, Plate 28',
    },
  },
  {
    id: 'cordoba-synagogue-laceria',
    title: 'Córdoba Lacería Twelve-Fold Masterwork',
    arabicTitle: 'تشبيك قرطبة الاثني عشري بالأشرطة المتداخلة',
    fold: 12,
    foldLabel: '12-fold',
    style: 'Nasrid & Andalusi',
    period: '1315 CE',
    monument: 'Synagogue of Córdoba / Great Mosque of Córdoba',
    location: 'Córdoba, Spain',
    medium: 'Carved polychrome plaster & stucco (yesería mudéjar)',
    phase: 'Phase 2 · Classical',
    status: 'Planned',
    summary:
      'Masterpiece of Andalusi lacería strapwork with 12-pointed stars arranged on a triangular lattice, woven with secondary 6-pointed and 8-pointed star satellites.',
    constructionNotes:
      '√3 triangular grid with star lines at 15° offsets; line classification model drafted in Tastir research tools.',
    photo: {
      file: 'cordoba-synagogue.jpg',
      caption:
        '14th-century Mud\u00e9jar carved plaster lacer\u00eda frieze, Synagogue of C\u00f3rdoba',
      creator: 'David Wade',
      license: 'All rights reserved',
      url: 'http://www.patterninislamicart.com',
      private: true,
    },
    drawnUrl: 'upcoming/cordoba-synagogue-drawing.png',
    drawnCaption:
      'Finished compass and straightedge reconstruction of the 12-fold Mudéjar star rosette',
    drawingSteps: [
      {
        step: 1,
        title: '12-Fold Radial Framework',
        instruction:
          'Draw circle of radius R. Using compass radius R from the 4 cardinal points, strike arcs to divide the perimeter into 12 equal 30\u00b0 points.',
        geometry: '12 perimeter vertices, \u03b8 = 30\u00b0 radial spacing',
      },
      {
        step: 2,
        title: '12-Pointed Dodecagram Chords',
        instruction:
          'Rule chords skipping 4 vertices ({12/4}) and chords skipping 3 vertices ({12/3}) to establish dual concentric star starpoints.',
        geometry: '{12/4} star polygon, acute 30\u00b0 points, {12/3} squares',
      },
      {
        step: 3,
        title: 'Petal Rings & Almond Shields (Saft)',
        instruction:
          'Extend star chords to intersect concentric guide circles, forming 12 almond petals (saft) and 12 outer shielding kites.',
        geometry: 'Dual concentric petal rings, interlocking ribbon channels',
      },
      {
        step: 4,
        title: 'Tessellation Lattice Framing',
        instruction:
          'Enclose rosette in a square or hexagonal repeating tile. Continue strapwork across the borders to interlace with adjacent rosettes.',
        geometry: 'Periodic lattice repeat (p4m or p6m), ribbon interlace',
      },
    ],

    source: {
      name: 'Tastir Research tools/review/cordoba / Wade SPA 1400',
      url: 'http://www.patterninislamicart.com',
      citation: 'Andalusian Strapwork Systems of Córdoba and Seville',
    },
  },
  {
    id: 'karatay-portal-decagram',
    title: 'Karatay Madrasa Portal Ten-Fold Interlace',
    arabicTitle: 'بوابة مدرسة قره طاي السلجوقية',
    fold: 10,
    foldLabel: '10-fold',
    style: 'Seljuk',
    period: '1251 CE',
    monument: 'Karatay Madrasa Monumental Portal',
    location: 'Konya, Turkey',
    medium: 'Carved white and grey marble portal relief',
    phase: 'Phase 2 · Classical',
    status: 'Planned',
    summary:
      'Monumental Seljuk entrance portal carved in deep marble relief. Two interlacing ribbons weave continuously around 10-pointed star medallions and pentagonal darts.',
    constructionNotes:
      'Continuous ribbon weave based on regular decagram chords with bevelled edge profiles.',
    photo: {
      file: 'karatay-portal-decagram.jpg',
      caption:
        'Seljuk monumental stone portal with 10-fold interlaced Girih strapwork, Karatay Madrasa, Konya (1251 CE)',
      creator: 'Eric Broug',
      license: 'All rights reserved',
      url: 'https://broug.com',
      private: true,
    },
    drawingSteps: [
      {
        step: 1,
        title: 'Decagonal Radial Framework',
        instruction:
          'Rule base circle and orthogonal diameters. Divide circle into 10 equal sectors of 36\u00b0 using compass golden-ratio bisection.',
        geometry: '10 radial vertices, \u03b8 = 36\u00b0',
      },
      {
        step: 2,
        title: 'Primary Decagram Chords',
        instruction:
          'Rule chords skipping 2 points to generate the {10/3} star polygon; intersect with radial spokes to define strapwork ribbon paths.',
        geometry:
          '{10/3} decagram, tip angle 36\u00b0, internal crossing angle 72\u00b0',
      },
      {
        step: 3,
        title: 'Girih Strapwork & Secondary Facets',
        instruction:
          'Extend star lines to construct surrounding pentagons, bowties, and lozenges according to traditional Girih tile angles (72\u00b0 and 144\u00b0).',
        geometry:
          'Girih tiles: decagon, pentagon, bowtie, rhombus, elongated hexagon',
      },
      {
        step: 4,
        title: 'Panel Boundary & Seamless Seams',
        instruction:
          'Align strapwork terminals with the modular panel frame, ensuring ribbons cross tile seams at perpendicular angles for continuous interlace.',
        geometry: 'Over-and-under ribbon interlace, uniform band width',
      },
    ],

    source: {
      name: 'Eric Broug: Islamic Geometric Patterns (Thames & Hudson)',
      citation: 'Chapter 5: Ten-Fold Patterns, Plate 14',
    },
  },
  {
    id: 'sultan-hasan-pavement',
    title: 'Sultan Hasan Mosque Twelve-Fold Marble Medallion',
    arabicTitle: 'ترخيم صحن جامع السلطان حسن الاثني عشري',
    fold: 12,
    foldLabel: '12-fold',
    style: 'Mamluk',
    period: '1356 CE',
    monument: 'Mosque-Madrasa of Sultan Hasan',
    location: 'Cairo, Egypt',
    medium: 'Intarsia marble pavement (opus sectile)',
    phase: 'Phase 2 · Classical',
    status: 'Planned',
    summary:
      'The majestic central court pavement medallion of Cairo’s greatest Mamluk architectural monument. 12-pointed star surrounded by concentric rings of jasper, porphyry, and Carrara marble.',
    constructionNotes:
      '24-divided circle proportioning with radial star segments and concentric outer rings of alternating dark and light voussoir pieces.',
    photo: {
      file: 'sultan-hasan-pavement.jpg',
      caption:
        'Intricate marble opus sectile pavement medallion, courtyard of the Mosque of Sultan Hasan, Cairo (1362 CE)',
      creator: 'Museum with No Frontiers',
      license: 'All rights reserved',
      url: 'https://islamicart.museumwnf.org/database_item.php?id=monument;ISL;eg;Mon01;10;en',
      private: true,
    },
    drawingSteps: [
      {
        step: 1,
        title: '12-Fold Radial Framework',
        instruction:
          'Draw circle of radius R. Using compass radius R from the 4 cardinal points, strike arcs to divide the perimeter into 12 equal 30\u00b0 points.',
        geometry: '12 perimeter vertices, \u03b8 = 30\u00b0 radial spacing',
      },
      {
        step: 2,
        title: '12-Pointed Dodecagram Chords',
        instruction:
          'Rule chords skipping 4 vertices ({12/4}) and chords skipping 3 vertices ({12/3}) to establish dual concentric star starpoints.',
        geometry: '{12/4} star polygon, acute 30\u00b0 points, {12/3} squares',
      },
      {
        step: 3,
        title: 'Petal Rings & Almond Shields (Saft)',
        instruction:
          'Extend star chords to intersect concentric guide circles, forming 12 almond petals (saft) and 12 outer shielding kites.',
        geometry: 'Dual concentric petal rings, interlocking ribbon channels',
      },
      {
        step: 4,
        title: 'Tessellation Lattice Framing',
        instruction:
          'Enclose rosette in a square or hexagonal repeating tile. Continue strapwork across the borders to interlace with adjacent rosettes.',
        geometry: 'Periodic lattice repeat (p4m or p6m), ribbon interlace',
      },
    ],

    source: {
      name: 'Museum with No Frontiers (MWNF) / Creswell',
      url: 'https://islamicart.museumwnf.org/database_item.php?id=monument;ISL;eg;Mon01;10;en',
      citation: 'Mosque and Madrasa of Sultan Hasan, Cairo',
    },
  },
  {
    id: 'itimad-ud-daulah-pietra-dura',
    title: 'Tomb of I’timad-ud-Daulah Twelve-Fold Pietra Dura',
    arabicTitle: 'ترصيع ضريح اعتماد الدولة الاثني عشري',
    fold: 12,
    foldLabel: '12-fold',
    style: 'Mughal',
    period: '1628 CE',
    monument: 'Tomb of I’timad-ud-Daulah ("Baby Taj")',
    location: 'Agra, India',
    medium:
      'White marble with pietra dura inlays of jasper, onyx, and cornelian',
    phase: 'Phase 2 · Classical',
    status: 'Planned',
    summary:
      'Exquisite Mughal jewel box pavilion with floralized 12-fold star geometry, blending Persian geometric rigor with Indian semi-precious stone craft.',
    constructionNotes:
      '12-fold rosette with curved petal modulations and framing band interlacing.',
    photo: {
      file: 'itimad-ud-daulah-pietra-dura.jpg',
      caption:
        'Mughal polychrome pietra dura marble inlay, Tomb of I\u2019timad-ud-Daulah, Agra (1628 CE)',
      creator: 'Ebba Koch',
      license: 'All rights reserved',
      url: 'https://prestelpublishing.penguinrandomhouse.de',
      private: true,
    },
    drawingSteps: [
      {
        step: 1,
        title: '12-Fold Radial Framework',
        instruction:
          'Draw circle of radius R. Using compass radius R from the 4 cardinal points, strike arcs to divide the perimeter into 12 equal 30\u00b0 points.',
        geometry: '12 perimeter vertices, \u03b8 = 30\u00b0 radial spacing',
      },
      {
        step: 2,
        title: '12-Pointed Dodecagram Chords',
        instruction:
          'Rule chords skipping 4 vertices ({12/4}) and chords skipping 3 vertices ({12/3}) to establish dual concentric star starpoints.',
        geometry: '{12/4} star polygon, acute 30\u00b0 points, {12/3} squares',
      },
      {
        step: 3,
        title: 'Petal Rings & Almond Shields (Saft)',
        instruction:
          'Extend star chords to intersect concentric guide circles, forming 12 almond petals (saft) and 12 outer shielding kites.',
        geometry: 'Dual concentric petal rings, interlocking ribbon channels',
      },
      {
        step: 4,
        title: 'Tessellation Lattice Framing',
        instruction:
          'Enclose rosette in a square or hexagonal repeating tile. Continue strapwork across the borders to interlace with adjacent rosettes.',
        geometry: 'Periodic lattice repeat (p4m or p6m), ribbon interlace',
      },
    ],

    source: {
      name: 'Ebba Koch: Mughal Architecture (Prestel)',
      citation: 'The Tomb of I’timad-ud-Daulah, Agra',
    },
  },
  {
    id: 'bou-inania-16-masterwork',
    title: 'Bou Inania Grand Sixteen-Fold Zellige Wheel',
    arabicTitle: 'عجلة المدرسة البوعنانية السداسية عشرية الكبرى',
    fold: 16,
    foldLabel: '16-fold',
    style: 'Marinid zellige (Fès)',
    period: '1351 CE',
    monument: 'Madrasa Bou Inania',
    location: 'Fès, Morocco',
    medium: 'Chiseled terracotta zellige ceramic tiles',
    phase: 'Phase 2 · Classical',
    status: 'Planned',
    summary:
      'The full authentic Moroccan 16-fold masterwork wheel with concentric rings of black petals, orange pentagons, blue arrows (saft), and flanking 8-fold satellite rosettes.',
    constructionNotes:
      '16-fold radial division; relies on Ouazene & Benslimane’s mathematical reconstruction of Moroccan master artisan proportions.',
    photo: {
      file: 'bou-inania-16-closeup.png',
      caption:
        'Grand 16-pointed star zellige ceramic tile medallion, Madrasa Bou Inania, Fez (1356 CE)',
      creator: 'Ouazene & Benslimane',
      license: 'All rights reserved',
      url: 'https://www.researchgate.net/publication/333095210',
      private: true,
    },
    drawnUrl: 'upcoming/fes-panel-photo.png',
    drawnCaption: 'Marinid architectural zellige panel composition',
    drawingSteps: [
      {
        step: 1,
        title: 'Bisection into 16 Equal Sectors',
        instruction:
          'Rule circle and perpendicular diameters. Bisect the quadrants to 45\u00b0, then bisect again to obtain 16 equal points on circumference at 22.5\u00b0 spacing.',
        geometry: '16 vertices, \u03b8 = 22.5\u00b0 = \u03c0/8 radians',
      },
      {
        step: 2,
        title: '16-Pointed Star Rosette ({16/5})',
        instruction:
          "Rule chords connecting vertex Pi to Pi+5 ({16/5} star). The intersecting chords generate a luminous central 16-pointed star core (na'ura).",
        geometry: '16-pointed star {16/5}, sharp tip angle 22.5\u00b0',
      },
      {
        step: 3,
        title: 'Radiating Saft & Jabanah Rings',
        instruction:
          'Draw concentric outer circles; extend star lines outward to produce 16 radiating almond petals (saft) and 16 surrounding cups (jabanah).',
        geometry: "Marinid zellige terminology: 16 na'ura, 16 saft, 16 jabanah",
      },
      {
        step: 4,
        title: 'Architectural Dado Framing',
        instruction:
          'Frame the circular rosette inside a square panel. Fill corner spandrels with quarter 8-fold rosettes or interlaced braided borders.',
        geometry: 'Square panel frame, 4 corner spandrel rosettes',
      },
    ],

    source: {
      name: 'Ouazene & Benslimane / Tastir docs/research/bou-inania',
      url: 'https://www.researchgate.net/publication/333095210',
      citation: 'Varieties of 12- and 16-fold rosettes in Moroccan ornament',
    },
  },
  {
    id: 'attarin-madrasa-16fold',
    title: 'Al-Attarin Madrasa Sixteen-Pointed Star Dado',
    arabicTitle: 'إزار مدرسة العطارين السداسي عشر بفاس',
    fold: 16,
    foldLabel: '16-fold',
    style: 'Marinid zellige (Fès)',
    period: '1325 CE',
    monument: 'Madrasa al-Attarin',
    location: 'Fès, Morocco',
    medium: 'Polychrome cut zellige tilework',
    phase: 'Phase 2 · Classical',
    status: 'Planned',
    summary:
      'One of the oldest surviving intact Marinid zellige dados in Fès, demonstrating the pristine transition between Andalusi lacería and Moroccan geometric craft.',
    constructionNotes:
      '16-pointed central star radiating into rhomboid bridges and outer 8-pointed star joints.',
    photo: {
      file: 'attarin-madrasa-16fold.jpg',
      caption:
        'Polychrome cut-tile zellige dado, Madrasa al-Attarin, Fez (1325 CE)',
      creator: 'Jean-Marc Castera',
      license: 'All rights reserved',
      url: 'https://www.castera.net',
      private: true,
    },
    drawingSteps: [
      {
        step: 1,
        title: 'Bisection into 16 Equal Sectors',
        instruction:
          'Rule circle and perpendicular diameters. Bisect the quadrants to 45\u00b0, then bisect again to obtain 16 equal points on circumference at 22.5\u00b0 spacing.',
        geometry: '16 vertices, \u03b8 = 22.5\u00b0 = \u03c0/8 radians',
      },
      {
        step: 2,
        title: '16-Pointed Star Rosette ({16/5})',
        instruction:
          "Rule chords connecting vertex Pi to Pi+5 ({16/5} star). The intersecting chords generate a luminous central 16-pointed star core (na'ura).",
        geometry: '16-pointed star {16/5}, sharp tip angle 22.5\u00b0',
      },
      {
        step: 3,
        title: 'Radiating Saft & Jabanah Rings',
        instruction:
          'Draw concentric outer circles; extend star lines outward to produce 16 radiating almond petals (saft) and 16 surrounding cups (jabanah).',
        geometry: "Marinid zellige terminology: 16 na'ura, 16 saft, 16 jabanah",
      },
      {
        step: 4,
        title: 'Architectural Dado Framing',
        instruction:
          'Frame the circular rosette inside a square panel. Fill corner spandrels with quarter 8-fold rosettes or interlaced braided borders.',
        geometry: 'Square panel frame, 4 corner spandrel rosettes',
      },
    ],

    source: {
      name: 'Jean-Marc Castera: Arabesques (ACR Edition)',
      citation: 'Zellige Architecture of the Merinid Medinas',
    },
  },
  {
    id: 'rustem-pasha-iznik-8fold',
    title: 'Rustem Pasha Mosque Eight-Fold Iznik Tile Panel',
    arabicTitle: 'خزف جامع رستم باشا العثماني الثماني',
    fold: 8,
    foldLabel: '8-fold',
    style: 'Ottoman',
    period: '1561 CE',
    monument: 'Rüstem Pasha Mosque (Mimar Sinan)',
    location: 'Istanbul, Turkey',
    medium: 'Underglaze-painted Iznik fritware ceramic tiles',
    phase: 'Phase 2 · Classical',
    status: 'Planned',
    summary:
      'Splendid imperial Ottoman tile panel executed during the golden age of Mimar Sinan, featuring bold cobalt, turquoise, and bole red floral strapwork over an 8-fold Khatam grid.',
    constructionNotes:
      '8-fold square repeat grid with stylized saz leaf ribbons and eight-pointed star medallion centers.',
    photo: {
      file: 'rustem-pasha-iznik-8fold.jpg',
      caption:
        'Ottoman cobalt-and-coral Iznik underglaze tile panel by Mimar Sinan, R\u00fcstem Pasha Mosque, Istanbul (1563 CE)',
      creator: 'Walter B. Denny',
      license: 'All rights reserved',
      url: 'https://thamesandhudson.com',
      private: true,
    },
    drawingSteps: [
      {
        step: 1,
        title: 'Orthogonal & Diagonal Axis Matrix',
        instruction:
          'Draw base circle with radius R. Rule horizontal and vertical axes, then bisect each 90\u00b0 quadrant to establish 8 equal 45\u00b0 sectors.',
        geometry: '8 perimeter division points, \u03b8 = 45\u00b0',
      },
      {
        step: 2,
        title: '8-Pointed Khatam Star ({8/3})',
        instruction:
          'Connect alternate vertices to form two concentric squares rotated by 45\u00b0, producing the classical 8-pointed star (Khatam / Seal of Solomon).',
        geometry:
          'Octagram {8/3}, tip angle 45\u00b0, inner radius r = R \u00b7 (\u221a2 - 1)',
      },
      {
        step: 3,
        title: 'Radiating Kites & Cruciform Links',
        instruction:
          'Extend star chords outward beyond the star tips to intersect flanking rays, creating radiating kites and secondary cruciform connecting bridges.',
        geometry: 'Kite side angles: 45\u00b0, 90\u00b0, 135\u00b0',
      },
      {
        step: 4,
        title: 'Square Grid Tessellation (p4m)',
        instruction:
          'Inscribe the star within a square unit cell. Replicate the module edge-to-edge; adjacent stars link across tile seams to form secondary 4-pointed stars.',
        geometry:
          'Square cell side s = 2 R, area = 4 R\u00b2, p4m wallpaper group',
      },
    ],

    source: {
      name: 'Walter B. Denny: Iznik: The Artistry of Ottoman Ceramics',
      citation: 'The Tile Program of Rüstem Pasha, Istanbul',
    },
  },
  {
    id: 'kairouan-marble-grille',
    title: 'Great Mosque of Kairouan Eight-Star Marble Screen',
    arabicTitle: 'شمسية جامع القيروان الكبير الرخامية',
    fold: 8,
    foldLabel: '8-fold',
    style: 'Umayyad & Early Islamic',
    period: '836 CE',
    monument: 'Great Mosque of Kairouan (Mosque of Uqba)',
    location: 'Kairouan, Tunisia',
    medium: 'Perforated translucent marble window panel',
    phase: 'Phase 2 · Classical',
    status: 'Planned',
    summary:
      'An extraordinarily ancient Islamic pierced marble screen dating back to the Aghlabid reconstruction of Kairouan. Crisp eight-pointed star piercings within interlocking squares.',
    constructionNotes:
      'Two overlapping squares forming the Khatam Sulayman with rectilinear connecting strap bands.',
    photo: {
      file: 'kairouan-marble-grille.jpg',
      caption:
        '9th-century Aghlabid carved marble window grille, Great Mosque of Kairouan, Tunisia',
      creator: 'Georges Mar\u00e7ais',
      license: 'All rights reserved',
      url: 'https://gallica.bnf.fr',
      private: true,
    },
    drawingSteps: [
      {
        step: 1,
        title: 'Orthogonal & Diagonal Axis Matrix',
        instruction:
          'Draw base circle with radius R. Rule horizontal and vertical axes, then bisect each 90\u00b0 quadrant to establish 8 equal 45\u00b0 sectors.',
        geometry: '8 perimeter division points, \u03b8 = 45\u00b0',
      },
      {
        step: 2,
        title: '8-Pointed Khatam Star ({8/3})',
        instruction:
          'Connect alternate vertices to form two concentric squares rotated by 45\u00b0, producing the classical 8-pointed star (Khatam / Seal of Solomon).',
        geometry:
          'Octagram {8/3}, tip angle 45\u00b0, inner radius r = R \u00b7 (\u221a2 - 1)',
      },
      {
        step: 3,
        title: 'Radiating Kites & Cruciform Links',
        instruction:
          'Extend star chords outward beyond the star tips to intersect flanking rays, creating radiating kites and secondary cruciform connecting bridges.',
        geometry: 'Kite side angles: 45\u00b0, 90\u00b0, 135\u00b0',
      },
      {
        step: 4,
        title: 'Square Grid Tessellation (p4m)',
        instruction:
          'Inscribe the star within a square unit cell. Replicate the module edge-to-edge; adjacent stars link across tile seams to form secondary 4-pointed stars.',
        geometry:
          'Square cell side s = 2 R, area = 4 R\u00b2, p4m wallpaper group',
      },
    ],

    source: {
      name: 'Georges Marçais: L’Architecture Musulmane d’Occident',
      citation: 'The Aghlabid Grilles of Kairouan',
    },
  },
  {
    id: 'bursa-green-mosque-hex',
    title: 'Bursa Green Mosque Hexagonal Tile Mosaic',
    arabicTitle: 'فسيفساء الجامع الأخضر ببورصة السداسية',
    fold: 6,
    foldLabel: '6-fold',
    style: 'Ottoman',
    period: '1424 CE',
    monument: 'Yeşil Cami (Green Mosque)',
    location: 'Bursa, Turkey',
    medium: 'Turquoise and gold cuerda seca glazed tiles',
    phase: 'Phase 2 · Classical',
    status: 'Planned',
    summary:
      'Early Ottoman masterpiece from Bursa by the Masters of Tabriz. Rich turquoise hexagons surrounded by 6-pointed star gold-leaf inlays and cobalt arabesque borders.',
    constructionNotes:
      'Regular hexagonal honeycomb tiling with inset 6-pointed stars and triangular interstitial tiles.',
    photo: {
      file: 'bursa-green-mosque-hex.jpg',
      caption:
        'Early Ottoman turquoise-and-gold hexagonal tile mosaic, Ye\u015fil Cami (Green Mosque), Bursa (1424 CE)',
      creator: 'Do\u011fan Kuban',
      license: 'All rights reserved',
      url: 'https://www.akdn.org',
      private: true,
    },
    drawingSteps: [
      {
        step: 1,
        title: 'Isometric Hexagonal Division',
        instruction:
          'Rule circle with radius R. Step compass radius R around the circumference to mark 6 equal points at 60\u00b0 spacing.',
        geometry: '6 vertices on circle, side length = radius R',
      },
      {
        step: 2,
        title: '6-Pointed Star ({6/2}) Inscription',
        instruction:
          'Connect alternate vertices with straightedge to form two intersecting equilateral triangles (Seal of Solomon / Hexagram).',
        geometry: 'Hexagram {6/2}, inner radius r = R / \u221a3 \u2248 0.577 R',
      },
      {
        step: 3,
        title: 'Hexagonal Satellite Rosettes',
        instruction:
          'Draw surrounding concentric circles centered at each of the 6 vertices; rule lines through intersections to generate interlocking lozenges and stars.',
        geometry: 'Rhombic facets with 60\u00b0 and 120\u00b0 corner angles',
      },
      {
        step: 4,
        title: 'Honeycomb Tiling (p6m)',
        instruction:
          'Frame the unit inside a regular hexagon. Tile edge-to-edge across the plane with zero gaps, forming seamless tri-hexagonal lattices.',
        geometry: 'Hexagonal lattice, p6m symmetry, 3-fold vertex junctions',
      },
    ],

    source: {
      name: 'Doğan Kuban: Ottoman Architecture (Antique Collectors’ Club)',
      citation: 'Early Ottoman Architecture: The Bursa Period',
    },
  },

  // --- PHASE 3: GRAND MONUMENTAL GEOMETRIES ---
  {
    id: 'dos-hermanas-dome-16',
    title: 'Sala de Dos Hermanas Sixteen-Fold Muqarnas Dome',
    arabicTitle: 'قبة قاعة الأختين السداسية عشرية بقصر الحمراء',
    fold: 16,
    foldLabel: '16-fold',
    style: 'Nasrid & Andalusi',
    period: '1370 CE',
    monument: 'Palacio de los Leones, The Alhambra',
    location: 'Granada, Spain',
    medium: 'Carved muqarnas plaster vaulting & woodwork',
    phase: 'Phase 3 · Monumental',
    status: 'Planned',
    summary:
      'The mathematical dome of the Two Sisters: 16-pointed star projected across a stalactite honeycomb vault resembling the celestial dome of the cosmos.',
    constructionNotes:
      '16-fold angular projection mapping onto a three-dimensional muqarnas corbel network.',
    photo: {
      file: 'dos-hermanas-dome-16.jpg',
      caption:
        '16-sided star muqarnas ceiling dome, Sala de Dos Hermanas, Alhambra, Granada (1380 CE)',
      creator: 'David Wade',
      license: 'All rights reserved',
      url: 'http://www.patterninislamicart.com',
      private: true,
    },
    drawingSteps: [
      {
        step: 1,
        title: 'Bisection into 16 Equal Sectors',
        instruction:
          'Rule circle and perpendicular diameters. Bisect the quadrants to 45\u00b0, then bisect again to obtain 16 equal points on circumference at 22.5\u00b0 spacing.',
        geometry: '16 vertices, \u03b8 = 22.5\u00b0 = \u03c0/8 radians',
      },
      {
        step: 2,
        title: '16-Pointed Star Rosette ({16/5})',
        instruction:
          "Rule chords connecting vertex Pi to Pi+5 ({16/5} star). The intersecting chords generate a luminous central 16-pointed star core (na'ura).",
        geometry: '16-pointed star {16/5}, sharp tip angle 22.5\u00b0',
      },
      {
        step: 3,
        title: 'Radiating Saft & Jabanah Rings',
        instruction:
          'Draw concentric outer circles; extend star lines outward to produce 16 radiating almond petals (saft) and 16 surrounding cups (jabanah).',
        geometry: "Marinid zellige terminology: 16 na'ura, 16 saft, 16 jabanah",
      },
      {
        step: 4,
        title: 'Architectural Dado Framing',
        instruction:
          'Frame the circular rosette inside a square panel. Fill corner spandrels with quarter 8-fold rosettes or interlaced braided borders.',
        geometry: 'Square panel frame, 4 corner spandrel rosettes',
      },
    ],

    source: {
      name: 'David Wade SPA 0600 / Patronato de la Alhambra',
      url: 'http://www.patterninislamicart.com',
      citation: 'The Geometric Ceilings of the Alhambra',
    },
  },
  {
    id: 'shah-i-zinda-star-panel',
    title: 'Shah-i Zinda Mausoleum Star & Cross Panel',
    arabicTitle: 'فسيفساء ضريح شاه زنده بسمرقند',
    fold: 8,
    foldLabel: '8-fold',
    style: 'Timurid / Central Asian',
    period: '1386 CE',
    monument: 'Shah-i Zinda Necropolis',
    location: 'Samarkand, Uzbekistan',
    medium: 'Carved glazed terracotta & majolica tilework',
    phase: 'Phase 3 · Monumental',
    status: 'Planned',
    summary:
      'Deep cobalt, lapis, and white glazed tilework with 8-fold and 10-fold hybrid strapwork constructed along the pilgrimage avenue of Samarkand.',
    constructionNotes:
      'Square repeat with 8-fold star cores transitioning to 10-fold edge interlacing.',
    photo: {
      file: 'shah-i-zinda-star-panel.jpg',
      caption:
        'Timurid carved and glazed overglaze majolica tile panel, Shah-i Zinda necropolis, Samarkand (14th\u201315th century)',
      creator: 'Samira Mian',
      license: 'All rights reserved',
      url: 'https://www.samiramian.uk/uzbekistan',
      private: true,
    },
    drawingSteps: [
      {
        step: 1,
        title: 'Orthogonal & Diagonal Axis Matrix',
        instruction:
          'Draw base circle with radius R. Rule horizontal and vertical axes, then bisect each 90\u00b0 quadrant to establish 8 equal 45\u00b0 sectors.',
        geometry: '8 perimeter division points, \u03b8 = 45\u00b0',
      },
      {
        step: 2,
        title: '8-Pointed Khatam Star ({8/3})',
        instruction:
          'Connect alternate vertices to form two concentric squares rotated by 45\u00b0, producing the classical 8-pointed star (Khatam / Seal of Solomon).',
        geometry:
          'Octagram {8/3}, tip angle 45\u00b0, inner radius r = R \u00b7 (\u221a2 - 1)',
      },
      {
        step: 3,
        title: 'Radiating Kites & Cruciform Links',
        instruction:
          'Extend star chords outward beyond the star tips to intersect flanking rays, creating radiating kites and secondary cruciform connecting bridges.',
        geometry: 'Kite side angles: 45\u00b0, 90\u00b0, 135\u00b0',
      },
      {
        step: 4,
        title: 'Square Grid Tessellation (p4m)',
        instruction:
          'Inscribe the star within a square unit cell. Replicate the module edge-to-edge; adjacent stars link across tile seams to form secondary 4-pointed stars.',
        geometry:
          'Square cell side s = 2 R, area = 4 R\u00b2, p4m wallpaper group',
      },
    ],

    source: {
      name: 'Samira Mian: Uzbekistan Recorded Series',
      url: 'https://www.samiramian.uk/uzbekistan',
      citation: 'Timurid Patterns of Samarkand and Bukhara',
    },
  },
  {
    id: 'divrigi-portal-strapwork',
    title: 'Divriği Great Mosque Portal High-Relief Lacería',
    arabicTitle: 'بوابة جامع ديوريغي الكبير بنقوش الزخرفة البارزة',
    fold: 12,
    foldLabel: '12-fold',
    style: 'Seljuk',
    period: '1228 CE',
    monument: 'Great Mosque and Hospital of Divriği',
    location: 'Sivas, Turkey',
    medium: 'High-relief carved sandstone architectural portal',
    phase: 'Phase 3 · Monumental',
    status: 'Planned',
    summary:
      'UNESCO World Heritage site known as the "Alhambra of Anatolia". Unrivalled three-dimensional floralized 12-fold strapwork carved with exuberant sculptural mastery.',
    constructionNotes:
      '12-pointed star medallion with outward undulating strap ribbons and asymmetric relief shadows.',
    photo: {
      file: 'divrigi-portal-strapwork.jpg',
      caption:
        'Monumental high-relief Seljuk stone portal lacer\u00eda, Great Mosque of Divri\u011fi, Anatolia (1228 CE)',
      creator: 'UNESCO',
      license: 'All rights reserved',
      url: 'https://whc.unesco.org/en/list/354',
      private: true,
    },
    drawingSteps: [
      {
        step: 1,
        title: '12-Fold Radial Framework',
        instruction:
          'Draw circle of radius R. Using compass radius R from the 4 cardinal points, strike arcs to divide the perimeter into 12 equal 30\u00b0 points.',
        geometry: '12 perimeter vertices, \u03b8 = 30\u00b0 radial spacing',
      },
      {
        step: 2,
        title: '12-Pointed Dodecagram Chords',
        instruction:
          'Rule chords skipping 4 vertices ({12/4}) and chords skipping 3 vertices ({12/3}) to establish dual concentric star starpoints.',
        geometry: '{12/4} star polygon, acute 30\u00b0 points, {12/3} squares',
      },
      {
        step: 3,
        title: 'Petal Rings & Almond Shields (Saft)',
        instruction:
          'Extend star chords to intersect concentric guide circles, forming 12 almond petals (saft) and 12 outer shielding kites.',
        geometry: 'Dual concentric petal rings, interlocking ribbon channels',
      },
      {
        step: 4,
        title: 'Tessellation Lattice Framing',
        instruction:
          'Enclose rosette in a square or hexagonal repeating tile. Continue strapwork across the borders to interlace with adjacent rosettes.',
        geometry: 'Periodic lattice repeat (p4m or p6m), ribbon interlace',
      },
    ],

    source: {
      name: 'UNESCO World Heritage 354 / Eric Broug',
      url: 'https://whc.unesco.org/en/list/354',
      citation: 'Divriği Great Mosque and Hospital, Turkey',
    },
  },
  {
    id: 'doncellas-alicatado-12',
    title: 'Alcázar of Seville Patio de las Doncellas Alicatado',
    arabicTitle: 'زليج فناء العذارى بقصر إشبيلية',
    fold: 12,
    foldLabel: '12-fold',
    style: 'Nasrid & Andalusi',
    period: '1364 CE',
    monument: 'Reales Alcázares de Sevilla',
    location: 'Seville, Spain',
    medium: 'Cut glazed ceramic mosaic tilework (alicatado)',
    phase: 'Phase 3 · Monumental',
    status: 'Planned',
    summary:
      'Majestic Mudéjar wall dado composed of 12-pointed stars in black, emerald green, honey ochre, and white, constructed by Toledo and Granada master artisans.',
    constructionNotes:
      '12-fold star centers with hexagonal and square connecting bridges in true alicatado proportion.',
    photo: {
      file: 'doncellas-alicatado-12.jpg',
      caption:
        'Mud\u00e9jar 12-pointed star cut-tile alicatado dado, Patio de las Doncellas, Alc\u00e1zar of Seville (1366 CE)',
      creator: 'David Wade',
      license: 'All rights reserved',
      url: 'http://www.patterninislamicart.com',
      private: true,
    },
    drawingSteps: [
      {
        step: 1,
        title: '12-Fold Radial Framework',
        instruction:
          'Draw circle of radius R. Using compass radius R from the 4 cardinal points, strike arcs to divide the perimeter into 12 equal 30\u00b0 points.',
        geometry: '12 perimeter vertices, \u03b8 = 30\u00b0 radial spacing',
      },
      {
        step: 2,
        title: '12-Pointed Dodecagram Chords',
        instruction:
          'Rule chords skipping 4 vertices ({12/4}) and chords skipping 3 vertices ({12/3}) to establish dual concentric star starpoints.',
        geometry: '{12/4} star polygon, acute 30\u00b0 points, {12/3} squares',
      },
      {
        step: 3,
        title: 'Petal Rings & Almond Shields (Saft)',
        instruction:
          'Extend star chords to intersect concentric guide circles, forming 12 almond petals (saft) and 12 outer shielding kites.',
        geometry: 'Dual concentric petal rings, interlocking ribbon channels',
      },
      {
        step: 4,
        title: 'Tessellation Lattice Framing',
        instruction:
          'Enclose rosette in a square or hexagonal repeating tile. Continue strapwork across the borders to interlace with adjacent rosettes.',
        geometry: 'Periodic lattice repeat (p4m or p6m), ribbon interlace',
      },
    ],

    source: {
      name: 'David Wade SPA 1205 / Real Alcázar Archive',
      url: 'http://www.patterninislamicart.com',
      citation: 'The Tilework of the Alcázar of Seville',
    },
  },
  {
    id: 'wazir-khan-kashi-tiles',
    title: 'Wazir Khan Mosque Eight-Fold Kashi Tile Medallion',
    arabicTitle: 'نقوش القاشاني الثمانية بمسجد وزير خان',
    fold: 8,
    foldLabel: '8-fold',
    style: 'Mughal',
    period: '1634 CE',
    monument: 'Wazir Khan Mosque',
    location: 'Lahore, Pakistan',
    medium: 'Faience kashi-kari glazed ceramic tile mosaic',
    phase: 'Phase 3 · Monumental',
    status: 'Planned',
    summary:
      'Celebrated as the "mole on the cheek of Lahore". Brilliant polychrome floral strapwork on an 8-fold geometric lattice, combining Persian mosaic craft with Mughal color palettes.',
    constructionNotes:
      'Orthogonal grid with 8-fold star centers and intertwining arabesque calligraphy frames.',
    photo: {
      file: 'wazir-khan-kashi-tiles.jpg',
      caption:
        'Mughal Persian-style kashi-kari glazed tile medallion, Wazir Khan Mosque, Lahore (1634 CE)',
      creator: 'Ahmad Nabi Khan',
      license: 'All rights reserved',
      url: 'https://archnet.org',
      private: true,
    },
    drawingSteps: [
      {
        step: 1,
        title: 'Orthogonal & Diagonal Axis Matrix',
        instruction:
          'Draw base circle with radius R. Rule horizontal and vertical axes, then bisect each 90\u00b0 quadrant to establish 8 equal 45\u00b0 sectors.',
        geometry: '8 perimeter division points, \u03b8 = 45\u00b0',
      },
      {
        step: 2,
        title: '8-Pointed Khatam Star ({8/3})',
        instruction:
          'Connect alternate vertices to form two concentric squares rotated by 45\u00b0, producing the classical 8-pointed star (Khatam / Seal of Solomon).',
        geometry:
          'Octagram {8/3}, tip angle 45\u00b0, inner radius r = R \u00b7 (\u221a2 - 1)',
      },
      {
        step: 3,
        title: 'Radiating Kites & Cruciform Links',
        instruction:
          'Extend star chords outward beyond the star tips to intersect flanking rays, creating radiating kites and secondary cruciform connecting bridges.',
        geometry: 'Kite side angles: 45\u00b0, 90\u00b0, 135\u00b0',
      },
      {
        step: 4,
        title: 'Square Grid Tessellation (p4m)',
        instruction:
          'Inscribe the star within a square unit cell. Replicate the module edge-to-edge; adjacent stars link across tile seams to form secondary 4-pointed stars.',
        geometry:
          'Square cell side s = 2 R, area = 4 R\u00b2, p4m wallpaper group',
      },
    ],

    source: {
      name: 'Ahmad Nabi Khan: Islamic Architecture of Pakistan',
      citation: 'The Kashi Tile Art of the Wazir Khan Mosque',
    },
  },
  {
    id: 'suleymaniye-bronze-grille',
    title: 'Süleymaniye Mosque Ten-Fold Cast Bronze Window Grille',
    arabicTitle: 'شباك السليمانية البرونزي العشاري',
    fold: 10,
    foldLabel: '10-fold',
    style: 'Ottoman',
    period: '1557 CE',
    monument: 'Süleymaniye Mosque Complex (Mimar Sinan)',
    location: 'Istanbul, Turkey',
    medium: 'Cast and openwork bronze window lattice',
    phase: 'Phase 3 · Monumental',
    status: 'Planned',
    summary:
      'Imperial Sinan window screen balancing maximum structural strength with luminous geometric transparency. 10-pointed stars interconnected by rectilinear bronze ribbons.',
    constructionNotes:
      'Decagonal Girih network cast in modular bronze sections with concealed pin joinery.',
    photo: {
      file: 'suleymaniye-bronze-grille.jpg',
      caption:
        'Cast bronze window grille designed by Mimar Sinan, S\u00fcleymaniye Mosque, Istanbul (1557 CE)',
      creator: 'Aptullah Kuran',
      license: 'All rights reserved',
      url: 'https://archnet.org',
      private: true,
    },
    drawingSteps: [
      {
        step: 1,
        title: 'Decagonal Radial Framework',
        instruction:
          'Rule base circle and orthogonal diameters. Divide circle into 10 equal sectors of 36\u00b0 using compass golden-ratio bisection.',
        geometry: '10 radial vertices, \u03b8 = 36\u00b0',
      },
      {
        step: 2,
        title: 'Primary Decagram Chords',
        instruction:
          'Rule chords skipping 2 points to generate the {10/3} star polygon; intersect with radial spokes to define strapwork ribbon paths.',
        geometry:
          '{10/3} decagram, tip angle 36\u00b0, internal crossing angle 72\u00b0',
      },
      {
        step: 3,
        title: 'Girih Strapwork & Secondary Facets',
        instruction:
          'Extend star lines to construct surrounding pentagons, bowties, and lozenges according to traditional Girih tile angles (72\u00b0 and 144\u00b0).',
        geometry:
          'Girih tiles: decagon, pentagon, bowtie, rhombus, elongated hexagon',
      },
      {
        step: 4,
        title: 'Panel Boundary & Seamless Seams',
        instruction:
          'Align strapwork terminals with the modular panel frame, ensuring ribbons cross tile seams at perpendicular angles for continuous interlace.',
        geometry: 'Over-and-under ribbon interlace, uniform band width',
      },
    ],

    source: {
      name: 'Aptullah Kuran: Sinan: The Grand Old Master of Ottoman Architecture',
      citation: 'The Architectural Metalwork of the Süleymaniye',
    },
  },
  {
    id: 'mian-multi-rosette-comp',
    title: 'Samira Mian Multi-Rosette Alternating Composition',
    arabicTitle: 'تكوين الخواتم المتعددة المتناوبة',
    fold: 12,
    foldLabel: '12-fold',
    style: 'Mamluk',
    period: 'Contemporary Reconstruction',
    monument: 'Study after Cairo Mamluk Minbar Compositions',
    location: 'London / Cairo',
    medium: 'Compass & straightedge drafting on watercolor paper',
    phase: 'Phase 3 · Monumental',
    status: 'Planned',
    summary:
      'Exploration from Activity 3 & 7 using dual tracings to construct interlocking compositions where central 12-fold rosettes transition into alternating corner rosettes.',
    constructionNotes:
      'Generates square and hexagonal repeating variations from one master construction drawing.',
    photo: {
      file: 'mian-multi-rosette-comp.jpg',
      caption:
        'Mamluk interlocking rosette woodwork minbar, Mosque of al-Nasir Muhammad, Citadel of Cairo (1318 CE)',
      creator: 'Sailko',
      license: 'CC BY 3.0',
      url: 'https://commons.wikimedia.org/wiki/File:Cairo,_cittadella,_moschea_di_an-nasr_mohammed,_1318-1335,_minbar,_intarsi.JPG',
    },
    drawingSteps: [
      {
        step: 1,
        title: '12-Fold Radial Framework',
        instruction:
          'Draw circle of radius R. Using compass radius R from the 4 cardinal points, strike arcs to divide the perimeter into 12 equal 30\u00b0 points.',
        geometry: '12 perimeter vertices, \u03b8 = 30\u00b0 radial spacing',
      },
      {
        step: 2,
        title: '12-Pointed Dodecagram Chords',
        instruction:
          'Rule chords skipping 4 vertices ({12/4}) and chords skipping 3 vertices ({12/3}) to establish dual concentric star starpoints.',
        geometry: '{12/4} star polygon, acute 30\u00b0 points, {12/3} squares',
      },
      {
        step: 3,
        title: 'Petal Rings & Almond Shields (Saft)',
        instruction:
          'Extend star chords to intersect concentric guide circles, forming 12 almond petals (saft) and 12 outer shielding kites.',
        geometry: 'Dual concentric petal rings, interlocking ribbon channels',
      },
      {
        step: 4,
        title: 'Tessellation Lattice Framing',
        instruction:
          'Enclose rosette in a square or hexagonal repeating tile. Continue strapwork across the borders to interlace with adjacent rosettes.',
        geometry: 'Periodic lattice repeat (p4m or p6m), ribbon interlace',
      },
    ],

    source: {
      name: 'Samira Mian: Twelvefold Rosette Activities 3 & 7',
      url: 'https://www.samiramian.uk/twelvefoldrosette',
      citation: 'Tiling & Painting Two Arrangements of a Twelvefold Rosette',
    },
  },
  {
    id: 'isfahan-jami-bannai',
    title: 'Jameh Mosque of Isfahan Six-Fold Banna’i Brickwork',
    arabicTitle: 'طوب البنائي السداسي بمسجد جامع أصفهان',
    fold: 6,
    foldLabel: '6-fold',
    style: 'Seljuk & Persian',
    period: '1088 CE',
    monument: 'Jameh Mosque of Isfahan (Gunbad-e Khaki)',
    location: 'Isfahan, Iran',
    medium: 'Carved unglazed terra-cotta & banna’i glazed brick relief',
    phase: 'Phase 3 · Monumental',
    status: 'Planned',
    summary:
      'One of the oldest surviving mathematical brick vaults in Persia, attributed to Omar Khayyam’s geometric circle. Hexagonal stars formed by alternating angled bricks in geometric relief.',
    constructionNotes:
      'Triangular brick grid with modular coursing establishing 6-fold star points without curved lines.',
    photo: {
      file: 'isfahan-jami-bannai.jpg',
      caption:
        'Seljuk geometric banna\u2019i glazed brickwork, Gunbad-e Khaki north dome of Jameh Mosque of Isfahan (1088 CE)',
      creator: 'David Wade',
      license: 'All rights reserved',
      url: 'http://www.patterninislamicart.com',
      private: true,
    },
    drawingSteps: [
      {
        step: 1,
        title: 'Isometric Hexagonal Division',
        instruction:
          'Rule circle with radius R. Step compass radius R around the circumference to mark 6 equal points at 60\u00b0 spacing.',
        geometry: '6 vertices on circle, side length = radius R',
      },
      {
        step: 2,
        title: '6-Pointed Star ({6/2}) Inscription',
        instruction:
          'Connect alternate vertices with straightedge to form two intersecting equilateral triangles (Seal of Solomon / Hexagram).',
        geometry: 'Hexagram {6/2}, inner radius r = R / \u221a3 \u2248 0.577 R',
      },
      {
        step: 3,
        title: 'Hexagonal Satellite Rosettes',
        instruction:
          'Draw surrounding concentric circles centered at each of the 6 vertices; rule lines through intersections to generate interlocking lozenges and stars.',
        geometry: 'Rhombic facets with 60\u00b0 and 120\u00b0 corner angles',
      },
      {
        step: 4,
        title: 'Honeycomb Tiling (p6m)',
        instruction:
          'Frame the unit inside a regular hexagon. Tile edge-to-edge across the plane with zero gaps, forming seamless tri-hexagonal lattices.',
        geometry: 'Hexagonal lattice, p6m symmetry, 3-fold vertex junctions',
      },
    ],

    source: {
      name: 'Alireza Doostdar & Anthony Lee / Wade IRN 0101',
      url: 'http://www.patterninislamicart.com',
      citation: 'Seljuk Brickwork of the Isfahan Friday Mosque',
    },
  },
];
