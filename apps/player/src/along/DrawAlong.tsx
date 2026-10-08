import {
  checkStep,
  distance,
  extrasOn,
  type StepCheck,
  type Vec,
} from '@tastir/engine';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fullView, growingFrame } from '../app/camera';
import { Construction } from '../app/drawing';
import {
  beatsOf,
  hiddenBeats,
  shownBeats,
  shownSteps,
  type Model,
} from '../app/model';
import { useCamera } from '../app/useCamera';
import { PROGRESS_TEXT, useModel } from '../app/workerClient';
import { check, emptyDraft, type Draft } from '../editor/document';
import { EditorDrawing } from '../editor/EditorDrawing';
import { makeStep, type Choice } from '../editor/makeStep';
import { ToolBar } from '../editor/ToolBar';
import {
  complete,
  sameTarget,
  snap,
  toolOf,
  wantAt,
  type Symmetry,
  type Target,
  type ToolId,
} from '../editor/tools';
import { withTutorialNames } from './naming';
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
const KIND_WORDS = { line: 'line', circle: 'circle', polygon: 'shape' };

/** What a step still needs, in words: “one line and two circles”. */
function stillToDraw(c: StepCheck): string {
  const by = new Map<string, number>();
  for (const m of c.missing) {
    const w = KIND_WORDS[m.geometry.kind];
    by.set(w, (by.get(w) ?? 0) + 1);
  }
  const parts = [...by].map(([w, n]) => `${count(n)} ${n === 1 ? w : `${w}s`}`);
  return parts.length > 1
    ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`
    : (parts[0] ?? '');
}

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
  const [index, setIndex] = useState(0);
  const beat = shown[index] ?? 1;
  const info = beats[beat - 1];

  // The learner's board: a draft of their own, drawn with the editor.
  const [history, setHistory] = useState<History>(() => ({
    past: [],
    now: emptyDraft(`${tutorial.id}-along`, `My ${tutorial.title}`),
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
    () => shown.map((b) => checkStep(model.scene, board, b)),
    [shown, model.scene, board],
  );
  const extras = useMemo(
    () => extrasOn(model.scene, board),
    [model.scene, board],
  );
  const here = checks[index];

  // The tools, as in the editor.
  const [toolId, setToolId] = useState<ToolId>('compass');
  const tool = toolOf(toolId);
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
    edit(withTutorialNames(next, next.steps.length - 1, model.scene));
    setChoices(undefined);
  };
  const finish = (clicks: readonly Target[]) => {
    setTargets([]);
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
    keep(made.next);
    setSaid(made.warn);
  };
  const onPick = (target: Target) => {
    setSaid(undefined);
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
  const want = wantAt(tool, targets.length);
  const ask = tool.asks[Math.min(targets.length, tool.asks.length - 1)] ?? '';

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
    () => growingFrame(model, beat, hidden),
    [model, beat, hidden],
  );
  const boardRef = useRef<SVGSVGElement>(null);
  const stepRef = useRef<SVGSVGElement>(null);
  const refs = useMemo(() => [boardRef, stepRef], []);
  const camera = useCamera(frame, refs, { stage: index });

  const phone = usePhone();
  const [showStep, setShowStep] = useState(false);
  const go = (to: number) => {
    setIndex(Math.max(0, Math.min(shown.length - 1, to)));
    setTargets([]);
    setChoices(undefined);
  };
  const number = shownIds.indexOf(info?.step ?? 0) + 1;
  const last = index === shown.length - 1;

  const boardHalf = (
    <main className="stage along-plate" hidden={phone && showStep}>
      <EditorDrawing
        scene={board}
        targets={targets}
        hover={hover}
        candidates={choices?.circles}
        faint={extras}
        camera={camera}
        svgRef={boardRef}
        fitTo={fullView(model)}
        onHover={(at, reach) =>
          setHover(want && !choices ? snap(board, at, reach, want) : undefined)
        }
        onClick={(at: Vec, reach: number) => {
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
      <Construction
        model={model}
        upTo={beat}
        view={camera.view}
        frame={frame}
        svgRef={stepRef}
        showNames
      />
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
      <nav className="along-steps" aria-label="Steps">
        <span className="along-steps-label">Steps</span>
        <ol>
          {shown.map((b, i) => {
            const done = checks[i]?.done ?? false;
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
        <div className="along-tools" hidden={phone && showStep}>
          <ToolBar
            tool={toolId}
            onTool={chooseTool}
            symmetry={symmetry}
            onSymmetry={setSymmetry}
            canUndo={history.past.length > 0}
            canRedo={history.future.length > 0}
            onUndo={undo}
            onRedo={redo}
          />
        </div>
        <div className="along-head" hidden={phone}>
          <p className="label">
            Step {number} of {shownIds.length}
          </p>
        </div>
        {boardHalf}
        {stepHalf}
        <footer
          className="caption along-board-caption"
          hidden={phone && showStep}
        >
          <h2>Your drawing</h2>
          <p className="instruction" aria-live="polite">
            <b>{tool.label}:</b> {said ?? ask}
            {!said && symmetry && tool.id !== 'tile' && tool.id !== 'point'
              ? ` What you draw is turned round the centre, ${symmetry} times.`
              : ''}
          </p>
          {/* Always there, so the drawing never moves when it shows. */}
          <div
            className="ink-tools"
            style={{ visibility: targets.length ? 'visible' : 'hidden' }}
          >
            {tool.more ? (
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
        </footer>
        <footer className="caption along-step-caption">
          <div className="along-text">
            <h2>
              {phone ? `Step ${number} of ${shownIds.length}: ` : ''}The step to
              copy
            </h2>
            <p
              className={here?.done ? 'along-check done' : 'along-check'}
              role="status"
            >
              {!here
                ? ''
                : here.done
                  ? here.needed.length
                    ? `✓ Step ${number} is on your board.${last ? '' : ' Next moves both halves on.'}`
                    : `✓ This step only marks points, and points come by themselves where lines cross.`
                  : here.missing.length === here.needed.length
                    ? 'Not on your board yet.'
                    : `Still to draw: ${stillToDraw(here)}.`}
            </p>
            <p className="instruction">{info?.text}</p>
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
            <button
              type="button"
              className="next"
              onClick={() => go(index + 1)}
              disabled={last}
            >
              Next
            </button>
          </nav>
        </footer>
      </div>
    </div>
  );
}
