# Printing tile pieces on the Bambu Lab A1

This guide takes you from a pattern in Tastir to printed pieces on your A1, step by step. You need Bambu Studio on your computer and your A1 switched on. Start with a small test: one tile of the pattern, so you can check the fit before printing a whole panel. One tile of the Attarine star rosettes at a 100 mm repeat is 121 pieces on 5 plates, one plate to a colour.

## 1. Open the pattern's Make page

1. Open the pattern, for example the Attarine star rosettes: https://tastir-studio.vercel.app/#/attarine-star-rosettes/result
2. If you want your own colours, colour the wall now on the right ("Colors"). The pieces take the colours the wall shows.
3. Scroll the right-hand panel down to **Take it with you** and click **Make it in 3D**. You can also go straight to https://tastir-studio.vercel.app/#/attarine-star-rosettes/make

The Make page opens with a 3D view on the left and the choices on the right.

## 2. Choose tile pieces and their size

1. Under **What to make**, click **Tile** for the first test (one repeat of the pattern). For a full panel, click **Panel** and set **Width** and **Height**.
2. Under **Print**, click **Tile pieces**. The view now shows every piece in its colour with thin gaps between them.
3. Choose the edges. **Cut straight** cuts the pieces at the edge along the outline, for a finished piece with straight sides. **Whole pieces** cuts nothing: the edge zig-zags, so you can print more later and lay them on to make the wall larger. With **Tile** and **Whole pieces**, set **Repeats across** and **Repeats down** under **Size** for how many repeats to print.
4. Leave **Joint** at **0.6 mm**. This is the gap between two pieces: printed pieces come out a little large, and the gap lets them still lie side by side.
5. Leave **Bevel the top edge** ticked. It makes each joint read as a fine line.
6. Under the magnet sizes, click the magnets you have: **6 × 2 mm** is the common size. Click **None** if you have no magnets yet.
7. Under **Size**, set **One repeat** to **100 mm** and **Thickness** to **5 mm**.

Under the buttons, the page says how many pieces and plates you get. Lower down, the pieces list shows each colour with its pieces, how many plates and grams of filament, and the magnets to buy. If it warns that the smallest piece is under 3 mm, raise **One repeat** to the size it suggests.

## 3. Download the files

1. Under **Download**, click **Download plates (zip)**. Your browser saves a file ending in `-plates.zip` in your Downloads folder.
2. Click **Download layout** too. This saves an SVG drawing of the whole panel at full size, with every piece numbered.
3. Open your Downloads folder and double-click the zip to unpack it. Inside there is one file to a plate, named by its colour, for example `01-cream-plate-1-of-1.3mf`.

Each file holds only pieces of one colour, so each plate prints with one filament and no colour changes.

## 4. Open a plate in Bambu Studio

1. Open Bambu Studio and click **New Project** (or **File → New Project**).
2. At the top left, check the printer is **Bambu Lab A1 0.4 nozzle**. Under it, choose the filament you will load, for example **Bambu PLA Basic**, and the plate you use, for example **Textured PEI Plate**.
3. Click **File → Import → Import 3MF/STL/STEP/SVG/OBJ/AMF…** (or press Ctrl+I) and choose the first plate file, for example `01-cream-plate-1-of-1.3mf`.
4. Bambu Studio may say the file was not made by Bambu Studio and that it will load only the shapes. Click **OK** or **Yes**: the shapes are all we need. If it asks whether to load the file as **one object with several parts**, click **No**, so each piece stays its own object.
5. The pieces appear on the plate, already spaced apart. If any lie off the plate, press **A** (Arrange) and Bambu Studio packs them again.

Do not scale or rotate the pieces: they are already the right size, face up.

## 5. Slice and print

1. In the process settings on the left, choose **0.20mm Standard @BBL A1**. The defaults are fine: no supports are needed, because every piece is flat underneath and its magnet pocket bridges cleanly.
2. Click **Slice plate** at the top right. The preview shows the time and the grams of filament.
3. Load the filament of that colour in the A1.
4. Click **Print plate**. If your A1 is connected to Bambu Studio over Wi-Fi, choose it in the window that opens and click **Send**. If it is not connected, click the arrow next to **Print plate**, choose **Export plate sliced file**, save it to the A1's microSD card, put the card in the printer, and start the print from the A1's screen.
5. When the plate is done and cool, flex the plate a little and the pieces come off.

Then repeat steps 4 and 5 for each of the other plate files, changing the filament each time.

## 6. Magnets and laying the pattern

1. Turn each piece over. The round pocket in the middle takes one magnet. Press the magnet in with your thumb, or on a hard table. If it is loose, add a small drop of superglue first. Either face of the magnet holds on steel, so you cannot put it in the wrong way round.
2. The pieces list on the Make page says which pieces are too small for your magnet and took a 3 × 1 mm one instead, and how many of each size you need.
3. Print the layout SVG at **100 %** (not "fit to page") and lay it on a table, or on a steel sheet, a fridge or a magnetic whiteboard. Lay each piece on the shape of its colour. The numbers on the layout match the names of the pieces in Bambu Studio, which helps with the pieces cut at the edge.

## What to tell me after the first test

- Do the pieces lie side by side, or are the joints too tight or too wide? The **Joint** can go from 0 to 3 mm.
- Do the magnets go in and hold?
- Does the bevel show the joints as fine lines?
