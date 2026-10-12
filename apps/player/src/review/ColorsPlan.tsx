import type { Model } from '../app/model';
import { useMemo } from 'react';
import { PALETTES, typeKey, type Coloring, type Slot } from '../app/coloring';
import { Thumbnail } from '../app/drawing';
import { LIBRARY } from '../app/library';
import { PROGRESS_TEXT, useModel } from '../app/workerClient';
import { proposal, roleSlots, traditionPalette } from './colorProposal';
import './review.css';
import './plan.css';

/**
 * Colour: how the app colours patterns today, what goes wrong, and
 * suggestions (#/plan/colors, dev server only). Every picture is drawn
 * live from the tutorial, so it shows the real pattern in each colouring.
 * Nothing here changes a tutorial's colours.
 */

/** Four colours with clear steps of lightness, as on a real wall. */
interface Scheme {
  readonly name: string;
  readonly light: string;
  readonly dark: string;
  /** The star's colour, the strongest. */
  readonly accent: string;
  readonly second: string;
}

const FES_TODAY = PALETTES['Fès tile'] as Record<string, string>;

/** Today's Fès tile colours, given roles. */
const FES_ROLES: Scheme = {
  name: 'Today’s Fès tile colours',
  light: FES_TODAY['ground'] as string,
  dark: FES_TODAY['d'] as string,
  accent: FES_TODAY['c'] as string,
  second: FES_TODAY['b'] as string,
};

const MARINID: Scheme = {
  name: 'Marinid zellige (Fès)',
  light: '#f2ede1',
  dark: '#22201d',
  accent: '#1e6b4e',
  second: '#c08a2e',
};

const NASRID: Scheme = {
  name: 'Nasrid (Alhambra)',
  light: '#f1ece1',
  dark: '#1f1c1a',
  accent: '#1f7f86',
  second: '#a5652b',
};

const TIMURID: Scheme = {
  name: 'Timurid and Persian tile',
  light: '#f4f1ea',
  dark: '#12335f',
  accent: '#1b9aa8',
  second: '#d9a63b',
};

const MAMLUK_WOOD: Scheme = {
  name: 'Mamluk woodwork (wood, ebony, ivory)',
  light: '#efe3c6',
  dark: '#2b1d14',
  accent: '#7a4a26',
  second: '#b98a52',
};

/** The patterns shown, each with the tradition it comes from. */
const SAMPLES: readonly { id: string; tradition: Scheme }[] = [
  { id: 'eight-fold-zellige', tradition: MARINID },
  { id: 'six-fold-star-and-hexagons', tradition: TIMURID },
  { id: 'alhambra-comares-lattice', tradition: NASRID },
  { id: 'kurt-eight-fold-zellige', tradition: MARINID },
  { id: 'twelve-fold-rosette-mian', tradition: MAMLUK_WOOD },
  { id: 'minbar-doors-cairo', tradition: MAMLUK_WOOD },
];

/** CIE lightness of a colour, 0 (black) to 100 (white). */
function lightness(hex: string): number {
  const channel = (k: number) => {
    const c = parseInt(hex.slice(1 + 2 * k, 3 + 2 * k), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const y = 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
  return Math.round(y > 0.008856 ? 116 * Math.cbrt(y) - 16 : 903.3 * y);
}

/** Colour by role (roleSlots), in a scheme's colours. */
function byRole(model: Model, scheme: Scheme): Coloring {
  const slots = roleSlots(
    model.pattern,
    model.tutorial.pattern.look === 'strapwork',
  );
  const colour: Record<Slot, string> = {
    a: scheme.dark,
    b: scheme.accent,
    c: scheme.second,
    d: scheme.second,
    ground: scheme.light,
  };
  return {
    palette: 'Fès tile',
    chosen: Object.fromEntries(
      model.pattern.types.map((t, i) => [
        typeKey(t),
        colour[slots[i] ?? 'ground'],
      ]),
    ),
  };
}

const COLUMNS = [
  { letter: 'A', name: 'Today' },
  { letter: 'B', name: 'Colour by role, today’s colours' },
  { letter: 'C', name: 'By role, light, mid and dark' },
  { letter: 'D', name: 'By role, the tradition’s colours' },
  { letter: 'E', name: 'D with wider grout' },
] as const;

function Row({ id, tradition }: { id: string; tradition: Scheme }) {
  const entry = LIBRARY.find((e) => e.id === id);
  const { model, progress } = useModel(entry?.json);
  const colorings = useMemo(
    () =>
      model
        ? [
            { coloring: undefined, grout: 1 },
            { coloring: byRole(model, FES_ROLES), grout: 1 },
            { coloring: byRole(model, MARINID), grout: 1 },
            { coloring: byRole(model, tradition), grout: 1 },
            { coloring: byRole(model, tradition), grout: 4 },
          ]
        : [],
    [model, tradition],
  );
  return (
    <tr>
      <th scope="row">
        {model?.tutorial.title ?? id}
        <small>{tradition.name}</small>
      </th>
      {model
        ? colorings.map((c, k) => (
            <td key={k} className={c.grout > 1 ? 'colors-wide' : undefined}>
              <Thumbnail
                model={model}
                {...(c.coloring ? { coloring: c.coloring } : {})}
                grout={c.grout}
              />
            </td>
          ))
        : COLUMNS.map((c) => (
            <td key={c.letter} className="colors-waiting">
              {PROGRESS_TEXT[progress ?? 'checking']}
            </td>
          ))}
    </tr>
  );
}

/** One tutorial today and with the proposed colours. */
function Proposed({ id }: { id: string }) {
  const entry = LIBRARY.find((e) => e.id === id);
  const { model, progress } = useModel(entry?.json);
  const proposed = useMemo(() => {
    if (!model) return undefined;
    const p = proposal(model.tutorial, model.pattern);
    return {
      kept: p.kept,
      model: {
        ...model,
        tutorial: {
          ...model.tutorial,
          pattern: {
            ...model.tutorial.pattern,
            palette: p.palette,
            colors: { ...p.colors },
          },
        },
      },
    };
  }, [model]);
  return (
    <figure className="colors-proposed" id={`colors-${id}`}>
      <figcaption>
        {entry?.preview?.title ?? model?.tutorial.title ?? id}
        {proposed?.kept && (
          <small>
            {proposed.kept === 'photo'
              ? 'coloured from its photo: palette only'
              : 'its own colours kept: palette only'}
          </small>
        )}
      </figcaption>
      {model && proposed ? (
        <div>
          <Thumbnail model={model} />
          <Thumbnail model={proposed.model} />
        </div>
      ) : (
        <div className="colors-waiting">
          {PROGRESS_TEXT[progress ?? 'checking']}
        </div>
      )}
    </figure>
  );
}

/** Every tutorial, grouped by the palette of its tradition. */
function EveryTutorial() {
  const groups = new Map<string, string[]>();
  for (const e of LIBRARY) {
    const palette = traditionPalette(e.preview?.style);
    groups.set(palette, [...(groups.get(palette) ?? []), e.id]);
  }
  return (
    <>
      {[...groups].map(([palette, ids]) => (
        <section key={palette}>
          <h3>
            {palette === 'Alhambra' ? 'Nasrid (Alhambra palette)' : palette}{' '}
            <Swatches
              colours={(['ground', 'b', 'c', 'a', 'd'] as const).map(
                (k) => (PALETTES[palette] as Record<Slot, string>)[k],
              )}
            />
          </h3>
          <div className="colors-grid">
            {ids.map((id) => (
              <Proposed key={id} id={id} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

/** Colour swatches, each with its lightness (0 black, 100 white). */
function Swatches({ colours }: { colours: readonly string[] }) {
  return (
    <span className="colors-swatches">
      {colours.map((c) => (
        <span key={c} className="colors-swatch">
          <span style={{ background: c }} />
          <small>{lightness(c)}</small>
        </span>
      ))}
    </span>
  );
}

const of = (s: Scheme) => [s.light, s.accent, s.second, s.dark];

export function ColorsPlan() {
  return (
    <div className="review plan colors-plan">
      <nav className="review-top">
        <a href="#/">← Library</a>
        <span>
          <a href="#/review">Review page</a>
        </span>
      </nav>
      <header className="review-head">
        <h1>Colour: how it works now, and what I suggest</h1>
        <p className="lede">
          You said the colours do not look right but you are not sure how to fix
          them. Below is how the app colours a pattern today, what I think goes
          wrong, and four changes you can compare on six real patterns. Every
          picture is drawn live from the tutorial. Nothing has changed in the
          app yet.
        </p>
      </header>

      <h2 className="group">Your question</h2>
      <p>
        Look at the table further down and tell me which column is closest to
        what you want, A to E, or what is still wrong with all of them. If you
        like D, the next question is whether each tradition should keep its own
        colours in the library, which is what I recommend.
      </p>

      <h2 className="group">How colouring works today</h2>
      <p>
        The app has seven palettes, each of four colours and a ground, named
        after a place (Fès tile, Marrakech, Chefchaouen, Tétouan, Isfahan,
        Kashan, Alhambra). A tutorial picks one palette and says which of the
        four colours each piece shape takes. Every piece of the same shape gets
        the same colour, unless the tutorial adds placement rules, as the
        Comares bones do. A shape the tutorial does not name takes the next
        colour in turn. The learner can then switch palette or repaint a shape
        at the Color stage.
      </p>
      <p>
        In practice 25 of the 39 tutorials use the default, Fès tile, 12 use
        Alhambra and 2 use Isfahan, and the colour of each shape was chosen by
        hand, tutorial by tutorial, with no common rule.
      </p>

      <h2 className="group">What I think goes wrong</h2>
      <p>
        <b>The four colours are all about as dark as each other.</b> Fès tile is
        a blue, a green, a mustard and a dark red. The numbers under each swatch
        are their lightness, from 0 for black to 100 for white: the blue, green
        and red sit between 30 and 47. When two of them meet, as the blue and
        green do on the Comares lattice and the six-fold star and hexagons (rows
        2 and 3, column A), the eye barely separates the shapes, and the pattern
        turns muddy. Real tilework works the other way: a very light ground, a
        very dark colour, and one or two strong colours between them.
      </p>
      <p className="colors-compare">
        <span>Fès tile today</span>{' '}
        <Swatches colours={Object.values(FES_TODAY)} />
        <span>Marinid zellige, suggested</span>{' '}
        <Swatches colours={of(MARINID)} />
      </p>
      <p>
        <b>Too many colours are spread evenly.</b> On the larger patterns every
        colour appears everywhere in similar amounts, so nothing leads the eye
        (Kurt’s wheel and the Mian rosette, column A). On a real wall one colour
        clearly dominates, usually the ground, the star stands out, and the rest
        support it.
      </p>
      <p>
        <b>Colour follows shape, not role.</b> A shape’s colour depends on what
        it is (eight corners, this area), not on what it does in the pattern:
        the star in the middle, the ground around it, the small pieces between.
        Two shapes side by side can end up in the same colour, or a tiny piece
        in the strongest one.
      </p>
      <p>
        <b>Every library card looks alike.</b> Because most tutorials share Fès
        tile, a Mamluk minbar, an Ibn Tulun grille and a Timurid tile all come
        out blue, green and mustard, although the real ones are wood and ivory,
        stucco, or turquoise and cobalt.
      </p>

      <h2 className="group">Four suggestions, side by side</h2>
      <p>
        Each column adds one change to the one before, so you can see what each
        change does on its own. <b>A</b> is today. <b>B</b> keeps today’s
        colours but gives them roles by one rule for every pattern: the star
        (the shape with most corners) takes the strongest colour, the shape
        covering most of the wall becomes the light ground, and every other
        shape takes the first colour that none of its neighbours has. Under
        strapwork the ground is dark instead, because the bands are already
        light. <b>C</b> uses the same rule with a palette that has clear steps
        of lightness: an off-white, a near black, a green and a honey. <b>D</b>{' '}
        uses the same rule with the colours of each pattern’s tradition, named
        under its title. <b>E</b> is D with grout four times wider, as on cut
        zellige, where the white joints are part of the look. On strapwork
        patterns (the last two rows) the bands widen instead.
      </p>
      <p className="colors-compare">
        <span>Nasrid</span> <Swatches colours={of(NASRID)} />
        <span>Timurid</span> <Swatches colours={of(TIMURID)} />
        <span>Mamluk wood</span> <Swatches colours={of(MAMLUK_WOOD)} />
      </p>
      <div className="colors-table-wrap">
        <table className="colors-table">
          <thead>
            <tr>
              <th />
              {COLUMNS.map((c) => (
                <th key={c.letter} scope="col">
                  <b>{c.letter}</b>
                  <small>{c.name}</small>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SAMPLES.map((s) => (
              <Row key={s.id} id={s.id} tradition={s.tradition} />
            ))}
          </tbody>
        </table>
      </div>
      <p>
        The rule in B to E is automatic and rough: it does not know the real
        wall, and on a few patterns it will pick something odd. It is there to
        show the direction, not the final colours.
      </p>

      <h2 className="group">Your pick: every tutorial, today and proposed</h2>
      <p>
        You chose C and D. D already keeps C’s light, mid and dark steps, so
        each tradition now has one palette with the same roles: a light ground,
        a dark, a strong accent and a second colour. Each tutorial below shows
        today on the left and the proposal on the right. The Alhambra tutorials
        and the Bou Inania wall were coloured by hand from photos of the real
        walls, so they keep that colouring and only take their tradition’s
        palette. The others are coloured by the role rule, except Kurt’s three
        wheels and the Bou Inania rosette, where the rule went wrong (it took
        the wheels’ large ground for the star, and turned the rosette honey all
        over), so they keep their own colours in the new palette. Name any that
        still look wrong; nothing changes in the tutorials until you agree.
      </p>
      <EveryTutorial />

      <h2 className="group">What I would do next, if you agree</h2>
      <p>
        First, replace the seven palettes with a few per tradition, each with a
        light, a dark and two strong colours, and check every palette by its
        lightness numbers so no two neighbouring colours are close. Second, give
        each tutorial the palette of its own tradition, so the library shows the
        variety of the real walls. Third, colour each tutorial by role: the
        automatic rule as a starting point, then corrected by hand where a photo
        of the real wall shows otherwise. Where a tutorial has a photo, its
        colours should come from that photo. The learner keeps every palette and
        can still repaint any shape.
      </p>
      <p>
        Your notes from earlier say the last palette rework was not liked and
        was reverted, so I will not change any tutorial until you have picked a
        direction here.
      </p>
    </div>
  );
}
