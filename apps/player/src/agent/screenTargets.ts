import type { Ref } from 'react';
import {
  pointInPolygon,
  type Geometry,
  type SceneElement,
} from '@tastir/engine';
import type { Snapshot } from '@tastir/agent-protocol';
import { geometryVisible } from './visibility';
import type { Rect } from '../app/camera';

type Target = Snapshot['targets'][number];
type BoardReader = (svg: SVGSVGElement, box: Rect) => Target[];
const boards = new WeakMap<
  SVGSVGElement,
  { read: BoardReader; source: unknown; stage?: number }
>();
const controlIds = new WeakMap<Element, string>();
let nextControl = 0;

/** Dev-only renderer registration: geometry comes from the actual drawing, never the model. */
export function boardRef(
  ref: Ref<SVGSVGElement> | undefined,
  read: BoardReader,
  source?: unknown,
  stage?: number,
) {
  let previous: SVGSVGElement | null = null;
  return (svg: SVGSVGElement | null) => {
    if (previous) boards.delete(previous);
    previous = svg;
    if (typeof ref === 'function') ref(svg);
    else if (ref) ref.current = svg;
    if (svg) boards.set(svg, { read, source, stage });
  };
}

export function sceneTargets(elements: Iterable<SceneElement>): Target[] {
  return [...elements].flatMap(({ name, geometry }) =>
    geometry.kind === 'group' || name.length > 170
      ? []
      : [
          {
            id: `geometry:${name}`,
            kind: geometry.kind,
            geometry: { ...geometry, name },
          },
        ],
  );
}

export const screenRoot = () =>
  document.querySelector<HTMLElement>('[data-tastir-page]');
const modal = () =>
  [
    ...(screenRoot()?.querySelectorAll<HTMLElement>(
      '[role="alertdialog"], [role="dialog"], dialog[open]',
    ) ?? []),
  ].find(visibleElement);
export function visibleElement(node: Element) {
  const r = node.getBoundingClientRect();
  return (
    node.isConnected &&
    paintedElement(node) &&
    !node.closest('[hidden], [inert], [aria-hidden="true"]') &&
    (!node.checkVisibility ||
      node.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) &&
    getComputedStyle(node).visibility !== 'hidden' &&
    r.width > 0 &&
    r.height > 0 &&
    r.right > 0 &&
    r.bottom > 0 &&
    r.left < window.innerWidth &&
    r.top < window.innerHeight
  );
}

/** SVG strokes can have a zero-height box; inspect their paint visibility separately. */
export function paintedElement(node: Element) {
  if (node.closest('[hidden], [inert], [aria-hidden="true"]')) return false;
  for (let el: Element | null = node; el; el = el.parentElement) {
    const style = getComputedStyle(el);
    if (
      style.opacity === '0' ||
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      style.visibility === 'collapse'
    )
      return false;
  }
  return true;
}

/** Largest unobscured part of a board, excluding the assistant panel itself. */
export function boardWindow(svg: SVGSVGElement) {
  const r = svg.getBoundingClientRect();
  let box = {
    left: Math.max(0, r.left),
    top: Math.max(0, r.top),
    right: Math.min(window.innerWidth, r.right),
    bottom: Math.min(window.innerHeight, r.bottom),
  };
  const blockers = [
    ...document.querySelectorAll(
      '.agent-dock:not([hidden]), [data-tastir-page] .original',
    ),
  ].filter(visibleElement);
  for (const blocker of blockers) {
    const dock = blocker.getBoundingClientRect();
    if (
      dock.left >= box.right ||
      dock.right <= box.left ||
      dock.top >= box.bottom ||
      dock.bottom <= box.top
    )
      continue;
    box = [
      { ...box, right: Math.min(box.right, dock.left) },
      { ...box, left: Math.max(box.left, dock.right) },
      { ...box, bottom: Math.min(box.bottom, dock.top) },
      { ...box, top: Math.max(box.top, dock.bottom) },
    ].sort(
      (a, b) =>
        Math.max(0, b.right - b.left) * Math.max(0, b.bottom - b.top) -
        Math.max(0, a.right - a.left) * Math.max(0, a.bottom - a.top),
    )[0]!;
  }
  return box;
}

export function boardBox(svg: SVGSVGElement): Rect | undefined {
  const matrix = svg.getScreenCTM?.();
  const r = boardWindow(svg);
  if (!matrix || !matrix.a || r.right <= r.left || r.bottom <= r.top) return;
  const inverse = matrix.inverse();
  const points = [
    [r.left, r.top],
    [r.right, r.bottom],
  ].map(([x, y]) => new DOMPoint(x, y).matrixTransform(inverse));
  return {
    minX: Math.min(...points.map((p) => p.x)),
    maxX: Math.max(...points.map((p) => p.x)),
    minY: Math.min(...points.map((p) => -p.y)),
    maxY: Math.max(...points.map((p) => -p.y)),
  };
}

export function boardTargets(svg: SVGSVGElement | undefined): Target[] {
  if (!svg || modal() || !visibleElement(svg)) return [];
  // An animated stroke is not yet the settled geometry the model would point at.
  if (
    svg
      .getAnimations?.({ subtree: true })
      .some((a) => a.playState === 'running')
  )
    return [];
  const box = boardBox(svg);
  if (!box) return [];
  try {
    return (boards.get(svg)?.read(svg, box) ?? [])
      .filter((t) => {
        const g = t.geometry as unknown as Geometry;
        return (
          geometryVisible(g, box) ||
          (g.kind === 'polygon' &&
            pointInPolygon(
              { x: (box.minX + box.maxX) / 2, y: (box.minY + box.maxY) / 2 },
              g.vertices,
            ))
        );
      })
      .slice(0, 4800);
  } catch {
    return [];
  }
}

function controlLabel(node: Element) {
  const labelled = node
    .getAttribute('aria-labelledby')
    ?.split(/\s+/)
    .map((id) => document.getElementById(id)?.textContent ?? '')
    .join(' ');
  const labels =
    'labels' in node
      ? [...((node as HTMLInputElement).labels ?? [])]
          .map((l) => l.textContent)
          .join(' ')
      : '';
  return (
    node.getAttribute('aria-label') ||
    labelled ||
    labels ||
    node.textContent ||
    node.getAttribute('title') ||
    ''
  )
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);
}
export function controls() {
  const root = modal() ?? screenRoot();
  return [
    ...(root?.querySelectorAll<HTMLElement>(
      'button, a[href], select, input[type="color"], input[type="checkbox"], input[type="radio"], input[type="range"]',
    ) ?? []),
  ]
    .filter((node) => {
      if (!visibleElement(node) || !controlLabel(node)) return false;
      const r = node.getBoundingClientRect();
      const x = Math.max(
        0,
        Math.min(window.innerWidth - 1, r.left + r.width / 2),
      );
      const y = Math.max(
        0,
        Math.min(window.innerHeight - 1, r.top + r.height / 2),
      );
      const top = document.elementFromPoint?.(x, y);
      return !top || node.contains(top);
    })
    .slice(0, 200)
    .map((node) => {
      let id = controlIds.get(node);
      if (!id) {
        id = `control:${++nextControl}`;
        controlIds.set(node, id);
      }
      const target: Target = {
        id,
        kind: 'control',
        geometry: {
          label: controlLabel(node),
          role: node.getAttribute('role') || node.tagName.toLowerCase(),
          enabled: !node.matches(':disabled, [aria-disabled="true"]'),
        },
      };
      return { node, target };
    });
}

export function pointingRevision(svg: SVGSVGElement | undefined) {
  return [
    boardTargets(svg),
    controls().map(({ node, target }) => {
      const r = node.getBoundingClientRect();
      return [target, r.x, r.y, r.width, r.height];
    }),
  ];
}

export const boardIdentity = (svg: SVGSVGElement) => boards.get(svg);
