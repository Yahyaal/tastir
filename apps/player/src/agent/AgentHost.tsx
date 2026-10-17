import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AssistantIcon } from './AssistantIcon';
import type { Entry } from '../app/library';
import { AgentLab } from './AgentLab';
import { ScreenPointer } from './ScreenPointer';

/** Keep the drawing and its history alive while the ordinary app changes routes. */
export function AgentHost({
  route,
  library,
}: {
  route: string;
  library: readonly Entry[];
}) {
  const [opened, setOpened] = useState(route === 'agent');
  const [visited, setVisited] = useState(route === 'agent');
  const active = route === 'agent';
  const launcher = useRef<HTMLButtonElement>(null);
  const [toolbar, setToolbar] = useState<Element | null>(null);
  useLayoutEffect(() => {
    const find = () =>
      setToolbar(
        [
          '.masthead-actions',
          '.topbar',
          '.upcoming-topbar',
          '.review-head',
          'header',
        ]
          .map((selector) =>
            document.querySelector(`[data-tastir-page] ${selector}`),
          )
          .find((node) => node !== null) ?? null,
      );
    find();
    const observer = new MutationObserver(find);
    observer.observe(
      document.querySelector('[data-tastir-page]') ?? document.body,
      { childList: true, subtree: true },
    );
    return () => observer.disconnect();
  }, [route]);
  useEffect(() => {
    if (active) {
      setOpened(true);
      setVisited(true);
    }
  }, [active]);
  const mounted = visited || active || opened;
  const visible = active || opened;
  useEffect(() => {
    if (!visible || active) return;
    const frame = requestAnimationFrame(() =>
      document
        .querySelector<HTMLTextAreaElement>('#tastir-assistant textarea')
        ?.focus({ preventScroll: true }),
    );
    return () => cancelAnimationFrame(frame);
  }, [visible, active]);
  return (
    <>
      <ScreenPointer active={!active && visible} />
      {!active && toolbar
        ? createPortal(
            <button
              ref={launcher}
              className="agent-launch"
              aria-controls="tastir-assistant"
              type="button"
              aria-expanded={opened}
              aria-label={
                opened ? 'Close drawing assistant' : 'Open drawing assistant'
              }
              title={opened ? 'Close assistant' : 'Open assistant'}
              onClick={() => {
                setOpened(!opened);
                setVisited(true);
              }}
            >
              <AssistantIcon />
            </button>,
            toolbar,
          )
        : null}
      {mounted ? (
        <div
          id="tastir-assistant"
          onKeyDown={(e) => {
            if (!active && e.key === 'Escape') {
              e.preventDefault();
              e.stopPropagation();
              setOpened(false);
              launcher.current?.focus();
            }
          }}
          hidden={!visible}
          className={active ? 'agent-host' : 'agent-host agent-dock'}
        >
          <AgentLab
            route={route}
            open={visible}
            library={library}
            onClose={() => {
              setOpened(false);
              launcher.current?.focus();
            }}
          />
        </div>
      ) : null}
    </>
  );
}
