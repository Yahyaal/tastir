import { useId } from 'react';

/**
 * A thin band of eight-pointed stars and crosses, as on a zellige dado,
 * between the parts of the home page. Its colours follow the theme.
 */
export function ZelligeBand() {
  const id = `zellige-band-${useId().replace(/:/g, '')}`;
  const star =
    '68.3,40 60,48.3 60,60 48.3,60 40,68.3 31.7,60 20,60 20,48.3 11.7,40 20,31.7 20,20 31.7,20 40,11.7 48.3,20 60,20 60,31.7';
  const corner = (x: number, y: number) =>
    star
      .split(' ')
      .map((p) => {
        const [a = 0, b = 0] = p.split(',').map(Number);
        return `${a - 40 + x},${b - 40 + y}`;
      })
      .join(' ');
  return (
    <svg className="zellige-band" aria-hidden="true" width="100%" height="18">
      <defs>
        <pattern
          id={id}
          width="80"
          height="80"
          patternUnits="userSpaceOnUse"
          patternTransform="scale(0.225)"
        >
          <rect width="80" height="80" className="band-ground" />
          <polygon points={star} className="band-a" />
          {[
            [0, 0],
            [80, 0],
            [0, 80],
            [80, 80],
          ].map(([x = 0, y = 0]) => (
            <polygon
              key={`${x},${y}`}
              points={corner(x, y)}
              className="band-b"
            />
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="18" fill={`url(#${id})`} />
    </svg>
  );
}
