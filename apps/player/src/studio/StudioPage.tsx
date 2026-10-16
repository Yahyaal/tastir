import { useCallback, useEffect, useRef, useState } from 'react';
import type { Draft } from '../editor/document';
import { EditorPage, type SharedDrawing } from '../editor/Editor';
import { keepPattern, type UserPattern } from '../editor/patterns';
import { ThemeSwitch } from '../app/theme';
import { studioCall, type HistoryLine, type ProjectLine } from './client';
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
  const id = route.split('/')[1];
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
  const [error, setError] = useState<string>();
  const [title, setTitle] = useState('');
  const load = useCallback(() => {
    studioCall<ProjectLine[]>('GET', '/projects')
      .then(setProjects)
      .catch((e: Error) => setError(e.message));
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
  return (
    <div className="player studio">
      <Top />
      <section className="notice studio-list">
        <h1>Studio</h1>
        <p>
          Patterns you share with AI agents. Agents connect through the studio's
          MCP server; see the setup notes on the notes page.
        </p>
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

/** Calls back on every change any studio client makes. */
function useStudioEvents(
  onChange: (event: {
    project: string;
    revision: number;
    kind?: 'drawing' | 'notes' | 'marks' | 'reference';
  }) => void,
) {
  const latest = useRef(onChange);
  latest.current = onChange;
  useEffect(() => {
    const source = new EventSource('/__studio/events');
    source.onmessage = (e) => {
      try {
        latest.current(JSON.parse(e.data as string));
      } catch {
        // A message that does not parse is ignored.
      }
    };
    return () => source.close();
  }, []);
}

interface Loaded {
  readonly revision: number;
  readonly draft: Draft;
  readonly history: { readonly undo: readonly HistoryLine[] };
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
        setNotice(
          /has changed since revision/.test(e.message)
            ? 'An agent changed the drawing at the same moment, so your last change was not kept. Undo brings it back.'
            : e.message,
        );
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
  }, [id, fetchLatest]);

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
  });

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
    refused: notice !== undefined,
    status:
      notice ??
      `Studio, revision ${loaded.revision}${last ? `. Last: ${last.author}, ${last.label}` : ''}`,
    marks: marks.map((m) => m.target),
    aside: (
      <StudioPanel
        id={id}
        marks={marks}
        notes={notes}
        onPosted={reload}
        reference={loaded.reference}
        revision={loaded.revision}
      />
    ),
    onPlay: () => {
      if (keepPattern(pattern.id, shown.current ?? loaded.draft))
        window.location.hash = `#/mine/${pattern.id}`;
      else setNotice('This browser would not keep a copy to play.');
    },
  };
  return <EditorPage key={id} pattern={pattern} shared={shared} />;
}
