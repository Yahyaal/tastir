# Arabic Titles Review

Review of Arabic titles in `docs/prompts/arabic-titles.md` for correctness, naturalness, and appropriate usage.

## 1. Brand & Atelier UI Elements

| English | Arabic | Assessment | Suggested Improvement |
|---------|--------|------------|----------------------|
| **Tastir** (Application brand mark) | **تسطير** | ✓ Correct and appropriate | - |
| **Islamic Geometric Drafting Atelier** | **علم التسطير والهندسة** | ✓ Correct and natural | - |
| **Upcoming Patterns Roadmap** | **قائمة الأنماط القادمة** | ✓ Correct and natural | - |

## 2. Architectural Traditions (Dossiers)

| Tradition | Arabic | Assessment | Suggested Improvement |
|-----------|--------|------------|----------------------|
| **Moroccan** | **الزليج المغربي** | ✓ Correct and natural | - |
| **Marinid zellige (Fès)** | **الزليج المريني بفاس** | ✓ Correct and natural | - |
| **Nasrid** | **الحسبة الأندلسية بالنصرية** | ✗ Incorrect usage | **الفن النصري** or **العمارة النصرية بغرناطة** — "الحسبة" means market inspection/standards, not architecture. The Nasrid dynasty should be "النصري" (referring to art/architecture), not "الحسبة". |
| **Mamluk** | **العمارة المملوكية بالقاهرة** | ✓ Correct and natural | - |
| **Timurid** | **العمارة التيمورية** | ✓ Correct and natural | - |
| **Seljuk** | **الهندسة السلجوقية** | ✓ Correct and natural | - |
| **Tulunid** | **الطراز الطولوني** | ✓ Correct and natural | - |
| **Mughal** | **العمارة المغولية** | ⚠ Acceptable but could be clearer | **عمارة مغول الهند** — Adding "الهند" clarifies this refers to the Indian Mughal Empire, not the Mongol Empire. "المغولية" alone can be ambiguous. |

## 3. Library Tutorial Pattern Subtitles

| Pattern ID | English | Arabic | Assessment | Suggested Improvement |
|------------|---------|--------|------------|----------------------|
| `eight-fold-star-and-cross` | Eight-fold star and cross | **خاتم سليمان وثماني** | ⚠ Somewhat awkward | **النجمة الثمانية والصليب** — More direct translation. "خاتم سليمان" (Solomon's Seal) is a specific symbol, not a general eight-fold star. "وثماني" is grammatically incomplete. |
| `eight-fold-zellige` | Eight-fold rosette | **زليج ثماني مغربي** | ✓ Correct and natural | - |
| `bou-inania-rosette` | Bou Inania rosette, her way | **خاتم الستة عشر البوعنانية بفاس** | ✓ Correct and natural | - |
| `bou-inania-twelve-fold-wall` | Bou Inania twelve-fold wall | **حائط اثنا عشري بالبوعنانية** | ✓ Correct and natural | - |
| `sixteen-fold-rosette` | Sixteen-fold rosette | **طاسة الستة عشر المرينية** | ⚠ Regional term | **خاتم الستة عشر المريني** — "طاسة" is a regional Moroccan term for rosette. "خاتم" is more widely understood across the Arabic-speaking world. Both are correct, but "خاتم" is more universal. |
| `twelve-fold-rosette-mian` | Twelve-fold rosette (Samira Mian's construction) | **روزيتا اثنا عشرية** | ⚠ Borrowed word | **خاتم اثني عشر** or **وردة اثني عشر** — "روزيتا" is a borrowed word from English/French. Using the Arabic "خاتم" (seal/rosette) or "وردة" (rose/rosette) is more natural. Also, "اثني عشر" (not "اثنا عشرية") for grammatical agreement. |
| `twelve-fold-rosette-mian-hex` | Twelve-fold rosette, hexagonal tile | **روزيتا مسدسة مسدسة** | ✗ Error — word repeated | **خاتم اثني عشر بتكرار سداسي** — The word "مسدسة" (hexagonal) is repeated twice, which is an error. Should describe the twelve-fold pattern in hexagonal arrangement. |
| `twelve-fold-dodecagrams` | Twelve-pointed stars | **اثنا عشري نجمي** | ⚠ Grammatically awkward | **نجوم اثني عشر** — More natural word order in Arabic (noun before number). "اثنا عشري نجمي" reads like two adjectives without a noun. |
| `alhambra-comares-stars` | Comares stars and crosses | **نجوم قاعة قمارش بقصر الحمراء** | ✓ Correct and natural | - |
| `alhambra-reyes-dodecagrams` | Twelve-pointed stars of the Sala de los Reyes | **اثنا عشري قاعة الملوك بالحمراء** | ⚠ Missing noun | **نجوم اثني عشر بقاعة الملوك بالحمراء** — "اثنا عشري" is an adjective without a noun. Needs "نجوم" (stars). |
| `alhambra-reyes-stars` | Stars, octagons and crosses | **نجوم قاعة الملوك بالحمراء** | ✓ Correct (though octagon/cross omitted) | Could add: **نجوم ومثمنات وصلبان قاعة الملوك** to match the full English title. |
| `alhambra-mexuar-stars` | Mexuar stars | **نجوم المشور بقصر الحمراء** | ✓ Correct and natural | - |
| `alhambra-barca-stars` | Interlaced stars of the Sala de la Barca | **نجوم قاعة البركة بالحمراء** | ✓ Correct (though "interlaced" omitted) | Could add: **نجوم متشابكة بقاعة البركة** to convey "interlaced". |
| `alhambra-bath-stars` | Interlaced stars of the Comares bath | **نجوم حمامات قصر الحمراء** | ✓ Correct (though "interlaced" omitted) | Could add: **نجوم متشابكة بحمامات قمارش** to convey "interlaced" and specify Comares. |
| `alhambra-arrayanes-squares` | Squares and stars of the Patio de los Arrayanes | **مربعات صحن الريحان بالحمراء** | ✓ Correct (though "stars" omitted) | Could add: **مربعات ونجوم صحن الريحان** to include stars. |
| `ibn-tulun-window` | Ibn Tulun window | **شمسية جامع ابن طولون بالقاهرة** | ✓ Correct and natural | - |
| `minbar-doors-cairo` | Minbar doors from Cairo | **مصاريع منبر قاهري مملوكي** | ✓ Correct and natural | - |
| `four-fold-ring-of-circles` | Four-fold ring of circles | **حلقة الدوائر الرباعية** | ✓ Correct and natural | - |
| `six-fold-star-and-hexagons` | Star and hexagons | **نجمة مسدسة ومسدسات** | ✓ Correct and natural | - |
| `six-fold-snowflake` | Six-fold snowflake | **ندفة الثلج المسدسة** | ✓ Correct and natural | - |
| `six-fold-hammerhead` | Six-fold hammerheads | **مطرقة مسدسة تيمورية** | ✓ Correct and natural | - |

## 4. Upcoming Masterworks Roadmap

| ID | English | Arabic | Assessment | Suggested Improvement |
|----|---------|--------|------------|----------------------|
| `mian-stellated-hex` | Stellated Twelvefold Rosette in a Hexagonal Arrangement | **خاتم الاثني عشر المجنح بسداسي التكرار** | ⚠ "المجنح" unclear | **خاتم الاثني عشر النجمي بتكرار سداسي** — "المجنح" means "winged" but doesn't convey "stellated" well. "النجمي" (star-shaped/stellated) is clearer. |
| `darb-e-imam-decagram` | Darb-e Imam Decagram & Girih Tiling | **عقدة الإمام العشري وتجريد الجريه** | ⚠ "تجريد الجريه" unclear | **عقدة الإمام العشري وزخرفة الجريه** — "تجريد" means "abstraction" but "زخرفة" (ornamentation) better describes girih patterns. |
| `qaytbay-minbar-decagram` | Minbar of Sultan Qaytbay Ten-Fold Rosette | **خاتم منبر السلطان قايتباي العشري** | ✓ Correct and natural | - |
| `generalife-ceiling-octagons` | Generalife Palace Ceiling Octagonal Coffers | **سقف جنة العريف بالنجوم المثمنة** | ⚠ "جنة" instead of "قصر" | **سقف قصر جنة العريف بالنجوم المثمنة** — "جنة العريف" alone means "Garden of the Architect". Adding "قصر" clarifies it's the palace. |
| `ibn-tulun-second-grille` | Mosque of Ibn Tulun Star & Hexagon Window Grille | **شمسية مسجد ابن طولون السداسية المقرنصة** | ⚠ "المقرنصة" unclear | **شمسية مسجد ابن طولون بالنجوم والمسدسات** — "المقرنصة" refers to muqarnas (stalactite vaulting), not stars and hexagons. Better to describe what's shown. |
| `humayun-jali-screen` | Humayun's Tomb Eight-Fold Jali Lattice | **شبكة المشربية المثمنة بضريح همايون** | ✓ Correct and natural | - |
| `topkapi-scroll-plate28` | Topkapi Scroll Decagonal Star Interlace | **عقدة لفافة طوب قابي العشارية** | ✓ Correct and natural | - |
| `cordoba-synagogue-laceria` | Córdoba Lacería Twelve-Fold Masterwork | **تشبيك قرطبة الاثني عشري بالأشرطة المتداخلة** | ✓ Correct and natural | - |
| `karatay-portal-decagram` | Karatay Madrasa Portal Ten-Fold Interlace | **بوابة مدرسة قره طاي السلجوقية** | ⚠ Missing "العشارية" | **بوابة مدرسة قره طاي السلجوقية العشارية** — The "ten-fold" aspect is not mentioned. Add "العشارية". |
| `sultan-hasan-pavement` | Sultan Hasan Mosque Twelve-Fold Marble Medallion | **ترخيم صحن جامع السلطان حسن الاثني عشري** | ✓ Correct and natural | - |
| `itimad-ud-daulah-pietra-dura` | Tomb of I'timad-ud-Daulah Twelve-Fold Pietra Dura | **ترصيع ضريح اعتماد الدولة الاثني عشري** | ✓ Correct and natural | - |
| `bou-inania-16-masterwork` | Bou Inania Grand Sixteen-Fold Zellige Wheel | **عجلة المدرسة البوعنانية السداسية عشرية الكبرى** | ✓ Correct and natural | - |
| `attarin-madrasa-16fold` | Al-Attarin Madrasa Sixteen-Pointed Star Dado | **إزار مدرسة العطارين السداسي عشر بفاس** | ✓ Correct and natural | - |
| `rustem-pasha-iznik-8fold` | Rustem Pasha Mosque Eight-Fold Iznik Tile Panel | **خزف جامع رستم باشا العثماني الثماني** | ✓ Correct and natural | - |
| `kairouan-marble-grille` | Great Mosque of Kairouan Eight-Star Marble Screen | **شمسية جامع القيروان الكبير الرخامية** | ✓ Correct and natural | - |
| `bursa-green-mosque-hex` | Bursa Green Mosque Hexagonal Tile Mosaic | **فسيفساء الجامع الأخضر ببورصة السداسية** | ✓ Correct and natural | - |
| `dos-hermanas-dome-16` | Sala de Dos Hermanas Sixteen-Fold Muqarnas Dome | **قبة قاعة الأختين السداسية عشرية بقصر الحمراء** | ✓ Correct and natural | - |
| `shah-i-zinda-star-panel` | Shah-i Zinda Mausoleum Star & Cross Panel | **فسيفساء ضريح شاه زنده بسمرقند** | ⚠ "Cross" omitted | **فسيفساء النجوم والصلبان بضريح شاه زنده** — Adding "النجوم والصلبان" includes both elements. |
| `divrigi-portal-strapwork` | Divriği Great Mosque Portal High-Relief Lacería | **بوابة جامع ديوريغي الكبير بنقوش الزخرفة البارزة** | ✓ Correct and natural | - |
| `doncellas-alicatado-12` | Alcázar of Seville Patio de las Doncellas Alicatado | **زليج فناء العذارى بقصر إشبيلية** | ✓ Correct and natural | - |
| `wazir-khan-kashi-tiles` | Wazir Khan Mosque Eight-Fold Kashi Tile Medallion | **نقوش القاشاني الثمانية بمسجد وزير خان** | ✓ Correct and natural | - |
| `suleymaniye-bronze-grille` | Süleymaniye Mosque Ten-Fold Cast Bronze Window Grille | **شباك السليمانية البرونزي العشاري** | ✓ Correct and natural | - |
| `mian-multi-rosette-comp` | Samira Mian Multi-Rosette Alternating Composition | **تكوين الخواتم المتعددة المتناوبة** | ✓ Correct and natural | - |
| `isfahan-jami-bannai` | Jameh Mosque of Isfahan Six-Fold Banna'i Brickwork | **طوب البنائي السداسي بمسجد جامع أصفهان** | ✓ Correct and natural | - |

## Summary of Key Issues

### Critical Errors
1. **Nasrid tradition**: "الحسبة الأندلسية بالنصرية" uses wrong word — should be "الفن النصري" or "العمارة النصرية"
2. **twelve-fold-rosette-mian-hex**: "مسدسة مسدسة" — word repeated twice (error)

### Grammatical Issues
3. **eight-fold-star-and-cross**: "وثماني" is grammatically incomplete
4. **twelve-fold-rosette-mian**: "اثنا عشرية" should be "اثني عشر" for grammatical agreement
5. **twelve-fold-dodecagrams**: "اثنا عشري نجمي" lacks a noun, should be "نجوم اثني عشر"
6. **alhambra-reyes-dodecagrams**: "اثنا عشري" is an adjective without noun, needs "نجوم"

### Clarity Improvements
7. **Mughal**: "العمارة المغولية" could be "عمارة مغول الهند" to avoid ambiguity
8. **sixteen-fold-rosette**: "طاسة" is regional; "خاتم" is more universal
9. **twelve-fold-rosette-mian**: "روزيتا" is borrowed; "خاتم" or "وردة" is more natural
10. Several patterns omit descriptors present in English (e.g., "interlaced", "cross", "octagon")

### Technical Term Clarity
11. **mian-stellated-hex**: "المجنح" (winged) doesn't clearly convey "stellated"
12. **darb-e-imam-decagram**: "تجريد الجريه" unclear; "زخرفة الجريه" better
13. **generalife-ceiling-octagons**: Missing "قصر" before "جنة العريف"
14. **ibn-tulun-second-grille**: "المقرنصة" (muqarnas) doesn't match "stars and hexagons"
15. **karatay-portal-decagram**: Missing "العشارية" (ten-fold)

## Overall Assessment

**Strengths**: Most titles are grammatically correct and use appropriate architectural terminology. The translator clearly has strong knowledge of Islamic architectural vocabulary.

**Areas for improvement**: 
- Some borrowed words ("روزيتا") could use more natural Arabic equivalents
- A few grammatical issues with number-adjective agreement
- Some English descriptors are omitted in translation
- One critical error (Nasrid = الحسبة instead of النصري)
- One duplication error (مسدسة مسدسة)

**Recommendation**: Address the critical errors and grammatical issues. The borrowed words and omitted descriptors are lower priority but would improve naturalness and completeness.
