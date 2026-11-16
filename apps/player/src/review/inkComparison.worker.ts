import { cellOf, evaluate, inkStrokes } from '@tastir/engine';
import { parseTutorial } from '@tastir/schema';
import { compareInk, type InkComparison, type InkWall } from './inkComparison';

export type OverlayReply = { result: InkComparison } | { error: string };
function wall(json: unknown): InkWall {
  const tutorial = parseTutorial(json);
  const scene = evaluate(tutorial);
  const cell = cellOf(scene, tutorial.pattern.cell);
  return {
    origin: cell.origin,
    u: cell.u,
    v: cell.v,
    ink: inkStrokes(scene, tutorial).map((s) => s.segment),
  };
}
onmessage = ({ data }: MessageEvent<{ a: unknown; b: unknown }>) => {
  try {
    const reply: OverlayReply = {
      result: compareInk(wall(data.a), wall(data.b)),
    };
    postMessage(reply);
  } catch (e) {
    const reply: OverlayReply = {
      error: e instanceof Error ? e.message : String(e),
    };
    postMessage(reply);
  }
};
