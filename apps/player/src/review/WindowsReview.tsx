import { ARCH_KINDS, ARCH_NAMES, archOf, type ArchKind } from '../app/arches';
import { libraryFamilies, type Entry, type Preview } from '../app/library';
import { Window, WindowDefs } from '../app/Window';
import './review.css';
import './windowsReview.css';

/*
 * The window cards of REDESIGN.1 for the owner (#/review/windows): one card
 * of every arch, each on a real pattern of that tradition, in light and in
 * dark side by side.
 */

/** A card of the review: an arch and the pattern shown in it. */
interface Sample {
  readonly kind: ArchKind;
  readonly entry: Entry;
  readonly preview: Preview;
}
/** The first pattern of each arch, in library order. */
function samples(entries: readonly Entry[]): Sample[] {
  return ARCH_KINDS.flatMap((kind) =>
    entries
      .flatMap(({ preview }, i) =>
        preview && archOf(preview.region, preview.style) === kind
          ? [{ kind, entry: entries[i] as Entry, preview }]
          : [],
      )
      .slice(0, 1),
  );
}

const designsOf = (e: Entry) =>
  1 + (e.variations?.length ?? 0) + (e.places?.length ?? 0);

function Panel({
  theme,
  cards,
}: {
  theme: 'light' | 'dark';
  cards: readonly Sample[];
}) {
  return (
    <section
      className="windows-review-panel"
      data-theme={theme}
      aria-label={theme === 'light' ? 'Light mode' : 'Dark mode'}
    >
      <h2>{theme === 'light' ? 'Light' : 'Dark'}</h2>
      <ul className="windows-review-grid">
        {cards.map(({ kind, entry, preview }) => (
          <Window
            key={kind}
            id={entry.id}
            preview={preview}
            designs={designsOf(entry)}
          />
        ))}
      </ul>
    </section>
  );
}

export function WindowsReview({
  entries = libraryFamilies(),
}: {
  entries?: readonly Entry[];
}) {
  const cards = samples(entries);
  return (
    <main className="windows-review">
      <WindowDefs />
      <nav className="review-top">
        <a href="#/review">← Review</a>
        <a href="#/notes/redesign-plan-2026-11-22">The redesign plan →</a>
      </nav>
      <header>
        <h1>Window cards</h1>
        <p className="lede">
          Each card takes the arch of its pattern&apos;s tradition. There is one
          card of every arch here, in light and in dark. Point at a card, or
          press Tab, to see View, Watch it drawn and Draw along. On a phone the
          two other actions are the icons beside the title.
        </p>
        <ol className="windows-review-names">
          {cards.map(({ kind, preview }) => (
            <li key={kind}>
              <b>{ARCH_NAMES[kind]}</b>: {preview.short ?? preview.title},{' '}
              {preview.style}
            </li>
          ))}
        </ol>
      </header>
      <Panel theme="light" cards={cards} />
      <Panel theme="dark" cards={cards} />
    </main>
  );
}
