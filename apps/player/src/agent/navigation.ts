import { pageColorObservation, pageColorRevision } from './pageColoring';
import {
  SnapshotShape,
  type Destination,
  type Snapshot,
} from '@tastir/agent-protocol';
import type { Entry } from '../app/library';
import { listPatterns, playable } from '../editor/patterns';
import { listDesigns } from '../app/designs';
import { captureBoard } from './capture';
import { boardTargets, controls, pointingRevision } from './screenTargets';

const safeId = (id: string) => /^[A-Za-z0-9_-]+$/.test(id);
const titleOf = (entry: Entry) =>
  entry.preview?.title ?? (entry.json as { title?: string })?.title ?? entry.id;

/** Only routes derived from the real library and saved records are callable. */
export function destinationsOf(library: readonly Entry[]): Destination[] {
  const destinations: Destination[] = [
    {
      id: 'library',
      title: 'All patterns — Tastir library',
      route: '',
      kind: 'library',
    },
    {
      id: 'work',
      title: 'Your work — saved patterns, designs and drawings',
      route: 'work',
      kind: 'work',
    },
    {
      id: 'assistant',
      title: 'Drawing assistant workspace — return to your editable drawing',
      route: 'agent',
      kind: 'assistant',
    },
  ];
  for (const entry of library) {
    if (!safeId(entry.id)) continue;
    for (const [kind, suffix, label] of [
      ['wall', '', 'Color the wall'],
      ['watch', '/watch', 'Watch the construction'],
      ['draw', '/draw', 'Draw along'],
    ] as const)
      destinations.push({
        id: `${kind}:${entry.id}`,
        title: `${titleOf(entry)} — ${label}`,
        route: `${entry.id}${suffix}`,
        kind,
      });
  }
  const patterns = listPatterns().slice(0, 100);
  const playableIds = new Set<string>();
  for (const pattern of patterns) {
    if (!safeId(pattern.id)) continue;
    destinations.push({
      id: `editor:${pattern.id}`,
      title:
        `${pattern.tutorial.title} — Edit saved pattern (last changed ${pattern.updated})`.slice(
          0,
          300,
        ),
      route: `edit/${pattern.id}`,
      kind: 'editor',
    });
    // Only offer playable patterns. An unfinished draft still has its editor destination.
    const result = playable(pattern.id);
    if (result && 'entry' in result) {
      playableIds.add(`mine/${pattern.id}`);
      destinations.push({
        id: `wall:mine/${pattern.id}`,
        title:
          `${pattern.tutorial.title} — Color saved pattern (last changed ${pattern.updated})`.slice(
            0,
            300,
          ),
        route: `mine/${pattern.id}`,
        kind: 'wall',
      });
    }
  }
  for (const design of listDesigns().slice(0, 100)) {
    if (
      !safeId(design.id) ||
      !(
        library.some((e) => safeId(e.id) && e.id === design.tutorial) ||
        playableIds.has(design.tutorial)
      )
    )
      continue;
    destinations.push({
      id: `design:${design.id}`,
      title: `${design.name} — Open saved design (last changed ${design.updated})`,
      route: `${design.tutorial}/design/${design.id}`,
      kind: 'wall',
    });
  }
  return destinations.slice(0, 500);
}

export const currentRoute = () => {
  const hash = window.location.hash.replace(/^#\/?/, '');
  try {
    return decodeURIComponent(hash);
  } catch {
    return hash;
  }
};
const page = () => document.querySelector<HTMLElement>('[data-tastir-page]');
const committedRoute = () =>
  page()?.querySelector<HTMLElement>('[data-tastir-screen]')?.dataset[
    'tastirScreen'
  ] ?? page()?.dataset['tastirRoute'];
const sameScreenRoute = (a: string | undefined, b: string) =>
  a?.replace(/\/result$/, '') === b.replace(/\/result$/, '');
export const visibleDrawing = () =>
  [...(page()?.querySelectorAll<SVGSVGElement>('svg.drawing') ?? [])].find(
    (svg) => {
      const box = svg.getBoundingClientRect();
      return (
        box.width > 0 &&
        box.height > 0 &&
        getComputedStyle(svg).visibility !== 'hidden'
      );
    },
  );

/** Includes real page changes without sending markup or form values as instructions. */
export function pageRevision(includePointing = true) {
  const root = page();
  const svg = visibleDrawing();
  const data = JSON.stringify([
    currentRoute(),
    committedRoute(),
    pageColorRevision(),
    root?.textContent,
    svg?.getAttribute('viewBox'),
    svg
      ? [
          svg.getBoundingClientRect().x,
          svg.getBoundingClientRect().y,
          svg.getBoundingClientRect().width,
          svg.getBoundingClientRect().height,
        ]
      : null,
    includePointing ? pointingRevision(svg) : null,
    [...(root?.querySelectorAll('[aria-pressed]') ?? [])].map((n) =>
      n.getAttribute('aria-pressed'),
    ),
    [
      ...(root?.querySelectorAll<HTMLInputElement>('input,select,textarea') ??
        []),
    ].map((n) => n.value),
    window.innerWidth,
    window.innerHeight,
    window.scrollX,
    window.scrollY,
    document.documentElement.dataset['theme'],
  ]);
  let hash = 2166136261;
  for (let i = 0; i < data.length; i++)
    hash = Math.imul(hash ^ data.charCodeAt(i), 16777619);
  return `screen:${currentRoute()}:${hash >>> 0}`;
}

export function screenInfo(destinations: Destination[]) {
  const route = currentRoute();
  const root = page();
  const title =
    root?.querySelector('h1')?.textContent?.trim() ||
    destinations.find((d) => d.route === route)?.title ||
    'Tastir';
  return {
    route,
    title: title.slice(0, 300),
    description: (/^(review|notes)(\/|$)/.test(route)
      ? ''
      : (root?.innerText ?? root?.textContent ?? '')
    )
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 2000),
    destinations,
  };
}

export async function observeScreen(
  destinations: Destination[],
): Promise<Snapshot> {
  if (!sameScreenRoute(committedRoute(), currentRoute()))
    throw new Error(
      'The page is still changing. Send it again when it is ready.',
    );
  const svg = visibleDrawing();
  // Let finite stroke/camera animations settle before describing their geometry.
  const deadline = performance.now() + 5_000;
  while (
    svg?.isConnected &&
    performance.now() < deadline &&
    svg
      .getAnimations?.({ subtree: true })
      .some(
        (a) =>
          a.playState === 'running' &&
          a.effect?.getTiming().iterations !== Infinity,
      )
  ) {
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
  }
  if (!sameScreenRoute(committedRoute(), currentRoute()))
    throw new Error(
      'The page changed while its drawing was settling. Send it again.',
    );
  const revision = pageRevision();
  const image = svg ? await captureBoard(svg) : null;
  if (pageRevision() !== revision)
    throw new Error('The page changed during capture. Send it again.');
  const screen = screenInfo(destinations);
  return SnapshotShape.parse({
    id: crypto.randomUUID(),
    documentId: `screen:${screen.route || 'library'}`,
    // Navigation depends on page state; pointing also depends on current target exposure.
    documentRevision: pageRevision(false),
    viewRevision: revision,
    title: screen.title,
    selected: null,
    targets: [...boardTargets(svg), ...controls().map((c) => c.target)],
    image,
    screen,
    mode: 'screen',
    ...pageColorObservation(),
  });
}

function destinationReady(destination: Destination) {
  if (!sameScreenRoute(committedRoute(), destination.route)) return false;
  if (destination.kind === 'assistant')
    return !!document.querySelector('.agent-board svg')?.getBoundingClientRect()
      .width;
  if (destination.kind === 'library')
    return !!page()?.querySelector('.library');
  if (destination.kind === 'work') return !!page()?.querySelector('.work-page');
  if (destination.kind === 'editor') return !!page()?.querySelector('.editor');
  return !page()?.querySelector('.player.loading') && !!visibleDrawing();
}

/** Uses the normal hash router and never confirms its unsaved-change guard. */
export async function navigateTo(
  id: string,
  observation: Snapshot,
  live: Destination[],
  signal: AbortSignal,
): Promise<Destination> {
  const destination = observation.screen?.destinations.find((d) => d.id === id);
  if (
    !destination ||
    !live.some((d) => d.id === id && d.route === destination.route)
  )
    throw new Error(
      'That destination is not available in the current page. Send a new view.',
    );
  signal.throwIfAborted();
  const from = currentRoute();
  window.location.hash = `#/${destination.route}`;
  const deadline = performance.now() + 10_000;
  let stable = 0;
  while (performance.now() < deadline) {
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
    signal.throwIfAborted();
    if (currentRoute() !== destination.route) {
      if (currentRoute() === from)
        throw new Error(
          'Navigation stayed on the current page. Resolve its unsaved-change question, then send the view again.',
        );
      throw new Error(
        'The page changed during navigation. No further action was taken.',
      );
    }
    if (destinationReady(destination)) {
      if (++stable >= 2) return destination;
    } else stable = 0;
  }
  throw new Error(
    'The destination did not finish opening. Check the page and send its view again.',
  );
}
