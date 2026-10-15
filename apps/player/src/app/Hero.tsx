import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { planStep, play, playInk } from './animation';
import { fullView } from './camera';
import { tutorialColoring } from './coloring';
import {
  Construction,
  orderedPaletteColors,
  RepeatedInk,
  Thumbnail,
  tiling,
} from './drawing';
import { type Entry } from './library';
import { asPanel, beatsOf, shownBeats, type Model } from './model';
import { useModel } from './workerClient';

const prefersReducedMotion = () =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
/** The hero: a pattern drawing itself, loaded like any other. */
export function HeroDrawing({ entry }: { entry: Entry }) {
  const { model } = useModel(entry.json);
  return (
    <figure className="hero-plate">
      {model ? (
        <HeroPlay model={model} />
      ) : (
        <div className="plate-frame">
          <div className="thumbnail waiting" />
        </div>
      )}
    </figure>
  );
}

/** The palette the hero colours with. */
const HERO_PALETTE = 'Fès tile';

/** How long the hero holds the finished, colored pattern. */
const HERO_HOLD_MS = 4500;
const HERO_SPEED = 1.6;

/**
 * Plays the construction step by step, inks it, slides the copies of the
 * tile into place, then colours the wall, and starts again; with reduced
 * motion it shows the coloured wall only.
 */
function HeroPlay({ model }: { model: Model }) {
  const beats = useMemo(() => shownBeats(model.tutorial), [model]);
  const all = beatsOf(model.tutorial).length;
  const reduced = useMemo(prefersReducedMotion, []);
  const [k, setK] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const view = useMemo(() => fullView(model), [model]);
  const panelModel = useMemo(() => asPanel(model), [model]);
  // Where the repeat ends: the small wall the colours then fill, as on
  // the library's cards.
  const wallView = useMemo(
    () => tiling(model, { halfWide: 1, halfHigh: 1, reach: 2 }).view,
    [model],
  );
  const n = beats.length;

  // The hero colours the pattern brightly, whatever the tutorial's own
  // palette (the twelve-fold rosette is Mamluk wood, all browns).
  const coloring = useMemo(
    () => ({ ...tutorialColoring(model), palette: HERO_PALETTE, chosen: {} }),
    [model],
  );
  const palette = useMemo(
    () => orderedPaletteColors(model, coloring, wallView),
    [model, coloring, wallView],
  );
  const colorSteps = palette.length;
  const total = n + colorSteps + 4;

  // After the ink: the construction lines fade, the copies slide out of
  // the inked tile, then the colours fill the wall.
  const isFadingLines = k === n + 1;
  const isRepeating = k === n + 2;
  const isColoring = k >= n + 3 && k <= n + 2 + colorSteps;
  const isFinished = k > n + 2 + colorSteps;
  const coloredUpTo = isFinished ? undefined : isColoring ? k - (n + 2) : 0;
  const colorIndex = isColoring ? k - n - 3 : isFinished ? colorSteps - 1 : -1;
  const currentColor =
    colorIndex >= 0 && colorIndex < palette.length
      ? palette[colorIndex]
      : undefined;

  useLayoutEffect(() => {
    if (reduced) return;
    let anims: Animation[] = [];
    if (k < n) {
      anims = play(
        svgRef.current,
        planStep(model, beats[k] ?? 1, HERO_SPEED, { flash: false }),
      );
    } else if (k === n) {
      anims = playInk(svgRef.current, panelModel, HERO_SPEED * 1.5);
    }
    // The repeat animates itself; wait for its copies to snap into place.
    const sliding = isRepeating
      ? (frameRef.current?.getAnimations?.({ subtree: true }) ?? [])
      : [];
    const ends = [...anims, ...sliding].map(
      (a) => Number(a.effect?.getComputedTiming().endTime ?? 0) || 0,
    );
    const wait =
      k === total - 1
        ? HERO_HOLD_MS
        : isFadingLines
          ? 1100
          : isRepeating
            ? Math.max(3000, ...ends) + 700
            : isColoring
              ? 950
              : Math.max(600, ...ends) + (k === n ? 900 : 350);
    const timer = setTimeout(() => setK((k + 1) % total), wait);
    return () => {
      clearTimeout(timer);
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
    isFadingLines,
    isRepeating,
    isColoring,
  ]);

  const colorNames = currentColor?.names.length
    ? currentColor.names.join(' & ')
    : 'accent';
  const caption =
    reduced || isFinished
      ? `${model.tutorial.title}: completed design`
      : k === n
        ? `${model.tutorial.title}: inking the pattern`
        : isFadingLines
          ? `${model.tutorial.title}: revealing the inked pattern`
          : isRepeating
            ? `${model.tutorial.title}: repeating the tile`
            : isColoring
              ? `${model.tutorial.title}: coloring — ${colorNames} (${colorIndex + 1} of ${colorSteps})`
              : `${model.tutorial.title}: step ${k + 1} of ${n}`;

  return (
    <>
      <div
        ref={frameRef}
        className={`plate-frame ${isColoring ? 'coloring-active' : ''}`}
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
            speed={HERO_SPEED}
            from={view}
            view={wallView}
            markOriginal={false}
          />
        ) : k === n || isFadingLines ? (
          // One drawing through the ink and the fade, so it is not drawn
          // again: only its construction lines go.
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
      </div>

      <div className="hero-status-row">
        <figcaption>{caption}</figcaption>
        {!reduced && (
          <div
            className="hero-progress-group"
            aria-label="Hero animation progress"
          >
            <div
              className="hero-coloring-chips"
              title="Coloring progress by unique color"
            >
              {palette.map((item, i) => (
                <span
                  key={item.color}
                  className={`hero-color-chip ${
                    isFinished || i <= colorIndex ? 'active' : ''
                  } ${i === colorIndex && isColoring ? 'current' : ''}`}
                  style={{
                    backgroundColor: item.color,
                    boxShadow:
                      i === colorIndex && isColoring
                        ? `0 0 10px ${item.color}`
                        : undefined,
                  }}
                  title={`${item.names.join(' & ')} (${i + 1} of ${colorSteps})`}
                  aria-label={`${item.names.join(' & ')} (${i + 1} of ${colorSteps})`}
                />
              ))}
            </div>
            <div
              className="hero-progress-track"
              role="progressbar"
              aria-valuenow={Math.round(((k + 1) / total) * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="hero-progress-fill"
                style={{
                  width: `${Math.round(((k + 1) / total) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
