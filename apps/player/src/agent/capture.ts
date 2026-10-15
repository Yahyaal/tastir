const STYLE = [
  'color',
  'fill',
  'fill-opacity',
  'fill-rule',
  'stroke',
  'stroke-width',
  'stroke-opacity',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-dasharray',
  'stroke-dashoffset',
  'opacity',
  'font-family',
  'font-size',
  'font-weight',
  'text-anchor',
  'dominant-baseline',
  'visibility',
  'display',
  'clip-path',
  'filter',
  'mask',
  'vector-effect',
];
const SVG_NS = 'http://www.w3.org/2000/svg';

/** Capture the actual camera, computed theme styles and canvas ink layers. */
export async function captureBoard(svg: SVGSVGElement): Promise<string> {
  const bounds = svg.getBoundingClientRect();
  if (!bounds.width || !bounds.height)
    throw new Error('The drawing must be visible before it can be sent.');
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const originals = [svg, ...svg.querySelectorAll('*')];
  const copies = [clone, ...clone.querySelectorAll('*')];
  for (const [index, original] of originals.entries()) {
    const copy = copies[index] as SVGElement | HTMLElement;
    const style = getComputedStyle(original);
    for (const property of STYLE) {
      const value = style
        .getPropertyValue(property)
        .replace(/url\(["']?[^#)]*#([^"')]+)["']?\)/g, 'url(#$1)');
      if (value) copy.style.setProperty(property, value);
    }
    if (original.tagName.toLowerCase() === 'foreignobject') {
      const canvas = original.querySelector('canvas');
      if (!canvas)
        throw new Error('This drawing layer cannot be captured yet.');
      const image = document.createElementNS(SVG_NS, 'image');
      for (const attribute of ['x', 'y', 'width', 'height', 'transform']) {
        const value = original.getAttribute(attribute);
        if (value !== null) image.setAttribute(attribute, value);
      }
      image.setAttribute('href', canvas.toDataURL('image/png'));
      image.setAttribute('preserveAspectRatio', 'none');
      image.style.opacity = getComputedStyle(canvas).opacity;
      copy.replaceWith(image);
    }
  }
  clone
    .querySelectorAll('[data-agent-annotation]')
    .forEach((node) => node.remove());
  const scale = Math.min(1, 1280 / Math.max(bounds.width, bounds.height));
  const width = Math.max(1, Math.round(bounds.width * scale));
  const height = Math.max(1, Math.round(bounds.height * scale));
  clone.setAttribute('xmlns', SVG_NS);
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  const url = URL.createObjectURL(
    new Blob([new XMLSerializer().serializeToString(clone)], {
      type: 'image/svg+xml',
    }),
  );
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('This browser cannot capture the drawing.');
    context.fillStyle =
      getComputedStyle(svg).getPropertyValue('--paper').trim() ||
      getComputedStyle(document.body).backgroundColor;
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    const result = canvas.toDataURL('image/png');
    if (result.length > 4_000_000)
      throw new Error(
        'The drawing image is too large. Fit the view and try again.',
      );
    return result;
  } finally {
    URL.revokeObjectURL(url);
  }
}
