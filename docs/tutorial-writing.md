# Writing the steps

The steps are read by beginners, many of them reading English as a second language, while their hands are busy with a compass and a ruler. So every step is written in simple, controlled English, after ASD-STE100 (Simplified Technical English), and the owner checks the result by eye. Squares and stars (`alhambra-arrayanes-squares`) is the first tutorial written this way and Star and arrows (`alhambra-star-and-arrows`) the second; the others follow in batches. Eight-fold star and cross, the format's worked example, waits for a batch of its own: some 30 test files use its point names (E, NE, k.1), so renaming them means rewriting those tests too.

## The rules

1. **One action to a sentence.** The player shows each sentence of a step on its own numbered line, so a sentence that asks for two things ("Rule a line and draw a circle") becomes two sentences. A sentence may also say what the last action made ("It crosses line FE at T."), because the next action uses it: the player numbers only the sentences that open with an action verb (Draw, Join, Mark…) and shows the others as an unnumbered note under them. A point that only says where the next action goes belongs in that action ("Draw a circle with centre O through S, where the vertical line through V crosses line OE."), not on a line of its own.
2. **Only actions and the points they make.** Background about the pattern ("a star will sit at O…") is not a step. It belongs in the tutorial's description, or nowhere.
3. **Name every point you use, with one capital letter.** "Where the circle meets the two lines, on the left" makes the learner work out which point is meant; "through B" does not. The board shows each point the step names, large and ringed, as soon as it is on the learner's board. Use letters, not codes like P90 or C180, and skip I and O (O is the centre), which look like numbers. A family of points that a step uses together is one letter with numbers, counted counter-clockwise: the star's eight points are S1 to S8, so a step reads "Join S2, S4, S6 and S8". A letter or name is never used for two points in one tutorial, because earlier names stay on the board. Name a point where a step uses it, not before: every point a text names shows large on the board, so a note that names twelve points the ink will need only crowds the step.
4. **Name lines by their points or by their direction.** "Line OE", "line FE", "the horizontal line", "the vertical line". Never "the diagonal d45" or "circle c": those are names for the engine.
5. **Use the same few words every time.**

   | Write | Not |
   | --- | --- |
   | Draw a straight line through X and Y | Rule, join (except for the sides of a shape) |
   | Draw a horizontal line / a vertical line through X | Rule the horizontal, the line at right angles to |
   | Draw a circle with centre X through Y | Draw the circle about X |
   | Draw a line through X parallel to line YZ | |
   | Draw the line through X that halves the angle YXZ | Cut the angle in half, bisect |
   | It crosses … at X | It meets, where it intersects |
   | Join X, Y, Z and W with straight lines (a shape's sides) | |

6. **Ask only for what is still to draw.** When some sides of a shape are already on the board, ask for the missing lines by their points and say which lines are the other sides ("Draw a straight line through S and X. … The vertical lines through V and W are the other two sides of the square SXYP."). "Join the four points: this makes a square" sounds like a new polygon, while the board asks for two lines.
7. **Group the same action.** Twelve lines drawn the same way are one or three sentences, not twelve: "Draw a straight line through S1 and S6, S2 and S7, S3 and S8, and S4 and S9." "Draw a line through each of A, C and E, at 90° to its line from O." The steps share one box above the board, sized to the longest, so a step of twelve numbered lines shrinks the board for the whole tutorial. A test keeps every step to twelve sentences.
8. **Short sentences.** Twenty words at most; a step's text that runs long is split into `parts`, each one move, with the step's own `text` as a short heading ("Draw the square tile.").
9. **Write both texts.** When helper lines are hidden, a part that leaves lines out gives `textWithoutHelpers`, written by the same rules and naming only what is drawn.

## The ink

The ink is written the same way, a shape at a time, in `ink.parts` (see the format): one part for each shape or run of lines, whose text names the points the pen goes through ("Ink the star: from S1 through P2, S2, P3, S3 and on round the star, back to S1."). A family is named by its ends ("S1 to S8 are its points"), and the board shows every point of it. Draw along shows the parts as a checklist, zooms to the points of the part at hand, picks its lines out in orange and ticks it once they are inked. Name the turning points of the ink with families too (P1 to P8 for the star's inner corners, X1 to X8 where the bands meet the tile's sides); the engine's own names (M1, B45) never appear in a text.

When one shape takes more than five runs to name, the part asks for "the lines picked out in orange" and names the landmark points they pass through instead of every corner: the board already picks those lines out, and a long list of P-numbers would shrink the board for the whole tutorial. Generated tutorials that ink along lines (the four-fold ring, the khatam) keep one plain ink text.

## How it is checked

A test (`apps/player/src/app/plainText.spec.ts`) checks every tutorial in its list of rewritten tutorials: no word from the "Not" column, no engine names in the text, no sentence over twenty words, and every capital letter used as a point name is a point the tutorial makes. Add a tutorial to that list when it is rewritten.
