import { pointOf, type Scene } from '@tastir/engine';
import { useEffect, useState, type ReactNode } from 'react';
import { LIBRARY } from '../app/library';
import { loadModel, type Model } from '../app/model';
import './review.css';
import './plan.css';

/**
 * The plan for letting people make their own patterns (#/plan), with its
 * questions for the owner. Every drawing on it is computed by the engine
 * from a real tutorial, so the pictures show what the editor would show.
 */

const models = new Map<string, Model>();
function model(id: string): Model {
  let m = models.get(id);
  if (!m) {
    const entry = LIBRARY.find((e) => e.id === id);
    if (!entry) throw new Error(`no tutorial ${id}`);
    m = loadModel(entry.json);
    models.set(id, m);
  }
  return m;
}

type Box = readonly [number, number, number, number];

/** The construction up to a step, the newest step in blue. */
function Construction({
  scene,
  upTo,
  box = [-1.5, -1.5, 3, 3],
  marks = false,
  children,
}: {
  scene: Scene;
  upTo: number;
  box?: Box;
  marks?: boolean;
  children?: ReactNode;
}) {
  const far = 20;
  const shapes: ReactNode[] = [];
  for (const el of scene.elements.values()) {
    if (el.step > upTo || el.step === 0) continue;
    const cls = el.step === upTo ? 'new' : 'old';
    const g = el.geometry;
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
    else if (g.kind === 'point' && marks)
      shapes.push(
        <circle
          key={el.name}
          className={`dot ${cls}`}
          cx={g.at.x}
          cy={g.at.y}
          r={0.035}
        />,
      );
  }
  const [x, y, w, h] = box;
  return (
    <svg
      className="plan-draw"
      viewBox={`${x} ${-(y + h)} ${w} ${h}`}
      role="img"
      aria-hidden="true"
    >
      <g transform="scale(1,-1)">
        {shapes}
        {children}
      </g>
    </svg>
  );
}

const FILLS = [
  'var(--lapis)',
  'var(--saffron)',
  'var(--malachite)',
  '#b5523b',
  '#f4f1e8',
  '#6f7fb8',
  '#2a2e35',
  '#d9c38a',
];

/** The finished wall of a tutorial, a few tiles round the centre. */
function Wall({ id, shift = 0 }: { id: string; shift?: number }) {
  const { pattern } = model(id);
  const { cell } = pattern;
  const xs = cell.corners.map((c) => c.x);
  const ys = cell.corners.map((c) => c.y);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const half = Math.max(Math.max(...xs) - cx, Math.max(...ys) - cy) * 1.5;
  const pieces: ReactNode[] = [];
  for (let i = -2; i <= 2; i++)
    for (let j = -2; j <= 2; j++) {
      const dx = cell.u.x * i + cell.v.x * j;
      const dy = cell.u.y * i + cell.v.y * j;
      pattern.pieces.forEach((p, k) =>
        pieces.push(
          <polygon
            key={`${i},${j},${k}`}
            fill={FILLS[(p.type + shift) % FILLS.length]}
            points={p.polygon.map((v) => `${v.x + dx},${v.y + dy}`).join(' ')}
          />,
        ),
      );
    }
  return (
    <svg
      className="plan-draw wall"
      viewBox={`${cx - half} ${-(cy + half)} ${2 * half} ${2 * half}`}
      role="img"
      aria-hidden="true"
    >
      <g transform="scale(1,-1)">{pieces}</g>
    </svg>
  );
}

/** Steps whose elements are built from elements of each earlier step. */
function stepDeps(scene: Scene): Map<number, Set<number>> {
  const deps = new Map<number, Set<number>>();
  for (const el of scene.elements.values()) {
    if (el.step === 0) continue;
    const set = deps.get(el.step) ?? new Set<number>();
    for (const d of el.deps) {
      const from = scene.elements.get(d)?.step ?? 0;
      if (from > 0 && from !== el.step) set.add(from);
    }
    deps.set(el.step, set);
  }
  return deps;
}

/** The steps that change when step `edited` changes. */
function downstream(deps: Map<number, Set<number>>, edited: number) {
  const hit = new Set([edited]);
  for (const [step, from] of [...deps].sort((a, b) => a[0] - b[0]))
    if ([...from].some((f) => hit.has(f))) hit.add(step);
  hit.delete(edited);
  return hit;
}

function DependencyFigure() {
  const { scene } = model('eight-fold-zellige');
  const deps = stepDeps(scene);
  const steps = [...deps.keys()].sort((a, b) => a - b);
  const edited = 5;
  const hit = downstream(deps, edited);
  const gap = 60;
  const x = (s: number) => 30 + (s - 1) * gap;
  const base = 120;
  return (
    <svg
      className="plan-diagram"
      viewBox={`0 0 ${x(steps.length) + 30} 160`}
      role="img"
      aria-label="Which steps of the eight-fold rosette depend on which"
    >
      {steps.flatMap((s) =>
        [...(deps.get(s) ?? [])].map((f) => {
          const r = (x(s) - x(f)) / 2;
          const lit = (f === edited || hit.has(f)) && hit.has(s);
          return (
            <path
              key={`${f}-${s}`}
              className={lit ? 'arc lit' : 'arc'}
              d={`M ${x(f)} ${base - 14} A ${r} ${Math.min(r, 90)} 0 0 1 ${x(s)} ${base - 14}`}
            />
          );
        }),
      )}
      {steps.map((s) => (
        <g key={s}>
          <circle
            className={
              s === edited ? 'node edited' : hit.has(s) ? 'node hit' : 'node'
            }
            cx={x(s)}
            cy={base}
            r={14}
          />
          <text x={x(s)} y={base + 5} textAnchor="middle">
            {s}
          </text>
        </g>
      ))}
    </svg>
  );
}

function PickFigure() {
  const { scene } = model('eight-fold-star-and-cross');
  const E = pointOf(scene, 'E');
  const W = pointOf(scene, 'W');
  return (
    <Construction scene={scene} upTo={2} box={[-1.45, -1.25, 2.9, 2.5]}>
      <circle className="candidate" cx={W.x} cy={W.y} r={0.07} />
      <circle className="candidate chosen" cx={E.x} cy={E.y} r={0.09} />
      <path
        className="cursor"
        d={`M ${E.x + 0.05} ${E.y - 0.05} l 0 -0.32 l 0.08 0.08 l 0.1 -0.14 l 0.06 0.04 l -0.1 0.14 l 0.12 0.02 z`}
      />
    </Construction>
  );
}

/** Steps 1–3 kept, then two steps of the learner's own. */
function CopyFigure() {
  const { scene } = model('eight-fold-star-and-cross');
  const ring = ['E', 'NE', 'N', 'NW', 'W', 'SW', 'S', 'SE'].map((n) =>
    pointOf(scene, n),
  );
  const pts = (order: number[]) =>
    order
      .map((i) => ring[i % 8])
      .map((p) => `${p?.x},${p?.y}`)
      .join(' ');
  const box: Box = [-1.3, -1.3, 2.6, 2.6];
  const thumb = (label: string, cls: string, body: ReactNode) => (
    <figure className={`plan-thumb ${cls}`} key={label}>
      {body}
      <figcaption>{label}</figcaption>
    </figure>
  );
  return (
    <div className="plan-strip">
      {[1, 2, 3].map((s) =>
        thumb(
          `Step ${s}`,
          'kept',
          <Construction scene={scene} upTo={s} box={box} />,
        ),
      )}
      <div className="plan-cut">
        <span>Make my own copy from here</span>
      </div>
      {thumb(
        'Your step 4',
        'yours',
        <Construction scene={scene} upTo={3} box={box}>
          <polygon className="new" points={pts([0, 1, 2, 3, 4, 5, 6, 7])} />
        </Construction>,
      )}
      {thumb(
        'Your step 5',
        'yours',
        <Construction scene={scene} upTo={3} box={box}>
          <polygon className="old" points={pts([0, 1, 2, 3, 4, 5, 6, 7])} />
          <polygon className="new" points={pts([0, 3, 6, 9, 12, 15, 18, 21])} />
        </Construction>,
      )}
    </div>
  );
}

function BlockFigure() {
  const { scene } = model('eight-fold-star-and-cross');
  const box: Box = [-1.3, -1.3, 2.6, 2.6];
  return (
    <div className="plan-block">
      <div className="plan-block-card">
        <p className="plan-block-name">Divide a circle into eight</p>
        <p className="plan-block-in">
          You choose: <b>a centre</b> and <b>a point on the circle</b>
        </p>
        <Construction scene={scene} upTo={3} box={box} marks />
      </div>
      <div className="plan-arrow" aria-hidden="true">
        becomes
      </div>
      <div className="plan-strip">
        {[1, 2, 3].map((s) => (
          <figure className="plan-thumb kept" key={s}>
            <Construction scene={scene} upTo={s} box={box} />
            <figcaption>Step {s}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

function EditorMock() {
  const m = model('eight-fold-star-and-cross');
  const k1 = pointOf(m.scene, 'k.1');
  const steps = m.tutorial.steps.slice(0, 5);
  return (
    <div className="plan-editor" aria-label="A sketch of the editor">
      <div className="ed-steps">
        <p className="ed-title">Steps</p>
        <ol>
          {steps.map((s) => (
            <li key={s.id}>{s.text.split('.')[0]}.</li>
          ))}
          <li className="ed-new">
            Circle on the crossing of the two squares… <em>(being drawn)</em>
          </li>
        </ol>
        <p className="ed-add">+ Add a building block</p>
      </div>
      <div className="ed-canvas">
        <div className="ed-tools" role="list">
          {[
            ['◯', 'Compass'],
            ['◎', 'Same opening'],
            ['⦾', 'Touching'],
            ['╱', 'Ruler'],
            ['⊥', 'Square to'],
            ['∥', 'Parallel'],
            ['∠', 'Halve angle'],
            ['⬠', 'Polygon'],
            ['✳', 'Repeat ×8'],
            ['▢', 'Tile'],
          ].map(([icon, label], i) => (
            <span
              key={label}
              role="listitem"
              className={i === 2 ? 'tool on' : 'tool'}
              title={label}
            >
              <b>{icon}</b>
              {label}
            </span>
          ))}
        </div>
        <Construction scene={m.scene} upTo={5} box={[-1.3, -1.3, 2.6, 2.6]}>
          <circle className="ghost" cx={k1.x} cy={k1.y} r={1 - Math.SQRT1_2} />
          <circle className="candidate chosen" cx={k1.x} cy={k1.y} r={0.05} />
        </Construction>
        <p className="ed-hint">
          Touching: click the centre, then the lines the circle must touch.
        </p>
      </div>
      <div className="ed-side">
        <p className="ed-title">This step</p>
        <label>
          Text the learner reads
          <span className="ed-field">
            Put the compass on the crossing of the two squares and open it until
            it touches the horizontal and the diagonal.
          </span>
        </label>
        <label>
          What is saved
          <code className="ed-json">
            {`"r1": { "circle": {
  "centre": "k.1",
  "tangentTo": ["h", "d1"] } }`}
          </code>
        </label>
        <p className="ed-ok">✓ Exact, and only one circle fits</p>
      </div>
    </div>
  );
}

function FlowFigure() {
  const box = (
    x: number,
    y: number,
    w: number,
    title: string,
    sub: string,
    cls = '',
  ) => (
    <g className={`flow-box ${cls}`}>
      <rect x={x} y={y} width={w} height={58} rx={10} />
      <text x={x + w / 2} y={y + 25} textAnchor="middle" className="t">
        {title}
      </text>
      <text x={x + w / 2} y={y + 45} textAnchor="middle" className="s">
        {sub}
      </text>
    </g>
  );
  const arrow = (x1: number, y1: number, x2: number, y2: number) => (
    <path className="flow-arrow" d={`M ${x1} ${y1} L ${x2} ${y2}`} />
  );
  return (
    <svg
      className="plan-diagram"
      viewBox="0 0 820 250"
      role="img"
      aria-label="Three ways in lead to one editor, which writes an ordinary tutorial"
    >
      <defs>
        <marker
          id="plan-head"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path d="M0 0 L10 5 L0 10 z" className="flow-head" />
        </marker>
      </defs>
      {box(10, 10, 190, 'Start from nothing', 'a centre and one point')}
      {box(10, 96, 190, 'Building blocks', '“divide into eight”…')}
      {box(10, 182, 190, 'Copy a pattern', 'from any step')}
      {arrow(200, 39, 300, 110)}
      {arrow(200, 125, 300, 125)}
      {arrow(200, 211, 300, 140)}
      {box(305, 96, 170, 'The editor', 'click to construct', 'main')}
      {arrow(475, 125, 545, 125)}
      {box(550, 96, 120, 'A tutorial', 'the same format')}
      {arrow(670, 112, 700, 50)}
      {arrow(670, 125, 700, 125)}
      {arrow(670, 138, 700, 200)}
      {box(705, 20, 105, 'Steps', 'played back')}
      {box(705, 96, 105, 'Ink, wall', 'colour, export')}
      {box(705, 172, 105, 'Save, share', 'my designs')}
    </svg>
  );
}

/** The owner's answers of 6 October 2026, and what each one changes. */
const DECISIONS: readonly {
  question: string;
  answer: string;
  means: string;
}[] = [
  {
    question: 'Which comes first?',
    answer: 'In the order below',
    means:
      'Phase 1, “My designs”, comes first. Its detailed plan is just below and waits for your OK.',
  },
  {
    question: 'Must user patterns be ruler and compass?',
    answer: 'Yes, always',
    means:
      'The editor only lets you click points that exist. There is no free drawing anywhere.',
  },
  {
    question: 'Where are they kept?',
    answer: 'Browser, file and link first',
    means:
      'Designs live in this browser in phase 1; files and share links come in phase 5; accounts later.',
  },
  {
    question: 'Can user patterns join the library?',
    answer: 'Yes, after review',
    means:
      'Phase 5 gets a “Send to the library” button. A sent pattern comes to the review page, gets a golden test, and its maker is named in its credits.',
  },
  {
    question: 'Do we use the editor for our own tutorials?',
    answer: 'Yes',
    means:
      'From phase 2 the editor can also write the parts only library tutorials have (credits, photos, the expected pieces), so new library patterns are made in it.',
  },
];

function Decisions() {
  return (
    <section id="decisions">
      <h2 className="group">Your decisions</h2>
      <p className="group-note">
        You answered the five questions on 6 October. Here is what each answer
        changes in the plan.
      </p>
      <table className="plan-table">
        <thead>
          <tr>
            <th>Question</th>
            <th>Your answer</th>
            <th>What it changes</th>
          </tr>
        </thead>
        <tbody>
          {DECISIONS.map((d) => (
            <tr key={d.question}>
              <td>{d.question}</td>
              <td className="plan-answer">{d.answer}</td>
              <td>{d.means}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

const STORE = 'tastir-plan-answers';

function useAnswers() {
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORE) ?? '{}');
    } catch {
      return {};
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(STORE, JSON.stringify(answers));
    } catch {
      // Private windows may refuse storage; the page still works.
    }
  }, [answers]);
  return {
    answers,
    set: (key: string, value: string) =>
      setAnswers((a) => ({ ...a, [key]: value })),
  };
}

/** A small sketch of the home page shelf, with three saved designs. */
function ShelfFigure() {
  const designs = [
    { id: 'alhambra-bath-stars', name: 'My bath stars, blue', shift: 0 },
    { id: 'alhambra-barca-stars', name: 'Barca in honey', shift: 1 },
    { id: 'eight-fold-star-and-cross', name: 'Star and cross, red', shift: 3 },
  ];
  return (
    <div className="plan-shelf">
      <p className="plan-shelf-title">My designs</p>
      <div className="plan-shelf-row">
        {designs.map((d) => (
          <figure key={d.name} className="plan-shelf-card">
            <Wall id={d.id} shift={d.shift} />
            <figcaption>
              <b>{d.name}</b>
              <span>from {model(d.id).tutorial.title}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

/** Phase 1 in detail, with the owner's OK. */
function PhaseOne() {
  const { answers, set } = useAnswers();
  const [copied, setCopied] = useState(false);
  const id = 'phase1-ok';
  const answer = answers[id] ?? '';
  const copy = async () => {
    await navigator.clipboard?.writeText(
      `Phase 1 plan (My designs): ${answer.trim() || '(no answer)'}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };
  return (
    <section id="phase-1">
      <h2 className="group">Phase 1 in detail: My designs</h2>
      <p>
        Today you can re-ink a pattern and recolour it, but it is gone when you
        leave. Phase 1 keeps it. At the ink and colour stages a “Save as my
        design” button asks for a name and keeps the design in this browser. The
        home page then shows a “My designs” shelf above the library, each design
        drawn as its wall, and clicking one opens its tutorial straight at the
        wall with your inking and colours. A design you opened has “Save” to
        update it and “Save as new” to keep both, and each card can be renamed
        or deleted.
      </p>
      <figure className="plan-fig">
        <ShelfFigure />
        <figcaption>
          A sketch of the shelf. The walls are drawn by the engine; the names
          and colours are made up.
        </figcaption>
      </figure>
      <p>
        A design stores only what you changed, not a copy of the pattern: the
        tutorial it belongs to, which bits of line are inked, the palette and
        the colours you picked, and the wall style and grout. That keeps it
        small, and every piece of it already exists in the player, so the engine
        does not change. The bits of line are named by their end points, so if
        we later change a tutorial in a way that moves its lines, the design
        opens with the tutorial’s own inking and a short note saying so, rather
        than showing something broken.
      </p>
      <p>
        The work is one commit. A new file holds the saved designs and reads and
        writes them safely, because a private window can refuse storage; the
        player gets the buttons and opens a design from its address (
        <code>#/&lt;tutorial&gt;/design/&lt;name&gt;</code>); and the home page
        gets the shelf. Tests check that a design survives a reload with the
        same inking and colours, that a broken or missing store never stops the
        app, and that deleting asks first.
      </p>
      <p>
        <b>What you will check:</b> run <code>pnpm dev</code>, open the Comares
        bath stars, switch on free inking and remove a few bits of line,
        recolour two pieces, save it as “Test”, and reload. The shelf on the
        home page shows “Test”, and opening it shows your inking and colours.
      </p>
      <ol className="questions">
        <li className={answer.trim() ? 'question answered' : 'question'}>
          <p className="q-text">
            <span className="q-num">OK?</span> May I build phase 1 as described?
            I would do it before the next Alhambra panels.
          </p>
          <div className="choices">
            {['OK, go ahead', 'OK, but after the Alhambra panels'].map((c) => (
              <button
                key={c}
                type="button"
                className={answer === c ? 'chosen' : undefined}
                onClick={() => set(id, c)}
              >
                {c}
              </button>
            ))}
          </div>
          <textarea
            aria-label="Your answer about phase 1"
            placeholder="Or tell me what to change (saved in this browser)"
            value={answer}
            onChange={(e) => set(id, e.target.value)}
          />
          <p className="q-more">
            <button type="button" className="plan-copy" onClick={copy}>
              {copied ? 'Copied ✓' : 'Copy my answer'}
            </button>{' '}
            and paste it into our chat.
          </p>
        </li>
      </ol>
    </section>
  );
}

const TOOLS: readonly [string, string, string][] = [
  [
    'Compass',
    'Click a centre, then a point the circle passes through.',
    '{ centre, through }',
  ],
  [
    'Same opening',
    'Click a circle, then a new centre: the compass keeps its opening.',
    '{ centre, radiusOf }',
  ],
  [
    'Opening from two points',
    'Click two points to set the opening, then the centre.',
    '{ centre, radiusFrom }',
  ],
  [
    'Touching',
    'Click a centre, then the lines or circles the circle must touch.',
    '{ centre, tangentTo, touch }',
  ],
  ['Ruler', 'Click two points.', '{ through: [p, q] }'],
  [
    'Square to, parallel to',
    'Click a line, then a point.',
    '{ through, perpendicularTo } / { parallelTo }',
  ],
  [
    'Halve an angle',
    'Click three points, the corner in the middle.',
    '{ through, bisects }',
  ],
  ['Polygon', 'Click its corners in turn.', 'polygon'],
  [
    'Repeat',
    'Pick what you drew and turn it round the centre, or mirror it.',
    'repeat by rot8, mirror:…',
  ],
  [
    'Tile',
    'Click the corners of the tile that repeats; the editor checks it can tile.',
    'pattern.cell',
  ],
];

const PHASES: readonly {
  name: string;
  see: string;
  done: string;
  size: string;
}[] = [
  {
    name: '1. My designs',
    see: 'At the ink and colour stages of any tutorial, “Save as my design” keeps your inking and colours under a name. A “My designs” shelf on the home page opens them again.',
    done: 'Ink a different design on the Comares bath stars, colour it, reload the page, and it is still there.',
    size: 'Small',
  },
  {
    name: '2. The editor, from a copy',
    see: '“Make my own copy from here” on any step. The editor opens with the steps so far; you add, change or delete steps with the tools, and press Play to watch your pattern like any tutorial.',
    done: 'Copy the star and cross at step 3, add an octagon and a star, choose a tile, ink, colour and play it.',
    size: 'Large',
  },
  {
    name: '3. From nothing',
    see: '“New pattern” opens the editor with only the centre and one point. Symmetry mode copies every new line round the centre as you draw it.',
    done: 'Rebuild the eight-fold star and cross from nothing; the editor’s file passes the same golden test as ours.',
    size: 'Medium',
  },
  {
    name: '4. Building blocks',
    see: 'A shelf of ready constructions (divide a circle, the two squares, a ring of touching circles, a rosette) to drop in, and “Save these steps as a block” for your own.',
    done: 'Insert “Divide a circle into eight” on a circle you drew, and its three steps appear, each one undoable.',
    size: 'Medium',
  },
  {
    name: '5. Share',
    see: 'Download and open a pattern file, share a link that opens your pattern, and later an account that keeps your patterns everywhere.',
    done: 'A link sent to another browser opens the same pattern, wall and colours.',
    size: 'Small, then large',
  },
];

/** The plan page (#/plan), dev server only like the review page. */
export function Plan() {
  return (
    <div className="review plan">
      <nav className="review-top">
        <a href="#/">← Library</a>
        <span>
          <a href="#/review">Review page</a> ·{' '}
          <a href="#/notes">Project notes</a>
        </span>
      </nav>
      <header className="review-head">
        <h1>Plan: people make their own patterns</h1>
        <p className="lede">
          You asked how learners could build their own patterns, from nothing,
          from ready-made pieces, or by copying one of ours and changing it at
          any step. This page is my plan. Every drawing on it is made by our
          engine from a real tutorial, so it shows what the app would show.
        </p>
      </header>

      <Decisions />

      <PhaseOne />

      <h2 className="group">The idea in one picture</h2>
      <p>
        All three ways in lead to one editor, and the editor writes an ordinary
        tutorial file, the same format as the 34 in the library. That is the
        whole trick: because a user pattern is a tutorial, the player already
        knows how to play it step by step, ink it, repeat it into a wall, colour
        it and export it. We build the editor once and get everything else for
        free.
      </p>
      <figure className="plan-fig">
        <FlowFigure />
        <figcaption>
          Figure 1. Three ways in, one editor, one format.
        </figcaption>
      </figure>

      <h2 className="group">What we already have</h2>
      <p>
        More than it seems. Our tutorial format is already a small ruler and
        compass language: every circle and line is made from earlier ones, never
        from a typed position, so a click in an editor maps straight onto one
        line of it. The engine already checks every step and, when one is
        impossible or ambiguous, says which step and which element, which is
        exactly the message an editor must show. It also records what each
        element was built from, which tells us what breaks when a step changes
        (Figure 5).
      </p>
      <p>
        Free inking exists too: at the ink stage you can click the bits of line
        between crossings on and off and see the new wall. But it is lost when
        you leave the page, it is not saved as a design, and your colours are
        not kept either. So the first, smallest step is to keep them.
      </p>
      <div className="plan-pair">
        <figure className="plan-fig">
          <Wall id="alhambra-bath-stars" />
          <figcaption>Design A: the Comares bath stars.</figcaption>
        </figure>
        <figure className="plan-fig">
          <Wall id="alhambra-barca-stars" />
          <figcaption>
            Design B: the Sala de la Barca stars, the same construction with one
            more step.
          </figcaption>
        </figure>
      </div>
      <p>
        Designs A and B show what learners will make most often: a sibling of a
        pattern they know, from the same construction with a different inking or
        one extra step. Phases 1 and 2 below are built for exactly this.
      </p>

      <h2 className="group">How the editor works</h2>
      <p>
        The editor looks like the player you know, with a tool bar over the
        drawing and the step list on the left. You pick a tool and click on the
        drawing; the editor only lets you click points that exist (a crossing, a
        touching point, a centre), because a point placed by hand would break
        the rule that every pattern is exact. Each click sequence becomes one
        step, written for you in plain words that you can edit.
      </p>
      <figure className="plan-fig">
        <EditorMock />
        <figcaption>
          Figure 2. A sketch of the editor. The steps on the left are the real
          first five of the eight-fold star and cross; the dashed circle is the
          one being drawn with the Touching tool.
        </figcaption>
      </figure>
      <p>
        There is one tool for each way our format can make an element, so
        nothing new is needed in the engine to construct:
      </p>
      <table className="plan-table">
        <thead>
          <tr>
            <th>Tool</th>
            <th>What you do</th>
            <th>What is saved</th>
          </tr>
        </thead>
        <tbody>
          {TOOLS.map(([tool, does, saved]) => (
            <tr key={tool}>
              <td>{tool}</td>
              <td>{does}</td>
              <td>
                <code>{saved}</code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Clicking a crossing</h3>
      <p>
        This is the one hard part. Our format never says “the second crossing”,
        because the order of crossings is an accident of the computer; it says
        which one by a rule, such as “the one at 0°” or “the one nearest to N”.
        So when you click a crossing, the editor tries the simple rules in turn,
        keeps the first that picks your point and no other, and checks it by
        running the engine. You never see the rule unless you ask.
      </p>
      <div className="plan-pair">
        <figure className="plan-fig">
          <PickFigure />
          <figcaption>
            Figure 3. The circle and the horizontal meet twice. You click the
            right-hand crossing (gold); the editor saves it as the crossing at
            0°, which can never mean the other one.
          </figcaption>
        </figure>
        <code className="ed-json big">
          {`"E": { "point": {
  "meet": ["c", "h"],
  "pick": { "angle": 0 } } }`}
        </code>
      </div>

      <h3>Symmetry, tile, ink and colour</h3>
      <p>
        Patterns are symmetric, so drawing one line and having it copied round
        the centre is how people want to work. A symmetry switch (off, 4, 6, 8,
        12, 16) makes every new element a repeat in the file, which the engine
        already supports. The Tile tool asks for the corners of the repeating
        tile and checks it is a rectangle, a parallelogram or a matching
        hexagon, because only those make a wall. Inking reuses free inking, with
        one change: clicking a bit of line also inks its copies round the
        centre, so the pattern stays symmetric unless you switch that off.
        Colour is the colour stage as it is today.
      </p>
      <p>
        One piece of engine work is needed here. A saved file names its ink by
        the crossings it passes, while free inking works with bits of line, so
        the editor must turn the chosen bits back into named crossings. The
        “inking along a line” change already in the Progress list is the clean
        way to do it, so I would do that first.
      </p>

      <h2 className="group">Copy a pattern and change it at any step</h2>
      <p>
        Every step in the player gets “Make my own copy from here”. The copy
        keeps the original’s steps up to there, and its credits, so the maker of
        the original is always named. You can then carry on in your own
        direction, as below, where the first three steps of the star and cross
        become an octagon and an eight-pointed star.
      </p>
      <figure className="plan-fig">
        <CopyFigure />
        <figcaption>
          Figure 4. Steps 1 to 3 are kept from the star and cross; steps 4 and 5
          are the learner’s own.
        </figcaption>
      </figure>
      <p>
        You can also change a step in the middle. Then the later steps that were
        built on it may no longer work, for example a crossing that no longer
        exists. The engine never guesses, so the editor marks each broken step
        in red with the engine’s reason, and offers to remove the steps that
        depended on the change. It knows which those are because every element
        remembers what it was built from.
      </p>
      <figure className="plan-fig">
        <DependencyFigure />
        <figcaption>
          Figure 5. The real steps of the eight-fold rosette. An arc joins two
          steps when the later one is built on the earlier. Change step 5 (gold)
          and the steps in red are the ones to re-check; the rest are untouched.
        </figcaption>
      </figure>

      <h2 className="group">Building blocks</h2>
      <p>
        A building block is a few steps with blanks to fill in: “divide a circle
        into eight” needs a centre and a point on the circle. When you drop one
        in, it becomes ordinary steps in your file, so it plays, edits and
        undoes like anything else and the format does not change. The first
        blocks come straight from our library: dividing a circle by 4, 6, 8, 12
        and 16, the static and dynamic squares, a ring of touching circles, the
        square or hexagon tile round a circle, and A. J. Lee’s rosette, which is
        drawn with a compass. Learners can select a few of their own steps and
        save them as a block.
      </p>
      <figure className="plan-fig">
        <BlockFigure />
        <figcaption>Figure 6. One block, three ordinary steps.</figcaption>
      </figure>

      <h2 className="group">Saving and sharing</h2>
      <p>
        At first a pattern is kept in your browser, can be downloaded as a file
        and opened again, and can be shared as a link that carries the whole
        pattern in the address. Accounts come with phase 3 of the PRD, when we
        have a server. A saved pattern is a complete tutorial plus a note of
        where it was copied from, so it keeps working even when we later change
        the original. User patterns are checked by the same engine as ours; they
        get a golden test only if they join the library.
      </p>

      <h2 className="group" id="order">
        The order of the work
      </h2>
      <p>
        Each phase ends with something you can use and check by eye, and each
        one leaves the next one smaller.
      </p>
      <ol className="plan-phases">
        {PHASES.map((p) => (
          <li key={p.name}>
            <h3>
              {p.name} <span className="plan-size">{p.size}</span>
            </h3>
            <p>{p.see}</p>
            <p className="plan-done">
              <b>Done when:</b> {p.done}
            </p>
          </li>
        ))}
      </ol>

      <h2 className="group">What could go wrong</h2>
      <p>
        A crossing chosen “at 0°” could stop meaning the same point after an
        earlier step changes; the editor re-checks every rule after each change
        and asks you to click again when one no longer fits. Large drawings have
        thousands of crossings, which makes clicking fiddly, so the editor snaps
        to the nearest crossing and lets you zoom, and it does the heavy work in
        the background worker the player already uses. And a tile that cannot
        repeat would give a broken wall, which is why the Tile tool checks it
        before inking starts.
      </p>
    </div>
  );
}
