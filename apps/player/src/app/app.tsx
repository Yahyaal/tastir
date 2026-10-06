import {
  lazy,
  Suspense,
  useCallback,
  useReducer,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { planStep, play, playInk } from './animation';
import { fullView, stepFrame, width } from './camera';
import { useCamera } from './useCamera';
import { useInking } from './useInking';
import {
  colorReducer,
  pieceColors,
  tutorialColoring,
  type History,
} from './coloring';
import { PiecePanel } from './PiecePanel';
import { colorRepeat, placeFills, placeKey } from './placement';
import { download, pngBlob, svgBlob, wallSvg } from './exporting';
import { PrintSheet, type Paper } from './PrintSheet';
import { Construction, RepeatedInk, Thumbnail } from './drawing';
import { Wall, WALL_STYLES, type WallStyle } from './Wall';
import { LIBRARY, type Entry } from './library';
import { useRemembered } from './remembered';
import { shownSteps, stagesOf, type Model, type Stage } from './model';
import { PROGRESS_TEXT, useModel } from './workerClient';

/**
 * The overnight review page (#/review). Its pictures come from the private
 * docs/research folder through the dev server, so it exists only in dev and
 * is left out of the production bundle.
 */
const Review = import.meta.env.DEV
  ? lazy(() => import('../review/Review').then((m) => ({ default: m.Review })))
  : undefined;

/**
 * The project notes (#/notes): the docs a new session reads first, shown in
 * the app. Like the review page, it exists only on the dev server.
 */
const Notes = import.meta.env.DEV
  ? lazy(() => import('../review/Notes').then((m) => ({ default: m.Notes })))
  : undefined;

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

/** A piece type's name; one without a name is called by its corners. */
const nameOf = (model: Model, i: number) => {
  const t = model.pattern.types[i];
  return t?.name ?? `${t?.vertices ?? 0}-corner piece`;
};

/** "star", "stars"; "cross", "crosses"; "4-corner piece", "4-corner pieces". */
const plural = (name: string, n: number) =>
  n === 1 ? name : /(s|x|ch|sh)$/.test(name) ? `${name}es` : `${name}s`;

function joinAnd(parts: string[]): string {
  return parts.length > 1
    ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`
    : (parts[0] ?? '');
}

function colorText(model: Model): string {
  const names = model.pattern.types.map((_, i) => nameOf(model, i));
  const same = names.map((n) => `every ${n} matches every other ${n}`);
  const held = model.pattern.types.map(
    (t, i) => `${count(t.perCell)} ${plural(nameOf(model, i), t.perCell)}`,
  );
  if (model.tutorial.pattern.placements) {
    const [m, n] = model.tutorial.pattern.placements.repeat;
    const block =
      m * n > 1 ? `, and the colors repeat every ${m} by ${n} tiles` : '';
    return `Color the pieces by where they sit: pieces of the same shape can take different colors by their turn and their place${block}. Click a piece to recolor every piece placed like it. Each tile holds ${joinAnd(held)}.`;
  }
  if (names.length > 4)
    return `Color the pieces by shape: every piece of one shape takes the same color. Each tile holds ${joinAnd(held)}.`;
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
  const [showNames, setShowNames] = useRemembered<boolean>('showNames', false);

  const inking = useInking(model);
  const [colorHistory, colorDispatch] = useReducer(
    colorReducer,
    model,
    (m): History => ({ past: [], now: tutorialColoring(m), future: [] }),
  );
  const colors = pieceColors(inking.shown, colorHistory.now);
  // Fills by placement, when the tutorial colors same shapes differently.
  const fill = useMemo(
    () =>
      inking.shown.tutorial.pattern.placements
        ? placeFills(inking.shown, colorHistory.now)
        : undefined,
    [inking.shown, colorHistory.now],
  );
  const [place, setPlace] = useState<{ piece: number; i: number; j: number }>();
  const [hovered, setHovered] = useState<number>();
  const [selected, setSelected] = useState<number>();
  const [wallStyle, setWallStyle] = useState<WallStyle>('tiles');
  const [grout, setGrout] = useState(1);
  const [paper, setPaper] = useState<Paper>('A4');
  const [printing, setPrinting] = useState(false);
  const stopPrinting = useCallback(() => setPrinting(false), []);
  const exportSvg = () =>
    wallSvg(inking.shown, colors, { look: wallStyle, grout, fill });
  const svgRef = useRef<SVGSVGElement>(null);
  const running = useRef<Animation[]>([]);
  const reversing = useRef(false);
  // Set when the next render should animate its step in: on load and Next.
  const animateNext = useRef(true);
  // Whether the learner arrived at this stage with Next (or on load), so
  // the stage plays its way in; Back shows it as it is.
  const [forward, setForward] = useState(true);
  const enter = forward && !reduced;

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
    if (reduced) return;
    if (stage.kind === 'ink') {
      if (!inking.editing && inking.isClassic)
        running.current = playInk(svgRef.current, model, speed, {
          lengthScale: width(camera.view) / width(frame),
        });
      return;
    }
    if (stage.kind !== 'step') return;
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
    setForward(true);
    setIndex(index + 1);
  }, [index, last]);

  const back = useCallback(() => {
    // A second Back while undrawing finishes the undrawing at once.
    if (reversing.current) return settle();
    settle();
    if (index === 0) return;
    setForward(false);
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
  const shown = shownSteps(tutorial);
  let label: string;
  let hint: string | undefined;
  let text: string;
  let picture: React.ReactNode;
  if (stage.kind === 'step') {
    label = `Step ${shown.indexOf(stage.step) + 1} of ${shown.length}`;
    text = tutorial.steps[stage.step - 1]?.text ?? '';
    picture = (
      <Construction
        model={model}
        upTo={stage.step}
        view={camera.view}
        svgRef={svgRef}
        showNames={showNames}
      />
    );
  } else if (stage.kind === 'ink') {
    label = 'Ink';
    hint = 'The pattern, picked out of the lines you drew.';
    text = inking.isClassic
      ? (tutorial.ink.text ?? 'Go over the pattern lines.')
      : 'Your own pattern: the next steps repeat and color the lines you inked.';
    picture = (
      <Construction
        upTo={steps}
        model={inking.shown}
        view={camera.view}
        svgRef={svgRef}
        freeInk={inking.freeInk}
        ink
        enter={enter && !inking.editing}
      />
    );
  } else if (stage.kind === 'repeat') {
    label = 'Repeat';
    hint = 'Copies of the tile, laid edge to edge.';
    text =
      tutorial.pattern.text ??
      'Repeat the tile edge to edge, with the same lines in every copy.';
    picture = <RepeatedInk model={inking.shown} enter={enter} speed={speed} />;
  } else {
    label = 'Color';
    hint = tutorial.pattern.placements
      ? 'Colors by where each piece sits.'
      : 'One color for each shape of piece.';
    text = colorText(inking.shown);
    picture = (
      <Wall
        model={inking.shown}
        colors={colors}
        fill={fill}
        repeat={colorRepeat(inking.shown)}
        look={wallStyle}
        grout={grout}
        hovered={hovered}
        onHover={setHovered}
        onPick={(type, at) => {
          setSelected(type);
          setPlace(at);
        }}
        enter={enter}
      />
    );
  }

  return (
    <div className="player">
      {printing ? (
        <PrintSheet model={inking.shown} paper={paper} onDone={stopPrinting} />
      ) : null}
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
          <label>
            <input
              type="checkbox"
              checked={showNames}
              onChange={(e) => setShowNames(e.target.checked)}
            />{' '}
            Show names
          </label>
          <span className="brand">Tastir</span>
        </div>
      </header>
      <main className="stage">{picture}</main>
      <footer>
        <div className="text">
          <p className="label">{label}</p>
          {hint ? <p className="stage-hint">{hint}</p> : null}
          <p aria-live="polite">{text}</p>
          {stage.kind === 'ink' ? (
            <div className="ink-tools">
              <button
                type="button"
                className="secondary"
                aria-pressed={inking.editing}
                onClick={() => inking.setEditing(!inking.editing)}
              >
                {inking.editing ? 'Done' : 'Make your own'}
              </button>
              {inking.isClassic ? null : (
                <button
                  type="button"
                  className="secondary"
                  onClick={inking.restoreClassic}
                >
                  Back to the classic
                </button>
              )}
              {inking.editing ? (
                <span>Click a line to ink or erase it.</span>
              ) : null}
            </div>
          ) : null}
          {stage.kind === 'color' ? (
            <div className="wall-tools">
              <label>
                Style{' '}
                <select
                  value={wallStyle}
                  onChange={(e) => setWallStyle(e.target.value as WallStyle)}
                >
                  {WALL_STYLES.map((s) => (
                    <option key={s} value={s}>
                      {s[0]?.toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {wallStyle === 'strapwork' ? 'Band' : 'Grout'}{' '}
                <input
                  type="range"
                  min={0}
                  max={3}
                  step={0.25}
                  value={grout}
                  onChange={(e) => setGrout(Number(e.target.value))}
                />
              </label>
              <span className="hint">
                Drag to move along the wall, scroll to zoom.
              </span>
            </div>
          ) : null}
          {stage.kind === 'color' ? (
            <div className="export-tools">
              <button
                type="button"
                className="quiet"
                onClick={() =>
                  download(svgBlob(exportSvg()), `${tutorial.id}.svg`)
                }
              >
                Download SVG
              </button>
              <button
                type="button"
                className="quiet"
                onClick={() =>
                  void pngBlob(exportSvg()).then((png) =>
                    download(png, `${tutorial.id}.png`),
                  )
                }
              >
                Download PNG
              </button>
              <select
                aria-label="Paper"
                value={paper}
                onChange={(e) => setPaper(e.target.value as Paper)}
              >
                <option>A4</option>
                <option>Letter</option>
              </select>
              <button
                type="button"
                className="quiet"
                onClick={() => setPrinting(true)}
              >
                Print line sheet
              </button>
            </div>
          ) : null}
          {stage.kind === 'color' ? (
            <PiecePanel
              model={inking.shown}
              colors={colors}
              history={colorHistory}
              dispatch={colorDispatch}
              hovered={hovered}
              onHover={setHovered}
              selected={selected}
              onSelect={(type) => {
                setSelected(type);
                setPlace(undefined);
              }}
              place={
                fill && place
                  ? {
                      key: placeKey(
                        inking.shown,
                        place.piece,
                        place.i,
                        place.j,
                      ),
                      color: fill(place.piece, place.i, place.j),
                    }
                  : undefined
              }
              onReset={() =>
                colorDispatch({ kind: 'reset', to: tutorialColoring(model) })
              }
            />
          ) : null}
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
  const { model, error, progress } = useModel(json);
  if (error !== undefined) return <Broken message={error} />;
  if (!model) {
    return (
      <div className="player loading" role="status">
        <p>{PROGRESS_TEXT[progress ?? 'checking']}</p>
      </div>
    );
  }
  return <Player model={model} />;
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
      {import.meta.env.DEV ? (
        <p className="review-banner">
          <a href="#/review">
            <strong>Review page:</strong> progress, decisions and questions →
          </a>{' '}
          <a href="#/notes">
            <strong>Project notes:</strong> goal, queue, status and lessons →
          </a>
        </p>
      ) : null}
      <ul className="cards">
        {entries.map((entry) => (
          <Card key={entry.id} entry={entry} />
        ))}
      </ul>
    </div>
  );
}

/** One tutorial in the library, loaded in the worker. */
function Card({ entry: { id, json } }: { entry: Entry }) {
  const { model, error, progress } = useModel(json);
  return (
    <li>
      <a className="card" href={`#/${id}`}>
        {model ? (
          <Thumbnail model={model} />
        ) : (
          <div className={error ? 'thumbnail broken' : 'thumbnail waiting'} />
        )}
        <h2>{model?.tutorial.title ?? id}</h2>
        {model ? (
          <p>
            {fold(model.tutorial.fold)} · {model.tutorial.style} ·{' '}
            {model.tutorial.level} · {shownSteps(model.tutorial).length} steps
          </p>
        ) : error ? (
          <p className="error">Cannot be played: {error}</p>
        ) : (
          <p>{PROGRESS_TEXT[progress ?? 'checking']}</p>
        )}
      </a>
    </li>
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
  if (route === 'review') {
    return Review ? (
      <Suspense fallback={<p className="review-loading">Loading…</p>}>
        <Review />
      </Suspense>
    ) : (
      <Broken message="The review page only exists on the dev server (pnpm dev)." />
    );
  }
  if (route === 'notes' || route.startsWith('notes/')) {
    return Notes ? (
      <Suspense fallback={<p className="review-loading">Loading…</p>}>
        <Notes page={route.slice('notes/'.length) || 'start'} />
      </Suspense>
    ) : (
      <Broken message="The project notes only exist on the dev server (pnpm dev)." />
    );
  }
  const entry = entries.find((e) => e.id === route);
  if (!entry)
    return <Broken message={`There is no tutorial called "${route}".`} />;
  return <Play key={entry.id} json={entry.json} />;
}

export default App;
