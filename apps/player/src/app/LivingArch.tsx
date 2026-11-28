import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { planStep, play, playInk } from './animation';
import { fullView } from './camera';
import { pieceColors, tutorialColoring } from './coloring';
import { cardView, Construction, RepeatedInk, Thumbnail } from './drawing';
import type { Entry } from './library';
import { asPanel, beatsOf, shownBeats, type Model } from './model';
import { useModel } from './workerClient';

const prefersReducedMotion = () =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const SHOWCASE_PALETTE = 'Fès tile';
const SHOWCASE_SPEED = 1.9;
const SHOWCASE_HOLD_MS = 4200;

const PHASES = ['Construct', 'Ink', 'Repeat', 'Color'] as const;

/**
 * A live cedar-framed drafting plate inside Start here: plays the full
 * four-stage journey (compass construction -> bold ink -> repeating tiles ->
 * glazed colours) so visitors understand what Tastir does in a few seconds.
 */
export function LivingArch({ entry }: { entry: Entry }) {
  const { model } = useModel(entry.json);
  const reduced = useMemo(prefersReducedMotion, []);
  const [paused, setPaused] = useState(reduced);
  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(
    () => typeof document === 'undefined' || !document.hidden,
  );
  const rootRef = useRef<HTMLElement>(null);
  const thumb = entry.preview?.thumbnailSmall ?? entry.preview?.thumbnail;
  const label = entry.preview?.short ?? entry.preview?.title ?? entry.id;

  useEffect(() => {
    const onVis = () => setTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver !== 'function') return;
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries[0];
        if (hit) setInView(hit.isIntersecting);
      },
      { threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <figure
      ref={rootRef}
      className="living-arch"
      aria-label={`Live preview: ${label}`}
    >
      {model ? (
        <LivingArchPlay
          entry={entry}
          label={label}
          model={model}
          reduced={reduced}
          paused={paused}
          suspended={!inView || !tabVisible}
          onTogglePause={() => setPaused((p) => !p)}
        />
      ) : (
        <>
          <div className="living-arch-shell">
            <div className="living-arch-window">
              <a
                className="living-arch-link"
                href={`#/${entry.id}/watch/1`}
                aria-label={`Watch ${label} drawn step by step`}
              >
                {thumb ? (
                  <img
                    src={import.meta.env.BASE_URL + thumb}
                    alt=""
                    width="320"
                    height="320"
                  />
                ) : (
                  <div className="thumbnail waiting" />
                )}
              </a>
            </div>
          </div>
          <div className="living-arch-meta">
            <span className="living-arch-kicker">From compass to mosaic</span>
            <ol className="living-arch-phases" aria-hidden="true">
              {PHASES.map((name, i) => (
                <li key={name} className={i === 3 ? 'is-active' : 'is-done'}>
                  {name}
                </li>
              ))}
            </ol>
          </div>
        </>
      )}
    </figure>
  );
}

function LivingArchPlay({
  entry,
  label,
  model,
  reduced,
  paused,
  suspended,
  onTogglePause,
}: {
  entry: Entry;
  label: string;
  model: Model;
  reduced: boolean;
  paused: boolean;
  suspended: boolean;
  onTogglePause: () => void;
}) {
  const beats = useMemo(() => shownBeats(model.tutorial), [model]);
  const all = beatsOf(model.tutorial).length;
  const [k, setK] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const view = useMemo(() => fullView(model), [model]);
  const panelModel = useMemo(() => asPanel(model), [model]);
  const wallView = useMemo(() => cardView(model), [model]);
  const n = beats.length;

  const coloring = useMemo(
    () => ({
      ...tutorialColoring(model),
      palette: SHOWCASE_PALETTE,
      chosen: {},
    }),
    [model],
  );
  const colorSteps = useMemo(
    () =>
      Math.max(1, new Set(Object.values(pieceColors(model, coloring))).size),
    [model, coloring],
  );
  const total = n + colorSteps + 4;

  const isFadingLines = k === n + 1;
  const isRepeating = k === n + 2;
  const isColoring = k >= n + 3 && k <= n + 2 + colorSteps;
  const isFinished = k > n + 2 + colorSteps;
  const coloredUpTo = isFinished ? undefined : isColoring ? k - (n + 2) : 0;
  const colorIndex = isColoring ? k - n - 3 : isFinished ? colorSteps - 1 : -1;

  const phaseIndex =
    reduced || isColoring || isFinished
      ? 3
      : isRepeating
        ? 2
        : k === n || isFadingLines
          ? 1
          : 0;

  useLayoutEffect(() => {
    if (reduced || paused || suspended) return;
    let anims: Animation[] = [];
    if (k < n) {
      anims = play(
        svgRef.current,
        planStep(model, beats[k] ?? 1, SHOWCASE_SPEED, { flash: false }),
      );
    } else if (k === n) {
      anims = playInk(svgRef.current, panelModel, SHOWCASE_SPEED * 1.4);
    }
    const sliding = isRepeating
      ? (frameRef.current?.getAnimations?.({ subtree: true }) ?? [])
      : [];
    const ends = [...anims, ...sliding].map(
      (a) => Number(a.effect?.getComputedTiming().endTime ?? 0) || 0,
    );
    const wait =
      k === total - 1
        ? SHOWCASE_HOLD_MS
        : isFadingLines
          ? 900
          : isRepeating
            ? Math.max(2400, ...ends) + 550
            : isColoring
              ? 780
              : Math.max(480, ...ends) + (k === n ? 750 : 240);
    const timer = window.setTimeout(() => setK((k + 1) % total), wait);
    return () => {
      window.clearTimeout(timer);
      for (const a of anims) a.cancel();
    };
  }, [
    k,
    n,
    total,
    beats,
    model,
    panelModel,
    reduced,
    paused,
    suspended,
    isFadingLines,
    isRepeating,
    isColoring,
  ]);

  return (
    <>
      <div className="living-arch-shell">
        <div
          ref={frameRef}
          className={`living-arch-window${isColoring ? ' is-coloring' : ''}`}
        >
          <a
            className="living-arch-link"
            href={`#/${entry.id}/watch/1`}
            aria-label={`Watch ${label} drawn step by step`}
          >
            {reduced ? (
              <Thumbnail model={model} coloring={coloring} view={wallView} />
            ) : isFinished ? (
              <Thumbnail
                model={model}
                coloring={coloring}
                view={wallView}
                coloredUpTo={colorSteps}
                activeColorIndex={-1}
              />
            ) : isColoring ? (
              <Thumbnail
                model={model}
                coloring={coloring}
                view={wallView}
                coloredUpTo={coloredUpTo}
                activeColorIndex={colorIndex}
              />
            ) : isRepeating ? (
              <RepeatedInk
                model={panelModel}
                enter
                speed={SHOWCASE_SPEED}
                from={view}
                view={wallView}
                markOriginal={false}
                borders={false}
                outlineFadeMs={2200}
              />
            ) : k === n || isFadingLines ? (
              <Construction
                model={panelModel}
                upTo={all}
                view={view}
                svgRef={svgRef}
                ink
                enter
                fadeLines={isFadingLines}
              />
            ) : (
              <Construction
                model={model}
                upTo={beats[k] ?? 1}
                view={view}
                svgRef={svgRef}
              />
            )}
          </a>
        </div>
        {!reduced ? (
          <button
            type="button"
            className="living-arch-toggle"
            aria-label={paused ? 'Play live preview' : 'Pause live preview'}
            aria-pressed={paused}
            title={paused ? 'Play preview' : 'Pause preview'}
            onClick={onTogglePause}
          >
            {paused ? (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <polygon points="8,5 19,12 8,19" fill="currentColor" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect
                  x="6"
                  y="5"
                  width="4"
                  height="14"
                  rx="1"
                  fill="currentColor"
                />
                <rect
                  x="14"
                  y="5"
                  width="4"
                  height="14"
                  rx="1"
                  fill="currentColor"
                />
              </svg>
            )}
          </button>
        ) : null}
      </div>
      <div className="living-arch-meta">
        <span className="living-arch-kicker">From compass to mosaic</span>
        <ol className="living-arch-phases" aria-label="Preview stages">
          {PHASES.map((name, i) => (
            <li
              key={name}
              className={
                i === phaseIndex
                  ? 'is-active'
                  : i < phaseIndex
                    ? 'is-done'
                    : undefined
              }
              aria-current={i === phaseIndex ? 'step' : undefined}
            >
              {name}
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
