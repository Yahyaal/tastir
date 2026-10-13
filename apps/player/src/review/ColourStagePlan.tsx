import { useMemo, useState } from 'react';
import { GLAZES, type Coloring, typeKey } from '../app/coloring';
import { Thumbnail } from '../app/drawing';
import { LIBRARY } from '../app/library';
import type { Model } from '../app/model';
import { placeFills, placeKey } from '../app/placement';
import { ringsOf } from '../app/rings';
import { PROGRESS_TEXT, useModel } from '../app/workerClient';
import './review.css';
import './plan.css';

/**
 * The plan for the colour stage (#/plan/colour-stage, dev server only): a
 * working mock of the new colours panel on a real pattern, so the owner
 * can try it before it is built into the player.
 */

const PATTERN = 'bou-inania-rosette';

/** The rings of one rosette, from the centre out, with a piece of each. */
interface RingRow {
  readonly key: string;
  readonly name: string;
  readonly piece: number;
  readonly i: number;
  readonly j: number;
  readonly family: number;
}

function ringRows(model: Model): RingRow[] {
  const rings = ringsOf(model.pattern);
  if (!rings) return [];
  const { pieces, types } = model.pattern;
  const [m, n] = rings.repeat;
  const seen = new Map<string, RingRow & { d: number }>();
  for (let k = 0; k < pieces.length; k++)
    for (let i = 0; i < m; i++)
      for (let j = 0; j < n; j++) {
        const at = rings.place(k, i, j);
        if (at.family < 0 || seen.has(at.ring)) continue;
        const t = types[pieces[k]?.type ?? 0];
        seen.set(at.ring, {
          key: placeKey(model, k, i, j),
          name: t?.name ?? 'piece',
          piece: k,
          i,
          j,
          family: at.family,
          d: Number(at.ring.split(':')[1] ?? 0),
        });
      }
  return [...seen.values()].sort((a, b) => a.family - b.family || a.d - b.d);
}

/** The glaze colours offered for a ring, then any colour. */
function Swatches({
  colours,
  value,
  onPick,
}: {
  colours: readonly string[];
  value: string;
  onPick: (c: string) => void;
}) {
  return (
    <span className="stage-swatches">
      {[...new Set(colours)].map((c) => (
        <button
          key={c}
          type="button"
          aria-label={c}
          aria-pressed={c === value}
          style={{ background: c }}
          onClick={() => onPick(c)}
        />
      ))}
      <input
        type="color"
        value={value}
        aria-label="Any colour"
        onChange={(e) => onPick(e.target.value)}
      />
    </span>
  );
}

function Mock({ model }: { model: Model }) {
  const [palette, setPalette] = useState('Marinid zellige');
  const [how, setHow] = useState<'rings' | 'shape'>('rings');
  const [chosen, setChosen] = useState<Record<string, string>>({});
  const [turns, setTurns] = useState(true);
  const shown: Model = useMemo(() => {
    const pattern = { ...model.tutorial.pattern, palette };
    if (how === 'rings')
      return {
        ...model,
        tutorial: {
          ...model.tutorial,
          pattern: { ...pattern, rings: true as const },
        },
      };
    const { rings: _rings, ...byShape } = pattern;
    return { ...model, tutorial: { ...model.tutorial, pattern: byShape } };
  }, [model, palette, how]);
  const coloring: Coloring = { palette, chosen };
  const fill = useMemo(
    () => placeFills(shown, coloring),
    [shown, palette, chosen],
  );
  const rows = useMemo(
    () => (how === 'rings' ? ringRows(shown) : []),
    [shown, how],
  );
  const glaze = GLAZES[palette];
  const colours = glaze
    ? [glaze.white, glaze.black, ...glaze.families.flat()]
    : [];
  const families = [...new Set(rows.map((r) => r.family))];
  const label = (f: number) =>
    f === (ringsOf(shown.pattern)?.rosettes ?? 99)
      ? 'Filler star'
      : `Rosette ${String.fromCharCode(65 + f)}`;
  const paint = (row: RingRow, c: string) => {
    const next = { ...chosen, [row.key]: c };
    // With turns off, every rosette's same ring takes the colour.
    if (!turns)
      for (const other of rows)
        if (
          other.family !== row.family &&
          other.name === row.name &&
          other.key.split('#')[1]?.split(':')[1] ===
            row.key.split('#')[1]?.split(':')[1]
        )
          next[other.key] = c;
    setChosen(next);
  };
  return (
    <div className="stage-mock">
      <div className="stage-wall">
        <Thumbnail model={shown} coloring={coloring} />
      </div>
      <div className="stage-panel">
        <h3>
          <b className="stage-letter">A</b> Palette
        </h3>
        <div className="stage-palettes">
          {Object.entries(GLAZES).map(([name, g]) => (
            <button
              key={name}
              type="button"
              aria-pressed={name === palette}
              onClick={() => {
                setPalette(name);
                setChosen({});
              }}
            >
              <span className="stage-strip">
                {[g.white, g.black, ...g.families.flat()].map((c, k) => (
                  <span key={k} style={{ background: c }} />
                ))}
              </span>
              {name}
            </button>
          ))}
        </div>
        <h3>
          <b className="stage-letter">B</b> Colour
        </h3>
        <div className="stage-how" role="group" aria-label="How to colour">
          <button
            type="button"
            aria-pressed={how === 'rings'}
            onClick={() => setHow('rings')}
          >
            Ring by ring
          </button>
          <button
            type="button"
            aria-pressed={how === 'shape'}
            onClick={() => setHow('shape')}
          >
            By shape
          </button>
        </div>
        {how === 'rings' ? (
          <>
            <h3>
              <b className="stage-letter">C</b> Rings, from the centre out
            </h3>
            <label className="stage-turns">
              <input
                type="checkbox"
                checked={turns}
                onChange={(e) => setTurns(e.target.checked)}
              />{' '}
              Neighbouring rosettes take turns
            </label>
            {families.map((f) => (
              <div key={f} className="stage-family">
                <h4>{label(f)}</h4>
                <ol>
                  {rows
                    .filter((r) => r.family === f)
                    .map((r) => (
                      <li key={r.key}>
                        <span
                          className="stage-ring-swatch"
                          style={{ background: fill(r.piece, r.i, r.j) }}
                        />
                        <span className="stage-ring-name">{r.name}</span>
                        <Swatches
                          colours={colours}
                          value={fill(r.piece, r.i, r.j)}
                          onPick={(c) => paint(r, c)}
                        />
                      </li>
                    ))}
                </ol>
              </div>
            ))}
          </>
        ) : (
          <>
            <h3>
              <b className="stage-letter">C</b> Shapes
            </h3>
            <ol>
              {shown.pattern.types.map((t) => (
                <li key={typeKey(t)}>
                  <span className="stage-ring-name">{t.name}</span>
                  <Swatches
                    colours={colours}
                    value={chosen[typeKey(t)] ?? colours[0] ?? '#ffffff'}
                    onPick={(c) => setChosen({ ...chosen, [typeKey(t)]: c })}
                  />
                </li>
              ))}
            </ol>
          </>
        )}
        <h3>
          <b className="stage-letter">D</b> Keep it
        </h3>
        <p className="stage-keep">
          <button type="button" disabled>
            Save as my design
          </button>{' '}
          <button type="button" disabled>
            Copy a share link
          </button>{' '}
          <button type="button" onClick={() => setChosen({})}>
            Reset
          </button>
        </p>
      </div>
    </div>
  );
}

export function ColourStagePlan() {
  const entry = LIBRARY.find((e) => e.id === PATTERN);
  const { model, progress } = useModel(entry?.json);
  return (
    <div className="review plan colour-stage-plan">
      <nav className="review-top">
        <a href="#/">← Library</a>
        <span>
          <a href="#/review">Review page</a>
        </span>
      </nav>
      <header className="review-head">
        <h1>Your own colours: the colour stage</h1>
        <p className="lede">
          A working mock of the new colours panel, on the Bou Inania rosette.
          Try it: everything below changes the wall live. Nothing in the player
          has changed yet.
        </p>
      </header>
      <section className="stage-note">
        <h2>Your second note (13 October)</h2>
        <p>
          <b>The shields are fixed.</b> They sat exactly as far from the filler
          star as from the rosette, so they were put “between the rosettes”.
          Now a rosette wins that tie, and each rosette card has its own shield
          ring, honey round rosette A and turquoise round B to start with.
        </p>
        <p>
          <b>The single unit is not built yet, and I would build it next.</b> A
          switch above the picture changes it from “Wall” to “Unit”. The unit
          view draws only the rosettes of one repeat, large on a plain ground.
          When every rosette is alike, that is one rosette. When two take
          turns, it is A and B side by side with the filler star between them.
          Each rosette is drawn whole, because one rosette spreads over several
          tiles of the construction. You colour it by clicking pieces, the same
          as now. “Add a rosette” puts the copy beside A, and you keep its
          colours or change them ring by ring. Switching back to “Wall” repeats
          that unit everywhere. Say OK on this and I will start.
        </p>
      </section>
      <section className="stage-note">
        <h2>Your note on the Bou Inania rosette (12 October)</h2>
        <p>
          <b>Built:</b> try it on the{' '}
          <a href="#/bou-inania-rosette">Bou Inania rosette</a>, at its Color
          step. The mock below is the earlier plan.
        </p>
        <p>
          <b>The 4 odd shields were a bug, now fixed.</b> The small
          four-pointed star between the rosettes sits nearer most of a
          rosette’s outer shields than the rosette’s own centre, so it took 12
          of the 16 as its own and only 4 followed the rosette. Each rosette now
          keeps its whole ring, so the shields round it are one colour and
          painting one paints them all.
        </p>
        <p>
          <b>I like your idea and would build it in place of C</b>, because it
          is how the pattern is made: a rosette is the thing you colour, and the
          wall is that rosette repeated with its colours turned. You click a
          rosette on the wall to pick it and paint its rings from the centre
          out. “Add a rosette” then makes a second one that starts as a copy
          with the colours swapped, which you keep or change ring by ring. The
          rosettes you have made are the unit that repeats, and the filler star
          gets a small card of its own. The app already knows which rosettes
          take turns, so this is mostly a new panel. One limit is the grid: it
          offers only the unit sizes that tile without two alike rosettes
          touching, such as 1 or 2 on a square grid and 1 or 3 on a hexagonal
          one.
        </p>
        <p>
          <b>On the shield colour</b>, the outer shields take the rosette’s
          main colour, the same as its petals, so the blue-star rosette has
          green shields. With the new panel you choose this yourself; if you
          want blue shields round a blue star by default too, say so.
        </p>
      </section>
      <ol className="stage-plan-list">
        <li>
          <b>A. Palettes as colour strips.</b> Each palette shows all its
          colours, so you see what you pick. Choosing one recolours the wall and
          clears colours set by hand.
        </li>
        <li>
          <b>B. How to colour.</b> Ring by ring round each rosette, or one
          colour per shape, as before.
        </li>
        <li>
          <b>C. One row per ring, from the centre out.</b> Each rosette and the
          filler star between them has its own list. Click a colour to paint
          that ring in every rosette of its kind, or pick any colour. Untick
          “take turns” and all rosettes share the same colours.
        </li>
        <li>
          <b>D. Keep it.</b> “Save as my design” and the share link keep the
          palette, the way of colouring and every colour you set, as today. On
          the wall itself, clicking a piece still opens its ring here.
        </li>
      </ol>
      {model ? (
        <Mock model={model} />
      ) : (
        <p className="colors-waiting">
          {PROGRESS_TEXT[progress ?? 'checking']}
        </p>
      )}
    </div>
  );
}
