import type { ReactNode } from 'react';
import { ActionIcon } from './actionIcons';
import {
  ARCH_KINDS,
  ARCH_NAMES,
  ARCH_PATHS,
  archOf,
  PERSIAN_PATH,
  PISHTAQ_ARCH,
  type ArchKind,
} from './arches';
import type { Preview } from './library';
import './window.css';

/*
 * A library card shaped like a window (REDESIGN.1): the pattern's picture
 * clipped to the arch of its tradition, with the frame and a gold edge drawn
 * over it, because a clipped element cannot show a border or a shadow of its
 * own. Clicking the picture opens the finished wall. Pointing at it, or
 * focusing it with the keyboard (Tab lands on View), shows View (gold),
 * Watch it drawn and Draw along. A touch screen cannot point, so there a tap opens the wall and the
 * two other actions are small icons under the title (window.css).
 */

export const clipId = (kind: ArchKind) => `tastir-arch-${kind}`;
const PISHTAQ_MASK = 'tastir-arch-pishtaq-mask';
const PISHTAQ_TRANSFORM = `translate(${PISHTAQ_ARCH.x} ${PISHTAQ_ARCH.y}) scale(${PISHTAQ_ARCH.sx} ${PISHTAQ_ARCH.sy})`;

/** The arches as clip paths. Put it once on any page that shows windows. */
export function WindowDefs() {
  return (
    <svg
      className="window-defs"
      width="0"
      height="0"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <mask
          id={PISHTAQ_MASK}
          maskContentUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="100"
          height="125"
        >
          <rect width="100" height="125" fill="#fff" />
          <path d={PERSIAN_PATH} transform={PISHTAQ_TRANSFORM} fill="#000" />
        </mask>
        {ARCH_KINDS.map((k) => (
          <clipPath key={k} id={clipId(k)} clipPathUnits="objectBoundingBox">
            <path transform="scale(0.01 0.008)" d={ARCH_PATHS[k]} />
          </clipPath>
        ))}
      </defs>
    </svg>
  );
}

/** The window's frame over the picture: a thin inner line always, and an
 * edge that turns gold when the window is pointed at or focused. */
export function WindowFrame({ kind }: { kind: ArchKind }) {
  const d = ARCH_PATHS[kind];
  return (
    <svg
      className="window-frame"
      viewBox="0 0 100 125"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      {kind === 'pishtaq' ? (
        <>
          {/* The portal's filled corners (spandrels), and its arch. */}
          <path
            className="spandrel"
            d="M0,0H100V125H0Z"
            mask={`url(#${PISHTAQ_MASK})`}
          />
          <path
            className="inner"
            d={PERSIAN_PATH}
            transform={PISHTAQ_TRANSFORM}
          />
        </>
      ) : null}
      <path className="edge" d={d} />
      <path
        className="inner"
        d={d}
        transform="translate(50 64) scale(0.9 0.93) translate(-50 -64)"
      />
    </svg>
  );
}

const LEVELS = ['beginner', 'intermediate', 'advanced'];
const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** The level as one to three dots, named for screen readers. */
export function LevelDots({ level }: { level: string }) {
  const n = LEVELS.indexOf(level) + 1 || 1;
  return (
    <span className="window-dots" role="img" aria-label={capital(level)}>
      {[1, 2, 3].map((i) => (
        <i key={i} className={i <= n ? 'on' : undefined} />
      ))}
    </span>
  );
}

/** One pattern of the library as a window. */
export function Window({
  id,
  preview,
  designs = 1,
  arch = archOf(preview.region, preview.style),
  place,
  hidden = false,
  picture,
}: {
  id: string;
  preview: Preview;
  /** How many designs the card stands for (its variations and places). */
  designs?: number;
  /** The arch, when not the pattern's own (the review page). */
  arch?: ArchKind;
  /** The place's short name, under the title. */
  place?: string;
  /** Hidden from the live site (the dev server lists it, marked). */
  hidden?: boolean;
  /** Drawn in place of the prepared picture (a tutorial given as data). */
  picture?: ReactNode;
}) {
  const title = preview.short ?? preview.title;
  const base = import.meta.env.BASE_URL;
  return (
    <li className="window" data-arch={arch}>
      <div
        className="window-pic"
        style={{ clipPath: `url(#${clipId(arch)})` }}
        title={ARCH_NAMES[arch]}
      >
        {/* The picture is for the mouse and the finger; the keyboard and
            screen readers get the same link as View, the first button. */}
        <a
          className="window-link"
          href={`#/${id}`}
          tabIndex={-1}
          aria-hidden="true"
        >
          {picture ??
            (preview.thumbnail ? (
              <img
                src={base + preview.thumbnail}
                srcSet={
                  preview.thumbnailSmall
                    ? `${base + preview.thumbnailSmall} 320w, ${base + preview.thumbnail} 480w`
                    : undefined
                }
                sizes="auto, (max-width: 600px) 180px, 300px"
                alt=""
                loading="lazy"
                width="360"
                height="450"
              />
            ) : null)}
        </a>
        <WindowFrame kind={arch} />
        {designs > 1 ? (
          <span className="window-badge">{designs} designs</span>
        ) : null}
        {hidden ? (
          <span
            className="window-hidden"
            title="Hidden from the library on the live site; only the dev server lists it."
          >
            Hidden
          </span>
        ) : null}
        <div className="window-actions">
          <a
            className="view"
            href={`#/${id}`}
            aria-label={`View ${title}: the finished wall`}
          >
            <ActionIcon action="result" />
            View
          </a>
          <a className="watch" href={`#/${id}/watch`}>
            <ActionIcon action="watch" />
            Watch it drawn
          </a>
          <a className="draw" href={`#/${id}/draw`}>
            <ActionIcon action="draw" />
            Draw along
          </a>
        </div>
      </div>
      <div className="window-head">
        <h3 title={title === preview.title ? undefined : preview.title}>
          {title}
        </h3>
        {/* On touch screens the two other actions, as icons. */}
        <span className="window-touch">
          <a
            className="watch"
            href={`#/${id}/watch`}
            aria-label={`${title}: watch it drawn`}
          >
            <ActionIcon action="watch" />
          </a>
          <a
            className="draw"
            href={`#/${id}/draw`}
            aria-label={`${title}: draw along`}
          >
            <ActionIcon action="draw" />
          </a>
        </span>
      </div>
      <p className="window-meta">
        <span>{preview.fold}-fold</span>
        <LevelDots level={preview.level} />
        <span>{preview.steps} steps</span>
        {place ? <span className="window-place">{place}</span> : null}
      </p>
      {preview.verification?.status === 'unverified' ? (
        <p className="window-note" title={preview.verification.note}>
          Historical match unverified
        </p>
      ) : null}
    </li>
  );
}
