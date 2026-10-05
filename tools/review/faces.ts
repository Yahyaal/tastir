// Faces of a set of segments: reads [[ax, ay, bx, by], ...] as JSON on
// stdin and prints the closed faces as [[[x, y], ...], ...].
//   tsx --conditions=@tastir/source tools/review/faces.ts < segs.json
import { arrangement, segment, tolerance, vec } from '../../packages/engine/src/index.ts';
let input = '';
process.stdin.on('data', (c) => (input += c));
process.stdin.on('end', () => {
  const raw = JSON.parse(input) as number[][];
  const segs = raw.map(([ax, ay, bx, by]) => segment(vec(ax!, ay!), vec(bx!, by!)));
  const faces = arrangement(segs, tolerance(1));
  process.stdout.write(JSON.stringify(faces.map((f) => f.map((p) => [p.x, p.y]))));
});
