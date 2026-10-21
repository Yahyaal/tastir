/** The owner's connection check, completed through the real Studio commands. */
export async function blueSquare(
  call: (
    method: 'GET' | 'POST',
    path: string,
    data?: unknown,
  ) => Promise<unknown>,
  title: string,
) {
  const made = await call('POST', '/projects', {
    author: 'ChatGPT',
    title,
    fold: 4,
  });
  const id = (made as { project: string }).project;
  await call('POST', `/projects/${id}/edit`, {
    author: 'ChatGPT',
    revision: 1,
    edit: {
      op: 'construct',
      add: [
        { kind: 'circle', name: 'C', centre: 'O', through: 'A' },
        { kind: 'line', name: 'H', from: 'O', to: 'A' },
        {
          kind: 'perpendicular',
          name: 'V',
          through: 'O',
          perpendicularTo: 'H',
        },
        { kind: 'point', name: 'N', meet: ['C', 'V'], pick: { angle: 90 } },
        { kind: 'point', name: 'W', meet: ['C', 'H'], pick: { angle: 180 } },
        { kind: 'point', name: 'S', meet: ['C', 'V'], pick: { angle: 270 } },
      ],
    },
  });
  await call('POST', `/projects/${id}/edit`, {
    author: 'ChatGPT',
    revision: 2,
    edit: {
      op: 'ink',
      add: [
        { from: 'A', to: 'N' },
        { from: 'N', to: 'W' },
        { from: 'W', to: 'S' },
        { from: 'S', to: 'A' },
      ],
    },
  });
  const tiled = await call('POST', `/projects/${id}/edit`, {
    author: 'ChatGPT',
    revision: 3,
    edit: { op: 'tile', vertices: ['A', 'N', 'W', 'S'] },
  });
  const piece = (
    tiled as {
      drawing: { tile: { pieces: { id: string }[] } };
    }
  ).drawing.tile.pieces[0]?.id;
  if (!piece) throw new Error('The square has no tile piece');
  await call('POST', `/projects/${id}/edit`, {
    author: 'ChatGPT',
    revision: 4,
    edit: {
      op: 'paint',
      colors: [{ piece, color: '#2453a6' }],
    },
  });
  return id;
}
