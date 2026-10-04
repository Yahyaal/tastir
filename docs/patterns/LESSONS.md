# Lessons from writing pattern tutorials

Each entry is a mistake that already cost time once, or a fact that saves time. Add to it whenever something surprises you.

## Research

- The Met Museum's educator PDF (`islamic_art_and_geometric_design.pdf`) answers scripts with an HTML page, not the PDF. Check every download with `file` before reading it.
- mamootdiy.com has numbered written steps with one picture per step for several patterns (six-fold model, four-fold model, five-fold model, six-fold hammerhead, Ibn Tulun window, six-fold snowflake, Alhambra rosette tile). Its pictures download with a plain `curl -A "Mozilla/5.0"`; drop the `?w=` suffix for full size.

## Format

- The cell may be a rectangle or a parallelogram whose lattice also repeats as a rectangle, such as the 60° rhombus of a hexagonal pattern. Repeats exist for `rot3`, `rot4`, `rot5`, `rot6`, `rot8`, `rot10`, `rot12` and `rot16`.
- The golden test checks the tutorial's `fold` symmetry about O for pieces within distance 1 of O, so O must be a rosette centre and OA should be about the size of the rosette.
