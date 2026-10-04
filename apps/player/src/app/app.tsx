import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { planStep, play } from './animation';
import { fullView, stepFrame, width } from './camera';
import { useCamera } from './useCamera';
import { Construction, Legend, RepeatedInk, Thumbnail, Wall } from './drawing';
import { LIBRARY, type Entry } from './library';
import { loadModel, stagesOf, type Model, type Stage } from './model';

const NUMBER_WORDS = [
  'no',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
];
const count = (n: number) => NUMBER_WORDS[n] ?? String(n);

const nameOf = (model: Model, i: number) =>
  model.pattern.types[i]?.name ?? `piece ${i + 1}`;

function joinAnd(parts: string[]): string {
  return parts.length > 1
    ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`
    : (parts[0] ?? '');
}

function colorText(model: Model): string {
  const names = model.pattern.types.map((_, i) => nameOf(model, i));
  const same = names.map((n) => `every ${n} matches every other ${n}`);
  const held = model.pattern.types.map(
    (t, i) => `${count(t.perCell)} ${nameOf(model, i)}`,
  );
  return `Color the pieces by shape, so ${joinAnd(same)}. Each tile holds ${joinAnd(held)}.`;
}

const prefersReducedMotion = () =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function Player({ model }: { model: Model }) {
  const { tutorial } = model;
  const stages = useMemo(() => stagesOf(tutorial), [tutorial]);
  const [index, setIndex] = useState(0);
  const stage = useMemo(
    (): Stage => stages[index] ?? { kind: 'color' },
    [stages, index],
  );
  const last = stages.length - 1;
  const [speed, setSpeed] = useState(1);
  const [reduced, setReduced] = useState(prefersReducedMotion);

  const svgRef = useRef<SVGSVGElement>(null);
  const running = useRef<Animation[]>([]);
  const reversing = useRef(false);
  // Set when the next render should animate its step in: on load and Next.
  const animateNext = useRef(true);

  /** Jumps every running animation to its end. */
  const settle = () => {
    for (const a of running.current) a.finish();
    running.current = [];
  };

  // Each step frames itself; the ink shows the whole drawing.
  const frame = useMemo(
    () =>
      stage.kind === 'step' ? stepFrame(model, stage.step) : fullView(model),
    [model, stage],
  );
  const onConstruction = stage.kind === 'step' || stage.kind === 'ink';
  const camera = useCamera(frame, svgRef, {
    stage: index,
    instant: reduced,
    active: onConstruction,
  });

  useLayoutEffect(() => {
    // Before paint, so the step's new elements start hidden.
    if (!animateNext.current) return;
    animateNext.current = false;
    if (stage.kind !== 'step' || reduced) return;
    running.current = play(svgRef.current, planStep(model, stage.step, speed), {
      // The camera glides to the step's frame while it draws.
      lengthScale: width(camera.view) / width(frame),
    });
    // Only a change of step starts an animation; the view is read as it is.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, stage, model, reduced, speed, frame]);

  const next = useCallback(() => {
    if (reversing.current) return settle();
    settle();
    if (index === last) return;
    animateNext.current = true;
    setIndex(index + 1);
  }, [index, last]);

  const back = useCallback(() => {
    // A second Back while undrawing finishes the undrawing at once.
    if (reversing.current) return settle();
    settle();
    if (index === 0) return;
    const undraw =
      stage.kind === 'step' && !reduced
        ? play(
            svgRef.current,
            planStep(model, stage.step, speed, { flash: false }),
            { reverse: true },
          )
        : [];
    if (undraw.length === 0) return setIndex(index - 1);
    reversing.current = true;
    running.current = undraw;
    void Promise.allSettled(undraw.map((a) => a.finished)).then(() => {
      reversing.current = false;
      running.current = [];
      setIndex(index - 1);
    });
  }, [index, stage, model, reduced, speed]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') back();
      if (e.key === 'ArrowRight' || e.key === ' ') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [back, next]);

  const steps = tutorial.steps.length;
  let label: string;
  let text: string;
  let picture: React.ReactNode;
  if (stage.kind === 'step') {
    label = `Step ${stage.step} of ${steps}`;
    text = tutorial.steps[stage.step - 1]?.text ?? '';
    picture = (
      <Construction
        model={model}
        upTo={stage.step}
        view={camera.view}
        svgRef={svgRef}
        outlineHighlights={reduced}
      />
    );
  } else if (stage.kind === 'ink') {
    label = 'Ink';
    text = tutorial.ink.text ?? 'Go over the pattern lines.';
    picture = (
      <Construction
        model={model}
        upTo={steps}
        view={camera.view}
        svgRef={svgRef}
        ink
      />
    );
  } else if (stage.kind === 'repeat') {
    label = 'Repeat';
    text =
      tutorial.pattern.text ??
      'Repeat the tile edge to edge, with the same lines in every copy.';
    picture = <RepeatedInk model={model} />;
  } else {
    label = 'Color';
    text = colorText(model);
    picture = <Wall model={model} />;
  }

  return (
    <div className="player">
      <header>
        <div className="title">
          <a className="home" href="#/">
            All tutorials
          </a>
          <h1>{tutorial.title}</h1>
        </div>
        <div className="controls">
          <label>
            Speed{' '}
            <select
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            >
              <option value={0.5}>½×</option>
              <option value={1}>1×</option>
              <option value={2}>2×</option>
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              checked={reduced}
              onChange={(e) => setReduced(e.target.checked)}
            />{' '}
            Reduce motion
          </label>
          <span className="brand">Tastir</span>
        </div>
      </header>
      <main className="stage">{picture}</main>
      <footer>
        <div className="text">
          <p className="label">{label}</p>
          <p aria-live="polite">{text}</p>
          {stage.kind === 'color' ? <Legend model={model} /> : null}
        </div>
        <nav>
          {onConstruction ? (
            <button
              type="button"
              className="quiet"
              onClick={() => camera.goTo(fullView(model))}
            >
              Fit
            </button>
          ) : null}
          <button
            type="button"
            className="secondary"
            onClick={back}
            disabled={index === 0}
          >
            Back
          </button>
          <button type="button" onClick={next} disabled={index === last}>
            Next
          </button>
        </nav>
      </footer>
    </div>
  );
}

/** Plays one tutorial; a tutorial the engine rejects shows its error. */
export function Play({ json }: { json: unknown }) {
  const loaded = useMemo(() => {
    try {
      return { model: loadModel(json) };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }, [json]);
  if (!loaded.model) return <Broken message={loaded.error ?? ''} />;
  return <Player model={loaded.model} />;
}

function Broken({ message }: { message: string }) {
  return (
    <div className="player">
      <header>
        <div className="title">
          <a className="home" href="#/">
            All tutorials
          </a>
          <h1>This tutorial cannot be played</h1>
        </div>
      </header>
      <pre className="error">{message}</pre>
    </div>
  );
}

const fold = (n: number) => `${n}-fold`;

/** Every tutorial, with a picture of the finished pattern. */
export function Library({ entries }: { entries: readonly Entry[] }) {
  return (
    <div className="library">
      <header>
        <h1>Tastir</h1>
        <p>
          Islamic geometric patterns, drawn one compass and ruler step at a
          time.
        </p>
      </header>
      <ul className="cards">
        {entries.map(({ id, model, error }) => (
          <li key={id}>
            <a className="card" href={`#/${id}`}>
              {model ? (
                <Thumbnail model={model} />
              ) : (
                <div className="thumbnail broken" />
              )}
              <h2>{model?.tutorial.title ?? id}</h2>
              {model ? (
                <p>
                  {fold(model.tutorial.fold)} · {model.tutorial.style} ·{' '}
                  {model.tutorial.level} · {model.tutorial.steps.length} steps
                </p>
              ) : (
                <p className="error">Cannot be played: {error}</p>
              )}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The tutorial id in the address (#/id), or '' for the library. */
function useRoute(): string {
  const read = () =>
    decodeURIComponent(window.location.hash.replace(/^#\/?/, ''));
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const onChange = () => {
      setRoute(read());
      window.scrollTo?.(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

/** The library, or the tutorial the address names. */
export function App({ entries = LIBRARY }: { entries?: readonly Entry[] }) {
  const route = useRoute();
  if (!route) return <Library entries={entries} />;
  const entry = entries.find((e) => e.id === route);
  if (!entry)
    return <Broken message={`There is no tutorial called "${route}".`} />;
  return <Play key={entry.id} json={entry.json} />;
}

export default App;
