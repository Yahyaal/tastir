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
        <p className="reliability-kicker">
          Reliability & discoverability · progress
        </p>
        <h1>Make everyday use dependable.</h1>
        <p>
          Working through the review one item at a time, with evidence beside
          each change.
        </p>
      </header>
      <nav className="reliability-steps" aria-label="Review items">
        <a
          href="#auth-repair"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById('auth-repair')?.scrollIntoView();
          }}
        >
          1 · Sign-in retries
        </a>
        <a
          href="#download-repair"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById('download-repair')?.scrollIntoView();
          }}
        >
          2 · Editable downloads
        </a>
        <a
          href="#search-repair"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById('search-repair')?.scrollIntoView();
          }}
        >
          3 · Library entry points
        </a>
        <a
          href="#audit-repair"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById('audit-repair')?.scrollIntoView();
          }}
        >
          4 · Accessibility & speed
        </a>
      </nav>
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
          Temporary server failures show a retry and use backoff for an already
          signed-in session. A late response cannot reopen an expired session.
        </p>
        <p className="reliability-result">
          10 focused unit checks and 6 hosted-browser cases passed across
          desktop and phone. Browser sign-in responses are simulated; no account
          login was performed.
        </p>
      </section>
      <section id="download-repair">
        <p className="reliability-kicker">2 · Fixed locally</p>
        <h2>Keep an editable copy.</h2>
        <p>
          The viewer now offers Download pattern file (.json) beside SVG and
          PNG. Opening the file in a clean browser restores the construction and
          the current design, with an Edit this pattern link.
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
          Downloading only creates the file. Importing keeps an editable copy in
          that browser. A storage failure is explained, and the original file is
          never changed.
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
          Direct collection links now open the library, focus the collection on
          a fresh visit, and preserve the card position when returning from a
          tutorial.
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
          28 focused checks and 23 desktop/phone browser cases passed, including
          existing browsing behavior. One pre-existing phone skip applies to the
          desktop-only next/previous controls.
        </p>
        <a href="#collection">Open the collection and try the queries →</a>
      </section>
      <section id="audit-repair">
        <p className="reliability-kicker">4 · Measured and repaired locally</p>
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
          These are not Grok’s live-site scores. Automated accessibility checks
          do not replace testing with people or on a physical phone.
        </p>
        <p>
          The library has a main landmark, the animated progress bar has a name,
          color chips have valid accessible labels, and amber badge/status text
          has sufficient contrast. Small cards request smaller previews from the
          same drawing; full-size construction and exports retain their detail.
        </p>
        <p>
          First paint remains about 1.42 seconds. A nonblocking-font experiment
          painted sooner but increased blocking time and introduced movement;
          the existing font loading is retained. Heading-order failures were not
          reproduced in this audit.
        </p>
        <p className="reliability-result">
          Next: review these four local repairs, then address ordinary step URLs
          and Back behavior, named draw-along reports, and the remaining
          usability notes. Physical-phone zoom acceptance is still open.
        </p>
      </section>
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
    </main>
  );
}
