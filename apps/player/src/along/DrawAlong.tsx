import {
  checkStep,
  distance,
  extrasOn,
  figureOn,
  neededAt,
  type StepCheck,
  type Vec,
} from '@tastir/engine';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { fullView, growingFrame, type Rect } from '../app/camera';
import { Construction } from '../app/drawing';
import {
  asPanel,
  beatsOf,
  hiddenBeats,
  shownBeats,
  shownSteps,
  type Model,
} from '../app/model';
import { useCamera } from '../app/useCamera';
import { nearestPiece } from '../editor/Editor';
import { PROGRESS_TEXT, useModel } from '../app/workerClient';
import { check, emptyDraft, type Draft } from '../editor/document';
import { EditorDrawing } from '../editor/EditorDrawing';
import { shapeName } from '../editor/finish';
import { makeStep, type Choice } from '../editor/makeStep';
import { ToolBar } from '../editor/ToolBar';
import {
  complete,
  sameTarget,
  snap,
  toolOf,
  wantAt,
  type PointPlace,
  type Symmetry,
  type Target,
  type ToolId,
} from '../editor/tools';
import { drawForMe } from './drawForMe';
import { hintFor } from './hints';
import { namesIn, placeKey, readableAt, readableNames } from './names';
import { withTutorialNames } from './naming';
import { forgetProgress, getProgress, keepProgress } from './progress';
import { useInkBoard } from './useInkBoard';
import '../editor/editor.css';
import './along.css';

/** The draw-along page (#/<tutorial>/draw), once the tutorial is loaded. */
export function DrawAlongPage({
  json,
  address,
}: {
  json: unknown;
  address: string;
}) {
  const { model, error, progress } = useModel(json);
  if (error !== undefined)
    return (
      <div className="player">
        <section className="notice">
          <h1>This pattern cannot be drawn along</h1>
          <p>{error}</p>
          <p className="notice-links">
            <a className="button secondary" href="#/">
              All patterns
            </a>
          </p>
        </section>
      </div>
    );
  if (!model)
    return (
      <div className="player loading" role="status">
        <p>{PROGRESS_TEXT[progress ?? 'checking']}</p>
      </div>
    );
  return <DrawAlong model={model} address={address} />;
}

/** The board's drafts before and after this one, for Undo and Redo. */
interface History {
  readonly past: readonly Draft[];
  readonly now: Draft;
  readonly future: readonly Draft[];
}

const NUMBER_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six'];
const count = (n: number) => NUMBER_WORDS[n] ?? String(n);
/** What a step still needs, in words: “one line and the tile”. */
function stillToDraw(c: StepCheck, cell: string): string {
  const by = new Map<string, number>();
  let tile = false;
  for (const m of c.missing) {
    if (m.name === cell) {
      tile = true;
      continue;
    }
    const g = m.geometry;
    const w = g.kind === 'polygon' ? shapeName(g.vertices) : g.kind;
    by.set(w, (by.get(w) ?? 0) + 1);
  }
  const parts = [...by].map(([w, n]) => `${count(n)} ${n === 1 ? w : `${w}s`}`);
  if (tile) parts.push('the tile, marked with the Tile tool');
  return parts.length > 1
    ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`
    : (parts[0] ?? '');
}

/** In drawing along, the tile is the one the step names. */
const TILE_ASK =
  'Click the corners of the tile the step names, in turn, then the first again.';

const INK_SYMMETRIC =
  'Ink or erase a bit of line together with its copies, turned round the centre (and mirrored when the pattern is), so the pattern stays even.';
const INK_RUNS =
  'Ink a whole stretch of line between two points with one click, not each little piece.';
const INK_FOR_ME =
  'Ink your board the way the tutorial inks it, to see the pattern or to start from it.';
const INK_CLEAR = 'Take all the ink off your board.';

/** Whether the screen is a phone's, where the two halves take turns. */
function usePhone(): boolean {
  const query = '(max-width: 760px)';
  const read = () =>
    typeof window.matchMedia === 'function' && window.matchMedia(query).matches;
  const [phone, setPhone] = useState(read);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const list = window.matchMedia(query);
    const onChange = () => setPhone(list.matches);
    list.addEventListener?.('change', onChange);
    return () => list.removeEventListener?.('change', onChange);
  }, []);
  return phone;
}

/**
 * Drawing along: the learner's board, with the editor's tools, on the
 * left; the tutorial's step, as the player draws it, on the right. Both
 * drawings are the same size and share one view, so a point sits in the
 * same place on both, and zooming or panning one moves the other. Next
 * and Back are always open; each step is ticked when its lines and
 * circles are on the board, whenever they were drawn.
 */
export function DrawAlong({
  model,
  address,
}: {
  model: Model;
  address: string;
}) {
  const { tutorial } = model;
  const beats = useMemo(() => beatsOf(tutorial), [tutorial]);
  const shown = useMemo(() => shownBeats(tutorial), [tutorial]);
  const shownIds = useMemo(() => shownSteps(tutorial), [tutorial]);
  const hidden = useMemo(() => hiddenBeats(tutorial), [tutorial]);
  // The tile counts only when marked as a shape.
  const shapes = useMemo(() => new Set([tutorial.pattern.cell]), [tutorial]);
  // The point names a learner reads, and where each sits.
  const readable = useMemo(
    () => readableNames(tutorial, model.scene),
    [tutorial, model.scene],
  );
  const readAt = useMemo(
    () => readableAt(model.scene, readable),
    [model.scene, readable],
  );
  // Where the learner left off, if they have been here before.
  const [saved] = useState(() => getProgress(address));
  const [index, setIndex] = useState(() =>
    Math.min(saved?.index ?? 0, shown.length),
  );
  // After the last step, the learner inks their board.
  const inking = index === shown.length;
  const beat = shown[Math.min(index, shown.length - 1)] ?? 1;
  const info = beats[beat - 1];

  // The learner's board: a draft of their own, drawn with the editor.
  const [history, setHistory] = useState<History>(() => ({
    past: [],
    now:
      saved?.board ??
      emptyDraft(`${tutorial.id}-along`, `My ${tutorial.title}`),
    future: [],
  }));
  const draft = history.now;
  const { steps } = draft;
  const checked = useMemo(() => check({ steps } as Draft), [steps]);
  const board = checked.scene;
  const edit = useCallback(
    (next: Draft) =>
      setHistory((h) => ({ past: [...h.past, h.now], now: next, future: [] })),
    [],
  );
  const undo = useCallback(
    () =>
      setHistory((h) => {
        const before = h.past.at(-1);
        return before
          ? {
              past: h.past.slice(0, -1),
              now: before,
              future: [h.now, ...h.future],
            }
          : h;
      }),
    [],
  );
  const redo = useCallback(
    () =>
      setHistory((h) => {
        const after = h.future[0];
        return after
          ? { past: [...h.past, h.now], now: after, future: h.future.slice(1) }
          : h;
      }),
    [],
  );

  // How each step stands on the board, and the learner's own extras.
  const checks = useMemo(
    () => shown.map((b) => checkStep(model.scene, board, b, undefined, shapes)),
    [shown, model.scene, board, shapes],
  );
  // A step is ticked when it is on the board; a step that only marks
  // points, once the step before it is ticked.
  const ticks = useMemo(() => {
    const out: boolean[] = [];
    checks.forEach((c, i) =>
      out.push(
        c.done && (c.needed.length > 0 || (i === 0 || out[i - 1]) === true),
      ),
    );
    return out;
  }, [checks]);
  const extras = useMemo(
    () => extrasOn(model.scene, board),
    [model.scene, board],
  );
  const here = inking ? undefined : checks[index];

  // The ink stage: the learner's own ink on their board.
  const [chosen, setChosen] = useState<ReadonlySet<string>>(
    () => new Set(saved?.inked ?? []),
  );
  // Every change is kept, so leaving and coming back loses nothing.
  const [kept, setKept] = useState(true);
  useEffect(() => {
    setKept(
      keepProgress({
        tutorial: address,
        board: draft,
        index,
        inked: [...chosen],
      }),
    );
  }, [address, draft, index, chosen]);
  const [restarting, setRestarting] = useState(false);
  const [welcome, setWelcome] = useState(
    () => (saved?.board.steps.length ?? 0) > 0,
  );
  const startAgain = () => {
    forgetProgress(address);
    setHistory({
      past: [],
      now: emptyDraft(`${tutorial.id}-along`, `My ${tutorial.title}`),
      future: [],
    });
    setChosen(new Set());
    setIndex(0);
    setRestarting(false);
    setWelcome(false);
  };
  const ink = useInkBoard(model, draft, inking, chosen, setChosen);
  const ready = ink.ready && !('reason' in ink.ready) ? ink.ready : undefined;
  const [keepFailed, setKeepFailed] = useState<string>();
  const goOn = () => {
    const kept = ink.keep();
    if ('reason' in kept) return setKeepFailed(kept.reason);
    window.location.hash = `#/mine/${kept.pattern.id}/repeat`;
  };

  // Hints grow a level with each press; a new step starts without one.
  const [hintLevel, setHintLevel] = useState(0);
  const hint = useMemo(
    () =>
      hintLevel && here && !here.done
        ? hintFor(
            tutorial,
            model.scene,
            board,
            beat,
            info?.highlight,
            here,
            hintLevel,
          )
        : undefined,
    [hintLevel, here, tutorial, model.scene, board, beat, info],
  );
  const [drawFailed, setDrawFailed] = useState<string>();
  const drawIt = () => {
    try {
      const next = drawForMe(
        tutorial,
        model.scene,
        draft,
        beat,
        `Drawn for me: ${info?.text ?? ''}`.trim(),
        shapes,
      );
      if (next) edit(next);
      setHintLevel(0);
      setDrawFailed(undefined);
    } catch (e) {
      setDrawFailed(
        `This step could not be drawn on your board (${e instanceof Error ? e.message : String(e)}).`,
      );
    }
  };

  // The tools, as in the editor.
  // No tool is chosen at first, so none looks like a suggestion.
  const [toolId, setToolId] = useState<ToolId>();
  const tool = toolId ? toolOf(toolId) : undefined;
  const [symmetry, setSymmetry] = useState<Symmetry>(0);
  const [targets, setTargets] = useState<Target[]>([]);
  const [hover, setHover] = useState<Target>();
  const [said, setSaid] = useState<string>();
  const [choices, setChoices] = useState<{
    drafts: Draft[];
    circles: Choice[];
  }>();
  const chooseTool = (id: ToolId) => {
    setToolId(id);
    setTargets([]);
    setChoices(undefined);
    setSaid(undefined);
  };
  /** Keeps a step drawn on the board, its points named as the tutorial
   * names them. */
  const keep = (next: Draft) => {
    edit(withTutorialNames(next, next.steps.length - 1, model.scene, readable));
    setChoices(undefined);
  };
  const finish = (clicks: readonly Target[]) => {
    setTargets([]);
    if (!tool) return;
    const made = makeStep(
      draft,
      tool,
      clicks,
      draft.steps.length,
      symmetry,
      board,
    );
    if (made.kind === 'refused') return setSaid(made.said);
    if (made.kind === 'choose') {
      setChoices({ drafts: [...made.drafts], circles: [...made.circles] });
      setSaid('Two circles fit. Click the one you want.');
      return;
    }
    // The editor's tile advice is not for drawing along: the step says
    // which tile to mark.
    keep(made.next);
    setSaid(undefined);
  };
  const onPick = (target: Target) => {
    setSaid(undefined);
    if (!tool) return;
    const eps = board.tol.eps;
    // Clicking the first corner again closes a polygon.
    if (
      tool.more &&
      targets.length >= tool.more.least &&
      targets[0] &&
      sameTarget(targets[0], target, eps)
    )
      return finish(targets);
    const clicks = [...targets, target];
    if (!tool.more && complete(tool, clicks.length)) return finish(clicks);
    setTargets(clicks);
  };
  const want = tool && wantAt(tool, targets.length);
  const ask = !tool
    ? 'Choose a tool above to draw with. Hold the pointer over a tool to see what it does.'
    : tool.id === 'tile'
      ? TILE_ASK
      : (tool.asks[Math.min(targets.length, tool.asks.length - 1)] ?? '');
  // The board's figures that are the step's, drawn blue.
  const currentOnBoard = useMemo(() => {
    const out = new Set<string>();
    if (inking) return out;
    for (const n of neededAt(model.scene, beat)) {
      const on = figureOn(board, n.geometry);
      if (on) out.add(on);
    }
    return out;
  }, [inking, model.scene, beat, board]);
  // The names the step to copy shows: those its text and highlight use.
  const stepNames = useMemo(() => {
    const names = namesIn(
      `${info?.heading ?? ''} ${info?.text ?? ''}`,
      model.scene,
    );
    for (const h of info?.highlight ?? []) if (readable.has(h)) names.add(h);
    return names;
  }, [info, model.scene, readable]);
  /** A board point's name as the tutorial shows it, never an engine name. */
  const labelOf = (p: PointPlace) =>
    readAt.get(placeKey(p.at)) ??
    (model.scene.elements.has(p.name) || /^P\d+$/.test(p.name) ? '' : p.name);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setTargets([]);
        setChoices(undefined);
      }
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  // One view for both halves: the step's calm frame, as the player
  // shows it; Fit shows the whole pattern.
  const frame = useMemo(
    () => (inking ? fullView(model) : growingFrame(model, beat, hidden)),
    [inking, model, beat, hidden],
  );
  const boardRef = useRef<SVGSVGElement>(null);
  const stepRef = useRef<SVGSVGElement>(null);
  const refs = useMemo(() => [boardRef, stepRef], []);
  const camera = useCamera(frame, refs, { stage: index });
  // At the ink the text row keeps the last step's height, so the board
  // stays where the learner drew it.
  const textRow = useRef<HTMLElement>(null);
  const textHeight = useRef(0);
  const toolRow = useRef<HTMLDivElement>(null);
  const toolHeight = useRef(0);
  useLayoutEffect(() => {
    if (inking) return;
    if (textRow.current)
      textHeight.current = textRow.current.getBoundingClientRect().height;
    if (toolRow.current)
      toolHeight.current = toolRow.current.getBoundingClientRect().height;
  });
  // The zoom is remembered for this board and step, so a reload keeps it.
  const viewKey = `tastir.along.view.${address}`;
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(viewKey);
      const kept = raw
        ? (JSON.parse(raw) as { index: number; view: Rect })
        : undefined;
      if (kept && kept.index === index && Number.isFinite(kept.view?.minX))
        camera.goTo(kept.view);
    } catch {
      // Fit, as on a first visit.
    }
    // Only on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        window.localStorage.setItem(
          viewKey,
          JSON.stringify({ index, view: camera.view }),
        );
      } catch {
        // Not remembered; nothing else is lost.
      }
    }, 400);
    return () => window.clearTimeout(t);
  }, [viewKey, index, camera.view]);

  const phone = usePhone();
  const [showStep, setShowStep] = useState(false);
  const go = (to: number) => {
    setIndex(Math.max(0, Math.min(shown.length, to)));
    setKeepFailed(undefined);
    setHintLevel(0);
    setDrawFailed(undefined);
    setTargets([]);
    setChoices(undefined);
  };
  const number = shownIds.indexOf(info?.step ?? 0) + 1;
  const last = index === shown.length - 1;
  const stepStatus = !here
    ? ''
    : ticks[index]
      ? here.needed.length
        ? `✓ Step ${number} is on your board.`
        : '✓ This step only marks points, and they come by themselves where lines cross.'
      : here.done
        ? 'This step only marks points: it is ticked once the step before it is on your board.'
        : here.missing.length === here.needed.length &&
            !here.missing.some((m) => m.name === tutorial.pattern.cell)
          ? 'Not on your board yet.'
          : `Still to draw: ${stillToDraw(here, tutorial.pattern.cell)}.`;
  const kindsWord = (n: number) =>
    `${count(n)} ${n === 1 ? 'kind' : 'kinds'} of piece`;
  const inkStatus = !inking
    ? ''
    : ink.ready && 'reason' in ink.ready
      ? `Your board cannot be inked yet: ${ink.ready.reason}`
      : !chosen.size
        ? 'Ink the lines the pattern keeps on your board.'
        : ink.result?.matches
          ? `✓ Your ink closes the pattern’s pieces: ${kindsWord(ink.result.types.length)}, as in the tutorial.`
          : ink.result?.types.length
            ? `Your ink closes ${kindsWord(ink.result.types.length)}; the pattern has ${kindsWord(tutorial.expect.pieces.length)}.${
                ink.missingKinds.length &&
                ink.missingKinds.length < tutorial.expect.pieces.length
                  ? ` Still missing: the ${ink.missingKinds.join(' and the ')}. Show me a hint marks where.`
                  : ''
              }`
            : 'Your ink closes no pieces yet.';

  const boardHalf = (
    <main className="stage along-plate" hidden={phone && showStep}>
      <EditorDrawing
        scene={ready?.scene ?? board}
        ink={
          ready
            ? {
                pieces: ready.pieces,
                chosen,
                ...(ink.hint
                  ? { glow: ink.hint.glow, dashed: ink.hint.dashed }
                  : {}),
              }
            : undefined
        }
        tile={ready?.cell.corners}
        targets={targets}
        hover={hover}
        candidates={choices?.circles}
        faint={extras}
        current={currentOnBoard}
        labelOf={labelOf}
        glow={hint?.glow}
        rings={inking ? ink.hint?.ring : hint?.rings}
        dashed={hint?.dashed}
        camera={camera}
        svgRef={boardRef}
        fitTo={fullView(model)}
        onHover={(at, reach) =>
          setHover(want && !choices ? snap(board, at, reach, want) : undefined)
        }
        onClick={(at: Vec, reach: number) => {
          if (inking) {
            const hit = ready && nearestPiece(ready.pieces, at, reach);
            if (hit) ink.toggle(hit);
            return;
          }
          if (choices) {
            // The circle passing nearest the click.
            const gaps = choices.circles.map((c) =>
              Math.abs(distance(at, c.centre) - c.radius),
            );
            const chosen = choices.drafts[gaps.indexOf(Math.min(...gaps))];
            if (chosen) {
              keep(chosen);
              setSaid(undefined);
            }
            return;
          }
          if (!want) return;
          const target = snap(board, at, reach, want);
          if (target) onPick(target);
          else
            setSaid(
              want === 'point'
                ? 'There is no point there. Click a crossing or a named point.'
                : `There is no ${want === 'curve' ? 'line or circle' : want} there.`,
            );
        }}
      />
    </main>
  );
  const stepHalf = (
    <main
      className="stage along-plate along-step"
      hidden={phone && !showStep}
      aria-label="The step to copy"
    >
      {inking ? (
        <Construction
          model={asPanel(model)}
          upTo={beats.length}
          view={camera.view}
          frame={frame}
          svgRef={stepRef}
          ink
          pen={false}
        />
      ) : (
        <Construction
          model={model}
          upTo={beat}
          view={camera.view}
          frame={frame}
          svgRef={stepRef}
          names={stepNames}
        />
      )}
      <button
        type="button"
        className="fit"
        onClick={() => camera.goTo(fullView(model))}
      >
        Fit
      </button>
    </main>
  );

  return (
    <div className="player along">
      <header className="topbar">
        <a className="home" href="#/">
          <span className="wordmark">Tastir</span>
          <span>All patterns</span>
        </a>
        <h1>Draw along: {tutorial.title}</h1>
        <a className="edit-link" href={`#/${address}`}>
          Watch it drawn
        </a>
      </header>
      {welcome && !restarting ? (
        <p className="along-back" role="status">
          Welcome back: your board and your step are as you left them.{' '}
          <button
            type="button"
            className="quiet"
            onClick={() => setRestarting(true)}
          >
            Start again
          </button>
        </p>
      ) : null}
      {restarting ? (
        <p className="along-back" role="alert">
          Start again with an empty board? Your drawing here is lost.{' '}
          <button type="button" className="quiet" onClick={startAgain}>
            Start again
          </button>
          <button
            type="button"
            className="quiet"
            onClick={() => setRestarting(false)}
          >
            Keep my board
          </button>
        </p>
      ) : null}
      {kept ? null : (
        <p className="along-back refused" role="alert">
          This browser will not keep your board (private window or storage
          full), so it is lost if you leave.
        </p>
      )}
      <nav className="along-steps" aria-label="Steps">
        <span className="along-steps-label">Steps</span>
        <ol>
          {shown.map((b, i) => {
            const done = ticks[i] ?? false;
            return (
              <li key={b}>
                <button
                  type="button"
                  className={[
                    'along-dot',
                    i === index ? 'on' : '',
                    done ? 'done' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-current={i === index ? 'step' : undefined}
                  aria-label={`Step ${i + 1}${done ? ', on your board' : ''}`}
                  title={done ? 'On your board' : 'Not on your board yet'}
                  onClick={() => go(i)}
                >
                  {i + 1}
                  {done ? <span aria-hidden="true"> ✓</span> : null}
                </button>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              className={[
                'along-dot',
                inking ? 'on' : '',
                ink.result?.matches ? 'done' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-current={inking ? 'step' : undefined}
              aria-label="Ink"
              onClick={() => go(shown.length)}
            >
              Ink
            </button>
          </li>
        </ol>
        {phone ? (
          <button
            type="button"
            className="secondary along-swap"
            onClick={() => setShowStep(!showStep)}
          >
            {showStep ? 'Show my drawing' : 'Show the step'}
          </button>
        ) : null}
      </nav>
      <div className="along-grid">
        <section
          className="along-text-row"
          aria-label="The step to copy"
          ref={textRow}
          style={
            inking && textHeight.current && !phone
              ? { minHeight: textHeight.current }
              : undefined
          }
        >
          <div className="along-text">
            <h2>
              {inking
                ? 'Ink'
                : `Step ${number} of ${shownIds.length}: the step to copy`}
            </h2>
            <p className="instruction">
              {inking ? tutorial.ink.text : info?.text}
            </p>
            <p
              className={
                (inking ? ink.result?.matches : ticks[index])
                  ? 'along-check done'
                  : 'along-check'
              }
              role="status"
            >
              {inking ? (keepFailed ?? inkStatus) : stepStatus}
            </p>
          </div>
          <nav className="along-nav" aria-label="Step">
            <button
              type="button"
              className="secondary"
              onClick={() => go(index - 1)}
              disabled={index === 0}
            >
              Back
            </button>
            {inking ? (
              <button
                type="button"
                className="next"
                disabled={!ink.result?.matches}
                onClick={goOn}
              >
                Repeat and color it
              </button>
            ) : (
              <button
                type="button"
                className="next"
                onClick={() => go(index + 1)}
              >
                {last ? 'Ink it' : 'Next'}
              </button>
            )}
          </nav>
        </section>
        <div
          className="along-tools"
          hidden={phone && showStep}
          ref={toolRow}
          style={
            inking && toolHeight.current && !phone
              ? { minHeight: toolHeight.current }
              : undefined
          }
        >
          {inking ? (
            <div className="editor-tools" role="toolbar" aria-label="Ink">
              <label className="tool" title={INK_SYMMETRIC}>
                <input
                  type="checkbox"
                  checked={ink.symmetric}
                  aria-description={INK_SYMMETRIC}
                  onChange={(e) => ink.setSymmetric(e.target.checked)}
                />
                Keep it symmetric
              </label>
              <label className="tool" title={INK_RUNS}>
                <input
                  type="checkbox"
                  checked={ink.wholeRuns}
                  aria-description={INK_RUNS}
                  onChange={(e) => ink.setWholeRuns(e.target.checked)}
                />
                Whole lines between points
              </label>
              <button
                type="button"
                className="tool"
                title={INK_FOR_ME}
                aria-description={INK_FOR_ME}
                onClick={ink.inkForMe}
              >
                Ink it for me
              </button>
              <button
                type="button"
                className="tool"
                title={INK_CLEAR}
                aria-description={INK_CLEAR}
                disabled={!chosen.size}
                onClick={() => setChosen(new Set())}
              >
                Clear the ink
              </button>
            </div>
          ) : (
            <ToolBar
              tool={toolId}
              onTool={chooseTool}
              symmetry={symmetry}
              onSymmetry={setSymmetry}
              canUndo={history.past.length > 0}
              canRedo={history.future.length > 0}
              onUndo={undo}
              onRedo={redo}
              hinted={hint?.tool}
            />
          )}
        </div>
        {/* Always there, at ink too, so the drawings keep their place. */}
        <div className="along-hints">
          {inking ? (
            <>
              <button
                type="button"
                className="secondary"
                onClick={() => ink.setHintLevel(Math.min(3, ink.hintLevel + 1))}
              >
                {ink.hintLevel ? 'Show me more' : 'Show me a hint'}
              </button>
              <span className="along-hint-words" aria-live="polite">
                {ink.hint?.words ?? ''}
              </span>
            </>
          ) : (
            <>
              <button
                type="button"
                className="secondary"
                disabled={!here || here.done || hintLevel >= 3}
                onClick={() => setHintLevel(hintLevel + 1)}
              >
                {hintLevel ? 'Show me more' : 'Show me a hint'}
              </button>
              <button
                type="button"
                className="secondary"
                disabled={!here || here.done}
                onClick={drawIt}
              >
                Draw it for me
              </button>
              <span className="along-hint-words" aria-live="polite">
                {drawFailed ?? hint?.words ?? ''}
              </span>
            </>
          )}
        </div>
        {boardHalf}
        {stepHalf}
        <footer
          className="caption along-board-caption"
          hidden={phone && showStep}
        >
          <h2>Your drawing</h2>
          {inking ? (
            <p className="instruction" aria-live="polite">
              <b>Ink:</b>{' '}
              {ink.symmetric
                ? ink.mirror
                  ? 'Click a bit of line in the dotted tile to ink or erase it, with its turned and mirrored copies.'
                  : 'Click a bit of line in the dotted tile to ink or erase it, with its turned copies only: this pattern turns, but is not its own mirror image.'
                : 'Click a bit of line in the dotted tile to ink or erase it.'}
            </p>
          ) : (
            <>
              <p className="instruction" aria-live="polite">
                {tool ? <b>{tool.label}: </b> : null}
                {said ?? ask}
                {!said &&
                tool &&
                symmetry &&
                tool.id !== 'tile' &&
                tool.id !== 'point'
                  ? ` What you draw is turned round the centre, ${symmetry} times.`
                  : ''}
              </p>
              {/* Always there, so the drawing never moves when it shows. */}
              <div
                className="ink-tools"
                style={{ visibility: targets.length ? 'visible' : 'hidden' }}
              >
                {tool?.more ? (
                  <button
                    type="button"
                    disabled={!complete(tool, targets.length)}
                    onClick={() => finish(targets)}
                  >
                    Done
                  </button>
                ) : null}
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setTargets([])}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </footer>
        <footer className="caption along-step-caption" hidden={phone}>
          {inking ? (
            <p className="dot-key">
              The pattern, inked as the tutorial inks it.
            </p>
          ) : (
            <p className="dot-key">
              <span className="new">blue: what this step makes</span>
              <span className="used">saffron: what it works from</span>
            </p>
          )}
        </footer>
      </div>
    </div>
  );
}
