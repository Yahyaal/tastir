import { useCallback, useEffect, useState } from 'react';
import { studioCall, studioUrl } from './client';

/**
 * The studio's side of the conversation, under the steps: what the agents
 * have marked, their questions with a box to answer each, and the notes.
 */
export interface Mark {
  readonly id: number;
  readonly author: string;
  readonly target: string;
  readonly label: string;
}

interface Note {
  readonly id: number;
  readonly author: string;
  readonly text: string;
  readonly at: string;
  readonly question?: true;
  readonly about?: string;
  readonly answers?: number;
}

/** The project's notes, fetched again whenever the studio says they changed. */
export function useNotes(id: string, changed: number) {
  const [notes, setNotes] = useState<readonly Note[]>([]);
  const load = useCallback(() => {
    studioCall<{ notes: Note[] }>('GET', `/projects/${id}/notes`)
      .then((r) => setNotes(r.notes))
      .catch(() => undefined);
  }, [id]);
  useEffect(load, [load, changed]);
  return { notes, reload: load };
}

export interface ReferenceLine {
  readonly width: number;
  readonly height: number;
  readonly source?: string;
  readonly aligned: boolean;
}

export function StudioPanel({
  id,
  marks,
  notes,
  onPosted,
  reference,
  revision,
}: {
  id: string;
  marks: readonly Mark[];
  notes: readonly Note[];
  onPosted: () => void;
  reference: ReferenceLine | null;
  revision: number;
}) {
  const [text, setText] = useState('');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [error, setError] = useState<string>();
  const post = (body: { text: string; answers?: number }) =>
    studioCall('POST', `/projects/${id}/notes`, { author: 'owner', ...body })
      .then(() => {
        setError(undefined);
        onPosted();
      })
      .catch((e: Error) => setError(e.message));
  const answered = new Set(
    notes.flatMap((n) => (n.answers ? [n.answers] : [])),
  );
  const open = notes.filter((n) => n.question && !answered.has(n.id));
  return (
    <section className="studio-panel" aria-label="Studio notes">
      {open.length ? (
        <div className="studio-questions">
          <h2>Questions for you</h2>
          {open.map((q) => (
            <form
              key={q.id}
              className="studio-question"
              onSubmit={(e) => {
                e.preventDefault();
                const reply = answers[q.id]?.trim();
                if (reply) void post({ text: reply, answers: q.id });
              }}
            >
              <p>
                <b>{q.author}</b>
                {q.about ? ` (about ${q.about}, glowing)` : ''}: {q.text}
              </p>
              <label
                className="visually-hidden"
                htmlFor={`studio-answer-${q.id}`}
              >
                Your answer to {q.author}
              </label>
              <input
                id={`studio-answer-${q.id}`}
                type="text"
                value={answers[q.id] ?? ''}
                onChange={(e) =>
                  setAnswers((a) => ({ ...a, [q.id]: e.target.value }))
                }
              />
              <button type="submit" className="button">
                Answer
              </button>
            </form>
          ))}
        </div>
      ) : null}
      {marks.length ? (
        <div className="studio-marks">
          <h2>Marked</h2>
          <ul>
            {marks.map((m) => (
              <li key={m.id}>
                <b>{m.target}</b>: {m.label}{' '}
                <span className="studio-meta">({m.author})</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="button secondary"
            onClick={() =>
              void studioCall('POST', `/projects/${id}/marks/clear`, {}).catch(
                (e: Error) => setError(e.message),
              )
            }
          >
            Clear marks
          </button>
        </div>
      ) : null}
      <ReferencePhoto
        id={id}
        reference={reference}
        revision={revision}
        onError={setError}
      />
      <div className="studio-notes">
        <h2>Notes</h2>
        {notes.length ? (
          <ol>
            {notes.slice(-30).map((n) => (
              <li key={n.id}>
                <b>{n.author}</b>
                {n.answers
                  ? ' (answer)'
                  : n.question
                    ? ' (question)'
                    : ''}: {n.text}
              </li>
            ))}
          </ol>
        ) : (
          <p className="studio-meta">No notes yet.</p>
        )}
        <form
          className="studio-note"
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim())
              void post({ text: text.trim() }).then(() => setText(''));
          }}
        >
          <label htmlFor="studio-note">Note for the agents</label>
          <textarea
            id="studio-note"
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button type="submit" className="button">
            Post
          </button>
        </form>
        {error ? (
          <p className="studio-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </section>
  );
}

/**
 * The photo a reconstruction works from: added here, lined up by clicking
 * O and then A on it, and shown with the drawing's ink over it.
 */
function ReferencePhoto({
  id,
  reference,
  revision,
  onError,
}: {
  id: string;
  reference: ReferenceLine | null;
  revision: number;
  onError: (message: string | undefined) => void;
}) {
  const [placing, setPlacing] = useState<'o' | 'a'>();
  const [o, setO] = useState<{ x: number; y: number }>();
  const [stamp, setStamp] = useState(0);
  useEffect(() => setStamp((n) => n + 1), [reference, revision]);
  const upload = (file: File) => {
    shrink(file)
      .then((data) =>
        studioCall('POST', `/projects/${id}/reference`, {
          author: 'owner',
          data,
          source: file.name,
        }),
      )
      .then(() => onError(undefined))
      .catch((e: Error) => onError(e.message));
  };
  const place = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!placing || !reference) return;
    const r = e.currentTarget.getBoundingClientRect();
    const at = {
      x: ((e.clientX - r.left) / r.width) * reference.width,
      y: ((e.clientY - r.top) / r.height) * reference.height,
    };
    if (placing === 'o') {
      setO(at);
      setPlacing('a');
      return;
    }
    setPlacing(undefined);
    studioCall('POST', `/projects/${id}/reference/align`, {
      author: 'owner',
      o,
      a: at,
    })
      .then(() => onError(undefined))
      .catch((e: Error) => onError(e.message));
  };
  return (
    <div className="studio-reference">
      <h2>Reference photo</h2>
      {reference ? (
        <>
          <img
            className={placing ? 'placing' : undefined}
            src={studioUrl(
              `/projects/${id}/picture?what=overlay&size=700&v=${stamp}`,
            )}
            alt={
              reference.aligned
                ? 'The reference photo with the ink drawn over it in magenta'
                : 'The reference photo'
            }
            onClick={place}
          />
          <p className="studio-meta">
            {placing === 'o'
              ? 'Click where O, the centre, sits on the photo.'
              : placing === 'a'
                ? 'Now click where A sits: one unit to the right of O, along the drawing’s 0° direction.'
                : reference.aligned
                  ? 'Lined up. The ink shows in magenta, O and A in cyan.'
                  : 'Not lined up yet, so the ink is not shown.'}
          </p>
          <button
            type="button"
            className="button secondary"
            onClick={() => setPlacing('o')}
          >
            {reference.aligned ? 'Line up again' : 'Line up: place O and A'}
          </button>
        </>
      ) : null}
      <label className="studio-upload">
        {reference ? 'Use another photo' : 'Add a photo to recreate'}
        <input
          type="file"
          accept="image/png,image/jpeg"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
            e.target.value = '';
          }}
        />
      </label>
    </div>
  );
}

/**
 * A photo as base64, at most 2,000 pixels on its longer side: plenty to
 * line a pattern up, and small enough for the hosted studio, which takes at
 * most a few megabytes in one request. A small photo is sent as it is.
 */
async function shrink(file: File): Promise<string> {
  const read = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve(String(reader.result).replace(/^data:[^,]*,/, ''));
      reader.onerror = () => reject(new Error('The photo could not be read.'));
      reader.readAsDataURL(blob);
    });
  let image: ImageBitmap;
  try {
    image = await createImageBitmap(file);
  } catch {
    return read(file);
  }
  const scale = Math.min(1, 2000 / Math.max(image.width, image.height));
  if (scale === 1 && file.size < 2_500_000) return read(file);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.9),
  );
  return read(blob ?? file);
}
