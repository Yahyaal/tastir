import { isAction, sentencesOf, StepText } from '../app/StepText';

/** The step to copy: its heading, then its text, a sentence to a line. The
 * steps are stacked in one place, so the box fits the longest and the
 * drawing boards never move. With `parts` (the ink a shape at a time), a
 * checklist: each part ticked once inked, the first one still to ink
 * marked as the one at hand. */
export function StepInstruction({
  head,
  text,
  parts,
  announcement,
}: {
  head: string;
  text: string;
  parts?: readonly { readonly text: string; readonly done: boolean }[];
  announcement?: 'status' | 'alert';
}) {
  const at = parts?.findIndex((p) => !p.done) ?? -1;
  return (
    <div className="along-instruction" role={announcement}>
      <h2>{head}</h2>
      <div className="instruction">
        {parts ? (
          <ol className="ink-parts">
            {parts.map((part, i) => (
              <li
                key={i}
                className={part.done ? 'done' : i === at ? 'at' : undefined}
                aria-current={i === at ? 'step' : undefined}
              >
                <span className="ink-part-mark" aria-hidden="true">
                  {part.done ? '✓' : i + 1}
                </span>
                <span className="ink-part-text">
                  {sentencesOf(part.text).map((s, k) => (
                    <span key={k} className={isAction(s) ? undefined : 'note'}>
                      {s}{' '}
                    </span>
                  ))}
                  {part.done ? (
                    <span className="visually-hidden">(done)</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <StepText text={text} />
        )}
      </div>
    </div>
  );
}
