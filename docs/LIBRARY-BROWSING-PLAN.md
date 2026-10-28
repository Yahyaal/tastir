# Plan: browsing a library of two hundred patterns (27 October 2026)

The owner asked on 27 October 2026 for easier browsing now that the library has more than 170 patterns: pagination, a side menu for exploring, and a smarter search. This is the plan, waiting for the owner's OK. Nothing in it is built yet.

## Where things stand

The library has 210 tutorials. Families fold variations into one card, so it shows about 180 cards on one long page. Above the cards are a search box, which looks only through the title, short name, subtitle, style and id, a chip for each fold, and drop-downs for tradition and level. The library already remembers its filters and the card the learner was looking at, so Back returns to the same place. Each card's preview is a thumbnail made ahead of time by `pnpm catalog`, so the page does not draw 180 patterns when it opens.

Two things get in the way of better browsing. The `style` field has grown 28 different values for the same few traditions, such as "Marinid", "Marinid zellige (Fès)" and "Moroccan", or "Timurid / Persian" and "Persian". And no field says where a pattern is from, only the free-text subtitle.

## What to build

**No pagination.** The library is a gallery people browse by eye, and pages would hide most of it and spoil the remembered place. The side menu does the narrowing instead. If the page ever opens slowly on a phone, cards further down will be drawn as they scroll into view, which keeps one list with nothing hidden.

**Clean data first.** Add a `region` field to every tutorial, from a fixed list, because the side menu and the search need a place they can trust. The list:

- Alhambra and Nasrid Spain
- Spain and Portugal, other
- Morocco
- Algeria and Tunisia
- Egypt and Syria
- Turkey
- Iran
- Central Asia
- India
- Books and other

Also cut `style` down to a fixed list of traditions (Nasrid, Mudéjar, Marinid, Moroccan, Mamluk, Seljuk, Ottoman, Persian, Timurid, Safavid, Mughal, Roman, Islamic, and a few more), because the tradition drop-down and the cards repeat whatever it says. Both become enums in the schema, so a new tutorial cannot add a variant spelling. A script proposes each tutorial's region and tradition from its style, subtitle and credits. The owner checks the full list on one notes page before it is written into the tutorials.

**A side menu.** On a wide screen it stands at the left of the cards. On a phone a "Browse" button opens it as a drawer over the cards. It has four groups, each value with the number of patterns it holds:

- Region, from the new field.
- Symmetry: 6-, 8-, 10-, 12- and 16-fold, and the mirror and half-turn ones. This is the main star's points, as the fold chips already count it.
- Level: beginner, intermediate, advanced.
- Tradition.

Choosing a value filters the cards. Values from different groups combine, and the counts update as the learner chooses. The menu replaces the fold chips and the two drop-downs, so filters are set in one place. The chosen filters show as removable tags above the cards, with "Clear all". The menu is a list of links and buttons the keyboard and screen readers can use, as the rest of the library is.

**A smarter search.** It stays one box above the cards, and it runs in the browser, with nothing sent anywhere:

- **More to search.** Each card's catalog entry gains a short list of searchable words: the region, the building or place, the source names from `credits` (Bourgoin, Wichmann, Wade, Mian…) and the piece names. So "Bourgoin", "Qaytbay" or "kite" find their patterns.
- **Place names.** A small dictionary of other spellings and related names: Fez and Fès, Isfahan and Esfahan, Granada and Alhambra, Istanbul and Constantinople, Cairo and al-Qahira. Accents are already ignored.
- **Numbers.** "16 point", "sixteen-fold" or "twelve pointed" filter by symmetry instead of looking for the word.
- **Small typos.** A word one letter off still matches ("Alhmbra"), but only for words of five letters or more, so short words stay exact.
- **Best match first.** Matches in the title come before matches in the subtitle, and those before matches in the credits.

When nothing matches, the page says so and offers to clear the filters.

## Order of work

1. Write the region and tradition proposal script, and show its full list on #/notes for the owner to check. **This needs the owner's OK before anything is written into the tutorials.**
2. Add `region` and the tradition enum to the schema and the tutorials, and teach `pnpm catalog` to write the region and the search words into each preview. Update `docs/tutorial-format.md` and the builder briefs so new tutorials fill the region.
3. Build the side menu and the drawer, with the filter tags.
4. Build the smarter search.
5. Remove the fold chips and the drop-downs the menu replaces.

Each step is its own commit, with tests: `browsing.spec.ts` for filtering and search, a new spec for the side menu, and the browser suite for the drawer on a phone and the remembered place.

## What the owner will check by eye

Run `pnpm dev` and open http://localhost:4200/.

- On a wide window the menu sits at the left, with counts. Choosing Region → Morocco and Symmetry → 16-fold leaves only those cards, with two tags above them.
- On a phone-sized window, "Browse" opens the menu as a drawer.
- Typing "fez sixteen" finds the sixteen-fold Moroccan patterns, and "bourgoin" finds Bourgoin's plates.
- Back from a pattern returns to the same filters and the same card.

## Cost

About a day of work for one session, with the most effort in step 1. The weekly usage was near 75% on 27 October, so this waits until Codex's six- and twelve-fold branch has been reviewed, unless the owner says otherwise.
