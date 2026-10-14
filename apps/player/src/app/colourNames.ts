/**
 * A plain name for a colour, for screen readers and tooltips: “white”,
 * “dark blue”, “saffron”. Glaze colours are chosen by eye, so the name comes
 * from the colour itself (its hue and how light it is), not from a table.
 */
export function colourName(hex: string): string {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  if (!m) return hex;
  const [r, g, b] = [m[1], m[2], m[3]].map(
    (x) => parseInt(x ?? '0', 16) / 255,
  ) as [number, number, number];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const light = (max + min) / 2;
  const chroma = max - min;
  if (chroma < 0.05) {
    if (light > 0.85) return 'white';
    if (light < 0.18) return 'black';
    return light > 0.55 ? 'light grey' : 'grey';
  }
  let hue =
    max === r
      ? ((g - b) / chroma) % 6
      : max === g
        ? (b - r) / chroma + 2
        : (r - g) / chroma + 4;
  hue = (hue * 60 + 360) % 360;
  // Warm pale colours are the creams of plaster and glaze.
  if (light > 0.85) return hue < 70 ? 'cream' : 'pale ' + hueName(hue, light);
  if (light < 0.12) return 'black';
  const shade = light < 0.22 ? 'dark ' : light > 0.72 ? 'light ' : '';
  return shade + hueName(hue, light);
}

function hueName(hue: number, light: number): string {
  if (hue < 12 || hue >= 345) return 'red';
  if (hue < 35) return light < 0.35 ? 'brown' : 'terracotta';
  if (hue < 65) return 'saffron';
  if (hue < 165) return 'green';
  if (hue < 195) return 'turquoise';
  if (hue < 255) return 'blue';
  if (hue < 300) return 'purple';
  return 'pink';
}
