import { DEFAULT_JALI, sameJali } from './jali';
import { JaliControls } from './JaliControls';
import { ExploreNext } from './ExploreNext';
import { keepLessonAt, lessonAt } from './lessons';
import { ThemeSwitch } from './theme';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { copyUpTo } from '../editor/document';
import { addPattern, freeTitle, getPattern } from '../editor/patterns';
import { planStep, play, playInk } from './animation';
import { fullView, growingFrame, tileView, width } from './camera';
import {
  colorReducer,
  finishOf,
  pieceColors,
  tutorialColoring,
  type History,
} from './coloring';
import { type Design } from './designs';
import { Construction, RepeatedInk } from './drawing';
import { download, pngBlob, svgBlob, wallSvg } from './exporting';
import {
  asPanel,
  beatsOf,
  hiddenBeats,
  shownSteps,
  stagesOf,
  withHelpers,
  type InkMode,
  type Model,
  type Stage,
} from './model';
import { Original } from './Original';
import { NextPattern, PatternMenu, PreviousPattern } from './PatternNav';
import { ColourPanel } from './ColourPanel';
import { Tiles } from './Tiles';
import { brushOf, refamily, rosetteCounts } from './rosettes';
import { ViewSwitch, viewAddress, type View } from './ViewSwitch';
import {
  byPlace,
  colorRepeat,
  colouredModel,
  placeFills,
  placeKey,
  ringsFor,
} from './placement';
import { PrintSheet, type Paper } from './PrintSheet';
import { useRemembered } from './remembered';
import { SaveDesign } from './SaveDesign';
import { ShareLink } from './Sharing';
import { useCamera } from './useCamera';
import { useInking } from './useInking';
import { useModalFocus } from './useModalFocus';
import { banded, Wall, WALL_STYLES, type WallStyle } from './Wall';
import { PROGRESS_TEXT, useModel } from './workerClient';

import { setStayGuard } from './routing';
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
  if (ringsFor(model))
    return 'Color ring by ring, as on real zellige: pick a color, then click a piece, and its whole ring round the rosette takes the color.';
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

/** The colours a learner gave their own pattern when drawing along. */
function keptColoring(address: string) {
  if (!address.startsWith('mine/')) return undefined;
  return getPattern(address.slice('mine/'.length))?.wall?.coloring;
}

/** Whether a saved design holds just what the player shows now. */
function sameDesign(
  design: Design,
  now: Pick<Design, 'inked' | 'coloring' | 'look' | 'grout' | 'jali'>,
): boolean {
  const sorted = (chosen: Readonly<Record<string, string>>) =>
    JSON.stringify(Object.entries(chosen).sort(([a], [b]) => (a < b ? -1 : 1)));
  return (
    JSON.stringify(design.inked ?? null) ===
      JSON.stringify(now.inked ?? null) &&
    design.coloring.palette === now.coloring.palette &&
    design.coloring.method === now.coloring.method &&
    design.coloring.rosettes === now.coloring.rosettes &&
    sorted(design.coloring.chosen) === sorted(now.coloring.chosen) &&
    design.look === now.look &&
    design.grout === now.grout &&
    sameJali(design.jali, now.jali)
  );
}

/** Where a tutorial opens: at its first step, or at the finished wall. */
/** Where the player opens: the first step, the repeat (after drawing
 * along), or the finished wall. */
export type Start = 'beginning' | 'repeat' | 'result';

export function Player({
  model: full,
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
  // Helper lines (construction lines the pattern never runs along) are
  // left out unless the learner asks for them.
  const [showHelpers, setShowHelpers] = useRemembered<boolean>(
    'showHelpers',
    false,
  );
  const model = useMemo(
    () => withHelpers(full, showHelpers),
    [full, showHelpers],
  );
  const { tutorial } = model;
  const address = given ?? tutorial.id;
  const mine = address.startsWith('mine/');
  // A pattern opened from a share link: shown, not saved, until kept.
  const sharedView = address === 'shared';
  // Library tutorials only: own and shared patterns are not in its order.
  const browsing = !mine && !sharedView;
  const start = opened ? 'result' : asked;
  // After the ink the learner colours the unit first, or repeats it first.
  const [colourFirst, setColourFirst] = useState(false);
  const stages = useMemo(
    () => stagesOf(tutorial, colourFirst),
    [tutorial, colourFirst],
  );
  // How many copies of the tile the repeat lays: so many along each
  // slide, or the whole wall.
  const [copies, setCopies] = useState<Copies>('wall');
  // Watching again, the lesson opens at the step the learner left.
  const [resumedAt, setResumedAt] = useState(() =>
    start === 'beginning' && !sharedView
      ? lessonAt(address, stagesOf(tutorial))
      : undefined,
  );
  const [index, setIndex] = useState(
    () =>
      resumedAt ??
      (start === 'result'
        ? stagesOf(tutorial).length - 1
        : start === 'repeat'
          ? stagesOf(tutorial).length - 2
          : 0),
  );
  const openedAt = useRef(index);
  const stage = useMemo(
    (): Stage => stages[index] ?? { kind: 'color' },
    [stages, index],
  );
  const last = stages.length - 1;
  const [speed, setSpeed] = useState(1);
  const [playing, setPlaying] = useState(
    start === 'beginning' && resumedAt === undefined,
  );
  const plateRef = useRef<HTMLElement>(null);
  const clock = useRef<{ index: number; remaining: number } | undefined>(
    undefined,
  );
  const [reduced, setReduced] = useState(prefersReducedMotion);
  const [showNames, setShowNames] = useRemembered<boolean>('showNames', false);
  const [inkMode, setInkMode] = useRemembered<InkMode>('inkMode', 'end');
  const asYouGo = inkMode === 'asYouGo';

  const inking = useInking(model, opened?.inked);
  // The ink stage shows the one unit the ink makes: the whole panel, when
  // the tutorial names one.
  const inkModel = useMemo(
    () => (inking.editing ? inking.shown : asPanel(inking.shown)),
    [inking.editing, inking.shown],
  );
  const [colorHistory, colorDispatch] = useReducer(
    colorReducer,
    model,
    (m): History => ({
      past: [],
      // A pattern drawn along and coloured keeps its colours.
      now: opened?.coloring ?? keptColoring(address) ?? tutorialColoring(m),
      future: [],
    }),
  );
  // The pattern as the learner colours it: ring by ring, by shape or by
  // place, with as many rosettes taking turns as they chose.
  const coloured = useMemo(
    () => colouredModel(inking.shown, colorHistory.now),
    [inking.shown, colorHistory.now],
  );
  const colors = useMemo(
    () => pieceColors(coloured, colorHistory.now),
    [coloured, colorHistory.now],
  );
  // Fills by placement, when the tutorial colors same shapes differently.
  const fill = useMemo(
    () =>
      byPlace(coloured) ? placeFills(coloured, colorHistory.now) : undefined,
    [coloured, colorHistory.now],
  );
  const [place, setPlace] = useState<{ piece: number; i: number; j: number }>();
  // The colour a click paints with, when colouring ring by ring.
  const [brush, setBrush] = useState<string>();
  // A new palette starts the brush on its own first glaze.
  useEffect(() => setBrush(undefined), [colorHistory.now.palette]);
  const [hovered, setHovered] = useState<number>();
  const [selected, setSelected] = useState<number>();
  const [wallStyle, setWallStyle] = useState<WallStyle>(
    opened?.look ?? tutorial.pattern.look ?? 'tiles',
  );
  const [grout, setGrout] = useState(opened?.grout ?? 1);
  const [jali, setJali] = useState(opened?.jali ?? DEFAULT_JALI);
  // The design being worked on: the one opened, or the last one saved.
  const [design, setDesign] = useState(opened);
  const designFields = () => ({
    tutorial: address,
    inked: inking.inked,
    coloring: colorHistory.now,
    look: wallStyle,
    grout,
    ...(wallStyle === 'jali' || design?.jali !== undefined || !sameJali(jali)
      ? { jali }
      : {}),
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
    setStayGuard((to) => {
      if (leaveAnyway.current) return false;
      window.history.pushState(null, '', here);
      setLeaving(to);
      return true;
    });
    return () => {
      setStayGuard(undefined);
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
    wallSvg(inking.shown, colors, {
      look: wallStyle,
      grout,
      fill,
      jali,
      finish: finishOf(inking.shown, colorHistory.now),
    });
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
        : stage.kind === 'ink'
          ? tileView(model)
          : fullView(model),
    [model, stage, hidden],
  );
  const onConstruction = stage.kind === 'step' || stage.kind === 'ink';
  const camera = useCamera(frame, svgRef, {
    stage: index,
    instant: reduced,
    active: onConstruction,
    paused: !playing && clock.current?.index === index,
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

  const advance = useCallback(() => {
    if (reversing.current) return settle();
    settle();
    if (index === last) return;
    if (index + 1 === last) setPlaying(false);
    animateNext.current = true;
    setForward(true);
    setIndex(index + 1);
  }, [index, last]);

  const next = useCallback(() => {
    setPlaying(false);
    clock.current = undefined;
    advance();
  }, [advance]);

  const back = useCallback(() => {
    setPlaying(false);
    // A second Back while undrawing finishes the undrawing at once.
    if (reversing.current) return settle();
    settle();
    if (index === 0) return;
    clock.current = undefined;
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

  // From the ink, on to colouring the unit or repeating it, whichever the
  // learner picks first.
  const after = (colour: boolean) => {
    setColourFirst(colour);
    // Coloured first, the one tile is the unit: one rosette, so every
    // copy of it takes the same colours.
    const count = rosetteCounts(coloured).now;
    if (colour && count > 1) {
      const now = colorHistory.now;
      colorDispatch({
        kind: 'reset',
        to: {
          palette: now.palette,
          chosen: refamily(now.chosen, count, 1),
          ...(now.method ? { method: now.method } : {}),
          rosettes: 1,
        },
      });
    }
    next();
  };

  const togglePlayback = useCallback(() => {
    if (index === last) {
      clock.current = undefined;
      animateNext.current = true;
      setForward(true);
      setIndex(0);
    }
    setPlaying((was) => !was);
  }, [index, last]);

  // Use the longest active animation as the stage's movie time, including
  // the repeat's slides. Keep the remaining time when playback is paused.
  useEffect(() => {
    const animations = [
      ...new Set([
        ...running.current,
        ...(plateRef.current?.getAnimations?.({ subtree: true }) ?? []),
      ]),
    ];
    for (const animation of animations) {
      if (animation.playState === 'finished' || animation.playState === 'idle')
        continue;
      if (playing || reversing.current || clock.current?.index !== index)
        animation.play?.();
      else animation.pause?.();
    }
    if (!playing || index === last || inking.editing) return;
    if (clock.current?.index !== index) {
      const duration = Math.max(
        0,
        ...animations.map((animation) => {
          if (
            animation.playState === 'finished' ||
            animation.playState === 'idle'
          )
            return 0;
          const end = animation.effect?.getComputedTiming().endTime;
          const elapsed =
            typeof animation.currentTime === 'number'
              ? animation.currentTime
              : 0;
          return typeof end === 'number' && Number.isFinite(end)
            ? Math.max(0, end - elapsed)
            : 0;
        }),
      );
      clock.current = { index, remaining: duration + 1000 / speed };
    }
    const current = clock.current;
    const started = performance.now();
    const timer = window.setTimeout(advance, current.remaining);
    return () => {
      window.clearTimeout(timer);
      current.remaining = Math.max(
        0,
        current.remaining - (performance.now() - started),
      );
    };
  }, [playing, index, last, speed, advance, inking.editing, forward]);

  useEffect(
    () => () => {
      running.current.forEach((animation) => animation.cancel?.());
    },
    [],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Focused controls and browser shortcuts handle their own keys.
      if (
        e.defaultPrevented ||
        e.altKey ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey
      )
        return;
      if (
        e.target instanceof Element &&
        e.target.closest(
          'input, textarea, select, button, a, [contenteditable]:not([contenteditable="false"]), [role="dialog"], [role="alertdialog"]',
        )
      )
        return;
      if (e.key === 'ArrowLeft') back();
      if (e.key === 'ArrowRight') next();
      if (e.key === ' ') {
        e.preventDefault();
        togglePlayback();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [back, next, togglePlayback]);

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
  } else {
    // Ring by ring, a click paints the piece's ring with the brush; by
    // shape or place, it opens the piece in the panel.
    const paints = !!fill && !!ringsFor(coloured);
    const pick = (
      type: number,
      at: { piece: number; i: number; j: number },
    ) => {
      if (paints)
        return colorDispatch({
          kind: 'paint',
          type: placeKey(coloured, at.piece, at.i, at.j),
          color: brushOf(coloured, colorHistory.now.palette, brush),
        });
      setSelected(type);
      setPlace(at);
    };
    // The coloured tiles: so many copies, or the whole wall.
    const tiles = (count: Copies) =>
      count === 'wall' ? (
        <Wall
          model={coloured}
          colors={colors}
          fill={fill}
          finish={finishOf(coloured, colorHistory.now)}
          repeat={colorRepeat(coloured)}
          look={wallStyle}
          grout={grout}
          jali={jali}
          onHover={setHovered}
          onPick={pick}
          enter={enter}
        />
      ) : (
        <Tiles
          model={coloured}
          count={count}
          fill={(k, i, j) =>
            fill
              ? fill(k, i, j)
              : (colors[coloured.pattern.pieces[k]?.type ?? 0] ?? '#999999')
          }
          lines={finishOf(coloured, colorHistory.now).lines}
          onHover={setHovered}
          onPick={pick}
        />
      );
    if (stage.kind === 'repeat') {
      label = 'Repeat';
      hint = 'Copies of the tile, laid edge to edge.';
      text =
        tutorial.pattern.text ??
        'Repeat the tile edge to edge, with the same lines in every copy.';
      picture = colourFirst ? (
        tiles(copies)
      ) : (
        <RepeatedInk
          key={String(copies)}
          // The tile the ink showed (the tutorial's panel), so the copies
          // are that tile; ink of the learner's own is repeated by its cell.
          model={inking.isClassic ? asPanel(inking.shown) : inking.shown}
          count={copies === 'wall' ? undefined : copies}
          enter={enter}
          speed={speed}
          paused={!playing && clock.current?.index === index}
        />
      );
    } else {
      label = 'Color';
      hint = ringsFor(coloured)
        ? 'Colors ring by ring round each rosette.'
        : coloured.tutorial.pattern.placements
          ? 'Colors by where each piece sits.'
          : 'One color for each shape of piece.';
      text = colorText(coloured);
      // Coloured first, the one tile the ink made.
      picture = tiles(colourFirst ? [1, 1] : copies);
    }
  }

  // The step is remembered as the learner goes, and forgotten once they
  // reach the end, so the next visit starts again from step 1.
  useEffect(() => {
    if (sharedView) return;
    if (resumedAt !== undefined && index !== resumedAt) setResumedAt(undefined);
    if ((stage.kind === 'step' || stage.kind === 'ink') && index > 0)
      keepLessonAt(address, index, label);
    else if (index === 0 || (index === last && index !== openedAt.current))
      keepLessonAt(address, undefined);
  }, [address, index, label, last, resumedAt, sharedView, stage.kind]);

  // The colours are chosen at the colour stage and kept to the end, where
  // the finished wall is saved and shared.
  const colorStage = stage.kind === 'color' || index === last;
  // The whole wall is shown, with its styles.
  const onWall =
    copies === 'wall' &&
    (colourFirst ? stage.kind === 'repeat' : stage.kind === 'color');

  const photos = tutorial.photos ?? [];
  const showOriginal = comparing && onWall && photos.length > 0;
  // The colours, at the top of the panel while colouring, so they are the
  // first thing in view.
  const colorsSection =
    !onWall || wallStyle !== 'jali' ? (
      <section>
        <h2>Colors</h2>
        <ColourPanel
          model={coloured}
          base={inking.shown}
          colors={colors}
          fill={fill}
          brush={brushOf(coloured, colorHistory.now.palette, brush)}
          onBrush={setBrush}
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
                  key: placeKey(coloured, place.piece, place.i, place.j),
                  color: fill(place.piece, place.i, place.j),
                }
              : undefined
          }
          oneTile={colourFirst && stage.kind === 'color'}
          onReset={() =>
            colorDispatch({
              kind: 'reset',
              to: tutorialColoring(model),
            })
          }
        />
      </section>
    ) : null;

  /** Jumps straight to a stage from the journey, without playing it in. */
  const jump = (to: number) => {
    setPlaying(false);
    if (to === index) return;
    clock.current = undefined;
    settle();
    reversing.current = false;
    setForward(false);
    setIndex(to);
  };

  // Watching and the result are both this page: the finished wall is the
  // result, every stage before it is watching. The switch shows either in
  // place, and the address follows (a library tutorial's own address only,
  // not a design's), so a reload or a shared link opens the same view.
  const view: View = index === last ? 'result' : 'watch';
  const show = (to: View) => {
    if (to === 'draw') return false;
    if (to === 'result') {
      jump(last);
      setComparing(true);
    } else {
      settle();
      clock.current = undefined;
      reversing.current = false;
      animateNext.current = true;
      setForward(true);
      setIndex(0);
      setPlaying(true);
    }
    return true;
  };
  const shownView = useRef(view);
  useEffect(() => {
    if (shownView.current === view) return;
    shownView.current = view;
    if (!browsing || design) return;
    const want = viewAddress(address, view);
    if (window.location.hash !== want)
      window.history.replaceState(window.history.state, '', want);
  }, [view, browsing, design, address]);

  return (
    <div className={colorStage ? 'player at-color' : 'player'}>
      {leaving !== undefined && changed ? (
        <LeaveConfirmation
          name={design?.name}
          onStay={() => setLeaving(undefined)}
          onLeave={() => {
            leaveAnyway.current = true;
            window.location.hash = leaving;
          }}
        />
      ) : null}
      {printing ? (
        <PrintSheet model={inking.shown} paper={paper} onDone={stopPrinting} />
      ) : null}
      <header className="topbar">
        {browsing ? <PatternMenu id={address} view={view} /> : null}
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
        {browsing ? <PreviousPattern id={address} view={view} /> : null}
        <h1>{tutorial.title}</h1>
        {browsing ? <NextPattern id={address} view={view} /> : null}
        {mine ? (
          <a
            className="edit-link"
            href={`#/edit/${address.slice('mine/'.length)}`}
          >
            Edit this pattern
          </a>
        ) : null}
        {browsing ? (
          <ViewSwitch id={address} view={view} onShow={show} />
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
            <label title="Construction lines the pattern never runs along: they only help find points. Hidden, the drawing looks as simple as it is.">
              <input
                type="checkbox"
                checked={showHelpers}
                onChange={(e) => setShowHelpers(e.target.checked)}
              />
              Show helper lines
            </label>
          </div>
        </details>
        <ThemeSwitch />
      </header>
      {banner}
      <div className={colorStage ? 'workspace with-panel' : 'workspace'}>
        <section ref={plateRef} className="plate-area">
          <main className={showOriginal ? 'stage comparing' : 'stage'}>
            {showOriginal ? <Original photos={photos} /> : null}
            {picture}
          </main>
          {onConstruction ? (
            <button
              type="button"
              className="fit"
              aria-label="Fit"
              title="Show the whole drawing"
              onClick={() => camera.goTo(fullView(model))}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
              </svg>
            </button>
          ) : null}
        </section>
        <div className="lesson-side">
          <footer className="caption">
            <div className="text">
              {resumedAt !== undefined ? (
                <p className="resumed">
                  Continued where you left off.{' '}
                  <button
                    type="button"
                    className="quiet"
                    onClick={() => show('watch')}
                  >
                    Start from step 1
                  </button>
                </p>
              ) : null}
              <p className="label">{label}</p>
              {hint ? <p className="stage-hint">{hint}</p> : null}
              {tutorial.verification?.status === 'unverified' ? (
                <details className="verification-note">
                  <summary>Historical match unverified</summary>
                  <p>{tutorial.verification.note}</p>
                </details>
              ) : null}
              {colorStage && narrow ? saveDesign : null}
              <p className="instruction" aria-live="polite">
                {text}
              </p>
              {stage.kind === 'step' ? (
                <p className="dot-key">
                  <span className="new">orange: what this step makes</span>
                  <span className="used">blue: what it works from</span>
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
                    onClick={() => {
                      setPlaying(false);
                      inking.setEditing(!inking.editing);
                    }}
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
              {stage.kind === 'repeat' ? (
                <div className="copies" role="group" aria-label="Copies">
                  {COPIES.map((c) => (
                    <button
                      key={String(c)}
                      type="button"
                      aria-pressed={String(c) === String(copies)}
                      onClick={() => setCopies(c)}
                    >
                      {c === 'wall' ? 'The whole wall' : `${c[0]} × ${c[1]}`}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <nav aria-label="Steps">
              <button
                type="button"
                className="quiet playback"
                onClick={togglePlayback}
              >
                {playing ? 'Pause' : index === last ? 'Replay' : 'Play'}
              </button>
              <button
                type="button"
                className="secondary"
                onClick={back}
                disabled={index === 0}
              >
                Back
              </button>
              {stage.kind === 'ink' ? (
                <>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => after(true)}
                  >
                    Color it
                  </button>
                  <button
                    type="button"
                    className="next"
                    onClick={() => after(false)}
                  >
                    Repeat it
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="next"
                  onClick={next}
                  disabled={index === last}
                >
                  Next
                </button>
              )}
            </nav>
          </footer>
          {colorStage ? (
            <aside className="side-panel" aria-label="The wall">
              {stage.kind === 'color' ? colorsSection : null}
              {!mine && !sharedView ? (
                <ExploreNext tutorial={full.tutorial} />
              ) : null}
              {narrow ? null : (
                <section>
                  <h2>My design</h2>
                  {saveDesign}
                </section>
              )}
              {photos.length && onWall ? (
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
                    A photo of the real pattern, beside the wall. Click it to
                    see it at full size.
                  </p>
                </section>
              ) : null}
              {onWall ? (
                <section>
                  <h2>The wall</h2>
                  <div className="wall-tools">
                    <label>
                      Style
                      <select
                        value={wallStyle}
                        onChange={(e) => {
                          const style = e.target.value as WallStyle;
                          setWallStyle(style);
                          if (style === 'jali' && grout < 0.5) setGrout(0.5);
                        }}
                      >
                        {WALL_STYLES.map((s) => (
                          <option key={s} value={s}>
                            {s[0]?.toUpperCase() + s.slice(1)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      {wallStyle === 'jali'
                        ? 'Lattice'
                        : banded(wallStyle)
                          ? 'Band'
                          : 'Grout'}
                      <input
                        type="range"
                        min={wallStyle === 'jali' ? 0.5 : 0}
                        max={3}
                        step={0.25}
                        value={
                          wallStyle === 'jali' ? Math.max(0.5, grout) : grout
                        }
                        onChange={(e) => setGrout(Number(e.target.value))}
                      />
                    </label>
                  </div>
                  <p className="hint">
                    {wallStyle === 'jali'
                      ? 'An open screen. Switch styles to see your tile colors. '
                      : ''}
                    Drag to move along the wall, scroll to zoom.
                  </p>
                </section>
              ) : null}
              {onWall && wallStyle === 'jali' ? (
                <JaliControls appearance={jali} onChange={setJali} />
              ) : null}
              {stage.kind === 'color' ? null : colorsSection}
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
        <Journey stages={stages} index={index} onJump={jump} />
      </div>
    </div>
  );
}

function LeaveConfirmation({
  name,
  onStay,
  onLeave,
}: {
  name: string | undefined;
  onStay: () => void;
  onLeave: () => void;
}) {
  const dialog = useRef<HTMLDivElement>(null);
  const stay = useRef<HTMLButtonElement>(null);
  useModalFocus(dialog, stay, onStay, '.player', '.home');
  return (
    <div className="leave-backdrop">
      <div
        ref={dialog}
        className="leave-check"
        role="alertdialog"
        aria-modal="true"
        aria-label="Unsaved changes"
      >
        <p>
          Your changes to “{name}” are not saved. Leave without saving them?
        </p>
        <div>
          <button type="button" className="secondary" onClick={onLeave}>
            Leave without saving
          </button>
          <button ref={stay} type="button" onClick={onStay}>
            Stay
          </button>
        </div>
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

/** How many copies the repeat lays, along each slide, or the whole wall. */
type Copies = readonly [number, number] | 'wall';
const COPIES: readonly Copies[] = [[2, 1], [2, 2], [3, 3], 'wall'];

const PHASE_NAMES = { ink: 'Ink', repeat: 'Repeat', color: 'Color' } as const;

/** The eight-pointed khatam star each step and phase sits in. */
function Khatam() {
  return (
    <svg className="khatam" viewBox="0 0 24 24" aria-hidden="true">
      <polygon points="23,12 19.8,15.2 19.8,19.8 15.2,19.8 12,23 8.8,19.8 4.2,19.8 4.2,15.2 1,12 4.2,8.8 4.2,4.2 8.8,4.2 12,1 15.2,4.2 19.8,4.2 19.8,8.8" />
    </svg>
  );
}

/**
 * Where the learner is, under the drawing: the steps of the construction,
 * then the ink, the repeat and the color, in the order the learner takes
 * them. Each sits in a khatam star (green when done, orange where the
 * learner is) and can be clicked to go straight there.
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
  const current = useRef<HTMLButtonElement>(null);
  // A long construction scrolls along; the step in view follows the
  // learner. Only the timeline's own row moves, never the page.
  useEffect(() => {
    const star = current.current;
    const row = star?.closest<HTMLElement>('.journey');
    if (!star || !row) return;
    const box = row.getBoundingClientRect();
    const at = star.getBoundingClientRect();
    if (at.left < box.left) row.scrollLeft -= box.left - at.left + 8;
    else if (at.right > box.right) row.scrollLeft += at.right - box.right + 8;
  }, [index]);
  return (
    <nav className="journey" aria-label="Where you are">
      <div className="chapter construct">
        <h2>Construct</h2>
        <ol className="steps">
          {steps.map((i, n) => (
            <li key={i}>
              <button
                ref={i === index ? current : undefined}
                type="button"
                className={['step-dot', state(i)].filter(Boolean).join(' ')}
                aria-current={i === index ? 'step' : undefined}
                aria-label={`Go to step ${n + 1}`}
                onClick={() => onJump(i)}
              >
                <Khatam />
                <span className="step-number">{n + 1}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
      <ol className="phases">
        {stages.map((s, i) =>
          s.kind === 'step' ? null : (
            <li key={s.kind} className="chapter">
              <button
                ref={i === index ? current : undefined}
                type="button"
                className={['phase', state(i)].filter(Boolean).join(' ')}
                aria-current={i === index ? 'step' : undefined}
                aria-label={`Go to ${PHASE_NAMES[s.kind].toLowerCase()}`}
                onClick={() => onJump(i)}
              >
                <span className="phase-name">{PHASE_NAMES[s.kind]}</span>
                <span className="phase-mark">
                  <Khatam />
                  {PHASE_MARKS[s.kind]}
                </span>
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

export function Broken({ message }: { message: string }) {
  return (
    <div className="player">
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
export function MissingDesign({
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
