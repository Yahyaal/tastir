import { useEffect, useRef, useState } from 'react';
import './darkReview.css';

/*
 * The two dark palettes side by side (#/review/dark, dev server only): the
 * night we have, and a deeper midnight lapis with warmer gold and
 * turquoise. Each side is the real app in a frame, asked for its palette in
 * the address, so nothing this browser remembers changes.
 */

const PAGES = [
  ['The library', '#/'],
  ['A finished wall', '#/minbar-doors-cairo/result'],
  ['A wall in colour', '#/alhambra-star-and-arrows/result'],
  ['A lesson step', '#/eight-fold-star-and-cross/watch/4'],
] as const;

const SIDES = [
  ['A', 'Night (today)', 'theme=dark'],
  ['B', 'Midnight lapis', 'theme=dark&palette=lapis'],
] as const;

export function DarkReview() {
  const [page, setPage] = useState(0);
  const [, hash] = PAGES[page] ?? PAGES[0];
  return (
    <main className="dark-review">
      <header>
        <h1>Two dark palettes</h1>
        <p>
          Each side is the app itself; scroll and click inside it. Pick the one
          you want for dark mode.
        </p>
        <nav aria-label="Page to compare">
          {PAGES.map(([name], i) => (
            <button
              key={name}
              type="button"
              aria-pressed={i === page}
              onClick={() => setPage(i)}
            >
              {name}
            </button>
          ))}
        </nav>
      </header>
      <div className="dark-review-sides">
        {SIDES.map(([letter, name, query]) => (
          <figure key={letter}>
            <figcaption>
              <b>{letter}</b> {name}
            </figcaption>
            <Frame
              key={hash}
              title={`${letter}: ${name}`}
              src={`${window.location.pathname}?${query}${hash}`}
            />
          </figure>
        ))}
      </div>
    </main>
  );
}

/** The app at a laptop's size (1280 × 800), scaled to fit its column. */
function Frame({ title, src }: { title: string; src: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0.5);
  useEffect(() => {
    const el = box.current;
    if (!el || typeof ResizeObserver !== 'function') return;
    const watch = new ResizeObserver(() => setK(el.clientWidth / 1280));
    watch.observe(el);
    return () => watch.disconnect();
  }, []);
  return (
    <div
      className="dark-review-frame"
      ref={box}
      style={{ '--k': k } as React.CSSProperties}
    >
      <iframe title={title} src={src} />
    </div>
  );
}
