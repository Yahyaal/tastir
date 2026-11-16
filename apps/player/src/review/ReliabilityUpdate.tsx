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
        <p className="reliability-kicker">2 · Next</p>
        <h2>Keep an editable copy.</h2>
        <p>
          Expose a pattern file beside SVG and PNG, then prove that opening it
          in a clean browser restores the construction and design.
        </p>
      </section>
      <section id="search-repair">
        <p className="reliability-kicker">3 · Queued</p>
        <h2>Make library entry points work.</h2>
        <p>
          Fix direct collection links and Arabic query tokenization. Preserve
          title-first ranking and test mixed scripts and empty results.
        </p>
      </section>
      <section id="audit-repair">
        <p className="reliability-kicker">4 · Queued</p>
        <h2>Measure the actual barriers.</h2>
        <p>
          Run a fresh accessibility and mobile-performance audit, identify the
          failing elements and expensive requests, then compare the same checks
          after the repairs.
        </p>
      </section>
    </main>
  );
}
