import { lazy, Suspense, useMemo, useState } from 'react';
import { DrawAlongPage } from '../along/DrawAlong';
import { Editor } from '../editor/Editor';
import { playable } from '../editor/patterns';
import { getDesign } from './designs';
import { LIBRARY, listed, type Entry } from './library';
import { Library } from './Library';
import { WorkPage } from './YourWork';
import { Broken, MissingDesign, Play } from './Player';
import { useRoute } from './routing';
import { openShared, useShared } from './Sharing';

/**
 * The overnight review page (#/review). Its pictures come from the private
 * docs/research folder through the dev server, so it exists only in dev and
 * is left out of the production bundle.
 */
const Review = import.meta.env.DEV
  ? lazy(() => import('../review/Review').then((m) => ({ default: m.Review })))
  : undefined;

/** The studio (#/studio): drawings shared with AI agents, on the dev server
 * and in the hosted studio's build (VITE_TASTIR_STUDIO=hosted), never in the
 * public site. */
const StudioPage =
  import.meta.env.DEV || import.meta.env['VITE_TASTIR_STUDIO'] === 'hosted'
    ? lazy(() =>
        import('../studio/StudioPage').then((m) => ({ default: m.StudioPage })),
      )
    : undefined;

const AgentHost =
  import.meta.env.DEV && import.meta.env.VITE_TASTIR_AGENT
    ? lazy(() =>
        import('../agent/AgentHost').then((m) => ({ default: m.AgentHost })),
      )
    : undefined;

/**
 * The project notes (#/notes): the docs a new session reads first, shown in
 * the app. Like the review page, it exists only on the dev server.
 */
const Notes = import.meta.env.DEV
  ? lazy(() => import('../review/Notes').then((m) => ({ default: m.Notes })))
  : undefined;

/**
 * The plan for user-made patterns (#/plan), with its questions for the
 * owner. Like the review page, it exists only on the dev server.
 */
const Plan = import.meta.env.DEV
  ? lazy(() => import('../review/Plan').then((m) => ({ default: m.Plan })))
  : undefined;

/** Colour: how it works and suggestions (#/plan/colors), dev server only. */
const ColorsPlan = import.meta.env.DEV
  ? lazy(() =>
      import('../review/ColorsPlan').then((m) => ({
        default: m.ColorsPlan,
      })),
    )
  : undefined;

/** The colour stage mock (#/plan/colour-stage), dev server only. */
const ColourStagePlan = import.meta.env.DEV
  ? lazy(() =>
      import('../review/ColourStagePlan').then((m) => ({
        default: m.ColourStagePlan,
      })),
    )
  : undefined;

/** The plan for drawing along (#/plan/draw-along), dev server only. */
const DrawAlongPlan = import.meta.env.DEV
  ? lazy(() =>
      import('../review/DrawAlongPlan').then((m) => ({
        default: m.DrawAlongPlan,
      })),
    )
  : undefined;

/** Curatorial roadmap of upcoming patterns (#/upcoming). */
const UpcomingPatterns = lazy(() =>
  import('./UpcomingPatterns').then((m) => ({
    default: m.UpcomingPatterns,
  })),
);

export { Library } from './Library';
export { Play, Player } from './Player';
/** The library, or the tutorial the address names. */
export function App({
  entries: library = LIBRARY,
}: {
  entries?: readonly Entry[];
}) {
  const route = useRoute();
  return (
    <>
      {import.meta.env.DEV ? (
        <div
          data-tastir-page
          data-tastir-route={route}
          style={{ display: 'contents' }}
        >
          <AppPage route={route} library={library} />
        </div>
      ) : (
        <AppPage route={route} library={library} />
      )}
      {AgentHost ? (
        <Suspense
          fallback={
            route === 'agent' ? <p>Loading the drawing assistant…</p> : null
          }
        >
          <AgentHost route={route} library={library} />
        </Suspense>
      ) : null}
    </>
  );
}

function AppPage({
  route,
  library,
}: {
  route: string;
  library: readonly Entry[];
}) {
  // #/mine/p… plays the learner's own pattern p like a library tutorial.
  const ownId = /^mine\/([^/]+)/.exec(route)?.[1];
  const own = useMemo(
    () => (ownId === undefined ? undefined : playable(ownId)),
    [ownId],
  );
  const entries = useMemo(
    () => (own && 'entry' in own ? [...library, own.entry] : library),
    [own, library],
  );
  if (!route) return <Library entries={listed(library)} />;
  if (route === 'agent')
    return import.meta.env.DEV ? null : (
      <Broken message="The local assistant is available through pnpm dev:agent." />
    );
  if (route === 'work') return <WorkPage entries={library} />;
  if (route === 'studio' || route.startsWith('studio/'))
    return StudioPage ? (
      <Suspense fallback={<p>Loading the studio…</p>}>
        <StudioPage key={route} route={route} />
      </Suspense>
    ) : (
      <Broken message="The studio only exists on the dev server (pnpm studio)." />
    );
  if (route === 'upcoming') {
    return (
      <Suspense
        fallback={<p className="review-loading">Loading upcoming patterns…</p>}
      >
        <UpcomingPatterns />
      </Suspense>
    );
  }
  if (ownId !== undefined && !(own && 'entry' in own))
    return <NotPlayable id={ownId} reason={own?.reason} />;
  if (route === 'review') {
    return Review ? (
      <Suspense fallback={<p className="review-loading">Loading…</p>}>
        <Review />
      </Suspense>
    ) : (
      <Broken message="The review page only exists on the dev server (pnpm dev)." />
    );
  }
  if (route === 'plan/colors') {
    return ColorsPlan ? (
      <Suspense fallback={<p className="review-loading">Loading…</p>}>
        <ColorsPlan />
      </Suspense>
    ) : (
      <Broken message="The colour notes only exist on the dev server (pnpm dev)." />
    );
  }
  if (route === 'plan/colour-stage') {
    return ColourStagePlan ? (
      <Suspense fallback={<p className="review-loading">Loading…</p>}>
        <ColourStagePlan />
      </Suspense>
    ) : (
      <Broken message="The colour stage plan only exists on the dev server (pnpm dev)." />
    );
  }
  if (route === 'plan/draw-along') {
    return DrawAlongPlan ? (
      <Suspense fallback={<p className="review-loading">Loading…</p>}>
        <DrawAlongPlan />
      </Suspense>
    ) : (
      <Broken message="The plan only exists on the dev server (pnpm dev)." />
    );
  }
  if (route === 'plan') {
    return Plan ? (
      <Suspense fallback={<p className="review-loading">Loading…</p>}>
        <Plan />
      </Suspense>
    ) : (
      <Broken message="The plan only exists on the dev server (pnpm dev)." />
    );
  }
  if (route === 'notes' || route.startsWith('notes/')) {
    return Notes ? (
      <Suspense fallback={<p className="review-loading">Loading…</p>}>
        <Notes page={route.slice('notes/'.length) || 'start'} />
      </Suspense>
    ) : (
      <Broken message="The project notes only exist on the dev server (pnpm dev)." />
    );
  }
  // #/shared/code opens a pattern from a share link.
  if (route.startsWith('shared/'))
    return (
      <SharedPage
        key={route}
        code={route.slice('shared/'.length)}
        library={library}
      />
    );
  // #/edit/p opens one of the learner's own patterns in the editor.
  if (route.startsWith('edit/'))
    return <Editor key={route} id={route.slice('edit/'.length)} />;
  // #/id/design/d opens a saved design at its wall.
  const mine = /^(.+)\/design\/([^/]+)$/.exec(route);
  if (mine) {
    const [, tutorial = '', designId = ''] = mine;
    const design = getDesign(designId);
    const entry = entries.find((e) => e.id === tutorial);
    if (entry && design?.tutorial === tutorial)
      return (
        <Play
          key={route}
          json={entry.json}
          design={design}
          address={tutorial}
        />
      );
    return (
      <MissingDesign
        tutorial={entry ? tutorial : undefined}
        design={design}
        known={design ? entries.some((e) => e.id === design.tutorial) : false}
      />
    );
  }
  // #/id/draw: the learner draws the tutorial along, step by step.
  if (route.endsWith('/draw')) {
    const id = route.slice(0, -'/draw'.length);
    const entry = entries.find((e) => e.id === id);
    if (!entry)
      return <Broken message={`There is no tutorial called "${id}".`} />;
    return <DrawAlongPage key={route} json={entry.json} address={id} />;
  }
  // #/id and #/id/result open at the finished wall; #/id/watch autoplays;
  // #/id/repeat at the repeat, where drawing along goes on.
  const result = route.endsWith('/result');
  const repeat = route.endsWith('/repeat');
  const watch = route.endsWith('/watch');
  const id = result
    ? route.slice(0, -'/result'.length)
    : repeat
      ? route.slice(0, -'/repeat'.length)
      : watch
        ? route.slice(0, -'/watch'.length)
        : route;
  const entry = entries.find((e) => e.id === id);
  if (!entry)
    return <Broken message={`There is no tutorial called "${route}".`} />;
  return (
    <Play
      key={route}
      json={entry.json}
      start={watch ? 'beginning' : repeat ? 'repeat' : 'result'}
      address={id}
    />
  );
}

/** A pattern from a share link: played at its wall, with Keep a copy. */
function SharedPage({
  code,
  library,
}: {
  code: string;
  library: readonly Entry[];
}) {
  const shared = useShared(code);
  const opened = useMemo(
    () => (shared ? openShared(shared, library) : undefined),
    [shared, library],
  );
  const [refused, setRefused] = useState(false);
  if (shared === undefined)
    return (
      <div className="player loading" role="status">
        <p>Opening the shared pattern…</p>
      </div>
    );
  if (shared === null || !opened || 'reason' in opened)
    return (
      <Broken
        message={
          opened && 'reason' in opened
            ? opened.reason
            : 'This share link cannot be read. It may have been cut short when it was copied.'
        }
      />
    );
  return (
    <Play
      json={opened.json}
      design={opened.design}
      address="shared"
      banner={
        <div className="shared-banner">
          <span>A pattern shared with you: “{opened.design.name}”.</span>
          <button
            type="button"
            onClick={() => {
              const to = opened.keep();
              if (to) window.location.hash = to;
              else setRefused(true);
            }}
          >
            Keep a copy in this browser
          </button>
          {refused ? (
            <span className="refused" role="alert">
              This browser would not keep it: its storage is blocked or full.
            </span>
          ) : null}
        </div>
      }
    />
  );
}

/** One of the learner's own patterns that cannot be played (yet). */
function NotPlayable({ id, reason }: { id: string; reason?: string }) {
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
        <h1>
          {reason
            ? 'This pattern cannot be played yet'
            : 'This pattern is not here'}
        </h1>
        <p>
          {reason ??
            'There is no such pattern in this browser. Your own patterns are kept only in the browser they were made in.'}
        </p>
        <p className="notice-links">
          {reason ? (
            <a className="button" href={`#/edit/${id}`}>
              Open it in the editor
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

export default App;
