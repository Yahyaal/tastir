import {
  checkStep,
  distance,
  extrasOn,
  figureOn,
  neededAt,
  wallPieces,
  type Segment,
  hiddenHelpers,
  type StepCheck,
  type Vec,
} from '@tastir/engine';
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { fullView, growingFrame, type Rect } from '../app/camera';
import { Construction } from '../app/drawing';
import {
  asPanel,
  beatsOf,
  withHelpers,
  hiddenBeats,
  shownBeats,
  shownSteps,
  type Model,
} from '../app/model';
import { useCamera } from '../app/useCamera';
import { useRemembered } from '../app/remembered';
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
import { dotNear, reachable, type PenGraph } from './pen';
import { forgetProgress, getProgress, keepProgress } from './progress';
import { useInkBoard } from './useInkBoard';
import { RepeatBoard, TargetWall } from './RepeatBoard';
import { fillCopies, snapped, wallSegments, type Copy } from './repeat';
import { setPatternWall } from '../editor/patterns';
import { addDesign, updateDesign } from '../app/designs';
import { PiecePanel } from '../app/PiecePanel';
import {
  colorReducer,
  DEFAULT_PALETTE,
  PALETTES,
  pieceColors,
  tutorialColoring,
  type History as ColorHistory,
} from '../app/coloring';
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
  'nine',
  'ten',
];
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

const WALL_ERASE = 'Take copies away: a click on a copy removes it.';
const WALL_FILL =
  'Place copies edge to edge all over the board, as far as you can see.';
const WALL_CLEAR = 'Take every copy away, keeping your first tile.';

const INK_LIFT =
  'Lift the pen off the board, to start a new stroke somewhere else (or press Escape).';
const INK_ERASE =
  'Erase instead of ink: strokes from dot to dot take ink away. With the pen lifted, a click on an inked stretch also erases it.';
const INK_COPIES =
  'Each stroke is also inked turned round the centre (and mirrored, when the pattern is its own mirror image), so you ink one part and the rest follows.';
const INK_FOR_ME =
  'Ink your board the way the tutorial inks it, to see the pattern or to start from it.';
const INK_CLEAR = 'Take all the ink off your board.';

const penDotCache = new WeakMap<PenGraph, Vec[]>();

/** Every dot the pen can go down on (computed once per board). */
function penDotsOf(g: PenGraph): Vec[] {
  let found = penDotCache.get(g);
  if (!found) {
    found = [...g.dots.values()].map((d) => d.at);
    penDotCache.set(g, found);
  }
  return found;
}

/** Whether the pointer is a finger (a touch screen), so the words say
 * tap rather than click. */
function useCoarse(): boolean {
  const [coarse] = useState(
    () =>
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(pointer: coarse)').matches,
  );
  return coarse;
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
  model: full,
  address,
}: {
  model: Model;
  address: string;
}) {
  // Helper lines are left out unless asked for, as in the player.
  const [showHelpers, setShowHelpers] = useRemembered<boolean>(
    'showHelpers',
    false,
  );
  const model = useMemo(
    () => withHelpers(full, showHelpers),
    [full, showHelpers],
  );
  // The helper lines nothing needs (those the setting hides) are
  // optional for a tick; a helper line that finds a point something needs
  // still counts.
  const optional = useMemo(
    () => hiddenHelpers(full.scene, full.tutorial),
    [full],
  );
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
    Math.min(saved?.index ?? 0, shown.length + 2),
  );
  // After the last step, the learner inks their board.
  const inking = index === shown.length;
  // Then the learner repeats their tile into a wall, and may color it.
  const repeating = index === shown.length + 1;
  const coloring = index === shown.length + 2;
  const afterInk = repeating || coloring;
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
    () =>
      shown.map((b) =>
        checkStep(model.scene, board, b, undefined, shapes, optional),
      ),
    [shown, model.scene, board, shapes, optional],
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
  // The ink, with Undo and Redo of its own.
  const [inkHistory, setInkHistory] = useState<{
    past: readonly ReadonlySet<string>[];
    now: ReadonlySet<string>;
    future: readonly ReadonlySet<string>[];
  }>(() => ({ past: [], now: new Set(saved?.inked ?? []), future: [] }));
  const chosen = inkHistory.now;
  const setChosen = useCallback(
    (next: ReadonlySet<string>) =>
      setInkHistory((h) => ({
        past: [...h.past, h.now],
        now: next,
        future: [],
      })),
    [],
  );
  const inkUndo = useCallback(
    () =>
      setInkHistory((h) => {
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
  const inkRedo = useCallback(
    () =>
      setInkHistory((h) => {
        const after = h.future[0];
        return after
          ? { past: [...h.past, h.now], now: after, future: h.future.slice(1) }
          : h;
      }),
    [],
  );
  // The pen: the dot it is down on, if any; and whether it erases.
  const [pen, setPen] = useState<string>();
  const [erasing, setErasing] = useState(false);
  const [penSaid, setPenSaid] = useState<string>();
  // The wall the learner lays: copies of their tile, with Undo and Redo.
  const [copyHistory, setCopyHistory] = useState<{
    past: readonly (readonly Copy[])[];
    now: readonly Copy[];
    future: readonly (readonly Copy[])[];
  }>(() => ({
    past: [],
    now: (saved?.copies ?? []).map((at) => ({ at })),
    future: [],
  }));
  const copies = copyHistory.now;
  const setCopies = useCallback(
    (next: readonly Copy[]) =>
      setCopyHistory((h) => ({
        past: [...h.past, h.now],
        now: next,
        future: [],
      })),
    [],
  );
  const copyUndo = () =>
    setCopyHistory((h) => {
      const before = h.past.at(-1);
      return before
        ? {
            past: h.past.slice(0, -1),
            now: before,
            future: [h.now, ...h.future],
          }
        : h;
    });
  const copyRedo = () =>
    setCopyHistory((h) => {
      const after = h.future[0];
      return after
        ? { past: [...h.past, h.now], now: after, future: h.future.slice(1) }
        : h;
    });
  const [arrived, setArrived] = useState<{ index: number; from: Vec }>();
  const [removing, setRemoving] = useState(false);
  // Its colours, as the player's colour stage keeps them.
  const [colorHistory, colorDispatch] = useReducer(
    colorReducer,
    model,
    (m): ColorHistory => ({
      past: [],
      now: saved?.coloring ?? tutorialColoring(m),
      future: [],
    }),
  );
  const [selectedKind, setSelectedKind] = useState<number>();
  const [hoveredKind, setHoveredKind] = useState<number>();
  const [keptAs, setKeptAs] = useState<string>();
  // The pattern and design kept on an earlier visit, which a keep updates.
  const [keptIds, setKeptIds] = useState<{ pattern?: string; design?: string }>(
    () => saved?.kept ?? {},
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
        copies: copyHistory.now.map((c) => c.at),
        coloring: colorHistory.now,
        kept: keptIds,
      }),
    );
  }, [
    address,
    draft,
    index,
    chosen,
    copyHistory.now,
    colorHistory.now,
    keptIds,
  ]);
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
    setInkHistory({ past: [], now: new Set(), future: [] });
    setIndex(0);
    setRestarting(false);
    setWelcome(false);
  };
  const ink = useInkBoard(
    model,
    draft,
    index >= shown.length,
    chosen,
    setChosen,
  );
  const ready = ink.ready && !('reason' in ink.ready) ? ink.ready : undefined;
  // The learner's inked tile, as it repeats: its bits.
  const tileInk = useMemo((): Segment[] => {
    if (!ready) return [];
    return [...chosen].flatMap((id) => {
      const p = ready.graph.bits.get(id);
      return p ? [p.segment] : [];
    });
  }, [ready, chosen]);
  // At the colour stage: the pieces of the learner's own wall, each of
  // the pattern's kind it has the shape of (the ground where none).
  const colors = pieceColors(model, colorHistory.now);
  const ground =
    (PALETTES[colorHistory.now.palette] ?? PALETTES[DEFAULT_PALETTE])?.ground ??
    '#eee';
  const wall = useMemo(
    () =>
      coloring && ready
        ? wallPieces(wallSegments(tileInk, copies), model.pattern.types)
        : [],
    [coloring, ready, tileInk, copies, model.pattern.types],
  );
  const [keepFailed, setKeepFailed] = useState<string>();
  /** Keeps the drawing as one of the learner's patterns, with the wall
   * they laid and, when they coloured it, its colours. */
  const keepIt = (withColors: boolean) => {
    // A second keep updates the pattern (and design) kept before.
    const kept = ink.keep(keptIds.pattern, withColors);
    if ('reason' in kept) return setKeepFailed(kept.reason);
    const id = kept.pattern.id;
    setPatternWall(id, {
      copies: copies.map((c) => c.at),
      ...(withColors ? { coloring: colorHistory.now } : {}),
    });
    // The colours are also kept as a design of it, so it plays with them.
    let design = keptIds.design;
    if (withColors) {
      const fields = {
        coloring: colorHistory.now,
        look: 'tiles' as const,
        grout: 1,
      };
      const updated = design ? updateDesign(design, fields) : undefined;
      design =
        updated?.id ??
        addDesign({
          ...fields,
          name: kept.pattern.tutorial.title,
          tutorial: `mine/${id}`,
        })?.id;
    }
    setKeptIds({ pattern: id, ...(design ? { design } : {}) });
    setKeptAs(id);
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
        optional,
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
        setPen(undefined);
      }
      if (!(e.ctrlKey || e.metaKey)) return;
      const [u, r] = inking ? [inkUndo, inkRedo] : [undo, redo];
      if (e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) r();
        else u();
      } else if (e.key.toLowerCase() === 'y') {
        e.preventDefault();
        r();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo, inkUndo, inkRedo, inking]);

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
  // A ringed hint is brought into view, and a tiny ringed bit is zoomed in
  // on until it is easy to click.
  const phone = usePhone();
  // On a touch screen the words say tap.
  const coarse = useCoarse();
  const say = (text: string) =>
    coarse
      ? text.replace(/\bClick\b/g, 'Tap').replace(/\bclick\b/g, 'tap')
      : text;
  // For a ringed stroke, its middle, and its length decides the zoom.
  const rings = inking ? (ink.hint?.ring ?? []) : (hint?.rings ?? []);
  const ringAt =
    inking && rings.length === 2 && rings[0] && rings[1]
      ? {
          x: (rings[0].x + rings[1].x) / 2,
          y: (rings[0].y + rings[1].y) / 2,
        }
      : rings[0];
  const ringBit =
    inking && rings.length === 2 && rings[0] && rings[1]
      ? { segment: { a: rings[0], b: rings[1] } }
      : inking && ink.hint?.ringId && ready
        ? ready.pieces.find((p) => p.id === ink.hint?.ringId)
        : undefined;
  // A hint that shows a stroke lifts the pen, ready for its first dot.
  useEffect(() => {
    if (ink.hint?.stroke) setPen(undefined);
  }, [ink.hint?.stroke]);
  useEffect(() => {
    if (!ringAt) return;
    // On a phone the board may be below the text: bring it on screen.
    if (phone)
      boardRef.current?.scrollIntoView?.({
        block: 'nearest',
        behavior: 'smooth',
      });
    const v = camera.view;
    const w = v.maxX - v.minX;
    const h = v.maxY - v.minY;
    const px = boardRef.current?.getBoundingClientRect().width || 600;
    const len = ringBit
      ? Math.hypot(
          ringBit.segment.b.x - ringBit.segment.a.x,
          ringBit.segment.b.y - ringBit.segment.a.y,
        )
      : Infinity;
    // At least 36 px long on the screen, never closer than a twentieth.
    const scale = Math.min(1, Math.max((len * px) / (36 * w), 1 / 20));
    const inside =
      ringAt.x > v.minX + 0.08 * w &&
      ringAt.x < v.maxX - 0.08 * w &&
      ringAt.y > v.minY + 0.08 * h &&
      ringAt.y < v.maxY - 0.08 * h;
    if (inside && scale >= 1) return;
    const nw = w * scale;
    const nh = h * scale;
    camera.goTo({
      minX: ringAt.x - nw / 2,
      maxX: ringAt.x + nw / 2,
      minY: ringAt.y - nh / 2,
      maxY: ringAt.y + nh / 2,
    });
    // Only when the ring moves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ringAt?.x, ringAt?.y]);
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

  const [showStep, setShowStep] = useState(false);
  const go = (to: number) => {
    // The repeat and the colours open once the ink closes the pieces.
    const top = ink.result?.matches ? shown.length + 2 : shown.length;
    setIndex(Math.max(0, Math.min(top, to)));
    setRemoving(false);
    setKeepFailed(undefined);
    setPen(undefined);
    setPenSaid(undefined);
    setHintLevel(0);
    setDrawFailed(undefined);
    setTargets([]);
    setChoices(undefined);
  };
  const number = shownIds.indexOf(info?.step ?? 0) + 1;
  const last = index === shown.length - 1;
  // A step whose figures are all helper lines needs nothing drawn.
  const helperOnly =
    here !== undefined &&
    !here.needed.length &&
    neededAt(model.scene, beat).length > 0;
  const stepStatus = !here
    ? ''
    : ticks[index]
      ? here.needed.length
        ? `✓ Step ${number} is on your board.`
        : helperOnly
          ? '✓ This step draws only helper lines: draw them if you want their points; nothing else needs them.'
          : '✓ This step only marks points, and they come by themselves where lines cross.'
      : here.done
        ? helperOnly
          ? 'This step draws only helper lines, which are up to you: it is ticked once the step before it is on your board.'
          : 'This step only marks points: it is ticked once the step before it is on your board.'
        : here.missing.length === here.needed.length &&
            !here.missing.some((m) => m.name === tutorial.pattern.cell)
          ? 'Not on your board yet.'
          : `Still to draw: ${stillToDraw(here, tutorial.pattern.cell)}.`;
  const loose = ready
    ? copies.filter((c) => !snapped(ready.cell, c.at)).length
    : 0;
  const wallStatus = keptAs
    ? '✓ Kept as one of your patterns.'
    : repeating
      ? `${count(copies.length)} ${copies.length === 1 ? 'copy' : 'copies'} placed${loose ? `, ${count(loose)} of them loose` : ''}.`
      : `${count(wall.filter((p) => p.type >= 0).length)} pieces in your wall${wall.some((p) => p.type < 0) ? ', and some that do not close' : ''}.`;
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
      {afterInk && ready ? (
        <RepeatBoard
          view={camera.view}
          svgRef={boardRef}
          wasDrag={camera.wasDrag}
          cell={ready.cell}
          ink={tileInk}
          copies={copies}
          arrived={arrived}
          erasing={removing}
          {...(coloring
            ? {
                pieces: wall.map((p) => ({
                  polygon: p.polygon,
                  type: p.type,
                  fill: p.type >= 0 ? (colors[p.type] ?? ground) : ground,
                })),
              }
            : {})}
          onPlace={(at, from) => {
            setCopies([...copies, { at }]);
            setArrived({ index: copies.length, from });
          }}
          onMove={(i, at) => {
            setCopies(copies.map((c, k) => (k === i ? { at } : c)));
            setArrived(undefined);
          }}
          onRemove={(i) => {
            setCopies(copies.filter((_, k) => k !== i));
            setArrived(undefined);
          }}
          onPick={(type) => setSelectedKind(type)}
        />
      ) : (
        <EditorDrawing
          scene={ready?.scene ?? board}
          ink={
            ready
              ? {
                  pieces: ready.pieces,
                  chosen,
                  fresh: ink.fresh,
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
          pen={
            inking && ready && pen && ready.graph.dots.get(pen)
              ? {
                  at: ready.graph.dots.get(pen)?.at as Vec,
                  reach: reachable(ready.graph, pen).map((d) => d.at),
                }
              : undefined
          }
          penDots={inking && ready ? penDotsOf(ready.graph) : undefined}
          numbered={inking && Boolean(ink.hint?.stroke)}
          dashed={hint?.dashed}
          camera={camera}
          svgRef={boardRef}
          fitTo={fullView(model)}
          onHover={(at, reach) =>
            setHover(
              want && !choices ? snap(board, at, reach, want) : undefined,
            )
          }
          onClick={(at: Vec, reach: number) => {
            if (inking) {
              if (!ready) return;
              const stroke = ink.hint?.stroke;
              const ringed = stroke ? [stroke.from, stroke.to] : [];
              const dot = dotNear(ready.graph, at, reach * 1.2, ringed);
              if (dot) {
                setPenSaid(undefined);
                // The pen goes down; on its own dot it lifts.
                if (!pen) return setPen(dot.key);
                if (pen === dot.key) return setPen(undefined);
                if (ink.stroke(pen, dot.key, !erasing)) setPen(dot.key);
                else
                  setPenSaid(
                    'Those two points are not on one line; ink goes along the lines you drew.',
                  );
                return;
              }
              // With the pen lifted, a click on an inked bit erases it; near
              // a ringed extra bit, that one.
              const extra = ink.hint?.ringId;
              const extraAt = ink.hint?.ring[0];
              const hit =
                extra && extraAt && distance(at, extraAt) <= reach * 2.5
                  ? extra
                  : nearestPiece(ready.pieces, at, reach);
              if (!pen && hit && chosen.has(hit)) {
                ink.erase(hit);
                setPenSaid(undefined);
              } else
                setPenSaid(
                  pen
                    ? 'Click a dot: the pen draws straight from dot to dot.'
                    : 'Click a dot to put the pen down.',
                );
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
      )}
    </main>
  );
  const stepHalf = (
    <main
      className="stage along-plate along-step"
      hidden={phone && !showStep}
      aria-label="The step to copy"
    >
      {coloring ? (
        <div className="along-colors">
          <PiecePanel
            model={model}
            colors={colors}
            history={colorHistory}
            dispatch={colorDispatch}
            hovered={hoveredKind}
            onHover={setHoveredKind}
            selected={selectedKind}
            onSelect={setSelectedKind}
            onReset={() =>
              colorDispatch({ kind: 'reset', to: tutorialColoring(model) })
            }
          />
        </div>
      ) : repeating ? (
        <TargetWall model={model} view={camera.view} svgRef={stepRef} />
      ) : inking ? (
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
          optional={showHelpers ? optional : undefined}
        />
      )}
      {coloring ? null : (
        <button
          type="button"
          className="fit"
          onClick={() => camera.goTo(fullView(model))}
        >
          Fit
        </button>
      )}
    </main>
  );

  return (
    <div className="player along">
      <header className="topbar">
        <a className="home" href="#/">
          <span className="wordmark">
            Tastir{' '}
            <span
              className="brand-arabic"
              aria-hidden="true"
              lang="ar"
              dir="rtl"
            >
              تسطير
            </span>
          </span>
          <span>All patterns</span>
        </a>
        <h1>Draw along: {tutorial.title}</h1>
        <label
          className="along-helpers"
          title="Construction lines the pattern never runs along: they only help find points. Hidden, the drawing looks as simple as it is."
        >
          <input
            type="checkbox"
            checked={showHelpers}
            onChange={(e) => setShowHelpers(e.target.checked)}
          />
          Show helper lines
        </label>
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
          {(['Repeat', 'Color'] as const).map((name, k) => (
            <li key={name}>
              <button
                type="button"
                className={[
                  'along-dot',
                  index === shown.length + 1 + k ? 'on' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-current={
                  index === shown.length + 1 + k ? 'step' : undefined
                }
                aria-label={name}
                disabled={!ink.result?.matches}
                title={
                  ink.result?.matches
                    ? undefined
                    : 'Opens once your ink closes the pattern’s pieces'
                }
                onClick={() => go(shown.length + 1 + k)}
              >
                {name}
              </button>
            </li>
          ))}
        </ol>
        {phone ? (
          <button
            type="button"
            className="secondary along-swap"
            onClick={() => setShowStep(!showStep)}
          >
            {showStep
              ? repeating || coloring
                ? 'Show my wall'
                : 'Show my drawing'
              : repeating
                ? 'Show the wall to aim for'
                : coloring
                  ? 'Show the colours'
                  : 'Show the step'}
          </button>
        ) : null}
      </nav>
      <div className="along-grid">
        <section className="along-text-row" aria-label="The step to copy">
          <div className="along-text">
            {/* Every step's text and the ink's, in one cell, only the one
                at hand visible: the row is as tall as the tallest text in
                the tutorial, so the drawings never move between stages. */}
            <div className="along-stack">
              {[
                ...shown.map((b, i) => ({
                  on: !inking && i === index,
                  head: `Step ${shownIds.indexOf(beats[b - 1]?.step ?? 0) + 1} of ${shownIds.length}: the step to copy`,
                  text: beats[b - 1]?.text ?? '',
                })),
                { on: inking, head: 'Ink', text: tutorial.ink.text ?? '' },
                {
                  on: repeating,
                  head: 'Repeat it yourself',
                  text: 'Lay copies of your tile into a wall: click a faint ghost to place a copy beside one, or drag a copy wherever you like; near a place where it joins up, it snaps there. Drag a copy off the board to take it away.',
                },
                {
                  on: coloring,
                  head: 'Color it (if you like)',
                  text: `Click a piece of your wall, then choose its colour ${phone ? 'under Show the colours' : 'on the right'}: every piece of that shape takes it. Pieces that do not close, where copies do not join, stay the ground colour.`,
                },
              ].map((layer, i) => (
                <div
                  key={i}
                  className={layer.on ? 'along-layer on' : 'along-layer'}
                  aria-hidden={layer.on ? undefined : true}
                >
                  <h2>{layer.head}</h2>
                  <p className="instruction">{layer.text}</p>
                  {/* The status under the text at hand; an empty slot of the
                      same height under the others. */}
                  {layer.on ? (
                    <p
                      className={
                        (
                          inking
                            ? ink.result?.matches
                            : afterInk
                              ? Boolean(keptAs)
                              : ticks[index]
                        )
                          ? 'along-check done'
                          : 'along-check'
                      }
                      role="status"
                    >
                      {inking
                        ? (keepFailed ?? inkStatus)
                        : afterInk
                          ? (keepFailed ?? wallStatus)
                          : stepStatus}
                    </p>
                  ) : (
                    <p className="along-check" />
                  )}
                </div>
              ))}
            </div>
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
            {/* Both forward buttons in one cell, so the text beside them
                keeps its width (and its lines) from the steps to the ink. */}
            <span className="along-stack">
              {[
                {
                  on: !inking && !afterInk,
                  buttons: [
                    <button
                      key="n"
                      type="button"
                      className="next"
                      onClick={() => go(index + 1)}
                    >
                      {last ? 'Ink it' : 'Next'}
                    </button>,
                  ],
                },
                {
                  on: inking,
                  buttons: [
                    <button
                      key="r"
                      type="button"
                      className="next"
                      disabled={!ink.result?.matches}
                      onClick={() => go(shown.length + 1)}
                    >
                      Repeat it
                    </button>,
                  ],
                },
                {
                  on: repeating,
                  buttons: [
                    <button
                      key="c"
                      type="button"
                      className="secondary"
                      onClick={() => go(shown.length + 2)}
                    >
                      Color it
                    </button>,
                    <button
                      key="k"
                      type="button"
                      className="next"
                      onClick={() => keepIt(false)}
                    >
                      Keep it as it is
                    </button>,
                  ],
                },
                {
                  on: coloring,
                  buttons: [
                    <button
                      key="k"
                      type="button"
                      className="next"
                      onClick={() => keepIt(true)}
                    >
                      Keep it
                    </button>,
                  ],
                },
              ].map((layer, i) => (
                <span
                  key={i}
                  className={layer.on ? 'along-layer on' : 'along-layer'}
                  aria-hidden={layer.on ? undefined : true}
                  inert={!layer.on}
                >
                  {layer.buttons}
                </span>
              ))}
            </span>
          </nav>
        </section>
        {/* On a phone showing the step, the tools keep their room (unseen),
            so the step's picture sits where the board was. */}
        <div
          className="along-tools"
          style={phone && showStep ? { visibility: 'hidden' } : undefined}
          inert={phone && showStep}
        >
          {/* Both tool bars in one cell, the one at hand visible, so the
              row keeps its height from the steps to the ink. */}
          <div className="along-stack">
            <div
              className={inking ? 'along-layer on' : 'along-layer'}
              aria-hidden={inking ? undefined : true}
              inert={!inking}
            >
              <div className="editor-tools" role="toolbar" aria-label="Ink">
                <button
                  type="button"
                  className="tool"
                  title={INK_LIFT}
                  aria-description={INK_LIFT}
                  disabled={!pen}
                  onClick={() => setPen(undefined)}
                >
                  Lift the pen
                </button>
                <button
                  type="button"
                  className={erasing ? 'tool on' : 'tool'}
                  aria-pressed={erasing}
                  title={INK_ERASE}
                  aria-description={INK_ERASE}
                  onClick={() => setErasing(!erasing)}
                >
                  Erase
                </button>
                <label className="tool" title={INK_COPIES}>
                  <input
                    type="checkbox"
                    checked={ink.copies}
                    aria-description={INK_COPIES}
                    onChange={(e) => ink.setCopies(e.target.checked)}
                  />
                  Also ink the copies round the centre
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
                <button
                  type="button"
                  className="tool"
                  title="Take back the last stroke."
                  aria-description="Take back the last stroke."
                  disabled={!inkHistory.past.length}
                  onClick={inkUndo}
                >
                  Undo
                </button>
                <button
                  type="button"
                  className="tool"
                  title="Put back what Undo took away."
                  aria-description="Put back what Undo took away."
                  disabled={!inkHistory.future.length}
                  onClick={inkRedo}
                >
                  Redo
                </button>
              </div>
            </div>
            <div
              className={afterInk ? 'along-layer on' : 'along-layer'}
              aria-hidden={afterInk ? undefined : true}
              inert={!afterInk}
            >
              <div className="editor-tools" role="toolbar" aria-label="Wall">
                {repeating ? (
                  <>
                    <button
                      type="button"
                      className={removing ? 'tool on' : 'tool'}
                      aria-pressed={removing}
                      title={WALL_ERASE}
                      aria-description={WALL_ERASE}
                      onClick={() => setRemoving(!removing)}
                    >
                      Erase
                    </button>
                    <button
                      type="button"
                      className="tool"
                      title={WALL_FILL}
                      aria-description={WALL_FILL}
                      onClick={() => {
                        if (ready)
                          setCopies(
                            fillCopies(ready.cell, camera.view, copies),
                          );
                        setArrived(undefined);
                      }}
                    >
                      Fill the wall for me
                    </button>
                    <button
                      type="button"
                      className="tool"
                      title={WALL_CLEAR}
                      aria-description={WALL_CLEAR}
                      disabled={!copies.length}
                      onClick={() => setCopies([])}
                    >
                      Clear the copies
                    </button>
                    <button
                      type="button"
                      className="tool"
                      title="Take back the last placing, moving or removing."
                      aria-description="Take back the last placing, moving or removing."
                      disabled={!copyHistory.past.length}
                      onClick={copyUndo}
                    >
                      Undo
                    </button>
                    <button
                      type="button"
                      className="tool"
                      title="Put back what Undo took away."
                      aria-description="Put back what Undo took away."
                      disabled={!copyHistory.future.length}
                      onClick={copyRedo}
                    >
                      Redo
                    </button>
                  </>
                ) : null}
              </div>
            </div>
            <div
              className={inking || afterInk ? 'along-layer' : 'along-layer on'}
              aria-hidden={inking || afterInk ? true : undefined}
              inert={inking || afterInk}
            >
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
            </div>
          </div>
        </div>
        {/* Always there, at ink too, so the drawings keep their place. */}
        {/* The hint row of every stage in one cell, the one at hand
            visible, so its height never changes between stages. */}
        <div className="along-hints">
          <div className="along-stack">
            <div
              className={
                afterInk
                  ? 'along-layer along-hints-row on'
                  : 'along-layer along-hints-row'
              }
              aria-hidden={afterInk ? undefined : true}
              inert={!afterInk}
            >
              <span className="along-hint-words" aria-live="polite">
                {keptAs ? (
                  <>
                    Kept as one of your patterns.{' '}
                    <a
                      href={
                        keptIds.design
                          ? `#/mine/${keptAs}/design/${keptIds.design}`
                          : `#/mine/${keptAs}`
                      }
                    >
                      Play it
                    </a>{' '}
                    · <a href="#/">My patterns</a>
                  </>
                ) : (
                  say(
                    repeating
                      ? 'Click a ghost to place a copy; drag a copy to move it.'
                      : phone
                        ? 'Click a piece, then press Show the colours to choose its colour.'
                        : 'Click a piece, then a colour on the right.',
                  )
                )}
              </span>
            </div>
            <div
              className={
                inking
                  ? 'along-layer along-hints-row on'
                  : 'along-layer along-hints-row'
              }
              aria-hidden={inking ? undefined : true}
              inert={!inking}
            >
              <>
                <button
                  type="button"
                  className="secondary"
                  onClick={() =>
                    ink.setHintLevel(Math.min(3, ink.hintLevel + 1))
                  }
                >
                  {ink.hintLevel ? 'Show me more' : 'Show me a hint'}
                </button>
                <span className="along-hint-words" aria-live="polite">
                  {say(ink.hint?.words ?? '')}
                </span>
              </>
            </div>
            <div
              className={
                !inking && !afterInk
                  ? 'along-layer along-hints-row on'
                  : 'along-layer along-hints-row'
              }
              aria-hidden={!inking && !afterInk ? undefined : true}
              inert={!(!inking && !afterInk)}
            >
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
                  {say(drawFailed ?? hint?.words ?? '')}
                </span>
              </>
            </div>
          </div>
        </div>
        {boardHalf}
        {stepHalf}
        <footer
          className="caption along-board-caption"
          hidden={phone && showStep}
        >
          <h2>Your drawing</h2>
          {afterInk ? (
            <p className="instruction" aria-live="polite">
              {say(
                repeating
                  ? removing
                    ? 'Erase: click a copy to take it away.'
                    : 'Click a ghost to place a copy, or drag a copy anywhere; off the board takes it away.'
                  : 'Your wall, coloured piece by piece.',
              )}
            </p>
          ) : inking ? (
            <p className="instruction" aria-live="polite">
              <b>{erasing ? 'Erase:' : 'Pen:'}</b>{' '}
              {say(
                penSaid ??
                  (pen
                    ? `Click a marked dot on the same line to ${erasing ? 'erase' : 'ink'} the straight stretch to it; click the pen's dot to lift it.`
                    : `Click a dot to put the pen down, then a dot on the same line to ${erasing ? 'erase' : 'ink'} between them.`),
              )}
            </p>
          ) : (
            <>
              <p className="instruction" aria-live="polite">
                {tool ? <b>{tool.label}: </b> : null}
                {say(said ?? ask)}
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
          {repeating ? (
            <p className="dot-key">The pattern’s own wall, to aim for.</p>
          ) : coloring ? (
            <p className="dot-key">
              The colours, as at the player’s colour stage.
            </p>
          ) : inking ? (
            <p className="dot-key">
              The pattern, inked as the tutorial inks it.
            </p>
          ) : (
            <p className="dot-key">
              <span className="new">orange: what this step makes</span>
              <span className="used">blue: what it works from</span>
              <span className="helper">
                dashed: helper lines that only help find points; the pattern
                never runs along them
              </span>
              {showHelpers ? (
                <span className="helper optional">
                  light dashed: optional, as nothing needs their points
                </span>
              ) : null}
            </p>
          )}
        </footer>
      </div>
    </div>
  );
}
