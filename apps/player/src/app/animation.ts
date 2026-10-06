import type { Vec } from '@tastir/engine';
import { beatsOf, inkBeatsOf, type Model } from './model';

/** How one element enters the drawing. */
export type EffectKind = 'flash' | 'compass' | 'ruler' | 'pop';

export interface Effect {
  readonly name: string;
  readonly kind: EffectKind;
  /** Milliseconds from the start of the step. */
  readonly delay: number;
  readonly duration: number;
}

/** The name shared by the ink a step makes, when inking as you go. */
export const FRESH_INK = 'ink-fresh';
/** How long a step's new ink takes to draw, at normal speed. */
export const INK_STEP_MS = 700;

/** One step's drawing at normal speed, in milliseconds. */
export const STEP_MS = 800;
/** The flash of the highlighted elements before a step draws. */
export const FLASH_MS = 600;
/** The accent the current step is drawn in (--current in styles.css). */
const ACCENT = '#d55e00';
/** The share of a step spent drawing lines and circles; points pop after. */
const DRAW_SHARE = 0.75;

/** A name, or the members of the group it names (such as `k`). */
function opened(model: Model, name: string): string[] {
  const g = model.scene.elements.get(name)?.geometry;
  return g?.kind === 'group' ? [...g.members] : [name];
}

/**
 * The names a beat (a step, or a part of one) highlights, flashed before
 * it draws, with groups opened.
 */
export function highlightedNames(model: Model, step: number): string[] {
  const names = beatsOf(model.tutorial)[step - 1]?.highlight ?? [];
  return names.flatMap((name) => opened(model, name));
}

/**
 * The names a step works from, shown in blue while it is on screen: its
 * `highlight` list, or else the earlier elements its new ones are built
 * from (looking through the step's own points to what made them).
 */
export function usedNames(model: Model, step: number): string[] {
  const { elements } = model.scene;
  const open = (name: string) => opened(model, name);
  if (beatsOf(model.tutorial)[step - 1]?.highlight)
    return highlightedNames(model, step);
  const found = new Set<string>();
  const seen = new Set<string>();
  const visit = (name: string) => {
    if (seen.has(name)) return;
    seen.add(name);
    const el = elements.get(name);
    if (!el) return;
    if (el.beat === step) el.deps.forEach(visit);
    else for (const n of open(name)) found.add(n);
  };
  for (const el of elements.values()) if (el.beat === step) visit(el.name);
  return [...found];
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
  { flash = true, ink = false } = {},
): Effect[] {
  const total = STEP_MS / speed;
  const flashed = flash ? highlightedNames(model, step) : [];
  const start = flashed.length ? FLASH_MS / speed : 0;
  const made = [...model.scene.elements.values()].filter(
    (el) => el.beat === step,
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
  // Inking as you go: the ink this step makes is drawn once it is built.
  if (ink && inkBeatsOf(model).includes(step)) {
    effects.push({
      name: FRESH_INK,
      kind: 'ruler',
      delay: start + total,
      duration: INK_STEP_MS / speed,
    });
  }
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

/** Pen speed for inking, in screen pixels per second at normal speed. */
const PEN_SPEED = 420;
/** Longest the inking may take at normal speed, in milliseconds. */
const INK_MAX_MS = 14000;
/** The pen lifts and moves between paths. */
const PEN_LIFT_MS = 90;
/** Laying the ruler along the next line. */
const RULER_MS = 250;
/** How long a finished line takes to settle from red to black. */
const SETTLE_MS = 450;

interface PenStroke {
  /** Index into model.pattern.ink. */
  readonly index: number;
  /** Drawn from b to a instead of a to b. */
  readonly reversed: boolean;
}

/** One ruler position: every ink stretch along one straight line. */
export interface RulerLine {
  /** Direction of the line, in degrees in [0, 180). */
  readonly angle: number;
  /** The stretches along it, in drawing order, each from its start. */
  readonly strokes: readonly PenStroke[];
  /** Where the ruler lies: a little past the first and last stretch. */
  readonly from: Vec;
  readonly to: Vec;
  /** Whether a parallel line was drawn just before (same direction). */
  readonly parallelToPrevious: boolean;
}

const turnDiff = (p: number, q: number) =>
  Math.abs(((((p - q) % 180) + 270) % 180) - 90);

/**
 * The order a person with a ruler would ink the pattern: lay the ruler
 * once along each line and draw every stretch on it, and draw parallel
 * lines one after the other. Directions that carry the most ink go first,
 * so the long lines are drawn before the short ones that join them, and
 * parallel lines go across in order.
 */
export function rulerOrder(model: Model): RulerLine[] {
  const ink = model.pattern.ink;
  const lines: { angle: number; offset: number; dir: Vec; items: number[] }[] =
    [];
  ink.forEach(({ segment: { a, b } }, index) => {
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (len < 1e-12) return;
    let dir = { x: (b.x - a.x) / len, y: (b.y - a.y) / len };
    if (dir.y < -1e-9 || (Math.abs(dir.y) <= 1e-9 && dir.x < 0))
      dir = { x: -dir.x, y: -dir.y };
    const angle =
      ((((Math.atan2(dir.y, dir.x) * 180) / Math.PI) % 180) + 180) % 180;
    const offset = -dir.y * a.x + dir.x * a.y;
    const same = lines.find(
      (l) =>
        turnDiff(l.angle, angle) < 1e-4 &&
        Math.abs(-l.dir.y * a.x + l.dir.x * a.y - l.offset) < 1e-6,
    );
    if (same) same.items.push(index);
    else lines.push({ angle, offset, dir, items: [index] });
  });
  const length = (i: number) => {
    const { a, b } = ink[i]!.segment;
    return Math.hypot(b.x - a.x, b.y - a.y);
  };
  // Lines grouped by direction.
  const families: (typeof lines)[] = [];
  for (const l of lines) {
    const fam = families.find((f) => turnDiff(f[0]!.angle, l.angle) < 1e-3);
    if (fam) fam.push(l);
    else families.push([l]);
  }
  const inkOf = (f: typeof lines) =>
    f.reduce((s, l) => s + l.items.reduce((t, i) => t + length(i), 0), 0);
  families.sort((p, q) => inkOf(q) - inkOf(p) || p[0]!.angle - q[0]!.angle);
  const out: RulerLine[] = [];
  for (const fam of families) {
    // Line offsets measured with one shared direction, so they sort across.
    const d0 = fam[0]!.dir;
    const across = (l: (typeof lines)[number]) =>
      l.offset * (l.dir.x * d0.x + l.dir.y * d0.y);
    fam.sort((p, q) => across(p) - across(q));
    fam.forEach((l, k) => {
      const along = (p: Vec) => p.x * l.dir.x + p.y * l.dir.y;
      const strokes = l.items
        .map((index) => {
          const { a, b } = ink[index]!.segment;
          const ta = along(a);
          const tb = along(b);
          return {
            index,
            reversed: tb < ta,
            t: Math.min(ta, tb),
            u: Math.max(ta, tb),
          };
        })
        .sort((p, q) => p.t - q.t);
      const t0 = strokes[0]!.t;
      const t1 = Math.max(...strokes.map((s) => s.u));
      const pad = (t1 - t0) * 0.12 + 0.05;
      const base = { x: -l.dir.y * l.offset, y: l.dir.x * l.offset };
      const at = (t: number) => ({
        x: base.x + l.dir.x * t,
        y: base.y + l.dir.y * t,
      });
      out.push({
        angle: l.angle,
        strokes: strokes.map(({ index, reversed }) => ({ index, reversed })),
        from: at(t0 - pad),
        to: at(t1 + pad),
        parallelToPrevious: k > 0,
      });
    });
  }
  return out;
}

/** The pale blue of the ruler and of a parallel line it is laid against. */
export const RULER_COLOR = '#2563eb';
/** The tile's outline. */
export const TILE_COLOR = '#16a34a';

/**
 * Inks the pattern with a ruler: for each line of rulerOrder, the ruler
 * (data-ruler) appears along it, the parallel line drawn just before
 * flashes blue, and every stretch on the line draws from its start at pen
 * speed, red while drawing and then settling to black; the pen lifts over
 * the gaps. Last, the tile's outline (data-tile) is traced in green.
 */
export function playInk(
  svg: SVGSVGElement | null,
  model: Model,
  speed = 1,
  { lengthScale = 1 } = {},
): Animation[] {
  if (!svg) return [];
  const lines = new Map<number, SVGLineElement>();
  svg.querySelectorAll<SVGLineElement>('[data-ink]').forEach((n) => {
    lines.set(Number(n.dataset['ink']), n);
  });
  const rulers = [...svg.querySelectorAll<SVGLineElement>('[data-ruler]')];
  const order = rulerOrder(model);
  const lengths = new Map<number, number>();
  let total = 0;
  for (const r of order) {
    for (const { index } of r.strokes) {
      const node = lines.get(index);
      const len = node ? screenLength(node, lengthScale) : 0;
      lengths.set(index, len);
      total += len;
    }
  }
  const lifts = order.length * (PEN_LIFT_MS + RULER_MS);
  const pxPerMs = Math.max(
    (PEN_SPEED * speed) / 1000,
    total / Math.max(1, INK_MAX_MS / speed - lifts),
  );
  const animations: Animation[] = [];
  const can = (n: Element | undefined | null): n is SVGElement =>
    !!n && typeof (n as SVGElement).animate === 'function';
  // A moment on the finished construction before the ruler comes down.
  let t = 400 / speed;
  order.forEach((r, k) => {
    const ruler = rulers[k];
    const start = t;
    t += RULER_MS / speed;
    if (r.parallelToPrevious) {
      for (const { index } of order[k - 1]!.strokes) {
        const prev = lines.get(index);
        if (can(prev))
          animations.push(
            prev.animate(
              [{}, { stroke: RULER_COLOR }, { stroke: RULER_COLOR }, {}],
              { duration: 700 / speed, delay: start, fill: 'none' },
            ),
          );
      }
    }
    r.strokes.forEach(({ index, reversed }, s) => {
      const node = lines.get(index);
      const len = lengths.get(index) ?? 0;
      const dur = Math.max(30, len / pxPerMs);
      if (s > 0) t += PEN_LIFT_MS / 2 / speed;
      if (can(node)) {
        const dash = `${len} ${len}`;
        animations.push(
          node.animate(
            [
              {
                strokeDasharray: dash,
                strokeDashoffset: reversed ? -len : len,
                stroke: ACCENT,
              },
              { strokeDasharray: dash, strokeDashoffset: 0, stroke: ACCENT },
            ],
            { duration: dur, delay: t, easing: 'linear', fill: 'backwards' },
          ),
          node.animate([{ stroke: ACCENT }, {}], {
            duration: SETTLE_MS,
            delay: t + dur,
            easing: 'ease-out',
            fill: 'backwards',
          }),
        );
      }
      t += dur;
    });
    if (can(ruler))
      animations.push(
        ruler.animate(
          [
            { opacity: 0 },
            { opacity: 0.35, offset: 0.15 },
            { opacity: 0.35, offset: 0.85 },
            { opacity: 0 },
          ],
          { duration: t - start + 150 / speed, delay: start, fill: 'none' },
        ),
      );
    t += PEN_LIFT_MS / speed;
  });
  const tile = svg.querySelector<SVGPolygonElement>('[data-tile]');
  if (can(tile)) {
    const len = screenLength(tile, lengthScale);
    const dash = `${len} ${len}`;
    animations.push(
      tile.animate(
        [
          { strokeDasharray: dash, strokeDashoffset: len },
          { strokeDasharray: dash, strokeDashoffset: 0 },
        ],
        {
          duration: 1200 / speed,
          delay: t + 300 / speed,
          easing: 'ease-in-out',
          fill: 'backwards',
        },
      ),
    );
  }
  return animations;
}
