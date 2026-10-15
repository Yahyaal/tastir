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
} from '@tastir/agent-protocol';
import type { Geometry } from '@tastir/engine';
import { EditorDrawing, frameOf } from '../editor/EditorDrawing';
import '../editor/editor.css';
import { snap } from '../editor/tools';
import { LIBRARY } from '../app/library';
import { viewBox, width } from '../app/camera';
import { useCamera } from '../app/useCamera';
import { useModel } from '../app/workerClient';
import type { Model } from '../app/model';
import { ThemeSwitch } from '../app/theme';
import { addPattern, savePattern } from '../editor/patterns';
import {
  drawingDraft,
  drawingPieces,
  editSegments,
  emptyDrawing,
  travelDrawing,
  type DrawingHistory,
} from './drawing';
import { AgentClient } from './client';
import { captureBoard } from './capture';
import { geometryVisible, visibleBox } from './visibility';
import './agent.css';

export function AgentLab() {
  const [id, setId] = useState(
    LIBRARY.find((entry) => entry.id === 'eight-fold-star-and-octagon')?.id ??
      LIBRARY[0]?.id ??
      '',
  );
  const entry = LIBRARY.find((item) => item.id === id);
  const loading = useModel(entry?.json);
  return (
    <main className="agent-lab">
      <header className="agent-head">
        <a href="#/">← Tastir library</a>
        <h1>Drawing assistant</h1>
        <ThemeSwitch />
      </header>
      <p className="agent-intro">
        Ask about this construction, point at an object, or draw straight sides
        between named points. Edit the sides below, undo an edit, or keep your
        drawing in My patterns. New points and coloring come later.
      </p>
      <label className="agent-pattern">
        Construction{' '}
        <select value={id} onChange={(event) => setId(event.target.value)}>
          {LIBRARY.map((item) => (
            <option key={item.id} value={item.id}>
              {item.preview?.title ?? item.id}
            </option>
          ))}
        </select>
      </label>
      {loading.model ? (
        <Workspace key={id} model={loading.model} />
      ) : (
        <p role="status">{loading.error ?? 'Loading the construction…'}</p>
      )}
    </main>
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

function Workspace({ model }: { model: Model }) {
  const [client] = useState(() => new AgentClient());
  const [connection, setConnection] = useState<ConnectionStatus>();
  const [polling, setPolling] = useState(false);
  const [models, setModels] = useState<ModelChoice[]>([]);
  const [modelId, setModelId] = useState('');
  const [selected, setSelected] = useState('O');
  const [mark, setMark] = useState<Highlight>();
  const [prompt, setPrompt] = useState(
    'Explain the selected object and point to it.',
  );
  const [answer, setAnswer] = useState('');
  const [activity, setActivity] = useState('');
  const [error, setError] = useState('');
  const [sentImage, setSentImage] = useState('');
  const [proof, setProof] = useState<false | 'point' | 'draw'>(false);
  const [drawing, setDrawing] = useState(emptyDrawing);
  const drawingRef = useRef(drawing);
  const [saved, setSaved] = useState<{ id: string; revision: number }>();
  const publish = (next: DrawingHistory) => {
    drawingRef.current = next;
    setDrawing(next);
  };
  const pieces = useMemo(
    () => drawingPieces(model.tutorial, drawing.segments),
    [model, drawing.segments],
  );
  const chosen = useMemo(
    () => new Set(pieces.map((piece) => piece.id)),
    [pieces],
  );
  const [profileId, setProfileId] = useState('');
  const svgRef = useRef<SVGSVGElement>(null);
  const frame = useMemo(() => frameOf(model.scene), [model]);
  const camera = useCamera(frame, svgRef);
  const [documentRevision] = useState(() => crypto.randomUUID());
  const controller = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const currentView = useRef({ view: camera.view, selected });
  const targets = useMemo(
    () =>
      [...model.scene.elements.values()]
        .filter((element) => element.geometry.kind !== 'group')
        .map((element) => ({
          id: element.name,
          kind: element.geometry.kind as
            'point' | 'line' | 'circle' | 'polygon',
          geometry: element.geometry as unknown as Record<string, unknown>,
        })),
    [model],
  );

  const revision = () =>
    JSON.stringify([
      `${documentRevision}:${drawingRef.current.revision}`,
      viewBox(currentView.current.view),
      currentView.current.selected,
      svgRef.current?.getBoundingClientRect().width,
      svgRef.current?.getBoundingClientRect().height,
      document.documentElement.dataset['theme'] ?? 'light',
    ]);
  useLayoutEffect(() => {
    currentView.current = { view: camera.view, selected };
  });

  const snapshotOfView = async (): Promise<Snapshot> => {
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
    const visible = targets.filter((target) =>
      geometryVisible(model.scene.elements.get(target.id)!.geometry, box),
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

  const stop = () => {
    generation.current++;
    controller.current?.abort();
    controller.current = null;
    setActivity('');
    setProof(false);
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
      await refreshStatus();
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const send = async () => {
    if (!svgRef.current || !prompt.trim() || !modelId || activity) return;
    setError('');
    setAnswer('');
    setProof(false);
    setMark(undefined);
    const abort = new AbortController();
    controller.current = abort;
    const runGeneration = ++generation.current;
    const isCurrent = () =>
      !abort.signal.aborted && runGeneration === generation.current;
    try {
      setActivity('Capturing the current drawing…');
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
      let snapshot = await snapshotOfView();
      if (!isCurrent()) return;
      setSentImage(snapshot.image);
      setActivity('Asking with your ChatGPT plan…');
      let reply = await client.start(
        modelId,
        prompt.trim(),
        snapshot,
        abort.signal,
      );
      let pointed = false;
      let drawn = false;
      const text: string[] = [];
      while (isCurrent()) {
        if (reply.text) text.push(reply.text);
        if (!reply.calls.length) {
          setAnswer(
            text.join('\n\n') || 'The request completed without a text answer.',
          );
          setProof(drawn ? 'draw' : pointed ? 'point' : false);
          break;
        }
        let edited = false;
        const results: ToolResult[] = reply.calls.map((call) => {
          if (reply.calls.length > 1)
            return {
              callId: call.id,
              ok: false,
              message:
                'Use one tool call per response. Put all sides of a shape in one edit_segments call.',
            };
          if (call.name === 'highlight_target') {
            const result = checkHighlight(call, snapshot, revision());
            if (result.ok) {
              setMark(call.arguments);
              pointed = true;
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
            const next = editSegments(
              drawingRef.current,
              call.arguments,
              model.scene,
            );
            publish(next);
            setMark(undefined);
            pointed = false;
            edited = true;
            drawn = true;
            return {
              callId: call.id,
              ok: true,
              message: `Applied “${call.arguments.label}”: added ${call.arguments.add.length}, removed ${call.arguments.remove.length} segments. The drawing now has ${next.segments.length} segments. Undo restores the entire edit.`,
            };
          } catch (e) {
            return {
              callId: call.id,
              ok: false,
              message: (e as Error).message,
            };
          }
        });
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        );
        if (!isCurrent()) return;
        if (!edited) {
          for (const result of results)
            if (result.ok && revision() !== snapshot.viewRevision) {
              result.ok = false;
              result.message =
                'The view changed before the mark was displayed. Send a new view.';
              pointed = false;
              setMark(undefined);
            }
        }
        let fresh: Snapshot | undefined;
        if (edited) {
          fresh = await snapshotOfView();
          if (!isCurrent()) return;
          snapshot = fresh;
          setSentImage(fresh.image);
        }
        setActivity(
          edited
            ? 'Checking the updated drawing…'
            : 'Checking the highlighting result…',
        );
        reply = await client.resume(reply.runId, results, abort.signal, fresh);
      }
    } catch (e) {
      if (isCurrent()) {
        setError((e as Error).message);
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
      publish(editSegments(drawingRef.current, edit, model.scene));
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
    publish(travelDrawing(drawingRef.current, direction));
  };
  const keepDrawing = () => {
    stop();
    setError('');
    try {
      const draft = drawingDraft(model.tutorial, drawingRef.current.segments);
      const pattern = saved
        ? savePattern(saved.id, draft)
        : addPattern(draft, {
            tutorial: model.tutorial.id,
            title: model.tutorial.title,
            step: model.tutorial.steps.at(-1)?.id ?? 0,
          });
      if (!pattern)
        throw new Error(
          'This browser could not keep the drawing. Keep this page open and try again.',
        );
      setSaved({ id: pattern.id, revision: drawingRef.current.revision });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const selectedGeometry = model.scene.elements.get(selected)?.geometry;
  const markedGeometry = mark
    ? model.scene.elements.get(mark.targetId)?.geometry
    : undefined;
  const point =
    markedGeometry?.kind === 'point' ? markedGeometry.at : undefined;
  return (
    <div className="agent-workspace">
      <section className="agent-board-panel" aria-label="Current drawing">
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
        <div className="agent-board">
          <EditorDrawing
            scene={model.scene}
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
                snap(model.scene, at, reach, 'point') ??
                snap(model.scene, at, reach, 'curve');
              if (found?.name) {
                setSelected(found.name);
                setMark(undefined);
              }
            }}
          />
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
          and use Fit. The blue selection is included in the board image.
        </p>
        {mark ? (
          <button type="button" onClick={() => setMark(undefined)}>
            Clear assistant highlight
          </button>
        ) : null}
        <section className="agent-edits" aria-label="Editable sides">
          <h2>Your drawing · {drawing.segments.length} sides</h2>
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
              disabled={!drawing.segments.length}
              onClick={keepDrawing}
            >
              Keep in My patterns
            </button>
          </div>
          <p className="agent-caption">
            {saved?.revision === drawing.revision
              ? 'Kept in this browser. '
              : 'Keep your edits before leaving this construction. '}
            {saved ? <a href={`#/edit/${saved.id}`}>Open in editor</a> : null}
          </p>
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
                  {targets
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
        </section>
      </section>
      <aside className="agent-panel" aria-label="Assistant">
        <h2>Assistant</h2>
        {['jW', 'jN', 'jE', 'jS'].every((id) =>
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
        <p>
          {connection?.connected
            ? connection.sharing
              ? 'Using ChatGPT plan'
              : 'Connected; ChatGPT plan permission is needed'
            : 'Connect your ChatGPT account'}
        </p>
        {connection?.profiles.length ? (
          <label>
            Saved account{' '}
            <select
              value={profileId}
              onChange={(event) => {
                void chooseProfile(event.target.value);
              }}
            >
              {connection.profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <div className="agent-actions">
          <button
            type="button"
            onClick={() => {
              void connect();
            }}
            disabled={polling}
          >
            {polling ? 'Waiting for ChatGPT sign-in…' : 'Continue with ChatGPT'}
          </button>
          {polling ? (
            <button
              type="button"
              onClick={() => {
                void cancelSignIn();
              }}
            >
              Cancel sign-in
            </button>
          ) : null}
          {connection?.profiles.length ? (
            <button
              type="button"
              onClick={() => {
                void connect(true);
              }}
              disabled={polling}
            >
              Add account
            </button>
          ) : null}
          {connection?.connected ? (
            <button
              type="button"
              onClick={() => {
                void disconnect();
              }}
            >
              Disconnect
            </button>
          ) : null}
        </div>
        <p className="agent-caption">
          Sending includes this board image, named geometry and your question.
          It uses your existing plan allowance.
        </p>
        <a
          href="https://chatgpt.com/settings/usage"
          target="_blank"
          rel="noreferrer"
        >
          Manage usage
        </a>
        {connection?.error ? <p role="alert">{connection.error}</p> : null}
        <label>
          Model{' '}
          <select
            value={modelId}
            onChange={(event) => {
              stop();
              setModelId(event.target.value);
            }}
            disabled={!models.length}
          >
            {!models.length ? (
              <option value="">Connect to load available models</option>
            ) : (
              models.map((choice) => (
                <option key={choice.slug} value={choice.slug}>
                  {choice.name}
                </option>
              ))
            )}
          </select>
        </label>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void send();
          }}
        >
          <label>
            Your request{' '}
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              maxLength={8000}
              rows={4}
            />
          </label>
          <div className="agent-actions">
            <button
              type="submit"
              disabled={
                !connection?.sharing || !modelId || !prompt.trim() || !!activity
              }
            >
              Send current view
            </button>
            {activity ? (
              <button type="button" onClick={stop}>
                Stop
              </button>
            ) : null}
          </div>
        </form>
        <p className="agent-activity" role="status">
          {activity ||
            (proof
              ? proof === 'draw'
                ? 'Drawing updated: edits displayed, current image sent, final response completed.'
                : 'Live check completed: image sent, highlight acknowledged, final response completed.'
              : 'Ready for a question about this board.')}
        </p>
        {error ? (
          <p className="agent-error" role="alert">
            {error}
          </p>
        ) : null}
        {answer ? <p className="agent-answer">{answer}</p> : null}
        {sentImage ? (
          <details>
            <summary>Board image sent with the last request</summary>
            <img
              className="agent-sent-image"
              src={sentImage}
              alt="The board image sent with the last assistant request"
            />
          </details>
        ) : null}
      </aside>
    </div>
  );
}
