import { checkedDraftEdit } from '../agent/pageEditor';
import { COMPANION_ACTOR, projectHistory } from '../agent/projectHistory';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Draft } from '../editor/document';
import { EditorPage, type SharedDrawing } from '../editor/Editor';
import { keepPattern, type UserPattern } from '../editor/patterns';
import { ThemeSwitch } from '../app/theme';
import {
  HOSTED,
  SignedOut,
  setLive,
  studioCall,
  studioUrl,
  useStudioEvents,
  type HistoryLine,
  type ProjectLine,
} from './client';
import { ContestPage } from './ContestPage';
import { onTop, readKept, writeKept, type Kept } from './kept';
import {
  StudioPanel,
  useNotes,
  type Mark,
  type ReferenceLine,
} from './StudioPanel';
import './studio.css';

/**
 * The studio (#/studio, dev server only): the shared projects that agents
 * work on through the studio's MCP server, and each one open in the normal
 * editor, where the owner's changes and the agents' meet.
 */
export function StudioPage({ route }: { route: string }) {
  const signedIn = useSignedIn();
  if (signedIn === false) return <SignIn route={route} />;
  if (signedIn === undefined)
    return (
      <div className="player studio">
        <Top />
        <p className="notice">Loading…</p>
      </div>
    );
  return <StudioRoute route={route} />;
}

/**
 * Whether the owner may use the studio: always on this computer; on the
 * hosted site only once signed in. The rest of Tastir needs no sign-in.
 */
function useSignedIn(): boolean | undefined {
  const [state, setState] = useState<boolean | undefined>(
    HOSTED ? undefined : true,
  );
  useEffect(() => {
    if (!HOSTED) return;
    studioCall<{ live?: boolean }>('GET', '/me')
      .then((me) => {
        setLive(!!me.live);
        setState(true);
      })
      .catch((e: Error) => setState(e instanceof SignedOut ? false : true));
  }, []);
  return state;
}

function SignIn({ route }: { route: string }) {
  const next = `/#/${route}`;
  return (
    <div className="player studio">
      <Top />
      <section className="notice studio-list">
        <h1>Sign in to use the studio</h1>
        <p>
          The studio is where you and AI agents work on the same patterns. It is
          private, so it needs you to sign in. Everything else in Tastir works
          without signing in.
        </p>
        <p className="notice-links">
          <a
            className="button"
            href={`/login?next=${encodeURIComponent(next)}`}
          >
            Sign in with Google
          </a>
          <a className="button secondary" href="#/">
            All patterns
          </a>
        </p>
      </section>
    </div>
  );
}

function StudioRoute({ route }: { route: string }) {
  const [, id, contest] = route.split('/');
  if (id === 'contest' && contest)
    return (
      <div className="player studio">
        <Top />
        <ContestPage key={contest} id={contest} />
      </div>
    );
  return id ? <StudioProject key={id} id={id} /> : <StudioList />;
}

function Top({ children }: { children?: React.ReactNode }) {
  return (
    <header className="topbar">
      <a className="home" href="#/">
        <span className="wordmark">Tastir</span>
        <span>All patterns</span>
      </a>
      {children}
      <ThemeSwitch />
    </header>
  );
}

function StudioList() {
  const [projects, setProjects] = useState<ProjectLine[]>();
  const [contests, setContests] = useState<
    {
      id: string;
      brief: { title: string };
      designs: unknown[];
      judged: boolean;
    }[]
  >();
  const [error, setError] = useState<string>();
  const [title, setTitle] = useState('');
  const load = useCallback(() => {
    studioCall<ProjectLine[]>('GET', '/projects')
      .then(setProjects)
      .catch((e: Error) => setError(e.message));
    studioCall<NonNullable<typeof contests>>('GET', '/contests')
      .then(setContests)
      .catch(() => undefined);
  }, []);
  useEffect(load, [load]);
  useStudioEvents(load);
  const create = (e: React.FormEvent) => {
    e.preventDefault();
    studioCall<{ project: string }>('POST', '/projects', {
      author: 'owner',
      title: title.trim() || 'Studio pattern',
    })
      .then((made) => {
        window.location.hash = `#/studio/${made.project}`;
      })
      .catch((e: Error) => setError(e.message));
  };
  const importProject = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const zip = String(reader.result).replace(/^data:[^,]*,/, '');
      studioCall<{ project: string }>('POST', '/projects/import', {
        author: 'owner',
        zip,
      })
        .then((made) => {
          window.location.hash = `#/studio/${made.project}`;
        })
        .catch((e: Error) => setError(e.message));
    };
    reader.readAsDataURL(file);
  };
  return (
    <div className="player studio">
      <Top />
      <section className="notice studio-list">
        <h1>Studio</h1>
        <p>
          Patterns you share with AI agents. Agents connect through the studio's
          MCP server; see the setup notes on the notes page.
        </p>
        {HOSTED ? (
          <p className="notice-links">
            <a className="button secondary" href="/connections">
              Connected apps
            </a>
          </p>
        ) : null}
        {error ? (
          <p className="studio-error" role="alert">
            {error}
          </p>
        ) : null}
        <form className="studio-new" onSubmit={create}>
          <label htmlFor="studio-title">New project from O and A</label>
          <input
            id="studio-title"
            type="text"
            maxLength={120}
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button type="submit" className="button">
            Start
          </button>
        </form>
        <label className="studio-import">
          <span>Import a project (.zip from Export)</span>
          <input
            type="file"
            accept=".zip,application/zip"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) importProject(file);
              e.target.value = '';
            }}
          />
        </label>
        {contests?.length ? (
          <>
            <h2>Contests</h2>
            <ul className="studio-projects">
              {contests.map((c) => (
                <li key={c.id}>
                  <a href={`#/studio/contest/${c.id}`}>{c.brief.title}</a>{' '}
                  <span className="studio-meta">
                    {c.designs.length} designs,{' '}
                    {c.judged ? 'judged' : 'not judged yet'}
                  </span>
                </li>
              ))}
            </ul>
            <h2>Projects</h2>
          </>
        ) : null}
        {projects === undefined && !error ? <p>Loading…</p> : null}
        {projects?.length === 0 ? <p>No projects yet.</p> : null}
        {projects?.length ? (
          <ul className="studio-projects">
            {projects.map((p) => (
              <li key={p.id}>
                <a href={`#/studio/${p.id}`}>{p.title}</a>{' '}
                <span className="studio-meta">
                  revision {p.revision}, changed{' '}
                  {new Date(p.updated).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}

interface Loaded {
  readonly revision: number;
  readonly draft: Draft;
  readonly history: {
    readonly undo: readonly HistoryLine[];
    readonly redo: readonly HistoryLine[];
  };
  readonly reference: ReferenceLine | null;
}

/** A plain label for the owner's change, from what it altered. */
function labelOf(before: Draft, after: Draft): string {
  if (after.title !== before.title) return 'Renamed in Tastir';
  if (after.steps.length > before.steps.length)
    return `Added step ${after.steps.length} in Tastir`;
  if (after.steps.length < before.steps.length)
    return 'Deleted steps in Tastir';
  if (JSON.stringify(after.ink) !== JSON.stringify(before.ink))
    return 'Inked in Tastir';
  if (JSON.stringify(after.pattern) !== JSON.stringify(before.pattern))
    return 'Changed the tile or colors in Tastir';
  return 'Edited in Tastir';
}

function StudioProject({ id }: { id: string }) {
  const [loaded, setLoaded] = useState<Loaded>();
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  // The revision this page's drawing is at, and whether a change of ours
  // is on its way, so the studio's report of our own change is not taken
  // for someone else's.
  const revision = useRef(0);
  const pending = useRef<Draft | undefined>(undefined);
  const sending = useRef(false);
  const behind = useRef(false);
  const shown = useRef<Draft | undefined>(undefined);
  // The owner's change the studio refused, kept until the owner decides.
  const [kept, setKeptState] = useState<Kept | undefined>(() => readKept(id));
  const setKept = useCallback(
    (next: Kept | undefined) => {
      writeKept(id, next);
      setKeptState(next);
    },
    [id],
  );

  const fetchLatest = useCallback(() => {
    studioCall<Loaded>('GET', `/projects/${id}/draft`)
      .then((next) => {
        if (next.revision <= revision.current) return;
        revision.current = next.revision;
        shown.current = next.draft;
        setLoaded(next);
      })
      .catch((e: Error) => setError(e.message));
  }, [id]);
  useEffect(fetchLatest, [fetchLatest]);

  const flush = useCallback(() => {
    const draft = pending.current;
    if (!draft || sending.current) return;
    pending.current = undefined;
    sending.current = true;
    const before = shown.current ?? draft;
    studioCall<Pick<Loaded, 'revision' | 'history'>>(
      'POST',
      `/projects/${id}/edit`,
      {
        author: 'owner',
        revision: revision.current,
        label: labelOf(before, draft),
        edit: { op: 'replace', draft },
      },
    )
      .then((done) => {
        revision.current = done.revision;
        shown.current = draft;
        setNotice(undefined);
        setLoaded((l) =>
          l ? { ...l, revision: done.revision, history: done.history } : l,
        );
      })
      .catch((e: Error) => {
        pending.current = undefined;
        if (/has changed since revision/.test(e.message)) {
          setKept({ base: before, mine: draft });
          setNotice(
            'An agent changed the drawing while you were editing. Your change is kept under the steps.',
          );
        } else setNotice(e.message);
        behind.current = true;
      })
      .finally(() => {
        sending.current = false;
        if (pending.current) flush();
        else if (behind.current) {
          behind.current = false;
          fetchLatest();
        }
      });
  }, [id, fetchLatest, setKept]);

  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const save = useCallback(
    (draft: Draft) => {
      pending.current = draft;
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, 300);
    },
    [flush],
  );
  useEffect(() => () => clearTimeout(timer.current), []);

  // Notes and marks are fetched again when the studio says they changed.
  const [marks, setMarks] = useState<readonly Mark[]>([]);
  const [notesChanged, setNotesChanged] = useState(0);
  const { notes, reload } = useNotes(id, notesChanged);
  const loadMarks = useCallback(() => {
    studioCall<{ marks: Mark[] }>('GET', `/projects/${id}/marks`)
      .then((r) => setMarks(r.marks))
      .catch(() => undefined);
  }, [id]);
  useEffect(loadMarks, [loadMarks]);

  useStudioEvents((event) => {
    if (event.project !== id) return;
    if (event.kind === 'marks') return loadMarks();
    if (event.kind === 'notes') return setNotesChanged((n) => n + 1);
    if (event.kind === 'reference') {
      studioCall<Loaded>('GET', `/projects/${id}/draft`)
        .then((next) =>
          setLoaded((l) => (l ? { ...l, reference: next.reference } : l)),
        )
        .catch(() => undefined);
      return;
    }
    if (event.revision <= revision.current) return;
    if (sending.current || pending.current) behind.current = true;
    else fetchLatest();
  }, id);

  const [busy, setBusy] = useState(false);
  const addOnTop = (draft: Draft, latest: Draft) => {
    setBusy(true);
    studioCall<Pick<Loaded, 'revision' | 'history'>>(
      'POST',
      `/projects/${id}/edit`,
      {
        author: 'owner',
        revision: revision.current,
        label: `${labelOf(latest, draft)}, kept after a clash`,
        edit: { op: 'replace', draft },
      },
    )
      .then((done) => {
        revision.current = done.revision;
        shown.current = draft;
        setKept(undefined);
        setNotice(undefined);
        setLoaded((l) =>
          l
            ? { ...l, draft, revision: done.revision, history: done.history }
            : l,
        );
      })
      .catch((e: Error) => {
        setNotice(
          /has changed since revision/.test(e.message)
            ? 'An agent changed the drawing again first. Your change is still kept; try again.'
            : e.message,
        );
        fetchLatest();
      })
      .finally(() => setBusy(false));
  };
  const keepCopy = (mine: Draft) => {
    setBusy(true);
    const title = `${mine.title} (your version)`.slice(0, 120);
    studioCall<{ project: string }>('POST', '/projects', {
      author: 'owner',
      title,
    })
      .then(async (made) => {
        const fresh = await studioCall<Loaded>(
          'GET',
          `/projects/${made.project}/draft`,
        );
        await studioCall('POST', `/projects/${made.project}/edit`, {
          author: 'owner',
          revision: fresh.revision,
          label: `Kept from ${loaded?.draft.title ?? 'another project'}`,
          edit: { op: 'replace', draft: { ...mine, title } },
        });
        setKept(undefined);
        window.location.hash = `#/studio/${made.project}`;
      })
      .catch((e: Error) => setNotice(e.message))
      .finally(() => setBusy(false));
  };

  // Shared tools acknowledge only saved server edits, never a local optimistic
  // change. Keep a manual draft made while this request was on its way (M1).
  const mutateShared = async (
    expected: number,
    endpoint: 'edit' | 'travel',
    data: Record<string, unknown>,
  ) => {
    if (sending.current || pending.current || kept)
      throw new Error(
        'Finish saving or recover your kept change before asking for another shared edit.',
      );
    if (revision.current !== expected)
      throw new Error('The shared drawing changed. Send a new view first.');
    const before = shown.current!;
    sending.current = true;
    try {
      await studioCall('POST', `/projects/${id}/${endpoint}`, {
        ...data,
        revision: expected,
      });
      const next = await studioCall<Loaded>('GET', `/projects/${id}/draft`);
      revision.current = next.revision;
      shown.current = next.draft;
      if (pending.current) {
        setKept({ base: before, mine: pending.current });
        pending.current = undefined;
        setNotice(
          'Your change made while the shared edit was saving is kept under the steps.',
        );
      } else setNotice(undefined);
      setLoaded(next);
    } catch (error) {
      if (pending.current) {
        setKept({ base: before, mine: pending.current });
        pending.current = undefined;
      }
      fetchLatest();
      throw error;
    } finally {
      sending.current = false;
      if (behind.current) {
        behind.current = false;
        fetchLatest();
      }
    }
  };

  if (error && !loaded)
    return (
      <div className="player studio">
        <Top />
        <section className="notice">
          <h1>This studio project cannot open</h1>
          <p>{error}</p>
          <p className="notice-links">
            <a className="button secondary" href="#/studio">
              All studio projects
            </a>
          </p>
        </section>
      </div>
    );
  if (!loaded)
    return (
      <div className="player studio">
        <Top />
        <p className="notice">Loading…</p>
      </div>
    );
  const last = loaded.history.undo[0];
  const pattern: UserPattern = {
    id: `studio-${id}`,
    tutorial: loaded.draft,
    created: '',
    updated: '',
  };
  const shared: SharedDrawing = {
    incoming: loaded.draft,
    save,
    canUndo: loaded.history.undo.length > 0,
    canRedo: loaded.history.redo.length > 0,
    travel: (direction, mine = false) => {
      void mutateShared(loaded.revision, 'travel', {
        author: 'owner',
        direction,
        steps: 1,
        mine,
        command: crypto.randomUUID(),
      }).catch((error: Error) => setNotice(error.message));
    },
    agent: {
      route: `studio/${id}`,
      revision: loaded.revision,
      history: projectHistory(loaded.history),
      apply: async (call, _snapshot, requestId, signal) => {
        const digest = await crypto.subtle.digest(
          'SHA-256',
          new TextEncoder().encode(JSON.stringify([requestId, call.id])),
        );
        const command = `assistant:${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
        signal?.throwIfAborted();
        if (call.name === 'travel_history') {
          await mutateShared(loaded.revision, 'travel', {
            author: COMPANION_ACTOR,
            command,
            direction: call.arguments.direction,
            steps: call.arguments.steps,
            mine: call.arguments.scope === 'assistant',
          });
        } else {
          const draft = checkedDraftEdit(loaded.draft, call);
          await mutateShared(loaded.revision, 'edit', {
            author: COMPANION_ACTOR,
            command,
            label:
              'label' in call.arguments
                ? call.arguments.label
                : 'Assistant edit',
            edit: { op: 'replace', draft },
          });
        }
        return 'Saved the shared project through Studio history. A fresh view follows.';
      },
    },
    refused: notice !== undefined,
    status:
      notice ??
      `Studio, revision ${loaded.revision}${last ? `. Last: ${last.author}, ${last.label}` : ''}`,
    marks: marks.map((m) => m.target),
    aside: (
      <>
        {kept ? (
          <KeptChange
            kept={kept}
            latest={loaded.draft}
            busy={busy}
            onTop={addOnTop}
            onCopy={keepCopy}
            onDiscard={() => {
              setKept(undefined);
              setNotice(undefined);
            }}
          />
        ) : null}
        <section aria-label="Shared history">
          <h2>Shared history</h2>
          <p>
            Undo reverses the latest edit. Undo mine stops at someone else’s
            work.
          </p>
          <button
            type="button"
            className="button secondary"
            disabled={!loaded.history.undo.length || busy}
            onClick={() => shared.travel?.('undo', true)}
          >
            Undo mine
          </button>
        </section>
        <StudioPanel
          id={id}
          marks={marks}
          notes={notes}
          onPosted={reload}
          reference={loaded.reference}
          revision={loaded.revision}
        />
        <p className="notice-links">
          <a
            className="button secondary"
            href={studioUrl(`/projects/${id}/export`)}
            download
          >
            Export project
          </a>
        </p>
      </>
    ),
    onPlay: () => {
      if (keepPattern(pattern.id, shown.current ?? loaded.draft))
        window.location.hash = `#/mine/${pattern.id}`;
      else setNotice('This browser would not keep a copy to play.');
    },
  };
  return <EditorPage key={id} pattern={pattern} shared={shared} />;
}

/** The owner's refused change, with what can be done with it. */
function KeptChange({
  kept,
  latest,
  busy,
  onTop: add,
  onCopy,
  onDiscard,
}: {
  kept: Kept;
  latest: Draft;
  busy: boolean;
  onTop: (draft: Draft, latest: Draft) => void;
  onCopy: (mine: Draft) => void;
  onDiscard: () => void;
}) {
  const result = onTop(kept, latest);
  return (
    <section className="studio-kept" aria-label="Your kept change">
      <h2>Your change is kept</h2>
      <p>
        An agent saved a change while you were editing, so the studio did not
        save yours: “{labelOf(kept.base, kept.mine)}”. The drawing now shows the
        agent’s version.
      </p>
      {result && 'reason' in result ? (
        <p className="studio-error">{result.reason}</p>
      ) : null}
      <p className="studio-kept-actions">
        {result && 'draft' in result ? (
          <button
            type="button"
            className="button"
            disabled={busy}
            onClick={() => add(result.draft, latest)}
          >
            Add my change on top
          </button>
        ) : null}
        <button
          type="button"
          className="button secondary"
          disabled={busy}
          onClick={() => onCopy(kept.mine)}
        >
          Keep mine as a copy
        </button>
        <button
          type="button"
          className="button secondary"
          disabled={busy}
          onClick={onDiscard}
        >
          Discard mine
        </button>
      </p>
    </section>
  );
}
