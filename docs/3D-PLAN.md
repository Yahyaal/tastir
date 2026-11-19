# Make it in 3D: plan (19 November 2026)

The owner wants any Tastir design to become an object that can be printed on the Bambu Lab A1 (256 × 256 × 256 mm): carved plaster panels in the style of الجبس المنقوش, ornamental tiles, borders, printed masters for silicone moulds and printed moulds for casting plaster. It must stay a general tool for any material, and it must feel like the rest of Tastir rather than a CAD program.

The owner approved this plan on 19 November 2026.

## Done so far

**3D.1, the relief core (19 November).** `packages/relief` carves any pattern into a closed solid, and `pnpm relief <pattern>` writes the STL with two pictures in low light. Three panels to look at, each with its STL to download for Bambu Studio:

- [Eight-fold star and cross](http://localhost:4200/__review/renders/relief-eight-fold-star-and-cross/index.html): crosses carved as facets, stars as cushions.
- [Twelve-fold rosette](http://localhost:4200/__review/renders/relief-twelve-fold-rosette-mian-hex/index.html): every piece carved as facets, the chip-carved look.
- [Comares dado](http://localhost:4200/__review/renders/relief-alhambra-comares-dado/index.html): flat recesses with drafted walls, the octagons as cushions, inside an 8 mm frame.

Each is 200 × 200 × 12 mm and is made in under a fifth of a second. The tests check that every mesh is closed, that its top covers the panel exactly once, and that the volume of square recesses and of a carved pyramid equals the hand calculation. The command's options are written at the top of `tools/relief.mts`; for example `pnpm relief eight-fold-star-and-cross --kind 1=cushion --frame 8` carves the first kind of piece as a cushion inside an 8 mm frame.

## The idea in one paragraph

A finished Tastir pattern is already a set of exact pieces separated by ink lines. A carved panel is the same drawing given heights: the ink becomes raised strapwork, and each piece is cut down into the surface with a chosen profile. So the 3D stage works like the colour stage. Where the learner gave each kind of piece a colour, they now give it a carving (flat recess, carved facets, domed cushion, cut through, or left raised), and the 3D view and the export follow at once. Everything else (size in millimetres, mould or positive, splitting a large panel) is a few visible buttons around it.

## How the geometry is made exact

Each piece is carved by the distance from its own edge. The band is the first half-width of that distance at full height, and after it the surface falls along the profile the learner chose: a straight wall with a draft angle for a flat recess, a straight slope to the middle for carved facets, a curve for a cushion. The distance from the edge of a polygon is measured with its **straight skeleton**, the ridge lines a hipped roof would have over that shape. Over each face of the skeleton the distance is a plane, so the carved surface can be cut into exact flat faces with no sampling and no jagged edges: a twelve-pointed star carved as facets comes out as clean V-grooves meeting in ridges, exactly as a carver cuts it. We write the straight skeleton ourselves in pure TypeScript, because our pieces are small (a 16-point star has 32 corners), the known open libraries are GPL, and the engine's rule is no runtime dependencies.

The whole top surface is then a height map made of flat faces over the panel's outline. That one fact makes everything else simple and safe. The solid is the top surface, vertical side walls from its edge down to the table, and a flat bottom, so the mesh is closed by construction. A height map printed face up has no overhangs, so every panel, tile and mould prints without supports. A mould for casting is the same height map turned upside down inside a rim, so it uses the same code. Every export is checked before it is offered: every edge belongs to exactly two triangles, all triangles face outwards, and the volume matches the volume worked out from the pieces' areas.

The code lives in a new pure package, `packages/relief`, with the same rules as the engine: no DOM, runs in the Web Worker, and is tested in Vitest. It reads the `Pattern` the engine already gives (the cell, the pieces, the ink and the weave), so tutorials, saved designs and the learner's own patterns all work without changes to the engine.

## What the learner sees

A new stage after Colour, **Make**, at `#/make/<pattern>`. The 3D view fills the left, lit from a low angle like sun on a plaster wall, with a slider to move the light, because carving is only judged well in raking light. A faint square shows the A1 bed, and the panel turns red where it does not fit.

On the right, top to bottom:

1. **What to make**: Panel, Tile, Border, Screen, Mould, shown as buttons with small pictures. Each sets sensible defaults (a Tile is cut on the pattern's own repeat so copies fit edge to edge; a Screen cuts its pieces through; a Mould turns the panel into its negative).
2. **Size**: width in millimetres, or the size of one repeat, with the bed fit shown live.
3. **Carving**: the 2D pattern small, with each kind of piece clickable as in the colour stage. A row of carving buttons and one depth slider apply to the kind chosen. The band has its own width and profile (flat, rounded, or a double line).
4. **Export**: 3MF for Bambu Studio (millimetres, named parts, colours kept), STL for any other program, and SVG outlines in millimetres for laser cutting, CNC and stencils.

Under the buttons, plain numbers a maker needs: the size, the print's plastic in grams, the narrowest band against the A1's 0.4 mm nozzle, and for a mould, the plaster and water to mix in grams.

## The work, in order

Each task is one session and one commit, with tests, and each ends with something the owner can open.

- **3D.1 The relief core.** `packages/relief` with the straight skeleton, the carving profiles, the height-map mesher, the closed-mesh checks and binary STL. A command `pnpm relief <pattern>` writes an STL and a picture to `docs/review/`, so the first panel can go into Bambu Studio before any interface exists. *Test:* three tutorials (an 8-star, a 12-rosette, a Comares panel) give closed meshes whose volume matches the hand calculation, and a regular star's facets meet in one point.
- **3D.2 The Make stage.** The 3D view with three.js loaded only on this page, What to make, Size, Carving and Export (STL and 3MF), with the bed check and the numbers. *Test:* browser checks on the three screen sizes in both themes, and the exported files reopen with the same volume.
- **3D.3 Moulds.** The negative mould with its rim and pouring depth, a printed mould box to pour silicone around a printed master, draft checks for rigid moulds, and the plaster calculator. *Test:* the cast volume equals the panel volume.
- **3D.4 Large panels and borders.** A panel larger than the bed splits into parts along the pattern's own repeat, with alignment pin holes, and a border is a long strip split the same way. *Test:* the parts put together give the whole panel's volume.
- **3D.5 Woven bands in 3D.** The interlace the player already draws becomes real: the band underneath dips at each crossing. Rounded and double-line bands. *Test:* each crossing has one band above the other by the chosen gap.
- **3D.6 Screens and flat cutting.** Pieces cut through for jali screens and lamp panels, with the minimum bridge checked, and SVG/DXF outlines for laser and CNC.

Later, once these are in use: carving on a cylinder for columns and lamps, stamps for pressing clay or plaster, and the learner's own carving profiles.

## Defaults

Unless the owner says otherwise, the first panel is 200 × 200 mm, 12 mm thick, with 8 mm of carving, bands 3 mm wide, and a 6° draft on every wall so silicone and plaster release cleanly. The first workflow made complete is the printed master for a silicone mould, because silicone takes the finest detail and gives many casts, and a printed rigid mould follows in 3D.3.
