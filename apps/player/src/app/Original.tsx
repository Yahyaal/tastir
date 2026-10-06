import { useState } from 'react';
import type { Photo } from '@tastir/schema';

/**
 * Where a photo of the real pattern is served from. A free photo ships in
 * the public photos/ folder. A private one (one we may not ship) lives in
 * docs/research, which only the dev server serves; the built app has no
 * address for it and shows a placeholder instead.
 */
export function photoSrc(
  photo: Photo,
  dev: boolean = import.meta.env.DEV,
): string | undefined {
  if (!photo.private) return `${import.meta.env.BASE_URL}photos/${photo.file}`;
  return dev ? `/__review/research/${photo.file}` : undefined;
}

/**
 * The original: a photo of the real pattern, shown beside the wall so the
 * two can be compared, with its credit. Several photos are shown one at a
 * time.
 */
export function Original({
  photos,
  dev = import.meta.env.DEV,
}: {
  photos: readonly Photo[];
  dev?: boolean;
}) {
  const [shown, setShown] = useState(0);
  const photo = photos[shown] ?? photos[0];
  if (!photo) return null;
  const src = photoSrc(photo, dev);
  return (
    <figure className="original" aria-label="The original">
      {src ? (
        <img src={src} alt={photo.caption} />
      ) : (
        <div className="photo-placeholder">
          <p>A photo of the real pattern is to come.</p>
          <p>
            We are looking for one we may show here. Meanwhile you can see it at{' '}
            <a href={photo.url}>its source</a>.
          </p>
        </div>
      )}
      <figcaption>
        {photo.caption}{' '}
        <span className="credit">
          Photo: {photo.creator}, {photo.license}.{' '}
          <a href={photo.url}>Source</a>
          {src && photo.private ? ' (shown on the dev server only)' : ''}
        </span>
        {photos.length > 1 ? (
          <span className="photo-nav">
            {photos.map((p, i) => (
              <button
                key={p.file}
                type="button"
                className="quiet"
                aria-pressed={i === shown}
                onClick={() => setShown(i)}
              >
                Photo {i + 1}
              </button>
            ))}
          </span>
        ) : null}
      </figcaption>
    </figure>
  );
}
