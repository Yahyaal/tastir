import {
  FeedbackSnapshotShape,
  type FeedbackContext,
  type FeedbackSnapshot,
} from '@tastir/schema';
import { captureBoard } from '../agent/capture';
import { FEEDBACK_AVAILABLE, openFeedback } from './client';

export function FeedbackButton({
  context,
  tutorial,
  snapshot,
  board,
  pause,
}: {
  context: FeedbackContext;
  tutorial?: unknown;
  snapshot?: () => FeedbackSnapshot;
  board?: () => SVGSVGElement | null;
  pause?: () => void;
}) {
  if (!FEEDBACK_AVAILABLE) return null;
  return (
    <button
      type="button"
      className="secondary feedback-trigger"
      aria-label="Report an issue or leave feedback"
      title="Report an issue or leave feedback"
      onClick={() => {
        pause?.();
        const raw = snapshot?.();
        // Reference-photo metadata is unrelated to reproducing the drawing.
        const safe = raw
          ? (JSON.parse(
              JSON.stringify(raw, (key, value) =>
                key === 'photos' ? undefined : value,
              ),
            ) as FeedbackSnapshot)
          : undefined;
        const checked = FeedbackSnapshotShape.safeParse(safe);
        const drawing = checked.success
          ? (JSON.parse(JSON.stringify(checked.data)) as FeedbackSnapshot)
          : safe;
        const svg = board?.();
        // The SVG is cloned synchronously before captureBoard's first await. Only the board is captured.
        const image =
          svg && checked.success
            ? captureBoard(svg, { maxSide: 1000, maxBytes: 256 * 1024 }).catch(
                () => undefined,
              )
            : undefined;
        const instruction = svg
          ?.closest('.player')
          ?.querySelector('.along-layer.on .instruction')?.textContent;
        openFeedback({
          context: {
            ...context,
            ...(instruction ? { instruction: instruction.slice(0, 8192) } : {}),
          },
          tutorial,
          snapshot: drawing,
          image,
        });
      }}
    >
      Feedback
    </button>
  );
}
