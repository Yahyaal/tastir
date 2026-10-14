import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { planStep, play, playInk } from './animation';
import { fullView } from './camera';
import { tutorialColoring } from './coloring';
import { Construction, orderedPaletteColors, Thumbnail } from './drawing';
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
 * Plays the construction step by step, inks it, then shows it colored, and
 * starts again; with reduced motion it shows the colored pattern only.
 */
function HeroPlay({ model }: { model: Model }) {
  const beats = useMemo(() => shownBeats(model.tutorial), [model]);
  const all = beatsOf(model.tutorial).length;
  const reduced = useMemo(prefersReducedMotion, []);
  const [k, setK] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);
  const view = useMemo(() => fullView(model), [model]);
  const panelModel = useMemo(() => asPanel(model), [model]);
  const n = beats.length;

  // The hero colours the pattern brightly, whatever the tutorial's own
  // palette (the twelve-fold rosette is Mamluk wood, all browns).
  const coloring = useMemo(
    () => ({ ...tutorialColoring(model), palette: HERO_PALETTE, chosen: {} }),
    [model],
  );
  const palette = useMemo(
    () => orderedPaletteColors(model, coloring, view),
    [model, coloring, view],
  );
  const colorSteps = palette.length;
  const total = n + colorSteps + 3;

  const isFadingLines = k === n + 1;
  const isColoring = k >= n + 2 && k <= n + 1 + colorSteps;
  const isFinished = k > n + 1 + colorSteps;
  const coloredUpTo = isFinished ? undefined : isColoring ? k - (n + 1) : 0;
  const colorIndex = isColoring ? k - n - 2 : isFinished ? colorSteps - 1 : -1;
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
    const ends = anims.map(
      (a) => Number(a.effect?.getComputedTiming().endTime ?? 0) || 0,
    );
    const wait =
      k === total - 1
        ? HERO_HOLD_MS
        : isFadingLines
          ? 1100
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
          : isColoring
            ? `${model.tutorial.title}: coloring — ${colorNames} (${colorIndex + 1} of ${colorSteps})`
            : `${model.tutorial.title}: step ${k + 1} of ${n}`;

  return (
    <>
      <div className={`plate-frame ${isColoring ? 'coloring-active' : ''}`}>
        {reduced ? (
          <Thumbnail model={model} coloring={coloring} view={view} />
        ) : isFinished ? (
          <Thumbnail
            model={model}
            coloring={coloring}
            view={view}
            coloredUpTo={colorSteps}
            activeColorIndex={-1}
          />
        ) : isColoring ? (
          <Thumbnail
            model={model}
            coloring={coloring}
            view={view}
            coloredUpTo={coloredUpTo}
            activeColorIndex={colorIndex}
          />
        ) : isFadingLines ? (
          <>
            <Thumbnail
              model={model}
              coloring={coloring}
              view={view}
              coloredUpTo={0}
              activeColorIndex={-1}
            />
            <Construction
              model={panelModel}
              upTo={all}
              view={view}
              svgRef={svgRef}
              ink
              enter
              fadeLines
            />
          </>
        ) : k === n ? (
          <Construction
            model={panelModel}
            upTo={all}
            view={view}
            svgRef={svgRef}
            ink
            enter
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
