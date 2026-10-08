import { distance, type InkPiece, type Scene, type Vec } from '@tastir/engine';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  changeStep,
  check,
  deleteSteps,
  deleteWithDependents,
  dependents,
  moveStep,
  plainReason,
  specsOf,
  pointPlaces,
  type Draft,
  type StepStatus,
} from './document';
import { useRemembered } from '../app/remembered';
import { AboutPanel } from './AboutPanel';
import { patternFile } from './files';
import {
  addBlock,
  blockFromSteps,
  blockTool,
  deleteBlock,
  insertBlock,
  listBlocks,
  STARTER_BLOCKS,
  type Block,
} from './blocks';
import { EditorDrawing } from './EditorDrawing';
import { makeStep } from './makeStep';
import { ToolBar } from './ToolBar';
import {
  foldOf,
  imagesOf,
  shapeName,
  inkableOf,
  runOf,
  isMotif,
  inTile,
  tileWarning,
  inkedNow,
  tileOf,
  tutorialOf,
  withInk,
  withTile,
} from './finish';
import { getPattern, savePattern, type UserPattern } from './patterns';
import {
  complete,
  elementNear,
  sameTarget,
  snap,
  toolOf,
  wantAt,
  SYMMETRIES,
  type Symmetry,
  type Target,
  type ToolId,
} from './tools';
import './editor.css';

/** The editor (#/edit/<id>) for a pattern kept in this browser. */
export function Editor({ id }: { id: string }) {
  const [pattern] = useState(() => getPattern(id));
  if (!pattern)
    return (
      <div className="player">
        <header className="topbar">
          <a className="home" href="#/">
            <span className="wordmark">Tastir</span>
            <span>All patterns</span>
          </a>
        </header>
        <section className="notice">
          <h1>This pattern is not here</h1>
          <p>
            There is no such pattern in this browser. Your own patterns are kept
            only in the browser they were made in.
          </p>
          <p className="notice-links">
            <a className="button secondary" href="#/">
              All patterns
            </a>
          </p>
        </section>
      </div>
    );
  return <EditorPage pattern={pattern} />;
}

/** The drafts before and after this one, for undo and redo. */
interface History {
  readonly past: readonly Draft[];
  readonly now: Draft;
  readonly future: readonly Draft[];
}

const STATUS_OK =
  'This step works: everything in it is exact and only one figure fits.';

/** How much of a step's text the step list shows. */
const firstSentence = (text: string) => {
  const end = text.indexOf('. ');
  return end > 0 ? text.slice(0, end + 1) : text;
};

function EditorPage({ pattern }: { pattern: UserPattern }) {
  const [history, setHistory] = useState<History>({
    past: [],
    now: pattern.tutorial,
    future: [],
  });
  const draft = history.now;
  // Only the steps are evaluated, so inking does not draw everything again.
  const { steps } = draft;
  const checked = useMemo(() => check({ steps } as Draft), [steps]);
  // A run of typing in one text box is one undo step.
  const merging = useRef<string | undefined>(undefined);
  const edit = useCallback((next: Draft, merge?: string) => {
    setHistory((h) =>
      merge && merging.current === merge
        ? { ...h, now: next }
        : { past: [...h.past, h.now], now: next, future: [] },
    );
    merging.current = merge;
  }, []);
  const undo = useCallback(() => {
    merging.current = undefined;
    setHistory((h) => {
      const before = h.past.at(-1);
      return before
        ? {
            past: h.past.slice(0, -1),
            now: before,
            future: [h.now, ...h.future],
          }
        : h;
    });
  }, []);
  const redo = useCallback(() => {
    merging.current = undefined;
    setHistory((h) => {
      const after = h.future[0];
      return after
        ? { past: [...h.past, h.now], now: after, future: h.future.slice(1) }
        : h;
    });
  }, []);

  // Every change is kept in this browser at once.
  const [kept, setKept] = useState(true);
  useEffect(() => {
    setKept(savePattern(pattern.id, draft) !== undefined);
  }, [pattern.id, draft]);

  const [toolId, setToolId] = useState<ToolId>('compass');
  // A building block being placed works as a tool: its inputs are clicked.
  const [block, setBlock] = useState<Block>();
  const tool = block ? blockTool(block) : toolOf(toolId);
  const [targets, setTargets] = useState<Target[]>([]);
  const [hover, setHover] = useState<Target>();
  const [said, setSaid] = useState<string>();
  const [selected, setSelected] = useState<number | undefined>(
    draft.steps.at(-1)?.id,
  );
  const step = draft.steps.find((s) => s.id === selected);

  const chooseTool = (id: ToolId) => {
    setBlock(undefined);
    setToolId(id);
    setTargets([]);
    setSaid(undefined);
  };

  // New steps go at the end, or after the selected step when asked; the
  // drawing then shows, and the tools take, only what exists by then.
  const [insertAfter, setInsertAfter] = useState(false);
  // The symmetry choice is remembered for each pattern.
  const [symmetryText, setSymmetryText] = useRemembered<string>(
    `symmetry.${pattern.id}`,
    '0',
  );
  const symmetry = (
    SYMMETRIES.includes(Number(symmetryText) as Symmetry)
      ? Number(symmetryText)
      : 0
  ) as Symmetry;
  const setSymmetry = (n: Symmetry) => setSymmetryText(String(n));
  const last = draft.steps.length;
  const at =
    insertAfter && selected !== undefined && selected < last ? selected : last;
  const scene = useMemo(
    () =>
      at === last
        ? checked.scene
        : check({ steps: steps.slice(0, at) } as Draft).scene,
    [at, last, steps, checked.scene],
  );
  // When two circles touch what was clicked, the learner chooses one.
  const [choices, setChoices] = useState<{
    drafts: Draft[];
    circles: { centre: Vec; radius: number }[];
  }>();

  /** Keeps a new step made at place `at`, selecting it. */
  const keep = (next: Draft) => {
    edit(next);
    setSelected(at + 1);
    setSaid(undefined);
    setChoices(undefined);
  };

  /** Adds the step the clicks make, unless the engine cannot do it. */
  const finish = (clicks: readonly Target[]) => {
    setTargets([]);
    if (block) {
      // All the block's steps go in as one edit, so one Undo takes them out.
      const made = insertBlock(draft, block, clicks, at);
      const next =
        made.tile && !draft.pattern?.cell
          ? withTile(made.draft, made.tile)
          : made.draft;
      const { status } = check(next);
      const count = made.steps;
      if (!count) {
        setBlock(undefined);
        setSaid('Everything this block draws is already in the drawing.');
        return;
      }
      for (let id = at + 1; id <= at + count; id++) {
        const st = status.get(id);
        if (st && !st.ok) {
          setSaid(`That block does not fit there: ${st.reason}`);
          return;
        }
      }
      edit(next);
      setSelected(at + count);
      setBlock(undefined);
      setSaid(
        `Added “${block.name}”: ${count === 1 ? 'one step' : `${count} steps`}. Each is an ordinary step you can change or delete.`,
      );
      return;
    }
    const made = makeStep(draft, tool, clicks, at, symmetry, scene);
    if (made.kind === 'refused') return setSaid(made.said);
    if (made.kind === 'choose') {
      setChoices({ drafts: [...made.drafts], circles: [...made.circles] });
      setSaid('Two circles fit. Click the one you want.');
      return;
    }
    keep(made.next);
    if (made.warn) setSaid(made.warn);
  };

  const onPick = (target: Target) => {
    setSaid(undefined);
    const eps = checked.scene.tol.eps;
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement;
      if (e.key === 'Escape') {
        setTargets([]);
        setChoices(undefined);
      }
      if (typing || !(e.ctrlKey || e.metaKey)) return;
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

  // Inking: the bits of line inside the tile that the file can name, and
  // which of them are inked now.
  const [mode, setMode] = useState<'construct' | 'ink'>('construct');
  const [panel, setPanel] = useState<'step' | 'about' | 'blocks'>('step');
  const [symmetric, setSymmetric] = useState(true);
  const [wholeRuns, setWholeRuns] = useState(true);
  const cellName = draft.pattern?.cell;
  const inkable = useMemo(
    () =>
      mode === 'ink' && cellName
        ? inkableOf(
            { steps, pattern: { cell: cellName } } as Draft,
            checked.scene,
          )
        : undefined,
    [mode, steps, cellName, checked.scene],
  );
  const chosen = useMemo(
    () =>
      inkable ? inkedNow(draft, checked.scene, inkable) : new Set<string>(),
    [inkable, draft, checked.scene],
  );
  const toggle = (id: string) => {
    if (!inkable) return;
    // A whole run between marked points, and its symmetric copies.
    const run = wholeRuns
      ? runOf(
          inkable,
          id,
          pointPlaces(checked.scene).map((p) => p.at),
          checked.scene,
        )
      : [id];
    const ids = symmetric
      ? run.flatMap((r) => imagesOf(inkable, r, draft.fold, !draft.chiral))
      : run;
    const next = new Set(chosen);
    const on = !chosen.has(id);
    for (const i of ids) {
      if (on) next.add(i);
      else next.delete(i);
    }
    edit(withInk(draft, inkable, next));
  };
  const playable = useMemo(
    () => (draft.pattern?.cell && draft.ink ? tutorialOf(draft) : undefined),
    [draft],
  );

  const want = mode === 'ink' ? undefined : wantAt(tool, targets.length);
  const ask = tool.asks[Math.min(targets.length, tool.asks.length - 1)] ?? '';
  const status =
    selected !== undefined ? checked.status.get(selected) : undefined;
  const broken = [...checked.status.values()].filter((s) => !s.ok).length;

  return (
    <div className="player editor">
      <header className="topbar">
        <a className="home" href="#/">
          <span className="wordmark">Tastir</span>
          <span>All patterns</span>
        </a>
        <label className="editor-title">
          <span className="visually-hidden">Title</span>
          <input
            type="text"
            value={draft.title}
            maxLength={80}
            onChange={(e) => edit({ ...draft, title: e.target.value }, 'title')}
          />
        </label>
        <div className="editor-play">
          {playable && 'tutorial' in playable ? (
            <a className="button play" href={`#/mine/${pattern.id}`}>
              ▶ Play
            </a>
          ) : (
            <span className="play-later">
              ▶ Play:{' '}
              {playable?.reason ??
                (draft.pattern?.cell
                  ? 'ink the pattern first.'
                  : 'draw the tile first, with the Tile tool.')}
            </span>
          )}
        </div>
        <p className={kept ? 'kept' : 'kept refused'} role="status">
          {kept
            ? 'Kept in this browser'
            : 'Not kept: this browser’s storage is blocked or full'}
        </p>
      </header>
      <div className="workspace with-panel">
        <nav className="editor-steps" aria-label="Steps">
          <h2>Steps</h2>
          {pattern.basedOn ? (
            <p className="based-on">
              Based on{' '}
              <a href={`#/${pattern.basedOn.tutorial}`}>
                {pattern.basedOn.title}
              </a>
              , up to its step {pattern.basedOn.step}.
              {draft.steps.some((st) => st.hidden)
                ? ' Steps marked hidden only name points for the ink; the player skips them, so the numbers here run higher.'
                : ''}
            </p>
          ) : null}
          {draft.steps.length ? (
            <ol>
              {draft.steps.map((s) => {
                const st = checked.status.get(s.id);
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      className={[
                        'editor-step',
                        s.id === selected ? 'on' : '',
                        st && !st.ok ? 'broken' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      aria-current={s.id === selected ? 'step' : undefined}
                      onClick={() => setSelected(s.id)}
                    >
                      <span className="n">{s.id}</span>
                      <span className="t">
                        {firstSentence(s.text)}
                        {s.hidden ? (
                          <em className="hidden-note">
                            {' '}
                            Hidden in the player.
                          </em>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="hint">
              Only the centre O and the point A so far. Start with the compass:
              click O, then A, for the first circle. Every point you click must
              already exist, as with a real compass and ruler.
            </p>
          )}
          {broken ? (
            <p className="broken-count">
              {broken === 1 ? 'One step is' : `${broken} steps are`} broken.
            </p>
          ) : null}
        </nav>
        <section className="plate-area">
          <div className="editor-modes" role="group" aria-label="Mode">
            {(['construct', 'ink'] as const).map((m) => (
              <button
                key={m}
                type="button"
                className={m === mode ? 'mode on' : 'mode'}
                aria-pressed={m === mode}
                onClick={() => {
                  setMode(m);
                  // Inking follows the symmetry the steps were drawn with.
                  const fold = foldOf(draft);
                  if (m === 'ink' && !draft.ink && fold !== draft.fold)
                    edit({ ...draft, fold });
                  setTargets([]);
                  setSaid(undefined);
                }}
              >
                {m === 'construct' ? 'Construct' : 'Ink'}
              </button>
            ))}
          </div>
          {mode === 'ink' ? (
            <div className="editor-tools" role="toolbar" aria-label="Ink">
              <label className="tool">
                <input
                  type="checkbox"
                  checked={symmetric}
                  onChange={(e) => setSymmetric(e.target.checked)}
                />
                Keep it symmetric
              </label>
              <label className="tool">
                <input
                  type="checkbox"
                  checked={wholeRuns}
                  onChange={(e) => setWholeRuns(e.target.checked)}
                />
                Whole lines between points
              </label>
              <label className="tool">
                Fold
                <select
                  value={draft.fold}
                  onChange={(e) =>
                    edit({ ...draft, fold: Number(e.target.value) })
                  }
                >
                  {[3, 4, 5, 6, 8, 10, 12, 16].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="tool"
                disabled={!draft.ink}
                onClick={() =>
                  inkable && edit(withInk(draft, inkable, new Set()))
                }
              >
                Clear the ink
              </button>
              <span className="tool-gap" />
              <button
                type="button"
                className="tool"
                onClick={undo}
                disabled={!history.past.length}
              >
                Undo
              </button>
              <button
                type="button"
                className="tool"
                onClick={redo}
                disabled={!history.future.length}
              >
                Redo
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
            >
              {selected !== undefined && selected < last ? (
                <label className="tool">
                  <input
                    type="checkbox"
                    checked={insertAfter}
                    onChange={(e) => setInsertAfter(e.target.checked)}
                  />
                  Add after step {selected}
                </label>
              ) : null}
            </ToolBar>
          )}
          <main className="stage">
            <EditorDrawing
              scene={scene}
              candidates={choices?.circles}
              tile={inkable?.cell.corners}
              selected={selected}
              targets={targets}
              hover={hover}
              ink={inkable ? { pieces: inkable.pieces, chosen } : undefined}
              onHover={(at, reach) =>
                setHover(
                  want && !choices ? snap(scene, at, reach, want) : undefined,
                )
              }
              onClick={(at, reach) => {
                if (mode === 'ink') {
                  const hit =
                    inkable && nearestPiece(inkable.pieces, at, reach);
                  if (hit) {
                    setSaid(undefined);
                    toggle(hit);
                  } else if (
                    inkable &&
                    !inTile(inkable.cell, at, scene.tol.eps) &&
                    elementNear(scene, at, reach)
                  )
                    setSaid(
                      'That line is outside the tile. Ink inside the dotted tile, or choose a bigger tile.',
                    );
                  return;
                }
                if (!want) return;
                if (choices) {
                  // The circle passing nearest the click.
                  const gaps = choices.circles.map((c) =>
                    Math.abs(distance(at, c.centre) - c.radius),
                  );
                  const i = gaps.indexOf(Math.min(...gaps));
                  const chosen = choices.drafts[i];
                  if (chosen) keep(chosen);
                  return;
                }
                const target = snap(scene, at, reach, want);
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
          <footer className="caption editor-caption">
            <p className="instruction" aria-live="polite">
              {mode === 'ink' ? (
                <>
                  <b>Ink:</b>{' '}
                  {said ??
                    (!cellName
                      ? 'Draw the tile first, with the Tile tool, or use a shape as the tile.'
                      : symmetric
                        ? `Click a bit of line to ink or erase it, with its ${draft.fold} turned${draft.chiral ? '' : ' and mirrored'} copies.`
                        : 'Click a bit of line to ink or erase it.')}
                </>
              ) : (
                <>
                  <b>{tool.label}:</b> {said ?? ask}
                  {!said &&
                  symmetry &&
                  tool.id !== 'tile' &&
                  tool.id !== 'point'
                    ? ` What you draw is turned round the centre, ${symmetry} times.`
                    : ''}
                </>
              )}
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
        </section>
        <aside className="side-panel" aria-label="This step">
          <div className="editor-modes" role="group" aria-label="Panel">
            {(['step', 'about', 'blocks'] as const).map((p) => (
              <button
                key={p}
                type="button"
                className={p === panel ? 'mode on' : 'mode'}
                aria-pressed={p === panel}
                onClick={() => setPanel(p)}
              >
                {p === 'step'
                  ? 'This step'
                  : p === 'about'
                    ? 'About the pattern'
                    : 'Building blocks'}
              </button>
            ))}
          </div>
          {panel === 'about' ? (
            <AboutPanel
              draft={draft}
              onChange={edit}
              file={playable}
              patternFile={() => patternFile({ ...pattern, tutorial: draft })}
            />
          ) : panel === 'blocks' ? (
            <BlocksPanel
              hasCircle={[...checked.scene.elements.values()].some(
                (el) => el.geometry.kind === 'circle',
              )}
              onUse={(b) => {
                setMode('construct');
                setTargets([]);
                setBlock(b);
                setSaid(undefined);
              }}
            />
          ) : step ? (
            <StepPanel
              key={step.id}
              draft={draft}
              id={step.id}
              text={step.text}
              create={step.create ?? step.parts}
              status={status}
              last={draft.steps.length}
              dependents={dependents(checked, step.id)}
              tile={cellName}
              say={(name) => shapeWords(checked.scene, step.create ?? {}, name)}
              motif={(name) => isMotif(checked.scene, name)}
              onTile={(name) => {
                const next = withTile(draft, name);
                const tile = tileOf(next, checked.scene);
                if ('reason' in tile)
                  return `It cannot be the tile: ${plainReason(tile.reason, specsOf(next))}`;
                edit(next);
                return tileWarning(checked.scene, tile.cell);
              }}
              onText={(text) =>
                edit(changeStep(draft, step.id, { text }), `text-${step.id}`)
              }
              onMove={(to) => {
                edit(moveStep(draft, step.id, to - 1));
                setSelected(to);
              }}
              onSaveBlock={(to, name) => {
                const made = blockFromSteps(
                  draft,
                  checked.scene,
                  step.id,
                  to,
                  name,
                );
                if ('reason' in made) return made.reason;
                if (!addBlock(made))
                  return 'This browser would not keep the block: its storage is blocked or full.';
                return `Saved “${made.name}”. It is under Building blocks, asking for ${
                  made.inputs.length
                    ? `${made.inputs.length} ${made.inputs.length === 1 ? 'thing' : 'things'} to click`
                    : 'nothing to click'
                }.`;
              }}
              onDelete={(withDependents) => {
                const next = withDependents
                  ? deleteWithDependents(draft, checked, step.id)
                  : deleteSteps(draft, [step.id]);
                edit(next);
                setSelected(Math.min(step.id, next.steps.length) || undefined);
              }}
            />
          ) : (
            <section>
              <h2>This step</h2>
              <p className="hint">Draw a step, or choose one on the left.</p>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

/** The selected step: its text, how it stands, and what is saved. */
function StepPanel({
  id,
  text,
  create,
  status,
  last,
  dependents: built,
  tile,
  onTile,
  say,
  motif,
  onText,
  onMove,
  onDelete,
  onSaveBlock,
}: {
  draft: Draft;
  id: number;
  text: string;
  create: unknown;
  status?: StepStatus;
  last: number;
  dependents: readonly number[];
  /** The tile's polygon, if one is chosen. */
  tile?: string;
  /** Whether a polygon is part of the motif rather than a tile. */
  motif: (name: string) => boolean;
  /** An element in plain words, to tell two shapes apart. */
  say: (name: string) => string;
  /** Makes a polygon the tile; the reason when it cannot repeat. */
  onTile: (polygon: string) => string | undefined;
  onText: (text: string) => void;
  onMove: (to: number) => void;
  onDelete: (withDependents: boolean) => void;
  /** Keeps steps from this one to `to` as a block; what happened. */
  onSaveBlock: (to: number, name: string) => string;
}) {
  const [asking, setAsking] = useState(false);
  const [blockTo, setBlockTo] = useState(id);
  const [blockName, setBlockName] = useState('');
  const [blockSaid, setBlockSaid] = useState<string>();
  const [notTile, setNotTile] = useState<string>();
  const polygons = Object.entries(
    (create ?? {}) as Record<string, Record<string, unknown>>,
  )
    .filter(([, el]) => 'polygon' in el)
    .map(([name]) => name);
  const steps = (ns: readonly number[]) =>
    ns.length === 1
      ? `step ${ns[0]}`
      : `steps ${ns.slice(0, -1).join(', ')} and ${ns.at(-1)}`;
  return (
    <>
      <section>
        <h2>Step {id}</h2>
        <label className="step-text">
          Text the learner reads
          <textarea
            value={text}
            rows={5}
            onChange={(e) => onText(e.target.value)}
          />
        </label>
        {status?.ok === false ? (
          <p className="step-status broken" role="alert">
            ✗ This step is broken. {status.reason}
          </p>
        ) : (
          <p className="step-status ok">✓ {STATUS_OK}</p>
        )}
        <p className="dot-key">
          <span className="new">orange: what this step makes</span>
          <span className="used">blue: what it works from</span>
        </p>
      </section>
      <section>
        <h2>Change it</h2>
        <div className="wall-tools">
          <button
            type="button"
            className="secondary"
            disabled={id === 1}
            onClick={() => onMove(id - 1)}
          >
            Move up
          </button>
          <button
            type="button"
            className="secondary"
            disabled={id === last}
            onClick={() => onMove(id + 1)}
          >
            Move down
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => (built.length ? setAsking(true) : onDelete(false))}
          >
            Delete
          </button>
        </div>
        {asking ? (
          <div className="delete-check" role="group" aria-label="Delete">
            <p>
              Step {id} is used by {steps(built)}, which would break without it.
            </p>
            <button
              type="button"
              onClick={() => {
                setAsking(false);
                onDelete(true);
              }}
            >
              Delete {built.length === 1 ? 'both' : `all ${built.length + 1}`}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setAsking(false);
                onDelete(false);
              }}
            >
              Only step {id}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => setAsking(false)}
            >
              Keep
            </button>
          </div>
        ) : null}
      </section>
      {polygons.length ? (
        <section>
          <h2>The tile</h2>
          {polygons.map((name) =>
            motif(name) ? (
              <p key={name} className="hint">
                This shape is part of the pattern, not a tile that holds it. For
                a star or rosette, draw a square (or hexagon) around the circle,
                touching it, and use its corners as the tile.
              </p>
            ) : name === tile ? (
              <p key={name} className="step-status ok">
                ✓{' '}
                {polygons.length > 1
                  ? `${say(name)[0]?.toUpperCase()}${say(name).slice(1)}`
                  : 'This shape'}{' '}
                is the tile that repeats.
              </p>
            ) : (
              <button
                key={name}
                type="button"
                className="secondary"
                onClick={() => setNotTile(onTile(name))}
              >
                Use {polygons.length > 1 ? say(name) : 'this shape'} as the tile
              </button>
            ),
          )}
          {notTile ? (
            <p className="step-status broken" role="alert">
              {notTile}
            </p>
          ) : null}
        </section>
      ) : null}
      <section className="save-block">
        <h2>Save as a building block</h2>
        <div className="about-row">
          <label>
            Steps {id} to
            <select
              value={blockTo}
              onChange={(e) => setBlockTo(Number(e.target.value))}
            >
              {Array.from({ length: last - id + 1 }, (_, i) => id + i).map(
                (n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ),
              )}
            </select>
          </label>
          <label>
            Block name
            <input
              type="text"
              value={blockName}
              maxLength={60}
              onChange={(e) => setBlockName(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="secondary"
            disabled={!blockName.trim()}
            onClick={() => setBlockSaid(onSaveBlock(blockTo, blockName))}
          >
            Save the block
          </button>
        </div>
        {blockSaid ? (
          <p className="hint" role="status">
            {blockSaid}
          </p>
        ) : null}
      </section>
      <section>
        <details className="saved-form">
          <summary>Show the saved form</summary>
          <code className="step-json">{JSON.stringify(create, null, 2)}</code>
        </details>
      </section>
    </>
  );
}

/**
 * A shape of a step in plain words, told apart from the step's other
 * shapes by kind and size: “the larger square”, “the hexagon”.
 */
function shapeWords(
  scene: Scene,
  create: Readonly<Record<string, unknown>>,
  name: string,
): string {
  const shapes = Object.keys(create).flatMap((n) => {
    const g = scene.elements.get(n)?.geometry;
    return g?.kind === 'polygon'
      ? [{ n, kind: shapeName(g.vertices), size: areaOf(g.vertices) }]
      : [];
  });
  const me = shapes.find((x) => x.n === name);
  if (!me) return 'this shape';
  const alike = shapes.filter((x) => x.kind === me.kind);
  if (alike.length === 1) return `the ${me.kind}`;
  const rank = alike.sort((a, b) => b.size - a.size).indexOf(me);
  const word =
    alike.length === 2
      ? ['larger', 'smaller'][rank]
      : `${['first', 'second', 'third', 'fourth'][rank] ?? 'next'} largest`;
  return `the ${word} ${me.kind}`;
}

const areaOf = (vs: readonly Vec[]) =>
  Math.abs(
    vs.reduce((s, a, i) => {
      const b = vs[(i + 1) % vs.length] as Vec;
      return s + a.x * b.y - a.y * b.x;
    }, 0) / 2,
  );

/** The bit of line nearest a click, within reach. */
export function nearestPiece(
  pieces: readonly InkPiece[],
  at: Vec,
  reach: number,
): string | undefined {
  let best: { id: string; d: number } | undefined;
  for (const p of pieces) {
    const { a, b } = p.segment;
    const d = { x: b.x - a.x, y: b.y - a.y };
    const t = Math.max(
      0,
      Math.min(
        1,
        ((at.x - a.x) * d.x + (at.y - a.y) * d.y) / (d.x * d.x + d.y * d.y),
      ),
    );
    const gap = distance(at, { x: a.x + d.x * t, y: a.y + d.y * t });
    if (gap <= reach && (!best || gap < best.d)) best = { id: p.id, d: gap };
  }
  return best?.id;
}

/** The building blocks to insert: the starter shelf and the learner's own. */
function BlocksPanel({
  hasCircle,
  onUse,
}: {
  /** Whether there is a circle to work on yet. */
  hasCircle: boolean;
  onUse: (block: Block) => void;
}) {
  const [mine, setMine] = useState(listBlocks);
  const [asking, setAsking] = useState<string>();
  const card = (b: Block, own: boolean) => (
    <li key={b.id} className="block-card">
      <button type="button" className="secondary" onClick={() => onUse(b)}>
        {b.name}
      </button>
      <span className="hint">{b.text}</span>
      {own ? (
        asking === b.id ? (
          <span className="block-delete">
            Delete this block?{' '}
            <button
              type="button"
              className="quiet"
              onClick={() => {
                deleteBlock(b.id);
                setMine(listBlocks());
                setAsking(undefined);
              }}
            >
              Delete
            </button>
            <button
              type="button"
              className="quiet"
              onClick={() => setAsking(undefined)}
            >
              Keep
            </button>
          </span>
        ) : (
          <button
            type="button"
            className="quiet"
            onClick={() => setAsking(b.id)}
          >
            Delete {b.name}
          </button>
        )
      ) : null}
    </li>
  );
  return (
    <>
      <section className="blocks">
        <h2>Building blocks</h2>
        <p className="hint">
          A few steps at once. Choose one, then click what it asks for; its
          steps are added as ordinary steps, using what is already drawn.
        </p>
        {hasCircle ? null : (
          <p className="hint lost">
            These blocks work on a circle: draw one with the Compass first
            (click O, then A).
          </p>
        )}
        <ul>{STARTER_BLOCKS.map((b) => card(b, false))}</ul>
      </section>
      {mine.length ? (
        <section className="blocks">
          <h2>My blocks</h2>
          <ul>{mine.map((b) => card(b, true))}</ul>
        </section>
      ) : null}
    </>
  );
}
