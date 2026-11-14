# Night report, 14 November 2026

While you slept I put the near-similar designs (groups 9 to 15 on the duplicates page) into families and fixed two test problems. Everything is on the local branch `library/similar-designs`, one commit, **not pushed and not deployed**, because a deploy is the one step I hold for your OK.

## Start the dev server

```bash
git checkout library/similar-designs
```

```bash
pnpm dev
```

Then open the links below at http://localhost:4200. The first page can take half a minute while the library is prepared.

## 1. Five new families of designs built from the same pieces

These are different designs, not one design in several places, so they became Variations families like the khatam one. Each member has one sentence, shown when you point at its picture in the Variations row.

| Group | Family | Open it |
| --- | --- | --- |
| 9 | Stars and connectors of the Charbagh madrasa: Charbagh, Iranian star columns, Qom Atiq | http://localhost:4200/#/charbagh-stars/result |
| 10 | Eight-pointed stars, crosses and pentagons: Fatehpur Sikri, Isfahan Royal Mosque rows, Topkapı pinwheel | http://localhost:4200/#/fatehpur-sikri-stars/result |
| 11 | Stars, crosses and squares of Khojent and Mosul | http://localhost:4200/#/khojent-tile-stars/result |
| 12 | Octagons of Bourgoin plates 144 and 52 | http://localhost:4200/#/bourgoin-144-octagon-bands/result |
| 13 | Ten-pointed stars of Çamlıca and the Imamzadeh Ismail | http://localhost:4200/#/camlica-mosque-stars/result |

**What you should see:** the library shows one card for each family with "· N variations", and the pattern page has a Variations row with each member's picture. The duplicates page, http://localhost:4200/#/plan/duplicates, marks groups 9 to 13 "Changed on this branch".

**Why it was done this way.** Charbagh and the Iranian columns use exactly the same six pieces in the same amounts, laid out as a grid or as columns; Qom uses the same six in other amounts. The six are the khatam's five plus a long ten-sided connector, so I kept them out of the khatam family. Seyyed (group 11) has the same four pieces as Khojent and Mosul, but it already sits in its own family with the Sayyed crosses, and a pattern can be in only one family, so it stays there.

**Groups 14 and 15 were already families** (the Paccard 222 rosettes with Bou Inania, and Najjarin with Meknes Bou Inania), so nothing changed there.

## 2. Two test fixes

- **Typecheck.** With more notes in `variations.json`, TypeScript could no longer read the file as the `Family` type, so `library.ts` now asserts the type and the library test checks the notes instead: each note belongs to a member, is a sentence, and every new family has one for each member.
- **The slow library test.** "plays the tutorial it names" builds the whole library and took 34 to 59 seconds while another project's Python job (`sq_phase7.py`, 11 workers) kept the machine busy; its limit is now 90 seconds instead of 30.

## 3. Checks

- **Typecheck** passes in all 8 projects.
- **Lint** has 0 errors (260 old warnings).
- **Player tests:** 91 files, all 3,041 tests pass, including the slow library test.
- **Browser tests:** 240 pass and 17 are skipped. One fails: "bou-inania-rosette: stages open promptly while geometry runs in the background", which measures how fast the lesson stages open. Nothing in this change touches that path. It also failed on 13 November before any of this work, and it passed once when the machine was quieter. The load average was 14 to 16 all night, from the Python job. Run alone, it took 1.84 s against its 1 s limit, the same 1.5 to 1.8 s as on 13 November. Run it again when the machine is quiet, with `pnpm exec playwright test apps/player/e2e/large-patterns.spec.ts -g "bou-inania-rosette: stages"`.
- **I also checked by hand** in the dev server that all five families show their Variations row with a sentence for each member, and that this report shows at http://localhost:4200/#/notes/night-report.

## Two questions for you

1. **"Line OB crosses…" in the step texts.** The work queue lists 34 steps that start "Line OB crosses…" (Atik Valide, Mihrimah, Imamzadeh Ismail and others) as missing "The". But the writing rules (`docs/tutorial-writing.md`, rule 4) say to name lines exactly as "Line OE". The two disagree, so I changed nothing. Which do you want?
2. **Notes for groups 14 and 15.** Those two older families have no sentence per member. I could not tell their differences apart reliably from the small pictures, so I left them without notes rather than guess. Tell me what you see, or say "skip".

## To deploy

When you are happy with the families, say "push and deploy" and I will merge into main and push; Vercel then deploys https://tastir-studio.vercel.app.
