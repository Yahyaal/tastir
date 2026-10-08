export type UpcomingPhase = 'Phase 1 · Immediate' | 'Phase 2 · Classical' | 'Phase 3 · Monumental';

export type UpcomingStatus =
  | 'Playable now'
  | 'Research complete'
  | 'Geometry verified'
  | 'Construction drafted'
  | 'Photo reference matched'
  | 'Source queued';

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
  readonly source: {
    readonly name: string;
    readonly url?: string;
    readonly citation?: string;
  };
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
    monument: 'Minbar of Amir Altunbugha al-Maridani & Mosque of al-Nasir Muhammad',
    location: 'Cairo, Egypt',
    medium: 'Woodwork with ivory & ebony inlay',
    phase: 'Phase 1 · Immediate',
    status: 'Playable now',
    summary:
      'The missing honeycomb counterpart to the al-Maridani square tiling. Six stellated rosettes surround one central rosette, creating secondary 6-pointed star interstitial lattices and delicate ivory darts.',
    constructionNotes:
      'Builds from a central 24-divided circle with overlapping hexagons, extending petal lines outwards to intersect in 12-pointed star points and hexagonal tile boundary crossings.',
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
    status: 'Playable now',
    summary:
      'The world-renowned pinnacle of Islamic quasicrystalline geometry. Centered on a 10-pointed star with concentric rings of pentagons, bowties, and decagons, demonstrating self-similar tiling centuries ahead of Penrose.',
    constructionNotes:
      'Constructed using golden-ratio circle divisions (36° intervals) with nested decagons and pentagonal compass crossings.',
    source: {
      name: 'Lu & Steinhardt (Science 2007) / Peter J. Lu',
      url: 'https://doi.org/10.1126/science.1135491',
      citation: 'Decagonal and Quasi-crystalline Tilings in Medieval Islamic Architecture',
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
    status: 'Photo reference matched',
    summary:
      'Classic late Mamluk decagram woodwork medallion with radiating interlacing ribbons, delicate almond shields, and fine inlaid ivory stars.',
    constructionNotes:
      'Drawn via 10-fold radial division; the star lines cross at 72° to produce regular 10-pointed stars framed by alternating kites and pentagram facets.',
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
    status: 'Research complete',
    summary:
      'A modular coffered woodwork ceiling alternating bold eight-pointed Khatam stars and raised octagonal frames, celebrating rhythm and shadow.',
    constructionNotes:
      'Square grid with octagons tangent to unit cell boundaries; four-pointed stars form in the corner interstices.',
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
    status: 'Construction drafted',
    summary:
      'Among the earliest surviving pierced geometric stucco grilles in the Islamic world. A 6-pointed star with deep bevelled openings and interlocking hexagonal rosettes.',
    constructionNotes:
      'Hexagonal grid based on equilateral triangles; each star is inscribed within a circle whose circumference defines the flanking rhombi.',
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
    status: 'Research complete',
    summary:
      'Imperial Mughal perforated screen filtering sunlight into ethereal geometric shadows. Eight-pointed stars interlace with cruciform links across an orthogonal matrix.',
    constructionNotes:
      'Continuous interlacing strapwork; all lines run at 45° and 90° angles to create consistent ribbon widths with under-and-over weave.',
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
    status: 'Geometry verified',
    summary:
      'From the master architectural design manual used by master builders (ustad). Features a central 10-pointed star with radiating 5-pointed star satellites and pentagram loops.',
    constructionNotes:
      'Master scroll construction: two nested concentric circles with 10-point chords establishing the Girih tile boundaries.',
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
    status: 'Geometry verified',
    summary:
      'Masterpiece of Andalusi lacería strapwork with 12-pointed stars arranged on a triangular lattice, woven with secondary 6-pointed and 8-pointed star satellites.',
    constructionNotes:
      '√3 triangular grid with star lines at 15° offsets; line classification model drafted in Tastir research tools.',
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
    status: 'Research complete',
    summary:
      'Monumental Seljuk entrance portal carved in deep marble relief. Two interlacing ribbons weave continuously around 10-pointed star medallions and pentagonal darts.',
    constructionNotes:
      'Continuous ribbon weave based on regular decagram chords with bevelled edge profiles.',
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
    status: 'Photo reference matched',
    summary:
      'The majestic central court pavement medallion of Cairo’s greatest Mamluk architectural monument. 12-pointed star surrounded by concentric rings of jasper, porphyry, and Carrara marble.',
    constructionNotes:
      '24-divided circle proportioning with radial star segments and concentric outer rings of alternating dark and light voussoir pieces.',
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
    medium: 'White marble with pietra dura inlays of jasper, onyx, and cornelian',
    phase: 'Phase 2 · Classical',
    status: 'Research complete',
    summary:
      'Exquisite Mughal jewel box pavilion with floralized 12-fold star geometry, blending Persian geometric rigor with Indian semi-precious stone craft.',
    constructionNotes:
      '12-fold rosette with curved petal modulations and framing band interlacing.',
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
    status: 'Geometry verified',
    summary:
      'The full authentic Moroccan 16-fold masterwork wheel with concentric rings of black petals, orange pentagons, blue arrows (saft), and flanking 8-fold satellite rosettes.',
    constructionNotes:
      '16-fold radial division; relies on Ouazene & Benslimane’s mathematical reconstruction of Moroccan master artisan proportions.',
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
    status: 'Research complete',
    summary:
      'One of the oldest surviving intact Marinid zellige dados in Fès, demonstrating the pristine transition between Andalusi lacería and Moroccan geometric craft.',
    constructionNotes:
      '16-pointed central star radiating into rhomboid bridges and outer 8-pointed star joints.',
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
    status: 'Research complete',
    summary:
      'Splendid imperial Ottoman tile panel executed during the golden age of Mimar Sinan, featuring bold cobalt, turquoise, and bole red floral strapwork over an 8-fold Khatam grid.',
    constructionNotes:
      '8-fold square repeat grid with stylized saz leaf ribbons and eight-pointed star medallion centers.',
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
    status: 'Photo reference matched',
    summary:
      'An extraordinarily ancient Islamic pierced marble screen dating back to the Aghlabid reconstruction of Kairouan. Crisp eight-pointed star piercings within interlocking squares.',
    constructionNotes:
      'Two overlapping squares forming the Khatam Sulayman with rectilinear connecting strap bands.',
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
    status: 'Research complete',
    summary:
      'Early Ottoman masterpiece from Bursa by the Masters of Tabriz. Rich turquoise hexagons surrounded by 6-pointed star gold-leaf inlays and cobalt arabesque borders.',
    constructionNotes:
      'Regular hexagonal honeycomb tiling with inset 6-pointed stars and triangular interstitial tiles.',
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
    status: 'Research complete',
    summary:
      'The mathematical dome of the Two Sisters: 16-pointed star projected across a stalactite honeycomb vault resembling the celestial dome of the cosmos.',
    constructionNotes:
      '16-fold angular projection mapping onto a three-dimensional muqarnas corbel network.',
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
    status: 'Research complete',
    summary:
      'Deep cobalt, lapis, and white glazed tilework with 8-fold and 10-fold hybrid strapwork constructed along the pilgrimage avenue of Samarkand.',
    constructionNotes:
      'Square repeat with 8-fold star cores transitioning to 10-fold edge interlacing.',
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
    status: 'Research complete',
    summary:
      'UNESCO World Heritage site known as the "Alhambra of Anatolia". Unrivalled three-dimensional floralized 12-fold strapwork carved with exuberant sculptural mastery.',
    constructionNotes:
      '12-pointed star medallion with outward undulating strap ribbons and asymmetric relief shadows.',
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
    status: 'Photo reference matched',
    summary:
      'Majestic Mudéjar wall dado composed of 12-pointed stars in black, emerald green, honey ochre, and white, constructed by Toledo and Granada master artisans.',
    constructionNotes:
      '12-fold star centers with hexagonal and square connecting bridges in true alicatado proportion.',
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
    status: 'Research complete',
    summary:
      'Celebrated as the "mole on the cheek of Lahore". Brilliant polychrome floral strapwork on an 8-fold geometric lattice, combining Persian mosaic craft with Mughal color palettes.',
    constructionNotes:
      'Orthogonal grid with 8-fold star centers and intertwining arabesque calligraphy frames.',
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
    status: 'Research complete',
    summary:
      'Imperial Sinan window screen balancing maximum structural strength with luminous geometric transparency. 10-pointed stars interconnected by rectilinear bronze ribbons.',
    constructionNotes:
      'Decagonal Girih network cast in modular bronze sections with concealed pin joinery.',
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
    status: 'Research complete',
    summary:
      'Exploration from Activity 3 & 7 using dual tracings to construct interlocking compositions where central 12-fold rosettes transition into alternating corner rosettes.',
    constructionNotes:
      'Generates square and hexagonal repeating variations from one master construction drawing.',
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
    status: 'Research complete',
    summary:
      'One of the oldest surviving mathematical brick vaults in Persia, attributed to Omar Khayyam’s geometric circle. Hexagonal stars formed by alternating angled bricks in geometric relief.',
    constructionNotes:
      'Triangular brick grid with modular coursing establishing 6-fold star points without curved lines.',
    source: {
      name: 'Alireza Doostdar & Anthony Lee / Wade IRN 0101',
      url: 'http://www.patterninislamicart.com',
      citation: 'Seljuk Brickwork of the Isfahan Friday Mosque',
    },
  },
];
