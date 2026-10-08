import type { Cell, Segment, Vec } from '@tastir/engine';
import { useEffect, useRef, useState } from 'react';
import { viewBox, width, type Rect } from '../app/camera';
import type { Model } from '../app/model';
import { dropAt, ghostsOf, type Copy } from './repeat';

const pts = (vs: readonly Vec[], d: Vec = { x: 0, y: 0 }) =>
  vs.map((v) => `${v.x + d.x},${v.y + d.y}`).join(' ');

/**
 * The learner's own wall: their inked tile, the copies they have placed,
 * and faint ghosts at every free edge-to-edge place next to a copy. A
 * click on a ghost places a copy there, sliding in from its neighbour; a
 * copy can be dragged anywhere, snapping to a place on the tile's lattice
 * when it comes near one, and a copy dragged off the board goes. With
 * `pieces`, the wall's pieces are filled with their colours.
 */
export function RepeatBoard({
  view,
  svgRef,
  wasDrag,
  cell,
  ink,
  copies,
  arrived,
  erasing,
  pieces,
  onPlace,
  onMove,
  onRemove,
  onPick,
}: {
  view: Rect;
  svgRef: React.RefObject<SVGSVGElement | null>;
  wasDrag: () => boolean;
  cell: Cell;
  /** The learner's inked tile. */
  ink: readonly Segment[];
  copies: readonly Copy[];
  /** The copy that just arrived, and where it slid in from. */
  arrived?: { index: number; from: Vec };
  erasing: boolean;
  /** At the colour stage: the wall's pieces and their fills. */
  pieces?: readonly { polygon: readonly Vec[]; fill: string; type: number }[];
  onPlace: (at: Vec, from: Vec) => void;
  onMove: (index: number, at: Vec) => void;
  onRemove: (index: number) => void;
  onPick?: (type: number) => void;
}) {
  const unit = width(view) / 400;
  const ghosts = pieces ? [] : ghostsOf(cell, copies);
  // A copy being dragged, and where it is now.
  const [drag, setDrag] = useState<{ index: number; at: Vec }>();
  const dragRef = useRef(drag);
  dragRef.current = drag;
  const copiesRef = useRef(copies);
  copiesRef.current = copies;
  // The handlers below are bound once; they call the latest callbacks.
  const moveRef = useRef(onMove);
  moveRef.current = onMove;
  const removeRef = useRef(onRemove);
  removeRef.current = onRemove;
  const frameAt = (svg: SVGSVGElement, x: number, y: number): Vec => {
    const m = svg.getScreenCTM();
    if (!m) return { x: 0, y: 0 };
    const p = new DOMPoint(x, y).matrixTransform(m.inverse());
    return { x: p.x, y: -p.y };
  };

  // Dragging a copy: caught before the camera's own drag, so the wall
  // stays still while the copy moves.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || pieces) return;
    const down = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest?.('[data-copy]');
      if (!el || erasing) return;
      const index = Number(el.getAttribute('data-copy'));
      const copy = copiesRef.current[index];
      if (!copy) return;
      e.stopPropagation();
      const start = frameAt(svg, e.clientX, e.clientY);
      let moved = false;
      const move = (ev: PointerEvent) => {
        const p = frameAt(svg, ev.clientX, ev.clientY);
        const at = {
          x: copy.at.x + p.x - start.x,
          y: copy.at.y + p.y - start.y,
        };
        if (!moved && Math.hypot(p.x - start.x, p.y - start.y) < 4 * unit)
          return;
        moved = true;
        setDrag({ index, at });
      };
      const up = (ev: PointerEvent) => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        const now = dragRef.current;
        setDrag(undefined);
        if (!moved || !now) return;
        const r = svg.getBoundingClientRect();
        const off =
          ev.clientX < r.left ||
          ev.clientX > r.right ||
          ev.clientY < r.top ||
          ev.clientY > r.bottom;
        if (off) return removeRef.current(index);
        moveRef.current(index, snapTo(now.at, index));
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    };
    svg.addEventListener('pointerdown', down, { capture: true });
    return () =>
      svg.removeEventListener('pointerdown', down, { capture: true });
    // The handlers read the latest copies through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [svgRef, pieces, erasing, unit]);

  const snapTo = (at: Vec, index: number): Vec =>
    dropAt(cell, copiesRef.current, index, at);

  const placed = [
    { at: { x: 0, y: 0 }, index: -1 },
    ...copies.map((c, i) => ({
      at: drag?.index === i ? drag.at : c.at,
      index: i,
    })),
  ];
  return (
    <svg
      ref={svgRef}
      className="drawing editor-drawing repeat-board"
      viewBox={viewBox(view)}
      role="img"
      aria-label="Your wall"
    >
      <g transform="scale(1,-1)" style={{ strokeWidth: unit * 1.5 }}>
        {pieces?.map((p, i) => (
          <polygon
            key={`p${i}`}
            className="wall-piece"
            data-type={p.type}
            points={pts(p.polygon)}
            fill={p.fill}
            onClick={() => {
              if (!wasDrag() && p.type >= 0) onPick?.(p.type);
            }}
          />
        ))}
        {ghosts.map((g, i) => (
          <polygon
            key={`g${i}`}
            className="ghost"
            data-ghost={i}
            points={pts(cell.corners, g.at)}
            onClick={() => {
              if (!wasDrag()) onPlace(g.at, g.from);
            }}
          />
        ))}
        {placed.map(({ at, index }) => {
          const came =
            arrived && arrived.index === index
              ? { x: arrived.from.x - at.x, y: arrived.from.y - at.y }
              : undefined;
          return (
            <g
              key={`c${index}`}
              className={came ? 'copy arriving' : 'copy'}
              style={
                {
                  transform: `translate(${at.x}px, ${at.y}px)`,
                  ...(came
                    ? {
                        '--from': `translate(${at.x + came.x}px, ${at.y + came.y}px)`,
                        '--to': `translate(${at.x}px, ${at.y}px)`,
                      }
                    : {}),
                } as React.CSSProperties
              }
            >
              <polygon
                className={index < 0 ? 'copy-area first' : 'copy-area'}
                {...(index >= 0 && !pieces ? { 'data-copy': index } : {})}
                points={pts(cell.corners)}
                onClick={() => {
                  if (erasing && index >= 0 && !wasDrag()) onRemove(index);
                }}
              />
              {ink.map((s, k) => (
                <line
                  key={k}
                  className="wall-ink"
                  x1={s.a.x}
                  y1={s.a.y}
                  x2={s.b.x}
                  y2={s.b.y}
                />
              ))}
            </g>
          );
        })}
      </g>
    </svg>
  );
}

/**
 * The tutorial's own wall, to aim for: its inked tile repeated edge to
 * edge, in the same view as the learner's wall.
 */
export function TargetWall({
  model,
  view,
  svgRef,
}: {
  model: Model;
  view: Rect;
  svgRef: React.RefObject<SVGSVGElement | null>;
}) {
  const { cell, ink } = model.pattern;
  const unit = width(view) / 400;
  const shifts: Vec[] = [];
  for (let i = -4; i <= 4; i++)
    for (let j = -4; j <= 4; j++)
      shifts.push({
        x: cell.u.x * i + cell.v.x * j,
        y: cell.u.y * i + cell.v.y * j,
      });
  return (
    <svg
      ref={svgRef}
      className="drawing target-wall"
      viewBox={viewBox(view)}
      role="img"
      aria-label="The pattern’s wall"
    >
      <g transform="scale(1,-1)" style={{ strokeWidth: unit * 1.5 }}>
        {shifts.map((d, k) => (
          <g key={k} transform={`translate(${d.x},${d.y})`}>
            {ink.map((s, i) => (
              <line
                key={i}
                className="wall-ink target"
                x1={s.segment.a.x}
                y1={s.segment.a.y}
                x2={s.segment.b.x}
                y2={s.segment.b.y}
              />
            ))}
          </g>
        ))}
        <polygon className="tile-outline" points={pts(cell.corners)} />
      </g>
    </svg>
  );
}
