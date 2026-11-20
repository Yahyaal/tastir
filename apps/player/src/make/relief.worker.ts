// Carves the pattern into closed meshes off the page's thread, so the
// sliders stay smooth while a dense pattern is carved.
import { carve, type CarveRequest } from './carve';
import type { CarveReply } from './reliefClient';

onmessage = ({ data }: MessageEvent<CarveRequest & { id: number }>) => {
  const { id } = data;
  try {
    const done = carve(data);
    const reply: CarveReply = { id, kind: 'done', ...done };
    const meshes = [
      done.mesh,
      done.master,
      ...(done.parts ?? []).map((p) => p.mesh),
      ...(done.set?.colours ?? []).map((c) => c.mesh),
      ...(done.set?.plates ?? []).flatMap((p) => p.items.map((i) => i.mesh)),
      ...(done.set?.tray ?? []).map((p) => p.mesh),
    ];
    const buffers = new Set<ArrayBuffer>();
    for (const m of meshes)
      if (m) for (const a of [m.positions, m.triangles]) buffers.add(a.buffer as ArrayBuffer);
    postMessage(reply, { transfer: [...buffers] });
  } catch (e) {
    const reply: CarveReply = {
      id,
      kind: 'error',
      message: e instanceof Error ? e.message : String(e),
    };
    postMessage(reply);
  }
};
