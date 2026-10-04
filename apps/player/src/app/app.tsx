import example from '@tutorials/eight-fold-star-and-cross.json';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Construction, Legend, RepeatedInk, Wall } from './drawing';
import { loadModel, stagesOf, type Model } from './model';

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

export function Player({ model }: { model: Model }) {
  const { tutorial } = model;
  const stages = useMemo(() => stagesOf(tutorial), [tutorial]);
  const [index, setIndex] = useState(0);
  const stage = stages[index] ?? { kind: 'color' };
  const last = stages.length - 1;
  const back = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const next = useCallback(
    () => setIndex((i) => Math.min(last, i + 1)),
    [last],
  );

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
    picture = <Construction model={model} upTo={stage.step} />;
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
        <span className="brand">Tastir</span>
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
