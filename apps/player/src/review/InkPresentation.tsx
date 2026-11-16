import { useRef, useState } from 'react';
import figures from './inkPresentationFigures';
import './inkPresentation.css';

type Figure = typeof figures.paccard;
type Layer = 'overlay' | 'a' | 'b' | 'differences';
const chapters = [
  'The question',
  'The method',
  'Ten earlier merges',
  'Paccard',
  'Najjarin & Bou Inania',
  'How much to trust',
  'Bugs found',
  'What comes next',
];

function Drawing({
  figure,
  layer = 'overlay',
  offset = 0,
  label,
}: {
  figure: Figure;
  layer?: Layer;
  offset?: number;
  label: string;
}) {
  const [cx, cy] = figure.center;
  return (
    <svg
      className="ink-talk-drawing"
      viewBox={figure.viewBox}
      role="img"
      aria-label={label}
    >
      <g
        fill="none"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {offset > 0 ? (
          <>
            <path
              d={figure.shared + figure.onlyA}
              className="ink-talk-a"
              vectorEffect="non-scaling-stroke"
            />
            <g
              transform={`translate(${offset * 0.002} 0) rotate(${offset * 0.24} ${cx} ${cy})`}
            >
              <path
                d={figure.shared + figure.onlyB}
                className="ink-talk-b"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          </>
        ) : (
          <>
            {layer !== 'differences' && (
              <path
                d={figure.shared}
                className={
                  layer === 'a'
                    ? 'ink-talk-a'
                    : layer === 'b'
                      ? 'ink-talk-b'
                      : 'ink-talk-shared'
                }
                vectorEffect="non-scaling-stroke"
              />
            )}
            {layer !== 'b' && (
              <path
                d={figure.onlyA}
                className="ink-talk-a"
                vectorEffect="non-scaling-stroke"
              />
            )}
            {layer !== 'a' && (
              <path
                d={figure.onlyB}
                className="ink-talk-b"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </>
        )}
      </g>
    </svg>
  );
}
function Legend() {
  return (
    <div className="ink-talk-legend">
      <span>
        <i className="shared" /> Shared ink
      </span>
      <span>
        <i className="a" /> A only
      </span>
      <span>
        <i className="b" /> B only
      </span>
    </div>
  );
}
function Pair({
  figure,
  a,
  b,
  aId,
  bId,
  children,
}: {
  figure: Figure;
  a: string;
  b: string;
  aId: string;
  bId: string;
  children: React.ReactNode;
}) {
  const [layer, setLayer] = useState<Layer>('overlay');
  const pct = (n: number) => `${(n * 100).toFixed(2)}%`;
  return (
    <div className="ink-talk-split">
      <div>
        <div
          className="ink-talk-controls"
          role="group"
          aria-label="Drawing layers"
        >
          {(
            [
              ['overlay', 'Overlay'],
              ['a', 'A alone'],
              ['b', 'B alone'],
              ['differences', 'Differences only'],
            ] as const
          ).map(([value, label]) => (
            <button
              type="button"
              key={value}
              aria-pressed={layer === value}
              onClick={() => setLayer(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <Drawing
          figure={figure}
          layer={layer}
          label={`${a} and ${b}: ${layer}`}
        />
        <Legend />
      </div>
      <div className="ink-talk-explain">
        <p className="ink-talk-verdict">Different lines</p>
        <div className="ink-talk-coverage">
          <strong>{pct(figure.coverageA)}</strong>
          <span>of A lies on B</span>
          <strong>{pct(figure.coverageB)}</strong>
          <span>of B lies on A</span>
        </div>
        {children}
        <p className="ink-talk-small">
          These numbers measure ink length at the best tested placement. They
          are not probabilities that the designs are identical.
        </p>
        <p>
          <a href={`#/${aId}/result`}>A · {a}</a>
          <br />
          <a href={`#/${bId}/result`}>B · {b}</a>
        </p>
      </div>
    </div>
  );
}

export function InkPresentation() {
  const [slide, setSlide] = useState(0);
  const [alignment, setAlignment] = useState(35);
  const heading = useRef<HTMLHeadingElement>(null);
  const example = figures.merges.find(
    (m) => m.place === 'alhambra-comares-stars',
  );
  function go(index: number) {
    setSlide(index);
    heading.current?.focus();
    window.scrollTo?.({ top: 0, behavior: 'instant' });
  }
  return (
    <main className="ink-talk">
      <nav className="ink-talk-top" aria-label="Research presentation">
        <a href="#/review">← Review</a>
        <span>Tastir / Research update / 15 November 2026</span>
        <a href="#/notes/teaching-update">New research & fixes →</a>
      </nav>
      <div className="ink-talk-progress" aria-hidden="true">
        {chapters.map((chapter, i) => (
          <span key={chapter} className={i <= slide ? 'reached' : ''} />
        ))}
      </div>
      <header className="ink-talk-heading">
        <p className="ink-talk-kicker">
          {String(slide + 1).padStart(2, '0')} / 08 · {chapters[slide]}
        </p>
        <h1 ref={heading} tabIndex={-1}>
          {
            [
              'Can two patterns look alike and still be different?',
              'Your idea: compare the ink, line by line.',
              'All ten earlier merges pass the ink check.',
              'Paccard: the ring changes the drawing.',
              'Najjarin & Bou Inania: close, but different.',
              'Matching a drawing is one part of the evidence.',
              'Two app bugs are now recorded.',
              'My recommendation: finish this, then palettes.',
            ][slide]
          }
        </h1>
      </header>
      <section
        className="ink-talk-slide"
        aria-label={chapters[slide]}
        key={slide}
      >
        {slide === 0 && (
          <div className="ink-talk-split">
            <div>
              <Drawing
                figure={figures.najjarin}
                label="Actual overlay of Najjarin and Bou Inania, with shared lines and differing corner motifs"
              />
              <Legend />
            </div>
            <div className="ink-talk-explain">
              <p className="ink-talk-lead">
                We used to compare the pieces in a pattern. You suggested laying
                one drawing over the other.
              </p>
              <p>
                I built that comparison and used it to review the ten earlier
                merges and the two rosette pairs.
              </p>
              <p className="ink-talk-takeaway">
                The result: the ten merges are supported by the ink. Both
                rosette pairs have differences worth keeping.
              </p>
              <p className="ink-talk-small">
                The drawing beside this text is a real comparison from the app.
                The coloured lines show where the two designs part company.
              </p>
            </div>
          </div>
        )}
        {slide === 1 && (
          <div className="ink-talk-split">
            <div>
              {example && (
                <Drawing
                  figure={example}
                  offset={100 - alignment}
                  label={
                    alignment === 100
                      ? 'Two star-and-cross tracings fully aligned'
                      : 'Two identical star-and-cross tracings being aligned'
                  }
                />
              )}
              <label className="ink-talk-slider">
                Align the tracing{' '}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={alignment}
                  onChange={(e) => setAlignment(Number(e.target.value))}
                />
                <span>
                  {alignment === 100
                    ? 'Aligned: every line agrees.'
                    : 'Move the tracing until the lines meet →'}
                </span>
              </label>
            </div>
            <div className="ink-talk-explain">
              <ol className="ink-talk-steps">
                <li>
                  <strong>Strip away the colours.</strong>
                  <p>Read the exact ink segments from each tutorial.</p>
                </li>
                <li>
                  <strong>Find a fair alignment.</strong>
                  <p>
                    Turn, move and uniformly resize the patterns. Check
                    reflection too. Never stretch one direction to force a
                    match.
                  </p>
                </li>
                <li>
                  <strong>Check the repeating pattern.</strong>
                  <p>
                    Measure how much of A lies on B, and how much of B lies on
                    A. An extra line matters even if everything else agrees.
                  </p>
                </li>
              </ol>
              <p className="ink-talk-small">
                This slider illustrates alignment using an already matched
                drawing. The real tool searches automatically and checks the
                common repeat, beyond a single screenshot.
              </p>
            </div>
          </div>
        )}
        {slide === 2 && (
          <>
            <p className="ink-talk-lead">
              I compared each archived drawing with the shared tutorial it now
              opens. Every pair agreed fully in both directions.
            </p>
            <div className="ink-talk-merges">
              {figures.merges.map((m) => (
                <a href={`#/${m.place}/result`} key={m.place}>
                  <Drawing
                    figure={m}
                    label={`${m.title}: full ink agreement with ${m.baseTitle}`}
                  />
                  <span>
                    {m.title
                      .replace('Star rosettes of ', '')
                      .replace('Interlaced ', '')}
                  </span>
                  <strong>100% both ways</strong>
                </a>
              ))}
            </div>
            <p className="ink-talk-takeaway">
              There is no ink-based reason to undo these merges. This does not
              settle their photographs, colours or attribution.
            </p>
          </>
        )}
        {slide === 3 && (
          <Pair
            figure={figures.paccard}
            a="Paccard large rosette"
            b="Paccard ring version"
            aId="paccard-222-rosette"
            bId="paccard-222-rosette-ring"
          >
            <p>
              The central rosette agrees across much of the drawing. The ring
              and its surroundings leave substantial coloured differences.
            </p>
            <p className="ink-talk-takeaway">
              Keep these as separate designs. A shared family can still express
              their relationship.
            </p>
          </Pair>
        )}
        {slide === 4 && (
          <Pair
            figure={figures.najjarin}
            a="Najjarin fountain"
            b="Bou Inania, Meknes"
            aId="fes-najjarin-rosette"
            bId="meknes-bou-inania-rosette"
          >
            <p>
              The central rosette and much of the surrounding ink agree. The
              corner motifs leave small but real differences. Choose
              “Differences only” to isolate them.
            </p>
            <p className="ink-talk-takeaway">
              Keep both drawings. A near match is useful evidence of a
              relationship, but it is not a duplicate.
            </p>
          </Pair>
        )}
        {slide === 5 && (
          <>
            <div className="ink-talk-evidence">
              <div>
                <strong>466 / 466</strong>
                <h2>Known-equal comparisons passed</h2>
                <p>
                  All 233 tutorials matched turned, scaled and shifted copies,
                  and matched again with a doubled repeat tile.
                </p>
              </div>
              <div>
                <strong>22 / 22</strong>
                <h2>Place navigation checks passed</h2>
                <p>
                  Desktop and phone checks covered search, opening, sharing,
                  saving and reopening the ten places.
                </p>
              </div>
            </div>
            <div className="ink-talk-split ink-talk-boundaries">
              <div>
                <h2>What we can say</h2>
                <p>
                  The current drawings agree or differ within a stated numerical
                  tolerance. The tool reports “inconclusive” when it cannot
                  establish an alignment.
                </p>
                <p>
                  Workspace tests, lint, typechecking and the production build
                  all passed.
                </p>
              </div>
              <div>
                <h2>What still needs checking</h2>
                <p>
                  Ink agreement does not verify a historical wall photo, its
                  original colours or how the construction was taught.
                </p>
                <p>
                  <strong>Comares attribution corrected locally:</strong> the
                  old note described a grid construction; the shared lesson uses
                  two squares. The credit has now been corrected locally.
                </p>
                <a href="#/notes/duplicates-review">
                  See the marked construction picture and wording →
                </a>
              </div>
            </div>
          </>
        )}
        {slide === 6 && (
          <div className="ink-talk-bugs">
            <div>
              <div
                className="ink-talk-phone"
                aria-label="Phone zoom reproduction: pinching leaves drawing width unchanged"
              >
                <span>Before pinch</span>
                <strong>12 units wide</strong>
                <span>↓ Two-finger spread ↓</span>
                <strong>12 units wide</strong>
                <span>Zoom did not change</span>
              </div>
              <h2>Phone zoom · Fixed locally</h2>
              <p>
                I reproduced it in touch emulation: pinching moved the wall
                without zooming, and double tapping did nothing. Wheel zoom
                worked.
              </p>
              <p>
                At reproduction, the camera lacked a pinch handler and the
                drawing suppressed native touch zoom.
              </p>
              <p>
                <strong>Now:</strong> pinch zoom is implemented; real-phone
                confirmation remains.
              </p>
            </div>
            <div>
              <div className="ink-talk-counts">
                <span>Alhambra region</span>
                <div>
                  <strong>36</strong>
                  <span>menu before the fix</span>
                </div>
                <div>
                  <strong>39</strong>
                  <span>actual results</span>
                </div>
              </div>
              <h2>Region counts · Fixed locally</h2>
              <p>
                The filter found alternate places, but its menu count omitted
                them. Both now use the same membership rules.
              </p>
              <p>
                <strong>Now:</strong> counts use the same filter as the results.
              </p>
              <a href="#/notes/duplicates-review">
                See the captured menu and results →
              </a>
            </div>
          </div>
        )}
        {slide === 7 && (
          <>
            <ol className="ink-talk-roadmap">
              <li>
                <span>1</span>
                <div>
                  <h2>Close the review</h2>
                  <p>
                    Review the Comares credit correction. Keep the ten merges
                    and both rosette pairs as they are. Complete the outstanding
                    photo and colour checks separately.
                  </p>
                </div>
              </li>
              <li>
                <span>2</span>
                <div>
                  <h2>Fix the small usability gaps</h2>
                  <p>
                    Address phone zoom and region counts. Make the start
                    documents reflect the actual state of the project.
                  </p>
                </div>
              </li>
              <li>
                <span>3</span>
                <div>
                  <h2>Show palette choices visually</h2>
                  <p>
                    Put existing palettes and candidates from your liked
                    rosettes on the same three walls. Choose by eye before
                    changing the palette system.
                  </p>
                </div>
              </li>
              <li>
                <span>4</span>
                <div>
                  <h2>Turn toward learners</h2>
                  <p>
                    Propose a beginner’s path and complete feedback setup. Hold
                    further pattern expansion while we make the existing library
                    easier to enter and trust.
                  </p>
                </div>
              </li>
            </ol>
            <p className="ink-talk-takeaway">
              The overlay, local bug fixes and credit correction are built. The
              palette comparison is ready; final palette choices and the
              teaching prototypes remain for review.
            </p>
            <div className="ink-talk-links">
              <a href="#/plan/duplicates">Try the comparison tool →</a>
              <a href="#/notes/next-steps">Read the broader proposal →</a>
            </div>
          </>
        )}
      </section>
      <footer className="ink-talk-footer">
        <button
          type="button"
          disabled={slide === 0}
          onClick={() => go(slide - 1)}
        >
          ← Previous
        </button>
        <label>
          Slide{' '}
          <select
            aria-label="Go to slide"
            value={slide}
            onChange={(e) => go(Number(e.target.value))}
          >
            {chapters.map((c, i) => (
              <option key={c} value={i}>
                {i + 1}. {c}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={slide === chapters.length - 1}
          onClick={() => go(slide + 1)}
        >
          Next →
        </button>
      </footer>
    </main>
  );
}
