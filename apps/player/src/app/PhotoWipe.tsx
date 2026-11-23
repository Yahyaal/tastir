import { useRef, useState } from 'react';
import type { Photo } from '@tastir/schema';
import { photoSrc } from './Original';

/**
 * The real wall's photo badge, in the corner of the finished wall: a small
 * picture of the photo that opens the wipe.
 */
export function PhotoBadge({
  photo,
  open,
  onToggle,
}: {
  photo: Photo;
  open: boolean;
  onToggle: () => void;
}) {
  const src = photoSrc(photo);
  return (
    <button
      type="button"
      className="photo-badge"
      aria-pressed={open}
      title={
        open
          ? 'Close the photo of the real wall'
          : 'Compare with a photo of the real wall'
      }
      onClick={onToggle}
    >
      {src ? <img src={src} alt="" /> : null}
      <span>{open ? 'Close photo' : 'Real wall'}</span>
    </button>
  );
}

/**
 * The real wall over ours, wiped away by a golden handle: the photo shows
 * left of the handle, our wall right of it. Drag the handle, or focus it and
 * use the arrow keys.
 */
export function PhotoWipe({ photo }: { photo: Photo }) {
  const [at, setAt] = useState(50);
  const box = useRef<HTMLDivElement>(null);
  const src = photoSrc(photo);
  const move = (clientX: number) => {
    const r = box.current?.getBoundingClientRect();
    if (!r || r.width === 0) return;
    setAt(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)));
  };
  return (
    <div className="photo-wipe" ref={box}>
      <div
        className="photo-wipe-photo"
        style={{ clipPath: `inset(0 ${100 - at}% 0 0)` }}
      >
        {src ? (
          <img src={src} alt={photo.caption} />
        ) : (
          <p className="photo-wipe-missing">The photo is not available here.</p>
        )}
        <p className="photo-wipe-credit">
          Photo: {photo.creator}, {photo.license}
        </p>
      </div>
      <div
        className="photo-wipe-handle"
        role="slider"
        tabIndex={0}
        aria-label="Wipe between the photo and our wall"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(at)}
        style={{ left: `${at}%` }}
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.currentTarget.setPointerCapture?.(e.pointerId);
          move(e.clientX);
        }}
        onPointerMove={(e) => {
          if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
            e.stopPropagation();
            move(e.clientX);
          }
        }}
        onKeyDown={(e) => {
          const step =
            e.key === 'ArrowLeft' ? -5 : e.key === 'ArrowRight' ? 5 : 0;
          if (!step) return;
          e.preventDefault();
          e.stopPropagation();
          setAt((x) => Math.max(0, Math.min(100, x + step)));
        }}
      >
        <span className="photo-wipe-grip" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M9 6l-5 6 5 6M15 6l5 6-5 6" />
          </svg>
        </span>
      </div>
    </div>
  );
}
