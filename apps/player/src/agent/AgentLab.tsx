import { applyPageEditor, pageEditorRevision } from './pageEditor';
import { waitForRendered } from './rendered';
import { AccountPanel } from './AccountPanel';
import { AgentRequestError } from './client';
import { ChatPanel } from './ChatPanel';
import { useConversation, type Conversation } from './conversation';
import { pageColorRevision, applyPageColor } from './pageColoring';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  checkHighlight,
  SnapshotShape,
  type ConnectionStatus,
  type Highlight,
  type ModelChoice,
  type Snapshot,
  type EditSegments,
  type ToolResult,
  type HistoryAction,
} from '@tastir/agent-protocol';
import type { Geometry, Scene } from '@tastir/engine';
import { EditorDrawing, frameOf } from '../editor/EditorDrawing';
import '../editor/editor.css';
import { snap } from '../editor/tools';
import { LIBRARY, type Entry } from '../app/library';
import { viewBox, width } from '../app/camera';
import { useCamera } from '../app/useCamera';
import { useModel } from '../app/workerClient';
import { emptyDraft, check, type Draft } from '../editor/document';
import { ThemeSwitch } from '../app/theme';
import { addPattern, getPattern, savePattern } from '../editor/patterns';
import {
  constructionScene,
  construct,
  constructionText,
  drawingPieces,
  editSegments,
  emptyDrawing,
  travelDrawing,
  travelHistory,
  historyObservation,
  type DrawingHistory,
} from './drawing';
import { Wall } from '../app/Wall';
import { PALETTES } from '../app/coloring';
import {
  setTile,
  paintPattern,
  repeatModel,
  savedDrawing,
  repeatObservation,
  repeatColors,
  repeatTargets,
  repeatTargetId,
} from './repeat';
import { captureBoard } from './capture';
import { geometryVisible, visibleBox } from './visibility';
import {
  currentRoute,
  destinationsOf,
  navigateTo,
  observeScreen,
  pageRevision,
  visibleDrawing,
} from './navigation';
import {
  clearScreenHighlight,
  showScreenHighlight,
  screenHighlightDisplayed,
} from './ScreenPointer';
import './agent.css';

export function AgentLab({
  route = 'agent',
  open = true,
  library = LIBRARY,
  onClose,
}: {
  route?: string;
  open?: boolean;
  library?: readonly Entry[];
  onClose?: () => void;
}) {
  const conversation = useConversation();
  const [id, setId] = useState(
    route === 'agent'
      ? (library.find((entry) => entry.id === 'eight-fold-star-and-octagon')
          ?.id ??
          library[0]?.id ??
          'agent-blank')
      : 'agent-blank',
  );
  const entry = library.find((item) => item.id === id);
  const loading = useModel(entry?.json);
  const blank = useMemo(() => {
    const tutorial = emptyDraft('agent-blank', 'My compass construction');
    return { tutorial, scene: check(tutorial).scene };
  }, []);
  const active = id === 'agent-blank' ? blank : loading.model;
  return (
    <div className="agent-lab" role={route === 'agent' ? 'main' : undefined}>
      <header className="agent-head" hidden={route !== 'agent'}>
        <a href="#/">← Tastir library</a>
        <h1>Drawing assistant</h1>
        <ThemeSwitch />
      </header>
      <p className="agent-intro" hidden={route !== 'agent'}>
        Ask about this construction, point at an object, or draw straight sides
        between named points. Add ruler lines, compass circles and intersection
        points, repeat a closed pattern, color its shapes, undo an edit, or keep
        the result in My patterns.
      </p>
      <label className="agent-pattern" hidden={route !== 'agent'}>
        Construction{' '}
        <select value={id} onChange={(event) => setId(event.target.value)}>
          <option value="agent-blank">Start from O and A</option>
          {library.map((item) => (
            <option key={item.id} value={item.id}>
              {item.preview?.title ?? item.id}
            </option>
          ))}
        </select>
      </label>
      {active ? (
        <Workspace
          key={id}
          model={active}
          route={route}
          open={open}
          library={library}
          conversation={conversation}
          onClose={onClose}
        />
      ) : (
        <p role="status">{loading.error ?? 'Loading the construction…'}</p>
      )}
    </div>
  );
}

function Annotation({ geometry }: { geometry: Geometry }) {
  if (geometry.kind === 'circle')
    return (
      <circle
        cx={geometry.circle.centre.x}
        cy={geometry.circle.centre.y}
        r={geometry.circle.radius}
      />
    );
  if (geometry.kind === 'polygon')
    return (
      <polygon
        points={geometry.vertices.map((p) => `${p.x},${p.y}`).join(' ')}
      />
    );
  if (geometry.kind === 'line') {
    const { point, dir } = geometry.line;
    return (
      <line
        x1={point.x - dir.x * 1000}
        y1={point.y - dir.y * 1000}
        x2={point.x + dir.x * 1000}
        y2={point.y + dir.y * 1000}
      />
    );
  }
  return null;
}

const targetsOf = (scene: Scene) =>
  [...scene.elements.values()]
    .filter((element) => element.geometry.kind !== 'group')
    .map((element) => ({
      id: element.name,
      kind: element.geometry.kind as 'point' | 'line' | 'circle' | 'polygon',
      geometry: element.geometry as unknown as Record<string, unknown>,
    }));

function Workspace({
  model,
  route,
  open,
  library,
  conversation,
  onClose,
}: {
  model: { tutorial: Draft; scene: Scene };
  route: string;
  open: boolean;
  library: readonly Entry[];
  conversation: Conversation;
  onClose?: () => void;
}) {
  const { client } = conversation;
  const [connection, setConnection] = useState<ConnectionStatus>();
  const [polling, setPolling] = useState(false);
  const [models, setModels] = useState<ModelChoice[]>([]);
  const [modelId, setModelId] = useState('');
  const [selected, setSelected] = useState('O');
  const [mark, setMark] = useState<Highlight & { geometry: Geometry }>();
  const [prompt, setPrompt] = useState('');
  const setAnswer = (text: string) => {
    if (text) conversation.update(text);
  };
  const [activity, setActivity] = useState('');
  const [error, setError] = useState('');
  const [sentImage, setSentImage] = useState('');
  const [screenPoint, setScreenPoint] = useState(false);
  const [drawing, setDrawing] = useState(emptyDrawing);
  const drawingRef = useRef(drawing);
  const [showRepeat, setShowRepeat] = useState(true);
  const [tilePoints, setTilePoints] = useState('');
  const repeated = useMemo(
    () => repeatModel(model.tutorial, drawing),
    [model, drawing],
  );
  const wallColors = useMemo(
    () => (repeated ? repeatColors(repeated) : undefined),
    [repeated],
  );
  const wallVisible = !!repeated && showRepeat;
  const [saved, setSaved] = useState<{
    id: string;
    revision: number;
    contents: string;
  }>();
  const savedCopyChanged = useMemo(() => {
    if (!saved || route !== 'agent') return false;
    return JSON.stringify(getPattern(saved.id)?.tutorial) !== saved.contents;
  }, [saved, route]);
  const publish = (
    next: DrawingHistory,
    action: HistoryAction | null = {
      source: 'manual',
      requestId: null,
      label: 'Manual drawing edit',
    },
  ) => {
    const stamped = action ? { ...next, action } : next;
    drawingRef.current = stamped;
    setDrawing(stamped);
  };
  const pieces = useMemo(
    () =>
      drawingPieces(model.tutorial, drawing.segments, drawing.constructions),
    [model, drawing.segments, drawing.constructions],
  );
  const scene = useMemo(
    () => constructionScene(model.tutorial, drawing.constructions),
    [model, drawing.constructions],
  );
  const chosen = useMemo(
    () => new Set(pieces.map((piece) => piece.id)),
    [pieces],
  );
  const [profileId, setProfileId] = useState('');
  const svgRef = useRef<SVGSVGElement>(null);
  const frame = useMemo(() => frameOf(scene), [scene]);
  const camera = useCamera(frame, svgRef, {
    stage: wallVisible ? 1 : 0,
    instant: true,
  });
  const [documentRevision] = useState(() => crypto.randomUUID());
  const controller = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const currentView = useRef({ view: camera.view, selected });
  const constructionTargets = useMemo(() => targetsOf(scene), [scene]);
  const targets = useMemo(() => {
    if (!wallVisible || !repeated) return constructionTargets;
    const bounds = svgRef.current?.getBoundingClientRect();
    try {
      return repeatTargets(
        repeated,
        visibleBox(camera.view, bounds?.width || 1000, bounds?.height || 600),
      );
    } catch {
      return [];
    }
  }, [wallVisible, repeated, constructionTargets, camera.view]);

  const revision = () =>
    currentRoute() !== 'agent'
      ? pageRevision()
      : JSON.stringify([
          currentRoute(),
          `${documentRevision}:${drawingRef.current.revision}`,
          viewBox(currentView.current.view),
          svgRef.current?.getAttribute('data-agent-mode'),
          currentView.current.selected,
          svgRef.current?.getBoundingClientRect().width,
          svgRef.current?.getBoundingClientRect().height,
          document.documentElement.dataset['theme'] ?? 'light',
        ]);
  useLayoutEffect(() => {
    if (!targets.some((t) => t.id === selected))
      setSelected(targets[0]?.id ?? 'O');
    svgRef.current?.setAttribute(
      'data-agent-mode',
      wallVisible ? 'repeat' : 'construction',
    );
    currentView.current = { view: camera.view, selected };
  });

  const snapshotOfView = async (
    requiredMode?: 'construction',
  ): Promise<Snapshot> => {
    if (currentRoute() !== 'agent')
      return observeScreen(destinationsOf(library), controller.current?.signal);
    await waitForRendered(
      () =>
        svgRef.current?.closest<HTMLElement>('.agent-board')?.dataset[
          'agentRevision'
        ] === String(drawingRef.current.revision) &&
        (!requiredMode ||
          svgRef.current?.getAttribute('data-agent-mode') === requiredMode),
      controller.current?.signal,
    );
    const svg = svgRef.current;
    if (!svg) throw new Error('The drawing is not ready. Try again.');
    const capturedRevision = revision();
    const image = await captureBoard(svg);
    if (revision() !== capturedRevision)
      throw new Error(
        'The drawing view changed during capture. Send it again.',
      );
    const bounds = svg.getBoundingClientRect();
    const box = visibleBox(
      currentView.current.view,
      bounds.width,
      bounds.height,
    );
    const currentScene = constructionScene(
      model.tutorial,
      drawingRef.current.constructions,
    );
    const currentRepeat = repeatModel(model.tutorial, drawingRef.current);
    const inRepeat = svg.getAttribute('data-agent-mode') === 'repeat';
    const visible =
      inRepeat && currentRepeat
        ? repeatTargets(currentRepeat, box)
        : targetsOf(currentScene).filter((target) =>
            geometryVisible(
              currentScene.elements.get(target.id)!.geometry,
              box,
            ),
          );
    if (!visible.length)
      throw new Error(
        'No named objects are visible here. Use Fit, then send the view again.',
      );
    return SnapshotShape.parse({
      id: crypto.randomUUID(),
      documentId: model.tutorial.id,
      documentRevision: `${documentRevision}:${drawingRef.current.revision}`,
      viewRevision: capturedRevision,
      title: model.tutorial.title,
      selected: visible.some(
        (target) => target.id === currentView.current.selected,
      )
        ? currentView.current.selected
        : null,
      targets: visible,
      segments: drawingRef.current.segments,
      constructions: drawingRef.current.constructions,
      repeat:
        currentRepeat && drawingRef.current.repeat
          ? repeatObservation(currentRepeat, drawingRef.current.repeat)
          : null,
      mode: inRepeat ? 'repeat' : 'construction',
      palettes: Object.keys(PALETTES),
      history: historyObservation(drawingRef.current),
      canSave: true,
      screen: {
        route: 'agent',
        title: model.tutorial.title,
        description:
          'Editable assistant drawing workspace. Current geometry tools apply to this board.',
        destinations: destinationsOf(library),
      },
      image,
    });
  };

  const refreshStatus = async () => {
    const next = await client.status();
    setConnection(next);
    setProfileId(
      (before) => next.activeId || before || next.profiles[0]?.id || '',
    );
    if (!next.signingIn) setPolling(false);
    return next;
  };
  useEffect(() => {
    let live = true;
    void client
      .status()
      .then((next) => {
        if (live) {
          setConnection(next);
          setProfileId(next.activeId ?? next.profiles[0]?.id ?? '');
        }
      })
      .catch((e) => {
        if (live) setError((e as Error).message);
      });
    return () => {
      live = false;
      conversation.interrupt();
      generation.current++;
      controller.current?.abort();
      void client.stop().catch(() => undefined);
    };
  }, [client]);
  useEffect(() => {
    if (!polling) return;
    const timer = setInterval(() => {
      void refreshStatus().catch((e) => setError((e as Error).message));
    }, 1500);
    return () => clearInterval(timer);
  });
  useEffect(() => {
    const abort = new AbortController();
    setModels([]);
    setModelId('');
    if (connection?.sharing)
      void client
        .models(abort.signal)
        .then((choices) => {
          if (abort.signal.aborted) return;
          setModels(choices);
          setModelId(choices[0]?.slug ?? '');
          if (!choices.length)
            setError(
              'This account returned no available models. Check its ChatGPT plan access.',
            );
        })
        .catch((e) => {
          if (!abort.signal.aborted) setError((e as Error).message);
        });
    return () => abort.abort();
  }, [client, connection?.activeId, connection?.sharing]);

  useEffect(() => {
    if (!open) {
      conversation.interrupt();
      generation.current++;
      controller.current?.abort();
      controller.current = null;
      setActivity('');
      void client.stop().catch(() => undefined);
    }
  }, [open, client]);

  const stop = () => {
    conversation.interrupt();
    clearScreenHighlight();
    setScreenPoint(false);
    generation.current++;
    controller.current?.abort();
    controller.current = null;
    setActivity('');
    void client.stop().catch(() => undefined);
  };
  const connect = async (fresh = false) => {
    stop();
    setError('');
    const popup = window.open('about:blank', '_blank');
    if (popup) popup.opener = null;
    try {
      const result = (await client.request(
        '/auth/start',
        fresh || !profileId ? {} : { profileId },
      )) as { url: string };
      const url = new URL(result.url);
      if (url.origin !== 'https://auth.openai.com')
        throw new Error('The sign-in address was not valid.');
      if (!popup)
        throw new Error(
          'Allow a sign-in window for Tastir, then press Continue with ChatGPT again.',
        );
      popup.location.href = url.toString();
      setPolling(true);
      await refreshStatus();
    } catch (e) {
      popup?.close();
      void client.request('/auth/cancel', {}).catch(() => undefined);
      setError((e as Error).message);
    }
  };
  const cancelSignIn = async () => {
    setPolling(false);
    try {
      await client.request('/auth/cancel', {});
      await refreshStatus();
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const disconnect = async () => {
    stop();
    setError('');
    try {
      await client.request('/auth/disconnect', {});
      conversation.clear();
      setSentImage('');
      await refreshStatus();
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const chooseProfile = async (id: string) => {
    stop();
    setError('');
    setProfileId(id);
    try {
      await client.request('/auth/select', { profileId: id });
      conversation.clear();
      setSentImage('');
      await refreshStatus();
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const send = async () => {
    if (!prompt.trim() || !modelId || activity || controller.current) return;
    const question = prompt.trim();
    conversation.begin(question);
    setPrompt('');
    setError('');
    setAnswer('');
    setMark(undefined);
    clearScreenHighlight();
    setScreenPoint(false);
    const abort = new AbortController();
    controller.current = abort;
    const runGeneration = ++generation.current;
    const isCurrent = () =>
      !abort.signal.aborted && runGeneration === generation.current;
    let changesApplied = false;
    try {
      setActivity(
        currentRoute() === 'agent'
          ? 'Capturing the current drawing…'
          : 'Reading the current page…',
      );
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
      let snapshot = await snapshotOfView();
      if (!isCurrent()) return;
      setSentImage(snapshot.image ?? '');
      setActivity('Asking with your ChatGPT plan…');
      let reply = await client.start(modelId, question, snapshot, abort.signal);

      const text: string[] = [];
      const executed = new Map<string, ToolResult>();
      while (isCurrent()) {
        if (snapshot.screen && currentRoute() !== snapshot.screen.route)
          throw new Error(
            'The page changed while the assistant was working. Send the current view again.',
          );
        if (reply.text) {
          text.push(reply.text);
          conversation.update(text.join('\n\n'), 'pending');
        }
        if (!reply.calls.length) {
          setAnswer(
            text.join('\n\n') || 'The request completed without a text answer.',
          );
          break;
        }
        const colorRevisionBefore = pageColorRevision();
        const editorRevisionBefore = pageEditorRevision();
        let edited = false;
        let observed = false;
        let navigated = false;
        let refitted = false;
        const results: ToolResult[] = await Promise.all(
          reply.calls.map(async (call) => {
            const previous = executed.get(call.id);
            if (previous?.ok)
              return {
                callId: call.id,
                ok: false,
                message:
                  `This operation was already applied: ${previous.message}`.slice(
                    0,
                    500,
                  ),
              };
            if (reply.calls.length > 1)
              return {
                callId: call.id,
                ok: false,
                message:
                  'Use one tool call per response. Put all sides of a shape in one edit_segments call.',
              };
            if (call.name === 'create_pattern') {
              try {
                if (
                  call.arguments.snapshotId !== snapshot.id ||
                  call.arguments.documentRevision !==
                    snapshot.documentRevision ||
                  revision() !== snapshot.viewRevision
                )
                  throw new Error(
                    'The view changed. Send a fresh view before creating a pattern.',
                  );
                const pattern = addPattern(
                  emptyDraft('my-pattern', call.arguments.name),
                );
                if (!pattern)
                  throw new Error('The browser could not save a new pattern.');
                const live = destinationsOf(library);
                const updated = {
                  ...snapshot,
                  screen: { ...snapshot.screen!, destinations: live },
                };
                await navigateTo(
                  `editor:${pattern.id}`,
                  updated,
                  live,
                  abort.signal,
                );
                navigated = true;
                return {
                  callId: call.id,
                  ok: true,
                  message: `Created and opened “${pattern.tutorial.title}” starting from O and A. The normal editor keeps every edit automatically. A fresh observation follows.`,
                };
              } catch (e) {
                return {
                  callId: call.id,
                  ok: false,
                  message: (e as Error).message.slice(0, 500),
                };
              }
            }
            if (call.name === 'save_work' && snapshot.mode !== 'screen') {
              try {
                if (
                  call.arguments.snapshotId !== snapshot.id ||
                  call.arguments.documentRevision !==
                    snapshot.documentRevision ||
                  revision() !== snapshot.viewRevision
                )
                  throw new Error(
                    'The drawing changed. Send a fresh view before saving.',
                  );
                const draft = {
                  ...savedDrawing(model.tutorial, drawingRef.current),
                  title: call.arguments.name,
                };
                const saved = addPattern(draft);
                if (!saved)
                  throw new Error('The browser could not save this pattern.');
                observed = true;
                return {
                  callId: call.id,
                  ok: true,
                  message: `Saved a new pattern “${draft.title}” in Your work. Editor destination: editor:${saved.id}.`,
                };
              } catch (e) {
                return {
                  callId: call.id,
                  ok: false,
                  message: (e as Error).message.slice(0, 500),
                };
              }
            }
            if (call.name === 'navigate') {
              if (
                call.arguments.snapshotId !== snapshot.id ||
                call.arguments.documentRevision !== snapshot.documentRevision ||
                (snapshot.mode === 'screen'
                  ? pageRevision(false) !== snapshot.documentRevision
                  : revision() !== snapshot.viewRevision)
              )
                return {
                  callId: call.id,
                  ok: false,
                  message:
                    'The page or view changed. Send a new view before navigating.',
                };
              try {
                const destination = await navigateTo(
                  call.arguments.destinationId,
                  snapshot,
                  destinationsOf(library),
                  abort.signal,
                );
                navigated = true;

                setMark(undefined);
                clearScreenHighlight();
                return {
                  callId: call.id,
                  ok: true,
                  message:
                    `Opened ${destination.title}. The destination rendered; a fresh screen observation follows.`.slice(
                      0,
                      500,
                    ),
                };
              } catch (e) {
                return {
                  callId: call.id,
                  ok: false,
                  message: (e as Error).message.slice(0, 500),
                };
              }
            }
            if (
              snapshot.mode === 'screen' &&
              call.name === 'highlight_target'
            ) {
              const result = checkHighlight(call, snapshot, revision());
              if (
                result.ok &&
                !showScreenHighlight(
                  call.id,
                  call.arguments,
                  snapshot,
                  visibleDrawing(),
                )
              ) {
                result.ok = false;
                result.message =
                  'That object is no longer visible on this page. Send a new view.';
              }
              if (result.ok) {
                setScreenPoint(true);
              }
              return result;
            }
            if (
              snapshot.mode === 'screen' &&
              [
                'color_square_bands',
                'paint_pattern',
                'paint_targets',
                'set_coloring',
                'apply_steps',
                'construct',
                'edit_segments',
                'set_tile',
                'save_work',
                'travel_history',
              ].includes(call.name)
            ) {
              try {
                if (
                  !('documentRevision' in call.arguments) ||
                  call.arguments.snapshotId !== snapshot.id ||
                  call.arguments.documentRevision !==
                    snapshot.documentRevision ||
                  revision() !== snapshot.viewRevision
                )
                  throw new Error(
                    'The page or drawing changed. Send a new view before coloring.',
                  );
                const message = snapshot.editor
                  ? applyPageEditor(call, snapshot, reply.runId)
                  : applyPageColor(call, snapshot, reply.runId);
                clearScreenHighlight();
                setScreenPoint(false);

                if (call.name === 'save_work') observed = true;
                else edited = true;

                return { callId: call.id, ok: true, message };
              } catch (e) {
                return {
                  callId: call.id,
                  ok: false,
                  message: (e as Error).message.slice(0, 500),
                };
              }
            }
            if (snapshot.mode === 'screen')
              return {
                callId: call.id,
                ok: false,
                message:
                  'This page supports questions, navigation and pointing. Return to the assistant workspace to edit geometry.',
              };
            if (
              call.name === 'color_square_bands' ||
              call.name === 'paint_targets' ||
              call.name === 'set_coloring' ||
              call.name === 'apply_steps' ||
              call.name === 'save_work'
            )
              return {
                callId: call.id,
                ok: false,
                message:
                  'Open a normal pattern Color/result page for square bands.',
              };
            if (call.name === 'highlight_target') {
              const result = checkHighlight(call, snapshot, revision());
              if (result.ok) {
                setMark({
                  ...call.arguments,
                  geometry: snapshot.targets.find(
                    (t) => t.id === call.arguments.targetId,
                  )!.geometry as unknown as Geometry,
                });
              }
              return result;
            }
            if (
              call.arguments.snapshotId !== snapshot.id ||
              call.arguments.documentRevision !== snapshot.documentRevision ||
              revision() !== snapshot.viewRevision
            )
              return {
                callId: call.id,
                ok: false,
                message:
                  'The drawing or view changed. Ask for a new image before editing.',
              };
            if (
              call.name === 'edit_segments' &&
              call.arguments.add.some((side) =>
                [side.from, side.to].some(
                  (id) =>
                    !snapshot.targets.some(
                      (t) => t.id === id && t.kind === 'point',
                    ),
                ),
              )
            )
              return {
                callId: call.id,
                ok: false,
                message:
                  'Use named points in the current observation as endpoints.',
              };
            try {
              if (call.name === 'fit_view') {
                setShowRepeat(false);
                camera.goTo(
                  frameOf(
                    constructionScene(
                      model.tutorial,
                      drawingRef.current.constructions,
                    ),
                  ),
                );
                setMark(undefined);

                refitted = true;

                return {
                  callId: call.id,
                  ok: true,
                  message:
                    'Construction fitted to all current points and circles. A fresh board image and named targets follow. No drawing edits were made.',
                };
              }
              if (call.name === 'construct') {
                const available = new Set(
                  snapshot.targets.map((target) => target.id),
                );
                for (const operation of call.arguments.add) {
                  const refs =
                    operation.kind === 'line'
                      ? [operation.from, operation.to]
                      : operation.kind === 'circle'
                        ? [operation.centre, operation.through]
                        : [operation.first, operation.second];
                  if (refs.some((name) => !available.has(name)))
                    throw new Error(
                      'Use names from the current observation or earlier operations in this batch.',
                    );
                  available.add(operation.name);
                }
              }
              let next: DrawingHistory;
              if (call.name === 'travel_history') {
                next = travelHistory(drawingRef.current, call.arguments);
              } else if (call.name === 'set_tile') {
                if (
                  call.arguments.vertices.some(
                    (id) =>
                      !snapshot.targets.some(
                        (t) => t.id === id && t.kind === 'point',
                      ),
                  )
                )
                  throw new Error(
                    'Tile corners must be visible named points. Show Construction and send the view again.',
                  );
                next = setTile(
                  drawingRef.current,
                  { vertices: call.arguments.vertices },
                  model.tutorial,
                );
                setShowRepeat(true);
              } else if (call.name === 'paint_pattern') {
                next = paintPattern(
                  drawingRef.current,
                  {
                    palette: call.arguments.palette,
                    colors: call.arguments.colors,
                  },
                  model.tutorial,
                );
                setShowRepeat(true);
              } else if (call.name === 'construct') {
                next = construct(
                  drawingRef.current,
                  call.arguments,
                  model.tutorial,
                );
              } else {
                next = editSegments(
                  drawingRef.current,
                  call.arguments,
                  constructionScene(
                    model.tutorial,
                    drawingRef.current.constructions,
                  ),
                );
              }
              publish(
                next,
                call.name === 'travel_history'
                  ? null
                  : {
                      source: 'assistant',
                      requestId: reply.runId,
                      label: call.arguments.label,
                    },
              );
              setMark(undefined);

              edited = true;

              return {
                callId: call.id,
                ok: true,
                message:
                  (call.name === 'travel_history'
                    ? `Completed ${call.arguments.direction} for ${call.arguments.steps} edit(s). ${next.past.length} undo steps and ${next.future.length} redo steps remain. `
                    : `Applied “${call.arguments.label}”. Undo restores this entire edit. `) +
                  `The drawing has ${next.constructions.length} new construction elements, ${next.segments.length} sides${next.repeat ? ', and a colored repeating tile' : ''}.`,
              };
            } catch (e) {
              return {
                callId: call.id,
                ok: false,
                message: (e as Error).message.slice(0, 500),
              };
            }
          }),
        );
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        );
        if (!isCurrent()) return;
        if (!edited && !navigated && !refitted && !observed) {
          for (const result of results)
            if (
              result.ok &&
              (revision() !== snapshot.viewRevision ||
                (snapshot.mode === 'screen' &&
                  !screenHighlightDisplayed(result.callId)))
            ) {
              result.ok = false;
              result.message =
                'The view changed before the mark was displayed. Send a new view.';

              setMark(undefined);
              clearScreenHighlight();
              setScreenPoint(false);
            }
        }
        if (
          edited ||
          observed ||
          reply.calls.some(
            (call) =>
              call.name === 'create_pattern' &&
              results.some((result) => result.callId === call.id && result.ok),
          )
        )
          changesApplied = true;
        conversation.recordActions(
          results.map((result) => ({
            label:
              reply.calls.find((c) => c.id === result.callId)?.arguments
                .label ?? 'Assistant action',
            ok: result.ok,
            message: result.message,
          })),
        );
        for (const result of results)
          if (result.ok) executed.set(result.callId, result);
        let fresh: Snapshot | undefined;
        if (edited || navigated || refitted || observed) {
          if (edited && snapshot.mode === 'screen')
            await waitForRendered(
              () =>
                snapshot.editor
                  ? pageEditorRevision() !== editorRevisionBefore
                  : pageColorRevision() !== colorRevisionBefore,
              abort.signal,
            );
          fresh = await snapshotOfView(refitted ? 'construction' : undefined);
          if (!isCurrent()) return;
          snapshot = fresh;
          setSentImage(fresh.image ?? '');
        }
        setActivity(
          navigated
            ? 'Checking the opened page…'
            : edited || refitted
              ? 'Checking the updated drawing…'
              : 'Checking the highlighting result…',
        );
        reply = await client.resume(reply.runId, results, abort.signal, fresh);
      }
    } catch (e) {
      if (isCurrent()) {
        setError((e as Error).message);
        conversation.update(
          'The request could not finish. ' +
            (e as Error).message +
            (changesApplied
              ? ' Changes already applied are kept. Check the actions below before continuing.'
              : ''),
          'error',
          e instanceof AgentRequestError ? e.code : undefined,
        );
        void client.stop().catch(() => undefined);
      }
    } finally {
      if (isCurrent()) {
        setActivity('');
        controller.current = null;
      }
    }
  };

  const manualEdit = (edit: Pick<EditSegments, 'add' | 'remove'>) => {
    stop();
    setError('');
    setAnswer('');
    try {
      publish(editSegments(drawingRef.current, edit, scene));
      setMark(undefined);
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const travel = (direction: 'undo' | 'redo') => {
    stop();
    setError('');
    setAnswer('');
    setMark(undefined);
    publish(travelDrawing(drawingRef.current, direction), null);
  };
  const removeConstruction = (name: string) => {
    stop();
    setError('');
    setAnswer('');
    setMark(undefined);
    try {
      publish(
        construct(
          drawingRef.current,
          { add: [], remove: [name] },
          model.tutorial,
        ),
      );
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const keepDrawing = (asNew = false) => {
    stop();
    setError('');
    try {
      const draft = savedDrawing(model.tutorial, drawingRef.current);
      if (
        saved &&
        !asNew &&
        JSON.stringify(getPattern(saved.id)?.tutorial) !== saved.contents
      )
        throw new Error(
          'The saved copy changed elsewhere. Use Keep as new pattern to preserve both versions.',
        );
      const pattern =
        saved && !asNew
          ? savePattern(saved.id, draft)
          : addPattern(
              draft,
              model.tutorial.id === 'agent-blank'
                ? undefined
                : {
                    tutorial: model.tutorial.id,
                    title: model.tutorial.title,
                    step: model.tutorial.steps.at(-1)?.id ?? 0,
                  },
            );
      if (!pattern)
        throw new Error(
          'This browser could not keep the drawing. Keep this page open and try again.',
        );
      setSaved({
        id: pattern.id,
        revision: drawingRef.current.revision,
        contents: JSON.stringify(pattern.tutorial),
      });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const selectedGeometry = scene.elements.get(selected)?.geometry;
  const markedGeometry = mark?.geometry;
  const manualRepeat = (action: () => DrawingHistory) => {
    stop();
    setError('');
    setAnswer('');
    setMark(undefined);
    try {
      publish(action());
      setShowRepeat(true);
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const point =
    markedGeometry?.kind === 'point' ? markedGeometry.at : undefined;
  return (
    <div className="agent-workspace">
      <section
        className="agent-board-panel"
        aria-label="Current drawing"
        hidden={route !== 'agent'}
      >
        <label>
          Selected object{' '}
          <select
            aria-label="Selected object"
            value={selected}
            onChange={(event) => {
              setSelected(event.target.value);
              setMark(undefined);
            }}
          >
            {targets.map((target) => (
              <option key={target.id} value={target.id}>
                {target.id} · {target.kind}
              </option>
            ))}
          </select>
        </label>
        {repeated ? (
          <div className="agent-actions" aria-label="Board view">
            <button
              type="button"
              aria-pressed={!wallVisible}
              onClick={() => {
                stop();
                setMark(undefined);
                setShowRepeat(false);
              }}
            >
              Construction
            </button>
            <button
              type="button"
              aria-pressed={wallVisible}
              onClick={() => {
                stop();
                setMark(undefined);
                setShowRepeat(true);
              }}
            >
              Repeated wall
            </button>
          </div>
        ) : null}
        <div className="agent-board" data-agent-revision={drawing.revision}>
          {wallVisible && repeated && wallColors ? (
            <>
              <Wall
                model={repeated}
                colors={wallColors.colors}
                fill={wallColors.fill}
                boardRef={svgRef}
                boardCamera={camera}
                onPick={(_type, place) => {
                  setSelected(repeatTargetId(place.piece, place.i, place.j));
                  setMark(undefined);
                }}
              />
              <button
                type="button"
                className="agent-wall-fit"
                onClick={() => camera.goTo(frame)}
              >
                Fit
              </button>
            </>
          ) : (
            <EditorDrawing
              scene={scene}
              fitTo={frameOf(scene)}
              current={new Set(drawing.constructions.map((op) => op.name))}
              ink={{ pieces, chosen }}
              targets={[]}
              svgRef={svgRef}
              camera={camera}
              glow={new Set([selected])}
              rings={
                selectedGeometry?.kind === 'point' ? [selectedGeometry.at] : []
              }
              onHover={() => undefined}
              onClick={(at, reach) => {
                const found =
                  snap(scene, at, reach, 'point') ??
                  snap(scene, at, reach, 'curve');
                if (found?.name) {
                  setSelected(found.name);
                  setMark(undefined);
                }
              }}
            />
          )}
          {markedGeometry ? (
            <div className="agent-mark" data-agent-annotation>
              <svg viewBox={viewBox(camera.view)} aria-hidden="true">
                <g transform="scale(1,-1)">
                  {point ? (
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={width(camera.view) / 45}
                    />
                  ) : (
                    <Annotation geometry={markedGeometry} />
                  )}
                </g>
              </svg>
              <p role="status">
                {mark?.targetId}: {mark?.label}
              </p>
            </div>
          ) : null}
        </div>
        <p className="agent-caption">
          Click a point or line, or choose an object above. You can pan, zoom
          and use Fit. The current board is included in the image.
        </p>
        {mark ? (
          <button type="button" onClick={() => setMark(undefined)}>
            Clear assistant highlight
          </button>
        ) : null}
        <section className="agent-edits" aria-label="Editable sides">
          <h2>
            Your drawing · {drawing.segments.length}{' '}
            {drawing.segments.length === 1 ? 'side' : 'sides'}
          </h2>
          <div className="agent-actions">
            <button
              type="button"
              disabled={!drawing.past.length}
              onClick={() => travel('undo')}
            >
              Undo drawing edit
            </button>
            <button
              type="button"
              disabled={!drawing.future.length}
              onClick={() => travel('redo')}
            >
              Redo drawing edit
            </button>
            <button
              type="button"
              disabled={
                savedCopyChanged ||
                (!drawing.segments.length && !drawing.constructions.length)
              }
              onClick={() => keepDrawing()}
            >
              Keep in My patterns
            </button>
            {saved ? (
              <button type="button" onClick={() => keepDrawing(true)}>
                Keep as new pattern
              </button>
            ) : null}
          </div>
          <p className="agent-caption">
            {savedCopyChanged
              ? 'The saved copy changed elsewhere. Keep as new pattern preserves both versions. '
              : saved?.revision === drawing.revision
                ? 'Kept in this browser. '
                : 'Keep your edits before leaving this construction. '}
            {saved ? <a href={`#/edit/${saved.id}`}>Open in editor</a> : null}
          </p>
          <p className="agent-caption">
            Editing sides clears their tile and colors. Undo restores both.
          </p>
          <section className="agent-repeat" aria-label="Repeat and color">
            <h3>Repeat and color</h3>
            <label>
              Tile corners in boundary order
              <input
                value={tilePoints}
                onChange={(e) => setTilePoints(e.target.value)}
                placeholder="jW, jN, jE, jS"
              />
            </label>
            <button
              type="button"
              disabled={!drawing.segments.length}
              onClick={() =>
                manualRepeat(() =>
                  setTile(
                    drawingRef.current,
                    { vertices: tilePoints.split(/[\s,]+/).filter(Boolean) },
                    model.tutorial,
                  ),
                )
              }
            >
              Use as repeat tile
            </button>
            {repeated && drawing.repeat ? (
              <>
                <p className="agent-caption">
                  Tile: {drawing.repeat.vertices.join(' → ')}. Colors apply to
                  every piece of the same shape.
                </p>
                <div className="agent-actions" aria-label="Palettes">
                  {Object.keys(PALETTES).map((palette) => (
                    <button
                      key={palette}
                      type="button"
                      aria-pressed={drawing.repeat?.palette === palette}
                      onClick={() =>
                        manualRepeat(() =>
                          paintPattern(
                            drawingRef.current,
                            { palette, colors: [] },
                            model.tutorial,
                          ),
                        )
                      }
                    >
                      {palette}
                    </button>
                  ))}
                </div>
                {repeatObservation(repeated, drawing.repeat).types.map(
                  (type) => (
                    <label key={type.id} className="agent-shape-color">
                      {type.id} · {type.perCell} per tile
                      <input
                        type="color"
                        aria-label={`Color ${type.id}`}
                        value={type.color}
                        onChange={(e) =>
                          manualRepeat(() =>
                            paintPattern(
                              drawingRef.current,
                              {
                                palette: null,
                                colors: [
                                  { typeId: type.id, color: e.target.value },
                                ],
                              },
                              model.tutorial,
                            ),
                          )
                        }
                      />
                    </label>
                  ),
                )}
              </>
            ) : (
              <p className="agent-caption">
                Choose four or six named points around a closed drawing. The
                tile adds an outline; ink its sides explicitly when the design
                needs them.
              </p>
            )}
          </section>
          {drawing.segments.map((side, index) => (
            <div className="agent-side" key={side.id}>
              <span>Side {index + 1}</span>
              {(['from', 'to'] as const).map((end) => (
                <select
                  key={end}
                  aria-label={`Side ${index + 1} ${end === 'from' ? 'start' : 'end'}`}
                  value={side[end]}
                  onChange={(event) =>
                    manualEdit({
                      remove: [side.id],
                      add: [
                        {
                          from: side.from,
                          to: side.to,
                          [end]: event.target.value,
                        },
                      ],
                    })
                  }
                >
                  {constructionTargets
                    .filter((target) => target.kind === 'point')
                    .map((target) => (
                      <option key={target.id} value={target.id}>
                        {target.id}
                      </option>
                    ))}
                </select>
              ))}
              <button
                type="button"
                aria-label={`Remove side ${index + 1}`}
                onClick={() => manualEdit({ remove: [side.id], add: [] })}
              >
                Remove
              </button>
            </div>
          ))}
          {drawing.constructions.length ? (
            <section aria-label="New construction">
              <h3>
                New construction · {drawing.constructions.length} elements
              </h3>
              <ul className="agent-constructions">
                {drawing.constructions.map((operation) => (
                  <li key={operation.name}>
                    <span>{constructionText(operation)}</span>
                    <button
                      type="button"
                      aria-label={`Select ${operation.name}`}
                      onClick={() => {
                        setSelected(operation.name);
                        setMark(undefined);
                      }}
                    >
                      Select
                    </button>
                    <button
                      type="button"
                      aria-label={`Remove ${operation.name}`}
                      onClick={() => removeConstruction(operation.name)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </section>
        <div className="agent-workspace-examples" hidden={route !== 'agent'}>
          {route === 'agent' ? (
            <button
              type="button"
              disabled={!!activity}
              onClick={() =>
                setPrompt(
                  'Open Your work, where my saved patterns and designs are.',
                )
              }
            >
              Use navigation request
            </button>
          ) : null}
          {route === 'agent' && model.tutorial.id === 'agent-blank' ? (
            <button
              type="button"
              disabled={!!activity}
              onClick={() =>
                setPrompt(
                  'Draw a circle C0 centred at O through A, then a circle C1 centred at A through O. Mark their upper intersection as Top and lower intersection as Bottom. Draw a ruler line Axis through Top and Bottom. Make this in one construction batch.',
                )
              }
            >
              Use compass request
            </button>
          ) : null}
          {route === 'agent' &&
          ['jW', 'jN', 'jE', 'jS'].every((id) =>
            model.scene.elements.has(id),
          ) ? (
            <button
              type="button"
              onClick={() => setPrompt('Draw the square jW, jN, jE, jS.')}
              disabled={!!activity}
            >
              Use square request
            </button>
          ) : null}
          {route === 'agent' &&
          ['N', 'E', 'S', 'W', 'jN', 'jE', 'jS', 'jW'].every((id) =>
            model.scene.elements.has(id),
          ) ? (
            <button
              type="button"
              disabled={!!activity}
              onClick={() =>
                setPrompt(
                  'Draw two closed squares N–E–S–W–N and jN–jE–jS–jW–jN, and join N to jN, E to jE, S to jS, W to jW. Add all 12 sides in one edit. Then use N, E, S, W as the repeat tile. Color the inner square cobalt blue (#2453a6) and the surrounding quadrilaterals gold (#dda83b).',
                )
              }
            >
              Use repeat and color request
            </button>
          ) : null}
        </div>
      </section>
      <ChatPanel
        onClose={route !== 'agent' ? onClose : undefined}
        messages={conversation.messages}
        prompt={prompt}
        setPrompt={setPrompt}
        activity={activity}
        error={error}
        ready={!!connection?.sharing && !!modelId}
        send={send}
        stop={stop}
        newChat={async () => {
          stop();
          try {
            await client.resetConversation();
            conversation.clear();
            setError('');
            setSentImage('');
          } catch (e) {
            setError((e as Error).message);
          }
        }}
        account={
          <AccountPanel
            connection={connection}
            models={models}
            modelId={modelId}
            profileId={profileId}
            polling={polling}
            chooseProfile={chooseProfile}
            connect={connect}
            cancelSignIn={cancelSignIn}
            disconnect={disconnect}
            stop={stop}
            setModelId={setModelId}
          />
        }
        tools={
          <>
            {' '}
            {route !== 'agent' && screenPoint ? (
              <button
                type="button"
                onClick={() => {
                  clearScreenHighlight();
                  setScreenPoint(false);
                }}
              >
                Clear page highlight
              </button>
            ) : null}
          </>
        }
        image={sentImage}
        context={
          route === 'agent'
            ? model.tutorial.title
            : document
                .querySelector('[data-tastir-page] h1')
                ?.textContent?.trim() || 'Current Tastir page'
        }
        workspace={route === 'agent'}
      />
    </div>
  );
}
