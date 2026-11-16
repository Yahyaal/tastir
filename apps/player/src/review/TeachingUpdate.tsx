import { useEffect, useMemo, useRef, useState } from 'react';
import { inkStrokes } from '@tastir/engine';
import { LIBRARY } from '../app/library';
import { beatsOf, type Model } from '../app/model';
import { useModel } from '../app/workerClient';
import { Construction } from '../app/drawing';
import { tileView, viewBox } from '../app/camera';
import './teachingUpdate.css';

const pairs = [
  {
    name: 'Paccard pair',
    a: 'paccard-222-rosette',
    b: 'paccard-222-rosette-ring',
    shared: 4,
    conclusion:
      'These lessons already share four complete opening steps. Step 5 adds one extra compass circle and point U6 in the large version. That measurement is only used later: moving it to step 8 would let the lessons share the first seven steps. This is a proposal; the tutorials have not been rewritten.',
  },
  {
    name: 'Najjarin & Bou Inania',
    a: 'fes-najjarin-rosette',
    b: 'meknes-bou-inania-rosette',
    shared: 10,
    conclusion:
      'These lessons already share their first ten complete steps, including the text and named constructions. They branch at step 11, choosing different crossings and guide lines for the corner motifs. They share a route and then diverge; they do not start independently and converge.',
  },
];
const jsonOf = (id: string) => LIBRARY.find((e) => e.id === id)?.json;
function Loading({ error }: { error?: string }) {
  return (
    <p role={error ? 'alert' : 'status'}>
      {error ?? 'Preparing the drawings…'}
    </p>
  );
}
function beatAt(model: Model, step: number) {
  return Math.max(
    0,
    ...beatsOf(model.tutorial)
      .filter((b) => b.step <= step)
      .map((b) => b.beat),
  );
}
function SharedSteps({ pair }: { pair: (typeof pairs)[number] }) {
  const left = useModel(jsonOf(pair.a)),
    right = useModel(jsonOf(pair.b));
  const [step, setStep] = useState(pair.shared);
  const a = left.model,
    b = right.model;
  const shared = useMemo(() => {
    if (!a || !b) return undefined;
    let n = 0;
    while (
      a.tutorial.steps[n] &&
      b.tutorial.steps[n] &&
      JSON.stringify(a.tutorial.steps[n]) ===
        JSON.stringify(b.tutorial.steps[n])
    )
      n++;
    return n;
  }, [a, b]);
  if (!a || !b) return <Loading error={left.error ?? right.error} />;
  const max = Math.max(a.tutorial.steps.length, b.tutorial.steps.length);
  const common = step <= (shared ?? 0);
  return (
    <>
      <p className="teaching-lead">{pair.conclusion}</p>
      <div className="teaching-controls">
        <button type="button" onClick={() => setStep(pair.shared)}>
          Last shared step
        </button>
        <button type="button" onClick={() => setStep(pair.shared + 1)}>
          First difference
        </button>
        <label>
          Step {step}{' '}
          <input
            type="range"
            min="1"
            max={max}
            value={step}
            onChange={(e) => setStep(Number(e.target.value))}
          />
        </label>
      </div>
      <p className="teaching-verdict">
        {common
          ? `The first ${step} steps are identical.`
          : `Past the shared beginning: ${shared} complete steps agree.`}
      </p>
      <div className="teaching-pair">
        {[
          [a, pair.a],
          [b, pair.b],
        ].map(([model, id]) => {
          const m = model as Model,
            tutorialStep =
              m.tutorial.steps[Math.min(step, m.tutorial.steps.length) - 1];
          return (
            <figure key={String(id)}>
              <a href={`#/${String(id)}`}>{m.tutorial.title}</a>
              <Construction
                model={m}
                upTo={beatAt(m, Math.min(step, m.tutorial.steps.length))}
                view={tileView(m)}
              />
              <figcaption>
                {tutorialStep?.text}
                {step > m.tutorial.steps.length &&
                  ' (This lesson has already reached its last step.)'}
              </figcaption>
            </figure>
          );
        })}
      </div>
      <p className="teaching-caption">
        Actual tutorial constructions, framed on each repeat tile. Auxiliary
        measurements outside this frame are not shown. Equal step numbers are
        synchronized; after the branch, they need not teach the same operation.
      </p>
    </>
  );
}
function InkPreview({ id }: { id: string }) {
  const { model, error } = useModel(jsonOf(id));
  const [amount, setAmount] = useState(0);
  const [cue, setCue] = useState('lines');
  const [playing, setPlaying] = useState(false);
  const reveal = useRef(amount);
  reveal.current = amount;
  useEffect(() => {
    if (!playing) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setAmount(100);
      setPlaying(false);
      return;
    }
    let request = 0;
    const start = performance.now(),
      from = reveal.current;
    const frame = (now: number) => {
      const next = Math.min(100, from + (now - start) / 25);
      setAmount(next);
      if (next < 100) request = requestAnimationFrame(frame);
      else setPlaying(false);
    };
    request = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(request);
  }, [playing]);
  const path = useMemo(
    () =>
      model
        ? inkStrokes(model.scene, model.tutorial)
            .map(({ segment: s }) => `M${s.a.x},${-s.a.y}L${s.b.x},${-s.b.y}`)
            .join('')
        : '',
    [model],
  );
  const points = useMemo(() => {
    const unique = new Map<string, { x: number; y: number }>();
    for (const stroke of model?.pattern.ink ?? [])
      for (const p of [stroke.segment.a, stroke.segment.b])
        unique.set(`${Math.round(p.x * 1e6)},${Math.round(p.y * 1e6)}`, p);
    return [...unique.values()];
  }, [model]);
  if (!model) return <Loading error={error} />;
  const beat = beatsOf(model.tutorial).length;
  return (
    <>
      <p className="teaching-lead">
        Let the learner see the destination without treating the preview as ink
        already drawn. Lessons now default to a faint guide on the last drawing
        step and still ink fully at the end. Compare the line cue with a
        point-only alternative here.
      </p>
      <div
        className="teaching-controls"
        role="group"
        aria-label="Destination cue"
      >
        <button
          type="button"
          aria-pressed={cue === 'lines'}
          onClick={() => {
            setCue('lines');
            setPlaying(false);
            setAmount(30);
          }}
        >
          Faint lines
        </button>
        <button
          type="button"
          aria-pressed={cue === 'points'}
          onClick={() => {
            setCue('points');
            setPlaying(false);
            setAmount(30);
          }}
        >
          Inking points
        </button>
      </div>
      <div className="teaching-controls">
        <button
          type="button"
          onClick={() => {
            setPlaying(false);
            setAmount(0);
          }}
        >
          Construction alone
        </button>
        <button
          type="button"
          onClick={() => {
            setPlaying(false);
            setAmount(30);
          }}
        >
          Faint destination guide
        </button>
        <button
          type="button"
          onClick={() => {
            if (!playing && amount >= 100) setAmount(0);
            setPlaying((p) => !p);
          }}
        >
          {playing ? 'Pause transition' : 'Play transition'}
        </button>
        <label>
          Reveal {Math.round(amount)}%{' '}
          <input
            type="range"
            min="0"
            max="100"
            value={amount}
            onChange={(e) => {
              setPlaying(false);
              setAmount(Number(e.target.value));
            }}
          />
        </label>
      </div>
      <div
        className="teaching-preview"
        aria-label="Prototype of a final-ink guide; this does not edit the lesson"
      >
        <div style={{ opacity: 1 - amount / 140 }}>
          <Construction model={model} upTo={beat} view={tileView(model)} />
        </div>
        <svg
          viewBox={viewBox(tileView(model))}
          role="img"
          aria-label={
            amount === 0
              ? 'Final ink hidden'
              : cue === 'points'
                ? 'Preview of the inking points'
                : amount < 100
                  ? 'Dashed preview of the final ink'
                  : 'Final ink revealed'
          }
          style={{ opacity: amount === 0 ? 0 : 0.25 + amount / 135 }}
        >
          {cue === 'lines' ? (
            <path
              d={path}
              fill="none"
              pathLength="1000"
              strokeDasharray={amount < 100 ? '7 5' : undefined}
              vectorEffect="non-scaling-stroke"
            />
          ) : (
            points.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={-p.y}
                r={(tileView(model).maxX - tileView(model).minX) * 0.004}
                fill="var(--theme-accent-cobalt)"
              />
            ))
          )}
        </svg>
      </div>
      <p>
        <strong>My recommendation:</strong> faint lines, because they show which
        points connect without committing the ink. Point-only cues reveal less
        of the design, but become harder to follow in a dense rosette. The new
        “Guide first” mode uses the line treatment.
      </p>
      <p className="teaching-caption">
        This comparison does not edit the lesson. “Guide first” is now
        implemented in the player; the point-only treatment remains a study.
        Playback is optional; manual controls also work with reduced motion.{' '}
        <a href={`#/${id}/watch`}>Open this lesson →</a>
      </p>
    </>
  );
}
export function TeachingUpdate({
  initialTopic = 'paths',
}: {
  initialTopic?: string;
}) {
  const [topic, setTopic] = useState(initialTopic);
  const [pair, setPair] = useState(0);
  const [preview, setPreview] = useState('eight-fold-star-and-cross');
  const selected = pairs[pair] ?? pairs[0];
  return (
    <main className="teaching-update review">
      <nav className="review-top">
        <a href="#/review">← Review</a>
        <a href="#/plan/palettes">Compare palettes →</a>
      </nav>
      <header className="review-head">
        <p className="teaching-caption">
          Research follow-up · 15 November 2026
        </p>
        <h1>How do we make the construction easier to understand?</h1>
      </header>
      <nav className="teaching-controls" aria-label="Research topics">
        {[
          ['paths', 'Shared beginnings'],
          ['preview', 'Before the ink'],
          ['fixes', 'Fixes & next steps'],
        ].map(([key, label]) => (
          <button
            type="button"
            aria-pressed={topic === key}
            key={key}
            onClick={() => setTopic(key ?? 'paths')}
          >
            {label}
          </button>
        ))}
      </nav>
      {topic === 'paths' && (
        <>
          <div className="teaching-controls">
            {pairs.map((p, i) => (
              <button
                type="button"
                aria-pressed={pair === i}
                key={p.a}
                onClick={() => setPair(i)}
              >
                {p.name}
              </button>
            ))}
          </div>
          {selected && <SharedSteps key={selected.a} pair={selected} />}
        </>
      )}
      {topic === 'preview' && (
        <>
          <div className="teaching-controls">
            {[
              ['eight-fold-star-and-cross', 'Simple star and cross'],
              ['fes-najjarin-rosette', 'Dense rosette'],
            ].map(([id, label]) => (
              <button
                type="button"
                key={id}
                aria-pressed={preview === id}
                onClick={() => setPreview(id ?? 'eight-fold-star-and-cross')}
              >
                {label}
              </button>
            ))}
          </div>
          <InkPreview id={preview} key={preview} />
        </>
      )}
      {topic === 'fixes' && (
        <div className="teaching-summary">
          <h2>Your presentation preference is recorded</h2>
          <p>
            Future substantive feedback will use visual presentations with real
            drawings, short conclusions and a clear plan. Animations and
            hands-on comparisons are welcome when they explain the work.
          </p>
          <h2>Three local fixes</h2>
          <p>
            Two-finger pinch now zooms and pans around the gesture centre.
            Single taps still select pieces, and one-finger dragging still pans.
            Double tapping keeps its existing selection behavior; Fit resets the
            view. Real-phone confirmation is still needed.
          </p>
          <p>
            Region counts now use the same filter as the results, including
            alternate places and active queries. The Comares credit now
            distinguishes the historical design reference from the construction
            actually taught.
          </p>
          <h2>Next: choose palettes by eye</h2>
          <p>
            The palette page puts every current preset and candidates from your
            liked colourings on the same three walls. It is a comparison
            surface; choosing a preview does not change the app’s palettes or
            your saved designs.
          </p>
          <a href="#/plan/palettes">Open the palette comparison →</a>
        </div>
      )}
    </main>
  );
}
