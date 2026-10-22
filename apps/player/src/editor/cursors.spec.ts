import { toolCursor } from './cursors';
import { TOOLS } from './tools';

describe('the editor pointer', () => {
  it('gives every tool its own pointer, aimed at the crosshair centre', () => {
    const cursors = [...TOOLS.map((t) => t.id), 'block' as const].map(
      toolCursor,
    );
    expect(new Set(cursors).size).toBe(cursors.length);
    for (const c of cursors) {
      expect(c).toMatch(/^url\("data:image\/svg\+xml,[^"]+"\) 8 8, crosshair$/);
      const svg = decodeURIComponent(
        c.slice(c.indexOf(',') + 1, c.indexOf('")')),
      );
      expect(
        new DOMParser()
          .parseFromString(svg, 'image/svg+xml')
          .querySelector('parsererror'),
      ).toBeNull();
    }
  });
});
