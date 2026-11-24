import { NextPathLesson } from './LearningPathNav';
import { libraryHref } from './browsing';
import { pieceName } from './pieceNames';
import { learningPosition } from './learningPath';
import { LIBRARY, listed } from './library';
import type { SharedPresentation } from '@tastir/schema';
import { registerPageColoring } from '../agent/pageColoring';
import { PatternLoading } from './PatternLoading';
import { StepText } from './StepText';
import { DEFAULT_JALI, sameJali } from './jali';
import { JaliControls } from './JaliControls';
import { ExploreNext, makeVariation } from './ExploreNext';
import { StyleIcon } from './StyleIcon';
import './makeItYours.css';
import { lessonIndex, writeLessonRoute, type LessonPosition } from './routing';
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
import { encodeShared, MAX_FILE_BYTES, viewPatternFile } from '../editor/files';
import { planStep, play, playInk } from './animation';
import { fullView, growingFrame, tileView, width, type Rect } from './camera';
import {
  finishOf,
  pieceColors,
  tutorialColoring,
  type ColorAction,
  typeKey,
} from './coloring';
import { addDesign, type Design } from './designs';
import { draftOf, forgetDraft, keepDraft, type Draft } from './drafts';
import {
  historyOf,
  storedColours,
  styleColoursOf,
  styleColoursReducer,
  type StyleColours,
} from './styleColours';
import { Construction, RepeatedInk, Thumbnail } from './drawing';
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
import { Original, photoSrc } from './Original';
import { PhotoBadge, PhotoWipe } from './PhotoWipe';
import { LessonTitle, byOf, stepSources } from './LessonTitle';
import { FeedbackButton } from '../feedback/FeedbackButton';
import { basicFeedbackContext } from '../feedback/client';
import { ConstructionSource } from './ConstructionSource';
import { NextPattern, PatternMenu, PreviousPattern } from './PatternNav';
import { ColourPanel } from './ColourPanel';
import { Tiles } from './Tiles';
import { brushOf, refamily, rosetteCounts } from './rosettes';
import { ViewSwitch, viewAddress, type View } from './ViewSwitch';
import { Places, Variations } from './Variations';
import {
  byPlace,
  colorRepeat,
  colouredModel,
  placeFills,
  paintChosen,
  placeKey,
  ringsFor,
} from './placement';
import { PrintSheet, type Paper } from './PrintSheet';
import { useRemembered } from './remembered';
import { InfoTip } from './InfoTip';
import { SaveDesign } from './SaveDesign';
import { ShareLink } from './Sharing';
import { useCamera } from './useCamera';
import { useInking } from './useInking';
import { useModalFocus } from './useModalFocus';
import {
  banded,
  shownStyle,
  stylesFor,
  Wall,
  WALL_STYLES,
  type WallStyle,
} from './Wall';
import { WallControls } from './WallControls';
import { PlayerSettings } from './PlayerSettings';
import { DEFAULT_PEN } from './pen';
import { useModel } from './workerClient';

import { setStayGuard } from './routing';
import { Khatam, PHASE_MARKS, PHASE_NAMES } from './khatam';
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
  return pieceName(model.pattern.types[i]);
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

/** Whether the screen matches a media query, following it as it changes. */
function useMedia(query: string): boolean {
  const read = () =>
    typeof window.matchMedia === 'function' && window.matchMedia(query).matches;
  const [matches, setMatches] = useState(read);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const list = window.matchMedia(query);
    const onChange = () => setMatches(list.matches);
    list.addEventListener?.('change', onChange);
    return () => list.removeEventListener?.('change', onChange);
  }, [query]);
  return matches;
}

/** Whether the screen is narrow enough that the panel goes below the wall
 * (styles.css, max-width 1100px). */
const useNarrow = () => useMedia('(max-width: 1100px)');

/** Whether Back and Next are the fixed bar of a phone (styles.css,
 * max-width 760px). */
const usePhone = () => useMedia('(max-width: 760px)');

/** The colours a learner gave their own pattern when drawing along. */
function keptColoring(address: string) {
  if (!address.startsWith('mine/')) return undefined;
  return getPattern(address.slice('mine/'.length))?.wall?.coloring;
}

/** Whether a saved design holds just what the player shows now. */
function sameDesign(
  design: Design,
  now: Pick<
    Design,
    'inked' | 'coloring' | 'colorings' | 'look' | 'grout' | 'jali' | 'pen'
  >,
): boolean {
  const sorted = (chosen: Readonly<Record<string, string>>) =>
    JSON.stringify(Object.entries(chosen).sort(([a], [b]) => (a < b ? -1 : 1)));
  return (
    JSON.stringify(design.inked ?? null) ===
      JSON.stringify(now.inked ?? null) &&
    design.coloring.palette === now.coloring.palette &&
    design.coloring.method === now.coloring.method &&
    design.coloring.rosettes === now.coloring.rosettes &&
    JSON.stringify(design.coloring.finish ?? null) ===
      JSON.stringify(now.coloring.finish ?? null) &&
    JSON.stringify(design.coloring.squareBands) ===
      JSON.stringify(now.coloring.squareBands) &&
    sorted(design.coloring.chosen) === sorted(now.coloring.chosen) &&
    JSON.stringify(design.colorings ?? {}) ===
      JSON.stringify(now.colorings ?? {}) &&
    design.look === now.look &&
    design.grout === now.grout &&
    sameJali(design.jali, now.jali)
  );
}

/** Where a tutorial opens: at its first step, or at the finished wall. */
/** Where the player opens: the first step, the repeat (after drawing
 * along), or the finished wall. */
export type Start = 'beginning' | 'repeat' | 'result';

/** Preserve an explicit progressive-ink preference; upgrade the old default. */
function legacyInkMode(): InkMode {
  try {
    return JSON.parse(localStorage.getItem('tastir.inkMode') ?? 'null') ===
      'asYouGo'
      ? 'asYouGo'
      : 'guide';
  } catch {
    return 'guide';
  }
}

type MakeTab = 'look' | 'pieces' | 'more';

/** Where Letter is the usual paper: the United States, Canada, Mexico and
 * much of Central and South America, and the Philippines. */
const LETTER = new Set([
  'US',
  'CA',
  'MX',
  'PH',
  'CL',
  'CO',
  'VE',
  'CR',
  'GT',
  'PA',
  'SV',
  'DO',
  'PR',
  'NI',
  'HN',
  'BO',
  'BZ',
]);
/** The paper of the learner's country, from the browser's languages. */
function localPaper(): Paper {
  const tags =
    typeof navigator === 'undefined'
      ? []
      : [...(navigator.languages ?? []), navigator.language];
  for (const tag of tags) {
    const region = /-([A-Z]{2})\b/i.exec(tag ?? '')?.[1]?.toUpperCase();
    if (region) return LETTER.has(region) ? 'Letter' : 'A4';
  }
  return 'A4';
}

/** Whether the learner left Make it yours open on a phone. */
const MAKE_OPEN_KEY = 'tastir.makeOpen';
function keptMakeOpen(): boolean | undefined {
  try {
    const v = window.localStorage.getItem(MAKE_OPEN_KEY);
    return v === null ? undefined : v === '1';
  } catch {
    return undefined;
  }
}

export function Player({
  model: full,
  start: asked = 'beginning',
  design: opened,
  address: given,
  banner,
  reviewIndex,
  presentation,
  position,
  lessonColourFirst,
  carried,
}: {
  model: Model;
  /** The design a finished wall's address carried (#/id/result?d=…). */
  carried?: Draft;
  /** A line over the workspace, such as a shared pattern's Keep a copy. */
  banner?: React.ReactNode;
  start?: Start;
  /** A saved design to open, at the wall with its inking and colors. */
  design?: Design;
  /** Where the tutorial lives: its id in the library, or mine/<id> for
   * the learner's own pattern. */
  address?: string;
  /** An isolated owner review uses address="shared", which disables progress autosaves. */
  reviewIndex?: number;
  presentation?: SharedPresentation;
  position?: LessonPosition;
  lessonColourFirst?: boolean;
}) {
  // Helper lines (construction lines the pattern never runs along) are
  // left out unless the learner asks for them.
  const [showHelpers, setShowHelpers] = useRemembered<boolean>(
    'showHelpers',
    false,
    { override: presentation?.showHelpers, persist: given !== 'shared' },
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
  const [colourFirst, setColourFirst] = useState(
    presentation?.colourFirst ?? lessonColourFirst ?? false,
  );
  const stages = useMemo(
    () => stagesOf(tutorial, colourFirst),
    [tutorial, colourFirst],
  );
  // How many copies of the tile the repeat lays: so many along each
  // slide, or the whole wall.
  const [copies, setCopies] = useState<Copies>(presentation?.copies ?? 'wall');
  // Watching again, the lesson opens at the step the learner left.
  const [resumedAt, setResumedAt] = useState(() =>
    start === 'beginning' &&
    !sharedView &&
    (position === undefined || position === 'beginning')
      ? lessonAt(address, stagesOf(tutorial))
      : undefined,
  );
  const [index, setIndex] = useState(
    () =>
      (presentation
        ? Math.max(
            0,
            Math.min(
              presentation.index,
              stagesOf(tutorial, presentation.colourFirst).length - 1,
            ),
          )
        : undefined) ??
      (reviewIndex === undefined
        ? undefined
        : Math.max(0, Math.min(reviewIndex, stagesOf(tutorial).length - 1))) ??
      (position !== undefined && position !== 'beginning'
        ? lessonIndex(position, stagesOf(tutorial).length)
        : undefined) ??
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
  const [speed, setSpeed] = useState<number>(presentation?.speed ?? 1);
  const [playing, setPlaying] = useState(
    start === 'beginning' &&
      resumedAt === undefined &&
      reviewIndex === undefined &&
      typeof position !== 'number',
  );
  const plateRef = useRef<HTMLElement>(null);
  const clock = useRef<{ index: number; remaining: number } | undefined>(
    undefined,
  );
  const [reduced, setReduced] = useState(
    () => prefersReducedMotion() || presentation?.reduced === true,
  );
  const [showNames, setShowNames] = useRemembered<boolean>('showNames', false, {
    override: presentation?.showNames,
    persist: !sharedView,
  });
  const [inkMode, setInkMode] = useRemembered<InkMode>(
    'inkMode.v2',
    legacyInkMode(),
    { override: presentation?.inkMode, persist: !sharedView },
  );
  const asYouGo = inkMode === 'asYouGo';

  // A design not yet named, kept from the learner's first change: it comes
  // back when they return, until they save it or go back to the pattern's
  // own colours.
  const [draft] = useState(() =>
    opened || sharedView ? undefined : (carried ?? draftOf(address)),
  );
  const inking = useInking(model, opened?.inked ?? draft?.inked);
  // The ink stage shows the one unit the ink makes: the whole panel, when
  // the tutorial names one.
  const inkModel = useMemo(
    () => (inking.editing ? inking.shown : asPanel(inking.shown)),
    [inking.editing, inking.shown],
  );
  // A pattern whose bands cannot weave is never shown woven: a saved
  // interlace look falls back to plain bands.
  const wallStyles = stylesFor(tutorial.pattern.woven);
  const [wallStyle, setWallStyle] = useState<WallStyle>(() =>
    shownStyle(
      opened?.look ?? draft?.look ?? tutorial.pattern.look,
      tutorial.pattern.woven,
    ),
  );
  // Each wall style keeps its own colours (STYLE.5). The style coloured
  // now: the wall's, or a glaze style while one tile is coloured.
  const [colourStyle, setColourStyle] = useState<WallStyle>(wallStyle);
  const [styleColours, styleDispatch] = useReducer(
    styleColoursReducer,
    model,
    (m): StyleColours =>
      styleColoursOf(
        // A pattern drawn along and coloured keeps its colours.
        opened?.coloring ??
          draft?.coloring ??
          keptColoring(address) ??
          tutorialColoring(m),
        opened?.colorings ?? draft?.colorings,
      ),
  );
  const colorHistory = historyOf(styleColours, colourStyle);
  const rawColorDispatch = (action: ColorAction) =>
    styleDispatch({ style: colourStyle, action });
  // The pattern as the learner colours it: ring by ring, by shape or by
  // place, with as many rosettes taking turns as they chose.
  const coloured = useMemo(
    () => colouredModel(inking.shown, colorHistory.now),
    [inking.shown, colorHistory.now],
  );
  const colorDispatch = (action: ColorAction) => {
    const bandType = colorHistory.now.squareBands?.typeId;
    const replacesBands =
      action.kind === 'paint' &&
      !!bandType &&
      inking.shown.pattern.types.some(
        (type) => type.name === bandType && typeKey(type) === action.type,
      );
    if (
      action.kind === 'paint' &&
      (replacesBands ||
        Object.keys(colorHistory.now.chosen).some((key) =>
          key.includes('#placement'),
        ))
    ) {
      rawColorDispatch({
        kind: 'reset',
        to: {
          ...colorHistory.now,
          chosen: paintChosen(
            coloured,
            colorHistory.now,
            action.type,
            action.color,
          ),
          ...(replacesBands ? { squareBands: undefined } : {}),
        },
      });
    } else rawColorDispatch(action);
  };
  // Under bands, the colours keep clear of the bands' own (STYLE.4).
  const colors = useMemo(() => {
    if (!banded(colourStyle)) return pieceColors(coloured, colorHistory.now);
    const f = finishOf(coloured, colorHistory.now);
    return pieceColors(coloured, colorHistory.now, {
      band: f.band,
      edge: f.lines,
    });
  }, [coloured, colorHistory.now, colourStyle]);
  // Fills by placement, when the tutorial colors same shapes differently.
  const fill = useMemo(() => {
    if (!byPlace(coloured)) return undefined;
    if (!banded(colourStyle)) return placeFills(coloured, colorHistory.now);
    const f = finishOf(coloured, colorHistory.now);
    return placeFills(coloured, colorHistory.now, {
      band: f.band,
      edge: f.lines,
    });
  }, [coloured, colorHistory.now, inking.shown, colourStyle]);
  const [place, setPlace] = useState<{ piece: number; i: number; j: number }>();
  // The colour a click paints with, when colouring ring by ring.
  const [brush, setBrush] = useState<string>();
  // A new palette starts the brush on its own first glaze.
  useEffect(() => setBrush(undefined), [colorHistory.now.palette]);
  const [hovered, setHovered] = useState<number>();
  // The ring pointed at in the colour panel, lit on the wall.
  const [lit, setLit] = useState<string>();
  const [selected, setSelected] = useState<number>();
  useLayoutEffect(() => {
    if (
      !import.meta.env.DEV ||
      !import.meta.env.VITE_TASTIR_AGENT ||
      stage.kind !== 'color'
    )
      return;
    return registerPageColoring({
      model: inking.shown,
      history: colorHistory,
      style: wallStyle,
      selected: place,
      // A named copy does not switch the active design or its route/history.
      saveNew: (name) => addDesign({ ...designFields(), name }),
      dispatch: colorDispatch,
      route: decodeURIComponent(window.location.hash.replace(/^#\/?/, '')),
    });
  });
  const [grout, setGrout] = useState(opened?.grout ?? draft?.grout ?? 1);
  const [jali, setJali] = useState(opened?.jali ?? draft?.jali ?? DEFAULT_JALI);
  // The lines style is watercolour, with no pen to choose (STYLE.1). A
  // design saved with an older pen opens in watercolour too.
  const pen = DEFAULT_PEN;
  // The design being worked on: the one opened, or the last one saved.
  const [design, setDesign] = useState(opened);
  const designFields = () => ({
    tutorial: address,
    inked: inking.inked,
    ...storedColours(styleColours),
    look: wallStyle,
    grout,
    ...(wallStyle === 'jali' || design?.jali !== undefined || !sameJali(jali)
      ? { jali }
      : {}),
  });
  const [fileError, setFileError] = useState<string>();
  const downloadPattern = () => {
    setFileError(undefined);
    try {
      const source = mine
        ? getPattern(address.slice('mine/'.length))
        : undefined;
      const basedOn =
        source?.basedOn ??
        (!mine && !sharedView
          ? {
              tutorial: address,
              title: full.tutorial.title,
              step: full.tutorial.steps.at(-1)?.id ?? 0,
            }
          : undefined);
      const { tutorial: _address, ...fields } = designFields();
      const file = viewPatternFile(
        full.tutorial,
        {
          name: design?.name ?? tutorial.title,
          ...fields,
        },
        basedOn,
      );
      const blob = new Blob([`${JSON.stringify(file, null, 2)}\n`], {
        type: 'application/json',
      });
      if (blob.size > MAX_FILE_BYTES)
        throw new Error(
          'This pattern file is too large to reopen (8 MB maximum).',
        );
      download(
        blob,
        `${tutorial.id.replace(/[^a-z0-9_-]/gi, '-')}.tastir.json`,
      );
    } catch (error) {
      setFileError(
        error instanceof Error
          ? error.message
          : 'This pattern file could not be created. Try again.',
      );
    }
  };
  // Until it has a name, every change is kept as a draft; back to the
  // pattern's own, there is nothing to keep.
  const [draftKept, setDraftKept] = useState<boolean>();
  const own = useMemo(
    (): Design => ({
      id: '',
      name: '',
      tutorial: address,
      coloring: tutorialColoring(model),
      look: shownStyle(tutorial.pattern.look, tutorial.pattern.woven),
      grout: 1,
      created: '',
      updated: '',
    }),
    [address, model, tutorial.pattern.look, tutorial.pattern.woven],
  );
  const draftFields = designFields();
  const draftKey = JSON.stringify(draftFields);
  useEffect(() => {
    if (design || sharedView) return;
    if (sameDesign(own, draftFields)) {
      forgetDraft(address);
      setDraftKept(undefined);
    } else setDraftKept(keepDraft(draftFields));
    // The fields change with every render; their contents are the key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey, design, sharedView, own, address]);
  // The finished wall's address carries the design, so the address bar
  // can be copied and shared as it is: #/id/result?d=… (a library
  // pattern only; the pattern's own colours need no code).
  const [designCode, setDesignCode] = useState<string>();
  useEffect(() => {
    if (design || sharedView || mine || sameDesign(own, draftFields)) {
      setDesignCode(undefined);
      return;
    }
    let live = true;
    const { tutorial: _t, ...fields } = draftFields;
    const t = setTimeout(() => {
      encodeShared({
        library: address,
        design: { name: tutorial.title, ...fields },
      }).then(
        (code) => live && setDesignCode(code),
        () => live && setDesignCode(undefined),
      );
    }, 300);
    return () => {
      live = false;
      clearTimeout(t);
    };
    // The fields change with every render; their contents are the key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey, design, sharedView, mine, own, address]);
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
  const phone = usePhone();
  const dockPatterns = useMedia('(min-width: 1000px)');
  const [sidebarOpen, setSidebarOpen] = useRemembered<boolean>(
    'patternSidebar',
    false,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const patternsOpen = dockPatterns ? sidebarOpen : drawerOpen;
  const setPatternsOpen = dockPatterns ? setSidebarOpen : setDrawerOpen;
  useEffect(() => {
    if (!changed) return;
    // Reloading or closing the tab: the browser's own question.
    const onUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [changed]);
  const draftNote =
    design || sharedView || draftKept === undefined ? null : draftKept ? (
      <p className="hint draft-note" role="status">
        {draft ? 'Your changes from last time are back. ' : ''}Your changes are
        kept in this browser until you save them as a design.
      </p>
    ) : (
      <p className="hint draft-note refused" role="alert">
        This browser cannot keep your changes. Use “Copy a share link” and keep
        the link before you leave.
      </p>
    );
  const keepSaved = (saved: Design) => {
    setDesign(saved);
    forgetDraft(address);
    // Its own address, so a reload or a bookmark opens the design.
    window.history.replaceState(null, '', `#/${address}/design/${saved.id}`);
  };
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
      onSaved={keepSaved}
    />
  );
  const [paper, setPaper] = useState<Paper>(localPaper);
  const [printing, setPrinting] = useState(false);
  // The photo of the real wall is for reference: it opens beside the wall
  // from The real wall in Make it yours (or a shared link that showed it).
  const [comparing, setComparing] = useState(
    presentation?.showOriginal ?? false,
  );
  // Make it yours floats over the finished wall; it can be hidden to see
  // the wall whole.
  const [makeOpen, setMakeOpen] = useState(true);
  // On a phone the panel starts as a slim bar, so the wall has the screen;
  // a tap opens it upwards.
  // Opened once, it opens again: the learner's choice is kept.
  const [makePeek, setMakePeekState] = useState(
    () => phone && keptMakeOpen() !== true,
  );
  const setMakePeek = (peek: boolean) => {
    setMakePeekState(peek);
    try {
      window.localStorage.setItem(MAKE_OPEN_KEY, peek ? '0' : '1');
    } catch {
      // Not kept: a phone folds it again next time.
    }
  };
  // The real wall's photo, wiped across ours by a golden handle.
  const [wiping, setWiping] = useState(false);
  // The real wall: the badge on the wall and The real wall in More do the
  // same thing, showing the photo beside the wall (or closing it, from
  // either view); the photo's own tools lay it over the wall to wipe.
  const photoOpen = comparing || wiping;
  const togglePhoto = () => {
    if (photoOpen) {
      setComparing(false);
      setWiping(false);
    } else setComparing(true);
  };
  // Make it yours shows one tab at a time: colour first, as most people
  // come to colour.
  const [makeTab, setMakeTab] = useState<MakeTab>('look');
  const [variationRefused, setVariationRefused] = useState(false);
  const stopPrinting = useCallback(() => setPrinting(false), []);
  const exportSvg = () =>
    wallSvg(inking.shown, colors, {
      look: wallStyle,
      grout,
      fill,
      jali,
      pen,
      finish: finishOf(inking.shown, colorHistory.now),
    });
  const svgRef = useRef<SVGSVGElement>(null);
  const running = useRef<Animation[]>([]);
  const reversing = useRef(false);
  const navigationEpoch = useRef(0);
  // Set when the next render should animate its step in: on load and Next.
  const animateNext = useRef(typeof position !== 'number');
  const historyMode = useRef<'push' | 'replace'>('replace');
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
  const initialConstructionView = useRef(
    stage.kind === 'step' || stage.kind === 'ink'
      ? presentation?.camera
      : undefined,
  );
  const wallViewRef = useRef<Rect | undefined>(
    stage.kind === 'color' || (stage.kind === 'repeat' && colourFirst)
      ? presentation?.camera
      : undefined,
  );
  const resetWallRef = useRef<(() => void) | undefined>(undefined);
  const wallSectionRef = useRef<HTMLDivElement>(null);
  const colorsSectionRef = useRef<HTMLElement>(null);
  const exportSectionRef = useRef<HTMLElement>(null);
  const keepWallView = useCallback((view: Rect) => {
    wallViewRef.current = view;
  }, []);
  const onConstruction = stage.kind === 'step' || stage.kind === 'ink';
  const camera = useCamera(frame, svgRef, {
    stage: index,
    initialView: initialConstructionView.current,
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
    historyMode.current = 'push';
    advance();
  }, [advance]);

  const back = useCallback(() => {
    setPlaying(false);
    // A second Back while undrawing finishes the undrawing at once.
    if (reversing.current) return settle();
    settle();
    if (index === 0) return;
    historyMode.current = 'push';
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
    const epoch = ++navigationEpoch.current;
    reversing.current = true;
    running.current = undraw;
    void Promise.allSettled(undraw.map((a) => a.finished)).then(() => {
      if (epoch !== navigationEpoch.current) return;
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
      historyMode.current = 'push';
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
          'input, textarea, select, button, summary, a, [contenteditable]:not([contenteditable="false"]), [role="dialog"], [role="alertdialog"]',
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
  const destinationGuide =
    inkMode === 'guide' &&
    stage.kind === 'step' &&
    stage.beat ===
      Math.max(0, ...beats.filter((b) => !b.hidden).map((b) => b.beat));
  let label: string;
  let hint: string | undefined;
  let text: string;
  let picture: React.ReactNode;
  // The tutorials this step follows, to check the drawing against.
  let sources: ReturnType<typeof stepSources> = [];
  if (stage.kind === 'step') {
    const beat = beats[stage.beat - 1];
    sources = beat ? stepSources(tutorial, beat.step) : [];
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
        inkGuide={destinationGuide}
        guideInk={inkModel.pattern.ink}
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
          initialView={wallViewRef.current}
          onCameraChange={keepWallView}
          resetRef={resetWallRef}
          colors={colors}
          fill={fill}
          finish={finishOf(coloured, colorHistory.now)}
          repeat={colorRepeat(coloured)}
          look={wallStyle}
          grout={grout}
          jali={jali}
          pen={pen}
          onHover={setHovered}
          onPick={pick}
          enter={enter}
          lit={lit}
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
  // At the end: the pattern is ready, and Save and Share come first.
  const ready = index === last;
  const pathFinish =
    ready && !mine && !sharedView
      ? learningPosition(address, listed(LIBRARY))
      : undefined;
  const readyRef = useRef<HTMLElement>(null);
  // The same, in the step bar at the end: buttons with tooltips, and
  // what they say shown briefly above them.
  const endSave = sharedView ? null : (
    <SaveDesign
      compact
      title={tutorial.title}
      design={design}
      lost={inking.lost}
      changed={changed}
      fields={designFields}
      onSaved={keepSaved}
    />
  );
  const sharePresentation = (): SharedPresentation => ({
    index,
    speed: speed as SharedPresentation['speed'],
    inkMode,
    showNames,
    showOriginal: comparing,
    showHelpers,
    reduced,
    colourFirst,
    copies: copies === 'wall' ? 'wall' : [copies[0], copies[1]],
    ...(stage.kind === 'step' || stage.kind === 'ink'
      ? { camera: camera.view }
      : (stage.kind === 'color' || (stage.kind === 'repeat' && colourFirst)) &&
          copies === 'wall' &&
          wallViewRef.current
        ? { camera: wallViewRef.current }
        : {}),
  });
  const endShare = sharedView ? null : (
    <ShareLink
      presentation={sharePresentation}
      compact
      address={address}
      name={design?.name ?? tutorial.title}
      fields={() => {
        const { tutorial: _t, ...rest } = designFields();
        return rest;
      }}
    />
  );
  const shareLink = sharedView ? null : (
    <ShareLink
      presentation={sharePresentation}
      address={address}
      name={design?.name ?? tutorial.title}
      fields={() => {
        const { tutorial: _t, ...rest } = designFields();
        return rest;
      }}
    />
  );
  // The whole wall is shown, with its styles.
  const onWall =
    copies === 'wall' &&
    (colourFirst ? stage.kind === 'repeat' : stage.kind === 'color');
  // One tile is coloured as tile; the wall in its own style.
  useLayoutEffect(
    () => setColourStyle(onWall ? wallStyle : 'tiles'),
    [onWall, wallStyle],
  );

  // The style samples show a few pieces round the middle of the pattern,
  // about a dozen whatever their size (at most a little over one repeat),
  // so grout, bands, the weave and the lattice can be told apart.
  const sampleView = useMemo(() => {
    const { cell, pieces } = inking.shown.pattern;
    const x = cell.origin.x + (cell.u.x + cell.v.x) / 2;
    const y = cell.origin.y + (cell.u.y + cell.v.y) / 2;
    const area = Math.abs(cell.u.x * cell.v.y - cell.u.y * cell.v.x);
    const piece = Math.sqrt(area / Math.max(1, pieces.length));
    const r = Math.min(
      2 * piece,
      0.8 *
        Math.max(
          Math.hypot(cell.u.x, cell.u.y),
          Math.hypot(cell.v.x, cell.v.y),
        ),
    );
    return { minX: x - r, minY: y - r, maxX: x + r, maxY: y + r };
  }, [inking.shown]);
  // The samples wait until the wall has shown: in the densest patterns
  // they take a few tenths of a second, which need not hold the wall up.
  const [samplesFor, setSamplesFor] = useState<Model>();
  useEffect(() => {
    if (!onWall) return undefined;
    // After the next frame is painted, not merely after this render.
    let later: ReturnType<typeof setTimeout> | undefined;
    const frame = requestAnimationFrame(() => {
      later = setTimeout(() => setSamplesFor(inking.shown), 0);
    });
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(later);
    };
  }, [onWall, inking.shown]);
  const samplesReady = samplesFor === inking.shown;
  // Drawn once per pattern, colouring and finish, not on every slide of
  // the width or point at a ring.
  const styleSamples = useMemo(
    () =>
      onWall && samplesReady
        ? Object.fromEntries(
            WALL_STYLES.map((look) => [
              look,
              <Thumbnail
                key={look}
                model={inking.shown}
                coloring={historyOf(styleColours, look).now}
                look={look}
                // Bands drawn wider than the wall's, so they read at
                // button size.
                grout={banded(look) ? 2 : 1}
                jali={jali}
                pen={pen}
                view={sampleView}
              />,
            ]),
          )
        : undefined,
    [onWall, samplesReady, inking.shown, styleColours, jali, pen, sampleView],
  );
  const photos = tutorial.photos ?? [];
  const showOriginal = comparing && onWall && photos.length > 0;
  // The colours, at the top of the panel while colouring, so they are the
  // first thing in view.
  // On the finished wall, how to colour is said behind an ⓘ beside the
  // heading, not as a paragraph over the colours.
  const colourHint =
    ready && onWall && !sharedView ? (
      <InfoTip label="How to colour">
        <StepText text={text} />
      </InfoTip>
    ) : null;
  // Make it yours shows the palettes in Look and the way to colour with the
  // pieces in Pieces; every other page shows both together.
  const coloursFor = (parts: 'all' | 'palette' | 'pieces') =>
    !onWall || wallStyle !== 'jali' ? (
      <section ref={colorsSectionRef}>
        {colourHint && parts !== 'palette' ? (
          <div className="section-head">
            <h2>{parts === 'pieces' ? 'Pieces' : 'Colors'}</h2>
            {colourHint}
          </div>
        ) : (
          <h2>{parts === 'pieces' ? 'Pieces' : 'Colors'}</h2>
        )}
        <ColourPanel
          parts={parts}
          paper={onWall && wallStyle === 'lines'}
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
          onLight={setLit}
          onReset={() =>
            colorDispatch({
              kind: 'reset',
              to: tutorialColoring(model),
            })
          }
        />
      </section>
    ) : null;
  const colorsSection = coloursFor('all');

  /** Jumps straight to a stage from the journey, without playing it in. */
  const jump = (to: number) => {
    setPlaying(false);
    if (to === index) return;
    historyMode.current = 'push';
    navigationEpoch.current++;
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
    } else {
      historyMode.current = 'push';
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
  // Browser navigation restores the live lesson rather than creating a fresh player.
  const routePositionKey = `${position}:${lessonColourFirst}`;
  const seenPosition = useRef(routePositionKey);
  const restoringRoute = useRef(false);
  useLayoutEffect(() => {
    if (position === undefined || seenPosition.current === routePositionKey)
      return;
    seenPosition.current = routePositionKey;
    const target = lessonIndex(position, stages.length);
    if (target === index && colourFirst === (lessonColourFirst ?? false))
      return;
    restoringRoute.current = true;
    setColourFirst(lessonColourFirst ?? false);
    navigationEpoch.current++;
    setPlaying(false);
    clock.current = undefined;
    reversing.current = false;
    running.current.forEach((animation) => animation.cancel?.());
    running.current = [];
    animateNext.current = false;
    setForward(false);
    setIndex(target);
    // Only a new browser position restores the stage; player state changes publish below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position, lessonColourFirst]);
  useEffect(() => {
    if (position === undefined || design || sharedView) return;
    if (restoringRoute.current) {
      restoringRoute.current = false;
      return;
    }
    const want =
      index === last
        ? `#/${address}/result${designCode ? `?d=${designCode}` : ''}`
        : `#/${address}/watch/${index + 1}${colourFirst ? '?order=color' : ''}`;
    writeLessonRoute(want, historyMode.current);
    historyMode.current = 'replace';
  }, [
    index,
    last,
    position,
    design,
    sharedView,
    address,
    colourFirst,
    designCode,
  ]);

  const copiesChooser = (
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
  );
  const designsNav = (
    <>
      {browsing ? (
        <Variations
          id={address}
          // Another variation opens at the same stage: the colours, the
          // repeat, or the lesson's start.
          at={
            colorStage
              ? 'result'
              : stage.kind === 'repeat'
                ? 'repeat'
                : 'beginning'
          }
          guard={(to) => {
            if (!changed) return false;
            setLeaving(to);
            return true;
          }}
        />
      ) : null}
      {browsing ? (
        <Places
          id={address}
          // The same steps in another place's colours: the same stage.
          at={
            colorStage
              ? 'result'
              : stage.kind === 'repeat'
                ? 'repeat'
                : 'beginning'
          }
          guard={(to) => {
            if (!changed) return false;
            setLeaving(to);
            return true;
          }}
        />
      ) : null}
    </>
  );
  const feedbackProps = {
    context: {
      ...basicFeedbackContext(
        address,
        tutorial.title,
        colorStage ? 'result' : 'watch',
      ),
      stage: stage.kind,
      index,
      stepIds: stage.kind === 'step' ? [beats[stage.beat - 1]?.step ?? 1] : [],
      label,
      instruction: text.slice(0, 8192),
    },
    tutorial,
    pause: () => setPlaying(false),
    board: () =>
      svgRef.current ??
      plateRef.current?.querySelector<SVGSVGElement>('svg') ??
      null,
    snapshot: () => ({
      draft: inking.shown.tutorial,
      coloring: colorHistory.now,
    }),
  };
  // REDESIGN.4: on the finished wall the wall fills the page and Make it
  // yours floats over it, holding everything the side panel held.
  const wallPage = ready && onWall && !sharedView;
  const wallColours = [...new Set(Object.values(colors))];
  const lastShown = shown[shown.length - 1] ?? 1;
  const makeTabs: readonly (readonly [MakeTab, string])[] = [
    ['look', 'Look'],
    ['pieces', 'Pieces'],
    ['more', 'More'],
  ];
  const nextLabel = pathFinish
    ? pathFinish.next
      ? ['Next', `Next lesson: ${pathFinish.next.lesson.focus}`]
      : ['Path', 'Your learning path']
    : ['Variation', 'Make a variation: a copy of your own, in the editor'];
  const makePanel = (
    <aside
      className={makePeek ? 'make-panel peek' : 'make-panel'}
      aria-label="Make it yours"
    >
      <div className="make-top">
        <h2>
          <button
            type="button"
            className="make-title"
            aria-expanded={!makePeek}
            aria-controls="make-body"
            title={makePeek ? 'Open Make it yours' : 'Fold Make it yours'}
            onClick={() => setMakePeek(!makePeek)}
          >
            Make it yours
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 15l6-6 6 6" />
            </svg>
          </button>
        </h2>
        <button
          type="button"
          className="make-hide"
          aria-label="Hide Make it yours to see the whole wall"
          title="Hide this panel"
          onClick={() => setMakeOpen(false)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
      <div className="make-tabs" role="tablist" aria-label="Make it yours">
        {makeTabs.map(([tab, name]) => (
          <button
            key={tab}
            type="button"
            role="tab"
            id={`make-tab-${tab}`}
            aria-controls="make-body"
            aria-selected={makeTab === tab}
            tabIndex={makeTab === tab ? 0 : -1}
            onClick={() => setMakeTab(tab)}
            onKeyDown={(e) => {
              const at = makeTabs.findIndex(([t]) => t === makeTab);
              const step =
                e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
              if (!step) return;
              e.preventDefault();
              e.stopPropagation();
              const [to] =
                makeTabs[(at + step + makeTabs.length) % makeTabs.length]!;
              setMakeTab(to);
              document.getElementById(`make-tab-${to}`)?.focus();
            }}
          >
            {name}
          </button>
        ))}
      </div>
      <div
        className="make-body"
        id="make-body"
        role="tabpanel"
        aria-labelledby={`make-tab-${makeTab}`}
      >
        {makeTab === 'pieces' ? (
          <>
            {coloursFor('pieces') ?? (
              <p className="hint">A jali screen is cut, not coloured.</p>
            )}
          </>
        ) : makeTab === 'look' ? (
          <>
            {/* Coloured before it was repeated: how many copies to lay. */}
            {stage.kind === 'repeat' ? copiesChooser : null}
            {coloursFor('palette')}
            <WallControls
              parts="style"
              heading="Style"
              style={wallStyle}
              styles={wallStyles}
              onStyle={(style) => {
                setWallStyle(style);
                if (style === 'jali' && grout < 0.5) setGrout(0.5);
                if (style === 'lines' && grout < 0.25) setGrout(0.25);
              }}
              grout={grout}
              onGrout={setGrout}
              sample={(look) => <StyleIcon style={look} colors={wallColours} />}
            />
            <WallControls
              parts="finish"
              heading=""
              style={wallStyle}
              styles={wallStyles}
              onStyle={setWallStyle}
              grout={grout}
              onGrout={setGrout}
              finish={finishOf(coloured, colorHistory.now)}
              onFinish={(change) =>
                colorDispatch({ kind: 'finish', ...change })
              }
              sample={() => null}
            />
            {wallStyle === 'jali' ? (
              <JaliControls appearance={jali} onChange={setJali} />
            ) : null}
          </>
        ) : (
          <>
            {browsing ? <div className="make-designs">{designsNav}</div> : null}
            {photos[0] ? (
              <section className="make-real">
                <h2>The real wall</h2>
                <button
                  type="button"
                  className="make-photo-tile"
                  aria-pressed={photoOpen}
                  title="A photo of the real pattern, beside the wall"
                  onClick={togglePhoto}
                >
                  {photoSrc(photos[0]) ? (
                    <img src={photoSrc(photos[0])} alt="" />
                  ) : null}
                  <span>
                    {photoOpen ? 'Hide the original' : 'Show the original'}
                  </span>
                </button>
              </section>
            ) : null}
            {tutorial.verification?.status === 'unverified' ? (
              <details className="verification-note">
                <summary>Historical match unverified</summary>
                <p>{tutorial.verification.note}</p>
              </details>
            ) : null}
            <ConstructionSource tutorial={tutorial} />
            <section className="make-files">
              <h2>Print and files</h2>
              <div className="make-tiles">
                {/* One click: the paper is the learner's own country's
                    (Letter in most of the Americas, A4 elsewhere), and the
                    browser's print dialog can still change it. */}
                <MakeTile
                  icon="print"
                  label="Print"
                  name="Print line sheet"
                  title={`Print a line sheet to draw on (${paper})`}
                  onClick={() => setPrinting(true)}
                />
                <MakeTile
                  icon="file"
                  label="Pattern file"
                  name="Download pattern file (.json)"
                  className="pattern-file-download"
                  onClick={downloadPattern}
                />
                <MakeTile
                  icon="vector"
                  label="SVG"
                  name="Download SVG"
                  onClick={() =>
                    download(svgBlob(exportSvg()), `${tutorial.id}.svg`)
                  }
                />
                <MakeTile
                  icon="image"
                  label="PNG"
                  name="Download PNG"
                  onClick={() =>
                    void pngBlob(exportSvg()).then((png) =>
                      download(png, `${tutorial.id}.png`),
                    )
                  }
                />
                {pathFinish && browsing ? (
                  <MakeTile
                    icon="variation"
                    label="Variation"
                    name="Make a variation"
                    title="A copy of this pattern of your own, opened in the editor"
                    onClick={() =>
                      setVariationRefused(!makeVariation(full.tutorial))
                    }
                  />
                ) : null}
              </div>
              <div className="make-links">
                <CopyHere
                  tutorial={tutorial}
                  address={address}
                  step={lastShown}
                  shownNumber={shown.length}
                  label="Copy into the editor"
                />
                <FeedbackButton {...feedbackProps} />
              </div>
            </section>
          </>
        )}
      </div>
      <div className="make-foot" role="group" aria-label="Your design">
        {pathFinish ? (
          <a
            className="make-next learning-advance"
            href={
              pathFinish.next
                ? `#/${pathFinish.next.lesson.id}/watch/1`
                : '#/learn'
            }
            title={nextLabel[1]}
          >
            {nextLabel[0]}
            <svg className="foot-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </a>
        ) : browsing ? (
          <button
            type="button"
            className="make-next"
            title={nextLabel[1]}
            onClick={() => setVariationRefused(!makeVariation(full.tutorial))}
          >
            {nextLabel[0]}
          </button>
        ) : null}
        <SaveDesign
          short
          pending={draftKept === true}
          title={tutorial.title}
          design={design}
          lost={inking.lost}
          changed={changed}
          fields={designFields}
          onSaved={keepSaved}
        />
        <ShareLink
          short
          presentation={sharePresentation}
          address={address}
          name={design?.name ?? tutorial.title}
          fields={() => {
            const { tutorial: _t, ...rest } = designFields();
            return rest;
          }}
        />
        <a
          className="button secondary make-3d"
          href={
            design
              ? `#/${address}/design/${design.id}/make`
              : `#/${address}/make`
          }
          aria-label="Make it in 3D"
          title="Make it in 3D"
        >
          <svg className="foot-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9" />
          </svg>
          3D
        </a>
      </div>
      {variationRefused ? (
        <p className="refused" role="alert">
          This browser could not save your copy. Free some storage and try
          again.
        </p>
      ) : null}
      {draftKept === false && !design ? draftNote : null}
      {fileError && (
        <p className="refused" role="alert">
          {fileError}
        </p>
      )}
    </aside>
  );
  return (
    <div
      className={`${colorStage ? 'player at-color' : 'player'}${browsing && dockPatterns && patternsOpen ? ' patterns-open' : ''}`}
      data-tastir-screen={
        import.meta.env.DEV
          ? design
            ? `${address}/design/${design.id}`
            : viewAddress(address, view).slice(2)
          : undefined
      }
    >
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
        {browsing ? (
          <PatternMenu
            id={address}
            view={view}
            open={patternsOpen}
            docked={dockPatterns}
            onToggle={() => setPatternsOpen(!patternsOpen)}
            onClose={() => {
              setPatternsOpen(false);
              document
                .querySelector<HTMLButtonElement>('.topbar .menu-button')
                ?.focus();
            }}
          />
        ) : null}
        <a
          className="home"
          aria-label="All patterns"
          href={libraryHref()}
          onClick={(e) => {
            if (!changed) return;
            e.preventDefault();
            setLeaving(libraryHref());
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
        <div className="pattern-heading">
          {browsing ? <PreviousPattern id={address} view={view} /> : <span />}
          <LessonTitle tutorial={tutorial} />
          {browsing ? <NextPattern id={address} view={view} /> : <span />}
        </div>
        {!wallPage && designsNav ? (
          <div className="player-designs">{designsNav}</div>
        ) : null}
        <div className="player-view-tools">
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
        </div>
        <div className="player-utilities">
          {wallPage ? null : <FeedbackButton iconOnly {...feedbackProps} />}
          <PlayerSettings
            speed={speed}
            setSpeed={setSpeed}
            inkMode={inkMode}
            setInkMode={setInkMode}
            reduced={reduced}
            setReduced={setReduced}
            showNames={showNames}
            setShowNames={setShowNames}
            showHelpers={showHelpers}
            setShowHelpers={setShowHelpers}
            hideId={import.meta.env.DEV && browsing ? address : undefined}
          />
          <ThemeSwitch />
        </div>
      </header>
      {banner}
      <div
        className={
          wallPage
            ? `workspace wall-page${makeOpen ? (makePeek ? ' make-open make-peek' : ' make-open') : ''}`
            : colorStage
              ? 'workspace with-panel'
              : 'workspace'
        }
      >
        <section ref={plateRef} className="plate-area">
          <main className={showOriginal ? 'stage comparing' : 'stage'}>
            {showOriginal ? (
              <Original
                photos={photos}
                onWipe={
                  wallPage
                    ? () => {
                        setComparing(false);
                        setWiping(true);
                      }
                    : undefined
                }
              />
            ) : null}
            {picture}
            {wallPage && wiping && !showOriginal && photos[0] ? (
              <PhotoWipe photo={photos[0]} />
            ) : null}
            {destinationGuide && (
              <span className="destination-guide-caption">
                Faint guide · the full inking reveal comes next
              </span>
            )}
          </main>
          {/* On the drawing itself, so the photo is hidden or shown where
              it is, on a phone as on a computer. */}
          {onWall && !wallPage && photos.length > 0 ? (
            <button
              type="button"
              className="original-toggle"
              aria-pressed={comparing}
              title="A photo of the real pattern, beside the wall"
              onClick={() => setComparing(!comparing)}
            >
              {comparing ? 'Hide the original' : 'Show the original'}
            </button>
          ) : null}
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
          ) : onWall ? (
            <button
              type="button"
              className="fit"
              aria-label="Reset view"
              title="Reset wall zoom and position"
              onClick={() => resetWallRef.current?.()}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
              </svg>
            </button>
          ) : null}
          {wallPage && photos[0] ? (
            <PhotoBadge
              photo={photos[0]}
              open={photoOpen}
              onToggle={togglePhoto}
            />
          ) : null}
          {wallPage && !makeOpen ? (
            <button
              type="button"
              className="make-show"
              onClick={() => setMakeOpen(true)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3v6M12 15v6M3 12h6M15 12h6" />
              </svg>
              Make it yours
            </button>
          ) : null}
        </section>
        {wallPage ? (makeOpen ? makePanel : null) : null}
        {wallPage ? null : (
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
                <ConstructionSource tutorial={tutorial} />
                {tutorial.verification?.status === 'unverified' ? (
                  <details className="verification-note">
                    <summary>Historical match unverified</summary>
                    <p>{tutorial.verification.note}</p>
                  </details>
                ) : null}
                {colorStage && narrow && !ready ? (
                  <>
                    {saveDesign}
                    {draftNote}
                  </>
                ) : null}
                <div className="instruction" aria-live="polite">
                  <StepText text={text} />
                </div>
                {sources.length ? (
                  <p className="step-source">
                    Source for this step:{' '}
                    {sources.map((c, i) => (
                      <span key={c.url}>
                        {i ? ' and ' : ''}
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noreferrer"
                          title={c.source}
                        >
                          {byOf(c)} <span aria-hidden="true">↗</span>
                        </a>
                      </span>
                    ))}
                    .
                  </p>
                ) : null}
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
                {stage.kind === 'repeat' ? copiesChooser : null}
              </div>
              {phone && !colorStage && !sharedView ? (
                <div className="lesson-share lesson-share-phone">
                  {endShare}
                </div>
              ) : null}
              <nav aria-label="Steps">
                <button
                  type="button"
                  className="quiet playback"
                  title={
                    playing
                      ? 'Pause (Space)'
                      : index === last
                        ? 'Replay from step 1 (Space)'
                        : 'Play (Space)'
                  }
                  onClick={togglePlayback}
                >
                  {playing ? 'Pause' : index === last ? 'Replay' : 'Play'}
                </button>
                <button
                  type="button"
                  className="secondary"
                  title="Previous step (←)"
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
                ) : pathFinish ? (
                  <a
                    className="next learning-advance"
                    href={
                      pathFinish.next
                        ? `#/${pathFinish.next.lesson.id}/watch/1`
                        : '#/learn'
                    }
                  >
                    {pathFinish.next ? 'Next lesson' : 'See the learning path'}
                  </a>
                ) : (
                  <button
                    type="button"
                    className="next"
                    title={ready ? undefined : 'Next step (→)'}
                    onClick={
                      ready
                        ? () => {
                            const card =
                              readyRef.current ??
                              document.querySelector<HTMLElement>(
                                '.end-actions',
                              );
                            card?.scrollIntoView?.({ block: 'nearest' });
                            card
                              ?.querySelector<HTMLElement>('button, input')
                              ?.focus();
                          }
                        : next
                    }
                    disabled={ready && sharedView}
                  >
                    {ready ? 'Save my design' : 'Next'}
                  </button>
                )}
              </nav>
            </footer>
            {colorStage ? (
              <aside className="side-panel" aria-label="The wall">
                {!narrow ? (
                  <nav className="side-panel-nav" aria-label="Wall sections">
                    {onWall ? (
                      <button
                        type="button"
                        onClick={() =>
                          wallSectionRef.current?.scrollIntoView?.({
                            behavior: 'smooth',
                            block: 'start',
                          })
                        }
                      >
                        Style
                      </button>
                    ) : null}
                    {!onWall || wallStyle !== 'jali' ? (
                      <button
                        type="button"
                        onClick={() =>
                          colorsSectionRef.current?.scrollIntoView?.({
                            behavior: 'smooth',
                            block: 'start',
                          })
                        }
                      >
                        Colors
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() =>
                        exportSectionRef.current?.scrollIntoView?.({
                          behavior: 'smooth',
                          block: 'start',
                        })
                      }
                    >
                      Export &amp; 3D
                    </button>
                  </nav>
                ) : null}
                {/* At the end on a computer or tablet, Save and Share are in the step
                  bar, where Next was; only a note about changes stays here. */}
                {ready && !phone ? draftNote : null}
                {/* On the finished wall its style and width come first; while
                  one tile is coloured, the colours do. */}
                {onWall ? (
                  <div ref={wallSectionRef} className="side-panel-anchor">
                    <WallControls
                      style={wallStyle}
                      styles={wallStyles}
                      onStyle={(style) => {
                        setWallStyle(style);
                        if (style === 'jali' && grout < 0.5) setGrout(0.5);
                        if (style === 'lines' && grout < 0.25) setGrout(0.25);
                      }}
                      grout={grout}
                      onGrout={setGrout}
                      finish={finishOf(coloured, colorHistory.now)}
                      onFinish={(change) =>
                        colorDispatch({ kind: 'finish', ...change })
                      }
                      sample={(look) => styleSamples?.[look]}
                    />
                  </div>
                ) : null}
                {onWall && wallStyle === 'jali' ? (
                  <JaliControls appearance={jali} onChange={setJali} />
                ) : null}
                {colorsSection}
                {ready && phone ? (
                  <section ref={readyRef}>
                    <h2>My design</h2>
                    {saveDesign}
                    {draftNote}
                    {shareLink}
                  </section>
                ) : null}
                {narrow || ready ? null : (
                  <section>
                    <h2>My design</h2>
                    {saveDesign}
                    {draftNote}
                  </section>
                )}
                <section ref={exportSectionRef} className="side-panel-anchor">
                  <h2>Take it with you</h2>
                  {ready ? null : shareLink}
                  <div className="export-tools">
                    <button
                      type="button"
                      className="secondary pattern-file-download"
                      onClick={downloadPattern}
                    >
                      <svg
                        width="19"
                        height="19"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M9 12l-2 3 2 3M15 12l2 3-2 3" />
                      </svg>
                      Download pattern file (.json)
                    </button>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() =>
                        download(svgBlob(exportSvg()), `${tutorial.id}.svg`)
                      }
                    >
                      Download SVG
                    </button>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() =>
                        void pngBlob(exportSvg()).then((png) =>
                          download(png, `${tutorial.id}.png`),
                        )
                      }
                    >
                      Download PNG
                    </button>
                  </div>
                  {address !== 'shared' ? (
                    <a
                      className="button secondary make-3d"
                      href={
                        design
                          ? `#/${address}/design/${design.id}/make`
                          : `#/${address}/make`
                      }
                    >
                      Make it in 3D
                    </a>
                  ) : null}
                  <p className="pattern-file-hint">
                    JSON keeps the editable construction, ink, colours and
                    style. Open it with “Open a pattern file”. SVG and PNG are
                    images.
                  </p>
                  {fileError && (
                    <p className="refused" role="alert">
                      {fileError}
                    </p>
                  )}
                  {/* The paper is beside Print, the one thing it changes. */}
                  <div className="print-tools">
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => setPrinting(true)}
                    >
                      Print line sheet
                    </button>
                    <div className="paper" role="group" aria-label="Paper">
                      {(['A4', 'Letter'] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          aria-pressed={p === paper}
                          onClick={() => setPaper(p)}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </section>
                {!mine && !sharedView ? (
                  <>
                    {ready ? <NextPathLesson id={address} /> : null}
                    <ExploreNext tutorial={full.tutorial} />
                  </>
                ) : null}
              </aside>
            ) : null}
          </div>
        )}
        <div className="journey-row">
          <Journey stages={stages} index={index} onJump={jump} />
          {!phone && !colorStage && !sharedView && (
            <div className="lesson-share">{endShare}</div>
          )}
          {colorStage && ready && !phone && !wallPage ? (
            <div className="end-actions" role="group" aria-label="Your design">
              {endSave}
              {endShare}
              {pathFinish ? (
                <a
                  className="learning-advance"
                  href={
                    pathFinish.next
                      ? `#/${pathFinish.next.lesson.id}/watch/1`
                      : '#/learn'
                  }
                >
                  {pathFinish.next ? 'Next lesson' : 'See the learning path'}
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
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
  label = 'Make my own copy from here',
}: {
  tutorial: Model['tutorial'];
  address: string;
  /** The step's id: every step up to it is kept, hidden ones too. */
  step: number;
  /** Its number as the learner sees it. */
  shownNumber: number;
  label?: string;
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
        {label}
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
/** How many copies the repeat lays, along each slide, or the whole wall. */
type Copies = readonly [number, number] | 'wall';
const COPIES: readonly Copies[] = [[2, 1], [2, 2], [3, 3], 'wall'];

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
  reviewIndex,
  presentation,
  position,
  lessonColourFirst,
  carried,
}: {
  carried?: Draft;
  json: unknown;
  start?: Start;
  design?: Design;
  address?: string;
  banner?: React.ReactNode;
  reviewIndex?: number;
  presentation?: SharedPresentation;
  position?: LessonPosition;
  lessonColourFirst?: boolean;
}) {
  const { model, error, progress } = useModel(json);
  if (error !== undefined) return <Broken message={error} />;
  if (!model) {
    return <PatternLoading address={address} progress={progress} />;
  }
  return (
    <Player
      model={model}
      presentation={presentation}
      start={start}
      design={design}
      address={address}
      banner={banner}
      reviewIndex={reviewIndex}
      position={position}
      lessonColourFirst={lessonColourFirst}
      carried={carried}
    />
  );
}

export function Broken({ message }: { message: string }) {
  return (
    <div className="player">
      <header className="topbar">
        <a className="home" href="#/" aria-label="All patterns">
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
        <h1>This pattern cannot be shown</h1>
        <p>Tastir could not open this address. What it found:</p>
        <pre className="error">{message}</pre>
        <FeedbackButton
          context={basicFeedbackContext(
            '',
            'Pattern could not be shown',
            'error',
          )}
        />
        <p className="notice-links">
          <a className="button" href="#/">
            Back to all patterns
          </a>
        </p>
      </section>
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

const TILE_ICONS = {
  print:
    'M7 9V4h10v5M7 17H5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2M7 14h10v6H7z',
  file: 'M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7zM14 3v4h4M9.5 13.5 8 15l1.5 1.5M14.5 13.5 16 15l-1.5 1.5',
  vector: 'M5 19 12 5l7 14M8.5 12h7M3 17h4v4H3zM17 17h4v4h-4zM10 3h4v4h-4z',
  image: 'M4 5h16v14H4zM4 16l5-5 4 4 2-2 5 5M15.5 9.5v.01',
  variation: 'M12 3l2.2 5.3L20 9l-4.4 3.8L17 19l-5-3-5 3 1.4-6.2L4 9l5.8-.7z',
} as const;

/** One of More's tiles: an icon over a word, named in full for a reader. */
function MakeTile({
  icon,
  label,
  name,
  title,
  className,
  onClick,
}: {
  icon: keyof typeof TILE_ICONS;
  label: string;
  name: string;
  title?: string;
  className?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={className ? `make-tile ${className}` : 'make-tile'}
      aria-label={name}
      title={title ?? name}
      onClick={onClick}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d={TILE_ICONS[icon]} />
      </svg>
      <span>{label}</span>
    </button>
  );
}
