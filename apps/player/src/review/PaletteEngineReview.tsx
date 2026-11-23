import { useMemo, useState } from 'react';
import { LIBRARY } from '../app/library';
import { useModel } from '../app/workerClient';
import {
  finishOf,
  paletteOf,
  pieceColors,
  SLOTS,
  slotOf,
  touchingTypes,
  typeKey,
  type Coloring,
} from '../app/coloring';
import { Wall } from '../app/Wall';
import type { Model } from '../app/model';
import './review.css';
import './paletteEngine.css';

/*
 * The palette engine for the owner (#/review/palette-engine, dev server
 * only): the same walls coloured by shape with the old rule (A) and the
 * engine (B), under each tile palette, as tiles and under bands.
 */

const SAMPLES = [
  ['alhambra-arrayanes-porch-ceiling', 'Arrayanes porch ceiling', 'interlace'],
  ['alhambra-dos-hermanas-band-stars', 'Dos Hermanas band stars', 'interlace'],
  ['abas-salman-232-star-bands', 'Abas and Salman 232 star bands', 'tiles'],
  [
    'fes-bou-inania-octagonal-rosettes',
    'Bou Inania octagonal rosettes',
    'tiles',
  ],
] as const;

const PALETTES = [
  'Marinid zellige',
  'Alhambra',
  'Timurid tile',
  'Mamluk wood',
  'Modern Moroccan',
  'Fès tile',
] as const;

/** The rule before the engine: each shape its slot, a touching repeat
 * moved to the first free slot (the band's re-tint is the Wall's own). */
function before(model: Model, coloring: Coloring): string[] {
  const palette = paletteOf(model, coloring.palette);
  const { types } = model.pattern;
  const wanted = types.map((t, i) => palette[slotOf(model, t, i)]);
  const touching = touchingTypes(model);
  const near = (a: number, b: number) =>
    touching.has(a < b ? `${a},${b}` : `${b},${a}`);
  const out: string[] = [];
  types.forEach((t, i) => {
    const want = coloring.chosen[typeKey(t)] ?? wanted[i] ?? palette.a;
    const taken = out.flatMap((c, k) => (near(i, k) ? [c] : []));
    const free = (c: string) =>
      !taken.some((x) => x.toLowerCase() === c.toLowerCase());
    out.push(
      free(want) ? want : (SLOTS.map((s) => palette[s]).find(free) ?? want),
    );
  });
  return out;
}

function Pair({
  model,
  palette,
  look,
}: {
  model: Model;
  palette: string;
  look: 'tiles' | 'interlace';
}) {
  const coloring = useMemo<Coloring>(
    () => ({ palette, chosen: {}, method: 'shape' }),
    [palette],
  );
  const finish = finishOf(model, coloring);
  const old = useMemo(() => before(model, coloring), [model, coloring]);
  const now = useMemo(
    () =>
      pieceColors(
        model,
        coloring,
        look === 'interlace' ? { band: finish.band, edge: finish.lines } : {},
      ),
    [model, coloring, look, finish.band, finish.lines],
  );
  const changed = now.some(
    (c, i) => c.toLowerCase() !== (old[i] ?? '').toLowerCase(),
  );
  return (
    <div className={`engine-pair${changed ? '' : ' same'}`}>
      <h3>
        {palette}
        {changed ? '' : ' · unchanged'}
      </h3>
      <figure>
        <figcaption>
          <b>A</b> before
        </figcaption>
        <div className="engine-wall">
          <Wall model={model} colors={old} look={look} finish={finish} />
        </div>
      </figure>
      <figure>
        <figcaption>
          <b>B</b> the engine
        </figcaption>
        <div className="engine-wall">
          <Wall model={model} colors={now} look={look} finish={finish} />
        </div>
      </figure>
    </div>
  );
}

function Sample({
  id,
  label,
  look,
}: {
  id: string;
  label: string;
  look: 'tiles' | 'interlace';
}) {
  const { model, error } = useModel(LIBRARY.find((e) => e.id === id)?.json);
  return (
    <section className="engine-sample">
      <h2>
        {label}{' '}
        <small>
          {look === 'interlace' ? 'under white bands' : 'as tiles'} ·{' '}
          <a href={`#/${id}/result`}>open</a>
        </small>
      </h2>
      {model ? (
        <div className="engine-pairs">
          {PALETTES.map((p) => (
            <Pair key={p} model={model} palette={p} look={look} />
          ))}
        </div>
      ) : (
        <p role={error ? 'alert' : 'status'}>{error ?? 'Preparing…'}</p>
      )}
    </section>
  );
}

export function PaletteEngineReview() {
  const [shown, setShown] = useState(0);
  const sample = SAMPLES[shown] ?? SAMPLES[0];
  return (
    <main className="review palette-engine">
      <nav className="review-top">
        <a href="#/review">← Review</a>
        <a href="#/notes/palette-engine">The report →</a>
      </nav>
      <header>
        <h1>The palette engine, before and after</h1>
        <p>
          Each wall is coloured by shape. A is the old rule, B the engine. Look
          for grey pieces under the bands in A, and for neighbours that run
          together.
        </p>
        <div className="engine-picker" role="group" aria-label="Wall">
          {SAMPLES.map(([id, label], i) => (
            <button
              key={id}
              type="button"
              aria-pressed={i === shown}
              onClick={() => setShown(i)}
            >
              {label}
            </button>
          ))}
        </div>
      </header>
      <Sample
        key={sample[0]}
        id={sample[0]}
        label={sample[1]}
        look={sample[2]}
      />
    </main>
  );
}
