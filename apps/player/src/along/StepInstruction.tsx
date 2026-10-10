import { useEffect, useRef, useState } from 'react';

/** Keep long instructions readable without moving the drawing boards. */
export function StepInstruction({
  head,
  text,
}: {
  head: string;
  text: string;
}) {
  const paragraph = useRef<HTMLParagraphElement>(null);
  const [overflow, setOverflow] = useState(false);
  const [atEnd, setAtEnd] = useState(false);
  useEffect(() => {
    const el = paragraph.current;
    if (!el) return;
    const measure = () => {
      setOverflow(el.scrollHeight > el.clientHeight + 1);
      setAtEnd(el.scrollTop + el.clientHeight >= el.scrollHeight - 1);
    };
    el.scrollTop = 0;
    measure();
    const observer =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(measure);
    observer?.observe(el);
    window.addEventListener('resize', measure);
    el.addEventListener('scroll', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
      el.removeEventListener('scroll', measure);
    };
  }, [text]);
  return (
    <div className="along-instruction">
      <h2>
        {head}
        {overflow && (
          <span className="instruction-scroll-hint">
            {atEnd ? 'Scroll up ↑' : 'Scroll for more ↓'}
          </span>
        )}
      </h2>
      <p
        ref={paragraph}
        className="instruction"
        tabIndex={overflow ? 0 : undefined}
        aria-label={
          overflow ? 'Step instructions, scroll to read more' : undefined
        }
      >
        {text}
      </p>
    </div>
  );
}
