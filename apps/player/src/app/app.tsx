import example from '@tutorials/eight-fold-star-and-cross.json';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { planStep, play } from './animation';
import { Construction, Legend, RepeatedInk, Wall } from './drawing';
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

  useLayoutEffect(() => {
    // Before paint, so the step's new elements start hidden.
    if (!animateNext.current) return;
    animateNext.current = false;
    if (stage.kind !== 'step' || reduced) return;
    running.current = play(svgRef.current, planStep(model, stage.step, speed));
  }, [index, stage, model, reduced, speed]);

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
        ? play(svgRef.current, planStep(model, stage.step, speed), {
            reverse: true,
          })
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
    picture = <Construction model={model} upTo={stage.step} svgRef={svgRef} />;
  } else if (stage.kind === 'ink') {
    label = 'Ink';
    text = tutorial.ink.text ?? 'Go over the pattern lines.';
    picture = <Construction model={model} upTo={steps} ink />;
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
        <h1>{tutorial.title}</h1>
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
          <button type="button" onClick={back} disabled={index === 0}>
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

/** Loads the example; a tutorial the engine rejects shows its error. */
export function App({ json = example }: { json?: unknown }) {
  const loaded = useMemo(() => {
    try {
      return { model: loadModel(json) };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }, [json]);
  if ('error' in loaded) {
    return (
      <div className="player">
        <h1>This tutorial cannot be played</h1>
        <pre className="error">{loaded.error}</pre>
      </div>
    );
  }
  return <Player model={loaded.model} />;
}

export default App;
