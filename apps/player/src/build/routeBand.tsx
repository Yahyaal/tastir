/** @jsxRuntime automatic */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { renderToStaticMarkup } from 'react-dom/server';
import { parseTutorial } from '@tastir/schema';
import { cardView, Thumbnail } from '../app/drawing';
import { loadModel } from '../app/model';
import {
  BAND,
  BAND_ZOOM,
  colourSquare as squareFile,
  ROUTE_PLACES,
  STOPS,
} from '../app/places';

/*
 * The pencil band behind the route (pnpm route-band, REDESIGN.2). Drawing
 * nine walls with the engine on every visit costs about a second on a
 * phone, so this draws each place's pattern once, as its finished lines,
 * into two small pictures, light and dark, that the route shows as an
 * image. Run it again when a pattern in BAND changes.
 *
 * The band is 1000 × 200. Each place's drawing is a square 220 wide centred
 * on its stop, as the card shows the pattern (closer for BAND_ZOOM), fading
 * into its neighbours'. The route shows the band at its full width, so the
 * drawings stay under their stops at any size.
 */

const W = 1000;
const H = 200;
const SIDE = 220;
const THEMES = { light: '#4f483f', dark: '#e9e1d0' } as const;

const r1 = (v: number) => Math.round(v * 10) / 10;

type Part = ReturnType<typeof lines>;

/**
 * One place's square in colour, for the route to bloom into when the place
 * is chosen: the same pattern, framing and zoom as its pencil drawing, as
 * tiles in the tutorial's colours, with the lines drawn over them so pieces
 * of one colour side by side stay apart.
 */
async function colourSquare(part: Part, file: string) {
  const px = 440;
  const tiles = renderToStaticMarkup(
    <Thumbnail model={part.model} look="tiles" view={part.view} />,
  ).replace(
    '<svg ',
    `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" `,
  );
  // The pencil lines, in this square's own pixels.
  const k = px / SIDE;
  const lines = `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 ${px} ${px}"><path d="${part.d}" transform="scale(${k}) translate(${-part.left} ${-(H - SIDE) / 2})" fill="none" stroke="#2b2116" stroke-opacity="0.75" stroke-width="${(1.1 / k) * 2}" stroke-linecap="round"/></svg>`;
  await sharp(Buffer.from(tiles))
    .resize(px, px)
    .composite([{ input: Buffer.from(lines) }])
    .webp({ quality: 82 })
    .toFile(file);
}

/** One place's finished lines, in band coordinates, as path data. */
function lines(root: string, i: number, ids: readonly string[], zoom?: number) {
  const key = ROUTE_PLACES[i]?.key ?? '';
  for (const id of ids) {
    const file = resolve(root, 'tutorials', `${id}.json`);
    if (!existsSync(file)) continue;
    const model = loadModel(
      parseTutorial(JSON.parse(readFileSync(file, 'utf8'))),
    );
    const v = cardView(model);
    const z = BAND_ZOOM[key] ?? 1;
    // The card's square view, closer by z about its centre.
    const side = Math.max(v.maxX - v.minX, v.maxY - v.minY) / z;
    const cx = (v.minX + v.maxX) / 2;
    const cy = (v.minY + v.maxY) / 2;
    const scale = SIDE / side;
    const left = (STOPS[i]?.[0] ?? 0.5) * W - SIDE / 2;
    const top = (H - SIDE) / 2;
    const px = (x: number) => left + (x - cx + side / 2) * scale;
    const py = (y: number) => top + (y - cy + side / 2) * scale;
    const { cell, ink } = model.pattern;
    const out: string[] = [];
    const reach =
      Math.ceil(
        side /
          Math.min(
            Math.hypot(cell.u.x, cell.u.y),
            Math.hypot(cell.v.x, cell.v.y),
          ),
      ) + 2;
    for (let a = -reach; a <= reach; a++)
      for (let b = -reach; b <= reach; b++) {
        const dx = cell.u.x * a + cell.v.x * b;
        const dy = cell.u.y * a + cell.v.y * b;
        for (const { segment: s } of ink) {
          const x0 = px(s.a.x + dx);
          const y0 = py(s.a.y + dy);
          const x1 = px(s.b.x + dx);
          const y1 = py(s.b.y + dy);
          // Only lines that touch the square (and the band) are kept.
          if (
            Math.max(x0, x1) < left ||
            Math.min(x0, x1) > left + SIDE ||
            Math.max(y0, y1) < 0 ||
            Math.min(y0, y1) > H
          )
            continue;
          out.push(`M${r1(x0)} ${r1(y0)}L${r1(x1)} ${r1(y1)}`);
        }
      }
    const view = {
      minX: cx - side / 2,
      minY: cy - side / 2,
      maxX: cx + side / 2,
      maxY: cy + side / 2,
    };
    return { key, id, left, d: out.join(''), model, view, scale };
  }
  throw new Error(`No pattern of BAND["${key}"] exists.`);
}

function bandSvg(parts: readonly Part[], colour: string): string {
  const body = parts
    .map(
      (p, i) =>
        `<clipPath id="c${i}"><rect x="${p.left}" y="0" width="${SIDE}" height="${H}"/></clipPath>` +
        `<mask id="m${i}" maskUnits="userSpaceOnUse" x="${p.left}" y="0" width="${SIDE}" height="${H}"><rect x="${p.left}" y="0" width="${SIDE}" height="${H}" fill="url(#fade)"/></mask>` +
        `<g mask="url(#m${i})" clip-path="url(#c${i})" data-place="${p.key}" data-pattern="${p.id}"><path d="${p.d}"/></g>`,
    )
    .join('');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
    `<defs>` +
    // A hand's wobble.
    `<filter id="pencil" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="2.2"/></filter>` +
    // Each drawing fades into its neighbours'.
    `<linearGradient id="fade"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.35" stop-color="#fff"/><stop offset="0.65" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
    `</defs>` +
    `<g filter="url(#pencil)" fill="none" stroke="${colour}" stroke-width="0.7" stroke-linecap="round">${body}</g></svg>\n`
  );
}

async function main() {
  const root = fileURLToPath(new URL('../../../../', import.meta.url));
  const out = resolve(root, 'apps/player/public/route');
  mkdirSync(out, { recursive: true });
  const parts = ROUTE_PLACES.map((p, i) => lines(root, i, BAND[p.key] ?? []));
  for (const part of parts) {
    const key = part.key;
    const file = resolve(root, 'apps/player/public', squareFile(key));
    await colourSquare(part, file);
    console.log(`Wrote apps/player/public/${squareFile(key)}.`);
  }
  for (const [theme, colour] of Object.entries(THEMES)) {
    const svg = bandSvg(parts, colour);
    writeFileSync(resolve(out, `band-${theme}.svg`), svg);
    console.log(
      `Wrote apps/player/public/route/band-${theme}.svg (${Math.round(svg.length / 1024)} kB).`,
    );
  }
}

void main();
