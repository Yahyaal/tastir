# Repair 4: measured accessibility and mobile delivery

## Method

Lighthouse 13.6.0, bundled Playwright Chromium, fresh signed-out hosted production build on localhost:4405. Default light theme. Three serial cold-navigation runs before and after; 390×844 mobile viewport, device scale 2, simulated mobile throttling and 4× CPU slowdown. Performance and accessibility categories only. Node 22.23.5. No logged-in account or production writes.

The original Grok scores (78 performance, 87 accessibility) use unknown conditions and are not comparable to these local measurements. Automated accessibility checks do not establish full accessibility. Physical-phone acceptance and keyboard/screen-reader usability remain separate.

Baseline median: performance 96 (95–97), accessibility 88, FCP/LCP 1.44 s, total blocking time 226.5 ms, transferred bytes 846,082. All three runs flagged the same four accessibility audit types: unnamed progress bar, prohibited ARIA attributes on color-chip spans, insufficient text contrast, and no main landmark. The heading-order audit did not fail in this reproduction.

## Repairs

- The library itself is the main landmark; other routes keep their own landmarks.
- The animation group has a group role; its progress bar has its own name. Color chips have image roles matching their existing labels.
- Intermediate badges and verification status use darker amber text in light mode. Dark mode retains its brighter text.
- Each preview retains its 480px image and gains a 320px WebP from the same SVG at the same quality. Lazy-image automatic sizing (with fallback sizes for older browsers) reduces compact-card downloads without changing the construction, colors or full-size viewer. Both image paths participate in the existing generated-asset cleanup.
- Font loading is retained. A measured nonblocking-font experiment reached earlier paint (~0.90 s) but regressed median performance to 91 and introduced layout movement in one run; it was removed. Self-hosting or restructuring font delivery needs a separate measured change, preserving the selected typefaces.

## Reproduction

Build with `VITE_TASTIR_STUDIO=hosted pnpm exec vite build --config apps/player/vite.config.mts --outDir /tmp/tastir-audit-dist --emptyOutDir` after `pnpm catalog`, then serve that directory with Vite preview. Run three separate Lighthouse navigations:

```sh
CHROME_PATH=/path/to/playwright/chromium pnpm dlx lighthouse@13.6.0 http://localhost:4405/ \
  --only-categories=performance,accessibility --output=json --output-path=/tmp/audit.json \
  --form-factor=mobile --screenEmulation.mobile=true --screenEmulation.width=390 \
  --screenEmulation.height=844 --screenEmulation.deviceScaleFactor=2 \
  --throttling-method=simulate --throttling.cpuSlowdownMultiplier=4 \
  --max-wait-for-load=45000 --disable-full-page-screenshot \
  --chrome-flags='--headless=new --no-sandbox --disable-dev-shm-usage'
```

CLI method: [official Lighthouse documentation](https://github.com/GoogleChrome/lighthouse#using-the-node-cli).

Before/after raw reports are local in `/tmp/tastir-lighthouse/`; durable summarized results and regression coverage are recorded here.

## Final measured result

| Metric | Before (median) | After (median) |
| --- | ---: | ---: |
| Accessibility score | 88 | 100 |
| Performance score | 96 | 96 |
| First/largest contentful paint | 1.436 s | 1.420 s |
| Total blocking time | 226.5 ms | 229 ms |
| Layout shift | 0.000088 | 0 |
| Initial transfer | 846,082 bytes | 671,938 bytes |

All three final runs scored 100 for accessibility and had zero failed automated accessibility audits. Performance was 95/96/96; the 21% transfer reduction is the clear delivery improvement, rather than a claim of a higher score. Google Fonts remains in render-blocking diagnostics. Broad bundle splitting and font self-hosting are deferred, with this measured baseline for future work.

[Durable per-run metrics](grok-audit-metrics-2026-11-15.json) include versions, timestamps and all six runs. The nonblocking-font experiment is excluded from final results; its three scores were 89/92/91.

## Regression verification

Full root lint, TypeScript and all 13 test tasks passed serially with one Vitest worker; public and hosted production builds passed. The combined desktop/phone production-browser suite passed 51 cases, with one existing phone skip for desktop-only next/previous controls. It includes collection links, Unicode search, browsing, editable-file round trips and exact-view sharing.

Four new browser cases cover both light/dark themes on desktop and phone: one main landmark, named progress, valid chip roles, responsive images loading, no horizontal overflow, and contrast ratios of at least 4.5:1 for every intermediate badge and verification label.

Commands: `pnpm lint --parallel=1`, `pnpm typecheck --parallel=1`, `pnpm test --maxWorkers=1`, `pnpm exec nx run player:build --parallel=1`; Playwright files `library-accessibility`, `library-entry-points`, `browsing`, `pattern-files` and `settings-sharing`, projects desktop/phone.

The visual presentation was checked at 390px and 1280px in both themes: no horizontal overflow or page errors. The detailed 320px octagon-band preview was also inspected visually.
