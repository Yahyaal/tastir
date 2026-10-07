import type { Scene, Vec } from '@tastir/engine';
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
import { getPattern, savePattern, type UserPattern } from './patterns';
import {
  buildStep,
  complete,
  sameTarget,
  snap,
  TOOLS,
  toolOf,
  wantAt,
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
  const checked = useMemo(() => check(draft), [draft]);
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

  /** Adds the step the clicks make, unless the engine cannot do it. */
  const finish = (clicks: readonly Target[]) => {
    setTargets([]);
    const sides =
      tool.id === 'touch' ? [undefined, 'near', 'far'] : [undefined];
    let reason = '';
    for (const side of sides) {
      const made = buildStep(draft, tool, clicks, side as 'near' | 'far');
      if (!Object.keys(made.create).length) {
        setSaid('That point is already marked.');
        return;
      }
      const next = addStep(draft, made);
      const id = next.steps.length;
      const st = check(next).status.get(id);
      if (st?.ok) {
        edit(next);
        setSelected(id);
        setSaid(undefined);
        return;
      }
      reason ||= st && !st.ok ? st.reason : '';
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
      if (e.key === 'Escape') setTargets([]);
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

  const want = wantAt(tool, targets.length);
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
              , up to step {pattern.basedOn.step}.
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
                      <span className="t">{firstSentence(s.text)}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="hint">
              Only the centre O and the point A so far. Pick a tool and click on
              the drawing.
            </p>
          )}
          {broken ? (
            <p className="broken-count">
              {broken === 1 ? 'One step is' : `${broken} steps are`} broken.
            </p>
          ) : null}
        </nav>
        <section className="plate-area">
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
          <main className="stage">
            <Drawing
              scene={checked.scene}
              selected={selected}
              targets={targets}
              hover={hover}
              onHover={(at, reach) =>
                setHover(
                  want ? snap(checked.scene, at, reach, want) : undefined,
                )
              }
              onClick={(at, reach) => {
                if (!want) return;
                const target = snap(checked.scene, at, reach, want);
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
              <b>{tool.label}:</b> {said ?? ask}
            </p>
            {targets.length ? (
              <div className="ink-tools">
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
            ) : null}
          </footer>
        </section>
        <aside className="side-panel" aria-label="This step">
          {step ? (
            <StepPanel
              key={step.id}
              draft={draft}
              id={step.id}
              text={step.text}
              create={step.create ?? step.parts}
              status={status}
              last={draft.steps.length}
              dependents={dependents(checked, step.id)}
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
  onText: (text: string) => void;
  onMove: (to: number) => void;
  onDelete: (withDependents: boolean) => void;
}) {
  const [asking, setAsking] = useState(false);
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
            <button type="button" onClick={() => onDelete(true)}>
              Delete {built.length === 1 ? 'both' : `all ${built.length + 1}`}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => onDelete(false)}
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
      <section>
        <h2>What is saved</h2>
        <code className="step-json">{JSON.stringify(create, null, 2)}</code>
      </section>
    </>
  );
}

type Box = { x: number; y: number; w: number; h: number };

/** A frame that holds every point and circle drawn, with room round it. */
function viewOf(scene: Scene): Box {
  let minX = -1.4;
  let maxX = 1.4;
  let minY = -1.4;
  let maxY = 1.4;
  const take = (p: Vec, r = 0) => {
    minX = Math.min(minX, p.x - r);
    maxX = Math.max(maxX, p.x + r);
    minY = Math.min(minY, p.y - r);
    maxY = Math.max(maxY, p.y + r);
  };
  for (const el of scene.elements.values()) {
    const g = el.geometry;
    if (g.kind === 'point') take(g.at);
    else if (g.kind === 'circle') take(g.circle.centre, g.circle.radius);
    else if (g.kind === 'polygon') g.vertices.forEach((v) => take(v));
  }
  const pad = 0.08 * Math.max(maxX - minX, maxY - minY);
  return {
    x: minX - pad,
    y: minY - pad,
    w: maxX - minX + 2 * pad,
    h: maxY - minY + 2 * pad,
  };
}

/** How near a click must be to take something, in screen pixels. */
const REACH_PX = 12;

/**
 * The construction so far, with what the tool has taken in saffron and
 * what a click would take ringed. Clicks become drawing coordinates.
 */
function Drawing({
  scene,
  selected,
  targets,
  hover,
  onHover,
  onClick,
}: {
  scene: Scene;
  selected?: number;
  targets: readonly Target[];
  hover?: Target;
  onHover: (at: Vec, reach: number) => void;
  onClick: (at: Vec, reach: number) => void;
}) {
  const view = useMemo(() => viewOf(scene), [scene]);
  const svgRef = useRef<SVGSVGElement>(null);
  // Screen to drawing: the SVG keeps its aspect (meet), centred.
  const toFrame = (clientX: number, clientY: number) => {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r || !r.width || !r.height) return undefined;
    const s = Math.min(r.width / view.w, r.height / view.h);
    const ox = (r.width - view.w * s) / 2;
    const oy = (r.height - view.h * s) / 2;
    return {
      at: {
        x: view.x + (clientX - r.left - ox) / s,
        y: view.y + view.h - (clientY - r.top - oy) / s,
      },
      reach: REACH_PX / s,
    };
  };
  const unit = view.w / 400;
  const far = 4 * Math.max(view.w, view.h);
  const named = (t: Target) =>
    t.kind === 'element' ? t.name : (t.name ?? undefined);
  const taken = new Set(targets.map(named).filter(Boolean));
  const shapes: React.ReactNode[] = [];
  const labels: React.ReactNode[] = [];
  for (const el of scene.elements.values()) {
    const g = el.geometry;
    const cls = [
      'el',
      el.step === selected ? 'current' : '',
      taken.has(el.name) || (hover && named(hover) === el.name) ? 'taken' : '',
    ]
      .filter(Boolean)
      .join(' ');
    if (g.kind === 'circle')
      shapes.push(
        <circle
          key={el.name}
          className={cls}
          cx={g.circle.centre.x}
          cy={g.circle.centre.y}
          r={g.circle.radius}
        />,
      );
    else if (g.kind === 'line') {
      const { point: p, dir: d } = g.line;
      shapes.push(
        <line
          key={el.name}
          className={cls}
          x1={p.x - d.x * far}
          y1={p.y - d.y * far}
          x2={p.x + d.x * far}
          y2={p.y + d.y * far}
        />,
      );
    } else if (g.kind === 'polygon')
      shapes.push(
        <polygon
          key={el.name}
          className={cls}
          points={g.vertices.map((v) => `${v.x},${v.y}`).join(' ')}
        />,
      );
    else if (g.kind === 'point') {
      shapes.push(
        <circle
          key={el.name}
          className={`dot ${cls}`}
          cx={g.at.x}
          cy={g.at.y}
          r={unit * 3}
        />,
      );
      if (!el.name.includes('@') && !el.name.includes('.'))
        labels.push(
          <text
            key={el.name}
            className="point-name"
            x={g.at.x + unit * 5}
            y={-(g.at.y + unit * 5)}
            fontSize={unit * 11}
          >
            {el.name}
          </text>,
        );
    }
  }
  const ring = (t: Target, i: number | string, cls: string) =>
    t.kind === 'point' ? (
      <circle
        key={`${cls}${i}`}
        className={cls}
        cx={t.at.x}
        cy={t.at.y}
        r={unit * 7}
      />
    ) : null;
  return (
    <svg
      ref={svgRef}
      className="drawing editor-drawing"
      viewBox={`${view.x} ${-(view.y + view.h)} ${view.w} ${view.h}`}
      role="img"
      aria-label="The construction so far"
      onPointerMove={(e) => {
        const f = toFrame(e.clientX, e.clientY);
        if (f) onHover(f.at, f.reach);
      }}
      onPointerLeave={() => onHover({ x: Infinity, y: Infinity }, 0)}
      onClick={(e) => {
        const f = toFrame(e.clientX, e.clientY);
        if (f) onClick(f.at, f.reach);
      }}
    >
      <g transform="scale(1,-1)" style={{ strokeWidth: unit * 1.5 }}>
        {shapes}
        {targets.map((t, i) => ring(t, i, 'target'))}
        {hover ? ring(hover, 'h', 'hover') : null}
      </g>
      <g className="labels">{labels}</g>
    </svg>
  );
}
