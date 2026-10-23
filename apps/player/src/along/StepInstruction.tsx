import { StepText } from '../app/StepText';

/** The step to copy: its heading, then its text, a sentence to a line. The
 * steps are stacked in one place, so the box fits the longest and the
 * drawing boards never move. */
export function StepInstruction({
  head,
  text,
  announcement,
}: {
  head: string;
  text: string;
  announcement?: 'status' | 'alert';
}) {
  return (
    <div className="along-instruction" role={announcement}>
      <h2>{head}</h2>
      <div className="instruction">
        <StepText text={text} />
      </div>
    </div>
  );
}
