import example from '@tutorials/eight-fold-star-and-cross.json';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Construction, Legend, Wall } from './drawing';
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

function wallText(model: Model): string {
  const parts = model.pattern.types.map(
    (t, i) => `${count(t.perCell)} ${t.name ?? `piece ${i + 1}`}`,
  );
  const list =
    parts.length > 1
      ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`
      : parts[0];
  return `Each tile holds ${list}. Laid edge to edge, the tiles make the wall.`;
}

export function Player({ model }: { model: Model }) {
  const { tutorial } = model;
  const stages = useMemo(() => stagesOf(tutorial), [tutorial]);
  const [index, setIndex] = useState(0);
  const stage = stages[index] ?? { kind: 'wall' };
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
  } else {
    label = 'Wall';
    text = wallText(model);
    picture = <Wall model={model} />;
  }

  return (
    <div className="player">
      <header>
        <h1>{tutorial.title}</h1>
        <span className="brand">Tastir</span>
      </header>
      <main className={stage.kind === 'wall' ? 'stage wall-stage' : 'stage'}>
        {picture}
      </main>
      <footer>
        <div className="text">
          <p className="label">{label}</p>
          <p aria-live="polite">{text}</p>
          {stage.kind === 'wall' ? <Legend model={model} /> : null}
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
