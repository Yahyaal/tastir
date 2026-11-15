import { useRef, useState } from 'react';
import './review.css';
import './settingsReview.css';
const root = '/__review/renders/settings-2026-11-15/';
const titles = [
  'See the destination. Keep the reveal.',
  'Small choices stay visible.',
  'A link opens the presentation you chose.',
];
function Picture({ file, alt }: { file: string; alt: string }) {
  return (
    <a href={root + file} target="_blank" rel="noreferrer">
      <img src={root + file} alt={alt} />
    </a>
  );
}
export function SettingsReview() {
  const [slide, setSlide] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const go = (index: number) => {
    setSlide(index);
    window.scrollTo?.({ top: 0, behavior: 'instant' });
    heading.current?.focus();
  };
  return (
    <main className="review settings-review">
      <nav className="review-top">
        <a href="#/review">← Review</a>
        <a href="#/notes/ink-guide">Compare lines and points →</a>
      </nav>
      <header className="review-head">
        <p className="settings-review-kicker">
          Lesson & settings update · {slide + 1} / 3
        </p>
        <h1 ref={heading} tabIndex={-1}>
          {titles[slide]}
        </h1>
      </header>
      {slide === 0 && (
        <>
          <p className="lede">
            The new default is <strong>Guide first</strong>: a faint pattern on
            the last construction step, followed by the full inking animation.
            Nothing is inked early.
          </p>
          <div className="settings-review-pair">
            <figure>
              <Picture
                file="guide-1280.png"
                alt="The actual last construction step with its faint destination guide"
              />
              <figcaption>
                Faint dashed lines show the route the ink will take.
              </figcaption>
            </figure>
            <div>
              <h2>Three modes, one visible choice</h2>
              <p>
                <strong>Guide first:</strong> a destination cue, then the
                reveal.
              </p>
              <p>
                <strong>At the end:</strong> keep the pattern hidden until the
                reveal.
              </p>
              <p>
                <strong>As you go:</strong> ink each part as its construction
                becomes ready.
              </p>
              <p>
                I chose a line guide because it shows the connections as well as
                the points. You can compare the quieter point-only alternative
                in the visual study.
              </p>
              <a href="#/notes/ink-guide">
                Try the lines / points comparison →
              </a>
            </div>
          </div>
        </>
      )}
      {slide === 1 && (
        <>
          <p className="lede">
            Speed and Ink are visible choices. Drawing aids are labelled
            switches. The library visibility action is a proper button with an
            eye icon.
          </p>
          <div className="settings-review-pair">
            <figure>
              <Picture
                file="settings-1280.png"
                alt="Desktop settings with speed and ink choices, aligned switches and an icon-labelled Hide from library button"
              />
              <figcaption>
                Keyboard arrows select a speed without moving the lesson. Escape
                closes settings.
              </figcaption>
            </figure>
            <figure className="settings-review-phone">
              <Picture
                file="settings-panel-dark-390.png"
                alt="The settings panel on a phone in dark mode"
              />
              <figcaption>
                On a phone, settings open above the bottom edge with room to tap
                and scroll.
              </figcaption>
            </figure>
          </div>
          <p className="settings-review-note">
            Your preference for visible choices over dropdowns is recorded for
            future UI work. A wider audit of the app’s controls remains on the
            to-do list.
          </p>
        </>
      )}
      {slide === 2 && (
        <>
          <p className="lede">
            Use <strong>Copy a share link</strong>. The link carries the
            pattern’s colours, style and finish, plus the current step, ink
            mode, drawing aids, repeat arrangement and framing.
          </p>
          <div className="settings-review-pair">
            <figure>
              <Picture
                file="shared-wall-source-1280.png"
                alt="Sender's coloured Lines wall at a chosen zoom"
              />
              <figcaption>The sender’s view.</figcaption>
            </figure>
            <figure>
              <Picture
                file="shared-wall-recipient-1280.png"
                alt="The matching Lines wall restored from a share link in a clean browser"
              />
              <figcaption>
                The link opened in a separate, clean browser.
              </figcaption>
            </figure>
          </div>
          <p>
            Lesson links open paused at the chosen step. Old links still work.
            Shared settings do not replace the recipient’s saved preferences,
            and reduced-motion preferences are respected.
          </p>
          <div className="settings-review-actions">
            <a href="#/eight-fold-star-and-cross/watch">
              Try the lesson and settings →
            </a>
            <a href="#/eight-fold-star-and-cross/result">
              Try styling and sharing a wall →
            </a>
          </div>
        </>
      )}
      <footer className="settings-review-footer">
        <button
          type="button"
          disabled={slide === 0}
          onClick={() => go(slide - 1)}
        >
          ← Previous
        </button>
        <nav aria-label="Update slides">
          {titles.map((title, i) => (
            <button
              type="button"
              key={title}
              aria-label={title}
              aria-pressed={i === slide}
              onClick={() => go(i)}
            >
              {i + 1}
            </button>
          ))}
        </nav>
        <button
          type="button"
          disabled={slide === 2}
          onClick={() => go(slide + 1)}
        >
          Next →
        </button>
      </footer>
    </main>
  );
}
