import { useEffect, useMemo, useState } from 'react';
import { parseTutorial } from '@tastir/schema';
import { LIBRARY } from '../app/library';
import { useModel } from '../app/workerClient';
import {
  PALETTES,
  ORIGINAL,
  pieceColors,
  type Palette,
  type Extra,
  type Coloring,
} from '../app/coloring';
import { placeFills, colorRepeat, colouredModel } from '../app/placement';
import { Wall } from '../app/Wall';
import type { Model } from '../app/model';
import './review.css';
import './teachingUpdate.css';

type ReviewPalette = Palette & Partial<Record<Extra, string>>;
const samples = [
  ['eight-fold-star-and-cross', 'Simple star and cross'],
  ['eight-fold-zellige', 'Mid-sized zellige'],
  ['paccard-222-rosette', 'Dense Paccard rosette'],
] as const;
const candidateName = 'Paccard · seven colours';
function Strip({ palette }: { palette: ReviewPalette }) {
  return (
    <span className="palette-strip" aria-label="Palette colour strip">
      {Object.values(palette).map((color, i) => (
        <span key={i} style={{ background: color }} title={color} />
      ))}
    </span>
  );
}
function PaletteWall({
  model,
  palette,
  name,
}: {
  model: Model;
  palette: ReviewPalette;
  name?: string;
}) {
  // A review-only copy lets the renderer use the full seven-colour source
  // without adding a preset or changing the tutorial's original colouring.
  const coloring = useMemo<Coloring>(
    () => ({ palette: name ?? ORIGINAL, chosen: {}, method: 'place' }),
    [name],
  );
  const preview = useMemo(
    () =>
      colouredModel(
        {
          ...model,
          tutorial: {
            ...model.tutorial,
            pattern: {
              ...model.tutorial.pattern,
              ...(name ? {} : { original: { palette } }),
            },
          },
        },
        coloring,
      ),
    [model, palette, name, coloring],
  );
  const fill = useMemo(
    () => placeFills(preview, coloring),
    [preview, coloring],
  );
  return (
    <Wall
      model={preview}
      colors={pieceColors(preview, coloring)}
      fill={fill}
      repeat={colorRepeat(preview)}
      finish={{ lines: palette.a, band: palette.a, carved: false }}
    />
  );
}
function Sample({
  id,
  label,
  palette,
  name,
}: {
  id: string;
  label: string;
  palette: ReviewPalette;
  name?: string;
}) {
  const { model, error } = useModel(LIBRARY.find((e) => e.id === id)?.json);
  return (
    <figure>
      <figcaption>
        {label} · <a href={`#/${id}/result`}>Open pattern</a>
      </figcaption>
      {model ? (
        <PaletteWall model={model} palette={palette} name={name} />
      ) : (
        <p role={error ? 'alert' : 'status'}>{error ?? 'Preparing wall…'}</p>
      )}
    </figure>
  );
}
export function PalettesPlan() {
  const [selected, setSelected] = useState('Marinid zellige');
  const [candidate, setCandidate] = useState<ReviewPalette>();
  const [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    const source = LIBRARY.find((e) => e.id === 'paccard-222-rosette')?.json;
    Promise.resolve(typeof source === 'function' ? source() : source)
      .then((raw) => {
        const palette = parseTutorial(raw).pattern.original?.palette;
        if (!palette)
          throw new Error('The Paccard source has no original palette.');
        if (live) setCandidate(palette);
      })
      .catch((e: Error) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, []);
  const palette = PALETTES[selected] ?? PALETTES['Marinid zellige'];
  return (
    <main className="review teaching-update">
      <nav className="review-top">
        <a href="#/review">← Review</a>
        <a href="#/notes/teaching-update">Construction research →</a>
      </nav>
      <header className="review-head">
        <p className="teaching-caption">Palette study · Preview only</p>
        <h1>Choose colours on the same three walls.</h1>
        <p className="lede">
          Start with the presets we already have. Select a strip to see it on a
          simple pattern, a mid-sized pattern and a dense rosette. Then compare
          the seven-colour Paccard candidate below.
        </p>
      </header>
      <div
        className="palette-strips teaching-controls"
        role="group"
        aria-label="Existing palettes"
      >
        {Object.entries(PALETTES).map(([name, p]) => (
          <button
            type="button"
            aria-label={name}
            aria-pressed={selected === name}
            key={name}
            onClick={() => setSelected(name)}
          >
            {name}
            <Strip palette={p} />
          </button>
        ))}
      </div>
      <p>
        <strong>From the colourings you like:</strong> Najjarin currently uses{' '}
        <button type="button" onClick={() => setSelected('Marinid zellige')}>
          Marinid zellige
        </button>
        ; Meknes Bou Inania uses{' '}
        <button type="button" onClick={() => setSelected('Modern Moroccan')}>
          Modern Moroccan
        </button>
        . These are existing presets. Both Paccard versions share the same
        seven-colour source palette, so they produce one candidate.
      </p>
      <section className="palette-compare">
        <h2>A · Existing preset: {selected}</h2>
        <p className="teaching-caption">
          The same placement rules and shape assignments are used in both rows
          so the comparison isolates the colours. This study uses placement
          colouring; ring-mode behaviour remains a separate implementation
          check.
        </p>
        {palette && (
          <div className="palette-walls">
            {samples.map(([id, label]) => (
              <Sample
                key={id}
                id={id}
                label={label}
                palette={palette}
                name={selected}
              />
            ))}
          </div>
        )}
      </section>
      <section className="palette-compare">
        <h2>B · {candidateName}</h2>
        <p>
          Kept from the source: dark outline, green, blue, honey, pale ground,
          red and orange. The extra accents appear where the wall’s existing
          placement rules ask for them; a simple two-piece pattern will
          naturally use fewer colours.
        </p>
        {candidate ? (
          <>
            <Strip palette={candidate} />
            <div className="palette-walls">
              {samples.map(([id, label]) => (
                <Sample key={id} id={id} label={label} palette={candidate} />
              ))}
            </div>
          </>
        ) : (
          <p role={error ? 'alert' : 'status'}>
            {error || 'Reading the source palette…'}
          </p>
        )}
      </section>
      <p className="teaching-verdict">
        Tell me which current presets look poor, and whether the Paccard
        candidate is worth keeping. No presets, original colourings or saved
        designs have been changed by this page.
      </p>
    </main>
  );
}
