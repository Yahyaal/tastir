import json, re

with open('apps/player/src/app/upcoming-patterns.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Check structure:
# export interface UpcomingPattern { ... }
# export const UPCOMING_PATTERNS: readonly UpcomingPattern[] = [ ... ];

# We want to add:
# export interface DrawingStep {
#   readonly step: number;
#   readonly title: string;
#   readonly instruction: string;
#   readonly geometry: string;
# }
# And in UpcomingPattern:
#   readonly drawingSteps: readonly DrawingStep[];

new_lines = []
in_interface = False
added_step_interface = False

for line in lines:
    if "export interface UpcomingPattern {" in line and not added_step_interface:
        new_lines.append("export interface DrawingStep {\n")
        new_lines.append("  readonly step: number;\n")
        new_lines.append("  readonly title: string;\n")
        new_lines.append("  readonly instruction: string;\n")
        new_lines.append("  readonly geometry: string;\n")
        new_lines.append("}\n\n")
        added_step_interface = True
        new_lines.append(line)
        in_interface = True
        continue
    
    if in_interface and "readonly constructionNotes: string;" in line:
        new_lines.append(line)
        new_lines.append("  readonly drawingSteps: readonly DrawingStep[];\n")
        continue

    if in_interface and line.strip() == "}":
        in_interface = False
        new_lines.append(line)
        continue

    new_lines.append(line)

content = "".join(new_lines)

# Now inject drawingSteps into each pattern item in UPCOMING_PATTERNS
# import helper

# Helper from earlier
def get_steps_for_pattern(pid, fold, style):
    if pid == 'mian-stellated-hex':
        return [
            {
                "step": 1,
                "title": "Base Circle & 12 Division Points",
                "instruction": "Rule circle c about centre O with radius R and draw horizontal diameter. Swing compass radius R from the intersection points to divide the circumference into 12 equal points at 30° spacing.",
                "geometry": "12 vertices on perimeter, θ = 30° radial spacing"
            },
            {
                "step": 2,
                "title": "Dual Overlapping Hexagons & 15° Rays",
                "instruction": "Construct two nested regular hexagons to locate intermediate 15° rays. Inscribe outer boundary circle co and inner reference circle ci tangent to the hexagonal chords.",
                "geometry": "Rays at 15° increments, inner radius ci = R · cos(30°) · tan(15°)"
            },
            {
                "step": 3,
                "title": "12-Pointed Stellated Star Rosette",
                "instruction": "Rule 12 star rays connecting circumference division points through the inner circle crossing points, forming 12 acute star points and surrounding kite facets.",
                "geometry": "12 star tips at r = 1.0, 12 valleys at r = 0.5176"
            },
            {
                "step": 4,
                "title": "Hexagonal Honeycomb Tile Boundary",
                "instruction": "Construct a regular hexagon tangent to the circle at 6 points. Extend star points to meet at the hexagon corners, creating secondary 6-pointed florets where three tiles meet.",
                "geometry": "Regular hexagon cell, side length s = 2/√3 R, area = 2√3 R²"
            }
        ]
    elif pid == 'darb-e-imam-decagram':
        return [
            {
                "step": 1,
                "title": "Euclidean Golden Section & 10 Points",
                "instruction": "Draw base circle c about O and rule perpendicular axes. Find midpoint M(-0.5, 0), swing arc through (0, 1) down to horizontal axis at golden section point F = (√5 - 1)/2. Step distance OF around circumference to obtain 10 exact points.",
                "geometry": "Golden ratio φ = (√5 + 1)/2, chord length = 2 · sin(18°) = φ - 1"
            },
            {
                "step": 2,
                "title": "{10/3} Star Chords & Girih Decagram",
                "instruction": "Rule 10 chords connecting each vertex Pi to Pi+3 (skipping 2 vertices, 108° apart). Their intersections form the central 10-pointed star with sharp 36° points.",
                "geometry": "10-pointed star polygon {10/3}, inner crossing radius r = 0.5257 R"
            },
            {
                "step": 3,
                "title": "Surrounding Kites & Interstitial Bowties",
                "instruction": "Rule decagon perimeter chords. Trace star lines outward to form 10 surrounding kites, 10 interstitial darts, and elongated hexagons (Shesh Band).",
                "geometry": "Concentric decagon side s = 2 · sin(18°), kite angle = 72°"
            },
            {
                "step": 4,
                "title": "Rectangular Periodic Tile Closure",
                "instruction": "Establish rectangular tile corners at outer crossings 54°, 126°, 234°, and 306°. The width w = √5 and height h = √(5 + 2√5) allow periodic plane tiling with 10-fold core symmetry.",
                "geometry": "Rectangular cell w = 2.236 R, h = 3.078 R, area = 6.882 R²"
            }
        ]
    elif fold == 10:
        return [
            {
                "step": 1,
                "title": "Decagonal Radial Framework",
                "instruction": "Rule base circle and orthogonal diameters. Divide circle into 10 equal sectors of 36° using compass golden-ratio bisection.",
                "geometry": "10 radial vertices, θ = 36°"
            },
            {
                "step": 2,
                "title": "Primary Decagram Chords",
                "instruction": "Rule chords skipping 2 points to generate the {10/3} star polygon; intersect with radial spokes to define strapwork ribbon paths.",
                "geometry": "{10/3} decagram, tip angle 36°, internal crossing angle 72°"
            },
            {
                "step": 3,
                "title": "Girih Strapwork & Secondary Facets",
                "instruction": "Extend star lines to construct surrounding pentagons, bowties, and lozenges according to traditional Girih tile angles (72° and 144°).",
                "geometry": "Girih tiles: decagon, pentagon, bowtie, rhombus, elongated hexagon"
            },
            {
                "step": 4,
                "title": "Panel Boundary & Seamless Seams",
                "instruction": "Align strapwork terminals with the modular panel frame, ensuring ribbons cross tile seams at perpendicular angles for continuous interlace.",
                "geometry": "Over-and-under ribbon interlace, uniform band width"
            }
        ]
    elif fold == 8:
        return [
            {
                "step": 1,
                "title": "Orthogonal & Diagonal Axis Matrix",
                "instruction": "Draw base circle with radius R. Rule horizontal and vertical axes, then bisect each 90° quadrant to establish 8 equal 45° sectors.",
                "geometry": "8 perimeter division points, θ = 45°"
            },
            {
                "step": 2,
                "title": "8-Pointed Khatam Star ({8/3})",
                "instruction": "Connect alternate vertices to form two concentric squares rotated by 45°, producing the classical 8-pointed star (Khatam / Seal of Solomon).",
                "geometry": "Octagram {8/3}, tip angle 45°, inner radius r = R · (√2 - 1)"
            },
            {
                "step": 3,
                "title": "Radiating Kites & Cruciform Links",
                "instruction": "Extend star chords outward beyond the star tips to intersect flanking rays, creating radiating kites and secondary cruciform connecting bridges.",
                "geometry": "Kite side angles: 45°, 90°, 135°"
            },
            {
                "step": 4,
                "title": "Square Grid Tessellation (p4m)",
                "instruction": "Inscribe the star within a square unit cell. Replicate the module edge-to-edge; adjacent stars link across tile seams to form secondary 4-pointed stars.",
                "geometry": "Square cell side s = 2 R, area = 4 R², p4m wallpaper group"
            }
        ]
    elif fold == 6:
        return [
            {
                "step": 1,
                "title": "Isometric Hexagonal Division",
                "instruction": "Rule circle with radius R. Step compass radius R around the circumference to mark 6 equal points at 60° spacing.",
                "geometry": "6 vertices on circle, side length = radius R"
            },
            {
                "step": 2,
                "title": "6-Pointed Star ({6/2}) Inscription",
                "instruction": "Connect alternate vertices with straightedge to form two intersecting equilateral triangles (Seal of Solomon / Hexagram).",
                "geometry": "Hexagram {6/2}, inner radius r = R / √3 ≈ 0.577 R"
            },
            {
                "step": 3,
                "title": "Hexagonal Satellite Rosettes",
                "instruction": "Draw surrounding concentric circles centered at each of the 6 vertices; rule lines through intersections to generate interlocking lozenges and stars.",
                "geometry": "Rhombic facets with 60° and 120° corner angles"
            },
            {
                "step": 4,
                "title": "Honeycomb Tiling (p6m)",
                "instruction": "Frame the unit inside a regular hexagon. Tile edge-to-edge across the plane with zero gaps, forming seamless tri-hexagonal lattices.",
                "geometry": "Hexagonal lattice, p6m symmetry, 3-fold vertex junctions"
            }
        ]
    elif fold == 12:
        return [
            {
                "step": 1,
                "title": "12-Fold Radial Framework",
                "instruction": "Draw circle of radius R. Using compass radius R from the 4 cardinal points, strike arcs to divide the perimeter into 12 equal 30° points.",
                "geometry": "12 perimeter vertices, θ = 30° radial spacing"
            },
            {
                "step": 2,
                "title": "12-Pointed Dodecagram Chords",
                "instruction": "Rule chords skipping 4 vertices ({12/4}) and chords skipping 3 vertices ({12/3}) to establish dual concentric star starpoints.",
                "geometry": "{12/4} star polygon, acute 30° points, {12/3} squares"
            },
            {
                "step": 3,
                "title": "Petal Rings & Almond Shields (Saft)",
                "instruction": "Extend star chords to intersect concentric guide circles, forming 12 almond petals (saft) and 12 outer shielding kites.",
                "geometry": "Dual concentric petal rings, interlocking ribbon channels"
            },
            {
                "step": 4,
                "title": "Tessellation Lattice Framing",
                "instruction": "Enclose rosette in a square or hexagonal repeating tile. Continue strapwork across the borders to interlace with adjacent rosettes.",
                "geometry": "Periodic lattice repeat (p4m or p6m), ribbon interlace"
            }
        ]
    else:  # fold == 16
        return [
            {
                "step": 1,
                "title": "Bisection into 16 Equal Sectors",
                "instruction": "Rule circle and perpendicular diameters. Bisect the quadrants to 45°, then bisect again to obtain 16 equal points on circumference at 22.5° spacing.",
                "geometry": "16 vertices, θ = 22.5° = π/8 radians"
            },
            {
                "step": 2,
                "title": "16-Pointed Star Rosette ({16/5})",
                "instruction": "Rule chords connecting vertex Pi to Pi+5 ({16/5} star). The intersecting chords generate a luminous central 16-pointed star core (na'ura).",
                "geometry": "16-pointed star {16/5}, sharp tip angle 22.5°"
            },
            {
                "step": 3,
                "title": "Radiating Saft & Jabanah Rings",
                "instruction": "Draw concentric outer circles; extend star lines outward to produce 16 radiating almond petals (saft) and 16 surrounding cups (jabanah).",
                "geometry": "Marinid zellige terminology: 16 na'ura, 16 saft, 16 jabanah"
            },
            {
                "step": 4,
                "title": "Architectural Dado Framing",
                "instruction": "Frame the circular rosette inside a square panel. Fill corner spandrels with quarter 8-fold rosettes or interlaced braided borders.",
                "geometry": "Square panel frame, 4 corner spandrel rosettes"
            }
        ]

# Inject drawingSteps into each pattern object
# Find pattern blocks: { id: '...', ... }
pattern_regex = re.compile(r"\{\s*id:\s*'([^']+)',\s*title:\s*'([^']+)',.*?fold:\s*(\d+),.*?style:\s*'([^']+)',.*?constructionNotes:\s*(\`[^\`]+\`|'[^']+'|\"[^\"]+\"),", re.DOTALL)

def replacer(match):
    full = match.group(0)
    pid = match.group(1)
    title = match.group(2)
    fold = int(match.group(3))
    style = match.group(4)
    notes = match.group(5)
    
    steps = get_steps_for_pattern(pid, fold, style)
    steps_ts = "    drawingSteps: [\n"
    for s in steps:
        steps_ts += "      {\n"
        steps_ts += f"        step: {s['step']},\n"
        steps_ts += f"        title: {json.dumps(s['title'])},\n"
        steps_ts += f"        instruction:\n          {json.dumps(s['instruction'])},\n"
        steps_ts += f"        geometry: {json.dumps(s['geometry'])},\n"
        steps_ts += "      },\n"
    steps_ts += "    ],\n"
    
    return full + "\n" + steps_ts

enriched_content = pattern_regex.sub(replacer, content)

with open('apps/player/src/app/upcoming-patterns.ts', 'w', encoding='utf-8') as f:
    f.write(enriched_content)

print("Updated apps/player/src/app/upcoming-patterns.ts successfully!")
