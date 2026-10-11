import { createElement, useId } from 'react';
import type { JaliAppearance } from '@tastir/schema';

interface Mark {
  tag: 'path' | 'circle' | 'ellipse';
  attributes: Record<string, string | number>;
}

function tint(color: string, light: boolean, amount: number): string {
  return (
    '#' +
    [1, 3, 5]
      .map((at) => {
        const channel = parseInt(color.slice(at, at + 2), 16);
        return Math.round(channel + ((light ? 255 : 0) - channel) * amount)
          .toString(16)
          .padStart(2, '0');
      })
      .join('')
  );
}

/** Deterministic, small vector tiles: texture follows the chosen framework color. */
export function jaliTexture({ material, finish, framework }: JaliAppearance) {
  const marks: Mark[] = [];
  const dark = tint(framework, false, 0.48);
  const light = tint(framework, true, 0.65);
  const line = (d: string, stroke: string, width: number, opacity: number) =>
    marks.push({
      tag: 'path',
      attributes: {
        d,
        fill: 'none',
        stroke,
        strokeWidth: width,
        strokeLinecap: 'round',
        opacity,
      },
    });
  const speckles = (count: number, rough: boolean) => {
    for (let i = 0; i < count; i++) {
      marks.push({
        tag: 'circle',
        attributes: {
          cx: (i * i * 11 + i * 23 + 7) % 64,
          cy: (i * i * 7 + i * 37 + 13) % 64,
          r: rough ? 0.3 + (i % 4) * 0.16 : 0.3 + (i % 2) * 0.2,
          fill: i % 3 === 0 ? light : dark,
          opacity: rough ? 0.34 : 0.27,
        },
      });
    }
  };
  let name: string;
  if (material === 'wood') {
    name = `${finish === 'custom' ? 'oak' : finish}-grain`;
    const grain =
      finish === 'walnut'
        ? [2, 5, 11, 16, 21, 27, 30, 36, 43, 48, 56, 61]
        : finish === 'cedar'
          ? [2, 11, 19, 29, 38, 47, 59]
          : [2, 6, 13, 18, 26, 31, 38, 47, 53, 61];
    for (const y of grain) {
      const bend = y % 3 === 0 ? 3 : -3;
      line(`M0 ${y} C16 ${y + bend} 48 ${y - bend} 64 ${y}`, dark, 0.65, 0.32);
      line(
        `M0 ${y + 1.6} C16 ${y + bend + 1.6} 48 ${y - bend + 1.6} 64 ${y + 1.6}`,
        light,
        0.4,
        0.16,
      );
    }
    for (const [rx, ry] of [
      [7, 2.6],
      [3.5, 1.2],
    ])
      marks.push({
        tag: 'ellipse',
        attributes: {
          cx: 38,
          cy: 29,
          rx: rx!,
          ry: ry!,
          fill: 'none',
          stroke: dark,
          strokeWidth: 0.65,
          opacity: 0.4,
        },
      });
  } else if (material === 'metal') {
    name =
      finish === 'bronze' || finish === 'copper'
        ? `${finish}-hammered`
        : 'brushed-metal';
    if (finish === 'bronze' || finish === 'copper') speckles(24, true);
    for (let y = 2; y < 64; y += 5) {
      line(`M0 ${y} L64 ${y}`, y % 2 ? dark : light, 0.45, 0.24);
    }
  } else if (finish === 'marble') {
    name = 'marble-veins';
    line(
      'M0 12 C12 20 20 1 32 12 S52 20 64 12 M0 46 C12 38 22 56 32 46 S52 38 64 46',
      dark,
      1.4,
      0.38,
    );
    line(
      'M14 13 C21 23 18 29 28 35 S38 40 44 46 M36 11 C42 2 49 5 53 0',
      dark,
      0.55,
      0.3,
    );
    line('M0 14 C12 22 20 3 32 14 S52 22 64 14', light, 0.6, 0.65);
  } else if (finish === 'slate') {
    name = 'slate-strata';
    for (let y = 3; y < 64; y += 8) {
      line(
        `M0 ${y} L18 ${y + 1} L31 ${y - 1} L46 ${y + 0.5} L64 ${y}`,
        dark,
        0.8,
        0.38,
      );
      line(
        `M4 ${y + 2} L28 ${y + 3} M37 ${y + 2} L57 ${y + 2}`,
        light,
        0.4,
        0.3,
      );
    }
  } else {
    name = finish === 'sandstone' ? 'sandstone-grain' : 'limestone-grain';
    speckles(finish === 'sandstone' ? 48 : 20, finish === 'sandstone');
  }
  return { name, size: 64, marks };
}

export function JaliTexturePattern({
  id,
  appearance,
  width,
  transform,
}: {
  id: string;
  appearance: JaliAppearance;
  width: number;
  transform?: string;
}) {
  const texture = jaliTexture(appearance);
  return (
    <pattern
      id={id}
      data-texture={texture.name}
      patternUnits="userSpaceOnUse"
      width={texture.size * width}
      height={texture.size * width}
      viewBox={`0 0 ${texture.size} ${texture.size}`}
      patternTransform={transform}
    >
      {texture.marks.map((mark, index) =>
        createElement(mark.tag, { ...mark.attributes, key: index }),
      )}
    </pattern>
  );
}

/** Export exactly the same marks and scale as the live wall and saved preview. */
export function jaliTextureSvg(
  id: string,
  appearance: JaliAppearance,
  width: number,
): string {
  const texture = jaliTexture(appearance);
  const marks = texture.marks
    .map(
      (mark) =>
        `<${mark.tag} ${Object.entries(mark.attributes)
          .map(
            ([key, value]) =>
              `${key.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())}="${value}"`,
          )
          .join(' ')}/>`,
    )
    .join('');
  return `<pattern id="${id}" data-texture="${texture.name}" patternUnits="userSpaceOnUse" width="${texture.size * width}" height="${texture.size * width}" viewBox="0 0 ${texture.size} ${texture.size}">${marks}</pattern>`;
}

export function JaliFinishSample({
  appearance,
}: {
  appearance: JaliAppearance;
}) {
  const id = `jali-sample-${useId()}`;
  return (
    <svg
      className="jali-finish-swatch"
      viewBox="0 0 64 28"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <JaliTexturePattern id={id} appearance={appearance} width={1} />
      </defs>
      <rect width="64" height="28" fill={appearance.framework} />
      <rect width="64" height="28" fill={`url(#${id})`} />
    </svg>
  );
}
