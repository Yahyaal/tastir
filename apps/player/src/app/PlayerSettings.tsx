import { useEffect, useId, useRef, type CSSProperties } from 'react';
import type { InkMode } from './model';
import { HideToggle as DevHideToggle } from './HideToggle';
import './playerSettings.css';
const HideToggle = import.meta.env.DEV ? DevHideToggle : undefined;

function Choices<T extends string | number>({
  label,
  value,
  options,
  onChange,
  kind,
}: {
  kind?: 'speed' | 'ink';
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  const name = useId();
  return (
    <fieldset className={`settings-choice settings-choice--${kind ?? 'plain'}`}>
      <legend>{label}</legend>
      <div
        className="settings-segments"
        style={
          {
            '--selected-index': Math.max(
              0,
              options.findIndex((o) => o.value === value),
            ),
          } as CSSProperties
        }
      >
        {options.map((option) => (
          <label key={option.value}>
            <input
              type="radio"
              aria-label={option.label}
              name={name}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span className="settings-option">
              {kind === 'ink' && <InkEmblem mode={String(option.value)} />}
              <span className="settings-option-copy">
                <span className="settings-option-title">{option.label}</span>
              </span>
              {kind === 'ink' && (
                <span className="settings-choice-check" aria-hidden="true">
                  ✓
                </span>
              )}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
function Switch({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  const hintId = useId();
  return (
    <label className="settings-switch" data-state={checked ? 'on' : 'off'}>
      <span className="settings-switch-copy">
        <strong>{label}</strong>
        <small id={hintId}>{hint}</small>
      </span>
      <span className="settings-switch-control">
        <input
          type="checkbox"
          role="switch"
          aria-label={label}
          aria-describedby={hintId}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="settings-switch-track" aria-hidden="true" />
      </span>
    </label>
  );
}
function InkEmblem({ mode }: { mode: string }) {
  const star =
    'M20 5L24.4 9.4L30.6 9.4L30.6 15.6L35 20L30.6 24.4L30.6 30.6L24.4 30.6L20 35L15.6 30.6L9.4 30.6L9.4 24.4L5 20L9.4 15.6L9.4 9.4L15.6 9.4Z';
  return (
    <svg
      className={`settings-ink-emblem emblem-${mode}`}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <path className="emblem-guide" d="M5 5L35 35M35 5L5 35M5 20H35M20 5V35" />
      <path className="emblem-star" d={star} />
      {mode === 'guide' && (
        <g className="emblem-points">
          <circle cx="20" cy="5" r="1.7" />
          <circle cx="35" cy="20" r="1.7" />
          <circle cx="20" cy="35" r="1.7" />
          <circle cx="5" cy="20" r="1.7" />
        </g>
      )}
      {mode === 'asYouGo' && (
        <path
          className="emblem-progress"
          d="M20 5L24.4 9.4H30.6V15.6L35 20L30.6 24.4V30.6H24.4L20 35"
        />
      )}
    </svg>
  );
}
export function PlayerSettings({
  speed,
  setSpeed,
  inkMode,
  setInkMode,
  reduced,
  setReduced,
  showNames,
  setShowNames,
  showHelpers,
  setShowHelpers,
  hideId,
}: {
  speed: number;
  setSpeed: (speed: number) => void;
  inkMode: InkMode;
  setInkMode: (mode: InkMode) => void;
  reduced: boolean;
  setReduced: (value: boolean) => void;
  showNames: boolean;
  setShowNames: (value: boolean) => void;
  showHelpers: boolean;
  setShowHelpers: (value: boolean) => void;
  hideId?: string;
}) {
  const menu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (
        menu.current?.open &&
        event.target instanceof Node &&
        !menu.current.contains(event.target)
      )
        menu.current.open = false;
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && menu.current?.open) {
        event.preventDefault();
        menu.current.open = false;
        menu.current.querySelector('summary')?.focus();
      }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, []);
  return (
    <details className="view-menu player-settings" ref={menu}>
      <summary aria-label="Settings" title="Settings">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M4 7h16M4 17h16" />
          <circle cx="9" cy="7" r="3" fill="var(--theme-bg-surface)" />
          <circle cx="15" cy="17" r="3" fill="var(--theme-bg-surface)" />
        </svg>
      </summary>
      <div className="controls settings-panel">
        <div className="settings-panel-heading">
          <div className="settings-heading-copy">
            <h2>Settings</h2>
          </div>
          <button
            className="settings-close"
            type="button"
            aria-label="Close settings"
            onClick={() => {
              if (menu.current) menu.current.open = false;
              menu.current?.querySelector('summary')?.focus();
            }}
          >
            ×
          </button>
        </div>
        <Choices
          kind="speed"
          label="Speed"
          value={speed}
          onChange={setSpeed}
          options={[
            { value: 0.5, label: '½×' },
            { value: 1, label: '1×' },
            { value: 2, label: '2×' },
          ]}
        />
        <Choices<InkMode>
          kind="ink"
          label="Ink"
          value={inkMode}
          onChange={setInkMode}
          options={[
            {
              value: 'guide',
              label: 'Guide first',
            },
            {
              value: 'end',
              label: 'At the end',
            },
            {
              value: 'asYouGo',
              label: 'As you go',
            },
          ]}
        />
        <p className="settings-mode-hint" aria-live="polite">
          {inkMode === 'guide'
            ? 'A faint guide on the last drawing step. The full inking reveal follows.'
            : inkMode === 'end'
              ? 'Keep the pattern hidden until the final inking reveal.'
              : 'Ink each part as its construction becomes ready.'}
        </p>
        <section className="settings-switches" aria-label="Drawing aids">
          <h3>Drawing aids</h3>
          <Switch
            label="Reduce motion"
            hint="Show each step without animation"
            checked={reduced}
            onChange={setReduced}
          />
          <Switch
            label="Show names"
            hint="Label the construction points"
            checked={showNames}
            onChange={setShowNames}
          />
          <Switch
            label="Show helper lines"
            hint="Include the compass and measuring guides"
            checked={showHelpers}
            onChange={setShowHelpers}
          />
        </section>
        <p className="settings-shortcuts">
          <span>
            <kbd>←</kbd> <kbd>→</kbd> step
          </span>
          <span>
            <kbd>Space</kbd> play / pause
          </span>
        </p>
        {HideToggle && hideId ? (
          <div className="settings-owner">
            <span>Library visibility</span>
            <HideToggle id={hideId} />
          </div>
        ) : null}
      </div>
    </details>
  );
}
