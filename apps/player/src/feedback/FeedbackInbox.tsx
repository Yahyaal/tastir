import { useEffect, useState } from 'react';
import {
  FeedbackSnapshotShape,
  feedbackCanonicalJson,
  parseTutorial,
} from '@tastir/schema';
import { type Entry } from '../app/library';
import { addPattern } from '../editor/patterns';
import { ThemeSwitch } from '../app/theme';
import { Play } from '../app/Player';
import { beatsOf, shownBeats, stagesOf } from '../app/model';
import type { FeedbackContext } from '@tastir/schema';
import {
  feedbackCall,
  feedbackDownload,
  FeedbackFailure,
  type Report,
  type ReportLine,
} from './client';
import './feedback.css';

type Stats = {
  enabled: boolean;
  paused: boolean;
  attachmentsPaused: boolean;
  cleanupAt: string | null;
  counts: { moderation: string; count: number }[];
  used: Record<string, number>;
};
type Bundle = {
  goal: string;
  instructions: string;
  reports: {
    id: string;
    message: string;
    image?: string;
    [key: string]: unknown;
  }[];
};

export function FeedbackInbox({
  route,
  entries,
}: {
  route: string;
  entries: readonly Entry[];
}) {
  const [csrf, setCsrf] = useState('');
  const [error, setError] = useState('');
  const [signedOut, setSignedOut] = useState(false);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    void feedbackCall<{ csrf: string }>('owner/feedback/session')
      .then((s) => {
        if (active) {
          setCsrf(s.csrf);
          setError('');
          setSignedOut(false);
        }
      })
      .catch((e: FeedbackFailure) => {
        if (active) {
          setError(e.message);
          setSignedOut(e.status === 401);
        }
      });
    return () => {
      active = false;
    };
  }, [refresh]);
  const id = route.split('/')[1];
  return (
    <main className="feedback-inbox">
      <nav className="feedback-actions">
        <a href="#/">All patterns</a>
        <a href="#/feedback">Feedback inbox</a>
        <a href="/connections">Agent connections</a>
        <ThemeSwitch />
      </nav>
      <h1>Pattern feedback</h1>
      {!csrf ? (
        <>
          <p role="status">{error || 'Checking owner sign-in…'}</p>
          {signedOut ? (
            <a
              className="button"
              href={`/login?next=${encodeURIComponent('/#/feedback')}`}
            >
              Sign in to review feedback
            </a>
          ) : (
            <button onClick={() => setRefresh((n) => n + 1)}>Retry</button>
          )}
        </>
      ) : id ? (
        <ReportDetail key={id} id={id} csrf={csrf} entries={entries} />
      ) : (
        <Inbox csrf={csrf} />
      )}
    </main>
  );
}

function Inbox({ csrf }: { csrf: string }) {
  const [rows, setRows] = useState<ReportLine[]>([]);
  const [stats, setStats] = useState<Stats>();
  const [status, setStatus] = useState('new');
  const [moderation, setModeration] = useState('inbox');
  const [pattern, setPattern] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [more, setMore] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [exporting, setExporting] = useState(false);
  useEffect(() => {
    let active = true;
    setBusy(true);
    const query = new URLSearchParams({
      moderation,
      offset: String(offset),
      ...(status ? { status } : {}),
      ...(pattern ? { pattern } : {}),
      ...(groupFilter ? { group: groupFilter } : {}),
      ...(search ? { search } : {}),
    });
    void (async () => {
      const value = await feedbackCall<{
        reports: ReportLine[];
        more: boolean;
      }>(`owner/feedback?${query}`);
      const counts = await feedbackCall<Stats>('owner/feedback/stats');
      if (active) {
        setRows(value.reports);
        setMore(value.more);
        setStats(counts);
        setSelected([]);
        setError('');
      }
    })()
      .catch((e: Error) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
    // Search fields are applied explicitly by the filter form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset, refresh]);
  async function bulk(value: string) {
    setBusy(true);
    setError('');
    try {
      for (const id of selected) {
        const row = rows.find((r) => r.id === id);
        if (!row)
          throw new Error(
            'The selection changed. Reload the inbox before continuing.',
          );
        if (value === 'delete')
          await feedbackCall(`owner/feedback/${id}`, undefined, csrf, 'DELETE');
        else
          await feedbackCall(
            `owner/feedback/${id}`,
            { version: row.version, moderation: value },
            csrf,
          );
      }
      setRefresh((n) => n + 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function controls(data: unknown) {
    setBusy(true);
    setError('');
    try {
      await feedbackCall('owner/feedback/controls', data, csrf);
      setRefresh((n) => n + 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <details>
        <summary>Intake, capacity and retention</summary>
        {stats ? (
          <>
            <p>
              Production intake:{' '}
              {stats.enabled
                ? stats.paused
                  ? 'paused'
                  : 'enabled'
                : 'disabled in server settings'}
              . Last successful cleanup:{' '}
              {stats.cleanupAt
                ? new Date(stats.cleanupAt).toLocaleString()
                : 'not recorded — run cleanup and check the schedule'}
              .
            </p>
            <p>
              {stats.counts
                .map((c) => `${c.moderation}: ${c.count}`)
                .join(' · ') || 'No reports yet'}
            </p>
            <p>
              Reports today: {stats.used['accepted:global'] ?? 0}/500. Image
              bytes today: {stats.used['image:day'] ?? 0}/{20 * 1024 * 1024}.
              Retained image bytes: {stats.used['image:retained'] ?? 0}/
              {250 * 1024 * 1024}.
            </p>
            <div className="feedback-actions">
              <button
                disabled={busy}
                onClick={() => void controls({ paused: !stats.paused })}
              >
                {stats.paused ? 'Resume intake' : 'Pause intake'}
              </button>
              <button
                disabled={busy}
                onClick={() =>
                  void controls({ attachmentsPaused: !stats.attachmentsPaused })
                }
              >
                {stats.attachmentsPaused
                  ? 'Resume attachments'
                  : 'Pause attachments'}
              </button>
              <button
                disabled={busy}
                onClick={() => {
                  setBusy(true);
                  void feedbackCall<{ failed: number; more: boolean }>(
                    'owner/feedback/cleanup',
                    {},
                    csrf,
                  )
                    .then((r) => {
                      setRefresh((n) => n + 1);
                      setError(
                        r.failed
                          ? `${r.failed} cleanup operations need retrying.`
                          : r.more
                            ? 'Cleanup made progress. Run it again to continue.'
                            : 'Cleanup finished.',
                      );
                    })
                    .catch((e: Error) => setError(e.message))
                    .finally(() => setBusy(false));
                }}
              >
                Run bounded cleanup
              </button>
            </div>
          </>
        ) : (
          <p>Loading capacity…</p>
        )}
      </details>
      <form
        className="feedback-filters"
        onSubmit={(e) => {
          e.preventDefault();
          setOffset(0);
          setRefresh((n) => n + 1);
        }}
      >
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {['new', 'reviewing', 'resolved', 'archived'].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          View
          <select
            value={moderation}
            onChange={(e) => setModeration(e.target.value)}
          >
            {['inbox', 'quarantined', 'spam'].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          Pattern ID
          <input
            maxLength={160}
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
          />
        </label>
        <label>
          Search message
          <input
            maxLength={200}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label>
          Issue group
          <input
            maxLength={160}
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
          />
        </label>
        <button disabled={busy}>Apply filters</button>
      </form>
      {error ? <p role="alert">{error}</p> : null}
      <div className="feedback-actions">
        <button
          disabled={busy || !rows.length}
          onClick={() => setSelected(rows.map((r) => r.id))}
        >
          Select this page
        </button>
        <button
          disabled={busy || !selected.length}
          onClick={() => setExporting(true)}
        >
          Prepare selected reports for AI ({selected.length})
        </button>
        <button
          disabled={busy || !selected.length}
          onClick={() => void bulk('spam')}
        >
          Mark selected as spam
        </button>
        <button
          disabled={busy || !selected.length}
          onClick={() => void bulk('inbox')}
        >
          Restore selected
        </button>
        <button
          disabled={busy || !selected.length}
          onClick={() => {
            if (
              window.confirm(
                `Delete ${selected.length} selected reports and their evidence?`,
              )
            )
              void bulk('delete');
          }}
        >
          Delete selected
        </button>
      </div>
      {busy ? (
        <p role="status">Loading…</p>
      ) : !rows.length ? (
        <p>No reports match these filters.</p>
      ) : null}
      {rows.map((r) => (
        <article key={r.id}>
          <label>
            <input
              type="checkbox"
              checked={selected.includes(r.id)}
              disabled={busy}
              onChange={(e) =>
                setSelected((s) =>
                  e.target.checked
                    ? [...s, r.id]
                    : s.filter((id) => id !== r.id),
                )
              }
            />{' '}
            Select report from {new Date(r.created).toLocaleString()}
          </label>
          <h2>
            <a href={`#/feedback/${r.id}`}>
              {r.context.title || 'Pattern issue'} · {r.context.label}
            </a>
          </h2>
          <p>
            {r.category} · {r.status} · {r.priority}
            {r.group ? ` · Group: ${r.group}` : ''}
          </p>
          <p className="feedback-message">{r.message.slice(0, 400)}</p>
        </article>
      ))}
      <div className="feedback-actions">
        <button
          disabled={busy || !offset}
          onClick={() => setOffset((n) => Math.max(0, n - 20))}
        >
          Previous reports
        </button>
        <button
          disabled={busy || !more}
          onClick={() => setOffset((n) => n + 20)}
        >
          Next reports
        </button>
      </div>
      {exporting ? (
        <ExportReports
          ids={selected}
          csrf={csrf}
          close={() => setExporting(false)}
        />
      ) : null}
    </>
  );
}

function ReportDetail({
  id,
  csrf,
  entries,
}: {
  id: string;
  csrf: string;
  entries: readonly Entry[];
}) {
  const [report, setReport] = useState<Report>();
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [group, setGroup] = useState('');
  const [status, setStatus] = useState('new');
  const [moderation, setModeration] = useState('inbox');
  const [priority, setPriority] = useState('normal');
  const [retainDays, setRetainDays] = useState('');
  const [retainEvidenceDays, setRetainEvidenceDays] = useState('');
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [versionText, setVersionText] = useState(
    'Historical replay has not been verified. The instruction below is the text the learner saw.',
  );
  const [lesson, setLesson] = useState(false);
  useEffect(() => {
    let active = true;
    void feedbackCall<Report>(`owner/feedback/${id}`)
      .then((r) => {
        if (!active) return;
        setReport(r);
        setGroup(r.group);
        setStatus(r.status);
        setModeration(r.moderation);
        setPriority(r.priority);
      })
      .catch((e: Error) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [id]);
  useEffect(() => {
    let active = true;
    const entry = entries.find((e) => e.id === report?.context.pattern);
    if (entry && report?.context.tutorialHash)
      void (async () => {
        const raw =
          typeof entry.json === 'function'
            ? await (entry.json as () => Promise<unknown>)()
            : entry.json;
        const canonical = feedbackCanonicalJson(parseTutorial(raw));
        const hash = [
          ...new Uint8Array(
            await crypto.subtle.digest(
              'SHA-256',
              new TextEncoder().encode(canonical),
            ),
          ),
        ]
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
        if (active)
          setVersionText(
            hash === report.context.tutorialHash
              ? 'The tutorial content matches the current library. The report still records the learner’s own board and app build.'
              : 'Reported on an earlier or different tutorial version. Opening today’s lesson does not reproduce the old report.',
          );
      })().catch(() => undefined);
    return () => {
      active = false;
    };
  }, [report, entries]);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!report) return;
    setBusy(true);
    setError('');
    try {
      setReport(
        await feedbackCall<Report>(
          `owner/feedback/${id}`,
          {
            version: report.version,
            status,
            moderation,
            priority,
            group,
            ...(note.trim() ? { note } : {}),
            ...(retainDays ? { retainDays: Number(retainDays) } : {}),
            ...(retainEvidenceDays
              ? { retainEvidenceDays: Number(retainEvidenceDays) }
              : {}),
          },
          csrf,
        ),
      );
      setNote('');
      setRetainDays('');
      setRetainEvidenceDays('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function constructionCopy() {
    const snapshot = FeedbackSnapshotShape.safeParse(report?.snapshot);
    if (!snapshot.success) {
      setError(
        'The drawing cannot be restored. The original evidence remains available.',
      );
      return;
    }
    const copy = addPattern({
      ...snapshot.data.draft,
      title: `Review copy: ${snapshot.data.draft.title}`.slice(0, 80),
    });
    if (!copy) {
      setError(
        'This browser could not save a separate review copy. Download the captured state instead.',
      );
      return;
    }
    window.location.hash = `#/edit/${copy.id}`;
  }
  const entry = entries.find((e) => e.id === report?.context.pattern);
  if (lesson && report && entry)
    return (
      <>
        <button onClick={() => setLesson(false)}>Back to this report</button>
        <p>{versionText}</p>
        <CurrentLesson key={report.id} entry={entry} context={report.context} />
      </>
    );
  return (
    <>
      {error ? <p role="alert">{error}</p> : null}
      {report ? (
        <>
          <h2>
            {report.context.title || 'Pattern issue'} · {report.context.label}
          </h2>
          <p>
            {new Date(report.created).toLocaleString()} · {report.category} ·
            Receipt {report.id}
          </p>
          <article>
            <h3>Learner's message</h3>
            <p className="feedback-message">{report.message}</p>
          </article>
          <article>
            <h3>Instruction shown</h3>
            <p className="feedback-message">
              {report.context.instruction ||
                'Whole-pattern feedback; no instruction attached.'}
            </p>
            <p>{versionText}</p>
            <details>
              <summary>Captured app and step details</summary>
              <pre>{JSON.stringify(report.context, null, 2)}</pre>
            </details>
          </article>
          {report.image ? (
            <img
              src={`/api/owner/feedback/${id}/image`}
              alt="Learner's board when this report was opened"
            />
          ) : null}
          <div className="feedback-actions">
            {entry ? (
              <button className="secondary" onClick={() => setLesson(true)}>
                Open current lesson at this step
              </button>
            ) : null}
            {report.snapshot ? (
              <>
                <button onClick={constructionCopy}>
                  Open construction as a separate review copy
                </button>
                <button
                  className="secondary"
                  onClick={() =>
                    feedbackDownload(
                      { context: report.context, snapshot: report.snapshot },
                      `tastir-captured-state-${id}.json`,
                    )
                  }
                >
                  Download captured state
                </button>
              </>
            ) : null}
            <button onClick={() => setExporting(true)}>Prepare for AI</button>
          </div>
          {report.snapshot ? (
            <p className="feedback-muted">
              The construction copy opens in Your patterns without replacing
              existing work. The captured state download also keeps the
              learner's ink selections, repeat placements and colors; those
              stage-specific selections are evidence rather than a replay in the
              editor.
            </p>
          ) : null}
          <details>
            <summary>Private contact</summary>
            <p>
              {report.email ||
                'No current contact address attached. Email expires after 90 days.'}
            </p>
          </details>
          <form onSubmit={(e) => void save(e)}>
            <details>
              <summary>Retention for an ongoing investigation</summary>
              <p>
                Report expiry: {new Date(report.expires).toLocaleDateString()}.
                Drawing expiry:{' '}
                {new Date(report.evidenceExpires).toLocaleDateString()}.
                Extensions are recorded in review history. Evidence already
                removed by cleanup cannot be restored.
              </p>
              <label>
                Keep report for this many days from now (optional)
                <input
                  type="number"
                  min={1}
                  max={730}
                  value={retainDays}
                  onChange={(e) => setRetainDays(e.target.value)}
                />
              </label>
              <label>
                Keep drawing evidence for this many days from now (optional)
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={retainEvidenceDays}
                  onChange={(e) => setRetainEvidenceDays(e.target.value)}
                />
              </label>
            </details>
            <div className="feedback-filters">
              <label>
                Status
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  {['new', 'reviewing', 'resolved', 'archived'].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
              <label>
                Moderation
                <select
                  value={moderation}
                  onChange={(e) => setModeration(e.target.value)}
                >
                  {['inbox', 'quarantined', 'spam'].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
              <label>
                Priority
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  {['normal', 'high'].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
              <label>
                Issue group (use the same name for related reports)
                <input
                  value={group}
                  maxLength={160}
                  onChange={(e) => setGroup(e.target.value)}
                />
              </label>
            </div>
            <label>
              Private note
              <textarea
                rows={3}
                maxLength={4000}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>
            <button disabled={busy}>{busy ? 'Saving…' : 'Save review'}</button>
          </form>
          <details>
            <summary>Review history</summary>
            {report.events.map((event) => (
              <article key={event.id}>
                <p>
                  {event.author} · {new Date(event.at).toLocaleString()}
                </p>
                <pre>{JSON.stringify(event.detail, null, 2)}</pre>
              </article>
            ))}
          </details>
          <details>
            <summary>Delete this report and its evidence</summary>
            <p>
              Deletion removes the original report, contact and private
              attachments. Exported copies cannot be recalled.
            </p>
            <button
              disabled={busy}
              onClick={() => {
                if (
                  !window.confirm(
                    'Delete this report and its attached evidence?',
                  )
                )
                  return;
                setBusy(true);
                void feedbackCall(
                  `owner/feedback/${id}`,
                  undefined,
                  csrf,
                  'DELETE',
                )
                  .then(() => {
                    window.location.hash = '#/feedback';
                  })
                  .catch((e: Error) => setError(e.message))
                  .finally(() => setBusy(false));
              }}
            >
              Delete report
            </button>
          </details>
          {exporting ? (
            <ExportReports
              ids={[id]}
              csrf={csrf}
              close={() => setExporting(false)}
            />
          ) : null}
        </>
      ) : (
        <p role="status">Loading report…</p>
      )}
    </>
  );
}

function CurrentLesson({
  entry,
  context,
}: {
  entry: Entry;
  context: FeedbackContext;
}) {
  const [loaded, setLoaded] = useState<{ json: unknown; index: number }>();
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    void (async () => {
      const json =
        typeof entry.json === 'function'
          ? await (entry.json as () => Promise<unknown>)()
          : entry.json;
      const tutorial = parseTutorial(json),
        stages = stagesOf(tutorial);
      const beat =
        context.mode === 'draw'
          ? shownBeats(tutorial)[context.index ?? 0]
          : undefined;
      const stepId = context.stepIds[0];
      const beats = beatsOf(tutorial);
      let index = stages.findIndex((stage) =>
        context.stage === 'step'
          ? stage.kind === 'step' &&
            (beat
              ? stage.beat === beat
              : beats[stage.beat - 1]?.step === stepId)
          : stage.kind === context.stage,
      );
      if (
        context.mode !== 'draw' &&
        context.index !== undefined &&
        context.index < stages.length
      )
        index = context.index;
      if (active) setLoaded({ json, index: Math.max(0, index) });
    })().catch((e: Error) => {
      if (active) setError(e.message);
    });
    return () => {
      active = false;
    };
  }, [entry, context]);
  return loaded ? (
    <Play
      json={loaded.json}
      address="shared"
      reviewIndex={loaded.index}
      banner={
        <p>
          Owner review of today's lesson. Existing lesson progress and drawings
          stay saved separately.
        </p>
      }
    />
  ) : (
    <p role="status">{error || 'Opening review lesson…'}</p>
  );
}

function ExportReports({
  ids,
  csrf,
  close,
}: {
  ids: string[];
  csrf: string;
  close: () => void;
}) {
  const [selection] = useState(ids);
  const [reports, setReports] = useState<Report[]>([]);
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [goal, setGoal] = useState(
    'Investigate these reports and propose a fix for owner review.',
  );
  const [includeNotes, setIncludeNotes] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    void (async () => {
      const loaded: Report[] = [];
      for (const id of selection)
        loaded.push(await feedbackCall<Report>(`owner/feedback/${id}`));
      if (active) {
        setReports(loaded);
        setMessages(Object.fromEntries(loaded.map((r) => [r.id, r.message])));
      }
    })().catch((e: Error) => {
      if (active) setError(e.message);
    });
    return () => {
      active = false;
    };
  }, [selection]);
  async function exportSelected(copy: boolean) {
    setBusy(true);
    setError('');
    try {
      const bundle = await feedbackCall<Bundle>(
        'owner/feedback/export',
        { ids: selection, goal, messages, includeNotes },
        csrf,
      );
      if (copy)
        await navigator.clipboard.writeText(
          JSON.stringify(
            {
              ...bundle,
              reports: bundle.reports.map(({ image, ...r }) => ({
                ...r,
                ...(image
                  ? {
                      image:
                        'Board image is in the downloaded investigation bundle; private inbox links require owner sign-in.',
                    }
                  : {}),
              })),
            },
            null,
            2,
          ),
        );
      else feedbackDownload(bundle, 'tastir-investigation.json');
      setError(
        copy
          ? 'Investigation brief copied.'
          : 'Investigation bundle downloaded.',
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section aria-label="AI export preview">
      <h2>Review what you will share with AI</h2>
      <p>
        Only these selected reports, their captured context and drawing evidence
        are included. Contact addresses and abuse metadata are excluded. Remove
        any personal information typed into messages. Downloaded copies cannot
        be recalled.
      </p>
      <label>
        Investigation goal
        <textarea
          value={goal}
          maxLength={4000}
          onChange={(e) => setGoal(e.target.value)}
        />
      </label>
      {reports.map((r) => (
        <article key={r.id}>
          <h3>
            {r.context.title} · {r.context.label}
          </h3>
          <label>
            Message to share (editing this keeps the original report)
            <textarea
              value={messages[r.id] ?? ''}
              maxLength={4000}
              onChange={(e) =>
                setMessages((m) => ({ ...m, [r.id]: e.target.value }))
              }
            />
          </label>
          <details>
            <summary>Context and evidence included</summary>
            <pre>
              {JSON.stringify(
                { context: r.context, snapshot: r.snapshot },
                null,
                2,
              )}
            </pre>
            {r.image ? (
              <img
                src={`/api/owner/feedback/${r.id}/image`}
                alt="Board included in export"
              />
            ) : null}
          </details>
          {includeNotes ? (
            <pre>
              {JSON.stringify(
                r.events
                  .filter((e) => e.kind === 'review')
                  .map((e) => e.detail),
                null,
                2,
              )}
            </pre>
          ) : null}
        </article>
      ))}
      <label>
        <input
          type="checkbox"
          checked={includeNotes}
          onChange={(e) => setIncludeNotes(e.target.checked)}
        />{' '}
        Include review notes from these selected reports
      </label>
      {error ? <p role="status">{error}</p> : null}
      <div className="feedback-actions">
        <button
          disabled={busy || reports.length !== ids.length || !goal.trim()}
          onClick={() => void exportSelected(true)}
        >
          Copy for AI
        </button>
        <button
          disabled={busy || reports.length !== ids.length || !goal.trim()}
          onClick={() => void exportSelected(false)}
        >
          Download investigation bundle
        </button>
        <button className="secondary" disabled={busy} onClick={close}>
          Close export preview
        </button>
      </div>
    </section>
  );
}
