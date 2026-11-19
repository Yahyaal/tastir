// Carves the pattern into closed meshes off the page's thread, so the
// sliders stay smooth while a dense pattern is carved.
import { carve, type CarveRequest } from './carve';
import type { CarveReply } from './reliefClient';

onmessage = ({ data }: MessageEvent<CarveRequest & { id: number }>) => {
  const { id } = data;
  try {
    const done = carve(data);
    const reply: CarveReply = { id, kind: 'done', ...done };
    const buffers = [done.mesh, done.master].flatMap((m) =>
      m && m !== done.mesh ? [m.positions.buffer, m.triangles.buffer] : [],
    );
    postMessage(reply, {
      transfer: [done.mesh.positions.buffer, done.mesh.triangles.buffer, ...buffers],
    });
  } catch (e) {
    const reply: CarveReply = {
      id,
      kind: 'error',
      message: e instanceof Error ? e.message : String(e),
    };
    postMessage(reply);
  }
};
