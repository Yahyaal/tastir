import './review.css';
import './reliabilityUpdate.css';

export function ReliabilityUpdate() {
  return (
    <main className="review reliability-update">
      <nav className="review-top">
        <a href="#/review">← Review</a>
        <a href="#/notes/grok-review">Full triage →</a>
      </nav>
      <header>
        <p className="reliability-kicker">Morning report · 16 November 2026</p>
        <h1>While you slept.</h1>
        <p>
          I continued with lesson navigation, draw-along guidance and everyday
          usability. Here is what changed, what the checks show and what
          remains. These seven repairs are now published through PR #17.
        </p>
        <a href="#/notes/morning-report">
          Written report and supporting evidence →
        </a>
      </header>
      <nav className="reliability-steps" aria-label="Morning report sections">
        {[
          ['navigation-repair', 'Step links and Back'],
          ['draw-teaching-repair', 'Clearer drawing guidance'],
          ['usability-repair', 'Your work and loading'],
          ['next-checks', 'What comes next'],
          ['earlier-repairs', 'The earlier four repairs'],
        ].map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            onClick={(event) => {
              event.preventDefault();
              const target = document.getElementById(id!);
              if (id === 'earlier-repairs') target?.setAttribute('open', '');
              target?.scrollIntoView();
            }}
          >
            {label}
          </a>
        ))}
      </nav>
      <section id="navigation-repair">
        <p className="reliability-kicker">5 · Overnight follow-up</p>
        <h2>A bookmark should return to the step you saw.</h2>
        <div
          className="search-evidence"
          role="group"
          aria-label="Lesson history policy"
        >
          <div>
            <span>Next, Next</span>
            <strong>1 → 2 → 3</strong>
            <span>deliberate visits enter history</span>
          </div>
          <div>
            <span>Browser Back</span>
            <strong>3 → 2</strong>
            <span>same drawing, paused at the earlier position</span>
          </div>
          <div>
            <span>Autoplay</span>
            <strong>1 entry</strong>
            <span>the address follows; history stays quiet</span>
          </div>
        </div>
        <p>
          Numbered links open paused, take priority over this browser’s saved
          resume point, and survive reload. The color-first order is retained
          when selected. Existing full-view share links still carry appearance
          and framing; an ordinary step link identifies the lesson position.
        </p>
        <a href="#/eight-fold-star-and-cross/watch/3">
          Open the star-and-cross lesson at position 3 →
        </a>
      </section>
      <section id="draw-teaching-repair">
        <p className="reliability-kicker">6 · Overnight teaching repair</p>
        <h2>The hint should use the name you can see.</h2>
        <p>
          The first circle passes through A. E is a later name for that same
          point; the old hint introduced it too soon.
        </p>
        <div className="reliability-compare">
          <figure>
            <img
              src="/__review/renders/reliability-2026-11-16/before-hint.png"
              alt="Before: Choose Circle, click O, then E."
              loading="lazy"
            />
            <figcaption>
              <strong>Before:</strong> the instruction said A, while the hint
              said E.{' '}
              <a href="/__review/renders/reliability-2026-11-16/before-first-step.png">
                See the complete captured page.
              </a>
            </figcaption>
          </figure>
          <figure>
            <img
              src="/__review/renders/reliability-2026-11-16/after-hint.png"
              alt="After: Choose Circle, click O, then A."
              loading="lazy"
            />
            <figcaption>
              <strong>After:</strong> point names follow the current step.{' '}
              <a href="/__review/renders/reliability-2026-11-16/after-first-step.png">
                See the complete captured page.
              </a>
            </figcaption>
          </figure>
        </div>
        <p>
          The next-tool recommendation now remains visible if another tool is
          selected. After the horizontal line, it explicitly recommends
          Perpendicular. It leaves the choice and the drawing to the learner.
        </p>
        <div
          className="search-evidence"
          role="group"
          aria-label="Verified draw-along order"
        >
          <div>
            <span>Finish construction</span>
            <strong>Ink</strong>
            <span>the final reveal comes next</span>
          </div>
          <div>
            <span>After inking</span>
            <strong>Repeat</strong>
            <span>place copies of the tile</span>
          </div>
          <div>
            <span>Then</span>
            <strong>Color</strong>
            <span>the complete path is reachable</span>
          </div>
        </div>
        <p className="reliability-result">
          110 desktop/phone browser checks passed, including every beginner
          lesson’s board stability and guide checks. This verifies the named
          reports; the three older reports without their original reproduction
          details remain unconfirmed.
        </p>
        <a href="#/eight-fold-star-and-cross/draw">
          Try the corrected first two draw-along steps →
        </a>
      </section>
      <section id="usability-repair">
        <p className="reliability-kicker">7 · Everyday usability</p>
        <h2>Keep a copy and see its complete preview.</h2>
        <p>
          Duplicate is now available on Your work for both designs and
          constructions. A saved message confirms the copy; a storage error
          leaves the original stored data unchanged.
        </p>
        <div className="reliability-compare">
          <figure>
            <img
              src="/__review/renders/reliability-2026-11-16/before-personal.png"
              alt="Earlier saved-design card: an arch masks the corners and only Rename and Delete are offered."
              loading="lazy"
            />
            <figcaption>
              <strong>Before:</strong> the library’s arch also masked personal
              previews.
            </figcaption>
          </figure>
          <figure>
            <img
              src="/__review/renders/reliability-2026-11-16/after-personal.png"
              alt="Updated saved-design card: a rectangular preview and visible Duplicate, Rename and Delete actions."
              loading="lazy"
            />
            <figcaption>
              <strong>After:</strong> personal previews retain their rectangular
              edges. Library cards keep their arches.
            </figcaption>
          </figure>
        </div>
        <p>
          A design copy keeps its ink, colors and style while sharing its source
          construction. Duplicate a pattern for a separate construction,
          including its laid wall and credits. Make a variation now explains
          that it saves a copy in this browser before opening the editor.
        </p>
        <details className="reliability-more-evidence">
          <summary>See the loading screen and clearer repeat guides</summary>
          <figure className="loading-evidence">
            <img
              src="/__review/renders/reliability-2026-11-16/after-loading-phone.png"
              alt="Phone loading screen with the pattern preview, title, current preparation stage and an All patterns link."
              loading="lazy"
            />
            <figcaption>
              The pattern stays visible while its real preparation stages run.
              There is no artificial percentage or waiting time.
            </figcaption>
          </figure>
          <div className="reliability-compare">
            <figure>
              <img
                src="/__review/renders/reliability-2026-11-16/before-repeat.png"
                alt="Before: faint amber outlines of possible next tile copies."
                loading="lazy"
              />
              <figcaption>Earlier repeat guides.</figcaption>
            </figure>
            <figure>
              <img
                src="/__review/renders/reliability-2026-11-16/after-repeat.png"
                alt="After: stronger blue dashed outlines distinguish possible tile positions from placed ink."
                loading="lazy"
              />
              <figcaption>
                Stronger dashed guides.{' '}
                <a href="/__review/renders/reliability-2026-11-16/after-repeat-dark.png">
                  Inspect dark mode.
                </a>
              </figcaption>
            </figure>
          </div>
        </details>
        <p className="reliability-caption">
          Editor tooltips and sideways phone scrolling already existed. They
          were checked rather than replaced. Personal-card actions now have
          44-pixel touch targets.
        </p>
        <a href="#/work">Open Your work and try Duplicate →</a>
      </section>
      <section id="next-checks">
        <p className="reliability-kicker">Conclusions and next steps</p>
        <h2>The repair release is live.</h2>
        <p>
          Review the changed flows on the live site. The original three unnamed
          draw-along reports stay unconfirmed until their lessons and steps can
          be identified. The reported jump from construction to Ink is the
          intended sequence; the complete path through Repeat and Color was
          verified.
        </p>
        <p className="reliability-result">
          All root checks and 251 desktop/phone browser cases passed, with 11
          intentional platform skips. Final home-page mobile audits scored 100
          for accessibility and 95/96/96 for performance, transferring about 673
          KB rather than the original local baseline of 846 KB.
        </p>
        <p>
          Real-phone pinch acceptance is still open. That fix is already on the
          live site, so use the link below to pinch in and out and pan on your
          phone. The overnight teaching/usability changes are also published.
          Authenticated Studio acceptance remains separate.
        </p>
        <a
          href="https://tastir-studio.vercel.app/#/eight-fold-star-and-cross/result"
          target="_blank"
          rel="noreferrer"
        >
          Open the live pattern for the phone zoom check →
        </a>
      </section>
      <details id="earlier-repairs" className="reliability-earlier">
        <summary>The first four repairs · 15 November</summary>
        <section id="auth-repair">
          <p className="reliability-kicker">1 · Fixed locally</p>
          <h2>Signed out means the background calls stop.</h2>
          <p>
            Your work started polling online projects without the Studio page’s
            sign-in guard. Every 401 was retried. A shared sign-in check now
            protects both pages and the live-room connections.
          </p>
          <div
            className="request-comparison"
            role="img"
            aria-label="Controlled 12-second regression: before 13 failed protected requests; after one sign-in check and zero project requests."
          >
            <div aria-hidden="true">
              <span>Before</span>
              <strong>13</strong>
              <div className="request-track">
                <i style={{ width: '100%' }} />
              </div>
              <small>Failed protected requests</small>
            </div>
            <div aria-hidden="true">
              <span>After</span>
              <strong>1</strong>
              <div className="request-track">
                <i style={{ width: `${100 / 13}%` }} />
              </div>
              <small>Sign-in check · zero project calls</small>
            </div>
          </div>
          <p className="reliability-caption">
            Same controlled 12-second poller regression. This is test evidence,
            not live-site traffic telemetry.
          </p>
          <ol className="reliability-flow">
            <li>Check the session once</li>
            <li>A 401 closes protected access</li>
            <li>Stop polling and hide cached online projects</li>
            <li>Resume after sign-in is verified</li>
          </ol>
          <p>
            Temporary server failures show a retry and use backoff for an
            already signed-in session. A late response cannot reopen an expired
            session.
          </p>
          <p className="reliability-result">
            10 focused unit checks and 6 hosted-browser cases passed across
            desktop and phone. Browser sign-in responses are simulated; no
            account login was performed.
          </p>
        </section>
        <section id="download-repair">
          <p className="reliability-kicker">2 · Fixed locally</p>
          <h2>Keep an editable copy.</h2>
          <p>
            The viewer now offers Download pattern file (.json) beside SVG and
            PNG. Opening the file in a clean browser restores the construction
            and the current design, with an Edit this pattern link.
          </p>
          <div className="portable-file-example">
            <div>
              <code>.svg · .png</code>
              <h3>A finished picture</h3>
              <p>Use it in a document, print or image editor.</p>
            </div>
            <div>
              <code>.tastir.json</code>
              <h3>An editable pattern</h3>
              <p>
                Construction steps · selected ink · palette and custom colours ·
                style and finish
              </p>
            </div>
          </div>
          <ol className="reliability-flow">
            <li>Download the pattern file</li>
            <li>Open another browser</li>
            <li>Choose Open a pattern file</li>
            <li>See the design or edit its construction</li>
          </ol>
          <p>
            Downloading only creates the file. Importing keeps an editable copy
            in that browser. A storage failure is explained, and the original
            file is never changed.
          </p>
          <p className="reliability-result">
            All five styles round-trip in the file checks. Four desktop/phone
            browser cases reopen Lines and Jali, including palette, pen and
            material, and survive reload.
          </p>
          <a href="#/eight-fold-star-and-cross/result">
            Try the download in a real pattern →
          </a>
        </section>
        <section id="search-repair">
          <p className="reliability-kicker">3 · Fixed locally</p>
          <h2>Library addresses and Arabic search work.</h2>
          <p>
            Direct collection links now open the library, focus the collection
            on a fresh visit, and preserve the card position when returning from
            a tutorial.
          </p>
          <div
            className="search-evidence"
            role="group"
            aria-label="Verified search examples"
          >
            <div>
              <bdi lang="ar" dir="rtl">
                نجمة
              </bdi>
              <strong>171</strong>
              <span>star patterns</span>
            </div>
            <div>
              <bdi lang="ar" dir="rtl">
                نجمة فاس
              </bdi>
              <strong>18</strong>
              <span>stars in Fez</span>
            </div>
            <div>
              <bdi lang="ar" dir="rtl">
                ١٦ نقطة
              </bdi>
              <strong>6</strong>
              <span>sixteen-point patterns</span>
            </div>
          </div>
          <p className="reliability-caption">
            Measured against the current 194 family cards. English and Arabic
            equivalents return the same results; unknown Arabic or Chinese text
            returns zero. Star remains a broad term in this collection.
          </p>
          <p>
            Arabic text is no longer discarded. Search handles diacritics,
            Arabic/Persian digits and common star/place aliases, follows the
            entered text direction, and retains title-first ranking.
          </p>
          <p className="reliability-result">
            28 focused checks and 23 desktop/phone browser cases passed,
            including existing browsing behavior. One pre-existing phone skip
            applies to the desktop-only next/previous controls.
          </p>
          <a href="#collection">Open the collection and try the queries →</a>
        </section>
        <section id="audit-repair">
          <p className="reliability-kicker">
            4 · Measured and repaired locally
          </p>
          <h2>Clearer to assistive technology. Lighter to download.</h2>
          <div
            className="search-evidence"
            role="group"
            aria-label="Median mobile audit results"
          >
            <div>
              <span>Accessibility score</span>
              <strong>88 → 100</strong>
              <span>four failing audit types resolved</span>
            </div>
            <div>
              <span>Initial transfer</span>
              <strong>−21%</strong>
              <span>846 KB → 672 KB</span>
            </div>
            <div>
              <span>Performance score</span>
              <strong>96 → 96</strong>
              <span>maintained, with less data</span>
            </div>
          </div>
          <p className="reliability-caption">
            Medians from three cold mobile Lighthouse 13.6.0 runs before and
            after, using the same light-theme hosted production build profile on
            localhost, 390×844, simulated mobile throttling and 4× CPU slowdown.
            These are not Grok’s live-site scores. Automated accessibility
            checks do not replace testing with people or on a physical phone.
          </p>
          <p>
            The library has a main landmark, the animated progress bar has a
            name, color chips have valid accessible labels, and amber
            badge/status text has sufficient contrast. Small cards request
            smaller previews from the same drawing; full-size construction and
            exports retain their detail.
          </p>
          <p>
            First paint remains about 1.42 seconds. A nonblocking-font
            experiment painted sooner but increased blocking time and introduced
            movement; the existing font loading is retained. Heading-order
            failures were not reproduced in this audit.
          </p>
          <p className="reliability-result">
            Next: review these four local repairs, then address ordinary step
            URLs and Back behavior, named draw-along reports, and the remaining
            usability notes. Physical-phone zoom acceptance is still open.
          </p>
        </section>
      </details>
    </main>
  );
}
