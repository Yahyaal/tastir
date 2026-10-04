import type { Vec } from '@tastir/engine';
import type { Model } from './model';

/** How one element enters the drawing. */
export type EffectKind = 'flash' | 'compass' | 'ruler' | 'pop';

export interface Effect {
  readonly name: string;
  readonly kind: EffectKind;
  /** Milliseconds from the start of the step. */
  readonly delay: number;
  readonly duration: number;
}

/** One step's drawing at normal speed, in milliseconds. */
export const STEP_MS = 800;
/** The flash of the highlighted elements before a step draws. */
export const FLASH_MS = 600;
/** The accent the current step is drawn in (--current in styles.css). */
const ACCENT = '#c2410c';
/** The share of a step spent drawing lines and circles; points pop after. */
const DRAW_SHARE = 0.75;

/** The names a step highlights, with groups such as `k` opened up. */
export function highlightedNames(model: Model, step: number): string[] {
  const names = model.tutorial.steps[step - 1]?.highlight ?? [];
  return names.flatMap((name) => {
    const g = model.scene.elements.get(name)?.geometry;
    return g?.kind === 'group' ? [...g.members] : [name];
  });
}

/**
 * The timing of one construction step: its highlighted elements flash,
 * then its lines and circles draw one after another, then its new points
 * pop in. Drawing takes STEP_MS / speed; the flash comes first.
 */
export function planStep(
  model: Model,
  step: number,
  speed = 1,
  { flash = true } = {},
): Effect[] {
  const total = STEP_MS / speed;
  const flashed = flash ? highlightedNames(model, step) : [];
  const start = flashed.length ? FLASH_MS / speed : 0;
  const made = [...model.scene.elements.values()].filter(
    (el) => el.step === step,
  );
  const curves = made.filter((el) =>
    ['line', 'circle', 'polygon'].includes(el.geometry.kind),
  );
  const points = made.filter((el) => el.geometry.kind === 'point');
  const drawTime =
    curves.length === 0 ? 0 : points.length ? total * DRAW_SHARE : total;
  const each = curves.length ? drawTime / curves.length : 0;
  const effects: Effect[] = flashed.map((name) => ({
    name,
    kind: 'flash',
    delay: 0,
    duration: start,
  }));
  curves.forEach((el, i) => {
    effects.push({
      name: el.name,
      kind: el.geometry.kind === 'circle' ? 'compass' : 'ruler',
      delay: start + i * each,
      duration: each,
    });
  });
  // Points pop in one after another in what is left of the step.
  const popTime = total - drawTime;
  const pop = Math.min(popTime, 200 / speed);
  const gap = points.length > 1 ? (popTime - pop) / (points.length - 1) : 0;
  points.forEach((el, i) => {
    effects.push({
      name: el.name,
      kind: 'pop',
      delay: start + drawTime + i * gap,
      duration: pop,
    });
  });
  return effects;
}

/**
 * The length of a shape's stroke on screen, in pixels. Strokes do not
 * scale with the view (vector-effect: non-scaling-stroke), and browsers
 * then measure dashes in screen pixels, so the dash must match this.
 */
function screenLength(node: SVGElement, lengthScale: number): number {
  const shape = node as Partial<SVGGeometryElement>;
  if (typeof shape.getTotalLength !== 'function') return 1;
  const m = shape.getScreenCTM?.();
  const scale = m ? Math.hypot(m.a, m.b) : 1;
  // A pixel more, so no sliver of gap shows at the end.
  return shape.getTotalLength() * scale * lengthScale + 1;
}

function keyframes(
  kind: EffectKind,
  node: SVGElement,
  lengthScale: number,
): Keyframe[] {
  if (kind === 'flash') {
    // Twice bright and back, on the node's own color.
    if (node.tagName === 'text') {
      return [{}, { fill: ACCENT }, {}, { fill: ACCENT }, {}];
    }
    if (node.classList.contains('mark')) {
      const big = { fill: ACCENT, transform: 'scale(1.8)' };
      return [{}, big, {}, big, {}];
    }
    const bold = { stroke: ACCENT, strokeWidth: '3px' };
    return [{}, bold, {}, bold, {}];
  }
  if (kind === 'pop') {
    return [
      { transform: 'scale(0)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1 },
    ];
  }
  // One dash as long as the shape slides in from its start.
  const len = screenLength(node, lengthScale);
  const dash = `${len} ${len}`;
  return [
    { strokeDasharray: dash, strokeDashoffset: len },
    { strokeDasharray: dash, strokeDashoffset: 0 },
  ];
}

/**
 * Runs the effects on the drawing's nodes (marked with data-name). Forward,
 * each node is hidden until its turn; reversed, the step undraws in the
 * opposite order and stays hidden. Browsers without the Web Animations API
 * simply show the result.
 */
export function play(
  svg: SVGSVGElement | null,
  effects: readonly Effect[],
  {
    reverse = false,
    // How much longer strokes will be on screen by the end, when the view
    // is zooming in at the same time.
    lengthScale = 1,
  } = {},
): Animation[] {
  if (!svg) return [];
  const total = Math.max(0, ...effects.map((e) => e.delay + e.duration));
  const animations: Animation[] = [];
  for (const effect of effects) {
    const nodes = svg.querySelectorAll<SVGElement>(
      `[data-name="${effect.name}"]`,
    );
    for (const node of nodes) {
      if (typeof node.animate !== 'function') continue;
      animations.push(
        node.animate(keyframes(effect.kind, node, lengthScale), {
          duration: effect.duration,
          delay: reverse
            ? total - effect.delay - effect.duration
            : effect.delay,
          easing: effect.kind === 'pop' ? 'ease-out' : 'ease-in-out',
          direction: reverse ? 'reverse' : 'normal',
          // A flash leaves the element as it was; drawing hides the new
          // element until its turn, and undrawing leaves it hidden.
          fill:
            effect.kind === 'flash'
              ? 'none'
              : reverse
                ? 'forwards'
                : 'backwards',
        }),
      );
    }
  }
  return animations;
}

/**
 * Where the compass sweep of a circle starts, in degrees in the tutorial
 * frame: at the point it is drawn through, or where it touches its first
 * target, else at 0°.
 */
export function compassStart(model: Model, name: string): number {
  const el = model.scene.elements.get(name);
  if (el?.geometry.kind !== 'circle') return 0;
  const { centre } = el.geometry.circle;
  for (const dep of el.deps.slice(1)) {
    const g = model.scene.elements.get(dep)?.geometry;
    let at: Vec | undefined;
    if (g?.kind === 'point') at = g.at;
    if (g?.kind === 'line') {
      const { point: p, dir: d } = g.line;
      const t = (centre.x - p.x) * d.x + (centre.y - p.y) * d.y;
      at = { x: p.x + d.x * t, y: p.y + d.y * t };
    }
    if (g?.kind === 'circle') at = g.circle.centre;
    if (at && Math.hypot(at.x - centre.x, at.y - centre.y) > 1e-9) {
      return (Math.atan2(at.y - centre.y, at.x - centre.x) * 180) / Math.PI;
    }
  }
  return 0;
}
