# Morning report, 17 November 2026

## Live now

**Watercolour is published.** [PR #20](https://github.com/Yahyaal/tastir/pull/20) is merged, Vercel deployed it, and the live site has the new style. Open any finished wall on [the live site](https://tastir-studio.vercel.app/#/alhambra-arrayanes-porch-ceiling/result) and choose Watercolour. Each piece is painted on its own, and the paper between the pieces is the pattern. The full browser suite passed before the merge: 407 passed, none failed. PR #19 (GitHub Pages retired, the cleanup list) was already merged.

The same PR fixed a bug that PR #18 had shipped. On the "This pattern cannot be shown" page, the "All patterns" link had lost its name for screen readers, because its text is now hidden. The browser tests caught it, and it has a label again.

## Ready for you to look at, not merged

Six more of your notes are done on the branch `style/next`. I held them back from merging, because each one changes how walls look and you should see them first. To try them, run `git switch style/next` and `pnpm dev`, then open the links below. When you are happy, they go out as one PR.

- **STYLE.9 Plain piece names.** The colour list says "pointed star", "twelve-sided piece" and "background" instead of `pointed_star`, `twelve` and `ground`. Stars are counted by their points. See [Dos Hermanas](http://localhost:4200/#/alhambra-dos-hermanas-jamb-rosette/result), under Colors.
- **STYLE.10 One order for the colouring tabs.** By place, Ring by ring and By shape now appear in that order everywhere.
- **STYLE.13 The faint reset button.** It looked broken because it was disabled. It now appears only after you change something. The pen panel that had "Reset the drawing" is gone with Watercolour.
- **STYLE.8 Grout that hides the pieces.** When a palette has a black piece, the black grout now gives way to cream, brown or grey. On [Dos Hermanas](http://localhost:4200/#/alhambra-dos-hermanas-jamb-rosette/result) in Tiles with the Alhambra palette, the stars have outlines again. A grout you pick yourself is always kept, and band edges keep their dark colour.
- **STYLE.4 White pieces under white bands.** In Strapwork and Interlace, a piece the colour of the band now takes a light tint of the palette's strongest colour. Look at the [Arrayanes ceiling](http://localhost:4200/#/alhambra-arrayanes-porch-ceiling/result) in Interlace: the white pieces are pale gold, so the white bands show.
- **STYLE.11 Dense walls open closer.** The wall now opens at about 40 pieces across instead of 60. Dos Hermanas opens at about three repeats instead of four and a half. Simple patterns are unchanged.
- **STYLE.7 Jali you can read.** The lattice now gets thinner on dense patterns, so the openings show the pattern. Dos Hermanas in Jali showed scattered holes and now shows its stars and rosettes. The Lattice slider still works.

Checks on `style/next`: all 3,147 player unit tests pass, the typecheck is clean, and the full browser suite passes (407 passed, 22 deliberate skips, none failed). While I worked, your emergence-lab calibration job was using every core, so the tests ran slowly and one test timed out once. That test passed when rerun on its own. I left the job running.

## Waiting for your decisions

**STYLE.3 Strapwork or Interlace.** I recommend removing Strapwork. The two draw the same bands; Interlace only adds the over-and-under weave, which is what makes it look better. Strapwork's one use is for a pattern whose bands cannot weave, where the player already hides Interlace. So I would keep Strapwork only for those patterns, and show Interlace everywhere else. Tell me yes and I'll do it.

**STYLE.6 A name for Jali.** My first choice is **Carved screen**: it says what it is (a pierced panel in stone, wood or metal) in words a newcomer knows. Two alternatives are **Pierced screen** and **Lattice**. Lattice is shortest but already names the slider.

**STYLE.2 Touching pieces in the same colour.** This is the biggest of your notes. Today every piece of one shape takes one colour, so where two pieces of the same shape touch, as on the Arrayanes ceiling, they merge. The fix is to colour by place: copies that touch take different colours from the palette. Some tutorials already do this by hand ("By place"). I suggest a short study first: count how many patterns have touching same-colour pieces, then show three of them before and after, so you can judge the rule before it reaches every pattern.

**STYLE.5 Separate colours for each style.** This changes what a saved design stores, so I want your OK on the behaviour first. My proposal: each style remembers its own palette and colour choices. Watercolour opens in a paper palette (Rose or Indigo and ochre), Interlace in its own palette, and switching styles never loses what you chose for another style. Old designs keep one colouring for all styles until you change one.

**STYLE.12 The slider's names.** Watercolour's slider is now Paper line, so the names are Line width (Tiles), Band width (Strapwork and Interlace), Paper line (Watercolour) and Lattice (Jali). Each matches what it changes, so I'd leave them. The "1×" value could become a plain thin/thick scale if you find it unclear.

## Still open from before

The cleanup list TIDY.1–7 is in [Tasks](TASKS.md). Physical-phone pinch-zoom acceptance and the learning path's photo and newcomer checks (LEARN.3) are unchanged.
