import { distance, type InkPiece, type Vec } from '@tastir/engine';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  addStep,
  changeStep,
  check,
  deleteSteps,
  deleteWithDependents,
  dependents,
  moveStep,
  type Draft,
  type StepStatus,
} from './document';
import { AboutPanel } from './AboutPanel';
import { EditorDrawing } from './EditorDrawing';
import {
  imagesOf,
  inkableOf,
  inkedNow,
  tileOf,
  tutorialOf,
  withInk,
  withTile,
} from './finish';
import { getPattern, savePattern, type UserPattern } from './patterns';
import {
  buildStep,
  complete,
  sameTarget,
  snap,
  TOOLS,
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
  const tool = toolOf(toolId);
  const [targets, setTargets] = useState<Target[]>([]);
  const [hover, setHover] = useState<Target>();
  const [said, setSaid] = useState<string>();
  const [selected, setSelected] = useState<number | undefined>(
    draft.steps.at(-1)?.id,
  );
  const step = draft.steps.find((s) => s.id === selected);

  const chooseTool = (id: ToolId) => {
    setToolId(id);
    setTargets([]);
    setSaid(undefined);
  };

  // New steps go at the end, or after the selected step when asked; the
  // drawing then shows, and the tools take, only what exists by then.
  const [insertAfter, setInsertAfter] = useState(false);
  const [symmetry, setSymmetry] = useState<Symmetry>(0);
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
    const sides =
      tool.id === 'touch' ? [undefined, 'near', 'far'] : [undefined];
    let reason = '';
    const works: { next: Draft; circle?: { centre: Vec; radius: number } }[] =
      [];
    for (const side of sides) {
      const made = buildStep(
        draft,
        tool,
        clicks,
        side as 'near' | 'far',
        symmetry,
      );
      if (!Object.keys(made.create).length) {
        setSaid('That point is already marked.');
        return;
      }
      let next = addStep(draft, made, at);
      const id = at + 1;
      const after = check(next);
      const st = after.status.get(id);
      if (st?.ok && tool.id === 'tile') {
        // The tile must repeat edge to edge, or there is no wall.
        next = withTile(next, Object.keys(made.create).at(-1) as string);
        const tile = tileOf(next, after.scene);
        if ('reason' in tile) {
          setSaid(`That cannot be the tile: ${tile.reason}`);
          return;
        }
      }
      if (st?.ok) {
        // One circle fits without choosing a side: that is the step.
        if (side === undefined) return keep(next);
        const g = after.scene.elements.get(
          Object.keys(made.create).at(-1) as string,
        )?.geometry;
        works.push({
          next,
          ...(g?.kind === 'circle' ? { circle: g.circle } : {}),
        });
      } else reason ||= st && !st.ok ? st.reason : '';
    }
    if (works.length === 1) return keep(works[0]?.next as Draft);
    if (works.length > 1) {
      setChoices({
        drafts: works.map((w) => w.next),
        circles: works.flatMap((w) => (w.circle ? [w.circle] : [])),
      });
      setSaid('Two circles fit. Click the one you want.');
      return;
    }
    setSaid(`That does not make a figure: ${reason}`);
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
  const [panel, setPanel] = useState<'step' | 'about'>('step');
  const [symmetric, setSymmetric] = useState(true);
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
    const ids = symmetric
      ? imagesOf(inkable, id, draft.fold, !draft.chiral)
      : [id];
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
            <div className="editor-tools" role="toolbar" aria-label="Tools">
              {TOOLS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={t.id === toolId ? 'tool on' : 'tool'}
                  aria-pressed={t.id === toolId}
                  onClick={() => chooseTool(t.id)}
                >
                  <b aria-hidden="true">{t.icon}</b>
                  {t.label}
                </button>
              ))}
              <label className="tool">
                Symmetry
                <select
                  value={symmetry}
                  onChange={(e) =>
                    setSymmetry(Number(e.target.value) as Symmetry)
                  }
                >
                  {SYMMETRIES.map((n) => (
                    <option key={n} value={n}>
                      {n ? `×${n}` : 'Off'}
                    </option>
                  ))}
                </select>
              </label>
              <span className="tool-gap" />
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
          )}
          <main className="stage">
            <EditorDrawing
              scene={scene}
              candidates={choices?.circles}
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
                  if (hit) toggle(hit);
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
                  {!cellName
                    ? 'Draw the tile first, with the Tile tool, or use a shape as the tile.'
                    : symmetric
                      ? `Click a bit of line to ink or erase it, with its ${draft.fold} turned${draft.chiral ? '' : ' and mirrored'} copies.`
                      : 'Click a bit of line to ink or erase it.'}
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
            {(['step', 'about'] as const).map((p) => (
              <button
                key={p}
                type="button"
                className={p === panel ? 'mode on' : 'mode'}
                aria-pressed={p === panel}
                onClick={() => setPanel(p)}
              >
                {p === 'step' ? 'This step' : 'About the pattern'}
              </button>
            ))}
          </div>
          {panel === 'about' ? (
            <AboutPanel draft={draft} onChange={edit} file={playable} />
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
              onTile={(name) => {
                const next = withTile(draft, name);
                const tile = tileOf(next, checked.scene);
                if ('reason' in tile) return tile.reason;
                edit(next);
                return undefined;
              }}
              onText={(text) =>
                edit(changeStep(draft, step.id, { text }), `text-${step.id}`)
              }
              onMove={(to) => {
                edit(moveStep(draft, step.id, to - 1));
                setSelected(to);
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
  onText,
  onMove,
  onDelete,
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
  /** Makes a polygon the tile; the reason when it cannot repeat. */
  onTile: (polygon: string) => string | undefined;
  onText: (text: string) => void;
  onMove: (to: number) => void;
  onDelete: (withDependents: boolean) => void;
}) {
  const [asking, setAsking] = useState(false);
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
            name === tile ? (
              <p key={name} className="step-status ok">
                ✓ {name} is the tile that repeats.
              </p>
            ) : (
              <button
                key={name}
                type="button"
                className="secondary"
                onClick={() => setNotTile(onTile(name))}
              >
                Use {name} as the tile
              </button>
            ),
          )}
          {notTile ? (
            <p className="step-status broken" role="alert">
              It cannot be the tile: {notTile}
            </p>
          ) : null}
        </section>
      ) : null}
      <section>
        <details className="saved-form">
          <summary>Show the saved form</summary>
          <code className="step-json">{JSON.stringify(create, null, 2)}</code>
        </details>
      </section>
    </>
  );
}

/** The bit of line nearest a click, within reach. */
function nearestPiece(
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
