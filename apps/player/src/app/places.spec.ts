import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REGIONS } from '@tastir/schema';
import { describe, expect, it } from 'vitest';
import {
  BAND,
  isHigh,
  PLACES,
  placeHref,
  placeInRoute,
  ROUTE_PLACES,
  STOPS,
  stretches,
  wavePath,
} from './places';

describe('places', () => {
  it('names every region a tutorial can have, the route west to east', () => {
    expect(PLACES.map((p) => p.key).sort()).toEqual([...REGIONS].sort());
    expect(STOPS).toHaveLength(ROUTE_PLACES.length);
    const xs = STOPS.map(([x]) => x);
    expect(xs).toEqual([...xs].sort((a, b) => a - b));
  });

  it('goes high and low in turn, so every name has room', () => {
    ROUTE_PLACES.forEach((_, i) => {
      if (i) expect(isHigh(i)).not.toBe(isHigh(i - 1));
    });
  });

  it('gives each place a stretch half way to each neighbour, covering the route', () => {
    const z = stretches();
    expect(z[0]?.from).toBe(0);
    expect(z.at(-1)?.to).toBe(1);
    z.forEach((s, i) => {
      const x = STOPS[i]?.[0] ?? -1;
      expect(s.from).toBeLessThan(x);
      expect(s.to).toBeGreaterThan(x);
      if (i) expect(s.from).toBeCloseTo(z[i - 1]?.to ?? -1, 9);
    });
  });

  it('draws the wave through every stop', () => {
    const d = wavePath(1000, 100);
    for (const [x, y] of STOPS) expect(d).toContain(`${x * 1000},${y * 100}`);
  });

  it('writes and reads a place in the address', () => {
    for (const p of PLACES) {
      const href = placeHref(p.key);
      expect(href).toMatch(/^#\/places\//);
      // The router hands over the address decoded, without '#/'.
      expect(placeInRoute(decodeURIComponent(href.slice(2)))).toBe(p.key);
    }
    expect(placeHref()).toBe('#/');
    expect(placeInRoute('places/Atlantis')).toBeUndefined();
    expect(placeInRoute('places/')).toBeUndefined();
    expect(placeInRoute('morocco')).toBeUndefined();
  });

  it('has a band pattern for every place, and the band drawn from it', () => {
    const root = process.cwd().replace(/\/apps\/player$/, '');
    for (const theme of ['light', 'dark']) {
      const svg = readFileSync(
        join(root, 'apps/player/public/route', `band-${theme}.svg`),
        'utf8',
      );
      // Under 250 kB: the home loads it on every visit.
      expect(svg.length).toBeLessThan(250_000);
      for (const p of ROUTE_PLACES) {
        const pattern = /data-pattern="([^"]+)"/.exec(
          svg.slice(svg.indexOf(`data-place="${p.key}"`)),
        )?.[1];
        // The band shows one of the place's own patterns; when BAND changes,
        // pnpm route-band draws it again.
        expect(BAND[p.key], p.key).toContain(pattern);
      }
    }
  });
});
