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
import { fullView, growingFrame, width } from './camera';
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
import { Original } from './Original';
import { LIBRARY, type Entry } from './library';
import { useRemembered } from './remembered';
import {
  getDesign,
  listDesigns,
  unreadableKept,
  unreadableNow,
  type Design,
} from './designs';
import { Shelf } from './Shelf';
import { openShared, ShareLink, useShared } from './Sharing';
import { Editor } from '../editor/Editor';
import { copyUpTo } from '../editor/document';
import {
  addPattern,
  freeTitle,
  listPatterns,
  playable,
} from '../editor/patterns';
import { NewPattern, PatternShelf } from '../editor/PatternShelf';
import { SaveDesign } from './SaveDesign';
import {
  asPanel,
  beatsOf,
  hiddenBeats,
  shownBeats,
  shownSteps,
  stagesOf,
  type InkMode,
  type Model,
  type Stage,
} from './model';
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

/**
 * The plan for user-made patterns (#/plan), with its questions for the
 * owner. Like the review page, it exists only on the dev server.
 */
const Plan = import.meta.env.DEV
  ? lazy(() => import('../review/Plan').then((m) => ({ default: m.Plan })))
  : undefined;

/** The plan for drawing along (#/plan/draw-along), dev server only. */
const DrawAlongPlan = import.meta.env.DEV
  ? lazy(() =>
      import('../review/DrawAlongPlan').then((m) => ({
        default: m.DrawAlongPlan,
      })),
    )
  : undefined;

/** Curatorial roadmap of upcoming patterns (#/upcoming). */
const UpcomingPatterns = lazy(() =>
  import('./UpcomingPatterns').then((m) => ({
    default: m.UpcomingPatterns,
  })),
);

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

/** Whether the screen is narrow enough that the panel goes below the wall
 * (styles.css, max-width 1100px). */
function useNarrow(): boolean {
  const query = '(max-width: 1100px)';
  const read = () =>
    typeof window.matchMedia === 'function' && window.matchMedia(query).matches;
  const [narrow, setNarrow] = useState(read);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const list = window.matchMedia(query);
    const onChange = () => setNarrow(list.matches);
    list.addEventListener?.('change', onChange);
    return () => list.removeEventListener?.('change', onChange);
  }, []);
  return narrow;
}

/** Whether a saved design holds just what the player shows now. */
function sameDesign(
  design: Design,
  now: Pick<Design, 'inked' | 'coloring' | 'look' | 'grout'>,
): boolean {
  const sorted = (chosen: Readonly<Record<string, string>>) =>
    JSON.stringify(Object.entries(chosen).sort(([a], [b]) => (a < b ? -1 : 1)));
  return (
    JSON.stringify(design.inked ?? null) ===
      JSON.stringify(now.inked ?? null) &&
    design.coloring.palette === now.coloring.palette &&
    sorted(design.coloring.chosen) === sorted(now.coloring.chosen) &&
    design.look === now.look &&
    design.grout === now.grout
  );
}

/** Where a tutorial opens: at its first step, or at the finished wall. */
export type Start = 'beginning' | 'result';

export function Player({
  model,
  start: asked = 'beginning',
  design: opened,
  address: given,
  banner,
}: {
  model: Model;
  /** A line over the workspace, such as a shared pattern's Keep a copy. */
  banner?: React.ReactNode;
  start?: Start;
  /** A saved design to open, at the wall with its inking and colors. */
  design?: Design;
  /** Where the tutorial lives: its id in the library, or mine/<id> for
   * the learner's own pattern. */
  address?: string;
}) {
  const { tutorial } = model;
  const address = given ?? tutorial.id;
  const mine = address.startsWith('mine/');
  // A pattern opened from a share link: shown, not saved, until kept.
  const sharedView = address === 'shared';
  const start = opened ? 'result' : asked;
  const stages = useMemo(() => stagesOf(tutorial), [tutorial]);
  const [index, setIndex] = useState(() =>
    start === 'result' ? stagesOf(tutorial).length - 1 : 0,
  );
  const stage = useMemo(
    (): Stage => stages[index] ?? { kind: 'color' },
    [stages, index],
  );
  const last = stages.length - 1;
  const [speed, setSpeed] = useState(1);
  const [reduced, setReduced] = useState(prefersReducedMotion);
  const [showNames, setShowNames] = useRemembered<boolean>('showNames', false);
  const [inkMode, setInkMode] = useRemembered<InkMode>('inkMode', 'end');
  const asYouGo = inkMode === 'asYouGo';

  const inking = useInking(model, opened?.inked);
  // The ink stage traces the whole panel, when the tutorial names one.
  const inkModel = useMemo(
    () => (inking.editing ? inking.shown : asPanel(inking.shown)),
    [inking.editing, inking.shown],
  );
  const [colorHistory, colorDispatch] = useReducer(
    colorReducer,
    model,
    (m): History => ({
      past: [],
      now: opened?.coloring ?? tutorialColoring(m),
      future: [],
    }),
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
  const [wallStyle, setWallStyle] = useState<WallStyle>(
    opened?.look ?? tutorial.pattern.look ?? 'tiles',
  );
  const [grout, setGrout] = useState(opened?.grout ?? 1);
  // The design being worked on: the one opened, or the last one saved.
  const [design, setDesign] = useState(opened);
  const designFields = () => ({
    tutorial: address,
    inked: inking.inked,
    coloring: colorHistory.now,
    look: wallStyle,
    grout,
  });
  // A design opened or saved, changed since: Save is offered, and leaving
  // asks first.
  const changed = design !== undefined && !sameDesign(design, designFields());
  // Where the learner was going when asked to save first, if anywhere.
  const [leaving, setLeaving] = useState<string>();
  const leaveAnyway = useRef(false);
  useEffect(() => {
    if (!changed || !design) return;
    const here = `#/${address}/design/${design.id}`;
    // The browser's Back (or any other change of address) asks first too:
    // the address is put back and the question shown.
    stayGuard = (to) => {
      if (leaveAnyway.current) return false;
      window.history.pushState(null, '', here);
      setLeaving(to);
      return true;
    };
    return () => {
      stayGuard = undefined;
    };
  }, [changed, design, address]);
  // At the color stage the design sits at the top of the panel, or, where
  // the panel goes below the wall, under the wall so it is in view.
  const narrow = useNarrow();
  useEffect(() => {
    if (!changed) return;
    // Reloading or closing the tab: the browser's own question.
    const onUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [changed]);
  const saveDesign = sharedView ? (
    <p className="hint">
      Shared with you. Keep a copy (at the top) to save it in this browser.
    </p>
  ) : (
    <SaveDesign
      title={tutorial.title}
      design={design}
      lost={inking.lost}
      changed={changed}
      fields={designFields}
      onSaved={(saved) => {
        setDesign(saved);
        // Its own address, so a reload or a bookmark opens the design.
        window.history.replaceState(
          null,
          '',
          `#/${address}/design/${saved.id}`,
        );
      }}
    />
  );
  const [paper, setPaper] = useState<Paper>('A4');
  const [printing, setPrinting] = useState(false);
  // Opening at the result shows the original beside the wall at once.
  const [comparing, setComparing] = useState(start === 'result');
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
  const [forward, setForward] = useState(start !== 'result');
  const enter = forward && !reduced;

  /** Jumps every running animation to its end. */
  const settle = () => {
    for (const a of running.current) a.finish();
    running.current = [];
  };

  // A calm camera: each step shows everything drawn so far, so the view
  // stays still while a step works inside it and widens, once and smoothly,
  // only when the drawing grows past it. The ink shows everything.
  const hidden = useMemo(() => hiddenBeats(tutorial), [tutorial]);
  const frame = useMemo(
    () =>
      stage.kind === 'step'
        ? growingFrame(model, stage.beat, hidden)
        : fullView(model),
    [model, stage, hidden],
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
      if (!inking.editing && inking.isClassic && !asYouGo)
        running.current = playInk(svgRef.current, asPanel(model), speed, {
          lengthScale: width(camera.view) / width(frame),
        });
      return;
    }
    if (stage.kind !== 'step') return;
    const plan = planStep(model, stage.beat, speed, { ink: asYouGo });
    running.current = play(svgRef.current, plan, {
      // The camera glides to the step's frame while it draws.
      lengthScale: width(camera.view) / width(frame),
    });
    // Only a change of step starts an animation; the view is read as it is.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, stage, model, reduced, speed, frame, asYouGo]);

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
            planStep(model, stage.beat, speed, { flash: false, ink: asYouGo }),
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
  }, [index, stage, model, reduced, speed, asYouGo]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Typing a design's name is not a step.
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === 'ArrowLeft') back();
      if (e.key === 'ArrowRight' || e.key === ' ') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [back, next]);

  const shown = shownSteps(tutorial);
  const beats = beatsOf(tutorial);
  let label: string;
  let hint: string | undefined;
  let text: string;
  let picture: React.ReactNode;
  if (stage.kind === 'step') {
    const beat = beats[stage.beat - 1];
    const number = shown.indexOf(beat?.step ?? 0) + 1;
    label = beat?.parts
      ? `Step ${number} · ${beat.part} of ${beat.parts}`
      : `Step ${number} of ${shown.length}`;
    hint = beat?.heading;
    text = beat?.text ?? '';
    picture = (
      <Construction
        model={model}
        upTo={stage.beat}
        view={camera.view}
        frame={frame}
        arrived={enter}
        svgRef={svgRef}
        showNames={showNames}
        inkSoFar={asYouGo}
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
        upTo={beats.length}
        model={inkModel}
        view={camera.view}
        frame={frame}
        svgRef={svgRef}
        freeInk={inking.freeInk}
        ink
        pen={!asYouGo}
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

  const photos = tutorial.photos ?? [];
  const showOriginal = comparing && stage.kind === 'color' && photos.length > 0;

  /** Jumps straight to a stage from the journey, without playing it in. */
  const jump = (to: number) => {
    if (to === index) return;
    settle();
    reversing.current = false;
    setForward(false);
    setIndex(to);
  };

  const colorStage = stage.kind === 'color';

  return (
    <div className={colorStage ? 'player at-color' : 'player'}>
      {leaving !== undefined && changed ? (
        <div className="leave-backdrop">
          <div
            className="leave-check"
            role="alertdialog"
            aria-label="Unsaved changes"
          >
            <p>
              Your changes to “{design?.name}” are not saved. Leave without
              saving them?
            </p>
            <div>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  leaveAnyway.current = true;
                  window.location.hash = leaving;
                }}
              >
                Leave without saving
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => setLeaving(undefined)}
              >
                Stay
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {printing ? (
        <PrintSheet model={inking.shown} paper={paper} onDone={stopPrinting} />
      ) : null}
      <header className="topbar">
        <a
          className="home"
          href="#/"
          onClick={(e) => {
            if (!changed) return;
            e.preventDefault();
            setLeaving('#/');
          }}
        >
          <span className="wordmark">
            Tastir <span className="brand-arabic" aria-hidden="true" lang="ar" dir="rtl">تسطير</span>
          </span>
          <span>All patterns</span>
        </a>
        <h1>{tutorial.title}</h1>
        {mine ? (
          <a
            className="edit-link"
            href={`#/edit/${address.slice('mine/'.length)}`}
          >
            Edit this pattern
          </a>
        ) : null}
        <details className="view-menu">
          <summary>View settings</summary>
          <div className="controls">
            <label>
              Speed
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
              Ink
              <select
                value={inkMode}
                onChange={(e) => setInkMode(e.target.value as InkMode)}
              >
                <option value="end">at the end</option>
                <option value="asYouGo">as you go</option>
              </select>
            </label>
            <label>
              <input
                type="checkbox"
                checked={reduced}
                onChange={(e) => setReduced(e.target.checked)}
              />
              Reduce motion
            </label>
            <label>
              <input
                type="checkbox"
                checked={showNames}
                onChange={(e) => setShowNames(e.target.checked)}
              />
              Show names
            </label>
          </div>
        </details>
      </header>
      {banner}
      <div className={colorStage ? 'workspace with-panel' : 'workspace'}>
        <Journey stages={stages} index={index} onJump={jump} />
        <section className="plate-area">
          <main className={showOriginal ? 'stage comparing' : 'stage'}>
            {showOriginal ? <Original photos={photos} /> : null}
            {picture}
          </main>
          <footer className="caption">
            <div className="text">
              <p className="label">{label}</p>
              {hint ? <p className="stage-hint">{hint}</p> : null}
              {stage.kind === 'color' && narrow ? saveDesign : null}
              <p className="instruction" aria-live="polite">
                {text}
              </p>
              {stage.kind === 'step' ? (
                <p className="dot-key">
                  <span className="new">blue: what this step makes</span>
                  <span className="used">saffron: what it works from</span>
                </p>
              ) : null}
              {stage.kind === 'step' && !sharedView ? (
                <CopyHere
                  tutorial={tutorial}
                  address={address}
                  step={beats[stage.beat - 1]?.step ?? 1}
                  shownNumber={
                    shown.indexOf(beats[stage.beat - 1]?.step ?? 0) + 1
                  }
                />
              ) : null}
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
              {stage.kind === 'ink' ? saveDesign : null}
            </div>
            <nav aria-label="Steps">
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
              <button
                type="button"
                className="next"
                onClick={next}
                disabled={index === last}
              >
                Next
              </button>
            </nav>
          </footer>
        </section>
        {colorStage ? (
          <aside className="side-panel" aria-label="The wall">
            {narrow ? null : (
              <section>
                <h2>My design</h2>
                {saveDesign}
              </section>
            )}
            {photos.length ? (
              <section>
                <h2>The original</h2>
                <button
                  type="button"
                  className="compare-toggle"
                  aria-pressed={comparing}
                  onClick={() => setComparing(!comparing)}
                >
                  {comparing
                    ? 'Hide the original'
                    : 'Compare with the original'}
                </button>
                <p className="hint">
                  A photo of the real pattern, beside the wall. Click it to see
                  it at full size.
                </p>
              </section>
            ) : null}
            <section>
              <h2>The wall</h2>
              <div className="wall-tools">
                <label>
                  Style
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
                  {wallStyle === 'strapwork' ? 'Band' : 'Grout'}
                  <input
                    type="range"
                    min={0}
                    max={3}
                    step={0.25}
                    value={grout}
                    onChange={(e) => setGrout(Number(e.target.value))}
                  />
                </label>
              </div>
              <p className="hint">
                Drag to move along the wall, scroll to zoom.
              </p>
            </section>
            <section>
              <h2>Colors</h2>
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
            </section>
            <section>
              <h2>Take it with you</h2>
              {sharedView ? null : (
                <ShareLink
                  address={address}
                  name={design?.name ?? tutorial.title}
                  fields={() => {
                    const { tutorial: _t, ...rest } = designFields();
                    return rest;
                  }}
                />
              )}
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
            </section>
          </aside>
        ) : null}
      </div>
    </div>
  );
}

/**
 * “Make my own copy from here”: the steps so far, with the original's
 * credits and where it came from, as the learner's own pattern, opened in
 * the editor.
 */
function CopyHere({
  tutorial,
  address,
  step,
  shownNumber,
}: {
  tutorial: Model['tutorial'];
  address: string;
  /** The step's id: every step up to it is kept, hidden ones too. */
  step: number;
  /** Its number as the learner sees it. */
  shownNumber: number;
}) {
  const [refused, setRefused] = useState(false);
  const copy = () => {
    const copy = copyUpTo(tutorial, step, shownNumber);
    const made = addPattern(
      { ...copy, title: freeTitle(copy.title) },
      {
        tutorial: address,
        title: tutorial.title,
        step: shownNumber,
      },
    );
    if (!made) return setRefused(true);
    window.location.hash = `#/edit/${made.id}`;
  };
  return (
    <div className="copy-here">
      <button type="button" className="quiet" onClick={copy}>
        Make my own copy from here
      </button>
      {refused ? (
        <span className="refused" role="alert">
          This browser would not keep the copy: its storage is blocked (a
          private window) or full.
        </span>
      ) : null}
    </div>
  );
}

/** A small mark for each phase after the construction. */
const PHASE_MARKS: Record<'ink' | 'repeat' | 'color', React.ReactNode> = {
  ink: (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M3 13 L13 3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  repeat: (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  ),
  color: (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M8 1 L10 6 L15 8 L10 10 L8 15 L6 10 L1 8 L6 6 Z"
        fill="currentColor"
      />
    </svg>
  ),
};

const PHASE_NAMES = { ink: 'Ink', repeat: 'Repeat', color: 'Color' } as const;

/**
 * Where the learner is: every step of the construction, then the ink, the
 * repeat and the color. Each can be clicked to go straight there.
 */
function Journey({
  stages,
  index,
  onJump,
}: {
  stages: readonly Stage[];
  index: number;
  onJump: (to: number) => void;
}) {
  const steps = stages.flatMap((s, i) => (s.kind === 'step' ? [i] : []));
  const state = (i: number) => (i < index ? 'done' : undefined);
  return (
    <nav className="journey" aria-label="Where you are">
      <h2>Construction</h2>
      <ol className="steps">
        {steps.map((i, n) => (
          <li key={i}>
            <button
              type="button"
              className={['step-dot', state(i)].filter(Boolean).join(' ')}
              aria-current={i === index ? 'step' : undefined}
              aria-label={`Go to step ${n + 1}`}
              onClick={() => onJump(i)}
            >
              {n + 1}
            </button>
          </li>
        ))}
      </ol>
      <ol className="phases">
        {stages.map((s, i) =>
          s.kind === 'step' ? null : (
            <li key={s.kind}>
              <button
                type="button"
                className={['phase', state(i)].filter(Boolean).join(' ')}
                aria-current={i === index ? 'step' : undefined}
                aria-label={`Go to ${PHASE_NAMES[s.kind].toLowerCase()}`}
                onClick={() => onJump(i)}
              >
                <span className="phase-mark">{PHASE_MARKS[s.kind]}</span>
                <span className="phase-name">{PHASE_NAMES[s.kind]}</span>
              </button>
            </li>
          ),
        )}
      </ol>
    </nav>
  );
}

/** Plays one tutorial; a tutorial the engine rejects shows its error. */
export function Play({
  json,
  start,
  design,
  address,
  banner,
}: {
  json: unknown;
  start?: Start;
  design?: Design;
  address?: string;
  banner?: React.ReactNode;
}) {
  const { model, error, progress } = useModel(json);
  if (error !== undefined) return <Broken message={error} />;
  if (!model) {
    return (
      <div className="player loading" role="status">
        <p>{PROGRESS_TEXT[progress ?? 'checking']}</p>
      </div>
    );
  }
  return (
    <Player
      model={model}
      start={start}
      design={design}
      address={address}
      banner={banner}
    />
  );
}

function Broken({ message }: { message: string }) {
  return (
    <div className="player">
      <header className="topbar">
        <a className="home" href="#/">
          <span className="wordmark">Tastir</span>
          <span>All patterns</span>
        </a>
        <h1>This pattern cannot be shown</h1>
      </header>
      <pre className="error">{message}</pre>
    </div>
  );
}

/**
 * A design address that leads nowhere: no such design in this browser, or
 * a design of another pattern. Said plainly, with the ways on.
 */
function MissingDesign({
  tutorial,
  design,
  known,
}: {
  /** The pattern the address names, when it is in the library. */
  tutorial?: string;
  /** The design the address names, when it is saved here. */
  design?: Design;
  /** Whether the design's own pattern is in the library. */
  known: boolean;
}) {
  return (
    <div className="player">
      <header className="topbar">
        <a className="home" href="#/">
          <span className="wordmark">Tastir</span>
          <span>All patterns</span>
        </a>
      </header>
      <section className="notice">
        <h1>This design is not here</h1>
        {design ? (
          <p>
            “{design.name}” is a design of another pattern, so this address does
            not open it.
          </p>
        ) : (
          <p>
            There is no such design in this browser. Designs are kept only in
            the browser they were made in, and this one may have been deleted.
          </p>
        )}
        <p className="notice-links">
          {design && known ? (
            <a
              className="button"
              href={`#/${design.tutorial}/design/${design.id}`}
            >
              Open “{design.name}”
            </a>
          ) : null}
          {tutorial ? (
            <a className="button secondary" href={`#/${tutorial}`}>
              Open the pattern
            </a>
          ) : null}
          <a className="button secondary" href="#/">
            All patterns
          </a>
        </p>
      </section>
    </div>
  );
}

/** What the library needs to know about a tutorial before it is loaded. */
function aboutOf(json: unknown): { style?: string; level?: string; fold?: number } {
  const t = (json ?? {}) as { style?: unknown; level?: unknown; fold?: unknown };
  return {
    ...(typeof t.style === 'string' ? { style: t.style } : {}),
    ...(typeof t.level === 'string' ? { level: t.level } : {}),
    ...(typeof t.fold === 'number' ? { fold: t.fold } : {}),
  };
}

const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
const capital = (s: string) => (s ? s[0]?.toUpperCase() + s.slice(1) : s);

/** The pattern that draws itself at the top of the library. */
const HERO = 'twelve-fold-rosette-mian';
/** Where a newcomer starts. */
const FIRST = 'eight-fold-star-and-cross';

const TRADITIONS: Record<
  string,
  {
    arabic: string;
    era: string;
    region: string;
    medium: string;
    summary: string;
  }
> = {
  Moroccan: {
    arabic: 'الزليج المغربي',
    era: '12th Century – Present',
    region: 'Fez, Marrakech & Rabat',
    medium: 'Glazed terracotta tesserae (zellij)',
    summary:
      'Masterful geometric mosaics hand-chiselled from enamelled terracotta, renowned for rich saffron, cobalt, and emerald glazes radiating through celestial star rosettes.',
  },
  'Marinid zellige (Fès)': {
    arabic: 'الزليج المريني بفاس',
    era: '1244 – 1465 CE',
    region: 'Bou Inania & Attarine Medersas, Fez',
    medium: 'Classical Marinid zellij & carved cedarwood',
    summary:
      'The zenith of western Islamic geometry, epitomized by the monumental 16-fold and 12-fold star rosettes of Fez madrasas, harmonizing cut tilework with intricate stucco and cedar joinery.',
  },
  Nasrid: {
    arabic: 'الحسبة الأندلسية بالنصرية',
    era: '1238 – 1492 CE',
    region: 'The Alhambra, Granada',
    medium: 'Interlacing tilework (alicatado) & carved stucco',
    summary:
      'Sophisticated lacería strapwork with infinite ribbons weaving over and under through celestial 12, 16, and 24-pointed stars, celebrating proportion and harmony in the Palaces of the Alhambra.',
  },
  Mamluk: {
    arabic: 'العمارة المملوكية بالقاهرة',
    era: '1250 – 1517 CE',
    region: 'Cairo, Egypt',
    medium: 'Pierced marble, minbar inlays & brass doorplates',
    summary:
      'Monumental Cairo geometry characterized by crisp polygonal strapwork, decagram star rosettes, and ivory-inlaid geometric minbars of Sultan Hassan and Qaytbay.',
  },
  Timurid: {
    arabic: 'العمارة التيمورية',
    era: '1370 – 1507 CE',
    region: 'Samarkand, Bukhara & Herat',
    medium: 'Banna’i glazed brickwork & girih tiles',
    summary:
      'Monumental turquoise and lapis lazuli geometric faience adorning colossal iwans, domes, and portals, pioneering complex quasi-crystalline girih decagrams.',
  },
  Seljuk: {
    arabic: 'الهندسة السلجوقية',
    era: '1037 – 1194 CE',
    region: 'Isfahan, Konya & Divriği',
    medium: 'Carved stone portals & brick strapwork',
    summary:
      'Bold three-dimensional geometric relief carved deeply into monumental stone portals, madrasa gates, and intricate brickwork throughout Anatolia and Persia.',
  },
  Tulunid: {
    arabic: 'الطراز الطولوني',
    era: '868 – 905 CE',
    region: 'Ibn Tulun Mosque, Cairo',
    medium: 'Carved stucco arcades & geometric window grilles',
    summary:
      'Pioneering openwork stucco lattices with stylized geometric strapwork filtering sacred desert daylight into early Islamic hypostyle prayer halls.',
  },
  Mughal: {
    arabic: 'العمارة المغولية',
    era: '1526 – 1857 CE',
    region: 'Agra, Delhi & Lahore',
    medium: 'Carved red sandstone & pierced marble jali lattices',
    summary:
      'Intricate marble jali screens and pietra dura stonework uniting imperial Islamic geometric symmetry with refined architectural grace.',
  },
};

/** Every tutorial, with a picture of the finished pattern. */
export function Library({ entries }: { entries: readonly Entry[] }) {
  const [style, setStyle] = useState<string>();
  const [level, setLevel] = useState<string>();
  const [fold, setFold] = useState<number>();
  const [designs, setDesigns] = useState(listDesigns);
  const [patterns, setPatterns] = useState(listPatterns);
  const styles = [
    ...new Set(entries.flatMap((e) => aboutOf(e.json).style ?? [])),
  ].sort();
  const folds = [
    ...new Set(entries.flatMap((e) => aboutOf(e.json).fold ?? [])),
  ].sort((a, b) => a - b);
  const shown = entries.filter((e) => {
    const about = aboutOf(e.json);
    return (
      (!style || about.style === style) &&
      (!level || about.level === level) &&
      (!fold || about.fold === fold)
    );
  });
  const hero = entries.find((e) => e.id === HERO) ?? entries[0];
  const first = entries.find((e) => e.id === FIRST) ?? entries[0];
  return (
    <div className="library">
      <header className="masthead">
        <div className="brand-group">
          <h1 aria-label="Tastir">
            Tastir <span className="brand-arabic" aria-hidden="true" lang="ar" dir="rtl">تسطير</span>
          </h1>
        </div>
        {designs.length ? (
          <button
            type="button"
            className="jump-link"
            onClick={() =>
              document
                .getElementById('my-designs')
                ?.scrollIntoView?.({ behavior: 'smooth' })
            }
          >
            My designs ({designs.length})
          </button>
        ) : null}
        {patterns.length ? (
          <button
            type="button"
            className="jump-link"
            onClick={() =>
              document
                .getElementById('my-patterns')
                ?.scrollIntoView?.({ behavior: 'smooth' })
            }
          >
            My patterns ({patterns.length})
          </button>
        ) : null}
        {patterns.length ? null : <NewPattern />}
        <a className="jump-link upcoming-nav-link" href="#/upcoming">
          Upcoming patterns (24)
        </a>
        {import.meta.env.DEV ? (
          <p className="dev-links">
            <a href="#/review">
              <strong>Review page:</strong> progress, decisions and questions
            </a>
            <a href="#/notes">
              <strong>Project notes:</strong> goal, queue, status and lessons
            </a>
          </p>
        ) : null}
      </header>
      <section className="hero">
        {hero ? <HeroDrawing key={hero.id} entry={hero} /> : null}
        <div className="hero-copy">
          <div className="eyebrow">
            <span>Islamic Geometric Drafting Atelier</span>
            <span className="eyebrow-sep">·</span>
            <span className="eyebrow-arabic" lang="ar" dir="rtl">علم التسطير والهندسة</span>
          </div>
          <h2>Draw Islamic geometric patterns with a compass and a ruler.</h2>
          <p>
            Every pattern here starts from one circle. Each step adds a circle
            or a line, and the pattern appears out of the lines you drew.
          </p>
          <ol className="hero-steps">
            <li>Follow the construction, one step at a time.</li>
            <li>Ink the lines that make the pattern.</li>
            <li>Repeat the tile into a wall and color it.</li>
          </ol>
          {first ? (
            <a className="button primary" href={`#/${first.id}`}>
              Start with the star and cross
            </a>
          ) : null}
        </div>
      </section>
      {designs.length || unreadableKept() || unreadableNow() ? (
        <Shelf
          designs={designs}
          entries={entries}
          onChange={() => setDesigns(listDesigns())}
        />
      ) : null}
      {patterns.length ? (
        <PatternShelf
          patterns={patterns}
          onChange={() => {
            setPatterns(listPatterns());
            setDesigns(listDesigns());
          }}
        />
      ) : null}
      <section aria-labelledby="collection">
        <div className="collection-head">
          <h2 id="collection">The patterns</h2>
          <div className="collection-meta">
            <p>
              {shown.length === entries.length
                ? `${entries.length} patterns, many checked against photos of the real walls.`
                : `${shown.length} of ${entries.length} patterns.`}
            </p>
            <a className="upcoming-teaser-link" href="#/upcoming">
              Upcoming masterworks roadmap (24) →
            </a>
          </div>
        </div>
        <div className="filters">
          <fieldset className="filter-group">
            <legend>Tradition</legend>
            <Chip on={!style} onClick={() => setStyle(undefined)}>
              All
            </Chip>
            {styles.map((s) => (
              <Chip key={s} on={style === s} onClick={() => setStyle(s)}>
                {s}
              </Chip>
            ))}
          </fieldset>
          <fieldset className="filter-group">
            <legend>Symmetry</legend>
            <Chip on={!fold} onClick={() => setFold(undefined)}>
              Any fold
            </Chip>
            {folds.map((f) => (
              <Chip key={f} on={fold === f} onClick={() => setFold(f)}>
                {f}-fold
              </Chip>
            ))}
          </fieldset>
          <fieldset className="filter-group">
            <legend>Level</legend>
            <Chip on={!level} onClick={() => setLevel(undefined)}>
              Any
            </Chip>
            {LEVELS.map((l) => (
              <Chip key={l} on={level === l} onClick={() => setLevel(l)}>
                {capital(l)}
              </Chip>
            ))}
          </fieldset>
        </div>
        {style && TRADITIONS[style] ? (
          <aside className="tradition-dossier" aria-label={`Context for ${style}`}>
            <div className="dossier-header">
              <div className="dossier-badge">
                <span className="dossier-tag">TRADITION CONTEXT</span>
                <span className="dossier-sep">·</span>
                <span className="dossier-ar" lang="ar" dir="rtl">{TRADITIONS[style].arabic}</span>
              </div>
              <button
                type="button"
                className="dossier-clear"
                onClick={() => setStyle(undefined)}
              >
                Clear tradition filter ✕
              </button>
            </div>
            <div className="dossier-body">
              <div className="dossier-heading">
                <h3 className="dossier-title">{style}</h3>
                <p className="dossier-meta">
                  <span>{TRADITIONS[style].era}</span>
                  <span className="meta-dot">·</span>
                  <span>{TRADITIONS[style].region}</span>
                  <span className="meta-dot">·</span>
                  <span>{TRADITIONS[style].medium}</span>
                </p>
              </div>
              <p className="dossier-summary">{TRADITIONS[style].summary}</p>
            </div>
          </aside>
        ) : null}
        {shown.length ? (
          <ul className="cards">
            {shown.map((entry) => (
              <Card key={entry.id} entry={entry} />
            ))}
          </ul>
        ) : (
          <p className="empty">
            No pattern matches both choices. Choose another tradition or level.
          </p>
        )}
      </section>
      <footer className="site-footer">
        Tastir draws every point from crossings of earlier circles and lines, as
        with a real compass and ruler. Sources and photographers are named with
        each pattern.
      </footer>
    </div>
  );
}

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button type="button" className="chip" aria-pressed={on} onClick={onClick}>
      {children}
    </button>
  );
}

const ARABIC_TITLES: Record<string, string> = {
  'eight-fold-star-and-cross': 'خاتم سليمان وثماني',
  'eight-fold-zellige': 'زليج ثماني مغربي',
  'bou-inania-rosette': 'خاتم الستة عشر البوعنانية بفاس',
  'bou-inania-twelve-fold-wall': 'حائط اثنا عشري بالبوعنانية',
  'sixteen-fold-rosette': 'طاسة الستة عشر المرينية',
  'twelve-fold-rosette-mian': 'روزيتا اثنا عشرية',
  'twelve-fold-rosette-mian-hex': 'روزيتا مسدسة مسدسة',
  'twelve-fold-dodecagrams': 'اثنا عشري نجمي',
  'alhambra-comares-stars': 'نجوم قاعة قمارش بقصر الحمراء',
  'alhambra-reyes-dodecagrams': 'اثنا عشري قاعة الملوك بالحمراء',
  'alhambra-reyes-stars': 'نجوم قاعة الملوك بالحمراء',
  'alhambra-mexuar-stars': 'نجوم المشور بقصر الحمراء',
  'alhambra-barca-stars': 'نجوم قاعة البركة بالحمراء',
  'alhambra-bath-stars': 'نجوم حمامات قصر الحمراء',
  'alhambra-arrayanes-squares': 'مربعات صحن الريحان بالحمراء',
  'ibn-tulun-window': 'شمسية جامع ابن طولون بالقاهرة',
  'minbar-doors-cairo': 'مصاريع منبر قاهري مملوكي',
  'four-fold-ring-of-circles': 'حلقة الدوائر الرباعية',
  'six-fold-star-and-hexagons': 'نجمة مسدسة ومسدسات',
  'six-fold-snowflake': 'ندفة الثلج المسدسة',
  'six-fold-hammerhead': 'مطرقة مسدسة تيمورية',
};

/** One tutorial in the library, loaded in the worker. */
function Card({ entry: { id, json } }: { entry: Entry }) {
  const { model, error, progress } = useModel(json);
  const photos = model?.tutorial.photos?.length ?? 0;
  return (
    <li className="card-item">
      <a className="card" href={`#/${id}`}>
        {model ? (
          <Thumbnail model={model} />
        ) : (
          <div className={error ? 'thumbnail broken' : 'thumbnail waiting'} />
        )}
        <h3>{model?.tutorial.title ?? id}</h3>
        {ARABIC_TITLES[id] ? (
          <span className="card-arabic" lang="ar" dir="rtl">
            {ARABIC_TITLES[id]}
          </span>
        ) : null}
        {model ? (
          <p className="meta">
            <span className="level">{capital(model.tutorial.level)}</span>
            <span>{shownSteps(model.tutorial).length} steps</span>
            <span>{model.tutorial.fold}-fold</span>
            <span>{model.tutorial.style}</span>
          </p>
        ) : error ? (
          <p className="error">Cannot be played: {error}</p>
        ) : (
          <p>{PROGRESS_TEXT[progress ?? 'checking']}</p>
        )}
      </a>
      {model ? (
        <div className="card-actions">
          <a className="button watch" href={`#/${id}`}>
            <svg
              aria-hidden="true"
              className="action-icon"
              viewBox="0 0 16 16"
              width="13"
              height="13"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <circle cx="8" cy="8" r="6" />
              <path d="M8 2v4M8 10v4M2 8h4M10 8h4" />
            </svg>
            Watch it drawn
          </a>
          <a className="button result" href={`#/${id}/result`}>
            {photos ? (
              <>
                <svg
                  aria-hidden="true"
                  className="action-icon"
                  viewBox="0 0 16 16"
                  width="13"
                  height="13"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
                  <rect x="2" y="3" width="12" height="10" rx="1.5" />
                  <circle cx="8" cy="8" r="2.5" />
                </svg>
                Result and original
              </>
            ) : (
              <>
                <svg
                  aria-hidden="true"
                  className="action-icon"
                  viewBox="0 0 16 16"
                  width="13"
                  height="13"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
                  <path d="M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9z" />
                </svg>
                See the result
              </>
            )}
          </a>
        </div>
      ) : null}
    </li>
  );
}

/** The hero: a pattern drawing itself, loaded like any other. */
function HeroDrawing({ entry }: { entry: Entry }) {
  const { model } = useModel(entry.json);
  return (
    <figure className="hero-plate">
      {model ? (
        <HeroPlay model={model} />
      ) : (
        <div className="plate-frame">
          <div className="thumbnail waiting" />
        </div>
      )}
    </figure>
  );
}

/** How long the hero holds the finished, colored pattern. */
const HERO_HOLD_MS = 4500;
const HERO_SPEED = 1.6;

/**
 * Plays the construction step by step, inks it, then shows it colored, and
 * starts again; with reduced motion it shows the colored pattern only.
 */
function HeroPlay({ model }: { model: Model }) {
  const beats = useMemo(() => shownBeats(model.tutorial), [model]);
  const all = beatsOf(model.tutorial).length;
  const reduced = useMemo(prefersReducedMotion, []);
  const [k, setK] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);
  const view = useMemo(() => fullView(model), [model]);
  const panelModel = useMemo(() => asPanel(model), [model]);
  const n = beats.length;
  const colorSteps = model.pattern.types.length;
  const total = n + colorSteps + 3;
  const colors = useMemo(
    () => pieceColors(model, tutorialColoring(model)),
    [model],
  );

  const isFadingLines = k === n + 1;
  const isColoring = k >= n + 2 && k <= n + 1 + colorSteps;
  const isFinished = k > n + 1 + colorSteps;
  const coloredUpTo = isFinished ? undefined : isColoring ? k - (n + 1) : 0;
  const colorIndex = isColoring ? k - n - 2 : isFinished ? colorSteps - 1 : -1;

  useLayoutEffect(() => {
    if (reduced) return;
    let anims: Animation[] = [];
    if (k < n) {
      anims = play(svgRef.current, planStep(model, beats[k] ?? 1, HERO_SPEED));
    } else if (k === n) {
      anims = playInk(svgRef.current, panelModel, HERO_SPEED * 1.5);
    }
    const ends = anims.map(
      (a) => Number(a.effect?.getComputedTiming().endTime ?? 0) || 0,
    );
    const wait =
      k === total - 1
        ? HERO_HOLD_MS
        : isFadingLines
          ? 1100
          : isColoring
            ? 850
            : Math.max(600, ...ends) + (k === n ? 900 : 350);
    const timer = setTimeout(() => setK((k + 1) % total), wait);
    return () => {
      clearTimeout(timer);
      for (const a of anims) a.cancel();
    };
  }, [k, n, total, beats, model, panelModel, reduced, isFadingLines, isColoring]);

  const caption =
    reduced || isFinished
      ? `${model.tutorial.title}: completed design`
      : k === n
        ? `${model.tutorial.title}: inking the pattern`
        : isFadingLines
          ? `${model.tutorial.title}: revealing the inked pattern`
          : isColoring
            ? `${model.tutorial.title}: coloring — ${nameOf(model, colorIndex)} (${colorIndex + 1} of ${colorSteps})`
            : `${model.tutorial.title}: step ${k + 1} of ${n}`;

  return (
    <>
      <div className={`plate-frame ${isColoring ? 'coloring-active' : ''}`}>
        {reduced || isFinished ? (
          <Thumbnail model={model} view={view} />
        ) : isColoring ? (
          <Thumbnail model={model} view={view} coloredUpTo={coloredUpTo} />
        ) : isFadingLines ? (
          <Construction
            model={panelModel}
            upTo={all}
            view={view}
            svgRef={svgRef}
            ink
            enter
            fadeLines
          />
        ) : k === n ? (
          <Construction
            model={panelModel}
            upTo={all}
            view={view}
            svgRef={svgRef}
            ink
            enter
          />
        ) : (
          <Construction
            model={model}
            upTo={beats[k] ?? 1}
            view={view}
            svgRef={svgRef}
          />
        )}
      </div>

      <div className="hero-status-row">
        <figcaption>{caption}</figcaption>
        {!reduced && (
          <div className="hero-progress-group" aria-label="Hero animation progress">
            <div className="hero-coloring-chips" title="Coloring progress by shape">
              {model.pattern.types.map((_, i) => (
                <span
                  key={i}
                  className={`hero-color-chip ${
                    isFinished || i <= colorIndex ? 'active' : ''
                  }`}
                  style={{
                    backgroundColor: colors[i] ?? '#c2410c',
                  }}
                  title={nameOf(model, i)}
                  aria-label={nameOf(model, i)}
                />
              ))}
            </div>
            <div
              className="hero-progress-track"
              role="progressbar"
              aria-valuenow={Math.round(((k + 1) / total) * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="hero-progress-fill"
                style={{
                  width: `${Math.round(((k + 1) / total) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/**
 * Set by a player whose design has unsaved changes: called when the
 * address changes, it may put the address back and ask first (true).
 */
let stayGuard: ((to: string) => boolean) | undefined;

/** The tutorial id in the address (#/id), or '' for the library. */
function useRoute(): string {
  const read = () =>
    decodeURIComponent(window.location.hash.replace(/^#\/?/, ''));
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const onChange = () => {
      if (stayGuard?.(`#/${read()}`)) return;
      setRoute(read());
      window.scrollTo?.(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

/** The library, or the tutorial the address names. */
export function App({
  entries: library = LIBRARY,
}: {
  entries?: readonly Entry[];
}) {
  const route = useRoute();
  // #/mine/p… plays the learner's own pattern p like a library tutorial.
  const ownId = /^mine\/([^/]+)/.exec(route)?.[1];
  const own = useMemo(
    () => (ownId === undefined ? undefined : playable(ownId)),
    [ownId],
  );
  const entries = useMemo(
    () => (own && 'entry' in own ? [...library, own.entry] : library),
    [own, library],
  );
  if (!route) return <Library entries={library} />;
  if (route === 'upcoming') {
    return (
      <Suspense fallback={<p className="review-loading">Loading upcoming patterns…</p>}>
        <UpcomingPatterns />
      </Suspense>
    );
  }
  if (ownId !== undefined && !(own && 'entry' in own))
    return <NotPlayable id={ownId} reason={own?.reason} />;
  if (route === 'review') {
    return Review ? (
      <Suspense fallback={<p className="review-loading">Loading…</p>}>
        <Review />
      </Suspense>
    ) : (
      <Broken message="The review page only exists on the dev server (pnpm dev)." />
    );
  }
  if (route === 'plan/draw-along') {
    return DrawAlongPlan ? (
      <Suspense fallback={<p className="review-loading">Loading…</p>}>
        <DrawAlongPlan />
      </Suspense>
    ) : (
      <Broken message="The plan only exists on the dev server (pnpm dev)." />
    );
  }
  if (route === 'plan') {
    return Plan ? (
      <Suspense fallback={<p className="review-loading">Loading…</p>}>
        <Plan />
      </Suspense>
    ) : (
      <Broken message="The plan only exists on the dev server (pnpm dev)." />
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
  // #/shared/code opens a pattern from a share link.
  if (route.startsWith('shared/'))
    return (
      <SharedPage
        key={route}
        code={route.slice('shared/'.length)}
        library={library}
      />
    );
  // #/edit/p opens one of the learner's own patterns in the editor.
  if (route.startsWith('edit/'))
    return <Editor key={route} id={route.slice('edit/'.length)} />;
  // #/id/design/d opens a saved design at its wall.
  const mine = /^(.+)\/design\/([^/]+)$/.exec(route);
  if (mine) {
    const [, tutorial = '', designId = ''] = mine;
    const design = getDesign(designId);
    const entry = entries.find((e) => e.id === tutorial);
    if (entry && design?.tutorial === tutorial)
      return (
        <Play
          key={route}
          json={entry.json}
          design={design}
          address={tutorial}
        />
      );
    return (
      <MissingDesign
        tutorial={entry ? tutorial : undefined}
        design={design}
        known={design ? entries.some((e) => e.id === design.tutorial) : false}
      />
    );
  }
  // #/id plays from the first step; #/id/result opens at the finished wall.
  const result = route.endsWith('/result');
  const id = result ? route.slice(0, -'/result'.length) : route;
  const entry = entries.find((e) => e.id === id);
  if (!entry)
    return <Broken message={`There is no tutorial called "${route}".`} />;
  return (
    <Play
      key={route}
      json={entry.json}
      start={result ? 'result' : 'beginning'}
      address={id}
    />
  );
}

/** A pattern from a share link: played at its wall, with Keep a copy. */
function SharedPage({
  code,
  library,
}: {
  code: string;
  library: readonly Entry[];
}) {
  const shared = useShared(code);
  const opened = useMemo(
    () => (shared ? openShared(shared, library) : undefined),
    [shared, library],
  );
  const [refused, setRefused] = useState(false);
  if (shared === undefined)
    return (
      <div className="player loading" role="status">
        <p>Opening the shared pattern…</p>
      </div>
    );
  if (shared === null || !opened || 'reason' in opened)
    return (
      <Broken
        message={
          opened && 'reason' in opened
            ? opened.reason
            : 'This share link cannot be read. It may have been cut short when it was copied.'
        }
      />
    );
  return (
    <Play
      json={opened.json}
      design={opened.design}
      address="shared"
      banner={
        <div className="shared-banner">
          <span>A pattern shared with you: “{opened.design.name}”.</span>
          <button
            type="button"
            onClick={() => {
              const to = opened.keep();
              if (to) window.location.hash = to;
              else setRefused(true);
            }}
          >
            Keep a copy in this browser
          </button>
          {refused ? (
            <span className="refused" role="alert">
              This browser would not keep it: its storage is blocked or full.
            </span>
          ) : null}
        </div>
      }
    />
  );
}

/** One of the learner's own patterns that cannot be played (yet). */
function NotPlayable({ id, reason }: { id: string; reason?: string }) {
  return (
    <div className="player">
      <header className="topbar">
        <a className="home" href="#/">
          <span className="wordmark">Tastir</span>
          <span>All patterns</span>
        </a>
      </header>
      <section className="notice">
        <h1>
          {reason
            ? 'This pattern cannot be played yet'
            : 'This pattern is not here'}
        </h1>
        <p>
          {reason ??
            'There is no such pattern in this browser. Your own patterns are kept only in the browser they were made in.'}
        </p>
        <p className="notice-links">
          {reason ? (
            <a className="button" href={`#/edit/${id}`}>
              Open it in the editor
            </a>
          ) : null}
          <a className="button secondary" href="#/">
            All patterns
          </a>
        </p>
      </section>
    </div>
  );
}

export default App;
