import { useEffect } from 'react';
import { wallSvg } from './exporting';
import type { Model } from './model';

export type Paper = 'A4' | 'Letter';

/**
 * A printable line sheet: the pattern in lines only, for coloring by hand,
 * with the tutorial's title and credits. Shown only when printing.
 */
export function PrintSheet({
  model,
  paper,
  onDone,
}: {
  model: Model;
  paper: Paper;
  onDone: () => void;
}) {
  const { tutorial } = model;
  useEffect(() => {
    const done = () => onDone();
    window.addEventListener('afterprint', done);
    // Let the sheet render before the print dialog opens.
    const timer = setTimeout(() => window.print(), 50);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('afterprint', done);
    };
  }, [onDone]);
  const svg = wallSvg(model, [], {
    look: 'lines',
    across: 4,
    down: paper === 'A4' ? 5 : 4.6,
    scale: 60,
  });
  return (
    <div className={`print-sheet paper-${paper}`}>
      <style>{`@page { size: ${paper === 'A4' ? 'A4' : 'letter'} portrait; margin: 12mm; }`}</style>
      <h1>{tutorial.title}</h1>
      <p>
        {tutorial.fold}-fold · {tutorial.style}
      </p>
      {/* The SVG is generated here from the pattern, not taken from input. */}
      <div
        className="print-pattern"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <footer>
        {tutorial.credits.length ? (
          <ul>
            {tutorial.credits.map((c, i) => (
              <li key={i}>
                Credit: {c.source}
                {c.creator ? `, ${c.creator}` : ''}
                {c.url ? ` (${c.url})` : ''}
              </li>
            ))}
          </ul>
        ) : (
          <p>
            The construction is general knowledge; the drawing is Tastir's own.
          </p>
        )}
        <p>Made with Tastir.</p>
      </footer>
    </div>
  );
}
