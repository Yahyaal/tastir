# Repair 5: ordinary lesson addresses and Back/Forward

Policy: explicit learner choices add history; autoplay replaces the current entry. The current player remains mounted across ordinary positions of one lesson, so Back/Forward pauses and restores the stage without replacing the drawing, resetting appearance or scrolling to the top. A different lesson still gets a fresh player.

`#/eight-fold-star-and-cross/watch/3` opens paused at the third playback position. This is the displayed journey position (individual parts count), not a raw tutorial JSON step id. Construction, ink and later stages share the same journey. The finished wall uses the existing result address. The optional `?order=color` inside the hash retains the alternate color-first order. Explicit positions override local resume; oversized safe numbers clamp to the end; zero, negative, nonnumeric and unsafe-number paths are rejected through the existing missing-tutorial page. Existing base/watch/repeat/result, own-pattern, saved-design and full-view sharing paths remain supported.

History writes notify the router without remounting or scroll reset. Restoring browser history cancels old animation work; a generation guard prevents an earlier reverse-animation completion from overwriting a later history jump. Sharing and saved-design navigation stay separate from ordinary lesson history and retain unsaved-design guards.

The first production regression run passed the six new desktop/phone navigation scenarios and existing sharing checks. Two existing browsing assertions expected the old unnumbered watch URL; updated those assertions to require a numbered watch URL while retaining their stage, navigation and overflow checks. Final verification follows below.

## Verified

Root lint, TypeScript and all 13 test tasks passed with one worker; the production build passed. Twelve route-parser/bounds cases and the three collection-route regressions are included. Ten dedicated desktop/phone navigation cases passed, including retained DOM identity, exact reload, resume precedence, bounds, alternate order and browser navigation during reverse animation. The unchanged production build also passed 37 existing browsing/playback/sharing cases, with one intentional phone skip for desktop-only next/previous controls.

Logs: `/tmp/tastir-repair5-{lint,types,tests,build}.log`, `/tmp/tastir-repair5-browser-final.log` and `/tmp/tastir-repair5-browser-navigation.log`. Two new test harness selectors were corrected during validation (the stage label is a paragraph, and the retained-player marker must wait for the model rather than tag the loading shell); no product failure remained in those cases.
