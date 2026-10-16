import { useEffect, useRef, useState } from 'react';
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
  useEffect(() => {
    if (active) {
      setOpened(true);
      setVisited(true);
    }
  }, [active]);
  const mounted = visited || active || opened;
  const visible = active || opened;
  return (
    <>
      <ScreenPointer active={!active && visible} />
      {!active ? (
        <button
          ref={launcher}
          className="agent-launch"
          aria-controls="tastir-assistant"
          type="button"
          aria-expanded={opened}
          onClick={() => {
            setOpened(!opened);
            setVisited(true);
          }}
        >
          {opened ? 'Close drawing assistant' : 'Open drawing assistant'}
        </button>
      ) : null}
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
          <AgentLab route={route} open={visible} library={library} />
        </div>
      ) : null}
    </>
  );
}
