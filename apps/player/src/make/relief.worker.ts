// Carves the pattern into a closed mesh off the page's thread, so the
// sliders stay smooth while a dense pattern is carved.
import { openEdges, relief, volumeOf } from '@tastir/relief';
import type { CarveReply, CarveRequest } from './reliefClient';

onmessage = ({ data }: MessageEvent<CarveRequest>) => {
  const { id, pattern, outline, scale, thickness, band, frame, carvings } = data;
  try {
    const mesh = relief(pattern, {
      width: 0,
      height: 0,
      outline,
      scale,
      thickness,
      band,
      frame,
      carving: (type) => carvings[type] ?? carvings[-1]!,
    });
    const open = openEdges(mesh);
    if (open) throw new Error(`The carved mesh has ${open} open edges.`);
    const reply: CarveReply = {
      id,
      kind: 'done',
      positions: mesh.positions,
      triangles: mesh.triangles,
      volume: volumeOf(mesh),
    };
    postMessage(reply, { transfer: [mesh.positions.buffer, mesh.triangles.buffer] });
  } catch (e) {
    const reply: CarveReply = {
      id,
      kind: 'error',
      message: e instanceof Error ? e.message : String(e),
    };
    postMessage(reply);
  }
};
