import type { Tutorial } from '@tastir/schema';
import { download } from '../app/exporting';
import type { Draft } from './document';

type Credit = Draft['credits'][number];
type Photo = NonNullable<Draft['photos']>[number];

/** An entry with its empty optional fields left out, as the format wants. */
function tidy<T extends object>(entry: T, required: readonly string[]): T {
  return Object.fromEntries(
    Object.entries(entry).filter(
      ([k, v]) => required.includes(k) || (v !== '' && v !== false),
    ),
  ) as T;
}

const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;

/** The credit a copy gives its original, which the learner cannot remove. */
const isOriginal = (c: Credit) => c.source.startsWith('Tastir: ');

/** A tutorial id (and file name) from a title: lower-case words and -. */
export const slug = (title: string) =>
  title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'my-pattern';
const FOLDS = [3, 4, 5, 6, 8, 10, 12, 16];

/**
 * What only a library tutorial has, filled in from the editor: its level,
 * style, fold, credits and photos; and the finished file to download,
 * with its expected pieces computed by the engine.
 */
export function AboutPanel({
  draft,
  onChange,
  file,
}: {
  draft: Draft;
  /** Each change, with the key that merges a run of typing into one undo. */
  onChange: (next: Draft, merge?: string) => void;
  /** The whole tutorial file, or why it cannot be made yet. */
  file?: { tutorial: Tutorial } | { reason: string };
}) {
  const credits = draft.credits;
  const photos = draft.photos ?? [];
  const setCredit = (i: number, credit: Credit, merge?: string) =>
    onChange(
      {
        ...draft,
        credits: credits.map((c, j) =>
          j === i ? tidy(credit, ['source']) : c,
        ),
      },
      merge,
    );
  const setPhoto = (i: number, photo: Photo, merge?: string) =>
    onChange(
      {
        ...draft,
        photos: photos.map((p, j) =>
          j === i
            ? tidy(photo, ['file', 'caption', 'creator', 'license', 'url'])
            : p,
        ),
      },
      merge,
    );
  return (
    <>
      <section className="about">
        <h2>About the pattern</h2>
        <div className="about-row">
          <label>
            Level
            <select
              value={draft.level}
              onChange={(e) =>
                onChange({
                  ...draft,
                  level: e.target.value as Draft['level'],
                })
              }
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label>
            Fold
            <select
              value={draft.fold}
              onChange={(e) =>
                onChange({ ...draft, fold: Number(e.target.value) })
              }
            >
              {FOLDS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={draft.chiral ?? false}
              onChange={(e) => {
                const { chiral: _chiral, ...rest } = draft;
                onChange(e.target.checked ? { ...rest, chiral: true } : rest);
              }}
            />
            Turns, with no mirror
          </label>
        </div>
        <label className="about-field">
          Style or tradition
          <input
            type="text"
            value={draft.style}
            onChange={(e) =>
              onChange({ ...draft, style: e.target.value }, 'style')
            }
          />
        </label>
      </section>
      <section className="about">
        <h2>Credits</h2>
        <p className="hint">
          Name every book, drawing or person the construction comes from.
        </p>
        {credits.map((c, i) =>
          isOriginal(c) ? (
            <p key={i} className="about-entry original">
              <b>{c.source}</b>
              {c.note ? ` ${c.note}` : ''} The credit to the original always
              stays.
            </p>
          ) : (
            <fieldset key={i} className="about-entry">
              <legend>Credit {i + 1}</legend>
              {(['source', 'creator', 'url', 'note'] as const).map((k) => (
                <label key={k} className="about-field">
                  {k === 'url'
                    ? 'Address (URL)'
                    : k[0]?.toUpperCase() + k.slice(1)}
                  <input
                    type="text"
                    value={c[k] ?? ''}
                    onChange={(e) =>
                      setCredit(
                        i,
                        { ...c, [k]: e.target.value },
                        `credit-${i}-${k}`,
                      )
                    }
                  />
                </label>
              ))}
              <button
                type="button"
                className="secondary"
                onClick={() =>
                  onChange({
                    ...draft,
                    credits: credits.filter((_, j) => j !== i),
                  })
                }
              >
                Remove credit {i + 1}
              </button>
            </fieldset>
          ),
        )}
        <button
          type="button"
          className="secondary"
          onClick={() =>
            onChange({ ...draft, credits: [...credits, { source: '' }] })
          }
        >
          Add a credit
        </button>
      </section>
      <section className="about">
        <h2>Photos of the original</h2>
        <p className="hint">
          A photo of the real pattern, with who took it and its licence. Only a
          free photo (public domain or Creative Commons) can be shown to
          everyone; mark any other private.
        </p>
        {photos.map((p, i) => (
          <fieldset key={i} className="about-entry">
            <legend>Photo {i + 1}</legend>
            {(['file', 'caption', 'creator', 'license', 'url'] as const).map(
              (k) => (
                <label key={k} className="about-field">
                  {k === 'url'
                    ? 'Source (URL)'
                    : k[0]?.toUpperCase() + k.slice(1)}
                  <input
                    type="text"
                    value={p[k]}
                    onChange={(e) =>
                      setPhoto(
                        i,
                        { ...p, [k]: e.target.value },
                        `photo-${i}-${k}`,
                      )
                    }
                  />
                </label>
              ),
            )}
            <label className="check">
              <input
                type="checkbox"
                checked={p.private ?? false}
                onChange={(e) =>
                  setPhoto(i, { ...p, private: e.target.checked })
                }
              />
              Private (may not ship)
            </label>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                const rest = photos.filter((_, j) => j !== i);
                const { photos: _photos, ...without } = draft;
                onChange(rest.length ? { ...draft, photos: rest } : without);
              }}
            >
              Remove photo {i + 1}
            </button>
          </fieldset>
        ))}
        <button
          type="button"
          className="secondary"
          onClick={() =>
            onChange({
              ...draft,
              photos: [
                ...photos,
                { file: '', caption: '', creator: '', license: '', url: '' },
              ],
            })
          }
        >
          Add a photo
        </button>
      </section>
      <section className="about">
        <h2>The tutorial file</h2>
        {file && 'tutorial' in file ? (
          <>
            <p className="step-status ok">
              ✓ Complete: {file.tutorial.expect.pieceTypes} kinds of piece,
              checked by the engine.
            </p>
            <button
              type="button"
              onClick={() =>
                download(
                  new Blob(
                    [
                      `${JSON.stringify({ ...file.tutorial, id: slug(file.tutorial.title) }, null, 2)}\n`,
                    ],
                    { type: 'application/json' },
                  ),
                  `${slug(file.tutorial.title)}.json`,
                )
              }
            >
              Download the tutorial file
            </button>
          </>
        ) : (
          <p className="step-status broken">
            Not ready:{' '}
            {file?.reason ?? 'draw the tile and ink the pattern first.'}
          </p>
        )}
      </section>
    </>
  );
}
